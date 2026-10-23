import { MatchFixture, Club, LeagueKey, ManagerProfile, CupKey } from '../types/game';
import { generatePreSeasonFixtures } from './preSeasonEngine';

/**
 * Mathematically sound Berger round-robin schedule generator.
 * Produces exactly 2 * (N - 1) rounds with exact Home/Away balance (N - 1 Home, N - 1 Away).
 * - 18 clubs: 34 matches
 * - 20 clubs: 38 matches
 * - 24 clubs: 46 matches
 */
export function generateRoundRobinPairs(clubs: Club[]): { round: number; home: Club; away: Club }[][] {
  const n = clubs.length;
  if (n < 2) return [];

  const rounds: { round: number; home: Club; away: Club }[][] = [];

  // Phase 1: First leg (n - 1 rounds)
  for (let r = 0; r < n - 1; r++) {
    const roundMatches: { round: number; home: Club; away: Club }[] = [];
    for (let i = 0; i < n / 2; i++) {
      let t1: Club;
      let t2: Club;
      if (i === 0) {
        t1 = clubs[0];
        t2 = clubs[1 + (r % (n - 1))];
      } else {
        t1 = clubs[1 + ((r + i) % (n - 1))];
        t2 = clubs[1 + ((r - i + (n - 1)) % (n - 1))];
      }
      if (r % 2 === 1) {
        roundMatches.push({ round: r + 1, home: t2, away: t1 });
      } else {
        roundMatches.push({ round: r + 1, home: t1, away: t2 });
      }
    }
    rounds.push(roundMatches);
  }

  // Phase 2: Return leg (n - 1 rounds) with reversed Home and Away
  for (let r = 0; r < n - 1; r++) {
    const returnMatches = rounds[r].map(m => ({
      round: r + n,
      home: m.away,
      away: m.home
    }));
    rounds.push(returnMatches);
  }

  return rounds;
}

export function generateBergerRoundRobin(clubCount: number): { round: number; home: number; away: number }[][] {
  const mockClubs = Array.from({ length: clubCount }, (_, i) => ({ id: `c_${i}` } as Club));
  const pairs = generateRoundRobinPairs(mockClubs);
  return pairs.map(round => round.map(m => ({
    round: m.round,
    home: parseInt(m.home.id.replace('c_', ''), 10),
    away: parseInt(m.away.id.replace('c_', ''), 10)
  })));
}

/**
 * Dynamically generates strictly increasing calendar dates for `roundCount` matchdays
 * spanning from mid-August through late May of the seasonYear.
 */
function generateCalendarDatesForRounds(seasonYear: number, roundCount: number): string[] {
  const dates: string[] = [];
  const start = new Date(`${seasonYear}-08-15T12:00:00Z`);

  let current = new Date(start);
  for (let r = 0; r < roundCount; r++) {
    dates.push(current.toISOString().split('T')[0]);
    // For large schedules (46 rounds in Championship), advance by 5-6 days to fit; otherwise 7 days
    const stepDays = roundCount >= 44 ? (r % 3 === 1 ? 4 : 7) : 7;
    current = new Date(current.getTime() + stepDays * 24 * 3600 * 1000);

    // Winter break breather (late December - early January if not English)
    if (current.getMonth() === 11 && current.getDate() > 28 && roundCount <= 38) {
      current = new Date(current.getTime() + 7 * 24 * 3600 * 1000);
    }
  }

  return dates;
}

/**
 * Generate Emperor's Cup (天皇杯) fixtures with all J1 and J2 clubs eligible
 */
