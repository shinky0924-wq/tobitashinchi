import ARTICLES from './articles.json';

const BOT_USER_AGENTS = [
  'twitterbot',
  'facebookexternalhit',
  'line-poker',
  'slackbot',
  'discordbot',
  'whatsapp',
  'telegrambot',
  'applebot',
  'googlebot',
  'bingbot',
  'linkedinbot'
];

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  // Select random article
  const randomIndex = Math.floor(Math.random() * ARTICLES.length);
  const article = ARTICLES[randomIndex];

  const targetUrl = new URL(`/blog/${article.slug}`, url.origin).toString();
  const absoluteImageUrl = new URL(article.eyeCatch, url.origin).toString();
  const pageTitle = `${article.title} | 飛田ガールズ`;
  const pageDesc = article.summary || `飛田新地のお仕事コラム「${article.title}」`;

  // If request is from human browser, redirect immediately
  if (!isBot(userAgent)) {
    return Response.redirect(targetUrl, 302);
  }

  // If request is from bot (Twitter/X, etc.), return HTML with rich OGP tags
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDesc)}" />
  <link rel="canonical" href="${escapeHtml(targetUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(pageDesc)}" />
  <meta property="og:image" content="${escapeHtml(absoluteImageUrl)}" />
  <meta property="og:url" content="${escapeHtml(request.url)}" />
  <meta property="og:site_name" content="飛田ガールズ" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(pageDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(absoluteImageUrl)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}" />
  <script>window.location.replace("${escapeHtml(targetUrl)}");</script>
</head>
<body style="font-family: sans-serif; padding: 20px; text-align: center;">
  <p>記事へ移動しています... <a href="${escapeHtml(targetUrl)}">${escapeHtml(article.title)}</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}
