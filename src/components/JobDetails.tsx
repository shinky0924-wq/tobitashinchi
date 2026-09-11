/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import LucideIcon from './LucideIcon';
import { SiteContent } from '../siteContent';

interface JobDetailsProps {
  content: SiteContent['jobs'];
  onCtaclickWithData: (data: string) => void;
}

export default function JobDetails({ content, onCtaclickWithData }: JobDetailsProps) {
  // Simulator State
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [sessionsPerDay, setSessionsPerDay] = useState(4);

  // 飛田新地の一律バック単価（平均約8,000円〜10,000円前後。基本15分5,000円、20分7,500円、30分10,000円）
  // 堅実な目安として1本平均8,500円で計算
  const rewardPerSession = 8500;
  
  const dailyEarnings = sessionsPerDay * rewardPerSession;
  const weeklyEarnings = dailyEarnings * daysPerWeek;
  const monthlyEarnings = weeklyEarnings * 4.2; // approx weeks per month

  const handleShareToForm = () => {
    const dataMessage = `【給与シミュレーター希望】週${daysPerWeek}日・1日${sessionsPerDay}本接客 (日給約${workingFormatter(dailyEarnings)}円 / 月収目安: 約${workingFormatter(monthlyEarnings)}円)`;
    onCtaclickWithData(dataMessage);
  };

  const workingFormatter = (num: number) => {
    return Math.floor(num).toLocaleString();
  };

  // 組合規定の一律バック給リスト
  const backRates = [
    { time: '15分', back: '5,000円', note: '基本コース（時給換算 約20,000円）' },
    { time: '20分', back: '7,500円', note: '一番人気の標準コース' },
    { time: '30分', back: '10,000円', note: '1本で1万円のスピード高収入' },
    { time: '45分', back: '15,000円', note: 'じっくりコースで高バック' },
    { time: '60分', back: '20,000円', note: '1本で2万円のプレミアムバック' }
  ];

  // 当グループ直営の充実待遇リスト
  const benefits = [
    {
      icon: 'BadgePercent',
      title: '雑費・天引き一切なし（完全0円）',
      desc: '優良店（当グループ）では衣装代・備品代・お菓子代の天引きが一切ありません。稼いだ分を100%全額お渡しします。（※一般店の約3割に天引きが存在しますが当グループは完全保証）'
    },
    {
      icon: 'Coins',
      title: '全額日払い・手渡し',
      desc: '稼いだお給料はその日の退勤時に全額現金手渡しでお持ち帰りいただけます。急な出費や金欠でも安心です。'
    },
    {
      icon: 'ShieldBan',
      title: 'ノルマ・罰金・ペナルティなし',
      desc: '売上ノルマや待機カット、遅刻・欠勤による罰金等は一切ありません。プレッシャーなく自分のペースで働けます。'
    },
    {
      icon: 'Car',
      title: '送迎・深夜タクシー代支給',
      desc: '終電後の深夜帰りも安心。専属ドライバーによる送りや、タクシー代支給でご自宅や最寄り駅まで安全に送迎します。'
    },
    {
      icon: 'Home',
      title: '家具家電付きマンション寮完備',
      desc: '即日入居可能なワンルームマンション寮をご用意。遠方からの上京・引越しや、一人暮らしを始めたい方も大歓迎です。'
    },
    {
      icon: 'Baby',
      title: '提携託児所・Wワーク歓迎',
      desc: 'ママさん応援の託児所サポート完備。昼職・学生・OLさんの副業（掛け持ち）シフトも完全対応しています。'
    },
    {
      icon: 'Sparkles',
      title: '安心の1日体験入店制度',
      desc: 'まずは1日体験入店でお店の雰囲気やお仕事をチェックできます。合わないと感じた場合は即日精算の上でその日に退店可能です。'
    },
    {
      icon: 'Ticket',
      title: '交通費支給・衣装無料貸出',
      desc: '通勤交通費をしっかり支給。可愛いドレス・コスプレ・着物など豊富な衣装が無料でレンタルできるため手ぶらで出勤OK。'
    }
  ];

  return (
    <section className="py-20 bg-white" id="jobs">
      <div className="max-w-[1100px] mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100/80 px-3.5 py-1 rounded-full text-secondary font-bold text-xs tracking-wider uppercase mb-3">
            <LucideIcon name="Coins" size={13} />
            <span>SALARY & BENEFITS</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl mb-4 text-on-surface">
            飛田新地のお給料＆待遇
          </h2>
          <p className="text-xs md:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            接客1本あたりのバック額は飛田新地料理組合ルールで一律に固定されています。<br className="hidden sm:inline" />
            グループ直営だからこそ、天引き・雑費ゼロで全額日払い（手渡し）でお持ち帰りいただけます。
          </p>
          <div className="h-1 w-16 bg-gradient-to-r from-secondary to-rose-300 mx-auto rounded-full mt-4" />
        </div>

        {/* 組合一律固定バック給テーブル */}
        <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/30 border border-rose-100 rounded-3xl p-6 md:p-8 mb-12 shadow-xs">
          <div className="text-center mb-6">
            <span className="inline-block bg-secondary text-white text-[11px] font-black tracking-widest px-3 py-1 rounded-full uppercase mb-2">
              FIXED BACK SYSTEM
            </span>
            <h3 className="font-display font-extrabold text-lg md:text-2xl text-on-surface">
              一律固定のバック給（組合規定）
            </h3>
            <p className="text-xs md:text-sm text-on-surface-variant mt-1">
              基本単価は15分5,000円（時給換算で約2万円相当）。全額日払い・手渡し支給！
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {backRates.map((br, index) => (
              <div 
                key={br.time}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 text-center shadow-xs hover:border-secondary transition-all"
              >
                <div className="text-xs font-bold text-secondary mb-1">コース時間</div>
                <div className="font-display font-extrabold text-xl md:text-2xl text-on-surface mb-2">
                  {br.time}
                </div>
                <div className="bg-rose-50 rounded-xl py-2 px-1 mb-2">
                  <div className="text-[10px] text-gray-500 font-bold">女の子バック額</div>
                  <div className="font-display font-black text-lg md:text-xl text-secondary">
                    {br.back}
                  </div>
                </div>
                <p className="text-[11px] text-on-surface-variant font-medium leading-tight">
                  {br.note}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center text-xs text-on-surface-variant/80 font-medium">
            ※接客した分だけ上記金額が確実に積み上がります。不透明な歩合引き下げやランク変動は一切ありません。
          </div>
        </div>

        {/* 充実待遇 8選 */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="font-display font-bold text-xl md:text-2xl text-on-surface">
              当グループ直営ならではの充実待遇
            </h3>
            <p className="text-xs md:text-sm text-on-surface-variant mt-1">
              女の子が安心して長く稼げるよう、環境づくりに妥協しません
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((bnf, idx) => (
              <div 
                key={bnf.title}
                className="bg-surface-container-low p-5 rounded-2xl border border-rose-100/60 shadow-xs flex flex-col justify-between hover:bg-white transition-all"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-secondary flex items-center justify-center mb-3">
                    <LucideIcon name={bnf.icon} size={20} />
                  </div>
                  <h4 className="font-display font-bold text-sm md:text-base text-on-surface mb-2">
                    {bnf.title}
                  </h4>
                  <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                    {bnf.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Earning Simulator Core */}
        <div className="bg-gradient-to-br from-rose-50/60 via-pink-50/30 to-rose-50/60 border border-rose-200/80 rounded-3xl md:rounded-[36px] p-5 md:p-10 shadow-sm" id="earnings-simulator">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* User Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="bg-secondary text-white font-display font-extrabold text-[10px] tracking-wide px-2.5 py-1 rounded-full uppercase">
                  SIMULATOR
                </span>
                <h3 className="font-display font-extrabold text-lg md:text-2xl text-on-surface mt-3 mb-2">
                  {content.simulatorTitle || '1分でわかる！給与シミュレーター'}
                </h3>
                <p className="font-sans text-xs md:text-sm text-on-surface-variant">
                  あなたの希望するシフト・本数から、見込み収入をリアルタイムに計算します。
                </p>
              </div>

              {/* Days setting */}
              <div className="space-y-2 bg-white/70 p-4 rounded-2xl border border-rose-100/80">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-bold text-on-surface flex items-center gap-1.5">
                    <LucideIcon name="Calendar" size={16} className="text-secondary" />
                    週の勤務日数:
                  </label>
                  <span className="font-display font-extrabold text-secondary text-base">
                    週 <span className="text-xl">{daysPerWeek}</span> 日
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className="w-full accent-secondary h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer"
                  id="days-slider"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                  <span>週1日 (副業・スキマ時間)</span>
                  <span>週3日 (レギュラー)</span>
                  <span>週5〜6日 (ガッツリ高収入)</span>
                </div>
              </div>

              {/* Sessions estimate setting */}
              <div className="space-y-2 bg-white/70 p-4 rounded-2xl border border-rose-100/80">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-bold text-on-surface flex items-center gap-1.5">
                    <LucideIcon name="Heart" size={16} className="text-secondary" />
                    1日の目安接客本数:
                  </label>
                  <span className="font-display font-extrabold text-secondary text-base">
                    1日 <span className="text-xl">{sessionsPerDay}</span> 本
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={sessionsPerDay}
                  onChange={(e) => setSessionsPerDay(Number(e.target.value))}
                  className="w-full accent-secondary h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer"
                  id="sessions-slider"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                  <span>マイペース (2〜3本)</span>
                  <span>標準的 (4〜5本)</span>
                  <span>人気キャスト (6〜8本)</span>
                </div>
              </div>
            </div>

            {/* Results display */}
            <div className="lg:col-span-5 bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 border border-rose-100/80 shadow-md flex flex-col justify-between h-full" id="simulator-results">
              <div className="space-y-4">
                <span className="text-[11px] font-extrabold text-gray-400 block tracking-wide uppercase">
                  ESTIMATES SUMMARY
                </span>
                
                {/* Daily estimation */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                  <span className="text-xs font-bold text-on-surface-variant">日給目安（即日手渡し）:</span>
                  <span className="font-display font-bold text-sm text-[#493e42]">
                    約 {workingFormatter(dailyEarnings)} 円
                  </span>
                </div>

                {/* Weekly estimation */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                  <span className="text-xs font-bold text-on-surface-variant">週給目安:</span>
                  <span className="font-display font-bold text-sm text-[#493e42]">
                    約 {workingFormatter(weeklyEarnings)} 円
                  </span>
                </div>

                {/* Monthly estimation */}
                <div className="bg-rose-50/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-rose-100">
                  <span className="text-xs font-bold text-secondary mb-1">【月収見込み目安】</span>
                  <span className="font-display font-extrabold text-2xl md:text-3xl text-secondary">
                    約 {workingFormatter(monthlyEarnings)} <span className="text-sm font-sans font-bold">円</span>
                  </span>
                </div>
              </div>

              <button
                onClick={handleShareToForm}
                className="mt-6 w-full bg-[#06c755] hover:bg-[#05b34c] text-white font-sans font-bold text-sm py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[#06c755]/10"
                id="simulator-share-cta"
              >
                <LucideIcon name="MessageCircle" size={16} className="fill-white text-white" />
                <span>LINEでこの希望を相談する</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
