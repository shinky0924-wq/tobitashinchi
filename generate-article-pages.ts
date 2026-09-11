import * as fs from 'fs';
import * as path from 'path';

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  categoryLabel?: string;
  publishedAt?: string;
  summary: string;
  eyeCatch: string;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function injectMetaIntoHtml(baseHtml: string, meta: {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  type?: 'website' | 'article';
}): string {
  let html = baseHtml;
  const escapedTitle = escapeHtml(meta.title);
  const escapedDesc = escapeHtml(meta.description);
  const escapedImage = escapeHtml(meta.imageUrl);
  const escapedUrl = escapeHtml(meta.url);
  const type = meta.type || 'article';

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
    html = html.replace('</head>', `  <meta property="og:title" content="${escapedTitle}" />\n</head>`);
  }

  // 5. Replace or inject og:description
  if (/property="og:description"/i.test(html)) {
    html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escapedDesc}" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:description" content="${escapedDesc}" />\n</head>`);
  }

  // 6. Replace or inject og:image
  if (/property="og:image"\s+content/i.test(html)) {
    html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, `<meta property="og:image" content="${escapedImage}" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:image" content="${escapedImage}" />\n</head>`);
  }

  // 7. Replace or inject og:url
  if (/property="og:url"/i.test(html)) {
    html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, `<meta property="og:url" content="${escapedUrl}" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:url" content="${escapedUrl}" />\n</head>`);
  }

  // 8. Replace or inject og:type
  if (/property="og:type"/i.test(html)) {
    html = html.replace(/<meta\s+property="og:type"\s+content=".*?"\s*\/?>/i, `<meta property="og:type" content="${type}" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:type" content="${type}" />\n</head>`);
  }

  // 9. Replace or inject twitter:card
  if (/name="twitter:card"/i.test(html)) {
    html = html.replace(/<meta\s+name="twitter:card"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:card" content="summary_large_image" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:card" content="summary_large_image" />\n</head>`);
  }

  // 10. Replace or inject twitter:title
  if (/name="twitter:title"/i.test(html)) {
    html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${escapedTitle}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:title" content="${escapedTitle}" />\n</head>`);
  }

  // 11. Replace or inject twitter:description
  if (/name="twitter:description"/i.test(html)) {
    html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${escapedDesc}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:description" content="${escapedDesc}" />\n</head>`);
  }

  // 12. Replace or inject twitter:image
  if (/name="twitter:image"/i.test(html)) {
    html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${escapedImage}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:image" content="${escapedImage}" />\n</head>`);
  }

  return html;
}

export function toAbsoluteImageUrl(imagePath: string, domain = 'https://tobitashinchi-recruit.com'): string {
  if (!imagePath) {
    return `${domain}/images/tobita_bright_future_1789106917071.jpg`;
  }
  const clean = imagePath.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  const normalizedPath = clean.startsWith('/') ? clean : `/${clean}`;
  return `${domain}${normalizedPath}`;
}

async function main() {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');
  const articlesFile = path.join(rootDir, 'data', 'blogArticles.json');
  const baseDomain = 'https://tobitashinchi-recruit.com';

  if (!fs.existsSync(distDir)) {
    console.warn('⚠️ dist directory not found. Please run vite build first.');
    return;
  }

  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.warn('⚠️ dist/index.html not found.');
    return;
  }

  const baseHtml = fs.readFileSync(indexPath, 'utf-8');

  let articles: BlogArticle[] = [];
  if (fs.existsSync(articlesFile)) {
    try {
      articles = JSON.parse(fs.readFileSync(articlesFile, 'utf-8'));
    } catch (e) {
      console.error('Error parsing blogArticles.json:', e);
    }
  }

  console.log(`🚀 Pre-rendering static HTML pages for ${articles.length} articles for X / OGP cards...`);

  // 1. Generate /blog/index.html
  const blogListDir = path.join(distDir, 'blog');
  if (!fs.existsSync(blogListDir)) {
    fs.mkdirSync(blogListDir, { recursive: true });
  }

  const blogListHtml = injectMetaIntoHtml(baseHtml, {
    title: 'お仕事コラム一覧 | 飛田ガールズ【公式求人】',
    description: '飛田新地のお仕事コラム・お役立ち情報一覧。給料システム、面接対策、身バレ防止、未経験からの働き方などを詳しく解説しています。',
    imageUrl: `${baseDomain}/images/col_ryotei_flow_1789107427433.jpg`,
    url: `${baseDomain}/blog`,
    type: 'website'
  });
  fs.writeFileSync(path.join(blogListDir, 'index.html'), blogListHtml, 'utf-8');

  // 2. Generate each /blog/:slug/index.html
  let count = 0;
  for (const article of articles) {
    if (!article.slug) continue;
    const articleDir = path.join(distDir, 'blog', article.slug);
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    const fullImageUrl = toAbsoluteImageUrl(article.eyeCatch, baseDomain);
    const articleUrl = `${baseDomain}/blog/${article.slug}`;
    const articleTitle = `${article.title} | 飛田ガールズ`;
    const articleDesc = article.summary || `${article.title}についての詳しい解説記事です。`;

    const articleHtml = injectMetaIntoHtml(baseHtml, {
      title: articleTitle,
      description: articleDesc,
      imageUrl: fullImageUrl,
      url: articleUrl,
      type: 'article'
    });

    fs.writeFileSync(path.join(articleDir, 'index.html'), articleHtml, 'utf-8');
    count++;
  }

  console.log(`✅ Successfully generated ${count} article static HTML pages with full X (Twitter) Card & OGP meta tags in dist/blog/!`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Failed to generate article pages:', err);
    process.exit(1);
  });
}
