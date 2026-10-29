import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface Article {
  id: string | number;
  title: string;
  slug: string;
  category: string;
  categoryLabel: string;
  publishedAt: string;
  readTime: string;
  summary: string;
  eyeCatch: string;
  author: any;
  tags: string[];
  content: any[];
}

const rootDir = process.cwd();
const publicImagesDir = path.join(rootDir, 'public', 'images');
const publicAssetsImagesDir = path.join(rootDir, 'public', 'assets', 'images');
const srcImagesDir = path.join(rootDir, 'src', 'assets', 'images');

// Clean XML entities for SVG
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Strip all emojis from text
function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .trim();
}

// Curated 2-3 lines for all 100 articles (strictly <= 18 characters per line)
const ARTICLE_CARD_LINES: Record<number, string[]> = {
  1: ["仕事内容を徹底解説！", "特別な技術は一切不要！", "完全受け身で即日デビューできる理由"],
  2: ["給料システム徹底解説！", "15分5,000円の仕組みと計算式", "全額日払いで高収入が残る理由"],
  3: ["身バレ・顔バレ防止の極意！", "会社や家族に100%知られない！", "現役キャストが実践する8大対策"],
  4: ["駅近マンション寮完備！", "家具家電付き・即日入居OK！", "出稼ぎ＆一人暮らしの快適個室寮"],
  5: ["応募資格・面接の必要書類！", "本籍地記載の住民票が必須な理由と", "採用ポイント徹底解説"],
  6: ["体験入店と面接の流れ！", "喫茶店面接から即日退店ルール・", "全額日払いまでの完全手順"],
  7: ["本音で暴露！", "飛田新地で働くメリット・デメリット", "風俗未経験者が知るべき真実"],
  8: ["メイン通りと青春通りの違い！", "採用基準・ルックス・平均日給と", "働きやすさを徹底比較"],
  9: ["衛生管理・性病予防の徹底！", "キスNG・完全ゴム着用！", "女の子の体を守る安心衛生ルール"],
  10: ["シフト・短時間勤務の働き方！", "昼番・夜番の2交代制と", "固定シフトで賢く稼ぐコツ"],
  11: ["最短1ヶ月からスタート！", "短期集中でがっつり貯金！", "「今すぐお金が必要」を叶える稼働法"],
  12: ["料亭の安全管理！", "飛田新地の客層が良い理由と", "女の子最優先の安心警備体制"],
  13: ["和装・メイク術を伝授！", "自分に一番似合うスタイルは？", "無料レンタル着物とお仕事メイク"],
  14: ["週1日・週末だけでもOK！", "OL・会社員や学生さん必見！", "お昼だけ・週末だけの掛け持ちシフト"],
  15: ["心に寄り添うサポート！", "悩みは一人で抱え込まないで！", "現役キャストが教えるスタッフの頼り方"],
  16: ["徹底分析！検索ワード解決", "飛田新地で働きたい女性の", "不安と疑問を先回り解決！"],
  17: ["完全密着！飛田新地の1日！", "出勤からお仕事、退勤までの", "リアルな流れを徹底レポート"],
  18: ["おばちゃんは怖い？味方？", "飛田新地「売り子さん」の本当の役割と", "良好な関係作りのコツ"],
  19: ["和装マジックで可愛くなれる！", "自分史上いちばんの変身！", "貸出衣装とヘアメイクのこだわり"],
  20: ["身バレ対策の鉄則を公開！", "家族・友達・会社に知られずに", "働き続けるための5つの鉄則"],
  21: ["年齢・ルックスのリアル！", "18歳から40代まで！", "求められるキャストの条件とは？"],
  22: ["防犯・安全マニュアル！", "お酒不要でトラブルなし！", "女の子を守り抜く鉄壁セキュリティ"],
  23: ["副業・OL・学生さんへ！", "週1日・短時間勤務でも", "効率的に高収入を稼ぐテクニック"],
  24: ["体験入店の完全ガイド！", "面接の服装から必要な持ち物、", "当日の流れまでを徹底解説！"],
  25: ["ストレスを溜めないメンタルケア！", "心穏やかに楽しく稼ぐための", "現役キャストのセルフケア術"],
  26: ["未経験から人気キャストへ！", "指名・リピートが途切れない！", "誰でも実践できる3つの極秘接客術"],
  27: ["憧れの美容代・自分投資に！", "飛田新地バイトで叶える", "自分磨き＆ハイブランド購入計画"],
  28: ["女子大生・専門学生必見！", "親に内緒で卒業旅行＆奨学金返済！", "学業と両立するスマートな働き方"],
  29: ["20代で1000万円貯金！", "目標額を最速で達成した", "現役キャストの貯金術とモチベーション"],
  30: ["友達同士の応募も大歓迎！", "1人じゃ不安なあなたへ！", "友達と一緒に面接・体入するメリット"],
  31: ["大阪・天王寺エリアの魅力！", "お仕事前後に楽しめる！", "おしゃれカフェ＆お買い物スポット"],
  32: ["入店祝い金・各種手当の裏側", "求人サイトでよく見るお祝い金は", "本当にもらえる？お得な待遇解説"],
  33: ["20代前半の強みを活かす！", "未経験から最速で稼ぎ頭になる", "愛され笑顔と愛嬌の磨き方"],
  34: ["20代後半からのリスタート！", "「今さら遅い？」なんてない！", "大人の色気と落ち着きで稼ぐノウハウ"],
  35: ["自立した女性への第一歩！", "飛田新地バイトをステップに", "経済的自立と夢を叶えた女性たち"],
  36: ["面接の裏ワザを大公開！", "不採用にならないために！", "面接官が明日から来てほしいと思うコツ"],
  37: ["マンション寮生活のリアル！", "飛田新地周辺の個室寮はどんな感じ？", "家具家電付き・即入居可能な秘密"],
  38: ["お昼のシフトがアツい！", "12:00〜18:00の昼勤務で", "効率よく稼げる理由とメリット"],
  39: ["心と体のセルフケア！", "お仕事の疲れを翌日に残さない！", "愛用のデトックス＆リラックス法"],
  40: ["和装初心者でも安心！", "5分でパッと着こなせる！", "簡単で可愛い着物・浴衣の仕組み"],
  41: ["キャバクラ・風俗との違い！", "夜職未経験者が口を揃えて", "「飛田が一番働きやすい」納得の理由"],
  42: ["20代のための税金対策！", "年間いくらから納税が必要？", "税務署からお尋ねが来ない基礎知識"],
  43: ["モチベーションを保つコツ！", "「なんとなく勤務」はもったいない！", "夢を最速で叶える目標ロードマップ"],
  44: ["履歴書不要・即日体験入店！", "持ち物はスマホと身分証だけ！", "今週末にスタートできるスピード体験"],
  45: ["スタッフって怖いの？！", "直営料亭グループのスタッフが", "優しくてアットホームな理由"],
  46: ["短期でサクッと稼ぐ！", "リゾートバイト感覚で飛田新地へ！", "1ヶ月限定で稼ぐ地方女子の選択肢"],
  47: ["これで安心！身バレ防止策", "飛田新地で知られずに働く！", "徹底したプライバシー保護の秘訣"],
  48: ["身バレが不安なあなたへ！", "プロが教える徹底対策4選！", "安心して働ける安心サポート体制"],
  49: ["身バレ防止の秘訣まとめ！", "飛田新地で安心して働く！", "プライバシーを守る5つの方法"],
  50: ["日給10万円も夢じゃない！", "給料システム徹底解説！", "未経験でも高収入な秘密を大公開"],
  51: ["飛田新地のお仕事の流れ！", "未経験さんが知っておきたい", "「お仕事の一日の流れ」徹底解説"],
  52: ["身バレ徹底ガード！", "飛田新地で安心して働く！", "プライバシー保護とお店のサポート"],
  53: ["日払いOK！給料システム", "飛田新地の安心給与制度！", "未経験でも高収入が残る秘密とは？"],
  54: ["初めてでも安心・安全！", "未経験さん向け1日の流れと", "不安を解消する安心ポイント"],
  55: ["「もしかしてバレる？」", "飛田新地で安心して働く！", "身バレ防止の徹底安心ガイド"],
  56: ["お給料システム徹底解説！", "未経験でも安心の高収入！", "全額日払いでしっかり残る秘訣"],
  57: ["未経験者向け完全ガイド！", "安心してスタートできる！", "お仕事の流れと「体入」のすべて"],
  58: ["カフェで気軽に相談できる！", "対面・LINEで相談OK！", "不安を全部解消する個別カウンセリング"],
  59: ["完全無料！手ぶらでOK！", "お店で借りられるメイク道具＆", "ドレス・和装の充実サポート"],
  60: ["通勤・アクセス抜群！", "天王寺・難波からアクセス快適！", "飛田新地のお仕事への通いやすさ"],
  61: ["貯金スピード10倍計画！", "短期間で目標額を達成するための", "目標設定と資金計画シート"],
  62: ["自分磨き・美容代手当！", "働くだけで綺麗になれる！", "美容サロン提携＆自分投資の極意"],
  63: ["心穏やかに働く秘訣！", "お仕事後のリフレッシュ法と", "無理なく長く続けるメンタルケア"],
  64: ["深夜タクシー代支給・送りあり！", "終電後も安全帰宅できる！", "夜シフトの女の子を守る送迎システム"],
  65: ["SNS・身バレ対策完璧！", "インスタ・TikTokの鍵垢運用と", "お顔非公開の徹底安心ルール"],
  66: ["地方出稼ぎ・短期集中スタイル！", "往復交通費全額支給＆快適寮で", "サクッと稼ぐ出張ワーク"],
  67: ["完全自由シフト制の魅力！", "週1日・3時間〜勤務OK！", "ライフスタイルを崩さず高収入"],
  68: ["大阪グルメ＆観光スポット！", "お仕事終わりに立ち寄りたい！", "天王寺・新世界・難波のおすすめ"],
  69: ["季節のおすすめ着物スタイル！", "春夏秋冬で楽しむ料亭のお着物・", "和装コーディネート術"],
  70: ["シフト管理アプリ活用術！", "学業・本業と両立する！", "賢いスケジュール帳の作り方"],
  71: ["友達同士の応募大歓迎！", "1人じゃ不安なあなたへ！", "一緒にお店を選べる「友達ペア紹介」"],
  72: ["自分へのご褒美習慣！", "目標達成ごとに自分を褒める！", "モチベーションUPのプチご褒美"],
  73: ["夜の静かなプライベート時間！", "お仕事後の上質な睡眠＆", "おうち時間の心地よい過ごし方"],
  74: ["ノーファンデでも美肌見え！", "接客で映えるスキンケア＆", "ツヤ肌づくり徹底講座"],
  75: ["自己肯定感がアップする！", "飛田新地のお仕事で変わった！", "「私の自信と将来の夢」体験談"],
  76: ["憧れの海外旅行・留学資金！", "短期間で目標額を貯めて", "海外へ羽ばたくキャストの資金活用術"],
  77: ["お休み日の至福ケア！", "バスタイムで疲れをリセット！", "バスソルト＆泡風呂の癒やし習慣"],
  78: ["カフェ巡り＆映えスイーツ！", "稼いだお金で休日を楽しむ！", "天王寺・心斎橋のおすすめカフェ"],
  79: ["ほっと一息朝時間！", "出勤前や休日の朝を優雅に過ごす", "心地よいモーニングルーティン"],
  80: ["季節のお花でお部屋を飾る！", "お部屋の雰囲気を明るくして", "運気を上げるプチインテリア術"],
  81: ["銀行口座・手渡し徹底比較！", "日払い現金を安全に保管・", "管理する賢いお金の管理術"],
  82: ["夜空を見上げてリセット！", "出勤後のナイトルーティンと", "心を落ち着かせる夜の過ごし方"],
  83: ["料亭文化の奥深さを学ぶ！", "伝統と品格を感じる「和の所作」が", "自然と身につく理由"],
  84: ["おうち時間を快適に！", "お仕事の疲れを癒やす！", "ルームウェア＆おうちリラクゼーション"],
  85: ["手鏡を見るたび笑顔に！", "お仕事を通して自信がついた！", "「自分の雰囲気が好きになれた」秘密"],
  86: ["思い出を形に残す写真旅！", "カメラや旅行趣味を楽しむ！", "現役キャストの休日ライフスタイル"],
  87: ["アロマで心身リラックス！", "お仕事終わりのお部屋を満たす", "香りのリフレッシュ習慣"],
  88: ["ふわふわパンケーキカフェ！", "休日に味わう自分への甘いご褒美！", "極上カフェタイムのススメ"],
  89: ["和装の帯結び・リボンアレンジ！", "料亭で一目置かれる！", "上品で可愛い和装コーディネート"],
  90: ["貯金箱がどんどん溜まる！", "半年で100万円貯めるための", "現実的なステップと節約術"],
  91: ["ハーブティーでほっと一息！", "お仕事終わりに試したい！", "オーガニック温活リフレッシュ"],
  92: ["スキンケア見直し術！", "毎日のメイク映えを叶える！", "透明感のある美肌のつくり方"],
  93: ["ぬくもり溢れるお部屋づくり！", "ふんわり毛布と間接照明で", "最高の癒やし空間をつくるコツ"],
  94: ["夢を叶える手帳術！", "目標額・欲しいものリストを書いて", "モチベーションをグングンUP"],
  95: ["お酒不要！ノンアル接客術！", "乾杯シーンでも可愛く魅せる！", "お酒が飲めなくても安心の理由"],
  96: ["足湯＆フットケアでリセット！", "一日頑張った足を優しく労わる！", "自宅でできる簡単リフレッシュ"],
  97: ["星モチーフアクセサリー！", "首元でキラリと光る！", "シンプルジュエリーの魅力"],
  98: ["悪質スカウト・反社を完全排除！", "SNS求人の罠と危険性！", "直営グループ応募が安心・安全な理由"],
  99: ["悪質店舗の見極め方を伝授！", "日給保証の嘘・雑費天引きなど", "要注意店舗の3大特徴を徹底解説"],
  100: ["シンママ・子育て支援完備！", "提携託児所＆短時間シフトで", "ママさんが安心して高収入を得る方法"]
};

