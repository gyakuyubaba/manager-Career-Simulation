/**
 * Realistic Board Confidence & Sacking Engine (理事会信頼度・解任システム)
 * 
 * Rules:
 * 1. Expectation vs Reality differential:
 *    - European 1st/2nd heavyweights losing to minnows/J-League clubs face steep confidence drops (-14% to -22% in official matches).
 *    - Pre-season friendly losses have lighter penalties (-4% to -8%), but repeated failures accumulate.
 *    - Expected wins against minnows grant minimal or zero boost (0 to +1%), preventing endless inflation.
 *    - Upset wins against heavyweights grant large boosts (+6% to +10%).
 * 2. Winless streak tracking:
 *    - Draws & losses increment winless streak. Wins reset it.
 *    - 5 matches winless: clear drop (-8%).
 *    - 6 matches winless: severe drop (-12%).
 *    - 7+ matches winless: compounding crisis (-15%+).
 * 3. Realistic sacking:
 *    - Confidence <20% dramatically raises sacking probability.
 *    - Weighted by expectations, winless streak, and club stature.
 */

import { GameWorldState, MatchFixture, Club, NewsItem } from '../types/game';

export type BoardConfidenceStage = '通常' | '警告' | '解任危機' | '解任';

export interface BoardConfidenceAuditEntry {
  date: string;
  matchId?: string;
  opponentName?: string;
  delta: number;
  newConfidence: number;
  reason: string;
  stage: BoardConfidenceStage;
}

export function getBoardConfidenceStage(confidence: number, isSacked: boolean = false): BoardConfidenceStage {
  if (isSacked) return '解任';
  if (confidence < 20) return '解任危機';
  if (confidence < 40) return '解任危機';
  if (confidence < 60) return '警告';
  return '通常';
}

export interface BoardEvaluationResult {
  delta: number;
  newConfidence: number;
  newConsecutiveLosses: number;
  newConsecutiveWinless: number;
  fanApprovalDelta: number;
  newFanApproval: number;
  sackTriggered: boolean;
  reason: string;
  stage: BoardConfidenceStage;
  auditEntry?: BoardConfidenceAuditEntry;
  newsItem?: NewsItem;
}

export function calculateClubStature(club: Club): number {
  let score = club.reputation || 50;

  // Tier bonus
  if (club.tier === 'Elite') score += 25;
  else if (club.tier === 'Upper') score += 15;
  else if (club.tier === 'Mid') score += 5;

  // League hierarchy
  if (['premier-league', 'laliga', 'bundesliga', 'serie-a', 'ligue-1'].includes(club.league)) {
    score += 15;
  } else if (['championship', 'segunda-division', '2-bundesliga', 'serie-b', 'ligue-2'].includes(club.league)) {
    score += 5;
  } else if (club.league === 'j1-league') {
    score += 0;
  } else if (club.league === 'j2-league') {
    score -= 10;
  }

  return Math.max(20, Math.min(100, score));
}

