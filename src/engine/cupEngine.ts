/**
 * Comprehensive Cup Tournaments Engine
 * 
 * Supports 11 Official Tournaments:
 * - Japan: 天皇杯 (Emperor's Cup), JリーグYBCルヴァンカップ (Levain Cup)
 * - England: FAカップ (FA Cup), カラバオカップ (Carabao Cup)
 * - Spain: コパ・デル・レイ (Copa del Rey)
 * - Germany: DFBポカール (DFB-Pokal)
 * - Italy: コッパ・イタリア (Coppa Italia)
 * - France: クープ・ドゥ・フランス (Coupe de France)
 * - Europe: UEFAチャンピオンズリーグ (UCL), UEFAヨーロッパリーグ (UEL), UEFAカンファレンスリーグ (UECL)
 * 
 * STRICT COMPLIANCE:
 * - ACL (AFC Champions League) is STRICTLY PROHIBITED and NEVER generated.
 * - UCL features real 36-club League Phase table and knockout bracket.
 * - English clubs are eligible for European competitions.
 * - Tournaments start in 'not_started' state prior to their official start date.
 * - NO matches, winners, finalists, or completed rounds are fabricated before scheduled dates.
 */

import { Club, MatchFixture, CupKey, GameWorldState, StandingsRow, TournamentCompetition, TournamentRound, TournamentStatus, PenaltyShootoutResult } from '../types/game';

export interface CupTournamentMeta {
  id: CupKey;
  name: string;
  shortName: string;
  country: string;
  logo: string;
  format: 'european-league-phase' | 'knockout-bracket';
  startDateMonthDay: string; // e.g. "09-15"
  endDateMonthDay: string;   // e.g. "05-29"
  rounds: { name: string; dateMonthDay: string; matchCount: number; isTwoLegged?: boolean }[];
}

