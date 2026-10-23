import { GameWorldState, MatchFixture, StandingsRow, LeagueKey, NewsItem, Player, Club, DEFAULT_DIFFICULTY_SETTINGS, PeriodSummary } from '../types/game';
import { ENABLE_J_LEAGUE } from '../data/clubsData';
import { simulateFullMatch, calculatePlayerInjuryRisk, INJURY_VARIETIES, getRandomWeightedInjury } from './matchEngine';
import { simulateAITransfers } from './transferEngine';
import { getDefaultTacticsForClub } from '../data/squadPopulator';
import { generateSeasonFixtures } from './fixtureGenerator';
import { processPreSeasonMatchRewards } from './preSeasonEngine';
import { evaluateMatchBoardConfidence } from './boardConfidenceEngine';
import { updateClubVisionAfterSeason } from './clubVisionEngine';

// Format ISO date to display string YYYY年M月D日
export function formatDateJP(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}

// Add days to ISO date string
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Accurate age calculation based on birth date string and current game date (Requirement 9)
export function calculateAge(birthDateStr: string, currentDateStr: string): number {
  if (!birthDateStr) return 25;
  const [bYear, bMonth, bDay] = birthDateStr.split('-').map(Number);
  const [cYear, cMonth, cDay] = currentDateStr.split('-').map(Number);
  if (!bYear || !bMonth || !bDay || !cYear || !cMonth || !cDay) return 25;
  let age = cYear - bYear;
  if (cMonth < bMonth || (cMonth === bMonth && cDay < bDay)) {
    age--;
  }
  return Math.max(15, age);
}

// Check if a date falls within transfer windows (Summer: July 1 - Aug 31, Winter: Jan 1 - Jan 31)
export function isTransferWindow(dateStr: string): boolean {
  const parts = dateStr.split('-');
  const month = parseInt(parts[1], 10);
  return (month >= 7 && month <= 8) || month === 1;
}

export function getDaysUntilDeadline(dateStr: string): number {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (month === 7 || month === 8) {
    const deadline = new Date(`${year}-08-31`);
    const current = new Date(dateStr);
    const diff = Math.ceil((deadline.getTime() - current.getTime()) / (1000 * 3600 * 24));
    return Math.max(0, diff);
  }
  if (month === 1) {
    const deadline = new Date(`${year}-01-31`);
    const current = new Date(dateStr);
    const diff = Math.ceil((deadline.getTime() - current.getTime()) / (1000 * 3600 * 24));
    return Math.max(0, diff);
  }
  return 0;
}

export interface DayProgressionResult {
  updatedState: GameWorldState;
  stoppedReason?: string;
  hasUserMatchToday?: boolean;
  userMatchFixture?: MatchFixture;
  userSimulatedFixture?: MatchFixture;
  periodSummary?: PeriodSummary;
}

