import { 
  GameWorldState, 
  ManagerProfile, 
  Player,
  Club, 
  LeagueKey, 
  StandingsRow, 
  MatchFixture, 
  MatchStats,
  TeamTactics, 
  NewsItem,
  DifficultySettings,
  DEFAULT_DIFFICULTY_SETTINGS
} from '../types/game';
import { ALL_CLUBS, ENABLE_J_LEAGUE } from '../data/clubsData';
import { J1_20_CLUBS, J2_20_CLUBS } from '../data/jLeagueData';
import { ALL_EUROPEAN_2ND_DIVISION_CLUBS } from '../data/europeanSecondDivisionClubs';
import { FREE_AGENT_CLUB, FREE_AGENT_SUPERSTARS } from '../data/freeAgentsData';
import { generateRandomYouthAcademy, generateSingleRandomYouthProspect } from '../data/youthGenerator';
import { deriveRealisticAltPositions } from '../data/playerPositionsHelper';
import { buildCompletePlayersRegistry, populateClubsWithDefaultSquads, getDefaultTacticsForClub } from '../data/squadPopulator';
import { getDaysUntilDeadline, calculateAge, rebuildStandingsFromMatchResults } from './dateEngine';
import { ensureYouthAcademyProspects } from './dataValidator';
import { generateClubVisionRoadmap } from './clubVisionEngine';
import { 
  saveGameToStorage, 
  loadGameFromStorage, 
  clearAllGameStorage, 
  downloadCareerSaveFile, 
  importSaveDataFromJSON, 
  validateStateIntegrity,
  migrateGameState,
  PRIMARY_SLOT_ID,
  CURRENT_ROSTER_DATA_VERSION
} from './storageEngine';

export { 
  saveGameToStorage, 
  loadGameFromStorage, 
  clearAllGameStorage, 
  downloadCareerSaveFile, 
  importSaveDataFromJSON,
  validateStateIntegrity 
};

export const SAVE_KEY = 'fm26_career_save_v5_pure_europe';

export function createInitialStandings(clubs: Record<string, Club>): Record<LeagueKey, StandingsRow[]> {
  const standings: Record<LeagueKey, StandingsRow[]> = {
    'premier-league': [],
    'championship': [],
    'laliga': [],
    'segunda-division': [],
    'bundesliga': [],
    '2-bundesliga': [],
    'serie-a': [],
    'serie-b': [],
    'ligue-1': [],
    'ligue-2': [],
    'j1-league': [],
    'j2-league': [],
    'j3-league': []
  };

  Object.values(clubs).forEach(club => {
    if (club.id === 'free_agent' || (club.league as string) === 'free-agent') return;
    if (standings[club.league]) {
      standings[club.league].push({
        clubId: club.id,
        clubName: club.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
        form: []
      });
    }
  });

  return standings;
}

export { generateSeasonFixtures } from './fixtureGenerator';
import { generateSeasonFixtures } from './fixtureGenerator';
import { createPreSeasonScheduleNews } from './preSeasonEngine';

/**
 * Deterministically simulates matches before mid-season takeover date
 */