export const SUPPORTED_CUPS: CupTournamentMeta[] = [
  // Europe
  {
    id: 'ucl',
    name: 'UEFAチャンピオンズリーグ (UCL)',
    shortName: 'UCL',
    country: '欧州',
    logo: '🏆',
    format: 'european-league-phase',
    startDateMonthDay: '09-15',
    endDateMonthDay: '05-29',
    rounds: [
      { name: 'リーグフェーズ (全8節)', dateMonthDay: '09-15', matchCount: 18 },
      { name: '決勝Tプレーオフ (2試合制)', dateMonthDay: '02-16', matchCount: 8, isTwoLegged: true },
      { name: 'ラウンド16 (2試合制)', dateMonthDay: '03-09', matchCount: 8, isTwoLegged: true },
      { name: '準々決勝 (2試合制)', dateMonthDay: '04-06', matchCount: 4, isTwoLegged: true },
      { name: '準決勝 (2試合制)', dateMonthDay: '04-27', matchCount: 2, isTwoLegged: true },
      { name: '決勝 (ミュンヘン・一発勝負)', dateMonthDay: '05-29', matchCount: 1 }
    ]
  },
  {
    id: 'uel',
    name: 'UEFAヨーロッパリーグ (UEL)',
    shortName: 'UEL',
    country: '欧州',
    logo: '🥈',
    format: 'european-league-phase',
    startDateMonthDay: '09-23',
    endDateMonthDay: '05-26',
    rounds: [
      { name: 'リーグフェーズ (全8節)', dateMonthDay: '09-23', matchCount: 18 },
      { name: '決勝Tプレーオフ (2試合制)', dateMonthDay: '02-18', matchCount: 8, isTwoLegged: true },
      { name: 'ラウンド16 (2試合制)', dateMonthDay: '03-11', matchCount: 8, isTwoLegged: true },
      { name: '準々決勝 (2試合制)', dateMonthDay: '04-08', matchCount: 4, isTwoLegged: true },
      { name: '準決勝 (2試合制)', dateMonthDay: '04-29', matchCount: 2, isTwoLegged: true },
      { name: '決勝 (ビルバオ・一発勝負)', dateMonthDay: '05-26', matchCount: 1 }
    ]
  },
  {
    id: 'uecl',
    name: 'UEFAカンファレンスリーグ (UECL)',
    shortName: 'UECL',
    country: '欧州',
    logo: '🥉',
    format: 'european-league-phase',
    startDateMonthDay: '10-01',
    endDateMonthDay: '05-27',
    rounds: [
      { name: 'リーグフェーズ (全6節)', dateMonthDay: '10-01', matchCount: 18 },
      { name: '決勝Tプレーオフ (2試合制)', dateMonthDay: '02-18', matchCount: 8, isTwoLegged: true },
      { name: 'ラウンド16 (2試合制)', dateMonthDay: '03-11', matchCount: 8, isTwoLegged: true },
      { name: '準々決勝 (2試合制)', dateMonthDay: '04-08', matchCount: 4, isTwoLegged: true },
      { name: '準決勝 (2試合制)', dateMonthDay: '04-29', matchCount: 2, isTwoLegged: true },
      { name: '決勝 (ヴロツワフ・一発勝負)', dateMonthDay: '05-27', matchCount: 1 }
    ]
  },
  // England
  {
    id: 'fa-cup',
    name: 'エミレーツ FAカップ (FA Cup)',
    shortName: 'FAカップ',
    country: 'イングランド',
    logo: '👑',
    format: 'knockout-bracket',
    startDateMonthDay: '01-09',
    endDateMonthDay: '05-15',
    rounds: [
      { name: '3回戦 (R64)', dateMonthDay: '01-09', matchCount: 8 },
      { name: '4回戦 (R32)', dateMonthDay: '01-30', matchCount: 8 },
      { name: '5回戦 (ラウンド16)', dateMonthDay: '02-27', matchCount: 8 },
      { name: '準々決勝', dateMonthDay: '03-27', matchCount: 4 },
      { name: '準決勝 (ウェンブリー)', dateMonthDay: '04-24', matchCount: 2 },
      { name: '決勝 (ウェンブリー)', dateMonthDay: '05-15', matchCount: 1 }
    ]
  },
  {
    id: 'carabao-cup',
    name: 'カラバオカップ (EFL Cup)',
    shortName: 'カラバオ杯',
    country: 'イングランド',
    logo: '🦁',
    format: 'knockout-bracket',
    startDateMonthDay: '08-25',
    endDateMonthDay: '02-28',
    rounds: [
      { name: '2回戦', dateMonthDay: '08-25', matchCount: 8 },
      { name: '3回戦 (R32)', dateMonthDay: '09-22', matchCount: 8 },
      { name: '4回戦 (ラウンド16)', dateMonthDay: '10-27', matchCount: 8 },
      { name: '準々決勝', dateMonthDay: '12-15', matchCount: 4 },
      { name: '準決勝 (2試合制)', dateMonthDay: '01-12', matchCount: 2, isTwoLegged: true },
      { name: '決勝 (ウェンブリー)', dateMonthDay: '02-28', matchCount: 1 }
    ]
  },
  // Spain
  {
    id: 'copa-del-rey',
    name: 'コパ・デル・レイ (スペイン国王杯)',
    shortName: 'コパ・デル・レイ',
    country: 'スペイン',
    logo: '⚔️',
    format: 'knockout-bracket',
    startDateMonthDay: '10-28',
    endDateMonthDay: '04-24',
    rounds: [
      { name: '1回戦 (R64)', dateMonthDay: '10-28', matchCount: 8 },
      { name: 'ラウンド32', dateMonthDay: '01-05', matchCount: 8 },
      { name: 'ラウンド16', dateMonthDay: '01-19', matchCount: 8 },
      { name: '準々決勝', dateMonthDay: '02-02', matchCount: 4 },
      { name: '準決勝 (2試合制)', dateMonthDay: '02-23', matchCount: 2, isTwoLegged: true },
      { name: '決勝 (セビージャ・カルトゥハ)', dateMonthDay: '04-24', matchCount: 1 }
    ]
  },
  // Germany
  {
    id: 'dfb-pokal',
    name: 'DFBポカール (ドイツカップ)',
    shortName: 'DFBポカール',
    country: 'ドイツ',
    logo: '🦅',
    format: 'knockout-bracket',
    startDateMonthDay: '08-16',
    endDateMonthDay: '05-22',
    rounds: [
      { name: '1回戦 (R64)', dateMonthDay: '08-16', matchCount: 8 },
      { name: '2回戦 (R32)', dateMonthDay: '10-28', matchCount: 8 },
      { name: 'ラウンド16', dateMonthDay: '12-02', matchCount: 8 },
      { name: '準々決勝', dateMonthDay: '02-03', matchCount: 4 },
      { name: '準決勝', dateMonthDay: '04-06', matchCount: 2 },
      { name: '決勝 (ベルリン・オリンピアシュタディオン)', dateMonthDay: '05-22', matchCount: 1 }
    ]
  },
  // Italy
  {
    id: 'coppa-italia',
    name: 'コッパ・イタリア (イタリア杯)',
    shortName: 'コッパ・イタリア',
    country: 'イタリア',
    logo: '🇮🇹',
    format: 'knockout-bracket',
    startDateMonthDay: '08-10',
    endDateMonthDay: '05-19',
    rounds: [
      { name: '予選・1回戦', dateMonthDay: '08-10', matchCount: 8 },
      { name: 'ラウンド32', dateMonthDay: '09-24', matchCount: 8 },
      { name: 'ラウンド16', dateMonthDay: '12-03', matchCount: 8 },
      { name: '準々決勝', dateMonthDay: '01-07', matchCount: 4 },
      { name: '準決勝 (2試合制)', dateMonthDay: '04-07', matchCount: 2, isTwoLegged: true },
      { name: '決勝 (スタディオ・オリンピコ)', dateMonthDay: '05-19', matchCount: 1 }
    ]
  },
  // France
  {
    id: 'coupe-de-france',
    name: 'クープ・ドゥ・フランス (フランス杯)',
    shortName: 'クープ・ドゥ・フランス',
    country: 'フランス',
    logo: '🐓',
    format: 'knockout-bracket',
    startDateMonthDay: '01-08',
    endDateMonthDay: '05-08',
    rounds: [
      { name: 'ラウンド64', dateMonthDay: '01-08', matchCount: 8 },
      { name: 'ラウンド32', dateMonthDay: '01-22', matchCount: 8 },
      { name: 'ラウンド16', dateMonthDay: '02-04', matchCount: 8 },
      { name: '準々決勝', dateMonthDay: '03-03', matchCount: 4 },
      { name: '準決勝', dateMonthDay: '04-07', matchCount: 2 },
      { name: '決勝 (スタッド・ド・フランス)', dateMonthDay: '05-08', matchCount: 1 }
    ]
  },
  // Japan
  {
    id: 'emperors-cup',
    name: '天皇杯 JFA 全日本サッカー選手権',
    shortName: '天皇杯',
    country: '日本',
    logo: '🇯🇵',
    format: 'knockout-bracket',
    startDateMonthDay: '09-02',
    endDateMonthDay: '01-01',
    rounds: [
      { name: '3回戦 (R32)', dateMonthDay: '09-02', matchCount: 8 },
      { name: 'ラウンド16', dateMonthDay: '10-14', matchCount: 8 },
      { name: '準々決勝', dateMonthDay: '11-04', matchCount: 4 },
      { name: '準決勝', dateMonthDay: '12-09', matchCount: 2 },
      { name: '決勝 (国立競技場)', dateMonthDay: '01-01', matchCount: 1 }
    ]
  },
  {
    id: 'levain-cup',
    name: 'Jリーグ YBC ルヴァンカップ',
    shortName: 'ルヴァンカップ',
    country: '日本',
    logo: '🏆',
    format: 'knockout-bracket',
    startDateMonthDay: '08-26',
    endDateMonthDay: '11-18',
    rounds: [
      { name: '1stラウンド (R32)', dateMonthDay: '08-26', matchCount: 8 },
      { name: 'プライムステージ 準々決勝', dateMonthDay: '09-23', matchCount: 4 },
      { name: 'プライムステージ 準決勝 (2試合制)', dateMonthDay: '10-21', matchCount: 2, isTwoLegged: true },
      { name: '決勝 (国立競技場)', dateMonthDay: '11-18', matchCount: 1 }
    ]
  }
];

