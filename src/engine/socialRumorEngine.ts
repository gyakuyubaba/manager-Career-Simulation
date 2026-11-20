import {
  Club,
  GameWorldState,
  LeagueKey,
  MatchFixture,
  NewsItem,
  Player,
  RumorCredibilityLevel,
  SmartphoneNewsComment,
  SmartphoneNewsPost,
  TransferInterviewChoice,
  TransferInterviewRequest,
  TransferInterviewStance,
  TransferNegotiation,
  TransferNewsMeta,
  TransferNewsStatusLabel,
  TransferRumor,
  TransferRumorScenario
} from '../types/game';

export type FanArchetypeCategory =
  | 'enthusiastic'
  | 'calm_analyst'
  | 'harsh_critic'
  | 'manager_defender'
  | 'signing_hopeful'
  | 'signing_skeptic'
  | 'tactical'
  | 'financial'
  | 'youth_advocate'
  | 'rival_fan'
  | 'neutral'
  | 'witty';

interface PersonaArchetype {
  id: string;
  author: string;
  handle: string;
  emoji: string;
  bgClass: string;
  role: string;
  perspective: string;
  archetype: FanArchetypeCategory;
  defaultSentiment: 'positive' | 'neutral' | 'critical' | 'mixed';
}

const PERSONA_POOL: PersonaArchetype[] = [
  // 1. 熱狂的なファン (enthusiastic)
  { id: 'p_ultras_1', author: 'ゴール裏の古参サポ', handle: '@kurve_ultras12', emoji: '📣', bgClass: 'bg-emerald-500/20 text-emerald-300', role: '熱狂的なファン', perspective: '熱狂・応援', archetype: 'enthusiastic', defaultSentiment: 'positive' },
  { id: 'p_faithful_2', author: '週末はスタジアム', handle: '@matchday_faithful', emoji: '⚽', bgClass: 'bg-sky-500/20 text-sky-300', role: '熱狂的なファン', perspective: '期待・歓喜', archetype: 'enthusiastic', defaultSentiment: 'positive' },
  { id: 'p_cheer_3', author: '勝利を信じる男', handle: '@always_believe_fc', emoji: '🔥', bgClass: 'bg-amber-500/20 text-amber-300', role: '熱狂的なファン', perspective: '熱血支持', archetype: 'enthusiastic', defaultSentiment: 'positive' },
  { id: 'p_scarf_4', author: '12番目の選手', handle: '@12th_scarf_club', emoji: '🧣', bgClass: 'bg-teal-500/20 text-teal-300', role: '現地サポ', perspective: '全力応援', archetype: 'enthusiastic', defaultSentiment: 'positive' },
  { id: 'p_midnight_5', author: '夜更かしサポ', handle: '@midnight_kickoff', emoji: '🌙', bgClass: 'bg-violet-500/20 text-violet-300', role: '熱狂的ファン', perspective: '感想・応援', archetype: 'enthusiastic', defaultSentiment: 'positive' },

  // 2. 冷静な分析をするファン (calm_analyst)
  { id: 'p_calm_1', author: '試合映像見返し勢', handle: '@rewatch_90min', emoji: '🔎', bgClass: 'bg-cyan-500/20 text-cyan-300', role: '冷静な分析ファン', perspective: '客観・検証', archetype: 'calm_analyst', defaultSentiment: 'neutral' },
  { id: 'p_calm_2', author: '現地番記者メモ', handle: '@beat_reporter_live', emoji: '🗞️', bgClass: 'bg-indigo-500/20 text-indigo-300', role: '番記者・観測', perspective: '裏付け・冷静分析', archetype: 'calm_analyst', defaultSentiment: 'neutral' },
  { id: 'p_calm_3', author: 'ロッカールーム気質派', handle: '@dressing_room_eye', emoji: '👕', bgClass: 'bg-emerald-500/20 text-emerald-300', role: 'クラブウォッチャー', perspective: '序列・空気感', archetype: 'calm_analyst', defaultSentiment: 'neutral' },
  { id: 'p_calm_4', author: '補強リスト監視員', handle: '@scout_report_fan', emoji: '📋', bgClass: 'bg-sky-500/20 text-sky-300', role: 'データ分析ファン', perspective: '能力・適性査定', archetype: 'calm_analyst', defaultSentiment: 'neutral' },

  // 3. 厳しい批判をするファン (harsh_critic)
  { id: 'p_crit_1', author: '辛口スタンド親父', handle: '@strict_terrace', emoji: '💢', bgClass: 'bg-rose-500/20 text-rose-300', role: '厳しい批判ファン', perspective: '辛口批判', archetype: 'harsh_critic', defaultSentiment: 'critical' },
  { id: 'p_crit_2', author: '厳しい目の観客', handle: '@no_excuse_90min', emoji: '⚡', bgClass: 'bg-red-500/20 text-red-300', role: '結果重視サポ', perspective: '結果重視・批判', archetype: 'harsh_critic', defaultSentiment: 'critical' },
  { id: 'p_crit_3', author: 'ため息の月曜日', handle: '@monday_blues_fc', emoji: '😮‍💨', bgClass: 'bg-orange-500/20 text-orange-300', role: '古参批判派', perspective: '失望・危機感', archetype: 'harsh_critic', defaultSentiment: 'critical' },
  { id: 'p_crit_4', author: 'フロント批判急先鋒', handle: '@board_watch_dog', emoji: '🚨', bgClass: 'bg-red-500/20 text-red-300', role: 'フロント監視派', perspective: 'フロント批判', archetype: 'harsh_critic', defaultSentiment: 'critical' },

  // 4. 監督を擁護するファン (manager_defender)
  { id: 'p_protect_1', author: '長期プロジェクト支持派', handle: '@long_term_project', emoji: '🛡️', bgClass: 'bg-cyan-500/20 text-cyan-300', role: '監督擁護派', perspective: '監督擁護', archetype: 'manager_defender', defaultSentiment: 'positive' },
  { id: 'p_protect_2', author: 'アウェイ遠征組', handle: '@away_end_traveler', emoji: '🚄', bgClass: 'bg-indigo-500/20 text-indigo-300', role: '監督支持サポ', perspective: '擁護・後押し', archetype: 'manager_defender', defaultSentiment: 'positive' },
  { id: 'p_protect_3', author: 'プロセス重視派', handle: '@trust_the_build', emoji: '🧱', bgClass: 'bg-slate-600/30 text-slate-200', role: '現実的擁護派', perspective: '継続主張', archetype: 'manager_defender', defaultSentiment: 'mixed' },

  // 5. 補強に期待するファン (signing_hopeful)
  { id: 'p_hope_1', author: '大型補強待ちわび隊', handle: '@new_signing_hype', emoji: '✨', bgClass: 'bg-amber-500/20 text-amber-300', role: '補強期待ファン', perspective: '補強期待', archetype: 'signing_hopeful', defaultSentiment: 'positive' },
  { id: 'p_hope_2', author: '新戦力チェッカー', handle: '@welcome_new_star', emoji: '🤝', bgClass: 'bg-emerald-500/20 text-emerald-300', role: '移籍推進派', perspective: '新戦力待望', archetype: 'signing_hopeful', defaultSentiment: 'positive' },
  { id: 'p_hope_3', author: 'スカッド強化願望', handle: '@depth_upgrade_fc', emoji: '🚀', bgClass: 'bg-sky-500/20 text-sky-300', role: '積極補強派', perspective: '戦力上積み期待', archetype: 'signing_hopeful', defaultSentiment: 'positive' },

  // 6. 補強に反対する・慎重懐疑ファン (signing_skeptic)
  { id: 'p_skep_1', author: '本当に必要なのか？', handle: '@fit_or_flop_q', emoji: '❓', bgClass: 'bg-purple-500/20 text-purple-300', role: '補強慎重・反対派', perspective: '補強疑問視', archetype: 'signing_skeptic', defaultSentiment: 'mixed' },
  { id: 'p_skep_2', author: '既存戦力信頼派', handle: '@keep_our_core', emoji: '🔒', bgClass: 'bg-amber-500/20 text-amber-300', role: '既存重視・慎重派', perspective: '過剰補強反対', archetype: 'signing_skeptic', defaultSentiment: 'critical' },
  { id: 'p_skep_3', author: '噂には乗らない派', handle: '@no_fake_rumor', emoji: '🔍', bgClass: 'bg-yellow-500/20 text-yellow-300', role: '情報検証派', perspective: 'ソース検証・懐疑', archetype: 'signing_skeptic', defaultSentiment: 'neutral' },

  // 7. 戦術面から意見するファン (tactical)
  { id: 'p_tac_1', author: 'タクティクス研究室', handle: '@tactics_board_x', emoji: '📐', bgClass: 'bg-blue-500/20 text-blue-300', role: '戦術マニア', perspective: '戦術分析', archetype: 'tactical', defaultSentiment: 'neutral' },
  { id: 'p_tac_2', author: 'ハーフスペース観測所', handle: '@halfspace_notes', emoji: '📊', bgClass: 'bg-indigo-500/20 text-indigo-300', role: '戦術アナリスト', perspective: '配置・構造分析', archetype: 'tactical', defaultSentiment: 'neutral' },
  { id: 'p_tac_3', author: 'xGデータ解析班', handle: '@xg_metrics_lab', emoji: '📈', bgClass: 'bg-cyan-500/20 text-cyan-300', role: 'データ派', perspective: '数値・データ分析', archetype: 'tactical', defaultSentiment: 'mixed' },
  { id: 'p_tac_4', author: 'プレス強度チェッカー', handle: '@ppda_pressing', emoji: '⚙️', bgClass: 'bg-sky-500/20 text-sky-300', role: '戦術オタク', perspective: '守備・強度分析', archetype: 'tactical', defaultSentiment: 'neutral' },
  { id: 'p_tac_5', author: '戦術図解アカウント', handle: '@zone14_diagram', emoji: '🗺️', bgClass: 'bg-blue-600/20 text-blue-300', role: '戦術研究家', perspective: '戦術適応性', archetype: 'tactical', defaultSentiment: 'neutral' },

  // 8. 経営面から意見するファン (financial)
  { id: 'p_fin_1', author: 'FFP財務ウォッチャー', handle: '@ffp_balance_sheet', emoji: '💶', bgClass: 'bg-emerald-600/20 text-emerald-300', role: '財務ウォッチャー', perspective: '経営・財務視点', archetype: 'financial', defaultSentiment: 'neutral' },
  { id: 'p_fin_2', author: '移籍金コスパ査定人', handle: '@transfer_roi_eye', emoji: '🏷️', bgClass: 'bg-amber-600/20 text-amber-300', role: '市場分析家', perspective: '移籍金コスパ', archetype: 'financial', defaultSentiment: 'mixed' },
  { id: 'p_fin_3', author: '年俸キャップ監視団', handle: '@wage_structure_jp', emoji: '📑', bgClass: 'bg-slate-600/30 text-slate-300', role: '給与規律派', perspective: '年俸・収支バランス', archetype: 'financial', defaultSentiment: 'neutral' },
  { id: 'p_fin_4', author: 'フットボール経済新聞', handle: '@club_biz_review', emoji: '🏛️', bgClass: 'bg-teal-600/20 text-teal-300', role: '経営アナリスト', perspective: '持続可能性評価', archetype: 'financial', defaultSentiment: 'neutral' },

  // 9. 若手選手を応援するファン (youth_advocate)
  { id: 'p_yth_1', author: 'アカデミー最優先派', handle: '@academy_first_u21', emoji: '🌱', bgClass: 'bg-lime-500/20 text-lime-300', role: '若手育成派', perspective: '若手起用論', archetype: 'youth_advocate', defaultSentiment: 'mixed' },
  { id: 'p_yth_2', author: 'U21推しスカウト', handle: '@nextgen_wonderkid', emoji: '🌟', bgClass: 'bg-emerald-500/20 text-emerald-300', role: '若手推し', perspective: '将来性・育成', archetype: 'youth_advocate', defaultSentiment: 'positive' },
  { id: 'p_yth_3', author: '生え抜き主義者', handle: '@homegrown_heart', emoji: '🏡', bgClass: 'bg-teal-500/20 text-teal-300', role: '生え抜き応援', perspective: '下部組織重視', archetype: 'youth_advocate', defaultSentiment: 'neutral' },

  // 10. ライバルクラブのファン (rival_fan)
  { id: 'p_riv_1', author: '隣街のライバルサポ', handle: '@rival_watch_away', emoji: '👀', bgClass: 'bg-purple-500/20 text-purple-300', role: 'ライバルクラブファン', perspective: 'ライバル目線', archetype: 'rival_fan', defaultSentiment: 'mixed' },
  { id: 'p_riv_2', author: '相手クラブ応援団', handle: '@visitor_supporter', emoji: '🏴', bgClass: 'bg-rose-500/20 text-rose-300', role: '他クラブサポ', perspective: '他サポ反応', archetype: 'rival_fan', defaultSentiment: 'critical' },
  { id: 'p_riv_3', author: '宿敵クラブ監視垢', handle: '@derby_observer_x', emoji: '⚔️', bgClass: 'bg-pink-500/20 text-pink-300', role: 'ライバルサポ', perspective: '競合視点', archetype: 'rival_fan', defaultSentiment: 'mixed' },

  // 11. 中立的なサッカーファン (neutral)
  { id: 'p_neu_1', author: '欧州リーグ見物人', handle: '@neutral_league_fan', emoji: '🍿', bgClass: 'bg-slate-600/30 text-slate-200', role: '中立ファン', perspective: '中立的見解', archetype: 'neutral', defaultSentiment: 'neutral' },
  { id: 'p_neu_2', author: '欧州メルカート通', handle: '@mercato_pulse_eu', emoji: '🎙️', bgClass: 'bg-sky-600/20 text-sky-300', role: '中立・市場通', perspective: '市場全体観', archetype: 'neutral', defaultSentiment: 'neutral' },
  { id: 'p_neu_3', author: 'サッカー総合ウォッチャー', handle: '@football_panoramic', emoji: '🌐', bgClass: 'bg-indigo-500/20 text-indigo-300', role: '中立ウォッチャー', perspective: '客観・リーグ視点', archetype: 'neutral', defaultSentiment: 'neutral' },

  // 12. 皮肉・ジョークを言うファン (witty)
  { id: 'p_wit_1', author: '大喜利スタジアム', handle: '@football_ogiri', emoji: '🃏', bgClass: 'bg-violet-500/20 text-violet-300', role: '皮肉・ジョーク枠', perspective: '皮肉・冗談', archetype: 'witty', defaultSentiment: 'mixed' },
  { id: 'p_wit_2', author: 'F5キー連打ニキ', handle: '@deadline_f5_bot', emoji: '💻', bgClass: 'bg-fuchsia-500/20 text-fuchsia-300', role: 'ネタ・皮肉枠', perspective: 'ユーモア', archetype: 'witty', defaultSentiment: 'neutral' },
  { id: 'p_wit_3', author: 'サッカー界の皮肉屋', handle: '@sarcastic_pint', emoji: '🍺', bgClass: 'bg-amber-500/20 text-amber-300', role: 'パブ常連皮肉屋', perspective: 'ジョーク・ツッコミ', archetype: 'witty', defaultSentiment: 'mixed' }
];

const MEDIA_SOURCES_HIGH = [
  'The Athletic 移籍班',
  'Sky Sports Mercato',
  'Fabrizio型インサイダー速報',
  'L’Équipe 現地取材班',
  'クラブ公式発表・現地番記者'
];

const MEDIA_SOURCES_MID = [
  'Football Insider',
  'Calciomercato News',
  'Kicker 移籍コーナー',
  '地元紙電子版',
  '移籍市場ウォッチ'
];

const MEDIA_SOURCES_LOW = [
  '匿名SNS移籍アカウント',
  '欧州タブロイドゴシップ',
  'ファン掲示板噂スレ',
  '移籍ウォッチャー伝聞'
];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededPick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function formatTimeOffset(index: number, wave: number = 1): string {
  if (wave > 1) {
    const mins = 2 + ((index * 13) % 140);
    return mins < 60 ? `会見${mins}分後` : `会見${Math.floor(mins / 60)}時間後`;
  }
  const minuteSteps = [2, 5, 9, 14, 19, 25, 33, 41, 52, 68, 84, 105, 130, 165, 195, 220, 250, 290, 330, 380, 420, 460, 510, 560, 610, 660, 720, 780];
  const m = minuteSteps[index % minuteSteps.length] + Math.floor(index / minuteSteps.length) * 45;
  if (m < 60) return `${m}分後`;
  return `${Math.floor(m / 60)}時間後`;
}

function normalizeForDedup(text: string): string {
  return text.replace(/[\s\u3000「」『』（）()！!？?・、。.,:：]/g, '').toLowerCase();
}

function formatMoneyM(val?: number): string {
  if (val === undefined || val === null) return '';
  if (val === 0) return 'フリートランスファー（移籍金ゼロ）';
  if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
  return `€${Math.round(val / 1000)}K`;
}

function formatWageK(val?: number): string {
  if (!val || val <= 0) return '';
  return `週給€${Math.max(1, Math.round(val / 1000))}K`;
}

interface ClubContextSignals {
  leagueRankStr: string;
  leagueRankNum?: number;
  totalLeagueTeams?: number;
  recentFormStr: string;
  lastMatchStr: string;
  budgetStr: string;
  wageHeadroomStr: string;
  topU21Name: string;
  recentManagerQuote: string;
  clubTarget: string;
}

function extractClubContextSignals(
  state: GameWorldState | undefined,
  userClub: Club | null | undefined,
  playersMap?: Record<string, Player>
): ClubContextSignals {
  const players = playersMap || state?.players || {};
  const clubTarget = userClub?.target || '上位進出';
  const budgetM = userClub ? (userClub.transferBudget / 1000000).toFixed(1) : '30.0';
  const budgetStr = `€${budgetM}M`;

  let leagueRankStr = 'リーグ中盤戦';
  let leagueRankNum: number | undefined;
  let totalLeagueTeams: number | undefined;
  let recentFormStr = '直近数試合を戦う中';
  let lastMatchStr = 'ここまでの戦いぶり';

  if (state && userClub) {
    const table = state.standings?.[userClub.league as LeagueKey] || [];
    const idx = table.findIndex(r => r.clubId === userClub.id);
    if (idx !== -1) {
      leagueRankNum = idx + 1;
      totalLeagueTeams = table.length;
      const row = table[idx];
      leagueRankStr = `${table.length}チーム中${idx + 1}位（勝点${row.points}）`;
    }

    const playedFixtures = (state.fixtures || [])
      .filter(f => f.status === 'finished' && (f.homeClubId === userClub.id || f.awayClubId === userClub.id))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (playedFixtures.length > 0) {
      const last = playedFixtures[0];
      const isH = last.homeClubId === userClub.id;
      const us = isH ? (last.homeScore ?? 0) : (last.awayScore ?? 0);
      const os = isH ? (last.awayScore ?? 0) : (last.homeScore ?? 0);
      const oppName = state.clubs[isH ? last.awayClubId : last.homeClubId]?.shortName || '相手';
      const resLabel = us > os ? '勝利' : us === os ? '引き分け' : '敗戦';
      lastMatchStr = `直近${oppName}戦（${us}-${os}${resLabel}）`;

      const slice5 = playedFixtures.slice(0, 5);
      let w = 0;
      let d = 0;
      let l = 0;
      slice5.forEach(fx => {
        const ih = fx.homeClubId === userClub.id;
        const u = ih ? (fx.homeScore ?? 0) : (fx.awayScore ?? 0);
        const o = ih ? (fx.awayScore ?? 0) : (fx.homeScore ?? 0);
        if (u > o) w++;
        else if (u === o) d++;
        else l++;
      });
      recentFormStr = `直近${slice5.length}戦${w}勝${d}分${l}敗`;
    }
  }

  let wageHeadroomStr = '給与枠にまだ余裕あり';
  let topU21Name = 'アカデミーの若手';
  if (userClub) {
    const squad = Object.values(players).filter(p => p.clubId === userClub.id);
    const totalWage = squad.reduce((sum, p) => sum + (p.wage || 0), 0);
    if (userClub.wageBudget > 0) {
      const ratio = totalWage / userClub.wageBudget;
      wageHeadroomStr = ratio > 0.92 ? '給与枠がかなり逼迫中' : ratio > 0.78 ? '人件費バランス要調整' : '給与バランスは健全';
    }
    const u21 = squad
      .filter(p => p.age <= 21)
      .sort((a, b) => (b.potential - a.potential) || (b.ovr - a.ovr))[0];
    if (u21) {
      topU21Name = `${u21.name}（${u21.age}歳）`;
    }
  }

  let recentManagerQuote = '';
  if (state) {
    const answered = (state.transferInterviews || []).find(i => i.status === 'answered' && i.answerText);
    if (answered?.answerText) {
      recentManagerQuote = answered.answerText.slice(0, 28);
    } else if (state.interviewHistory && state.interviewHistory.length > 0 && state.interviewHistory[0].qa?.[0]?.answer) {
      recentManagerQuote = state.interviewHistory[0].qa[0].answer.slice(0, 28);
    }
  }

  return {
    leagueRankStr,
    leagueRankNum,
    totalLeagueTeams,
    recentFormStr,
    lastMatchStr,
    budgetStr,
    wageHeadroomStr,
    topU21Name,
    recentManagerQuote,
    clubTarget
  };
}

function collectRecentUsedCommentTexts(state?: GameWorldState): Set<string> {
  const set = new Set<string>();
  if (!state?.smartphone?.newsFeed) return set;
  for (const post of state.smartphone.newsFeed.slice(0, 12)) {
    for (const cmt of post.comments || []) {
      set.add(normalizeForDedup(cmt.text));
    }
  }
  return set;
}

/**
 * Selects diverse personas ensuring broad representation across all 12 archetypes
 * while rotating the order per seed so every post reads fresh.
 */
