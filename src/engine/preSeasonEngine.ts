import { Club, MatchFixture, GameWorldState, PreSeasonTournament, NewsItem, ManagerProfile } from '../types/game';

/**
 * Pre-Season Engine: Realistic, progression-aware, randomized pre-season matches.
 * 
 * Key Principles:
 * 1. Fully random draw from real registered clubs in the world state.
 * 2. Progression-based growth: Club reputation, league tier, and manager achievements
 *    expand the range and probability of facing overseas and elite clubs.
 * 3. J.League clubs can play J1, J2, and overseas clubs. Early-stage clubs face primarily
 *    domestic clubs (J1/J2) for tactical tuning while still having occasional foreign match opportunities.
 * 4. Fixed once drawn: Persisted in fixtures array so page refresh or app reload does NOT re-roll.
 * 5. Pre-season success boosts revenue, board confidence, fan approval, and player sharpness
 *    without modifying official league standings.
 */

// Shuffles an array randomly using Fisher-Yates
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Calculates effective club growth score (0 - 100+) based on club reputation,
 * manager reputation, and trophies won.
 */
export function calculateClubGrowthScore(club: Club, manager?: ManagerProfile): number {
  const clubRep = club.reputation || 50;
  const mgrRep = manager?.reputation || 50;
  const trophies = manager?.careerTrophies || 0;
  return Math.min(100, Math.round(clubRep * 0.7 + mgrRep * 0.25 + Math.min(10, trophies * 2)));
}

/**
 * Generates 3 dynamic, context-appropriate pre-season tournament invitations
 * based on the club's status, league, and growth level.
 */
export function generatePreSeasonTourOptions(userClub: Club, manager?: ManagerProfile, seasonYear: number = 2026): PreSeasonTournament[] {
  const growth = calculateClubGrowthScore(userClub, manager);
  const isJapan = userClub.league === 'j1-league' || userClub.league === 'j2-league';
  const yStr = String(seasonYear);
  const deadline = `${yStr}-07-15`;

  if (isJapan) {
    if (growth < 65) {
      // Developing J.League club (J2 or lower J1)
      return [
        {
          id: 'ps_japan_domestic',
          name: `国内サマーキャンプ＆強化マッチツアー (御殿場/宮崎)`,
          region: '国内',
          prizeMoney: 600000,
          participants: [],
          matchesCount: 3,
          deadline
        },
        {
          id: 'ps_japan_pacific',
          name: `パシフィック・サマーチャレンジ (日韓・豪州親善)`,
          region: 'アジア・オセアニア',
          prizeMoney: 1500000,
          participants: [],
          matchesCount: 3,
          deadline
        },
        {
          id: 'ps_japan_world',
          name: `Jリーグ ワールドチャレンジ (欧州招待枠)`,
          region: '国際',
          prizeMoney: 3000000,
          participants: [],
          matchesCount: 3,
          deadline
        }
      ];
    } else {
      // Competitive / Champion J.League club
      return [
        {
          id: 'ps_japan_world',
          name: `Jリーグ ワールドチャレンジ ${yStr} (東京/横浜)`,
          region: '日本・国際',
          prizeMoney: 3500000,
          participants: [],
          matchesCount: 3,
          deadline
        },
        {
          id: 'ps_asia_super',
          name: `アジア・チャンピオンズ・ツアー (東京/シンガポール)`,
          region: 'アジア',
          prizeMoney: 4500000,
          participants: [],
          matchesCount: 3,
          deadline
        },
        {
          id: 'ps_global_champions',
          name: `インターナショナル・サマーツアー (欧州・北米遠征)`,
          region: '欧州・北米',
          prizeMoney: 7000000,
          participants: [],
          matchesCount: 3,
          deadline
        }
      ];
    }
  } else {
    // European clubs
    if (growth < 70) {
      return [
        {
          id: 'ps_euro_regional',
          name: `アルプス・サマー・チャレンジ (独/墺/瑞ツアー)`,
          region: '欧州',
          prizeMoney: 1800000,
          participants: [],
          matchesCount: 3,
          deadline
        },
        {
          id: 'ps_euro_tour',
          name: `ヨーロピアン・フレンドリー・トロフィー`,
          region: '欧州',
          prizeMoney: 3200000,
          participants: [],
          matchesCount: 3,
          deadline
        },
        {
          id: 'ps_asia_tour',
          name: `アジア・パシフィック・ツアー (日本/韓国遠征)`,
          region: 'アジア遠征',
          prizeMoney: 4500000,
          participants: [],
          matchesCount: 3,
          deadline
        }
      ];
    } else {
      return [
        {
          id: 'ps_usa_super',
          name: `インターナショナル・スーパーカップ (米国ツアー)`,
          region: '北米',
          prizeMoney: 8500000,
          participants: [],
          matchesCount: 3,
          deadline
        },
        {
          id: 'ps_asia_super',
          name: `アジア・サマーツアー (東京/シンガポール/上海)`,
          region: 'アジア遠征',
          prizeMoney: 6500000,
          participants: [],
          matchesCount: 3,
          deadline
        },
        {
          id: 'ps_euro_elite',
          name: `ヨーロピアン・エリート・サマートロフィー`,
          region: '欧州',
          prizeMoney: 5000000,
          participants: [],
          matchesCount: 3,
          deadline
        }
      ];
    }
  }
}