export interface BracketMatchNode {
  fixtureId: string;
  roundName: string;
  homeClubId: string;
  homeClubName: string;
  homeScore?: number;
  awayClubId: string;
  awayClubName: string;
  awayScore?: number;
  winnerClubId?: string;
  date: string;
  status: 'upcoming' | 'playing' | 'finished';
  isTwoLegged?: boolean;
  firstLegScore?: string;
  secondLegScore?: string;
  aggregateScore?: string;
  extraTimePlayed?: boolean;
  penaltyShootout?: PenaltyShootoutResult;
}

/**
 * Returns whether a cup is currently started, ongoing, or finished
 */
export function getTournamentStatus(
  cupId: CupKey,
  currentDate: string,
  seasonYear: number = 2026,
  championClubId?: string
): { status: TournamentStatus; startDate: string; endDate: string; statusLabel: string } {
  const meta = SUPPORTED_CUPS.find(c => c.id === cupId) || SUPPORTED_CUPS[0];
  const startMonth = parseInt(meta.startDateMonthDay.split('-')[0], 10);
  const endMonth = parseInt(meta.endDateMonthDay.split('-')[0], 10);

  const startYear = startMonth >= 7 ? seasonYear : seasonYear + 1;
  const endYear = endMonth >= 7 && endMonth <= 12 ? seasonYear : seasonYear + 1;

  const startDate = `${startYear}-${meta.startDateMonthDay}`;
  const endDate = `${endYear}-${meta.endDateMonthDay}`;

  if (championClubId) {
    return { status: 'completed', startDate, endDate, statusLabel: '大会終了 (優勝決定)' };
  }

  if (currentDate < startDate) {
    return { status: 'not_started', startDate, endDate, statusLabel: '未開始 (開幕前)' };
  }

  if (currentDate > endDate) {
    return { status: 'completed', startDate, endDate, statusLabel: '大会終了' };
  }

  return { status: 'in_progress', startDate, endDate, statusLabel: '開催中' };
}

