/**
 * Ballon d'Or (バロンドール) Annual November Award & Predictions Engine
 * 
 * Rules:
 * - Event occurs every November:
 *   - Early November (Nov 1-10): 30 nominees announced with interim rankings & odds.
 *   - Late November (Nov 20-30): Winner announced with gala event & pink condition.
 * - Criteria:
 *   - Personal stats (Goals, Assists, Avg Rating)
 *   - Trophies & Club stature
 *   - European continental performance
 * - STRICT EXCLUSIONS:
 *   - J-League clubs and players are strictly excluded.
 *   - Only active players in European top flights are nominated.
 * - Winner receives:
 *   - Temporary "pink" condition (絶好調 +8%).
 *   - Fan approval boost (+8%).
 */

import { GameWorldState, BallonDorCandidate, NewsItem, Player } from '../types/game';

// Top world-class superstar seeds for 2026/27 Ballon d'Or evaluation
const WORLD_CLASS_CANDIDATE_IDS = [
  'kylian_mbappe',
  'vinicius_junior',
  'erling_haaland',
  'jude_bellingham',
  'rodri',
  'lamine_yamal',
  'harry_kane',
  'bukayo_saka',
  'kevin_de_bruyne',
  'mohamed_salah',
  'florian_wirtz',
  'jamal_musiala',
  'lautaro_martinez',
  'phil_foden',
  'cole_palmer',
  'martin_odegaard',
  'william_saliba',
  'federico_valverde',
  'antoine_griezmann',
  'rodrigo',
  'declan_rice',
  'alisson_becker',
  'thibaut_courtois',
  'ruben_dias',
  'rafael_leao',
  'khvicha_kvaratskhelia',
  'nico_williams',
  'robert_lewandowski',
  'eduardo_camavinga',
  'pedri'
];

/**
 * Generate 30 candidates for Ballon d'Or
 * J-League players are 100% excluded.
 */
export function generateBallonDorCandidates(state: GameWorldState): BallonDorCandidate[] {
  const eligiblePlayers: { player: Player; score: number }[] = [];

  Object.values(state.players).forEach(p => {
    // Exclude free agents, missing club, or empty
    if (!p.clubId || p.clubId === 'free_agent') return;

    const club = state.clubs[p.clubId];
    if (!club) return;

    // STRICT REQUIREMENT: Exclude J-League players (j1-league, j2-league, j3-league)
    if (['j1-league', 'j2-league', 'j3-league'].includes(club.league)) return;

    // Must be in European leagues
    if (!['premier-league', 'championship', 'laliga', 'segunda-division', 'bundesliga', '2-bundesliga', 'serie-a', 'serie-b', 'ligue-1', 'ligue-2'].includes(club.league)) {
      return;
    }

    // Evaluation formula:
    // OVR (40%) + Goals (x2.5) + Assists (x2.0) + AvgRating (x10) + Club Tier Bonus
    let score = (p.ovr * 0.45);
    const goals = p.stats?.goals || 0;
    const assists = p.stats?.assists || 0;
    const avgRating = p.stats?.avgRating && p.stats.avgRating > 0 ? p.stats.avgRating : 7.2;

    score += goals * 2.2;
    score += assists * 1.8;
    score += (avgRating - 6.0) * 12;

    // Club Stature & Trophy bonus
    if (club.tier === 'Elite') score += 12;
    else if (club.tier === 'Upper') score += 6;

    // Reputation bonus
    score += (club.reputation || 50) * 0.15;

    // Known world-class superstar boost
    const normName = p.name.toLowerCase();
    if (WORLD_CLASS_CANDIDATE_IDS.some(id => normName.includes(id.replace('_', ' ')) || p.id.includes(id))) {
      score += 15;
    }

    eligiblePlayers.push({ player: p, score });
  });

  // Sort descending by score
  eligiblePlayers.sort((a, b) => b.score - a.score);

  // Take top 30
  const top30 = eligiblePlayers.slice(0, 30);

  // Calculate win probability %
  const totalScoreExp = top30.reduce((sum, item, idx) => {
    // Exponential weighting favoring the top 5
    const weight = Math.pow(Math.max(1, item.score - 40), 2.2) * (1 / (idx * 0.15 + 1));
    return sum + weight;
  }, 0);

  let cumulativeProb = 0;
  const candidates: BallonDorCandidate[] = top30.map((item, index) => {
    const p = item.player;
    const club = state.clubs[p.clubId];
    const weight = Math.pow(Math.max(1, item.score - 40), 2.2) * (1 / (index * 0.15 + 1));
    let prob = Math.round((weight / totalScoreExp) * 100);
    
    // Top 3 guaranteed high probability
    if (index === 0) prob = Math.max(28, prob);
    else if (index === 1) prob = Math.max(20, Math.min(27, prob));
    else if (index === 2) prob = Math.max(14, Math.min(19, prob));
    else if (index < 6) prob = Math.max(5, Math.min(10, prob));
    else prob = Math.max(1, Math.min(4, prob));

    cumulativeProb += prob;

    const goals = p.stats?.goals || 0;
    const assists = p.stats?.assists || 0;
    const rating = p.stats?.avgRating && p.stats.avgRating > 0 ? p.stats.avgRating.toFixed(2) : '7.85';

    let summary = '';
    if (index === 0) {
      summary = `欧州最高峰の決定力と圧倒的な試合支配力。大本命として受賞最有力視。`;
    } else if (index < 3) {
      summary = `ビッグマッチでの決定的な活躍と年間高レーティングを維持。受賞争いの急先鋒。`;
    } else if (index < 10) {
      summary = `クラブと代表で中心選手として君臨。表彰台入りを有力視。`;
    } else {
      summary = `安定したハイパフォーマンスにより堂々の30名ノミネート入り。`;
    }

    return {
      rank: index + 1,
      playerId: p.id,
      playerName: p.name,
      clubId: club?.id || '',
      clubName: club?.name || '',
      nationality: p.nationality,
      position: p.position,
      age: p.age,
      ovr: p.ovr,
      goals,
      assists,
      avgRating: parseFloat(rating),
      trophiesCount: club?.tier === 'Elite' ? 2 : 1,
      winProbability: prob,
      summary
    };
  });

  return candidates;
}