function simulatePreAppointmentMatches(
  fixtures: MatchFixture[],
  clubs: Record<string, Club>,
  players: Record<string, Player>,
  cutoffDate: string
): MatchFixture[] {
  return fixtures.map(f => {
    if (f.date >= cutoffDate || f.status === 'finished') {
      return f;
    }
    const seed = Math.abs(f.id.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0));
    const pseudoRand = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    let homeClub = clubs[f.homeClubId];
    let awayClub = clubs[f.awayClubId];
    let resolvedHomeClubId = f.homeClubId;
    let resolvedAwayClubId = f.awayClubId;

    if (!homeClub || !awayClub) {
      if (f.homeClubId === 'tbd' || f.awayClubId === 'tbd') {
        const j1Clubs = Object.values(clubs).filter(c => c.league === 'j1-league');
        const hIdx = seed % j1Clubs.length;
        const aIdx = (seed + 5) % j1Clubs.length;
        homeClub = homeClub || j1Clubs[hIdx];
        awayClub = awayClub || (hIdx === aIdx ? j1Clubs[(aIdx + 1) % j1Clubs.length] : j1Clubs[aIdx]);
        resolvedHomeClubId = homeClub.id;
        resolvedAwayClubId = awayClub.id;
      } else {
        return {
          ...f,
          status: 'finished' as const,
          isResultApplied: true
        };
      }
    }

    const homeOvr = homeClub.reputation || 75;
    const awayOvr = awayClub.reputation || 75;
    const diff = (homeOvr + 2 - awayOvr) / 10;
    const baseHomeExp = Math.max(0.4, 1.4 + diff * 0.4);
    const baseAwayExp = Math.max(0.3, 1.1 - diff * 0.4);

    const homeGoals = Math.min(5, Math.max(0, Math.round(baseHomeExp + (pseudoRand(1) - 0.5) * 2.2)));
    const awayGoals = Math.min(5, Math.max(0, Math.round(baseAwayExp + (pseudoRand(2) - 0.5) * 2.2)));

    const events: any[] = [];
    const homePlayerIds = homeClub.playerIds || [];
    const awayPlayerIds = awayClub.playerIds || [];

    for (let g = 0; g < homeGoals; g++) {
      const min = Math.floor(pseudoRand(10 + g) * 88) + 2;
      const scorerId = homePlayerIds.length > 0 ? homePlayerIds[Math.floor(pseudoRand(20 + g) * homePlayerIds.length)] : undefined;
      events.push({
        id: `ev_pre_${f.id}_h${g}`,
        minute: min,
        type: 'goal',
        clubId: homeClub.id,
        playerId: scorerId,
        playerName: scorerId && players[scorerId] ? players[scorerId].name : `${homeClub.shortName}選手`,
        description: `⚽ ゴール！ ${homeClub.shortName}が得点 (${min}分)`
      });
    }

    for (let g = 0; g < awayGoals; g++) {
      const min = Math.floor(pseudoRand(30 + g) * 88) + 2;
      const scorerId = awayPlayerIds.length > 0 ? awayPlayerIds[Math.floor(pseudoRand(40 + g) * awayPlayerIds.length)] : undefined;
      events.push({
        id: `ev_pre_${f.id}_a${g}`,
        minute: min,
        type: 'goal',
        clubId: awayClub.id,
        playerId: scorerId,
        playerName: scorerId && players[scorerId] ? players[scorerId].name : `${awayClub.shortName}選手`,
        description: `⚽ ゴール！ ${awayClub.shortName}が得点 (${min}分)`
      });
    }

    events.sort((a, b) => a.minute - b.minute);

    return {
      ...f,
      homeClubId: resolvedHomeClubId,
      awayClubId: resolvedAwayClubId,
      homeScore: homeGoals,
      awayScore: awayGoals,
      status: 'finished' as const,
      isResultApplied: true,
      events,
      stats: {
        homeScore: homeGoals,
        awayScore: awayGoals,
        possession: 50 + Math.round((pseudoRand(5) - 0.5) * 16),
        shots: [homeGoals + Math.floor(pseudoRand(6) * 7) + 3, awayGoals + Math.floor(pseudoRand(7) * 7) + 2],
        shotsOnTarget: [homeGoals + Math.floor(pseudoRand(8) * 3), awayGoals + Math.floor(pseudoRand(9) * 3)],
        xG: [Number((homeGoals * 0.7 + pseudoRand(1) * 0.8).toFixed(2)), Number((awayGoals * 0.7 + pseudoRand(2) * 0.8).toFixed(2))],
        corners: [Math.floor(pseudoRand(12) * 5) + 2, Math.floor(pseudoRand(13) * 5) + 2],
        fouls: [Math.floor(pseudoRand(10) * 6) + 4, Math.floor(pseudoRand(11) * 6) + 4],
        passesCompleted: [420 + Math.floor(pseudoRand(14) * 80), 380 + Math.floor(pseudoRand(15) * 80)],
        passAccuracy: [82 + Math.floor(pseudoRand(16) * 8), 79 + Math.floor(pseudoRand(17) * 8)],
        playerRatings: {}
      }
    };
  });
}

