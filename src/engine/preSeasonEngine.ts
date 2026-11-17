import {
  Club,
  MatchFixture,
  GameWorldState,
  PreSeasonTournament,
  PreSeasonGroup,
  PreSeasonGroupStanding,
  PreSeasonTournamentState,
  PreSeasonHistoryRecord,
  NewsItem,
  ManagerProfile
} from '../types/game';

/**
 * Pre-Season Summer Tour Engine (2026/27 Multi-Year Tournament Format)
 *
 * - Generates fresh multi-year Summer Tour invitations every season (2026, 2027, 2028...)
 *   without duplicating within the same season.
 * - Tournament Format:
 *   8 clubs split into 2 groups of 4 (Group A & Group B).
 *   Every club plays 3 Group Stage matches (single round-robin per group).
 *   Tie-breaker priority: Points -> Goal Difference -> Goals Scored -> Head-to-Head.
 *   ONLY Group A 1st place vs Group B 1st place advance to the one-off Final!
 * - Tournament Rewards (idempotent via rewardProcessed):
 *   Champion Prize, Runner-Up Prize, or Group Stage Participation Reward.
 */

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function calculateClubGrowthScore(club: Club, manager?: ManagerProfile): number {
  const clubRep = club.reputation || 50;
  const mgrRep = manager?.reputation || 50;
  const trophies = manager?.careerTrophies || 0;
  return Math.min(100, Math.round(clubRep * 0.7 + mgrRep * 0.25 + Math.min(10, trophies * 2)));
}

function getEligibleTourPool(allClubs: Record<string, Club>, excludeId: string): Club[] {
  return Object.values(allClubs).filter(
    c =>
      c &&
      c.id &&
      c.id !== excludeId &&
      c.id !== 'free_agent' &&
      !c.isTournamentOnly &&
      (c.league as string) !== 'uefa-tournament'
  );
}

/**
 * Draws N distinct real clubs matching tour profile for 8-club tournament (user + 7 peers).
 */
export function drawPreSeasonOpponents(
  allClubs: Record<string, Club>,
  userClub: Club,
  count: number = 3,
  manager?: ManagerProfile,
  preferredTourId?: string
): Club[] {
  const clubList = getEligibleTourPool(allClubs, userClub.id);
  if (clubList.length === 0) return [];

  const isJapan = userClub.league === 'j1-league' || userClub.league === 'j2-league' || userClub.league === 'j3-league';
  const growth = calculateClubGrowthScore(userClub, manager);

  const jClubs = shuffleArray(clubList.filter(c => c.league === 'j1-league' || c.league === 'j2-league'));
  const overseasLowerMid = shuffleArray(
    clubList.filter(c => !c.league.startsWith('j') && (c.reputation <= 74 || c.tier === 'Lower' || c.tier === 'Mid'))
  );
  const overseasUpper = shuffleArray(
    clubList.filter(c => !c.league.startsWith('j') && ((c.reputation > 72 && c.reputation <= 84) || c.tier === 'Upper'))
  );
  const overseasElite = shuffleArray(
    clubList.filter(c => !c.league.startsWith('j') && (c.reputation > 82 || c.tier === 'Elite'))
  );
  const domesticSameCountry = shuffleArray(clubList.filter(c => c.country === userClub.country));

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

  const tourKey = (preferredTourId || '').toLowerCase();

  for (let slot = 0; slot < count; slot++) {
    let ok = false;
    if (tourKey.includes('domestic') || (isJapan && growth < 60 && slot < 2)) {
      ok = tryPickFrom(domesticSameCountry) || tryPickFrom(jClubs) || tryPickFrom(overseasLowerMid);
    } else if (tourKey.includes('elite') || tourKey.includes('usa') || tourKey.includes('global') || growth >= 80) {
      if (slot % 3 === 0) ok = tryPickFrom(overseasElite) || tryPickFrom(overseasUpper);
      else if (slot % 3 === 1) ok = tryPickFrom(overseasUpper) || tryPickFrom(overseasElite);
      else ok = tryPickFrom(jClubs) || tryPickFrom(overseasUpper);
    } else if (tourKey.includes('asia') || tourKey.includes('pacific') || tourKey.includes('japan')) {
      if (slot % 2 === 0) ok = tryPickFrom(jClubs) || tryPickFrom(overseasUpper);
      else ok = tryPickFrom(overseasUpper) || tryPickFrom(overseasLowerMid);
    } else {
      ok =
        slot === 0
          ? tryPickFrom(domesticSameCountry) || tryPickFrom(overseasLowerMid)
          : tryPickFrom(overseasUpper) || tryPickFrom(overseasLowerMid) || tryPickFrom(overseasElite);
    }
    if (!ok) fallbackPick();
  }

  while (picked.length < count && picked.length < clubList.length) {
    fallbackPick();
  }

  return picked;
}