/**
 * Randomly draws 3 distinct opponents from real clubs registered in the world state.
 * Takes growth level into account while preserving full randomness.
 */
export function drawPreSeasonOpponents(
  allClubs: Record<string, Club>,
  userClub: Club,
  count: number = 3,
  manager?: ManagerProfile,
  preferredTourId?: string
): Club[] {
  const clubList = Object.values(allClubs).filter(c => c && c.id && c.id !== userClub.id);
  if (clubList.length === 0) return [];

  const isJapan = userClub.league === 'j1-league' || userClub.league === 'j2-league';
  const growth = calculateClubGrowthScore(userClub, manager);

  // Categorize candidate clubs
  const j2Clubs = shuffleArray(clubList.filter(c => c.league === 'j2-league'));
  const j1Clubs = shuffleArray(clubList.filter(c => c.league === 'j1-league'));
  
  // Overseas categories
  const overseasLowerMid = shuffleArray(clubList.filter(c => 
    c.league !== 'j1-league' && c.league !== 'j2-league' && 
    ((c.reputation <= 72) || c.tier === 'Lower' || c.tier === 'Mid')
  ));
  const overseasUpper = shuffleArray(clubList.filter(c => 
    c.league !== 'j1-league' && c.league !== 'j2-league' && 
    ((c.reputation > 72 && c.reputation <= 84) || c.tier === 'Upper')
  ));
  const overseasElite = shuffleArray(clubList.filter(c => 
    c.league !== 'j1-league' && c.league !== 'j2-league' && 
    (c.reputation > 84 || c.tier === 'Elite')
  ));

  // Same country 2nd division / 1st division for overseas clubs
  const domestic2nd = shuffleArray(clubList.filter(c => 
    c.country === userClub.country && 
    ['championship', 'segunda-division', '2-bundesliga', 'serie-b', 'ligue-2', 'j2-league'].includes(c.league)
  ));
  const domestic1st = shuffleArray(clubList.filter(c => 
    c.country === userClub.country && c.league === userClub.league
  ));

  const picked: Club[] = [];
  const pickedIds = new Set<string>();

  const tryPickFrom = (pool: Club[]): boolean => {
    for (const c of pool) {
      if (c && !pickedIds.has(c.id)) {
        picked.push(c);
        pickedIds.add(c.id);
        return true;
      }
    }
    return false;
  };

  const fallbackPick = (): void => {
    const remaining = shuffleArray(clubList.filter(c => !pickedIds.has(c.id)));
    if (remaining.length > 0) {
      picked.push(remaining[0]);
      pickedIds.add(remaining[0].id);
    }
  };

  // Generate 3 match slots with tailored probabilistic weights
  for (let slot = 0; slot < count; slot++) {
    const roll = Math.random();

    if (isJapan) {
      if (growth < 65) {
        // --- Early-stage / J2 / Lower J1 Club ---
        // Primarily domestic (J1 or J2) for tactical tuning, with foreign friendly opportunity
        if (slot === 0) {
          // Match 1: 60% J2, 40% J1
          const pickedOk = roll < 0.6 ? tryPickFrom(j2Clubs) || tryPickFrom(j1Clubs) : tryPickFrom(j1Clubs) || tryPickFrom(j2Clubs);
          if (!pickedOk) fallbackPick();
        } else if (slot === 1) {
          // Match 2: 45% Domestic J1/J2, 45% Overseas Lower/Mid, 10% Overseas Upper
          let pickedOk = false;
          if (roll < 0.45) {
            pickedOk = tryPickFrom(j1Clubs) || tryPickFrom(j2Clubs);
          } else if (roll < 0.90) {
            pickedOk = tryPickFrom(overseasLowerMid) || tryPickFrom(j1Clubs);
          } else {
            pickedOk = tryPickFrom(overseasUpper) || tryPickFrom(overseasLowerMid);
          }
          if (!pickedOk) fallbackPick();
        } else {
          // Match 3 (Finale): 35% Domestic J1, 45% Overseas Lower/Mid, 20% Overseas Upper/Elite
          let pickedOk = false;
          if (roll < 0.35) {
            pickedOk = tryPickFrom(j1Clubs) || tryPickFrom(j2Clubs);
          } else if (roll < 0.80) {
            pickedOk = tryPickFrom(overseasLowerMid) || tryPickFrom(overseasUpper);
          } else {
            pickedOk = tryPickFrom(overseasUpper) || tryPickFrom(overseasElite) || tryPickFrom(j1Clubs);
          }
          if (!pickedOk) fallbackPick();
        }
      } else if (growth < 80) {
        // --- Emerging / Mid-Table J1 Club ---
        // Wider mix: J1 rivals + Overseas Mid & Upper touring clubs
        if (slot === 0) {
          // Match 1: 35% J1, 20% J2, 45% Overseas Lower/Mid
          const pickedOk = roll < 0.35 
            ? tryPickFrom(j1Clubs) || tryPickFrom(j2Clubs) 
            : roll < 0.55 
              ? tryPickFrom(j2Clubs) || tryPickFrom(j1Clubs) 
              : tryPickFrom(overseasLowerMid) || tryPickFrom(overseasUpper);
          if (!pickedOk) fallbackPick();
        } else if (slot === 1) {
          // Match 2: 25% J1, 50% Overseas Upper, 25% Overseas Elite
          let pickedOk = false;
          if (roll < 0.25) {
            pickedOk = tryPickFrom(j1Clubs);
          } else if (roll < 0.75) {
            pickedOk = tryPickFrom(overseasUpper) || tryPickFrom(overseasLowerMid);
          } else {
            pickedOk = tryPickFrom(overseasElite) || tryPickFrom(overseasUpper);
          }
          if (!pickedOk) fallbackPick();
        } else {
          // Match 3: 15% J1 top, 45% Overseas Upper, 40% Overseas Elite
          let pickedOk = false;
          if (roll < 0.15) {
            pickedOk = tryPickFrom(j1Clubs);
          } else if (roll < 0.60) {
            pickedOk = tryPickFrom(overseasUpper) || tryPickFrom(overseasElite);
          } else {
            pickedOk = tryPickFrom(overseasElite) || tryPickFrom(overseasUpper);
          }
          if (!pickedOk) fallbackPick();
        }
      } else {
        // --- Global / Champion J.League Club ---
        // High-profile international tour against world-class clubs
        if (slot === 0) {
          const pickedOk = roll < 0.25 
            ? tryPickFrom(j1Clubs) 
            : roll < 0.65 
              ? tryPickFrom(overseasUpper) 
              : tryPickFrom(overseasElite);
          if (!pickedOk) fallbackPick();
        } else if (slot === 1) {
          const pickedOk = roll < 0.40 
            ? tryPickFrom(overseasUpper) 
            : tryPickFrom(overseasElite) || tryPickFrom(overseasUpper);
          if (!pickedOk) fallbackPick();
        } else {
          const pickedOk = roll < 0.70 
            ? tryPickFrom(overseasElite) || tryPickFrom(overseasUpper) 
            : tryPickFrom(overseasUpper) || tryPickFrom(overseasElite);
          if (!pickedOk) fallbackPick();
        }
      }
    } else {
      // European / Non-Japanese club
      if (growth < 70) {
        // Lower / 2nd division European club
        if (slot === 0) {
          const pickedOk = roll < 0.60 
            ? tryPickFrom(domestic2nd) || tryPickFrom(domestic1st) 
            : tryPickFrom(domestic1st) || tryPickFrom(overseasLowerMid);
          if (!pickedOk) fallbackPick();
        } else if (slot === 1) {
          const pickedOk = roll < 0.50 
            ? tryPickFrom(overseasLowerMid) 
            : roll < 0.85 
              ? tryPickFrom(domestic1st) 
              : tryPickFrom(j1Clubs) || tryPickFrom(overseasUpper);
          if (!pickedOk) fallbackPick();
        } else {
          const pickedOk = roll < 0.45 
            ? tryPickFrom(overseasLowerMid) 
            : roll < 0.85 
              ? tryPickFrom(overseasUpper) 
              : tryPickFrom(domestic1st);
          if (!pickedOk) fallbackPick();
        }
      } else {
        // Upper / Elite European club (summer international tours)
        if (slot === 0) {
          // Can play Asian tour host (including J.League clubs!) or overseas rival
          const pickedOk = roll < 0.25 
            ? tryPickFrom(j1Clubs) || tryPickFrom(overseasLowerMid) 
            : roll < 0.65 
              ? tryPickFrom(overseasUpper) 
              : tryPickFrom(overseasElite);
          if (!pickedOk) fallbackPick();
        } else if (slot === 1) {
          const pickedOk = roll < 0.45 
            ? tryPickFrom(overseasUpper) 
            : tryPickFrom(overseasElite) || tryPickFrom(overseasUpper);
          if (!pickedOk) fallbackPick();
        } else {
          const pickedOk = roll < 0.75 
            ? tryPickFrom(overseasElite) || tryPickFrom(overseasUpper) 
            : tryPickFrom(overseasUpper) || tryPickFrom(overseasElite);
          if (!pickedOk) fallbackPick();
        }
      }
    }
  }

  // Ensure we have exactly `count` distinct clubs
  while (picked.length < count) {
    fallbackPick();
  }

  return picked;
}

