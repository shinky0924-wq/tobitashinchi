/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { SiteContent } from '../siteContent';

interface FlowProps {
  content: SiteContent['flow'];
}

export default function Flow({ content }: FlowProps) {
  return (
    <section className="py-20 bg-rose-50/10 overflow-hidden" id="flow">
      <div className="max-w-[1100px] mx-auto px-6">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-secondary font-display font-bold tracking-widest text-xs md:text-sm block mb-2 uppercase">
            {content.subtitle}
          </span>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl mb-4 text-on-surface">
            {content.title}
          </h2>
          <div className="h-1 w-12 bg-gradient-to-r from-secondary to-rose-300 mx-auto rounded-full mt-4" />
        </div>

        {/* Dynamic Connective Flow Cards */}
        <div className="relative max-w-4xl mx-auto" id="workflow-wrapper">
          {/* Connecting line on desktop (from center of item 1 to center of item 5) */}
          <div className="hidden lg:block absolute top-[28px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-secondary/30 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5 justify-center items-stretch relative z-10">
            {content.items.map((step, idx) => (
              <div key={step.number} className="flex flex-col items-center justify-center w-full max-w-xs sm:max-w-none mx-auto">
                {/* Connecting arrow down on mobile, shown between steps */}
                {idx > 0 && (
                  <div className="sm:hidden my-1 text-secondary/40 animate-bounce flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="flex flex-col items-center justify-center text-center bg-white p-4 sm:p-4 md:p-5 rounded-2xl border border-rose-100/70 shadow-xs hover:border-secondary/30 hover:shadow-md transition-all w-full h-full group"
                  id={`flow-step-${step.number}`}
                >
                  {/* Round Badge Number component */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full bg-white border-4 border-secondary flex items-center justify-center font-display font-black text-base sm:text-lg text-secondary shadow-sm group-hover:bg-secondary group-hover:text-white transition-all duration-300 mb-3 transform group-hover:scale-105">
                    {step.number}
                  </div>

                  {/* Step Description wrapper */}
                  <div className="text-center text-xs sm:text-sm font-bold text-on-surface leading-snug">
                    {step.title}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>



      </div>
    </section>
  );
}