/**
 * Generates 3 structured Summer Tour invitations for a given seasonYear (2026, 2027, 2028...).
 * Supports dynamic scaling with club growth/trophies and guarantees unique invitationKey per season.
 */
export function generatePreSeasonInvitations(
  userClub: Club,
  allClubs: Record<string, Club>,
  manager?: ManagerProfile,
  seasonYear: number = 2026
): PreSeasonTournament[] {
  const growth = calculateClubGrowthScore(userClub, manager);
  const yStr = String(seasonYear);
  const deadline = `${yStr}-07-16`;
  const startDate = `${yStr}-07-08`;
  const finalDate = `${yStr}-07-26`;
  const endDate = finalDate;

  const scaleMult = Math.max(0.6, Math.min(2.2, 0.75 + (growth - 55) * 0.015 + Math.min(0.4, (manager?.careerTrophies || 0) * 0.08)));
  const isJapan = userClub.league === 'j1-league' || userClub.league === 'j2-league' || userClub.league === 'j3-league';
  const eligibleCount = getEligibleTourPool(allClubs, userClub.id).length;

  const buildParticipants = (tourId: string): string[] => {
    if (eligibleCount < 7) return [userClub.id];
    const ops = drawPreSeasonOpponents(allClubs, userClub, 7, manager, tourId);
    return [userClub.id, ...ops.map(o => o.id)];
  };

  if (isJapan) {
    const lowTier = growth < 65;
    const templates = lowTier
      ? [
          {
            id: 'ps_japan_domestic',
            name: `国内サマー・チャレンジカップ ${yStr}`,
            region: '国内',
            hostCountry: '日本（静岡・宮崎）',
            baseChamp: 1200000,
            reason: `国内リーグでの戦術成熟と新戦力テストを目的とした伝統のプレシーズン大会へ正式招待`,
            condition: '参加8クラブ（2グループ×4チーム・各3試合＋優勝決定決勝）'
          },
          {
            id: 'ps_japan_pacific',
            name: `パシフィック・サマーツアー ${yStr}`,
            region: 'アジア・環太平洋',
            hostCountry: '日本・韓国',
            baseChamp: 2400000,
            reason: `クラブの成長実績が評価され、日韓・環太平洋の有力クラブが集う招待大会へ選出`,
            condition: '参加8クラブ（グループ首位のみ決勝進出）'
          },
          {
            id: 'ps_japan_world',
            name: `Jリーグ・インターナショナル・ワールドチャレンジ ${yStr}`,
            region: '国際',
            hostCountry: '日本（東京・横浜）',
            baseChamp: 4000000,
            reason: `欧州・国際強豪との実戦機会を提供する特別招待枠として組織委員会からオファー`,
            condition: '参加8クラブ（7月16日締切・優勝賞金大型ボーナス）'
          }
        ]
      : [
          {
            id: 'ps_japan_world',
            name: `Jリーグ・ワールドチャレンジ ${yStr}`,
            region: '日本・国際',
            hostCountry: '日本（東京・大阪）',
            baseChamp: 4800000,
            reason: `Jリーグを代表する有力クラブとして国際招待シリーズのメインクラブに選出`,
            condition: '参加8クラブ（グループ3試合制＋一発決勝）'
          },
          {
            id: 'ps_asia_super',
            name: `アジア・チャンピオンズ・サマーカップ ${yStr}`,
            region: 'アジア',
            hostCountry: 'シンガポール・東京',
            baseChamp: 6200000,
            reason: `昨季の成績とクラブブランド力を高く評価され、アジア王者決定プレ大会へ招待`,
            condition: '参加8クラブ（各グループ1位のみ決勝進出）'
          },
          {
            id: 'ps_global_champions',
            name: `グローバル・サマー・チャンピオンズツアー ${yStr}`,
            region: '欧州・北米遠征',
            hostCountry: 'ドイツ・アメリカ合衆国',
            baseChamp: 8500000,
            reason: `世界トップクラブが参戦するプレミアム夏期ツアーへの特別参戦権を獲得`,
            condition: '参加8クラブ（7月16日締切・最高額賞金ツアー）'
          }
        ];

    return templates.map(tpl => {
      const champPrize = Math.round((tpl.baseChamp * scaleMult) / 100000) * 100000;
      const runnerPrize = Math.round((champPrize * 0.45) / 100000) * 100000;
      const partReward = Math.round((champPrize * 0.2) / 100000) * 100000;
      return {
        id: tpl.id,
        invitationKey: `ps_inv_${yStr}_${tpl.id}`,
        seasonYear,
        name: tpl.name,
        region: tpl.region,
        hostCountry: tpl.hostCountry,
        startDate,
        endDate,
        finalDate,
        deadline,
        participants: buildParticipants(tpl.id),
        matchesCount: 3,
        invitationReason: tpl.reason,
        eligibilityCondition: tpl.condition,
        participationReward: partReward,
        runnerUpPrize: runnerPrize,
        championPrize: champPrize,
        prizeMoney: champPrize
      };
    });
  }

  const euroTemplates =
    growth < 70
      ? [
          {
            id: 'ps_euro_regional',
            name: `アルプス・サマー・カップ ${yStr}`,
            region: '欧州',
            hostCountry: 'オーストリア・スイス',
            baseChamp: 2400000,
            reason: `堅実なチーム作りと育成姿勢が評価され、アルプス地域の夏季キャンプ大会へ招待`,
            condition: '参加8クラブ（2グループ×4チーム・各3試合＋決勝）'
          },
          {
            id: 'ps_euro_tour',
            name: `ヨーロピアン・サマー・トロフィー ${yStr}`,
            region: '欧州',
            hostCountry: 'スペイン・ポルトガル',
            baseChamp: 4000000,
            reason: `新シーズンの上位躍進候補として、欧州各リーグの実力クラブが集う招待杯へ選出`,
            condition: '参加8クラブ（グループ1位のみ決勝進出）'
          },
          {
            id: 'ps_asia_tour',
            name: `アジア・パシフィック遠征ツアー ${yStr}`,
            region: 'アジア遠征',
            hostCountry: '日本・韓国',
            baseChamp: 5600000,
            reason: `アジア市場拡大プロジェクトの招待クラブとして大型商業ツアーへの参加要請を受領`,
            condition: '参加8クラブ（7月16日締切・国際プロモーション報酬付き）'
          }
        ]
      : [
          {
            id: 'ps_usa_super',
            name: `インターナショナル・スーパーカップ ${yStr}`,
            region: '北米',
            hostCountry: 'アメリカ合衆国',
            baseChamp: 10500000,
            reason: `世界屈指のブランド力と直近成績が認められ、北米スタジアムで開催される最高峰ツアーへ招待`,
            condition: '参加8クラブ（グループ3試合制＋一発決勝）'
          },
          {
            id: 'ps_asia_super',
            name: `極東・アジア・エリートツアー ${yStr}`,
            region: 'アジア遠征',
            hostCountry: '日本・シンガポール',
            baseChamp: 8200000,
            reason: `昨季の競争力とスター選手陣を評価され、アジア主要都市ツアーの招待枠に決定`,
            condition: '参加8クラブ（各グループ首位のみ決勝へ進出）'
          },
          {
            id: 'ps_euro_elite',
            name: `ヨーロピアン・エリート・サマー杯 ${yStr}`,
            region: '欧州',
            hostCountry: 'イングランド・ドイツ',
            baseChamp: 6800000,
            reason: `新シーズン開幕前の欧州強豪同士によるハイレベルな前哨戦への参加を要請`,
            condition: '参加8クラブ（7月16日締切）'
          }
        ];

  return euroTemplates.map(tpl => {
    const champPrize = Math.round((tpl.baseChamp * scaleMult) / 100000) * 100000;
    const runnerPrize = Math.round((champPrize * 0.45) / 100000) * 100000;
    const partReward = Math.round((champPrize * 0.2) / 100000) * 100000;
    return {
      id: tpl.id,
      invitationKey: `ps_inv_${yStr}_${tpl.id}`,
      seasonYear,
      name: tpl.name,
      region: tpl.region,
      hostCountry: tpl.hostCountry,
      startDate,
      endDate,
      finalDate,
      deadline,
      participants: buildParticipants(tpl.id),
      matchesCount: 3,
      invitationReason: tpl.reason,
      eligibilityCondition: tpl.condition,
      participationReward: partReward,
      runnerUpPrize: runnerPrize,
      championPrize: champPrize,
      prizeMoney: champPrize
    };
  });
}

