import { GkDetailAttributes, MarketValueHistoryEntry, Player } from '../types/game';
import { SKILL_TIER_MULTIPLIER } from './skillEngine';

function clampAttr(v: number, min = 30, max = 99): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

/**
 * Derives 6 Primary GK attributes and 8 Secondary GK attributes synced to OVR & playstyle.
 */
export function deriveGkDetailAttributes(player: Player): GkDetailAttributes {
  const baseGk = Math.max(45, player.gk || player.ovr || 70);
  const style = player.playstyle || '';
  const ovrBoost = Math.round(((player.ovr || baseGk) - baseGk) * 0.4);

  const isShotStopper = style === 'ショットストッパー';
  const isBuildup = style === 'ビルドアップ型GK';
  const isDefensiveGk = style === '守備的GK';

  const gkSaving = clampAttr(baseGk + (isShotStopper ? 3 : 1) + ovrBoost);
  const gkReflexes = clampAttr(baseGk + (isShotStopper ? 4 : isBuildup ? 1 : 2) + ovrBoost);
  const gkPositioning = clampAttr(baseGk + (isDefensiveGk ? 4 : 1) + ovrBoost);
  const gkHandling = clampAttr(baseGk + (isDefensiveGk ? 3 : 0) + ovrBoost);
  const gkRushingOut = clampAttr(baseGk + (isBuildup ? 3 : isShotStopper ? 1 : -2) + ovrBoost);
  const gkCrossClaiming = clampAttr(baseGk + (isDefensiveGk ? 2 : 0) + Math.round(((player.physical || 70) - 70) * 0.2));

  const passBase = Math.max(48, player.passing || Math.round(baseGk * 0.78));
  const shortPassing = clampAttr(passBase + (isBuildup ? 8 : 0));
  const longPassing = clampAttr(passBase + (isBuildup ? 7 : -1));
  const kickingAccuracy = clampAttr(passBase + (isBuildup ? 9 : 2));
  const physical = clampAttr(player.physical || Math.round(baseGk * 0.85));
  const jumping = clampAttr(Math.round(baseGk * 0.65 + physical * 0.35) + (isShotStopper ? 2 : 0));
  const pace = clampAttr(player.pace || Math.round(45 + Math.max(0, 32 - player.age) * 0.8));
  const stamina = clampAttr(player.stamina || Math.round(physical * 0.9 + 5));
  const composure = clampAttr(Math.round(baseGk * 0.82 + Math.min(10, Math.max(0, player.age - 20) * 0.8)) + (isBuildup ? 3 : 0));

  return {
    gkSaving,
    gkReflexes,
    gkPositioning,
    gkHandling,
    gkRushingOut,
    gkCrossClaiming,
    shortPassing,
    longPassing,
    kickingAccuracy,
    physical,
    jumping,
    pace,
    stamina,
    composure
  };
}

export function syncPlayerGkAttributes(player: Player): Player {
  if (player.position !== 'GK') return player;
  return {
    ...player,
    gkAttributes: deriveGkDetailAttributes(player)
  };
}

function getOvrBandSpec(ovr: number): {
  mid: number;
  bandMin: number;
  bandMax: number;
} {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

  if (ovr < 60) {
    return { mid: lerp(60000, 180000, (ovr - 50) / 9), bandMin: 50000, bandMax: 220000 };
  }
  if (ovr <= 64) {
    return { mid: lerp(250000, 750000, (ovr - 60) / 4), bandMin: 100000, bandMax: 1200000 };
  }
  if (ovr <= 69) {
    return { mid: lerp(900000, 2500000, (ovr - 65) / 4), bandMin: 500000, bandMax: 4000000 };
  }
  if (ovr <= 74) {
    return { mid: lerp(2800000, 7000000, (ovr - 70) / 4), bandMin: 2000000, bandMax: 10500000 };
  }
  if (ovr <= 79) {
    return { mid: lerp(7500000, 18000000, (ovr - 75) / 4), bandMin: 5000000, bandMax: 28000000 };
  }
  if (ovr <= 84) {
    return { mid: lerp(22000000, 40000000, (ovr - 80) / 4), bandMin: 18000000, bandMax: 80000000 };
  }
  if (ovr <= 87) {
    return { mid: lerp(46000000, 68000000, (ovr - 85) / 2), bandMin: 35000000, bandMax: 115000000 };
  }
  if (ovr <= 90) {
    return { mid: lerp(76000000, 102000000, (ovr - 88) / 2), bandMin: 55000000, bandMax: 165000000 };
  }
  if (ovr <= 93) {
    return { mid: lerp(110000000, 142000000, (ovr - 91) / 2), bandMin: 85000000, bandMax: 175000000 };
  }
  if (ovr <= 96) {
    return { mid: lerp(145000000, 168000000, (ovr - 94) / 2), bandMin: 105000000, bandMax: 180000000 };
  }
  return { mid: lerp(165000000, 178000000, (ovr - 97) / 2), bandMin: 120000000, bandMax: 180000000 };
}