export function generateEmperorsCupFixtures(
  clubs: Record<string, Club>,
  userClubId: string | null = null,
  seasonYear: number = 2026
): MatchFixture[] {
  const cupFixtures: MatchFixture[] = [];
  const j1Clubs = Object.values(clubs).filter(c => c.league === 'j1-league');
  const j2Clubs = Object.values(clubs).filter(c => c.league === 'j2-league');
  const allJClubs = [...j1Clubs, ...j2Clubs];
  if (allJClubs.length < 4) return [];

  // Round of 32 (Seeded: J1 and J2 clubs face off or interleave)
  const shuffled = [...allJClubs].sort(() => 0.5 - Math.random());
  const r32Date = `${seasonYear}-09-02`;

  const pairCount = Math.floor(shuffled.length / 2);
  for (let i = 0; i < pairCount; i++) {
    const c1 = shuffled[i * 2];
    const c2 = shuffled[i * 2 + 1];
    const isUserMatch = c1.id === userClubId || c2.id === userClubId;
    cupFixtures.push({
      id: `fix_emperors_r32_m${i}_${seasonYear}`,
      date: r32Date,
      competition: 'emperors-cup' as CupKey,
      competitionName: '天皇杯 JFA 全日本サッカー選手権 3回戦',
      round: 'Round of 32',
      homeClubId: c1.id,
      awayClubId: c2.id,
      status: 'upcoming',
      isUserMatch
    });
  }

  // Future cup rounds (Round of 16, QF, SF, Final) with TBD or winner advancement
  const cupRounds = [
    { name: '天皇杯 ラウンド16', round: 'Round of 16', date: `${seasonYear}-10-14`, count: 8 },
    { name: '天皇杯 準々決勝', round: 'Quarter-Final', date: `${seasonYear}-11-04`, count: 4 },
    { name: '天皇杯 準決勝', round: 'Semi-Final', date: `${seasonYear}-12-09`, count: 2 },
    { name: '天皇杯 決勝 (国立競技場)', round: 'Final', date: `${seasonYear + 1}-01-01`, count: 1 }
  ];

  cupRounds.forEach(cr => {
    for (let i = 0; i < cr.count; i++) {
      cupFixtures.push({
        id: `fix_emperors_${cr.round.toLowerCase().replace(/\s+/g, '_')}_m${i}_${seasonYear}`,
        date: cr.date,
        competition: 'emperors-cup' as CupKey,
        competitionName: cr.name,
        round: cr.round,
        homeClubId: 'tbd',
        awayClubId: 'tbd',
        status: 'upcoming',
        isUserMatch: false
      });
    }
  });

  return cupFixtures;
}

/**
 * Generate Levain Cup (Jリーグ YBC ルヴァンカップ) fixtures with all J1 & J2 clubs eligible
 */
export function generateLevainCupFixtures(
  clubs: Record<string, Club>,
  userClubId: string | null = null,
  seasonYear: number = 2026
): MatchFixture[] {
  const cupFixtures: MatchFixture[] = [];
  const j1Clubs = Object.values(clubs).filter(c => c.league === 'j1-league');
  const j2Clubs = Object.values(clubs).filter(c => c.league === 'j2-league');
  const allJClubs = [...j1Clubs, ...j2Clubs];
  if (allJClubs.length < 4) return [];

  const shuffled = [...allJClubs].sort(() => 0.5 - Math.random());
  const r1Date = `${seasonYear}-08-26`;
  const pairCount = Math.floor(shuffled.length / 2);

  for (let i = 0; i < pairCount; i++) {
    const c1 = shuffled[i * 2];
    const c2 = shuffled[i * 2 + 1];
    const isUserMatch = c1.id === userClubId || c2.id === userClubId;
    cupFixtures.push({
      id: `fix_levain_r1_m${i}_${seasonYear}`,
      date: r1Date,
      competition: 'levain-cup' as CupKey,
      competitionName: 'YBCルヴァンカップ 1stラウンド',
      round: 'Round of 32',
      homeClubId: c1.id,
      awayClubId: c2.id,
      status: 'upcoming',
      isUserMatch
    });
  }

  // Prime stage rounds (QF, SF, Final)
  const primeRounds = [
    { name: 'ルヴァンカップ プライムステージ 準々決勝', round: 'Quarter-Final', date: `${seasonYear}-09-23`, count: 4 },
    { name: 'ルヴァンカップ プライムステージ 準決勝', round: 'Semi-Final', date: `${seasonYear}-10-21`, count: 2 },
    { name: 'ルヴァンカップ 決勝 (国立競技場)', round: 'Final', date: `${seasonYear}-11-18`, count: 1 }
  ];

  primeRounds.forEach(pr => {
    for (let i = 0; i < pr.count; i++) {
      cupFixtures.push({
        id: `fix_levain_${pr.round.toLowerCase().replace(/\s+/g, '_')}_m${i}_${seasonYear}`,
        date: pr.date,
        competition: 'levain-cup' as CupKey,
        competitionName: pr.name,
        round: pr.round,
        homeClubId: 'tbd',
        awayClubId: 'tbd',
        status: 'upcoming',
        isUserMatch: false
      });
    }
  });

  return cupFixtures;
}

