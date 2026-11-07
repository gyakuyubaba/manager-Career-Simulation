import { GameWorldState, MatchFixture, MatchEvent, StandingsRow, LeagueKey, NewsItem, Player, Club, DEFAULT_DIFFICULTY_SETTINGS, PeriodSummary, SeasonStatsHistory, CompetitionCategory, PendingTransfer, PenaltyShootoutResult } from '../types/game';
import { ENABLE_J_LEAGUE } from '../data/clubsData';
import { simulateFullMatch, calculatePlayerInjuryRisk, INJURY_VARIETIES, getRandomWeightedInjury } from './matchEngine';
import { simulateAITransfers } from './transferEngine';
import { getDefaultTacticsForClub } from '../data/squadPopulator';
import { generateSeasonFixtures } from './fixtureGenerator';
import { processPreSeasonMatchRewards } from './preSeasonEngine';
import { evaluateMatchBoardConfidence, getBoardConfidenceStage } from './boardConfidenceEngine';
import { updateClubVisionAfterSeason } from './clubVisionEngine';
import { checkAndAdvanceBallonDor } from './ballonDorEngine';
import { isType2PlayerUnavailableOnDate } from './scoutEngine';
import { initializeTournamentCompetitions } from './cupEngine';
import { evaluateDailyUnexpectedEvent } from './unexpectedEventsEngine';

// Get competition category for isolated disciplinary suspensions
export function getCompetitionCategory(competition: string): CompetitionCategory {
  if (competition === 'pre-season' || competition === 'preseason') return 'preseason';
  if (competition === 'ucl') return 'ucl';
  if (competition === 'uel') return 'uel';
  if (competition === 'uecl') return 'uecl';
  if (
    competition.includes('cup') ||
    ['copa-del-rey', 'coppa-italia', 'dfb-pokal', 'coupe-de-france', 'super-cup', 'levain-cup', 'emperors-cup'].includes(competition)
  ) {
    return 'domestic_cup';
  }
  return 'league';
}

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

export const STANDINGS_LEAGUES: LeagueKey[] = [
  'premier-league',
  'championship',
  'laliga',
  'segunda-division',
  'bundesliga',
  '2-bundesliga',
  'serie-a',
  'serie-b',
  'ligue-1',
  'ligue-2',
  'j1-league',
  'j2-league',
  'j3-league'
];

export interface MatchOutcome {
  winnerClubId?: string;
  resultType: 'home_win' | 'away_win' | 'draw' | 'pk_home_win' | 'pk_away_win';
  isDraw: boolean;
  homePointsDelta: number;
  awayPointsDelta: number;
}

export function determineMatchOutcome(fixture: {
  homeClubId: string;
  awayClubId: string;
  homeScore?: number;
  awayScore?: number;
  penaltyShootout?: PenaltyShootoutResult;
}): MatchOutcome {
  const homeScore = fixture.homeScore ?? 0;
  const awayScore = fixture.awayScore ?? 0;

  if (homeScore > awayScore) {
    return {
      winnerClubId: fixture.homeClubId,
      resultType: 'home_win',
      isDraw: false,
      homePointsDelta: 3,
      awayPointsDelta: 0
    };
  } else if (awayScore > homeScore) {
    return {
      winnerClubId: fixture.awayClubId,
      resultType: 'away_win',
      isDraw: false,
      homePointsDelta: 0,
      awayPointsDelta: 3
    };
  } else {
    if (fixture.penaltyShootout) {
      const pkHome = fixture.penaltyShootout.homeScore ?? 0;
      const pkAway = fixture.penaltyShootout.awayScore ?? 0;
      const pkWinner = fixture.penaltyShootout.winnerClubId || (pkHome > pkAway ? fixture.homeClubId : fixture.awayClubId);
      const isPkHome = pkWinner === fixture.homeClubId;
      return {
        winnerClubId: pkWinner,
        resultType: isPkHome ? 'pk_home_win' : 'pk_away_win',
        isDraw: false,
        homePointsDelta: isPkHome ? 3 : 0,
        awayPointsDelta: isPkHome ? 0 : 3
      };
    }
    return {
      winnerClubId: undefined,
      resultType: 'draw',
      isDraw: true,
      homePointsDelta: 1,
      awayPointsDelta: 1
    };
  }
}