function pickPersonas(seedStr: string, count: number, excludeAuthors: Set<string>): PersonaArchetype[] {
  const baseHash = hashString(seedStr);
  const picked: PersonaArchetype[] = [];
  const usedIds = new Set<string>();

  // Group by archetype and rotate bucket order per seed
  const buckets = new Map<FanArchetypeCategory, PersonaArchetype[]>();
  for (const p of PERSONA_POOL) {
    const list = buckets.get(p.archetype) || [];
    list.push(p);
    buckets.set(p.archetype, list);
  }
  const archetypes = Array.from(buckets.keys());
  const rot = baseHash % archetypes.length;
  const orderedArchetypes = [...archetypes.slice(rot), ...archetypes.slice(0, rot)];
  const step = 1 + (baseHash % 5);

  // Round-robin pass across the 12 archetypes with per-seed stride
  for (let round = 0; round < 5 && picked.length < count; round++) {
    for (let idx = 0; idx < orderedArchetypes.length && picked.length < count; idx++) {
      const archIdx = (idx * step + round) % orderedArchetypes.length;
      const arch = orderedArchetypes[archIdx];
      const list = buckets.get(arch) || [];
      if (list.length === 0) continue;
      const pIdx = (baseHash + round + idx) % list.length;
      for (let attempt = 0; attempt < list.length; attempt++) {
        const cand = list[(pIdx + attempt) % list.length];
        if (!excludeAuthors.has(cand.author) && !usedIds.has(cand.id)) {
          excludeAuthors.add(cand.author);
          usedIds.add(cand.id);
          picked.push(cand);
          break;
        }
      }
    }
  }

  // Fallback sweep if still short
  if (picked.length < count) {
    for (const cand of PERSONA_POOL) {
      if (picked.length >= count) break;
      if (!excludeAuthors.has(cand.author) && !usedIds.has(cand.id)) {
        excludeAuthors.add(cand.author);
        usedIds.add(cand.id);
        picked.push(cand);
      }
    }
  }

  return picked;
}

export interface MatchSnsContext {
  kind: 'match';
  fixture: MatchFixture;
  userClub: Club;
  oppClub: Club;
  isUserHome: boolean;
  players: Record<string, Player>;
  managerName: string;
  boardConfidence: number;
  consecutiveLosses?: number;
  state?: GameWorldState;
}

export interface StarterClubSnsContext {
  kind: 'club_intro';
  userClub?: Club | null;
  managerName: string;
  date: string;
  state?: GameWorldState;
}

export interface RumorSnsContext {
  kind: 'transfer_rumor';
  userClub: Club;
  managerName: string;
  player?: Player;
  otherClub?: Club | null;
  scenario: TransferRumorScenario;
  credibility: RumorCredibilityLevel;
  hasFormalOffer: boolean;
  estimatedFee?: number;
  contractYears?: number;
  transferTypeLabel?: string;
  competingClubNames?: string[];
  date: string;
  mediaSource: string;
  isMajorStory?: boolean;
  state?: GameWorldState;
}

export type SnsTopicContext = MatchSnsContext | StarterClubSnsContext | RumorSnsContext;

function buildMatchCommentText(
  persona: PersonaArchetype,
  ctx: MatchSnsContext,
  signals: ClubContextSignals,
  seed: number,
  replyTarget?: string
): { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string; replyToAuthor?: string } {
  const h = ctx.fixture.homeScore ?? 0;
  const a = ctx.fixture.awayScore ?? 0;
  const uScore = ctx.isUserHome ? h : a;
  const oScore = ctx.isUserHome ? a : h;
  const diff = uScore - oScore;
  const club = ctx.userClub.shortName || ctx.userClub.name;
  const opp = ctx.oppClub.shortName || ctx.oppClub.name;
  const scoreStr = `${uScore}-${oScore}`;
  const goals = (ctx.fixture.events || []).filter(
    e => (e.type === 'goal' || e.type === 'penalty') && e.clubId === ctx.userClub.id && !e.description?.includes('PK戦')
  );
  const scorer = goals[seed % Math.max(1, goals.length)]?.playerName || null;
  const lateGoal = goals.some(e => e.minute >= 80);
  const cleanSheet = oScore === 0;
  const comp = ctx.fixture.competitionName || 'リーグ戦';

  const replyPrefix = replyTarget && seed % 4 === 0 ? `@${replyTarget} の意見も分かるけど、` : '';
  const replyToAuthor = replyPrefix ? replyTarget : undefined;

  switch (persona.archetype) {
    case 'rival_fan': {
      const lines = diff > 0
        ? [
            `${opp}寄りで見ても今日の${club}は勝負どころの圧が違ったな。${scoreStr}はちょっと悔しいが納得。`,
            `他サポながら${ctx.managerName}監督の${club}は${signals.leagueRankStr}にいるだけの強度を出してくるね。`,
            `${scorer ? `${scorer}にあそこまで自由を与えたらそりゃ失点するわ…。` : `${comp}で${scoreStr}とは`}ライバルとして素直に厄介。`
          ]
        : diff === 0
          ? [
              `ライバル目線だと${club}と${opp}の${scoreStr}ドローは勝ち点2を分け合ってくれて助かる展開（笑）。`,
              `${club}のファンは苛立ってるっぽいけど、${opp}も今日かなり粘り強かったぞ。`
            ]
          : [
              `${opp}ナイスゲーム！${club}が${scoreStr}で足踏みするとリーグ戦が一気に面白くなる。`,
              `他クラブファンだけど今日の${club}は少しガス欠に見えたな。${signals.recentFormStr}の中で修正できるか見もの。`
            ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: diff > 0 ? 'mixed' : 'neutral', perspectiveLabel: 'ライバル視点', replyToAuthor };
    }

    case 'witty': {
      const lines = diff >= 2
        ? [
            `${scoreStr}で勝った瞬間だけTLの掌返しが音速レベルになるの毎度ながら清々しいｗ`,
            `${scorer ? `${scorer}の一撃で` : '今日の快勝で'}月曜の満員電車すら乗り切れそうな気分になってるの単純すぎる俺ｗｗ`,
            `${comp}の${opp}戦で${scoreStr}快勝！もう明日あたりから優勝パレードのルート検索し始める奴いそう。`
          ]
        : diff > 0
          ? [
              `${lateGoal ? '終盤の劇的弾で' : 'ギリギリの'}${scoreStr}勝利！心臓の予備パーツ支給してから試合見せてくれｗ`,
              `試合内容は胃がキリキリしたけど勝点3お持ち帰りなら全部ヨシ！${ctx.managerName}監督の胃薬代も心配になる。`
            ]
          : diff === 0
            ? [
                `${scoreStr}…決定機外すたびに寿命が半日ずつ削れていく観戦体験なにこれｗ`,
                `勝ち点1を「よく耐えた」と喜ぶ派と「2点落とした」と嘆く派で毎節タイムラインが真っ二つになる定例会。`
              ]
            : [
                `${scoreStr}負けの日はスマホを冷蔵庫に封印するのが最善と分かってたのにTL開いちゃったじゃん…。`,
                `今日は負け試合だけど、明日の練習場で${ctx.managerName}監督が笑顔消えてそうなのだけは想像できたｗ`
              ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: diff > 0 ? 'positive' : 'mixed', perspectiveLabel: '皮肉・ジョーク', replyToAuthor };
    }

    case 'tactical': {
      const lines = diff > 0
        ? [
            `${opp}のブロックに対して${club}は中盤の立ち位置と3人目の動きが整理されていた。${cleanSheet ? '無失点に抑えたプレッシングの連動も見事。' : `${scoreStr}以上に中身がある勝利。`}`,
            `${scorer ? `${scorer}をハーフスペースへ走らせる配球` : 'ビルドアップ時のアンカーの引き出し方'}が機能しており、${ctx.managerName}監督の試合前の仕込みがハマった印象。`,
            `後半の交代カードとライン間の圧縮が的確だった${comp}の一戦。xGの質を見ても順当な${scoreStr}。`
          ]
        : diff === 0
          ? [
              `${scoreStr}の引き分け。中盤のボール回収は安定していたが、ボックス内で枚数を揃えるタイミングに一歩遅れがあった。`,
              `${opp}のブロックを崩すにはサイドのオーバーラップと中央の縦パスをもっとテンポよく混ぜたかったところ。`
            ]
          : [
              `${scoreStr}での敗戦はトランジション局面の帰陣の遅れとSB裏のカバー範囲が突かれた形。次節への明確な修正点。`,
              `ボール保持の時間が長いわりに縦へのスイッチが入らず、${opp}のカウンターの的になってしまったのが痛い。`
            ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: diff > 0 ? 'positive' : diff === 0 ? 'neutral' : 'critical', perspectiveLabel: '戦術分析', replyToAuthor };
    }

    case 'youth_advocate': {
      const lines = diff >= 2
        ? [
            `${scoreStr}まで試合を決めた時間帯なら${signals.topU21Name}みたいな生え抜き・若手枠にも15分くらい実戦経験を回してほしかった！`,
            `主力がきっちり仕事をしてくれる今だからこそ、${signals.topU21Name}のような若い力をベンチから試して層に厚みを作りたいね。`
          ]
        : [
            `こういうタフな局面ほど思い切って${signals.topU21Name}を起用して運動量と勢いを注入する選択肢もあっていいと思う。`,
            `${signals.recentFormStr}の日程を乗り切るには主力頼みだけでなくアカデミー組のフレッシュな足を上手く混ぜることが必須。`
          ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: diff > 0 ? 'mixed' : 'neutral', perspectiveLabel: '若手応援・起用論', replyToAuthor };
    }

    case 'financial': {
      const lines = diff > 0
        ? [
            `${comp}の${opp}戦で${scoreStr}の勝利は賞金・順位ボーナスやスポンサー評価の面でも大きい。残り予算${signals.budgetStr}の使い道に余裕が生まれる。`,
            `現在${signals.leagueRankStr}の位置をキープできたことで市場での交渉力も上がる。目標「${signals.clubTarget}」達成へ財政的にも追い風。`
          ]
        : [
            `${opp}戦の${scoreStr}で課題が露呈したポジションは、予算${signals.budgetStr}と${signals.wageHeadroomStr}を踏まえて次の移籍窓での補強優先度を見極めたい。`,
            `結果を取りこぼすと欧州大会権・放映権配分にも響く。目の前の1試合がクラブの来季予算を左右する意識で戦ってほしい。`
          ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: diff > 0 ? 'positive' : 'neutral', perspectiveLabel: '経営・収益視点', replyToAuthor };
    }

    case 'harsh_critic': {
      const lines = diff >= 2
        ? [
            `${scoreStr}で勝ったのは良かったが、終盤に${oScore > 0 ? '集中が切れて失点した場面' : '詰めが甘かったシーン'}は上位対決なら命取りになるぞ。`,
            `勝点3には満足しているが、今日の${opp}相手の内容で浮かれていたら${signals.clubTarget}は遠い。気を引き締め直せ。`
          ]
        : diff > 0
          ? [
              `結果は${scoreStr}でも内容はお世辞にも褒められたものじゃない。ホームでこれだけチャンスを逸していては先が思いやられる。`,
              `勝ったのは最低限のノルマ。${ctx.managerName}監督には交代カードの遅さを含めてもう少しシビアに修正を求めたい。`
            ]
          : [
              `${opp}相手に${scoreStr}はさすがに失望の方が大きい。${signals.recentFormStr}という流れを断ち切る覚悟がピッチから見えなかった。`,
              `サポーターは毎週時間とお金をかけて応援しているんだ。${scoreStr}の結果に対して納得のいく説明と変化を見せてくれ。`
            ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: diff >= 2 ? 'mixed' : 'critical', perspectiveLabel: diff >= 2 ? '厳しい注文' : '批判・危機感', replyToAuthor };
    }

    case 'manager_defender': {
      const lines = diff >= 0
        ? [
            `${ctx.managerName}監督が掲げてきたやり方が${signals.leagueRankStr}という位置と今日のプレーに着実につながっている。一喜一憂せず信じて見守りたい。`,
            `${opp}のようなやりにくい相手にも大崩れせず戦えたのはベンチワークのおかげ。選手と監督の信頼関係がピッチに出ている。`
          ]
        : [
            `負けた直後に監督解任とか言い出すのはあまりに短絡的。${ctx.managerName}監督の意図は随所に見えたし、ここで揺らぐ方が危険だ。`,
            `${scoreStr}の敗戦は悔しいが怪我や過密日程もある。批判の声に負けずチーム全員で次の試合へ向かってほしい。`
          ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: diff >= 0 ? 'positive' : 'mixed', perspectiveLabel: '監督擁護', replyToAuthor };
    }

    case 'signing_hopeful': {
      const lines = diff > 0
        ? [
            `今の${club}でも十分戦えているけど、ここにもう一人クラスのある即戦力が加われば本気で上を狙えるはず！次の補強にも期待したい。`,
            `${scorer ? `${scorer}と` : ''}前線でコンビを組めるスピードスターか中盤のアクセントが一人来たら完全に完成しそう。`
          ]
        : [
            `今日の${scoreStr}を見ると、やはり勝負を決め切るラストピースの補強が必要だと痛感する。強化部には次のウィンドウで動いてほしい！`,
            `既存選手の頑張りは認めるけど、過密日程を戦い抜くにはもう1〜2枚グレードを上げる補強が欲しいのが本音。`
          ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: 'mixed', perspectiveLabel: '補強期待', replyToAuthor };
    }

    case 'signing_skeptic': {
      const lines = diff >= 0
        ? [
            `勝てば「優勝だ」負けたら「補強しろ」って騒ぐより、まずは今いるメンバーのコンディション管理と連携深化を優先すべきでは？`,
            `外から高い選手を連れてくる前に、今日の試合で浮いた課題を練習でどこまで詰められるかが先決だと思う。`
          ]
        : [
            `敗戦のたびに新しい選手を欲しがる声が出るけど、${signals.recentFormStr}の原因は単純な補強不足だけじゃないはずだ。戦術と起用法も見直すべき。`,
            `焦って場当たり的な補強に走るのが一番クラブを迷走させる。慎重に今のスカッドの適正を見極めてほしい。`
          ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: 'neutral', perspectiveLabel: '慎重・既存重視', replyToAuthor };
    }

    case 'calm_analyst': {
      const lines = diff > 0
        ? [
            `${comp}の${opp}戦で${scoreStr}。派手さはなくても守備ブロックの基準点が安定してきたのが${signals.leagueRankStr}にいられる理由だろう。`,
            `${scorer ? `${scorer}の決定力もさることながら、` : ''}中盤の球際の強さで主導権を握れた時間帯が長かったのが最大の勝因。`
          ]
        : [
            `${opp}戦${scoreStr}。${signals.recentFormStr}の中で得失点パターンの傾向がはっきり出てきており、次は修正が問われる一戦になりそう。`,
            `感情的な批判も出る結果だが、90分通した支配率やセカンドボール回収率を冷静に見れば完全に崩れたわけではない。`
          ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: diff > 0 ? 'positive' : 'neutral', perspectiveLabel: '冷静分析', replyToAuthor };
    }

    case 'neutral': {
      const lines = [
        `${comp}第何節かの好カード、${club}対${opp}は${scoreStr}。どちらにも見どころがあって中立ファンとして楽しめる90分だった。`,
        `${club}は現在${signals.leagueRankStr}。今日の${scoreStr}がシーズンの分岐点になる可能性もありそうで注目している。`,
        `両チームの強みと弱みがはっきり出た${opp}対${club}戦。リーグ全体の順位争いもここからさらに激しくなりそう。`
      ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: 'neutral', perspectiveLabel: '中立視点', replyToAuthor };
    }

    case 'enthusiastic':
    default: {
      const lines = diff > 0
        ? [
            `${opp}相手に${scoreStr}勝利最高だ！！${scorer ? `${scorer}のゴールが決まった瞬間思わず叫んだ！` : ''}${ctx.managerName}監督と選手たちに大拍手！！`,
            `スタジアムの一体感が凄まじかった！${comp}で${scoreStr}の勝ち点3、この勢いのまま次節も突き進もう！`,
            `${cleanSheet ? '無失点での完勝は守備陣の誇りだ！' : '泥臭く勝ち切った攻撃陣に脱帽！'}今週は最高に気持ちよく過ごせる！`
          ]
        : diff === 0
          ? [
              `最後まで諦めず走り切った選手たちに感謝！${opp}戦の${scoreStr}、勝ち点1を次に必ず活かそう！`,
              `接戦の${scoreStr}ドロー！惜しい場面も多かったけどこの粘り強さが${club}の誇りだ。来週こそホームで歓喜を！`
            ]
          : [
              `今日は${scoreStr}で本当に悔しい…。でも${club}を応援する気持ちは1ミリも変わらない。顔を上げて次の試合に備えよう！`,
              `こういう敗戦のあとこそゴール裏から一番大きな声援が必要だ！${ctx.managerName}監督とチームを信じて最後までついていく！`
            ];
      return { text: `${replyPrefix}${seededPick(lines, seed)}`, sentiment: diff >= 0 ? 'positive' : 'mixed', perspectiveLabel: diff > 0 ? '歓喜・応援' : '熱い後押し', replyToAuthor };
    }
  }
}

function buildStarterIntroCommentText(
  persona: PersonaArchetype,
  ctx: StarterClubSnsContext,
  signals: ClubContextSignals,
  seed: number,
  replyTarget?: string
): { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string; replyToAuthor?: string } {
  const club = ctx.userClub ? (ctx.userClub.shortName || ctx.userClub.name) : 'クラブ';
  const replyPrefix = replyTarget && seed % 4 === 0 ? `@${replyTarget} の指摘通りで、` : '';
  const replyToAuthor = replyPrefix ? replyTarget : undefined;

  switch (persona.archetype) {
    case 'harsh_critic':
      return {
        text: `${replyPrefix}${seededPick([
          `${ctx.managerName}新監督を迎えたからといって簡単にはいかない。目標「${signals.clubTarget}」を達成できなければ厳しい評価は避けられないぞ。`,
          `フロントの編成力にはまだ注文をつけたい点が多い。開幕前にスカッドの穴を本当に埋められるのか厳しく見させてもらう。`
        ], seed)}`,
        sentiment: 'critical',
        perspectiveLabel: 'シビアな要求',
        replyToAuthor
      };
    case 'financial':
      return {
        text: `${replyPrefix}${seededPick([
          `今季の初期移籍予算は${signals.budgetStr}、${signals.wageHeadroomStr}。${ctx.managerName}監督とフロントがどう資金配分するか注目している。`,
          `単年での大型投資だけでなく契約満了が近い選手の整理とバランスシートの健全化が重要なスタートになりそう。`
        ], seed)}`,
        sentiment: 'neutral',
        perspectiveLabel: '経営・財務分析',
        replyToAuthor
      };
    case 'tactical':
      return {
        text: `${replyPrefix}${seededPick([
          `${ctx.managerName}監督が${club}の既存メンバーにどんなシステムとプレス強度を落とし込むのか、プレシーズンから戦術的変化に注目だ。`,
          `中盤の構成力と両翼のバランスをどう組み上げるか、開幕戦のスタメン配置から監督の意図を読み解きたい。`
        ], seed)}`,
        sentiment: 'neutral',
        perspectiveLabel: '戦術展望',
        replyToAuthor
      };
    case 'youth_advocate':
      return {
        text: `${replyPrefix}${seededPick([
          `新監督のスタート時こそ${signals.topU21Name}のような生え抜き・若手選手にとって最大のアピール機会！ぜひ思い切って抜擢してほしい。`,
          `即戦力だけでなく3年後の中核を見据えてアカデミー出身の選手にも積極的に出場時間を与えてくれる体制に期待！`
        ], seed)}`,
        sentiment: 'positive',
        perspectiveLabel: '若手起用期待',
        replyToAuthor
      };
    case 'witty':
      return {
        text: `${replyPrefix}${seededPick([
          `毎年開幕前だけは「今季のうちは優勝候補なんじゃ？」って謎の万能感に包まれるサポ現象に名前をつけたいｗ`,
          `新監督が就任初日の会見終える前から移籍噂アカウントがアップ始めててサッカー界の風物詩すぎるｗｗ`
        ], seed)}`,
        sentiment: 'mixed',
        perspectiveLabel: 'ユーモア',
        replyToAuthor
      };
    case 'rival_fan':
      return {
        text: `${replyPrefix}${seededPick([
          `${club}の新体制、予算${signals.budgetStr}抱えてどんなチームを作って来るのかライバルクラブ視点でも普通に気になるな。`,
          `${ctx.managerName}監督の手腕が未知数なだけに、序盤戦でどれくらい完成度を上げてくるか警戒して見ておく。`
        ], seed)}`,
        sentiment: 'neutral',
        perspectiveLabel: 'ライバル反応',
        replyToAuthor
      };
    case 'signing_hopeful':
      return {
        text: `${replyPrefix}${seededPick([
          `予算${signals.budgetStr}を活かして${ctx.managerName}監督のスタイルにハマる即戦力を1〜2枚獲ってくれたら最高に盛り上がるんだが！`,
          `フロントと監督が連携してスカッドのウィークポイントを埋める補強に動くか、この移籍市場から目が離せない。`
        ], seed)}`,
        sentiment: 'positive',
        perspectiveLabel: '補強期待',
        replyToAuthor
      };
    case 'signing_skeptic':
      return {
        text: `${replyPrefix}${seededPick([
          `開幕前から派手な補強ばかり望むより、まずは${ctx.managerName}監督が現有戦力をどこまで引き上げられるかじっくり見たい。`,
          `焦って高額移籍に飛びつかず、チーム内の競争とコンディション整備から着手するのが堅実なやり方だと思う。`
        ], seed)}`,
        sentiment: 'neutral',
        perspectiveLabel: '慎重・現有重視',
        replyToAuthor
      };
    case 'manager_defender':
      return {
        text: `${replyPrefix}${seededPick([
          `新監督には最初の数試合だけで判断せず、戦術を浸透させる時間をしっかり与えてサポーターも後押ししていこう。`,
          `${ctx.managerName}監督のサッカーを信じて、クラブ全体で目標「${signals.clubTarget}」に向けて結束するシーズンにしたい。`
        ], seed)}`,
        sentiment: 'positive',
        perspectiveLabel: '監督支持',
        replyToAuthor
      };
    case 'calm_analyst':
    case 'neutral':
      return {
        text: `${replyPrefix}${seededPick([
          `${club}の新章スタート。戦力構成と予算${signals.budgetStr}のバランスを見る限り、序盤の入り方が年間順位を大きく左右しそう。`,
          `${ctx.managerName}監督の初陣に向けて、既存の主力と新戦力・若手どう融合させるかが最大の注目ポイントだね。`
        ], seed)}`,
        sentiment: 'neutral',
        perspectiveLabel: '冷静分析',
        replyToAuthor
      };
    case 'enthusiastic':
    default:
      return {
        text: `${replyPrefix}${seededPick([
          `${ctx.managerName}監督ようこそ${club}へ！目標「${signals.clubTarget}」へ向けてゴール裏から全力でサポートするぞ！！`,
          `新しいシーズンの幕開けに胸が躍る！スタジアムで最高の一体感を作って勝利を掴み取ろう！`
        ], seed)}`,
        sentiment: 'positive',
        perspectiveLabel: '歓迎・期待',
        replyToAuthor
      };
  }
}

