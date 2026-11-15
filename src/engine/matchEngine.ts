import {
  MatchFixture,
  MatchEvent,
  MatchStats,
  MatchSubstitutionRecord,
  PlayerMatchStatSummary,
  TeamTactics,
  Player,
  Club,
  PlayerCondition,
  GoalDetail,
  CompetitionCategory,
  PenaltyShootoutResult,
  PenaltyKickerResult
} from '../types/game';
import { addDays, getCompetitionCategory } from './dateEngine';
import { isType2PlayerUnavailableOnDate } from './scoutEngine';

// Condition multiplier for calculations
export const CONDITION_MULTIPLIER: Record<PlayerCondition, number> = {
  pink: 1.08,    // 絶好調 (+8%)
  red: 1.04,     // 好調 (+4%)
  yellow: 1.00,  // 普通 (0%)
  cyan: 0.96,    // 不調 (-4%)
  purple: 0.92   // 絶不調 (-8%)
};

// -------------------------------------------------------------
// 【1. FINAL_MATCH_ELIGIBILITY_CHECK (試合直前・出場資格チェック)】
// -------------------------------------------------------------
export interface MatchEligibilityCheckResult {
  isEligible: boolean;
  errors: string[];
  ineligibleStarters: { player: Player; reason: string; badge: string }[];
  ineligibleBench: { player: Player; reason: string; badge: string }[];
  ineligibleAll: { player: Player; reason: string; badge: string; role: 'STARTER' | 'BENCH' }[];
  ineligiblePlayerIds: string[];
}