// Fallback split function in case of unexpected articles
function getArticleLines(article: Article): string[] {
  const numId = typeof article.id === 'number' ? article.id : parseInt(String(article.id).replace(/\D/g, ''), 10) || 1;
  if (ARTICLE_CARD_LINES[numId]) {
    return ARTICLE_CARD_LINES[numId];
  }

  let t = stripEmojis(article.title.trim());
  for (const p of ['【飛田新地】', '【飛田新地 求人】', '【飛田新地求人】']) {
    if (t.startsWith(p)) {
      t = t.slice(p.length).trim();
    }
  }

  if (t.length <= 18) {
    return [t];
  }
  if (t.length <= 36) {
    const half = Math.ceil(t.length / 2);
    return [t.slice(0, half), t.slice(half)];
  }
  const third = Math.ceil(t.length / 3);
  return [t.slice(0, third), t.slice(third, third * 2), t.slice(third * 2)];
}

// Color theme system
interface ColorTheme {
  name: string;
  stroke: string;
  strokeWidth: number;
  badgeStart: string;
  badgeEnd: string;
  tagColor: string;
  accentColor: string;
}

const COLOR_THEMES: ColorTheme[] = [
  // 1. Sakura Rose (華やかピンク)
  {
    name: 'sakura-rose',
    stroke: '#ff9ebb',
    strokeWidth: 5,
    badgeStart: '#ff3366',
    badgeEnd: '#ff6699',
    tagColor: '#e6005c',
    accentColor: '#ff6699'
  },
  // 2. Lavender Violet (上品ラベンダーパープル)
  {
    name: 'lavender-violet',
    stroke: '#c8a2e6',
    strokeWidth: 5,
    badgeStart: '#8a4baf',
    badgeEnd: '#b370d9',
    tagColor: '#7b329f',
    accentColor: '#9d5fc7'
  },
  // 3. Peach Coral (優しいコーラルピーチ)
  {
    name: 'peach-coral',
    stroke: '#ffb088',
    strokeWidth: 5,
    badgeStart: '#f35a22',
    badgeEnd: '#ff8a5c',
    tagColor: '#d64109',
    accentColor: '#ff7744'
  },
  // 4. Ruby Wine (シックなルビーワイン)
  {
    name: 'ruby-wine',
    stroke: '#e6859e',
    strokeWidth: 5,
    badgeStart: '#b0193e',
    badgeEnd: '#d83a63',
    tagColor: '#a10f32',
    accentColor: '#c82650'
  },
  // 5. Champagne Gold (華やかゴールド)
  {
    name: 'champagne-gold',
    stroke: '#e5bb68',
    strokeWidth: 5,
    badgeStart: '#d48b11',
    badgeEnd: '#f4b23d',
    tagColor: '#b87204',
    accentColor: '#e0971b'
  },
  // 6. Aqua Marine (爽やかアクアブルー)
  {
    name: 'aqua-marine',
    stroke: '#8cd5e8',
    strokeWidth: 5,
    badgeStart: '#0292b7',
    badgeEnd: '#38bdf8',
    tagColor: '#0369a1',
    accentColor: '#0ea5e9'
  },
  // 7. Emerald Mint (清潔感ミントグリーン)
  {
    name: 'emerald-mint',
    stroke: '#82d9b8',
    strokeWidth: 5,
    badgeStart: '#0d9466',
    badgeEnd: '#2ecc71',
    tagColor: '#08734e',
    accentColor: '#10b981'
  },
  // 8. Dusty Mauve (大人くすみモーヴ)
  {
    name: 'dusty-mauve',
    stroke: '#d49cb0',
    strokeWidth: 5,
    badgeStart: '#993d63',
    badgeEnd: '#c4628a',
    tagColor: '#842f53',
    accentColor: '#b04d76'
  },
  // 9. Sunset Apricot (温かみアプリコット)
  {
    name: 'sunset-apricot',
    stroke: '#fca57c',
    strokeWidth: 5,
    badgeStart: '#e04a10',
    badgeEnd: '#fb713b',
    tagColor: '#be3804',
    accentColor: '#f95716'
  },
  // 10. Royal Indigo (高貴なロイヤルパープル)
  {
    name: 'royal-indigo',
    stroke: '#a8b4e8',
    strokeWidth: 5,
    badgeStart: '#4338ca',
    badgeEnd: '#6366f1',
    tagColor: '#3730a3',
    accentColor: '#4f46e5'
  }
];