// -------------------------------------------------------------
// 【9. MATCH_RESULT 大会・順位表・選手個人成績への確実な反映】
// -------------------------------------------------------------
export function applyMatchResultToWorld(
  state: GameWorldState,
  fixture: MatchFixture,
  updatedPlayers?: Record<string, Player>
): GameWorldState {
  if (fixture.isResultApplied) {
    return state; // Duplicate reflection prevention (Requirement 9)
  }

  // 1. Update fixture record
  const fixtures = [...state.fixtures];
  const idx = fixtures.findIndex(f => f.id === fixture.id);
  const finalFixture: MatchFixture = {
    ...fixture,
    status: 'finished',
    isResultApplied: true
  };
  if (idx !== -1) {
    fixtures[idx] = finalFixture;
  } else {
    fixtures.push(finalFixture);
  }

  // 2. Update standings if this is a league fixture
  const standings = { ...state.standings };
  const leagueKey = finalFixture.competition as LeagueKey;
  if (standings[leagueKey]) {
    updateStandingsAfterMatch(standings[leagueKey], finalFixture);
  }

  // 3. Update player season stats from events
  const players = { ...(updatedPlayers || state.players) };
  if (finalFixture.events) {
    finalFixture.events.forEach(e => {
      if (e.playerId && players[e.playerId]) {
        if (e.type === 'yellow_card') {
          players[e.playerId].stats.yellowCards += 1;
        } else if (e.type === 'red_card' || e.type === 'second_yellow') {
          players[e.playerId].stats.redCards += 1;
        }
      }
    });
  }

  // 3.5 Decrement suspensions for official competitive matches (Requirement 3: プレシーズンでは消化しない)
  if (finalFixture.competition !== 'pre-season') {
    const newlyCardedPlayerIds = new Set(
      (finalFixture.events || [])
        .filter(e => e.type === 'red_card' || e.type === 'second_yellow')
        .map(e => e.playerId)
    );
    const participatingTeamIds = [finalFixture.homeClubId, finalFixture.awayClubId];

    Object.values(players).forEach(p => {
      if (participatingTeamIds.includes(p.clubId) && p.suspension?.isSuspended && !newlyCardedPlayerIds.has(p.id)) {
        if (p.suspension.matchesRemaining > 0) {
          p.suspension.matchesRemaining -= 1;
        }
        if (p.suspension.matchesRemaining <= 0) {
          p.suspension.isSuspended = false;
          p.suspension.matchesRemaining = 0;
          p.suspension.reason = undefined;
          if (p.squadStatus === 'OUT_OF_SQUAD') {
            p.squadStatus = 'RESERVE';
          }
        }
      }
    });
  }

  // 4. Knockout Cup Tournament Advancement (Requirement 9)
  const isKnockout = finalFixture.competition.includes('cup') ||
                     ['copa-del-rey', 'coppa-italia', 'dfb-pokal', 'coupe-de-france', 'ucl', 'uel', 'pre-season'].includes(finalFixture.competition);

  let updatedNews = [...state.news];

  if (isKnockout && finalFixture.homeScore !== undefined && finalFixture.awayScore !== undefined) {
    let winnerId: string;
    let loserId: string;

    if (finalFixture.homeScore > finalFixture.awayScore) {
      winnerId = finalFixture.homeClubId;
      loserId = finalFixture.awayClubId;
    } else if (finalFixture.awayScore > finalFixture.homeScore) {
      winnerId = finalFixture.awayClubId;
      loserId = finalFixture.homeClubId;
    } else if (finalFixture.penaltyShootout) {
      winnerId = finalFixture.penaltyShootout.homeScore > finalFixture.penaltyShootout.awayScore ? finalFixture.homeClubId : finalFixture.awayClubId;
      loserId = winnerId === finalFixture.homeClubId ? finalFixture.awayClubId : finalFixture.homeClubId;
    } else {
      winnerId = finalFixture.homeClubId;
      loserId = finalFixture.awayClubId;
    }

    const winnerClub = state.clubs[winnerId];
    const loserClub = state.clubs[loserId];

    // Find if there is a next round fixture in this competition that needs teams
    const nextRoundFixture = fixtures.find(f => 
      f.competition === finalFixture.competition && 
      f.status === 'upcoming' && 
      f.date > finalFixture.date &&
      (!f.homeClubId || !f.awayClubId || f.homeClubId === 'tbd' || f.awayClubId === 'tbd')
    );

    if (nextRoundFixture) {
      if (!nextRoundFixture.homeClubId || nextRoundFixture.homeClubId === 'tbd') {
        nextRoundFixture.homeClubId = winnerId;
      } else if (!nextRoundFixture.awayClubId || nextRoundFixture.awayClubId === 'tbd') {
        nextRoundFixture.awayClubId = winnerId;
      }
    }

    // Add tournament progression news
    const isUserInvolved = winnerId === state.userClubId || loserId === state.userClubId;
    const isWinnerUser = winnerId === state.userClubId;

    const cupHeadline = isUserInvolved
      ? (isWinnerUser
          ? `【カップ戦勝利】${winnerClub?.name || 'チーム'}が${loserClub?.name || '対戦相手'}を撃破し次ラウンド進出決定！`
          : `【カップ戦敗退】${loserClub?.name || 'チーム'}、${winnerClub?.name || '相手'}に惜敗しトーナメント敗退決定`)
      : `【${finalFixture.competitionName}】${winnerClub?.name || ''}が${finalFixture.homeScore}-${finalFixture.awayScore}で次ラウンド進出`;

    updatedNews.unshift({
      id: `news_cup_${Date.now()}_${finalFixture.id}`,
      date: finalFixture.date || state.currentDate,
      headline: cupHeadline,
      body: `${finalFixture.competitionName}の熱戦。${winnerClub?.name || '勝者'}が${loserClub?.name || '敗者'}との激闘を制し、見事次のトーナメントラウンドへの切符を掴み取りました。`,
      category: 'tournament',
      relatedClubId: winnerId,
      importance: isUserInvolved ? 'high' : 'medium'
    });
  }

  // 5. Board Confidence, Fan Approval, and Sacking Evaluation for User Matches
  let boardConfidence = state.boardConfidence;
  let fanApproval = state.fanApproval;
  let consecutiveLosses = state.consecutiveLosses;
  let consecutiveWinless = state.consecutiveWinless || 0;
  let isSacked = state.isSacked;
  let managerStats = { ...state.manager };

  if (finalFixture.isUserMatch && finalFixture.homeScore !== undefined && finalFixture.awayScore !== undefined) {
    const isUserHome = finalFixture.homeClubId === state.userClubId;
    const userScore = isUserHome ? finalFixture.homeScore : finalFixture.awayScore;
    const oppScore = isUserHome ? finalFixture.awayScore : finalFixture.homeScore;

    const evalResult = evaluateMatchBoardConfidence(state, finalFixture, userScore, oppScore);
    boardConfidence = evalResult.newConfidence;
    fanApproval = evalResult.newFanApproval;
    consecutiveLosses = evalResult.newConsecutiveLosses;
    consecutiveWinless = evalResult.newConsecutiveWinless;
    if (evalResult.sackTriggered) {
      isSacked = true;
    }
    if (evalResult.newsItem) {
      updatedNews.unshift(evalResult.newsItem);
    }

    managerStats.matchesManaged += 1;
    if (userScore > oppScore) {
      managerStats.wins += 1;
      managerStats.reputation = Math.min(99, managerStats.reputation + 1);
    } else if (userScore === oppScore) {
      managerStats.draws += 1;
    } else {
      managerStats.losses += 1;
    }
  }

  const baseResultState: GameWorldState = {
    ...state,
    fixtures,
    standings,
    players,
    news: updatedNews,
    boardConfidence,
    fanApproval,
    consecutiveLosses,
    consecutiveWinless,
    isSacked,
    manager: managerStats
  };

  if (finalFixture.competition === 'pre-season' && finalFixture.isUserMatch) {
    const psRes = processPreSeasonMatchRewards(baseResultState, finalFixture);
    return psRes.updatedState;
  }

  return baseResultState;
}