export function finalMatchEligibilityCheck(
  starters: string[],
  bench: string[],
  clubId: string,
  players: Record<string, Player>,
  currentDate?: string,
  competition?: string
): MatchEligibilityCheckResult {
  const errors: string[] = [];
  const ineligibleStarters: { player: Player; reason: string; badge: string }[] = [];
  const ineligibleBench: { player: Player; reason: string; badge: string }[] = [];
  const ineligibleAll: { player: Player; reason: string; badge: string; role: 'STARTER' | 'BENCH' }[] = [];
  const ineligiblePlayerIds: string[] = [];

  const compCategory: CompetitionCategory | undefined = competition ? getCompetitionCategory(competition) : undefined;

  const isPlayerSuspendedForCompetition = (p: Player): { isSuspended: boolean; reason: string } => {
    if (!p.suspension) return { isSuspended: false, reason: '' };

    // Requirement 5: If matchesRemaining is explicitly <= 0, player has finished serving suspension
    const matchesRem = p.suspension.matchesRemaining ?? 0;

    if (compCategory) {
      if (p.suspension.competitionSuspensions && p.suspension.competitionSuspensions[compCategory] !== undefined) {
        const remaining = p.suspension.competitionSuspensions[compCategory] || 0;
        if (remaining > 0) {
          return {
            isSuspended: true,
            reason: `出場停止処分中 (${compCategory} 残${remaining}試合)`
          };
        }
        return { isSuspended: false, reason: '' };
      }
      if (p.suspension.competitionCategory) {
        if (p.suspension.competitionCategory === compCategory) {
          if (matchesRem > 0 && p.suspension.isSuspended) {
            return {
              isSuspended: true,
              reason: `出場停止処分中 (${compCategory} 残${matchesRem}試合)`
            };
          }
        }
        return { isSuspended: false, reason: '' };
      }
    }

    if (p.suspension.isSuspended && matchesRem > 0) {
      return {
        isSuspended: true,
        reason: `出場停止処分中 (残${matchesRem}試合)`
      };
    }

    return { isSuspended: false, reason: '' };
  };

  // Check Starters
  starters.forEach(pId => {
    const p = players[pId];
    if (!p) {
      errors.push(`未登録の選手ID (${pId}) がスタメンに含まれています。`);
      ineligiblePlayerIds.push(pId);
      return;
    }

    if (p.clubId !== clubId) {
      const reason = `他クラブ所属 (${p.clubId})`;
      const badge = '【所属外】';
      errors.push(`【所属不一致】${p.name}選手は他クラブ所属のため出場できません。`);
      ineligibleStarters.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'STARTER' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
    const isBeforeReturnDate = currentDate && p.injuryReturnDate && p.injuryReturnDate > currentDate;

    if (isInjured || isBeforeReturnDate) {
      const returnDateStr = p.injuryReturnDate || p.injury?.returnDate || '診断中';
      const reason = `負傷中 (${p.injuryType || p.injury?.type || '負傷'} / 復帰予定: ${returnDateStr})`;
      const badge = '【負傷】';
      errors.push(`【負傷離脱中】${p.name}選手は現在負傷中のため、この試合には出場できません。(復帰予定: ${returnDateStr})`);
      ineligibleStarters.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'STARTER' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    const suspensionCheck = isPlayerSuspendedForCompetition(p);
    if (suspensionCheck.isSuspended) {
      const reason = suspensionCheck.reason;
      const badge = '【出場停止】';
      errors.push(`【出場停止中】${p.name}選手は${reason}のため出場できません。`);
      ineligibleStarters.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'STARTER' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    if (p.squadStatus === 'OUT_OF_SQUAD') {
      // Player was marked OUT_OF_SQUAD from prior injury/suspension but is now healthy and picked by manager
      p.squadStatus = 'STARTING';
    }

    // Type 2 High School availability check
    if (p.isType2Registered && isType2PlayerUnavailableOnDate(p, currentDate)) {
      const reason = `高校公式戦・選手権出場のため出場不可 (${p.type2HighSchool || '提携高校'})`;
      const badge = '【2種不出場】';
      errors.push(`【2種登録選手日程重複】${p.name}選手は高校公式戦（全国選手権・総体等）のため本試合に出場できません。`);
      ineligibleStarters.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'STARTER' });
      ineligiblePlayerIds.push(pId);
      return;
    }
  });

  // Check Bench (max 9 limit & healthy check)
  if (bench.length > 9) {
    errors.push(`ベンチ登録人数が上限（最大9名）を超えています（現在${bench.length}名）。`);
  }

  bench.forEach(pId => {
    const p = players[pId];
    if (!p) return;

    if (p.clubId !== clubId) {
      const reason = `他クラブ所属 (${p.clubId})`;
      const badge = '【所属外】';
      errors.push(`【所属不一致】ベンチの${p.name}選手は他クラブ所属のため登録できません。`);
      ineligibleBench.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'BENCH' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
    const isBeforeReturnDate = currentDate && p.injuryReturnDate && p.injuryReturnDate > currentDate;

    if (isInjured || isBeforeReturnDate) {
      const returnDateStr = p.injuryReturnDate || p.injury?.returnDate || '診断中';
      const reason = `負傷中 (${p.injuryType || p.injury?.type || '負傷'} / 復帰予定: ${returnDateStr})`;
      const badge = '【負傷】';
      errors.push(`【ベンチ負傷警告】${p.name}選手は負傷中のためベンチ登録できません。(復帰予定: ${returnDateStr})`);
      ineligibleBench.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'BENCH' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    const suspensionCheck = isPlayerSuspendedForCompetition(p);
    if (suspensionCheck.isSuspended) {
      const reason = suspensionCheck.reason;
      const badge = '【出場停止】';
      errors.push(`【ベンチ停止警告】${p.name}選手は${reason}のためベンチ登録できません。`);
      ineligibleBench.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'BENCH' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    // Type 2 High School availability check for bench
    if (p.isType2Registered && isType2PlayerUnavailableOnDate(p, currentDate)) {
      const reason = `高校公式戦のためベンチ不可 (${p.type2HighSchool || '提携高校'})`;
      const badge = '【2種不出場】';
      errors.push(`【2種登録選手日程重複】ベンチの${p.name}選手は高校公式戦のため本試合にベンチ入りできません。`);
      ineligibleBench.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'BENCH' });
      ineligiblePlayerIds.push(pId);
      return;
    }
  });

  return {
    isEligible: errors.length === 0,
    errors,
    ineligibleStarters,
    ineligibleBench,
    ineligibleAll,
    ineligiblePlayerIds
  };
}

// Effective player power calculation
export function calculateEffectivePlayerPower(player: Player): number {
  if (player.injuryStatus === 'INJURED' || player.injury?.isInjured || player.suspension?.isSuspended) {
    return 0;
  }
  const condMult = CONDITION_MULTIPLIER[player.condition] || 1.0;
  const fatiguePenalty = Math.max(0.72, 1 - (player.fatigue / 250));
  return player.ovr * condMult * fatiguePenalty;
}

// -------------------------------------------------------------
// 【2. 疲労に応じた怪我リスク計算 (FATIGUE INJURY RISK SYSTEM)】
// -------------------------------------------------------------
export function calculatePlayerInjuryRisk(
  player: Player,
  minute: number,
  pressIntensity: string,
  isCongestedSchedule: boolean = false,
  injuryFrequencySetting: 'low' | 'normal' | 'high' = 'low'
): number {
  // If already injured or suspended, skip
  if (player.injuryStatus === 'INJURED' || player.injury?.isInjured) return 0;

  // Rebalanced Base Risk per match phase check (Requirement 2: 怪我の発生頻度を大幅に下げる)
  // Fatigue-scaled staged probability
  let baseRisk = 0.00006;
  if (player.fatigue <= 35) {
    baseRisk = 0.00006; // 通常状態: 低確率
  } else if (player.fatigue <= 55) {
    baseRisk = 0.00015; // 疲労中: 少し上昇
  } else if (player.fatigue <= 75) {
    baseRisk = 0.00040; // 高疲労: 明確に上昇
  } else if (player.fatigue <= 88) {
    baseRisk = 0.00085; // かなり高疲労
  } else {
    baseRisk = 0.00160; // 極端な高疲労: 上昇
  }

  let multiplier = 1.0;

  // Difficulty settings multiplier: Default to 'low' (少ない) as required
  const diffMod = injuryFrequencySetting === 'low' ? 0.35 : injuryFrequencySetting === 'high' ? 1.4 : 0.70;
  multiplier *= diffMod;

  // Age factor (>31 slightly elevated, >34 moderately elevated)
  if (player.age >= 34) {
    multiplier *= 1.25;
  } else if (player.age >= 31) {
    multiplier *= 1.12;
  }

  // Tactical press factor
  if (pressIntensity === '非常に激しい' || pressIntensity === 'ゲーゲンプレス') {
    multiplier *= 1.20;
  }

  // Match minute factor (muscular fatigue late in match)
  if (minute >= 75) {
    multiplier *= 1.25;
  } else if (minute >= 60) {
    multiplier *= 1.10;
  }

  // Congested schedule factor
  if (isCongestedSchedule) {
    multiplier *= 1.20;
  }

  // Sane strict ceiling to prevent absurd pileup of injuries
  return Math.min(0.005, baseRisk * multiplier);
}

// Authentic injury types and recovery ranges: Weighted towards minor knocks/sprains (Requirement 2)
export const INJURY_VARIETIES = [
  // 軽傷 (3日〜10日) - 大半を占める
  { name: '足首の軽い捻挫', days: 5, weight: 28 },
  { name: '打撲 (軽度)', days: 4, weight: 25 },
  { name: 'ふくらはぎの張り', days: 6, weight: 22 },
  { name: '内転筋の違和感', days: 7, weight: 18 },
  { name: '足首捻挫 (軽度)', days: 10, weight: 15 },
  // 中程度 (2週間〜4週間)
  { name: 'ハムストリング肉離れ (軽度)', days: 14, weight: 8 },
  { name: '大腿四頭筋肉離れ (軽度)', days: 16, weight: 6 },
  { name: '肩鎖関節脱臼 (軽度)', days: 18, weight: 4 },
  // 重傷 (長期離脱) - 非常に低確率 (< 3%)
  { name: '膝内側側副靭帯損傷', days: 35, weight: 1.5 },
  { name: '中足骨骨折', days: 50, weight: 0.8 }
];

export function getRandomWeightedInjury(): { name: string; days: number } {
  const total = INJURY_VARIETIES.reduce((acc, i) => acc + i.weight, 0);
  let r = Math.random() * total;
  for (const inj of INJURY_VARIETIES) {
    r -= inj.weight;
    if (r <= 0) return { name: inj.name, days: inj.days };
  }
  return { name: INJURY_VARIETIES[0].name, days: INJURY_VARIETIES[0].days };
}

/**
 * Requirement 3: レッドカードの危険性・悪質性に応じた出場停止試合数の動的判定
 * - 比較的軽い退場（2枚目警告など）：1試合
 * - 通常の退場（DOGSO・決定機阻止など）：1〜2試合
 * - 危険なプレー（危険な足裏タックル）：2〜4試合
 * - 非常に悪質な行為（乱闘・暴力行為）：5〜8試合
 * - 極めて重大な行為（審判侮辱・重大反則）：最大10試合（極めて稀・約1%）
 */
export interface RedCardDetails {
  matchesRemaining: number;
  reason: string;
  reasonEn: string;
  severity: 'minor' | 'standard' | 'dangerous' | 'violent' | 'egregious';
}

export function determineRedCardSeverityAndSuspension(isSecondYellow: boolean, rng: () => number = Math.random): RedCardDetails {
  if (isSecondYellow) {
    return {
      matchesRemaining: 1,
      reason: '累積警告（イエローカード2枚目）による退場',
      reasonEn: 'Sent off for two yellow cards (Second Caution)',
      severity: 'minor'
    };
  }

  const roll = rng();
  if (roll < 0.55) {
    const matches = rng() < 0.5 ? 1 : 2;
    return {
      matchesRemaining: matches,
      reason: '決定機阻止（DOGSO）による一発退場',
      reasonEn: 'Direct red card for denying an obvious goal-scoring opportunity (DOGSO)',
      severity: 'standard'
    };
  } else if (roll < 0.90) {
    const matches = 2 + Math.floor(rng() * 3); // 2, 3, or 4
    return {
      matchesRemaining: matches,
      reason: '危険なタックル（足裏・過度な力）による一発退場',
      reasonEn: 'Direct red card for serious foul play (Reckless studs-up challenge)',
      severity: 'dangerous'
    };
  } else if (roll < 0.99) {
    const matches = 5 + Math.floor(rng() * 4); // 5, 6, 7, or 8
    return {
      matchesRemaining: matches,
      reason: '乱闘・相手選手への暴力行為による退場処分',
      reasonEn: 'Direct red card for violent conduct / physical altercation',
      severity: 'violent'
    };
  } else {
    return {
      matchesRemaining: 10,
      reason: '主審への異議・極めて悪質な重大違反行為による長期出場停止処分',
      reasonEn: 'Direct red card for extreme gross misconduct / assaulting match officials (Max 10 matches)',
      severity: 'egregious'
    };
  }
}

// Commentary pools
const GOAL_COMMENTARIES = [
  (s: string, a?: string) => `【GOAL!!】${s}がディフェンスラインの裏へ抜け出し、冷静にGKの脇を抜く技ありゴール！${a ? ` (${a}の見事なスルーパス)` : ''}`,
  (s: string, a?: string) => `【GOAL!!】右サイドからの鋭いクロスに${s}が完璧なタイミングでヘディングを叩き込む！${a ? ` (アシスト: ${a})` : ''}`,
  (s: string, a?: string) => `【GOAL!!】混戦のペナルティエリアから${s}が電光石火の反転シュート！ネットを揺らす！${a ? ` (ラストパス: ${a})` : ''}`,
  (s: string) => `【GOAL!!】${s}がペナルティエリア外から放った強烈なミドルシュートがゴール左上隅へ突き刺さるゴラッソ！`,
  (s: string, a?: string) => `【GOAL!!】素早いカウンターが炸裂！${s}がダイレクトボレーでフィニッシュ！${a ? ` (${a}の絶妙クロス)` : ''}`,
  (s: string, a?: string) => `【GOAL!!】CKから${s}がマークを外して打点の高いヘディングシュート！ゴールネットを揺らす！${a ? ` (キッカー: ${a})` : ''}`,
  (s: string, a?: string) => `【GOAL!!】中央での流れるようなワンツーパスから${s}が抜け出し、落ち着いてゴール右隅へ流し込んだ！${a ? ` (お膳立て: ${a})` : ''}`,
  (s: string) => `【GOAL!!】直接FKのチャンス！${s}が壁の上を巻く美しい弾道で直接ネットを揺らした！芸術的な一撃！`,
  (s: string, a?: string) => `【GOAL!!】左サイド深く切れ込んだ${a || '味方'}のグラウンダーのマイナスクロスに、走り込んだ${s}が右足インサイドで確実に合わせた！`,
  (s: string) => `【GOAL!!】相手GKの弾いたこぼれ球に電光石火で詰めた${s}が押し込みゴール！泥臭く貴重な1点！`,
  (s: string, a?: string) => `【GOAL!!】ショートカウンター発動！相手DFの間を切り裂くスルーパスから${s}がGKとの1対1をループシュートで制した！${a ? ` (アシスト: ${a})` : ''}`,
  (s: string) => `【GOAL!!】${s}が自らドリブルでバイタルエリアに侵入、鋭いフェイントでDFを剥がして右足を一閃！文句なしのスーパーゴール！`,
  (s: string, a?: string) => `【GOAL!!】ファーサイドへの浮き球クロスを${s}が身体を投げ出すダイビングヘッドで叩き込んだ！スタジアム熱狂！${a ? ` (ピンポイントクロス: ${a})` : ''}`,
  (s: string) => `【PK成功！】PA内でのファウルにより獲得したPK。キッカーの${s}がプレッシャーをものともせずGKの逆を突いて成功！`
];

const WOODWORK_COMMENTARIES = [
  (p: string) => `【決定機逸】${p}がペナルティエリア中央から強烈なシュートを放つも、惜しくもクロスバー直撃！`,
  (p: string) => `【ポスト直撃！】${p}が左足を振り抜くが、ボールは左ポストを叩いて跳ね返る！スタジアムがどよめく！`,
  (p: string) => `【惜しいシュート】${p}のミドルシュートが右ポストをかすめて枠外へ。決定的なチャンスでした。`,
  (p: string) => `【バー直撃！】${p}の放ったドライブシュートが鋭く落ちるが、惜しくもバーを叩いてグラウンドへ跳ね返る！`,
  (p: string) => `【枠外の強襲！】角度のない位置から${p}が強引に狙った一撃は惜しくもサイドネットの外側を揺らす！`
];

const SAVE_COMMENTARIES = [
  (gk: string, shooter: string) => `【ファインセーブ！】${shooter}の決定的なシュートを相手守護神${gk}が驚異的な反応で横っ飛びセーブ！`,
  (gk: string, shooter: string) => `【ビッグセーブ！】1対1の絶体絶命のピンチを${gk}が足一本で防ぎ切る！`,
  (gk: string, shooter: string) => `【スーパーセーブ】至近距離からの${shooter}のヘディングシュートを${gk}が右手一本でバーの上へ弾き出す！`,
  (gk: string, shooter: string) => `【神反応！】ディフレクションした不規則なシュートを${gk}が逆を突かれながらも驚異のリカバリーで右手で掻き出した！`,
  (gk: string, shooter: string) => `【ゴールライン上の死守！】${shooter}の決定的なループシュートを${gk}がバックステップからの決死の指先タッチでCKへ逃れる！`
];

export function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function createPRNG(seed: number) {
  let s = Math.abs(seed) % 2147483647;
  if (s === 0) s = 123456789;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Requirements 5, 6, 14: 選手OVRの試合活躍による長期的成長・衰退システム
 * - 1試合で急激に変化しない（78 -> 78.2 -> 79...）
 * - 複数試合・一定期間の成績（好調持続で+1〜+2、大活躍で+2〜+4、長期低調で低下）
 * - ポジション別評価（GK/DF/MF/FW）
 * - 若手(<=22歳)は成長しやすく、ベテラン(>=33歳)は緩やかな減退（活躍時は維持向上）
 */
export function processPlayerPerformanceGrowth(
  player: Player,
  performance: {
    rating: number;
    minutes?: number;
    goals?: number;
    assists?: number;
    cleanSheet?: boolean;
    isMotm?: boolean;
    saves?: number;
    tackles?: number;
    passesCompleted?: number;
  }
): Player {
  const currentExact = player.exactOvr ?? player.ovr;
  const history = [...(player.matchRatingsHistory || []), performance.rating].slice(-10);
  const avgRating = history.reduce((a, b) => a + b, 0) / history.length;

  let delta = 0;

  // 1. Single-match rating contribution
  if (performance.rating >= 8.5) {
    delta += 0.08;
  } else if (performance.rating >= 7.5) {
    delta += 0.04;
  } else if (performance.rating >= 6.8) {
    delta += 0.02;
  } else if (performance.rating <= 5.5) {
    delta -= 0.04;
  }

  // 2. Position-specific performance evaluations
  const pos = player.position;
  const isGK = pos === 'GK';
  const isDF = ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);
  const isMF = ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos);
  const isFW = ['ST', 'CF', 'LW', 'RW'].includes(pos);

  if (isGK) {
    if (performance.cleanSheet) delta += 0.05;
    if (performance.saves && performance.saves >= 4) delta += 0.04;
  } else if (isDF) {
    if (performance.cleanSheet) delta += 0.04;
    if (performance.tackles && performance.tackles >= 3) delta += 0.03;
    if (performance.goals && performance.goals > 0) delta += 0.05; // Set piece goal
  } else if (isMF) {
    if (performance.assists && performance.assists > 0) delta += Math.min(0.06, performance.assists * 0.03);
    if (performance.goals && performance.goals > 0) delta += Math.min(0.06, performance.goals * 0.03);
    if (performance.passesCompleted && performance.passesCompleted >= 40) delta += 0.03;
  } else if (isFW) {
    if (performance.goals && performance.goals > 0) delta += Math.min(0.08, performance.goals * 0.04);
    if (performance.assists && performance.assists > 0) delta += Math.min(0.04, performance.assists * 0.02);
  }

  if (performance.isMotm) {
    delta += 0.05;
  }

  // 3. Multi-match streak & slump evaluation
  if (history.length >= 3) {
    if (avgRating >= 7.8) {
      // Consistent standout form bonus
      delta += 0.12;
    } else if (avgRating >= 7.2) {
      delta += 0.05;
    } else if (avgRating <= 5.8) {
      // Prolonged slump penalty (causes gradual OVR decline)
      delta -= 0.12;
    }
  }

  // 4. Age factor (young players develop faster, veterans decline unless in top form)
  if (player.age <= 22) {
    if (delta > 0) delta *= 1.4;
  } else if (player.age >= 33) {
    if (delta > 0) {
      delta *= 0.75; // Veterans can still improve if performing well
    } else {
      delta *= 1.35; // Natural age-related slump tendency
    }
  }

  const potentialCap = Math.min(99, player.potential || (player.ovr + 5));
  const floorCap = Math.max(50, player.ovr - 5);

  let newExact = currentExact + delta;
  newExact = Math.max(floorCap, Math.min(potentialCap, newExact));
  const roundedExact = Math.round(newExact * 10) / 10;
  const newIntOvr = Math.round(roundedExact);

  // Sync core physical and technical attributes proportionally to OVR change
  const diff = newIntOvr - player.ovr;
  const updatedAttributes = {
    pace: player.pace,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
    physical: player.physical,
    gk: player.gk
  };

  if (diff !== 0) {
    if (isGK) {
      updatedAttributes.gk = Math.max(50, Math.min(99, player.gk + diff));
      updatedAttributes.passing = Math.max(50, Math.min(99, player.passing + Math.round(diff * 0.5)));
    } else if (isFW) {
      updatedAttributes.shooting = Math.max(50, Math.min(99, player.shooting + diff));
      updatedAttributes.pace = Math.max(50, Math.min(99, player.pace + Math.round(diff * 0.5)));
    } else if (isMF) {
      updatedAttributes.passing = Math.max(50, Math.min(99, player.passing + diff));
      updatedAttributes.dribbling = Math.max(50, Math.min(99, player.dribbling + diff));
    } else {
      updatedAttributes.defending = Math.max(50, Math.min(99, player.defending + diff));
      updatedAttributes.physical = Math.max(50, Math.min(99, player.physical + diff));
    }
  }

  return {
    ...player,
    ...updatedAttributes,
    exactOvr: roundedExact,
    ovr: newIntOvr,
    matchRatingsHistory: history
  };
}

/**
 * Requirement 1: Generate comprehensive, concrete goal narrative and metadata
 */
export function generateGoalDetail(
  scorer: Player,
  assister: Player | undefined,
  isFoulPenalty: boolean,
  isOwnGoal: boolean,
  rng: () => number,
  minute: number
): GoalDetail {
  if (isFoulPenalty) {
    const shotFoot = scorer.preferredFoot === '左' ? '左足' : '右足';
    const corners = ['ゴール右隅', 'ゴール左隅', 'ゴールネット中央', 'ゴール右上', 'ゴール左上'];
    const chosenCorner = corners[Math.floor(rng() * corners.length)];
    const narrative = `【PK成功】${minute}分、ペナルティエリア内でのファウルにより獲得したPK。重圧がかかる場面でキッカーの${scorer.name}がGKの逆を突いて${shotFoot}で冷静に${chosenCorner}へ流し込んだ！`;
    return {
      minute,
      scorerId: scorer.id,
      scorerName: scorer.name,
      attackOrigin: 'penalty',
      passType: 'none',
      dribbleType: 'none',
      shotType: 'penalty_kick',
      shotLocation: 'penalty_area_central',
      shotFoot,
      narrative
    };
  }

  if (isOwnGoal) {
    const narrative = `【オウンゴール】${minute}分、ゴール前への鋭いクロスが相手DFに当たってディフレクション。不運にもそのままゴールマウスへ吸い込まれた！`;
    return {
      minute,
      scorerId: scorer.id,
      scorerName: `${scorer.name} (OG)`,
      attackOrigin: 'own_goal',
      passType: 'cross',
      dribbleType: 'none',
      shotType: 'own_goal_deflection',
      shotLocation: 'six_yard_box',
      shotFoot: '胸・その他',
      narrative
    };
  }

  const foot = scorer.preferredFoot === '左' ? '左足' : (scorer.preferredFoot === '右' ? '右足' : (rng() < 0.5 ? '右足' : '左足'));
  const isCB = ['CB', 'LB', 'RB'].includes(scorer.position);
  const isWinger = ['LW', 'RW', 'LM', 'RM'].includes(scorer.position);

  const roll = rng();
  let attackOrigin: GoalDetail['attackOrigin'] = 'possession';
  let passType: GoalDetail['passType'] = 'short_pass';
  let dribbleType: GoalDetail['dribbleType'] = 'none';
  let shotType: GoalDetail['shotType'] = 'placed_shot';
  let shotLocation: GoalDetail['shotLocation'] = 'penalty_area_central';
  let shotFoot: GoalDetail['shotFoot'] = foot;
  let narrative = '';

  if (isCB || roll < 0.18) {
    // Set piece / Corner kick / Free kick
    attackOrigin = 'set_piece';
    passType = 'cross';
    shotLocation = roll < 0.10 ? 'six_yard_box' : 'penalty_area_central';
    shotType = 'header';
    shotFoot = '頭';
    const cornerSide = rng() < 0.5 ? 'ニアサイド' : 'ファーサイド';
    const assistText = assister ? `${assister.name}の高精度なCK` : 'CKからの正確なクロス';
    narrative = `${minute}分、${assistText}が${cornerSide}へ供給される。マークを外してフリーになった${scorer.name}が打点の高いヘディングで合わせ、豪快にゴールネットを揺らした！${scorer.name}のゴール！`;
  } else if (roll < 0.40) {
    // Counter Attack & Through ball
    attackOrigin = 'counter';
    passType = 'through_ball';
    dribbleType = 'burst_speed';
    shotLocation = 'penalty_area_central';
    shotType = rng() < 0.3 ? 'chip' : 'placed_shot';
    const finishDesc = shotType === 'chip' 
      ? `飛び出してきたGKの頭上をふわりと越す鮮やかなループシュートを決めた！` 
      : `GKとの1対1を制して冷静にゴール隅へ流し込んだ！`;
    const assistText = assister ? `${assister.name}のディフェンスラインを切り裂く絶妙なスルーパス` : '素早いカウンターからのスルーパス';
    narrative = `${minute}分、中盤でボールを奪取したチームが電光石火のカウンターを開始。${assistText}に完璧なタイミングで抜け出した${scorer.name}が、${finishDesc}${scorer.name}のゴール！`;
  } else if (roll < 0.65) {
    // Flank break & Cross / Cutback
    attackOrigin = 'flank_break';
    passType = rng() < 0.5 ? 'cross' : 'cutback';
    const flank = rng() < 0.5 ? '右サイド' : '左サイド';
    if (passType === 'cross') {
      shotLocation = 'penalty_area_central';
      shotType = rng() < 0.45 ? 'header' : 'volley';
      shotFoot = shotType === 'header' ? '頭' : foot;
      const shotAction = shotType === 'header' ? '頭で強烈に叩き込み' : `${shotFoot}の鮮烈なダイレクトボレーで捉え`;
      const assistText = assister ? `${flank}を単独突破した${assister.name}がゴール前へピンポイントクロス。` : `${flank}を鮮やかに崩してゴール前へクロス。`;
      narrative = `${minute}分、${assistText}中央に猛スピードで走り込んだ${scorer.name}が${shotAction}、GKの伸ばした手を弾いてネットを揺らした！${scorer.name}のゴール！`;
    } else {
      shotLocation = 'penalty_area_central';
      shotType = 'placed_shot';
      shotFoot = foot;
      const assistText = assister ? `${flank}深くえぐった${assister.name}からの鋭いマイナスの折り返し。` : `${flank}深く切り込んだマイナスの折り返し。`;
      narrative = `${minute}分、${assistText}ペナルティエリア内に走り込んだ${scorer.name}がダイレクトで${shotFoot}を合わせ、冷静にゴール右隅へ沈めた！${scorer.name}のゴール！`;
    }
  } else if (roll < 0.85) {
    // Cut inside / Solo dribble / Vital area drive
    attackOrigin = 'possession';
    passType = assister ? 'short_pass' : 'none';
    dribbleType = isWinger ? 'cut_inside' : 'feint';
    shotLocation = rng() < 0.5 ? 'box_edge' : 'long_range';
    shotType = rng() < 0.5 ? 'power_drive' : 'curler';
    shotFoot = foot;
    const shotDesc = shotType === 'curler' ? '美しい弧を描くコントロールカーブ' : '強烈なミドルシュート';
    const assistText = assister ? `${assister.name}から横パスを受けた` : '';
    narrative = `${minute}分、${assistText}${scorer.name}がバイタルエリアで前を向き、鋭いフェイントで相手DFを剥がして${shotFoot}を一閃。放たれた${shotDesc}がゴール枠右上隅へ突き刺さるゴラッソ！${scorer.name}のスーパーゴール！`;
  } else {
    // High press turnover / Quick tap in
    attackOrigin = 'high_press';
    passType = assister ? 'short_pass' : 'none';
    dribbleType = 'none';
    shotLocation = 'six_yard_box';
    shotType = 'tap_in';
    shotFoot = foot;
    const assistText = assister ? `${assister.name}が相手GKとDFの連携ミスを見逃さず奪い、ラストパス。フリーの` : '相手陣内深くでの激しいハイプレスからボールを奪取。';
    narrative = `${minute}分、${assistText}${scorer.name}がこぼれ球に電光石火の反応を見せて${shotFoot}で確実に押し込んだ！貴重な追加点！${scorer.name}のゴール！`;
  }

  return {
    minute,
    scorerId: scorer.id,
    scorerName: scorer.name,
    assistId: assister?.id,
    assistName: assister?.name,
    attackOrigin,
    passType,
    dribbleType,
    shotType,
    shotLocation,
    shotFoot,
    narrative
  };
}

// Requirement 1, 13 & 14: Check whether a fixture requires a decider (ET / PK)
export function isMatchRequiringDecider(fixture: MatchFixture): { requiresDecider: boolean; isTwoLeggedSecondLeg: boolean } {
  if (fixture.needsDecider) {
    return { requiresDecider: true, isTwoLeggedSecondLeg: false };
  }
  if (['premier-league', 'championship', 'laliga', 'segunda-division', 'serie-a', 'serie-b', 'bundesliga', '2-bundesliga', 'ligue-1', 'ligue-2', 'j1-league', 'j2-league', 'j3-league', 'super-lig', 'primeira-liga', 'eredivisie', 'pro-league'].includes(fixture.competition)) {
    return { requiresDecider: false, isTwoLeggedSecondLeg: false };
  }
  if (fixture.competition === 'pre-season' || fixture.competitionType === 'preseason') {
    return { requiresDecider: false, isTwoLeggedSecondLeg: false };
  }
  // League phase of European competitions or matchday fixtures
  if (fixture.round?.includes('リーグフェーズ') || fixture.round?.includes('League Phase') || (fixture.round && /第\d+節/.test(fixture.round))) {
    return { requiresDecider: false, isTwoLeggedSecondLeg: false };
  }

  // 2-legged ties (Requirements 13 & 14)
  const isLeg1 = fixture.leg === 1 ||
                 fixture.round?.includes('Leg 1') ||
                 fixture.round?.includes('1st Leg') ||
                 fixture.round?.includes('1st') ||
                 fixture.round?.includes('第1戦') ||
                 fixture.competitionName?.includes('第1戦');
  if (isLeg1) {
    return { requiresDecider: false, isTwoLeggedSecondLeg: false };
  }

  const isLeg2 = fixture.leg === 2 ||
                 fixture.round?.includes('Leg 2') ||
                 fixture.round?.includes('2nd Leg') ||
                 fixture.round?.includes('2nd') ||
                 fixture.round?.includes('第2戦') ||
                 fixture.competitionName?.includes('第2戦');
  if (isLeg2) {
    return { requiresDecider: true, isTwoLeggedSecondLeg: true };
  }

  const isCup = (fixture.competitionType as string) === 'cup' || 
                (fixture.competitionType as string) === 'tournament' ||
                fixture.competitionType === 'domestic_cup' ||
                fixture.competitionType === 'continental_competition' ||
                fixture.competition.includes('cup') || 
                fixture.competition === 'copa-del-rey' || 
                fixture.competition === 'dfb-pokal' || 
                fixture.competition === 'coppa-italia' || 
                fixture.competition === 'coupe-de-france' ||
                fixture.competition === 'ucl' ||
                fixture.competition === 'uel' ||
                fixture.competition === 'uecl' ||
                fixture.round?.includes('決勝') ||
                fixture.round?.includes('準決勝') ||
                fixture.round?.includes('準々決勝') ||
                fixture.round?.includes('回戦');
  if (isCup) {
    return { requiresDecider: true, isTwoLeggedSecondLeg: false };
  }
  return { requiresDecider: false, isTwoLeggedSecondLeg: false };
}

// -------------------------------------------------------------
// 【PK戦シミュレーション（キッカーごとの成功・失敗および勝者決定）】
// -------------------------------------------------------------
export function simulatePenaltyShootoutKickers(
  homeClub: Club,
  awayClub: Club,
  homeStarters: (Player | { id: string; name: string; shooting?: number })[],
  awayStarters: (Player | { id: string; name: string; shooting?: number })[],
  rng: () => number = Math.random
): PenaltyShootoutResult {
  const kickers: PenaltyKickerResult[] = [];
  let homeScore = 0;
  let awayScore = 0;

  const hList = homeStarters.length > 0 ? homeStarters : [{ id: 'h_1', name: `${homeClub.name} キッカー1` }];
  const aList = awayStarters.length > 0 ? awayStarters : [{ id: 'a_1', name: `${awayClub.name} キッカー1` }];

  // 1. Regular 5 kicks
  for (let k = 1; k <= 5; k++) {
    const homePlayer = hList[(k - 1) % hList.length];
    const hShooting = homePlayer.shooting || 72;
    const hProb = Math.max(0.62, Math.min(0.90, 0.76 + (hShooting - 70) * 0.003));
    const hScored = rng() < hProb;
    if (hScored) homeScore++;
    kickers.push({
      round: k,
      clubId: homeClub.id,
      playerId: homePlayer.id,
      playerName: homePlayer.name,
      scored: hScored,
      scoreAfter: [homeScore, awayScore]
    });

    // Check early clinch after home kick if away cannot catch up
    const awayRemainingBefore = 5 - (k - 1);
    if (homeScore > awayScore + awayRemainingBefore) break;

    const awayPlayer = aList[(k - 1) % aList.length];
    const aShooting = awayPlayer.shooting || 72;
    const aProb = Math.max(0.62, Math.min(0.90, 0.76 + (aShooting - 70) * 0.003));
    const aScored = rng() < aProb;
    if (aScored) awayScore++;
    kickers.push({
      round: k,
      clubId: awayClub.id,
      playerId: awayPlayer.id,
      playerName: awayPlayer.name,
      scored: aScored,
      scoreAfter: [homeScore, awayScore]
    });

    const remKicks = 5 - k;
    if (homeScore > awayScore + remKicks || awayScore > homeScore + remKicks) {
      break;
    }
  }

  // 2. Sudden death if tied
  let currentRound = Math.floor(kickers.length / 2) + 1;
  let safetyLimit = 0;
  while (homeScore === awayScore && safetyLimit < 15) {
    safetyLimit++;
    const homePlayer = hList[(currentRound - 1) % hList.length];
    const awayPlayer = aList[(currentRound - 1) % aList.length];

    const hScored = rng() < 0.72;
    if (hScored) homeScore++;
    kickers.push({
      round: currentRound,
      clubId: homeClub.id,
      playerId: homePlayer.id,
      playerName: homePlayer.name,
      scored: hScored,
      scoreAfter: [homeScore, awayScore]
    });

    const aScored = rng() < 0.72;
    if (aScored) awayScore++;
    kickers.push({
      round: currentRound,
      clubId: awayClub.id,
      playerId: awayPlayer.id,
      playerName: awayPlayer.name,
      scored: aScored,
      scoreAfter: [homeScore, awayScore]
    });

    currentRound++;
    if (homeScore !== awayScore) break;
  }

  // 3. Fallback decider
  if (homeScore === awayScore) {
    homeScore++;
    const finalHPlayer = hList[0];
    kickers.push({
      round: currentRound,
      clubId: homeClub.id,
      playerId: finalHPlayer.id,
      playerName: finalHPlayer.name,
      scored: true,
      scoreAfter: [homeScore, awayScore]
    });
  }

  const winnerClubId = homeScore > awayScore ? homeClub.id : awayClub.id;

  return {
    homeScore,
    awayScore,
    winnerClubId,
    kickers
  };
}

// -------------------------------------------------------------
// 【純粋ヘルパー：交代・退場・負傷に伴うフォーメーション＆ベンチ即時同期】
// -------------------------------------------------------------
export function applySubstitutionToTactics(
  tactics: TeamTactics,
  outPlayerId: string,
  inPlayerId: string
): TeamTactics {
  if (!outPlayerId || !inPlayerId || outPlayerId === inPlayerId) return tactics;
  const currentStarters = tactics.lineup?.starters || [];
  const hasOut = currentStarters.some(s => s.playerId === outPlayerId);
  const newStarters = hasOut
    ? currentStarters.map(s => (s.playerId === outPlayerId ? { ...s, playerId: inPlayerId } : s))
    : currentStarters;

  // Remove BOTH incoming player and outgoing player from active selectable bench
  const newBench = (tactics.lineup?.bench || []).filter(
    id => id !== inPlayerId && id !== outPlayerId
  );

  const existingReserves = tactics.lineup?.reserves || [];
  const newReserves = existingReserves.filter(id => id !== inPlayerId && id !== outPlayerId);
  if (hasOut) {
    newReserves.push(outPlayerId);
  }

  return {
    ...tactics,
    lineup: {
      starters: newStarters,
      bench: newBench,
      reserves: newReserves
    }
  };
}

export function removePlayerFromTacticsPitch(
  tactics: TeamTactics,
  playerId: string
): TeamTactics {
  if (!playerId) return tactics;
  return {
    ...tactics,
    lineup: {
      starters: (tactics.lineup?.starters || []).filter(s => s.playerId !== playerId),
      bench: (tactics.lineup?.bench || []).filter(id => id !== playerId),
      reserves: (tactics.lineup?.reserves || []).filter(id => id !== playerId)
    }
  };
}

export function applyMatchEventToTactics(
  tactics: TeamTactics,
  clubId: string,
  event: MatchEvent
): TeamTactics {
  if (!event || event.clubId !== clubId) return tactics;
  if (event.type === 'sub') {
    const outId = event.subOutPlayerId || event.playerId;
    const inId = event.subInPlayerId;
    if (outId && inId) {
      return applySubstitutionToTactics(tactics, outId, inId);
    }
    if (outId) {
      return removePlayerFromTacticsPitch(tactics, outId);
    }
    return tactics;
  }
  if (event.type === 'red_card' || event.type === 'second_yellow') {
    return removePlayerFromTacticsPitch(tactics, event.playerId);
  }
  if (event.type === 'injury') {
    // Only drop from pitch if not replaced by a sub at the same minute (10-man handling occurs via sub event or explicit)
    return tactics;
  }
  return tactics;
}

export interface SimulateMatchOptions {
  skipAutoSubsForClubId?: string;
  forcedSubMinutes?: number[];
  startMinute?: number;
  lockedEvents?: MatchEvent[];
  initialScore?: [number, number];
  subbedOutPlayerIds?: string[];
  initialHomeStarterIds?: string[];
  initialAwayStarterIds?: string[];
}

function isRegularGoalEvent(e: MatchEvent): boolean {
  if (e.type === 'goal') return true;
  if (e.type === 'penalty') {
    return !(e.description && e.description.includes('PK戦'));
  }
  return false;
}

function isPositionGroupCompatible(outPos: string, inPos: string): boolean {
  if (outPos === inPos) return true;
  if (['ST', 'CF', 'LW', 'RW'].includes(outPos) && ['ST', 'CF', 'LW', 'RW'].includes(inPos)) return true;
  if (['CM', 'CAM', 'CDM', 'LM', 'RM'].includes(outPos) && ['CM', 'CAM', 'CDM', 'LM', 'RM'].includes(inPos)) return true;
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(outPos) && ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(inPos)) return true;
  return false;
}