function buildTransferRumorCommentText(
  persona: PersonaArchetype,
  ctx: RumorSnsContext,
  signals: ClubContextSignals,
  seed: number,
  replyTarget?: string
): { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string; replyToAuthor?: string } {
  const club = ctx.userClub.shortName || ctx.userClub.name;
  const pName = ctx.player?.name || '補強候補';
  const pPos = ctx.player?.position || '注目ポジション';
  const pAge = ctx.player?.age ?? 24;
  const pOvr = ctx.player?.ovr ?? 78;
  const pPot = ctx.player?.potential ?? 84;
  const pStyle = ctx.player?.playstyle || pPos;
  const marketVal = ctx.player?.marketValue ?? 25000000;
  const marketM = marketVal / 1000000;
  const feeVal = ctx.estimatedFee;
  const feeKnown = feeVal !== undefined && feeVal !== null;
  const feeLabel = feeVal === 0
    ? 'フリートランスファー'
    : feeVal
      ? `€${(feeVal / 1000000).toFixed(1)}M`
      : `推定市場価値€${marketM.toFixed(1)}M規模`;
  const estM = feeVal ? feeVal / 1000000 : marketM;
  const isExpensive = estM >= 45 || estM > marketM * 1.25;
  const isBargain = feeKnown && (feeVal === 0 || estM < marketM * 0.9);
  const wageText = formatWageK(ctx.player?.wage);
  const contractText = ctx.contractYears ? `${ctx.contractYears}年契約` : '';
  const otherClubName = ctx.otherClub?.shortName || ctx.otherClub?.name || '相手クラブ';
  const competingText = ctx.competingClubNames && ctx.competingClubNames.length > 0 ? ctx.competingClubNames.join('や') : '他クラブ';
  const isLowCred = ctx.credibility === '低い' || ctx.credibility === '誤報の可能性が高い';
  const quoteMention = signals.recentManagerQuote ? `監督が以前「${signals.recentManagerQuote}…」と言ってた件とも繋がるし、` : '';

  const replyPrefix = replyTarget && seed % 4 === 0 ? `@${replyTarget} の見解も一理あるけど、` : '';
  const replyToAuthor = replyPrefix ? replyTarget : undefined;

  // ==========================
  // A. 移籍市場終了 (window_closed)
  // ==========================
  if (ctx.scenario === 'window_closed') {
    const mapByArchetype: Record<FanArchetypeCategory, { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string }> = {
      enthusiastic: { text: seededPick([`移籍市場が閉幕！このスカッドで${signals.clubTarget}を掴み取るしかない。ここからはピッチ上の応援一本に集中しよう！`, `ウィンドウ終了！加入した選手も残った選手も全員で戦うぞ、${ctx.managerName}監督を信じて突き進め！`], seed), sentiment: 'positive', perspectiveLabel: '団結・前向き' },
      calm_analyst: { text: seededPick([`移籍市場クローズ。現在の${signals.leagueRankStr}という立ち位置を踏まえると、戦術の微調整と怪我人管理がここからの鍵になる。`, `デッドラインが終わって各クラブの最終戦力が確定。${signals.recentFormStr}をどう上向かせるか注目だ。`], seed), sentiment: 'neutral', perspectiveLabel: '市場総括分析' },
      harsh_critic: { text: seededPick([`これでウィンドウ閉幕か…。まだ薄さを感じるポジションが残っているのが正直気がかりだ。言い訳はできないぞ。`, `移籍期間の最後の詰めが甘かったように見える。ここから成績が落ちたらフロントへの批判は免れない。`], seed), sentiment: 'critical', perspectiveLabel: '編成への不満' },
      manager_defender: { text: seededPick([`市場が閉まった以上、あとは${ctx.managerName}監督の手腕に託すのみ！今いるメンバーでしっかり戦えるはずだ。`, `無理な駆け込み補強でバランスを崩さなかったのも監督の判断だろう。ここからの立て直しを信じたい。`], seed), sentiment: 'positive', perspectiveLabel: '監督支持・結束' },
      signing_hopeful: { text: seededPick([`正直あと1人獲れていれば…という思いもあるけど、次のウィンドウまでこのチームがどこまでやれるか楽しみにしたい！`, `狙っていたポジションへの補強は次に持ち越しかな。今の選手たちの爆発に期待するしかない。`], seed), sentiment: 'mixed', perspectiveLabel: '次市場への期待' },
      signing_skeptic: { text: seededPick([`無謀なパニックバイに走らずウィンドウを終えたのは正解。既存の連携がやっと落ち着いて腰を据えて戦える。`, `騒がしい移籍報道がようやく一段落。ここからは純粋にサッカーに集中できるのが嬉しい。`], seed), sentiment: 'positive', perspectiveLabel: 'パニックバイ回避評価' },
      tactical: { text: seededPick([`ウィンドウ閉鎖でメンバーが確定。${ctx.managerName}監督がこの人員でどうローテーションとシステムを使い分けるかが腕の見せ所。`, `選手の組み合わせが固まったことで、これからセットプレーやプレッシングの練度がどこまで上がるか注視したい。`], seed), sentiment: 'neutral', perspectiveLabel: '戦術運用展望' },
      financial: { text: seededPick([`残り予算${signals.budgetStr}と${signals.wageHeadroomStr}を保ったまま市場を閉じたのは財務戦略として堅実。次期ウィンドウへの余力も残った。`, `収支の規律を守り切った移籍期間。無駄な高年俸を抱え込まなかった点は経営面で高く評価できる。`], seed), sentiment: 'positive', perspectiveLabel: '財務規律評価' },
      youth_advocate: { text: seededPick([`市場が閉じたことで、${signals.topU21Name}らアカデミー組に出場チャンスが回ってくる可能性が高まった！育成のターンが来るぞ！`, `補強で枠が埋まらなかったぶん、生え抜きの若手が台頭してくれる絶好のシーズン後半戦になりそう。`], seed), sentiment: 'positive', perspectiveLabel: '若手台頭期待' },
      rival_fan: { text: seededPick([`お、${club}はこれでウィンドウ終了か。他クラブとしてはライバルの最終戦力が見えたので対策を立てやすくなったな。`, `どこも最後までバタバタしてたけど、ここから本当に地力があるチームだけが生き残るね。`], seed), sentiment: 'neutral', perspectiveLabel: '他クラブの反応' },
      neutral: { text: seededPick([`今期の移籍ウィンドウも無事クローズ。ここからは各クラブの現有戦力と監督のマネジメント力が純粋に問われるフェーズだ。`, `移籍市場が閉まって一区切り。${club}を含む上位・中位争いがさらに白熱していきそう。`], seed), sentiment: 'neutral', perspectiveLabel: '中立総括' },
      witty: { text: seededPick([`デッドラインデーのF5連打マラソン無事終了！！みんなの手首とサーバーに敬礼ｗｗ`, `あと半年は「◯◯が移籍合意間近！」の見出し見なくて済むと思うとちょっと寂しいまであるｗ`], seed), sentiment: 'mixed', perspectiveLabel: 'ジョーク・解放感' }
    };
    const chosen = mapByArchetype[persona.archetype];
    return { ...chosen, text: `${replyPrefix}${chosen.text}`, replyToAuthor };
  }

  // ==========================
  // B. 契約延長 / 契約満了 (contract_extended / contract_expired)
  // ==========================
  if (ctx.scenario === 'contract_extended') {
    const yearsDesc = contractText || '複数年契約';
    const mapByArchetype: Record<FanArchetypeCategory, { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string }> = {
      enthusiastic: { text: seededPick([`${pName}の${yearsDesc}での契約延長きたあああ！！このクラブへの忠誠心に感謝しかない！！`, `${pName}が残留を決断してくれたのは最高の新補強と同じ価値がある！まだまだ${club}で輝いてくれ！`], seed), sentiment: 'positive', perspectiveLabel: '残留歓喜' },
      calm_analyst: { text: seededPick([`${pName}（OVR ${pOvr}・${pAge}歳）との${yearsDesc}合意は戦力の継続性を保つ上で極めて合理的な一手。市場で代役を探すより確実だ。`, `${signals.lastMatchStr}の流れの中でも中心人物の契約更新を早めに済ませたフロントの仕事ぶりは安定している。`], seed), sentiment: 'positive', perspectiveLabel: '戦力継続評価' },
      harsh_critic: { text: seededPick([`延長自体は悪くないが、${pAge}歳での${yearsDesc}となると年俸と今後の稼働率が見合うのか厳しくチェックする必要がある。`, `契約を更新して安心するのではなく、ピッチ上で今まで以上のパフォーマンスを責任持って示してほしい。`], seed), sentiment: 'mixed', perspectiveLabel: '条件・活躍要求' },
      manager_defender: { text: seededPick([`${ctx.managerName}監督への信頼がなければ${pName}も${yearsDesc}にサインしなかったはず。ロッカーの結束の証だね。`, `監督のプロジェクトを選手が信じているのが伝わる良いニュース！これで雑音なく試合に集中できる。`], seed), sentiment: 'positive', perspectiveLabel: '監督信頼の証' },
      signing_hopeful: { text: seededPick([`既存の主軸である${pName}を${yearsDesc}で引き留められたから、あとは別の手薄なポジションの補強に予算を集中できるな！`, `核となる選手の更新が済むと、周りにどんな新戦力を組み合わせるか想像が膨らんでくる。`], seed), sentiment: 'positive', perspectiveLabel: '編成の前進' },
      signing_skeptic: { text: seededPick([`大金を払って外から誰かを連れてくるより、すでにチームを知っている${pName}の延長が何倍も賢明。こういう継続が一番大事。`, `市場の噂に踊らされず身内の評価をしっかり形にしたのは評価できる。`], seed), sentiment: 'positive', perspectiveLabel: '現有戦力重視' },
      tactical: { text: seededPick([`${pStyle}として機能している${pName}が${yearsDesc}残ることで、${ctx.managerName}監督のビルドアップと戦術の土台が長期で安定する。`, `${pPos}の序列と戦術的役割が明確に保たれる意味でも非常に重要な契約更新だ。`], seed), sentiment: 'positive', perspectiveLabel: '戦術基盤安定' },
      financial: { text: seededPick([`${pName}をタダで失うリスクを回避し、${yearsDesc}${wageText ? `（${wageText}水準）` : ''}で資産価値を守ったのは財務的にも大正解。`, `${signals.wageHeadroomStr}の中で契約年数を整理できたのは、将来の売却益や減価償却の面でもプラスに働く。`], seed), sentiment: 'positive', perspectiveLabel: '資産防衛・経営' },
      youth_advocate: { text: seededPick([`${pName}のような経験値ある存在が残ることで、${signals.topU21Name}ら若手が手本にしながら成長できる環境が続くのは大きい！`, `ベテラン・中堅の軸と若手の育成が両立する理想的なスカッド構成になりそう。`], seed), sentiment: 'positive', perspectiveLabel: '育成環境評価' },
      rival_fan: { text: seededPick([`他サポ目線だと${pName}フリー移籍で狙えるかもと思ってたから${yearsDesc}更新は普通に羨ましいわ…。`, `${club}が主力をきっちり引き留めるあたり、クラブとしての安定感があるなあ。`], seed), sentiment: 'neutral', perspectiveLabel: '他サポの本音' },
      neutral: { text: seededPick([`${club}にとって${pName}の契約延長は今オフ・今季屈指の良いニュース。他クラブの引き抜きを完全にシャットアウトした形だ。`, `中堅〜主軸クラスの長期確保はリーグ順位争いの安定に直結するね。`], seed), sentiment: 'positive', perspectiveLabel: '中立的評価' },
      witty: { text: seededPick([`他クラブの「フリーで獲れるかもｗ」勢が一瞬で解散してて草。${pName}ありがとう！`, `契約延長発表のユニフォーム持ち写真、毎回なぜか新加入並みに安心感あるの好きｗ`], seed), sentiment: 'positive', perspectiveLabel: 'ユーモア・安心' }
    };
    const chosen = mapByArchetype[persona.archetype];
    return { ...chosen, text: `${replyPrefix}${chosen.text}`, replyToAuthor };
  }

  if (ctx.scenario === 'contract_expired') {
    const mapByArchetype: Record<FanArchetypeCategory, { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string }> = {
      enthusiastic: { text: seededPick([`${pName}、今まで${club}のために全力で戦ってくれて本当にありがとう！新天地での活躍を心から応援してる！`, `契約満了でのお別れは寂しいけれど、これまでの貢献と記憶は絶対に忘れない。お疲れさま！`], seed), sentiment: 'mixed', perspectiveLabel: '感謝と別れ' },
      calm_analyst: { text: seededPick([`${pName}（${pAge}歳 / OVR ${pOvr}）の契約満了退団。出場時間や役割の変化を踏まえると双方にとって自然な区切りだったと言える。`, `${pPos}の枠が1つ空いたことで、このオフの人員配置をどう再編するか注目が集まる。`], seed), sentiment: 'neutral', perspectiveLabel: '客観的整理' },
      harsh_critic: { text: seededPick([`フリートランスファーでタダで出ていく形になる前に、売り時や延長判断をもっと早く下せなかったのかフロントに疑問が残る。`, `退団するならするで、${pPos}の穴をどう埋めるのか具体的なプランをすぐに見せてほしい。`], seed), sentiment: 'critical', perspectiveLabel: '資産流出批判' },
      manager_defender: { text: seededPick([`${ctx.managerName}監督が若返りや戦術刷新を進める過程では避けられない別れもある。これまでの功績に敬意を表したい。`, `ロッカールームの新陳代謝として監督と強化部が合意の上で決めたサイクルだろう。前を向こう。`], seed), sentiment: 'neutral', perspectiveLabel: '新陳代謝支持' },
      signing_hopeful: { text: seededPick([`${pName}の退団で浮いた枠と給与を使って、より${ctx.managerName}監督のスタイルに合う${pPos}の新戦力を獲ってきてほしい！`, `世代交代のタイミングでもあるし、この空いたポジションに誰が来るのかワクワク半分寂しさ半分だ。`], seed), sentiment: 'mixed', perspectiveLabel: '代役補強期待' },
      signing_skeptic: { text: seededPick([`功労者が去った穴を安易な高額補強で埋めるのではなく、まずは既存の控え組や若手でどこまでカバーできるか試してほしい。`, `長くクラブにいた選手の穴は数値以上に大きい。後任選びは慎重以上に慎重であるべき。`], seed), sentiment: 'neutral', perspectiveLabel: '後任への慎重論' },
      tactical: { text: seededPick([`${pStyle}タイプだった${pName}が抜けることで、${pPos}に求められるタスクやベンチのゲームチェンジャー構成が変わりそう。`, `昨季までの戦術的オプションが1つ減る形になるため、新戦力またはコンバートでの補完が不可欠。`], seed), sentiment: 'neutral', perspectiveLabel: '戦術への影響' },
      financial: { text: seededPick([`${wageText ? `${wageText}の` : ''}人件費が圧縮されたことで、FFPや来季の給与枠（${signals.wageHeadroomStr}）にはプラスの余白が生まれた。`, `フリー退団とはいえ、契約更新による高コスト維持を避けた経営判断としては理解できる。`], seed), sentiment: 'neutral', perspectiveLabel: '給与枠整理評価' },
      youth_advocate: { text: seededPick([`寂しさはあるけど、${pName}の退団によって${signals.topU21Name}ら下部組織の若手がトップチームに定着する道が開けるはず！`, `ベテランの契約満了は若手育成へシフトする明確なチャンスでもある。`], seed), sentiment: 'mixed', perspectiveLabel: '世代交代期待' },
      rival_fan: { text: seededPick([`えっ${pName}がフリーになるのか！うちのクラブも経験値ある${pPos}として獲得検討してみてほしくなるな。`, `契約満了で自由移籍ならどのクラブも手を挙げやすいし、次の移籍先がどこになるか気になる。`], seed), sentiment: 'neutral', perspectiveLabel: '他クラブの関心' },
      neutral: { text: seededPick([`一時代を支えた選手との契約満了での別れはサッカー界の宿命だが、ファンにとってはやはり感慨深いニュースだね。`, `フリーエージェントとなった${pName}が次のステップでどんなクラブを選ぶかも注目される。`], seed), sentiment: 'neutral', perspectiveLabel: '中立的感想' },
      witty: { text: seededPick([`フリーになった瞬間から各国の中位〜下位クラブのスカウトが一斉に連絡先探してそうｗ どこ行っても応援するぞ！`, `功労者の退団コメント読むと毎回涙腺ゆるむからオフシーズンは情緒が忙しい…。`], seed), sentiment: 'mixed', perspectiveLabel: '別れとユーモア' }
    };
    const chosen = mapByArchetype[persona.archetype];
    return { ...chosen, text: `${replyPrefix}${chosen.text}`, replyToAuthor };
  }

  // ==========================
  // C. 正式加入・ローン加入決定 (official_signing / loan_signing)
  // ==========================
  if (ctx.scenario === 'official_signing' || ctx.scenario === 'loan_signing') {
    const isLoan = ctx.scenario === 'loan_signing';
    const dealDesc = isLoan ? (ctx.transferTypeLabel || 'レンタル移籍') : (ctx.transferTypeLabel || '完全移籍');
    const feeSegment = feeKnown ? (feeVal === 0 ? '移籍金ゼロで' : `${feeLabel}で`) : '';
    const mapByArchetype: Record<FanArchetypeCategory, { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string }> = {
      enthusiastic: { text: seededPick([`ようこそ${club}へ、${pName}！！${dealDesc}の公式発表に鳥肌が立った！開幕から暴れまくってくれ！！`, `${pName}（OVR ${pOvr}）がついにうちのユニフォームを着るのか…！${ctx.managerName}監督と強化部に最大級の感謝を！`], seed), sentiment: 'positive', perspectiveLabel: '加入歓喜' },
      calm_analyst: { text: seededPick([`${otherClubName}から${pName}を${dealDesc}${contractText ? `（${contractText}）` : ''}で確保。現在の${signals.leagueRankStr}を踏まえても理にかなった補強だ。`, `${pPos}の選手層と${pAge}歳という年齢バランスを見れば、直近の課題に直結する着実な強化になったね。`], seed), sentiment: 'positive', perspectiveLabel: '客観・編成評価' },
      harsh_critic: { text: seededPick([isExpensive ? `${feeLabel}も積んだ以上は即結果を出してもらわないと困る。適応期間なんて言い訳が通じる金額ではないぞ。` : `獲得自体はいいが、本当にチームの弱点全てがこれで埋まるのか？開幕後のピッチでの証明を厳しく見るぞ。`, `期待値が高いぶんプレッシャーも大きい。名前や過去の実績ではなく、${club}で何点・何勝に貢献するかが全てだ。`], seed), sentiment: 'mixed', perspectiveLabel: '結果への厳しい目' },
      manager_defender: { text: seededPick([`${quoteMention}${ctx.managerName}監督が望んだ${pStyle}タイプをきっちり用意してくれたフロントに拍手！ここから監督の真価が見られる。`, `監督のやりたいフットボールを体現できるピースが揃ってきた。焦らずチームへ馴染ませるマネジメントを応援したい。`], seed), sentiment: 'positive', perspectiveLabel: '監督・方針支持' },
      signing_hopeful: { text: seededPick([`ずっと欲しかった${pPos}に${pName}が来たああ！あと1ポジションだけ詰めてくれればもう文句なしの完璧ウィンドウ！`, `${isLoan ? 'リスクを抑えたローン加入でも質は間違いなし！' : '待望のビッグディール成立！'}次の試合からメンバー入りが楽しみすぎる！`], seed), sentiment: 'positive', perspectiveLabel: '補強実現の熱狂' },
      signing_skeptic: { text: seededPick([`歓迎はするけれど、既存の${pPos}の選手と出場機会や役割が被ってチーム内バランスが崩れないかだけは冷静に見ておきたい。`, `${isExpensive ? `${feeLabel}は少し高値掴みに見えるし、` : ''}過度な期待でプレッシャーをかけすぎるのは禁物だと思う。`], seed), sentiment: 'mixed', perspectiveLabel: '慎重・適正警戒' },
      tactical: { text: seededPick([`${pName}の特性（${pStyle} / OVR ${pOvr}）は${ctx.managerName}監督の攻撃の形にフィットするはず。特にファイナルサードの質が一段階上がる。`, `守備への切り替えとライン間の受け方ができる${pPos}として、${otherClubName}時代とは違う新しい役割で化ける可能性があるね。`], seed), sentiment: 'positive', perspectiveLabel: '戦術適性評価' },
      financial: { text: seededPick([isLoan ? `まずは${dealDesc}で様子を見られるのは財務リスク管理として非常に優秀（${signals.wageHeadroomStr}）。` : `${feeSegment}${pName}を確保。${isBargain ? '相場よりかなりお得なバーゲン価格でROI抜群！' : isExpensive ? '高額投資だけに今後の資産価値とCL・賞金収入での回収がカギになる。' : '予算内で適正価格に収めた見事なディール。'}`], seed), sentiment: isExpensive ? 'mixed' : 'positive', perspectiveLabel: '移籍金・財務評価' },
      youth_advocate: { text: seededPick([pAge <= 23 ? `${pAge}歳でPOT ${pPot}の${pName}加入は育成面でも最高！！${signals.topU21Name}と一緒に黄金世代を作ってくれ！` : `${pName}（${pAge}歳）の実力は認めるけど、同じ${pPos}の${signals.topU21Name}ら若手の成長枠を潰さない併用を監督に期待したい。`], seed), sentiment: pAge <= 23 ? 'positive' : 'mixed', perspectiveLabel: '若手起用視点' },
      rival_fan: { text: seededPick([`${club}が${otherClubName}から${pName}を本当に獲りきったのかよ…これは同リーグのライバルとして正直めちゃくちゃ厄介。`, `羨ましい補強だなあ。${pName}を相手に守備しなきゃいけない次の直接対決が今から憂鬱だわ…。`], seed), sentiment: 'neutral', perspectiveLabel: 'ライバルの警戒' },
      neutral: { text: seededPick([`${pName}の${club}${dealDesc}は今市場でも注目度の高い動き。新環境でOVR ${pOvr}以上の輝きを見せられるか注目。`, `前所属${otherClubName}での経験も豊富だし、リーグ全体のレベルを引き上げる面白い移籍になったね。`], seed), sentiment: 'positive', perspectiveLabel: '中立的注目' },
      witty: { text: seededPick([`さっきまで「ソース信憑性ゼロｗ」って言ってたアカウントがもう${pName}の背番号とチャント考え始めてて好きｗ`, `${isLoan ? 'レンタル期間中にすっかり愛着湧いてシーズン末に買い取り請願署名始める未来が見えるｗｗ' : '正式発表までF5連打しすぎてキーボードのF5だけ印字消えたけど全部報われたわ！！'}`], seed), sentiment: 'positive', perspectiveLabel: 'ジョーク・祝祭感' }
    };
    const chosen = mapByArchetype[persona.archetype];
    return { ...chosen, text: `${replyPrefix}${chosen.text}`, replyToAuthor };
  }

  // ==========================
  // D. 正式退団・ローン退団決定 (official_departure / loan_departure)
  // ==========================
  if (ctx.scenario === 'official_departure' || ctx.scenario === 'loan_departure') {
    const isLoanOut = ctx.scenario === 'loan_departure';
    const feeSegment = feeKnown ? (feeVal === 0 ? '移籍金ゼロで' : `${feeLabel}で`) : '';
    const mapByArchetype: Record<FanArchetypeCategory, { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string }> = {
      enthusiastic: { text: seededPick([isLoanOut ? `${pName}、${otherClubName}への武者修行頑張ってこい！一回り大きくなって帰ってくるのを待ってるぞ！` : `${pName}、${otherClubName}へ行ってもずっと応援してる！${club}で見せてくれたプレーの数々を忘れない！`], seed), sentiment: 'mixed', perspectiveLabel: '別れとエール' },
      calm_analyst: { text: seededPick([isLoanOut ? `${pName}（${pAge}歳）を${otherClubName}へローン移籍。ベンチで燻らせるより90分出場を積ませる方が合理的だ。` : `${otherClubName}への${feeSegment}完全移籍が決定。出場序列や選手本人のキャリア希望を踏まえれば双方納得の決断だろう。`], seed), sentiment: 'neutral', perspectiveLabel: '客観的分析' },
      harsh_critic: { text: seededPick([isLoanOut ? `レンタルに出した後に${pPos}の控えが足りなくなったらどう責任取るんだ？怪我人が出た時の想定はできてるのか？` : `いくら${feeSegment}とはいえ${pName}を出して大丈夫なのか？代役をちゃんと確保してないとただの戦力ダウンだぞ。`], seed), sentiment: 'critical', perspectiveLabel: '戦力低下懸念' },
      manager_defender: { text: seededPick([`${ctx.managerName}監督の戦術構想と選手本人の出場機会への希望を両立させた結果だろう。後任や既存組の奮起に期待したい。`, `ロッカーのモチベーションや序列を健全に保つためにも、出番が限られる選手に新しい道を用意するのは良いマネジメント。`], seed), sentiment: 'neutral', perspectiveLabel: '監督判断支持' },
      signing_hopeful: { text: seededPick([`${pName}を出した${feeSegment ? `この${feeLabel}と枠` : '空き枠'}を使って、すぐさまピンポイントで新戦力を獲りにいく動きに期待したい！`, `別れは寂しいけど、これが大型補強への資金作り・布石になるならワクワクする展開！`], seed), sentiment: 'mixed', perspectiveLabel: '再投資への期待' },
      signing_skeptic: { text: seededPick([`主力〜準主力クラスを送り出しておいて「またすぐ別の誰かを買えばいい」は甘すぎる。出ていった穴は簡単には埋まらない。`, `せっかく連携が育っていたメンバーを手放すリスクを軽く見てほしくないね。`], seed), sentiment: 'critical', perspectiveLabel: '流出警戒' },
      tactical: { text: seededPick([`${pStyle}のオプションだった${pName}が抜けることで、${pPos}の戦術バリエーションと途中投入のカードをどう組み直すかが課題になる。`, isLoanOut ? `${otherClubName}のスタイルで実戦を積めば、弱点だった判断スピードが磨かれて戦術的価値が上がるはず。` : `プレッシングやビルドアップの歯車が変わるので、次の数試合で代役の適性を見極めたい。`], seed), sentiment: 'neutral', perspectiveLabel: '戦術・編成影響' },
      financial: { text: seededPick([isLoanOut ? `期限付き移籍で給与負担（${wageText || '年俸'}）を抑えつつ市場価値を維持できるのは財務上スマート。` : `${feeSegment ? `${feeLabel}という売却額` : '今回の移籍条件'}と給与枠削減を合算すれば、クラブの収支とFFP的にはかなり大きなプラスになる。`], seed), sentiment: 'positive', perspectiveLabel: '売却益・財務評価' },
      youth_advocate: { text: seededPick([`${pName}が抜けた枠に、ぜひ${signals.topU21Name}をはじめとする若手を登録・起用してほしい！一番のチャンスだぞ！`, isLoanOut ? `若い${pName}が外で試合に出られるのは育成クラブとして正しいループ。応援してる！` : `先輩が移籍した背中を見て、アカデミーの後輩たちが「次は俺だ」と燃えてくれたら最高。`], seed), sentiment: 'positive', perspectiveLabel: '若手チャンス視点' },
      rival_fan: { text: seededPick([`${otherClubName}のファン歓喜してるだろこれ！${club}から${pName}を獲得できるとはなかなか良いディールじゃないか。`, `ライバル目線だと${club}の戦力が少しでも削られるならありがたいけど、代わりにもっと凄いのが来たら嫌だな…。`], seed), sentiment: 'neutral', perspectiveLabel: '相手・他サポ反応' },
      neutral: { text: seededPick([`${pName}の${otherClubName}移籍（${isLoanOut ? 'レンタル' : '完全移籍'}）。新天地でどれくらい主力として定着できるかリーグファンとして楽しみだ。`, `売り手・買い手・選手本人の三者にとってタイミングが噛み合った綺麗な移籍に見えるね。`], seed), sentiment: 'neutral', perspectiveLabel: '中立的見解' },
      witty: { text: seededPick([`ユニフォーム買ったばっかりのファンの気持ち考えたことある！？（新天地でも活躍してくれよな…！）`, `来シーズン古巣対決で${pName}に恩返しゴール決められて頭抱える展開まで見えた気がするｗｗ`], seed), sentiment: 'mixed', perspectiveLabel: 'ユーモア・惜別' }
    };
    const chosen = mapByArchetype[persona.archetype];
    return { ...chosen, text: `${replyPrefix}${chosen.text}`, replyToAuthor };
  }

  // ==========================
  // E. 破談 / 不成立 (failed_transfer)
  // ==========================
  if (ctx.scenario === 'failed_transfer') {
    const mapByArchetype: Record<FanArchetypeCategory, { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string }> = {
      enthusiastic: { text: seededPick([`${pName}獲得が破談は悔しすぎる…！でも下を向いてる暇はない、次のターゲットへ気持ちを切り替えて応援しよう！`, `決まると思ってただけにショックは大きいけど、${club}を強くしてくれる選手は他にもいるはずだ！`], seed), sentiment: 'mixed', perspectiveLabel: '悔しさと切り替え' },
      calm_analyst: { text: seededPick([`${pName}との交渉決裂。要求額や${competingText !== '他クラブ' ? `${competingText}との条件競争` : '個人条件'}が許容ラインを超えたなら撤退も一つの合理的選択。`, `1人に固執してウィンドウ終盤に詰むよりは、早い段階で次の候補リストへ移行できた方がダメージは少ない。`], seed), sentiment: 'neutral', perspectiveLabel: '冷静な撤退評価' },
      harsh_critic: { text: seededPick([`${pName}を逃したのはフロントの大失態だろ！${competingText !== '他クラブ' ? `${competingText}に出し抜かれて` : '交渉をダラダラ長引かせて'}どうするんだよ！`, `「狙ってました」「惜しかったです」じゃ勝ち点は1も増えない。即戦力${pPos}が獲れないなら責任問題だ。`], seed), sentiment: 'critical', perspectiveLabel: 'フロント交渉批判' },
      manager_defender: { text: seededPick([`${ctx.managerName}監督も欲しかったはずだけど、無理な額を飲めない事情があったんだろう。既存メンバーの奮起とプランBを信じたい。`, `監督はあくまで現場でベストを尽くすだけ。破談の責任を全部指揮官に押し付けるのはお門違いだ。`], seed), sentiment: 'neutral', perspectiveLabel: '監督擁護・プランB' },
      signing_hopeful: { text: seededPick([`${pName}がダメだったならすぐ第2候補・第3候補に切り替えよう！市場が閉じる前になんとか${pPos}を強化してくれ！`, `むしろ浮いた${feeLabel}の予算で別の意外なビッグネームに動いてくれる展開に期待してる！`], seed), sentiment: 'mixed', perspectiveLabel: '代案補強待望' },
      signing_skeptic: { text: seededPick([`法外な金額や過剰な要求に屈しなかったのは大正解。割高なディールを強行して後悔するクラブを何度も見てきたからな。`, `縁がなかった選手に固執しない勇気は必要。今いるメンバーを信じて戦う方がよっぽど健全だよ。`], seed), sentiment: 'positive', perspectiveLabel: '無理押し回避評価' },
      tactical: { text: seededPick([`${pStyle}タイプの${pName}を獲り損ねた以上、${pPos}で同じ役割を担える別候補を探すか、システム自体の微調整が迫られる。`, `スカッドの穴が明確に残る形なので、ここからの数日でどんなタイプの代役をリストから上げるか注目。`], seed), sentiment: 'neutral', perspectiveLabel: '戦術上の代案' },
      financial: { text: seededPick([`${feeLabel}規模の交渉から手を引いたことで予算${signals.budgetStr}を守れたのは大きい。財政規律を壊さなかった判断を支持する。`, `競り合いで相場以上に吊り上げられそうな案件から冷静に降りたのは、経営面ではむしろプラス査定。`], seed), sentiment: 'positive', perspectiveLabel: '財務規律の勝利' },
      youth_advocate: { text: seededPick([`外からの大型補強が流れた今こそ、${signals.topU21Name}にチャンスを回す時じゃない？高いお金払うより生え抜きを育てよう！`, `破談を嘆くより、アカデミーの有望株に「お前の出番だ」と背中を押す方向に切り替えてほしい。`], seed), sentiment: 'positive', perspectiveLabel: '若手登用推し' },
      rival_fan: { text: seededPick([`${club}が${pName}獲得失敗とか他サポとしては正直ほっと一息ついたわｗ プランBでも手強いのはやめてね？`, `${competingText}に持っていかれた流れはリーグのパワーバランス的にも大きなトピックだね。`], seed), sentiment: 'neutral', perspectiveLabel: 'ライバルの本音' },
      neutral: { text: seededPick([`合意間近とまで騒がれた移籍が土壇場でひっくり返るのは欧州メルカートあるある。次のクラブの動きに注目が集まる。`, `${pName}側もシビアな条件比較をした結果だろうし、お互いに切り替えが早い方が良い。`], seed), sentiment: 'neutral', perspectiveLabel: '中立の反応' },
      witty: { text: seededPick([`YouTubeで${pName}のスーパープレー集3時間見まくって脳内スタメン組んでた俺の時間返してｗｗ`, `「関心→合意目前→破談」の伝統芸能、今年もしっかりフルコース堪能させてもらいました（）`], seed), sentiment: 'mixed', perspectiveLabel: '皮肉・ジョーク' }
    };
    const chosen = mapByArchetype[persona.archetype];
    return { ...chosen, text: `${replyPrefix}${chosen.text}`, replyToAuthor };
  }

  // ==========================
  // F. 退団噂・オファー受理 (player_departure)
  // ==========================
  if (ctx.scenario === 'player_departure') {
    const mapByArchetype: Record<FanArchetypeCategory, { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string }> = {
      enthusiastic: { text: seededPick([`${pName}を売るなんて冗談じゃない！${club}にとって欠かせない存在だ、何が何でも残留してくれ！！`, `他クラブが欲しがるのは活躍してる証拠だけど、うちの太陽を手放したら立ち直れないぞ…。`], seed), sentiment: 'critical', perspectiveLabel: '絶対慰留希望' },
      calm_analyst: { text: seededPick([ctx.hasFormalOffer ? `${otherClubName}から${feeLabel}のオファーが届いたのは事実。選手の契約年数や序列を踏まえ冷静に条件を見極める局面。` : `現時点では${otherClubName}からの関心・リストアップ噂に留まる。すぐ放出と決めつけず続報を待ちたい。`], seed), sentiment: 'neutral', perspectiveLabel: '去就の冷静分析' },
      harsh_critic: { text: seededPick([`ここで${pName}を安売りするようなフロントならクラブの野心なんて口だけだ！足元見られた条件なら即座に突っぱねろ！`, `主力を引き抜かれてばかりではいつまで経っても${signals.clubTarget}なんて夢のまた夢だぞ。`], seed), sentiment: 'critical', perspectiveLabel: '安売り・流出反対' },
      manager_defender: { text: seededPick([`${ctx.managerName}監督が「戦力として必要」と言うなら残るはずだし、戦術構想外なら売却益を活かすのも監督の権限。判断を信じよう。`, `噂が出てもロッカールームが乱れないようにコントロールできているのが監督のマネジメント力。`], seed), sentiment: 'mixed', perspectiveLabel: '監督判断に委ねる' },
      signing_hopeful: { text: seededPick([`もし${feeLabel}以上で売却して、その資金をすぐ別ポジションの大型補強に回せるなら逆にチームが化ける可能性もあるのでは？`, `絶対放出反対だけど、仮に動くなら即座に同格以上の後任をセットで連れてきてほしい！`], seed), sentiment: 'mixed', perspectiveLabel: '売却益再投資案' },
      signing_skeptic: { text: seededPick([`「売ったお金で誰か獲ればいい」って言う人多いけど、実際に同等クラスの選手をすぐ獲れる保証なんてどこにもないぞ。`, `移籍市場に振り回されず、まず今の主力を守ることこそ最大の補強だとフロントは自覚してほしい。`], seed), sentiment: 'critical', perspectiveLabel: '補強代案への懐疑' },
      tactical: { text: seededPick([`${pName}の${pStyle}という強みは今のシステムに直結している。抜けた場合に誰がビルドアップやプレス強度を代替できるか非常に難しい。`, `${pPos}のローテーション枚数を考えても、代役なしでの放出は戦術的にリスクが高すぎる。`], seed), sentiment: 'critical', perspectiveLabel: '戦術代替困難' },
      financial: { text: seededPick([`市場価値€${marketM.toFixed(1)}Mに対して${feeLabel}なら売却益は魅力的。${signals.wageHeadroomStr}を改善する経営オプションとしては無視できない金額。`, `残り契約年数次第では今が一番高値で売れるタイミングというシビアな財務計算もフロントはしているはず。`], seed), sentiment: 'neutral', perspectiveLabel: '財務・売り時計算' },
      youth_advocate: { text: seededPick([`${pName}には残ってほしいのが本音だけど、仮に移籍となったら${signals.topU21Name}に一気にスタメンを任せる覚悟も見たい。`, `ベテランの指導も大事だからもう少し${club}で若手の道標になってほしいんだよなあ。`], seed), sentiment: 'mixed', perspectiveLabel: '育成と継承' },
      rival_fan: { text: seededPick([`${otherClubName}ファンがもう獲得前提で語り始めてるの面白いｗ ${club}本当に手放す気あるのか？`, `他サポだけど${pName}ほどの選手が抜けたら${club}の順位予想だいぶ変わってくるぞこれ。`], seed), sentiment: 'neutral', perspectiveLabel: '他クラブの反応' },
      neutral: { text: seededPick([`${otherClubName}の本気度と、${pName}自身がステップアップや移籍を望んでいるかどうかが全ての分岐点になりそう。`, `オファー額とクラブの評価額がどこまで近づくか、交渉の駆け引きが見ものだね。`], seed), sentiment: 'neutral', perspectiveLabel: '中立的注目' },
      witty: { text: seededPick([`他サポが「ようこそ！」とかリプ欄に湧き始めるの見るたびに毎回ちょっとイラッとするサポ心わかってｗｗ`, `放出噂が出るたびに契約解除金1000億に設定したくなってくるの俺だけじゃないはずｗ`], seed), sentiment: 'mixed', perspectiveLabel: 'ジョーク・抵抗感' }
    };
    const chosen = mapByArchetype[persona.archetype];
    return { ...chosen, text: `${replyPrefix}${chosen.text}`, replyToAuthor };
  }

  // ==========================
  // G. 交渉中・クラブ間合意・契約合意・関心・リスト噂
  // ==========================
  const stageWord =
    ctx.scenario === 'terms_agreed'
      ? '選手とも条件合意済み、あとは最終手続き'
      : ctx.scenario === 'club_agreed'
        ? 'クラブ間合意済みで個人交渉へ突入'
        : ctx.scenario === 'negotiation_started' || ctx.hasFormalOffer
          ? '正式オファーを提出してクラブ間交渉中'
          : 'まだ正式オファー前・調査や関心の段階';

  const mapByArchetype: Record<FanArchetypeCategory, { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string }> = {
    enthusiastic: {
      text: seededPick([
        `${pName}が${club}に来る流れ！？${ctx.scenario === 'club_agreed' || ctx.scenario === 'terms_agreed' ? 'ここまで来たら必ず決めてくれ！！' : '実現したらスタジアムが揺れるぞ、頼むぞフロント！'}`,
        `${pPos}に${pName}（OVR ${pOvr}）が入ったら一気に景色が変わる！${signals.leagueRankStr}から上を目指す最高の起爆剤になる！`
      ], seed),
      sentiment: 'positive',
      perspectiveLabel: '熱狂・獲得熱望'
    },
    calm_analyst: {
      text: seededPick([
        `状況整理すると今は「${stageWord}」。${ctx.mediaSource}の信頼度（${ctx.credibility}）を踏まえつつ、${otherClubName}がどこで首を縦に振るか見極めたい。`,
        `${signals.lastMatchStr}の課題だった層を補えるピースとして${pName}が挙がるのは納得感がある。あとは条件面の着地点次第だね。`
      ], seed),
      sentiment: 'neutral',
      perspectiveLabel: '状況整理・分析'
    },
    harsh_critic: {
      text: seededPick([
        isExpensive
          ? `${pName}に${feeLabel}もかける余裕があるなら、他ポジションの穴も同時にどうにかしろよ！バランス感覚を疑う。`
          : `どうせ${ctx.scenario === 'club_agreed' ? 'ここから個人条件で揉めて取り逃がすんじゃないだろうな？' : '調査だけで終わって競合にさらわれるパターンだろ？'}結果で黙らせてくれ。`,
        `今一番必要なのは${pName}なのか？${signals.recentFormStr}の原因をもっと直視した補強を頼む。`
      ], seed),
      sentiment: 'critical',
      perspectiveLabel: '批判・疑問視'
    },
    manager_defender: {
      text: seededPick([
        `${quoteMention}${ctx.managerName}監督が戦術にフィットするターゲットとして選んだのなら全面的に支持する！結果で応えてくれるはず。`,
        `無謀なスター選手集めではなく、今のチームに本当に必要なピースを監督と強化部が話し合って動いているのが伝わる。`
      ], seed),
      sentiment: 'positive',
      perspectiveLabel: '監督方針支持'
    },
    signing_hopeful: {
      text: seededPick([
        `${pName}クラスの獲得に動いてくれてるだけでテンション上がる！${ctx.scenario === 'terms_agreed' ? 'ここまで来たら背番号何番になるか考えちゃうわ！' : 'このまま交渉まとまってくれ！！'}`,
        `${otherClubName}から${pName}を抜けるなら今市場の大勝利間違いなし！続報待機！`
      ], seed),
      sentiment: 'positive',
      perspectiveLabel: '補強期待'
    },
    signing_skeptic: {
      text: seededPick([
        isLowCred
          ? `${ctx.mediaSource}の噂だけで盛り上がりすぎでは？正式オファーすら確認されてない段階だし、単なる代理人の釣り記事じゃないの。`
          : `本当に${pName}（${pAge}歳）が必要？同じ${pPos}には既存メンバーもいるし、高額年俸を抱えるリスクの方が大きく見える。`,
        `移籍金${feeLabel}に見合うだけの決定的な違いを${club}のサッカーで作れるのか、かなり懐疑的。`
      ], seed),
      sentiment: 'mixed',
      perspectiveLabel: '補強反対・懐疑'
    },
    tactical: {
      text: seededPick([
        `${pName}の特性（${pStyle} / OVR ${pOvr}）を見ると、${ctx.managerName}監督が求める攻撃のスイッチ役や守備の強度にピンズドでハマりそう。`,
        `データ的にも今の${club}は${pPos}からの推進力が物足りなかった。${pName}が入ればビルドアップの出口が一つ増える。`
      ], seed),
      sentiment: 'positive',
      perspectiveLabel: '戦術面分析'
    },
    financial: {
      text: seededPick([
        feeKnown
          ? `${feeLabel}という金額${isExpensive ? `は予算${signals.budgetStr}に対してかなり思い切った勝負額。${contractText ? `${contractText}の償却と` : ''}ROIが問われる。` : `なら市場価値€${marketM.toFixed(1)}M対比でも妥当。${signals.wageHeadroomStr}の範囲内に収まるなら良案件。`}`
          : `まだ金額条件の提示前だから断定できないが、予算${signals.budgetStr}と${signals.wageHeadroomStr}を踏まえると無理なマネーゲームは避けたい。`,
        `${pAge}歳で今後リセールバリューも見込めるか、あるいは即戦力として使い切るか、経営目線では契約年数設計（${contractText || '3〜5年'}）が焦点。`
      ], seed),
      sentiment: isExpensive ? 'mixed' : 'neutral',
      perspectiveLabel: '経営・財務視点'
    },
    youth_advocate: {
      text: seededPick([
        pAge <= 23
          ? `${pAge}歳でPOT ${pPot}の${pName}なら文句なしの大賛成！！${signals.topU21Name}たちと同世代で10年戦える主力になる！`
          : `${pName}（${pAge}歳）に枠を割くなら、${signals.topU21Name}をカップ戦や途中出場で育てるプランも同時に確保してほしいな。`,
        `外から連れてくる選手とアカデミー育ちが健全な競争をできるならチームとして一番理想的な形。`
      ], seed),
      sentiment: pAge <= 23 ? 'positive' : 'mixed',
      perspectiveLabel: '若手起用論'
    },
    rival_fan: {
      text: seededPick([
        ctx.competingClubNames && ctx.competingClubNames.length > 0
          ? `${competingText}と${club}の直接バトルになってるの熱いなｗ お互いに値段吊り上げ合って消耗してほしいわ（笑）。`
          : `${club}がマジで${pName}獲れたら普通に羨ましいんだが…。${otherClubName}が簡単に手放すとは思えないけどどうなるやら。`,
        `他サポ目線だと「頼むから交渉破談してくれ」って祈りながら続報眺めてるｗ`
      ], seed),
      sentiment: 'neutral',
      perspectiveLabel: 'ライバル反応'
    },
    neutral: {
      text: seededPick([
        `${club}と${otherClubName}、そして${pName}を取り巻く動きはかなり理にかなった市場トレンド。今ウィンドウ注目の1件になりそう。`,
        `現段階は「${stageWord}」。ここからの数日で競合が出てくるかどうかが最大の分水嶺だね。`
      ], seed),
      sentiment: 'neutral',
      perspectiveLabel: '中立的見解'
    },
    witty: {
      text: seededPick([
        `まだ噂が出ただけなのに${pName}のプレー集20本見終わっちゃった、もし来なかったらどう責任取ってくれんのｗ`,
        `昨日まで名前すら詳しく知らなかったくせに記事出た瞬間に「昔から推してた！絶対獲れ！」って言い出すTL愛おしいｗｗ`
      ], seed),
      sentiment: 'mixed',
      perspectiveLabel: '皮肉・ジョーク'
    }
  };

  const chosen = mapByArchetype[persona.archetype];
  return { ...chosen, text: `${replyPrefix}${chosen.text}`, replyToAuthor };
}