/**
 * Dynamic Market Value Calculation (non-compounding, OVR-band anchored):
 * Estimated market value stays strictly realistic while responding naturally to
 * OVR growth, potential upside, age curve, match form, contract duration, and aging decline.
 * Note: Transfer negotiation asking prices & fees are calculated separately in transferEngine.ts.
 */
export function recalculateDynamicMarketValue(
  player: Player,
  date?: string,
  reason: string = '定期市場評価更新'
): Player {
  const ovr = Math.max(50, Math.min(99, player.ovr || 70));
  const potential = Math.max(ovr, Math.min(99, player.potential || ovr));
  const age = Math.max(15, Math.min(45, player.age || 24));
  const potGap = Math.max(0, potential - ovr);

  const { mid: baseEur, bandMin, bandMax } = getOvrBandSpec(ovr);

  // 1. Age & Potential Adjustment (non-compounding; rewards young elite wonderkids fairly without inflating 26yo role players)
  let ageFactor = 0;
  if (age <= 20) {
    const eliteYouthBonus = potential >= 88 ? 0.14 + Math.min(0.56, potGap * 0.065) : Math.min(0.24, potGap * 0.025);
    ageFactor = 0.08 + eliteYouthBonus;
  } else if (age <= 23) {
    const youngStarBonus = potential >= 88 ? 0.08 + Math.min(0.32, potGap * 0.045) : Math.min(0.16, potGap * 0.02);
    ageFactor = 0.06 + youngStarBonus;
  } else if (age <= 26) {
    ageFactor = 0.03 + Math.min(0.08, potGap * 0.015);
  } else if (age <= 28) {
    ageFactor = 0.0;
  } else if (age === 29) ageFactor = -0.10;
  else if (age === 30) ageFactor = -0.18;
  else if (age === 31) ageFactor = -0.28;
  else if (age === 32) ageFactor = -0.38;
  else if (age === 33) ageFactor = -0.48;
  else if (age === 34) ageFactor = -0.58;
  else if (age === 35) ageFactor = -0.68;
  else ageFactor = -0.76;

  // 2. Position Market Demand Factor
  let posFactor = 0;
  if (player.position === 'ST' || player.position === 'CF' || player.position === 'LW' || player.position === 'RW') {
    posFactor = 0.05;
  } else if (player.position === 'CAM' || player.position === 'CM') {
    posFactor = 0.02;
  } else if (player.position === 'GK') {
    posFactor = -0.12;
  } else if (player.position === 'CB') {
    posFactor = -0.02;
  } else {
    posFactor = -0.02;
  }

  // 3. Match Performance Adjustment (bounded small nudge, no runaway inflation)
  let perfFactor = 0;
  const apps = player.stats?.appearances || 0;
  const avgR = player.stats?.avgRating || 0;
  if (apps >= 2 && avgR > 0) {
    if (avgR >= 7.8) perfFactor += 0.06;
    else if (avgR >= 7.3) perfFactor += 0.035;
    else if (avgR >= 6.9) perfFactor += 0.015;
    else if (avgR <= 5.9) perfFactor -= 0.08;
    else if (avgR <= 6.2) perfFactor -= 0.04;
  }
  const goals = player.stats?.goals || 0;
  const assists = player.stats?.assists || 0;
  const cs = player.stats?.cleanSheets || 0;
  perfFactor += Math.min(
    0.06,
    goals * 0.003 + assists * 0.0025 + (player.position === 'GK' || player.position === 'CB' ? cs * 0.002 : 0)
  );
  if ((player.stats?.minutes || 0) >= 900) perfFactor += 0.015;

  // 4. Skill & Rare Skill Factor (modest bounded factor, never compounds with curve)
  let skillBonus = 0;
  (player.skills || []).forEach(s => {
    skillBonus += 0.004 * (SKILL_TIER_MULTIPLIER[s.tier] || 1);
  });
  (player.rareSkills || []).forEach(r => {
    skillBonus += 0.012 * (SKILL_TIER_MULTIPLIER[r.tier] || 1);
  });
  const skillFactor = Math.min(0.05, skillBonus);

  // 5. Contract Remaining Adjustment
  const yearsLeft = player.contractYearsRemaining ?? player.contractYears ?? 3;
  let contractFactor = 0;
  if (player.clubId === 'free_agent') contractFactor = -0.28;
  else if (yearsLeft <= 0.5) contractFactor = -0.25;
  else if (yearsLeft <= 1) contractFactor = -0.15;
  else if (yearsLeft === 2) contractFactor = -0.04;
  else if (yearsLeft >= 4) contractFactor = 0.04;

  // 6. Net Growth / Decline Momentum (bounded ±0.05)
  const netOvrDelta = (player.exactOvr ?? ovr) - (player.initialOvr ?? ovr);
  const momentumFactor = Math.max(-0.05, Math.min(0.05, netOvrDelta * 0.012));

  // Additive combination prevents runaway compounding inflation while reflecting genuine wonderkid value
  const netAdjustment = Math.max(
    -0.80,
    Math.min(0.95, ageFactor + posFactor + perfFactor + skillFactor + contractFactor + momentumFactor)
  );

  let rawValue = baseEur * (1 + netAdjustment);

  rawValue = Math.min(bandMax, rawValue);
  if (age <= 28 && yearsLeft > 1 && player.clubId !== 'free_agent') {
    rawValue = Math.max(bandMin, rawValue);
  }

  // Smooth rounding to realistic football market steps
  let newValue = rawValue;
  if (newValue >= 10000000) newValue = Math.round(newValue / 500000) * 500000;
  else if (newValue >= 1000000) newValue = Math.round(newValue / 100000) * 100000;
  else if (newValue >= 250000) newValue = Math.round(newValue / 50000) * 50000;
  else newValue = Math.round(newValue / 25000) * 25000;

  newValue = Math.max(50000, Math.min(180000000, newValue));

  const prevValue = player.marketValue || newValue;
  const history: MarketValueHistoryEntry[] = [...(player.marketValueHistory || [])];
  if (date && (history.length === 0 || Math.abs(newValue - prevValue) / Math.max(1, prevValue) >= 0.025)) {
    const last = history[0];
    if (!last || last.date !== date || last.value !== newValue) {
      history.unshift({
        date,
        value: newValue,
        ovr,
        reason
      });
    }
  }

  return {
    ...player,
    marketValue: newValue,
    marketValueHistory: history.slice(0, 20)
  };
}

/**
 * Individually normalizes all players' market values using the non-compounding formula.
 * Replaces inflated values from legacy versions without blind flat percentage cuts.
 */
export function normalizeAllPlayerMarketValues(
  players: Record<string, Player>,
  date: string,
  reason: string = '市場価値評価システム正規化'
): { players: Record<string, Player>; recalculatedCount: number } {
  const nextPlayers: Record<string, Player> = {};
  let recalculatedCount = 0;

  Object.entries(players).forEach(([pId, p]) => {
    if (!p) return;
    const prev = p.marketValue;
    const normalized = recalculateDynamicMarketValue(p, date, reason);
    if (normalized.marketValue !== prev) {
      recalculatedCount++;
    }
    nextPlayers[pId] = normalized;
  });

  return { players: nextPlayers, recalculatedCount };
}