// Advance exactly 1 day (Requirement 3: autoSimulateUserMatch for month skip & 7-day skip)
export function advanceOneDay(
  currentState: GameWorldState, 
  autoSimulateUserMatch: boolean = false
): DayProgressionResult {
  const nextDate = addDays(currentState.currentDate, 1);
  let state: GameWorldState = {
    ...currentState,
    currentDate: nextDate,
    isTransferWindowOpen: isTransferWindow(nextDate),
    transferWindowClosingDays: getDaysUntilDeadline(nextDate)
  };

  let stoppedReason: string | undefined;

  // 1. Fatigue Recovery & Daily Health check for players (Requirement 1 & 2)
  const updatedPlayers = { ...state.players };
  let injuryNews: NewsItem | null = null;
  const todayFixtures = state.fixtures.filter(f => f.date === nextDate);

  // Exact Birthday & Age Recalculation (Requirement 9: 全選手が毎年確実に歳を取る)
  Object.values(updatedPlayers).forEach(p => {
    if (!p.birthDate) {
      const bMonth = ((p.shirtNumber * 5 + p.name.length) % 12) + 1;
      const bDay = ((p.shirtNumber * 7 + p.name.length * 3) % 28) + 1;
      p.birthDate = `${2026 - (p.age || 25)}-${String(bMonth).padStart(2, '0')}-${String(bDay).padStart(2, '0')}`;
    }
    const exactAge = calculateAge(p.birthDate, nextDate);
    if (p.age !== exactAge) {
      p.age = exactAge;
    }
  });

  Object.values(updatedPlayers).forEach(p => {
    // Natural fatigue recovery (+8 to +16% per rest day)
    if (p.fatigue > 0) {
      const restFactor = state.trainingFocus === 'コンディション回復' ? 18 : 11;
      p.fatigue = Math.max(0, p.fatigue - restFactor);
    }

    // Condition subtle daily fluctuation
    if (Math.random() < 0.15) {
      const conditions: Player['condition'][] = ['pink', 'red', 'yellow', 'cyan', 'purple'];
      const weights = [0.15, 0.35, 0.35, 0.10, 0.05];
      const r = Math.random();
      let cum = 0;
      for (let i = 0; i < conditions.length; i++) {
        cum += weights[i];
        if (r <= cum) {
          p.condition = conditions[i];
          break;
        }
      }
    }

    // --- Injury state maintenance & recovery check ---
    const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
    if (isInjured) {
      if (p.injuryDaysRemaining !== undefined && p.injuryDaysRemaining > 0) {
        p.injuryDaysRemaining -= 1;
      }
      if (p.injury?.recoveryDays !== undefined && p.injury.recoveryDays > 0) {
        p.injury.recoveryDays -= 1;
      }

      // Check if return date reached or recovery days completed
      const reachedReturnDate = p.injuryReturnDate && nextDate >= p.injuryReturnDate;
      const zeroDaysLeft = p.injuryDaysRemaining === 0 || (p.injury?.recoveryDays === 0 && !p.injuryReturnDate);

      if (reachedReturnDate || zeroDaysLeft) {
        p.injuryStatus = 'HEALTHY';
        p.injury.isInjured = false;
        p.injury.recoveryDays = 0;
        p.injury.returnDate = undefined;
        p.injuryReturnDate = undefined;
        p.injuryStartDate = undefined;
        p.injuryType = undefined;
        p.injuryDaysRemaining = 0;

        if (p.clubId === state.userClubId && !autoSimulateUserMatch) {
          stoppedReason = `【戦列復帰】主力選手の${p.name}が怪我から全体練習に完全合流しました！`;
        }
      } else {
        // Strictly maintain INJURED state and prevent participation
        p.injuryStatus = 'INJURED';
        p.injury.isInjured = true;
        if (p.squadStatus === 'STARTING' || p.squadStatus === 'BENCH') {
          p.squadStatus = 'OUT_OF_SQUAD';
        }
      }
    } else {
      // Training injury check (Requirement 2: 試合日は試合シミュレーション側で判定し、二重加算を完全防止)
      const hasMatchToday = todayFixtures.some(f => f.homeClubId === p.clubId || f.awayClubId === p.clubId);
      if (!hasMatchToday) {
        const diffSettings = state.difficultySettings || DEFAULT_DIFFICULTY_SETTINGS;
        const injuryRateMod = diffSettings.injuryFrequency === 'low' ? 0.35 : diffSettings.injuryFrequency === 'high' ? 1.4 : 0.70;
        const trainingRisk = calculatePlayerInjuryRisk(p, 30, '標準的', false, diffSettings.injuryFrequency) * 0.12 * injuryRateMod;
        if (Math.random() < trainingRisk) {
          const chosenInj = getRandomWeightedInjury();
          const returnDate = addDays(nextDate, chosenInj.days);
          p.injury = {
            isInjured: true,
            type: `${chosenInj.name} (練習中)`,
            recoveryDays: chosenInj.days,
            returnDate
          };
          p.injuryStatus = 'INJURED';
          p.injuryStartDate = nextDate;
          p.injuryReturnDate = returnDate;
          p.injuryType = `${chosenInj.name} (練習中)`;
          p.injuryDaysRemaining = chosenInj.days;
          p.squadStatus = 'OUT_OF_SQUAD';

          if (p.clubId === state.userClubId) {
            if (!autoSimulateUserMatch) {
              stoppedReason = `【緊急速報】${p.name}が練習中に負傷しました。(全治約${chosenInj.days}日・復帰予定: ${returnDate})`;
            }
            injuryNews = {
              id: `news_inj_${Date.now()}_${p.id}`,
              date: nextDate,
              headline: `【負傷者情報】${state.clubs[state.userClubId]?.name}の${p.name}が練習中に負傷離脱`,
              body: `チームに痛手。${p.name}が本日のトレーニング中に負傷。メディカルスタッフの初期診断によると全治約${chosenInj.days}日（復帰予定: ${returnDate}）の見込み。試合出場不可のためベンチ外へ移動しました。`,
              category: 'injury',
              relatedClubId: state.userClubId,
              relatedPlayerId: p.id,
              importance: 'high'
            };
          }
        }
      }
    }

    // Young player gradual growth scaled by playerGrowthRate (Requirement 13)
    const diffSettings = state.difficultySettings || DEFAULT_DIFFICULTY_SETTINGS;
    const growthRateMod = diffSettings.playerGrowthRate === 'slow' ? 0.01 : diffSettings.playerGrowthRate === 'fast' ? 0.045 : 0.02;
    if (p.age <= 21 && p.potential > p.ovr && Math.random() < growthRateMod) {
      p.ovr += 1;
      p.pace = Math.min(99, p.pace + 1);
      p.passing = Math.min(99, p.passing + 1);
      p.shooting = Math.min(99, p.shooting + 1);
    }
  });

  // Daily Loan Expiration Check
  const userClubId = state.userClubId;
  const loanReturnNews: NewsItem[] = [];
  Object.values(updatedPlayers).forEach(p => {
    if (p.isLoaned && p.loanEndDate && p.loanEndDate <= nextDate) {
      const parentClubId = p.loanFromClubId || p.parentClubId;
      const loanClubId = p.clubId;
      const parentClub = parentClubId ? state.clubs[parentClubId] : null;
      const loanClub = state.clubs[loanClubId];

      if (parentClub && loanClub) {
        loanClub.playerIds = loanClub.playerIds.filter(id => id !== p.id);
        if (!parentClub.playerIds.includes(p.id)) {
          parentClub.playerIds.push(p.id);
        }

        p.clubId = parentClub.id;
        p.currentClubId = parentClub.id;
        p.isLoaned = false;
        p.loanFromClubId = undefined;
        p.loanEndDate = undefined;
        p.loanOptionBuyFee = undefined;
        p.squadStatus = 'OUT_OF_SQUAD';

        if (!state.transferHistory) state.transferHistory = [];
        state.transferHistory.unshift({
          id: `tr_loan_return_${Date.now()}_${p.id}`,
          date: nextDate,
          playerId: p.id,
          playerName: p.name,
          sellerClubId: loanClub.id,
          buyerClubId: parentClub.id,
          fee: 0,
          type: 'loan'
        });

        const headline = `【レンタル復帰】${p.name}が期限付き移籍期間満了に伴い${parentClub.name}へ復帰`;
        loanReturnNews.push({
          id: `news_loan_ret_${Date.now()}_${p.id}`,
          date: nextDate,
          headline,
          body: `期限付き移籍期間の終了。${p.name}が${loanClub.name}でのレンタル期間を満了し、所属元の${parentClub.name}へ復帰しました。`,
          category: 'transfer',
          relatedClubId: parentClub.id,
          relatedPlayerId: p.id,
          importance: 'high'
        });

        if ((loanClubId === userClubId || parentClubId === userClubId) && !autoSimulateUserMatch) {
          stoppedReason = `【レンタル移籍終了】${p.name}の期限付き移籍期間が満了し、${parentClub.name}への復帰手続きが完了しました。`;
        }
      }
    }
  });

  state.players = updatedPlayers;
  if (loanReturnNews.length > 0) {
    state.news = [...loanReturnNews, ...state.news];
  }
  if (injuryNews) {
    state.news = [injuryNews, ...state.news];
  }

  // Autonomous AI Transfers
  state = simulateAITransfers(state);

  // -------------------------------------------------------------
  // 【1 & 3. 試合シミュレーション：ユーザー戦・AI戦の完全処理】
  // -------------------------------------------------------------
  const userFixture = todayFixtures.find(f => (f.homeClubId === state.userClubId || f.awayClubId === state.userClubId) && f.status === 'upcoming');
  let userSimulatedFixture: MatchFixture | undefined;

  // Handle User Match
  if (userFixture) {
    if (!autoSimulateUserMatch) {
      // Manual match day stop
      const oppClubId = userFixture.homeClubId === state.userClubId ? userFixture.awayClubId : userFixture.homeClubId;
      return {
        updatedState: state,
        stoppedReason: `【MATCH DAY】本日 ${state.clubs[oppClubId]?.shortName || state.clubs[oppClubId]?.name || '対戦相手'} 戦が予定されています！`,
        hasUserMatchToday: true,
        userMatchFixture: userFixture
      };
    } else {
      // Fast forward auto-simulate user match via full match engine (Requirement 3)
      const homeClub = state.clubs[userFixture.homeClubId];
      const awayClub = state.clubs[userFixture.awayClubId];
      if (homeClub && awayClub) {
        const isUserHome = userFixture.homeClubId === state.userClubId;
        const homeTac = isUserHome ? state.tactics : getDefaultTacticsForClub(homeClub, state.players);
        const awayTac = !isUserHome ? state.tactics : getDefaultTacticsForClub(awayClub, state.players);
        const simRes = simulateFullMatch(userFixture, homeClub, awayClub, homeTac, awayTac, state.players);
        state = applyMatchResultToWorld(state, simRes.fixture, simRes.updatedPlayers);
        userSimulatedFixture = simRes.fixture;
      }
    }
  }

  // Simulate all AI fixtures scheduled for today (or pending up to nextDate) across all competitions (Requirement 1 & 3)
  const pendingFixtures = state.fixtures.filter(f => f.date <= nextDate && f.status === 'upcoming' && !f.isUserMatch);
  pendingFixtures.forEach(f => {
    const homeClub = state.clubs[f.homeClubId];
    const awayClub = state.clubs[f.awayClubId];
    if (homeClub && awayClub) {
      const homeTac = getDefaultTacticsForClub(homeClub, state.players);
      const awayTac = getDefaultTacticsForClub(awayClub, state.players);
      const simRes = simulateFullMatch(f, homeClub, awayClub, homeTac, awayTac, state.players);
      state = applyMatchResultToWorld(state, simRes.fixture, simRes.updatedPlayers);
    }
  });

  // Re-synchronize standings from match records (Requirement 1 & 11)
  state.standings = rebuildStandingsFromMatchResults(state.fixtures, state.clubs, state.standings);

  // Dynamic Season Transition check (Specification 8 & 9: 7月のシーズン更新と昇降格・2年目以降のプレシーズン開始)
  const currentSeasonYear = parseInt(state.season.split('/')[0], 10) || 2026;
  const seasonString = `${currentSeasonYear}/${String(currentSeasonYear + 1).slice(2)}`;

  if (nextDate.endsWith('-07-01') || (nextDate >= `${currentSeasonYear + 1}-07-01` && state.season === seasonString)) {
    // Complete any unsimulated fixtures from the previous season to ensure complete data integrity
    state.fixtures.forEach(f => {
      if (f.status === 'upcoming' && f.date < nextDate) {
        f.status = 'finished';
        f.homeScore = f.homeScore ?? 1;
        f.awayScore = f.awayScore ?? 0;
        f.isResultApplied = true;
      }
    });

    const promRel = processSeasonEndPromotionsAndRelegations(state, currentSeasonYear + 1);
    state = promRel.state;
    state.news = [promRel.news, ...state.news];
    if (!autoSimulateUserMatch) {
      stoppedReason = `【${state.season}新シーズン開幕】昇降格が反映され、新シーズンのプレシーズンツアーが開幕しました！`;
    }
  }

  // Transfer window deadline day check
  if ((nextDate.endsWith('-08-31') || nextDate.endsWith('-01-31')) && !autoSimulateUserMatch) {
    state.showDeadlineSummary = true;
    stoppedReason = '【移籍市場最終日】夏の移籍ウィンドウのデッドラインデイを迎えました！';
  }

  return {
    updatedState: state,
    stoppedReason,
    userSimulatedFixture
  };
}