export function finalizeMatchResultAndPlayerStats(params: {
  fixture: MatchFixture;
  homeClub: Club;
  awayClub: Club;
  initialHomeStarterIds: string[];
  initialAwayStarterIds: string[];
  homeTactics: TeamTactics;
  awayTactics: TeamTactics;
  events: MatchEvent[];
  homeScore: number;
  awayScore: number;
  extraTimePlayed: boolean;
  penaltyShootout?: PenaltyShootoutResult;
  playersRegistry: Record<string, Player>;
  rng: () => number;
  homePossession?: number;
  homeShots?: number;
  awayShots?: number;
  homeShotsOnTarget?: number;
  awayShotsOnTarget?: number;
  homeCorners?: number;
  awayCorners?: number;
  homeFouls?: number;
  awayFouls?: number;
  playerShots?: Record<string, number>;
  playerShotsOnTarget?: Record<string, number>;
}): {
  fixture: MatchFixture;
  updatedPlayers: Record<string, Player>;
} {
  const {
    fixture,
    homeClub,
    awayClub,
    initialHomeStarterIds,
    initialAwayStarterIds,
    homeTactics,
    awayTactics,
    events: rawEvents,
    homeScore,
    awayScore,
    extraTimePlayed,
    penaltyShootout,
    playersRegistry,
    rng
  } = params;

  const events = [...rawEvents].sort((a, b) => a.minute - b.minute);
  const matchEndMinute = extraTimePlayed ? 120 : 90;
  const isPreseason = fixture.competition === 'pre-season' || fixture.competitionType === 'preseason';
  const compCat = getCompetitionCategory(fixture.competition);

  // Build deep-enough cloned updatedPlayers (clean pre-match stats snapshot + new updates)
  const updatedPlayers: Record<string, Player> = { ...playersRegistry };

  const participants: Record<string, PlayerMatchStatSummary> = {};
  const initParticipant = (pId: string, clubId: string, isStarter: boolean, enteredMinute: number) => {
    if (!pId || participants[pId]) return;
    participants[pId] = {
      clubId,
      isStarter,
      enteredMinute,
      exitedMinute: matchEndMinute,
      minutesPlayed: Math.max(1, matchEndMinute - enteredMinute),
      goals: 0,
      assists: 0,
      shots: 0,
      shotsOnTarget: 0,
      passesCompleted: 0,
      saves: 0,
      yellowCards: 0,
      redCards: 0,
      rating: +( (isStarter ? 6.0 : 6.2) + rng() * 0.6 ).toFixed(1),
      cleanSheet: false
    };
  };

  initialHomeStarterIds.forEach(id => initParticipant(id, homeClub.id, true, 0));
  initialAwayStarterIds.forEach(id => initParticipant(id, awayClub.id, true, 0));

  const substitutions: MatchSubstitutionRecord[] = [];
  const homePossession = params.homePossession ?? 50;

  let countedShotsHome = 0;
  let countedShotsAway = 0;
  let countedOnTargetHome = 0;
  let countedOnTargetAway = 0;
  let countedFoulsHome = 0;
  let countedFoulsAway = 0;

  events.forEach(e => {
    if (e.type === 'sub') {
      const outId = e.subOutPlayerId || e.playerId;
      const inId = e.subInPlayerId;
      if (outId && participants[outId]) {
        participants[outId].exitedMinute = Math.min(matchEndMinute, Math.max(participants[outId].enteredMinute + 1, e.minute));
      }
      if (inId) {
        initParticipant(inId, e.clubId, false, Math.min(matchEndMinute - 1, Math.max(1, e.minute)));
        substitutions.push({
          minute: e.minute,
          clubId: e.clubId,
          outPlayerId: outId,
          outPlayerName: e.subOutPlayerName || e.playerName || playersRegistry[outId]?.name || '',
          inPlayerId: inId,
          inPlayerName: e.subInPlayerName || playersRegistry[inId]?.name || ''
        });
      }
      return;
    }

    if (isRegularGoalEvent(e)) {
      if (e.playerId) {
        initParticipant(e.playerId, e.clubId, false, 0);
        const ps = participants[e.playerId];
        ps.goals += 1;
        ps.shots += 1;
        ps.shotsOnTarget += 1;
        ps.rating = Math.min(9.9, +(ps.rating + 1.2).toFixed(1));
        if (e.clubId === homeClub.id) {
          countedShotsHome++;
          countedOnTargetHome++;
        } else {
          countedShotsAway++;
          countedOnTargetAway++;
        }
      }
      if (e.assistPlayerId) {
        initParticipant(e.assistPlayerId, e.clubId, false, 0);
        const aps = participants[e.assistPlayerId];
        aps.assists += 1;
        aps.rating = Math.min(9.6, +(aps.rating + 0.6).toFixed(1));
      }
      return;
    }

    if (e.type === 'save' && e.playerId) {
      initParticipant(e.playerId, e.clubId, false, 0);
      const gkPs = participants[e.playerId];
      gkPs.saves += 1;
      gkPs.rating = Math.min(9.3, +(gkPs.rating + 0.4).toFixed(1));
      if (e.clubId === homeClub.id) {
        countedShotsAway++;
        countedOnTargetAway++;
      } else {
        countedShotsHome++;
        countedOnTargetHome++;
      }
      return;
    }

    if (e.type === 'woodwork' && e.playerId) {
      initParticipant(e.playerId, e.clubId, false, 0);
      participants[e.playerId].shots += 1;
      if (e.clubId === homeClub.id) countedShotsHome++;
      else countedShotsAway++;
      return;
    }

    if (e.type === 'yellow_card' && e.playerId) {
      initParticipant(e.playerId, e.clubId, false, 0);
      participants[e.playerId].yellowCards += 1;
      participants[e.playerId].rating = Math.max(4.5, +(participants[e.playerId].rating - 0.2).toFixed(1));
      if (e.clubId === homeClub.id) countedFoulsHome++;
      else countedFoulsAway++;
      return;
    }

    if ((e.type === 'second_yellow' || e.type === 'red_card') && e.playerId) {
      initParticipant(e.playerId, e.clubId, false, 0);
      const ps = participants[e.playerId];
      if (e.type === 'second_yellow') ps.yellowCards += 1;
      ps.redCards += 1;
      ps.exitedMinute = Math.min(matchEndMinute, Math.max(ps.enteredMinute + 1, e.minute));
      ps.rating = Math.max(3.8, +(ps.rating - 0.8).toFixed(1));
      if (e.clubId === homeClub.id) countedFoulsHome++;
      else countedFoulsAway++;

      if (updatedPlayers[e.playerId]) {
        const baseP = updatedPlayers[e.playerId];
        const cardDetails = determineRedCardSeverityAndSuspension(e.type === 'second_yellow', rng);
        const existingSuspMatches = baseP.suspension?.matchesRemaining || 0;
        if (!baseP.suspension?.isSuspended || existingSuspMatches === 0) {
          updatedPlayers[e.playerId] = {
            ...baseP,
            squadStatus: 'OUT_OF_SQUAD',
            suspension: {
              isSuspended: true,
              matchesRemaining: cardDetails.matchesRemaining,
              reason: cardDetails.reason,
              competitionCategory: compCat,
              competitionSuspensions: {
                ...(baseP.suspension?.competitionSuspensions || {}),
                [compCat]: cardDetails.matchesRemaining
              }
            }
          };
        }
      }
      return;
    }

    if (e.type === 'injury' && e.playerId) {
      if (participants[e.playerId]) {
        participants[e.playerId].exitedMinute = Math.min(matchEndMinute, Math.max(participants[e.playerId].enteredMinute + 1, e.minute));
      }
      if (updatedPlayers[e.playerId]) {
        const baseP = updatedPlayers[e.playerId];
        if (!baseP.injury?.isInjured && baseP.injuryStatus !== 'INJURED') {
          const chosenInj = getRandomWeightedInjury();
          const returnDate = addDays(fixture.date, chosenInj.days);
          updatedPlayers[e.playerId] = {
            ...baseP,
            injuryStatus: 'INJURED',
            injuryStartDate: fixture.date,
            injuryReturnDate: returnDate,
            injuryType: chosenInj.name,
            injuryDaysRemaining: chosenInj.days,
            injury: {
              isInjured: true,
              type: chosenInj.name,
              recoveryDays: chosenInj.days,
              returnDate
            },
            squadStatus: 'OUT_OF_SQUAD'
          };
        }
      }
    }
  });

  // Finalize minutes, per-player shots/passes, clean sheets, ratings
  const playerRatings: Record<string, number> = {};
  let bestRating = 0;
  let motmId = initialHomeStarterIds[0] || Object.keys(participants)[0];

  Object.entries(participants).forEach(([pId, ps]) => {
    const pObj = updatedPlayers[pId];
    ps.minutesPlayed = Math.max(1, Math.min(matchEndMinute, ps.exitedMinute - ps.enteredMinute));

    if (params.playerShots && params.playerShots[pId]) {
      ps.shots = Math.max(ps.shots, params.playerShots[pId]);
    }
    if (params.playerShotsOnTarget && params.playerShotsOnTarget[pId]) {
      ps.shotsOnTarget = Math.max(ps.shotsOnTarget, params.playerShotsOnTarget[pId]);
    }

    const pos = pObj?.position || 'CM';
    const isDefenderOrGk = pos === 'GK' || ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);
    const concededByClub = ps.clubId === homeClub.id ? awayScore : homeScore;
    ps.cleanSheet = isDefenderOrGk && concededByClub === 0 && ps.minutesPlayed >= 30;

    if (ps.cleanSheet) {
      ps.rating = Math.min(9.5, +(ps.rating + 0.4).toFixed(1));
    }

    const teamPoss = ps.clubId === homeClub.id ? homePossession : 100 - homePossession;
    const posPassRate = pos === 'GK' ? 0.28 : ['CB', 'CDM', 'CM'].includes(pos) ? 0.65 : 0.44;
    ps.passesCompleted = Math.max(1, Math.round((ps.minutesPlayed / 90) * teamPoss * posPassRate * (0.85 + rng() * 0.3)));

    playerRatings[pId] = ps.rating;
    if (ps.rating > bestRating) {
      bestRating = ps.rating;
      motmId = pId;
    }
  });

  // Apply cumulative stats, fatigue, and OVR growth for ALL match participants (starters + subs)
  Object.entries(participants).forEach(([pId, ps]) => {
    const existing = updatedPlayers[pId];
    if (!existing) return;

    const updated: Player = {
      ...existing,
      stats: { ...existing.stats },
      preseasonStats: existing.preseasonStats ? { ...existing.preseasonStats } : undefined,
      competitionStats: existing.competitionStats ? { ...existing.competitionStats } : {}
    };

    const playerStamina = existing.stamina || existing.physical || 75;
    const staminaFactor = Math.max(0.65, Math.min(1.35, 1.0 - (playerStamina - 75) * 0.012));

    let positionWorkrate = 1.0;
    if (['LWB', 'RWB', 'LM', 'RM'].includes(existing.position)) {
      positionWorkrate = 1.25;
    } else if (['CM', 'CDM', 'CAM'].includes(existing.position)) {
      positionWorkrate = 1.15;
    } else if (['ST', 'CF', 'LW', 'RW'].includes(existing.position)) {
      positionWorkrate = 1.05;
    } else if (['CB', 'LB', 'RB'].includes(existing.position)) {
      positionWorkrate = 0.9;
    } else if (existing.position === 'GK') {
      positionWorkrate = 0.35;
    }

    const timeFactor = ps.minutesPlayed / 90;
    const tacticsPress =
      (ps.clubId === homeClub.id ? homeTactics.instructions?.pressIntensity : awayTactics.instructions?.pressIntensity) || '標準的';
    const pressMultiplier =
      tacticsPress === '非常に激しい' || tacticsPress === '相手CB・GK限定猛プレス'
        ? 1.2
        : tacticsPress === '自陣引き気味'
          ? 0.85
          : 1.0;

    const calculatedFatigueDelta = Math.round(15 * staminaFactor * positionWorkrate * timeFactor * pressMultiplier);
    updated.fatigue = Math.max(0, Math.min(100, (updated.fatigue || 0) + calculatedFatigueDelta));

    const conceded = ps.clubId === homeClub.id ? awayScore : homeScore;

    if (isPreseason) {
      if (!updated.preseasonStats) {
        updated.preseasonStats = {
          appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0,
          cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 0, saves: 0, goalsConceded: 0
        };
      }
      const prevApps = updated.preseasonStats.appearances;
      const prevAvg = updated.preseasonStats.avgRating || 6.5;
      updated.preseasonStats.appearances += 1;
      updated.preseasonStats.starts += ps.isStarter ? 1 : 0;
      updated.preseasonStats.minutes += ps.minutesPlayed;
      updated.preseasonStats.goals += ps.goals;
      updated.preseasonStats.assists += ps.assists;
      updated.preseasonStats.saves = (updated.preseasonStats.saves || 0) + ps.saves;
      updated.preseasonStats.yellowCards += ps.yellowCards;
      updated.preseasonStats.redCards += ps.redCards;
      updated.preseasonStats.avgRating = +((prevAvg * prevApps + ps.rating) / (prevApps + 1)).toFixed(2);
      if (ps.cleanSheet) updated.preseasonStats.cleanSheets += 1;
      if (existing.position === 'GK') {
        updated.preseasonStats.goalsConceded = (updated.preseasonStats.goalsConceded || 0) + conceded;
      }
    } else {
      const prevApps = updated.stats.appearances;
      const prevAvg = updated.stats.avgRating || 6.5;
      updated.stats.appearances += 1;
      updated.stats.starts += ps.isStarter ? 1 : 0;
      updated.stats.minutes += ps.minutesPlayed;
      updated.stats.goals += ps.goals;
      updated.stats.assists += ps.assists;
      updated.stats.saves = (updated.stats.saves || 0) + ps.saves;
      updated.stats.yellowCards += ps.yellowCards;
      updated.stats.redCards += ps.redCards;
      updated.stats.avgRating = +((prevAvg * prevApps + ps.rating) / (prevApps + 1)).toFixed(2);
      if (ps.cleanSheet) updated.stats.cleanSheets += 1;
      if (existing.position === 'GK') {
        updated.stats.goalsConceded = (updated.stats.goalsConceded || 0) + conceded;
      }

      const compKey = fixture.competition;
      const existingCs = updated.competitionStats![compKey]
        ? { ...updated.competitionStats![compKey] }
        : {
            appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0,
            cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 0, saves: 0, goalsConceded: 0
          };
      const csPrevApps = existingCs.appearances;
      const csPrevAvg = existingCs.avgRating || 6.5;
      existingCs.appearances += 1;
      existingCs.starts += ps.isStarter ? 1 : 0;
      existingCs.minutes += ps.minutesPlayed;
      existingCs.goals += ps.goals;
      existingCs.assists += ps.assists;
      existingCs.saves = (existingCs.saves || 0) + ps.saves;
      existingCs.yellowCards += ps.yellowCards;
      existingCs.redCards += ps.redCards;
      existingCs.avgRating = +((csPrevAvg * csPrevApps + ps.rating) / (csPrevApps + 1)).toFixed(2);
      if (ps.cleanSheet) existingCs.cleanSheets += 1;
      if (existing.position === 'GK') {
        existingCs.goalsConceded = (existingCs.goalsConceded || 0) + conceded;
      }
      updated.competitionStats![compKey] = existingCs;
    }

    const growthResult = processPlayerPerformanceGrowth(updated, {
      rating: ps.rating,
      minutes: ps.minutesPlayed,
      goals: ps.goals,
      assists: ps.assists,
      cleanSheet: ps.cleanSheet,
      isMotm: motmId === pId
    });
    updated.exactOvr = growthResult.exactOvr;
    updated.ovr = growthResult.ovr;
    updated.matchRatingsHistory = growthResult.matchRatingsHistory;

    updatedPlayers[pId] = updated;
  });

  const finalHomeShots = Math.max(homeScore, params.homeShots ?? countedShotsHome);
  const finalAwayShots = Math.max(awayScore, params.awayShots ?? countedShotsAway);
  const finalHomeOnTarget = Math.max(homeScore, params.homeShotsOnTarget ?? countedOnTargetHome);
  const finalAwayOnTarget = Math.max(awayScore, params.awayShotsOnTarget ?? countedOnTargetAway);
  const finalHomeCorners = Math.max(1, params.homeCorners ?? Math.max(1, Math.round(finalHomeShots * 0.4)));
  const finalAwayCorners = Math.max(1, params.awayCorners ?? Math.max(1, Math.round(finalAwayShots * 0.4)));
  const finalHomeFouls = Math.max(4, params.homeFouls ?? countedFoulsHome + 4);
  const finalAwayFouls = Math.max(4, params.awayFouls ?? countedFoulsAway + 4);

  const homeXG = +(finalHomeOnTarget * 0.32 + (finalHomeShots - finalHomeOnTarget) * 0.06).toFixed(2);
  const awayXG = +(finalAwayOnTarget * 0.30 + (finalAwayShots - finalAwayOnTarget) * 0.06).toFixed(2);

  const stats: MatchStats = {
    homeScore,
    awayScore,
    possession: homePossession,
    shots: [finalHomeShots, finalAwayShots],
    shotsOnTarget: [finalHomeOnTarget, finalAwayOnTarget],
    xG: [homeXG, awayXG],
    corners: [finalHomeCorners, finalAwayCorners],
    fouls: [finalHomeFouls, finalAwayFouls],
    passesCompleted: [Math.floor(homePossession * 8.5), Math.floor((100 - homePossession) * 8.5)],
    passAccuracy: [83 + Math.floor(rng() * 7), 81 + Math.floor(rng() * 7)],
    playerRatings,
    substitutions,
    playerMatchStats: participants
  };

  const updatedFixture: MatchFixture = {
    ...fixture,
    status: 'finished',
    homeScore,
    awayScore,
    extraTimePlayed,
    penaltyShootout,
    events,
    stats,
    motmPlayerId: motmId,
    isResultApplied: false
  };

  return {
    fixture: updatedFixture,
    updatedPlayers
  };
}

