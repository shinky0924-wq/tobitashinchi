/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LucideIcon from './LucideIcon';

interface HeaderProps {
  currentTab: 'recruit' | 'blog' | 'admin';
  onChangeTab: (tab: 'recruit' | 'blog' | 'admin') => void;
  onCtaclick: () => void;
  onScrollToSection: (sectionId: string) => void;
  isAdminMode?: boolean;
}

export default function Header({ currentTab, onChangeTab, onCtaclick, onScrollToSection, isAdminMode }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'お仕事コラム', action: 'blog' },
    { name: '飛田新地とは？', action: 'section', target: '#about' },
    { name: 'お仕事内容', action: 'section', target: '#job-content' },
    { name: 'お給料・待遇', action: 'section', target: '#salary' },
    { name: 'よくある質問', action: 'section', target: '#faq' },
    { name: '女性の声', action: 'section', target: '#voice' },
    { name: '応募の流れ', action: 'section', target: '#flow' },
    { name: '募集要項', action: 'section', target: '#requirements' },
  ];

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, link: typeof navLinks[0]) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (link.action === 'recruit') {
      onChangeTab('recruit');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.action === 'blog') {
      onChangeTab('blog');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.action === 'section' && link.target) {
      if (currentTab !== 'recruit') {
        onChangeTab('recruit');
        // Let the tab render, then scroll
        setTimeout(() => {
          onScrollToSection(link.target!.substring(1));
        }, 100);
      } else {
        onScrollToSection(link.target!.substring(1));
      }
    }
  };

  return (
    <>
      <header 
        id="app-header"
        className={`fixed w-full top-0 left-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-3 border-b border-rose-100/40' 
            : 'bg-white/80 backdrop-blur-sm py-4'
        }`}
      >
        <div className="flex justify-between items-center w-full px-6 max-w-[1100px] mx-auto">
          {/* Logo */}
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              onChangeTab('recruit');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-rose-300 to-pink-400 flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-sm shadow-rose-200">
              <LucideIcon name="Heart" className="fill-white text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]" size={18} />
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-300 rounded-full flex items-center justify-center">
                <span className="text-[8px] leading-none">✨</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 tracking-tight flex items-center gap-1">
                Tobita Girls
              </span>
              <span className="text-[9px] font-sans font-extrabold text-[#d2547b] tracking-wider -mt-1 block scale-90 origin-left">
                直営グループ公式・直接採用 💖
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex gap-5 xl:gap-6 items-center" id="desktop-navigation">
            {navLinks.map((link) => {
              const isActive = link.action === 'blog' && currentTab === 'blog';

              return (
                <a 
                  key={link.name}
                  href={link.target || '#'}
                  onClick={(e) => handleLinkClick(e, link)}
                  className={`font-sans font-bold text-xs xl:text-sm tracking-wide transition-all cursor-pointer ${
                    isActive 
                      ? 'text-secondary border-b-2 border-secondary pb-1' 
                      : 'text-on-surface-variant hover:text-secondary'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onCtaclick}
              className="bg-secondary hover:bg-secondary/90 text-white font-sans font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-full shadow-md shadow-rose-200 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              id="header-consultation-btn"
            >
              <LucideIcon name="MessageCircle" size={16} />
              <span>無料相談</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-on-surface hover:text-secondary focus:outline-none cursor-pointer"
              aria-label="メニューを開く"
              id="mobile-menu-trigger"
            >
              <LucideIcon name={mobileMenuOpen ? 'X' : 'Menu'} size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[65px] bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-xl z-40 lg:hidden px-6 py-6"
            id="mobile-navigation-drawer"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.target || '#'}
                  onClick={(e) => handleLinkClick(e, link)}
                  className="font-sans font-bold text-base text-on-surface hover:text-secondary py-2 border-b border-rose-50 flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  <LucideIcon name="ChevronRight" size={16} className="text-secondary/40" />
                </a>
              ))}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onCtaclick();
                  }}
                  className="w-full bg-secondary text-white font-sans font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <LucideIcon name="MessageCircle" size={18} />
                  <span>まずは気軽に相談してみる</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