/**
 * Generate European League Phase (36 teams) Standings
 * If tournament has NOT reached matchdays or 0 matches played, displays 0-0-0 with NO fake games.
 */
export function getEuropeanLeaguePhaseStandings(
  cupId: 'ucl' | 'uel' | 'uecl',
  clubs: Record<string, Club>,
  fixtures: MatchFixture[]
): StandingsRow[] {
  // Select top clubs eligible for Europe
  const eligibleClubs = Object.values(clubs).filter(c => 
    c.id !== 'free_agent' &&
    ['premier-league', 'laliga', 'bundesliga', 'serie-a', 'ligue-1'].includes(c.league)
  );

  // Sort deterministically by reputation
  eligibleClubs.sort((a, b) => (b.reputation || 50) - (a.reputation || 50));
  
  let sliceClubs: Club[];
  if (cupId === 'ucl') {
    sliceClubs = eligibleClubs.slice(0, 36);
  } else if (cupId === 'uel') {
    sliceClubs = eligibleClubs.slice(18, 54);
  } else {
    sliceClubs = eligibleClubs.slice(36, 72);
  }

  // Check actual finished cup matches in fixtures
  const cupFixtures = fixtures.filter(f => f.competition === cupId && f.status === 'finished');

  const rows: StandingsRow[] = sliceClubs.map(club => {
    const clubMatches = cupFixtures.filter(f => f.homeClubId === club.id || f.awayClubId === club.id);
    const played = clubMatches.length;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let gf = 0;
    let ga = 0;

    clubMatches.forEach(m => {
      const isHome = m.homeClubId === club.id;
      const myScore = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
      const opScore = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
      gf += myScore;
      ga += opScore;
      if (myScore > opScore) won++;
      else if (myScore === opScore) drawn++;
      else lost++;
    });

    const gd = gf - ga;
    const points = won * 3 + drawn;

    return {
      clubId: club.id,
      clubName: club.name,
      played,
      won,
      drawn,
      lost,
      goalsFor: gf,
      goalsAgainst: ga,
      goalDiff: gd,
      points,
      form: []
    };
  });

  // Sort by points, goal diff, goals for, then club reputation
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    const repA = clubs[a.clubId]?.reputation || 50;
    const repB = clubs[b.clubId]?.reputation || 50;
    return repB - repA;
  });

  return rows;
}

/**
 * Get Tournament Bracket Tree for any cup
 * STRICTLY respects tournament status: if tournament or round is before game date,
 * NO matches are marked finished, NO fake scores or winners are generated!
 */
