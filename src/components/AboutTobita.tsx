/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import LucideIcon from './LucideIcon';

export default function AboutTobita() {
  const points = [
    {
      icon: 'Building',
      title: '大正時代から続く歴史と格式',
      desc: '大阪市西成区に位置する、大正時代から続く日本最大級の歓楽街（旧遊廓）エリアです。独自の伝統と文化を受け継ぎながら、現在も活気ある街として賑わっています。'
    },
    {
      icon: 'ShieldCheck',
      title: '風営法上は「料亭（料理店）」',
      desc: '風営法上の扱いは性風俗店ではなく「料亭（料理店）」として営業しており、飛田新地料理組合などの団体によって営業ルールや安全が厳格に管理されています。'
    },
    {
      icon: 'HeartHandshake',
      title: '自由恋愛の安心システム',
      desc: '表向きは個室（和室）でお茶やお菓子を提供する料亭であり、お運びさん（女性キャスト）と男性客との自由恋愛という建前でサービスが行われています。無理な強要は一切ありません。'
    },
    {
      icon: 'MapPin',
      title: '通りごとの個性と年齢層',
      desc: 'エリア内は「メイン通り」「青春通り」「裏通り（妖怪通り等）」などの通りに分かれており、通りごとに採用基準や主な年齢層が異なります。あなたに一番合った環境で働けます。'
    },
    {
      icon: 'EyeOff',
      title: '写真撮影・ネット宣伝の完全禁止',
      desc: '街全体の厳格なルールとして、写真撮影やネット上での顔出し写真・写メ日記の公開、店舗公式ホームページによる営業宣伝が一切禁止されています。そのため身バレリスクが極めて低く安全です。'
    },
    {
      icon: 'BadgeCheck',
      title: 'グループ直営だから中間マージンなし',
      desc: '当サイトは仲介業者や派遣・スカウトではなく、飛田新地の料亭グループ直営の公式求人窓口です。中間マージンや不当な引き落としが一切なく、最高歩合をそのまま受け取れます。'
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden" id="about">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-50/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-50/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-[1100px] mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100/80 px-3.5 py-1 rounded-full text-secondary font-bold text-xs tracking-wider uppercase mb-3">
            <LucideIcon name="Info" size={13} />
            <span>ABOUT TOBITA</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl text-on-surface mb-4">
            飛田新地とは？
          </h2>
          <p className="font-sans text-xs md:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            日本最大級の歴史を持つ「飛田新地」の仕組みや特徴について解説します。<br className="hidden sm:inline" />
            法令や組合ルールが徹底されているため、女性が安全に高収入を得られる環境が整っています。
          </p>
          <div className="h-1 w-16 bg-gradient-to-r from-secondary to-rose-300 mx-auto rounded-full mt-4" />
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {points.map((pt, idx) => (
            <motion.div
              key={pt.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-surface-container-low/70 hover:bg-white p-6 rounded-3xl border border-rose-100/70 hover:border-secondary/30 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
              id={`about-point-${idx + 1}`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-secondary mb-4 group-hover:bg-secondary group-hover:text-white transition-colors duration-300 shadow-xs">
                  <LucideIcon name={pt.icon} size={22} />
                </div>
                <h3 className="font-display font-bold text-base md:text-lg text-on-surface mb-2 group-hover:text-secondary transition-colors">
                  {pt.title}
                </h3>
                <p className="font-sans text-xs md:text-sm text-on-surface-variant leading-relaxed">
                  {pt.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Direct Recruitment Banner Note */}
        <div className="mt-10 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border border-rose-200/60 rounded-3xl p-6 md:p-8 text-center max-w-3xl mx-auto shadow-xs">
          <span className="inline-block bg-secondary text-white text-[11px] font-black tracking-widest px-3 py-1 rounded-full uppercase mb-2">
            GROUP DIRECT RECRUITMENT
          </span>
          <h4 className="font-display font-extrabold text-lg md:text-xl text-on-surface mb-2">
            お店・グループ直接の公式採用窓口だから安心
          </h4>
          <p className="font-sans text-xs md:text-sm text-on-surface-variant leading-relaxed">
            仲介業者を通さない直接応募なので、紹介料・手数料の引かれものは一切ありません。<br className="hidden sm:inline" />
            グループ直営の優良料亭だからこそ、衣装代・お菓子代の雑費天引きゼロ、完全日払いを100%保証しています。
          </p>
        </div>
      </div>
    </section>
  );
}