// -------------------------------------------------------------
// 【9. MATCH_RESULT 大会・順位表・選手個人成績への確実な反映】
// -------------------------------------------------------------
export function applyMatchResultToWorld(
  state: GameWorldState,
  fixture: MatchFixture,
  updatedPlayers?: Record<string, Player>
): GameWorldState {
  const homeScore = fixture.homeScore ?? 0;
  const awayScore = fixture.awayScore ?? 0;
  const existingFixture = state.fixtures.find(f => f.id === fixture.id);

  // Requirement 3 & 7 (Idempotency): If the exact same fixture result has already been applied,
  // do not duplicate points, records, or match counts.
  if (
    existingFixture &&
    existingFixture.status === 'finished' &&
    existingFixture.isResultApplied &&
    existingFixture.homeScore === homeScore &&
    existingFixture.awayScore === awayScore
  ) {
    return state;
  }

  // 1. Authoritative outcome determination
  const outcome = determineMatchOutcome({
    homeClubId: fixture.homeClubId,
    awayClubId: fixture.awayClubId,
    homeScore,
    awayScore,
    penaltyShootout: fixture.penaltyShootout
  });

  const finalFixture: MatchFixture = {
    ...fixture,
    status: 'finished',
    homeScore,
    awayScore,
    winnerClubId: outcome.winnerClubId,
    resultType: outcome.resultType,
    isResultApplied: true
  };

  const fixtures = [...state.fixtures];
  const idx = fixtures.findIndex(f => f.id === fixture.id);
  if (idx !== -1) {
    fixtures[idx] = finalFixture;
  } else {
    fixtures.push(finalFixture);
  }

  // 2. Update standings if this is an official league fixture (never include cups or preseason)
  let standings = { ...state.standings };
  const isOfficialLeague = STANDINGS_LEAGUES.includes(finalFixture.competition as LeagueKey);
  if (isOfficialLeague) {
    // Rebuilding standings ensures clean recalculation without ghost points or duplicates, even if scores were corrected
    standings = rebuildStandingsFromMatchResults(fixtures, state.clubs, standings);
  }

  // 3. Update player season stats from events (Requirement 2: プレシーズン個人成績混入防止)
  const isPreseasonMatch = finalFixture.competition === 'pre-season' || finalFixture.competitionType === 'preseason';
  const players = { ...(updatedPlayers || state.players) };
  if (finalFixture.events) {
    finalFixture.events.forEach(e => {
      if (e.playerId && players[e.playerId]) {
        const pObj = players[e.playerId];
        if (isPreseasonMatch) {
          if (!pObj.preseasonStats) {
            pObj.preseasonStats = { appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 0, saves: 0, goalsConceded: 0 };
          }
          if (e.type === 'yellow_card') {
            pObj.preseasonStats.yellowCards += 1;
          } else if (e.type === 'red_card' || e.type === 'second_yellow') {
            pObj.preseasonStats.redCards += 1;
          }
        } else {
          if (e.type === 'yellow_card') {
            pObj.stats.yellowCards += 1;
          } else if (e.type === 'red_card' || e.type === 'second_yellow') {
            pObj.stats.redCards += 1;
          }
        }
      }
    });
  }

  // 3.5 Decrement suspensions for official competitive matches with COMPETITION ISOLATION (Requirement 7)
  if (finalFixture.competition !== 'pre-season' && finalFixture.competitionType !== 'preseason') {
    const newlyCardedPlayerIds = new Set(
      (finalFixture.events || [])
        .filter(e => e.type === 'red_card' || e.type === 'second_yellow')
        .map(e => e.playerId)
    );
    const participatingTeamIds = [finalFixture.homeClubId, finalFixture.awayClubId];
    const matchCategory = getCompetitionCategory(finalFixture.competition);

    Object.values(players).forEach(p => {
      if (participatingTeamIds.includes(p.clubId) && p.suspension?.isSuspended && !newlyCardedPlayerIds.has(p.id)) {
        const suspCat = p.suspension.competitionCategory;
        // Competition isolation: only decrement if this fixture's competition category matches
        if (!suspCat || suspCat === matchCategory) {
          if (p.suspension.matchesRemaining > 0) {
            p.suspension.matchesRemaining -= 1;
          }
          if (p.suspension.matchesRemaining <= 0) {
            p.suspension.isSuspended = false;
            p.suspension.matchesRemaining = 0;
            p.suspension.reason = undefined;
            p.suspension.competitionCategory = undefined;
            if (p.squadStatus === 'OUT_OF_SQUAD') {
              p.squadStatus = 'RESERVE';
            }
          }
        }
      }
    });
  }

  // 4. Knockout Cup Tournament Advancement & 2-Legged Ties (Requirement 1, 4, 8)
  const isKnockout = finalFixture.competition.includes('cup') ||
                     ['copa-del-rey', 'coppa-italia', 'dfb-pokal', 'coupe-de-france', 'ucl', 'uel', 'uecl', 'pre-season'].includes(finalFixture.competition);

  let updatedNews = [...state.news];
  let clubTitlesHistory = { ...(state.clubTitlesHistory || {}) };

  // Handle 2-legged ties
  const isLeg1Fixture = finalFixture.leg === 1 || finalFixture.round?.includes('Leg 1') || finalFixture.round?.includes('第1戦');
  if (isLeg1Fixture) {
    // Leg 1: Store score into paired Leg 2 fixture; do NOT advance winners yet!
    // Requirement 13: Guarantee paired 2nd leg matches the exact same opponent inverted (home <-> away)
    let leg2 = fixtures.find(f => 
      f.competition === finalFixture.competition &&
      (f.leg === 2 || f.round?.includes('Leg 2') || f.round?.includes('第2戦')) &&
      f.homeClubId === finalFixture.awayClubId && f.awayClubId === finalFixture.homeClubId
    );

    if (!leg2) {
      // Find matching round leg 2 fixture by match index
      const leg1MatchIndex = finalFixture.id.match(/_m(\d+)_/)?.[1];
      leg2 = fixtures.find(f => 
        f.competition === finalFixture.competition &&
        (f.leg === 2 || f.round?.includes('Leg 2') || f.round?.includes('第2戦')) &&
        (!leg1MatchIndex || f.id.includes(`_m${leg1MatchIndex}_`)) &&
        (!f.homeClubId || f.homeClubId === 'tbd' || f.homeClubId === finalFixture.awayClubId)
      );
      if (leg2) {
        // Enforce exact reversal of home and away
        leg2.homeClubId = finalFixture.awayClubId;
        leg2.awayClubId = finalFixture.homeClubId;
      }
    }

    if (leg2) {
      leg2.leg1Score = { homeScore: finalFixture.homeScore ?? 0, awayScore: finalFixture.awayScore ?? 0 };
    }
    const leg1News: NewsItem = {
      id: `news_leg1_${Date.now()}_${finalFixture.id}`,
      date: finalFixture.date || state.currentDate,
      headline: `【第1戦終了】${finalFixture.competitionName} ${finalFixture.homeScore} - ${finalFixture.awayScore} で決着`,
      body: `${finalFixture.competitionName}の第1戦は${finalFixture.homeScore}-${finalFixture.awayScore}のスコアで終了。勝負の行方はホーム＆アウェーの第2戦へ持ち越されました。`,
      category: 'tournament',
      relatedClubId: finalFixture.homeClubId,
      importance: 'medium'
    };
    updatedNews.unshift(leg1News);
  } else if (isKnockout && finalFixture.homeScore !== undefined && finalFixture.awayScore !== undefined) {
    let winnerId: string;
    let loserId: string;

    // Check if this is a 2-legged tie (Leg 2)
    if (finalFixture.leg === 2 || finalFixture.round?.includes('Leg 2')) {
      const homeLeg1 = finalFixture.leg1Score ? finalFixture.leg1Score.awayScore : 0;
      const awayLeg1 = finalFixture.leg1Score ? finalFixture.leg1Score.homeScore : 0;
      const totalHome = homeLeg1 + finalFixture.homeScore;
      const totalAway = awayLeg1 + finalFixture.awayScore;
      finalFixture.aggregateScore = { homeScore: totalHome, awayScore: totalAway };

      if (finalFixture.penaltyShootout) {
        winnerId = finalFixture.penaltyShootout.winnerClubId || (finalFixture.penaltyShootout.homeScore > finalFixture.penaltyShootout.awayScore ? finalFixture.homeClubId : finalFixture.awayClubId);
      } else if (totalHome > totalAway) {
        winnerId = finalFixture.homeClubId;
      } else if (totalAway > totalHome) {
        winnerId = finalFixture.awayClubId;
      } else {
        winnerId = finalFixture.homeClubId;
      }
      loserId = winnerId === finalFixture.homeClubId ? finalFixture.awayClubId : finalFixture.homeClubId;
    } else {
      // Single leg knockout
      if (finalFixture.homeScore > finalFixture.awayScore) {
        winnerId = finalFixture.homeClubId;
        loserId = finalFixture.awayClubId;
      } else if (finalFixture.awayScore > finalFixture.homeScore) {
        winnerId = finalFixture.awayClubId;
        loserId = finalFixture.homeClubId;
      } else if (finalFixture.penaltyShootout) {
        winnerId = finalFixture.penaltyShootout.winnerClubId || (finalFixture.penaltyShootout.homeScore > finalFixture.penaltyShootout.awayScore ? finalFixture.homeClubId : finalFixture.awayClubId);
        loserId = winnerId === finalFixture.homeClubId ? finalFixture.awayClubId : finalFixture.homeClubId;
      } else {
        winnerId = finalFixture.homeClubId;
        loserId = finalFixture.awayClubId;
      }
    }

    const winnerClub = state.clubs[winnerId];
    const loserClub = state.clubs[loserId];
    
    // Requirement 15: Strictly distinguish true Final from Quarter-Final and Semi-Final!
    const roundLower = (finalFixture.round || '').toLowerCase();
    const compLower = (finalFixture.competitionName || '').toLowerCase();
    const isSemiOrQuarter = roundLower.includes('semi') || 
                           roundLower.includes('quarter') || 
                           roundLower.includes('play-off') ||
                           roundLower.includes('playoff') ||
                           finalFixture.round?.includes('準') || 
                           finalFixture.round?.includes('プレーオフ') || 
                           compLower.includes('準') || 
                           compLower.includes('プレーオフ');

    const isFinal = !isSemiOrQuarter && Boolean(
      finalFixture.isFinal ||
      roundLower === 'final' ||
      finalFixture.round === '決勝' ||
      (finalFixture.competitionName && finalFixture.competitionName.endsWith('決勝') && !finalFixture.competitionName.includes('準'))
    );
    const isUserInvolved = winnerId === state.userClubId || loserId === state.userClubId;
    const isWinnerUser = winnerId === state.userClubId;

    if (isFinal) {
      // REQUIREMENT 8: Cup Championship Victory Celebration & Trophies tracking
      const seasonYear = parseInt(state.season?.split('/')[0], 10) || 2026;
      const winnerTitles = clubTitlesHistory[winnerId] || [];
      winnerTitles.push({
        year: seasonYear,
        competitionName: finalFixture.competitionName,
        category: getCompetitionCategory(finalFixture.competition)
      });
      clubTitlesHistory[winnerId] = winnerTitles;

      if (isWinnerUser) {
        state.manager.careerTrophies = (state.manager.careerTrophies || 0) + 1;
      }

      const victoryHeadline = isWinnerUser
        ? `【歓喜の戴冠・タイトル獲得！】${winnerClub?.name}、${finalFixture.competitionName}制覇を達成！`
        : `【大会制覇！】${winnerClub?.name}が${loserClub?.name}を破り、${finalFixture.competitionName}優勝！`;

      const victoryBody = `栄光のカップ戦決勝。激戦の末に${winnerClub?.name}が${loserClub?.name}を下し、見事に${finalFixture.competitionName}のトロフィーを掲げました！${winnerClub?.name}のサポーターは街中で歴史的戴冠を祝い、選手たちの勇敢な戦いぶりに惜しみない称賛が送られています。`;

      updatedNews.unshift({
        id: `news_champ_${Date.now()}_${finalFixture.id}`,
        date: finalFixture.date || state.currentDate,
        headline: victoryHeadline,
        body: victoryBody,
        category: 'tournament',
        relatedClubId: winnerId,
        importance: 'high'
      });
    } else {
      // Find if there is a next round fixture in this competition that needs teams
      // Check for structured match index progression: e.g. fix_fa-cup_r1_m0_2026 -> fix_fa-cup_r2_m0_2026
      let nextRoundFixture: MatchFixture | undefined;
      const matchIdParts = finalFixture.id.match(/^fix_([a-z0-9_-]+)_r(\d+)_m(\d+)_(\d+)$/);
      if (matchIdParts) {
        const [, cupKey, rStr, mStr, yearStr] = matchIdParts;
        const nextR = parseInt(rStr, 10) + 1;
        const nextM = Math.floor(parseInt(mStr, 10) / 2);
        const targetId = `fix_${cupKey}_r${nextR}_m${nextM}_${yearStr}`;
        nextRoundFixture = fixtures.find(f => f.id === targetId);
        if (nextRoundFixture) {
          const isHomeSlot = parseInt(mStr, 10) % 2 === 0;
          if (isHomeSlot) {
            nextRoundFixture.homeClubId = winnerId;
          } else {
            nextRoundFixture.awayClubId = winnerId;
          }
        }
      }

      if (!nextRoundFixture) {
        nextRoundFixture = fixtures.find(f => 
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
      }

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
  }

  // 5. Board Confidence, Fan Approval, and Sacking Evaluation for User Matches (with Match Deduplication)
  let boardConfidence = state.boardConfidence;
  let fanApproval = state.fanApproval;
  let consecutiveLosses = state.consecutiveLosses;
  let consecutiveWinless = state.consecutiveWinless || 0;
  let isSacked = state.isSacked;
  let managerStats = { ...state.manager };
  let auditLog = [...(state.boardConfidenceAuditLog || [])];
  let processedMatchIds = [...(state.processedBoardConfidenceMatchIds || [])];
  let boardConfidenceStage = state.boardConfidenceStage || getBoardConfidenceStage(state.boardConfidence, state.isSacked);

  const isUserMatch = Boolean(finalFixture.isUserMatch || (state.userClubId && (finalFixture.homeClubId === state.userClubId || finalFixture.awayClubId === state.userClubId)));

  if (isUserMatch && finalFixture.homeScore !== undefined && finalFixture.awayScore !== undefined) {
    const isUserHome = finalFixture.homeClubId === state.userClubId;
    const userScore = isUserHome ? finalFixture.homeScore : finalFixture.awayScore;
    const oppScore = isUserHome ? finalFixture.awayScore : finalFixture.homeScore;

    const alreadyEvaluated = processedMatchIds.includes(finalFixture.id);
    if (!alreadyEvaluated) {
      const evalResult = evaluateMatchBoardConfidence(state, finalFixture, userScore, oppScore);
      boardConfidence = evalResult.newConfidence;
      fanApproval = evalResult.newFanApproval;
      consecutiveLosses = evalResult.newConsecutiveLosses;
      consecutiveWinless = evalResult.newConsecutiveWinless;
      boardConfidenceStage = evalResult.stage;

      if (evalResult.auditEntry) {
        auditLog.unshift(evalResult.auditEntry);
        if (auditLog.length > 50) auditLog.pop();
      }
      processedMatchIds.push(finalFixture.id);

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
  }

  const baseResultState: GameWorldState = {
    ...state,
    fixtures,
    standings,
    players,
    news: updatedNews,
    clubTitlesHistory,
    boardConfidence,
    fanApproval,
    consecutiveLosses,
    consecutiveWinless,
    boardConfidenceStage,
    boardConfidenceAuditLog: auditLog,
    processedBoardConfidenceMatchIds: processedMatchIds,
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
  const recoveryNewsList: NewsItem[] = [];
  const retirementNewsList: NewsItem[] = [];
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
    // Dynamic age calculation based on birthDate and current in-game date (Requirement 5)
    if (p.birthDate) {
      p.age = calculateAge(p.birthDate, nextDate);
    }

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
      const reachedReturnDate = (p.injuryReturnDate && nextDate >= p.injuryReturnDate) || (p.injury?.returnDate && nextDate >= p.injury.returnDate);
      const zeroDaysLeft = p.injuryDaysRemaining === 0 || (p.injury?.recoveryDays === 0 && !p.injuryReturnDate);

      if (reachedReturnDate || zeroDaysLeft) {
        p.injuryStatus = 'HEALTHY';
        p.injury = { isInjured: false, recoveryDays: 0 };
        p.injuryReturnDate = undefined;
        p.injuryStartDate = undefined;
        p.injuryType = undefined;
        p.injuryDaysRemaining = 0;
        if (p.squadStatus === 'OUT_OF_SQUAD') {
          p.squadStatus = 'RESERVE';
        }

        if (p.clubId === state.userClubId && !autoSimulateUserMatch) {
          stoppedReason = `【戦列復帰】主力選手の${p.name}が怪我から全体練習に完全合流しました！`;
        }
        recoveryNewsList.push({
          id: `news_rec_${Date.now()}_${p.id}`,
          date: nextDate,
          headline: `【戦列復帰】${p.name}が怪我から復帰`,
          body: `${p.name}が怪我から順調に回復し、全体練習に完全合流しました。次節以降の公式戦への出場が可能となります。`,
          category: 'injury',
          relatedClubId: p.clubId,
          relatedPlayerId: p.id,
          importance: p.clubId === state.userClubId ? 'high' : 'medium'
        });
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

    // Requirements 8, 9, 10: 全選手の適切な成長・POT予測値化・高齢衰退・引退表明
    const diffSettings = state.difficultySettings || DEFAULT_DIFFICULTY_SETTINGS;
    const growthRateMod = diffSettings.playerGrowthRate === 'slow' ? 0.01 : diffSettings.playerGrowthRate === 'fast' ? 0.045 : 0.02;

    // A. Growth Processing (All players, especially active starters)
    if (p.age <= 28) {
      const isStarter = p.squadStatus === 'STARTING' || (p.stats && p.stats.starts >= 5);
      const starterBoost = isStarter ? 1.5 : 0.8;
      // POT is an estimate, not a strict ceiling (Requirement 10: POTを超えて成長する選手も存在)
      const canExceedPot = Math.random() < 0.15; // 15% chance to break through POT ceiling
      const ceiling = canExceedPot ? Math.min(99, p.potential + 4) : p.potential;

      if (p.ovr < ceiling && Math.random() < (growthRateMod * starterBoost)) {
        p.ovr += 1;
        p.exactOvr = (p.exactOvr || p.ovr) + 1;
        p.pace = Math.min(99, p.pace + (Math.random() < 0.5 ? 1 : 0));
        p.passing = Math.min(99, p.passing + (Math.random() < 0.5 ? 1 : 0));
        p.shooting = Math.min(99, p.shooting + (Math.random() < 0.5 ? 1 : 0));
        p.dribbling = Math.min(99, p.dribbling + (Math.random() < 0.5 ? 1 : 0));
        p.defending = Math.min(99, p.defending + (Math.random() < 0.5 ? 1 : 0));
        p.physical = Math.min(99, p.physical + (Math.random() < 0.5 ? 1 : 0));
      }
    } else if (p.age >= 34) {
      // B. Aging Decline for 34+ players (Requirement 8)
      // Gradual and realistic decline; active starters decline slower
      const isStarter = p.squadStatus === 'STARTING' || (p.stats && p.stats.starts >= 10);
      const declineChance = (p.age >= 37 ? 0.03 : 0.012) * (isStarter ? 0.6 : 1.2);
      if (Math.random() < declineChance && p.ovr > 58) {
        p.ovr = Math.max(55, p.ovr - 1);
        p.exactOvr = Math.max(55, (p.exactOvr || p.ovr) - 1);
        p.pace = Math.max(40, p.pace - 1);
        p.physical = Math.max(45, p.physical - 1);
      }

      // C. Retirement Announcement (Requirement 8: 30代後半〜40代の引退表明)
      if (p.age >= 35 && !p.retirementAnnounced && !p.isRetired) {
        // Chance of announcing retirement between December and April
        const currentMonth = parseInt(nextDate.split('-')[1], 10);
        if ([12, 1, 2, 3, 4].includes(currentMonth) && Math.random() < (p.age >= 38 ? 0.05 : 0.015)) {
          p.retirementAnnounced = true;
          const seasonEndYear = parseInt(state.season?.split('/')[0], 10) + 1 || 2027;
          p.retirementDate = `${seasonEndYear}-06-30`;
          p.retirementReason = p.age >= 38 ? '年齢による体力の限界とキャリアの節目' : '新世代へのバトンタッチと指導者への転身';

          const retNews: NewsItem = {
            id: `news_ret_ann_${Date.now()}_${p.id}`,
            date: nextDate,
            headline: `【現役引退表明】${p.name}（${p.age}歳）、今シーズン限りでの現役引退を発表`,
            body: `長年にわたりフットボール界を牽引してきた名手${p.name}が記者会見を開き、今季終了（${p.retirementDate}）をもってプロ現役生活に終止符を打つことを正式表明しました。「最後までクラブのために全力を尽くす」と語り、サポーターから温かい拍手が送られました。`,
            category: 'press',
            relatedClubId: p.clubId,
            relatedPlayerId: p.id,
            importance: p.clubId === state.userClubId ? 'high' : 'medium'
          };
          retirementNewsList.push(retNews);
        }
      }
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
  if (recoveryNewsList.length > 0) {
    state.news = [...recoveryNewsList, ...state.news];
  }
  if (retirementNewsList.length > 0) {
    state.news = [...retirementNewsList, ...state.news];
  }
  if (loanReturnNews.length > 0) {
    state.news = [...loanReturnNews, ...state.news];
  }
  if (injuryNews) {
    state.news = [injuryNews, ...state.news];
  }

  // Autonomous AI Transfers
  state = simulateAITransfers(state);

  // Process Pending Transfers (Requirement 10)
  const pendingTransfers = state.pendingTransfers || [];
  const remainingPending: PendingTransfer[] = [];
  const pendingExecutedNews: NewsItem[] = [];

  pendingTransfers.forEach(t => {
    if (nextDate >= t.joinDate) {
      const p = state.players[t.playerId];
      const buyer = state.clubs[t.buyerClubId];
      const seller = state.clubs[t.sellerClubId];
      if (p && buyer) {
        if (seller) {
          seller.playerIds = seller.playerIds.filter(id => id !== p.id);
        }
        if (!buyer.playerIds.includes(p.id)) {
          buyer.playerIds.push(p.id);
        }
        p.clubId = buyer.id;
        p.currentClubId = buyer.id;
        p.contractYears = t.contractYears;
        p.wage = t.wage;
        p.squadStatus = 'RESERVE';
        p.isTransferListed = false;

        pendingExecutedNews.push({
          id: `news_pending_exec_${Date.now()}_${p.id}`,
          date: nextDate,
          headline: `【正式加入】内定の${p.name}が${buyer.name}へ合流！`,
          body: `事前合意に基づき、${p.name}が本日付で${buyer.name}へ正式加入しました。早速トップチームの練習に合流しています。`,
          category: 'transfer',
          relatedClubId: buyer.id,
          relatedPlayerId: p.id,
          importance: 'high'
        });
      }
    } else {
      remainingPending.push(t);
    }
  });
  state.pendingTransfers = remainingPending;
  if (pendingExecutedNews.length > 0) {
    state.news = [...pendingExecutedNews, ...state.news];
  }

  // Ballon d'Or November Event Check (Nominees in early Nov, Winner in late Nov)
  const bdorResult = checkAndAdvanceBallonDor(state, nextDate);
  if (bdorResult.newsItem) {
    state.news = [bdorResult.newsItem, ...state.news];
  }
  if (bdorResult.updatedState && Object.keys(bdorResult.updatedState).length > 0) {
    state = { ...state, ...bdorResult.updatedState };
  }

  // Update tournament competition statuses based on date (Requirement 4)
  if (state.tournaments) {
    const updatedTournaments = { ...state.tournaments };
    let tournamentUpdated = false;
    Object.values(updatedTournaments).forEach(t => {
      if (t.status === 'not_started' && nextDate >= t.startDate) {
        t.status = 'in_progress';
        tournamentUpdated = true;
      }
    });
    if (tournamentUpdated) {
      state.tournaments = updatedTournaments;
    }
  }

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
      
      // Type 2 High School player conflict check
      let type2Notice = '';
      if (state.userClubId) {
        const userClubPlayers = Object.values(state.players).filter(p => p.clubId === state.userClubId);
        const unavailableType2 = userClubPlayers.filter(p => p.isType2Registered && isType2PlayerUnavailableOnDate(p, nextDate));
        if (unavailableType2.length > 0) {
          type2Notice = ` (⚠️ 2種登録: ${unavailableType2.map(p => p.name).join('、')}選手は高校公式戦のため出場不可)`;
        }
      }

      return {
        updatedState: state,
        stoppedReason: `【MATCH DAY】本日 ${state.clubs[oppClubId]?.shortName || state.clubs[oppClubId]?.name || '対戦相手'} 戦が予定されています！${type2Notice}`,
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
    const euroQual = calculateEuropeanQualifications(state);
    state.news = [promRel.news, ...euroQual.news, ...state.news];
    if (!autoSimulateUserMatch) {
      stoppedReason = `【${state.season}新シーズン開幕】昇降格および欧州大会出場枠が確定し、新シーズンのプレシーズンツアーが開幕しました！`;
    }
  }

  // Transfer window deadline day check
  if ((nextDate.endsWith('-08-31') || nextDate.endsWith('-01-31')) && !autoSimulateUserMatch) {
    state.showDeadlineSummary = true;
    stoppedReason = '【移籍市場最終日】夏の移籍ウィンドウのデッドラインデイを迎えました！';
  }

  // Unexpected Events System (Requirement 10: 「予期せぬ出来事」)
  if (!state.activeUnexpectedEvent) {
    const dailyEvent = evaluateDailyUnexpectedEvent(state);
    if (dailyEvent) {
      state.activeUnexpectedEvent = dailyEvent;
      if (!autoSimulateUserMatch && !stoppedReason) {
        stoppedReason = `【予期せぬ出来事】${dailyEvent.title}`;
      }
    }
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

  const currentYear = parseInt(state.season.split('/')[0], 10) || 2026;
  const playoffFixtures: MatchFixture[] = [];

  // Helper function to simulate a playoff match with realistic score and events
  const simulatePlayoffMatch = (
    homeClubId: string,
    awayClubId: string,
    competition: string,
    competitionName: string,
    round: string,
    date: string,
    neutralVenue?: string
  ): { fixture: MatchFixture; winnerId: string } => {
    const homeClub = clubs[homeClubId];
    const awayClub = clubs[awayClubId];
    const homeRep = homeClub?.reputation || 50;
    const awayRep = awayClub?.reputation || 50;

    const homeProb = homeRep / (homeRep + awayRep);
    const roll = Math.random();
    let homeScore = 0;
    let awayScore = 0;
    let winnerId = homeClubId;
    let penaltyShootout: { homeScore: number; awayScore: number } | undefined = undefined;

    if (roll < homeProb * 0.75) {
      homeScore = Math.floor(Math.random() * 2) + 2;
      awayScore = Math.floor(Math.random() * 2);
      winnerId = homeClubId;
    } else if (roll > homeProb + (1 - homeProb) * 0.5) {
      awayScore = Math.floor(Math.random() * 2) + 2;
      homeScore = Math.floor(Math.random() * 2);
      winnerId = awayClubId;
    } else {
      homeScore = Math.random() < 0.5 ? 1 : 2;
      awayScore = homeScore;
      const homePenWins = Math.random() < 0.5;
      penaltyShootout = homePenWins ? { homeScore: 5, awayScore: 4 } : { homeScore: 3, awayScore: 4 };
      winnerId = homePenWins ? homeClubId : awayClubId;
    }

    const homePlayers = Object.values(state.players).filter(p => p.clubId === homeClubId && p.position !== 'GK');
    const awayPlayers = Object.values(state.players).filter(p => p.clubId === awayClubId && p.position !== 'GK');
    const events: MatchEvent[] = [];

    for (let g = 0; g < homeScore; g++) {
      const scorer = homePlayers[Math.floor(Math.random() * homePlayers.length)] || { id: `${homeClubId}_p${g}`, name: `${homeClub?.shortName || 'Home'}選手` };
      events.push({
        minute: 18 + g * 25 + Math.floor(Math.random() * 8),
        type: 'goal',
        clubId: homeClubId,
        playerId: scorer.id,
        playerName: scorer.name,
        description: `【プレーオフ ゴール！】${scorer.name}がペナルティエリアから劇的なシュートを沈めてゴール！`
      });
    }

    for (let g = 0; g < awayScore; g++) {
      const scorer = awayPlayers[Math.floor(Math.random() * awayPlayers.length)] || { id: `${awayClubId}_p${g}`, name: `${awayClub?.shortName || 'Away'}選手` };
      events.push({
        minute: 22 + g * 28 + Math.floor(Math.random() * 8),
        type: 'goal',
        clubId: awayClubId,
        playerId: scorer.id,
        playerName: scorer.name,
        description: `【プレーオフ ゴール！】${scorer.name}が鮮やかなカウンターからネットを揺らした！`
      });
    }

    const fixture: MatchFixture = {
      id: `playoff_${competition}_${homeClubId}_${awayClubId}_${date}_${Math.floor(Math.random() * 10000)}`,
      date,
      competition,
      competitionName,
      round,
      homeClubId,
      awayClubId,
      status: 'finished',
      homeScore,
      awayScore,
      penaltyShootout,
      events,
      isUserMatch: state.userClubId === homeClubId || state.userClubId === awayClubId,
      isResultApplied: true
    };

    return { fixture, winnerId };
  };

  // 1. ENGLAND: Premier League (20) ⇄ Championship (24)
  // Promotion: 1st, 2nd auto promoted. 3rd-8th (6 clubs) enter promotion playoffs (QFs, SFs, Final at Wembley)
  const plRows = getStandings('premier-league');
  const plRelegated = plRows.length >= 20 ? plRows.slice(-3).map(r => r.clubId) : (plRows.length >= 3 ? plRows.slice(-3).map(r => r.clubId) : []);
  const champRows = getStandings('championship');
  const champDirectPromoted = champRows.length >= 2 ? champRows.slice(0, 2).map(r => r.clubId) : [];
  
  let champPlayoffWinner = '';
  if (champRows.length >= 8) {
    const seed3 = champRows[2].clubId;
    const seed4 = champRows[3].clubId;
    const seed5 = champRows[4].clubId;
    const seed6 = champRows[5].clubId;
    const seed7 = champRows[6].clubId;
    const seed8 = champRows[7].clubId;

    // Quarter-Finals: 5th vs 8th, 6th vs 7th
    const qf1 = simulatePlayoffMatch(seed5, seed8, 'championship-playoffs', 'EFL Championship 昇格プレーオフ 準々決勝', '準々決勝', `${currentYear}-05-12`);
    const qf2 = simulatePlayoffMatch(seed6, seed7, 'championship-playoffs', 'EFL Championship 昇格プレーオフ 準々決勝', '準々決勝', `${currentYear}-05-13`);
    playoffFixtures.push(qf1.fixture, qf2.fixture);

    // Semi-Finals: 3rd vs QF2 winner, 4th vs QF1 winner
    const sf1 = simulatePlayoffMatch(seed3, qf2.winnerId, 'championship-playoffs', 'EFL Championship 昇格プレーオフ 準決勝', '準決勝', `${currentYear}-05-18`);
    const sf2 = simulatePlayoffMatch(seed4, qf1.winnerId, 'championship-playoffs', 'EFL Championship 昇格プレーオフ 準決勝', '準決勝', `${currentYear}-05-19`);
    playoffFixtures.push(sf1.fixture, sf2.fixture);

    // Final at Wembley Stadium
    const finalMatch = simulatePlayoffMatch(sf1.winnerId, sf2.winnerId, 'championship-playoffs', 'EFL Championship 昇格プレーオフ 決勝 (ウェンブリー)', '決勝', `${currentYear}-05-25`, 'ウェンブリー・スタジアム');
    playoffFixtures.push(finalMatch.fixture);
    champPlayoffWinner = finalMatch.winnerId;
  } else if (champRows.length >= 4) {
    const seed3 = champRows[2].clubId;
    const seed4 = champRows[3].clubId;
    const sf = simulatePlayoffMatch(seed3, seed4, 'championship-playoffs', 'EFL Championship 昇格プレーオフ 決勝', '決勝', `${currentYear}-05-25`, 'ウェンブリー・スタジアム');
    playoffFixtures.push(sf.fixture);
    champPlayoffWinner = sf.winnerId;
  } else {
    champPlayoffWinner = champRows[2]?.clubId || '';
  }
  const champPromoted = [...champDirectPromoted, ...(champPlayoffWinner ? [champPlayoffWinner] : [])];

  // 2. SPAIN: La Liga (20) ⇄ Segunda División (22)
  const llRows = getStandings('laliga');
  const llRelegated = llRows.length >= 20 ? llRows.slice(-3).map(r => r.clubId) : (llRows.length >= 3 ? llRows.slice(-3).map(r => r.clubId) : []);
  const segRows = getStandings('segunda-division');
  const segDirectPromoted = segRows.length >= 2 ? segRows.slice(0, 2).map(r => r.clubId) : [];
  let segPlayoffWinner = '';
  if (segRows.length >= 6) {
    const s1 = simulatePlayoffMatch(segRows[2].clubId, segRows[5].clubId, 'segunda-playoffs', 'セグンダ・ディビシオン 昇格プレーオフ 準決勝', '準決勝', `${currentYear}-06-03`);
    const s2 = simulatePlayoffMatch(segRows[3].clubId, segRows[4].clubId, 'segunda-playoffs', 'セグンダ・ディビシオン 昇格プレーオフ 準決勝', '準決勝', `${currentYear}-06-04`);
    playoffFixtures.push(s1.fixture, s2.fixture);
    const fin = simulatePlayoffMatch(s1.winnerId, s2.winnerId, 'segunda-playoffs', 'セグンダ・ディビシオン 昇格プレーオフ 決勝', '決勝', `${currentYear}-06-11`);
    playoffFixtures.push(fin.fixture);
    segPlayoffWinner = fin.winnerId;
  } else {
    segPlayoffWinner = segRows.length >= 3 ? segRows[2]?.clubId : '';
  }
  const segPromoted = [...segDirectPromoted, ...(segPlayoffWinner ? [segPlayoffWinner] : [])];

  // 3. GERMANY: Bundesliga (18) ⇄ 2. Bundesliga (18)
  const blRows = getStandings('bundesliga');
  const blDirectRelegated = blRows.length >= 18 ? blRows.slice(-2).map(r => r.clubId) : (blRows.length >= 2 ? blRows.slice(-2).map(r => r.clubId) : []);
  const blPlayoffClubId = blRows.length >= 16 ? blRows[15]?.clubId : ''; // 16th place Relegation Playoff
  const bl2Rows = getStandings('2-bundesliga');
  const bl2DirectPromoted = bl2Rows.length >= 2 ? bl2Rows.slice(0, 2).map(r => r.clubId) : [];
  const bl2PlayoffClubId = bl2Rows.length >= 3 ? bl2Rows[2]?.clubId : ''; // 3rd place Promotion Playoff
  const blRelegated = [...blDirectRelegated];
  const bl2Promoted = [...bl2DirectPromoted];
  if (blPlayoffClubId && bl2PlayoffClubId) {
    const blRelegationMatch = simulatePlayoffMatch(blPlayoffClubId, bl2PlayoffClubId, 'bundesliga-relegation-playoffs', 'ブンデスリーガ 入替戦', '入替戦', `${currentYear}-05-24`);
    playoffFixtures.push(blRelegationMatch.fixture);
    if (blRelegationMatch.winnerId === bl2PlayoffClubId) {
      blRelegated.push(blPlayoffClubId);
      bl2Promoted.push(bl2PlayoffClubId);
    }
  }

  // 4. ITALY: Serie A (20) ⇄ Serie B (20)
  const saRows = getStandings('serie-a');
  const saRelegated = saRows.length >= 20 ? saRows.slice(-3).map(r => r.clubId) : (saRows.length >= 3 ? saRows.slice(-3).map(r => r.clubId) : []);
  const sbRows = getStandings('serie-b');
  const sbDirectPromoted = sbRows.length >= 2 ? sbRows.slice(0, 2).map(r => r.clubId) : [];
  let sbPlayoffWinner = '';
  if (sbRows.length >= 6) {
    const sbSf1 = simulatePlayoffMatch(sbRows[2].clubId, sbRows[5].clubId, 'serie-b-playoffs', 'セリエB 昇格プレーオフ 準決勝', '準決勝', `${currentYear}-05-22`);
    const sbSf2 = simulatePlayoffMatch(sbRows[3].clubId, sbRows[4].clubId, 'serie-b-playoffs', 'セリエB 昇格プレーオフ 準決勝', '準決勝', `${currentYear}-05-23`);
    playoffFixtures.push(sbSf1.fixture, sbSf2.fixture);
    const sbFin = simulatePlayoffMatch(sbSf1.winnerId, sbSf2.winnerId, 'serie-b-playoffs', 'セリエB 昇格プレーオフ 決勝', '決勝', `${currentYear}-05-29`);
    playoffFixtures.push(sbFin.fixture);
    sbPlayoffWinner = sbFin.winnerId;
  } else {
    sbPlayoffWinner = sbRows.length >= 3 ? sbRows[2]?.clubId : '';
  }
  const sbPromoted = [...sbDirectPromoted, ...(sbPlayoffWinner ? [sbPlayoffWinner] : [])];

  // 5. FRANCE: Ligue 1 (18) ⇄ Ligue 2 (18)
  const l1Rows = getStandings('ligue-1');
  const l1DirectRelegated = l1Rows.length >= 18 ? l1Rows.slice(-2).map(r => r.clubId) : (l1Rows.length >= 2 ? l1Rows.slice(-2).map(r => r.clubId) : []);
  const l1PlayoffClubId = l1Rows.length >= 16 ? l1Rows[15]?.clubId : ''; // 16th place Barrages
  const l2Rows = getStandings('ligue-2');
  const l2DirectPromoted = l2Rows.length >= 2 ? l2Rows.slice(0, 2).map(r => r.clubId) : [];
  const l2PlayoffClubId = l2Rows.length >= 3 ? l2Rows[2]?.clubId : ''; // 3rd place Barrages
  const l1Relegated = [...l1DirectRelegated];
  const l2Promoted = [...l2DirectPromoted];
  if (l1PlayoffClubId && l2PlayoffClubId) {
    const l1BarrageMatch = simulatePlayoffMatch(l1PlayoffClubId, l2PlayoffClubId, 'ligue-1-barrages', 'リーグ・アン 昇降格プレーオフ (バラージュ)', '入替戦', `${currentYear}-05-28`);
    playoffFixtures.push(l1BarrageMatch.fixture);
    if (l1BarrageMatch.winnerId === l2PlayoffClubId) {
      l1Relegated.push(l1PlayoffClubId);
      l2Promoted.push(l2PlayoffClubId);
    }
  }

  // 6. JAPAN: J1 League (20) ⇄ J2 League (20)
  // J1: bottom 3 relegated. J2: 1st, 2nd auto promoted. 3rd-6th enter J2 Playoff (SFs, Final)
  const j1Rows = getStandings('j1-league');
  const j1Relegated = j1Rows.length >= 20 ? j1Rows.slice(-3).map(r => r.clubId) : (j1Rows.length >= 3 ? j1Rows.slice(-3).map(r => r.clubId) : []);
  const j2Rows = getStandings('j2-league');
  const j2DirectPromoted = j2Rows.length >= 2 ? j2Rows.slice(0, 2).map(r => r.clubId) : [];
  let j2PlayoffWinner = '';
  if (j2Rows.length >= 6) {
    const j2Sf1 = simulatePlayoffMatch(j2Rows[2].clubId, j2Rows[5].clubId, 'j2-playoffs', 'J2 昇格プレーオフ 準決勝', '準決勝', `${currentYear}-12-01`);
    const j2Sf2 = simulatePlayoffMatch(j2Rows[3].clubId, j2Rows[4].clubId, 'j2-playoffs', 'J2 昇格プレーオフ 準決勝', '準決勝', `${currentYear}-12-01`);
    playoffFixtures.push(j2Sf1.fixture, j2Sf2.fixture);
    const j2Fin = simulatePlayoffMatch(j2Sf1.winnerId, j2Sf2.winnerId, 'j2-playoffs', 'J2 昇格プレーオフ 決勝', '決勝', `${currentYear}-12-07`, '国立競技場');
    playoffFixtures.push(j2Fin.fixture);
    j2PlayoffWinner = j2Fin.winnerId;
  } else {
    j2PlayoffWinner = j2Rows.length >= 3 ? j2Rows[2]?.clubId : '';
  }
  const j2Promoted = [...j2DirectPromoted, ...(j2PlayoffWinner ? [j2PlayoffWinner] : [])];

  // Store newly simulated playoff fixtures into state
  state.fixtures.push(...playoffFixtures);

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
  const nextYear = typeof targetSeasonYear === 'number'
    ? targetSeasonYear 
    : targetSeasonYear 
      ? parseInt(String(targetSeasonYear).split('/')[0], 10) || (currentYear + 1)
      : (currentYear + 1);
  const nextSeason = `${nextYear}/${String(nextYear + 1).slice(2)}`;
  const nextDate = `${nextYear}-07-01`;

  // Requirement 3: Reset current season stats while preserving past season history for every player
  const updatedPlayers: Record<string, Player> = {};
  const endingSeason = state.season;

  Object.entries(state.players).forEach(([pId, p]) => {
    const historyEntry: SeasonStatsHistory = {
      seasonId: endingSeason,
      seasonName: endingSeason,
      clubId: p.clubId,
      clubName: clubs[p.clubId]?.name || p.clubId,
      appearances: p.stats.appearances,
      starts: p.stats.starts,
      minutes: p.stats.minutes,
      goals: p.stats.goals,
      assists: p.stats.assists,
      avgRating: p.stats.avgRating,
      yellowCards: p.stats.yellowCards,
      redCards: p.stats.redCards,
      cleanSheets: p.stats.cleanSheets,
      saves: p.stats.saves || 0,
      goalsConceded: p.stats.goalsConceded || 0,
      competitionStats: p.competitionStats ? { ...p.competitionStats } : undefined,
      awards: []
    };

    updatedPlayers[pId] = {
      ...p,
      age: p.age + 1,
      seasonHistory: [...(p.seasonHistory || []), historyEntry],
      stats: {
        appearances: 0,
        starts: 0,
        minutes: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        avgRating: 0,
        saves: 0,
        goalsConceded: 0
      },
      preseasonStats: {
        appearances: 0,
        starts: 0,
        minutes: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        avgRating: 0,
        saves: 0,
        goalsConceded: 0
      },
      competitionStats: {}
    };
  });

  // Regenerate season fixtures for the next season with updated league memberships and fresh randomized pre-season
  const nextFixtures = generateSeasonFixtures(clubs, state.userClubId, nextYear, state.manager);

  // Initialize tournaments for the new season in 'not_started' state
  const updatedTournaments = initializeTournamentCompetitions(nextYear, clubs, nextDate);

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
      players: updatedPlayers,
      standings: updatedStandings,
      fixtures: [...playoffFixtures, ...nextFixtures],
      tournaments: updatedTournaments,
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
    if (!club || !club.league) return;
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

  // 2. Aggregate all finished fixtures strictly once (deduplicate by match ID, official leagues only)
  const processedFixtureIds = new Set<string>();
  const validFixtures = (fixtures || []).filter(f => {
    if (!f || !f.id || processedFixtureIds.has(f.id)) return false;
    processedFixtureIds.add(f.id);
    return f.status === 'finished' && f.homeScore !== undefined && f.awayScore !== undefined;
  });

  validFixtures.forEach(fixture => {
    const leagueKey = fixture.competition as LeagueKey;
    // Strictly isolate league standings: never process cup or friendly fixtures into league tables
    if (!STANDINGS_LEAGUES.includes(leagueKey) || !standingsMap[leagueKey]) return;

    const homeRow = standingsMap[leagueKey][fixture.homeClubId];
    const awayRow = standingsMap[leagueKey][fixture.awayClubId];
    if (!homeRow || !awayRow) return;

    const hScore = fixture.homeScore!;
    const aScore = fixture.awayScore!;

    homeRow.played += 1;
    awayRow.played += 1;
    homeRow.goalsFor += hScore;
    homeRow.goalsAgainst += aScore;
    homeRow.goalDiff += (hScore - aScore);

    awayRow.goalsFor += aScore;
    awayRow.goalsAgainst += hScore;
    awayRow.goalDiff += (aScore - hScore);

    if (hScore > aScore) {
      homeRow.won += 1;
      homeRow.points += 3;
      awayRow.lost += 1;
    } else if (aScore > hScore) {
      awayRow.won += 1;
      awayRow.points += 3;
      homeRow.lost += 1;
    } else {
      homeRow.drawn += 1;
      homeRow.points += 1;
      awayRow.drawn += 1;
      awayRow.points += 1;
    }
  });

  // 3. Format, calculate recent 5 form (newest on left), and sort each league table
  const result: Record<LeagueKey, StandingsRow[]> = {} as any;
  for (const [leagueKey, clubsMap] of Object.entries(standingsMap)) {
    const rows = Object.values(clubsMap);

    // Populate recent 5 form for each club based on chronological league matches
    rows.forEach(r => {
      r.form = getRecentLeagueForm(r.clubId, leagueKey as LeagueKey, validFixtures);
    });

    // Points DESC -> GoalDiff DESC -> GoalsFor DESC -> Won DESC -> Alphabetical
    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      if (b.won !== a.won) return b.won - a.won;
      return a.clubName.localeCompare(b.clubName);
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

/**
 * Requirement 3: Calculate UEFA European Competition (UCL, UEL, UECL) qualifications
 * for all 5 top European leagues with domestic cup winner integration and rollovers.
 * STRICTLY NO ACL.
 */
export function calculateEuropeanQualifications(state: GameWorldState): {
  uclClubs: string[];
  uelClubs: string[];
  ueclClubs: string[];
  news: NewsItem[];
} {
  const standings = state.standings;
  const clubs = state.clubs;
  const tournaments: Record<string, any> = (state.tournaments as any) || {};

  const uclSet = new Set<string>();
  const uelSet = new Set<string>();
  const ueclSet = new Set<string>();

  const getStandings = (k: LeagueKey) => standings[k] || [];

  // 1. Premier League (Top 4 UCL, 5th UEL, FA Cup winner UEL, Carabao Cup winner UECL)
  const pl = getStandings('premier-league');
  const faCupChamp = tournaments['fa-cup']?.championClubId;
  const carabaoChamp = tournaments['carabao-cup']?.championClubId;

  pl.slice(0, 4).forEach(r => uclSet.add(r.clubId));
  if (faCupChamp && !uclSet.has(faCupChamp)) {
    uelSet.add(faCupChamp);
  }
  if (pl[4] && !uclSet.has(pl[4].clubId)) uelSet.add(pl[4].clubId);
  if (uelSet.size < 2 && pl[5] && !uclSet.has(pl[5].clubId)) uelSet.add(pl[5].clubId);

  if (carabaoChamp && !uclSet.has(carabaoChamp) && !uelSet.has(carabaoChamp)) {
    ueclSet.add(carabaoChamp);
  } else {
    const nextForEcl = pl.find(r => !uclSet.has(r.clubId) && !uelSet.has(r.clubId));
    if (nextForEcl) ueclSet.add(nextForEcl.clubId);
  }

  // 2. La Liga (Top 4 UCL, 5th UEL, Copa del Rey UEL, 6th UECL)
  const ll = getStandings('laliga');
  const copaChamp = tournaments['copa-del-rey']?.championClubId;
  ll.slice(0, 4).forEach(r => uclSet.add(r.clubId));
  if (copaChamp && !uclSet.has(copaChamp)) uelSet.add(copaChamp);
  if (ll[4] && !uclSet.has(ll[4].clubId)) uelSet.add(ll[4].clubId);
  if (uelSet.size < 2 && ll[5] && !uclSet.has(ll[5].clubId)) uelSet.add(ll[5].clubId);
  const nextForEclLL = ll.find(r => !uclSet.has(r.clubId) && !uelSet.has(r.clubId));
  if (nextForEclLL) ueclSet.add(nextForEclLL.clubId);

  // 3. Serie A (Top 4 UCL, 5th UEL, Coppa Italia UEL, 6th UECL)
  const sa = getStandings('serie-a');
  const coppaChamp = tournaments['coppa-italia']?.championClubId;
  sa.slice(0, 4).forEach(r => uclSet.add(r.clubId));
  if (coppaChamp && !uclSet.has(coppaChamp)) uelSet.add(coppaChamp);
  if (sa[4] && !uclSet.has(sa[4].clubId)) uelSet.add(sa[4].clubId);
  if (uelSet.size < 2 && sa[5] && !uclSet.has(sa[5].clubId)) uelSet.add(sa[5].clubId);
  const nextForEclSA = sa.find(r => !uclSet.has(r.clubId) && !uelSet.has(r.clubId));
  if (nextForEclSA) ueclSet.add(nextForEclSA.clubId);

  // 4. Bundesliga (Top 4 UCL, 5th UEL, DFB-Pokal UEL, 6th UECL)
  const bl = getStandings('bundesliga');
  const dfbChamp = tournaments['dfb-pokal']?.championClubId;
  bl.slice(0, 4).forEach(r => uclSet.add(r.clubId));
  if (dfbChamp && !uclSet.has(dfbChamp)) uelSet.add(dfbChamp);
  if (bl[4] && !uclSet.has(bl[4].clubId)) uelSet.add(bl[4].clubId);
  if (uelSet.size < 2 && bl[5] && !uclSet.has(bl[5].clubId)) uelSet.add(bl[5].clubId);
  const nextForEclBL = bl.find(r => !uclSet.has(r.clubId) && !uelSet.has(r.clubId));
  if (nextForEclBL) ueclSet.add(nextForEclBL.clubId);

  // 5. Ligue 1 (Top 3 UCL, 4th UEL, Coupe de France UEL, 5th/6th UECL)
  const l1 = getStandings('ligue-1');
  const coupeChamp = tournaments['coupe-de-france']?.championClubId;
  l1.slice(0, 3).forEach(r => uclSet.add(r.clubId));
  if (coupeChamp && !uclSet.has(coupeChamp)) uelSet.add(coupeChamp);
  if (l1[3] && !uclSet.has(l1[3].clubId)) uelSet.add(l1[3].clubId);
  if (uelSet.size < 2 && l1[4] && !uclSet.has(l1[4].clubId)) uelSet.add(l1[4].clubId);
  const nextForEclL1 = l1.find(r => !uclSet.has(r.clubId) && !uelSet.has(r.clubId));
  if (nextForEclL1) ueclSet.add(nextForEclL1.clubId);

  const uclClubs = Array.from(uclSet);
  const uelClubs = Array.from(uelSet);
  const ueclClubs = Array.from(ueclSet);

  const news: NewsItem[] = [];

  // Generate User Club European news
  if (state.userClubId) {
    const userClub = clubs[state.userClubId];
    if (uclSet.has(state.userClubId)) {
      news.push({
        id: `news_euro_ucl_${Date.now()}`,
        date: state.currentDate,
        headline: `【CL出場決定！】${userClub?.name}、来季UEFAチャンピオンズリーグ本戦への出場権を獲得！`,
        body: `激闘のリーグ戦の末、${userClub?.name}が見事にトップ4（CL出場圏内）でフィニッシュ！世界最高峰の舞台「UEFAチャンピオンズリーグ」の出場権を掴み取りました。`,
        category: 'tournament',
        relatedClubId: state.userClubId,
        importance: 'high'
      });
    } else if (uelSet.has(state.userClubId)) {
      news.push({
        id: `news_euro_uel_${Date.now()}`,
        date: state.currentDate,
        headline: `【EL出場決定！】${userClub?.name}、来季UEFAヨーロッパリーグ出場権を獲得！`,
        body: `${userClub?.name}が激しい欧州カップ出場争いを制し、来季のUEFAヨーロッパリーグ（UEL）本戦出場を決めました！`,
        category: 'tournament',
        relatedClubId: state.userClubId,
        importance: 'high'
      });
    } else if (ueclSet.has(state.userClubId)) {
      news.push({
        id: `news_euro_uecl_${Date.now()}`,
        date: state.currentDate,
        headline: `【ECL出場決定！】${userClub?.name}、来季UEFAカンファレンスリーグ出場権を獲得！`,
        body: `${userClub?.name}が粘り強い戦いでリーグ上位に踏みとどまり、UEFAカンファレンスリーグ（UECL）への切符を手に入れました！`,
        category: 'tournament',
        relatedClubId: state.userClubId,
        importance: 'high'
      });
    }
  }
  // Also generate representative news for UEL and UECL qualification
  const repUelClubId = uelClubs[0];
  if (repUelClubId && repUelClubId !== state.userClubId) {
    const club = clubs[repUelClubId];
    news.push({
      id: `news_euro_uel_rep_${Date.now()}`,
      date: state.currentDate,
      headline: `【EL出場決定！】${club?.name}、来季UEFAヨーロッパリーグ出場権獲得`,
      body: `${club?.name}が激戦の欧州カップ出場枠争いを制し、来季UELへの出場を確定させました。`,
      category: 'tournament',
      relatedClubId: repUelClubId,
      importance: 'medium'
    });
  }

  const repUeclClubId = ueclClubs[0];
  if (repUeclClubId && repUeclClubId !== state.userClubId) {
    const club = clubs[repUeclClubId];
    news.push({
      id: `news_euro_uecl_rep_${Date.now()}`,
      date: state.currentDate,
      headline: `【ECL出場決定！】${club?.name}、来季カンファレンスリーグ出場権獲得`,
      body: `${club?.name}が来季UEFAカンファレンスリーグ本戦への切符を手中に収めました。`,
      category: 'tournament',
      relatedClubId: repUeclClubId,
      importance: 'medium'
    });
  }

  // General European Qualifications Overview
  news.push({
    id: `news_euro_overview_${Date.now()}`,
    date: state.currentDate,
    headline: '【UEFA公式発表】来季欧州カップ戦（UCL・EL・ECL）全出場クラブ確定！',
    body: `欧州5大リーグおよび各国国内カップ戦の結果を受け、来季のUEFA主催3大大会（CL・EL・ECL）への出場枠が正式に確定しました。CLには欧州王者を争う全36チーム、ELおよびECLにも各国の強豪クラブが集結します。`,
    category: 'tournament',
    importance: 'high'
  });

  return { uclClubs, uelClubs, ueclClubs, news };
}

// Requirement 1 & 9: Dynamic accurate age calculation from birth date
export const calculatePlayerAgeFromBirthDate = calculateAge;

// Requirement 10: Official league recent 5 form helper
export function getRecentLeagueForm(clubId: string, league: LeagueKey, fixtures: MatchFixture[] = []): ('W' | 'D' | 'L')[] {
  const finishedLeagueFixtures = (fixtures || [])
    .filter(f => f.competition === league && f.status === 'finished' && (f.homeClubId === clubId || f.awayClubId === clubId))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return finishedLeagueFixtures.slice(0, 5).map(f => {
    const isHome = f.homeClubId === clubId;
    const myScore = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
    const oppScore = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
    if (myScore > oppScore) return 'W';
    if (myScore === oppScore) return 'D';
    return 'L';
  });
}

// Requirement 17: Transfer Deadline Day 1h / 2h Hourly Ticking
export function advanceDeadlineHours(
  currentState: GameWorldState,
  hours: 1 | 2 = 1
): { updatedState: GameWorldState; isFinished: boolean } {
  let state = { ...currentState };
  const currentHour = state.deadlineCurrentHour || 9;
  const nextHour = Math.min(24, currentHour + hours);
  const remainingHours = Math.max(0, 24 - nextHour);

  state.deadlineCurrentHour = nextHour;
  state.deadlineHoursRemaining = remainingHours;

  // Accelerate transfer bids during deadline countdown
  state = simulateAITransfers(state);
  if (remainingHours <= 6) {
    state = simulateAITransfers(state);
  }

  const news: NewsItem[] = [...state.news];
  if (remainingHours > 0) {
    news.unshift({
      id: `news_deadline_${Date.now()}_${nextHour}`,
      date: state.currentDate,
      headline: `【デッドラインデイ】移籍市場閉幕まで残り${remainingHours}時間！`,
      body: `時計は${nextHour}:00を回りました。各クラブの強化責任者が駆け込みオファーと最終交渉に奔走しています！`,
      category: 'transfer',
      importance: 'high'
    });
  } else {
    // Window closed
    state.isTransferWindowOpen = false;
    state.transferWindowClosingDays = 0;
    news.unshift({
      id: `news_deadline_close_${Date.now()}`,
      date: state.currentDate,
      headline: '【移籍市場閉幕】白熱のデッドラインデイが終了！全移籍ウィンドウがクローズ',
      body: '移籍市場の締め切り時刻を迎え、選手登録手続きが終了しました。各クラブの陣容が確定し、後半戦への戦いが本格化します。',
      category: 'transfer',
      importance: 'high'
    });
  }
  state.news = news.slice(0, 100);

  return {
    updatedState: state,
    isFinished: remainingHours <= 0
  };
}

// Requirement 18: Multi-club AI Youth Academy Regens
export function generateAIClubsYouthPromotions(currentState: GameWorldState): GameWorldState {
  const state = { ...currentState };
  const players = { ...state.players };
  const clubs = { ...state.clubs };
  const news = [...state.news];

  const positions: ('GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST' | 'CF')[] = [
    'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'
  ];
  const firstNames = ['Lucas', 'Mateo', 'Enzo', 'Liam', 'Noah', 'Leo', 'Max', 'Kai', 'Alex', 'Theo', 'Ken', 'Ren', 'Haruto', 'Sota', 'Yuto', 'Gabriel', 'Julian', 'Felix', 'Arthur', 'Oliver'];
  const lastNames = ['Silva', 'Santos', 'Garcia', 'Fernandez', 'Muller', 'Schmidt', 'Dubois', 'Laurent', 'Rossi', 'Bianchi', 'Tanaka', 'Sato', 'Suzuki', 'Smith', 'Jones', 'Davies', 'Moreno', 'Alvarez', 'Costa', 'Pereira'];

  Object.values(clubs).forEach(club => {
    // 1-2 youth players per club
    const count = 1 + (Math.random() < 0.4 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const pos = positions[Math.floor(Math.random() * positions.length)];
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${fName} ${lName}`;
      const regenId = `regen_${club.id}_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`;

      const youthFac = club.youthFacility || 3;
      const baseOvr = 60 + Math.floor(youthFac * 1.5) + Math.floor(Math.random() * 6);
      const potBonus = Math.floor(youthFac * 2) + Math.floor(Math.random() * 10);
      const potential = Math.min(93, baseOvr + 12 + potBonus);
      const age = 16 + Math.floor(Math.random() * 3);

      const isGK = pos === 'GK';
      const regenPlayer: Player = {
        id: regenId,
        name,
        age,
        birthDate: `${2026 - age}-03-15`,
        nationality: club.country === 'jp' ? '日本' : (club.country === 'es' ? 'スペイン' : (club.country === 'de' ? 'ドイツ' : (club.country === 'it' ? 'イタリア' : (club.country === 'fr' ? 'フランス' : 'イングランド')))),
        position: pos,
        altPositions: [],
        preferredFoot: Math.random() < 0.75 ? '右' : '左',
        ovr: baseOvr,
        initialOvr: baseOvr,
        exactOvr: baseOvr,
        ovrGrowthProgress: 0,
        potential,
        pace: isGK ? 50 : 65 + Math.floor(Math.random() * 15),
        shooting: isGK ? 30 : 60 + Math.floor(Math.random() * 15),
        passing: 60 + Math.floor(Math.random() * 15),
        dribbling: isGK ? 40 : 62 + Math.floor(Math.random() * 15),
        defending: isGK ? 40 : (['CB', 'LB', 'RB', 'CDM'].includes(pos) ? 68 + Math.floor(Math.random() * 10) : 50),
        physical: 62 + Math.floor(Math.random() * 12),
        gk: isGK ? baseOvr : 20,
        marketValue: Math.round(baseOvr * 30000 * (potential / 70)),
        wage: 1500 + Math.floor(Math.random() * 2000),
        contractYears: 3,
        clubId: club.id,
        currentClubId: club.id,
        squadRole: '若手・育成枠',
        playstyle: 'バランス型',
        personality: '努力家',
        managerTrust: 70,
        relationships: [],
        injury: { isInjured: false, recoveryDays: 0 },
        suspension: { isSuspended: false, matchesRemaining: 0 },
        isLoaned: false,
        fatigue: 0,
        condition: 'yellow',
        squadStatus: 'RESERVE',
        shirtNumber: 30 + Math.floor(Math.random() * 69),
        stats: { appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 0, saves: 0, goalsConceded: 0 },
        isYouthRegen: true,
        isType2: false
      };

      players[regenId] = regenPlayer;
      if (!club.playerIds.includes(regenId)) {
        club.playerIds = [...club.playerIds, regenId];
      }
    }
  });

  state.players = players;
  state.clubs = clubs;
  news.unshift({
    id: `news_youth_grad_${Date.now()}`,
    date: state.currentDate,
    headline: '【アカデミー昇格】各クラブのアカデミーから将来有望なユース選手がトップ昇格！',
    body: '各クラブの育成組織から選抜された新星若手選手たちがトップチーム昇格を果たしました。次世代のスター候補たちの成長に注目です。',
    category: 'youth',
    importance: 'medium'
  });
  state.news = news.slice(0, 100);

  return state;
}

