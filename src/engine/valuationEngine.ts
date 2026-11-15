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

/**
 * Dynamic Market Value Calculation:
 * Reflects OVR, Potential upside, age curve, match ratings, goals/assists/CS/minutes,
 * active normal & rare skills, remaining contract years, slump, and aging decline.
 */
export function recalculateDynamicMarketValue(
  player: Player,
  date?: string,
  reason: string = '定期市場評価更新'
): Player {
  const ovr = Math.max(50, Math.min(99, player.ovr || 70));
  const potential = Math.max(ovr, Math.min(99, player.potential || ovr));
  const age = Math.max(15, Math.min(45, player.age || 24));

  // 1. Base Valuation Curve anchored smoothly to European/Japanese football tiers
  let baseEur = 120000;
  if (ovr >= 91) baseEur = 140000000 + (ovr - 91) * 18000000;
  else if (ovr >= 88) baseEur = 95000000 + (ovr - 88) * 15000000;
  else if (ovr >= 85) baseEur = 62000000 + (ovr - 85) * 11000000;
  else if (ovr >= 82) baseEur = 36000000 + (ovr - 82) * 8500000;
  else if (ovr >= 78) baseEur = 16000000 + (ovr - 78) * 5000000;
  else if (ovr >= 74) baseEur = 5500000 + (ovr - 74) * 2600000;
  else if (ovr >= 70) baseEur = 1800000 + (ovr - 70) * 900000;
  else if (ovr >= 65) baseEur = 600000 + (ovr - 65) * 240000;
  else baseEur = 150000 + (ovr - 50) * 30000;

  // 2. Age & Potential Multiplier
  let ageMult = 1.0;
  if (age <= 20) ageMult = 1.18 + Math.max(0, potential - ovr) * 0.025;
  else if (age <= 23) ageMult = 1.12 + Math.max(0, potential - ovr) * 0.018;
  else if (age <= 26) ageMult = 1.06 + Math.max(0, potential - ovr) * 0.008;
  else if (age <= 28) ageMult = 1.0;
  else if (age <= 30) ageMult = 0.84;
  else if (age <= 32) ageMult = 0.65;
  else if (age <= 34) ageMult = 0.45;
  else if (age <= 36) ageMult = 0.28;
  else ageMult = 0.16;

  // 3. Performance Multiplier (ratings, goals, assists, clean sheets, minutes)
  let perfMult = 1.0;
  const apps = player.stats?.appearances || 0;
  const avgR = player.stats?.avgRating || 0;
  if (apps >= 2 && avgR > 0) {
    if (avgR >= 7.8) perfMult += 0.14;
    else if (avgR >= 7.3) perfMult += 0.08;
    else if (avgR >= 6.8) perfMult += 0.03;
    else if (avgR <= 5.9) perfMult -= 0.14; // Slump penalty
    else if (avgR <= 6.2) perfMult -= 0.06;
  }
  const goals = player.stats?.goals || 0;
  const assists = player.stats?.assists || 0;
  const cs = player.stats?.cleanSheets || 0;
  perfMult += Math.min(0.18, goals * 0.012 + assists * 0.009 + (player.position === 'GK' || player.position === 'CB' ? cs * 0.008 : 0));
  if ((player.stats?.minutes || 0) >= 900) perfMult += 0.03;

  // 4. Skill & Rare Skill Multiplier
  let skillBonusPct = 0;
  (player.skills || []).forEach(s => {
    skillBonusPct += 0.012 * (SKILL_TIER_MULTIPLIER[s.tier] || 1);
  });
  (player.rareSkills || []).forEach(r => {
    skillBonusPct += 0.045 * (SKILL_TIER_MULTIPLIER[r.tier] || 1);
  });
  const skillMult = 1.0 + Math.min(0.28, skillBonusPct);

  // 5. Contract Years Multiplier (Expiring contracts carry discount, 3-5 years carry premium)
  const yearsLeft = player.contractYearsRemaining ?? player.contractYears ?? 3;
  let contractMult = 1.0;
  if (player.clubId === 'free_agent') contractMult = 0.72;
  else if (yearsLeft <= 0.5) contractMult = 0.62;
  else if (yearsLeft <= 1) contractMult = 0.78;
  else if (yearsLeft === 2) contractMult = 0.94;
  else if (yearsLeft >= 4) contractMult = 1.06;

  // 6. Net Growth Momentum
  const netOvrDelta = (player.exactOvr ?? ovr) - (player.initialOvr ?? ovr);
  const momentumMult = 1.0 + Math.max(-0.18, Math.min(0.24, netOvrDelta * 0.035));

  const rawValue = baseEur * ageMult * perfMult * skillMult * contractMult * momentumMult;
  // Smooth rounding to realistic football market steps
  let newValue = rawValue;
  if (newValue >= 10000000) newValue = Math.round(newValue / 500000) * 500000;
  else if (newValue >= 1000000) newValue = Math.round(newValue / 100000) * 100000;
  else newValue = Math.round(newValue / 25000) * 25000;

  newValue = Math.max(100000, Math.min(220000000, newValue));

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