export function createNewGameWorld(
  manager: ManagerProfile, 
  difficultySettings?: DifficultySettings,
  startMode: 'preseason' | 'midseason' = 'preseason'
): GameWorldState {
  const initialClubsMap: Record<string, Club> = {};
  const allClubsList = [
    ...ALL_CLUBS,
    ...(ENABLE_J_LEAGUE ? J2_20_CLUBS : []),
    ...ALL_EUROPEAN_2ND_DIVISION_CLUBS,
    FREE_AGENT_CLUB
  ];
  allClubsList.forEach(c => {
    initialClubsMap[c.id] = { ...c, playerIds: [] };
  });

  const playersRegistry = buildCompletePlayersRegistry();
  const { clubs, players } = populateClubsWithDefaultSquads(initialClubsMap, playersRegistry);

  const initialTactics: TeamTactics = {
    formation: '4-3-3',
    lineup: { starters: [], bench: [], reserves: [] },
    instructions: {
      attackingStyle: 'ポゼッション・パス',
      defensiveStyle: 'ハイプレス',
      pressIntensity: '標準的',
      defensiveLine: 'ハイライン',
      tempo: '高速テンポ',
      counterUrgency: 'ボール奪取時即カウンター'
    },
    roles: {}
  };

  const isMidSeason = startMode === 'midseason';
  const initialDate = isMidSeason ? '2026-10-15' : '2026-07-01';

  const updatedManagerProfile: ManagerProfile = {
    ...manager,
    careerStartDate: initialDate,
    managerAppointmentDate: initialDate
  };

  const welcomeNews: NewsItem = {
    id: isMidSeason ? 'news_welcome_midseason' : 'news_welcome_1',
    date: initialDate,
    headline: isMidSeason 
      ? `【2026/27シーズン第9節終了】欧州＆Jリーグ混戦模様！各クラブの情勢と新体制募集`
      : `【2026/27シーズン開幕】2026/27公式選手名鑑・最新データ基準の全クラブ始動！`,
    body: isMidSeason
      ? `2026年10月15日現在、2026/27シーズンは第8〜10節まで消化。序盤の混戦から各リーグの順位表が形作られ、下位に沈むクラブや期待値に届かない名門クラブで監督交代の動きが活発化しています。再建を託された新指揮官の選考が始まります。`
      : `2026/27監督キャリアが正式スタート。2026/27シーズン公式選手名鑑および登録データを基準に、明治安田J1百年構想リーグ（20クラブ）、J2（20クラブ）、欧州5大リーグおよび2部ディビジョン（全クラブ）の実名選手が完全集結。夏の移籍市場、プレシーズン国際ツアーが開幕しました。`,
    category: isMidSeason ? 'press' : 'tournament',
    importance: 'high'
  };

  let initialStandings = createInitialStandings(clubs);
  let fixtures: MatchFixture[] = [];

  if (isMidSeason) {
    // Generate full season fixtures, then pre-simulate results up to Oct 14
    const fullFixtures = generateSeasonFixtures(clubs, null, 2026, updatedManagerProfile);
    fixtures = simulatePreAppointmentMatches(fullFixtures, clubs, players, initialDate);
    initialStandings = rebuildStandingsFromMatchResults(fixtures, clubs, initialStandings);
  }

  // Ensure 100% strict sync between player.clubId and club.playerIds
  Object.values(clubs).forEach(c => {
    c.playerIds = [];
  });
  Object.values(players).forEach(p => {
    if (clubs[p.clubId]) {
      if (!clubs[p.clubId].playerIds.includes(p.id)) {
        clubs[p.clubId].playerIds.push(p.id);
      }
    }
  });

  return {
    currentDate: initialDate,
    season: '2026/27',
    rosterDataVersion: CURRENT_ROSTER_DATA_VERSION,
    isTransferWindowOpen: !isMidSeason,
    transferWindowClosingDays: isMidSeason ? 0 : getDaysUntilDeadline(initialDate),
    manager: updatedManagerProfile,
    managerAppointmentDate: initialDate,
    isMidSeasonAppointment: isMidSeason,
    userClubId: null,
    boardConfidence: 80,
    fanApproval: 75,
    consecutiveLosses: 0,
    isSacked: false,
    difficultySettings: difficultySettings || { ...DEFAULT_DIFFICULTY_SETTINGS },
    clubs,
    players: (() => {
      Object.values(players).forEach(p => {
        if (p.birthDate) {
          p.age = calculateAge(p.birthDate, initialDate);
        }
        if (!p.initialOvr) p.initialOvr = p.ovr;
        if (!p.exactOvr) p.exactOvr = p.ovr;
        if (!p.altPositions || p.altPositions.length === 0) {
          p.altPositions = deriveRealisticAltPositions(p.position, p.preferredFoot, p.playstyle, p.name);
        }
      });
      return players;
    })(),
    tactics: initialTactics,
    fixtures,
    standings: initialStandings,
    negotiations: {},
    news: [welcomeNews],
    youthAcademy: generateRandomYouthAcademy(manager.nationality === '日本' ? '日本' : 'イングランド', 6),
    careerHistory: [],
    trainingFocus: 'バランス総合'
  };
}

