import { MatchFixture, MatchEvent, MatchStats, TeamTactics, Player, Club, PlayerCondition } from '../types/game';
import { addDays } from './dateEngine';

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
  currentDate?: string
): MatchEligibilityCheckResult {
  const errors: string[] = [];
  const ineligibleStarters: { player: Player; reason: string; badge: string }[] = [];
  const ineligibleBench: { player: Player; reason: string; badge: string }[] = [];
  const ineligibleAll: { player: Player; reason: string; badge: string; role: 'STARTER' | 'BENCH' }[] = [];
  const ineligiblePlayerIds: string[] = [];

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

    if (p.suspension?.isSuspended || (p.suspension?.matchesRemaining || 0) > 0) {
      const reason = `出場停止処分中 (残${p.suspension.matchesRemaining}試合)`;
      const badge = '【出場停止】';
      errors.push(`【出場停止中】${p.name}選手は出場停止処分中のため出場できません。`);
      ineligibleStarters.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'STARTER' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    if (p.squadStatus === 'OUT_OF_SQUAD') {
      const reason = 'ベンチ外登録';
      const badge = '【登録外】';
      errors.push(`【ベンチ外登録】${p.name}選手はベンチ外に設定されているため出場できません。`);
      ineligibleStarters.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'STARTER' });
      ineligiblePlayerIds.push(pId);
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

    if (p.suspension?.isSuspended || (p.suspension?.matchesRemaining || 0) > 0) {
      const reason = `出場停止中 (残${p.suspension.matchesRemaining}試合)`;
      const badge = '【出場停止】';
      errors.push(`【ベンチ停止警告】${p.name}選手は出場停止処分中のためベンチ登録できません。`);
      ineligibleBench.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'BENCH' });
      ineligiblePlayerIds.push(pId);
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
  (s: string, a?: string) => `【GOAL!!】CKから${s}がマークを外して打点の高いヘディングシュート！ゴールネットを揺らす！${a ? ` (キッカー: ${a})` : ''}`
];

const WOODWORK_COMMENTARIES = [
  (p: string) => `【決定機逸】${p}がペナルティエリア中央から強烈なシュートを放つも、惜しくもクロスバー直撃！`,
  (p: string) => `【ポスト直撃！】${p}が左足を振り抜くが、ボールは左ポストを叩いて跳ね返る！スタジアムがどよめく！`,
  (p: string) => `【惜しいシュート】${p}のミドルシュートが右ポストをかすめて枠外へ。決定的なチャンスでした。`
];