export function processSeasonEndPromotionsAndRelegations(
  state: GameWorldState,
  targetSeasonYear?: number | string
): { state: GameWorldState; news: NewsItem } {
  const clubs = { ...state.clubs };
  const standings = state.standings;

  const getStandings = (k: LeagueKey) => standings[k] || [];
  const nameOf = (id: string) => clubs[id]?.name || id;

  // 1. ENGLAND: Premier League (20) ⇄ Championship (24)
  const plRows = getStandings('premier-league');
  const plRelegated = plRows.length >= 20 ? plRows.slice(-3).map(r => r.clubId) : (plRows.length >= 3 ? plRows.slice(-3).map(r => r.clubId) : []);
  const champRows = getStandings('championship');
  const champDirectPromoted = champRows.length >= 2 ? champRows.slice(0, 2).map(r => r.clubId) : [];
  const champPlayoffPool = champRows.length >= 6 ? champRows.slice(2, 6) : [];
  const champPlayoffWinner = champPlayoffPool.length > 0 ? champPlayoffPool[0].clubId : (champRows[2]?.clubId || '');
  const champPromoted = [...champDirectPromoted, ...(champPlayoffWinner ? [champPlayoffWinner] : [])];

  // 2. SPAIN: La Liga (20) ⇄ Segunda División (22)
  const llRows = getStandings('laliga');
  const llRelegated = llRows.length >= 20 ? plRows.slice(-3).map(r => r.clubId) : (llRows.length >= 3 ? llRows.slice(-3).map(r => r.clubId) : []);
  const segRows = getStandings('segunda-division');
  const segDirectPromoted = segRows.length >= 2 ? segRows.slice(0, 2).map(r => r.clubId) : [];
  const segPlayoffPool = segRows.length >= 6 ? segRows.slice(2, 6) : [];
  const segPlayoffWinner = segPlayoffPool.length > 0 ? segPlayoffPool[0].clubId : (segRows[2]?.clubId || '');
  const segPromoted = [...segDirectPromoted, ...(segPlayoffWinner ? [segPlayoffWinner] : [])];

  // 3. GERMANY: Bundesliga (18) ⇄ 2. Bundesliga (18)
  const blRows = getStandings('bundesliga');
  const blDirectRelegated = blRows.length >= 18 ? blRows.slice(-2).map(r => r.clubId) : (blRows.length >= 2 ? blRows.slice(-2).map(r => r.clubId) : []);
  const blPlayoffClubId = blRows.length >= 16 ? blRows[15]?.clubId : ''; // 16th place Relegation Playoff
  const bl2Rows = getStandings('2-bundesliga');
  const bl2DirectPromoted = bl2Rows.length >= 2 ? bl2Rows.slice(0, 2).map(r => r.clubId) : [];
  const bl2PlayoffClubId = bl2Rows.length >= 3 ? bl2Rows[2]?.clubId : ''; // 3rd place Promotion Playoff
  const blPlayoffWinnerIs2ndDiv = Math.random() < 0.45;
  const blRelegated = [...blDirectRelegated];
  const bl2Promoted = [...bl2DirectPromoted];
  if (blPlayoffClubId && bl2PlayoffClubId) {
    if (blPlayoffWinnerIs2ndDiv) {
      blRelegated.push(blPlayoffClubId);
      bl2Promoted.push(bl2PlayoffClubId);
    }
  }

  // 4. ITALY: Serie A (20) ⇄ Serie B (20)
  const saRows = getStandings('serie-a');
  const saRelegated = saRows.length >= 20 ? saRows.slice(-3).map(r => r.clubId) : (saRows.length >= 3 ? saRows.slice(-3).map(r => r.clubId) : []);
  const sbRows = getStandings('serie-b');
  const sbDirectPromoted = sbRows.length >= 2 ? sbRows.slice(0, 2).map(r => r.clubId) : [];
  const sbPlayoffWinner = sbRows.length >= 3 ? sbRows[2]?.clubId : '';
  const sbPromoted = [...sbDirectPromoted, ...(sbPlayoffWinner ? [sbPlayoffWinner] : [])];

  // 5. FRANCE: Ligue 1 (18) ⇄ Ligue 2 (18)
  const l1Rows = getStandings('ligue-1');
  const l1DirectRelegated = l1Rows.length >= 18 ? l1Rows.slice(-2).map(r => r.clubId) : (l1Rows.length >= 2 ? l1Rows.slice(-2).map(r => r.clubId) : []);
  const l1PlayoffClubId = l1Rows.length >= 16 ? l1Rows[15]?.clubId : ''; // 16th place Barrages
  const l2Rows = getStandings('ligue-2');
  const l2DirectPromoted = l2Rows.length >= 2 ? l2Rows.slice(0, 2).map(r => r.clubId) : [];
  const l2PlayoffClubId = l2Rows.length >= 3 ? l2Rows[2]?.clubId : ''; // 3rd place Barrages
  const l1BarrageWinnerIsL2 = Math.random() < 0.45;
  const l1Relegated = [...l1DirectRelegated];
  const l2Promoted = [...l2DirectPromoted];
  if (l1PlayoffClubId && l2PlayoffClubId) {
    if (l1BarrageWinnerIsL2) {
      l1Relegated.push(l1PlayoffClubId);
      l2Promoted.push(l2PlayoffClubId);
    }
  }

  // 6. JAPAN: J1 League (20) ⇄ J2 League (20)
  const j1Rows = getStandings('j1-league');
  const j1Relegated = j1Rows.length >= 20 ? j1Rows.slice(-3).map(r => r.clubId) : (j1Rows.length >= 3 ? j1Rows.slice(-3).map(r => r.clubId) : []);
  const j2Rows = getStandings('j2-league');
  const j2DirectPromoted = j2Rows.length >= 2 ? j2Rows.slice(0, 2).map(r => r.clubId) : [];
  const j2PlayoffWinner = j2Rows.length >= 3 ? j2Rows[2]?.clubId : '';
  const j2Promoted = [...j2DirectPromoted, ...(j2PlayoffWinner ? [j2PlayoffWinner] : [])];

  // Swap league divisions and set division numbers
  plRelegated.forEach(id => { if (clubs[id]) { clubs[id].league = 'championship'; clubs[id].division = 2; } });
  champPromoted.forEach(id => { if (clubs[id]) { clubs[id].league = 'premier-league'; clubs[id].division = 1; } });

  llRelegated.forEach(id => { if (clubs[id]) { clubs[id].league = 'segunda-division'; clubs[id].division = 2; } });
  segPromoted.forEach(id => { if (clubs[id]) { clubs[id].league = 'laliga'; clubs[id].division = 1; } });

  blRelegated.forEach(id => { if (clubs[id]) { clubs[id].league = '2-bundesliga'; clubs[id].division = 2; } });
  bl2Promoted.forEach(id => { if (clubs[id]) { clubs[id].league = 'bundesliga'; clubs[id].division = 1; } });

  saRelegated.forEach(id => { if (clubs[id]) { clubs[id].league = 'serie-b'; clubs[id].division = 2; } });
  sbPromoted.forEach(id => { if (clubs[id]) { clubs[id].league = 'serie-a'; clubs[id].division = 1; } });

  l1Relegated.forEach(id => { if (clubs[id]) { clubs[id].league = 'ligue-2'; clubs[id].division = 2; } });
  l2Promoted.forEach(id => { if (clubs[id]) { clubs[id].league = 'ligue-1'; clubs[id].division = 1; } });

  j1Relegated.forEach(id => { if (clubs[id]) { clubs[id].league = 'j2-league'; clubs[id].division = 2; } });
  j2Promoted.forEach(id => { if (clubs[id]) { clubs[id].league = 'j1-league'; clubs[id].division = 1; } });

  // Handle User Club Promotion / Relegation effects
  let userClubNewsHeadline = '';
  let userClubNewsBody = '';
  if (state.userClubId) {
    const userClub = clubs[state.userClubId];
    const isPromoted = champPromoted.includes(state.userClubId) ||
      segPromoted.includes(state.userClubId) ||
      bl2Promoted.includes(state.userClubId) ||
      sbPromoted.includes(state.userClubId) ||
      l2Promoted.includes(state.userClubId) ||
      j2Promoted.includes(state.userClubId);

    const isRelegated = plRelegated.includes(state.userClubId) ||
      llRelegated.includes(state.userClubId) ||
      blRelegated.includes(state.userClubId) ||
      saRelegated.includes(state.userClubId) ||
      l1Relegated.includes(state.userClubId) ||
      j1Relegated.includes(state.userClubId);

    if (isPromoted) {
      userClub.transferBudget = Math.round(userClub.transferBudget * 1.35);
      userClub.wageBudget = Math.round(userClub.wageBudget * 1.25);
      userClub.target = 'リーグ残留';
      userClubNewsHeadline = `【歓喜の1部昇格達成！】${userClub.name}、${state.manager.name}監督の下でトップリーグ昇格決定！`;
      userClubNewsBody = `激闘のシーズンを戦い抜いた${userClub.name}が、見事にトップディビジョンへの昇格を果たしました！取締役会は${state.manager.name}監督の手腕を絶賛し、来季の補強予算を大幅に増額（35%UP）することを決定。サポーターの歓喜の声が街中に響き渡っています。`;
    } else if (isRelegated) {
      userClub.target = '1部昇格';
      userClubNewsHeadline = `【悔しき2部降格】${userClub.name}、来季は2部ディビジョンからの再起を誓う`;
      userClubNewsBody = `残留争いの末、${userClub.name}の2部降格が決定しました。取締役会は失望を隠せないものの、${state.manager.name}監督に対して「1年でのトップリーグ復帰」を厳命。チームの刷新と即時昇格に向けた再構築が始まります。`;
    }
  }

  // Summary news across all 6 countries
  const summaryBody = [
    '【2026/27シーズン公式昇格・降格結果発表（全6大リーグ）】',
    `■ イングランド (プレミアリーグ ⇄ チャンピオンシップ)`,
    `  ・昇格: ${champPromoted.map(nameOf).join('、') || '該当クラブ'}`,
    `  ・降格: ${plRelegated.map(nameOf).join('、') || '該当クラブ'}`,
    `■ スペイン (ラ・リーガ ⇄ セグンダ)`,
    `  ・昇格: ${segPromoted.map(nameOf).join('、') || '該当クラブ'}`,
    `  ・降格: ${llRelegated.map(nameOf).join('、') || '該当クラブ'}`,
    `■ ドイツ (ブンデスリーガ ⇄ 2.ブンデスリーガ)`,
    `  ・昇格: ${bl2Promoted.map(nameOf).join('、') || '該当クラブ'}`,
    `  ・降格: ${blRelegated.map(nameOf).join('、') || '該当クラブ'}`,
    `■ イタリア (セリエA ⇄ セリエB)`,
    `  ・昇格: ${sbPromoted.map(nameOf).join('、') || '該当クラブ'}`,
    `  ・降格: ${saRelegated.map(nameOf).join('、') || '該当クラブ'}`,
    `■ フランス (リーグ・アン ⇄ リーグ・ドゥ)`,
    `  ・昇格: ${l2Promoted.map(nameOf).join('、') || '該当クラブ'}`,
    `  ・降格: ${l1Relegated.map(nameOf).join('、') || '該当クラブ'}`,
    `■ 日本 (明治安田J1 ⇄ J2)`,
    `  ・昇格: ${j2Promoted.map(nameOf).join('、') || '該当クラブ'}`,
    `  ・降格: ${j1Relegated.map(nameOf).join('、') || '該当クラブ'}`
  ].join('\n');

  const mainNews: NewsItem = {
    id: `news_prom_rel_${Date.now()}`,
    date: state.currentDate,
    headline: userClubNewsHeadline || '【欧州・Jリーグ公式】シーズン終了に伴う6大リーグ全昇格・降格クラブ決定！',
    body: userClubNewsBody ? `${userClubNewsBody}\n\n${summaryBody}` : summaryBody,
    category: 'tournament',
    importance: 'high'
  };

  // Reset standings for all 12 leagues for the next season
  const updatedStandings = { ...standings };
  (Object.keys(updatedStandings) as LeagueKey[]).forEach(k => {
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
  });

  // Calculate next season string dynamically
  const currentYear = parseInt(state.season.split('/')[0], 10) || 2026;
  const nextYear = typeof targetSeasonYear === 'number'
    ? targetSeasonYear 
    : targetSeasonYear 
      ? parseInt(String(targetSeasonYear).split('/')[0], 10) || (currentYear + 1)
      : (currentYear + 1);
  const nextSeason = `${nextYear}/${String(nextYear + 1).slice(2)}`;
  const nextDate = `${nextYear}-07-01`;

  // Regenerate season fixtures for the next season with updated league memberships and fresh randomized pre-season
  const nextFixtures = generateSeasonFixtures(clubs, state.userClubId, nextYear, state.manager);

  // Update Club Vision Roadmap for the new season
  let updatedVision = state.clubVision;
  if (state.userClubId && clubs[state.userClubId]) {
    const userClub = clubs[state.userClubId];
    if (updatedVision) {
      updatedVision = updateClubVisionAfterSeason(updatedVision, userClub, nextSeason, state);
    }
  }

  return {
    state: {
      ...state,
      season: nextSeason,
      currentDate: nextDate,
      clubs,
      standings: updatedStandings,
      fixtures: nextFixtures,
      selectedPreSeason: undefined, // Clears selection so pre-season invitations show in July!
      clubVision: updatedVision
    },
    news: mainNews
  };
}