export function getTournamentBracket(
  cupId: CupKey,
  state: GameWorldState
): { roundName: string; status: TournamentStatus; matches: BracketMatchNode[] }[] {
  const meta = SUPPORTED_CUPS.find(c => c.id === cupId);
  if (!meta) return [];

  const seasonYear = parseInt(state.season?.split('/')[0], 10) || 2026;
  const cupStatusInfo = getTournamentStatus(cupId, state.currentDate, seasonYear);

  // Find all fixtures belonging to this cup
  const cupFixtures = state.fixtures.filter(f => f.competition === cupId);

  // Group by rounds: For European cups include 決勝Tプレーオフ (5 rounds: Playoff, R16, QF, SF, Final)
  const isEuro = meta.format === 'european-league-phase';
  const knockoutRoundsMeta = meta.rounds.filter(r => !r.name.includes('リーグフェーズ'));
  const targetRounds = isEuro ? knockoutRoundsMeta : knockoutRoundsMeta.slice(-4);
  const counts = isEuro ? [8, 8, 4, 2, 1] : [8, 4, 2, 1];

  // Pick participating clubs
  const participatingClubs = Object.values(state.clubs).filter(c => {
    if (c.id === 'free_agent') return false;
    if (cupId === 'emperors-cup' || cupId === 'levain-cup') {
      return c.league === 'j1-league' || c.league === 'j2-league';
    }
    if (cupId === 'fa-cup' || cupId === 'carabao-cup') {
      return c.league === 'premier-league' || c.league === 'championship';
    }
    if (cupId === 'copa-del-rey') {
      return c.league === 'laliga' || c.league === 'segunda-division';
    }
    if (cupId === 'dfb-pokal') {
      return c.league === 'bundesliga' || c.league === '2-bundesliga';
    }
    if (cupId === 'coppa-italia') {
      return c.league === 'serie-a' || c.league === 'serie-b';
    }
    if (cupId === 'coupe-de-france') {
      return c.league === 'ligue-1' || c.league === 'ligue-2';
    }
    return ['premier-league', 'laliga', 'bundesliga', 'serie-a', 'ligue-1'].includes(c.league);
  });
  participatingClubs.sort((a, b) => (b.reputation || 50) - (a.reputation || 50));

  const resultRounds: { roundName: string; status: TournamentStatus; matches: BracketMatchNode[] }[] = [];

  targetRounds.forEach((roundMeta, rIdx) => {
    const roundMonth = parseInt(roundMeta.dateMonthDay.split('-')[0], 10);
    const roundYear = roundMonth >= 7 && roundMonth <= 12 ? seasonYear : seasonYear + 1;
    const roundDate = `${roundYear}-${roundMeta.dateMonthDay}`;

    // Round status based strictly on current date
    let roundStatus: TournamentStatus = 'not_started';
    if (state.currentDate >= roundDate) {
      roundStatus = 'in_progress';
    }

    const matchCount = counts[rIdx] || 1;
    const matches: BracketMatchNode[] = [];

    // Collect all fixtures matching this tournament round in deterministic order
    const roundFixtures = cupFixtures.filter(f => 
      f.round?.includes(roundMeta.name) || 
      f.competitionName?.includes(roundMeta.name) || 
      f.roundId?.includes(`r${rIdx}`) ||
      (roundMeta.name.includes('準々決勝') && (f.round?.includes('Quarter-Final') || f.round?.includes('準々決勝'))) ||
      (roundMeta.name.includes('準決勝') && (f.round?.includes('Semi-Final') || f.round?.includes('準決勝'))) ||
      (roundMeta.name.includes('決勝') && !roundMeta.name.includes('準') && (f.round === 'Final' || f.round?.includes('決勝')))
    );

    for (let m = 0; m < matchCount; m++) {
      // Find matching fixture in state.fixtures by exact match index m
      const matchedFixture = roundFixtures[m] || cupFixtures.find(f => f.id === `fix_${cupId}_r${rIdx + 1}_m${m}_2026`);

      let homeClub: Club | undefined;
      let awayClub: Club | undefined;

      if (matchedFixture && matchedFixture.homeClubId !== 'tbd' && matchedFixture.awayClubId !== 'tbd' && state.clubs[matchedFixture.homeClubId] && state.clubs[matchedFixture.awayClubId]) {
        homeClub = state.clubs[matchedFixture.homeClubId];
        awayClub = state.clubs[matchedFixture.awayClubId];
      } else if (rIdx === 0) {
        // First knockout round (e.g. R16 or Playoff): Seed from participating clubs
        homeClub = participatingClubs[(m * 2) % participatingClubs.length];
        awayClub = participatingClubs[(m * 2 + 1) % participatingClubs.length];
        if (matchedFixture && homeClub && awayClub) {
          if (!matchedFixture.homeClubId || matchedFixture.homeClubId === 'tbd') matchedFixture.homeClubId = homeClub.id;
          if (!matchedFixture.awayClubId || matchedFixture.awayClubId === 'tbd') matchedFixture.awayClubId = awayClub.id;
        }
      } else {
        // Subsequent rounds (QF, SF, Final): derive dynamically from previous round winners if finished
        const prevRound = resultRounds[rIdx - 1];
        if (prevRound && prevRound.matches) {
          const m1 = prevRound.matches[m * 2];
          const m2 = prevRound.matches[m * 2 + 1];
          if (m1?.winnerClubId && m2?.winnerClubId) {
            homeClub = state.clubs[m1.winnerClubId];
            awayClub = state.clubs[m2.winnerClubId];
            if (matchedFixture && homeClub && awayClub) {
              if (!matchedFixture.homeClubId || matchedFixture.homeClubId === 'tbd') matchedFixture.homeClubId = homeClub.id;
              if (!matchedFixture.awayClubId || matchedFixture.awayClubId === 'tbd') matchedFixture.awayClubId = awayClub.id;
            }
          }
        }
        // If previous round is not finished or winners not determined, leave as undefined -> shows "未定 (TBD)"!
      }

      const isFinished = matchedFixture?.status === 'finished';
      const homeScore = matchedFixture?.homeScore;
      const awayScore = matchedFixture?.awayScore;
      const extraTime = matchedFixture?.extraTimePlayed;
      const pk = matchedFixture?.penaltyShootout;
      const isTwoLegged = roundMeta.isTwoLegged || false;

      // Check if paired Leg 1 / Leg 2 fixtures exist
      let firstLegScoreStr: string | undefined = undefined;
      let secondLegScoreStr: string | undefined = undefined;
      let aggregateScoreStr: string | undefined = undefined;
      let winnerId: string | undefined = undefined;

      if (isTwoLegged && homeClub && awayClub) {
        const leg1Fix = cupFixtures.find(f => 
          f.round?.includes('Leg 1') && 
          ((f.homeClubId === homeClub?.id && f.awayClubId === awayClub?.id) || (f.homeClubId === awayClub?.id && f.awayClubId === homeClub?.id))
        );
        const leg2Fix = cupFixtures.find(f => 
          f.round?.includes('Leg 2') && 
          ((f.homeClubId === homeClub?.id && f.awayClubId === awayClub?.id) || (f.homeClubId === awayClub?.id && f.awayClubId === homeClub?.id))
        );

        if (leg1Fix?.status === 'finished' && leg1Fix.homeScore !== undefined && leg1Fix.awayScore !== undefined) {
          firstLegScoreStr = `${leg1Fix.homeScore} - ${leg1Fix.awayScore}`;
        }
        if (leg2Fix?.status === 'finished' && leg2Fix.homeScore !== undefined && leg2Fix.awayScore !== undefined) {
          secondLegScoreStr = `${leg2Fix.homeScore} - ${leg2Fix.awayScore}`;
        }

        if (leg1Fix?.status === 'finished' && leg2Fix?.status === 'finished' && 
            leg1Fix.homeScore !== undefined && leg1Fix.awayScore !== undefined && 
            leg2Fix.homeScore !== undefined && leg2Fix.awayScore !== undefined) {
          const homeLeg1 = leg1Fix.homeClubId === homeClub.id ? leg1Fix.homeScore : leg1Fix.awayScore;
          const homeLeg2 = leg2Fix.homeClubId === homeClub.id ? leg2Fix.homeScore : leg2Fix.awayScore;
          const awayLeg1 = leg1Fix.homeClubId === awayClub.id ? leg1Fix.homeScore : leg1Fix.awayScore;
          const awayLeg2 = leg2Fix.homeClubId === awayClub.id ? leg2Fix.homeScore : leg2Fix.awayScore;
          const totalHome = homeLeg1 + homeLeg2;
          const totalAway = awayLeg1 + awayLeg2;

          aggregateScoreStr = `合計: ${totalHome} - ${totalAway}`;
          if (leg2Fix.penaltyShootout) {
            winnerId = leg2Fix.penaltyShootout.winnerClubId || (leg2Fix.penaltyShootout.homeScore > leg2Fix.penaltyShootout.awayScore 
              ? leg2Fix.homeClubId 
              : leg2Fix.awayClubId);
          } else if (totalHome > totalAway) {
            winnerId = homeClub.id;
          } else if (totalAway > totalHome) {
            winnerId = awayClub.id;
          } else {
            winnerId = homeClub.id;
          }
        } else if (isFinished && homeScore !== undefined && awayScore !== undefined) {
          if (pk) {
            winnerId = pk.winnerClubId || (pk.homeScore > pk.awayScore ? homeClub.id : awayClub.id);
          } else if (homeScore > awayScore) {
            winnerId = homeClub.id;
          } else {
            winnerId = awayClub.id;
          }
        }
      } else if (isFinished && homeScore !== undefined && awayScore !== undefined && homeClub && awayClub) {
        if (pk) {
          winnerId = pk.winnerClubId || (pk.homeScore > pk.awayScore ? homeClub.id : awayClub.id);
        } else if (homeScore > awayScore) {
          winnerId = homeClub.id;
        } else if (awayScore > homeScore) {
          winnerId = awayClub.id;
        } else {
          winnerId = homeClub.id;
        }
      }

      matches.push({
        fixtureId: matchedFixture?.id || `bracket_${cupId}_r${rIdx}_m${m}`,
        roundName: roundMeta.name,
        homeClubId: homeClub ? homeClub.id : 'tbd',
        homeClubName: homeClub ? homeClub.name : '未定 (TBD)',
        homeScore: isFinished ? homeScore : undefined,
        awayClubId: awayClub ? awayClub.id : 'tbd',
        awayClubName: awayClub ? awayClub.name : '未定 (TBD)',
        awayScore: isFinished ? awayScore : undefined,
        winnerClubId: winnerId,
        date: matchedFixture?.date || roundDate,
        status: isFinished ? 'finished' : (state.currentDate >= roundDate ? 'playing' : 'upcoming'),
        isTwoLegged,
        firstLegScore: firstLegScoreStr,
        secondLegScore: secondLegScoreStr,
        aggregateScore: aggregateScoreStr,
        extraTimePlayed: extraTime,
        penaltyShootout: pk
      });
    }

    if (matches.length > 0 && matches.every(m => m.status === 'finished')) {
      roundStatus = 'completed';
    }

    resultRounds.push({
      roundName: roundMeta.name,
      status: roundStatus,
      matches
    });
  });

  return resultRounds;
}