/**
 * Backward-compatible wrapper preserving callers passing (userClub, manager, seasonYear)
 */
export function generatePreSeasonTourOptions(
  userClub: Club,
  manager?: ManagerProfile,
  seasonYear: number = 2026,
  allClubs?: Record<string, Club>
): PreSeasonTournament[] {
  return generatePreSeasonInvitations(userClub, allClubs || { [userClub.id]: userClub }, manager, seasonYear);
}

/**
 * Computes Group A or B standings strictly following:
 * 1. Points -> 2. Goal Diff -> 3. Goals For -> 4. Head-to-Head -> 5. Club Name
 */
export function computePreSeasonGroupStandings(
  groupClubIds: string[],
  groupFixtures: MatchFixture[],
  clubs: Record<string, Club>
): PreSeasonGroupStanding[] {
  const rowMap: Record<string, PreSeasonGroupStanding> = {};
  groupClubIds.forEach(cId => {
    rowMap[cId] = {
      clubId: cId,
      clubName: clubs[cId]?.name || cId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0
    };
  });

  const finishedGroupMatches = groupFixtures.filter(
    f =>
      f.status === 'finished' &&
      f.homeScore !== undefined &&
      f.awayScore !== undefined &&
      rowMap[f.homeClubId] &&
      rowMap[f.awayClubId]
  );

  finishedGroupMatches.forEach(f => {
    const h = rowMap[f.homeClubId];
    const a = rowMap[f.awayClubId];
    const hs = f.homeScore ?? 0;
    const as = f.awayScore ?? 0;

    h.played += 1;
    a.played += 1;
    h.goalsFor += hs;
    h.goalsAgainst += as;
    a.goalsFor += as;
    a.goalsAgainst += hs;

    if (hs > as) {
      h.won += 1;
      h.points += 3;
      a.lost += 1;
    } else if (as > hs) {
      a.won += 1;
      a.points += 3;
      h.lost += 1;
    } else {
      h.drawn += 1;
      a.drawn += 1;
      h.points += 1;
      a.points += 1;
    }
  });

  Object.values(rowMap).forEach(r => {
    r.goalDiff = r.goalsFor - r.goalsAgainst;
  });

  const compareHeadToHead = (aId: string, bId: string): number => {
    const h2hMatches = finishedGroupMatches.filter(
      f => (f.homeClubId === aId && f.awayClubId === bId) || (f.homeClubId === bId && f.awayClubId === aId)
    );
    if (h2hMatches.length === 0) return 0;
    let aPts = 0;
    let bPts = 0;
    let aGd = 0;
    let aGf = 0;
    let bGf = 0;
    h2hMatches.forEach(m => {
      const hs = m.homeScore ?? 0;
      const as = m.awayScore ?? 0;
      if (m.homeClubId === aId) {
        aGf += hs;
        bGf += as;
        aGd += hs - as;
        if (hs > as) aPts += 3;
        else if (as > hs) bPts += 3;
        else { aPts += 1; bPts += 1; }
      } else {
        aGf += as;
        bGf += hs;
        aGd += as - hs;
        if (as > hs) aPts += 3;
        else if (hs > as) bPts += 3;
        else { aPts += 1; bPts += 1; }
      }
    });
    if (bPts !== aPts) return bPts - aPts;
    if (aGd !== 0) return -aGd; // positive aGd means a beat b -> a ranks higher (negative return)
    if (bGf !== aGf) return bGf - aGf;
    return 0;
  };

  return Object.values(rowMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    const h2h = compareHeadToHead(a.clubId, b.clubId);
    if (h2h !== 0) return h2h;
    if (b.won !== a.won) return b.won - a.won;
    return a.clubName.localeCompare(b.clubName);
  });
}

