/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import LucideIcon from './LucideIcon';
import { LINE_OFFICIAL_URL } from '../data';

export default function JobRequirements() {
  const specs = [
    {
      label: '応募資格',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          <div>
            <span className="font-extrabold text-on-surface text-base">満20歳以上</span>
            <span className="ml-2 text-xs text-gray-500 font-medium">（20代〜30代前半中心）</span>
            <div className="mt-1 bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 text-xs text-rose-700 font-bold">
              ⚠️ 飛田新地料理組合の厳格な規定により、18歳・19歳および現役高校生は絶対に応募・就労できません。
            </div>
          </div>
          <p className="text-xs sm:text-sm">
            ・日本国籍または特別永住者の方<br />
            ・暴力団関係者や違法薬物との関わりが一切ないこと<br />
            ・<strong className="text-secondary">完全未経験者歓迎</strong>（事前の丁寧なサポートあり）
          </p>
        </div>
      )
    },
    {
      label: '必要書類・持ち物',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          <div>
            <span className="font-bold text-secondary block">① 本籍地記載の住民票（マイナンバーカード等でコンビニ即日発行可能）</span>
            <p className="text-xs text-gray-500 mt-0.5">
              ※法令順守および年齢確認のため、1日体験入店時でも必ずご持参いただく必要があります。
            </p>
          </div>
          <div>
            <span className="font-bold text-secondary block">② 顔写真付き公的身分証明書</span>
            <p className="text-xs text-gray-500 mt-0.5">
              運転免許証、パスポート、マイナンバーカード等の有効期限内のもの。
            </p>
          </div>
          <div>
            <span className="font-bold text-on-surface block">【体験入店時の持ち物】</span>
            <p className="text-xs text-gray-600 mt-0.5">
              メイク道具、自前の衣装やウィッグ（※店舗に可愛い無料の貸衣装やアメニティも完備しています）。
            </p>
          </div>
        </div>
      )
    },
    {
      label: '勤務時間・シフト',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          <p>
            <strong>10:00〜24:00</strong>（昼番 10:00〜17:00 / 夜番 17:00〜24:00 の2交代制が基本）
          </p>
          <p className="text-xs sm:text-sm">
            ・週1日・1日2〜3時間の短時間勤務からOK<br />
            ・Wワーク、昼職副業、土日のみ、短期（1日〜1週間）、地方からの出稼ぎ歓迎<br />
            <span className="text-xs text-gray-400">※基本は出勤曜日や時間を固定する働き方が優先されます。</span>
          </p>
        </div>
      )
    },
    {
      label: '勤務地・アクセス',
      content: (
        <div className="space-y-1.5 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          <p className="font-bold text-on-surface">
            大阪府大阪市西成区山王（飛田新地）
          </p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>・Osaka Metro御堂筋線・堺筋線「動物園前駅」より徒歩5分</li>
            <li>・各線「天王寺駅」「新今宮駅」「阿倍野駅」より徒歩約10分</li>
          </ul>
        </div>
      )
    },
    {
      label: '給与システム',
      content: (
        <div className="space-y-1 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          <p>
            <strong className="text-secondary text-sm sm:text-base">完全歩合制（全額日払い・即日手渡し）</strong>
          </p>
          <p className="text-xs text-gray-500">
            ノルマ・罰金・待機カットなし、雑費天引き完全0円。<br />
            ※1本あたりのバック給詳細（15分 5,000円〜）や給料シミュレーターは
            <a href="#salary" className="text-secondary font-bold underline ml-1 hover:text-rose-700">
              お給料・待遇セクション
            </a>
            をご確認ください。
          </p>
        </div>
      )
    }
  ];

  return (
    <section className="py-16 bg-white border-t border-rose-100/60" id="requirements">
      <div className="max-w-[900px] mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-0.5 rounded-full text-secondary font-bold text-xs tracking-wider uppercase mb-2.5">
            <LucideIcon name="FileCheck" size={13} />
            <span>APPLICATION REQUIREMENTS</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-on-surface mb-3">
            募集要項
          </h2>
          <p className="font-sans text-xs md:text-sm text-on-surface-variant max-w-xl mx-auto leading-relaxed">
            飛田新地料理組合の規定に基づく応募資格・必要書類・勤務条件の概要です。
          </p>
        </div>

        {/* Clean Spec Table / Card Container */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
          <dl className="divide-y divide-rose-100">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-1 md:grid-cols-12 p-5 sm:p-6 gap-2 md:gap-6 hover:bg-rose-50/20 transition-colors">
                <dt className="md:col-span-3 font-display font-bold text-sm sm:text-base text-on-surface flex items-start gap-2">
                  <span className="w-1.5 h-4 bg-secondary rounded-full shrink-0 mt-1 inline-block" />
                  <span>{spec.label}</span>
                </dt>
                <dd className="md:col-span-9">
                  {spec.content}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Quick Question / LINE Link */}
        <div className="mt-8 text-center">
          <p className="text-xs sm:text-sm text-on-surface-variant mb-3">
            書類の取得方法やシフトについてなど、ご不明な点はお気軽にLINEでお問い合わせください。
          </p>
          <a
            href={LINE_OFFICIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#06c755] hover:bg-[#05b34c] text-white font-sans font-bold text-xs sm:text-sm py-2.5 px-6 rounded-full shadow-xs hover:shadow-md transition-all"
            id="requirements-line-cta"
          >
            <LucideIcon name="MessageCircle" size={16} className="fill-white text-white" />
            <span>LINEで質問・相談する</span>
          </a>
        </div>

      </div>
    </section>
  );
}
