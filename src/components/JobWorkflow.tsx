/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import LucideIcon from './LucideIcon';

export default function JobWorkflow() {
  const steps = [
    {
      step: '01',
      time: '出勤・準備',
      title: '出勤・メイク・着替え',
      icon: 'Sparkles',
      image: '/images/col_vanity_trial_1789107497172.jpg',
      imageAlt: '清潔なドレッサーと衣装準備',
      desc: '下からの強い照明に映えるよう濃いめの「飛田メイク」をし、貸衣装や自前のコスプレ（ドレス、ポリス、清楚系ワンピースなど）に着替えます。無料の貸衣装やメイク道具も充実しています。'
    },
    {
      step: '02',
      time: '玄関先での待機',
      title: '店頭（玄関）での呼び込み',
      icon: 'Heart',
      image: '/images/ryotei_entrance_lantern_1789108525834.jpg',
      imageAlt: '料亭の玄関先・お座敷での待機',
      desc: '玄関先に座り、交代タイマー（5〜10分間隔）に従って笑顔や手招き、目線で通行人にアピールします。女性自身が声を出すことは禁止されており、声掛けは隣に座るベテラン仲居さん（おばちゃん）がすべて行います。'
    },
    {
      step: '03',
      time: 'お部屋へのご案内',
      title: '2階への案内・会計',
      icon: 'Coffee',
      image: '/images/col_ryotei_flow_1789107427433.jpg',
      imageAlt: '2階和室・お茶出しセット',
      desc: 'お客様に選ばれたら2階の個室和室へご案内し、コース時間（15分〜）を決定します。前払いで料金をお預かりして1階で精算し、お茶・お菓子・おしぼりセットをお部屋へ運びます。'
    },
    {
      step: '04',
      time: '個室でのサービス',
      title: '接客サービス（完全受け身で安心）',
      icon: 'ShieldCheck',
      image: '/images/col_safety_shield_1789107540732.jpg',
      imageAlt: '安心の衛生管理とルール徹底',
      desc: 'シャワー設備はないため、ウェットティッシュや除菌スプレー等で下半身を清潔にし、コンドームを着用してサービスを行います。「キスNG」「客からの前戯NG」「完全ゴム着用」が徹底されているため、性病リスクが低く安全に働けます。'
    },
    {
      step: '05',
      time: 'お見送り＆日払い',
      title: 'お見送り・即日全額日払い精算',
      icon: 'Coins',
      image: '/images/col_salary_savings_1789107442335.jpg',
      imageAlt: '全額当日日払い手渡し',
      desc: '終了チャイムが鳴ったら身支度を整え、玄関でお土産のキャンディやガムをお渡ししてお見送りします。その日の退勤時に稼いだお給料を全額日払い（手渡し）で受け取って帰宅できます。'
    }
  ];

  return (
    <section className="py-20 bg-rose-50/20 relative overflow-hidden" id="job-content">
      <div className="max-w-[1100px] mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 bg-rose-100/70 border border-rose-200/80 px-3.5 py-1 rounded-full text-secondary font-bold text-xs tracking-wider uppercase mb-3">
            <LucideIcon name="Briefcase" size={13} />
            <span>DAILY WORKFLOW</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl text-on-surface mb-4">
            お仕事内容と1日の流れ
          </h2>
          <p className="font-sans text-xs md:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            特別な技術や講習、難しいプレイテクニックは一切不要です。<br className="hidden sm:inline" />
            声掛けはおばちゃんにお任せ、接客も完全受け身で終わるシンプルな仕事内容です。
          </p>
          <div className="h-1 w-16 bg-gradient-to-r from-secondary to-rose-300 mx-auto rounded-full mt-4" />
        </div>

        {/* 3 Key Points Highlight Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-secondary flex items-center justify-center shrink-0">
              <LucideIcon name="CheckCircle2" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface">特別な技術・講習不要</h4>
              <p className="text-xs text-on-surface-variant">完全受け身のシンプル接客</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-secondary flex items-center justify-center shrink-0">
              <LucideIcon name="CheckCircle2" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface">呼び込み・声掛けはおばちゃん</h4>
              <p className="text-xs text-on-surface-variant">女性は笑顔で座っているだけ</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-secondary flex items-center justify-center shrink-0">
              <LucideIcon name="CheckCircle2" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface">キスNG・ゴム100%徹底</h4>
              <p className="text-xs text-on-surface-variant">ルール厳格で衛生・安全第一</p>
            </div>
          </div>
        </div>

        {/* 1日の流れタイムラインカード */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {steps.map((st, idx) => (
            <motion.div
              key={st.step}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="bg-white rounded-3xl p-5 md:p-6 border border-rose-100 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6"
              id={`workflow-step-${st.step}`}
            >
              {/* Step number badge */}
              <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto shrink-0 gap-2 sm:gap-1">
                <div className="flex items-center gap-3 sm:flex-col sm:gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-secondary to-rose-400 text-white flex items-center justify-center font-display font-black text-lg shadow-sm">
                    {st.step}
                  </div>
                  <span className="text-[10px] font-bold text-secondary tracking-wider uppercase">
                    {st.time}
                  </span>
                </div>
                <div className="sm:hidden text-secondary">
                  <LucideIcon name={st.icon} size={20} />
                </div>
              </div>

              {/* Image thumbnail */}
              <div className="w-full sm:w-36 md:w-44 h-36 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-rose-100 shadow-xs relative group/img">
                <img
                  src={st.image}
                  alt={st.imageAlt}
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:hidden" />
                <span className="absolute bottom-2 left-2 text-[10px] text-white font-bold sm:hidden px-2 py-0.5 rounded bg-black/40 backdrop-blur-xs">
                  {st.title}
                </span>
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-display font-bold text-base md:text-lg text-on-surface">
                    {st.title}
                  </h3>
                </div>
                <p className="font-sans text-xs md:text-sm text-on-surface-variant leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
