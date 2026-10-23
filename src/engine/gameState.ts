import { 
  GameWorldState, 
  ManagerProfile, 
  Club, 
  LeagueKey, 
  StandingsRow, 
  MatchFixture, 
  TeamTactics, 
  NewsItem,
  DifficultySettings,
  DEFAULT_DIFFICULTY_SETTINGS
} from '../types/game';
import { ALL_CLUBS, ENABLE_J_LEAGUE } from '../data/clubsData';
import { J1_20_CLUBS, J2_20_CLUBS } from '../data/jLeagueData';
import { ALL_EUROPEAN_2ND_DIVISION_CLUBS } from '../data/europeanSecondDivisionClubs';
import { generateRandomYouthAcademy, generateSingleRandomYouthProspect } from '../data/youthGenerator';
import { deriveRealisticAltPositions } from '../data/playerPositionsHelper';
import { buildCompletePlayersRegistry, populateClubsWithDefaultSquads, getDefaultTacticsForClub } from '../data/squadPopulator';
import { getDaysUntilDeadline } from './dateEngine';
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
  PRIMARY_SLOT_ID
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


export function createNewGameWorld(manager: ManagerProfile, difficultySettings?: DifficultySettings): GameWorldState {
  const initialClubsMap: Record<string, Club> = {};
  const allClubsList = [
    ...ALL_CLUBS,
    ...(ENABLE_J_LEAGUE ? J2_20_CLUBS : []),
    ...ALL_EUROPEAN_2ND_DIVISION_CLUBS
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

  const initialDate = '2026-07-01';

  const welcomeNews: NewsItem = {
    id: 'news_welcome_1',
    date: initialDate,
    headline: `【2026/27シーズン開幕】2025/26基準の欧州主要5大リーグ（全96クラブ）始動！`,
    body: `2026/27監督キャリアが正式スタート。2025/26シーズン終了時点の最新基礎データを基準に、プレミアリーグ、ラ・リーガ、ブンデスリーガ、セリエA、リーグ・アンの全96クラブ・実名選手が完全集結。夏の移籍市場、プレシーズン国際ツアーが開幕しました。`,
    category: 'tournament',
    importance: 'high'
  };

  const standings = createInitialStandings(clubs);

  return {
    currentDate: initialDate,
    season: '2026/27',
    isTransferWindowOpen: true,
    transferWindowClosingDays: getDaysUntilDeadline(initialDate),
    manager,
    userClubId: null,
    boardConfidence: 80,
    fanApproval: 75,
    consecutiveLosses: 0,
    isSacked: false,
    difficultySettings: difficultySettings || { ...DEFAULT_DIFFICULTY_SETTINGS },
    clubs,
    players: (() => {
      Object.values(players).forEach(p => {
        if (!p.initialOvr) p.initialOvr = p.ovr;
        if (!p.exactOvr) p.exactOvr = p.ovr;
        if (!p.altPositions || p.altPositions.length === 0) {
          p.altPositions = deriveRealisticAltPositions(p.position, p.preferredFoot, p.playstyle, p.name);
        }
      });
      return players;
    })(),
    tactics: initialTactics,
    fixtures: [],
    standings,
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
    if (!p.initialOvr) p.initialOvr = p.ovr;
    if (!p.exactOvr) p.exactOvr = p.ovr;
    if (!p.altPositions || p.altPositions.length === 0) {
      p.altPositions = deriveRealisticAltPositions(p.position, p.preferredFoot, p.playstyle, p.name);
    }
  });

  const userTactics = getDefaultTacticsForClub(chosenClub, updatedPlayers);
  const fixtures = generateSeasonFixtures(updatedClubs, chosenClubId, 2026, state.manager);
  const psFixtures = fixtures.filter(f => f.competition === 'pre-season');
  const psNews = createPreSeasonScheduleNews(chosenClub, psFixtures, updatedClubs, state.currentDate);

  const customYouth = (!state.youthAcademy || state.youthAcademy.length < 5 || state.youthAcademy.some(y => y.id === 'youth_1' || y.name.includes('高橋 蓮') || y.name.includes('(')))
    ? generateRandomYouthAcademy(chosenClub.country, 6)
    : state.youthAcademy;

  const appointNews: NewsItem = {
    id: `news_appoint_${Date.now()}`,
    date: state.currentDate,
    headline: `【新体制発足】${chosenClub.name}、新指揮官に${state.manager.name}氏の就任を発表！`,
    body: `${chosenClub.name}は本日、チームの新たな舵取り役として${state.manager.name}監督（${state.manager.age}歳、${state.manager.nationality}）の招聘を正式に発表しました。会見でフロント陣は「${state.manager.name}監督の卓越した${state.manager.specialty}と${state.manager.style}の手腕がクラブを次なる高みへ導いてくれると確信している」とコメント。ファンからも新時代の幕開けに大きな期待が寄せられています。`,
    category: 'press',
    relatedClubId: chosenClub.id,
    importance: 'high'
  };

  const clubVision = generateClubVisionRoadmap(chosenClub, state.season);

  const nextState: GameWorldState = {
    ...state,
    userClubId: chosenClubId,
    clubs: updatedClubs,
    players: updatedPlayers,
    tactics: userTactics,
    fixtures,
    news: [appointNews, psNews, ...state.news],
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
    ...ALL_EUROPEAN_2ND_DIVISION_CLUBS
  ];
  allClubsList.forEach(c => {
    initialClubsMap[c.id] = state.clubs[c.id] ? { ...state.clubs[c.id] } : { ...c, playerIds: [] };
  });

  const registry = buildCompletePlayersRegistry();
  const { clubs, players } = populateClubsWithDefaultSquads(initialClubsMap, { ...state.players, ...registry });

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
