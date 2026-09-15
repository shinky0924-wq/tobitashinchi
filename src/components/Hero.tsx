/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { HERO_IMAGE_URL, LINE_OFFICIAL_URL } from '../data';
import LucideIcon from './LucideIcon';
import { SiteContent } from '../siteContent';
import { BlogArticle, getValidArticleEyeCatch } from '../blogData';
import { ArticleCardImage } from './ArticleCardImage';

interface HeroProps {
  content: SiteContent['hero'];
  onCtaclick: () => void;
  onBlogClick?: () => void;
  articles?: BlogArticle[];
  onArticleClick?: (slug: string) => void;
}

export default function Hero({ content, onCtaclick, onBlogClick, articles, onArticleClick }: HeroProps) {
  const recommendedArticles = useMemo(() => {
    if (!articles || articles.length === 0) return [];
    return articles.slice(0, 5);
  }, [articles]);

  return (
    <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden hero-pattern bg-radial from-rose-50/20 via-transparent to-transparent">
      {/* Backdrops */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary-container/10 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-[900px] mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        {/* Direct Group Recruitment Tagline */}
        <motion.div 
          className="inline-flex items-center gap-2 bg-rose-100 text-secondary font-sans font-bold text-xs md:text-sm px-4 py-1.5 rounded-full mb-6 relative shadow-xs"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          id="hero-tagline"
        >
          <span className="relative flex h-2 w-2 rounded-full bg-secondary animate-ping" />
          <span>直営グループ直接採用 ・ 仲介料ゼロ＆全額日払い</span>
        </motion.div>

        {/* Main Display Title */}
        <motion.h1 
          className="font-display font-extrabold text-2xl md:text-4xl lg:text-5xl text-on-surface leading-tight mb-4 break-words"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          id="hero-title"
        >
          飛田新地が<span className="text-secondary">初めての女性へ。</span>
        </motion.h1>

        {/* Sub description */}
        <motion.div 
          className="font-sans text-xs md:text-base text-on-surface-variant leading-relaxed mb-8 max-w-2xl px-2 sm:px-0 space-y-1.5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          id="hero-description"
        >
          <p className="font-bold text-on-surface">{content?.descriptionLine1 || '直営店公式採用だから、未経験でも安心してお仕事をスタートできます。'}</p>
          <p>{content?.descriptionLine2 || '「本当に稼げるの？」「危険じゃない？」そんな不安を抱えたまま応募しないでください。'}</p>
          <p className="font-bold text-secondary">{content?.descriptionLine3 || 'まずは気軽にご相談ください。'}</p>
        </motion.div>

        {/* Horizontal Styled Photo Wrapper */}
        <motion.div 
          className="w-full relative mb-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          id="hero-visual"
        >
          {/* Ambient Background Glow */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-secondary/10 to-rose-200/20 rounded-[44px] blur-2xl pointer-events-none" />

          <div className="relative bg-white p-3 rounded-[28px] sm:rounded-[36px] shadow-2xl border border-rose-50/50 overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
            <img 
              src={HERO_IMAGE_URL} 
              alt="飛田新地で輝く明るい未来へ・夢を叶える安心のお仕事" 
              className="w-full h-auto rounded-[20px] sm:rounded-[28px] object-cover aspect-[16/9] object-center bg-gray-100"
              decoding="async"
              referrerPolicy="no-referrer"
              id="hero-img-element"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = '1';
                  target.src = '/images/japanese_hero_banner.jpg';
                } else {
                  target.onerror = null;
                }
              }}
            />
            
            {/* Overlapping Glassmorphism Stamp */}
            <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 bg-white/95 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border border-rose-100 flex flex-col items-center z-10">
              <span className="text-secondary font-extrabold text-xs md:text-sm tracking-widest uppercase mb-0.5">飛田新地で</span>
              <span className="text-secondary-container font-extrabold text-sm md:text-xl tracking-normal text-[#a13762]">
                明るい未来へ！
              </span>
            </div>
          </div>

          {/* Tiny accent decoration dots */}
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-rose-50 rounded-full border border-rose-100/30 flex items-center justify-center -z-10 shadow-xs" />
        </motion.div>

        {/* Hero Action CTA Buttons & Recommendation Columns */}
        <motion.div 
          className="flex flex-col gap-5 justify-center items-center w-full max-w-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          id="hero-cta-container"
        >
          {/* Main Action Buttons */}
          <div className="flex justify-center w-full max-w-md">
            <a
              href={LINE_OFFICIAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#06c755] hover:bg-[#05b34c] text-white font-sans font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-[#06c755]/25 hover:shadow-xl hover:shadow-[#06c755]/35 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm sm:text-base text-center"
              id="hero-line-cta-btn"
            >
              <LucideIcon name="MessageCircle" className="fill-white text-white w-5 h-5 shrink-0" size={20} />
              <span>LINEで今すぐ相談する</span>
            </a>
          </div>

          {/* PICK UP RECOMMEND 人気のお仕事コラム（おすすめ5選） */}
          {recommendedArticles.length > 0 && (
            <div className="w-full text-left bg-gradient-to-br from-white to-[#fffbfd] p-5 md:p-6 rounded-3xl border border-secondary/20 shadow-xl shadow-rose-100/30 relative mt-2" id="hero-random-columns">
              {/* Floating accent badge */}
              <div className="absolute -top-3 -right-3 bg-secondary text-white text-[10px] px-3 py-1 rounded-full font-black shadow-sm flex items-center gap-1 border border-secondary/10 tracking-widest animate-pulse">
                <LucideIcon name="Sparkles" size={11} />
                <span>PICK UP</span>
              </div>
              
              <div className="border-b border-rose-100 pb-3 mb-4">
                <h3 className="font-sans font-extrabold text-sm md:text-base text-secondary flex items-center gap-2">
                  <span className="bg-secondary text-white text-[9px] tracking-wider px-2 py-0.5 rounded-md font-black">RECOMMEND</span>
                  <span className="bg-gradient-to-r from-secondary to-[#a13762] bg-clip-text text-transparent font-black">人気のお仕事コラム（おすすめ5選）</span>
                </h3>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {recommendedArticles.map((art, index) => (
                  <button
                    key={art.id}
                    onClick={() => onArticleClick && onArticleClick(art.slug)}
                    className="w-full text-left font-sans text-xs md:text-sm text-on-surface bg-white hover:bg-secondary-container/10 p-2.5 sm:p-3 rounded-2xl border border-rose-100 hover:border-secondary-container/50 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-[0_2px_8px_-3px_rgba(210,84,123,0.06)] hover:shadow-[0_4px_12px_-2px_rgba(210,84,123,0.12)] hover:-translate-y-0.5"
                    id={`hero-col-item-${art.id}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      {/* Eyecatch thumbnail */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-rose-50 border border-rose-100/60 shrink-0 relative flex items-center justify-center shadow-xs">
                        <ArticleCardImage
                          src={getValidArticleEyeCatch(art)}
                          alt={art.title}
                          category={art.category}
                          categoryLabel={art.categoryLabel}
                          className="w-full h-full"
                        />
                      </div>

                      {/* Title & category */}
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-black text-secondary bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100/80">
                            {art.categoryLabel || '安心・身バレ対策'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            No.{String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <span className="truncate block text-gray-800 group-hover:text-secondary transition-colors font-bold text-xs sm:text-sm leading-snug">
                          {art.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      <span className="hidden sm:inline text-[10px] text-secondary font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        読む
                      </span>
                      <LucideIcon name="ChevronRight" className="text-secondary/40 group-hover:text-secondary group-hover:translate-x-0.5 transition-all shrink-0" size={16} />
                    </div>
                  </button>
                ))}
              </div>
              
              {onBlogClick && (
                <div className="mt-4 text-center border-t border-rose-100/50 pt-4">
                  <button
                    onClick={onBlogClick}
                    className="inline-flex items-center gap-2 text-xs md:text-sm font-extrabold text-white bg-gradient-to-r from-secondary to-[#e2628b] hover:from-[#c2446c] hover:to-[#d2547b] px-6 py-2.5 rounded-full shadow-md shadow-rose-200/50 hover:shadow-lg transition-all cursor-pointer group"
                    id="hero-all-columns-link"
                  >
                    <span>すべてのコラムを見る</span>
                    <LucideIcon name="ChevronRight" className="group-hover:translate-x-1 transition-transform" size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Guarantee Badge: 未経験の方も安心のサポート体制 */}
        <motion.div 
          className="mt-8 flex items-center justify-center gap-2.5 bg-white/80 border border-rose-100 py-2 px-5 rounded-full shadow-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          id="hero-badge"
        >
          <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center">
            <LucideIcon name="ShieldCheck" className="text-secondary" size={13} />
          </div>
          <span className="text-xs md:text-sm font-bold text-on-surface">未経験の方も安心のサポート体制</span>
        </motion.div>
      </div>

      {/* Decorative Wave Divider at the bottom */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] translate-y-[1px]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[30px] text-surface fill-current">
          <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"></path>
        </svg>
      </div>
    </section>
  );
}