/**
 * Generates the 3 official pre-season MatchFixtures for the user club.
 * Assigns authentic competition names, randomized home/away, and chronological dates.
 */
export function generatePreSeasonFixtures(
  allClubs: Record<string, Club>,
  userClubId: string,
  seasonYear: number = 2026,
  manager?: ManagerProfile,
  selectedTourId?: string
): MatchFixture[] {
  const userClub = allClubs[userClubId];
  if (!userClub) return [];

  const opponents = drawPreSeasonOpponents(allClubs, userClub, 3, manager, selectedTourId);
  if (opponents.length < 3) return [];

  const isJapan = userClub.league === 'j1-league' || userClub.league === 'j2-league';
  const growth = calculateClubGrowthScore(userClub, manager);

  // Generate distinctive competition names
  let match1Name = 'プレシーズン・親善マッチ第1戦';
  let match2Name = 'プレシーズン・親善マッチ第2戦';
  let match3Name = 'サマー・トロフィー決定戦';

  const opp1 = opponents[0];
  const opp2 = opponents[1];
  const opp3 = opponents[2];

  const opp1IsOverseas = opp1.country !== userClub.country;
  const opp2IsOverseas = opp2.country !== userClub.country;
  const opp3IsOverseas = opp3.country !== userClub.country;

  if (isJapan) {
    if (growth < 65) {
      match1Name = opp1.league === 'j2-league' ? '国内サマーキャンプ・J2調整戦' : 'プレシーズン・国内親善第1戦';
      match2Name = opp2IsOverseas ? '国際親善サマーマッチ' : 'Jリーグ・サマーチャレンジマッチ';
      match3Name = opp3IsOverseas ? 'サマートロフィー・国際親善マッチ' : 'プレシーズン・サマーチャレンジカップ';
    } else if (growth < 80) {
      match1Name = opp1IsOverseas ? 'ワールドチャレンジ・オープニングマッチ' : 'Jリーグ・サマーツアー第1戦';
      match2Name = opp2IsOverseas ? '国際親善ワールドチャレンジマッチ' : 'J1プレシーズン・サマートロフィー';
      match3Name = 'インターナショナル・サマーカップ決勝';
    } else {
      match1Name = 'インターナショナル・チャンピオンズツアー第1戦';
      match2Name = 'ワールド・クラブ・チャレンジ';
      match3Name = 'グローバル・サマートロフィー決定戦';
    }
  } else {
    if (growth < 70) {
      match1Name = 'プレシーズン・フレンドリー第1戦';
      match2Name = opp2IsOverseas ? 'ヨーロピアン・サマーツアー第2戦' : '国内プレシーズンマッチ';
      match3Name = 'サマー・トロフィー決定戦';
    } else {
      match1Name = 'インターナショナル・サマーツアー第1戦';
      match2Name = 'ワールド・プレシーズン・クラシック';
      match3Name = 'グローバル・スーパーカップ決定戦';
    }
  }

  const yStr = String(seasonYear);
  const fixtures: MatchFixture[] = [
    {
      id: `fix_ps_${yStr}_1`,
      date: `${yStr}-07-10`,
      competition: 'pre-season',
      competitionName: match1Name,
      homeClubId: userClubId,
      awayClubId: opp1.id,
      status: 'upcoming',
      isUserMatch: true
    },
    {
      id: `fix_ps_${yStr}_2`,
      date: `${yStr}-07-20`,
      competition: 'pre-season',
      competitionName: match2Name,
      homeClubId: opp2.id,
      awayClubId: userClubId,
      status: 'upcoming',
      isUserMatch: true
    },
    {
      id: `fix_ps_${yStr}_3`,
      date: `${yStr}-07-30`,
      competition: 'pre-season',
      competitionName: match3Name,
      homeClubId: userClubId,
      awayClubId: opp3.id,
      status: 'upcoming',
      isUserMatch: true
    }
  ];

  return fixtures;
}