/**
 * Builds exact 8-club Group Stage (2 groups x 4 clubs, 3 matches per club = 12 group fixtures) + Final fixture.
 */
export function initializePreSeasonTournament(
  allClubs: Record<string, Club>,
  userClubId: string,
  invitation: PreSeasonTournament,
  seasonYear: number = 2026,
  manager?: ManagerProfile
): {
  tournamentState: PreSeasonTournamentState;
  fixtures: MatchFixture[];
} {
  const userClub = allClubs[userClubId];
  const yStr = String(seasonYear);
  const seasonString = `${seasonYear}/${String(seasonYear + 1).slice(2)}`;

  // Ensure exactly 8 unique real clubs (User Club + 7 others)
  const uniqueIds: string[] = [userClubId];
  const candidatePool = [
    ...(invitation.participants || []),
    ...drawPreSeasonOpponents(allClubs, userClub, 7, manager, invitation.id).map(c => c.id)
  ];
  for (const id of candidatePool) {
    if (uniqueIds.length >= 8) break;
    if (id && id !== userClubId && allClubs[id] && !uniqueIds.includes(id)) {
      uniqueIds.push(id);
    }
  }
  if (uniqueIds.length < 8) {
    for (const c of getEligibleTourPool(allClubs, userClubId)) {
      if (uniqueIds.length >= 8) break;
      if (!uniqueIds.includes(c.id)) uniqueIds.push(c.id);
    }
  }

  const groupAClubs = uniqueIds.slice(0, 4);
  const groupBClubs = uniqueIds.slice(4, 8);

  const dates = [`${yStr}-07-08`, `${yStr}-07-14`, `${yStr}-07-20`];
  const roundPairings: Array<[[number, number], [number, number]]> = [
    [[0, 1], [2, 3]], // MD1
    [[2, 0], [1, 3]], // MD2
    [[0, 3], [1, 2]]  // MD3
  ];

  const fixtures: MatchFixture[] = [];
  const groupFixtureIds: string[] = [];

  const createGroupFixtures = (groupId: 'A' | 'B', clubIds: string[]) => {
    if (clubIds.length < 4) return;
    roundPairings.forEach((pairs, mdIdx) => {
      const md = mdIdx + 1;
      const date = dates[mdIdx];
      pairs.forEach(([hIdx, aIdx], pairIdx) => {
        const homeId = clubIds[hIdx];
        const awayId = clubIds[aIdx];
        const fId = `fix_ps_${yStr}_g${groupId}_md${md}_m${pairIdx}`;
        groupFixtureIds.push(fId);
        fixtures.push({
          id: fId,
          date,
          competition: 'pre-season',
          competitionType: 'preseason',
          competitionName: `${invitation.name} グループ${groupId}`,
          seasonId: seasonString,
          round: `グループ${groupId} 第${md}節`,
          homeClubId: homeId,
          awayClubId: awayId,
          status: 'upcoming',
          isUserMatch: homeId === userClubId || awayId === userClubId,
          isNeutralVenue: true,
          preSeasonMeta: {
            tournamentId: invitation.id,
            seasonYear,
            groupId,
            matchday: md,
            isGroupStage: true
          }
        });
      });
    });
  };

  createGroupFixtures('A', groupAClubs);
  createGroupFixtures('B', groupBClubs);

  const finalDate = invitation.finalDate || `${yStr}-07-26`;
  const finalFixtureId = `fix_ps_${yStr}_final`;
  fixtures.push({
    id: finalFixtureId,
    date: finalDate,
    competition: 'pre-season',
    competitionType: 'preseason',
    competitionName: `${invitation.name} 決勝`,
    seasonId: seasonString,
    round: '決勝',
    homeClubId: 'tbd',
    awayClubId: 'tbd',
    status: 'upcoming',
    isUserMatch: false,
    isFinal: true,
    needsDecider: true,
    isNeutralVenue: true,
    preSeasonMeta: {
      tournamentId: invitation.id,
      seasonYear,
      isFinal: true
    }
  });

  const groups: PreSeasonGroup[] = [
    {
      groupId: 'A',
      groupName: 'グループA',
      clubIds: groupAClubs,
      standings: computePreSeasonGroupStandings(groupAClubs, [], allClubs)
    },
    {
      groupId: 'B',
      groupName: 'グループB',
      clubIds: groupBClubs,
      standings: computePreSeasonGroupStandings(groupBClubs, [], allClubs)
    }
  ];

  const champPrize = invitation.championPrize || invitation.prizeMoney || 3000000;
  const runnerPrize = invitation.runnerUpPrize || Math.round(champPrize * 0.45);
  const partReward = invitation.participationReward || Math.round(champPrize * 0.2);

  const tournamentState: PreSeasonTournamentState = {
    seasonYear,
    tournamentId: invitation.id,
    invitationKey: invitation.invitationKey || `ps_inv_${yStr}_${invitation.id}`,
    name: invitation.name,
    hostCountry: invitation.hostCountry || invitation.region || '国際開催',
    startDate: invitation.startDate || dates[0],
    endDate: finalDate,
    stage: 'group_stage',
    groups,
    groupFixtureIds,
    finalFixtureId,
    championPrize: champPrize,
    runnerUpPrize: runnerPrize,
    participationReward: partReward,
    rewardProcessed: false,
    prizeAwarded: 0,
    budgetBefore: userClub?.transferBudget || 0,
    budgetAfter: userClub?.transferBudget || 0
  };

  return { tournamentState, fixtures };
}