// -------------------------------------------------------------
// 【1. 最初の5クラブからのオファーを完全ランダム化】
// Dynamically randomized 5 initial offers with balanced distribution across tiers:
// - 1 Lower Tier club (relegation fight / survival)
// - 2 Mid Tier clubs (different leagues)
// - 2 Upper / Elite Tier clubs (reputable ambition)
// If J.League is enabled, ensure J1 is represented prominently among the offers.
// -------------------------------------------------------------
export function getInitialClubOffers(allClubs: Record<string, Club>, manager?: ManagerProfile): Club[] {
  const clubList = Object.values(allClubs);
  if (clubList.length === 0) return [];

  // Helper to shuffle an array randomly
  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const picked: Club[] = [];
  const pickedIds = new Set<string>();

  const tryAdd = (club?: Club) => {
    if (club && !pickedIds.has(club.id) && picked.length < 5) {
      picked.push(club);
      pickedIds.add(club.id);
      return true;
    }
    return false;
  };

  // If J.League enabled, guarantee at least 1-2 J1 clubs in the initial offers
  if (ENABLE_J_LEAGUE) {
    const j1Clubs = shuffle(clubList.filter(c => c.league === 'j1-league'));
    if (j1Clubs.length > 0) {
      tryAdd(j1Clubs[0]);
      if (manager?.nationality === '日本' && j1Clubs.length > 1) {
        tryAdd(j1Clubs[1]);
      }
    }
  }

  // 1. Lower Tier clubs (survival battles)
  const lowerClubs = shuffle(clubList.filter(c => c.tier === 'Lower' && !pickedIds.has(c.id)));
  // 2. Mid Tier clubs (ambitious mid-table)
  const midClubs = shuffle(clubList.filter(c => c.tier === 'Mid' && !pickedIds.has(c.id)));
  // 3. Upper / Elite Tier clubs (title & continental contention)
  const upperClubs = shuffle(clubList.filter(c => (c.tier === 'Upper' || c.tier === 'Elite') && !pickedIds.has(c.id)));

  // Add 1 Lower Tier Club if room
  if (picked.length < 5 && lowerClubs[0]) {
    tryAdd(lowerClubs[0]);
  }

  // Add Mid Tier Clubs from different leagues if possible
  for (const mc of midClubs) {
    if (picked.length >= 3) break;
    const existingLeagues = picked.map(p => p.league);
    if (!existingLeagues.includes(mc.league) || midClubs.length <= 2) {
      tryAdd(mc);
    }
  }

  // Add Upper/Elite Clubs
  for (const uc of upperClubs) {
    if (picked.length >= 5) break;
    const existingLeagues = picked.map(p => p.league);
    if (!existingLeagues.includes(uc.league) || upperClubs.length <= 2) {
      tryAdd(uc);
    }
  }

  // Fallback if somehow still under 5: fill from any remaining shuffled clubs
  if (picked.length < 5) {
    const remaining = shuffle(clubList.filter(c => !pickedIds.has(c.id)));
    for (const c of remaining) {
      if (picked.length >= 5) break;
      tryAdd(c);
    }
  }

  return picked;
}