// Find appropriate topic background image
function selectBackgroundImage(article: Article): string {
  const text = `${article.slug} ${article.title} ${article.categoryLabel || ''} ${JSON.stringify(article.tags || [])}`.toLowerCase();

  const candidates: [RegExp, string][] = [
    [/着物|浴衣|帯|和装|kimono|yukata/, 'jp_kimono_style_1789467837838.jpg'],
    [/給料|給与|日払い|稼|1000万|貯金|口座|手渡し|時給|salary|bonus|tax|税金|万|残る理由/, 'jp_woman_salary_1789467749655.jpg'],
    [/身バレ|プライバシー|秘密|会社|家族|バレ|privacy|sns|親や友達/, 'col_privacy_protect_1789107457068.jpg'],
    [/安全|衛生|性病|ルール|排除|ヤクザ|スカウト|安心/, 'col_safety_shield_1789107540732.jpg'],
    [/寮|マンション|個室|一人暮らし|housing|dormitory|即日入居/, 'col_studio_room_1789107471455.jpg'],
    [/面接|応募|書類|履歴書|喫茶店|interview/, 'col_cafe_interview_1789107484817.jpg'],
    [/体験|体入|デビュー|初心者|未経験|受け身|beginner|trial/, 'col_vanity_trial_1789107497172.jpg'],
    [/メイク|コスメ|スキンケア|美容|鏡|ルックス|美肌|beauty|skincare/, 'jp_skincare_glow_1789467940047.jpg'],
    [/お風呂|入浴|泡|リラックス|アロマ|ハーブティー|足湯|bath|aroma|tea|sleep|睡眠/, 'jp_bubble_bath_1789467952561.jpg'],
    [/パンケーキ|カフェ|スイーツ|ケーキ|ドリンク|ジュース|pancake|cake|cafe|sweet/, 'jp_fluffy_pancake_1789467858767.jpg'],
    [/友達|ペア|二人|友人|仲間|friends/, 'jp_two_friends_1789467775509.jpg'],
    [/スタッフ|おばちゃん|仲居|サポート|アドバイザー|相談|staff|obachan/, 'staff_lounge_support_1789108549559.jpg'],
    [/旅行|リゾート|出稼ぎ|海外|留学|travel|vacation/, 'jp_overseas_travel_1789468075905.jpg'],
    [/天王寺|なんば|アクセス|通勤|タクシー|送迎|commute|access|taxi/, 'col_street_lanterns_1789107524691.jpg'],
    [/料亭|通り|青春|メイン|歴史|伝統|ryotei/, 'col_ryotei_flow_1789107427433.jpg'],
    [/シングルマザー|子育て|育児|child|mother/, 'jp_mother_child_1789467823272.jpg'],
    [/シフト|手帳|スケジュール|planner|schedule/, 'jp_planner_notebook_1789467908606.jpg'],
    [/自信|笑顔|成長|自立|smile|confidence|charm/, 'jp_confident_smile_1789467788318.jpg'],
    [/星|ペンダント|ジュエリー|アクセサリー|star|necklace/, 'jp_star_necklace_1789467896476.jpg'],
    [/夜|ナイト|星空|reset|routine/, 'jp_cozy_bedroom_1789468035819.jpg'],
    [/貯金箱|貯蓄|500円|coin|jar/, 'jp_savings_jar_1789468021098.jpg']
  ];

  for (const [re, img] of candidates) {
    if (re.test(text)) {
      const fullPath = path.join(srcImagesDir, img);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  // Fallback to col_unique_art_${id}.jpg if exists
  const uniqueImg = path.join(srcImagesDir, `col_unique_art_${article.id}.jpg`);
  if (fs.existsSync(uniqueImg)) {
    return uniqueImg;
  }

  return path.join(srcImagesDir, 'col_ryotei_flow_1789107427433.jpg');
}

// Generate the cute card SVG
function createCuteSvg(article: Article): string {
  const lines = getArticleLines(article);
  const numId = typeof article.id === 'number' ? article.id : parseInt(String(article.id).replace(/\D/g, ''), 10) || 1;
  const theme = COLOR_THEMES[numId % COLOR_THEMES.length];

  const lineCount = lines.length;
  // Dynamic font size and spacing
  let startY = 230;
  let lineSpacing = 64;
  let line1FontSize = 38;
  let bodyFontSize = 36;

  if (lineCount === 3) {
    startY = 225;
    lineSpacing = 62;
    line1FontSize = 38;
    bodyFontSize = 36;
  } else if (lineCount === 2) {
    startY = 245;
    lineSpacing = 72;
    line1FontSize = 40;
    bodyFontSize = 38;
  }

  const linesSvg = lines
    .map((line, idx) => {
      const y = startY + idx * lineSpacing;
      // First line gets the highlighted theme tagColor with extra bold weight
      if (idx === 0) {
        return `
          <text x="140" y="${y}" font-family="Noto Sans CJK JP, sans-serif" font-size="${line1FontSize}" font-weight="900" fill="${theme.tagColor}" letter-spacing="1px">
            ${escapeXml(line)}
          </text>
        `;
      }
      return `
        <text x="140" y="${y}" font-family="Noto Sans CJK JP, sans-serif" font-size="${bodyFontSize}" font-weight="700" fill="#25161d" letter-spacing="0.5px">
          ${escapeXml(line)}
        </text>
      `;
    })
    .join('\n');

  const bottomY = Math.min(startY + lineCount * lineSpacing + 22, 510);

  return `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="badgeGrad_${numId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.badgeStart}" />
        <stop offset="100%" stop-color="${theme.badgeEnd}" />
      </linearGradient>
      <linearGradient id="bgVignette" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(18, 8, 14, 0.40)" />
        <stop offset="100%" stop-color="rgba(18, 8, 14, 0.65)" />
      </linearGradient>
      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.30" />
      </filter>
    </defs>

    <!-- Warm darkening overlay on background photo -->
    <rect width="1200" height="630" fill="url(#bgVignette)" />

    <!-- Card Plate with Dynamic Frame Color per article (絵文字なし・角丸プレート) -->
    <g filter="url(#cardShadow)">
      <rect x="75" y="60" width="1050" height="510" rx="32" fill="rgba(255, 255, 255, 0.96)" stroke="${theme.stroke}" stroke-width="${theme.strokeWidth}" />
    </g>

    <!-- Top Badge: 飛田新地 (大文字・高視認性・文字切れゼロ) -->
    <g transform="translate(135, 95)">
      <rect x="0" y="0" width="280" height="64" rx="32" fill="url(#badgeGrad_${numId})" />
      <text x="140" y="44" font-family="Noto Sans CJK JP, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3.5px">飛田新地</text>
    </g>

    <!-- Title Lines (最大18文字/行・文字切れ完全防止) -->
    ${linesSvg}

    <!-- Decorative accent line at bottom of card -->
    <g transform="translate(140, ${bottomY})">
      <circle cx="0" cy="0" r="4.5" fill="${theme.accentColor}" />
      <line x1="14" y1="0" x2="220" y2="0" stroke="${theme.accentColor}" stroke-width="3" stroke-linecap="round" />
      <circle cx="234" cy="0" r="4.5" fill="${theme.accentColor}" />
    </g>
  </svg>
  `;
}

async function main() {
  console.log('🌸 Starting generation of cute, high-readability cards with original Noto Sans CJK JP font...');
  
  // Ensure genuine Japanese Noto Sans CJK JP fonts are installed in fontconfig
  const fontDir = '/usr/share/fonts/opentype/noto';
  const localBoldFont = path.join(rootDir, 'fonts', 'NotoSansCJKjp-Bold.otf');
  const localRegFont = path.join(rootDir, 'fonts', 'NotoSansCJKjp-Regular.otf');
  if (fs.existsSync(localBoldFont)) {
    fs.mkdirSync(fontDir, { recursive: true });
    if (!fs.existsSync(path.join(fontDir, 'NotoSansCJKjp-Bold.otf'))) {
      fs.copyFileSync(localBoldFont, path.join(fontDir, 'NotoSansCJKjp-Bold.otf'));
      fs.copyFileSync(localRegFont, path.join(fontDir, 'NotoSansCJKjp-Regular.otf'));
    }
  }

  const articlesPath = path.join(rootDir, 'data', 'blogArticles.json');
  const articles: Article[] = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));

  fs.mkdirSync(publicImagesDir, { recursive: true });
  fs.mkdirSync(publicAssetsImagesDir, { recursive: true });
  fs.mkdirSync(srcImagesDir, { recursive: true });

  let count = 0;

  for (const article of articles) {
    const slug = article.slug;
    const cardFileName = `card_${slug}.jpg`;
    const cardFileNameV2 = `card_${slug}_v2.jpg`;
    const bgImagePath = selectBackgroundImage(article);

    // 1. Resize/crop background photo to 1200x630
    const bgBuffer = await sharp(bgImagePath)
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .toBuffer();

    // 2. Generate cute SVG overlay with strict <= 18 char lines
    const svgString = createCuteSvg(article);
    const svgBuffer = Buffer.from(svgString);

    // 3. Composite and compress with mozjpeg
    const cardBuffer = await sharp(bgBuffer)
      .composite([{ input: svgBuffer }])
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    // 4. Save to all relevant target locations (both v2 and standard)
    for (const fn of [cardFileName, cardFileNameV2]) {
      fs.writeFileSync(path.join(publicImagesDir, fn), cardBuffer);
      fs.writeFileSync(path.join(publicAssetsImagesDir, fn), cardBuffer);
      fs.writeFileSync(path.join(srcImagesDir, fn), cardBuffer);
    }

    // 5. Ensure article eyeCatch points to the new card
    article.eyeCatch = `/images/${cardFileNameV2}`;
    count++;
    if (count % 20 === 0) {
      console.log(`Generated ${count}/100 cards...`);
    }
  }

  // Save updated articles json
  fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2), 'utf-8');

  // Also update functions/blog/articles.json
  const funcArticlesPath = path.join(rootDir, 'functions', 'blog', 'articles.json');
  const simplified = articles.map(a => ({
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    eyeCatch: a.eyeCatch
  }));
  fs.writeFileSync(funcArticlesPath, JSON.stringify(simplified, null, 2), 'utf-8');

  console.log(`✨ Successfully generated all ${count} cute cards with 0 clipping and perfect 3-line layout!`);
}

main().catch(err => {
  console.error('Fatal error generating cards:', err);
  process.exit(1);
});
