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
  const isTopClub = userClub.tier === 'Elite' || userClub.reputation >= 80;

  if (isOfficial) {
    if (newConsecutiveLosses >= 6) {
      delta -= 10;
      fanDelta -= 10;
      reason += `（連敗の深刻な不振により特別ペナルティ）`;
    }

    if (isTopClub) {
      // Stricter criteria for big clubs (Requirement 2)
      // 3 winless = sharp drop, 4 = warning, 5 = severe danger, 6 = near-certain sacking
      if (newConsecutiveWinless === 3) {
        delta -= 15;
        fanDelta -= 12;
        reason += `（ビッグクラブ3戦未勝利による信頼度大幅急落）`;
      } else if (newConsecutiveWinless === 4) {
        delta -= 18;
        fanDelta -= 15;
        specialNews = {
          id: `news_winless_warning_${Date.now()}`,
          date: fixture.date || state.currentDate,
          headline: `【警告】泥沼の4戦未勝利：${userClub.name}理事会、${state.manager.name}監督へ早期改善を要求`,
          body: `名門${userClub.name}が4戦連続で白星を逃し、順位が後退。サポーターの怒りが沸点に達する中、取締役会は監督へ公式な警告を通告しました。`,
          category: 'board',
          relatedClubId: userClub.id,
          importance: 'high'
        };
      } else if (newConsecutiveWinless === 5) {
        delta -= 22;
        fanDelta -= 20;
        specialNews = {
          id: `news_winless_crisis_${Date.now()}`,
          date: fixture.date || state.currentDate,
          headline: `【解任危機】5試合未勝利：${userClub.name}、${state.manager.name}監督の進退審議に着手`,
          body: `5戦未勝利というクラブ史上類を見ない大不振に直面する${userClub.name}。理事会は緊急会議を招集し、監督の進退協議を開始したと有力メディアが一斉に報じています。`,
          category: 'board',
          relatedClubId: userClub.id,
          importance: 'high'
        };
      } else if (newConsecutiveWinless >= 6) {
        delta -= 30;
        fanDelta -= 25;
        reason += `（6戦未勝利・解任決定レベルの危機）`;
      }
    } else {
      // Softer, realistic decay for mid/lower table clubs
      if (newConsecutiveWinless === 4) {
        delta -= 6;
        fanDelta -= 5;
      } else if (newConsecutiveWinless === 5) {
        delta -= 10;
        fanDelta -= 8;
        specialNews = {
          id: `news_winless_5_${Date.now()}`,
          date: fixture.date || state.currentDate,
          headline: `【危機】公式戦5試合未勝利：${userClub.name}理事会、${state.manager.name}監督へ奮起を促す`,
          body: `公式戦5試合にわたって勝利から見放されている${userClub.name}。残留に向けてこれ以上の勝ち点取りこぼしは許されない情勢となっています。`,
          category: 'board',
          relatedClubId: userClub.id,
          importance: 'high'
        };
      } else if (newConsecutiveWinless === 6) {
        delta -= 14;
        fanDelta -= 12;
      } else if (newConsecutiveWinless >= 7) {
        delta -= 20;
        fanDelta -= 16;
      }
    }
  }

  let calculatedConfidence = Math.max(0, Math.min(100, state.boardConfidence + delta));
  const newFanApproval = Math.max(0, Math.min(100, state.fanApproval + fanDelta));

  // HARD CONFIDENCE CAPS based on winless streak (Ensures confidence strictly matches reality)
  // Never allows 80% confidence with 10 winless
  if (isOfficial) {
    if (isTopClub) {
      if (newConsecutiveWinless >= 6) calculatedConfidence = Math.min(calculatedConfidence, 12);
      else if (newConsecutiveWinless >= 5) calculatedConfidence = Math.min(calculatedConfidence, 25);
      else if (newConsecutiveWinless >= 4) calculatedConfidence = Math.min(calculatedConfidence, 40);
      else if (newConsecutiveWinless >= 3) calculatedConfidence = Math.min(calculatedConfidence, 55);
    } else {
      if (newConsecutiveWinless >= 8) calculatedConfidence = Math.min(calculatedConfidence, 15);
      else if (newConsecutiveWinless >= 7) calculatedConfidence = Math.min(calculatedConfidence, 25);
      else if (newConsecutiveWinless >= 6) calculatedConfidence = Math.min(calculatedConfidence, 40);
      else if (newConsecutiveWinless >= 5) calculatedConfidence = Math.min(calculatedConfidence, 50);
    }
  }

  const newConfidence = calculatedConfidence;

  // -------------------------------------------------------------
  // Sacking Risk Evaluation (4 Stages: 通常 / 警告 / 解任危機 / 解任)
  // -------------------------------------------------------------
  let sackTriggered = false;

  if (isTopClub) {
    if (newConsecutiveWinless >= 6) {
      sackTriggered = true; // 6 winless at top club = instant sack
    } else if (newConsecutiveWinless >= 5 && newConfidence <= 25) {
      if (Math.random() < 0.80) sackTriggered = true;
    } else if (newConfidence <= 8) {
      sackTriggered = true;
    }
  } else {
    if (newConfidence <= 10 && newConsecutiveWinless >= 7) {
      if (Math.random() < 0.85) sackTriggered = true;
    } else if (newConfidence < 15 && newConsecutiveWinless >= 8) {
      if (Math.random() < 0.75) sackTriggered = true;
    } else if (newConfidence <= 5) {
      sackTriggered = true;
    }
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

/**
 * Requirement 11: Evaluate season objective achievement for Elite / top clubs.
 * Sacking & steep confidence drops when failing objectives (e.g. Arsenal/Real Madrid finishing 8th-10th).
 */
export function evaluateSeasonObjectivesBoardConfidence(
  state: GameWorldState
): {
  updatedState: GameWorldState;
  isSacked: boolean;
  failedObjectives: boolean;
  confidenceDelta: number;
  reason: string;
} {
  if (!state.userClubId) {
    return { updatedState: state, isSacked: false, failedObjectives: false, confidenceDelta: 0, reason: '' };
  }

  const userClub = state.clubs[state.userClubId];
  if (!userClub) {
    return { updatedState: state, isSacked: false, failedObjectives: false, confidenceDelta: 0, reason: '' };
  }

  const standings = state.standings[userClub.league] || [];
  const rankIdx = standings.findIndex(r => r.clubId === userClub.id);
  const finishRank = rankIdx !== -1 ? rankIdx + 1 : 10;

  let failedObjectives = false;
  let confidenceDelta = 0;
  let reason = '';

  // Elite clubs (Arsenal, Real Madrid, Bayern, Man City, PSG, Inter, etc.)
  if (userClub.tier === 'Elite') {
    // Objective is typically Top 4 / Champions League qualification
    if (finishRank > 4) {
      failedObjectives = true;
      if (finishRank >= 8) {
        // Severe failure (e.g. 8th to 10th or lower)
        confidenceDelta = -35;
        reason = `【重大な目標未達】名門${userClub.name}において今季リーグ${finishRank}位でフィニッシュ。CL出場権を逃し欧州カンファレンスリーグまたは大会圏外に沈む歴史的惨敗。`;
      } else {
        // 5th to 7th (EL / ECL)
        confidenceDelta = -25;
        reason = `【目標未達】${userClub.name}の至上命題であるチャンピオンズリーグ（トップ4）出場権を逃しリーグ${finishRank}位。`;
      }
    }
  } else if (userClub.tier === 'Upper') {
    if (finishRank > 7) {
      failedObjectives = true;
      confidenceDelta = -20;
      reason = `【目標未達】欧州カップ戦出場権獲得ラインを大きく下回り、リーグ${finishRank}位で終了。`;
    }
  }

  if (!failedObjectives) {
    return {
      updatedState: {
        ...state,
        consecutiveFailedObjectiveYears: 0
      },
      isSacked: false,
      failedObjectives: false,
      confidenceDelta: 0,
      reason: '目標達成'
    };
  }

  const consecutiveFailed = (state.consecutiveFailedObjectiveYears || 0) + 1;
  const newConfidence = Math.max(0, Math.min(100, state.boardConfidence + confidenceDelta));

  let isSacked = false;
  let newsTitle = '';
  let newsBody = '';

  if (consecutiveFailed >= 2 || newConfidence <= 15) {
    isSacked = true;
    newsTitle = `【電撃解任】${userClub.name}、2期連続の目標未達を受け${state.manager.name}監督を解任！`;
    newsBody = `${userClub.name}取締役会は緊急会合を開き、目標未達（リーグ${finishRank}位）および理事会信頼度の大幅低下（${newConfidence}%）を重く受け止め、${state.manager.name}監督の即時解任を正式決定しました。クラブは来季に向けた新指揮官選定に着手します。`;
  } else {
    newsTitle = `【理事会通告】${userClub.name}首脳陣、今季目標未達を受け${state.manager.name}監督へ厳重警告`;
    newsBody = `リーグ${finishRank}位という不本意な成績を受け、理事会信頼度は${confidenceDelta}%低下し${newConfidence}%へ悪化。取締役会は「来季の序盤戦で確実な結果改善が示されない場合、即座の進退判断を下す」とする最後通告を指揮官に通達しました。`;
  }

  const newsItem: NewsItem = {
    id: `news_board_obj_${Date.now()}`,
    date: state.currentDate,
    headline: newsTitle,
    body: newsBody,
    category: 'board',
    relatedClubId: userClub.id,
    importance: 'high'
  };

  const newStage: BoardConfidenceStage = getBoardConfidenceStage(newConfidence, isSacked);

  const updatedState: GameWorldState = {
    ...state,
    boardConfidence: newConfidence,
    isSacked: isSacked || state.isSacked,
    consecutiveFailedObjectiveYears: consecutiveFailed,
    objectiveWarningIssuedSeason: state.season,
    boardConfidenceStage: newStage,
    news: [newsItem, ...state.news]
  };

  return {
    updatedState,
    isSacked,
    failedObjectives: true,
    confidenceDelta,
    reason
  };
}
