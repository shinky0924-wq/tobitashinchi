/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CONSULTANT_AVATAR_URL } from '../data';
import { SiteContent } from '../siteContent';
import LucideIcon from './LucideIcon';

interface FAQProps {
  content: SiteContent['faq'];
}

export default function FAQ({ content }: FAQProps) {
  const [openFAQ, setOpenFAQ] = useState<string | null>('faq-1');

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <section className="py-20 bg-white" id="faq">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Reassuring Banner */}
          <div className="lg:col-span-5 lg:sticky lg:top-24" id="faq-intro-sidebar">
            <h2 className="font-display font-extrabold text-2xl md:text-3.5xl lg:text-4xl text-on-surface leading-tight mb-6 whitespace-pre-line">
              {content.title}
            </h2>
            
            {/* Consultant Message Card */}
            <div className="bg-rose-50/30 border border-rose-100 rounded-[28px] md:rounded-[32px] p-5 md:p-8 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 md:gap-6 shadow-sm">
              <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-white rounded-full overflow-hidden border-2 border-secondary/20 shadow-md transform -rotate-3 hover:rotate-0 transition-transform">
                <img 
                  src={CONSULTANT_AVATAR_URL} 
                  alt="アドバイザー相談スタッフ" 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.tried) {
                      target.dataset.tried = '1';
                      target.src = '/images/tobita_advisor_avatar_1782370695372.jpg';
                    } else {
                      target.onerror = null;
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-xs md:text-base italic text-on-surface-variant font-medium leading-relaxed">
                  {content.sidebarMessage}
                </p>
                <span className="text-xs font-bold text-secondary mt-2 block">{content.sidebarRole}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Accordion */}
          <div className="lg:col-span-7 space-y-4" id="faq-accordions-group">
            {content.items.map((faq, index) => {
              const isOpen = openFAQ === faq.id;
              return (
                <div 
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isOpen 
                      ? 'border-secondary shadow-md ring-1 ring-secondary/10' 
                      : 'border-zinc-100 hover:border-rose-100 shadow-sm'
                  }`}
                  id={`faq-accordion-card-${index + 1}`}
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className={`w-full flex justify-between items-center p-4 md:p-6 text-left cursor-pointer gap-4 transition-colors ${
                      isOpen ? 'bg-rose-50/20' : 'hover:bg-rose-50/10'
                    }`}
                  >
                    <span className="font-sans font-bold text-xs md:text-base text-on-surface group-hover:text-secondary flex-1 leading-snug">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={`text-on-surface-variant flex-shrink-0 ${isOpen ? 'text-secondary' : ''}`}
                    >
                      <LucideIcon name="ChevronDown" size={18} className="md:w-5 md:h-5" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                      >
                        <div className="px-4 md:px-6 pb-5 md:pb-6 pt-0 font-sans text-xs md:text-sm text-on-surface-variant leading-relaxed border-t border-rose-50/50">
                          <div className="pt-3 md:pt-4 flex gap-2">
                            <span className="text-secondary font-bold text-sm md:text-lg select-none">A.</span>
                            <p className="flex-1 whitespace-pre-line text-xs md:text-sm text-[#493e42] leading-relaxed">
                              {faq.answer.replace(/^A\.\s*/, '')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