/**
 * Initialize tournament structures in GameWorldState
 */
export function initializeTournamentCompetitions(
  seasonYear: number,
  clubs: Record<string, Club>,
  currentDate: string = '2026-07-01'
): Record<CupKey, TournamentCompetition> {
  const result: Partial<Record<CupKey, TournamentCompetition>> = {};
  const seasonString = `${seasonYear}/${String(seasonYear + 1).slice(2)}`;

  SUPPORTED_CUPS.forEach(meta => {
    const statusInfo = getTournamentStatus(meta.id, currentDate, seasonYear);
    const rounds: TournamentRound[] = meta.rounds.map((r, rIdx) => {
      const rMonth = parseInt(r.dateMonthDay.split('-')[0], 10);
      const rYear = rMonth >= 7 && rMonth <= 12 ? seasonYear : seasonYear + 1;
      const rDate = `${rYear}-${r.dateMonthDay}`;
      return {
        roundId: `${meta.id}_${seasonYear}_r${rIdx}`,
        roundName: r.name,
        roundOrder: rIdx + 1,
        startDate: rDate,
        endDate: rDate,
        status: currentDate >= rDate ? 'in_progress' : 'not_started',
        fixtureIds: []
      };
    });

    result[meta.id] = {
      id: meta.id,
      name: meta.name,
      shortName: meta.shortName,
      country: meta.country,
      format: meta.format,
      seasonId: seasonString,
      startDate: statusInfo.startDate,
      endDate: statusInfo.endDate,
      status: statusInfo.status,
      currentRoundId: rounds[0]?.roundId,
      currentRoundName: rounds[0]?.roundName,
      rounds
    };
  });

  return result as Record<CupKey, TournamentCompetition>;
}