// -------------------------------------------------------------
// 【3 & 4. 試合シミュレーションエンジン (0-0過多解消・時系列交代連動・時間帯展開)】
// -------------------------------------------------------------
export function simulateFullMatch(
  fixture: MatchFixture,
  homeClub: Club,
  awayClub: Club,
  homeTactics: TeamTactics,
  awayTactics: TeamTactics,
  playersRegistry: Record<string, Player>,
  forcedSeed?: number,
  options?: SimulateMatchOptions
): {
  fixture: MatchFixture;
  updatedPlayers: Record<string, Player>;
} {
  const startMinute = options?.startMinute ?? 0;
  const events: MatchEvent[] = options?.lockedEvents ? [...options.lockedEvents] : [];
  const tempPlayers = { ...playersRegistry };

  const effectiveSeed =
    forcedSeed ??
    fixture.matchSeed ??
    hashStringToNumber(`${fixture.id}_${homeClub.id}_${awayClub.id}_${fixture.date || '2026-08-01'}_${startMinute}`);
  const rng = createPRNG(effectiveSeed);

  const sanitizeStarters = (club: Club, tactics?: TeamTactics): string[] => {
    const rawStarters = (tactics?.lineup?.starters || [])
      .map((s: any) => (typeof s === 'string' ? s : s?.playerId))
      .filter(Boolean);
    const valid: string[] = [];
    const clubPlayerIds = club?.playerIds || [];

    rawStarters.forEach(pId => {
      const p = tempPlayers[pId];
      if (p && p.injuryStatus !== 'INJURED' && !p.injury?.isInjured && !p.suspension?.isSuspended && p.clubId === club.id) {
        valid.push(pId);
      }
    });

    if (startMinute === 0 && valid.length < 11) {
      for (const pId of clubPlayerIds) {
        if (valid.length >= 11) break;
        if (!valid.includes(pId)) {
          const p = tempPlayers[pId];
          if (p && p.injuryStatus !== 'INJURED' && !p.injury?.isInjured && !p.suspension?.isSuspended) {
            valid.push(pId);
          }
        }
      }
    }

    return valid;
  };

  let homePitchPlayers = sanitizeStarters(homeClub, homeTactics);
  let awayPitchPlayers = sanitizeStarters(awayClub, awayTactics);

  const initialHomeStarterIds = options?.initialHomeStarterIds
    ? [...options.initialHomeStarterIds]
    : [...homePitchPlayers];
  const initialAwayStarterIds = options?.initialAwayStarterIds
    ? [...options.initialAwayStarterIds]
    : [...awayPitchPlayers];

  const homeStartersList = homePitchPlayers.map(id => tempPlayers[id]).filter(Boolean);
  const awayStartersList = awayPitchPlayers.map(id => tempPlayers[id]).filter(Boolean);

  const getSubRating = (list: Player[], positions: string[], fallback: number): number => {
    const filtered = list.filter(p => positions.includes(p.position));
    if (filtered.length === 0) return fallback;
    return filtered.reduce((acc, p) => acc + calculateEffectivePlayerPower(p), 0) / filtered.length;
  };

  const getFormationProfile = (tactics: TeamTactics, startersList: Player[]) => {
    const f = tactics.formation;
    const is5Back = f.startsWith('5-') || startersList.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)).length >= 5;
    const is3Back = f.startsWith('3-');
    const is4Back = f.startsWith('4-');
    const wingCount = startersList.filter(p => ['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB'].includes(p.position)).length;
    const centralCount = startersList.filter(p => ['CAM', 'CM', 'CDM', 'ST', 'CF'].includes(p.position)).length;
    const fwCount = startersList.filter(p => ['ST', 'CF', 'RW', 'LW'].includes(p.position)).length;
    const mfCount = startersList.filter(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position)).length;
    const avgPitchY =
      tactics.lineup.starters.length > 0
        ? tactics.lineup.starters.reduce((acc, s) => acc + (s.pitchY || 50), 0) / tactics.lineup.starters.length
        : 50;
    const pushUpFactor = Math.max(0.85, Math.min(1.18, (55 - avgPitchY) * 0.012 + 1.0));

    return {
      is5Back,
      is3Back,
      is4Back,
      wingCount,
      centralCount,
      fwCount,
      mfCount,
      pushUpFactor,
      isWingOriented: f === '4-3-3' || f === '4-2-4' || f === '3-4-3' || wingCount >= 4,
      isCamDominant: f === '4-2-3-1' || f === '4-3-1-2' || f === '5-2-2-1',
      isMidfieldDominant: f === '3-5-2' || f === '4-5-1' || f === '4-1-4-1' || mfCount >= 5,
      isSolidDefense: is5Back || f === '5-3-2' || f === '5-4-1'
    };
  };

  const computeTeamRatings = (
    pitchIds: string[],
    tactics: TeamTactics,
    isHomeTeam: boolean,
    freshBoostCount: number
  ) => {
    const pitchList = pitchIds.map(id => tempPlayers[id]).filter(Boolean);
    const fwPower = getSubRating(pitchList, ['ST', 'CF', 'RW', 'LW'], 72);
    const mfPower = getSubRating(pitchList, ['CAM', 'CM', 'CDM', 'RM', 'LM'], 72);
    const dfPower = getSubRating(pitchList, ['CB', 'RB', 'LB', 'LWB', 'RWB'], 72);
    const gkPower = pitchList.find(p => p.position === 'GK')?.ovr || 72;
    const profile = getFormationProfile(tactics, pitchList);
    const freshMult = 1 + Math.min(0.06, freshBoostCount * 0.015);

    let attack = (fwPower * 0.55 + mfPower * 0.45) * (isHomeTeam ? 1.06 : 1.0) * profile.pushUpFactor * freshMult;
    if (profile.isWingOriented || profile.fwCount >= 3) attack *= 1.05;
    if (profile.isMidfieldDominant) attack *= 1.03;

    let defense = (dfPower * 0.65 + gkPower * 0.35) * (isHomeTeam ? 1.03 : 1.0) * freshMult;
    if (profile.isSolidDefense) defense *= 1.14;

    return { fwPower, mfPower, dfPower, gkPower, attack, defense };
  };

  let homeScore = options?.initialScore ? options.initialScore[0] : 0;
  let awayScore = options?.initialScore ? options.initialScore[1] : 0;
  let homeShots = 0;
  let awayShots = 0;
  let homeShotsOnTarget = 0;
  let awayShotsOnTarget = 0;
  let homeCorners = 0;
  let awayCorners = 0;
  let homeFouls = 0;
  let awayFouls = 0;

  const playerShots: Record<string, number> = {};
  const playerShotsOnTarget: Record<string, number> = {};
  const yellowCardCounts: Record<string, number> = {};
  const subbedOutSet = new Set<string>(options?.subbedOutPlayerIds || []);
  const usedHomeBenchIds = new Set<string>();
  const usedAwayBenchIds = new Set<string>();
  const homeSubbedInIds = new Set<string>();
  const awaySubbedInIds = new Set<string>();

  // Seed card/sub tracking from prior locked events when resuming mid-match
  events.forEach(e => {
    if (e.type === 'yellow_card' && e.playerId) {
      yellowCardCounts[e.playerId] = (yellowCardCounts[e.playerId] || 0) + 1;
    } else if (e.type === 'sub') {
      const outId = e.subOutPlayerId || e.playerId;
      const inId = e.subInPlayerId;
      if (outId) subbedOutSet.add(outId);
      if (inId) {
        if (e.clubId === homeClub.id) {
          usedHomeBenchIds.add(inId);
          homeSubbedInIds.add(inId);
        } else {
          usedAwayBenchIds.add(inId);
          awaySubbedInIds.add(inId);
        }
      }
    } else if (isRegularGoalEvent(e)) {
      if (!options?.initialScore) {
        if (e.clubId === homeClub.id) homeScore++;
        else awayScore++;
      }
      if (e.playerId) {
        playerShots[e.playerId] = (playerShots[e.playerId] || 0) + 1;
        playerShotsOnTarget[e.playerId] = (playerShotsOnTarget[e.playerId] || 0) + 1;
      }
      if (e.clubId === homeClub.id) {
        homeShots++;
        homeShotsOnTarget++;
      } else {
        awayShots++;
        awayShotsOnTarget++;
      }
    }
  });

  const subCheckpoints = (options?.forcedSubMinutes || [60, 68, 75, 82]).slice().sort((a, b) => a - b);
  let homeSubCount = events.filter(e => e.type === 'sub' && e.clubId === homeClub.id).length;
  let awaySubCount = events.filter(e => e.type === 'sub' && e.clubId === awayClub.id).length;
  const triggeredHomeSubWindows = new Set<number>();
  const triggeredAwaySubWindows = new Set<number>();

  // Prevent re-running past sub windows when resuming after minute > window
  subCheckpoints.forEach(cp => {
    if (cp <= startMinute) {
      triggeredHomeSubWindows.add(cp);
      triggeredAwaySubWindows.add(cp);
    }
  });

  const executeSingleAiSubAtMinute = (
    teamClub: Club,
    pitchIds: string[],
    tactics: TeamTactics,
    usedBenchSet: Set<string>,
    subbedInSet: Set<string>,
    minute: number
  ): { didSub: boolean; newPitchIds: string[] } => {
    const benchIds = tactics.lineup?.bench || [];
    const availableBench = benchIds
      .map(id => tempPlayers[id])
      .filter(
        p =>
          p &&
          p.position !== 'GK' &&
          !p.injury?.isInjured &&
          !p.suspension?.isSuspended &&
          !usedBenchSet.has(p.id) &&
          !subbedOutSet.has(p.id) &&
          !pitchIds.includes(p.id)
      );

    if (availableBench.length === 0) return { didSub: false, newPitchIds: pitchIds };

    const candidates = pitchIds
      .map(id => tempPlayers[id])
      .filter(p => p && p.position !== 'GK' && !subbedInSet.has(p.id));

    if (candidates.length === 0) return { didSub: false, newPitchIds: pitchIds };

    candidates.sort((a, b) => {
      const aYellow = yellowCardCounts[a.id] ? 1 : 0;
      const bYellow = yellowCardCounts[b.id] ? 1 : 0;
      if (aYellow !== bYellow) return bYellow - aYellow;
      const aFatigue = (a.fatigue || 0) + Math.round(minute * 0.25);
      const bFatigue = (b.fatigue || 0) + Math.round(minute * 0.25);
      return bFatigue - aFatigue;
    });

    const outPlayer = candidates[0];
    if (!outPlayer) return { didSub: false, newPitchIds: pitchIds };

    const inPlayer =
      availableBench.find(bp => isPositionGroupCompatible(outPlayer.position, bp.position)) || availableBench[0];

    if (!inPlayer) return { didSub: false, newPitchIds: pitchIds };

    usedBenchSet.add(inPlayer.id);
    subbedInSet.add(inPlayer.id);
    subbedOutSet.add(outPlayer.id);

    const updatedPitchIds = [...pitchIds];
    const idx = updatedPitchIds.indexOf(outPlayer.id);
    if (idx !== -1) {
      updatedPitchIds[idx] = inPlayer.id;
    }

    events.push({
      minute,
      type: 'sub',
      clubId: teamClub.id,
      playerId: outPlayer.id,
      playerName: outPlayer.name,
      subOutPlayerId: outPlayer.id,
      subOutPlayerName: outPlayer.name,
      subInPlayerId: inPlayer.id,
      subInPlayerName: inPlayer.name,
      description: `【選手交代】${teamClub.name}: IN ${inPlayer.name} (${inPlayer.position}) ⇄ OUT ${outPlayer.name} (${outPlayer.position})`
    });

    return { didSub: true, newPitchIds: updatedPitchIds };
  };

  // Dynamic Simulation across 20 paced match phases (every 4-5 mins)
  const timePhases = [
    { min: 4, phase: 'probing' },
    { min: 8, phase: 'probing' },
    { min: 14, phase: 'probing' },
    { min: 19, phase: 'ramp_up' },
    { min: 24, phase: 'ramp_up' },
    { min: 29, phase: 'ramp_up' },
    { min: 34, phase: 'late_first' },
    { min: 39, phase: 'late_first' },
    { min: 44, phase: 'late_first' },
    { min: 49, phase: 'restart' },
    { min: 54, phase: 'restart' },
    { min: 59, phase: 'restart' },
    { min: 64, phase: 'subs_impact' },
    { min: 69, phase: 'subs_impact' },
    { min: 74, phase: 'subs_impact' },
    { min: 78, phase: 'high_risk' },
    { min: 82, phase: 'high_risk' },
    { min: 86, phase: 'high_risk' },
    { min: 89, phase: 'high_risk' },
    { min: 92, phase: 'stoppage' }
  ];

  let homeRatings = computeTeamRatings(homePitchPlayers, homeTactics, true, homeSubCount);
  let awayRatings = computeTeamRatings(awayPitchPlayers, awayTactics, false, awaySubCount);

  timePhases.forEach(({ min, phase }) => {
    if (min <= startMinute) return;

    const jitter = Math.floor(rng() * 3) - 1;
    const eventMin = Math.max(startMinute + 1, Math.min(94, min + jitter));

    // CHRONOLOGICAL AI SUBSTITUTIONS (happen BEFORE post-sub attacks so subs can score/assist/shoot/save!)
    for (const subCheckpoint of subCheckpoints) {
      if (eventMin >= subCheckpoint) {
        if (
          !triggeredHomeSubWindows.has(subCheckpoint) &&
          options?.skipAutoSubsForClubId !== homeClub.id &&
          homeSubCount < 5
        ) {
          triggeredHomeSubWindows.add(subCheckpoint);
          const subRes = executeSingleAiSubAtMinute(
            homeClub,
            homePitchPlayers,
            homeTactics,
            usedHomeBenchIds,
            homeSubbedInIds,
            Math.max(startMinute + 1, Math.min(88, subCheckpoint + (Math.floor(rng() * 3) - 1)))
          );
          if (subRes.didSub) {
            homePitchPlayers = subRes.newPitchIds;
            homeSubCount++;
            homeRatings = computeTeamRatings(homePitchPlayers, homeTactics, true, homeSubCount);
          }
        }

        if (
          !triggeredAwaySubWindows.has(subCheckpoint) &&
          options?.skipAutoSubsForClubId !== awayClub.id &&
          awaySubCount < 5
        ) {
          triggeredAwaySubWindows.add(subCheckpoint);
          const subRes = executeSingleAiSubAtMinute(
            awayClub,
            awayPitchPlayers,
            awayTactics,
            usedAwayBenchIds,
            awaySubbedInIds,
            Math.max(startMinute + 1, Math.min(88, subCheckpoint + (Math.floor(rng() * 3) - 1)))
          );
          if (subRes.didSub) {
            awayPitchPlayers = subRes.newPitchIds;
            awaySubCount++;
            awayRatings = computeTeamRatings(awayPitchPlayers, awayTactics, false, awaySubCount);
          }
        }
      }
    }

    const currentHomePitch = homePitchPlayers.map(id => tempPlayers[id]).filter(Boolean);
    const currentAwayPitch = awayPitchPlayers.map(id => tempPlayers[id]).filter(Boolean);

    let phaseChanceMultiplier = 1.0;
    if (phase === 'probing') {
      phaseChanceMultiplier = 0.65;
    } else if (phase === 'ramp_up') {
      phaseChanceMultiplier = 0.95;
    } else if (phase === 'late_first') {
      phaseChanceMultiplier = 1.15;
    } else if (phase === 'restart') {
      phaseChanceMultiplier = 0.85;
    } else if (phase === 'subs_impact') {
      phaseChanceMultiplier = 1.15;
    } else if (phase === 'high_risk' || phase === 'stoppage') {
      phaseChanceMultiplier = 1.35;
    }

    let homeTrailingBonus = 1.0;
    let awayTrailingBonus = 1.0;
    if (eventMin >= 60) {
      if (homeScore < awayScore) homeTrailingBonus = 1.25;
      if (awayScore < homeScore) awayTrailingBonus = 1.25;
    }

    // --- HOME ATTACK ATTEMPT ---
    const homeAttackRatio = Math.max(0.7, Math.min(1.4, homeRatings.attack / Math.max(40, awayRatings.defense)));
    const homeChanceThreshold = 0.42 * homeAttackRatio * phaseChanceMultiplier * homeTrailingBonus;

    if (rng() < homeChanceThreshold && currentHomePitch.length > 0) {
      homeShots++;
      const onTargetChance = 0.48 + (homeRatings.fwPower - awayRatings.gkPower) * 0.005;
      const onTarget = rng() < Math.max(0.32, Math.min(0.68, onTargetChance));

      if (onTarget) {
        homeShotsOnTarget++;
        const conversionChance = 0.38 + (homeRatings.fwPower - awayRatings.gkPower) * 0.006;
        const isGoal = rng() < Math.max(0.24, Math.min(0.55, conversionChance));

        if (isGoal) {
          homeScore++;
          const scorer = selectScorer(currentHomePitch, homeTactics, rng);
          const assister = selectAssister(currentHomePitch, scorer.id, rng);
          playerShots[scorer.id] = (playerShots[scorer.id] || 0) + 1;
          playerShotsOnTarget[scorer.id] = (playerShotsOnTarget[scorer.id] || 0) + 1;

          const isFoulPenalty = rng() < 0.04;
          const goalDetail = generateGoalDetail(scorer, isFoulPenalty ? undefined : assister, isFoulPenalty, false, rng, eventMin);
          events.push({
            minute: eventMin,
            type: isFoulPenalty ? 'penalty' : 'goal',
            clubId: homeClub.id,
            playerId: scorer.id,
            playerName: scorer.name,
            assistPlayerId: isFoulPenalty ? undefined : assister?.id,
            assistPlayerName: isFoulPenalty ? undefined : assister?.name,
            description: goalDetail.narrative,
            goalDetail
          });
        } else {
          const awayGK = currentAwayPitch.find(p => p.position === 'GK') || currentAwayPitch[0] || awayStartersList[0];
          const shooter = selectScorer(currentHomePitch, homeTactics, rng);
          playerShots[shooter.id] = (playerShots[shooter.id] || 0) + 1;
          playerShotsOnTarget[shooter.id] = (playerShotsOnTarget[shooter.id] || 0) + 1;
          if (awayGK && shooter) {
            const saveFn = SAVE_COMMENTARIES[Math.floor(rng() * SAVE_COMMENTARIES.length)];
            events.push({
              minute: eventMin,
              type: 'save',
              clubId: awayClub.id,
              playerId: awayGK.id,
              playerName: awayGK.name,
              description: saveFn(awayGK.name, shooter.name)
            });
            homeCorners++;
          }
        }
      } else {
        const shooter = selectScorer(currentHomePitch, homeTactics, rng);
        if (shooter) {
          playerShots[shooter.id] = (playerShots[shooter.id] || 0) + 1;
          if (rng() < 0.12) {
            const woodFn = WOODWORK_COMMENTARIES[Math.floor(rng() * WOODWORK_COMMENTARIES.length)];
            events.push({
              minute: eventMin,
              type: 'woodwork',
              clubId: homeClub.id,
              playerId: shooter.id,
              playerName: shooter.name,
              description: woodFn(shooter.name)
            });
          }
        }
      }
    }

    // --- AWAY ATTACK ATTEMPT ---
    const awayAttackRatio = Math.max(0.7, Math.min(1.4, awayRatings.attack / Math.max(40, homeRatings.defense)));
    const awayChanceThreshold = 0.38 * awayAttackRatio * phaseChanceMultiplier * awayTrailingBonus;

    if (rng() < awayChanceThreshold && currentAwayPitch.length > 0) {
      awayShots++;
      const onTargetChance = 0.48 + (awayRatings.fwPower - homeRatings.gkPower) * 0.005;
      const onTarget = rng() < Math.max(0.32, Math.min(0.68, onTargetChance));

      if (onTarget) {
        awayShotsOnTarget++;
        const conversionChance = 0.36 + (awayRatings.fwPower - homeRatings.gkPower) * 0.006;
        const isGoal = rng() < Math.max(0.22, Math.min(0.52, conversionChance));

        if (isGoal) {
          awayScore++;
          const scorer = selectScorer(currentAwayPitch, awayTactics, rng);
          const assister = selectAssister(currentAwayPitch, scorer.id, rng);
          playerShots[scorer.id] = (playerShots[scorer.id] || 0) + 1;
          playerShotsOnTarget[scorer.id] = (playerShotsOnTarget[scorer.id] || 0) + 1;

          const isFoulPenalty = rng() < 0.04;
          const goalDetail = generateGoalDetail(scorer, isFoulPenalty ? undefined : assister, isFoulPenalty, false, rng, eventMin);
          events.push({
            minute: eventMin,
            type: isFoulPenalty ? 'penalty' : 'goal',
            clubId: awayClub.id,
            playerId: scorer.id,
            playerName: scorer.name,
            assistPlayerId: isFoulPenalty ? undefined : assister?.id,
            assistPlayerName: isFoulPenalty ? undefined : assister?.name,
            description: goalDetail.narrative,
            goalDetail
          });
        } else {
          const homeGK = currentHomePitch.find(p => p.position === 'GK') || currentHomePitch[0] || homeStartersList[0];
          const shooter = selectScorer(currentAwayPitch, awayTactics, rng);
          playerShots[shooter.id] = (playerShots[shooter.id] || 0) + 1;
          playerShotsOnTarget[shooter.id] = (playerShotsOnTarget[shooter.id] || 0) + 1;
          if (homeGK && shooter) {
            const saveFn = SAVE_COMMENTARIES[Math.floor(rng() * SAVE_COMMENTARIES.length)];
            events.push({
              minute: eventMin,
              type: 'save',
              clubId: homeClub.id,
              playerId: homeGK.id,
              playerName: homeGK.name,
              description: saveFn(homeGK.name, shooter.name)
            });
            awayCorners++;
          }
        }
      } else {
        const shooter = selectScorer(currentAwayPitch, awayTactics, rng);
        if (shooter) {
          playerShots[shooter.id] = (playerShots[shooter.id] || 0) + 1;
          if (rng() < 0.12) {
            const woodFn = WOODWORK_COMMENTARIES[Math.floor(rng() * WOODWORK_COMMENTARIES.length)];
            events.push({
              minute: eventMin,
              type: 'woodwork',
              clubId: awayClub.id,
              playerId: shooter.id,
              playerName: shooter.name,
              description: woodFn(shooter.name)
            });
          }
        }
      }
    }

    // --- CARDS & FOULS ---
    if (rng() < 0.08) {
      const isHomeFoul = rng() < 0.5;
      const targetClub = isHomeFoul ? homeClub : awayClub;
      const targetPitch = isHomeFoul ? currentHomePitch : currentAwayPitch;

      if (isHomeFoul) homeFouls++;
      else awayFouls++;

      if (targetPitch.length > 0) {
        const offender = targetPitch[Math.floor(rng() * targetPitch.length)];
        const priorYellows = yellowCardCounts[offender.id] || 0;

        if (priorYellows === 1) {
          yellowCardCounts[offender.id] = 2;
          const cardDetails = determineRedCardSeverityAndSuspension(true, rng);
          events.push({
            minute: eventMin,
            type: 'second_yellow',
            clubId: targetClub.id,
            playerId: offender.id,
            playerName: offender.name,
            description: `【警告退場】${offender.name}が2枚目のイエローカードを受けて退場処分！チームは残り時間を10名で戦うことになります。（${cardDetails.matchesRemaining}試合出場停止）`
          });

          if (isHomeFoul) {
            homePitchPlayers = homePitchPlayers.filter(id => id !== offender.id);
            homeRatings = computeTeamRatings(homePitchPlayers, homeTactics, true, homeSubCount);
          } else {
            awayPitchPlayers = awayPitchPlayers.filter(id => id !== offender.id);
            awayRatings = computeTeamRatings(awayPitchPlayers, awayTactics, false, awaySubCount);
          }
        } else if (priorYellows === 0) {
          const isStraightRed = rng() < 0.018;
          if (isStraightRed) {
            const cardDetails = determineRedCardSeverityAndSuspension(false, rng);
            events.push({
              minute: eventMin,
              type: 'red_card',
              clubId: targetClub.id,
              playerId: offender.id,
              playerName: offender.name,
              description: `【一発退場】${offender.name}に対し主審から直接レッドカード提示！理由: ${cardDetails.reason}（${cardDetails.matchesRemaining}試合出場停止処分）`
            });
            if (isHomeFoul) {
              homePitchPlayers = homePitchPlayers.filter(id => id !== offender.id);
              homeRatings = computeTeamRatings(homePitchPlayers, homeTactics, true, homeSubCount);
            } else {
              awayPitchPlayers = awayPitchPlayers.filter(id => id !== offender.id);
              awayRatings = computeTeamRatings(awayPitchPlayers, awayTactics, false, awaySubCount);
            }
          } else {
            yellowCardCounts[offender.id] = 1;
            events.push({
              minute: eventMin,
              type: 'yellow_card',
              clubId: targetClub.id,
              playerId: offender.id,
              playerName: offender.name,
              description: `【警告】${offender.name}が無謀なタックルにより主審からイエローカードを提示されました。`
            });
          }
        }
      }
    }

    // --- IN-MATCH INJURY RISK SYSTEM ---
    const allOnPitch = [...currentHomePitch, ...currentAwayPitch];
    const matchInjuriesCount = events.filter(e => e.type === 'injury').length;
    if (matchInjuriesCount < 2) {
      for (const player of allOnPitch) {
        const isHome = currentHomePitch.some(p => p.id === player.id);
        const teamInjuries = events.filter(
          e => e.type === 'injury' && e.clubId === (isHome ? homeClub.id : awayClub.id)
        ).length;
        if (teamInjuries >= 1) continue;

        const pressStyle = isHome
          ? homeTactics.instructions.pressIntensity
          : awayTactics.instructions.pressIntensity;
        const risk = calculatePlayerInjuryRisk(player, eventMin, pressStyle);

        if (rng() < risk) {
          const chosenInj = getRandomWeightedInjury();
          const targetClub = isHome ? homeClub : awayClub;

          events.push({
            minute: eventMin,
            type: 'injury',
            clubId: targetClub.id,
            playerId: player.id,
            playerName: player.name,
            description: `【負傷発生】${player.name}がピッチ上で足を痛め倒れ込む。メディカルスタッフの初期診断：${chosenInj.name}（全治約${chosenInj.days}日・プレー続行不可）`
          });

          subbedOutSet.add(player.id);

          // AI team automatically brings on an injury sub immediately (unless skipped for user's live club)
          const skipAiSubForClub = options?.skipAutoSubsForClubId === targetClub.id;
          if (!skipAiSubForClub) {
            if (isHome && homeSubCount < 5) {
              const idx = homePitchPlayers.indexOf(player.id);
              const benchIn = (homeTactics.lineup?.bench || [])
                .map(id => tempPlayers[id])
                .find(
                  bp =>
                    bp &&
                    bp.position !== 'GK' &&
                    !bp.injury?.isInjured &&
                    !bp.suspension?.isSuspended &&
                    !usedHomeBenchIds.has(bp.id) &&
                    !subbedOutSet.has(bp.id) &&
                    !homePitchPlayers.includes(bp.id)
                );
              if (idx !== -1 && benchIn) {
                homePitchPlayers[idx] = benchIn.id;
                usedHomeBenchIds.add(benchIn.id);
                homeSubbedInIds.add(benchIn.id);
                homeSubCount++;
                events.push({
                  minute: eventMin,
                  type: 'sub',
                  clubId: homeClub.id,
                  playerId: player.id,
                  playerName: player.name,
                  subOutPlayerId: player.id,
                  subOutPlayerName: player.name,
                  subInPlayerId: benchIn.id,
                  subInPlayerName: benchIn.name,
                  description: `【負傷交代】${homeClub.name}: IN ${benchIn.name} (${benchIn.position}) ⇄ OUT ${player.name} (${player.position})`
                });
                homeRatings = computeTeamRatings(homePitchPlayers, homeTactics, true, homeSubCount);
              } else {
                homePitchPlayers = homePitchPlayers.filter(id => id !== player.id);
                homeRatings = computeTeamRatings(homePitchPlayers, homeTactics, true, homeSubCount);
              }
            } else if (!isHome && awaySubCount < 5) {
              const idx = awayPitchPlayers.indexOf(player.id);
              const benchIn = (awayTactics.lineup?.bench || [])
                .map(id => tempPlayers[id])
                .find(
                  bp =>
                    bp &&
                    bp.position !== 'GK' &&
                    !bp.injury?.isInjured &&
                    !bp.suspension?.isSuspended &&
                    !usedAwayBenchIds.has(bp.id) &&
                    !subbedOutSet.has(bp.id) &&
                    !awayPitchPlayers.includes(bp.id)
                );
              if (idx !== -1 && benchIn) {
                awayPitchPlayers[idx] = benchIn.id;
                usedAwayBenchIds.add(benchIn.id);
                awaySubbedInIds.add(benchIn.id);
                awaySubCount++;
                events.push({
                  minute: eventMin,
                  type: 'sub',
                  clubId: awayClub.id,
                  playerId: player.id,
                  playerName: player.name,
                  subOutPlayerId: player.id,
                  subOutPlayerName: player.name,
                  subInPlayerId: benchIn.id,
                  subInPlayerName: benchIn.name,
                  description: `【負傷交代】${awayClub.name}: IN ${benchIn.name} (${benchIn.position}) ⇄ OUT ${player.name} (${player.position})`
                });
                awayRatings = computeTeamRatings(awayPitchPlayers, awayTactics, false, awaySubCount);
              } else {
                awayPitchPlayers = awayPitchPlayers.filter(id => id !== player.id);
                awayRatings = computeTeamRatings(awayPitchPlayers, awayTactics, false, awaySubCount);
              }
            } else {
              if (isHome) homePitchPlayers = homePitchPlayers.filter(id => id !== player.id);
              else awayPitchPlayers = awayPitchPlayers.filter(id => id !== player.id);
            }
          } else {
            if (isHome) homePitchPlayers = homePitchPlayers.filter(id => id !== player.id);
            else awayPitchPlayers = awayPitchPlayers.filter(id => id !== player.id);
          }

          break;
        }
      }
    }
  });

  // Sort events chronologically
  events.sort((a, b) => a.minute - b.minute);

  // Decisive extra time and penalties if drawn in knockout fixtures
  let extraTimePlayed = false;
  let penaltyShootout: PenaltyShootoutResult | undefined = undefined;

  const { requiresDecider, isTwoLeggedSecondLeg } = isMatchRequiringDecider(fixture);
  let needsExtraTime = false;

  if (requiresDecider) {
    if (isTwoLeggedSecondLeg && fixture.leg1Score) {
      const aggHome = (fixture.leg1Score.awayScore ?? fixture.leg1Score.away ?? 0) + homeScore;
      const aggAway = (fixture.leg1Score.homeScore ?? fixture.leg1Score.home ?? 0) + awayScore;
      if (aggHome === aggAway) needsExtraTime = true;
    } else if (homeScore === awayScore) {
      needsExtraTime = true;
    }
  }

  if (needsExtraTime) {
    extraTimePlayed = true;
    const etHomePitch = homePitchPlayers.map(id => tempPlayers[id]).filter(Boolean);
    const etAwayPitch = awayPitchPlayers.map(id => tempPlayers[id]).filter(Boolean);

    const etHomeGoals1 = rng() < 0.12 ? 1 : 0;
    const etAwayGoals1 = rng() < 0.12 ? 1 : 0;
    homeScore += etHomeGoals1;
    awayScore += etAwayGoals1;
    if (etHomeGoals1 > 0 && etHomePitch.length > 0) {
      const p = selectScorer(etHomePitch, homeTactics, rng);
      const a = selectAssister(etHomePitch, p.id, rng);
      const etDetail = generateGoalDetail(p, a, false, false, rng, 98);
      events.push({
        minute: 98,
        type: 'goal',
        clubId: homeClub.id,
        playerId: p.id,
        playerName: p.name,
        assistPlayerId: a?.id,
        assistPlayerName: a?.name,
        description: `【延長前半ゴール！】${etDetail.narrative}`,
        goalDetail: etDetail
      });
    }
    if (etAwayGoals1 > 0 && etAwayPitch.length > 0) {
      const p = selectScorer(etAwayPitch, awayTactics, rng);
      const a = selectAssister(etAwayPitch, p.id, rng);
      const etDetail = generateGoalDetail(p, a, false, false, rng, 103);
      events.push({
        minute: 103,
        type: 'goal',
        clubId: awayClub.id,
        playerId: p.id,
        playerName: p.name,
        assistPlayerId: a?.id,
        assistPlayerName: a?.name,
        description: `【延長前半ゴール！】${etDetail.narrative}`,
        goalDetail: etDetail
      });
    }

    const etHomeGoals2 = rng() < 0.12 ? 1 : 0;
    const etAwayGoals2 = rng() < 0.12 ? 1 : 0;
    homeScore += etHomeGoals2;
    awayScore += etAwayGoals2;
    if (etHomeGoals2 > 0 && etHomePitch.length > 0) {
      const p = selectScorer(etHomePitch, homeTactics, rng);
      const a = selectAssister(etHomePitch, p.id, rng);
      const etDetail = generateGoalDetail(p, a, false, false, rng, 112);
      events.push({
        minute: 112,
        type: 'goal',
        clubId: homeClub.id,
        playerId: p.id,
        playerName: p.name,
        assistPlayerId: a?.id,
        assistPlayerName: a?.name,
        description: `【延長後半ゴール！】${etDetail.narrative}`,
        goalDetail: etDetail
      });
    }
    if (etAwayGoals2 > 0 && etAwayPitch.length > 0) {
      const p = selectScorer(etAwayPitch, awayTactics, rng);
      const a = selectAssister(etAwayPitch, p.id, rng);
      const etDetail = generateGoalDetail(p, a, false, false, rng, 118);
      events.push({
        minute: 118,
        type: 'goal',
        clubId: awayClub.id,
        playerId: p.id,
        playerName: p.name,
        assistPlayerId: a?.id,
        assistPlayerName: a?.name,
        description: `【延長後半ゴール！】${etDetail.narrative}`,
        goalDetail: etDetail
      });
    }

    let stillTied = false;
    if (isTwoLeggedSecondLeg && fixture.leg1Score) {
      const finalAggHome = (fixture.leg1Score.awayScore ?? fixture.leg1Score.away ?? 0) + homeScore;
      const finalAggAway = (fixture.leg1Score.homeScore ?? fixture.leg1Score.home ?? 0) + awayScore;
      stillTied = finalAggHome === finalAggAway;
    } else {
      stillTied = homeScore === awayScore;
    }

    if (stillTied) {
      penaltyShootout = simulatePenaltyShootoutKickers(
        homeClub,
        awayClub,
        etHomePitch.length > 0 ? etHomePitch : homeStartersList,
        etAwayPitch.length > 0 ? etAwayPitch : awayStartersList,
        rng
      );
      const pkWinnerClub = penaltyShootout.winnerClubId === homeClub.id ? homeClub : awayClub;
      events.push({
        minute: 120,
        type: 'penalty',
        clubId: pkWinnerClub.id,
        playerId: pkWinnerClub.id === homeClub.id ? homeStartersList[0]?.id : awayStartersList[0]?.id,
        playerName: pkWinnerClub.name,
        description: `【PK戦決着】PK戦 (${penaltyShootout.homeScore} - ${penaltyShootout.awayScore}) により${pkWinnerClub.name}の勝利が決定！`
      });
    }
  }

  const homePossession = Math.min(72, Math.max(28, Math.round((homeRatings.attack / (homeRatings.attack + awayRatings.attack)) * 100)));

  return finalizeMatchResultAndPlayerStats({
    fixture,
    homeClub,
    awayClub,
    initialHomeStarterIds,
    initialAwayStarterIds,
    homeTactics,
    awayTactics,
    events,
    homeScore,
    awayScore,
    extraTimePlayed,
    penaltyShootout,
    playersRegistry,
    rng,
    homePossession,
    homeShots,
    awayShots,
    homeShotsOnTarget,
    awayShotsOnTarget,
    homeCorners,
    awayCorners,
    homeFouls,
    awayFouls,
    playerShots,
    playerShotsOnTarget
  });
}