/**
 * Main Schedule Generator: Generates all league and cup fixtures for the season.
 * Guarantees exact 2*(N-1) matchdays for each league without discrepancy.
 */
export function generateSeasonFixtures(
  clubs: Record<string, Club>, 
  userClubId: string | null,
  seasonYear: number = 2026,
  manager?: ManagerProfile,
  selectedTourId?: string
): MatchFixture[] {
  const fixtures: MatchFixture[] = [];
  const seasonString = `${seasonYear}/${String(seasonYear + 1).slice(2)}`;

  // 1. Pre-Season matches for user club (July 10, 20, 30 of every seasonYear)
  if (userClubId && clubs[userClubId]) {
    const psFixtures = generatePreSeasonFixtures(clubs, userClubId, seasonYear, manager, selectedTourId);
    psFixtures.forEach(f => { f.seasonId = seasonString; });
    fixtures.push(...psFixtures);
  }

  // 2. Group clubs by league
  const leagues: Record<string, Club[]> = {};
  Object.values(clubs).forEach(c => {
    if (!leagues[c.league]) leagues[c.league] = [];
    leagues[c.league].push(c);
  });

  // 3. Generate mathematically exact round-robin schedule for each league
  Object.entries(leagues).forEach(([leagueKey, leagueClubs]) => {
    const n = leagueClubs.length;
    if (n < 2) return;

    // Must be even for round-robin pairing
    const adjustedClubs = [...leagueClubs];
    if (adjustedClubs.length % 2 !== 0) {
      adjustedClubs.pop(); // Sane safety check
    }

    const roundCount = 2 * (adjustedClubs.length - 1);
    const roundDates = generateCalendarDatesForRounds(seasonYear, roundCount);
    const roundPairs = generateRoundRobinPairs(adjustedClubs);

    roundPairs.forEach((matches, roundIdx) => {
      const matchDate = roundDates[roundIdx] || roundDates[roundDates.length - 1];
      const matchdayNumber = roundIdx + 1;

      matches.forEach((m, matchIdx) => {
        const isUserMatch = m.home.id === userClubId || m.away.id === userClubId;
        const leagueDisplayName = m.home.league.toUpperCase().replace('-', ' ');

        fixtures.push({
          id: `fix_${leagueKey}_s${seasonYear}_r${matchdayNumber}_m${matchIdx}`,
          date: matchDate,
          competition: leagueKey as LeagueKey,
          competitionName: `${leagueDisplayName} 第${matchdayNumber}節`,
          seasonId: seasonString,
          round: `第${matchdayNumber}節`,
          homeClubId: m.home.id,
          awayClubId: m.away.id,
          status: 'upcoming',
          isUserMatch
        });
      });
    });
  });

  // 4. J-League Domestic Cups: Emperor's Cup and Levain Cup
  const emperorsFixtures = generateEmperorsCupFixtures(clubs, userClubId, seasonYear);
  emperorsFixtures.forEach(f => { f.seasonId = seasonString; });
  fixtures.push(...emperorsFixtures);

  const levainFixtures = generateLevainCupFixtures(clubs, userClubId, seasonYear);
  levainFixtures.forEach(f => { f.seasonId = seasonString; });
  fixtures.push(...levainFixtures);

  // 5. Chronological Sort
  fixtures.sort((a, b) => a.date.localeCompare(b.date));

  return fixtures;
}