/**
 * Populates European Knockout Play-off (February) and Round of 16 (March) fixtures
 * following the completion of the 36-club League Phase.
 * 
 * Rules:
 * - 1st to 8th: Directly into Round of 16 (March). They have a 1-month bye with NO European fixtures in February!
 * - 9th to 24th: 2-legged Play-offs in February (Leg 1 Feb 16/18, Leg 2 Feb 23/25).
 * - 25th to 36th: Eliminated.
 */
export function populateEuropeanKnockoutFixtures(state: GameWorldState): boolean {
  let changed = false;
  const euroCups: ('ucl' | 'uel' | 'uecl')[] = ['ucl', 'uel', 'uecl'];

  euroCups.forEach(cupId => {
    // Check if league phase matches are done (all finished or game date is past late January)
    const lpFixtures = state.fixtures.filter(f => f.competition === cupId && (f.round?.includes('第') || f.round?.includes('節')));
    const allLpFinished = lpFixtures.length > 0 && lpFixtures.every(f => f.status === 'finished');
    const isPastLpDate = (state.currentDate || '') >= '2027-01-29';

    if (!allLpFinished && !isPastLpDate) return;

    // Check if play-off fixtures exist and need seeding
    const poLeg1Fixtures = state.fixtures.filter(f => 
      f.competition === cupId && 
      (f.round === 'Play-off Leg 1' || f.competitionName?.includes('プレーオフ 第1戦'))
    );
    const poLeg2Fixtures = state.fixtures.filter(f => 
      f.competition === cupId && 
      (f.round === 'Play-off Leg 2' || f.competitionName?.includes('プレーオフ 第2戦'))
    );

    if (poLeg1Fixtures.length === 8 && (poLeg1Fixtures[0].homeClubId === 'tbd' || !poLeg1Fixtures[0].homeClubId)) {
      const standings = getEuropeanLeaguePhaseStandings(cupId, state.clubs, state.fixtures);
      if (standings.length >= 24) {
        // Top 8 (0-7): Direct to Round of 16 (March) -> 1-month bye in February
        // 9th to 24th (8-23): Play-off (February)
        for (let m = 0; m < 8; m++) {
          const highSeed = standings[8 + m];      // 9th, 10th, ..., 16th
          const lowSeed = standings[23 - m];     // 24th, 23rd, ..., 17th
          
          if (highSeed && lowSeed) {
            // Leg 1: lower seed at home
            if (poLeg1Fixtures[m]) {
              poLeg1Fixtures[m].homeClubId = lowSeed.clubId;
              poLeg1Fixtures[m].awayClubId = highSeed.clubId;
              poLeg1Fixtures[m].isUserMatch = Boolean(state.userClubId && (lowSeed.clubId === state.userClubId || highSeed.clubId === state.userClubId));
            }
            // Leg 2: higher seed at home
            if (poLeg2Fixtures[m]) {
              poLeg2Fixtures[m].homeClubId = highSeed.clubId;
              poLeg2Fixtures[m].awayClubId = lowSeed.clubId;
              poLeg2Fixtures[m].isUserMatch = Boolean(state.userClubId && (highSeed.clubId === state.userClubId || lowSeed.clubId === state.userClubId));
            }
            changed = true;
          }
        }
      }
    }
  });

  return changed;
}