/**
 * Generates 12–28+ rich, varied, non-repetitive SNS comments for any match, club, or transfer topic.
 * Never appends clone suffixes; verifies uniqueness across the thread and recent news posts,
 * and mixes dynamic intra-thread @author replies.
 */
export function generateDiverseSnsComments(
  ctx: SnsTopicContext,
  seedId: string,
  targetCount?: number
): SmartphoneNewsComment[] {
  let count = targetCount;
  if (!count) {
    if (ctx.kind === 'match') {
      const diff = Math.abs((ctx.fixture.homeScore ?? 0) - (ctx.fixture.awayScore ?? 0));
      const isCupOrEuro = ['ucl', 'uel', 'uecl', 'fa-cup', 'copa-del-rey', 'dfb-pokal'].includes(ctx.fixture.competition);
      count = diff >= 3 || isCupOrEuro ? 22 : 16;
    } else if (ctx.kind === 'transfer_rumor') {
      const majorScenarios: TransferRumorScenario[] = [
        'official_signing',
        'official_departure',
        'loan_signing',
        'loan_departure',
        'contract_extended',
        'contract_expired',
        'high_transfer_fee',
        'competing_clubs',
        'terms_agreed',
        'window_closed'
      ];
      count = ctx.isMajorStory || majorScenarios.includes(ctx.scenario) ? 24 : 15;
    } else {
      count = 14;
    }
  }
  count = Math.max(10, Math.min(30, count));

  const stateRef = ctx.state;
  const signals = extractClubContextSignals(
    stateRef,
    ctx.userClub,
    ctx.kind === 'match' ? ctx.players : stateRef?.players
  );
  const recentTexts = collectRecentUsedCommentTexts(stateRef);
  const usedAuthors = new Set<string>();
  const personas = pickPersonas(`${seedId}_${ctx.kind}`, count, usedAuthors);
  const usedInThread = new Set<string>();
  const generatedAuthors: string[] = [];

  return personas.map((persona, idx) => {
    let bestText = '';
    let bestBuilt: { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string; replyToAuthor?: string } | null = null;

    // Pick optional intra-thread reply target once we have >= 4 prior commenters
    const replyCandidate = idx >= 4 ? generatedAuthors[(idx + hashString(seedId)) % Math.min(4, generatedAuthors.length)] : undefined;

    for (let variant = 0; variant < 14; variant++) {
      const seed = hashString(`${seedId}_${persona.id}_${idx}_v${variant}`);
      const rTarget = variant === 0 ? replyCandidate : undefined;
      let candidate: { text: string; sentiment: 'positive' | 'neutral' | 'critical' | 'mixed'; perspectiveLabel: string; replyToAuthor?: string };

      if (ctx.kind === 'match') {
        candidate = buildMatchCommentText(persona, ctx, signals, seed, rTarget);
      } else if (ctx.kind === 'club_intro') {
        candidate = buildStarterIntroCommentText(persona, ctx, signals, seed, rTarget);
      } else {
        candidate = buildTransferRumorCommentText(persona, ctx, signals, seed, rTarget);
      }

      // On higher retry variants, inject specific world/player/date flavor to guarantee freshness without suffix cloning
      let candidateText = candidate.text;
      if (variant >= 5) {
        const extraTags = [
          ` ${signals.leagueRankStr}という現状も踏まえて見たい。`,
          ` ${signals.recentFormStr}の中でどう転ぶか。`,
          ` 目標「${signals.clubTarget}」との兼ね合いがポイントだね。`,
          ctx.kind === 'transfer_rumor' && ctx.player ? ` ${ctx.player.age}歳の${ctx.player.position}という条件も含めて議論の余地あり。` : ` ${signals.budgetStr}の予算背景もあるしね。`
        ];
        candidateText = `${candidateText}${extraTags[(variant + idx) % extraTags.length]}`;
      }

      const norm = normalizeForDedup(candidateText);
      if (!usedInThread.has(norm) && !recentTexts.has(norm)) {
        bestText = candidateText;
        bestBuilt = candidate;
        usedInThread.add(norm);
        break;
      }
      if (!usedInThread.has(norm) && !bestBuilt) {
        bestText = candidateText;
        bestBuilt = candidate;
      }
    }

    if (!bestBuilt) {
      bestBuilt = {
        text: `${persona.role}として今回の${ctx.userClub?.shortName || 'クラブ'}の動き（${signals.recentFormStr}）を興味深く見守っている。`,
        sentiment: persona.defaultSentiment,
        perspectiveLabel: persona.perspective
      };
      bestText = bestBuilt.text;
    }

    usedInThread.add(normalizeForDedup(bestText));
    generatedAuthors.push(persona.author);

    const seed = hashString(`${seedId}_${persona.id}_${idx}`);
    const likesBase = 18 + (seed % 340) + (idx < 3 ? 120 : 0);
    const repostsBase = Math.max(1, Math.round(likesBase * (0.12 + ((seed % 25) / 100))));

    return {
      id: `cmt_${seedId}_${idx}_${seed % 9999}`,
      author: persona.author,
      handle: persona.handle,
      avatar: { emoji: persona.emoji, bgClass: persona.bgClass },
      authorRole: persona.role,
      sentiment: bestBuilt.sentiment,
      perspectiveLabel: bestBuilt.perspectiveLabel,
      replyToAuthor: bestBuilt.replyToAuthor,
      text: bestText,
      likes: likesBase,
      reposts: repostsBase,
      postedAt: formatTimeOffset(idx, 1),
      wave: 1
    };
  });
}