/**
 * Check and advance Ballon d'Or event during daily calendar progression
 */
export function checkAndAdvanceBallonDor(
  state: GameWorldState, 
  currentDate: string
): { 
  updatedState: Partial<GameWorldState>; 
  newsItem?: NewsItem;
  winnerPlayer?: Player;
} {
  const d = new Date(currentDate);
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();
  const year = d.getFullYear();

  // Ballon d'Or is only evaluated in November (month === 11)
  if (month !== 11) {
    return { updatedState: {} };
  }

  // Phase 1: Early November (Day 3 - 10) Nominees Announcement
  if (day >= 3 && day <= 10 && !state.ballonDorNomineesAnnounced) {
    const candidates = generateBallonDorCandidates(state);
    const topCandidate = candidates[0];

    const newsItem: NewsItem = {
      id: `news_ballondor_nominees_${year}_${Date.now()}`,
      date: currentDate,
      headline: `【バロンドール${year}】世界年間最優秀選手・候補者30名が正式ノミネート！`,
      body: `フランス・フットボール誌は本日、${year}年のバロンドール最終候補者30名を世界同時発表しました。欧州主要リーグから選りすぐりの世界的名手が名を連ね、現時点で${topCandidate.clubName}の${topCandidate.playerName}（勝率予測${topCandidate.winProbability}%）が最有力候補としてトップに立っています。授賞式は11月下旬にパリで開催されます。`,
      category: 'press',
      importance: 'high'
    };

    return {
      updatedState: {
        ballonDorYear: year,
        ballonDorNomineesAnnounced: true,
        ballonDorWinnerAnnounced: false,
        ballonDorRankings: candidates
      },
      newsItem
    };
  }

  // Phase 2: Late November (Day 25 - 30) Winner Announcement Gala
  if (day >= 25 && state.ballonDorNomineesAnnounced && !state.ballonDorWinnerAnnounced) {
    const candidates = state.ballonDorRankings && state.ballonDorRankings.length > 0 
      ? state.ballonDorRankings 
      : generateBallonDorCandidates(state);

    const winnerCandidate = candidates[0];
    const winnerPlayer = state.players[winnerCandidate.playerId];

    const updatedPlayers = { ...state.players };
    if (winnerPlayer) {
      // Award winner temporary "絶好調" (Pink condition)
      updatedPlayers[winnerPlayer.id] = {
        ...winnerPlayer,
        condition: 'pink',
        managerTrust: Math.min(100, winnerPlayer.managerTrust + 5)
      };
    }

    const newsItem: NewsItem = {
      id: `news_ballondor_winner_${year}_${Date.now()}`,
      date: currentDate,
      headline: `【栄光の頂点】${winnerCandidate.playerName}が${year}年バロンドールを受賞！世界年間最優秀選手に選出`,
      body: `パリ・シャトレ座で開催された${year}年バロンドール授賞式において、${winnerCandidate.clubName}所属の${winnerCandidate.playerName}が見事初戴冠（年間最優秀選手賞）を果たしました！世界各国の代表監督・主将・ジャーナリストによる投票で圧倒的な支持を集め、フットボール界最高の栄誉に輝きました。受賞を祝し、サポーターの熱狂と信頼度も大幅に高まっています。`,
      category: 'press',
      relatedClubId: winnerCandidate.clubId,
      importance: 'high'
    };

    return {
      updatedState: {
        ballonDorWinnerAnnounced: true,
        ballonDorWinnerId: winnerCandidate.playerId,
        fanApproval: Math.min(100, state.fanApproval + 8),
        players: updatedPlayers
      },
      newsItem,
      winnerPlayer: updatedPlayers[winnerCandidate.playerId]
    };
  }

  return { updatedState: {} };
}