/**
 * Advances the 8 European Play-off winners into Round of 16 (March) against the Top 8 direct qualifiers.
 */
export function advanceEuropeanPlayoffWinnersToRoundOf16(state: GameWorldState): boolean {
  let changed = false;
  const euroCups: ('ucl' | 'uel' | 'uecl')[] = ['ucl', 'uel', 'uecl'];

  euroCups.forEach(cupId => {
    const poLeg1Fixtures = state.fixtures.filter(f => 
      f.competition === cupId && 
      (f.round === 'Play-off Leg 1' || f.competitionName?.includes('プレーオフ 第1戦'))
    );
    const poLeg2Fixtures = state.fixtures.filter(f => 
      f.competition === cupId && 
      (f.round === 'Play-off Leg 2' || f.competitionName?.includes('プレーオフ 第2戦'))
    );

    // If both Leg 1 and Leg 2 are finished
    if (poLeg1Fixtures.length === 8 && poLeg2Fixtures.length === 8 && poLeg2Fixtures.every(f => f.status === 'finished')) {
      const r16Leg1Fixtures = state.fixtures.filter(f => 
        f.competition === cupId && 
        (f.round === 'Round of 16 Leg 1' || f.competitionName?.includes('ラウンド16 第1戦'))
      );
      const r16Leg2Fixtures = state.fixtures.filter(f => 
        f.competition === cupId && 
        (f.round === 'Round of 16 Leg 2' || f.competitionName?.includes('ラウンド16 第2戦'))
      );

      if (r16Leg1Fixtures.length === 8 && (r16Leg1Fixtures[0].homeClubId === 'tbd' || !r16Leg1Fixtures[0].homeClubId)) {
        const standings = getEuropeanLeaguePhaseStandings(cupId, state.clubs, state.fixtures);
        // Top 8 direct qualifiers (standings[0..7])
        for (let m = 0; m < 8; m++) {
          const top8Club = standings[m];
          const leg1 = poLeg1Fixtures[m];
          const leg2 = poLeg2Fixtures[m];

          // Determine playoff aggregate winner
          let playoffWinnerId = leg2?.homeClubId;
          const leg1Home = leg1?.homeScore ?? 0;
          const leg1Away = leg1?.awayScore ?? 0;
          const leg2Home = leg2?.homeScore ?? 0;
          const leg2Away = leg2?.awayScore ?? 0;

          // In leg 2: home is higher seed, away is lower seed
          // In leg 1: home was lower seed, away was higher seed
          const totalHigh = leg1Away + leg2Home;
          const totalLow = leg1Home + leg2Away;

          if (leg2?.penaltyShootout) {
            playoffWinnerId = leg2.penaltyShootout.winnerClubId || (leg2.penaltyShootout.homeScore > leg2.penaltyShootout.awayScore ? leg2.homeClubId : leg2.awayClubId);
          } else if (totalHigh >= totalLow) {
            playoffWinnerId = leg2?.homeClubId;
          } else {
            playoffWinnerId = leg2?.awayClubId;
          }

          if (r16Leg1Fixtures[m] && top8Club && playoffWinnerId) {
            // Leg 1: Playoff winner at home, Top 8 club away
            r16Leg1Fixtures[m].homeClubId = playoffWinnerId;
            r16Leg1Fixtures[m].awayClubId = top8Club.clubId;
            r16Leg1Fixtures[m].isUserMatch = Boolean(state.userClubId && (playoffWinnerId === state.userClubId || top8Club.clubId === state.userClubId));
          }
          if (r16Leg2Fixtures[m] && top8Club && playoffWinnerId) {
            // Leg 2: Top 8 club at home, Playoff winner away
            r16Leg2Fixtures[m].homeClubId = top8Club.clubId;
            r16Leg2Fixtures[m].awayClubId = playoffWinnerId;
            r16Leg2Fixtures[m].isUserMatch = Boolean(state.userClubId && (playoffWinnerId === state.userClubId || top8Club.clubId === state.userClubId));
          }
          changed = true;
        }
      }
    }
  });

  return changed;
}
