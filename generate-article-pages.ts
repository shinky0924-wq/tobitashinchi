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

  // Helper to upsert a meta tag
  const upsertMeta = (propOrName: 'property' | 'name', attrValue: string, content: string) => {
    const regex = new RegExp(`<meta\\s+${propOrName}="${attrValue}"\\s+content=".*?"\\s*\\/?>`, 'i');
    const newTag = `<meta ${propOrName}="${attrValue}" content="${content}" />`;
    if (regex.test(html)) {
      html = html.replace(regex, newTag);
    } else {
      html = html.replace('</head>', `  ${newTag}\n</head>`);
    }
  };

  // Open Graph Tags
  upsertMeta('property', 'og:title', escapedTitle);
  upsertMeta('property', 'og:description', escapedDesc);
  upsertMeta('property', 'og:url', escapedUrl);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:site_name', '飛田ガールズ');
  upsertMeta('property', 'og:image', escapedImage);
  upsertMeta('property', 'og:image:secure_url', escapedImage);
  upsertMeta('property', 'og:image:type', 'image/jpeg');
  upsertMeta('property', 'og:image:width', '1200');
  upsertMeta('property', 'og:image:height', '630');

  // Twitter Card Tags
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', escapedTitle);
  upsertMeta('name', 'twitter:description', escapedDesc);
  upsertMeta('name', 'twitter:image', escapedImage);
  upsertMeta('name', 'twitter:image:alt', escapedTitle);
  upsertMeta('name', 'twitter:site', '@tobitagirls');

  return html;
}

export function toAbsoluteImageUrl(imagePath: string, domain = 'https://tobitashinchi.pages.dev'): string {
  if (!imagePath) {
    return `${domain}/images/tobita_bright_future_1789106917071.jpg`;
  }
  let clean = imagePath.trim();
  if (clean.includes('tobitashinchi-recruit.com')) {
    clean = clean.replace(/https?:\/\/tobitashinchi-recruit\.com/g, domain);
  }
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
  // Default to tobitashinchi.pages.dev where Cloudflare Pages hosts the images
  const baseDomain = process.env.DEPLOY_DOMAIN || 'https://tobitashinchi.pages.dev';

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

  console.log(`🚀 Pre-rendering static HTML pages for ${articles.length} articles for X / OGP cards (Base Domain: ${baseDomain})...`);

  // 1. Generate /blog/index.html AND /blog.html
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
  // Both directory index.html and direct .html for instant zero-redirect serving on Cloudflare Pages
  fs.writeFileSync(path.join(blogListDir, 'index.html'), blogListHtml, 'utf-8');
  fs.writeFileSync(path.join(distDir, 'blog.html'), blogListHtml, 'utf-8');

  // 2. Generate each /blog/:slug/index.html AND /blog/:slug.html
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

    // Write both /blog/slug/index.html AND /blog/slug.html
    // This allows Cloudflare Pages to serve both /blog/slug and /blog/slug/ without any 308 redirect
    fs.writeFileSync(path.join(articleDir, 'index.html'), articleHtml, 'utf-8');
    fs.writeFileSync(path.join(distDir, 'blog', `${article.slug}.html`), articleHtml, 'utf-8');
    count++;
  }

  console.log(`✅ Successfully generated ${count} article static HTML pages (both .html and /index.html) with full X (Twitter) Card & OGP meta tags in dist/blog/!`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Failed to generate article pages:', err);
    process.exit(1);
  });
}
