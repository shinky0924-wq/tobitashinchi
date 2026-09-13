import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  categoryLabel?: string;
  summary: string;
  eyeCatch?: string;
  tags?: string[];
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Category themes (Color gradients and badge styles)
const CATEGORY_THEMES: Record<string, { badgeFrom: string; badgeTo: string; border: string; label: string }> = {
  beginner: { badgeFrom: '#f43f5e', badgeTo: '#e11d48', border: '#fda4af', label: '未経験者向け' },
  salary: { badgeFrom: '#f59e0b', badgeTo: '#d97706', border: '#fde68a', label: '給与・稼ぎ方' },
  security: { badgeFrom: '#10b981', badgeTo: '#059669', border: '#a7f3d0', label: '安心・身バレ対策' },
  lifestyle: { badgeFrom: '#8b5cf6', badgeTo: '#7c3aed', border: '#ddd6fe', label: '生活・働き方' },
  onboarding: { badgeFrom: '#0ea5e9', badgeTo: '#0284c7', border: '#bae6fd', label: '面接・体入の流れ' },
};

function splitTitle(fullTitle: string): { badge: string; mainLines: string[] } {
  let badge = '';
  let rest = fullTitle.trim();

  // Extract leading 【...】 bracket if present
  const bracketMatch = rest.match(/^[【\[](.*?)[】\]]\s*/);
  if (bracketMatch) {
    badge = bracketMatch[1].trim();
    rest = rest.replace(/^[【\[].*?[】\]]\s*/, '').trim();
  }

  // Wrap rest into 1~3 lines (approx 16-18 chars per line)
  const maxLineChars = 17;
  const lines: string[] = [];

  // Break by natural delimiters if present (punctuation, spaces, etc.)
  const segments = rest.split(/(?<=[、・！？!?\s])/);
  let currentLine = '';

  for (const seg of segments) {
    if ((currentLine + seg).length <= maxLineChars) {
      currentLine += seg;
    } else {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = '';
      }
      if (seg.length > maxLineChars) {
        // hard split long segments
        for (let i = 0; i < seg.length; i += maxLineChars) {
          const chunk = seg.substring(i, i + maxLineChars);
          if (i + maxLineChars >= seg.length) {
            currentLine = chunk;
          } else {
            lines.push(chunk);
          }
        }
      } else {
        currentLine = seg;
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }

  // Limit to at most 3 main lines
  return {
    badge,
    mainLines: lines.slice(0, 3),
  };
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  const lines: string[] = [];
  for (let i = 0; i < clean.length && lines.length < maxLines; i += maxCharsPerLine) {
    let line = clean.substring(i, i + maxCharsPerLine);
    if (lines.length === maxLines - 1 && clean.length > i + maxCharsPerLine) {
      line = line.substring(0, maxCharsPerLine - 1) + '…';
    }
    lines.push(line);
  }
  return lines;
}

export async function generateOgCardForArticle(article: BlogArticle, outputDir: string): Promise<string> {
  const width = 1200;
  const height = 630;

  // Resolve base image
  const defaultImage = path.join(process.cwd(), 'public', 'images', 'tobita_bright_future_1789106917071.jpg');
  let baseImagePath = defaultImage;

  if (article.eyeCatch) {
    const rawPath = article.eyeCatch.replace(/^\//, '');
    const candidate1 = path.join(process.cwd(), 'public', rawPath);
    const candidate2 = path.join(process.cwd(), rawPath);
    if (fs.existsSync(candidate1)) {
      baseImagePath = candidate1;
    } else if (fs.existsSync(candidate2)) {
      baseImagePath = candidate2;
    }
  }

  // Load and resize base image to 1200x630
  let baseImgBuffer: Buffer;
  try {
    baseImgBuffer = await sharp(baseImagePath)
      .resize(width, height, { fit: 'cover', position: 'right' })
      .toBuffer();
  } catch (e) {
    baseImgBuffer = await sharp(defaultImage)
      .resize(width, height, { fit: 'cover', position: 'right' })
      .toBuffer();
  }

  // Theme configuration
  const theme = CATEGORY_THEMES[article.category] || CATEGORY_THEMES['beginner'];
  const categoryText = article.categoryLabel || theme.label;

  // Title breakdown
  const { badge: titleBadge, mainLines } = splitTitle(article.title);

  // Summary lines (up to 2 lines, 30 chars each)
  const summaryLines = wrapText(article.summary || '', 30, 2);

  // Top 3 tags
  const tags = (article.tags || []).slice(0, 3);

  // SVG elements construction
  const escapedCategory = escapeXml(categoryText);
  const escapedTitleBadge = escapeXml(titleBadge);
  const escapedSummary1 = escapeXml(summaryLines[0] || '');
  const escapedSummary2 = escapeXml(summaryLines[1] || '');

  // Main title SVG lines
  let titleSvgLines = '';
  let yOffset = 0;

  if (escapedTitleBadge) {
    titleSvgLines += `
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="${Math.min(680, escapedTitleBadge.length * 26 + 32)}" height="42" rx="8" fill="${theme.badgeFrom}" fill-opacity="0.25" stroke="${theme.badgeFrom}" stroke-width="1.5" />
        <text x="16" y="28" fill="${theme.border}" font-size="22" font-family="'IPAPGothic', 'IPAゴシック', sans-serif" font-weight="bold">
          【${escapedTitleBadge}】
        </text>
      </g>
    `;
    yOffset += 56;
  }

  mainLines.forEach((line, idx) => {
    const isHighlight = idx === mainLines.length - 1;
    const textColor = isHighlight ? theme.border : '#ffffff';
    titleSvgLines += `
      <text x="0" y="${yOffset + 40}" fill="${textColor}" font-size="38" font-family="'IPAPGothic', 'IPAゴシック', sans-serif" font-weight="bold" letter-spacing="1">
        ${escapeXml(line)}
      </text>
    `;
    yOffset += 54;
  });

  // Summary box Y
  const summaryBoxY = Math.max(395, 150 + yOffset + 15);

  // Tags SVG
  let tagsSvg = '';
  let tagX = 0;
  tags.forEach(tag => {
    const cleanTag = tag.replace(/^#/, '');
    const tagWidth = cleanTag.length * 17 + 42;
    tagsSvg += `
      <g transform="translate(${tagX}, 0)">
        <rect x="0" y="0" width="${tagWidth}" height="34" rx="17" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.2" />
        <text x="${tagWidth / 2}" y="23" fill="#f8fafc" font-size="15" font-family="'IPAPGothic', 'IPAゴシック', sans-serif" font-weight="bold" text-anchor="middle">
          ✓ ${escapeXml(cleanTag)}
        </text>
      </g>
    `;
    tagX += tagWidth + 12;
  });

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Gradient overlay: deep opaque dark tint on left (for text), transparent on right (showing article illustration) -->
      <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0a0307" stop-opacity="0.97" />
        <stop offset="50%" stop-color="#140610" stop-opacity="0.94" />
        <stop offset="72%" stop-color="#190714" stop-opacity="0.80" />
        <stop offset="100%" stop-color="#190714" stop-opacity="0.38" />
      </linearGradient>
      <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${theme.badgeFrom}" />
        <stop offset="100%" stop-color="${theme.badgeTo}" />
      </linearGradient>
    </defs>

    <!-- Dark gradient overlay for text readability -->
    <rect width="${width}" height="${height}" fill="url(#overlayGrad)" />

    <!-- Top & Bottom decorative border lines -->
    <rect x="0" y="0" width="${width}" height="6" fill="url(#catGrad)" />
    <rect x="0" y="${height - 6}" width="${width}" height="6" fill="url(#catGrad)" />

    <!-- Header Section (Category + Brand) -->
    <g transform="translate(60, 52)">
      <!-- Category Badge -->
      <rect x="0" y="0" width="${escapedCategory.length * 20 + 36}" height="36" rx="6" fill="url(#catGrad)" />
      <text x="${(escapedCategory.length * 20 + 36) / 2}" y="24" fill="#ffffff" font-size="18" font-family="'IPAPGothic', 'IPAゴシック', sans-serif" font-weight="bold" text-anchor="middle">
        ${escapedCategory}
      </text>

      <!-- Brand Title -->
      <text x="${escapedCategory.length * 20 + 56}" y="25" fill="#fda4af" font-size="20" font-family="'IPAPGothic', 'IPAゴシック', sans-serif" font-weight="bold">
        飛田ガールズ 公式求人コラム
      </text>
    </g>

    <!-- Main Title Group -->
    <g transform="translate(60, 125)">
      ${titleSvgLines}
    </g>

    <!-- Sub Summary description box -->
    <g transform="translate(60, ${summaryBoxY})">
      <rect x="0" y="0" width="690" height="74" rx="10" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1" />
      <text x="20" y="32" fill="#f1f5f9" font-size="19" font-family="'IPAPGothic', 'IPAゴシック', sans-serif">
        ${escapedSummary1}
      </text>
      <text x="20" y="60" fill="#cbd5e1" font-size="19" font-family="'IPAPGothic', 'IPAゴシック', sans-serif">
        ${escapedSummary2}
      </text>
    </g>

    <!-- Footer: Tags on left, Domain on right -->
    <g transform="translate(60, 545)">
      ${tagsSvg}

      <!-- Right: Domain / Brand -->
      <text x="${width - 120}" y="23" fill="#fda4af" font-size="19" font-family="'IPAPGothic', 'IPAゴシック', sans-serif" font-weight="bold" text-anchor="end">
        tobitashinchi.pages.dev
      </text>
    </g>
  </svg>
  `;

  const fileName = `card_${article.slug}.jpg`;
  const outPath = path.join(outputDir, fileName);

  await sharp(baseImgBuffer)
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(outPath);

  return fileName;
}

async function main() {
  const rootDir = process.cwd();
  const articlesPath = path.join(rootDir, 'data', 'blogArticles.json');
  if (!fs.existsSync(articlesPath)) {
    console.error('blogArticles.json not found!');
    return;
  }

  const articles: BlogArticle[] = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
  console.log(`🎨 Starting generation of custom text-inscribed OGP card images for ${articles.length} articles...`);

  const publicImagesDir = path.join(rootDir, 'public', 'images');
  const srcImagesDir = path.join(rootDir, 'src', 'assets', 'images');
  const distImagesDir = path.join(rootDir, 'dist', 'images');

  fs.mkdirSync(publicImagesDir, { recursive: true });
  fs.mkdirSync(srcImagesDir, { recursive: true });
  if (fs.existsSync(path.join(rootDir, 'dist'))) {
    fs.mkdirSync(distImagesDir, { recursive: true });
  }

  let count = 0;
  for (const article of articles) {
    const fileName = await generateOgCardForArticle(article, publicImagesDir);
    // Copy to src/assets/images and dist/images if exists
    const srcFile = path.join(publicImagesDir, fileName);
    fs.copyFileSync(srcFile, path.join(srcImagesDir, fileName));
    if (fs.existsSync(distImagesDir)) {
      fs.copyFileSync(srcFile, path.join(distImagesDir, fileName));
    }
    count++;
    if (count % 20 === 0 || count === articles.length) {
      console.log(`✅ Generated ${count} / ${articles.length} article card images`);
    }
  }

  console.log(`🎉 Finished generating all ${count} article OGP card images with tailored visuals and Japanese typography!`);
}

main().catch(console.error);