/**
 * Generates pre-season fixtures (compatible with both full 8-team Group+Final tournament
 * and legacy calls without invitation).
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

  const invitations = generatePreSeasonInvitations(userClub, allClubs, manager, seasonYear);
  const chosen = invitations.find(i => i.id === selectedTourId) || invitations[0];

  if (selectedTourId) {
    return initializePreSeasonTournament(allClubs, userClubId, chosen, seasonYear, manager).fixtures;
  }

  const opponents = drawPreSeasonOpponents(allClubs, userClub, 3, manager, selectedTourId);
  if (opponents.length < 3) return [];
  const yStr = String(seasonYear);
  return [
    {
      id: `fix_ps_${yStr}_1`,
      date: `${yStr}-07-10`,
      competition: 'pre-season',
      competitionName: 'プレシーズン・親善マッチ第1戦',
      homeClubId: userClubId,
      awayClubId: opponents[0].id,
      status: 'upcoming',
      isUserMatch: true
    },
    {
      id: `fix_ps_${yStr}_2`,
      date: `${yStr}-07-20`,
      competition: 'pre-season',
      competitionName: 'プレシーズン・親善マッチ第2戦',
      homeClubId: opponents[1].id,
      awayClubId: userClubId,
      status: 'upcoming',
      isUserMatch: true
    },
    {
      id: `fix_ps_${yStr}_3`,
      date: `${yStr}-07-30`,
      competition: 'pre-season',
      competitionName: 'サマー・トロフィー決定戦',
      homeClubId: opponents[2].id,
      awayClubId: userClubId,
      status: 'upcoming',
      isUserMatch: true
    }
  ];
}

/**
 * Advances active PreSeasonTournamentState after group or final matches finish:
 * - Updates Group A / B standings with Points -> GD -> GF -> H2H
 * - When all 12 group matches finish, seats ONLY Group A #1 vs Group B #1 in the Final
 * - When Final finishes, determines Champion/Runner-Up, pays prize STRICTLY ONCE (idempotent),
 *   records budgetBefore/budgetAfter, and appends PreSeasonHistoryRecord.
 */