/**
 * Creates an announcement news article celebrating the randomized pre-season schedule.
 */
export function createPreSeasonScheduleNews(
  userClub: Club,
  fixtures: MatchFixture[],
  clubs: Record<string, Club>,
  currentDate: string
): NewsItem {
  const oppNames = fixtures
    .map(f => {
      const oppId = f.homeClubId === userClub.id ? f.awayClubId : f.homeClubId;
      return clubs[oppId]?.name || '未定クラブ';
    })
    .join('、');

  const hasOverseas = fixtures.some(f => {
    const oppId = f.homeClubId === userClub.id ? f.awayClubId : f.homeClubId;
    return clubs[oppId] && clubs[oppId].country !== userClub.country;
  });

  const headline = hasOverseas
    ? `【プレシーズン決定】${userClub.name}、海外クラブを含む国際サマーツアー日程発表！`
    : `【プレシーズン決定】${userClub.name}、新シーズンに向けたサマーツアー対戦カード確定！`;

  const body = `新シーズンの開幕に先駆け、${userClub.name}のプレシーズンマッチ対戦カードが決定しました。対戦相手は${oppNames}の3クラブ。指揮官は「新戦術の落とし込みとチームの一体感を高める絶好の機会。実戦を通して開幕ダッシュへの準備を整える」と意気込みを語っています。`;

  return {
    id: `news_ps_schedule_${Date.now()}`,
    date: currentDate,
    headline,
    body,
    category: 'tournament',
    relatedClubId: userClub.id,
    importance: 'high'
  };
}

