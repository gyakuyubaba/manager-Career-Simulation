import { Club } from '../types/game';
import { ALL_CLUBS, ENABLE_J_LEAGUE } from '../data/clubsData';
import { J2_20_CLUBS, J3_20_CLUBS } from '../data/jLeagueData';
import { ALL_EUROPEAN_2ND_DIVISION_CLUBS } from '../data/europeanSecondDivisionClubs';
import { ALL_NEW_4_LEAGUES_CLUBS } from '../data/europeanNewLeaguesData';

const TOP_5_LEAGUES = new Set([
  'premier-league',
  'laliga',
  'bundesliga',
  'serie-a',
  'ligue-1'
]);

const EURO_CHALLENGER_LEAGUES = new Set([
  'primeira-liga',
  'eredivisie',
  'super-lig',
  'pro-league'
]);

const EURO_2ND_LEAGUES = new Set([
  'championship',
  'segunda-division',
  '2-bundesliga',
  'serie-b',
  'ligue-2'
]);

const J_LEAGUES = new Set([
  'j1-league',
  'j2-league',
  'j3-league'
]);

function stableClubFactor(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000; // 0.000 .. 0.999
}

function roundBudgetStep(eur: number): number {
  if (eur >= 50000000) return Math.round(eur / 1000000) * 1000000;
  if (eur >= 10000000) return Math.round(eur / 500000) * 500000;
  if (eur >= 2000000) return Math.round(eur / 250000) * 250000;
  return Math.round(eur / 100000) * 100000;
}

/**
 * Calibrates each club's realistic transfer budget across all 17 leagues / 329 clubs,
 * strictly avoiding uniform/flat budgets while ensuring healthy market liquidity:
 * - World Big Clubs: 100M - 250M
 * - European Strong / Upper Clubs: 50M - 150M
 * - European Mid Clubs: 20M - 70M
 * - European Small / Lower Clubs: 5M - 30M
 * - J-League: Top 5M - 20M / Mid 3M - 15M / Small 1M - 10M
 */
export function calculateCalibratedClubTransferBudget(club: Club): number {
  if (club.id === 'free_agent') return 0;

  const rep = Math.max(55, Math.min(99, club.reputation || 72));
  const cap = Math.max(5000, Math.min(105000, club.stadiumCapacity || 25000));
  const wageM = Math.max(0.05, (club.wageBudget || 500000) / 1000000);
  const hashBias = (stableClubFactor(club.id) - 0.5) * 0.08; // ±4% unique club differentiation

  // Club prestige blend inside its league/tier (0.0 .. 1.0)
  const capNorm = Math.max(0, Math.min(1, (cap - 8000) / 72000));
  const wageNorm = Math.max(0, Math.min(1, wageM / 4.8));

  let minB = 10000000;
  let maxB = 20000000;
  let t = 0.5;

  if (TOP_5_LEAGUES.has(club.league)) {
    const isPL = club.league === 'premier-league';
    const isES = club.league === 'laliga';
    const isDE = club.league === 'bundesliga';
    const isFR = club.league === 'ligue-1';

    if (club.tier === 'Elite' || (isPL && rep >= 87)) {
      // World Big Clubs: 100M - 250M
      minB = isPL ? 140000000 : isFR ? 185000000 : isES ? 115000000 : isDE ? 120000000 : 105000000;
      maxB = isPL ? 235000000 : isFR ? 225000000 : isES ? 240000000 : isDE ? 195000000 : 155000000;
      const repT = Math.max(0, Math.min(1, (rep - 87) / 9));
      t = repT * 0.65 + wageNorm * 0.25 + capNorm * 0.10;
      // Preserve Barcelona's relative financial constraint vs Real Madrid while remaining Big Club tier
      if (club.id === 'barcelona') t = Math.min(t, 0.30);
      if (club.id === 'real_madrid') t = Math.max(t, 0.92);
      if (club.id === 'man_city') t = Math.max(t, 0.88);
      if (club.id === 'psg') t = Math.max(t, 0.68);
    } else if (club.tier === 'Upper') {
      // European Upper / Strong Clubs: 50M - 150M
      minB = isPL ? 85000000 : 55000000;
      maxB = isPL ? 135000000 : 100000000;
      const repT = Math.max(0, Math.min(1, (rep - 79) / 9));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    } else if (club.tier === 'Mid') {
      // European Mid Clubs: 20M - 70M
      minB = isPL ? 44000000 : 28000000;
      maxB = isPL ? 68000000 : 54000000;
      const repT = Math.max(0, Math.min(1, (rep - 73) / 8));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    } else {
      // Lower tier in Top 5: 20M - 42M
      minB = isPL ? 30000000 : 20000000;
      maxB = isPL ? 42000000 : 30000000;
      const repT = Math.max(0, Math.min(1, (rep - 69) / 6));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    }
  } else if (EURO_CHALLENGER_LEAGUES.has(club.league)) {
    if (club.tier === 'Elite') {
      // Top Portuguese / Dutch / Turkish / Belgian giants: 50M - 88M
      minB = 50000000;
      maxB = 88000000;
      const repT = Math.max(0, Math.min(1, (rep - 82) / 6));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    } else if (club.tier === 'Upper') {
      // European Mid: 24M - 48M
      minB = 24000000;
      maxB = 48000000;
      const repT = Math.max(0, Math.min(1, (rep - 75) / 8));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    } else if (club.tier === 'Mid') {
      // European Small / Lower-Mid: 12M - 24M
      minB = 12000000;
      maxB = 24000000;
      const repT = Math.max(0, Math.min(1, (rep - 70) / 6));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    } else {
      // European Small: 6M - 14M
      minB = 6000000;
      maxB = 14000000;
      const repT = Math.max(0, Math.min(1, (rep - 66) / 5));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    }
  } else if (EURO_2ND_LEAGUES.has(club.league)) {
    const isChamp = club.league === 'championship';
    if (club.tier === 'Upper') {
      // 2nd Div Upper: 20M - 46M
      minB = isChamp ? 28000000 : 20000000;
      maxB = isChamp ? 46000000 : 32000000;
      const repT = Math.max(0, Math.min(1, (rep - 73) / 6));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    } else if (club.tier === 'Mid') {
      // 2nd Div Mid: 10M - 28M
      minB = isChamp ? 16000000 : 10000000;
      maxB = isChamp ? 28000000 : 20000000;
      const repT = Math.max(0, Math.min(1, (rep - 70) / 6));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    } else {
      // 2nd Div Lower: 5M - 16M
      minB = isChamp ? 9000000 : 5000000;
      maxB = isChamp ? 16000000 : 12000000;
      const repT = Math.max(0, Math.min(1, (rep - 67) / 5));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    }
  } else if (J_LEAGUES.has(club.league)) {
    if (club.league === 'j1-league') {
      if (club.tier === 'Elite') {
        // J1 Top: 13M - 20M
        minB = 13000000;
        maxB = 20000000;
        const repT = Math.max(0, Math.min(1, (rep - 79) / 5));
        t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
      } else if (club.tier === 'Upper') {
        // J1 Upper: 9M - 15M
        minB = 9000000;
        maxB = 15000000;
        const repT = Math.max(0, Math.min(1, (rep - 76) / 5));
        t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
      } else {
        // J1 Mid/Lower: 6M - 11.5M
        minB = club.tier === 'Lower' ? 5000000 : 6500000;
        maxB = club.tier === 'Lower' ? 8500000 : 11500000;
        const repT = Math.max(0, Math.min(1, (rep - 71) / 6));
        t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
      }
    } else if (club.league === 'j2-league') {
      if (club.tier === 'Upper') {
        // J2 Top: 4.5M - 9.5M
        minB = 4500000;
        maxB = 9500000;
        const repT = Math.max(0, Math.min(1, (rep - 71) / 5));
        t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
      } else if (club.tier === 'Mid') {
        // J2 Mid: 3M - 5.8M
        minB = 3000000;
        maxB = 5800000;
        const repT = Math.max(0, Math.min(1, (rep - 67) / 5));
        t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
      } else {
        // J2 Lower: 2M - 3.6M
        minB = 2000000;
        maxB = 3600000;
        const repT = Math.max(0, Math.min(1, (rep - 65) / 3));
        t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
      }
    } else {
      // J3: 1M - 4.5M
      if (club.tier === 'Upper') {
        minB = 2200000;
        maxB = 4200000;
      } else if (club.tier === 'Mid') {
        minB = 1500000;
        maxB = 2700000;
      } else {
        minB = 1000000;
        maxB = 1800000;
      }
      const repT = Math.max(0, Math.min(1, (rep - 60) / 8));
      t = repT * 0.65 + capNorm * 0.20 + wageNorm * 0.15;
    }
  }

  const clampedT = Math.max(0.05, Math.min(0.95, t + hashBias));
  const raw = minB + (maxB - minB) * clampedT;
  return Math.max(minB, Math.min(maxB, roundBudgetStep(raw)));
}