export function advancePreSeasonTournamentState(state: GameWorldState): GameWorldState {
  const tour = state.preSeasonTournament;
  if (!tour) return state;

  const userClubId = state.userClubId;
  const groupFixtures = state.fixtures.filter(f => tour.groupFixtureIds.includes(f.id));

  const updatedGroups: PreSeasonGroup[] = tour.groups.map(grp => {
    const grpFix = groupFixtures.filter(f => f.preSeasonMeta?.groupId === grp.groupId || (grp.clubIds.includes(f.homeClubId) && grp.clubIds.includes(f.awayClubId)));
    return {
      ...grp,
      standings: computePreSeasonGroupStandings(grp.clubIds, grpFix, state.clubs)
    };
  });

  const nextTour: PreSeasonTournamentState = {
    ...tour,
    groups: updatedGroups
  };

  let nextFixtures = state.fixtures;
  let nextClubs = state.clubs;
  let nextNews = state.news || [];
  let nextHistory = [...(state.preSeasonHistory || [])];
  let nextTitlesHistory = { ...(state.clubTitlesHistory || {}) };
  let nextManager = { ...state.manager };

  // Find user group rank in Group A
  const groupA = updatedGroups.find(g => g.groupId === 'A') || updatedGroups[0];
  const groupB = updatedGroups.find(g => g.groupId === 'B') || updatedGroups[1];
  if (userClubId && groupA) {
    const idx = groupA.standings.findIndex(r => r.clubId === userClubId);
    if (idx !== -1) nextTour.userGroupRank = idx + 1;
  }

  // Transition Group Stage -> Final (ONLY Group A #1 vs Group B #1!)
  const allGroupFinished =
    groupFixtures.length >= 12 && groupFixtures.every(f => f.status === 'finished');

  if (allGroupFinished && nextTour.stage === 'group_stage' && groupA && groupB) {
    const groupAWinnerId = groupA.standings[0]?.clubId;
    const groupBWinnerId = groupB.standings[0]?.clubId;

    if (groupAWinnerId && groupBWinnerId) {
      nextTour.stage = 'final';
      const userInFinal = groupAWinnerId === userClubId || groupBWinnerId === userClubId;
      if (!userInFinal && userClubId) {
        nextTour.userFinalPlacement = 'グループ敗退';
      }

      nextFixtures = state.fixtures.map(f => {
        if (f.id === nextTour.finalFixtureId) {
          return {
            ...f,
            homeClubId: groupAWinnerId,
            awayClubId: groupBWinnerId,
            isUserMatch: Boolean(userInFinal && f.status === 'upcoming')
          };
        }
        return f;
      });

      const aWinName = state.clubs[groupAWinnerId]?.name || groupAWinnerId;
      const bWinName = state.clubs[groupBWinnerId]?.name || groupBWinnerId;
      nextNews = [
        {
          id: `news_ps_finalists_${tour.seasonYear}_${Date.now()}`,
          date: state.currentDate,
          headline: `【${tour.name}】決勝カード決定：${aWinName} vs ${bWinName}`,
          body: userInFinal
            ? `グループステージ全3戦を突破し、${aWinName}（グループA首位）と${bWinName}（グループB首位）によるサマーツアー優勝決定戦への進出が確定しました！`
            : `グループステージ全日程が終了。各組1位の${aWinName}と${bWinName}が決勝戦へ進出しました。${state.clubs[userClubId || '']?.name || '自クラブ'}はグループ${nextTour.userGroupRank || '-'}位でグループ敗退となりました。`,
          category: 'tournament',
          relatedClubId: userInFinal ? userClubId || undefined : groupAWinnerId,
          importance: 'high'
        },
        ...nextNews
      ];
    }
  }

  // Final Completion -> Determine Champion, Runner-Up, Credit Prize Strictly Once
  const finalFixture = nextTour.finalFixtureId
    ? nextFixtures.find(f => f.id === nextTour.finalFixtureId)
    : undefined;

  if (finalFixture && finalFixture.status === 'finished' && nextTour.stage !== 'completed') {
    const hs = finalFixture.homeScore ?? 0;
    const as = finalFixture.awayScore ?? 0;
    let champId = hs > as ? finalFixture.homeClubId : as > hs ? finalFixture.awayClubId : '';
    if (!champId && finalFixture.penaltyShootout) {
      champId =
        finalFixture.penaltyShootout.winnerClubId ||
        (finalFixture.penaltyShootout.homeScore >= finalFixture.penaltyShootout.awayScore
          ? finalFixture.homeClubId
          : finalFixture.awayClubId);
    }
    if (!champId) champId = finalFixture.homeClubId;
    const runnerId = champId === finalFixture.homeClubId ? finalFixture.awayClubId : finalFixture.homeClubId;

    nextTour.championClubId = champId;
    nextTour.runnerUpClubId = runnerId;
    nextTour.stage = 'completed';

    const placement: '優勝' | '準優勝' | 'グループ敗退' =
      userClubId && champId === userClubId
        ? '優勝'
        : userClubId && runnerId === userClubId
          ? '準優勝'
          : 'グループ敗退';
    nextTour.userFinalPlacement = placement;

    const prizeToCredit =
      placement === '優勝'
        ? nextTour.championPrize
        : placement === '準優勝'
          ? nextTour.runnerUpPrize
          : nextTour.participationReward;

    const userClub = userClubId ? nextClubs[userClubId] : undefined;
    if (!nextTour.rewardProcessed && userClub) {
      const budgetBefore = userClub.transferBudget;
      const budgetAfter = budgetBefore + prizeToCredit;
      nextClubs = {
        ...nextClubs,
        [userClub.id]: {
          ...userClub,
          transferBudget: budgetAfter
        }
      };
      nextTour.rewardProcessed = true;
      nextTour.prizeAwarded = prizeToCredit;
      nextTour.budgetBefore = budgetBefore;
      nextTour.budgetAfter = budgetAfter;

      if (placement === '優勝') {
        const list = [...(nextTitlesHistory[userClub.id] || [])];
        list.push({
          year: nextTour.seasonYear,
          competitionName: nextTour.name,
          category: 'preseason'
        });
        nextTitlesHistory[userClub.id] = list;
        nextManager.careerTrophies = (nextManager.careerTrophies || 0) + 1;
      }

      const historyEntry: PreSeasonHistoryRecord = {
        seasonYear: nextTour.seasonYear,
        tournamentId: nextTour.tournamentId,
        name: nextTour.name,
        hostCountry: nextTour.hostCountry,
        championClubId: champId,
        championClubName: state.clubs[champId]?.name || champId,
        runnerUpClubId: runnerId,
        runnerUpClubName: state.clubs[runnerId]?.name || runnerId,
        userPlacement: placement,
        prizeAwarded: prizeToCredit,
        budgetBefore,
        budgetAfter,
        completedDate: finalFixture.date || state.currentDate
      };

      if (!nextHistory.some(h => h.seasonYear === historyEntry.seasonYear && h.tournamentId === historyEntry.tournamentId)) {
        nextHistory.unshift(historyEntry);
      }

      const champName = state.clubs[champId]?.name || champId;
      const prizeM = (prizeToCredit / 1000000).toFixed(2);
      nextNews = [
        {
          id: `news_ps_champ_${nextTour.seasonYear}_${Date.now()}`,
          date: finalFixture.date || state.currentDate,
          headline:
            placement === '優勝'
              ? `【サマーツアー優勝！】${userClub.name}が「${nextTour.name}」制覇・賞金€${prizeM}M獲得！`
              : `【${nextTour.name}閉幕】${champName}が優勝！（${userClub.name}：${placement}・報酬€${prizeM}M）`,
          body: `${nextTour.name}決勝（${state.clubs[finalFixture.homeClubId]?.name || ''} ${hs}-${as} ${state.clubs[finalFixture.awayClubId]?.name || ''}）が行われ、${champName}が大会制覇を果たしました。${userClub.name}の最終成績は「${placement}」、大会報酬 €${prizeM}M が移籍予算（€${(budgetBefore / 1000000).toFixed(1)}M → €${(budgetAfter / 1000000).toFixed(1)}M）へ加算されました。`,
          category: 'tournament',
          relatedClubId: champId,
          importance: 'high'
        },
        ...nextNews
      ];
    }
  }

  return {
    ...state,
    clubs: nextClubs,
    fixtures: nextFixtures,
    news: nextNews,
    clubTitlesHistory: nextTitlesHistory,
    manager: nextManager,
    preSeasonTournament: nextTour,
    preSeasonHistory: nextHistory
  };
}