// Player accepts one of the club offers
export function appointUserToClub(state: GameWorldState, chosenClubId: string): GameWorldState {
  let updatedClubs = { ...state.clubs };
  let updatedPlayers = { ...state.players };

  // If chosenClubId is missing or has less than 15 players, run full migration
  if (!updatedClubs[chosenClubId] || (updatedClubs[chosenClubId].playerIds?.length || 0) < 15) {
    const migrated = migrateJLeagueIntoExistingState(state);
    updatedClubs = migrated.clubs;
    updatedPlayers = migrated.players;
  }

  Object.values(updatedClubs).forEach(c => {
    c.isUserClub = c.id === chosenClubId;
  });

  const chosenClub = updatedClubs[chosenClubId] || ALL_CLUBS.find(c => c.id === chosenClubId) || J2_20_CLUBS.find(c => c.id === chosenClubId);

  Object.values(updatedPlayers).forEach(p => {
    if (p.birthDate) {
      p.age = calculateAge(p.birthDate, state.currentDate);
    }
    if (!p.initialOvr) p.initialOvr = p.ovr;
    if (!p.exactOvr) p.exactOvr = p.ovr;
    if (!p.altPositions || p.altPositions.length === 0) {
      p.altPositions = deriveRealisticAltPositions(p.position, p.preferredFoot, p.playstyle, p.name);
    }
  });

  const userTactics = getDefaultTacticsForClub(chosenClub, updatedPlayers);
  
  // FIX: Retain existing fixtures, results, and standings if already present!
  // Never wipe finished match results or regenerate schedule mid-season.
  const isMidSeason = state.isMidSeasonAppointment || state.currentDate > '2026-07-25';
  let fixtures: MatchFixture[];
  let psNews: NewsItem | null = null;

  if (state.fixtures && state.fixtures.length > 0) {
    fixtures = state.fixtures.map(f => ({
      ...f,
      isUserMatch: (f.homeClubId === chosenClubId || f.awayClubId === chosenClubId) && f.status === 'upcoming'
    }));
  } else {
    fixtures = generateSeasonFixtures(updatedClubs, chosenClubId, 2026, state.manager);
    const psFixtures = fixtures.filter(f => f.competition === 'pre-season');
    psNews = createPreSeasonScheduleNews(chosenClub, psFixtures, updatedClubs, state.currentDate);
  }

  const customYouth = (!state.youthAcademy || state.youthAcademy.length < 5 || state.youthAcademy.some(y => y.id === 'youth_1' || y.name.includes('高橋 蓮') || y.name.includes('(')))
    ? generateRandomYouthAcademy(chosenClub.country, 6)
    : state.youthAcademy;

  // Standings report for mid-season appointment news
  let midSeasonText = '';
  if (isMidSeason) {
    const leagueRows = state.standings[chosenClub.league] || [];
    const rankIdx = leagueRows.findIndex(r => r.clubId === chosenClubId);
    const clubRow = rankIdx >= 0 ? leagueRows[rankIdx] : null;
    const rankStr = rankIdx >= 0 ? `第${rankIdx + 1}位` : '中位';
    const played = clubRow?.played || 0;
    const wins = clubRow?.won || 0;
    const draws = clubRow?.drawn || 0;
    const losses = clubRow?.lost || 0;
    const points = clubRow?.points || 0;
    midSeasonText = `現在リーグ戦${played}試合を消化し、${rankStr}（${wins}勝${draws}分${losses}敗、勝点${points}）。フロント陣は「${state.manager.name}監督の卓越した${state.manager.specialty}と${state.manager.style}の手腕による早期の立て直しと目標達成」に期待を寄せています。`;
  }

  const appointNews: NewsItem = {
    id: `news_appoint_${Date.now()}`,
    date: state.currentDate,
    headline: isMidSeason
      ? `【緊急就任】${chosenClub.name}、シーズン途中での再建を託し${state.manager.name}監督を招聘！`
      : `【新体制発足】${chosenClub.name}、新指揮官に${state.manager.name}氏の就任を発表！`,
    body: isMidSeason
      ? `${chosenClub.name}は本日、新指揮官として${state.manager.name}監督（${state.manager.age}歳、${state.manager.nationality}）の就任を電撃発表しました。${midSeasonText}`
      : `${chosenClub.name}は本日、チームの新たな舵取り役として${state.manager.name}監督（${state.manager.age}歳、${state.manager.nationality}）の招聘を正式に発表しました。会見でフロント陣は「${state.manager.name}監督の卓越した${state.manager.specialty}と${state.manager.style}の手腕がクラブを次なる高みへ導いてくれると確信している」とコメント。ファンからも新時代の幕開けに大きな期待が寄せられています。`,
    category: 'press',
    relatedClubId: chosenClub.id,
    importance: 'high'
  };

  const clubVision = generateClubVisionRoadmap(chosenClub, state.season);

  const updatedManagerProfile: ManagerProfile = {
    ...state.manager,
    managerAppointmentDate: state.currentDate,
    careerStartDate: state.manager.careerStartDate || (isMidSeason ? state.currentDate : '2026-07-01')
  };

  const nextState: GameWorldState = {
    ...state,
    manager: updatedManagerProfile,
    managerAppointmentDate: state.currentDate,
    isMidSeasonAppointment: isMidSeason,
    userClubId: chosenClubId,
    clubs: updatedClubs,
    players: updatedPlayers,
    tactics: userTactics,
    fixtures,
    news: [appointNews, ...(psNews ? [psNews] : []), ...state.news],
    youthAcademy: customYouth,
    boardConfidence: 85,
    fanApproval: 80,
    consecutiveWinless: 0,
    clubVision
  };

  saveGameState(nextState);
  return nextState;
}