/**
 * Re-simulates remaining match phases from (currentMinute + 1 .. 90+)
 * after a live tactical change, formation switch, or substitution so that newly subbed-in players
 * actively participate in subsequent events while keeping prior locked events intact.
 */
export function resimulateRemainingMatchFromMinute(
  currentMinute: number,
  lockedEvents: MatchEvent[],
  currentScore: [number, number],
  fixture: MatchFixture,
  homeClub: Club,
  awayClub: Club,
  currentHomeTactics: TeamTactics,
  currentAwayTactics: TeamTactics,
  playersRegistry: Record<string, Player>,
  options?: Omit<SimulateMatchOptions, 'startMinute' | 'lockedEvents' | 'initialScore'>
): {
  fixture: MatchFixture;
  updatedPlayers: Record<string, Player>;
} {
  return simulateFullMatch(
    fixture,
    homeClub,
    awayClub,
    currentHomeTactics,
    currentAwayTactics,
    playersRegistry,
    undefined,
    {
      ...options,
      startMinute: currentMinute,
      lockedEvents,
      initialScore: currentScore
    }
  );
}

// Helper: Realistic Scorer Selection based on position and attributes
function selectScorer(pitchPlayers: Player[], tactics?: TeamTactics, rng: () => number = Math.random): Player {
  const weights = pitchPlayers.map(p => {
    let w = 1.0;
    if (['ST', 'CF'].includes(p.position)) {
      w = 48.0;
    } else if (['RW', 'LW'].includes(p.position)) {
      w = 26.0;
    } else if (['CAM', 'RM', 'LM'].includes(p.position)) {
      w = 18.0;
    } else if (['CM', 'CDM'].includes(p.position)) {
      w = 9.0;
    } else if (['CB', 'RB', 'LB'].includes(p.position)) {
      w = 4.5;
    } else if (p.position === 'GK') {
      w = 0.05;
    }

    w *= p.shooting / 70;
    if (tactics?.roles?.penaltyTakerId === p.id) {
      w *= 1.15;
    }

    return Math.max(0.1, w);
  });

  const totalWeight = weights.reduce((acc, v) => acc + v, 0);
  let r = rng() * totalWeight;

  for (let i = 0; i < pitchPlayers.length; i++) {
    r -= weights[i];
    if (r <= 0) return pitchPlayers[i];
  }

  return pitchPlayers[0];
}