/**
 * Returns map of clubId -> legacy default transferBudget for safe existing-save migration.
 */
export function getLegacyDefaultBudgetMap(): Record<string, number> {
  const map: Record<string, number> = {};
  const list: Club[] = [
    ...ALL_CLUBS,
    ...(ENABLE_J_LEAGUE ? J2_20_CLUBS : []),
    ...(ENABLE_J_LEAGUE ? J3_20_CLUBS : []),
    ...ALL_EUROPEAN_2ND_DIVISION_CLUBS,
    ...ALL_NEW_4_LEAGUES_CLUBS
  ];
  list.forEach(c => {
    if (map[c.id] === undefined) {
      map[c.id] = c.transferBudget;
    }
  });
  return map;
}

/**
 * Safely uplifts club transfer budgets on existing saves without overwriting
 * user-earned surpluses, custom test values, or active spending deltas.
 */
export function rebalanceExistingSaveClubBudgets(
  clubs: Record<string, Club>
): { clubs: Record<string, Club>; updatedCount: number } {
  const legacyDefaults = getLegacyDefaultBudgetMap();
  const nextClubs: Record<string, Club> = {};
  let updatedCount = 0;

  Object.entries(clubs).forEach(([clubId, club]) => {
    if (!club || clubId === 'free_agent') {
      nextClubs[clubId] = club;
      return;
    }

    const targetBudget = calculateCalibratedClubTransferBudget(club);
    const oldDefault = legacyDefaults[clubId] ?? club.transferBudget;
    const current = club.transferBudget;

    // Only uplift clubs whose budget has not exceeded their legacy starting baseline
    // (preserving earned surpluses and custom non-baseline test/gameplay budgets)
    if (targetBudget > oldDefault && current <= oldDefault * 1.02) {
      const delta = targetBudget - oldDefault;
      const nextBudget =
        Math.abs(current - oldDefault) <= 100000
          ? targetBudget
          : Math.max(0, Math.min(targetBudget, current + delta));
      if (nextBudget !== current) {
        updatedCount++;
        nextClubs[clubId] = { ...club, transferBudget: nextBudget };
        return;
      }
    }

    nextClubs[clubId] = club;
  });

  return { clubs: nextClubs, updatedCount };
}