/**
 * Computes fact-checked credibility, formal status, grounding flags, and exact TransferNewsStatusLabel
 * directly from live GameWorldState records.
 */
export function evaluateFactCheckedRumorStatus(
  state: GameWorldState,
  playerId?: string
): {
  hasFormalOffer: boolean;
  negotiation?: TransferNegotiation;
  incomingOfferExists: boolean;
  isShortlisted: boolean;
  isDeclaredInterest: boolean;
  isCompletedByUser: boolean;
  isUserPlayer: boolean;
  isListedForExit: boolean;
  hasContractExpiring: boolean;
  isPendingUserTransfer: boolean;
  isScoutSigned: boolean;
  isGroundedIncomingForUser: boolean;
  isGroundedOutgoingForUser: boolean;
  exactStatusLabel: TransferNewsStatusLabel;
  credibility: RumorCredibilityLevel;
} {
  if (!playerId) {
    return {
      hasFormalOffer: false,
      incomingOfferExists: false,
      isShortlisted: false,
      isDeclaredInterest: false,
      isCompletedByUser: false,
      isUserPlayer: false,
      isListedForExit: false,
      hasContractExpiring: false,
      isPendingUserTransfer: false,
      isScoutSigned: false,
      isGroundedIncomingForUser: false,
      isGroundedOutgoingForUser: false,
      exactStatusLabel: '監督コメント',
      credibility: '普通'
    };
  }

  const player = state.players[playerId];
  const userClubId = state.userClubId;
  const isUserPlayer = Boolean(player && userClubId && player.clubId === userClubId);
  const neg = state.negotiations?.[playerId];
  const activeBidStatuses = ['club_negotiating', 'club_agreed', 'player_negotiating', 'terms_agreed'];
  const outgoingFormal = Boolean(neg && activeBidStatuses.includes(neg.status));
  const incomingOfferExists = (state.incomingOffers || []).some(
    o => o.playerId === playerId && o.status === 'pending'
  );
  const hasFormalOffer = outgoingFormal || incomingOfferExists;
  const isShortlisted = Boolean(state.shortlistPlayerIds?.includes(playerId) || player?.isOnShortlist);
  const isDeclaredInterest = Boolean(state.declaredInterestPlayerIds?.includes(playerId) || player?.userDeclaredInterest);
  const isListedForExit = Boolean(player && (player.isTransferListed || player.isLoanListed));
  const hasContractExpiring = Boolean(player && player.contractYears <= 1);
  const isPendingUserTransfer = Boolean(
    userClubId && (state.pendingTransfers || []).some(t => t.playerId === playerId && (t.buyerClubId === userClubId || t.sellerClubId === userClubId))
  );
  const isScoutSigned = Boolean(state.scoutMonthlyState?.signedPlayerId === playerId);
  const isCompletedByUser = Boolean(
    neg?.status === 'completed' ||
    isPendingUserTransfer ||
    isScoutSigned ||
    (state.transferHistory || []).some(
      t => t.playerId === playerId && t.date === state.currentDate && (t.buyerClubId === userClubId || t.sellerClubId === userClubId)
    )
  );

  const isGroundedIncomingForUser = Boolean(
    outgoingFormal || isDeclaredInterest || isShortlisted || isPendingUserTransfer || isScoutSigned || isCompletedByUser
  );
  const isGroundedOutgoingForUser = Boolean(
    isUserPlayer && (incomingOfferExists || isListedForExit || hasContractExpiring || isPendingUserTransfer || isCompletedByUser)
  );

  let exactStatusLabel: TransferNewsStatusLabel = '獲得候補として検討中';
  if (neg?.status === 'completed' || isCompletedByUser) {
    exactStatusLabel = '移籍成立';
  } else if (neg?.status === 'collapsed' || neg?.status === 'hijacked') {
    exactStatusLabel = '移籍不成立';
  } else if (neg?.status === 'terms_agreed') {
    exactStatusLabel = '選手との契約合意';
  } else if (neg?.status === 'player_negotiating') {
    exactStatusLabel = '選手との契約交渉中';
  } else if (neg?.status === 'club_agreed') {
    exactStatusLabel = 'クラブ間合意';
  } else if (neg?.status === 'club_negotiating') {
    exactStatusLabel = 'クラブ間交渉中';
  } else if (incomingOfferExists) {
    exactStatusLabel = '正式オファーを提出';
  } else if (isDeclaredInterest) {
    exactStatusLabel = '関心を示している';
  } else if (isShortlisted) {
    exactStatusLabel = '獲得候補として検討中';
  }

  let credibility: RumorCredibilityLevel = '低い';
  if (isCompletedByUser || neg?.status === 'club_agreed' || neg?.status === 'terms_agreed' || neg?.status === 'hijacked' || neg?.status === 'collapsed') {
    credibility = '非常に高い';
  } else if (hasFormalOffer) {
    credibility = '高い';
  } else if (isDeclaredInterest || isShortlisted) {
    credibility = '普通';
  }

  return {
    hasFormalOffer,
    negotiation: neg,
    incomingOfferExists,
    isShortlisted,
    isDeclaredInterest,
    isCompletedByUser,
    isUserPlayer,
    isListedForExit,
    hasContractExpiring,
    isPendingUserTransfer,
    isScoutSigned,
    isGroundedIncomingForUser,
    isGroundedOutgoingForUser,
    exactStatusLabel,
    credibility
  };
}

function pickMediaSourceForCredibility(credibility: RumorCredibilityLevel, seedStr: string): string {
  const s = hashString(seedStr);
  if (credibility === '非常に高い' || credibility === '高い') return seededPick(MEDIA_SOURCES_HIGH, s);
  if (credibility === '普通') return seededPick(MEDIA_SOURCES_MID, s);
  return seededPick(MEDIA_SOURCES_LOW, s);
}

const SCENARIO_LABELS: Record<TransferRumorScenario, string> = {
  linked_rumor: '移籍関心の真偽確認',
  shortlist_target: 'リストアップ候補への質問',
  competing_clubs: '他クラブとの獲得競合',
  high_transfer_fee: '高額移籍金への見解',
  player_departure: '所属選手のオファー・退団報道',
  reinforcement_policy: '移籍ウィンドウ補強方針',
  failed_transfer: '交渉破談・獲得失敗後の対応',
  official_signing: '新加入選手の正式決定会見',
  official_departure: '所属選手の移籍退団会見',
  loan_signing: '期限付き新加入選手の決定会見',
  loan_departure: '期限付き移籍送り出し会見',
  contract_extended: '主力・所属選手の契約延長会見',
  contract_expired: '契約満了退団に関する会見',
  negotiation_started: '正式交渉入りに関する質問',
  club_agreed: 'クラブ間合意成立の背景',
  terms_agreed: '個人条件合意・加入間近の取材',
  window_closed: '移籍市場閉幕総括インタビュー'
};

/**
 * Generates an interview question + 4–5 rich choices for a specific scenario, strictly obeying fact-check state.
 */
