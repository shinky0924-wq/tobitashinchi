/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, MouseEvent } from 'react';
import { motion } from 'motion/react';
import { TESTIMONIALS } from '../data';
import LucideIcon from './LucideIcon';

export default function Testimonials() {
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({
    'test-1': 14,
    'test-2': 28,
    'test-3': 9
  });

  const handleLike = (id: string, e: MouseEvent) => {
    e.preventDefault();
    const isLiked = likedReviews[id];
    setLikedReviews({ ...likedReviews, [id]: !isLiked });
    setLikeCounts({
      ...likeCounts,
      [id]: isLiked ? likeCounts[id] - 1 : likeCounts[id] + 1
    });
  };

  return (
    <section className="py-20 bg-rose-50/20" id="voice">
      <div className="max-w-[1100px] mx-auto px-6">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-secondary font-display font-bold tracking-widest text-xs md:text-sm block mb-2 uppercase">
            TESTIMONIALS
          </span>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl mb-4 text-on-surface">
            実際に働いた<span className="text-secondary">女性の声</span> 💬
          </h2>
          <div className="h-1 w-12 bg-gradient-to-r from-secondary to-rose-300 mx-auto rounded-full mt-4" />
        </div>

        {/* Testimonials Deck */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, idx) => {
            const isLiked = likedReviews[testimonial.id];
            return (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white p-5 md:p-8 rounded-3xl md:rounded-[32px] border border-rose-100/50 shadow-sm hover:shadow-md hover:shadow-rose-100/30 transition-all duration-300 flex flex-col justify-between"
                id={`testimonial-card-${idx + 1}`}
              >
                <div>
                  {/* Avatar and Info Header */}
                  <div className="flex gap-3 md:gap-4 items-center mb-5 md:mb-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-[18px] md:rounded-[22px] overflow-hidden shadow-inner ring-4 ring-rose-50 relative">
                        <img 
                          src={testimonial.avatarUrl} 
                          alt="飛田ガールズ キャスト体験者" 
                          className="w-full h-full object-cover bg-rose-50"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.tried) {
                              target.dataset.tried = '1';
                              const fallbacks = [
                                '/images/cast_avatar_one_1789108601323.jpg',
                                '/images/cast_avatar_two_1789108616238.jpg',
                                '/images/tobita_bright_future_1789106917071.jpg'
                              ];
                              target.src = fallbacks[idx % fallbacks.length];
                            } else {
                              target.onerror = null;
                            }
                          }}
                        />
                        {/* High quality clean face photo without blur overlay */}
                      </div>
                      <div className="absolute bottom-0 right-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-secondary text-white flex items-center justify-center text-[9px] md:text-[11px] font-bold shadow-sm">
                        {"✓"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex flex-wrap">
                        <span className="bg-secondary text-white text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs truncate">
                          {testimonial.tag}
                        </span>
                      </div>
                      <div className="text-xs md:text-base text-on-surface font-extrabold flex flex-wrap items-center gap-1.5 pl-0.5">
                        <span className="truncate">{testimonial.age}</span>
                        <span className="text-[9px] bg-rose-100 text-secondary-container font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap">
                          {testimonial.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Speech Bubble quote */}
                  <div className="relative">
                    {/* Quotation Marks */}
                    <span className="absolute -top-3 -left-2 text-rose-200 text-4xl font-serif select-none pointer-events-none">“</span>
                    <p className="font-sans text-sm md:text-base leading-relaxed text-[#493e42] relative z-10 pl-2">
                      「{testimonial.quote}」
                    </p>
                  </div>
                </div>

                {/* Helpful Like Button */}
                <div className="mt-8 pt-4 border-t border-rose-50/50 flex justify-between items-center text-xs text-on-surface-variant">
                  <span className="font-medium text-rose-800 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full">
                    <LucideIcon name="CheckCircle" size={12} />
                    料亭直営グループ在籍キャスト
                  </span>
                  
                  <button 
                    onClick={(e) => handleLike(testimonial.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      isLiked 
                        ? 'bg-rose-50 text-secondary font-bold' 
                        : 'bg-zinc-50 hover:bg-rose-50/50 text-gray-400 hover:text-secondary'
                    }`}
                  >
                    <LucideIcon 
                      name="Heart" 
                      size={14} 
                      className={`${isLiked ? 'fill-secondary text-secondary' : 'text-gray-400'}`} 
                    />
                    <span>参考になった ({likeCounts[testimonial.id]})</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