// Fast forward until target condition (Requirement 3: 月末まで進める機能を完全修正)
export function fastForwardUntil(
  initialState: GameWorldState,
  targetType: 'next_match' | 'transfer_deadline' | 'days_7' | 'end_of_month'
): DayProgressionResult {
  let currentState = initialState;
  const maxDays = 90; // Safety cap
  let daysCount = 0;
  const userMatchesPlayed: MatchFixture[] = [];
  let injuriesCount = 0;

  // Auto simulate user matches during long skips (end_of_month, days_7, transfer_deadline)
  const autoSimulate = targetType !== 'next_match';
  const startMonth = initialState.currentDate.split('-')[1];

  while (daysCount < maxDays) {
    daysCount++;
    const res = advanceOneDay(currentState, autoSimulate);
    currentState = res.updatedState;

    if (res.userSimulatedFixture) {
      userMatchesPlayed.push(res.userSimulatedFixture);
      const injs = (res.userSimulatedFixture.events || []).filter(e => e.type === 'injury' && e.clubId === initialState.userClubId).length;
      injuriesCount += injs;
    }

    if (!autoSimulate && res.hasUserMatchToday) {
      return res;
    }

    if (!autoSimulate && res.stoppedReason) {
      return res;
    }

    if (targetType === 'transfer_deadline' && (currentState.currentDate.endsWith('08-31') || currentState.currentDate.endsWith('01-31'))) {
      break;
    }

    if (targetType === 'days_7' && daysCount >= 7) {
      break;
    }

    if (targetType === 'end_of_month') {
      const currentMonth = currentState.currentDate.split('-')[1];
      if (currentMonth !== startMonth) {
        break;
      }
    }
  }

  // Build PeriodSummary for user feedback
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let cleanSheets = 0;

  const matchDetails = userMatchesPlayed.map(f => {
    const isHome = f.homeClubId === initialState.userClubId;
    const userScore = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
    const oppScore = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
    const oppClubId = isHome ? f.awayClubId : f.homeClubId;
    const oppName = currentState.clubs[oppClubId]?.shortName || currentState.clubs[oppClubId]?.name || '対戦相手';

    goalsFor += userScore;
    goalsAgainst += oppScore;
    if (oppScore === 0) cleanSheets++;

    let result: 'W' | 'D' | 'L' = 'D';
    if (userScore > oppScore) { wins++; result = 'W'; }
    else if (userScore < oppScore) { losses++; result = 'L'; }
    else { draws++; result = 'D'; }

    return {
      matchId: f.id,
      date: f.date,
      opponentName: oppName,
      isHome,
      score: `${userScore} - ${oppScore}`,
      result
    };
  });

  const periodSummary: PeriodSummary = {
    startDate: initialState.currentDate,
    endDate: currentState.currentDate,
    matchesPlayed: userMatchesPlayed.length,
    userMatchesCount: userMatchesPlayed.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    cleanSheets,
    injuriesOccurred: injuriesCount,
    matchDetails
  };

  const stoppedReason = targetType === 'end_of_month'
    ? `【月末進行完了】${formatDateJP(initialState.currentDate)}から${formatDateJP(currentState.currentDate)}まで進めました（期間中 ${userMatchesPlayed.length}試合を自動シミュレーション）。`
    : targetType === 'days_7'
    ? `【1週間進行完了】7日間の日程を進めました（期間中 ${userMatchesPlayed.length}試合を自動シミュレーション）。`
    : `時間スキップが完了しました。`;

  return {
    updatedState: currentState,
    stoppedReason,
    periodSummary
  };
}