export function buildTransferInterviewRequest(
  state: GameWorldState,
  params: {
    scenario: TransferRumorScenario;
    player?: Player;
    otherClub?: Club | null;
    rumorId?: string;
    linkedNewsPostId?: string;
    credibility: RumorCredibilityLevel;
    hasFormalOffer: boolean;
    estimatedFee?: number;
    competingClubNames?: string[];
    mediaSource: string;
  }
): TransferInterviewRequest {
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const clubName = userClub?.name || '当クラブ';
  const pName = params.player?.name || '注目ターゲット';
  const pPos = params.player?.position || '補強ポジション';
  const feeStr = params.estimatedFee === 0
    ? 'フリートランスファー'
    : params.estimatedFee
      ? `€${(params.estimatedFee / 1000000).toFixed(1)}M`
      : params.player
        ? `€${(params.player.marketValue / 1000000).toFixed(1)}M`
        : '相応額';
  const competingListStr = params.competingClubNames && params.competingClubNames.length > 0
    ? params.competingClubNames.join('や')
    : '他の欧州有力クラブ';
  const offerNote = params.hasFormalOffer
    ? '実際に正式オファー／クラブ間協議が確認されている事案'
    : '現時点で正式オファー未確認／クラブ内の検討段階または確定発表事案';

  let question = '';
  let choices: TransferInterviewChoice[] = [];

  switch (params.scenario) {
    case 'linked_rumor':
    case 'negotiation_started': {
      question = params.hasFormalOffer || params.scenario === 'negotiation_started'
        ? `${params.mediaSource}などが「${clubName}が${pName}獲得へ向けてクラブ間交渉に入っている」と報じています。交渉の状況と手応えをお聞かせください。`
        : `${clubName}が${pName}（${params.otherClub?.name || '他クラブ'}）へ関心を寄せていると注目が集まっています。現時点で正式オファー前の段階ですが、評価をお聞かせください。`;
      choices = [
        {
          id: 'ch_lr_confirm',
          label: '関心を認め能力を高く評価する',
          text: `${pName}は我々が注視している素晴らしいタレントの一人であることは確かだ。適切なタイミングで前向きに話し合いたい。`,
          stance: 'confirm',
          trustDelta: 0,
          boardDelta: 1,
          fanApprovalDelta: 3,
          playerInterestDelta: 8,
          rivalPressureDelta: 6,
          effectSummary: 'サポーター期待上昇・選手の関心UP（競合の警戒も上昇）'
        },
        {
          id: 'ch_lr_deny',
          label: 'メディアの見出しを明確に否定する',
          text: `過熱している見出しには距離を置きたい。我々は目の前の選手たちの指導に100%集中している。`,
          stance: 'deny',
          trustDelta: 2,
          boardDelta: 1,
          fanApprovalDelta: -1,
          playerInterestDelta: -4,
          rivalPressureDelta: -5,
          effectSummary: '報道過熱の鎮静化・既存選手への信頼維持'
        },
        {
          id: 'ch_lr_evasive',
          label: '多くのスカウト候補の一人としてかわす',
          text: `移籍市場では常に複数の候補をリストで比較検討している。特定の選手について詳しく語る段階ではない。`,
          stance: 'evasive',
          trustDelta: 1,
          boardDelta: 2,
          fanApprovalDelta: 1,
          playerInterestDelta: 2,
          rivalPressureDelta: 0,
          effectSummary: '交渉の余地を保ちつつ冷静な姿勢を維持'
        },
        {
          id: 'ch_lr_no_comment',
          label: '交渉の詳細はノーコメントを貫く',
          text: `他クラブの選手や協議中の案件について公にコメントすることはクラブ間の礼儀に反する。ノーコメントとさせていただく。`,
          stance: 'no_comment',
          trustDelta: 1,
          boardDelta: 3,
          fanApprovalDelta: 1,
          playerInterestDelta: 1,
          rivalPressureDelta: -2,
          effectSummary: 'プロフェッショナルな姿勢として理事会評価UP'
        }
      ];
      break;
    }

    case 'club_agreed':
    case 'terms_agreed': {
      question = params.scenario === 'terms_agreed'
        ? `${pName}とは選手本人の契約条件でも大枠合意に達したと報じられています。間もなく正式決定という理解でよろしいでしょうか？`
        : `${params.otherClub?.name || '相手クラブ'}との移籍条件でクラブ間合意に至ったとの報道です。${pName}本人との詰めのポイントはどこにありますか？`;
      choices = [
        {
          id: 'ch_ag_praise',
          label: '順調な進展を認め、早期合流への期待を語る',
          text: `関係各所が前向きに動いてくれており良い感触を得ている。${pName}が加わればチームに大きな推進力が生まれるはずだ。`,
          stance: 'praise_player',
          trustDelta: 1,
          boardDelta: 2,
          fanApprovalDelta: 4,
          playerInterestDelta: 8,
          rivalPressureDelta: 2,
          effectSummary: 'サポーター期待高騰・選手の最終納得感UP'
        },
        {
          id: 'ch_ag_cautious',
          label: '正式サインまで油断せず慎重に進めると述べる',
          text: `サッカーの移籍は契約書にサインしクラブが発表するまで何も終わっていない。最後の細部まで丁寧に詰めたい。`,
          stance: 'cautious',
          trustDelta: 1,
          boardDelta: 4,
          fanApprovalDelta: 2,
          playerInterestDelta: 2,
          rivalPressureDelta: -2,
          effectSummary: '慎重なクロージング姿勢として理事会から高評価'
        },
        {
          id: 'ch_ag_respect',
          label: '相手クラブと選手代理人の協力に感謝する',
          text: `ここまでの建設的な協議に感謝している。互いにリスペクトを持って最良の形へ導きたい。`,
          stance: 'respect_club',
          trustDelta: 1,
          boardDelta: 3,
          fanApprovalDelta: 2,
          playerInterestDelta: 4,
          rivalPressureDelta: -1,
          effectSummary: '良好な対外関係をアピール'
        },
        {
          id: 'ch_ag_no_comment',
          label: '正式発表前の詳細言及は避ける',
          text: `手続きの進捗についてこの場で詳細を語ることは控える。決まった段階ですぐにクラブから報告する。`,
          stance: 'no_comment',
          trustDelta: 1,
          boardDelta: 3,
          fanApprovalDelta: 0,
          playerInterestDelta: 0,
          rivalPressureDelta: -2,
          effectSummary: '無用なトラブルを防ぐ堅実対応'
        }
      ];
      break;
    }

    case 'shortlist_target': {
      question = `${clubName}の強化リストに${pName}（${pPos}）が含まれていると見られています。${params.hasFormalOffer ? 'すでに動きが見られる中、' : 'まだ正式オファー前の段階ですが、'}選手への評価をお聞かせください。`;
      choices = [
        {
          id: 'ch_sl_praise',
          label: '選手を高く評価し適合性を語る',
          text: `${pName}のクオリティとインテンシティは非常に魅力的だ。ああいう特徴を持つ${pPos}はどの監督も好むはずだ。`,
          stance: 'praise_player',
          trustDelta: 0,
          boardDelta: 1,
          fanApprovalDelta: 4,
          playerInterestDelta: 10,
          rivalPressureDelta: 5,
          effectSummary: '本人の加入意欲が大きく上昇・SNSで獲得待望論が拡大'
        },
        {
          id: 'ch_sl_cautious',
          label: '慎重な姿勢を示す（適性とコストを見極め中）',
          text: `スカウト部門が優秀な選手をリストアップするのは日常業務だ。戦術適性と財政バランスを慎重に精査している。`,
          stance: 'cautious',
          trustDelta: 1,
          boardDelta: 3,
          fanApprovalDelta: 2,
          playerInterestDelta: 2,
          rivalPressureDelta: -2,
          effectSummary: '堅実な強化方針として理事会・財務重視層から高評価'
        },
        {
          id: 'ch_sl_respect',
          label: '相手クラブへの敬意を表し明言を避ける',
          text: `${pName}は現在${params.otherClub?.name || '他クラブ'}の大切な選手だ。相手クラブへのリスペクトから、これ以上語ることは控える。`,
          stance: 'respect_club',
          trustDelta: 2,
          boardDelta: 2,
          fanApprovalDelta: 1,
          playerInterestDelta: 1,
          rivalPressureDelta: -3,
          effectSummary: '相手クラブとの関係を良好に保ち摩擦を回避'
        },
        {
          id: 'ch_sl_deny',
          label: '現有戦力への信頼を強調し噂を否定する',
          text: `外部のリスト予想と我々の実際の優先順位は必ずしも一致しない。今のスカッドへの信頼が一番大事だ。`,
          stance: 'deny',
          trustDelta: 3,
          boardDelta: 0,
          fanApprovalDelta: -1,
          playerInterestDelta: -6,
          rivalPressureDelta: -4,
          effectSummary: '現有メンバーの信頼向上・ターゲットへの過度な注目を抑制'
        }
      ];
      break;
    }

    case 'competing_clubs': {
      question = `${pName}を巡り${competingListStr}との獲得レースになっていると報じられています。競合が存在する中、${clubName}はどう優位に立つお考えですか？`;
      choices = [
        {
          id: 'ch_cc_bold',
          label: '強気に獲得への自信を宣言する',
          text: `他のクラブが興味を持つのは${pName}が一流である証だ。だが我々のプロジェクトと環境こそが選手にとってベストだと確信している。`,
          stance: 'bold',
          trustDelta: 0,
          boardDelta: 2,
          fanApprovalDelta: 5,
          playerInterestDelta: 9,
          rivalPressureDelta: 4,
          effectSummary: 'サポーター熱狂・本人の興味度UP（競合との注目度も上昇）'
        },
        {
          id: 'ch_cc_cautious',
          label: 'マネーゲームは避けると明言する',
          text: `競争になるのは自然だが、クラブの財政規律を壊してまで無謀なオークションに参加するつもりはない。適正価値を重視する。`,
          stance: 'cautious',
          trustDelta: 2,
          boardDelta: 4,
          fanApprovalDelta: 1,
          playerInterestDelta: -2,
          rivalPressureDelta: -4,
          effectSummary: '理事会から高い財務評価・サポーター間では賛否両論'
        },
        {
          id: 'ch_cc_praise',
          label: 'クラブの魅力・出場機会の環境をアピール',
          text: `${clubName}には明確なスタイルと成長の場がある。我々が誰をどう活かすかというビジョンで選んでもらいたい。`,
          stance: 'praise_player',
          trustDelta: 1,
          boardDelta: 2,
          fanApprovalDelta: 3,
          playerInterestDelta: 7,
          rivalPressureDelta: 1,
          effectSummary: '選手本人の納得感と興味度アップ'
        },
        {
          id: 'ch_cc_no_comment',
          label: '他クラブの動向にはノーコメント',
          text: `他クラブがどう動くかは我々の関知するところではない。我々は自分たちのペースで粛々と最善を尽くすだけだ。`,
          stance: 'no_comment',
          trustDelta: 1,
          boardDelta: 2,
          fanApprovalDelta: 0,
          playerInterestDelta: 0,
          rivalPressureDelta: -2,
          effectSummary: '冷静沈着な態度として好意的な受け止め'
        }
      ];
      break;
    }

    case 'high_transfer_fee': {
      question = `${pName}の移籍金は${feeStr}規模と報じられています。これだけの投資について、監督として妥当性とリスクをどうお考えですか？`;
      choices = [
        {
          id: 'ch_hf_bold',
          label: '価値ある投資だと断言し擁護する',
          text: `現代の移籍市場で真のゲームチェンジャーを確保するには相応の金額が必要だ。${pName}はその投資をピッチで何倍にもして返せる選手だ。`,
          stance: 'bold',
          trustDelta: 0,
          boardDelta: 1,
          fanApprovalDelta: 3,
          playerInterestDelta: 6,
          rivalPressureDelta: 3,
          effectSummary: '強気なビジョンに期待高まる一方、結果へのプレッシャーも上昇'
        },
        {
          id: 'ch_hf_cautious',
          label: '適正価格でのみ動くと慎重姿勢',
          text: `金額の大きさだけで選手の価値は決まらない。我々の評価額に見合わなければ別の選択肢を検討する柔軟性も持っている。`,
          stance: 'cautious',
          trustDelta: 1,
          boardDelta: 4,
          fanApprovalDelta: 2,
          playerInterestDelta: -2,
          rivalPressureDelta: -3,
          effectSummary: '経営・財務層からの支持拡大・相手クラブへの牽制効果'
        },
        {
          id: 'ch_hf_criticize_media',
          label: '報道の金額表現に釘を刺す',
          text: `報道に出ている数字は少し一人歩きしている印象だ。交渉の数字について外から語られる額をそのまま鵜呑みにしないでほしい。`,
          stance: 'criticize_media',
          trustDelta: 1,
          boardDelta: 2,
          fanApprovalDelta: 1,
          playerInterestDelta: 0,
          rivalPressureDelta: -2,
          effectSummary: '市場相場への過剰反応をクールダウン'
        },
        {
          id: 'ch_hf_evasive',
          label: '金額面は強化部に委ねていると述べる',
          text: `私の仕事はピッチ上の適性と必要性をフロントに伝えること。具体的な金額面の調整は強化部を信頼している。`,
          stance: 'evasive',
          trustDelta: 1,
          boardDelta: 3,
          fanApprovalDelta: 1,
          playerInterestDelta: 1,
          rivalPressureDelta: 0,
          effectSummary: 'フロントとの協調姿勢を強調'
        }
      ];
      break;
    }

    case 'player_departure': {
      question = `${clubName}所属の${pName}に対して、${params.hasFormalOffer ? '他クラブから正式な獲得オファーが届いている' : '移籍リストや契約状況を巡る去就注目が集まっている'}状況ですが、放出の可能性はあるのでしょうか？`;
      choices = [
        {
          id: 'ch_pd_deny',
          label: '非売品であると明確に否定・慰留宣言',
          text: `${pName}は我々のプロジェクトの大切な存在だ。これからも${clubName}のシャツを着て戦ってもらうつもりでいる。`,
          stance: 'deny',
          trustDelta: 6,
          boardDelta: 2,
          fanApprovalDelta: 5,
          playerInterestDelta: 0,
          rivalPressureDelta: -6,
          effectSummary: '本人の監督信頼度UP・サポーターから圧倒的支持'
        },
        {
          id: 'ch_pd_cautious',
          label: '双方納得の条件次第では検討と現実的回答',
          text: `サッカー界に絶対はない。まずはチームに残ることを望んでいるが、クラブと選手双方にとって納得の条件が並べばフロントが判断することになる。`,
          stance: 'cautious',
          trustDelta: -2,
          boardDelta: 3,
          fanApprovalDelta: -2,
          playerInterestDelta: 0,
          rivalPressureDelta: 4,
          effectSummary: '理事会は合理的と評価するもサポーターには賛否'
        },
        {
          id: 'ch_pd_praise',
          label: '選手のプロ意識を称え雑音への集中を促す',
          text: `${pName}に注目が集まるのはそれだけ価値を示している証拠だ。本人も日々の練習に100%集中している。`,
          stance: 'praise_player',
          trustDelta: 4,
          boardDelta: 2,
          fanApprovalDelta: 3,
          playerInterestDelta: 0,
          rivalPressureDelta: -1,
          effectSummary: 'ロッカールームの安定と選手のモチベーション維持'
        },
        {
          id: 'ch_pd_no_comment',
          label: 'オファーや契約の詳細にはコメントを控える',
          text: `選手個人の契約や移籍案件についてメディア上で一つひとつ答えることは避けたい。クラブ内で適切に対話している。`,
          stance: 'no_comment',
          trustDelta: 1,
          boardDelta: 2,
          fanApprovalDelta: 0,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: '不要な波風を立てず内部対応を優先'
        }
      ];
      break;
    }

    case 'reinforcement_policy': {
      question = `移籍市場が動く中、${clubName}の補強方針・最優先ポジション・予算バランスについて監督のお考えを聞かせてください。`;
      choices = [
        {
          id: 'ch_rp_bold',
          label: 'トップチーム即戦力の積極補強を明言',
          text: `より高い目標を狙うなら、チームにすぐ違いを生み出せる即戦力の獲得が不可欠だ。フロントとは積極的に良い選手を探している。`,
          stance: 'bold',
          trustDelta: 0,
          boardDelta: 1,
          fanApprovalDelta: 4,
          playerInterestDelta: 5,
          rivalPressureDelta: 2,
          effectSummary: '大型・即戦力補強へのサポーター期待が大きく上昇'
        },
        {
          id: 'ch_rp_youth',
          label: '若手と既存戦力の融合・育成重視を強調',
          text: `外から大金を投じるだけでなく、若手選手や既存の控えメンバーに成長機会を与えることがクラブの持続的な強さにつながる。`,
          stance: 'cautious',
          trustDelta: 4,
          boardDelta: 4,
          fanApprovalDelta: 2,
          playerInterestDelta: 1,
          rivalPressureDelta: -2,
          effectSummary: '既存選手・育成派サポ・理事会からバランス良く高評価'
        },
        {
          id: 'ch_rp_tactical',
          label: '特定ポジションのピンポイント補強を語る',
          text: `むやみに人数を増やすことはしない。戦術的なバランスを見て、必要な箇所にだけ的確にフィットする選手を迎え入れたい。`,
          stance: 'evasive',
          trustDelta: 2,
          boardDelta: 3,
          fanApprovalDelta: 3,
          playerInterestDelta: 2,
          rivalPressureDelta: 0,
          effectSummary: '戦術的整合性を重視する姿勢がSNSで好感'
        },
        {
          id: 'ch_rp_no_comment',
          label: '市場戦略の詳細は明かさない',
          text: `我々の具体的な狙いを公にすれば価格が跳ね上がるだけだ。水面下で着実にベストな編成を目指している。`,
          stance: 'no_comment',
          trustDelta: 2,
          boardDelta: 3,
          fanApprovalDelta: 1,
          playerInterestDelta: 0,
          rivalPressureDelta: -3,
          effectSummary: '交渉戦略を守る賢明な発言として受け止められる'
        }
      ];
      break;
    }

    case 'failed_transfer': {
      question = `${pName}の獲得は交渉破談・競合決着という形で不成立となりました。この結果と今後のプランについてどう受け止めていますか？`;
      choices = [
        {
          id: 'ch_ft_cautious',
          label: '妥当なラインを守った結果でありプランBへ移行',
          text: `もちろん欲しかった選手だが、クラブには越えてはならない予算と条件のラインがある。すでに次のターゲットへ切り替えて動いている。`,
          stance: 'cautious',
          trustDelta: 2,
          boardDelta: 3,
          fanApprovalDelta: 1,
          playerInterestDelta: 2,
          rivalPressureDelta: -2,
          effectSummary: '冷静な危機管理として一定の納得を得る'
        },
        {
          id: 'ch_ft_respect',
          label: '選手の決断と相手クラブを尊重する',
          text: `移籍は双方のタイミングと条件が揃って初めて成立するものだ。${pName}の新しい挑戦に敬意を表し、我々は前を向く。`,
          stance: 'respect_club',
          trustDelta: 3,
          boardDelta: 2,
          fanApprovalDelta: 2,
          playerInterestDelta: 1,
          rivalPressureDelta: 0,
          effectSummary: '潔いスポーツマンシップが好印象を与える'
        },
        {
          id: 'ch_ft_bold',
          label: '既存戦力と次の好機への闘志を燃やす',
          text: `一人の獲得が流れたくらいで我々の野心は揺るがない。今いる選手たちの奮起と、さらなる良い補強でピッチ上で証明する。`,
          stance: 'bold',
          trustDelta: 4,
          boardDelta: 2,
          fanApprovalDelta: 3,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: '現有スカッドの士気向上とサポーターの再結束'
        },
        {
          id: 'ch_ft_criticize_media',
          label: '外部の雑音や過度な注目を集めすぎた点を課題視',
          text: `交渉の過程が外へ漏れ続けたことも難しくした要因の一つだ。今後はより静かに、確実に仕事を進めたい。`,
          stance: 'criticize_media',
          trustDelta: 1,
          boardDelta: -1,
          fanApprovalDelta: -1,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: 'SNSでフロントや報道姿勢をめぐる激しい議論に発展'
        }
      ];
      break;
    }

    case 'official_departure':
    case 'loan_departure': {
      const isLoanOut = params.scenario === 'loan_departure';
      question = isLoanOut
        ? `${pName}が${params.otherClub?.name || '他クラブ'}へ期限付き移籍することが正式決定しました。今回の送り出しの狙いを教えてください。`
        : `${pName}の${params.otherClub?.name || '他クラブ'}への移籍退団が発表されました。送り出す決断と今後のスカッド運用についてお聞かせください。`;
      choices = [
        {
          id: 'ch_od_praise',
          label: 'これまでの貢献を称え新天地での活躍を祈る',
          text: `${pName}は常にプロとして模範的だった。${isLoanOut ? '実戦経験を積んでさらに逞しくなってほしい。' : '新天地での成功を心から願っている。'}`,
          stance: 'praise_player',
          trustDelta: 2,
          boardDelta: 2,
          fanApprovalDelta: 3,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: '選手とサポーター双方への礼節ある見送り'
        },
        {
          id: 'ch_od_cautious',
          label: 'スカッド最適化と資金・枠の有効活用を説明',
          text: `選手の出場機会とクラブの編成・財政バランスを総合的に考えた前向きな決断だ。既存戦力と今後の補強で十分補える。`,
          stance: 'cautious',
          trustDelta: 1,
          boardDelta: 4,
          fanApprovalDelta: 1,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: '経営・編成面での合理的説明として理解を得る'
        },
        {
          id: 'ch_od_bold',
          label: '既存選手と若手への新たな挑戦機会を強調',
          text: `一人が旅立つことは、別の誰かにとって主役を掴む最大のチャンスになる。若手や控え組の爆発に大いに期待している。`,
          stance: 'bold',
          trustDelta: 3,
          boardDelta: 2,
          fanApprovalDelta: 2,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: 'チーム内競争の活性化をアピール'
        },
        {
          id: 'ch_od_respect',
          label: '受け入れ先クラブとの良好な取引を評価',
          text: `関係各所が誠実に向き合い双方にとって良い着地点が見つかった。${params.otherClub?.name || '相手クラブ'}でも素晴らしいプレーを見せてくれるだろう。`,
          stance: 'respect_club',
          trustDelta: 1,
          boardDelta: 3,
          fanApprovalDelta: 1,
          playerInterestDelta: 0,
          rivalPressureDelta: -1,
          effectSummary: 'クラブ間の友好姿勢を評価'
        }
      ];
      break;
    }

    case 'contract_extended':
    case 'contract_expired': {
      const isExt = params.scenario === 'contract_extended';
      question = isExt
        ? `${pName}との契約延長が正式に発表されました。今後のチームにおける位置づけと期待をお聞かせください。`
        : `${pName}が契約満了をもってチームを離れることが決まりました。この区切りについての監督の受け止めは？`;
      choices = isExt
        ? [
            {
              id: 'ch_ce_praise',
              label: 'チームの中心核としての信頼を明言',
              text: `${pName}がクラブの未来を選んでくれたことを誇りに思う。ピッチ内外でリーダーシップを発揮し続けてほしい。`,
              stance: 'praise_player',
              trustDelta: 5,
              boardDelta: 3,
              fanApprovalDelta: 5,
              playerInterestDelta: 0,
              rivalPressureDelta: 0,
              effectSummary: '本人の信頼・ファン満足度ともに大幅UP'
            },
            {
              id: 'ch_ce_cautious',
              label: '継続性と高い競争基準の維持を求める',
              text: `契約を延長できたのは喜ばしいが、ここからが新たな競争の始まりだ。変わらぬ向上心でチームを引っ張ってほしい。`,
              stance: 'cautious',
              trustDelta: 2,
              boardDelta: 4,
              fanApprovalDelta: 2,
              playerInterestDelta: 0,
              rivalPressureDelta: 0,
              effectSummary: '引き締めと継続のバランスを評価'
            },
            {
              id: 'ch_ce_respect',
              label: '交渉をまとめたフロントへ感謝',
              text: `重要な資産である${pName}を長期で確保してくれた強化部の粘り強い仕事に感謝している。`,
              stance: 'respect_club',
              trustDelta: 2,
              boardDelta: 4,
              fanApprovalDelta: 2,
              playerInterestDelta: 0,
              rivalPressureDelta: 0,
              effectSummary: 'クラブ運営の一体感をアピール'
            }
          ]
        : [
            {
              id: 'ch_cx_respect',
              label: '功績への最大級の敬意と感謝を述べる',
              text: `${pName}が${clubName}に残してくれた貢献に心から感謝している。プロフェッショナルとしての次の挑戦を応援したい。`,
              stance: 'respect_club',
              trustDelta: 2,
              boardDelta: 2,
              fanApprovalDelta: 3,
              playerInterestDelta: 0,
              rivalPressureDelta: 0,
              effectSummary: '誠実な送り出しにサポーターが好感'
            },
            {
              id: 'ch_cx_bold',
              label: '新陳代謝と若手台頭への前向きな姿勢を示す',
              text: `どのクラブにもサイクルがある。空いたポジションでは若手や新戦力が新たな競争を巻き起こしてくれると信じている。`,
              stance: 'bold',
              trustDelta: 2,
              boardDelta: 3,
              fanApprovalDelta: 2,
              playerInterestDelta: 0,
              rivalPressureDelta: 0,
              effectSummary: '世代交代へのポジティブな意欲'
            }
          ];
      break;
    }

    case 'window_closed': {
      question = `今期の移籍ウィンドウが正式に閉幕しました。ここまでの補強・放出と、確定したスカッドでの今後の戦いへの手応えをお聞かせください。`;
      choices = [
        {
          id: 'ch_wc_bold',
          label: 'このスカッドへの完全な自信を宣言する',
          text: `ウィンドウは終わった。今ここにいる全員を100%信頼しているし、目標を達成する力は十分にあると確信している。`,
          stance: 'bold',
          trustDelta: 3,
          boardDelta: 3,
          fanApprovalDelta: 4,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: '選手・サポーターの士気向上'
        },
        {
          id: 'ch_wc_cautious',
          label: '成果と課題を見据えながら粘り強く戦うと語る',
          text: `満足している部分も次の機会へ持ち越した点もあるが、今の陣容で最大限の戦術的工夫を凝らしていくのが我々の仕事だ。`,
          stance: 'cautious',
          trustDelta: 2,
          boardDelta: 3,
          fanApprovalDelta: 2,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: '誠実で現実的な分析に納得の声'
        },
        {
          id: 'ch_wc_respect',
          label: '移籍市場を奔走した強化部と選手たちに感謝',
          text: `難しい市場の中でベストを尽くしてくれたフロントと、雑音の中で戦い抜いた選手たちに感謝したい。さあサッカーに集中しよう。`,
          stance: 'respect_club',
          trustDelta: 2,
          boardDelta: 4,
          fanApprovalDelta: 2,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: 'クラブ内の結束・理事会信頼度UP'
        }
      ];
      break;
    }

    case 'official_signing':
    case 'loan_signing':
    default: {
      const isLoan = params.scenario === 'loan_signing';
      question = `${pName}の${clubName}${isLoan ? '期限付き' : ''}加入が正式に決定しました！獲得の決め手となった点と、チームでの起用イメージを教えてください。`;
      choices = [
        {
          id: 'ch_os_praise',
          label: '選手の人格と戦術的フィット感を絶賛',
          text: `決定打は彼の技術だけでなくメンタリティと勝利への飢えだ。我々のシステムの中核として即座に違いを作ってくれると信じている。`,
          stance: 'praise_player',
          trustDelta: 4,
          boardDelta: 3,
          fanApprovalDelta: 5,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: '新加入選手の信頼度とファン期待が最高潮に'
        },
        {
          id: 'ch_os_cautious',
          label: '適応には少し時間も与えると現実的に語る',
          text: `素晴らしい才能を迎えたが、新しい環境や戦術に慣れるための時間も尊重したい。段階的に最高のパフォーマンスを引き出す。`,
          stance: 'cautious',
          trustDelta: 3,
          boardDelta: 3,
          fanApprovalDelta: 2,
          playerInterestDelta: 0,
          rivalPressureDelta: 0,
          effectSummary: '新戦力を守る丁寧なマネジメントとして評価'
        },
        {
          id: 'ch_os_bold',
          label: 'ポジション争い活性化と目標への本気度を宣言',
          text: `${pName}の加入は我々が本気で高みを目指す明確なメッセージだ。チーム内の競争を激化させ、全員でレベルアップする。`,
          stance: 'bold',
          trustDelta: 2,
          boardDelta: 3,
          fanApprovalDelta: 4,
          playerInterestDelta: 0,
          rivalPressureDelta: 2,
          effectSummary: '野心的な宣言でSNSの熱気がさらに高まる'
        },
        {
          id: 'ch_os_respect',
          label: '交渉をまとめたフロントと相手クラブへ感謝',
          text: `難しい交渉を粘り強く成立させてくれた強化部、そして誠実に対応してくれた${params.otherClub?.name || '相手クラブ'}に感謝したい。`,
          stance: 'respect_club',
          trustDelta: 2,
          boardDelta: 4,
          fanApprovalDelta: 2,
          playerInterestDelta: 0,
          rivalPressureDelta: -1,
          effectSummary: '理事会・フロントからの評価が大幅に上昇'
        }
      ];
      break;
    }
  }

  return {
    id: `tr_int_${params.scenario}_${params.player?.id || 'club'}_${state.currentDate}_${hashString(`${params.rumorId || ''}_${state.currentDate}`) % 10000}`,
    createdDate: state.currentDate,
    scenario: params.scenario,
    scenarioLabel: SCENARIO_LABELS[params.scenario] || '移籍関連取材',
    reporterRole: params.credibility === '非常に高い' ? '全国スポーツ紙 移籍キャップ' : 'クラブ番記者',
    mediaSource: params.mediaSource,
    question,
    contextSummary: `${offerNote}（報道信頼度: ${params.credibility}）`,
    rumorId: params.rumorId,
    linkedNewsPostId: params.linkedNewsPostId,
    relatedPlayerId: params.player?.id,
    relatedPlayerName: params.player?.name,
    hasFormalOffer: params.hasFormalOffer,
    credibility: params.credibility,
    choices,
    status: 'pending'
  };
}

