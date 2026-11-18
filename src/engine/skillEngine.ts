import {
  Player,
  PlayerSkillDefinition,
  PlayerSkillInstance,
  SkillCategory,
  SkillHistoryEntry,
  SkillProficiencyTier
} from '../types/game';

export const SKILL_TIERS_ORDER: SkillProficiencyTier[] = ['通常', '成長中', '熟練', '卓越'];

export const SKILL_TIER_MULTIPLIER: Record<SkillProficiencyTier, number> = {
  '通常': 1.0,
  '成長中': 1.25,
  '熟練': 1.6,
  '卓越': 2.0
};

export const NORMAL_SKILLS_CATALOG: PlayerSkillDefinition[] = [
  // A. シュート・フィニッシュ系（1〜12）
  { id: 'skill_01', num: 1, name: 'ワンタッチゴール', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: 'エリア内のダイレクトシュート精度と反応速度を高める。', declineResistant: true },
  { id: 'skill_02', num: 2, name: 'カーブシュート', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: '大きく曲がり落ちるシュートでGKの届かない隅を狙う。', declineResistant: true },
  { id: 'skill_03', num: 3, name: 'コントロールショット', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: '威力よりもコースを優先し、高い決定率を誇るフィニッシュ。', declineResistant: true },
  { id: 'skill_04', num: 4, name: 'ライジングシュート', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: '低い弾道からホップして伸びる強烈なシュート。', declineResistant: false },
  { id: 'skill_05', num: 5, name: 'ミドルシュート', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: 'ペナルティエリア外から強烈で正確なシュートを放つ。', declineResistant: true },
  { id: 'skill_06', num: 6, name: 'ロングシュート', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: '遠距離からでもゴールを脅かすシュートレンジを持つ。', declineResistant: false },
  { id: 'skill_07', num: 7, name: 'ヘディング', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: 'クロスやセットプレーでの打点とヘッドの精度に優れる。', declineResistant: false },
  { id: 'skill_08', num: 8, name: 'アクロバティックフィニッシュ', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: 'ボレーやジャンピングボレーなど難しい体勢から決め切る。', declineResistant: false },
  { id: 'skill_09', num: 9, name: 'ニア狙い', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: '角度のない状況からでもニアサイド上を射抜く判断力。', declineResistant: true },
  { id: 'skill_10', num: 10, name: 'ファー狙い', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: 'サイドや斜めの角度からファーサイドへ流し込む技術。', declineResistant: true },
  { id: 'skill_11', num: 11, name: 'チップシュート', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: '飛び出したGKの頭上をふわりと越す冷静なループ技術。', declineResistant: true },
  { id: 'skill_12', num: 12, name: 'ペナルティエリアの嗅覚', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: false, isGkOnly: false, description: 'こぼれ球や危険なスペースへ誰よりも早く反応して詰める。', declineResistant: true },

  // B. ドリブル・突破・ボールキープ系（13〜22）
  { id: 'skill_13', num: 13, name: 'シザース', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: false, isGkOnly: false, description: '素早い跨ぎフェイントでDFの重心を揺さぶり縦へ抜ける。', declineResistant: false },
  { id: 'skill_14', num: 14, name: 'ダブルタッチ', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: false, isGkOnly: false, description: '密集地帯でも一瞬の左右タッチで相手を置き去りにする。', declineResistant: true },
  { id: 'skill_15', num: 15, name: 'カットイン', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: false, isGkOnly: false, description: 'サイドから中央へ鋭く切れ込み、シュート・パスコースを作る。', declineResistant: false },
  { id: 'skill_16', num: 16, name: '縦突破', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: false, isGkOnly: false, description: 'タッチライン際を爆発的に加速しクロスへ繋げる。', declineResistant: false },
  { id: 'skill_17', num: 17, name: '高速ドリブル', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: false, isGkOnly: false, description: 'トップスピードを維持したまま繊細にボールを運ぶ。', declineResistant: false },
  { id: 'skill_18', num: 18, name: 'ボディフェイント', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: false, isGkOnly: false, description: '上半身の動きだけで相手のタイミングを外す技術。', declineResistant: true },
  { id: 'skill_19', num: 19, name: 'ターン', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: false, isGkOnly: false, description: '背負った状態から素早く前を向く半身のターンスキル。', declineResistant: true },
  { id: 'skill_20', num: 20, name: 'ボールキープ', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: false, isGkOnly: false, description: 'プレッシャー下でも体と腕を使ってボールを失わない。', declineResistant: true },
  { id: 'skill_21', num: 21, name: '反転突破', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: false, isGkOnly: false, description: '狭いバイタルエリアで一瞬の反転から前線へ抜け出す。', declineResistant: false },
  { id: 'skill_22', num: 22, name: '1対1打開', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: false, isGkOnly: false, description: '対峙するDFを孤立させて確実に局面を打開する突破力。', declineResistant: false },

  // C. パス・展開・チャンスメイク系（23〜34）
  { id: 'skill_23', num: 23, name: 'スルーパス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: 'DFラインのギャップを突く決定的スルーパスを供給する。', declineResistant: true },
  { id: 'skill_24', num: 24, name: 'ワンタッチパス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: 'ダイレクトのテンポ良いパスワークで相手のプレスを剥がす。', declineResistant: true },
  { id: 'skill_25', num: 25, name: 'フライスルーパス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: '相手DFの頭上を越える正確な浮き球のラストパス。', declineResistant: true },
  { id: 'skill_26', num: 26, name: 'ロングパス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: '中盤や最終ラインから高精度のロングフィードを届ける。', declineResistant: true },
  { id: 'skill_27', num: 27, name: 'サイドチェンジ', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: '逆サイドのフリーの味方へ一気に展開し守備網を広げる。', declineResistant: true },
  { id: 'skill_28', num: 28, name: 'ピンポイントクロス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: 'アタッカーの頭や足元にピタリと合わせる高精度クロス。', declineResistant: true },
  { id: 'skill_29', num: 29, name: '低弾道クロス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: 'GKとDFの間に鋭く速いグラウンダー気味のクロスを入れる。', declineResistant: true },
  { id: 'skill_30', num: 30, name: 'アーリークロス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: '相手守備が整う前に素早くゴール前へボールを送り込む。', declineResistant: true },
  { id: 'skill_31', num: 31, name: 'グラウンダーパス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: '芝を這う正確で受けやすい縦パス・楔のパス。', declineResistant: true },
  { id: 'skill_32', num: 32, name: 'アウトスピンパス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: '利き足外側の回転を操り意外性のあるパスを通す。', declineResistant: true },
  { id: 'skill_33', num: 33, name: 'バックスピンパス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: 'バックスピンで減速させ走り込む味方に収める絶妙パス。', declineResistant: true },
  { id: 'skill_34', num: 34, name: 'ラストパス', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: false, isGkOnly: false, description: 'ゴールに直結する最終局面の決定機演出に長ける。', declineResistant: true },

  // D. 守備・ボール奪取・ポジショニング系（35〜45）
  { id: 'skill_35', num: 35, name: 'インターセプト', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: 'パスコースを先読みし、鋭い出足でボールを遮断する。', declineResistant: true },
  { id: 'skill_36', num: 36, name: 'マンマーク', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: '相手キーマンに密着して自由を奪い仕事をさせない。', declineResistant: false },
  { id: 'skill_37', num: 37, name: 'スライディング', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: '正確なタイミングのスライディングでクリーンに奪い切る。', declineResistant: false },
  { id: 'skill_38', num: 38, name: 'スタンディングタックル', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: '足を伸ばさず重心バランスを保ったままクリーンに奪取。', declineResistant: true },
  { id: 'skill_39', num: 39, name: 'ブロッカー', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: 'シュートコースやクロスコースへ体を投げ出してブロック。', declineResistant: true },
  { id: 'skill_40', num: 40, name: 'カバーリング', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: '味方が抜かれた背後のスペースを察知し即座に埋める。', declineResistant: true },
  { id: 'skill_41', num: 41, name: '空中戦', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: '競り合いの高さと強さでロングボールやクロスを跳ね返す。', declineResistant: false },
  { id: 'skill_42', num: 42, name: '対人守備', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: '1対1のデュエルでフェイントに釣られず確実に止める。', declineResistant: false },
  { id: 'skill_43', num: 43, name: 'ライン統率', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: 'DFラインの上げ下げとオフサイドトラップを高精度で統率。', declineResistant: true },
  { id: 'skill_44', num: 44, name: 'プレス耐性', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: '自陣からのビルドアップ時に相手の激しいプレスをいなす。', declineResistant: true },
  { id: 'skill_45', num: 45, name: '奪取後の即時展開', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: false, isGkOnly: false, description: 'ボール奪取直後のファーストパスで一気にカウンターへ繋ぐ。', declineResistant: true },

  // E. フィジカル・運動量・プレースタイル系（46〜54）
  { id: 'skill_46', num: 46, name: '無尽蔵スタミナ', category: 'E', categoryName: 'フィジカル・運動量・プレースタイル系', isRare: false, isGkOnly: false, description: '90分を通して運動量が落ちず疲労蓄積を軽減する。', declineResistant: false },
  { id: 'skill_47', num: 47, name: '爆発的加速', category: 'E', categoryName: 'フィジカル・運動量・プレースタイル系', isRare: false, isGkOnly: false, description: '停止状態や低速から一瞬で相手を置き去りにする初速。', declineResistant: false },
  { id: 'skill_48', num: 48, name: 'フィジカルコンタクト', category: 'E', categoryName: 'フィジカル・運動量・プレースタイル系', isRare: false, isGkOnly: false, description: '激しいボディコンタクトでも軸がぶれず競り勝つフィジカル。', declineResistant: false },
  { id: 'skill_49', num: 49, name: 'バランス強化', category: 'E', categoryName: 'フィジカル・運動量・プレースタイル系', isRare: false, isGkOnly: false, description: '体勢を崩されにくく倒れずにプレーを継続できる重心安定性。', declineResistant: false },
  { id: 'skill_50', num: 50, name: '怪我しにくさ', category: 'E', categoryName: 'フィジカル・運動量・プレースタイル系', isRare: false, isGkOnly: false, description: '連戦や激しい接触でも負傷リスクを低く抑える頑健さ。', declineResistant: true },
  { id: 'skill_51', num: 51, name: 'スーパーサブ', category: 'E', categoryName: 'フィジカル・運動量・プレースタイル系', isRare: false, isGkOnly: false, description: '後半途中出場時に決定力と機動力が大きく上昇する切り札。', declineResistant: false },
  { id: 'skill_52', num: 52, name: '終盤の集中力', category: 'E', categoryName: 'フィジカル・運動量・プレースタイル系', isRare: false, isGkOnly: false, description: '75分以降の試合終盤でも判断精度と守備強度が落ちない。', declineResistant: true },
  { id: 'skill_53', num: 53, name: '連続スプリント', category: 'E', categoryName: 'フィジカル・運動量・プレースタイル系', isRare: false, isGkOnly: false, description: '攻守切り替えで繰り返し高強度のスプリントをこなす。', declineResistant: false },
  { id: 'skill_54', num: 54, name: 'ハードワーク', category: 'E', categoryName: 'フィジカル・運動量・プレースタイル系', isRare: false, isGkOnly: false, description: 'チームのために前線プレスと帰陣を献身的に繰り返す。', declineResistant: false },

  // F. セットプレー・特殊キック系（55〜60）
  { id: 'skill_55', num: 55, name: 'フリーキック', category: 'F', categoryName: 'セットプレー・特殊キック系', isRare: false, isGkOnly: false, description: '直接FKでの枠内率・決定率を高める高精度キック。', declineResistant: true },
  { id: 'skill_56', num: 56, name: 'コーナーキック', category: 'F', categoryName: 'セットプレー・特殊キック系', isRare: false, isGkOnly: false, description: '味方にピタリと合わせる精度と球質を備えたCK技術。', declineResistant: true },
  { id: 'skill_57', num: 57, name: 'ペナルティキック', category: 'F', categoryName: 'セットプレー・特殊キック系', isRare: false, isGkOnly: false, description: 'PKでのコース選択と精神的安定性で高い成功率を誇る。', declineResistant: true },
  { id: 'skill_58', num: 58, name: 'ロングスロー', category: 'F', categoryName: 'セットプレー・特殊キック系', isRare: false, isGkOnly: false, description: 'タッチラインからペナルティエリア内へ直接スローを届ける。', declineResistant: false },
  { id: 'skill_59', num: 59, name: '無回転シュート', category: 'F', categoryName: 'セットプレー・特殊キック系', isRare: false, isGkOnly: false, description: '不規則に揺れ落ちる無回転軌道でGKの予測を狂わせる。', declineResistant: true },
  { id: 'skill_60', num: 60, name: 'カーブパス', category: 'F', categoryName: 'セットプレー・特殊キック系', isRare: false, isGkOnly: false, description: 'DFの足先を巻いて通す曲げのパスワークを得意とする。', declineResistant: true },

  // G. メンタル・ゲームメイク系（61〜68）
  { id: 'skill_61', num: 61, name: '闘争心', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: false, isGkOnly: false, description: 'ビハインドや激しい試合でもチームを鼓舞し続ける闘志。', declineResistant: true },
  { id: 'skill_62', num: 62, name: 'キャプテンシー', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: false, isGkOnly: false, description: 'ピッチ内外でチーム全体を統率し組織力を底上げする。', declineResistant: true },
  { id: 'skill_63', num: 63, name: '冷静さ', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: false, isGkOnly: false, description: '決定機やピンチでも焦らず最適なプレーを選択できる。', declineResistant: true },
  { id: 'skill_64', num: 64, name: 'オフザボール', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: false, isGkOnly: false, description: 'ボールのない時間帯に賢く動き出しマークを外すポジショニング。', declineResistant: true },
  { id: 'skill_65', num: 65, name: 'ラインブレイク', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: false, isGkOnly: false, description: 'オフサイドラインぎりぎりを突く絶妙な裏抜けのタイミング。', declineResistant: true },
  { id: 'skill_66', num: 66, name: '空間認知', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: false, isGkOnly: false, description: '360度の周囲把握力で受け手・スペースを瞬時に見つける。', declineResistant: true },
  { id: 'skill_67', num: 67, name: '逆足精度', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: false, isGkOnly: false, description: '利き足でない側でも遜色ないシュート・パスを繰り出す。', declineResistant: true },
  { id: 'skill_68', num: 68, name: '大舞台適性', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: false, isGkOnly: false, description: 'ダービーや決勝など大一番の試合でパフォーマンスを発揮。', declineResistant: true },

  // H. GK専用スキル（69〜80）
  { id: 'skill_69', num: 69, name: '1対1セーブ', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: 'FWとの1対1の局面でコースを塞ぎ決定機を阻止する。', declineResistant: true },
  { id: 'skill_70', num: 70, name: 'PKストッパー', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: '相手のモーション読みと反応速度でPKストップ率を高める。', declineResistant: true },
  { id: 'skill_71', num: 71, name: '高弾道パントキック', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: '前線ターゲットめがけて正確かつ飛距離あるパントを蹴る。', declineResistant: true },
  { id: 'skill_72', num: 72, name: '低弾道パントキック', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: '素早く鋭いライナー性のキックで一気に前線カウンターを発動。', declineResistant: true },
  { id: 'skill_73', num: 73, name: 'GKロングスロー', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: 'キャッチ後、ハーフライン付近の味方へ正確にスロー展開する。', declineResistant: true },
  { id: 'skill_74', num: 74, name: '飛び出し判断', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: 'DF背後のスルーパスに対して迷わず飛び出しクリアする。', declineResistant: false },
  { id: 'skill_75', num: 75, name: 'クロス対応', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: 'ハイクロスに対してペナルティエリアを制圧し確実に処理。', declineResistant: true },
  { id: 'skill_76', num: 76, name: '至近距離反応', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: 'ゴール前至近距離からのシュートにも驚異的反射神経で対応。', declineResistant: false },
  { id: 'skill_77', num: 77, name: 'キャッチング安定', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: '強烈なシュートでもこぼさず確実にキャッチしセカンドを与えない。', declineResistant: true },
  { id: 'skill_78', num: 78, name: '弾き出し制御', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: '危険でないサイド方向へ意図的に弾き出し二次攻撃を防ぐ。', declineResistant: true },
  { id: 'skill_79', num: 79, name: '最終ライン統率', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: '最後方からコーチングで守備陣の集中力と連係を引き上げる。', declineResistant: true },
  { id: 'skill_80', num: 80, name: 'ビルドアップGK', category: 'H', categoryName: 'GK専用スキル', isRare: false, isGkOnly: true, description: '相手のプレス下でも足元の冷静なパスで最後方から組み立てる。', declineResistant: true }
];

export const RARE_SKILLS_CATALOG: PlayerSkillDefinition[] = [
  { id: 'rare_01', num: 1, name: 'フィニッシャー極', category: 'A', categoryName: 'シュート・フィニッシュ系', isRare: true, isGkOnly: false, description: '【レア】あらゆる局面・角度からゴールを奪い切る天性の得点感覚。', declineResistant: true },
  { id: 'rare_02', num: 2, name: '魔術師ドリブル', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: true, isGkOnly: false, description: '【レア】複数人の包囲網を華麗なステップとタッチで切り裂く突破力。', declineResistant: false },
  { id: 'rare_03', num: 3, name: '完璧な視野', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: true, isGkOnly: false, description: '【レア】ピッチ上の全ての動きを俯瞰し、誰も見えないパスコースを貫く。', declineResistant: true },
  { id: 'rare_04', num: 4, name: 'プレーメーカー', category: 'C', categoryName: 'パス・展開・チャンスメイク系', isRare: true, isGkOnly: false, description: '【レア】ゲームのテンポとリズムを自在に操る攻撃の絶対的司令塔。', declineResistant: true },
  { id: 'rare_05', num: 5, name: '守備の要', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: true, isGkOnly: false, description: '【レア】最終ラインに絶対的な安心感をもたらすワールドクラスの守備統率力。', declineResistant: true },
  { id: 'rare_06', num: 6, name: '守護神', category: 'H', categoryName: 'GK専用スキル', isRare: true, isGkOnly: true, description: '【レア・GK専用】絶体絶命の決定機を幾度も阻止し勝ち点を引き寄せる絶対的守護神。', declineResistant: true },
  { id: 'rare_07', num: 7, name: '絶対的エース', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: true, isGkOnly: false, description: '【レア】チームの攻撃を背負い、苦しい展開を個人の力で打開するエース。', declineResistant: true },
  { id: 'rare_08', num: 8, name: 'クラッチプレイヤー', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: true, isGkOnly: false, description: '【レア】後半終盤や同点・ビハインドの緊迫局面で決定的な仕事をやってのける。', declineResistant: true },
  { id: 'rare_09', num: 9, name: '無限エンジン', category: 'E', categoryName: 'フィジカル・運動量・プレースタイル系', isRare: true, isGkOnly: false, description: '【レア】試合終了の笛が鳴るまで攻守両面で圧倒的走力を維持する鉄人。', declineResistant: false },
  { id: 'rare_10', num: 10, name: 'FKマスター', category: 'F', categoryName: 'セットプレー・特殊キック系', isRare: true, isGkOnly: false, description: '【レア】ペナルティエリア周辺でのFKを実質的な得点機会へと変える名手。', declineResistant: true },
  { id: 'rare_11', num: 11, name: '空中戦の王者', category: 'D', categoryName: '守備・ボール奪取・ポジショニング系', isRare: true, isGkOnly: false, description: '【レア】攻守の空中戦で他を圧倒しセットプレーの最大の武器・盾となる。', declineResistant: false },
  { id: 'rare_12', num: 12, name: 'プレッシャー無効', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: true, isGkOnly: false, description: '【レア】大舞台や激しいプレスの中でも一切のミスをしない鋼のメンタリティ。', declineResistant: true },
  { id: 'rare_13', num: 13, name: 'ゲームチェンジャー', category: 'B', categoryName: 'ドリブル・突破・ボールキープ系', isRare: true, isGkOnly: false, description: '【レア】停滞した試合の流れをワンプレーで劇的に変える特別な閃き。', declineResistant: true },
  { id: 'rare_14', num: 14, name: 'キャプテン・カリスマ', category: 'G', categoryName: 'メンタル・ゲームメイク系', isRare: true, isGkOnly: false, description: '【レア】チーム全体の士気と集中力を限界まで引き上げるカリスマ的指導力。', declineResistant: true },
  { id: 'rare_15', num: 15, name: 'ミラクルセーブ', category: 'H', categoryName: 'GK専用スキル', isRare: true, isGkOnly: true, description: '【レア・GK専用】物理法則に抗うかのような超人的な反応でゴールを死守する。', declineResistant: false }
];

export const ALL_SKILLS_MAP: Record<string, PlayerSkillDefinition> = [...NORMAL_SKILLS_CATALOG, ...RARE_SKILLS_CATALOG].reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<string, PlayerSkillDefinition>
);

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  A: 'シュート・フィニッシュ系',
  B: 'ドリブル・突破・ボールキープ系',
  C: 'パス・展開・チャンスメイク系',
  D: '守備・ボール奪取・ポジショニング系',
  E: 'フィジカル・運動量・プレースタイル系',
  F: 'セットプレー・特殊キック系',
  G: 'メンタル・ゲームメイク系',
  H: 'GK専用スキル'
};

export function getSkillDefinition(id: string): PlayerSkillDefinition | undefined {
  return ALL_SKILLS_MAP[id];
}

export const getSkillDefinitionById = getSkillDefinition;

function seededHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickInitialTier(ovr: number, age: number, idx: number, hash: number): SkillProficiencyTier {
  const score = ovr + (age >= 26 ? 3 : age <= 19 ? -6 : 0) + ((hash >> (idx * 2)) % 5) - 2;
  if (score >= 88) return '卓越';
  if (score >= 81) return '熟練';
  if (score >= 73) return '成長中';
  return '通常';
}

const SIGNATURE_SKILL_PRESETS: Array<{
  match: (name: string, player: Player) => boolean;
  normal: string[];
  rare: string[];
}> = [
  { match: (n, p) => p.position !== 'GK' && (n.includes('Lionel Messi') || n.includes('リオネル・メッシ') || n === 'メッシ'), normal: ['skill_02', 'skill_03', 'skill_14', 'skill_23', 'skill_34', 'skill_55', 'skill_66'], rare: ['rare_03', 'rare_04'] },
  { match: (n, p) => p.position !== 'GK' && (n.includes('Cristiano Ronaldo') || n.includes('クリスティアーノ・ロナウド')), normal: ['skill_01', 'skill_07', 'skill_08', 'skill_55', 'skill_57', 'skill_59', 'skill_68'], rare: ['rare_01', 'rare_07'] },
  { match: (n, p) => p.position !== 'GK' && (n.includes('Mbappé') || n.includes('Mbappe')), normal: ['skill_01', 'skill_03', 'skill_15', 'skill_17', 'skill_22', 'skill_47', 'skill_65'], rare: ['rare_01', 'rare_07'] },
  { match: (n, p) => p.position !== 'GK' && n.includes('Haaland'), normal: ['skill_01', 'skill_07', 'skill_12', 'skill_47', 'skill_48', 'skill_65'], rare: ['rare_01', 'rare_11'] },
  { match: (n, p) => p.position !== 'GK' && n.includes('Lamine Yamal'), normal: ['skill_02', 'skill_14', 'skill_15', 'skill_22', 'skill_28', 'skill_32', 'skill_34'], rare: ['rare_02', 'rare_13'] },
  { match: (n, p) => p.position !== 'GK' && n.includes('Raphinha'), normal: ['skill_02', 'skill_15', 'skill_17', 'skill_28', 'skill_54', 'skill_55', 'skill_65'], rare: ['rare_08', 'rare_13'] },
  { match: (n, p) => p.position !== 'GK' && (n === 'Rodri' || n.includes('Rodri ')), normal: ['skill_05', 'skill_20', 'skill_26', 'skill_35', 'skill_40', 'skill_44', 'skill_63'], rare: ['rare_04', 'rare_12'] },
  { match: (n, p) => p.position !== 'GK' && n.includes('Jude Bellingham'), normal: ['skill_12', 'skill_19', 'skill_20', 'skill_34', 'skill_52', 'skill_61', 'skill_68'], rare: ['rare_08', 'rare_07'] },
  { match: (n, p) => p.position === 'GK' && n.includes('ter Stegen'), normal: ['skill_69', 'skill_72', 'skill_74', 'skill_76', 'skill_79', 'skill_80'], rare: ['rare_06'] },
  { match: (n, p) => p.position === 'GK' && (n.includes('Donnarumma') || n.includes('Courtois') || n.includes('Alisson')), normal: ['skill_69', 'skill_70', 'skill_75', 'skill_76', 'skill_77', 'skill_78'], rare: ['rare_06', 'rare_15'] },
  { match: (n, p) => p.position !== 'GK' && n.includes('Kvaratskhelia'), normal: ['skill_02', 'skill_13', 'skill_15', 'skill_22', 'skill_28', 'skill_67'], rare: ['rare_02', 'rare_13'] },
  { match: (n, p) => p.position !== 'GK' && (n.includes('三笘') || n.includes('Mitoma')), normal: ['skill_14', 'skill_15', 'skill_16', 'skill_17', 'skill_22', 'skill_29'], rare: ['rare_02'] },
  { match: (n, p) => p.position !== 'GK' && (n.includes('久保 建英') || n.includes('Takefusa Kubo') || n === '久保'), normal: ['skill_02', 'skill_14', 'skill_15', 'skill_23', 'skill_34', 'skill_55'], rare: ['rare_03'] },
  { match: (n, p) => p.position !== 'GK' && n.includes('師岡'), normal: ['skill_12', 'skill_19', 'skill_21', 'skill_54', 'skill_64', 'skill_65'], rare: [] },
  { match: (n, p) => p.position !== 'GK' && n.includes('名古'), normal: ['skill_23', 'skill_24', 'skill_28', 'skill_34', 'skill_55', 'skill_66'], rare: [] },
  { match: (n, p) => p.position !== 'GK' && n.includes('サニブラウン'), normal: ['skill_16', 'skill_47', 'skill_53'], rare: [] },
  { match: (n, p) => p.position !== 'GK' && n.includes('三井寺'), normal: ['skill_14', 'skill_23', 'skill_34', 'skill_66'], rare: [] }
];

function getCandidateNormalSkillsForPlayer(player: Player): string[] {
  const pos = player.position;
  const style = player.playstyle || '';
  const isLeftOrRightFootHigh = player.preferredFoot === '両足';

  if (pos === 'GK') {
    const base = ['skill_69', 'skill_75', 'skill_76', 'skill_77', 'skill_78', 'skill_79'];
    if (style === 'ビルドアップ型GK') return ['skill_80', 'skill_72', 'skill_73', ...base];
    if (style === 'ショットストッパー') return ['skill_76', 'skill_69', 'skill_70', 'skill_77', 'skill_78', 'skill_75', 'skill_74'];
    return [...base, 'skill_71', 'skill_70', 'skill_73', 'skill_74', 'skill_80'];
  }

  const pool: string[] = [];
  if (['ST', 'CF'].includes(pos)) {
    pool.push('skill_01', 'skill_03', 'skill_12', 'skill_64', 'skill_65', 'skill_07', 'skill_09', 'skill_10', 'skill_19', 'skill_48', 'skill_11', 'skill_08', 'skill_57');
  } else if (['LW', 'RW'].includes(pos)) {
    pool.push('skill_15', 'skill_16', 'skill_17', 'skill_22', 'skill_14', 'skill_28', 'skill_29', 'skill_02', 'skill_47', 'skill_13', 'skill_34');
  } else if (pos === 'CAM') {
    pool.push('skill_23', 'skill_34', 'skill_24', 'skill_66', 'skill_14', 'skill_03', 'skill_55', 'skill_32', 'skill_19', 'skill_60', 'skill_63');
  } else if (['LM', 'RM'].includes(pos)) {
    pool.push('skill_28', 'skill_16', 'skill_17', 'skill_30', 'skill_46', 'skill_53', 'skill_54', 'skill_29', 'skill_15');
  } else if (pos === 'CM') {
    pool.push('skill_24', 'skill_26', 'skill_27', 'skill_31', 'skill_46', 'skill_35', 'skill_44', 'skill_54', 'skill_23', 'skill_63', 'skill_05');
  } else if (pos === 'CDM') {
    pool.push('skill_35', 'skill_38', 'skill_40', 'skill_44', 'skill_45', 'skill_26', 'skill_27', 'skill_31', 'skill_48', 'skill_52', 'skill_63');
  } else if (['LB', 'RB', 'LWB', 'RWB'].includes(pos)) {
    pool.push('skill_16', 'skill_28', 'skill_30', 'skill_35', 'skill_38', 'skill_42', 'skill_46', 'skill_53', 'skill_29', 'skill_40', 'skill_58');
  } else if (pos === 'CB') {
    pool.push('skill_35', 'skill_38', 'skill_39', 'skill_40', 'skill_41', 'skill_42', 'skill_43', 'skill_48', 'skill_26', 'skill_07', 'skill_44');
  }

  // Playstyle refinements
  if (style === 'シャドーストライカー') pool.unshift('skill_12', 'skill_64', 'skill_65', 'skill_21');
  if (style === 'ラインブレイカー') pool.unshift('skill_65', 'skill_47', 'skill_01');
  if (style === 'ターゲットマン') pool.unshift('skill_07', 'skill_48', 'skill_20');
  if (style === 'スピードスター' || style === '俊足ドリブラー') pool.unshift('skill_17', 'skill_47', 'skill_16');
  if (style === 'チャンスメイカー') pool.unshift('skill_23', 'skill_34', 'skill_66');
  if (style === 'ハードタックラー') pool.unshift('skill_37', 'skill_38', 'skill_42');
  if (style === 'ボール運べるCB') pool.unshift('skill_44', 'skill_26', 'skill_31');
  if (isLeftOrRightFootHigh) pool.unshift('skill_67');
  if ((player.shooting || 70) >= 82) pool.push('skill_05', 'skill_55');
  if ((player.pace || 70) >= 86) pool.push('skill_47', 'skill_53');
  if ((player.age || 25) >= 29) pool.push('skill_62', 'skill_63', 'skill_52');

  return Array.from(new Set(pool)).filter(id => {
    const def = ALL_SKILLS_MAP[id];
    return def && !def.isGkOnly && !def.isRare;
  });
}

function getCandidateRareSkillsForPlayer(player: Player): string[] {
  const pos = player.position;
  if (pos === 'GK') {
    return ['rare_06', 'rare_15', 'rare_14', 'rare_12', 'rare_08'];
  }
  const pool: string[] = [];
  if (['ST', 'CF'].includes(pos)) pool.push('rare_01', 'rare_07', 'rare_08', 'rare_11');
  else if (['LW', 'RW'].includes(pos)) pool.push('rare_02', 'rare_13', 'rare_07', 'rare_08');
  else if (['CAM', 'CM'].includes(pos)) pool.push('rare_03', 'rare_04', 'rare_08', 'rare_12', 'rare_10');
  else if (['CDM'].includes(pos)) pool.push('rare_05', 'rare_09', 'rare_12', 'rare_04');
  else if (['CB'].includes(pos)) pool.push('rare_05', 'rare_11', 'rare_14', 'rare_12');
  else pool.push('rare_09', 'rare_05', 'rare_13', 'rare_08');

  if ((player.age || 25) >= 28 && (player.personality === 'リーダー気質' || player.ovr >= 83)) {
    pool.push('rare_14');
  }
  return Array.from(new Set(pool)).filter(id => {
    const def = ALL_SKILLS_MAP[id];
    return def && def.isRare && !def.isGkOnly;
  });
}

export function sanitizePlayerSkills(player: Player): {
  skills: PlayerSkillInstance[];
  rareSkills: PlayerSkillInstance[];
} {
  const isGk = player.position === 'GK';
  const seenNormal = new Set<string>();
  const cleanNormal: PlayerSkillInstance[] = [];
  for (const s of player.skills || []) {
    const def = ALL_SKILLS_MAP[s.id];
    if (!def || def.isRare) continue;
    if (isGk && !def.isGkOnly && def.category !== 'E' && def.category !== 'G') continue;
    if (!isGk && def.isGkOnly) continue;
    if (seenNormal.has(s.id)) continue;
    seenNormal.add(s.id);
    cleanNormal.push(s);
    if (cleanNormal.length >= 7) break;
  }

  const seenRare = new Set<string>();
  const cleanRare: PlayerSkillInstance[] = [];
  for (const r of player.rareSkills || []) {
    const def = ALL_SKILLS_MAP[r.id];
    if (!def || !def.isRare) continue;
    if (isGk && def.isGkOnly === false && !['rare_08', 'rare_12', 'rare_14'].includes(def.id)) continue;
    if (!isGk && def.isGkOnly) continue;
    if (seenRare.has(r.id)) continue;
    seenRare.add(r.id);
    cleanRare.push(r);
    if (cleanRare.length >= 2) break;
  }

  return { skills: cleanNormal, rareSkills: cleanRare };
}

export function initializePlayerSkills(player: Player): Player {
  if (player.skills && player.skills.length > 0) {
    const sanitized = sanitizePlayerSkills(player);
    if (sanitized.skills.length > 0) {
      return {
        ...player,
        skills: sanitized.skills,
        rareSkills: sanitized.rareSkills,
        skillHistory: player.skillHistory || []
      };
    }
  }

  const h = seededHash(`${player.id}_${player.name}`);
  const ovr = player.ovr || 70;
  const age = player.age || 24;

  // Check signature preset first (position & specific name guarded)
  const preset = SIGNATURE_SKILL_PRESETS.find(pr => pr.match(player.name || '', player));
  let normalIds: string[] = [];
  let rareIds: string[] = [];

  if (preset) {
    normalIds = [...preset.normal];
    rareIds = [...preset.rare];
  } else {
    // Realistic counts by OVR & age (1 to 7 normal, 0 to 2 rare)
    let normalTarget = 1;
    if (age <= 18 && ovr < 70) normalTarget = 1 + (h % 2); // 1-2
    else if (ovr >= 87) normalTarget = 6 + (h % 2); // 6-7
    else if (ovr >= 82) normalTarget = 4 + (h % 3); // 4-6
    else if (ovr >= 76) normalTarget = 3 + (h % 2); // 3-4
    else if (ovr >= 70) normalTarget = 2 + (h % 2); // 2-3
    else normalTarget = 1 + (h % 2); // 1-2

    let rareTarget = 0;
    if (ovr >= 88 || (ovr >= 85 && age >= 25)) rareTarget = 1 + (h % 2 === 0 ? 1 : 0); // 1-2
    else if (ovr >= 81) rareTarget = h % 3 === 0 ? 1 : 0; // occasional 1
    else if (ovr >= 77 && age <= 23 && (player.potential || ovr) >= 87) rareTarget = h % 4 === 0 ? 1 : 0;

    const normalPool = getCandidateNormalSkillsForPlayer(player);
    for (let i = 0; i < normalPool.length && normalIds.length < Math.min(7, normalTarget); i++) {
      const idx = (i + (h % Math.max(1, normalPool.length))) % normalPool.length;
      const cand = normalPool[idx];
      if (!normalIds.includes(cand)) normalIds.push(cand);
    }

    const rarePool = getCandidateRareSkillsForPlayer(player);
    for (let i = 0; i < rarePool.length && rareIds.length < Math.min(2, rareTarget); i++) {
      const idx = (i + (h % Math.max(1, rarePool.length))) % rarePool.length;
      const cand = rarePool[idx];
      if (!rareIds.includes(cand)) rareIds.push(cand);
    }
  }

  const skills: PlayerSkillInstance[] = normalIds.slice(0, 7).map((id, idx) => ({
    id,
    tier: pickInitialTier(ovr, age, idx, h),
    progressPoints: 0
  }));

  const rareSkills: PlayerSkillInstance[] = rareIds.slice(0, 2).map((id, idx) => ({
    id,
    tier: pickInitialTier(ovr + 2, age, idx, h),
    progressPoints: 0
  }));

  const sanitized = sanitizePlayerSkills({ ...player, skills, rareSkills });
  return {
    ...player,
    skills: sanitized.skills,
    rareSkills: sanitized.rareSkills,
    skillHistory: player.skillHistory || []
  };
}

function nextSkillTier(tier: SkillProficiencyTier): SkillProficiencyTier | null {
  const idx = SKILL_TIERS_ORDER.indexOf(tier);
  if (idx >= 0 && idx < SKILL_TIERS_ORDER.length - 1) {
    return SKILL_TIERS_ORDER[idx + 1];
  }
  return null;
}

function prevSkillTier(tier: SkillProficiencyTier): SkillProficiencyTier | null {
  const idx = SKILL_TIERS_ORDER.indexOf(tier);
  if (idx > 0) {
    return SKILL_TIERS_ORDER[idx - 1];
  }
  return null;
}

export interface SkillUpdateOutcome {
  player: Player;
  events: SkillHistoryEntry[];
  growthNoticeTitle?: string;
  growthNoticeMessage?: string;
  declineNoticeMessage?: string;
}

/**
 * Evaluate post-match skill progression (new skill acquisition & proficiency tier upgrades).
 */
export function processMatchSkillProgression(
  player: Player,
  performance: {
    rating: number;
    goals?: number;
    assists?: number;
    cleanSheet?: boolean;
    saves?: number;
    isMotm?: boolean;
    minutes?: number;
  },
  date: string
): SkillUpdateOutcome {
  const initialized = initializePlayerSkills(player);
  const skills = [...(initialized.skills || [])];
  const rareSkills = [...(initialized.rareSkills || [])];
  const skillHistory = [...(initialized.skillHistory || [])];
  const events: SkillHistoryEntry[] = [];

  if ((performance.minutes || 0) < 20 || initialized.age >= 35) {
    return { player: initialized, events };
  }

  const rating = performance.rating || 6.5;
  const ageFactor = initialized.age <= 22 ? 1.5 : initialized.age <= 26 ? 1.1 : 0.7;
  const perfScore =
    (rating >= 8.0 ? 28 : rating >= 7.4 ? 18 : rating >= 6.9 ? 8 : 0) +
    (performance.goals || 0) * 14 +
    (performance.assists || 0) * 12 +
    (performance.cleanSheet && ['GK', 'CB', 'LB', 'RB'].includes(initialized.position) ? 10 : 0) +
    ((performance.saves || 0) >= 4 ? 12 : 0) +
    (performance.isMotm ? 15 : 0);

  if (perfScore <= 0) {
    return { player: initialized, events };
  }

  let growthNoticeTitle: string | undefined;
  let growthNoticeMessage: string | undefined;

  // 1. Progress existing skill proficiency
  if (skills.length > 0) {
    // Pick best matching skill based on match action
    let targetIdx = 0;
    if ((performance.goals || 0) > 0) {
      const idx = skills.findIndex(s => ALL_SKILLS_MAP[s.id]?.category === 'A');
      if (idx >= 0) targetIdx = idx;
    } else if ((performance.assists || 0) > 0) {
      const idx = skills.findIndex(s => ALL_SKILLS_MAP[s.id]?.category === 'C');
      if (idx >= 0) targetIdx = idx;
    } else if (initialized.position === 'GK') {
      const idx = skills.findIndex(s => ALL_SKILLS_MAP[s.id]?.category === 'H');
      if (idx >= 0) targetIdx = idx;
    }

    const target = { ...skills[targetIdx] };
    const nextTier = nextSkillTier(target.tier);
    if (nextTier) {
      const gained = Math.round(perfScore * ageFactor * 0.45);
      target.progressPoints = (target.progressPoints || 0) + gained;
      if (target.progressPoints >= 100) {
        const def = ALL_SKILLS_MAP[target.id];
        const prev = target.tier;
        target.tier = nextTier;
        target.progressPoints = 0;
        const entry: SkillHistoryEntry = {
          id: `skh_${date}_${initialized.id}_${target.id}_${Date.now()}`,
          date,
          age: initialized.age,
          skillId: target.id,
          skillName: def?.name || target.id,
          action: 'upgraded',
          fromTier: prev,
          toTier: nextTier,
          reason: `実戦活躍（評価点 ${rating.toFixed(1)}）により熟練度が「${prev}」から「${nextTier}」へ上昇`
        };
        skillHistory.unshift(entry);
        events.push(entry);
        growthNoticeTitle = `選手成長のお知らせ：${initialized.name}`;
        growthNoticeMessage = `${initialized.name}が試合での活躍を通じてスキル「${def?.name}」の熟練度を「${nextTier}」へ高めました！`;
      }
      skills[targetIdx] = target;
    }
  }

  // 2. Acquire new Normal Skill (if < 7 and high performance / high young talent)
  if (skills.length < 7 && (rating >= 7.9 || (performance.goals || 0) >= 2 || (performance.assists || 0) >= 2 || (performance.saves || 0) >= 5)) {
    const h = seededHash(`${initialized.id}_${date}_${rating}`);
    const acquireChance = Math.min(0.28, (rating - 7.5) * 0.14 * ageFactor);
    if ((h % 1000) / 1000 < acquireChance) {
      const candidates = getCandidateNormalSkillsForPlayer(initialized).filter(id => !skills.some(s => s.id === id));
      if (candidates.length > 0) {
        const newSkillId = candidates[h % candidates.length];
        const def = ALL_SKILLS_MAP[newSkillId];
        if (def) {
          skills.push({
            id: newSkillId,
            tier: '通常',
            acquiredDate: date,
            acquiredAge: initialized.age,
            progressPoints: 0
          });
          const entry: SkillHistoryEntry = {
            id: `skh_acq_${date}_${initialized.id}_${newSkillId}`,
            date,
            age: initialized.age,
            skillId: newSkillId,
            skillName: def.name,
            action: 'acquired',
            toTier: '通常',
            reason: `公式戦での印象的な活躍（評価点 ${rating.toFixed(1)}）により新スキル「${def.name}」を習得`
          };
          skillHistory.unshift(entry);
          events.push(entry);
          growthNoticeTitle = `選手成長のお知らせ：${initialized.name}`;
          growthNoticeMessage = `${initialized.name}が新スキル「${def.name}」（${def.categoryName}）を習得しました！`;
        }
      }
    }
  }

  // 3. Acquire Rare Skill (very rare milestone: OVR >= 80, < 2 rare skills, MOTM / huge rating)
  if (rareSkills.length < 2 && initialized.ovr >= 80 && (rating >= 8.6 || (performance.isMotm && (performance.goals || 0) >= 2))) {
    const h = seededHash(`rare_${initialized.id}_${date}`);
    if (h % 100 < 8) {
      const candidates = getCandidateRareSkillsForPlayer(initialized).filter(id => !rareSkills.some(s => s.id === id));
      if (candidates.length > 0) {
        const newRareId = candidates[h % candidates.length];
        const def = ALL_SKILLS_MAP[newRareId];
        if (def) {
          rareSkills.push({
            id: newRareId,
            tier: '通常',
            acquiredDate: date,
            acquiredAge: initialized.age,
            progressPoints: 0
          });
          const entry: SkillHistoryEntry = {
            id: `skh_rare_${date}_${initialized.id}_${newRareId}`,
            date,
            age: initialized.age,
            skillId: newRareId,
            skillName: def.name,
            action: 'acquired',
            toTier: '通常',
            reason: `圧倒的なパフォーマンスによりレアスキル「${def.name}」を開花させた`
          };
          skillHistory.unshift(entry);
          events.push(entry);
          growthNoticeTitle = `超成長のお知らせ：${initialized.name}`;
          growthNoticeMessage = `${initialized.name}が試合での圧倒的活躍からレアスキル「${def.name}」を開花させました！`;
        }
      }
    }
  }

  return {
    player: {
      ...initialized,
      skills: skills.slice(0, 7),
      rareSkills: rareSkills.slice(0, 2),
      skillHistory: skillHistory.slice(0, 25)
    },
    events,
    growthNoticeTitle,
    growthNoticeMessage
  };
}

/**
 * Realistic, non-mechanical skill decline linked to physical attribute drops or aging >= 32.
 * Mental, vision, and set-piece technique skills (`declineResistant: true`) resist decline.
 */
export function processSkillDeclineCheck(
  player: Player,
  date: string,
  physicalDropOccurred: boolean = false
): SkillUpdateOutcome {
  const initialized = initializePlayerSkills(player);
  const skills = [...(initialized.skills || [])];
  const skillHistory = [...(initialized.skillHistory || [])];
  const events: SkillHistoryEntry[] = [];

  if (initialized.age < 32 || skills.length === 0) {
    return { player: initialized, events };
  }
  if (!physicalDropOccurred && (initialized.pace >= 72 || initialized.age < 35)) {
    return { player: initialized, events };
  }

  // Pick a non-declineResistant physical/speed/explosiveness skill first
  const candidateIdx = skills.findIndex(s => {
    const def = ALL_SKILLS_MAP[s.id];
    return def && !def.declineResistant;
  });

  if (candidateIdx === -1) {
    // Player only retains vision/mental/technique skills (realistic veteran evolution!)
    return { player: initialized, events };
  }

  const target = { ...skills[candidateIdx] };
  const def = ALL_SKILLS_MAP[target.id];
  const prev = target.tier;
  const lowered = prevSkillTier(prev);
  let declineNoticeMessage: string | undefined;

  if (lowered) {
    target.tier = lowered;
    target.declineCount = (target.declineCount || 0) + 1;
    skills[candidateIdx] = target;
    const entry: SkillHistoryEntry = {
      id: `skh_dec_${date}_${initialized.id}_${target.id}`,
      date,
      age: initialized.age,
      skillId: target.id,
      skillName: def?.name || target.id,
      action: 'declined',
      fromTier: prev,
      toTier: lowered,
      reason: '加齢に伴うスプリント・身体能力の変化により熟練度が低下'
    };
    skillHistory.unshift(entry);
    events.push(entry);
    declineNoticeMessage = `${initialized.name}（${initialized.age}歳）は身体能力の変化に伴い、スキル「${def?.name}」が「${lowered}」へ緩やかに変化しました。`;
  } else {
    // Only lose if age >= 35 and already '通常' and physical dropped significantly
    if (initialized.age >= 35 && physicalDropOccurred) {
      skills.splice(candidateIdx, 1);
      const entry: SkillHistoryEntry = {
        id: `skh_lost_${date}_${initialized.id}_${target.id}`,
        date,
        age: initialized.age,
        skillId: target.id,
        skillName: def?.name || target.id,
        action: 'lost',
        fromTier: prev,
        reason: 'フィジカル面の加齢変化によりプレースタイルが変化（技術・戦術系スキルは維持）'
      };
      skillHistory.unshift(entry);
      events.push(entry);
      declineNoticeMessage = `${initialized.name}（${initialized.age}歳）の加齢により「${def?.name}」の特性が薄れましたが、経験に基づくスキルは維持されています。`;
    }
  }

  return {
    player: {
      ...initialized,
      skills,
      skillHistory: skillHistory.slice(0, 25)
    },
    events,
    declineNoticeMessage
  };
}

export interface PlayerSkillMatchModifiers {
  finishingMult: number;
  longShotMult: number;
  headerMult: number;
  dribbleMult: number;
  passMult: number;
  crossMult: number;
  defenseMult: number;
  staminaRetentionMult: number;
  clutchBonus: number;
  setPieceBonus: number;
  gkSaveMult: number;
  gk1v1Mult: number;
  gkCrossMult: number;
  gkPkStopBonus: number;
}

/**
 * Situational modifier calculation used directly by matchEngine.ts!
 */
export function getPlayerSkillMatchModifiers(
  player: Player,
  context: { minute?: number; isSubbedIn?: boolean; isHome?: boolean; goalDiff?: number } = {}
): PlayerSkillMatchModifiers {
  const mods: PlayerSkillMatchModifiers = {
    finishingMult: 1.0,
    longShotMult: 1.0,
    headerMult: 1.0,
    dribbleMult: 1.0,
    passMult: 1.0,
    crossMult: 1.0,
    defenseMult: 1.0,
    staminaRetentionMult: 1.0,
    clutchBonus: 0,
    setPieceBonus: 0,
    gkSaveMult: 1.0,
    gk1v1Mult: 1.0,
    gkCrossMult: 1.0,
    gkPkStopBonus: 0
  };

  const allInstances = [...(player.skills || []), ...(player.rareSkills || [])];
  for (const inst of allInstances) {
    const mult = SKILL_TIER_MULTIPLIER[inst.tier] || 1.0;
    const isRare = inst.id.startsWith('rare_');
    const step = (isRare ? 0.045 : 0.022) * mult;

    switch (inst.id) {
      case 'skill_01':
      case 'skill_03':
      case 'skill_09':
      case 'skill_10':
      case 'skill_11':
      case 'skill_12':
      case 'rare_01':
      case 'rare_07':
        mods.finishingMult += step;
        break;
      case 'skill_02':
      case 'skill_04':
      case 'skill_05':
      case 'skill_06':
      case 'skill_59':
        mods.longShotMult += step;
        mods.finishingMult += step * 0.4;
        break;
      case 'skill_07':
      case 'skill_08':
      case 'rare_11':
        mods.headerMult += step;
        break;
      case 'skill_13':
      case 'skill_14':
      case 'skill_15':
      case 'skill_16':
      case 'skill_17':
      case 'skill_18':
      case 'skill_19':
      case 'skill_20':
      case 'skill_21':
      case 'skill_22':
      case 'rare_02':
      case 'rare_13':
        mods.dribbleMult += step;
        break;
      case 'skill_23':
      case 'skill_24':
      case 'skill_25':
      case 'skill_26':
      case 'skill_27':
      case 'skill_31':
      case 'skill_32':
      case 'skill_33':
      case 'skill_34':
      case 'skill_60':
      case 'rare_03':
      case 'rare_04':
        mods.passMult += step;
        break;
      case 'skill_28':
      case 'skill_29':
      case 'skill_30':
        mods.crossMult += step;
        mods.passMult += step * 0.4;
        break;
      case 'skill_35':
      case 'skill_36':
      case 'skill_37':
      case 'skill_38':
      case 'skill_39':
      case 'skill_40':
      case 'skill_41':
      case 'skill_42':
      case 'skill_43':
      case 'skill_44':
      case 'skill_45':
      case 'rare_05':
        mods.defenseMult += step;
        break;
      case 'skill_46':
      case 'skill_53':
      case 'skill_54':
      case 'rare_09':
        mods.staminaRetentionMult += step;
        break;
      case 'skill_51':
        if (context.isSubbedIn) {
          mods.finishingMult += step * 1.5;
          mods.dribbleMult += step * 1.2;
        }
        break;
      case 'skill_52':
      case 'skill_61':
      case 'skill_68':
      case 'rare_08':
      case 'rare_12':
      case 'rare_14':
        if ((context.minute || 0) >= 75 || (context.goalDiff || 0) <= 0) {
          mods.clutchBonus += step;
          mods.finishingMult += step * 0.5;
          mods.defenseMult += step * 0.5;
        }
        break;
      case 'skill_55':
      case 'skill_56':
      case 'skill_57':
      case 'rare_10':
        mods.setPieceBonus += step;
        break;
      case 'skill_69':
      case 'rare_06':
        mods.gk1v1Mult += step;
        mods.gkSaveMult += step * 0.8;
        break;
      case 'skill_70':
        mods.gkPkStopBonus += step;
        break;
      case 'skill_75':
        mods.gkCrossMult += step;
        mods.gkSaveMult += step * 0.4;
        break;
      case 'skill_74':
      case 'skill_76':
      case 'skill_77':
      case 'skill_78':
      case 'skill_79':
      case 'skill_80':
      case 'rare_15':
        mods.gkSaveMult += step;
        break;
    }
  }

  // Cap total multipliers realistically so skills meaningfully enhance without breaking realism
  mods.finishingMult = Math.min(1.25, mods.finishingMult);
  mods.longShotMult = Math.min(1.25, mods.longShotMult);
  mods.headerMult = Math.min(1.25, mods.headerMult);
  mods.dribbleMult = Math.min(1.25, mods.dribbleMult);
  mods.passMult = Math.min(1.25, mods.passMult);
  mods.crossMult = Math.min(1.25, mods.crossMult);
  mods.defenseMult = Math.min(1.25, mods.defenseMult);
  mods.staminaRetentionMult = Math.min(1.30, mods.staminaRetentionMult);
  mods.gkSaveMult = Math.min(1.25, mods.gkSaveMult);
  mods.gk1v1Mult = Math.min(1.25, mods.gk1v1Mult);
  mods.gkCrossMult = Math.min(1.25, mods.gkCrossMult);

  return mods;
}