export function updateStandingsAfterMatch(standings: StandingsRow[], fixture: MatchFixture) {
  if (fixture.homeScore === undefined || fixture.awayScore === undefined) return;

  const homeRow = standings.find(s => s.clubId === fixture.homeClubId);
  const awayRow = standings.find(s => s.clubId === fixture.awayClubId);

  if (!homeRow || !awayRow) return;

  homeRow.played += 1;
  awayRow.played += 1;

  homeRow.goalsFor += fixture.homeScore;
  homeRow.goalsAgainst += fixture.awayScore;
  homeRow.goalDiff = homeRow.goalsFor - homeRow.goalsAgainst;

  awayRow.goalsFor += fixture.awayScore;
  awayRow.goalsAgainst += fixture.homeScore;
  awayRow.goalDiff = awayRow.goalsFor - awayRow.goalsAgainst;

  if (fixture.homeScore > fixture.awayScore) {
    homeRow.won += 1;
    homeRow.points += 3;
    awayRow.lost += 1;
    homeRow.form.unshift('W');
    awayRow.form.unshift('L');
  } else if (fixture.homeScore < fixture.awayScore) {
    awayRow.won += 1;
    awayRow.points += 3;
    homeRow.lost += 1;
    homeRow.form.unshift('L');
    awayRow.form.unshift('W');
  } else {
    homeRow.drawn += 1;
    homeRow.points += 1;
    awayRow.drawn += 1;
    awayRow.points += 1;
    homeRow.form.unshift('D');
    awayRow.form.unshift('D');
  }

  homeRow.form = homeRow.form.slice(0, 5);
  awayRow.form = awayRow.form.slice(0, 5);

  // Sort standings by points -> goal diff -> goals for
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}

