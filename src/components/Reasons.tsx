/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { SiteContent } from '../siteContent';
import LucideIcon from './LucideIcon';

interface ReasonsProps {
  content: SiteContent['reasons'];
}

export default function Reasons({ content }: ReasonsProps) {
  return (
    <section className="py-20 bg-rose-50/10 relative overflow-hidden" id="reasons">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-rose-100/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-100/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-[1100px] mx-auto px-6 relative z-10">
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-secondary font-display font-extrabold tracking-widest text-xs md:text-sm block mb-2 uppercase">
            {content.subtitle}
          </span>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl mb-4 text-on-surface">
            {content.title}
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-secondary to-rose-300 mx-auto rounded-full mt-4" />
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {content.items.map((reason, idx) => (
            <motion.div
              key={reason.number}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="group flex flex-col items-center text-center bg-white p-6 md:p-8 rounded-[2rem] border border-rose-100/50 shadow-sm hover:shadow-md hover:shadow-rose-100/30 transition-all duration-300"
              id={`reason-item-${reason.number}`}
            >
              {/* Icon Container with Badge */}
              <div className="relative mb-5 md:mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-rose-50/70 border border-rose-100 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-md">
                  <LucideIcon name={reason.iconName} size={28} className="md:w-8 md:h-8 transition-transform group-hover:scale-110" />
                </div>
                {/* Number Badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-secondary text-white font-display font-bold text-xs rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  {reason.number}
                </div>
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-base md:text-xl text-on-surface mb-2.5 group-hover:text-secondary transition-colors">
                {reason.title}
              </h3>

              {/* Description */}
              <p className="font-sans text-xs md:text-base text-on-surface-variant leading-relaxed px-1 sm:px-0">
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
