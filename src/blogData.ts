import blogArticlesJson from '../data/blogArticles.json';

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  category: 'beginner' | 'salary' | 'security' | 'lifestyle' | 'onboarding';
  categoryLabel: string;
  publishedAt: string;
  readTime: string;
  summary: string;
  eyeCatch: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  content: {
    type: 'p' | 'h2' | 'h3' | 'list' | 'cta' | 'qna';
    text?: string;
    items?: string[];
    question?: string;
    answer?: string;
  }[];
  tags: string[];
}

export const BLOG_CATEGORIES = [
  { id: 'all', label: 'すべて' },
  { id: 'beginner', label: '未経験者向け' },
  { id: 'salary', label: '給与・待遇' },
  { id: 'security', label: '安心・身バレ対策' },
  { id: 'lifestyle', label: '生活・働き方' },
  { id: 'onboarding', label: '面接・お仕事の流れ' }
];

export const BLOG_ARTICLES: BlogArticle[] = blogArticlesJson as BlogArticle[];

export function getValidArticleEyeCatch(art: { id?: string | number; slug?: string; category?: string; eyeCatch?: string }): string {
  // If slug matches, prioritize the curated default image
  if (art && art.slug) {
    const slugMatch = BLOG_ARTICLES.find(d => d.slug === art.slug);
    if (slugMatch && slugMatch.eyeCatch) {
      return slugMatch.eyeCatch;
    }
  }

  // If art matches a default article ID, prioritize the curated default image
  if (art && art.id !== undefined) {
    const defaultMatch = BLOG_ARTICLES.find(d => String(d.id) === String(art.id));
    if (defaultMatch && defaultMatch.eyeCatch) {
      return defaultMatch.eyeCatch;
    }
  }

  if (art && art.eyeCatch) {
    const ec = art.eyeCatch.trim();
    if (ec.startsWith('http://') || ec.startsWith('https://') || ec.startsWith('data:') || ec.startsWith('/images/')) {
      return ec;
    }
    const filename = ec.split('/').pop()?.split('?')[0];
    if (filename) {
      return `/images/${filename}`;
    }
  }

  // Find fallback from category
  const categoryMatch = BLOG_ARTICLES.find(d => d.category === art?.category);
  if (categoryMatch && categoryMatch.eyeCatch) {
    return categoryMatch.eyeCatch;
  }

  return '/images/tobita_bright_future_1789106917071.jpg';
}

export function getValidArticleCardImage(art: { id?: string | number; slug?: string; category?: string; eyeCatch?: string }): string {
  if (art && art.slug) {
    return `/images/card_${art.slug}.jpg`;
  }
  return getValidArticleEyeCatch(art);
}

const BLOG_DATA_VERSION = '20260911_tobita_distinct_images_v4';

export function getStoredArticles(): BlogArticle[] {
  if (typeof window === 'undefined') return BLOG_ARTICLES;
  try {
    if (localStorage.getItem('custom_blog_articles_version') !== BLOG_DATA_VERSION) {
      localStorage.setItem('custom_blog_articles_version', BLOG_DATA_VERSION);
      localStorage.setItem('custom_blog_articles', JSON.stringify(BLOG_ARTICLES));
      return BLOG_ARTICLES;
    }
    const stored = localStorage.getItem('custom_blog_articles');
    if (!stored) {
      return BLOG_ARTICLES;
    }
    const rawArticles = JSON.parse(stored) as BlogArticle[];
    if (rawArticles.length === 0) return BLOG_ARTICLES;

    // もし古い画像への参照、または絵文字、正しくない画像パス、古いスラッグがあれば、最新のオリジナル画像や正しいスラッグに自動的に置換する
    const customArticles = rawArticles.map(art => {
      const defaultMatch = BLOG_ARTICLES.find(d => String(d.id) === String(art.id));
      if (defaultMatch) {
        return {
          ...art,
          eyeCatch: defaultMatch.eyeCatch,
          slug: defaultMatch.slug
        };
      }
      return {
        ...art,
        eyeCatch: getValidArticleEyeCatch(art)
      };
    });

    // もしデフォルトの新規記事がローカルストレージに存在しない場合、自動的にマージする
    const customIds = new Set(customArticles.map(a => String(a.id)));
    let hasNewDefault = false;
    const mergedArticles = [...customArticles];
    for (const defaultArt of BLOG_ARTICLES) {
      if (!customIds.has(String(defaultArt.id))) {
        mergedArticles.push(defaultArt);
        hasNewDefault = true;
      }
    }
    if (hasNewDefault || JSON.stringify(rawArticles) !== JSON.stringify(customArticles)) {
      // IDの数値順に並べ替えてソート
      mergedArticles.sort((a, b) => {
        const idA = parseInt(a.id, 10) || 0;
        const idB = parseInt(b.id, 10) || 0;
        return idA - idB;
      });
      localStorage.setItem('custom_blog_articles', JSON.stringify(mergedArticles));
      return mergedArticles;
    }

    return customArticles;
  } catch (e) {
    console.error('Error parsing custom blog articles:', e);
    return BLOG_ARTICLES;
  }
}

export function saveArticles(articles: BlogArticle[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('custom_blog_articles', JSON.stringify(articles));
  } catch (e) {
    console.error('Error saving blog articles to localStorage:', e);
  }
}
