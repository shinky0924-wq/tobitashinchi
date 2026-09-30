/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MouseEvent, useState, useEffect } from 'react';
import LucideIcon from './LucideIcon';

interface FooterProps {
  currentTab: string;
  onChangeTab: (tab: 'recruit' | 'blog' | 'admin') => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenAdmin: () => void;
  isAdminMode?: boolean;
}

export default function Footer({ currentTab, onChangeTab, onScrollToSection, onOpenAdmin, isAdminMode }: FooterProps) {
  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('creator') === 'tobita' || params.get('admin') === 'true') {
        localStorage.setItem('show_admin_portal', 'true');
        setShowAdminLink(true);
      } else if (localStorage.getItem('show_admin_portal') === 'true') {
        setShowAdminLink(true);
      }
    } catch (e) {
      console.warn('localStorage or window.location not accessible', e);
    }
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

    if (link.action === 'blog') {
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
    <footer className="bg-surface-container-low border-t border-rose-100/40 pt-16 pb-8" id="app-footer">
      <div className="max-w-[1100px] mx-auto px-6">
        
        {/* Upper footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          
          {/* Logo details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider">
                飛田新地料亭グループ直営 公式求人サイト
              </div>
              <div className="font-display font-extrabold text-xl text-secondary flex items-center gap-2 pb-2">
                <LucideIcon name="Heart" className="fill-secondary text-secondary" size={18} />
                飛田ガールズ (Tobita Girls)
              </div>
            </div>
            <p className="font-sans text-xs md:text-sm text-on-surface-variant leading-loose">
              直営グループ直接採用窓口（仲介手数料ゼロ・完全日払い手渡し）<br />
              運営時間：10:00〜24:00（年中無休・LINE24時間受付中）<br />
              エリア：大阪市西成区山王（飛田新地料理組合エリア内）
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4 text-left md:text-right">
            <h5 className="font-display font-bold text-on-surface text-sm uppercase tracking-wider">
              サイトメニュー
            </h5>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 font-sans text-xs md:text-sm max-w-xs md:ml-auto">
              {navLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.target || '#'}
                  onClick={(e) => handleLinkClick(e, link)}
                  className="text-on-surface-variant hover:text-secondary hover:underline transition-all block text-left"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom subtle copyright and admin triggers */}
        <div className="pt-8 border-t border-rose-100/30 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant/60 gap-4">
          <p>© {new Date().getFullYear()} Tobita Girls. All rights reserved. 飛田新地直営グループ公式求人窓口</p>

          <div className="flex items-center gap-4">
            {/* Direct CMS Admin Access button when enabled */}
            {showAdminLink && (
              <button
                onClick={onOpenAdmin}
                className="text-[11px] text-zinc-400 hover:text-secondary underline cursor-pointer flex items-center gap-1"
                id="footer-admin-login-link"
              >
                <LucideIcon name="Lock" size={12} />
                <span>管理ポータル</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