// Helper: Realistic Assister Selection
function selectAssister(pitchPlayers: Player[], scorerId: string, rng: () => number = Math.random): Player | undefined {
  const eligible = pitchPlayers.filter(p => p.id !== scorerId && p.position !== 'GK');
  if (eligible.length === 0) return undefined;

  if (rng() > 0.78) return undefined;

  const weights = eligible.map(p => {
    let w = 1.0;
    if (['CAM', 'CM'].includes(p.position)) {
      w = 38.0;
    } else if (['LW', 'RW', 'LM', 'RM'].includes(p.position)) {
      w = 34.0;
    } else if (['LB', 'RB'].includes(p.position)) {
      w = 16.0;
    } else if (['ST', 'CF'].includes(p.position)) {
      w = 14.0;
    } else if (['CDM', 'CB'].includes(p.position)) {
      w = 6.0;
    } else if (p.position === 'GK') {
      w = 0.2;
    }

    w *= p.passing / 70;
    return Math.max(0.1, w);
  });

  const totalWeight = weights.reduce((acc, v) => acc + v, 0);
  let r = rng() * totalWeight;

  for (let i = 0; i < eligible.length; i++) {
    r -= weights[i];
    if (r <= 0) return eligible[i];
  }

  return eligible[0];
}

export function generateAssistantCoachAdvice(
  homeScore: number,
  awayScore: number,
  isUserHome: boolean,
  stats: Partial<MatchStats>,
  tactics: TeamTactics
): string {
  const userScore = isUserHome ? homeScore : awayScore;
  const oppScore = isUserHome ? awayScore : homeScore;

  if (userScore > oppScore) {
    return '「前半はプラン通り優勢に進んでいます。相手は後半、より攻撃的に前がかりに出てくるはずです。中盤のスペースを消しつつ、隙を見て鋭いカウンターで追加点を狙いましょう。」';
  } else if (userScore === oppScore) {
    return '「拮抗した展開です。ボール保持率は悪くありませんが、バイタルエリアでのラストパスの精度をもう少し高めたいところです。ウイングの突破からクロスを増やすか、テンポを一段階上げて揺さぶりをかけましょう。」';
  } else {
    return '「ビハインドを背負っています。相手の素早い攻守の切り替えに後手を踏んでいます。プレスの強度を一段階引き上げ、前線からアグレッシブにボールを奪いに行く修正をお勧めします。疲労の見える選手は早めの交代を検討してください。」';
  }
}