/**
 * Creates/updates a transfer rumor or official transfer announcement, its 10–30 comment SNS post,
 * NewsItem synchronization, and importance-weighted journalist interview request.
 *
 * STRICT GROUNDING GUARANTEE:
 * - Unconfirmed incoming rumors (`linked_rumor`, `shortlist_target`, `competing_clubs`, `high_transfer_fee`,
 *   `negotiation_started`, `club_agreed`, `terms_agreed`) are REJECTED unless grounded in GameWorldState.
 * - Unconfirmed outgoing rumors (`player_departure`) are REJECTED unless user club player has incoming offer,
 *   transfer/loan listing, or expiring contract.
 * - `transferEventKey` guarantees strict idempotency across duplicate/pending triggers and save/load.
 */
export function upsertTransferRumorAndPost(
  state: GameWorldState,
  params: {
    scenario: TransferRumorScenario;
    player?: Player;
    otherClub?: Club | null;
    estimatedFee?: number;
    contractYears?: number;
    transferTypeLabel?: string;
    competingClubNames?: string[];
    forceCreateInterview?: boolean;
    customMediaSource?: string;
    isMajorStory?: boolean;
    transferEventKey?: string;
    exactStatusLabel?: TransferNewsStatusLabel;
    skipNewsFeedItem?: boolean;
  }
): GameWorldState {
  if (!state.userClubId) return state;
  const userClub = state.clubs[state.userClubId];
  if (!userClub) return state;

  const sp = state.smartphone || {
    newsFeed: [],
    emails: [],
    clubNotices: [],
    notifications: [],
    frontOfficeThread: [],
    lastEvaluatedDate: state.currentDate,
    generatedTriggerKeys: []
  };

  // 1. Strict Event Key Idempotency
  const emittedKeys = state.emittedTransferNewsKeys || [];
  if (params.transferEventKey) {
    if (emittedKeys.includes(params.transferEventKey)) return state;
    if (sp.newsFeed.some(p => p.transferEventKey === params.transferEventKey)) return state;
  }

  // 2. Fact-check & strict anti-fake grounding verification
  const fact = evaluateFactCheckedRumorStatus(state, params.player?.id);

  const officialOrGlobalScenarios: TransferRumorScenario[] = [
    'reinforcement_policy',
    'window_closed',
    'official_signing',
    'official_departure',
    'loan_signing',
    'loan_departure',
    'contract_extended',
    'contract_expired',
    'failed_transfer'
  ];

  if (!officialOrGlobalScenarios.includes(params.scenario) && params.player) {
    if (params.scenario === 'player_departure') {
      if (!fact.isGroundedOutgoingForUser) return state;
    } else {
      if (!fact.isGroundedIncomingForUser) return state;
    }
  }

  const pName = params.player?.name || '注目ターゲット';
  const feeKnown = params.estimatedFee !== undefined && params.estimatedFee !== null;
  const feeVal = feeKnown
    ? params.estimatedFee
    : fact.hasFormalOffer && fact.negotiation?.currentBidFee
      ? fact.negotiation.currentBidFee
      : undefined;
  const feeText = feeVal === 0
    ? 'フリートランスファー（€0）'
    : feeVal
      ? `€${(feeVal / 1000000).toFixed(1)}M`
      : undefined;

  const officialHighCredScenarios: TransferRumorScenario[] = [
    'official_signing',
    'official_departure',
    'loan_signing',
    'loan_departure',
    'contract_extended',
    'contract_expired',
    'window_closed',
    'failed_transfer',
    'club_agreed',
    'terms_agreed'
  ];

  const credibility: RumorCredibilityLevel = officialHighCredScenarios.includes(params.scenario)
    ? '非常に高い'
    : params.scenario === 'reinforcement_policy'
      ? '普通'
      : fact.credibility;

  const isOfficialEvent = [
    'official_signing',
    'official_departure',
    'loan_signing',
    'loan_departure',
    'contract_extended',
    'contract_expired',
    'window_closed'
  ].includes(params.scenario);

  const mediaSource = params.customMediaSource
    || (isOfficialEvent ? 'クラブ公式発表・現地番記者' : pickMediaSourceForCredibility(credibility, `${params.scenario}_${params.player?.id || 'pol'}_${state.currentDate}`));
  const clubName = userClub.name;
  const otherName = params.otherClub?.name || (params.player?.clubId && params.player.clubId !== 'free_agent' ? state.clubs[params.player.clubId]?.name : undefined) || '前所属クラブ';

  let statusLabel: TransferNewsStatusLabel = params.exactStatusLabel || fact.exactStatusLabel;
  let title = '';
  let summary = '';
  let rumorStatus: TransferRumor['status'] = fact.hasFormalOffer ? 'formal_talks' : 'rumor';
  let isMajor = Boolean(params.isMajorStory);
  let transferMeta: TransferNewsMeta | undefined = params.player
    ? {
        playerName: params.player.name,
        fromClubName: params.scenario === 'official_departure' || params.scenario === 'loan_departure' || params.scenario === 'player_departure' || params.scenario === 'contract_extended' || params.scenario === 'contract_expired'
          ? clubName
          : otherName,
        toClubName: params.scenario === 'official_departure' || params.scenario === 'loan_departure'
          ? (params.otherClub?.name || '移籍先クラブ')
          : params.scenario === 'contract_expired'
            ? 'フリー（契約満了）'
            : params.scenario === 'contract_extended'
              ? clubName
              : clubName,
        transferTypeLabel: params.transferTypeLabel,
        feeDisplay: feeText,
        contractYears: params.contractYears,
        announcedDate: state.currentDate
      }
    : undefined;

  switch (params.scenario) {
    case 'official_signing':
      statusLabel = '移籍成立';
      title = `【移籍成立・公式発表】${clubName}、${pName}の加入を正式発表！（${params.transferTypeLabel || '完全移籍'}${feeText ? `・${feeText}` : ''}）`;
      summary = `${clubName}は${otherName}から${pName}（${params.player?.age}歳 / ${params.player?.position}）の${params.transferTypeLabel || '完全移籍'}加入を正式発表しました。${feeText ? `条件は${feeText}` : '公式契約完了'}${params.contractYears ? `・${params.contractYears}年契約` : ''}。SNSでは歓迎や戦術フィットを巡る反応が一気に広がっています。`;
      rumorStatus = 'completed';
      isMajor = true;
      break;

    case 'loan_signing':
      statusLabel = '移籍成立';
      title = `【移籍成立・期限付き加入】${clubName}、${pName}を${params.transferTypeLabel || 'レンタル移籍'}で獲得！`;
      summary = `${clubName}は${otherName}から${pName}（${params.player?.age}歳 / ${params.player?.position}）を${params.transferTypeLabel || '期限付き移籍'}で迎え入れることを正式発表しました。チーム内競争の活性化にサポーターの期待が集まっています。`;
      rumorStatus = 'completed';
      isMajor = true;
      break;

    case 'official_departure':
      statusLabel = '退団決定';
      title = `【退団決定・公式発表】${pName}、${params.otherClub?.name || '他クラブ'}へ完全移籍が決定`;
      summary = `${clubName}所属の${pName}（${params.player?.age}歳 / ${params.player?.position}）が、${params.otherClub?.name || '他クラブ'}へ完全移籍することが正式発表されました${feeText ? `（移籍条件: ${feeText}）` : ''}。これまでの貢献への感謝と今後の編成を巡りSNSで議論が起きています。`;
      rumorStatus = 'completed';
      isMajor = true;
      break;

    case 'loan_departure':
      statusLabel = '退団決定';
      title = `【期限付き移籍決定】${pName}、${params.otherClub?.name || '他クラブ'}へレンタル移籍`;
      summary = `${clubName}は${pName}（${params.player?.age}歳 / ${params.player?.position}）を${params.otherClub?.name || '他クラブ'}へ期限付き移籍させることを発表しました。実戦経験と給与・編成バランスを巡る反応が広がっています。`;
      rumorStatus = 'completed';
      isMajor = true;
      break;

    case 'contract_extended':
      statusLabel = '契約延長';
      title = `【契約延長発表】${clubName}、${pName}と${params.contractYears ? `${params.contractYears}年の` : ''}契約更新に合意！`;
      summary = `${clubName}は主力・所属選手の${pName}（${params.player?.age}歳 / ${params.player?.position}）と${params.contractYears ? `${params.contractYears}年間の` : ''}契約延長で正式合意したことを発表しました。引き抜き阻止と戦力継続に歓迎の声が寄せられています。`;
      rumorStatus = 'completed';
      isMajor = true;
      break;

    case 'contract_expired':
      statusLabel = '契約満了';
      title = `【契約満了・退団決定】${pName}が契約満了に伴い${clubName}を退団`;
      summary = `${pName}（${params.player?.age}歳 / ${params.player?.position}）が契約期間満了により${clubName}を退団することが確定しました。これまでの功績を称える声と後任を案じる声が上がっています。`;
      rumorStatus = 'completed';
      isMajor = true;
      break;

    case 'window_closed':
      statusLabel = '移籍市場終了';
      title = `【移籍市場終了】今期の移籍ウィンドウが正式に閉幕 — ${clubName}の最終陣容確定`;
      summary = `移籍ウィンドウが正式に閉幕し、${clubName}の当面のスカッドが確定しました。ここまでの補強・放出の評価と今後の戦いに向けてSNS上で総括議論が交わされています。`;
      rumorStatus = 'completed';
      isMajor = true;
      transferMeta = {
        transferTypeLabel: '移籍市場クローズ',
        announcedDate: state.currentDate
      };
      break;

    case 'negotiation_started':
      statusLabel = fact.negotiation?.status === 'player_negotiating' ? '選手との契約交渉中' : 'クラブ間交渉中';
      title = `【${statusLabel}】${clubName}が${pName}獲得へ向けて${otherName}と正式協議入り`;
      summary = `${clubName}は${otherName}の${pName}に対し正式オファーを提出し、${statusLabel === '選手との契約交渉中' ? '選手本人との契約交渉' : 'クラブ間での条件交渉'}を進めています${feeText ? `（提示条件: ${feeText}）` : ''}。`;
      rumorStatus = 'formal_talks';
      break;

    case 'club_agreed':
      statusLabel = 'クラブ間合意';
      title = `【クラブ間合意】${clubName}と${otherName}、${pName}の移籍条件で合意！（個人交渉へ）`;
      summary = `${clubName}と${otherName}の間で${pName}の移籍金・基本条件（${feeText || '合意額'}）が合意に達しました。現在は選手本人との契約条件を詰める段階に入っています。`;
      rumorStatus = 'formal_talks';
      isMajor = true;
      break;

    case 'terms_agreed':
      statusLabel = '選手との契約合意';
      title = `【契約合意・移籍手続き中】${pName}が${clubName}との個人条件に合意（${params.transferTypeLabel || '登録待機中'}）`;
      summary = `${pName}と${clubName}の間で${params.contractYears ? `${params.contractYears}年契約の` : ''}個人条件が合意に達しました${feeText ? `（移籍条件: ${feeText}）` : ''}。所定の登録・加入時期をもって正式合流予定です。`;
      rumorStatus = 'formal_talks';
      isMajor = true;
      break;

    case 'failed_transfer':
      statusLabel = '移籍不成立';
      title = `【移籍不成立】${clubName}の${pName}獲得交渉は破談に…`;
      summary = `${clubName}が動いていた${pName}の獲得は、${fact.negotiation?.outcomeReason || '条件折り合いがつかず／競合クラブとの決着により'}不成立となりました。惜しむ声とプランBへの期待が交錯しています。`;
      rumorStatus = 'collapsed';
      isMajor = true;
      break;

    case 'player_departure':
      if (fact.incomingOfferExists) {
        statusLabel = '正式オファーを提出';
        title = `【獲得オファー到来】${params.otherClub?.name || '他クラブ'}が${clubName}の${pName}に正式オファー（${feeText || '条件精査中'}）`;
        summary = `${params.otherClub?.name || '他クラブ'}から${clubName}所属の${pName}へ正式オファーが届いていることが確認されました。受け入れるべきか慰留すべきか賛否が割れています。`;
      } else {
        statusLabel = fact.isListedForExit ? '獲得候補として検討中' : '関心を示している';
        title = `【去就注目】${clubName}の${pName}、${fact.isListedForExit ? '移籍リスト入りに伴い移籍の可能性浮上' : '契約状況から去就が注目される'}`;
        summary = `${pName}については${fact.isListedForExit ? '移籍・レンタルリスト登録が確認されており、他クラブの動きに注目が集まっています。' : '残り契約年数を踏まえて去就が議論されています。'}現時点で正式オファー成立には至っていません。`;
      }
      break;

    case 'high_transfer_fee':
      statusLabel = fact.exactStatusLabel;
      title = fact.hasFormalOffer
        ? `【高額案件・${statusLabel}】${clubName}、${pName}へ${feeText}規模の交渉を進行`
        : `【高額評価・${statusLabel}】${clubName}注目候補${pName}の市場評価（推定${feeText || `€${((params.player?.marketValue || 25000000) / 1000000).toFixed(1)}M`}）を巡り議論`;
      summary = fact.hasFormalOffer
        ? `${clubName}が${pName}獲得へ向けて${feeText}規模で${statusLabel}の段階に入っています。高額投資の妥当性に白熱した議論が起きています。`
        : `${clubName}のリスト上位に入る${pName}について、正式オファー前の段階ながら市場評価額に対する投資価値を問う声が広がっています。`;
      isMajor = true;
      break;

    case 'competing_clubs':
      statusLabel = fact.exactStatusLabel;
      title = `【獲得競合・${statusLabel}】${pName}巡り${clubName}と${(params.competingClubNames || ['他クラブ']).join('・')}が競合`;
      summary = `${otherName}所属の${pName}を巡り、${clubName}に加えて${(params.competingClubNames || ['複数クラブ']).join('、')}が関心を寄せています（現在ステータス: ${statusLabel}）。`;
      rumorStatus = fact.hasFormalOffer ? 'formal_talks' : 'developing';
      isMajor = true;
      break;

    case 'shortlist_target':
      statusLabel = fact.hasFormalOffer ? fact.exactStatusLabel : '獲得候補として検討中';
      title = fact.hasFormalOffer
        ? `【リスト候補・${statusLabel}】${clubName}の${pName}交渉が次の段階へ`
        : `【獲得候補として検討中】${clubName}補強リストの${pName}（${params.player?.position}）に注目`;
      summary = fact.hasFormalOffer
        ? `補強リストに登録されていた${pName}について、現在「${statusLabel}」のフェーズへ進展しています。`
        : `${clubName}の補強ショートリストに入っている${pName}（${params.player?.age}歳）が現地サポ間で話題に。まだ正式オファー提出前の検討段階です。`;
      break;

    case 'reinforcement_policy':
      statusLabel = '監督コメント';
      title = `【移籍市場特集】${clubName}の補強戦略と選手層を巡りファンが議論`;
      summary = `移籍市場が動く中、${clubName}の優先補強ポジションや若手起用、予算配分を巡ってSNSで様々な立場の意見が交わされています。`;
      break;

    case 'linked_rumor':
    default:
      statusLabel = fact.hasFormalOffer ? fact.exactStatusLabel : (fact.isDeclaredInterest ? '関心を示している' : '獲得候補として検討中');
      title = fact.hasFormalOffer
        ? `【${statusLabel}】${clubName}が${pName}獲得へ公式アプローチ中`
        : `【${statusLabel}】${clubName}が${pName}（${params.otherClub?.shortName || otherName}）に注目（未オファー）`;
      summary = fact.hasFormalOffer
        ? `${clubName}は${pName}獲得へ向けて正式交渉を進めています（現在ステータス: ${statusLabel}）。`
        : `${clubName}が${pName}へ関心を寄せていることが確認されています。現時点で正式オファーは未提出の段階です。`;
      break;
  }

  const keyHash = params.transferEventKey ? `_${hashString(params.transferEventKey) % 10000}` : '';
  const rumorId = `rumor_${params.scenario}_${params.player?.id || 'club'}_${state.currentDate}${keyHash}`;
  const postId = `sp_news_rumor_${rumorId}`;

  if (sp.newsFeed.some(n => n.id === postId)) return state;

  const comments = generateDiverseSnsComments(
    {
      kind: 'transfer_rumor',
      userClub,
      managerName: state.manager.name,
      player: params.player,
      otherClub: params.otherClub,
      scenario: params.scenario,
      credibility,
      hasFormalOffer: fact.hasFormalOffer || isOfficialEvent || ['negotiation_started', 'club_agreed', 'terms_agreed'].includes(params.scenario),
      estimatedFee: feeVal,
      contractYears: params.contractYears,
      transferTypeLabel: params.transferTypeLabel,
      competingClubNames: params.competingClubNames,
      date: state.currentDate,
      mediaSource,
      isMajorStory: isMajor || Boolean(feeVal && feeVal >= 45000000),
      state
    },
    rumorId
  );

  const newPost: SmartphoneNewsPost = {
    id: postId,
    date: state.currentDate,
    title,
    summary,
    category: 'transfer',
    relatedClubId: userClub.id,
    relatedPlayerId: params.player?.id,
    isRead: false,
    comments,
    isTransferRumor: true,
    rumorId,
    rumorScenario: params.scenario,
    rumorCredibility: credibility,
    hasFormalOffer: fact.hasFormalOffer || ['negotiation_started', 'club_agreed', 'terms_agreed'].includes(params.scenario),
    transferStatusLabel: statusLabel,
    transferEventKey: params.transferEventKey,
    transferMeta,
    mediaSource,
    feeText,
    waveCount: 1,
    lastWaveDate: state.currentDate
  };

  const newRumor: TransferRumor = {
    id: rumorId,
    createdDate: state.currentDate,
    lastUpdatedDate: state.currentDate,
    scenario: params.scenario,
    playerId: params.player?.id,
    playerName: params.player?.name,
    fromClubId: transferMeta?.fromClubName === clubName ? userClub.id : params.player?.clubId,
    toClubId: transferMeta?.toClubName === clubName ? userClub.id : params.otherClub?.id,
    credibility,
    hasFormalOffer: fact.hasFormalOffer || ['negotiation_started', 'club_agreed', 'terms_agreed'].includes(params.scenario),
    transferStatusLabel: statusLabel,
    mediaSource,
    headline: title,
    summary,
    estimatedFee: feeVal,
    competingClubNames: params.competingClubNames,
    heatScore: Math.min(100, 48 + (fact.hasFormalOffer ? 25 : 0) + (isMajor ? 22 : 0)),
    status: rumorStatus,
    linkedNewsPostId: postId
  };

  // Sync official milestones to main club NewsItem feed cleanly
  let nextNewsList = state.news || [];
  if (!params.skipNewsFeedItem && (isOfficialEvent || params.scenario === 'club_agreed' || params.scenario === 'terms_agreed')) {
    const alreadyInNews = nextNewsList.some(n => n.date === state.currentDate && n.headline === title);
    if (!alreadyInNews) {
      const newsEntry: NewsItem = {
        id: `news_tr_${rumorId}`,
        headline: title,
        body: summary,
        date: state.currentDate,
        category: 'transfer',
        relatedClubId: userClub.id,
        relatedPlayerId: params.player?.id,
        importance: isOfficialEvent ? 'high' : 'medium'
      };
      nextNewsList = [newsEntry, ...nextNewsList].slice(0, 120);
    }
  }

  // Importance-weighted interview request generation (no spam on low-value rumors, always allow major/official or player-distinct talks)
  const existingInterviews = [...(state.transferInterviews || [])];
  const pendingCount = existingInterviews.filter(i => i.status === 'pending').length;
  const alreadyHasInterviewForPlayer = params.player
    ? existingInterviews.some(
        i =>
          i.relatedPlayerId === params.player!.id &&
          i.scenario === params.scenario &&
          i.status === 'pending'
      )
    : existingInterviews.some(i => i.scenario === params.scenario && i.status === 'pending');

  const highPriorityForInterview = isOfficialEvent || isMajor || params.scenario === 'failed_transfer' || params.scenario === 'player_departure' || params.scenario === 'club_agreed' || params.scenario === 'terms_agreed';
  let nextInterviews = existingInterviews;
  if (!alreadyHasInterviewForPlayer && (params.forceCreateInterview || (highPriorityForInterview && pendingCount < 5) || pendingCount < 3)) {
    const interviewReq = buildTransferInterviewRequest(state, {
      scenario: params.scenario,
      player: params.player,
      otherClub: params.otherClub,
      rumorId,
      linkedNewsPostId: postId,
      credibility,
      hasFormalOffer: newPost.hasFormalOffer || false,
      estimatedFee: feeVal,
      competingClubNames: params.competingClubNames,
      mediaSource
    });
    nextInterviews = [interviewReq, ...existingInterviews].slice(0, 30);
  }

  const nextEmittedKeys = params.transferEventKey
    ? [...emittedKeys, params.transferEventKey].slice(-500)
    : emittedKeys;

  return {
    ...state,
    news: nextNewsList,
    smartphone: {
      ...sp,
      newsFeed: [newPost, ...sp.newsFeed].slice(0, 60)
    },
    transferRumors: [newRumor, ...(state.transferRumors || [])].slice(0, 35),
    transferInterviews: nextInterviews,
    emittedTransferNewsKeys: nextEmittedKeys
  };
}

