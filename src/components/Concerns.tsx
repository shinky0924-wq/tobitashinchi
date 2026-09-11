/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteContent } from '../siteContent';
import LucideIcon from './LucideIcon';

interface ConcernsProps {
  content: SiteContent['concerns'];
}

export default function Concerns({ content }: ConcernsProps) {
  const [activeConcern, setActiveConcern] = useState<string | null>(null);

  const toggleConcern = (id: string) => {
    setActiveConcern(activeConcern === id ? null : id);
  };

  return (
    <section className="py-20 bg-white" id="concerns">
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl mb-4 text-on-surface">
            {content.title}
          </h2>
          <p className="font-sans text-sm md:text-base text-on-surface-variant">
            {content.subtitle}
          </p>
        </div>

        {/* Vertical Accordion List */}
        <div className="space-y-4 max-w-[860px] mx-auto">
          {content.items.map((item, index) => {
            const isActive = activeConcern === item.id;
            
            return (
              <div
                key={item.id}
                className={`border rounded-2xl md:rounded-3xl transition-all overflow-hidden bg-surface-container-low ${
                  isActive
                    ? 'border-secondary ring-2 ring-secondary/10 shadow-md'
                    : 'border-zinc-100/80 shadow-xs hover:shadow-md hover:border-zinc-200 hover:bg-white'
                }`}
                id={`concern-accordion-${index + 1}`}
              >
                {/* Accordion Header Button */}
                <button
                  onClick={() => toggleConcern(item.id)}
                  className="w-full flex items-center justify-between p-4 md:p-6 text-left cursor-pointer select-none focus:outline-none"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-secondary text-white' : 'bg-rose-50 text-secondary'
                    }`}>
                      <LucideIcon name={item.iconName} size={20} className="md:w-6 md:h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] md:text-xs text-secondary font-semibold tracking-wider block mb-0.5">
                        {item.title}
                      </span>
                      <h3 className="text-sm md:text-base lg:text-lg font-bold text-on-surface leading-snug truncate sm:whitespace-normal">
                        {item.question}
                      </h3>
                    </div>
                  </div>

                  <div className="ml-4 shrink-0 flex items-center gap-2 text-xs md:text-sm font-bold text-secondary">
                    <span className="hidden sm:inline">{isActive ? '閉じる' : '詳細をみる'}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border border-zinc-200 transition-all ${
                      isActive ? 'bg-secondary border-secondary text-white' : 'text-secondary hover:bg-zinc-50'
                    }`}>
                      <LucideIcon name={isActive ? 'ChevronUp' : 'ChevronDown'} size={14} />
                    </div>
                  </div>
                </button>

                {/* Accordion Content */}
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="border-t border-zinc-100 bg-rose-50/20 p-5 md:p-8 flex items-start gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary text-white flex-shrink-0 flex items-center justify-center shadow-xs">
                          <LucideIcon name="Sparkles" size={16} className="fill-white md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-bold text-xs md:text-base text-secondary mb-1.5 flex flex-wrap items-center gap-1">
                            <span>安心アンサー</span>
                          </h4>
                          <p className="font-sans text-xs md:text-base text-on-surface-variant leading-relaxed whitespace-pre-line">
                            {item.answer}
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
    </section>
  );
}
