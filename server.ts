import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { BLOG_ARTICLES } from "./src/blogData";
import { DEFAULT_SITE_CONTENT } from "./src/siteContent";

function sanitizeAndDeduplicateSlug(requestedSlug: string, title: string, existingSlugs: Set<string>): string {
  // 1. Sanitize the slug (convert to lowercase, replace invalid characters with hyphens)
  let slug = (requestedSlug || "")
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // If the slug is empty (e.g. AI returned Japanese only or was blank), fallback to fallback-column
  if (!slug) {
    slug = "tobitashinchi-column";
  }

  // 2. Resolve duplicates
  let uniqueSlug = slug;
  let counter = 1;
  while (existingSlugs.has(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

async function startServer() {
  const app = express();

  // Support both development (server.ts) and compiled production (dist/server.cjs)
  // Get the directory of the current script safely
  let currentDir = "";
  try {
    if (typeof __dirname !== "undefined") {
      currentDir = __dirname;
    }
  } catch (e) {}

  if (!currentDir) {
    try {
      const { fileURLToPath } = await import("url");
      currentDir = path.dirname(fileURLToPath(import.meta.url));
    } catch (e) {
      if (process.argv[1]) {
        try {
          currentDir = path.dirname(fs.realpathSync(process.argv[1]));
        } catch (err) {
          currentDir = process.cwd();
        }
      } else {
        currentDir = process.cwd();
      }
    }
  }

  // Determination of environment mode
  // Running compiled bundle (dist/server.cjs) or NODE_ENV=production means production (Cloud Run)
  // Running directly with tsx server.ts means development environment
  const isInDistFolder = path.basename(currentDir) === "dist" || currentDir.endsWith("/dist") || currentDir.endsWith("\\dist");
  const isProd = process.env.NODE_ENV === "production" || isInDistFolder;

  // Dev server and production container must bind to port 3000 for the platform proxy
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // Set permissive CORS and anti-cache headers for dev preview
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoints for Cloud Run / monitoring
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/_health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/healthz", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/_ah/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // projectRootDir is the parent of currentDir if compiled in dist, otherwise currentDir
  const projectRootDir = isInDistFolder ? path.dirname(currentDir) : currentDir;
  const distPath = fs.existsSync(path.join(projectRootDir, "dist"))
    ? path.join(projectRootDir, "dist")
    : fs.existsSync(path.join(process.cwd(), "dist"))
    ? path.join(process.cwd(), "dist")
    : isInDistFolder
    ? currentDir
    : path.join(projectRootDir, "dist");

  // Serve static assets with highest priority in all environments
  const possibleImageDirs = [
    path.join(distPath, "images"),
    path.join(distPath, "assets", "images"),
    path.join(projectRootDir, "public", "images"),
    path.join(projectRootDir, "public", "assets", "images"),
    path.join(projectRootDir, "src", "assets", "images"),
    path.join(projectRootDir, "public"),
    path.join(projectRootDir, "public", "assets"),
    path.join(projectRootDir, "src", "assets"),
    path.join(distPath, "assets"),
    distPath
  ];

  // Static image routes with cache-control and safety checks
  const serveImage = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // In dev mode, if Vite requests a module import (?import or JS request), delegate to Vite
    if (req.query.import !== undefined || req.headers.accept?.includes('text/javascript')) {
      return next();
    }
    const cleanPath = req.path.split('?')[0];
    const isImageFile = /\.(jpg|jpeg|png|webp|svg|gif|ico|avif)$/i.test(cleanPath);
    if (!isImageFile) {
      return next();
    }
    const filename = path.basename(cleanPath);
    if (!filename || filename === '.' || filename === '/') {
      return next();
    }
    for (const dir of possibleImageDirs) {
      const candidate = path.join(dir, filename);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        return res.sendFile(candidate);
      }
    }
    return next();
  };

  // Mount image handler across all common asset paths and any image extensions
  app.use("/images", serveImage);
  app.use("/assets/images", serveImage);
  app.use("/assets", serveImage);
  app.use("/src/assets/images", serveImage);
  app.use("/src/assets", serveImage);
  app.use(serveImage);

  const publicDir = path.join(projectRootDir, "public");
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  const DATA_DIR = path.join(projectRootDir, "data");

  // Automatically sync local changes to GitHub
  const syncToGitHub = () => {
    const repoUrl = process.env.GITHUB_REPO_URL || "https://github.com/shinky0924-wq/tobitagirls.git";
    const username = process.env.GITHUB_USERNAME || "shinky0924-wq";
    const pat = process.env.GITHUB_PAT;

    if (!repoUrl || !pat) {
      console.log("[GitHub Sync] Skipped: Repo URL or Token not configured.");
      return;
    }

    // Format the authenticated URL
    const cleanUrl = repoUrl.replace("https://", "");
    const authUrl = `https://${username}:${pat}@${cleanUrl}`;

    console.log("[GitHub Sync] Starting automatic commit & push to GitHub...");

    const gitDir = path.join(projectRootDir, ".git");
    const hasGit = fs.existsSync(gitDir);

    let setupCmds = "";
    if (!hasGit) {
      setupCmds = `git init && git checkout -b main && git remote add origin "${authUrl}" && `;
    } else {
      setupCmds = `git remote set-url origin "${authUrl}" || git remote add origin "${authUrl}" && `;
    }

    const execOptions = { cwd: projectRootDir };
    const pushCmd = hasGit ? `git push origin main` : `git push -f -u origin main`;
    const gitCmds = `${setupCmds}git config user.name "${username}" && git config user.email "shinky0924@gmail.com" && git add data/blogArticles.json data/siteContent.json && git commit -m "Update site content and blog articles from CMS [auto-sync]" && ${pushCmd}`;

    exec(gitCmds, execOptions, (error: any, stdout: string, stderr: string) => {
      if (error) {
        console.error("[GitHub Sync] Failed to sync with GitHub:", error.message);
        console.error("[GitHub Sync] Stderr:", stderr);
      } else {
        console.log("[GitHub Sync] Successfully synced to GitHub! Output:", stdout);
      }
    });
  };

  // Direct ZIP file download handlers
  app.get("/tobita-girls-website-release.zip", (req, res) => {
    const filePath = path.join(projectRootDir, "tobita-girls-website-release.zip");
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=tobita-girls-website-release.zip");
      return res.sendFile(filePath);
    }
    const publicPath = path.join(projectRootDir, "public", "tobita-girls-website-release.zip");
    if (fs.existsSync(publicPath)) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=tobita-girls-website-release.zip");
      return res.sendFile(publicPath);
    }
    return res.status(404).send("File not found");
  });

  app.get("/tobita-girls-source-code.zip", (req, res) => {
    const filePath = path.join(projectRootDir, "tobita-girls-source-code.zip");
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=tobita-girls-source-code.zip");
      return res.sendFile(filePath);
    }
    const publicPath = path.join(projectRootDir, "public", "tobita-girls-source-code.zip");
    if (fs.existsSync(publicPath)) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=tobita-girls-source-code.zip");
      return res.sendFile(publicPath);
    }
    return res.status(404).send("File not found");
  });

  // Ensure data directory exists with multiple fallback options
  let targetDataDir = DATA_DIR;
  let isWritable = false;

  try {
    if (!fs.existsSync(targetDataDir)) {
      fs.mkdirSync(targetDataDir, { recursive: true });
    }
    // Test if we can write to it
    const testFile = path.join(targetDataDir, ".write-test");
    fs.writeFileSync(testFile, "test", "utf-8");
    fs.unlinkSync(testFile);
    isWritable = true;
    console.log(`Using writable data directory at: ${targetDataDir}`);
  } catch (e) {
    console.warn(`Cannot write to standard data directory ${targetDataDir}, trying /tmp fallback...`, e);
    try {
      targetDataDir = path.join("/tmp", "tobita-data");
      if (!fs.existsSync(targetDataDir)) {
        fs.mkdirSync(targetDataDir, { recursive: true });
      }
      const testFile = path.join(targetDataDir, ".write-test");
      fs.writeFileSync(testFile, "test", "utf-8");
      fs.unlinkSync(testFile);
      isWritable = true;
      console.log(`Using fallback writable data directory at: ${targetDataDir}`);
    } catch (err2) {
      console.error("Even /tmp is not writable! Using in-memory only mode.", err2);
    }
  }

  const ARTICLES_PATH = path.join(targetDataDir, "blogArticles.json");
  const SITE_CONTENT_PATH = path.join(targetDataDir, "siteContent.json");

  // In-memory data store cache to serve instantly and avoid file read issues
  let memoryArticles = [...BLOG_ARTICLES];
  let memorySiteContent = { ...DEFAULT_SITE_CONTENT };

  // Try to load initial data from filesystem if writable and exists
  if (isWritable) {
    try {
      if (fs.existsSync(ARTICLES_PATH)) {
        const data = fs.readFileSync(ARTICLES_PATH, "utf-8");
        const loadedArticles = JSON.parse(data);
        
        // Auto-merge new default articles from BLOG_ARTICLES & sync image paths
        const loadedIds = new Set(loadedArticles.map((a: any) => a.id));
        let hasNewDefault = false;
        let hasImageUpdates = false;

        const mergedArticles = loadedArticles.map((loadedArt: any) => {
          const defaultMatch = BLOG_ARTICLES.find((d: any) => d.id === loadedArt.id);
          if (defaultMatch) {
            let updated = { ...loadedArt };
            let changed = false;
            if (defaultMatch.eyeCatch !== loadedArt.eyeCatch) {
              updated.eyeCatch = defaultMatch.eyeCatch;
              changed = true;
            }
            if (defaultMatch.slug !== loadedArt.slug) {
              updated.slug = defaultMatch.slug;
              changed = true;
            }
            if (changed) {
              hasImageUpdates = true;
              return updated;
            }
          } else if (loadedArt.eyeCatch && (loadedArt.eyeCatch.startsWith('src/') || loadedArt.eyeCatch.startsWith('assets/'))) {
            loadedArt.eyeCatch = '/' + loadedArt.eyeCatch;
            hasImageUpdates = true;
          }
          return loadedArt;
        });

        for (const defaultArt of BLOG_ARTICLES) {
          if (!loadedIds.has(defaultArt.id)) {
            mergedArticles.push(defaultArt);
            hasNewDefault = true;
          }
        }

        if (hasNewDefault || hasImageUpdates) {
          mergedArticles.sort((a: any, b: any) => {
            const idA = parseInt(a.id, 10) || 0;
            const idB = parseInt(b.id, 10) || 0;
            return idA - idB;
          });
          fs.writeFileSync(ARTICLES_PATH, JSON.stringify(mergedArticles, null, 2), "utf-8");
          memoryArticles = mergedArticles;
          console.log("Successfully updated articles with correct images and slugs in server ARTICLES_PATH.");
        } else {
          memoryArticles = loadedArticles;
        }
      } else {
        fs.writeFileSync(ARTICLES_PATH, JSON.stringify(BLOG_ARTICLES, null, 2), "utf-8");
      }
    } catch (e) {
      console.error("Failed to load initial articles from file, using defaults:", e);
    }

    try {
      if (fs.existsSync(SITE_CONTENT_PATH)) {
        const data = fs.readFileSync(SITE_CONTENT_PATH, "utf-8");
        memorySiteContent = JSON.parse(data);
      } else {
        fs.writeFileSync(SITE_CONTENT_PATH, JSON.stringify(DEFAULT_SITE_CONTENT, null, 2), "utf-8");
      }
    } catch (e) {
      console.error("Failed to load initial site content from file, using defaults:", e);
    }
  }

  // Middleware to check admin password on write actions
  const ADMIN_ID = process.env.ADMIN_ID || "admin";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tobita2026";

  const checkAdminAuth = (req: any, res: any, next: any) => {
    const passwordHeader = req.headers["x-admin-password"] || req.headers["authorization"]?.toString().replace("Bearer ", "");
    const allowedPasswords = ["admin", "tobita", "tobita2026", ADMIN_PASSWORD];
    if (allowedPasswords.includes(passwordHeader)) {
      next();
    } else {
      console.warn("Unauthorized write attempt blocked");
      return res.status(401).json({ error: "Unauthorized: Invalid or missing administrator password" });
    }
  };

  // API: Login verification
  app.post("/api/cms/login", (req, res) => {
    const { username, password } = req.body;
    
    // Check credentials (allows fallback for default ones during tests/transitions)
    const isPasswordCorrect = password === ADMIN_PASSWORD || password === "admin" || password === "tobita" || password === "tobita2026";
    const isIdCorrect = username === ADMIN_ID || username === "admin" || !username; // if empty, allow default ID

    if (isIdCorrect && isPasswordCorrect) {
      return res.json({ success: true, token: password });
    } else {
      return res.status(401).json({ error: "IDまたはパスワードが正しくありません" });
    }
  });

  // API: AI Auto-Generate Blog Articles (Batch)
  app.post("/api/cms/generate-articles", checkAdminAuth, async (req, res) => {
    try {
      const { model, count, category, customTopic } = req.body;
      const numArticles = Math.min(Math.max(parseInt(count, 10) || 1, 1), 10);
      
      const requestedCategory = category || "all";
      const topicPrompt = customTopic ? `特別テーマ・要望:「${customTopic}」` : "テーマは自由（未経験者向け、給料システム、身バレ対策などからバランスよく選んでください）";

      const parsedArticles: any[] = [];

      if (model === "claude") {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return res.status(400).json({ error: "ClaudeのAPIキー(ANTHROPIC_API_KEY)が設定されていません。環境変数に設定するか、Geminiを使用してください。" });
        }

        for (let i = 0; i < numArticles; i++) {
          console.log(`[AI CMS] Generating article ${i + 1} of ${numArticles} via Claude...`);
          const singlePrompt = `あなたは飛田新地の女性向けサポート＆求人サイト「飛田ガールズ」のプロの編集者です。
求職中の20代女性（未経験者が多い）が抱く、不安や疑問（身バレ対策、安全面、給料システム、実際の仕事の流れ、体入（体験入店）、生活・働き方など）を優しく丁寧に解消し、一歩踏み出す安心感を与える極めて高品質なコラム記事を日本語で作成してください。

今回は、全リクエストのうち「${i + 1}番目」のコラム記事を1件だけ生成してください。
${requestedCategory !== "all" ? `カテゴリーは必ず「${requestedCategory}」にしてください。` : "カテゴリーは 'beginner', 'salary', 'security', 'lifestyle', 'onboarding' の中から適したものを1つ選択してください。"}
${topicPrompt}

記事は、以下のJSONスキーマに従った完全な1つのオブジェクトである必要があります。

記事のコンテンツ（content配列）は、見出し（h2, h3）、本文（p）、リスト（list）、よくある質問（qna）、LINE誘導（cta）のブロックを複数組み合わせた、読み応えのある構成（合計文字数1000文字〜1500文字程度）にしてください。

JSONスキーマ：
{
  "title": "読者の目を惹く魅力的なコラムタイトル（30〜50文字程度。例：【身バレ防止】飛田新地で親や友達にバレずに働くための4つの鉄則）",
  "slug": "記事のタイトルを簡潔に英訳・ローマ字にし、半角小文字の英数字とハイフンのみで構成したURLスラッグ。末尾にランダムな文字列や日付は含めず、タイトルに即した意味のある英単語（3〜5単語程度）にしてください。（例：タイトルが「【身バレ防止】親や友達にバレずに働く4つの鉄則」なら「tobitashinchi-privacy-rules」や「work-without-revealing-identity」など）",
  "category": "'beginner' | 'salary' | 'security' | 'lifestyle' | 'onboarding' のいずれか1つ",
  "categoryLabel": "カテゴリーに応じた和名（例：未経験者向け、給与・待遇、安心・身バレ対策、生活・働き方、面接・お仕事の流れ）",
  "summary": "一覧ページで表示される、記事の概要を2文程度で魅力的にまとめた紹介文",
  "author": {
    "name": "さくら または ひまり または ゆい などの女性サポートスタッフ名、またはマネージャー木村",
    "role": "女性サポートスタッフ（歴8年） または 採用担当マネージャー などの役職",
    "avatar": "👩‍💼 または 👩‍💻 または 👩"
  },
  "tags": ["関連するタグ名1", "タグ2", "タグ3"],
  "content": [
    {
      "type": "p",
      "text": "導入段落。読者の不安に共感し、本記事を読めば解決することを伝えます。"
    }
  ]
}`;

          const fetchResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json"
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 4000,
              system: "You are a professional blog writer. Output strictly valid JSON conforming to the requested schema. Do not include any conversational filler.",
              messages: [
                {
                  role: "user",
                  content: `${singlePrompt}\n\n必ず、マークダウンのバッククォーツ記法( \`\`\`json と \`\`\` )で囲んだJSONを1つだけ出力してください。余計な前置きや説明は一切不要です。`
                }
              ]
            })
          });

          if (!fetchResponse.ok) {
            const errText = await fetchResponse.text();
            throw new Error(`Claude API returned status ${fetchResponse.status}: ${errText}`);
          }

          const claudeResult: any = await fetchResponse.json();
          const fullText = claudeResult.content?.[0]?.text || "";
          const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/) || fullText.match(/\[\s*\{[\s\S]*\}\s*\]/) || fullText.match(/\{\s*[\s\S]*\}/);
          const blockText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : fullText;
          try {
            const articleObj = JSON.parse(blockText.trim());
            if (Array.isArray(articleObj)) {
              parsedArticles.push(...articleObj);
            } else if (articleObj && typeof articleObj === "object") {
              parsedArticles.push(articleObj);
            }
          } catch (parseErr) {
            console.error(`Failed to parse Claude article JSON for index ${i}:`, parseErr);
          }
        }
      } else {
        // Default to Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ error: "Gemini APIキー(GEMINI_API_KEY)がサーバーに設定されていません。" });
        }

        const { GoogleGenAI, Type } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        for (let i = 0; i < numArticles; i++) {
          console.log(`[AI CMS] Generating article ${i + 1} of ${numArticles} via Gemini...`);
          
          const singlePrompt = `あなたは飛田新地の女性向けサポート＆求人サイト「飛田ガールズ」のプロの編集者です。
求職中の20代女性（未経験者が多い）が抱く、不安や疑問（身バレ対策、安全面、給料システム、実際の仕事の流れ、体入（体験入店）、生活・働き方など）を優しく丁寧に解消し、一歩踏み出す安心感を与える極めて高品質なコラム記事を日本語で作成してください。

今回は、全リクエストのうち「${i + 1}番目」のコラム記事を1件だけ生成してください。
${requestedCategory !== "all" ? `カテゴリーは必ず「${requestedCategory}」にしてください。` : "カテゴリーは 'beginner', 'salary', 'security', 'lifestyle', 'onboarding' の中から適したものを1つ選択してください。"}
${topicPrompt}

記事は、以下のJSONスキーマに従った完全な1つのオブジェクトである必要があります。

記事のコンテンツ（content配列）は、見出し（h2, h3）、本文（p）、リスト（list）、よくある質問（qna）、LINE誘導（cta）のブロックを複数組み合わせた、読み応えのある構成（合計文字数1000文字〜1500文字程度）にしてください。

JSONスキーマ：
{
  "title": "読者の目を惹く魅力的なコラムタイトル（30〜50文字程度。例：【身バレ防止】飛田新地で親や友達にバレずに働くための4つの鉄則）",
  "slug": "記事のタイトルを簡潔に英訳・ローマ字にし、半角小文字の英数字とハイフンのみで構成したURLスラッグ。末尾にランダムな文字列や日付は含めず、タイトルに即した意味のある英単語（3〜5単語程度）にしてください。（例：タイトルが「【身バレ防止】親や友達にバレずに働く4つの鉄則」なら「tobitashinchi-privacy-rules」や「work-without-revealing-identity」など）",
  "category": "'beginner' | 'salary' | 'security' | 'lifestyle' | 'onboarding' のいずれか1つ",
  "categoryLabel": "カテゴリーに応じた和名（例：未経験者向け、給与・待遇、安心・身バレ対策、生活・働き方、面接・お仕事の流れ）",
  "summary": "一覧ページで表示される、記事の概要を2文程度で魅力的にまとめた紹介文",
  "author": {
    "name": "さくら または ひまり または ゆい などの女性サポートスタッフ名、またはマネージャー木村",
    "role": "女性サポートスタッフ（歴8年） または 採用担当マネージャー などの役職",
    "avatar": "👩‍💼 または 👩‍💻 または 👩"
  },
  "tags": ["関連するタグ名1", "タグ2", "タグ3"],
  "content": [
    {
      "type": "p",
      "text": "導入段落。読者の不安に共感し、本記事を読めば解決することを伝えます。"
    },
    {
      "type": "h2",
      "text": "中見出しのタイトル"
    },
    {
      "type": "p",
      "text": "詳細な解説。安心できるトーンで具体的に説明します。"
    },
    {
      "type": "list",
      "items": [
        "リスト項目1",
        "リスト項目2",
        "リスト項目3"
      ]
    },
    {
      "type": "h3",
      "text": "小見出しのタイトル"
    },
    {
      "type": "p",
      "text": "より細分化した情報や豆知識。"
    },
    {
      "type": "qna",
      "question": "よくある質問の問い？",
      "answer": "丁寧で安心感に満ちた回答。"
    },
    {
      "type": "cta"
    }
  ]
}

注意点：
1. 違法な行為や危険な行為を推奨する内容は避け、安心・安全・健全なサポート環境であることを一貫して強調してください。
2. 日本の女の子が読んで自然で、温かみがあり、信頼できる言葉遣い（〜です、〜ます調）にしてください。
3. リスト(list)やQ&A(qna)ブロックを効果的に使い、視覚的に読みやすくしてください。
4. LINE誘導(cta)ブロックは、記事の中間か最後付近に1つ以上配置してください。ctaブロックは 'type': 'cta' のみで、'text' や 'items' などのキーは不要です。`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${singlePrompt}\n\n指定されたJSONスキーマに完全に従って日本語で1記事生成してください。`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  slug: { type: Type.STRING },
                  category: { type: Type.STRING },
                  categoryLabel: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  author: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      role: { type: Type.STRING },
                      avatar: { type: Type.STRING }
                    },
                    required: ["name", "role", "avatar"]
                  },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  content: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING },
                        text: { type: Type.STRING },
                        items: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        },
                        question: { type: Type.STRING },
                        answer: { type: Type.STRING }
                      },
                      required: ["type"]
                    }
                  }
                },
                required: ["title", "slug", "category", "categoryLabel", "summary", "author", "tags", "content"]
              }
            }
          });

          const generatedJsonText = response.text || "";
          try {
            const articleObj = JSON.parse(generatedJsonText.trim());
            if (Array.isArray(articleObj)) {
              parsedArticles.push(...articleObj);
            } else if (articleObj && typeof articleObj === "object") {
              parsedArticles.push(articleObj);
            }
          } catch (parseErr) {
            console.error(`Failed to parse Gemini article JSON for index ${i}:`, parseErr);
          }
        }
      }

      if (parsedArticles.length === 0) {
        throw new Error("コラム記事の自動生成またはJSON解析に失敗しました。1件も有効な記事が取得できませんでした。");
      }

      // Premium Illustration paths we found in /src/assets/images
      const premiumIllustrations = [
        "/src/assets/images/col_age_looks_1783677859202.jpg",
        "/src/assets/images/col_aroma_diffuser_1785381010_1785380691227.jpg",
        "/src/assets/images/col_bank_envelope_1785381004_1785380605532.jpg",
        "/src/assets/images/col_beauty_skincare_1785380345912.jpg",
        "/src/assets/images/col_beginner_guide_1783677791058.jpg",
        "/src/assets/images/col_cast_holiday_1783677895722.jpg",
        "/src/assets/images/col_cherry_bloom_1783883726145.jpg",
        "/src/assets/images/col_confidence_mirror_1785380357158.jpg",
        "/src/assets/images/col_cozy_blanket_1785381375.jpg",
        "/src/assets/images/col_cozy_room_93_1785507643387.jpg",
        "/src/assets/images/col_daily_cash_53_1785495791484.jpg",
        "/src/assets/images/col_daily_routine_51_1785495767020.jpg",
        "/src/assets/images/col_daytime_shift_38_1785507316876.jpg",
        "/src/assets/images/col_digital_calendar_1785380297293.jpg",
        "/src/assets/images/col_discreet_commute_48_1785495730427.jpg",
        "/src/assets/images/col_entrepreneur_girl_35_1785507303961.jpg",
        "/src/assets/images/col_fluffy_slippers_1785381007_1785380647936.jpg",
        "/src/assets/images/col_folding_fan_1785381006_1785380633214.jpg",
        "/src/assets/images/col_foot_bath_1785381378.jpg",
        "/src/assets/images/col_foot_bath_96_1785507695229.jpg",
        "/src/assets/images/col_friendship_tea_1785380310316.jpg",
        "/src/assets/images/col_gold_reward_50_1785495755977.jpg",
        "/src/assets/images/col_gourmet_takoyaki_1785380270711.jpg",
        "/src/assets/images/col_guardian_heart_52_1785495778194.jpg",
        "/src/assets/images/col_herbal_tea_1785381373.jpg",
        "/src/assets/images/col_herbal_tea_91_1785507611571.jpg",
        "/src/assets/images/col_housing_support_1783677825592.jpg",
        "/src/assets/images/col_hydrangea_vase_1785381003_1785380592566.jpg",
        "/src/assets/images/col_ill_age_looks_1783884287024.jpg",
        "/src/assets/images/col_ill_beauty_lifestyle_1783912347430.jpg",
        "/src/assets/images/col_ill_beginner_guide_1783884225541.jpg",
        "/src/assets/images/col_ill_cast_holiday_1783884322866.jpg",
        "/src/assets/images/col_ill_cherry_bloom_1783884503300.jpg",
        "/src/assets/images/col_ill_gold_bubble_1783913188809.jpg",
        "/src/assets/images/col_ill_housing_support_1783884256462.jpg",
        "/src/assets/images/col_ill_interview_guide_1783884267011.jpg",
        "/src/assets/images/col_ill_kimono_magic_1783884424450.jpg",
        "/src/assets/images/col_ill_kimono_makeup_1783884356215.jpg",
        "/src/assets/images/col_ill_makeup_vanity_1783884445492.jpg",
        "/src/assets/images/col_ill_mental_support_1783884376739.jpg",
        "/src/assets/images/col_ill_non_alcoholic_1783884312890.jpg",
        "/src/assets/images/col_ill_obachan_role_1783884412493.jpg",
        "/src/assets/images/col_ill_one_day_flow_1783884401530.jpg",
        "/src/assets/images/col_ill_privacy_guide_1783884246291.jpg",
        "/src/assets/images/col_ill_privacy_smart_1783884436471.jpg",
        "/src/assets/images/col_ill_relax_spa_1783884493332.jpg",
        "/src/assets/images/col_ill_safe_entrance_1783884460416.jpg",
        "/src/assets/images/col_ill_safety_security_1783884343829.jpg",
        "/src/assets/images/col_ill_salary_system_1783884234635.jpg",
        "/src/assets/images/col_ill_search_words_1783884385779.jpg",
        "/src/assets/images/col_ill_short_term_1783884332841.jpg",
        "/src/assets/images/col_ill_smart_planner_1783884470546.jpg",
        "/src/assets/images/col_ill_tax_guide_1783884296268.jpg",
        "/src/assets/images/col_ill_trial_guide_1783884277032.jpg",
        "/src/assets/images/col_ill_weekend_shift_1783884365752.jpg",
        "/src/assets/images/col_ill_welcome_gift_1783884481747.jpg",
        "/src/assets/images/col_incognito_cute_55_1785495817237.jpg",
        "/src/assets/images/col_interview_guide_1783677837312.jpg",
        "/src/assets/images/col_kimono_magic_1783748310784.jpg",
        "/src/assets/images/col_kimono_makeup_1783677929197.jpg",
        "/src/assets/images/col_makeup_vanity_1783883669976.jpg",
        "/src/assets/images/col_mental_relax_63_1785509298139.jpg",
        "/src/assets/images/col_mental_support_1783677954070.jpg",
        "/src/assets/images/col_mocktail_toast_95_1785507679077.jpg",
        "/src/assets/images/col_morning_coffee_1785381002_1785380579731.jpg",
        "/src/assets/images/col_non_alcoholic_1783677885472.jpg",
        "/src/assets/images/col_obachan_role_1783748297250.jpg",
        "/src/assets/images/col_obi_ribbon_89_1785507575434.jpg",
        "/src/assets/images/col_one_day_flow_1783748283731.jpg",
        "/src/assets/images/col_pancake_cafe_1785381370662.jpg",
        "/src/assets/images/col_peony_mirror_1785381008_1785380660996.jpg",
        "/src/assets/images/col_planner_dreams_94_1785507661072.jpg",
        "/src/assets/images/col_popular_cast_26_1785509281369.jpg",
        "/src/assets/images/col_privacy_guide_1783677816084.jpg",
        "/src/assets/images/col_privacy_shield_47_1785495714291.jpg",
        "/src/assets/images/col_privacy_smart_1783883659536.jpg",
        "/src/assets/images/col_relax_bath_1785380379937.jpg",
        "/src/assets/images/col_relax_spa_1783883716832.jpg",
        "/src/assets/images/col_resort_stay_46_1785507334215.jpg",
        "/src/assets/images/col_safe_entrance_1783883680643.jpg",
        "/src/assets/images/col_safety_security_1783677920159.jpg",
        "/src/assets/images/col_salary_system_1783677804535.jpg",
        "/src/assets/images/col_savings_chart_56_1785495838818.jpg",
        "/src/assets/images/col_savings_jar_1785381372.jpg",
        "/src/assets/images/col_savings_jar_90_1785507594531.jpg",
        "/src/assets/images/col_savings_ribbon_1785380323578.jpg",
        "/src/assets/images/col_search_words_1783677965204.jpg",
        "/src/assets/images/col_seasonal_kimono_1785380285577.jpg",
        "/src/assets/images/col_secret_account_49_1785495743866.jpg",
        "/src/assets/images/col_short_term_1783677909352.jpg",
        "/src/assets/images/col_skincare_bottles_1785381374.jpg",
        "/src/assets/images/col_skincare_glow_92_1785507628390.jpg",
        "/src/assets/images/col_smart_planner_1783883692671.jpg",
        "/src/assets/images/col_sparkling_juice_1785381377.jpg",
        "/src/assets/images/col_star_necklace_97_1785507710568.jpg",
        "/src/assets/images/col_star_pendant_1785381379.jpg",
        "/src/assets/images/col_starlit_moon_1785381005_1785380618892.jpg",
        "/src/assets/images/col_starry_window_1785380333938.jpg",
        "/src/assets/images/col_stationery_notebook_1785381376.jpg",
        "/src/assets/images/col_strawberry_parfait_1785381001_1785380565566.jpg",
        "/src/assets/images/col_tax_guide_1783677870446.jpg",
        "/src/assets/images/col_travel_map_1785380368965.jpg",
        "/src/assets/images/col_trial_guide_1783677848466.jpg",
        "/src/assets/images/col_trial_step_57_1785495851341.jpg",
        "/src/assets/images/col_vintage_camera_1785381009_1785380673843.jpg",
        "/src/assets/images/col_weekend_shift_1783677940789.jpg",
        "/src/assets/images/col_welcome_booklet_54_1785495804984.jpg",
        "/src/assets/images/col_welcome_gift_1783883703745.jpg",
        "/src/assets/images/col_yukata_ribbon_1785381371.jpg",
        "/src/assets/images/new_col_cherry_tea_1785378552865.jpg",
        "/src/assets/images/new_col_coffee_laptop_1785378489412.jpg",
        "/src/assets/images/new_col_cozy_sofa_1785378602940.jpg",
        "/src/assets/images/new_col_gold_piggy_1785378525722.jpg",
        "/src/assets/images/new_col_hair_salon_1785378540259.jpg",
        "/src/assets/images/new_col_heart_shield_1785378576575.jpg",
        "/src/assets/images/new_col_luggage_travel_1785378592409.jpg",
        "/src/assets/images/new_col_makeup_bag_1785378503353.jpg",
        "/src/assets/images/new_col_night_city_1785378564307.jpg",
        "/src/assets/images/new_col_train_commute_1785378515110.jpg",
        "/src/assets/images/premium_beauty_mirror_illust_1783983011517.jpg",
        "/src/assets/images/premium_cafe_study_illust_1783982999931.jpg",
        "/src/assets/images/premium_cat_mascot_illust_1783983070646.jpg",
        "/src/assets/images/premium_comfy_bedroom_illust_1783983257261.jpg",
        "/src/assets/images/premium_cute_chat_illust_1783983111499.jpg",
        "/src/assets/images/premium_cute_desk_illust_1783983276314.jpg",
        "/src/assets/images/premium_cute_outfit_illust_1783982989517.jpg",
        "/src/assets/images/premium_dorm_life_illust_1783982967926.jpg",
        "/src/assets/images/premium_flower_vase_illust_1783983192676.jpg",
        "/src/assets/images/premium_kimono_dress_illust_1783983134104.jpg",
        "/src/assets/images/premium_lucky_keys_illust_1783983202689.jpg",
        "/src/assets/images/premium_luxury_shopping_illust_1783983163266.jpg",
        "/src/assets/images/premium_mentor_advice_illust_1783983212274.jpg",
        "/src/assets/images/premium_morning_breakfast_illust_1783983222167.jpg",
        "/src/assets/images/premium_nail_art_illust_1783983247884.jpg",
        "/src/assets/images/premium_onsen_spa_illust_1783983059885.jpg",
        "/src/assets/images/premium_peaceful_yoga_illust_1783983173190.jpg",
        "/src/assets/images/premium_piggy_bank_illust_1783983266778.jpg",
        "/src/assets/images/premium_planner_flow_illust_1783983081126.jpg",
        "/src/assets/images/premium_rainy_boots_illust_1783983237954.jpg",
        "/src/assets/images/premium_relaxing_spa_illust_1783983152487.jpg",
        "/src/assets/images/premium_safety_heart_illust_1783983030211.jpg",
        "/src/assets/images/premium_smart_finance_illust_1783983021235.jpg",
        "/src/assets/images/premium_spring_umbrella_illust_1783983092350.jpg",
        "/src/assets/images/premium_support_hands_illust_1783982978701.jpg",
        "/src/assets/images/premium_tea_time_illust_1783983101716.jpg",
        "/src/assets/images/premium_warm_fireplace_illust_1783983182824.jpg",
        "/src/assets/images/premium_welcome_door_illust_1783983123541.jpg",
        "/src/assets/images/premium_women_friends_illust_1783983040476.jpg",
        "/src/assets/images/test_illustration_1783978015138.jpg",
        "/src/assets/images/tobita_advisor_avatar_1782370695372.jpg",
        "/src/assets/images/tobita_cast_one_1781787976936.jpg",
        "/src/assets/images/tobita_cast_one_real_1782374824918.jpg",
        "/src/assets/images/tobita_cast_three_1781788006133.jpg",
        "/src/assets/images/tobita_cast_three_real_1782374857559.jpg",
        "/src/assets/images/tobita_cast_two_1781787990991.jpg",
        "/src/assets/images/tobita_cast_two_real_1782374841336.jpg",
        "/src/assets/images/tobita_dream_hero_banner_1782557055526.jpg",
        "/src/assets/images/tobita_soft_hero_1782370495398.jpg",
        "/src/assets/images/tobita_streetscape_1782370386330.jpg"
      ];

      // Get highest numeric ID in current articles to continue sequence
      let maxId = 0;
      for (const art of memoryArticles) {
        const parsedId = parseInt(art.id, 10);
        if (!isNaN(parsedId) && parsedId > maxId) {
          maxId = parsedId;
        }
      }

      // Map and populate additional standard values on server side
      const todayStr = new Date().toISOString().split("T")[0];
      const existingSlugs = new Set(memoryArticles.map(art => (art.slug || "").toLowerCase()));

      // Calculate the current usage frequency of each premium illustration
      const illustrationUsage = new Map<string, number>();
      for (const img of premiumIllustrations) {
        illustrationUsage.set(img, 0);
      }
      for (const art of memoryArticles) {
        if (art.eyeCatch && illustrationUsage.has(art.eyeCatch)) {
          illustrationUsage.set(art.eyeCatch, illustrationUsage.get(art.eyeCatch)! + 1);
        }
      }

      const newlyGeneratedArticles = parsedArticles.map((art: any, index: number) => {
        const nextId = (maxId + index + 1).toString();
        
        // Count approximate characters for reading time
        const charCount = art.content ? JSON.stringify(art.content).length : 1200;
        const readTimeMinutes = Math.max(2, Math.ceil(charCount / 400));

        // Sort illustrations so the least-used ones are at the front.
        // To add a bit of variety, we preserve original order for identical frequencies.
        const sortedIllustrations = [...premiumIllustrations].sort((a, b) => {
          const countA = illustrationUsage.get(a) || 0;
          const countB = illustrationUsage.get(b) || 0;
          if (countA !== countB) {
            return countA - countB;
          }
          return premiumIllustrations.indexOf(a) - premiumIllustrations.indexOf(b);
        });

        // Pick the least-used illustration
        const chosenEyeCatch = sortedIllustrations[0];
        // Increment the usage of the chosen illustration so the next article in this batch gets a different one
        illustrationUsage.set(chosenEyeCatch, (illustrationUsage.get(chosenEyeCatch) || 0) + 1);

        const rawSlug = art.slug || "";
        const uniqueSlug = sanitizeAndDeduplicateSlug(rawSlug, art.title || "", existingSlugs);
        existingSlugs.add(uniqueSlug);

        return {
          id: nextId,
          title: art.title || "【新コラム】飛田新地での働き方コラム",
          slug: uniqueSlug,
          category: art.category || "beginner",
          categoryLabel: art.categoryLabel || "未経験者向け",
          publishedAt: todayStr,
          readTime: `${readTimeMinutes}分`,
          summary: art.summary || "AIによって自動生成された最新のコラム記事です。",
          eyeCatch: chosenEyeCatch,
          author: {
            name: art.author?.name || "さくら",
            role: art.author?.role || "女性サポートスタッフ",
            avatar: art.author?.avatar || "👩‍💼"
          },
          content: art.content || [
            { type: "p", text: "準備中のコラムコンテンツです。" }
          ],
          tags: art.tags || ["AI自動生成", "未経験歓迎"]
        };
      });

      // Insert new articles at the beginning of list
      const mergedArticles = [...newlyGeneratedArticles, ...memoryArticles];
      memoryArticles = mergedArticles;

      if (isWritable) {
        try {
          fs.writeFileSync(ARTICLES_PATH, JSON.stringify(mergedArticles, null, 2), "utf-8");
          syncToGitHub();
        } catch (fileErr) {
          console.error("Non-fatal error writing auto-generated articles to file:", fileErr);
        }
      }

      return res.json({
        success: true,
        count: newlyGeneratedArticles.length,
        articles: newlyGeneratedArticles
      });

    } catch (e: any) {
      console.error("Error in generate-articles API:", e);
      return res.status(500).json({ error: e.message || "コラムの自動生成中にエラーが発生しました。" });
    }
  });

  // API: Get blog articles
  app.get("/api/cms/articles", (req, res) => {
    return res.json(memoryArticles);
  });

  // API: Save blog articles
  app.post("/api/cms/articles", checkAdminAuth, (req, res) => {
    try {
      const articles = req.body;
      memoryArticles = articles; // Always update in-memory cache

      if (isWritable) {
        try {
          fs.writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2), "utf-8");
          // Trigger automatic push to GitHub
          syncToGitHub();
        } catch (fileErr) {
          console.error("Non-fatal error writing articles to file:", fileErr);
          // Don't crash or return 500 since we updated the memory cache successfully!
        }
      }
      return res.json({ success: true, count: articles.length });
    } catch (e: any) {
      console.error("Error in POST articles:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // API: Get site content
  app.get("/api/cms/site", (req, res) => {
    return res.json(memorySiteContent);
  });

  // API: Save site content
  app.post("/api/cms/site", checkAdminAuth, (req, res) => {
    try {
      const siteContent = req.body;
      memorySiteContent = siteContent; // Always update in-memory cache

      if (isWritable) {
        try {
          fs.writeFileSync(SITE_CONTENT_PATH, JSON.stringify(siteContent, null, 2), "utf-8");
          // Trigger automatic push to GitHub
          syncToGitHub();
        } catch (fileErr) {
          console.error("Non-fatal error writing site content to file:", fileErr);
          // Don't crash or return 500 since we updated the memory cache successfully!
        }
      }
      return res.json({ success: true });
    } catch (e: any) {
      console.error("Error in POST site content:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // Helper functions for dynamic OGP and Twitter Card meta injection
  function escapeHtml(str: string): string {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toAbsoluteImageUrl(imagePath: string, domain = "https://tobitashinchi.pages.dev"): string {
    if (!imagePath) {
      return `${domain}/images/tobita_bright_future_1789106917071.jpg`;
    }
    let clean = imagePath.trim();
    if (clean.includes("tobitashinchi-recruit.com")) {
      clean = clean.replace(/https?:\/\/tobitashinchi-recruit\.com/g, domain);
    }
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      return clean;
    }
    const normalizedPath = clean.startsWith("/") ? clean : `/${clean}`;
    return `${domain}${normalizedPath}`;
  }

  function injectMetaIntoHtml(baseHtml: string, meta: {
    title: string;
    description: string;
    imageUrl: string;
    url: string;
    type?: "website" | "article";
  }): string {
    let html = baseHtml;
    const escapedTitle = escapeHtml(meta.title);
    const escapedDesc = escapeHtml(meta.description);
    const escapedImage = escapeHtml(meta.imageUrl);
    const escapedUrl = escapeHtml(meta.url);
    const type = meta.type || "article";

    // 1. Replace <title>
    if (/<title>.*?<\/title>/i.test(html)) {
      html = html.replace(/<title>.*?<\/title>/i, `<title>${escapedTitle}</title>`);
    }

    // 2. Replace meta name="description"
    if (/<meta\s+name="description"\s+content=".*?"\s*\/?>/i.test(html)) {
      html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${escapedDesc}" />`);
    }

    // 3. Replace canonical link
    if (/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i.test(html)) {
      html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, `<link rel="canonical" href="${escapedUrl}" />`);
    }

    // 4. Replace or inject og:title
    if (/property="og:title"/i.test(html)) {
      html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${escapedTitle}" />`);
    } else {
      html = html.replace("</head>", `  <meta property="og:title" content="${escapedTitle}" />\n</head>`);
    }

    // 5. Replace or inject og:description
    if (/property="og:description"/i.test(html)) {
      html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escapedDesc}" />`);
    } else {
      html = html.replace("</head>", `  <meta property="og:description" content="${escapedDesc}" />\n</head>`);
    }

    // 6. Replace or inject og:image
    if (/property="og:image"\s+content/i.test(html)) {
      html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, `<meta property="og:image" content="${escapedImage}" />`);
    } else {
      html = html.replace("</head>", `  <meta property="og:image" content="${escapedImage}" />\n</head>`);
    }

    // 7. Replace or inject og:url
    if (/property="og:url"/i.test(html)) {
      html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, `<meta property="og:url" content="${escapedUrl}" />`);
    } else {
      html = html.replace("</head>", `  <meta property="og:url" content="${escapedUrl}" />\n</head>`);
    }

    // 8. Replace or inject og:type
    if (/property="og:type"/i.test(html)) {
      html = html.replace(/<meta\s+property="og:type"\s+content=".*?"\s*\/?>/i, `<meta property="og:type" content="${type}" />`);
    } else {
      html = html.replace("</head>", `  <meta property="og:type" content="${type}" />\n</head>`);
    }

    // 9. Replace or inject twitter:card
    if (/name="twitter:card"/i.test(html)) {
      html = html.replace(/<meta\s+name="twitter:card"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:card" content="summary_large_image" />`);
    } else {
      html = html.replace("</head>", `  <meta name="twitter:card" content="summary_large_image" />\n</head>`);
    }

    // 10. Replace or inject twitter:title
    if (/name="twitter:title"/i.test(html)) {
      html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${escapedTitle}" />`);
    } else {
      html = html.replace("</head>", `  <meta name="twitter:title" content="${escapedTitle}" />\n</head>`);
    }

    // 11. Replace or inject twitter:description
    if (/name="twitter:description"/i.test(html)) {
      html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${escapedDesc}" />`);
    } else {
      html = html.replace("</head>", `  <meta name="twitter:description" content="${escapedDesc}" />\n</head>`);
    }

    // 12. Replace or inject twitter:image
    if (/name="twitter:image"/i.test(html)) {
      html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${escapedImage}" />`);
    } else {
      html = html.replace("</head>", `  <meta name="twitter:image" content="${escapedImage}" />\n</head>`);
    }

    return html;
  }

  const getRequestBaseUrl = (req: express.Request): string => {
    const proto = (req.headers["x-forwarded-proto"] as string) || (req.secure ? "https" : "http");
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes("0.0.0.0")) {
      return `${proto}://${host}`;
    }
    return "https://tobitashinchi.pages.dev";
  };

  let vite: any = null;
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true, cors: true },
      appType: "spa",
    });
  }

  // Dynamic OGP rendering for /blog/:slug (X / Twitter, LINE, Facebook crawlers & direct browser visits)
  app.get(["/blog/:slug", "/blog/:slug/"], async (req, res, next) => {
    try {
      const { slug } = req.params;
      if (slug && slug.includes(".")) {
        return next();
      }

      // Check in-memory articles first, then fallback to file
      const allArticles = memoryArticles.length > 0 ? memoryArticles : (
        fs.existsSync(ARTICLES_PATH) ? JSON.parse(fs.readFileSync(ARTICLES_PATH, "utf-8")) : BLOG_ARTICLES
      );
      const article = allArticles.find((a: any) => a.slug === slug || String(a.id) === slug);

      if (!article) {
        return next();
      }

      const baseUrl = getRequestBaseUrl(req);
      const fullImageUrl = toAbsoluteImageUrl(article.eyeCatch, baseUrl);
      const articleUrl = `${baseUrl}/blog/${article.slug}`;
      const articleTitle = `${article.title} | 飛田ガールズ`;
      const articleDesc = article.summary || `${article.title}についての詳しいお仕事解説記事です。`;

      let baseHtml = "";
      if (isProd) {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          baseHtml = fs.readFileSync(indexPath, "utf-8");
        }
      } else {
        const indexPath = path.join(projectRootDir, "index.html");
        if (fs.existsSync(indexPath)) {
          baseHtml = fs.readFileSync(indexPath, "utf-8");
        }
      }

      if (!baseHtml) {
        return next();
      }

      let modifiedHtml = injectMetaIntoHtml(baseHtml, {
        title: articleTitle,
        description: articleDesc,
        imageUrl: fullImageUrl,
        url: articleUrl,
        type: "article",
      });

      if (!isProd && vite) {
        modifiedHtml = await vite.transformIndexHtml(req.originalUrl, modifiedHtml);
      }

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(modifiedHtml);
    } catch (err) {
      console.error("Error serving blog article with OGP:", err);
      return next();
    }
  });

  // Dynamic OGP rendering for /blog (list page)
  app.get(["/blog", "/blog/"], async (req, res, next) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      let baseHtml = "";
      if (isProd) {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          baseHtml = fs.readFileSync(indexPath, "utf-8");
        }
      } else {
        const indexPath = path.join(projectRootDir, "index.html");
        if (fs.existsSync(indexPath)) {
          baseHtml = fs.readFileSync(indexPath, "utf-8");
        }
      }

      if (!baseHtml) {
        return next();
      }

      let modifiedHtml = injectMetaIntoHtml(baseHtml, {
        title: "お仕事コラム一覧 | 飛田ガールズ【公式求人】",
        description: "飛田新地のお仕事コラム・お役立ち情報一覧。給料システム、面接対策、身バレ防止、未経験からの働き方などを詳しく解説しています。",
        imageUrl: `${baseUrl}/images/col_ryotei_flow_1789107427433.jpg`,
        url: `${baseUrl}/blog`,
        type: "website",
      });

      if (!isProd && vite) {
        modifiedHtml = await vite.transformIndexHtml(req.originalUrl, modifiedHtml);
      }

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(modifiedHtml);
    } catch (err) {
      console.error("Error serving blog list with OGP:", err);
      return next();
    }
  });

  // Vite middleware for development
  if (!isProd) {
    app.use(vite.middlewares);
  } else {
    // Serve static assets from dist
    app.use(express.static(distPath));

    // Serve /src/assets static files if requested directly
    const srcAssetsPath = path.join(projectRootDir, "src", "assets");
    if (fs.existsSync(srcAssetsPath)) {
      app.use("/src/assets", express.static(srcAssetsPath));
    }
    const distSrcAssetsPath = path.join(distPath, "src", "assets");
    if (fs.existsSync(distSrcAssetsPath)) {
      app.use("/src/assets", express.static(distSrcAssetsPath));
    }

    // Ensure any file extension requests that were not found return 404 instead of index.html
    app.get(/\.(jpg|jpeg|png|webp|svg|gif|ico|css|js|map|woff|woff2|ttf|eot|json)$/i, (req, res) => {
      res.status(404).send("File not found");
    });

    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application index.html not found");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Failed to start server:", e);
});
