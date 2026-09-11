import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BLOG_CATEGORIES, BlogArticle, getValidArticleEyeCatch } from '../blogData';
import { ArticleCardImage } from './ArticleCardImage';
import { BookOpen, Calendar, Clock, Search, ArrowLeft, Tag, MessageCircle, ChevronRight, ChevronLeft, Sparkles, Send, ShieldCheck, HeartHandshake } from 'lucide-react';

interface BlogSectionProps {
  articles: BlogArticle[];
  selectedSlug: string | null;
  onSelectSlug: (slug: string | null) => void;
  onCtaclick: () => void;
  onInjectedScroll: (message: string) => void;
  onSimulatorClick: () => void;
}

export default function BlogSection({ articles, selectedSlug, onSelectSlug, onCtaclick, onInjectedScroll, onSimulatorClick }: BlogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ARTICLES_PER_PAGE = 9;

  const isLoading = useMemo(() => {
    return !!selectedSlug && articles.length === 0;
  }, [selectedSlug, articles]);

  // Filter & Search articles
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE));
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredArticles.slice(start, start + ARTICLES_PER_PAGE);
  }, [filteredArticles, currentPage, ARTICLES_PER_PAGE]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const listEl = document.getElementById('blog-list');
    if (listEl) {
      listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentArticle = useMemo(() => {
    if (!selectedSlug) return null;
    return articles.find(a => a.slug === selectedSlug) || null;
  }, [articles, selectedSlug]);

  // Dynamically update document title and OGP/Twitter meta tags based on the active article
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (currentArticle) {
      const pageTitle = `${currentArticle.title} | 飛田ガールズ`;
      document.title = pageTitle;

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', currentArticle.summary);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', pageTitle);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', currentArticle.summary);

      const eyeCatch = getValidArticleEyeCatch(currentArticle);
      const origin = typeof window !== 'undefined' ? (window.location.hostname.includes('localhost') ? 'https://tobitashinchi-recruit.com' : window.location.origin) : 'https://tobitashinchi-recruit.com';
      const fullImageUrl = eyeCatch.startsWith('http') ? eyeCatch : `${origin}${eyeCatch.startsWith('/') ? '' : '/'}${eyeCatch}`;

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', fullImageUrl);

      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', `${origin}/blog/${currentArticle.slug}`);

      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute('content', pageTitle);

      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute('content', currentArticle.summary);

      const twImage = document.querySelector('meta[name="twitter:image"]');
      if (twImage) twImage.setAttribute('content', fullImageUrl);

      const twCard = document.querySelector('meta[name="twitter:card"]');
      if (twCard) twCard.setAttribute('content', 'summary_large_image');
    } else {
      const defaultTitle = '飛田新地求人、飛田新地バイトなら【飛田ガールズ】女の子のためのサイト・高収入募集';
      const defaultDesc = '【飛田新地求人の公式窓口】飛田新地で女の子の求人・お仕事なら「飛田ガールズ」。未経験から高収入（日給3万〜8万円）を稼げる料亭直営グループ公式採用。仲介料ゼロ・全額日払い手渡しで安心安全に働けます。24時間いつでもお気軽にご相談・ご応募いただけます。';
      document.title = defaultTitle;

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', defaultDesc);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', defaultTitle);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', defaultDesc);

      const origin = typeof window !== 'undefined' ? (window.location.hostname.includes('localhost') ? 'https://tobitashinchi-recruit.com' : window.location.origin) : 'https://tobitashinchi-recruit.com';
      const defaultImage = `${origin}/images/tobita_bright_future_1789106917071.jpg`;

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', defaultImage);

      const twImage = document.querySelector('meta[name="twitter:image"]');
      if (twImage) twImage.setAttribute('content', defaultImage);
    }
  }, [currentArticle]);

  // Back to article list
  const handleBackToList = () => {
    onSelectSlug(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArticle = (slug: string) => {
    onSelectSlug(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCtaInArticle = (articleTitle: string) => {
    onInjectedScroll(`コラム「${articleTitle}」を読みました。求人について詳しく話を聞きたいです！`);
  };

  // Helper for generating eye-catch gradient colors based on category
  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'beginner': return 'from-pink-400 to-rose-500';
      case 'salary': return 'from-amber-400 to-orange-500';
      case 'security': return 'from-violet-400 to-purple-600';
      case 'lifestyle': return 'from-teal-400 to-emerald-500';
      case 'onboarding': return 'from-cyan-400 to-blue-500';
      default: return 'from-pink-400 to-rose-500';
    }
  };

  const formatEyeCatchUrl = (url: string) => {
    if (!url) return '/images/col_beginner_guide_art_1787803245812.jpg';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    let clean = url.trim();
    if (clean.startsWith('/src/assets/images/')) {
      clean = clean.replace('/src/assets/images/', '/images/');
    } else if (clean.startsWith('src/assets/images/')) {
      clean = '/' + clean.replace('src/assets/images/', 'images/');
    } else if (clean.startsWith('/assets/images/')) {
      clean = clean.replace('/assets/images/', '/images/');
    } else if (clean.startsWith('assets/images/')) {
      clean = '/' + clean.replace('assets/images/', 'images/');
    } else if (!clean.startsWith('/')) {
      clean = '/images/' + clean;
    }
    return clean;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <AnimatePresence mode="wait">
        {!selectedSlug ? (
          /* ==========================================
             1. ARTICLE LIST VIEW
             ========================================== */
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            id="blog-list"
          >
            {/* Header / Intro */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-secondary mb-3">
                <BookOpen size={13} />
                お仕事コラム & ブログ
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-[#2c1a1e]">
                安心してお仕事を始めるための<br />
                <span className="text-secondary relative inline-block">
                  完全解説ガイド
                  <span className="absolute left-0 bottom-1 w-full h-2 bg-pink-100 -z-10 rounded-full" />
                </span>
              </h1>
              <p className="mt-4 text-base text-on-surface-variant leading-relaxed">
                飛田新地での働き方、リアルな給与システム、身バレ防止の徹底的な対策、充実の個室寮や託児所補助など、気になるすべての情報を当店女性サポートスタッフが丁寧にお答えします。
              </p>
            </div>

            {/* Controls (Search & Category Filters) */}
            <div className="bg-surface-container rounded-3xl p-6 mb-10 shadow-sm border border-outline-variant">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Search Field */}
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="キーワード、タグで検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-on-surface transition-all placeholder:text-[#5e474c]/50"
                  />
                </div>

                {/* Info summary */}
                <div className="text-xs font-sans text-on-surface-variant bg-white px-3 py-1.5 rounded-full border border-outline-variant">
                  記事数: <span className="font-bold text-secondary font-mono">{filteredArticles.length}</span> / <span className="font-mono">{articles.length}</span>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-2 mt-5">
                {BLOG_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-medium transition-all cursor-pointer ${
                      selectedCategory === category.id
                        ? 'bg-secondary text-white shadow-sm shadow-secondary/25 scale-102'
                        : 'bg-white hover:bg-rose-50 text-on-surface border border-outline-variant'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Grid */}
            {filteredArticles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedArticles.map((article, idx) => (
                    <motion.article
                      key={article.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                      onClick={() => handleSelectArticle(article.slug)}
                      className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-outline-variant shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
                    >
                      {/* Eyecatch Image */}
                      <div className="relative h-48 bg-rose-50/50 flex items-center justify-center overflow-hidden">
                        <ArticleCardImage
                          src={getValidArticleEyeCatch(article)}
                          alt={article.title}
                          category={article.category}
                          categoryLabel={article.categoryLabel}
                          className="w-full h-full"
                        />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-secondary shadow-xs z-10">
                          {article.categoryLabel}
                        </div>
                      </div>

                      {/* Meta & Title */}
                      <div className="flex-grow p-6 flex flex-col">
                        <div className="flex items-center gap-4 text-xs text-on-surface-variant font-sans mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            <span className="font-mono">{(article.publishedAt || '').replace(/-/g, '.')}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={13} />
                            読了<span className="font-mono">{article.readTime}</span>
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#2c1a1e] leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                          {article.title}
                        </h3>

                        <p className="mt-3 text-sm text-on-surface-variant line-clamp-3 leading-relaxed">
                          {article.summary}
                        </p>

                        {/* Tags */}
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {article.tags?.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-secondary border border-rose-100">
                              #{tag}
                            </span>
                          )) || null}
                        </div>

                        {/* Author */}
                        <div className="mt-6 pt-4 border-t border-rose-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl w-7 h-7 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                              {article.author?.avatar || '👩‍💼'}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-on-surface leading-none">{article.author?.name || 'スタッフ'}</p>
                              <p className="text-[10px] text-on-surface-variant mt-0.5 leading-none">{article.author?.role || 'サポートスタッフ'}</p>
                            </div>
                          </div>
                          <span className="text-secondary group-hover:translate-x-1 transition-transform">
                            <ChevronRight size={16} />
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-outline-variant bg-white text-on-surface hover:bg-rose-50 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                      <span>前へ</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first, last, current, and surrounding pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => handlePageChange(page)}
                            className={`min-w-10 h-10 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${
                              currentPage === page
                                ? 'bg-secondary text-white shadow-sm shadow-secondary/30 scale-105'
                                : 'bg-white border border-outline-variant text-on-surface hover:bg-rose-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-1 text-on-surface-variant font-bold">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-outline-variant bg-white text-on-surface hover:bg-rose-50 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>次へ</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-outline-variant">
                <Search size={40} className="mx-auto text-[#5e474c]/30 mb-3" />
                <h3 className="text-lg font-semibold text-on-surface">該当するコラムが見つかりませんでした</h3>
                <p className="text-sm text-on-surface-variant mt-1">別のキーワードやカテゴリーでお試しください。</p>
                <button
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-2xl text-sm font-semibold cursor-pointer shadow-xs hover:bg-opacity-90"
                >
                  フィルターをクリア
                </button>
              </div>
            )}
          </motion.div>
        ) : isLoading ? (
          /* ==========================================
             LOADING STATE
             ========================================== */
          <motion.div
            key="loading-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-12 h-12 border-4 border-rose-100 border-t-secondary rounded-full animate-spin mb-4" />
            <p className="text-on-surface-variant text-sm font-sans">コラムを読み込んでいます...</p>
          </motion.div>
        ) : !currentArticle ? (
          /* ==========================================
             NOT FOUND STATE
             ========================================== */
          <motion.div
            key="not-found-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto text-center py-16 px-6 bg-white border border-rose-100 rounded-3xl shadow-xl my-12"
          >
            <div className="w-16 h-16 bg-rose-50 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#2c1a1e] mb-3">コラムが見つかりませんでした</h2>
            <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
              お探しの記事は削除されたか、URLが変更された可能性があります。
            </p>
            <button
              onClick={handleBackToList}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              コラム一覧に戻る
            </button>
          </motion.div>
        ) : (
          /* ==========================================
             2. ARTICLE DETAIL VIEW
             ========================================== */
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            {/* Back Navigation */}
            <button
              onClick={handleBackToList}
              className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-on-surface hover:text-secondary transition-colors cursor-pointer py-2"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              コラム一覧へ戻る
            </button>

            {/* Eyecatch hero */}
            <div className="h-56 md:h-72 rounded-4xl bg-rose-50/50 flex flex-col items-center justify-center relative overflow-hidden shadow-xs border border-outline-variant">
              <ArticleCardImage
                src={getValidArticleEyeCatch(currentArticle!)}
                alt={currentArticle!.title}
                category={currentArticle!.category}
                categoryLabel={currentArticle!.categoryLabel}
                className="w-full h-full"
                isDetailHero={true}
              />
              <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs font-bold text-secondary shadow-xs z-10">
                {currentArticle!.categoryLabel}
              </div>
            </div>

            {/* Article Header info */}
            <div className="mt-8 border-b border-rose-100 pb-6">
              <div className="flex items-center gap-4 text-xs font-sans text-on-surface-variant mb-4">
                <span className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-lg">
                  <Calendar size={13} />
                  <span className="font-mono">{(currentArticle!.publishedAt || '').replace(/-/g, '.')}</span>
                </span>
                <span className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-lg">
                  <Clock size={13} />
                  読了<span className="font-mono">{currentArticle!.readTime}</span>
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold leading-snug text-[#2c1a1e] tracking-tight">
                {currentArticle!.title}
              </h1>

              {/* Author Card inside detail */}
              <div className="mt-6 flex items-center justify-between p-4 bg-surface-container rounded-3xl border border-outline-variant">
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-10 h-10 bg-white rounded-full flex items-center justify-center border border-outline-variant shadow-2xs">
                    {currentArticle!.author?.avatar || '👩‍💼'}
                  </span>
                  <div>
                    <div className="text-xs text-on-surface-variant">この記事の監修スタッフ</div>
                    <div className="text-sm font-bold text-on-surface">{currentArticle!.author?.name || 'スタッフ'}</div>
                  </div>
                </div>
                <div className="text-xs text-on-surface-variant bg-white/80 border border-outline-variant px-3 py-1.5 rounded-full">
                  {currentArticle!.author?.role || 'サポートスタッフ'}
                </div>
              </div>
            </div>

            {/* Article Content Render */}
            <div className="mt-8 space-y-6 text-[#2c1a1e] text-base md:text-lg leading-relaxed font-sans">
              {(currentArticle!.content || []).map((block, idx) => {
                switch (block.type) {
                  case 'p':
                    return (
                      <p key={idx} className="whitespace-pre-line text-on-surface leading-relaxed py-1">
                        {block.text}
                      </p>
                    );
                  case 'h2':
                    return (
                      <h2 key={idx} className="text-xl md:text-2xl font-bold text-[#2c1a1e] mt-10 mb-4 pt-4 pb-2 border-b-2 border-secondary/20 flex items-center gap-2">
                        <span className="inline-block w-1.5 h-6 bg-secondary rounded-full" />
                        {block.text}
                      </h2>
                    );
                  case 'h3':
                    return (
                      <h3 key={idx} className="text-lg md:text-xl font-bold text-[#2c1a1e] mt-8 mb-3 bg-rose-50 px-4 py-2 rounded-xl border-l-4 border-secondary">
                        {block.text}
                      </h3>
                    );
                  case 'list':
                    return (
                      <ul key={idx} className="space-y-3 bg-surface-container-low p-6 rounded-3xl border border-outline-variant my-6">
                        {block.items?.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2.5 text-sm md:text-base">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-100 text-secondary text-xs font-bold mt-0.5 shrink-0">
                              {itemIdx + 1}
                            </span>
                            <span className="text-on-surface-variant leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  case 'qna':
                    return (
                      <div key={idx} className="bg-white rounded-3xl border-2 border-secondary/20 overflow-hidden my-8 shadow-xs">
                        <div className="bg-gradient-to-r from-secondary to-pink-500 text-white px-5 py-3 font-bold flex items-center gap-2">
                          <ShieldCheck size={18} />
                          {block.question}
                        </div>
                        <div className="p-5 text-sm md:text-base text-on-surface-variant leading-relaxed bg-surface-container-low">
                          {block.answer || block.text}
                        </div>
                      </div>
                    );
                  case 'cta':
                    return null;
                  default:
                    return null;
                }
              })}
            </div>

            {/* Article Footer & Navigator */}
            <div className="mt-12 pt-8 border-t border-rose-100 flex flex-col md:flex-row justify-between gap-6 items-center">
              <div className="flex flex-wrap gap-2">
                {currentArticle!.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container rounded-full text-xs text-secondary font-medium border border-outline-variant">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={handleBackToList}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-outline-variant rounded-2xl text-sm font-bold text-on-surface hover:bg-rose-50 transition-all cursor-pointer"
              >
                <ArrowLeft size={15} />
                コラム一覧に戻る
              </button>
            </div>

            {/* Banner block */}
            <div className="mt-16 bg-[#2c1a1e] text-white rounded-4xl p-8 text-center relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-20 blur-3xl rounded-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500 opacity-25 blur-3xl rounded-full" />
              <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
                最短本日スタート！1日体験入店随時受付中
              </h3>
              <p className="text-xs md:text-sm text-pink-200/90 max-w-lg mx-auto leading-relaxed mb-6">
                体験入店は「面接＋見学＋1日お仕事＋その日にお給料全額手渡し」がすべて1日で完了する安心コースです。合わないと感じたらその場でやめても全然OK！
              </p>
              <div className="flex justify-center items-center">
                <button
                  onClick={() => handleCtaInArticle(currentArticle!.title)}
                  className="w-full sm:w-auto max-w-md bg-[#06c755] hover:bg-[#05b04b] text-white px-12 py-4 rounded-2xl font-bold text-base shadow-lg shadow-[#06c755]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  LINEでお問い合わせ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
