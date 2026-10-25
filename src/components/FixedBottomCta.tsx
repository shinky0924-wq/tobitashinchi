import React, { FC } from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { getSmartLineUrl, openSmartLine } from '../data';

export const FixedBottomCta: FC = () => {
  return (
    <motion.aside
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-rose-200/80 shadow-[0_-6px_25px_rgba(161,55,98,0.12)] px-4 py-2.5 pb-[calc(0.65rem+env(safe-area-inset-bottom))]"
      aria-label="LINE固定相談ボタン"
      id="fixed-bottom-line-cta-container"
    >
      <div className="max-w-md mx-auto flex items-center justify-center">
        <a
          href={getSmartLineUrl()}
          onClick={openSmartLine}
          className="w-full bg-[#06c755] hover:bg-[#05b34c] active:scale-[0.98] text-white font-sans font-extrabold py-3.5 px-6 rounded-2xl shadow-md shadow-[#06c755]/25 hover:shadow-lg hover:shadow-[#06c755]/35 transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm sm:text-base text-center group"
          id="fixed-bottom-line-cta-btn"
        >
          <div className="relative">
            <MessageCircle className="fill-white text-white w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-300 rounded-full animate-ping" />
          </div>
          <span className="tracking-wide">LINEで今すぐ相談する</span>
          <span className="hidden sm:inline-block text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold ml-1">
            24h受付
          </span>
        </a>
      </div>
    </motion.aside>
  );
};

export default FixedBottomCta;
