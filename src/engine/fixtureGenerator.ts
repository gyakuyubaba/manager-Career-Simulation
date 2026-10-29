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
 * Generate European Competitions Fixtures (UCL, UEL, UECL)
 * - 36-club League Phase (8 matchdays for UCL/UEL, 6 matchdays for UECL)
 * - English clubs are eligible!
 * - Knockout phase fixtures (Playoffs, R16, QF, SF, Final)
 * - STRICTLY NO ACL!
 */
export function generateEuropeanCompetitionsFixtures(
  clubs: Record<string, Club>,
  userClubId: string | null = null,
  seasonYear: number = 2026
): MatchFixture[] {
  const euroFixtures: MatchFixture[] = [];
  const seasonString = `${seasonYear}/${String(seasonYear + 1).slice(2)}`;

  const eligibleClubs = Object.values(clubs).filter(c =>
    c.id !== 'free_agent' &&
    ['premier-league', 'laliga', 'bundesliga', 'serie-a', 'ligue-1'].includes(c.league)
  );
  eligibleClubs.sort((a, b) => (b.reputation || 50) - (a.reputation || 50));

  const uclClubs = eligibleClubs.slice(0, 36);
  const uelClubs = eligibleClubs.slice(18, 54);
  const ueclClubs = eligibleClubs.slice(36, 72);

  // UCL 8 Matchdays
  const uclDates = [
    `${seasonYear}-09-16`,
    `${seasonYear}-09-30`,
    `${seasonYear}-10-21`,
    `${seasonYear}-11-04`,
    `${seasonYear}-11-25`,
    `${seasonYear}-12-09`,
    `${seasonYear + 1}-01-20`,
    `${seasonYear + 1}-01-28`
  ];

  if (uclClubs.length >= 18) {
    const half = Math.floor(uclClubs.length / 2);
    uclDates.forEach((dateStr, mdIdx) => {
      const matchday = mdIdx + 1;
      for (let i = 0; i < half; i++) {
        const homeIdx = (i + mdIdx) % uclClubs.length;
        const awayIdx = (uclClubs.length - 1 - i + mdIdx) % uclClubs.length;
        const c1 = uclClubs[homeIdx];
        const c2 = uclClubs[awayIdx === homeIdx ? (awayIdx + 1) % uclClubs.length : awayIdx];
        const isUserMatch = c1.id === userClubId || c2.id === userClubId;
        euroFixtures.push({
          id: `fix_ucl_lp_md${matchday}_m${i}_${seasonYear}`,
          date: dateStr,
          competition: 'ucl',
          competitionName: `UEFAチャンピオンズリーグ リーグフェーズ 第${matchday}節`,
          seasonId: seasonString,
          round: `第${matchday}節`,
          homeClubId: c1.id,
          awayClubId: c2.id,
          status: 'upcoming',
          isUserMatch
        });
      }
    });

    const uclKnockouts = [
      { name: 'UCL 決勝Tプレーオフ 第1戦', round: 'Play-off Leg 1', date: `${seasonYear + 1}-02-16`, count: 8 },
      { name: 'UCL 決勝Tプレーオフ 第2戦', round: 'Play-off Leg 2', date: `${seasonYear + 1}-02-23`, count: 8 },
      { name: 'UCL ラウンド16 第1戦', round: 'Round of 16 Leg 1', date: `${seasonYear + 1}-03-09`, count: 8 },
      { name: 'UCL ラウンド16 第2戦', round: 'Round of 16 Leg 2', date: `${seasonYear + 1}-03-16`, count: 8 },
      { name: 'UCL 準々決勝 第1戦', round: 'Quarter-Final Leg 1', date: `${seasonYear + 1}-04-06`, count: 4 },
      { name: 'UCL 準々決勝 第2戦', round: 'Quarter-Final Leg 2', date: `${seasonYear + 1}-04-13`, count: 4 },
      { name: 'UCL 準決勝 第1戦', round: 'Semi-Final Leg 1', date: `${seasonYear + 1}-04-27`, count: 2 },
      { name: 'UCL 準決勝 第2戦', round: 'Semi-Final Leg 2', date: `${seasonYear + 1}-05-04`, count: 2 },
      { name: 'UCL 決勝 (ミュンヘン)', round: 'Final', date: `${seasonYear + 1}-05-29`, count: 1 }
    ];

    uclKnockouts.forEach(ko => {
      for (let m = 0; m < ko.count; m++) {
        euroFixtures.push({
          id: `fix_ucl_${ko.round.toLowerCase().replace(/[^a-z0-9]/g, '_')}_m${m}_${seasonYear}`,
          date: ko.date,
          competition: 'ucl',
          competitionName: ko.name,
          seasonId: seasonString,
          round: ko.round,
          homeClubId: 'tbd',
          awayClubId: 'tbd',
          status: 'upcoming',
          isUserMatch: false
        });
      }
    });
  }

  // UEL 8 Matchdays
  const uelDates = [
    `${seasonYear}-09-23`,
    `${seasonYear}-10-01`,
    `${seasonYear}-10-22`,
    `${seasonYear}-11-05`,
    `${seasonYear}-11-26`,
    `${seasonYear}-12-10`,
    `${seasonYear + 1}-01-21`,
    `${seasonYear + 1}-01-29`
  ];
  if (uelClubs.length >= 18) {
    const half = Math.floor(uelClubs.length / 2);
    uelDates.forEach((dateStr, mdIdx) => {
      const matchday = mdIdx + 1;
      for (let i = 0; i < half; i++) {
        const homeIdx = (i + mdIdx) % uelClubs.length;
        const awayIdx = (uelClubs.length - 1 - i + mdIdx) % uelClubs.length;
        const c1 = uelClubs[homeIdx];
        const c2 = uelClubs[awayIdx === homeIdx ? (awayIdx + 1) % uelClubs.length : awayIdx];
        const isUserMatch = c1.id === userClubId || c2.id === userClubId;
        euroFixtures.push({
          id: `fix_uel_lp_md${matchday}_m${i}_${seasonYear}`,
          date: dateStr,
          competition: 'uel',
          competitionName: `UEFAヨーロッパリーグ リーグフェーズ 第${matchday}節`,
          seasonId: seasonString,
          round: `第${matchday}節`,
          homeClubId: c1.id,
          awayClubId: c2.id,
          status: 'upcoming',
          isUserMatch
        });
      }
    });

    const uelKnockouts = [
      { name: 'UEL 決勝Tプレーオフ 第1戦', round: 'Play-off Leg 1', date: `${seasonYear + 1}-02-18`, count: 8 },
      { name: 'UEL 決勝Tプレーオフ 第2戦', round: 'Play-off Leg 2', date: `${seasonYear + 1}-02-25`, count: 8 },
      { name: 'UEL ラウンド16 第1戦', round: 'Round of 16 Leg 1', date: `${seasonYear + 1}-03-11`, count: 8 },
      { name: 'UEL ラウンド16 第2戦', round: 'Round of 16 Leg 2', date: `${seasonYear + 1}-03-18`, count: 8 },
      { name: 'UEL 準々決勝 第1戦', round: 'Quarter-Final Leg 1', date: `${seasonYear + 1}-04-08`, count: 4 },
      { name: 'UEL 準々決勝 第2戦', round: 'Quarter-Final Leg 2', date: `${seasonYear + 1}-04-15`, count: 4 },
      { name: 'UEL 準決勝 第1戦', round: 'Semi-Final Leg 1', date: `${seasonYear + 1}-04-29`, count: 2 },
      { name: 'UEL 準決勝 第2戦', round: 'Semi-Final Leg 2', date: `${seasonYear + 1}-05-06`, count: 2 },
      { name: 'UEL 決勝 (ビルバオ)', round: 'Final', date: `${seasonYear + 1}-05-26`, count: 1 }
    ];
    uelKnockouts.forEach(ko => {
      for (let m = 0; m < ko.count; m++) {
        euroFixtures.push({
          id: `fix_uel_${ko.round.toLowerCase().replace(/[^a-z0-9]/g, '_')}_m${m}_${seasonYear}`,
          date: ko.date,
          competition: 'uel',
          competitionName: ko.name,
          seasonId: seasonString,
          round: ko.round,
          homeClubId: 'tbd',
          awayClubId: 'tbd',
          status: 'upcoming',
          isUserMatch: false
        });
      }
    });
  }

  // UECL 6 Matchdays
  const ueclDates = [
    `${seasonYear}-10-01`,
    `${seasonYear}-10-22`,
    `${seasonYear}-11-05`,
    `${seasonYear}-11-26`,
    `${seasonYear}-12-10`,
    `${seasonYear}-12-17`
  ];
  if (ueclClubs.length >= 18) {
    const half = Math.floor(ueclClubs.length / 2);
    ueclDates.forEach((dateStr, mdIdx) => {
      const matchday = mdIdx + 1;
      for (let i = 0; i < half; i++) {
        const homeIdx = (i + mdIdx) % ueclClubs.length;
        const awayIdx = (ueclClubs.length - 1 - i + mdIdx) % ueclClubs.length;
        const c1 = ueclClubs[homeIdx];
        const c2 = ueclClubs[awayIdx === homeIdx ? (awayIdx + 1) % ueclClubs.length : awayIdx];
        const isUserMatch = c1.id === userClubId || c2.id === userClubId;
        euroFixtures.push({
          id: `fix_uecl_lp_md${matchday}_m${i}_${seasonYear}`,
          date: dateStr,
          competition: 'uecl',
          competitionName: `UEFAカンファレンスリーグ リーグフェーズ 第${matchday}節`,
          seasonId: seasonString,
          round: `第${matchday}節`,
          homeClubId: c1.id,
          awayClubId: c2.id,
          status: 'upcoming',
          isUserMatch
        });
      }
    });

    const ueclKnockouts = [
      { name: 'UECL 決勝Tプレーオフ 第1戦', round: 'Play-off Leg 1', date: `${seasonYear + 1}-02-18`, count: 8 },
      { name: 'UECL 決勝Tプレーオフ 第2戦', round: 'Play-off Leg 2', date: `${seasonYear + 1}-02-25`, count: 8 },
      { name: 'UECL ラウンド16 第1戦', round: 'Round of 16 Leg 1', date: `${seasonYear + 1}-03-11`, count: 8 },
      { name: 'UECL ラウンド16 第2戦', round: 'Round of 16 Leg 2', date: `${seasonYear + 1}-03-18`, count: 8 },
      { name: 'UECL 準々決勝 第1戦', round: 'Quarter-Final Leg 1', date: `${seasonYear + 1}-04-08`, count: 4 },
      { name: 'UECL 準々決勝 第2戦', round: 'Quarter-Final Leg 2', date: `${seasonYear + 1}-04-15`, count: 4 },
      { name: 'UECL 準決勝 第1戦', round: 'Semi-Final Leg 1', date: `${seasonYear + 1}-04-29`, count: 2 },
      { name: 'UECL 準決勝 第2戦', round: 'Semi-Final Leg 2', date: `${seasonYear + 1}-05-06`, count: 2 },
      { name: 'UECL 決勝 (ヴロツワフ)', round: 'Final', date: `${seasonYear + 1}-05-27`, count: 1 }
    ];
    ueclKnockouts.forEach(ko => {
      for (let m = 0; m < ko.count; m++) {
        euroFixtures.push({
          id: `fix_uecl_${ko.round.toLowerCase().replace(/[^a-z0-9]/g, '_')}_m${m}_${seasonYear}`,
          date: ko.date,
          competition: 'uecl',
          competitionName: ko.name,
          seasonId: seasonString,
          round: ko.round,
          homeClubId: 'tbd',
          awayClubId: 'tbd',
          status: 'upcoming',
          isUserMatch: false
        });
      }
    });
  }

  return euroFixtures;
}

