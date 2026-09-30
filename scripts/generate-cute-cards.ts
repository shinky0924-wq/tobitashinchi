import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface Article {
  id: string | number;
  title: string;
  slug: string;
  category: string;
  categoryLabel: string;
  publishedAt: string;
  readTime: string;
  summary: string;
  eyeCatch: string;
  author: any;
  tags: string[];
  content: any[];
}

const rootDir = process.cwd();
const publicImagesDir = path.join(rootDir, 'public', 'images');
const publicAssetsImagesDir = path.join(rootDir, 'public', 'assets', 'images');
const srcImagesDir = path.join(rootDir, 'src', 'assets', 'images');

// Clean XML entities for SVG
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Smart Japanese title wrapper into lines
function wrapTitleToLines(rawTitle: string): { tag: string | null; bodyLines: string[] } {
  let title = rawTitle.trim();
  if (title.startsWith('【飛田新地求人】')) {
    title = title.replace('【飛田新地求人】', '').trim();
  }

  const bracketMatch = title.match(/^(【[^】]+】)(.*)$/);

  if (bracketMatch) {
    const tag = bracketMatch[1];
    let rest = bracketMatch[2].trim();
    if (rest.length === 0) {
      return { tag, bodyLines: [] };
    }

    if (rest.length <= 22) {
      return { tag, bodyLines: [rest] };
    }

    // Try splitting at Japanese punctuation
    const puncMatch = rest.search(/[！!・、\s]/);
    if (puncMatch >= 7 && puncMatch <= 23) {
      const line1 = rest.slice(0, puncMatch + 1).trim();
      const line2 = rest.slice(puncMatch + 1).trim();
      if (line2.length <= 24) {
        return { tag, bodyLines: [line1, line2] };
      }
      const half = Math.ceil(line2.length / 2);
      return { tag, bodyLines: [line1, line2.slice(0, half), line2.slice(half)] };
    }

    const half = Math.ceil(rest.length / 2);
    if (half <= 24) {
      return { tag, bodyLines: [rest.slice(0, half), rest.slice(half)] };
    }
    const third = Math.ceil(rest.length / 3);
    return { tag, bodyLines: [rest.slice(0, third), rest.slice(third, third * 2), rest.slice(third * 2)] };
  }

  // Split at first exclamation if present
  const firstExcl = title.search(/[！!]/);
  if (firstExcl >= 4 && firstExcl <= 22) {
    const tag = title.slice(0, firstExcl + 1).trim();
    const rest = title.slice(firstExcl + 1).trim();
    if (rest.length <= 23) {
      return { tag, bodyLines: [rest] };
    }
    const puncMatch = rest.search(/[！!・、\s]/);
    if (puncMatch >= 7 && puncMatch <= 23) {
      const l1 = rest.slice(0, puncMatch + 1).trim();
      const l2 = rest.slice(puncMatch + 1).trim();
      return { tag, bodyLines: [l1, l2] };
    }
    const half = Math.ceil(rest.length / 2);
    return { tag, bodyLines: [rest.slice(0, half), rest.slice(half)] };
  }

  // Without bracket or exclamation
  if (title.length <= 20) {
    return { tag: null, bodyLines: [title] };
  }
  if (title.length <= 42) {
    const puncMatch = title.search(/[！!・、\s]/);
    if (puncMatch >= 8 && puncMatch <= 24) {
      return { tag: null, bodyLines: [title.slice(0, puncMatch + 1), title.slice(puncMatch + 1)] };
    }
    const half = Math.ceil(title.length / 2);
    return { tag: null, bodyLines: [title.slice(0, half), title.slice(half)] };
  }
  const third = Math.ceil(title.length / 3);
  return { tag: null, bodyLines: [title.slice(0, third), title.slice(third, third * 2), title.slice(third * 2)] };
}