/**
 * 【Requirement 1 & 11】REBUILD_STANDINGS_FROM_MATCH_RESULTS
 * 順位表はMatchRecord（終了済み試合結果）から再計算できるようにする。
 * 全クラブの試合数・勝利・引き分け・敗戦・得点・失点・得失点差・勝点を全大会で整合再構築。
 */
export function rebuildStandingsFromMatchResults(
  fixtures: MatchFixture[],
  clubs: Record<string, Club>,
  currentStandings?: Record<string, StandingsRow[]>
): Record<LeagueKey, StandingsRow[]> {
  const standingsMap: Record<string, Record<string, StandingsRow>> = {};

  // 1. Initialize clean entries for all clubs across their registered leagues
  Object.values(clubs).forEach(club => {
    if (!standingsMap[club.league]) {
      standingsMap[club.league] = {};
    }
    standingsMap[club.league][club.id] = {
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
    };
  });

  // 2. Aggregate all finished fixtures strictly once
  fixtures.forEach(fixture => {
    if (fixture.status === 'finished' && fixture.homeScore !== undefined && fixture.awayScore !== undefined) {
      const leagueKey = fixture.competition;
      if (standingsMap[leagueKey]) {
        const homeRow = standingsMap[leagueKey][fixture.homeClubId];
        const awayRow = standingsMap[leagueKey][fixture.awayClubId];
        if (homeRow && awayRow) {
          homeRow.played += 1;
          awayRow.played += 1;
          homeRow.goalsFor += fixture.homeScore;
          homeRow.goalsAgainst += fixture.awayScore;
          homeRow.goalDiff += (fixture.homeScore - fixture.awayScore);

          awayRow.goalsFor += fixture.awayScore;
          awayRow.goalsAgainst += fixture.homeScore;
          awayRow.goalDiff += (fixture.awayScore - fixture.homeScore);

          if (fixture.homeScore > fixture.awayScore) {
            homeRow.won += 1;
            homeRow.points += 3;
            homeRow.form.push('W');
            awayRow.lost += 1;
            awayRow.form.push('L');
          } else if (fixture.homeScore < fixture.awayScore) {
            awayRow.won += 1;
            awayRow.points += 3;
            homeRow.lost += 1;
            homeRow.form.push('L');
            awayRow.form.push('W');
          } else {
            homeRow.drawn += 1;
            homeRow.points += 1;
            awayRow.drawn += 1;
            awayRow.points += 1;
            homeRow.form.push('D');
            awayRow.form.push('D');
          }
        }
      }
    }
  });

  // 3. Format and sort each league table (Points -> GD -> GF -> Alphabetical)
  const result: Record<LeagueKey, StandingsRow[]> = {} as any;
  for (const [leagueKey, clubsMap] of Object.entries(standingsMap)) {
    const rows = Object.values(clubsMap);
    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.clubName.localeCompare(b.clubName);
    });
    rows.forEach(r => {
      r.form = r.form.slice(-5);
    });
    result[leagueKey as LeagueKey] = rows;
  }

  return result;
}

export const REBUILD_STANDINGS_FROM_MATCH_RESULTS = rebuildStandingsFromMatchResults;

/**
 * Simulate all pending AI matches on or before a given date and sync standings
 */
export function simulatePendingAIFixturesForDate(
  state: GameWorldState,
  date: string
): GameWorldState {
  let currentState = { ...state };
  const fixturesToSimulate = currentState.fixtures.filter(
    f => f.date <= date && f.status === 'upcoming' && !f.isUserMatch
  );

  fixturesToSimulate.forEach(f => {
    const homeClub = currentState.clubs[f.homeClubId];
    const awayClub = currentState.clubs[f.awayClubId];
    if (homeClub && awayClub) {
      const homeTac = getDefaultTacticsForClub(homeClub, currentState.players);
      const awayTac = getDefaultTacticsForClub(awayClub, currentState.players);
      const simRes = simulateFullMatch(f, homeClub, awayClub, homeTac, awayTac, currentState.players);
      currentState = applyMatchResultToWorld(currentState, simRes.fixture, simRes.updatedPlayers);
    }
  });

  // Synchronize standings
  currentState.standings = rebuildStandingsFromMatchResults(currentState.fixtures, currentState.clubs, currentState.standings);
  return currentState;
}