/**
 * Generate Major European Domestic Cups:
 * - FA Cup, Carabao Cup (England)
 * - Copa del Rey (Spain)
 * - DFB-Pokal (Germany)
 * - Coppa Italia (Italy)
 * - Coupe de France (France)
 */
export function generateDomesticCupFixtures(
  clubs: Record<string, Club>,
  userClubId: string | null = null,
  seasonYear: number = 2026
): MatchFixture[] {
  const domesticFixtures: MatchFixture[] = [];
  const seasonString = `${seasonYear}/${String(seasonYear + 1).slice(2)}`;

  const addCupTournament = (
    cupKey: CupKey,
    cupName: string,
    eligibleClubIds: string[],
    rounds: { name: string; round: string; date: string; isFirstRound?: boolean; count: number }[]
  ) => {
    if (eligibleClubIds.length < 4) return;
    const shuffled = [...eligibleClubIds].sort(() => 0.5 - Math.random());
    const r1 = rounds[0];
    const initialPairs = Math.min(r1.count, Math.floor(shuffled.length / 2));

    for (let i = 0; i < initialPairs; i++) {
      const c1Id = shuffled[i * 2];
      const c2Id = shuffled[i * 2 + 1];
      const isUser = c1Id === userClubId || c2Id === userClubId;
      domesticFixtures.push({
        id: `fix_${cupKey}_r1_m${i}_${seasonYear}`,
        date: r1.date,
        competition: cupKey,
        competitionName: `${cupName} ${r1.name}`,
        seasonId: seasonString,
        round: r1.round,
        homeClubId: c1Id,
        awayClubId: c2Id,
        status: 'upcoming',
        isUserMatch: isUser
      });
    }

    for (let r = 1; r < rounds.length; r++) {
      const rnd = rounds[r];
      for (let m = 0; m < rnd.count; m++) {
        domesticFixtures.push({
          id: `fix_${cupKey}_r${r + 1}_m${m}_${seasonYear}`,
          date: rnd.date,
          competition: cupKey,
          competitionName: `${cupName} ${rnd.name}`,
          seasonId: seasonString,
          round: rnd.round,
          homeClubId: 'tbd',
          awayClubId: 'tbd',
          status: 'upcoming',
          isUserMatch: false
        });
      }
    }
  };

  // 1. FA Cup (England)
  const engClubs = Object.values(clubs).filter(c => c.league === 'premier-league' || c.league === 'championship').map(c => c.id);
  addCupTournament('fa-cup', 'FAカップ', engClubs, [
    { name: '3回戦', round: 'Round of 64', date: `${seasonYear + 1}-01-09`, count: 16 },
    { name: '4回戦', round: 'Round of 32', date: `${seasonYear + 1}-01-30`, count: 8 },
    { name: '5回戦 (ベスト16)', round: 'Round of 16', date: `${seasonYear + 1}-02-27`, count: 4 },
    { name: '準決勝', round: 'Semi-Final', date: `${seasonYear + 1}-04-17`, count: 2 },
    { name: '決勝 (ウェンブリー)', round: 'Final', date: `${seasonYear + 1}-05-15`, count: 1 }
  ]);

  // 2. Carabao Cup (England)
  addCupTournament('carabao-cup', 'カラバオカップ', engClubs, [
    { name: '1回戦', round: 'Round 1', date: `${seasonYear}-08-12`, count: 12 },
    { name: '2回戦', round: 'Round 2', date: `${seasonYear}-08-26`, count: 8 },
    { name: '3回戦', round: 'Round 3', date: `${seasonYear}-09-23`, count: 8 },
    { name: '4回戦', round: 'Round of 16', date: `${seasonYear}-10-28`, count: 4 },
    { name: '準々決勝', round: 'Quarter-Final', date: `${seasonYear}-12-16`, count: 4 },
    { name: '準決勝', round: 'Semi-Final', date: `${seasonYear + 1}-01-06`, count: 2 },
    { name: '決勝 (ウェンブリー)', round: 'Final', date: `${seasonYear + 1}-02-28`, count: 1 }
  ]);

  // 3. Copa del Rey (Spain)
  const espClubs = Object.values(clubs).filter(c => c.league === 'laliga' || c.league === 'segunda-division').map(c => c.id);
  addCupTournament('copa-del-rey', 'コパ・デル・レイ', espClubs, [
    { name: '1回戦', round: 'Round 1', date: `${seasonYear}-10-29`, count: 12 },
    { name: '2回戦', round: 'Round 2', date: `${seasonYear}-12-03`, count: 8 },
    { name: 'ベスト16', round: 'Round of 16', date: `${seasonYear + 1}-01-14`, count: 4 },
    { name: '準々決勝', round: 'Quarter-Final', date: `${seasonYear + 1}-02-04`, count: 4 },
    { name: '準決勝', round: 'Semi-Final', date: `${seasonYear + 1}-02-25`, count: 2 },
    { name: '決勝 (セビージャ)', round: 'Final', date: `${seasonYear + 1}-04-25`, count: 1 }
  ]);

  // 4. DFB-Pokal (Germany)
  const gerClubs = Object.values(clubs).filter(c => c.league === 'bundesliga' || c.league === '2-bundesliga').map(c => c.id);
  addCupTournament('dfb-pokal', 'DFBポカール', gerClubs, [
    { name: '1回戦', round: 'Round 1', date: `${seasonYear}-08-16`, count: 12 },
    { name: '2回戦', round: 'Round 2', date: `${seasonYear}-10-28`, count: 8 },
    { name: 'ベスト16', round: 'Round of 16', date: `${seasonYear}-12-02`, count: 4 },
    { name: '準々決勝', round: 'Quarter-Final', date: `${seasonYear + 1}-02-03`, count: 4 },
    { name: '準決勝', round: 'Semi-Final', date: `${seasonYear + 1}-03-31`, count: 2 },
    { name: '決勝 (ベルリン)', round: 'Final', date: `${seasonYear + 1}-05-22`, count: 1 }
  ]);

  // 5. Coppa Italia (Italy)
  const itaClubs = Object.values(clubs).filter(c => c.league === 'serie-a' || c.league === 'serie-b').map(c => c.id);
  addCupTournament('coppa-italia', 'コッパ・イタリア', itaClubs, [
    { name: '1回戦', round: 'Round 1', date: `${seasonYear}-08-10`, count: 12 },
    { name: '2回戦', round: 'Round 2', date: `${seasonYear}-09-24`, count: 8 },
    { name: 'ベスト16', round: 'Round of 16', date: `${seasonYear}-12-03`, count: 4 },
    { name: '準々決勝', round: 'Quarter-Final', date: `${seasonYear + 1}-01-07`, count: 4 },
    { name: '準決勝', round: 'Semi-Final', date: `${seasonYear + 1}-04-01`, count: 2 },
    { name: '決勝 (ローマ)', round: 'Final', date: `${seasonYear + 1}-05-19`, count: 1 }
  ]);

  // 6. Coupe de France (France)
  const fraClubs = Object.values(clubs).filter(c => c.league === 'ligue-1' || c.league === 'ligue-2').map(c => c.id);
  addCupTournament('coupe-de-france', 'クープ・ドゥ・フランス', fraClubs, [
    { name: '本戦1回戦', round: 'Round of 32', date: `${seasonYear + 1}-01-03`, count: 12 },
    { name: 'ベスト16', round: 'Round of 16', date: `${seasonYear + 1}-02-04`, count: 8 },
    { name: '準々決勝', round: 'Quarter-Final', date: `${seasonYear + 1}-02-25`, count: 4 },
    { name: '準決勝', round: 'Semi-Final', date: `${seasonYear + 1}-04-01`, count: 2 },
    { name: '決勝 (サンドニ)', round: 'Final', date: `${seasonYear + 1}-05-22`, count: 1 }
  ]);

  return domesticFixtures;
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

  // 5. European Competitions: UCL, UEL, UECL (STRICTLY NO ACL!)
  const euroFixtures = generateEuropeanCompetitionsFixtures(clubs, userClubId, seasonYear);
  fixtures.push(...euroFixtures);

  // 6. European Domestic Cups: FA Cup, Carabao, Copa, Pokal, Coppa, Coupe
  const domCupsFixtures = generateDomesticCupFixtures(clubs, userClubId, seasonYear);
  fixtures.push(...domCupsFixtures);

  // 7. Chronological Sort
  fixtures.sort((a, b) => a.date.localeCompare(b.date));

  return fixtures;
}
