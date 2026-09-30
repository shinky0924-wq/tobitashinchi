/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import AboutTobita from './components/AboutTobita';
import JobWorkflow from './components/JobWorkflow';
import FAQ from './components/FAQ';
import Testimonials from './components/Testimonials';
import JobDetails from './components/JobDetails';
import Flow from './components/Flow';
import JobRequirements from './components/JobRequirements';
import ConsultationForm from './components/ConsultationForm';
import Footer from './components/Footer';
import BlogSection from './components/BlogSection';
import { getStoredArticles, BlogArticle, BLOG_ARTICLES, getValidArticleEyeCatch } from './blogData';
import { getStoredSiteContent, SiteContent, DEFAULT_SITE_CONTENT } from './siteContent';
import { getBlogArticlesFromFirestore, getSiteContentFromFirestore, saveBlogArticlesToFirestore, saveSiteContentToFirestore } from './firebase';

const AdminPanel = lazy(() => import('./components/AdminPanel'));

export default function App() {
  const [path, setPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', newPath);
      setPath(newPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  let currentTab: 'recruit' | 'blog' | 'admin' = 'recruit';
  let selectedSlug: string | null = null;

  if (path === '/admin') {
    currentTab = 'admin';
  } else if (path.startsWith('/blog')) {
    currentTab = 'blog';
    const match = path.match(/^\/blog\/([^/]+)/);
    if (match) {
      selectedSlug = match[1];
    }
  }

  const setCurrentTab = (tab: 'recruit' | 'blog' | 'admin') => {
    if (tab === 'admin') {
      navigate('/admin');
    } else if (tab === 'blog') {
      navigate('/blog');
    } else {
      navigate('/');
    }
  };

  // State
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [injectedMessage, setInjectedMessage] = useState<string>('');
  const [blogArticles, setBlogArticles] = useState<BlogArticle[]>(() => {
    const initial = getStoredArticles();
    return initial.map(art => ({
      ...art,
      eyeCatch: getValidArticleEyeCatch(art)
    }));
  });
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('creator') === 'tobita' || params.get('admin') === 'true') {
        setIsAdminMode(true);
      }
    } catch (e) {
      console.warn('URL parsing failed', e);
    }
  }, []);

  const fetchArticles = async () => {
    try {
      // 1. Try to fetch from Firestore first
      const firestoreArticles = await getBlogArticlesFromFirestore();
      if (firestoreArticles && firestoreArticles.length > 0) {
        const flagshipSlugs = new Set([
          'tobitashinchi-beginner-guide',
          'tobitashinchi-salary-system',
          'tobitashinchi-privacy-guide',
          'tobitashinchi-housing-support',
          'tobitashinchi-interview-guide',
          'tobitashinchi-trial-guide',
          'tobitashinchi-merits-and-demerits',
          'tobitashinchi-main-vs-seishun-street',
          'tobitashinchi-safety-rules-faq',
          'tobitashinchi-shift-workstyle-guide'
        ]);
        const customNonFlagship = firestoreArticles.filter(a => !flagshipSlugs.has(a.slug));
        const flagships = BLOG_ARTICLES.filter(a => flagshipSlugs.has(a.slug));
        const combined = [...flagships, ...customNonFlagship];
        const validatedArticles = combined.map(art => ({
          ...art,
          eyeCatch: getValidArticleEyeCatch(art)
        }));
        setBlogArticles(validatedArticles);
        return;
      }

      // 2. Fallback to API if not in Firestore
      const res = await fetch('/api/cms/articles');
      if (res.ok) {
        const data = await res.json();
        const validatedArticles = (data as BlogArticle[]).map(art => ({
          ...art,
          eyeCatch: getValidArticleEyeCatch(art)
        }));
        setBlogArticles(validatedArticles);
      } else {
        setBlogArticles(getStoredArticles());
      }
    } catch (e) {
      setBlogArticles(getStoredArticles());
    }
  };

  const fetchSiteContent = async () => {
    try {
      // 1. Try to fetch from Firestore first
      const firestoreData = await getSiteContentFromFirestore();
      if (firestoreData) {
        // Sanitize any outdated agency-like strings from firestoreData
        if (firestoreData.hero?.descriptionLine1?.includes('お店選び') || firestoreData.hero?.descriptionLine1?.includes('お店探し')) {
          delete firestoreData.hero.descriptionLine1;
        }
        if (firestoreData.consultation?.description?.includes('お店探し') || firestoreData.consultation?.description?.includes('お店選び')) {
          delete firestoreData.consultation.description;
        }

        // Merge with latest default content to preserve new direct-recruitment copywriting
        const merged = {
          ...DEFAULT_SITE_CONTENT,
          ...firestoreData,
          hero: { ...DEFAULT_SITE_CONTENT.hero, ...(firestoreData.hero || {}) },
          concerns: { ...DEFAULT_SITE_CONTENT.concerns, ...(firestoreData.concerns || {}) },
          reasons: { ...DEFAULT_SITE_CONTENT.reasons, ...(firestoreData.reasons || {}) },
          jobs: { ...DEFAULT_SITE_CONTENT.jobs, ...(firestoreData.jobs || {}) },
          flow: { ...DEFAULT_SITE_CONTENT.flow, ...(firestoreData.flow || {}) },
          faq: { ...DEFAULT_SITE_CONTENT.faq, ...(firestoreData.faq || {}) },
          consultation: { ...DEFAULT_SITE_CONTENT.consultation, ...(firestoreData.consultation || {}) }
        };
        setSiteContent(merged);
        return;
      }

      // 2. Fallback to API if not in Firestore
      const res = await fetch('/api/cms/site');
      if (res.ok) {
        const data = await res.json();
        if (data.hero?.descriptionLine1?.includes('お店選び') || data.hero?.descriptionLine1?.includes('お店探し')) {
          delete data.hero.descriptionLine1;
        }
        if (data.consultation?.description?.includes('お店探し') || data.consultation?.description?.includes('お店選び')) {
          delete data.consultation.description;
        }
        setSiteContent({ ...DEFAULT_SITE_CONTENT, ...data });
      } else {
        setSiteContent(getStoredSiteContent());
      }
    } catch (e) {
      setSiteContent(getStoredSiteContent());
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchSiteContent();
  }, []);

  const handleRefreshBlog = () => {
    fetchArticles();
  };

  const handleRefreshSiteContent = () => {
    fetchSiteContent();
  };

  const handleScrollToForm = () => {
    if (currentTab !== 'recruit') {
      setCurrentTab('recruit');
      setTimeout(() => {
        const target = document.getElementById('consultation');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } else {
      const target = document.getElementById('consultation');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (target) {
      const offsetHeader = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offsetHeader;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleInjectedScroll = (message: string) => {
    setInjectedMessage(message);
    navigate('/');
    
    setTimeout(() => {
      const target = document.getElementById('consultation');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleClearInjected = () => {
    setInjectedMessage('');
  };

  const handleScrollToSimulator = () => {
    navigate('/');
    setTimeout(() => {
      handleScrollToSection('salary');
    }, 150);
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-rose-100 selection:text-secondary flex flex-col font-sans antialiased text-[#1b1c1c]">
      {/* Navigation */}
      <Header 
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onCtaclick={handleScrollToForm} 
        onScrollToSection={handleScrollToSection}
        isAdminMode={isAdminMode}
      />

      {/* Main Layout Area */}
      <main className="flex-grow pt-16">
        <AnimatePresence mode="wait">
          {currentTab === 'recruit' ? (
            /* ==========================================
               RECRUITING LANDING PAGE (TAB)
               ========================================== */
            <motion.div
              key="recruit-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {/* 1. Hero Section (ファーストビュー + 人気コラムおすすめ5選) */}
              <Hero 
                content={siteContent.hero} 
                onCtaclick={handleScrollToForm} 
                onBlogClick={() => {
                  setCurrentTab('blog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                articles={blogArticles}
                onArticleClick={(slug) => {
                  navigate(`/blog/${slug}`);
                }}
              />

              {/* 2. 飛田新地とは？ */}
              <div id="about">
                <AboutTobita />
              </div>

              {/* 4. お仕事内容と1日の流れ */}
              <div id="job-content">
                <JobWorkflow />
              </div>

              {/* 5. 飛田新地のお給料＆待遇 ＋ 給与シミュレーター */}
              <div id="salary">
                <JobDetails content={siteContent.jobs} onCtaclickWithData={handleInjectedScroll} />
              </div>

              {/* 6. よくある Q&A */}
              <div id="faq">
                <FAQ content={siteContent.faq} />
              </div>

              {/* 7. 実際に働いた女性の声 💬 */}
              <div id="voice">
                <Testimonials />
              </div>

              {/* 8. お仕事開始までの流れ 🛤️ */}
              <div id="flow">
                <Flow content={siteContent.flow} />
              </div>

              {/* 9. 募集要項 📋 */}
              <div id="requirements">
                <JobRequirements />
              </div>

              {/* 10. 一人で悩まず、まずは気軽に相談してください */}
              <div id="consultation">
                <ConsultationForm 
                  content={siteContent.consultation}
                  initialMessage={injectedMessage} 
                  onClearInitialMessage={handleClearInjected} 
                />
              </div>
            </motion.div>
          ) : currentTab === 'blog' ? (
            /* ==========================================
               INTEGRATED JOB BLOG & COLUMNS (TAB)
               ========================================== */
            <motion.div
              key="blog-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <BlogSection 
                articles={blogArticles}
                selectedSlug={selectedSlug}
                onSelectSlug={(slug) => {
                  if (slug) {
                    navigate(`/blog/${slug}`);
                  } else {
                    navigate('/blog');
                  }
                }}
                onCtaclick={handleScrollToForm} 
                onInjectedScroll={handleInjectedScroll}
                onSimulatorClick={handleScrollToSimulator}
              />
            </motion.div>
          ) : (
            /* ==========================================
               CMS ADMIN PANEL (TAB)
               ========================================== */
            <motion.div
              key="admin-page"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-secondary font-bold animate-pulse">管理パネルを読み込み中...</div>
                </div>
              }>
                <AdminPanel 
                  onClose={() => setCurrentTab('recruit')}
                  onRefreshBlog={handleRefreshBlog}
                  onRefreshSite={handleRefreshSiteContent}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer 
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onScrollToSection={handleScrollToSection}
        onOpenAdmin={() => setCurrentTab('admin')}
        isAdminMode={isAdminMode}
      />
    </div>
  );
}