// Find appropriate topic background image
function selectBackgroundImage(article: Article): string {
  const text = `${article.slug} ${article.title} ${article.categoryLabel || ''} ${JSON.stringify(article.tags || [])}`.toLowerCase();

  const candidates: [RegExp, string][] = [
    [/着物|浴衣|帯|和装|kimono|yukata/, 'jp_kimono_style_1789467837838.jpg'],
    [/給料|給与|日払い|稼|1000万|貯金|口座|手渡し|時給|salary|bonus|tax|税金|万|残る理由/, 'jp_woman_salary_1789467749655.jpg'],
    [/身バレ|プライバシー|秘密|会社|家族|バレ|privacy|sns|親や友達/, 'col_privacy_protect_1789107457068.jpg'],
    [/安全|衛生|性病|ルール|排除|ヤクザ|スカウト|安心/, 'col_safety_shield_1789107540732.jpg'],
    [/寮|マンション|個室|一人暮らし|housing|dormitory|即日入居/, 'col_studio_room_1789107471455.jpg'],
    [/面接|応募|書類|履歴書|喫茶店|interview/, 'col_cafe_interview_1789107484817.jpg'],
    [/体験|体入|デビュー|初心者|未経験|受け身|beginner|trial/, 'col_vanity_trial_1789107497172.jpg'],
    [/メイク|コスメ|スキンケア|美容|鏡|ルックス|美肌|beauty|skincare/, 'jp_skincare_glow_1789467940047.jpg'],
    [/お風呂|入浴|泡|リラックス|アロマ|ハーブティー|足湯|bath|aroma|tea|sleep|睡眠/, 'jp_bubble_bath_1789467952561.jpg'],
    [/パンケーキ|カフェ|スイーツ|ケーキ|ドリンク|ジュース|pancake|cake|cafe|sweet/, 'jp_fluffy_pancake_1789467858767.jpg'],
    [/友達|ペア|二人|友人|仲間|friends/, 'jp_two_friends_1789467775509.jpg'],
    [/スタッフ|おばちゃん|仲居|サポート|アドバイザー|相談|staff|obachan/, 'staff_lounge_support_1789108549559.jpg'],
    [/旅行|リゾート|出稼ぎ|海外|留学|travel|vacation/, 'jp_overseas_travel_1789468075905.jpg'],
    [/天王寺|なんば|アクセス|通勤|タクシー|送迎|commute|access|taxi/, 'col_street_lanterns_1789107524691.jpg'],
    [/料亭|通り|青春|メイン|歴史|伝統|ryotei/, 'col_ryotei_flow_1789107427433.jpg'],
    [/シングルマザー|子育て|育児|child|mother/, 'jp_mother_child_1789467823272.jpg'],
    [/シフト|手帳|スケジュール|planner|schedule/, 'jp_planner_notebook_1789467908606.jpg'],
    [/自信|笑顔|成長|自立|smile|confidence|charm/, 'jp_confident_smile_1789467788318.jpg'],
    [/星|ペンダント|ジュエリー|アクセサリー|star|necklace/, 'jp_star_necklace_1789467896476.jpg'],
    [/夜|ナイト|星空|reset|routine/, 'jp_cozy_bedroom_1789468035819.jpg'],
    [/貯金箱|貯蓄|500円|coin|jar/, 'jp_savings_jar_1789468021098.jpg']
  ];

  for (const [re, img] of candidates) {
    if (re.test(text)) {
      const fullPath = path.join(srcImagesDir, img);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  // Fallback to col_unique_art_${id}.jpg if exists
  const uniqueImg = path.join(srcImagesDir, `col_unique_art_${article.id}.jpg`);
  if (fs.existsSync(uniqueImg)) {
    return uniqueImg;
  }

  return path.join(srcImagesDir, 'col_ryotei_flow_1789107427433.jpg');
}

// Generate the cute card SVG
function createCuteSvg(article: Article): string {
  const { tag, bodyLines } = wrapTitleToLines(article.title);

  // Calculate layout coordinates
  let contentY = 220;
  let tagSvg = '';
  
  if (tag) {
    const escapedTag = escapeXml(tag);
    tagSvg = `
      <text x="140" y="${contentY}" font-family="Zen Maru Gothic, sans-serif" font-size="44" font-weight="bold" fill="#e63963" letter-spacing="1.5px">
        ${escapedTag}
      </text>
    `;
    contentY += 68;
  }

  const fontSize = bodyLines.length > 2 ? 38 : 42;
  const lineSpacing = bodyLines.length > 2 ? 58 : 64;

  const linesSvg = bodyLines
    .map((line, idx) => {
      const y = contentY + idx * lineSpacing;
      return `
        <text x="140" y="${y}" font-family="Zen Maru Gothic, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#25161d" letter-spacing="0.8px">
          ${escapeXml(line)}
        </text>
      `;
    })
    .join('\n');

  const bottomY = Math.min(contentY + bodyLines.length * lineSpacing + 20, 500);

  return `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff4b78" />
        <stop offset="100%" stop-color="#ff7597" />
      </linearGradient>
      <linearGradient id="bgVignette" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(18, 8, 14, 0.40)" />
        <stop offset="100%" stop-color="rgba(18, 8, 14, 0.65)" />
      </linearGradient>
      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.30" />
      </filter>
    </defs>

    <!-- Warm darkening overlay on background photo -->
    <rect width="1200" height="630" fill="url(#bgVignette)" />

    <!-- Cute Card Plate with Soft Shadow and Rounded Corners -->
    <g filter="url(#cardShadow)">
      <rect x="75" y="60" width="1050" height="510" rx="32" fill="rgba(255, 255, 255, 0.95)" stroke="#ffccd5" stroke-width="3" />
    </g>

    <!-- Top Badge: 🌸 飛田新地求人 🌸 (Cute pill with soft sparkle) -->
    <g transform="translate(135, 105)">
      <rect x="0" y="0" width="230" height="50" rx="25" fill="url(#badgeGrad)" />
      <text x="115" y="33" font-family="Zen Maru Gothic, sans-serif" font-size="23" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2px">🌸 飛田新地求人 🌸</text>
    </g>

    <!-- Cute sparkle decoration on top right of card plate -->
    <g transform="translate(1030, 110)">
      <text font-family="Zen Maru Gothic, sans-serif" font-size="26" fill="#ff7597" text-anchor="middle">✨</text>
    </g>

    <!-- Title: ONLY 飛田新地 + タイトル -->
    ${tagSvg}
    ${linesSvg}

    <!-- Cute decorative accent line at bottom of card -->
    <g transform="translate(140, ${bottomY})">
      <circle cx="0" cy="0" r="4.5" fill="#ff8da7" />
      <line x1="14" y1="0" x2="200" y2="0" stroke="#ff8da7" stroke-width="3" stroke-linecap="round" />
      <circle cx="214" cy="0" r="4.5" fill="#ff8da7" />
    </g>
  </svg>
  `;
}

async function main() {
  console.log('🌸 Starting generation of cute, high-readability cards (ONLY 飛田新地 + タイトル)...');
  
  const articlesPath = path.join(rootDir, 'data', 'blogArticles.json');
  const articles: Article[] = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));

  fs.mkdirSync(publicImagesDir, { recursive: true });
  fs.mkdirSync(publicAssetsImagesDir, { recursive: true });
  fs.mkdirSync(srcImagesDir, { recursive: true });

  let count = 0;

  for (const article of articles) {
    const slug = article.slug;
    const cardFileName = `card_${slug}.jpg`;
    const bgImagePath = selectBackgroundImage(article);

    // 1. Resize/crop background photo to 1200x630
    const bgBuffer = await sharp(bgImagePath)
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .toBuffer();

    // 2. Generate cute SVG overlay
    const svgString = createCuteSvg(article);
    const svgBuffer = Buffer.from(svgString);

    // 3. Composite and compress with mozjpeg
    const cardBuffer = await sharp(bgBuffer)
      .composite([{ input: svgBuffer }])
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    // 4. Save to all relevant target locations
    fs.writeFileSync(path.join(publicImagesDir, cardFileName), cardBuffer);
    fs.writeFileSync(path.join(publicAssetsImagesDir, cardFileName), cardBuffer);
    fs.writeFileSync(path.join(srcImagesDir, cardFileName), cardBuffer);

    // 5. Ensure article eyeCatch points to the new card
    article.eyeCatch = `/images/${cardFileName}`;
    count++;
    if (count % 10 === 0) {
      console.log(`Generated ${count}/100 cards...`);
    }
  }

  // Save updated articles json
  fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2), 'utf-8');

  // Also update functions/blog/articles.json
  const funcArticlesPath = path.join(rootDir, 'functions', 'blog', 'articles.json');
  const simplified = articles.map(a => ({
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    eyeCatch: a.eyeCatch
  }));
  fs.writeFileSync(funcArticlesPath, JSON.stringify(simplified, null, 2), 'utf-8');

  console.log(`✨ Successfully generated all ${count} cute cards with 飛田新地 + タイトル only!`);
}

main().catch(err => {
  console.error('Fatal error generating cards:', err);
  process.exit(1);
});