const SAVE_COMMENTARIES = [
  (gk: string, shooter: string) => `【ファインセーブ！】${shooter}の決定的なシュートを相手守護神${gk}が驚異的な反応で横っ飛びセーブ！`,
  (gk: string, shooter: string) => `【ビッグセーブ！】1対1の絶体絶命のピンチを${gk}が足一本で防ぎ切る！`,
  (gk: string, shooter: string) => `【スーパーセーブ】至近距離からの${shooter}のヘディングシュートを${gk}が右手一本でバーの上へ弾き出す！`
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

// -------------------------------------------------------------
// 【3 & 4. 試合シミュレーションエンジン (0-0過多解消 & 時間帯展開)】
// -------------------------------------------------------------
export function simulateFullMatch(
  fixture: MatchFixture,
  homeClub: Club,
  awayClub: Club,
  homeTactics: TeamTactics,
  awayTactics: TeamTactics,
  playersRegistry: Record<string, Player>,
  forcedSeed?: number
): {
  fixture: MatchFixture;
  updatedPlayers: Record<string, Player>;
} {
  const events: MatchEvent[] = [];
  const updatedPlayers = { ...playersRegistry };

  // Requirement 7 & 8: MATCH_SIMULATION_SEED guarantees 100% deterministic scenario
  const effectiveSeed = forcedSeed ?? fixture.matchSeed ?? hashStringToNumber(`${fixture.id}_${homeClub.id}_${awayClub.id}_${fixture.date || '2026-08-01'}`);
  const rng = createPRNG(effectiveSeed);

  // Sanitize on-pitch starters (filter out any injured, suspended, or invalid club membership)
  const sanitizeStarters = (club: Club, tactics?: TeamTactics): string[] => {
    const rawStarters = (tactics?.lineup?.starters || []).map((s: any) => typeof s === 'string' ? s : s?.playerId).filter(Boolean);
    const valid: string[] = [];
    const clubPlayerIds = club?.playerIds || [];

    rawStarters.forEach(pId => {
      const p = updatedPlayers[pId];
      if (p && p.injuryStatus !== 'INJURED' && !p.injury?.isInjured && !p.suspension?.isSuspended && p.clubId === club.id) {
        valid.push(pId);
      }
    });

    if (valid.length < 11) {
      for (const pId of clubPlayerIds) {
        if (valid.length >= 11) break;
        if (!valid.includes(pId)) {
          const p = updatedPlayers[pId];
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

  const homeStartersList = homePitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);
  const awayStartersList = awayPitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);

  // Compute attack and defense ratings
  const getSubRating = (list: Player[], positions: string[], fallback: number): number => {
    const filtered = list.filter(p => positions.includes(p.position));
    if (filtered.length === 0) return fallback;
    return filtered.reduce((acc, p) => acc + calculateEffectivePlayerPower(p), 0) / filtered.length;
  };

  const homeFWPower = getSubRating(homeStartersList, ['ST', 'CF', 'RW', 'LW'], 72);
  const homeMFPower = getSubRating(homeStartersList, ['CAM', 'CM', 'CDM', 'RM', 'LM'], 72);
  const homeDFPower = getSubRating(homeStartersList, ['CB', 'RB', 'LB', 'LWB', 'RWB'], 72);
  const homeGKPower = homeStartersList.find(p => p.position === 'GK')?.ovr || 72;

  const awayFWPower = getSubRating(awayStartersList, ['ST', 'CF', 'RW', 'LW'], 72);
  const awayMFPower = getSubRating(awayStartersList, ['CAM', 'CM', 'CDM', 'RM', 'LM'], 72);
  const awayDFPower = getSubRating(awayStartersList, ['CB', 'RB', 'LB', 'LWB', 'RWB'], 72);
  const awayGKPower = awayStartersList.find(p => p.position === 'GK')?.ovr || 72;

  // Analyze formation profiles and tactical setup (Requirement 5 & 6)
  const getFormationProfile = (tactics: TeamTactics, startersList: Player[]) => {
    const f = tactics.formation;
    const is5Back = f.startsWith('5-') || startersList.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)).length >= 5;
    const is3Back = f.startsWith('3-');
    const is4Back = f.startsWith('4-');

    const wingCount = startersList.filter(p => ['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB'].includes(p.position)).length;
    const centralCount = startersList.filter(p => ['CAM', 'CM', 'CDM', 'ST', 'CF'].includes(p.position)).length;
    const fwCount = startersList.filter(p => ['ST', 'CF', 'RW', 'LW'].includes(p.position)).length;
    const mfCount = startersList.filter(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position)).length;

    // Custom pitch positioning metrics (Requirement 6: free positioning influence)
    const avgPitchY = tactics.lineup.starters.length > 0 
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

  const homeProfile = getFormationProfile(homeTactics, homeStartersList);
  const awayProfile = getFormationProfile(awayTactics, awayStartersList);

  // Home advantage (+6% home power) and formation tactical influence (Requirement 5)
  let homeAttack = (homeFWPower * 0.55 + homeMFPower * 0.45) * 1.06 * homeProfile.pushUpFactor;
  if (homeProfile.isWingOriented || homeProfile.fwCount >= 3) homeAttack *= 1.05;
  if (homeProfile.isMidfieldDominant) homeAttack *= 1.03;

  let awayDefense = awayDFPower * 0.65 + awayGKPower * 0.35;
  if (awayProfile.isSolidDefense) awayDefense *= 1.14;

  let awayAttack = (awayFWPower * 0.55 + awayMFPower * 0.45) * awayProfile.pushUpFactor;
  if (awayProfile.isWingOriented || awayProfile.fwCount >= 3) awayAttack *= 1.05;
  if (awayProfile.isMidfieldDominant) awayAttack *= 1.03;

  let homeDefense = (homeDFPower * 0.65 + homeGKPower * 0.35) * 1.03;
  if (homeProfile.isSolidDefense) homeDefense *= 1.14;

  let homeScore = 0;
  let awayScore = 0;
  let homeShots = 0;
  let awayShots = 0;
  let homeShotsOnTarget = 0;
  let awayShotsOnTarget = 0;
  let homeCorners = 0;
  let awayCorners = 0;
  let homeFouls = 0;
  let awayFouls = 0;

  const yellowCardCounts: Record<string, number> = {};
  const playerRatings: Record<string, number> = {};
  [...homeStartersList, ...awayStartersList].forEach(p => {
    playerRatings[p.id] = +(6.0 + (rng() * 0.6)).toFixed(1);
  });

  // -------------------------------------------------------------
  // Dynamic Simulation across 22 paced match phases (every 4-5 mins)
  // -------------------------------------------------------------
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

  timePhases.forEach(({ min, phase }) => {
    const jitter = Math.floor(rng() * 3) - 1;
    const eventMin = Math.max(1, Math.min(94, min + jitter));

    const currentHomePitch = homePitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);
    const currentAwayPitch = awayPitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);

    // Phase modifiers (Requirement 4)
    let phaseChanceMultiplier = 1.0;
    if (phase === 'probing') {
      phaseChanceMultiplier = 0.65; // 0-15m 様子見
    } else if (phase === 'ramp_up') {
      phaseChanceMultiplier = 0.95; // 15-30m チャンス増加
    } else if (phase === 'late_first') {
      phaseChanceMultiplier = 1.15; // 30-45m 疲労・前半終了間際
    } else if (phase === 'restart') {
      phaseChanceMultiplier = 0.85; // 45-60m ハーフタイム後立て直し
    } else if (phase === 'subs_impact') {
      phaseChanceMultiplier = 1.10; // 60-75m 交代による活性化
    } else if (phase === 'high_risk' || phase === 'stoppage') {
      phaseChanceMultiplier = 1.35; // 75-90m+ 疲労蓄積・リスク冒して前がかり
    }

    // Trailing team tactical desperation (behind teams push forward)
    let homeTrailingBonus = 1.0;
    let awayTrailingBonus = 1.0;
    if (eventMin >= 60) {
      if (homeScore < awayScore) homeTrailingBonus = 1.25;
      if (awayScore < homeScore) awayTrailingBonus = 1.25;
    }

    // --- HOME ATTACK ATTEMPT ---
    const homeAttackRatio = Math.max(0.70, Math.min(1.4, homeAttack / Math.max(40, awayDefense)));
    const homeChanceThreshold = 0.42 * homeAttackRatio * phaseChanceMultiplier * homeTrailingBonus;

    if (rng() < homeChanceThreshold && currentHomePitch.length > 0) {
      homeShots++;
      const onTargetChance = 0.48 + (homeFWPower - awayGKPower) * 0.005;
      const onTarget = rng() < Math.max(0.32, Math.min(0.68, onTargetChance));

      if (onTarget) {
        homeShotsOnTarget++;
        // Goal conversion probability (Requirement 3: realistic goal distribution)
        const conversionChance = 0.38 + (homeFWPower - awayGKPower) * 0.006;
        const isGoal = rng() < Math.max(0.24, Math.min(0.55, conversionChance));

        if (isGoal) {
          homeScore++;

          // Weighted Scorer Selection (Requirement 5: ST/Winger/MF/CB variety)
          const scorer = selectScorer(currentHomePitch.length > 0 ? currentHomePitch : homeStartersList, homeTactics);
          const assister = selectAssister(currentHomePitch.length > 0 ? currentHomePitch : homeStartersList, scorer.id);

          const commentaryFn = GOAL_COMMENTARIES[Math.floor(rng() * GOAL_COMMENTARIES.length)];
          events.push({
            minute: eventMin,
            type: 'goal',
            clubId: homeClub.id,
            playerId: scorer.id,
            playerName: scorer.name,
            assistPlayerId: assister?.id,
            assistPlayerName: assister?.name,
            description: commentaryFn(scorer.name, assister?.name)
          });

          playerRatings[scorer.id] = Math.min(9.9, (playerRatings[scorer.id] || 6.0) + 1.2);
          if (assister) playerRatings[assister.id] = Math.min(9.5, (playerRatings[assister.id] || 6.0) + 0.6);
        } else {
          // Goalkeeper Save
          const awayGK = currentAwayPitch.find(p => p.position === 'GK') || currentAwayPitch[0] || awayStartersList[0];
          const shooter = currentHomePitch[Math.floor(rng() * currentHomePitch.length)] || homeStartersList[0];
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
            playerRatings[awayGK.id] = Math.min(9.2, (playerRatings[awayGK.id] || 6.0) + 0.4);
          }
        }
      } else {
        if (rng() < 0.12) {
          const shooter = currentHomePitch[Math.floor(rng() * currentHomePitch.length)] || homeStartersList[0];
          if (shooter) {
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
    const awayAttackRatio = Math.max(0.70, Math.min(1.4, awayAttack / Math.max(40, homeDefense)));
    const awayChanceThreshold = 0.38 * awayAttackRatio * phaseChanceMultiplier * awayTrailingBonus;

    if (rng() < awayChanceThreshold && currentAwayPitch.length > 0) {
      awayShots++;
      const onTargetChance = 0.48 + (awayFWPower - homeGKPower) * 0.005;
      const onTarget = rng() < Math.max(0.32, Math.min(0.68, onTargetChance));

      if (onTarget) {
        awayShotsOnTarget++;
        const conversionChance = 0.36 + (awayFWPower - homeGKPower) * 0.006;
        const isGoal = rng() < Math.max(0.22, Math.min(0.52, conversionChance));

        if (isGoal) {
          awayScore++;

          const scorer = selectScorer(currentAwayPitch.length > 0 ? currentAwayPitch : awayStartersList, awayTactics);
          const assister = selectAssister(currentAwayPitch.length > 0 ? currentAwayPitch : awayStartersList, scorer.id);

          const commentaryFn = GOAL_COMMENTARIES[Math.floor(rng() * GOAL_COMMENTARIES.length)];
          events.push({
            minute: eventMin,
            type: 'goal',
            clubId: awayClub.id,
            playerId: scorer.id,
            playerName: scorer.name,
            assistPlayerId: assister?.id,
            assistPlayerName: assister?.name,
            description: commentaryFn(scorer.name, assister?.name)
          });

          playerRatings[scorer.id] = Math.min(9.9, (playerRatings[scorer.id] || 6.0) + 1.2);
          if (assister) playerRatings[assister.id] = Math.min(9.5, (playerRatings[assister.id] || 6.0) + 0.6);
        } else {
          // Goalkeeper Save
          const homeGK = currentHomePitch.find(p => p.position === 'GK') || currentHomePitch[0] || homeStartersList[0];
          const shooter = currentAwayPitch[Math.floor(rng() * currentAwayPitch.length)] || awayStartersList[0];
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
            playerRatings[homeGK.id] = Math.min(9.2, (playerRatings[homeGK.id] || 6.0) + 0.4);
          }
        }
      } else {
        if (rng() < 0.12) {
          const shooter = currentAwayPitch[Math.floor(rng() * currentAwayPitch.length)] || awayStartersList[0];
          if (shooter) {
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

    // --- CARDS & FOULS (with second-yellow send off rule) ---
    if (rng() < 0.08) {
      const isHomeFoul = rng() < 0.5;
      const targetClub = isHomeFoul ? homeClub : awayClub;
      const targetPitch = isHomeFoul ? currentHomePitch : currentAwayPitch;

      if (isHomeFoul) homeFouls++; else awayFouls++;

      if (targetPitch.length > 0) {
        const offender = targetPitch[Math.floor(rng() * targetPitch.length)];
        const priorYellows = yellowCardCounts[offender.id] || 0;

        if (priorYellows === 1) {
          // 2nd Yellow -> Red Card (1 match suspension)
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
          } else {
            awayPitchPlayers = awayPitchPlayers.filter(id => id !== offender.id);
          }

          if (updatedPlayers[offender.id]) {
            updatedPlayers[offender.id].suspension = {
              isSuspended: true,
              matchesRemaining: cardDetails.matchesRemaining,
              reason: cardDetails.reason
            };
            updatedPlayers[offender.id].squadStatus = 'OUT_OF_SQUAD';
          }
        } else if (priorYellows === 0) {
          // Low realistic chance of straight red card (DOGSO, dangerous tackle, violent conduct, extreme rare 10-match)
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
            } else {
              awayPitchPlayers = awayPitchPlayers.filter(id => id !== offender.id);
            }
            if (updatedPlayers[offender.id]) {
              updatedPlayers[offender.id].suspension = {
                isSuspended: true,
                matchesRemaining: cardDetails.matchesRemaining,
                reason: cardDetails.reason
              };
              updatedPlayers[offender.id].squadStatus = 'OUT_OF_SQUAD';
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

    // --- IN-MATCH INJURY RISK SYSTEM (Requirement 2: 低頻度・軽傷中心・重復加算防止) ---
    const allOnPitch = [...currentHomePitch, ...currentAwayPitch];
    const matchInjuriesCount = events.filter(e => e.type === 'injury').length;
    if (matchInjuriesCount < 2) {
      for (const player of allOnPitch) {
        const isHome = currentHomePitch.some(p => p.id === player.id);
        const teamInjuries = events.filter(e => e.type === 'injury' && e.clubId === (isHome ? homeClub.id : awayClub.id)).length;
        if (teamInjuries >= 1) continue; // At most 1 injury per team in a single match

        const pressStyle = isHome ? homeTactics.instructions.pressIntensity : awayTactics.instructions.pressIntensity;
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

        // Update player record immediately
        if (updatedPlayers[player.id]) {
          const returnDate = addDays(fixture.date, chosenInj.days);
          updatedPlayers[player.id].injuryStatus = 'INJURED';
          updatedPlayers[player.id].injuryStartDate = fixture.date;
          updatedPlayers[player.id].injuryReturnDate = returnDate;
          updatedPlayers[player.id].injuryType = chosenInj.name;
          updatedPlayers[player.id].injuryDaysRemaining = chosenInj.days;
          updatedPlayers[player.id].injury = {
            isInjured: true,
            type: chosenInj.name,
            recoveryDays: chosenInj.days,
            returnDate
          };
          updatedPlayers[player.id].squadStatus = 'OUT_OF_SQUAD';
        }

        // Sub player off the active pitch list
        if (isHome) {
          homePitchPlayers = homePitchPlayers.filter(id => id !== player.id);
        } else {
          awayPitchPlayers = awayPitchPlayers.filter(id => id !== player.id);
        }

        // Break to avoid multiple injuries in the same minute
        break;
      }
    }
  }
  });

  // Sort events chronologically
  events.sort((a, b) => a.minute - b.minute);

  // Requirement 11: Cup Tournament decisive extra time and penalties if drawn
  let extraTimePlayed = false;
  let penaltyShootout: { homeScore: number; awayScore: number } | undefined = undefined;

  const isCupTie = fixture.competition.includes('cup') || 
                   fixture.competition === 'copa-del-rey' || 
                   fixture.competition === 'dfb-pokal' || 
                   fixture.competition === 'coppa-italia' || 
                   fixture.competition === 'coupe-de-france' ||
                   fixture.competition === 'ucl' ||
                   fixture.competition === 'uel';

  if (isCupTie && homeScore === awayScore) {
    extraTimePlayed = true;
    const etHomeGoals = rng() < 0.22 ? 1 : 0;
    const etAwayGoals = rng() < 0.22 ? 1 : 0;
    homeScore += etHomeGoals;
    awayScore += etAwayGoals;
    if (etHomeGoals > 0) {
      events.push({ minute: 104, type: 'goal', clubId: homeClub.id, playerId: homeStartersList[0]?.id || '', playerName: homeStartersList[0]?.name || '', description: `【延長戦ゴール！】${homeStartersList[0]?.name}が劇的な勝ち越しゴール！` });
    }
    if (etAwayGoals > 0) {
      events.push({ minute: 116, type: 'goal', clubId: awayClub.id, playerId: awayStartersList[0]?.id || '', playerName: awayStartersList[0]?.name || '', description: `【延長戦ゴール！】${awayStartersList[0]?.name}が土壇場で同点ゴール！` });
    }

    if (homeScore === awayScore) {
      let pHome = 0;
      let pAway = 0;
      for (let k = 0; k < 5; k++) {
        if (rng() < 0.75) pHome++;
        if (rng() < 0.75) pAway++;
      }
      if (pHome === pAway) {
        if (rng() < 0.5) pHome++; else pAway++;
      }
      penaltyShootout = { homeScore: pHome, awayScore: pAway };
      events.push({
        minute: 120,
        type: 'penalty',
        clubId: pHome > pAway ? homeClub.id : awayClub.id,
        playerId: (pHome > pAway ? homeStartersList[0]?.id : awayStartersList[0]?.id) || '',
        playerName: (pHome > pAway ? homeClub.name : awayClub.name),
        description: `【PK戦決着】PK戦 (${pHome} - ${pAway}) により${pHome > pAway ? homeClub.name : awayClub.name}の勝利が決定！`
      });
    }
  }

  const homePossession = Math.min(72, Math.max(28, Math.round((homeAttack / (homeAttack + awayAttack)) * 100)));
  const homeXG = +(homeShotsOnTarget * 0.32 + (homeShots - homeShotsOnTarget) * 0.06).toFixed(2);
  const awayXG = +(awayShotsOnTarget * 0.30 + (awayShots - awayShotsOnTarget) * 0.06).toFixed(2);

  let bestRating = 0;
  let motmId = homeStartersList[0]?.id;
  Object.entries(playerRatings).forEach(([pId, rating]) => {
    if (rating > bestRating) {
      bestRating = rating;
      motmId = pId;
    }
  });

  // Fatigue accumulation, match stats, and OVR Growth updates for starters (Requirements 5, 6, 14)
  [...homeStartersList, ...awayStartersList].forEach(p => {
    const updated = updatedPlayers[p.id];
    if (updated) {
      // Natural fatigue accumulation (+14 to +20 depending on playing tempo)
      updated.fatigue = Math.min(100, updated.fatigue + 16);
      updated.stats.appearances += 1;
      updated.stats.starts += 1;
      updated.stats.minutes += 90;

      const scored = events.filter(e => e.type === 'goal' && e.playerId === p.id).length;
      const assisted = events.filter(e => e.type === 'goal' && e.assistPlayerId === p.id).length;
      updated.stats.goals += scored;
      updated.stats.assists += assisted;

      const currAvg = updated.stats.avgRating || 6.5;
      const currApps = updated.stats.appearances;
      const matchRating = playerRatings[p.id] || 6.5;
      updated.stats.avgRating = +( (currAvg * (currApps - 1) + matchRating) / currApps ).toFixed(2);

      const isCleanSheet = (p.position === 'GK' || ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)) && 
        ((p.clubId === homeClub.id && awayScore === 0) || (p.clubId === awayClub.id && homeScore === 0));

      if (isCleanSheet) {
        updated.stats.cleanSheets += 1;
      }

      // Requirements 5, 6, 14: Continuous long-term incremental performance growth
      const growthResult = processPlayerPerformanceGrowth(updated, {
        rating: matchRating,
        minutes: 90,
        goals: scored,
        assists: assisted,
        cleanSheet: isCleanSheet,
        isMotm: motmId === p.id
      });
      updated.exactOvr = growthResult.exactOvr;
      updated.ovr = growthResult.ovr;
      updated.matchRatingsHistory = growthResult.matchRatingsHistory;
    }
  });

  const stats: MatchStats = {
    homeScore,
    awayScore,
    possession: homePossession,
    shots: [Math.max(homeScore, homeShots), Math.max(awayScore, awayShots)],
    shotsOnTarget: [Math.max(homeScore, homeShotsOnTarget), Math.max(awayScore, awayShotsOnTarget)],
    xG: [homeXG, awayXG],
    corners: [Math.max(1, homeCorners), Math.max(1, awayCorners)],
    fouls: [Math.max(homeFouls, 4), Math.max(awayFouls, 4)],
    passesCompleted: [Math.floor(homePossession * 8.5), Math.floor((100 - homePossession) * 8.5)],
    passAccuracy: [83 + Math.floor(rng() * 7), 81 + Math.floor(rng() * 7)],
    playerRatings
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

// Helper: Realistic Scorer Selection based on position and attributes
function selectScorer(pitchPlayers: Player[], tactics?: TeamTactics): Player {
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
      w = 4.5; // CB header on corners / overlapping FB
    } else if (p.position === 'GK') {
      w = 0.05;
    }

    // Boost by shooting attribute
    w *= (p.shooting / 70);

    // Boost if assigned penalty taker
    if (tactics?.roles?.penaltyTakerId === p.id) {
      w *= 1.15;
    }

    return Math.max(0.1, w);
  });

  const totalWeight = weights.reduce((acc, v) => acc + v, 0);
  let r = Math.random() * totalWeight;

  for (let i = 0; i < pitchPlayers.length; i++) {
    r -= weights[i];
    if (r <= 0) return pitchPlayers[i];
  }

  return pitchPlayers[0];
}

// Helper: Realistic Assister Selection
function selectAssister(pitchPlayers: Player[], scorerId: string): Player | undefined {
  const eligible = pitchPlayers.filter(p => p.id !== scorerId);
  if (eligible.length === 0) return undefined;

  // 78% of goals have an assist
  if (Math.random() > 0.78) return undefined;

  const weights = eligible.map(p => {
    let w = 1.0;
    if (['CAM', 'CM'].includes(p.position)) {
      w = 38.0; // Playmakers
    } else if (['LW', 'RW', 'LM', 'RM'].includes(p.position)) {
      w = 34.0; // Crossers / wingers
    } else if (['LB', 'RB'].includes(p.position)) {
      w = 16.0; // Overlapping fullbacks
    } else if (['ST', 'CF'].includes(p.position)) {
      w = 14.0; // Strike partners
    } else if (['CDM', 'CB'].includes(p.position)) {
      w = 6.0;  // Long balls
    } else if (p.position === 'GK') {
      w = 0.2;  // Long goal kick assist
    }

    w *= (p.passing / 70);
    return Math.max(0.1, w);
  });

  const totalWeight = weights.reduce((acc, v) => acc + v, 0);
  let r = Math.random() * totalWeight;

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
 * - 最終結果は必ず 2-0 以上の得点状況から継続し、0-1等の矛盾を100%排除
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
  simulatedResult?: { fixture: MatchFixture; updatedPlayers: Record<string, Player> }
): {
  fixture: MatchFixture;
  updatedPlayers: Record<string, Player>;
} {
  // If simulatedResult exists and its base scenario matches, use its events for the remaining period
  const fullResult = simulatedResult || simulateFullMatch(fixture, homeClub, awayClub, homeTactics, awayTactics, playersRegistry);
  
  // Events that already occurred up to currentMinute
  const lockedEvents = [...currentEvents];
  
  // Calculate remaining events (minute > currentMinute)
  const remainingEvents = (fullResult.fixture.events || []).filter(e => e.minute > currentMinute);
  
  // Goals scored in the remaining time
  const remainingHomeGoals = remainingEvents.filter(e => e.type === 'goal' && e.clubId === homeClub.id).length;
  const remainingAwayGoals = remainingEvents.filter(e => e.type === 'goal' && e.clubId === awayClub.id).length;
  
  // Guaranteed cumulative score: current score + any new goals in remaining time
  const finalHomeScore = currentScore[0] + remainingHomeGoals;
  const finalAwayScore = currentScore[1] + remainingAwayGoals;
  
  const allFinalEvents = [...lockedEvents, ...remainingEvents].sort((a, b) => a.minute - b.minute);
  
  // Check cup tie decisive outcome if drawn
  let extraTimePlayed = fullResult.fixture.extraTimePlayed || false;
  let penaltyShootout = fullResult.fixture.penaltyShootout;
  const isCupTie = fixture.competition.includes('cup') || 
                   fixture.competition === 'copa-del-rey' || 
                   fixture.competition === 'dfb-pokal' || 
                   fixture.competition === 'coppa-italia' || 
                   fixture.competition === 'coupe-de-france' ||
                   fixture.competition === 'ucl' ||
                   fixture.competition === 'uel';
  
  if (isCupTie && finalHomeScore === finalAwayScore && !penaltyShootout) {
    extraTimePlayed = true;
    penaltyShootout = { homeScore: 5, awayScore: 4 }; // Decisive shootout
  }
  
  const updatedFixture: MatchFixture = {
    ...fullResult.fixture,
    status: 'finished',
    homeScore: finalHomeScore,
    awayScore: finalAwayScore,
    extraTimePlayed,
    penaltyShootout,
    events: allFinalEvents,
    isResultApplied: false
  };
  
  return {
    fixture: updatedFixture,
    updatedPlayers: fullResult.updatedPlayers
  };
}