export function evaluateMatchBoardConfidence(
  state: GameWorldState,
  fixture: MatchFixture,
  userScore: number,
  oppScore: number
): BoardEvaluationResult {
  if (!state.userClubId) {
    return {
      delta: 0,
      newConfidence: state.boardConfidence,
      newConsecutiveLosses: 0,
      newConsecutiveWinless: 0,
      fanApprovalDelta: 0,
      newFanApproval: state.fanApproval,
      sackTriggered: false,
      reason: 'No user club',
      stage: getBoardConfidenceStage(state.boardConfidence, state.isSacked)
    };
  }

  const userClub = state.clubs[state.userClubId];
  const oppClubId = fixture.homeClubId === state.userClubId ? fixture.awayClubId : fixture.homeClubId;
  const oppClub = state.clubs[oppClubId];

  if (!userClub || !oppClub) {
    return {
      delta: 0,
      newConfidence: state.boardConfidence,
      newConsecutiveLosses: state.consecutiveLosses,
      newConsecutiveWinless: state.consecutiveWinless || 0,
      fanApprovalDelta: 0,
      newFanApproval: state.fanApproval,
      sackTriggered: false,
      reason: 'Club data missing',
      stage: getBoardConfidenceStage(state.boardConfidence, state.isSacked)
    };
  }

  const isPreSeason = fixture.competition === 'pre-season';
  const isOfficial = !isPreSeason;

  const userStature = calculateClubStature(userClub);
  const oppStature = calculateClubStature(oppClub);
  const statureDiff = userStature - oppStature; // positive = user is expected to be superior

  const isEuropeanTopLeague = ['premier-league', 'laliga', 'bundesliga', 'serie-a', 'ligue-1'].includes(userClub.league);

  let delta = 0;
  let fanDelta = 0;
  let newConsecutiveLosses = state.consecutiveLosses || 0;
  let newConsecutiveWinless = state.consecutiveWinless || 0;
  let reason = '';
  let specialNews: NewsItem | undefined;

  // -------------------------------------------------------------
  // Case A: User Lost
  // -------------------------------------------------------------
  if (userScore < oppScore) {
    newConsecutiveLosses += 1;
    newConsecutiveWinless += 1;

    // Check for giant-killing upset loss (ONLY when European top league heavyweight loses to minnow/J-League)
    const isGiantKillingLoss = isEuropeanTopLeague && (
      statureDiff >= 20 || (userStature >= 75 && (oppClub.league === 'j1-league' || oppClub.league === 'j2-league'))
    );

    if (isGiantKillingLoss) {
      if (isOfficial) {
        delta = -18;
        fanDelta = -15;
        reason = `【格下に手痛い敗戦】圧倒的優位と目された${oppClub.name}戦での敗北。理事会は深い失望を表明。`;
      } else {
        delta = -6;
        fanDelta = -5;
        reason = `【プレシーズン番狂わせ敗戦】${oppClub.name}に不覚。新シーズンに向けた仕上がりに理事会から懸念の声。`;
      }
    } else if (statureDiff <= -15) {
      // Lost to a superior club (expected tough match, lighter evaluation)
      delta = isOfficial ? -2 : -1;
      fanDelta = isOfficial ? -2 : 0;
      reason = `強豪${oppClub.name}相手の善戦及ばず敗戦。理事会は戦術的善戦を評価し想定内と判断。`;
    } else {
      // Normal loss against equal rival / domestic league opponent (J1 vs J1, etc.)
      const goalDiff = oppScore - userScore;
      delta = isOfficial ? (goalDiff >= 3 ? -6 : -4) : -2;
      fanDelta = isOfficial ? -3 : -1;
      reason = `${oppClub.name}に競り負け（${userScore}-${oppScore}）。`;
    }
  } 
  // -------------------------------------------------------------
  // Case B: User Drew
  // -------------------------------------------------------------
  else if (userScore === oppScore) {
    newConsecutiveLosses = 0; // Draw resets consecutive losses
    newConsecutiveWinless += 1; // Draw still increments winless streak

    const isMinnowDraw = isEuropeanTopLeague && (
      statureDiff >= 18 || (userStature >= 75 && (oppClub.league === 'j1-league' || oppClub.league === 'j2-league'))
    );

    if (isMinnowDraw && isOfficial) {
      delta = -3;
      fanDelta = -2;
      reason = `格下${oppClub.name}相手に勝ち点2を取りこぼし。攻撃の決定力不足が指摘される。`;
    } else if (statureDiff <= -18 && isOfficial) {
      delta = +2;
      fanDelta = +2;
      reason = `強豪${oppClub.name}から貴重な勝ち点1を獲得。戦術的な規律が高く評価される。`;
    } else {
      delta = 0;
      fanDelta = 0;
      reason = `${oppClub.name}と痛み分けのドロー。`;
    }
  } 
  // -------------------------------------------------------------
  // Case C: User Won!
  // -------------------------------------------------------------
  else {
    newConsecutiveLosses = 0;
    newConsecutiveWinless = 0; // Win resets BOTH consecutive losses and winless streak!

    const isExpectedWin = isEuropeanTopLeague && (
      statureDiff >= 18 || (userStature >= 75 && (oppClub.league === 'j1-league' || oppClub.league === 'j2-league'))
    );

    if (isExpectedWin) {
      delta = isOfficial ? 1 : 0;
      fanDelta = 1;
      reason = `${oppClub.name}に順当な勝利。理事会の期待通りの結果。`;
    } else if (statureDiff <= -20) {
      delta = isOfficial ? 8 : 4;
      fanDelta = 8;
      reason = `強豪${oppClub.name}を見事撃破！戦術的勝利に理事会とサポーターから絶賛の嵐。`;
    } else {
      delta = isOfficial ? 3 : 1;
      fanDelta = 3;
      reason = `${oppClub.name}に勝利し勝ち点を積み上げる。`;
    }
  }

  // -------------------------------------------------------------
  // Consecutive Losses & Winless streak compounding penalties
  // -------------------------------------------------------------
  if (isOfficial) {
    if (newConsecutiveLosses >= 6) {
      delta -= 8;
      fanDelta -= 8;
      reason += `（6連敗の深刻な不振により特別ペナルティ）`;
    }

    if (newConsecutiveWinless >= 5) {
      if (newConsecutiveWinless === 5) {
        delta -= 8;
        fanDelta -= 8;
        specialNews = {
          id: `news_winless_5_${Date.now()}`,
          date: fixture.date || state.currentDate,
          headline: `【危機】公式戦5試合未勝利：${userClub.name}理事会、${state.manager.name}監督の求心力低下を危惧`,
          body: `公式戦5試合にわたって勝利から見放されている${userClub.name}。順位の低迷とサポーターの不満を受け、取締役会は監督の指導力について緊急の懸念を表明しました。`,
          category: 'board',
          relatedClubId: userClub.id,
          importance: 'high'
        };
      } else if (newConsecutiveWinless === 6) {
        delta -= 12;
        fanDelta -= 12;
        specialNews = {
          id: `news_winless_6_${Date.now()}`,
          date: fixture.date || state.currentDate,
          headline: `【最後通牒】泥沼の6試合未勝利：${userClub.name}フロント、${state.manager.name}監督へ次戦必勝を通告`,
          body: `6試合勝利なしという深刻な不振に陥った${userClub.name}。理事会は${state.manager.name}監督に対し、次戦での結果次第で進退を問う最後通牒を突きつけた模様です。`,
          category: 'board',
          relatedClubId: userClub.id,
          importance: 'high'
        };
      } else if (newConsecutiveWinless >= 7) {
        delta -= 15;
        fanDelta -= 15;
        specialNews = {
          id: `news_winless_7_${Date.now()}`,
          date: fixture.date || state.currentDate,
          headline: `【進退極まる】${newConsecutiveWinless}試合未勝利：${userClub.name}幹部、監督解任協議を開始`,
          body: `未勝利記録が${newConsecutiveWinless}試合に到達。スタジアムではサポーターの抗議行動が激化し、取締役会は解任に向けた具体的な条件確認に入ったと現地メディアが報じています。`,
          category: 'board',
          relatedClubId: userClub.id,
          importance: 'high'
        };
      }
    }
  }

  const newConfidence = Math.max(0, Math.min(100, state.boardConfidence + delta));
  const newFanApproval = Math.max(0, Math.min(100, state.fanApproval + fanDelta));

  // -------------------------------------------------------------
  // Sacking Risk Evaluation (4 Stages: 通常 / 警告 / 解任危機 / 解任)
  // -------------------------------------------------------------
  let sackTriggered = false;

  if (newConfidence <= 10 && newConsecutiveWinless >= 7) {
    if (Math.random() < 0.85) sackTriggered = true;
  } else if (newConfidence < 15 && newConsecutiveWinless >= 8) {
    if (Math.random() < 0.75) sackTriggered = true;
  } else if (newConfidence <= 5) {
    sackTriggered = true;
  }

  if (sackTriggered) {
    specialNews = {
      id: `news_sacked_${Date.now()}`,
      date: fixture.date || state.currentDate,
      headline: `【電撃解任】${userClub.name}、成績不振を理由に${state.manager.name}監督との契約を正式解除`,
      body: `度重なる未勝利と理事会信頼度の低下を受け、${userClub.name}取締役会は${state.manager.name}監督の解任を正式に決定しました。なお、${state.manager.name}監督の実績を高く評価する他クラブから新たな就任オファーが届いています。`,
      category: 'board',
      relatedClubId: userClub.id,
      importance: 'high'
    };
  }

  const stage = getBoardConfidenceStage(newConfidence, sackTriggered);
  const auditEntry: BoardConfidenceAuditEntry = {
    date: fixture.date || state.currentDate,
    matchId: fixture.id,
    opponentName: oppClub.name,
    delta,
    newConfidence,
    reason: `${reason} (信頼度: ${delta > 0 ? '+' : ''}${delta}% → ${newConfidence}%, 状態: ${stage})`,
    stage
  };

  return {
    delta,
    newConfidence,
    newConsecutiveLosses,
    newConsecutiveWinless,
    fanApprovalDelta: fanDelta,
    newFanApproval,
    sackTriggered,
    reason,
    stage,
    auditEntry,
    newsItem: specialNews
  };
}