export function createPreSeasonScheduleNews(
  userClub: Club,
  fixtures: MatchFixture[],
  clubs: Record<string, Club>,
  currentDate: string
): NewsItem {
  const userGroupMatches = fixtures.filter(
    f => (f.homeClubId === userClub.id || f.awayClubId === userClub.id) && !f.isFinal
  );
  const oppNames = userGroupMatches
    .map(f => {
      const oppId = f.homeClubId === userClub.id ? f.awayClubId : f.homeClubId;
      return clubs[oppId]?.name || '未定クラブ';
    })
    .join('、');

  return {
    id: `news_ps_schedule_${Date.now()}`,
    date: currentDate,
    headline: `【サマーツアー組合せ決定】${userClub.name}、グループステージ3連戦＋優勝決勝大会へ参戦！`,
    body: `新シーズン前のプレシーズン・サマーツアー日程が確定しました。グループステージで${oppNames || '実力クラブ'}との3試合を戦い、グループ首位のみが一発勝負の決勝戦へ進出します。`,
    category: 'tournament',
    relatedClubId: userClub.id,
    importance: 'high'
  };
}

/**
 * Handles matchday gate revenue, fan approval, sharpness, AND tournament advancement
 * upon completing a pre-season fixture.
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

  let workingState = state;
  let matchNews: NewsItem | undefined;

  if (fixture.homeClubId === state.userClubId || fixture.awayClubId === state.userClubId) {
    const isUserHome = fixture.homeClubId === state.userClubId;
    const userScore = isUserHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0);
    const oppScore = isUserHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0);
    const oppId = isUserHome ? fixture.awayClubId : fixture.homeClubId;
    const oppClub = state.clubs[oppId];

    const won = userScore > oppScore;
    const draw = userScore === oppScore;
    const oppTier = oppClub?.tier || 'Mid';
    const isOverseas = oppClub && oppClub.country !== userClub.country;

    // Small gate-receipt matchday bonus (distinct from end-of-tournament prize pool)
    let gateBonus = 150000;
    if (oppTier === 'Elite') gateBonus = 350000;
    else if (oppTier === 'Upper') gateBonus = 250000;
    if (isOverseas) gateBonus = Math.round(gateBonus * 1.25);

    const earnings = won ? gateBonus : draw ? Math.round(gateBonus * 0.7) : Math.round(gateBonus * 0.45);
    const fanDelta = won ? 2 : draw ? 1 : 0;
    const boardDelta = won ? 1 : 0;

    matchNews = {
      id: `news_ps_result_${Date.now()}_${fixture.id}`,
      date: fixture.date || state.currentDate,
      headline: won
        ? `【サマーツアー勝利】${userClub.name}、${oppClub?.name || ''}に${userScore}-${oppScore}で勝利！`
        : `【サマーツアー結果】${userClub.name}、${oppClub?.name || ''}と${userScore}-${oppScore}`,
      body: `${fixture.competitionName}（${fixture.round || '親善戦'}）で${userClub.name}は${oppClub?.name || '対戦相手'}と対戦。興行収入€${(earnings / 1000).toFixed(0)}kを獲得しました。`,
      category: 'tournament',
      relatedClubId: userClub.id,
      importance: won ? 'high' : 'medium'
    };

    workingState = {
      ...state,
      clubs: {
        ...state.clubs,
        [userClub.id]: {
          ...userClub,
          transferBudget: userClub.transferBudget + earnings
        }
      },
      boardConfidence: Math.min(100, state.boardConfidence + boardDelta),
      fanApproval: Math.min(100, state.fanApproval + fanDelta),
      manager: {
        ...state.manager,
        reputation: won ? Math.min(100, state.manager.reputation + 1) : state.manager.reputation
      },
      news: [matchNews, ...state.news]
    };
  }

  workingState = advancePreSeasonTournamentState(workingState);
  return { updatedState: workingState, news: matchNews };
}