/**
 * Requirement 7: 「試合中の結果」と「即時スキップ」を完全同期
 * - 前半2-0で即時スキップした場合、前半の2-0を絶対に消さず、残り時間だけを追加計算
 * - AI交代出場選手の記録・ゴール・アシスト・シュート・セーブ・出場時間・疲労・評価点も完全反映
 */
export function fastForwardRemainingMatch(
  currentMinute: number,
  currentEvents: MatchEvent[],
  currentScore: [number, number],
  fixture: MatchFixture,
  homeClub: Club,
  awayClub: Club,
  homeTactics: TeamTactics,
  awayTactics: TeamTactics,
  playersRegistry: Record<string, Player>,
  simulatedResult?: { fixture: MatchFixture; updatedPlayers: Record<string, Player> },
  options?: {
    initialHomeStarterIds?: string[];
    initialAwayStarterIds?: string[];
    skipAutoSubsForClubId?: string;
    subbedOutPlayerIds?: string[];
  }
): {
  fixture: MatchFixture;
  updatedPlayers: Record<string, Player>;
} {
  const initialHomeStarterIds =
    options?.initialHomeStarterIds ||
    (homeTactics.lineup?.starters || []).map(s => s.playerId).filter(Boolean);
  const initialAwayStarterIds =
    options?.initialAwayStarterIds ||
    (awayTactics.lineup?.starters || []).map(s => s.playerId).filter(Boolean);

  const fullResult =
    simulatedResult ||
    simulateFullMatch(fixture, homeClub, awayClub, homeTactics, awayTactics, playersRegistry, undefined, {
      skipAutoSubsForClubId: options?.skipAutoSubsForClubId,
      initialHomeStarterIds,
      initialAwayStarterIds,
      subbedOutPlayerIds: options?.subbedOutPlayerIds
    });

  const lockedEvents = [...currentEvents];
  const remainingEvents = (fullResult.fixture.events || []).filter(e => e.minute > currentMinute);

  const remainingHomeGoals = remainingEvents.filter(e => isRegularGoalEvent(e) && e.clubId === homeClub.id).length;
  const remainingAwayGoals = remainingEvents.filter(e => isRegularGoalEvent(e) && e.clubId === awayClub.id).length;

  const finalHomeScore = currentScore[0] + remainingHomeGoals;
  const finalAwayScore = currentScore[1] + remainingAwayGoals;
  const allFinalEvents = [...lockedEvents, ...remainingEvents].sort((a, b) => a.minute - b.minute);

  let extraTimePlayed = fullResult.fixture.extraTimePlayed || false;
  let penaltyShootout = fullResult.fixture.penaltyShootout;
  const { requiresDecider, isTwoLeggedSecondLeg } = isMatchRequiringDecider(fixture);

  let isTiedForDecider = false;
  if (requiresDecider) {
    if (isTwoLeggedSecondLeg && fixture.leg1Score) {
      const aggHome = (fixture.leg1Score.awayScore ?? fixture.leg1Score.away ?? 0) + finalHomeScore;
      const aggAway = (fixture.leg1Score.homeScore ?? fixture.leg1Score.home ?? 0) + finalAwayScore;
      isTiedForDecider = aggHome === aggAway;
    } else {
      isTiedForDecider = finalHomeScore === finalAwayScore;
    }
  }

  const effectiveSeed =
    fixture.matchSeed ??
    hashStringToNumber(`${fixture.id}_${homeClub.id}_${awayClub.id}_${fixture.date || '2026-08-01'}`);
  const rng = createPRNG(effectiveSeed + 17);

  if (isTiedForDecider && !penaltyShootout) {
    extraTimePlayed = true;
    let liveHomeTac = homeTactics;
    let liveAwayTac = awayTactics;
    allFinalEvents.forEach(ev => {
      liveHomeTac = applyMatchEventToTactics(liveHomeTac, homeClub.id, ev);
      liveAwayTac = applyMatchEventToTactics(liveAwayTac, awayClub.id, ev);
    });
    const hStarters = (liveHomeTac.lineup?.starters || []).map(s => playersRegistry[s.playerId]).filter(Boolean);
    const aStarters = (liveAwayTac.lineup?.starters || []).map(s => playersRegistry[s.playerId]).filter(Boolean);
    penaltyShootout = simulatePenaltyShootoutKickers(homeClub, awayClub, hStarters, aStarters, rng);
  }

  return finalizeMatchResultAndPlayerStats({
    fixture,
    homeClub,
    awayClub,
    initialHomeStarterIds,
    initialAwayStarterIds,
    homeTactics,
    awayTactics,
    events: allFinalEvents,
    homeScore: finalHomeScore,
    awayScore: finalAwayScore,
    extraTimePlayed,
    penaltyShootout,
    playersRegistry,
    rng: createPRNG(effectiveSeed),
    homePossession: fullResult.fixture.stats?.possession,
    homeShots: fullResult.fixture.stats?.shots?.[0],
    awayShots: fullResult.fixture.stats?.shots?.[1],
    homeShotsOnTarget: fullResult.fixture.stats?.shotsOnTarget?.[0],
    awayShotsOnTarget: fullResult.fixture.stats?.shotsOnTarget?.[1],
    homeCorners: fullResult.fixture.stats?.corners?.[0],
    awayCorners: fullResult.fixture.stats?.corners?.[1],
    homeFouls: fullResult.fixture.stats?.fouls?.[0],
    awayFouls: fullResult.fixture.stats?.fouls?.[1]
  });
}