/**
 * Generates direct Wave-2 reactive SNS comments triggered immediately after the manager answers a transfer interview.
 */
function generatePostInterviewSnsWave(
  state: GameWorldState,
  interview: TransferInterviewRequest,
  choice: TransferInterviewChoice,
  linkedPost: SmartphoneNewsPost | undefined,
  actuallyHasFormalOffer: boolean
): SmartphoneNewsComment[] {
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const club = userClub?.shortName || userClub?.name || 'クラブ';
  const pName = interview.relatedPlayerName || '候補選手';
  const mName = state.manager.name;
  const signals = extractClubContextSignals(state, userClub);
  const existingAuthors = new Set((linkedPost?.comments || []).map(c => c.author));
  const usedInThread = new Set((linkedPost?.comments || []).map(c => normalizeForDedup(c.text)));
  const waveCount = 7;
  const personas = pickPersonas(`${interview.id}_${choice.id}_${state.currentDate}`, waveCount, existingAuthors);

  return personas.map((persona, idx) => {
    const seed = hashString(`${interview.id}_${choice.id}_${persona.id}_${idx}`);
    let text = '';
    let sentiment: 'positive' | 'neutral' | 'critical' | 'mixed' = 'neutral';
    let perspectiveLabel = '会見への反応';

    if (choice.stance === 'confirm' || choice.stance === 'bold' || choice.stance === 'praise_player') {
      const pool = [
        `${mName}監督が会見で「${choice.label}」と踏み込んだ！今の${signals.leagueRankStr}から本気で上を狙う姿勢が伝わってきて熱い！！`,
        `監督の口からここまで前向きな評価が出たのは大きい。${pName}の心にも間違いなく響くはずだ。`,
        `ただ、ここまで明言すると他クラブが警戒して移籍金を吊り上げてこないかだけは少し慎重に見ておきたい（期待も半分以上あるけど）。`,
        `${mName}監督の言葉に迷いがないな！サポーターが聞きたかった強気なビジョンを語ってくれた。`,
        `${club}のファンとしてはテンション爆上がり。${signals.lastMatchStr}の流れも合わせていい風が吹いてきた！`,
        `他サポ目線で見ても、${mName}監督がここまで堂々と語るってことは裏で相当手応えを掴んでるんだろうな…。`,
        `言ったからにはフロントと一体でベストな結果に繋げてくれよ監督！続報が楽しみすぎる！`
      ];
      text = pool[idx % pool.length];
      sentiment = idx === 2 ? 'mixed' : 'positive';
      perspectiveLabel = idx === 2 ? '戦略・相場懸念' : '監督発言に期待';
    } else if (choice.stance === 'deny' || choice.stance === 'criticize_media') {
      const pool = actuallyHasFormalOffer
        ? [
            `いや${mName}監督は否定したけど、実際の動きが出てる話と噛み合わないあたり交渉上の煙幕（スモーク）戦術かなｗ`,
            `公式発表前に監督が「動く」なんて言えるわけがないし、むしろプロとして当然のブラフ返しだと思う。`,
            `メディア批判まで飛び出したけど、サッカー界の「興味ない」が翌週に覆るケースは数え切れないからな…。`,
            `既存メンバーの気持ちを守る意味では正しい回答。仮に交渉が進行中なら静かに進めてほしい。`,
            `本当にターゲットを変えているのか、それとも駆け引きなのか、ここ数日の続報でハッキリしそう。`,
            `監督の発言を額面通り取るか裏を読むかでタイムラインが真っ二つに分かれるのいつもの景色だなｗ`,
            `ロッカールームの選手たちにとって監督が「今の仲間を信頼している」と示したメッセージはプラスに働くはず！`
          ]
        : [
            `${mName}監督が即座に噂を一蹴！やっぱり${interview.mediaSource}の勇み足だったか…。`,
            `正式オファーもないのにSNSだけ過熱していた件、監督の一言で一気に冷静になりそう。`,
            `根拠の薄いゴシップに乗らずきっぱり線引きした監督の対応に安心した！`,
            `とはいえ市場は何が起きるか分からないから、次の移籍窓の動きも含めてあと少し見守るか。`,
            `今の選手たちのモチベーションを守る意味でも、不要な噂を早いうちに鎮火させたのは正解だね。`,
            `取材した記者さん、監督にバッサリ切られて次の質問出しづらそうで草。`,
            `これで別の優先ターゲットがいるなら、そちらの本命報道がそのうち出てくるかもしれない。`
          ];
      text = pool[idx % pool.length];
      sentiment = actuallyHasFormalOffer ? 'mixed' : idx === 0 || idx === 2 || idx === 4 ? 'positive' : 'neutral';
      perspectiveLabel = actuallyHasFormalOffer ? '煙幕議論' : '報道一蹴に納得';
    } else {
      const pool = [
        `${mName}監督の回答（「${choice.label}」）、さすがの外交的コメント。余計なプレッシャーを増やさないプロの仕事だ。`,
        `慎重姿勢を貫いたってことは、まだ詰めの段階か、交渉カードを外に見せたくないんだろうな。`,
        `相手クラブと所属選手へのリスペクトを忘れない言葉選びが好印象。ファンとしてはもう一声踏み込んでほしかった気持ちもあるけど！`,
        `無謀な投資に走らない線引きを示したのは財務規律（${signals.budgetStr}枠）の観点からも安心感がある。`,
        `モヤっとする返答に見えるけど、移籍交渉は表に出ないほど成功率が上がるのは事実だし仕方ないね。`,
        `完全否定はしなかったあたりに少し含みを感じるんだが…深読みしすぎかな？`,
        `メディア側もこれ以上突っ込めない完璧なかわし方。あとは強化部との連携で最良の結論を出してほしい！`
      ];
      text = pool[idx % pool.length];
      sentiment = idx === 2 || idx === 4 ? 'mixed' : 'neutral';
      perspectiveLabel = '外交的回答を評価';
    }

    if (usedInThread.has(normalizeForDedup(text))) {
      text = `${text}（${persona.perspective}の観点からも今後の展開に注目）`;
    }
    usedInThread.add(normalizeForDedup(text));

    const likes = 32 + (seed % 290);
    return {
      id: `cmt_wave2_${interview.id}_${idx}_${seed % 999}`,
      author: persona.author,
      handle: persona.handle,
      avatar: { emoji: persona.emoji, bgClass: persona.bgClass },
      authorRole: persona.role,
      sentiment,
      perspectiveLabel,
      text,
      likes,
      reposts: Math.max(2, Math.round(likes * 0.18)),
      postedAt: formatTimeOffset(idx, 2),
      wave: 2
    };
  });
}

/**
 * Resolves a transfer interview request, applies realistic effects to rumors, SNS reactions, players, negotiations, board & fans.
 * IMPORTANT: Denying a rumor NEVER destroys an active negotiation behind closed doors.
 */
export function resolveTransferInterview(
  state: GameWorldState,
  requestId: string,
  choiceId: string,
  customResponseText?: string
): {
  updatedState: GameWorldState;
  headline: string;
  reactiveComments: SmartphoneNewsComment[];
  effectSummary: string;
} {
  const interviews = [...(state.transferInterviews || [])];
  const idx = interviews.findIndex(r => r.id === requestId);
  if (idx === -1) {
    return { updatedState: state, headline: '', reactiveComments: [], effectSummary: '' };
  }

  const req = interviews[idx];
  const choice = req.choices.find(c => c.id === choiceId) || req.choices[0];
  if (!choice) {
    return { updatedState: state, headline: '', reactiveComments: [], effectSummary: '' };
  }

  const answerText = (customResponseText && customResponseText.trim()) ? customResponseText.trim() : choice.text;
  const fact = evaluateFactCheckedRumorStatus(state, req.relatedPlayerId);
  const sp = state.smartphone || {
    newsFeed: [],
    emails: [],
    clubNotices: [],
    notifications: [],
    frontOfficeThread: [],
    lastEvaluatedDate: state.currentDate,
    generatedTriggerKeys: []
  };

  const linkedPost = req.linkedNewsPostId
    ? sp.newsFeed.find(n => n.id === req.linkedNewsPostId)
    : sp.newsFeed.find(n => n.isTransferRumor && n.relatedPlayerId === req.relatedPlayerId);

  const reactiveComments = generatePostInterviewSnsWave(
    state,
    req,
    choice,
    linkedPost,
    fact.hasFormalOffer
  );

  const shiftCredibility = (current: RumorCredibilityLevel): RumorCredibilityLevel => {
    if (choice.stance === 'confirm' || choice.stance === 'bold' || choice.stance === 'praise_player') {
      if (current === '誤報の可能性が高い' || current === '低い') return '普通';
      if (current === '普通') return '高い';
      return current;
    }
    if ((choice.stance === 'deny' || choice.stance === 'criticize_media') && !fact.hasFormalOffer) {
      if (current === '普通') return '低い';
      if (current === '低い') return '誤報の可能性が高い';
    }
    return current;
  };

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const reactionHeadline = `【監督取材】${state.manager.name}監督、${req.relatedPlayerName ? `${req.relatedPlayerName}の件` : '移籍市場'}に言及「${choice.label}」`;

  const updatedNewsFeed = linkedPost
    ? sp.newsFeed.map(post => {
        if (post.id !== linkedPost.id) return post;
        const nextCred = shiftCredibility(post.rumorCredibility || req.credibility || '普通');
        return {
          ...post,
          rumorCredibility: nextCred,
          waveCount: (post.waveCount || 1) + 1,
          lastWaveDate: state.currentDate,
          managerStatement: {
            stance: choice.stance,
            choiceLabel: choice.label,
            quote: answerText,
            date: state.currentDate
          },
          comments: [...reactiveComments, ...post.comments]
        };
      })
    : [
        {
          id: `sp_news_int_${req.id}`,
          date: state.currentDate,
          title: reactionHeadline,
          summary: `${userClub?.name || 'クラブ'}の${state.manager.name}監督が${req.mediaSource}の取材に応じ、「${answerText}」とコメントしました。`,
          category: 'transfer' as const,
          relatedClubId: userClub?.id,
          relatedPlayerId: req.relatedPlayerId,
          isRead: false,
          isTransferRumor: true,
          rumorScenario: req.scenario,
          rumorCredibility: shiftCredibility(req.credibility || '普通'),
          hasFormalOffer: fact.hasFormalOffer,
          transferStatusLabel: '監督コメント' as TransferNewsStatusLabel,
          mediaSource: req.mediaSource,
          waveCount: 1,
          lastWaveDate: state.currentDate,
          managerStatement: {
            stance: choice.stance,
            choiceLabel: choice.label,
            quote: answerText,
            date: state.currentDate
          },
          comments: reactiveComments
        },
        ...sp.newsFeed
      ].slice(0, 60);

  const updatedRumors = (state.transferRumors || []).map(r => {
    if (r.id !== req.rumorId && (!req.linkedNewsPostId || r.linkedNewsPostId !== req.linkedNewsPostId)) return r;
    const nextCred = shiftCredibility(r.credibility);
    return {
      ...r,
      lastUpdatedDate: state.currentDate,
      credibility: nextCred,
      status: choice.stance === 'deny' && !fact.hasFormalOffer ? ('debunked' as const) : r.status,
      managerRespondedStance: choice.stance,
      managerResponseQuote: answerText,
      managerResponseDate: state.currentDate
    };
  });

  const updatedPlayers = { ...state.players };
  const updatedNegotiations = { ...(state.negotiations || {}) };

  if (req.relatedPlayerId && updatedPlayers[req.relatedPlayerId]) {
    const p = { ...updatedPlayers[req.relatedPlayerId] };
    if (req.scenario === 'player_departure') {
      p.managerTrust = Math.max(15, Math.min(100, (p.managerTrust ?? 70) + choice.trustDelta));
      p.satisfaction = Math.max(15, Math.min(100, (p.satisfaction ?? 75) + Math.round(choice.trustDelta * 0.8)));
    } else if (choice.playerInterestDelta !== 0) {
      p.clubInterestScore = Math.max(10, Math.min(100, (p.clubInterestScore ?? 55) + choice.playerInterestDelta));
    }
    updatedPlayers[p.id] = p;

    if (updatedNegotiations[p.id]) {
      const existingNeg = updatedNegotiations[p.id];
      const currentProb = existingNeg.acquisitionProbability ?? 65;
      updatedNegotiations[p.id] = {
        ...existingNeg,
        interestScore: Math.max(10, Math.min(100, (existingNeg.interestScore ?? 55) + choice.playerInterestDelta)),
        acquisitionProbability: Math.max(
          5,
          Math.min(98, currentProb + Math.round(choice.playerInterestDelta * 0.5) - Math.round(choice.rivalPressureDelta * 0.3))
        )
      };
    }
  }

  interviews[idx] = {
    ...req,
    status: 'answered',
    chosenChoiceId: choice.id,
    answerText,
    answeredDate: state.currentDate,
    reactionHeadline
  };

  const nextBoard = Math.max(10, Math.min(100, (state.boardConfidence ?? 75) + choice.boardDelta));
  const nextFan = Math.max(10, Math.min(100, (state.fanApproval ?? 75) + choice.fanApprovalDelta));

  const pressNewsItem: NewsItem = {
    id: `news_tr_int_${Date.now()}_${req.id}`,
    date: state.currentDate,
    headline: reactionHeadline,
    body: `${req.mediaSource}の取材に対し、${state.manager.name}監督は「${answerText}」とコメント。SNSでは賛否・戦術・市場観点からの反応が広がっています。`,
    category: 'press',
    relatedClubId: userClub?.id,
    relatedPlayerId: req.relatedPlayerId,
    importance: 'medium'
  };

  return {
    updatedState: {
      ...state,
      boardConfidence: nextBoard,
      fanApproval: nextFan,
      players: updatedPlayers,
      negotiations: updatedNegotiations,
      transferRumors: updatedRumors,
      transferInterviews: interviews,
      news: [pressNewsItem, ...(state.news || [])].slice(0, 120),
      smartphone: {
        ...sp,
        newsFeed: updatedNewsFeed
      }
    },
    headline: reactionHeadline,
    reactiveComments,
    effectSummary: choice.effectSummary
  };
}

/**
 * Daily background processor:
 * - Expands existing major rumor posts with Wave-2 SNS reactions (no duplicate authors/texts).
 * - STRICT GROUNDING: NEVER fabricates speculative rumors for unlinked external players.
 *   Only seeds new rumor posts from genuine active negotiations, pending incoming offers,
 *   shortlist/declared-interest watchlist, explicitly transfer/loan-listed squad players, or window strategy.
 */
export function processDailyTransferRumorsAndWaves(state: GameWorldState, nextDate: string): GameWorldState {
  if (!state.userClubId) return state;
  const userClub = state.clubs[state.userClubId];
  if (!userClub) return state;

  let nextState = { ...state };
  const sp = nextState.smartphone;
  if (!sp) return nextState;

  // 1. Progressive wave expansion on recent rumor/transfer posts (waveCount === 1)
  const daySeed = hashString(`${nextDate}_${userClub.id}`);
  if (daySeed % 2 === 0) {
    const waveTarget = sp.newsFeed.find(
      p => p.isTransferRumor && (p.waveCount || 1) === 1 && p.date !== nextDate
    );
    if (waveTarget) {
      const existingAuthors = new Set(waveTarget.comments.map(c => c.author));
      const existingNormTexts = new Set(waveTarget.comments.map(c => normalizeForDedup(c.text)));
      const pObj = waveTarget.relatedPlayerId ? nextState.players[waveTarget.relatedPlayerId] : undefined;
      const signals = extractClubContextSignals(nextState, userClub);
      const morePersonas = pickPersonas(`${waveTarget.id}_wave2_${nextDate}`, 5, existingAuthors);
      const waveComments: SmartphoneNewsComment[] = [];

      morePersonas.forEach((persona, i) => {
        for (let v = 0; v < 8; v++) {
          const s = hashString(`${waveTarget.id}_w2_${nextDate}_${i}_v${v}`);
          const built = buildTransferRumorCommentText(
            persona,
            {
              kind: 'transfer_rumor',
              userClub,
              managerName: nextState.manager.name,
              player: pObj,
              otherClub: pObj ? nextState.clubs[pObj.clubId] : null,
              scenario: waveTarget.rumorScenario || 'linked_rumor',
              credibility: waveTarget.rumorCredibility || '普通',
              hasFormalOffer: Boolean(waveTarget.hasFormalOffer),
              date: nextDate,
              mediaSource: waveTarget.mediaSource || '現地メディア',
              state: nextState
            },
            signals,
            s
          );
          const norm = normalizeForDedup(built.text);
          if (!existingNormTexts.has(norm)) {
            existingNormTexts.add(norm);
            const likes = 14 + (s % 140);
            waveComments.push({
              id: `cmt_dailyw_${waveTarget.id}_${nextDate}_${i}`,
              author: persona.author,
              handle: persona.handle,
              avatar: { emoji: persona.emoji, bgClass: persona.bgClass },
              authorRole: persona.role,
              sentiment: built.sentiment,
              perspectiveLabel: built.perspectiveLabel,
              text: built.text,
              likes,
              reposts: Math.max(1, Math.round(likes * 0.14)),
              postedAt: `続報 ${i + 1}時間後`,
              wave: 2
            });
            break;
          }
        }
      });

      if (waveComments.length > 0) {
        nextState = {
          ...nextState,
          smartphone: {
            ...nextState.smartphone!,
            newsFeed: nextState.smartphone!.newsFeed.map(n =>
              n.id === waveTarget.id
                ? { ...n, waveCount: 2, lastWaveDate: nextDate, comments: [...waveComments, ...n.comments] }
                : n
            )
          }
        };
      }
    }
  }

  // Throttle new rumor seeding
  const triggerThreshold = nextState.isTransferWindowOpen ? 35 : 15;
  if ((daySeed % 100) >= triggerThreshold) {
    return nextState;
  }
  if ((nextState.transferRumors || []).some(r => r.createdDate === nextDate)) {
    return nextState;
  }

  const recentRumorPlayers = new Set((nextState.transferRumors || []).slice(0, 8).map(r => r.playerId).filter(Boolean));

  // Candidate Priority A: Active formal negotiations or competing clubs
  const activeNegs = Object.values(nextState.negotiations || {}).filter(
    n => n && ['club_negotiating', 'club_agreed', 'player_negotiating', 'terms_agreed'].includes(n.status) && !recentRumorPlayers.has(n.playerId)
  );
  if (activeNegs.length > 0) {
    const neg = activeNegs[daySeed % activeNegs.length];
    const p = nextState.players[neg.playerId];
    if (p) {
      const hasCompetition = (neg.competingOffers?.length || 0) > 0;
      const isHighFee = neg.currentBidFee >= 45000000 || neg.currentBidFee >= p.marketValue * 1.25;
      const scenario: TransferRumorScenario = hasCompetition
        ? 'competing_clubs'
        : neg.status === 'club_agreed'
          ? 'club_agreed'
          : neg.status === 'terms_agreed'
            ? 'terms_agreed'
            : isHighFee
              ? 'high_transfer_fee'
              : 'negotiation_started';
      return upsertTransferRumorAndPost(nextState, {
        scenario,
        player: p,
        otherClub: nextState.clubs[p.clubId] || null,
        estimatedFee: neg.currentBidFee,
        competingClubNames: neg.competingOffers?.map(o => o.clubName)
      });
    }
  }

  // Candidate Priority B: Pending incoming offers on user's players
  const pendingIncoming = (nextState.incomingOffers || []).filter(
    o => o.status === 'pending' && !recentRumorPlayers.has(o.playerId)
  );
  if (pendingIncoming.length > 0) {
    const offer = pendingIncoming[daySeed % pendingIncoming.length];
    const p = nextState.players[offer.playerId];
    if (p) {
      return upsertTransferRumorAndPost(nextState, {
        scenario: 'player_departure',
        player: p,
        otherClub: nextState.clubs[offer.buyerClubId] || null,
        estimatedFee: offer.fee
      });
    }
  }

  // Candidate Priority C: Declared-interest or shortlisted watchlist targets (strictly grounded)
  const declaredIds = (nextState.declaredInterestPlayerIds || []).filter(id => nextState.players[id] && !recentRumorPlayers.has(id));
  if (declaredIds.length > 0) {
    const p = nextState.players[declaredIds[daySeed % declaredIds.length]];
    return upsertTransferRumorAndPost(nextState, {
      scenario: 'linked_rumor',
      player: p,
      otherClub: nextState.clubs[p.clubId] || null,
      exactStatusLabel: '関心を示している'
    });
  }

  const shortlistIds = (nextState.shortlistPlayerIds || []).filter(id => nextState.players[id] && !recentRumorPlayers.has(id));
  if (shortlistIds.length > 0) {
    const p = nextState.players[shortlistIds[daySeed % shortlistIds.length]];
    return upsertTransferRumorAndPost(nextState, {
      scenario: 'shortlist_target',
      player: p,
      otherClub: nextState.clubs[p.clubId] || null,
      exactStatusLabel: '獲得候補として検討中'
    });
  }

  // Candidate Priority D: Explicitly transfer/loan-listed players at user club
  const listedUserPlayers = userClub.playerIds
    .map(id => nextState.players[id])
    .filter((p): p is Player => Boolean(p && (p.isTransferListed || p.isLoanListed) && !recentRumorPlayers.has(p.id)));
  if (listedUserPlayers.length > 0) {
    const p = listedUserPlayers[daySeed % listedUserPlayers.length];
    return upsertTransferRumorAndPost(nextState, {
      scenario: 'player_departure',
      player: p,
      otherClub: null
    });
  }

  // Candidate Priority E: Club-level reinforcement policy discussion (never invents fake player links!)
  if ((daySeed % 7) === 0) {
    return upsertTransferRumorAndPost(nextState, {
      scenario: 'reinforcement_policy'
    });
  }

  return nextState;
}