/**
 * Handles revenue, board confidence, fan approval, and special news rewards
 * upon completing a pre-season match.
 */
export function processPreSeasonMatchRewards(
  state: GameWorldState,
  fixture: MatchFixture
): { updatedState: GameWorldState; news?: NewsItem } {
  if (fixture.competition !== 'pre-season' || !state.userClubId) {
    return { updatedState: state };
  }

  const userClub = state.clubs[state.userClubId];
  if (!userClub) return { updatedState: state };

  const isUserHome = fixture.homeClubId === state.userClubId;
  const userScore = isUserHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0);
  const oppScore = isUserHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0);
  const oppId = isUserHome ? fixture.awayClubId : fixture.homeClubId;
  const oppClub = state.clubs[oppId];

  const won = userScore > oppScore;
  const draw = userScore === oppScore;

  // Calculate ticket revenue and match prize money based on opponent prestige
  const oppTier = oppClub?.tier || 'Mid';
  const oppRep = oppClub?.reputation || 50;
  const isOverseas = oppClub && oppClub.country !== userClub.country;

  let baseBonus = 300000;
  if (oppTier === 'Elite') baseBonus = 1200000;
  else if (oppTier === 'Upper') baseBonus = 800000;
  else if (oppTier === 'Mid') baseBonus = 450000;

  if (isOverseas) baseBonus = Math.round(baseBonus * 1.35);

  const earnings = won ? baseBonus : draw ? Math.round(baseBonus * 0.6) : Math.round(baseBonus * 0.3);

  // Growth & Approval adjustments
  const fanDelta = won ? (oppTier === 'Elite' ? 5 : 3) : draw ? 1 : 0;
  const boardDelta = won ? 2 : draw ? 1 : 0;

  const updatedClubs = {
    ...state.clubs,
    [userClub.id]: {
      ...userClub,
      transferBudget: userClub.transferBudget + earnings
    }
  };

  // Generate celebration news
  let newsHeadline = `【プレシーズン結果】${userClub.name}、${oppClub?.name || '相手'}との熱戦を${userScore}-${oppScore}で終える`;
  let newsBody = `${fixture.competitionName}が行われ、${userClub.name}は${oppClub?.name || '相手クラブ'}と対戦しました。収益€${(earnings / 1000).toFixed(0)}kを獲得し、新戦力の試運転と開幕へ向けた戦術成熟が進んでいます。`;

  if (won) {
    if (isOverseas) {
      newsHeadline = `【プレシーズン大勝利】${userClub.name}、海外の強豪${oppClub?.name || ''}を${userScore}-${oppScore}で撃破！`;
      newsBody = `${fixture.competitionName}において、${userClub.name}が国際的な名門${oppClub?.name || '対戦相手'}に見事勝利！世界基準の相手に対する堂々たる戦いぶりにサポーターは大熱狂。クラブの国際的な評価も急上昇しています。`;
    } else {
      newsHeadline = `【プレシーズン白星】${userClub.name}、${oppClub?.name || ''}に${userScore}-${oppScore}で快勝！`;
      newsBody = `${fixture.competitionName}で${userClub.name}が勝利を収めました。指揮官の戦術が浸透し、新シーズン開幕へ向けて確かな手応えを掴んでいます。`;
    }
  }

  const news: NewsItem = {
    id: `news_ps_result_${Date.now()}_${fixture.id}`,
    date: fixture.date || state.currentDate,
    headline: newsHeadline,
    body: newsBody,
    category: 'tournament',
    relatedClubId: userClub.id,
    importance: won ? 'high' : 'medium'
  };

  return {
    updatedState: {
      ...state,
      clubs: updatedClubs,
      boardConfidence: Math.min(100, state.boardConfidence + boardDelta),
      fanApproval: Math.min(100, state.fanApproval + fanDelta),
      manager: {
        ...state.manager,
        reputation: won ? Math.min(100, state.manager.reputation + 1) : state.manager.reputation
      },
      news: [news, ...state.news]
    },
    news
  };
}