// -------------------------------------------------------------
// 【9-14. 初期化機能の完全再構築・データ分離・安全検証】
// -------------------------------------------------------------

export function validateInitialWorldState(state: GameWorldState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const clubCount = Object.keys(state.clubs || {}).length;
  if (clubCount < 96) {
    errors.push(`欧州クラブ数が不足しています (現在: ${clubCount}/96)`);
  }

  const playerCount = Object.keys(state.players || {}).length;
  if (playerCount < 1000) {
    errors.push(`選手データ数が不足しています (現在: ${playerCount})`);
  }

  if (state.currentDate !== '2026-07-01') {
    errors.push(`開始日付が正しくありません (現在: ${state.currentDate})`);
  }

  const leagues: LeagueKey[] = ['premier-league', 'laliga', 'bundesliga', 'serie-a', 'ligue-1', ...(ENABLE_J_LEAGUE ? ['j1-league' as LeagueKey] : [])];
  leagues.forEach(l => {
    if (!state.standings[l] || state.standings[l].length === 0) {
      errors.push(`リーグ順位表が存在しません (${l})`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// -------------------------------------------------------------
// 【21. 自動整合性チェック (Runtime Data Integrity Guardian)】
// -------------------------------------------------------------
export function validateGameWorldIntegrity(state: GameWorldState): {
  isValid: boolean;
  repairedIssues: string[];
} {
  const issues: string[] = [];

  // 1. Verify 1 Player per Club & Strict Unique Affiliation
  const playerSeenInClubs = new Map<string, string>();
  Object.values(state.clubs).forEach(club => {
    const validSquad: string[] = [];
    (club.playerIds || []).forEach(pId => {
      const p = state.players[pId];
      if (!p) return;
      if (playerSeenInClubs.has(pId)) {
        issues.push(`重複所属検知: ${p.name} (Club: ${club.name}) - 修正済`);
      } else {
        playerSeenInClubs.set(pId, club.id);
        p.clubId = club.id;
        validSquad.push(pId);
      }
    });
    club.playerIds = validSquad;
  });

  // 2. Ensure all players belong to their registered club
  Object.values(state.players).forEach(p => {
    if (!p.clubId || !state.clubs[p.clubId]) {
      const fallbackClub = Object.values(state.clubs)[0];
      if (fallbackClub) {
        p.clubId = fallbackClub.id;
        if (!fallbackClub.playerIds.includes(p.id)) fallbackClub.playerIds.push(p.id);
        issues.push(`孤立選手所属修復: ${p.name} ➔ ${fallbackClub.name}`);
      }
    }
  });

  // 3. Keep squadStatus in sync with active lineups
  if (state.userClubId && state.tactics?.lineup) {
    const starters = state.tactics.lineup.starters || [];
    const bench = state.tactics.lineup.bench || [];
    starters.forEach(st => {
      const p = state.players[st.playerId];
      if (p) p.squadStatus = 'STARTING';
    });
    bench.forEach(pId => {
      const p = state.players[pId];
      if (p) p.squadStatus = 'BENCH';
    });
    // Set all remaining players to OUT_OF_SQUAD
    const starterSet = new Set(starters.map(s => s.playerId));
    const benchSet = new Set(bench);
    Object.values(state.players).forEach(p => {
      if (p.clubId === state.userClubId && !starterSet.has(p.id) && !benchSet.has(p.id)) {
        p.squadStatus = 'OUT_OF_SQUAD';
      }
    });
  }

  return {
    isValid: issues.length === 0,
    repairedIssues: issues
  };
}

export function resetGameWorldToInitial(): {
  success: boolean;
  newState: GameWorldState | null;
  error?: string;
} {
  try {
    // 1. Completely delete mutable SAVE_DATA
    clearGameState();

    // 2. Reconstruct fresh GAME_WORLD_STATE from immutable BASE_DATA
    const dummyManager: ManagerProfile = {
      name: '',
      nationality: '日本',
      age: 42,
      avatar: '👔',
      style: '戦術至上主義',
      tacticalType: 'ゲーゲンプレス',
      specialty: '攻撃戦術',
      reputation: 75,
      careerTrophies: 0,
      matchesManaged: 0,
      wins: 0,
      draws: 0,
      losses: 0
    };

    const freshWorld = createNewGameWorld(dummyManager);

    // 3. Automated Data Validation
    const validation = validateInitialWorldState(freshWorld);
    if (!validation.valid) {
      console.error('Validation failed after reset:', validation.errors);
      return {
        success: false,
        newState: null,
        error: `データ検証エラー: ${validation.errors.join(', ')}`
      };
    }

    return {
      success: true,
      newState: freshWorld
    };
  } catch (err: any) {
    console.error('Failed to reset game world:', err);
    return {
      success: false,
      newState: null,
      error: err?.message || '初期化処理中にエラーが発生しました'
    };
  }
}

export function saveGameState(state: GameWorldState): boolean {
  try {
    // 1. Asynchronously persist to authoritative IndexedDB with 3-generation rolling backup
    saveGameToStorage(state).catch(err => {
      console.warn('Background saveGameToStorage error:', err);
    });

    // 2. Best-effort mirror to LocalStorage (catching QuotaExceededError gracefully)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch (e) {
        // LocalStorage 5MB quota exceeded is expected for ~7.2MB full state; IndexedDB handles full persistence
      }
      return true;
    }
    return true;
  } catch (err) {
    console.error('Failed to save game state:', err);
    return false;
  }
}

export function migrateJLeagueIntoExistingState(state: GameWorldState): GameWorldState {
  if (!ENABLE_J_LEAGUE) return state;
  const initialClubsMap: Record<string, Club> = {};
  const allClubsList = [
    ...ALL_CLUBS,
    ...J2_20_CLUBS,
    ...ALL_EUROPEAN_2ND_DIVISION_CLUBS,
    FREE_AGENT_CLUB
  ];
  allClubsList.forEach(c => {
    initialClubsMap[c.id] = state.clubs[c.id] ? { ...state.clubs[c.id] } : { ...c, playerIds: [] };
  });

  const registry = buildCompletePlayersRegistry();
  const { clubs, players } = populateClubsWithDefaultSquads(initialClubsMap, { ...state.players, ...registry });

  // Ensure FREE_AGENT_SUPERSTARS are registered in players and free_agent club
  FREE_AGENT_SUPERSTARS.forEach(fa => {
    if (!players[fa.id]) {
      players[fa.id] = { ...fa };
      if (clubs['free_agent'] && !clubs['free_agent'].playerIds.includes(fa.id)) {
        clubs['free_agent'].playerIds.push(fa.id);
      }
    }
  });

  // Ensure all 12 league standings exist
  const updatedStandings = { ...state.standings };
  const allLeagueKeys: LeagueKey[] = [
    'premier-league', 'championship',
    'laliga', 'segunda-division',
    'bundesliga', '2-bundesliga',
    'serie-a', 'serie-b',
    'ligue-1', 'ligue-2',
    'j1-league', 'j2-league'
  ];
  allLeagueKeys.forEach(k => {
    if (!updatedStandings[k] || updatedStandings[k].length === 0) {
      const lgClubs = Object.values(clubs).filter(c => c.league === k);
      updatedStandings[k] = lgClubs.map(c => ({
        clubId: c.id,
        clubName: c.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
        form: []
      }));
    }
  });

  // Re-verify user tactics if userClubId is set
  let userTactics = state.tactics;
  if (state.userClubId && clubs[state.userClubId]) {
    const userClub = clubs[state.userClubId];
    const startersValid = userTactics?.lineup?.starters?.length === 11 && 
      userTactics.lineup.starters.every(s => s.playerId && !!players[s.playerId]);
    if (!startersValid) {
      userTactics = getDefaultTacticsForClub(userClub, players);
    }
  }

  // Ensure fixtures exist if userClubId is set but fixtures are empty
  let fixtures = state.fixtures || [];
  if (state.userClubId && fixtures.length === 0) {
    fixtures = generateSeasonFixtures(clubs, state.userClubId);
  }

  const updated: GameWorldState = {
    ...state,
    clubs,
    players,
    tactics: userTactics,
    fixtures,
    standings: updatedStandings
  };
  saveGameState(updated);
  return updated;
}

export function loadGameState(): GameWorldState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    // Check save from primary or legacy keys
    let raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      for (const k of ['fm26_career_save_v5', 'fm26_career_save_v4', 'fm26_career_save_v3', 'fm26_career_save_v2', 'fm26_career_save_v1', 'fm26_career_save']) {
        const found = window.localStorage.getItem(k);
        if (found) {
          raw = found;
          break;
        }
      }
    }
    if (!raw) {
      return null;
    }

    const state: GameWorldState = JSON.parse(raw);
    const check = validateStateIntegrity(state);
    if (!check.isValid) {
      console.warn('LocalStorage save failed integrity check:', check.errors);
      return null;
    }

    // Safely migrate state without ever deleting future seasons or existing records!
    const migrated = migrateGameState(state, 1);
    return migrated;
  } catch (err) {
    console.error('Failed to load game state from LocalStorage:', err);
    return null;
  }
}

export function clearGameState(): void {
  try {
    clearAllGameStorage().catch(err => console.error('clearAllGameStorage error:', err));
  } catch (err) {
    console.error('Failed to clear game state:', err);
  }
}
