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

// Strip all emojis from text
function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .trim();
}

// Smart Japanese title wrapper into lines
function wrapTitleToLines(rawTitle: string): { tag: string | null; bodyLines: string[] } {
  let title = stripEmojis(rawTitle.trim());
  if (title.startsWith('【飛田新地 求人】')) {
    title = title.replace('【飛田新地 求人】', '').trim();
  } else if (title.startsWith('【飛田新地求人】')) {
    title = title.replace('【飛田新地求人】', '').trim();
  }

  const bracketMatch = title.match(/^(【[^】]+】)(.*)$/);

  if (bracketMatch) {
    const tag = stripEmojis(bracketMatch[1]);
    let rest = stripEmojis(bracketMatch[2].trim());
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

// Color theme system: 記事ごとに枠やバッジの色合いを変えるバリエーションパレット
interface ColorTheme {
  name: string;
  stroke: string;
  strokeWidth: number;
  badgeStart: string;
  badgeEnd: string;
  tagColor: string;
  accentColor: string;
}

const COLOR_THEMES: ColorTheme[] = [
  // 1. Sakura Rose (華やかピンク)
  {
    name: 'sakura-rose',
    stroke: '#ff9ebb',
    strokeWidth: 5,
    badgeStart: '#ff3366',
    badgeEnd: '#ff6699',
    tagColor: '#e6005c',
    accentColor: '#ff6699'
  },
  // 2. Lavender Violet (上品ラベンダーパープル)
  {
    name: 'lavender-violet',
    stroke: '#c8a2e6',
    strokeWidth: 5,
    badgeStart: '#8a4baf',
    badgeEnd: '#b370d9',
    tagColor: '#7b329f',
    accentColor: '#9d5fc7'
  },
  // 3. Peach Coral (優しいコーラルピーチ)
  {
    name: 'peach-coral',
    stroke: '#ffb088',
    strokeWidth: 5,
    badgeStart: '#f35a22',
    badgeEnd: '#ff8a5c',
    tagColor: '#d64109',
    accentColor: '#ff7744'
  },
  // 4. Ruby Wine (シックなルビーワイン)
  {
    name: 'ruby-wine',
    stroke: '#e6859e',
    strokeWidth: 5,
    badgeStart: '#b0193e',
    badgeEnd: '#d83a63',
    tagColor: '#a10f32',
    accentColor: '#c82650'
  },
  // 5. Champagne Gold (華やかゴールド)
  {
    name: 'champagne-gold',
    stroke: '#e5bb68',
    strokeWidth: 5,
    badgeStart: '#d48b11',
    badgeEnd: '#f4b23d',
    tagColor: '#b87204',
    accentColor: '#e0971b'
  },
  // 6. Aqua Marine (爽やかアクアブルー)
  {
    name: 'aqua-marine',
    stroke: '#8cd5e8',
    strokeWidth: 5,
    badgeStart: '#0292b7',
    badgeEnd: '#38bdf8',
    tagColor: '#0369a1',
    accentColor: '#0ea5e9'
  },
  // 7. Emerald Mint (清潔感ミントグリーン)
  {
    name: 'emerald-mint',
    stroke: '#82d9b8',
    strokeWidth: 5,
    badgeStart: '#0d9466',
    badgeEnd: '#2ecc71',
    tagColor: '#08734e',
    accentColor: '#10b981'
  },
  // 8. Dusty Mauve (大人くすみモーヴ)
  {
    name: 'dusty-mauve',
    stroke: '#d49cb0',
    strokeWidth: 5,
    badgeStart: '#993d63',
    badgeEnd: '#c4628a',
    tagColor: '#842f53',
    accentColor: '#b04d76'
  },
  // 9. Sunset Apricot (温かみアプリコット)
  {
    name: 'sunset-apricot',
    stroke: '#fca57c',
    strokeWidth: 5,
    badgeStart: '#e04a10',
    badgeEnd: '#fb713b',
    tagColor: '#be3804',
    accentColor: '#f95716'
  },
  // 10. Royal Indigo (高貴なロイヤルパープル)
  {
    name: 'royal-indigo',
    stroke: '#a8b4e8',
    strokeWidth: 5,
    badgeStart: '#4338ca',
    badgeEnd: '#6366f1',
    tagColor: '#3730a3',
    accentColor: '#4f46e5'
  }
];

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

  const numId = typeof article.id === 'number' ? article.id : parseInt(String(article.id).replace(/\D/g, ''), 10) || 1;
  const theme = COLOR_THEMES[numId % COLOR_THEMES.length];

  // Calculate layout coordinates
  let contentY = 224;
  let tagSvg = '';
  
  if (tag) {
    const escapedTag = escapeXml(tag);
    tagSvg = `
      <text x="140" y="${contentY}" font-family="Noto Sans CJK JP, sans-serif" font-size="44" font-weight="bold" fill="${theme.tagColor}" letter-spacing="1.5px">
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
        <text x="140" y="${y}" font-family="Noto Sans CJK JP, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#25161d" letter-spacing="0.8px">
          ${escapeXml(line)}
        </text>
      `;
    })
    .join('\n');

  const bottomY = Math.min(contentY + bodyLines.length * lineSpacing + 20, 505);

  return `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="badgeGrad_${numId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.badgeStart}" />
        <stop offset="100%" stop-color="${theme.badgeEnd}" />
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

    <!-- Card Plate with Dynamic Frame Color per article (絵文字なし・角丸プレート) -->
    <g filter="url(#cardShadow)">
      <rect x="75" y="60" width="1050" height="510" rx="32" fill="rgba(255, 255, 255, 0.96)" stroke="${theme.stroke}" stroke-width="${theme.strokeWidth}" />
    </g>

    <!-- Top Badge: 飛田新地 求人 (大文字・絵文字完全削除・高視認性) -->
    <g transform="translate(135, 95)">
      <rect x="0" y="0" width="360" height="68" rx="34" fill="url(#badgeGrad_${numId})" />
      <text x="180" y="47" font-family="Noto Sans CJK JP, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3.5px">飛田新地 求人</text>
    </g>

    <!-- Title: ONLY 飛田新地 + タイトル (絵文字なし) -->
    ${tagSvg}
    ${linesSvg}

    <!-- Decorative accent line at bottom of card -->
    <g transform="translate(140, ${bottomY})">
      <circle cx="0" cy="0" r="4.5" fill="${theme.accentColor}" />
      <line x1="14" y1="0" x2="200" y2="0" stroke="${theme.accentColor}" stroke-width="3" stroke-linecap="round" />
      <circle cx="214" cy="0" r="4.5" fill="${theme.accentColor}" />
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
    const cardFileNameV2 = `card_${slug}_v2.jpg`;
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

    // 4. Save to all relevant target locations (both v2 and standard)
    for (const fn of [cardFileName, cardFileNameV2]) {
      fs.writeFileSync(path.join(publicImagesDir, fn), cardBuffer);
      fs.writeFileSync(path.join(publicAssetsImagesDir, fn), cardBuffer);
      fs.writeFileSync(path.join(srcImagesDir, fn), cardBuffer);
    }

    // 5. Ensure article eyeCatch points to the new card
    article.eyeCatch = `/images/${cardFileNameV2}`;
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
