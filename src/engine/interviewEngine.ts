import { GameWorldState, MatchFixture, MatchEvent, TransferInterviewRequest } from '../types/game';
import {
  buildTransferInterviewRequest,
  resolveTransferInterview,
  upsertTransferRumorAndPost
} from './socialRumorEngine';

export interface InterviewChoice {
  id: string;
  label: string;
  text: string;
  tone: 'positive' | 'tactical' | 'protective' | 'ambitious' | 'accountable' | 'critical';
  trustDelta: number;
  boardDelta: number;
}

export interface InterviewQuestionItem {
  id: string;
  category: string;
  reporterRole: string;
  question: string;
  choices: InterviewChoice[];
}

interface MatchInterviewSignals {
  userScore: number;
  oppScore: number;
  diff: number;
  isWin: boolean;
  isDraw: boolean;
  isLoss: boolean;
  isBigWin: boolean;
  isBigLoss: boolean;
  isNarrowWin: boolean;
  isComebackWin: boolean;
  lateUserGoal?: MatchEvent;
  lateOppGoal?: MatchEvent;
  isDerby: boolean;
  isGiantKilling: boolean;
  isShockUpset: boolean;
  userInjuryEvent?: MatchEvent;
  userRedCardEvent?: MatchEvent;
  isPenaltyShootout: boolean;
  isKnockoutElimination: boolean;
  winStreak: number;
  lossStreak: number;
  winlessStreak: number;
  heroYoungsterName?: string;
  heroScorerName?: string;
  slumpStarName?: string;
  userClubName: string;
  oppClubName: string;
  competitionName: string;
}

function isRegularGoalEvent(e: MatchEvent): boolean {
  return e.type === 'goal' || (e.type === 'penalty' && !(e.description && e.description.includes('PK戦')));
}

export function extractMatchInterviewSignals(fixture: MatchFixture, state: GameWorldState): MatchInterviewSignals {
  const userClubId = state.userClubId || fixture.homeClubId;
  const isUserHome = fixture.homeClubId === userClubId;
  const userClub = state.clubs[userClubId];
  const oppClubId = isUserHome ? fixture.awayClubId : fixture.homeClubId;
  const oppClub = state.clubs[oppClubId];

  const homeScore = fixture.homeScore ?? 0;
  const awayScore = fixture.awayScore ?? 0;
  const userScore = isUserHome ? homeScore : awayScore;
  const oppScore = isUserHome ? awayScore : homeScore;
  const diff = userScore - oppScore;

  const isPenaltyShootout = Boolean(fixture.penaltyShootout);
  const wonOnPk = Boolean(fixture.penaltyShootout && fixture.penaltyShootout.winnerClubId === userClubId);
  const lostOnPk = Boolean(fixture.penaltyShootout && fixture.penaltyShootout.winnerClubId && fixture.penaltyShootout.winnerClubId !== userClubId);

  const isWin = diff > 0 || wonOnPk;
  const isLoss = diff < 0 || lostOnPk;
  const isDraw = diff === 0 && !isPenaltyShootout;

  const events = [...(fixture.events || [])].sort((a, b) => a.minute - b.minute);

  // Detect comeback win: user trailed at any point before winning
  let runningUser = 0;
  let runningOpp = 0;
  let trailedAtAnyPoint = false;
  events.forEach(ev => {
    if (isRegularGoalEvent(ev)) {
      if (ev.clubId === userClubId) runningUser++;
      else runningOpp++;
      if (runningOpp > runningUser) trailedAtAnyPoint = true;
    }
  });
  const isComebackWin = isWin && trailedAtAnyPoint;

  const lateUserGoal = [...events]
    .reverse()
    .find(e => isRegularGoalEvent(e) && e.clubId === userClubId && e.minute >= 85);
  const lateOppGoal = [...events]
    .reverse()
    .find(e => isRegularGoalEvent(e) && e.clubId !== userClubId && e.minute >= 85);

  const userInjuryEvent = events.find(e => e.type === 'injury' && e.clubId === userClubId);
  const userRedCardEvent = events.find(
    e => (e.type === 'red_card' || e.type === 'second_yellow') && e.clubId === userClubId
  );

  const isDerby = Boolean(
    userClub?.rivalClubIds?.includes(oppClubId) || oppClub?.rivalClubIds?.includes(userClubId)
  );
  const userRep = userClub?.reputation || 75;
  const oppRep = oppClub?.reputation || 75;
  const isGiantKilling = isWin && oppRep >= userRep + 7;
  const isShockUpset = isLoss && userRep >= oppRep + 7;

  const isCupOrEuro =
    fixture.competitionType === 'domestic_cup' ||
    fixture.competitionType === 'continental_competition' ||
    Boolean(fixture.round && (fixture.round.includes('Round') || fixture.round.includes('回戦') || fixture.round.includes('準') || fixture.round.includes('決勝')));
  const isKnockoutElimination = isLoss && isCupOrEuro;

  // Recent form streak estimation
  const userStanding = (userClub && state.standings?.[userClub.league]?.find(r => r.clubId === userClubId)) || null;
  const form = userStanding?.form || [];
  let winStreak = 0;
  for (let i = form.length - 1; i >= 0; i--) {
    if (form[i] === 'W') winStreak++;
    else break;
  }
  if (isWin && form[form.length - 1] !== 'W') winStreak += 1;

  // Player highlight/slump signals
  const ratings = fixture.stats?.playerRatings || {};
  const userClubPlayers = (userClub?.playerIds || []).map(id => state.players[id]).filter(Boolean);

  const userGoalEvents = events.filter(e => isRegularGoalEvent(e) && e.clubId === userClubId);
  const scorerById = userGoalEvents.map(g => (g.playerId ? state.players[g.playerId] : undefined)).filter(Boolean);
  const heroYoungster =
    scorerById.find(p => p && p.age <= 21) ||
    userClubPlayers
      .filter(p => p.age <= 21 && (ratings[p.id] ?? 0) >= 7.2)
      .sort((a, b) => (ratings[b.id] ?? 0) - (ratings[a.id] ?? 0))[0];

  const heroScorer =
    scorerById[0] ||
    userClubPlayers
      .filter(p => (ratings[p.id] ?? 0) >= 7.4)
      .sort((a, b) => (ratings[b.id] ?? 0) - (ratings[a.id] ?? 0))[0];

  const slumpStar = userClubPlayers
    .filter(p => p.ovr >= 80 && ratings[p.id] !== undefined && ratings[p.id] < 6.0)
    .sort((a, b) => b.ovr - a.ovr)[0];

  return {
    userScore,
    oppScore,
    diff,
    isWin,
    isDraw,
    isLoss,
    isBigWin: diff >= 3,
    isBigLoss: diff <= -3,
    isNarrowWin: isWin && diff >= 0 && diff <= 1,
    isComebackWin,
    lateUserGoal,
    lateOppGoal,
    isDerby,
    isGiantKilling,
    isShockUpset,
    userInjuryEvent,
    userRedCardEvent,
    isPenaltyShootout,
    isKnockoutElimination,
    winStreak,
    lossStreak: state.consecutiveLosses || 0,
    winlessStreak: state.consecutiveWinless || 0,
    heroYoungsterName: heroYoungster?.name,
    heroScorerName: heroScorer?.name || userGoalEvents[0]?.playerName,
    slumpStarName: slumpStar?.name,
    userClubName: userClub?.name || '自クラブ',
    oppClubName: oppClub?.name || '対戦相手',
    competitionName: fixture.competitionName || '公式戦'
  };
}

export function generatePostMatchInterviewQuestions(params: {
  fixture: MatchFixture;
  state: GameWorldState;
  count?: number;
}): InterviewQuestionItem[] {
  const { fixture, state, count = 3 } = params;
  const s = extractMatchInterviewSignals(fixture, state);
  const scoreStr = `${s.userScore}-${s.oppScore}`;

  const pool: InterviewQuestionItem[] = [];

  // Q-A: Match Result Headline Question (Specific to exact scoreline & context)
  if (s.isComebackWin) {
    pool.push({
      id: 'q_comeback_win',
      category: '逆転劇',
      reporterRole: 'スポーツ紙トップ記者',
      question: `先制を許しながらも最終的に ${scoreStr} で${s.oppClubName}を破った劇的な逆転勝利でした。ハーフタイムや終盤でチームに何が起きたのでしょうか？`,
      choices: [
        {
          id: 'c_cb_mentality',
          label: '選手のメンタルを称賛',
          text: 'リードされても選手たちの目線は一切下がっていなかった。自分を信じ続けた執念の逆転勝利だ。',
          tone: 'positive',
          trustDelta: 3,
          boardDelta: 2
        },
        {
          id: 'c_cb_tactics',
          label: '修正と交代の的中を語る',
          text: '相手のプレスが落ちる時間帯を見極めて重心を前に移した。途中出場選手も含めプラン通りの修正だった。',
          tone: 'tactical',
          trustDelta: 2,
          boardDelta: 2
        },
        {
          id: 'c_cb_warning',
          label: '先制された入りを反省',
          text: '勝てたことは嬉しいが、先に失点する試合運びは修正が必要だ。次の試合では立ち上がりから主導権を握りたい。',
          tone: 'accountable',
          trustDelta: 1,
          boardDelta: 1
        },
        {
          id: 'c_cb_fans',
          label: 'スタンドの後押しに感謝',
          text: '苦しい時間帯でもサポーターの声援が背中を押し続けてくれた。スタジアム全員で掴んだ勝ち点だ。',
          tone: 'positive',
          trustDelta: 2,
          boardDelta: 2
        }
      ]
    });
  } else if (s.isBigWin) {
    pool.push({
      id: 'q_big_win',
      category: '圧勝・大勝',
      reporterRole: '全国紙サッカー担当',
      question: `${s.oppClubName}相手に ${scoreStr} という圧倒的なスコアでの大勝となりました。攻撃陣の破壊力についてどう評価していますか？`,
      choices: [
        {
          id: 'c_bw_team',
          label: '連動とハードワークを称える',
          text: '得点を決めた選手だけでなく、後方からのビルドアップと前線の守備の連動が完璧に噛み合った結果だ。',
          tone: 'positive',
          trustDelta: 3,
          boardDelta: 2
        },
        {
          id: 'c_bw_hungry',
          label: 'さらなる高みを要求',
          text: '素晴らしい内容だったが、まだシーズンの通過点に過ぎない。この基準を毎試合出し続けることが強豪への道だ。',
          tone: 'ambitious',
          trustDelta: 1,
          boardDelta: 3
        },
        {
          id: 'c_bw_tactics',
          label: '戦術的優位を解説',
          text: '相手の弱点であるスペースを試合前から分析していた。選手たちがピッチ上で忠実に体現してくれた。',
          tone: 'tactical',
          trustDelta: 2,
          boardDelta: 2
        },
        {
          id: 'c_bw_respect',
          label: '相手にも敬意を払い気を引き締める',
          text: '点差は開いたが、一歩間違えれば難しい試合だった。浮かれることなく次戦へ集中したい。',
          tone: 'accountable',
          trustDelta: 2,
          boardDelta: 1
        }
      ]
    });
  } else if (s.isBigLoss || s.isShockUpset) {
    pool.push({
      id: 'q_heavy_loss',
      category: '完敗・番狂わせ敗戦',
      reporterRole: '辛口コラムニスト',
      question: `${s.oppClubName}に ${scoreStr} で敗れる厳しい結果となりました。ファンからも厳しい声が上がっていますが、敗因をどう受け止めていますか？`,
      choices: [
        {
          id: 'c_hl_own_fault',
          label: '監督自身の責任を認める',
          text: 'この敗戦の全責任は私にある。戦術選択も準備も甘かった。選手は全力を尽くしたが、勝たせられなかったのは監督の責任だ。',
          tone: 'accountable',
          trustDelta: 2,
          boardDelta: -1
        },
        {
          id: 'c_hl_protect',
          label: '選手を擁護し次戦へ切替',
          text: '結果は非常に痛いが、選手を責めるつもりはない。ロッカールームでしっかり話し合い、必ず次の試合でやり返す。',
          tone: 'protective',
          trustDelta: 3,
          boardDelta: 0
        },
        {
          id: 'c_hl_fix_tactics',
          label: '守備・戦術のテコ入れを明言',
          text: '失点の形を見れば課題は明白だ。トレーニングから守備の原則を見直し、チームを立て直す必要がある。',
          tone: 'tactical',
          trustDelta: 1,
          boardDelta: 2
        },
        {
          id: 'c_hl_harsh',
          label: '球際・闘志不足に苦言',
          text: '正直に言えば、今日の試合は戦う姿勢や球際の激しさで相手に完敗していた。プロの基準を満たしていない。',
          tone: 'critical',
          trustDelta: -2,
          boardDelta: 1
        },
        {
          id: 'c_hl_apology',
          label: 'サポーターに深く謝罪',
          text: '遠方まで駆けつけてくれたサポーターに本当に申し訳ない。この悔しさを決して忘れず、勝利で償うしかない。',
          tone: 'accountable',
          trustDelta: 1,
          boardDelta: 1
        }
      ]
    });
  } else if (s.isLoss) {
    pool.push({
      id: 'q_loss',
      category: '敗戦総括',
      reporterRole: 'クラブ番記者',
      question: `${s.oppClubName}戦を ${scoreStr} で落とす結果となりました。手応えと課題のどちらが強く残った試合でしたか？`,
      choices: [
        {
          id: 'c_l_detail',
          label: '細部の決定力不足を指摘',
          text: '内容自体は悪くなかったが、ボックス内の精度と一瞬の集中力の差がスコアに表れた。そこを詰めていくだけだ。',
          tone: 'tactical',
          trustDelta: 1,
          boardDelta: 1
        },
        {
          id: 'c_l_protect',
          label: '選手たちの姿勢を評価',
          text: '結果こそ伴わなかったが、90分間走り抜いた姿勢には一定の評価をしている。この悔しさをエネルギーに変えたい。',
          tone: 'protective',
          trustDelta: 2,
          boardDelta: 0
        },
        {
          id: 'c_l_self',
          label: '采配の改善を約束',
          text: '試合中の流れを変える手がもう一つ打てたかもしれない。私自身もこの敗戦から多くを学んで次へ活かす。',
          tone: 'accountable',
          trustDelta: 2,
          boardDelta: 1
        },
        {
          id: 'c_l_demand',
          label: '勝点への執念を強調',
          text: '良いサッカーをしても勝ち点が取れなければ意味がない。次は泥臭くても結果を奪いに行く必要がある。',
          tone: 'critical',
          trustDelta: -1,
          boardDelta: 2
        }
      ]
    });
  } else if (s.isDraw) {
    pool.push({
      id: 'q_draw',
      category: '引き分け総括',
      reporterRole: 'マッチリポーター',
      question: `${s.userScore}対${s.oppScore}のドローで勝ち点1を分け合いました。勝ち点2を失ったのか、勝ち点1を拾ったのか、率直な評価をお聞かせください。`,
      choices: [
        {
          id: 'c_d_lost2',
          label: '勝てた試合と悔しさを滲ませる',
          text: 'チャンスの数を見れば勝ち切りたかったのが本音だ。ただ、この悔しさがチームをより強くするはずだ。',
          tone: 'ambitious',
          trustDelta: 1,
          boardDelta: 1
        },
        {
          id: 'c_d_earned1',
          label: 'タフな試合での勝ち点1を評価',
          text: '相手の強みを考えれば、負けないことが非常に重要だった。アウェイ同等の緊張感の中で意味のある勝ち点1だ。',
          tone: 'positive',
          trustDelta: 2,
          boardDelta: 1
        },
        {
          id: 'c_d_tactic',
          label: '試合運びの改善点を挙げる',
          text: '中盤のコントロールで課題が残った時間帯があった。次節に向けてビルドアップの質を高めたい。',
          tone: 'tactical',
          trustDelta: 1,
          boardDelta: 1
        },
        {
          id: 'c_d_defense',
          label: '粘り強い守備を称賛',
          text: '最後まで集中を切らさず組織で守り切った。この粘り強さをベースに攻撃の迫力を上乗せしていく。',
          tone: 'protective',
          trustDelta: 2,
          boardDelta: 1
        }
      ]
    });
  } else {
    // Standard / Narrow Win
    pool.push({
      id: 'q_narrow_win',
      category: '接戦勝利',
      reporterRole: 'スポーツニュース取材班',
      question: `${s.oppClubName}との接戦を ${scoreStr} で制しました。タフなゲームを勝ち切れた最大の要因は何でしょうか？`,
      choices: [
        {
          id: 'c_nw_focus',
          label: '集中力と組織守備を称賛',
          text: '1点を争う展開で、最後の最後まで集中を切らさなかった選手たちの規律とハードワークの勝利だ。',
          tone: 'positive',
          trustDelta: 3,
          boardDelta: 2
        },
        {
          id: 'c_nw_tactical',
          label: '試合運びと戦術遂行力を評価',
          text: '相手が圧力を強めてくる場面でも冷静にゲームをコントロールできた。戦術理解度が確実に上がっている。',
          tone: 'tactical',
          trustDelta: 2,
          boardDelta: 2
        },
        {
          id: 'c_nw_improve',
          label: '追加点を奪う課題を指摘',
          text: '勝ち切れたのは大きいが、もっと早い時間帯で2点目を奪って楽に試合を終わらせる必要があった。',
          tone: 'ambitious',
          trustDelta: 1,
          boardDelta: 2
        },
        {
          id: 'c_nw_bench',
          label: 'ベンチワークとチーム一丸を強調',
          text: '先発した11人だけでなく、ベンチから途中投入された選手が見事に試合を締めてくれた。全員の勝利だ。',
          tone: 'positive',
          trustDelta: 2,
          boardDelta: 1
        }
      ]
    });
  }

  // Q-B: Late Goal / Dramatic Finish (85'+)
  if (s.lateUserGoal) {
    pool.push({
      id: 'q_late_goal_for',
      category: '終盤劇的ゴール',
      reporterRole: '現場実況アナウンサー',
      question: `${s.lateUserGoal.minute}分の${s.lateUserGoal.playerName}選手の劇的な終盤弾がチームを救いました。あの時間帯まで足を止めずに攻め続けられた理由は？`,
      choices: [
        {
          id: 'c_lgf_fitness',
          label: '日々のフィジカルと走力トレーニングの成果',
          text: '90分を通して走り勝つ準備を毎日やってきた。終盤に違いを作れたのは選手たちの努力の賜物だ。',
          tone: 'positive',
          trustDelta: 3,
          boardDelta: 2
        },
        {
          id: 'c_lgf_sub',
          label: '勝負をかけた攻撃的采配',
          text: '終盤に必ずスペースが空くと見てフレッシュな選手を送り込んだ。狙い通りの時間帯に仕留めてくれた。',
          tone: 'tactical',
          trustDelta: 2,
          boardDelta: 2
        },
        {
          id: 'c_lgf_early',
          label: '次はもっと早く勝負を決めたい',
          text: '劇的なゴールは最高だが、心臓には悪いね（笑）。次はもう少し早く主導権を握って勝ちたいところだ。',
          tone: 'ambitious',
          trustDelta: 2,
          boardDelta: 1
        },
        {
          id: 'c_lgf_hero',
          label: '得点者の勝負強さを絶賛',
          text: `${s.lateUserGoal.playerName}はビッグモーメントに強い選手。あそこで落ち着いて決め切る技術とメンタルは特別だ。`,
          tone: 'positive',
          trustDelta: 3,
          boardDelta: 1
        }
      ]
    });
  } else if (s.lateOppGoal) {
    pool.push({
      id: 'q_late_goal_against',
      category: '終盤失点',
      reporterRole: '戦術分析アナリスト',
      question: `${s.lateOppGoal.minute}分に失点するなど終盤のゲームマネジメントに課題が残りました。疲労の影響はありましたか？`,
      choices: [
        {
          id: 'c_lga_fatigue',
          label: '疲労と交代タイミングの反省',
          text: '終盤に足が止まった時間帯があったのは事実だ。ベンチワークやローテーションのタイミングをもう少し工夫すべきだった。',
          tone: 'accountable',
          trustDelta: 2,
          boardDelta: 1
        },
        {
          id: 'c_lga_focus',
          label: '試合の締め方に厳しい注文',
          text: '85分を過ぎてからの失点は一番避けなければならない。リード時・拮抗時のリスク管理を徹底させたい。',
          tone: 'critical',
          trustDelta: -1,
          boardDelta: 1
        },
        {
          id: 'c_lga_protect',
          label: '過度な消耗の中でも戦った選手を庇う',
          text: '連戦の疲れがある中で90分近く集中を保っていた。あの失点だけで選手たちの頑張りを否定したくない。',
          tone: 'protective',
          trustDelta: 3,
          boardDelta: 0
        },
        {
          id: 'c_lga_tactic',
          label: 'ライン設定の調整を示唆',
          text: '終盤の守備ラインとボランチ間の距離が少し間延びした。練習でコンパクトさを再確認する。',
          tone: 'tactical',
          trustDelta: 1,
          boardDelta: 2
        }
      ]
    });
  }

  // Q-C: Derby / Giant Killing / Streak / Knockout Context
  if (s.isDerby) {
    pool.push({
      id: 'q_derby',
      category: 'ダービーマッチ',
      reporterRole: '地元紙デスク',
      question: `宿敵${s.oppClubName}との意地がぶつかり合うダービーでした。サポーターにとって特別な一戦を終えて今の心境は？`,
      choices: [
        {
          id: 'c_db_passion',
          label: 'クラブとファンの誇りを語る',
          text: 'ダービーは単なる勝ち点以上の意味を持つ。今日スタジアムに集まった全員の情熱をピッチにぶつけたつもりだ。',
          tone: 'positive',
          trustDelta: 2,
          boardDelta: 2
        },
        {
          id: 'c_db_calm',
          label: 'あくまでシーズン全体を見据える',
          text: 'ファンの喜びは理解しているが、来週も大事な試合がある。興奮を抑えて次の準備へ切り替える。',
          tone: 'tactical',
          trustDelta: 1,
          boardDelta: 2
        },
        {
          id: 'c_db_duel',
          label: '球際・デュエルでの戦いを評価',
          text: '戦術以上にセカンドボールと1対1の執着心が試される一戦だった。選手は臆せず真正面から戦ってくれた。',
          tone: 'protective',
          trustDelta: 3,
          boardDelta: 1
        },
        {
          id: 'c_db_revenge',
          label: '次の対戦へ向け闘志を燃やす',
          text: 'ダービーの借りはダービーで返すしかない。次の再戦では必ずホームのファンに笑顔を届ける。',
          tone: 'ambitious',
          trustDelta: 1,
          boardDelta: 1
        }
      ]
    });
  }

  if (s.isGiantKilling) {
    pool.push({
      id: 'q_giant_killing',
      category: '強豪撃破',
      reporterRole: '欧州サッカー誌記者',
      question: `格上と目されていた${s.oppClubName}を撃破する番狂わせを起こしました！この勝利はチームにどんな変化をもたらしますか？`,
      choices: [
        {
          id: 'c_gk_belief',
          label: '「自分たちは誰とでも戦える」と自信',
          text: 'この勝利は選手たちに計り知れない自信を与える。格上相手でも恐れず自分たちのサッカーを貫けると証明できた。',
          tone: 'positive',
          trustDelta: 3,
          boardDelta: 3
        },
        {
          id: 'c_gk_plan',
          label: '準備と分析の勝利を強調',
          text: '偶然の勝利ではない。1週間かけて練り上げたゲームプランを全員が完璧に遂行した必然の結果だ。',
          tone: 'tactical',
          trustDelta: 2,
          boardDelta: 3
        },
        {
          id: 'c_gk_humble',
          label: '浮かれず現実的な目標を維持',
          text: '今日だけはファンと一緒に喜んでいいが、明日からまたチャレンジャーとして一戦一戦戦う姿勢は変えない。',
          tone: 'accountable',
          trustDelta: 2,
          boardDelta: 2
        },
        {
          id: 'c_gk_statement',
          label: 'リーグ・大会全体への宣戦布告',
          text: 'これで我々が単なるダークホースではないと周囲も気づいただろう。さらに上を目指して突き進む。',
          tone: 'ambitious',
          trustDelta: 2,
          boardDelta: 2
        }
      ]
    });
  }

  if (s.isKnockoutElimination) {
    pool.push({
      id: 'q_ko_exit',
      category: '大会敗退',
      reporterRole: 'カップ戦専属記者',
      question: `${s.competitionName}敗退という結果に終わりました。リーグ戦など残された大会に向けてどう気持ちを切り替えますか？`,
      choices: [
        {
          id: 'c_ko_focus_league',
          label: '残されたコンペティションへ総力集中を宣言',
          text: '敗退は痛恨だが、立ち止まっている時間はない。残されたリーグ戦とタイトル獲得に全エネルギーを注ぎ込む。',
          tone: 'ambitious',
          trustDelta: 1,
          boardDelta: 2
        },
        {
          id: 'c_ko_pk_pride',
          label: '死闘を演じた選手たちを労う',
          text: '選手たちは出し切った。トーナメントの一発勝負は紙一重。胸を張って次の試合へ向かってほしい。',
          tone: 'protective',
          trustDelta: 3,
          boardDelta: 1
        },
        {
          id: 'c_ko_learn',
          label: '大舞台での経験値を次季の糧に',
          text: '強豪と真剣勝負できた経験はこのチームにとって大きな財産になる。このレベルで勝ち切る力をさらに磨く。',
          tone: 'accountable',
          trustDelta: 2,
          boardDelta: 1
        },
        {
          id: 'c_ko_depth',
          label: 'スカッド層の厚みの必要性に言及',
          text: '過密日程とカップ戦を並行する上で、選手層の充実がいかに重要か再認識させられた。今後の強化ポイントだ。',
          tone: 'tactical',
          trustDelta: 0,
          boardDelta: 1
        }
      ]
    });
  }

  // Q-D: Player Specific / Injury / Streak / Slump
  if (s.userInjuryEvent) {
    pool.push({
      id: 'q_injury',
      category: '負傷離脱懸念',
      reporterRole: 'クラブ専門医療担当記者',
      question: `試合中に${s.userInjuryEvent.playerName}選手が負傷交代するアクシデントがありました。状態の見通しと今後の起用プランは？`,
      choices: [
        {
          id: 'c_inj_care',
          label: '選手の健康最優先・メディカルに委ねる',
          text: 'まずは精密検査の結果を待つ。何より選手のキャリアと健康が第一であり、無理な復帰は絶対にさせない。',
          tone: 'protective',
          trustDelta: 3,
          boardDelta: 1
        },
        {
          id: 'c_inj_depth',
          label: '控え選手の奮起に期待',
          text: '離脱は痛いが、これは他の選手にとってチャンスでもある。チーム全体の総合力でこの危機を乗り越える。',
          tone: 'ambitious',
          trustDelta: 2,
          boardDelta: 2
        },
        {
          id: 'c_inj_schedule',
          label: '過密日程と疲労蓄積への懸念を表明',
          text: '連戦が続く中でフィジカル負荷は限界に近い。練習メニューとコンディショニング管理を見直す必要がある。',
          tone: 'tactical',
          trustDelta: 2,
          boardDelta: 0
        },
        {
          id: 'c_inj_adapt',
          label: '戦術変更での穴埋めを示唆',
          text: '代わりの選手の特徴に合わせて少しシステムや役割を調整するかもしれない。解決策は十分にある。',
          tone: 'tactical',
          trustDelta: 1,
          boardDelta: 2
        }
      ]
    });
  }

  if (s.heroYoungsterName) {
    pool.push({
      id: 'q_youngster',
      category: '若手躍動',
      reporterRole: '育成・スカウト担当記者',
      question: `若手注目株の${s.heroYoungsterName}選手がピッチで堂々たる存在感を見せました。起用を決断した背景と今後の期待は？`,
      choices: [
        {
          id: 'c_yg_merit',
          label: '年齢に関係なく実力で起用したと断言',
          text: '練習での取り組みを見れば起用は当然だった。うちでは年齢ではなくピッチでのパフォーマンスだけが基準だ。',
          tone: 'positive',
          trustDelta: 3,
          boardDelta: 2
        },
        {
          id: 'c_yg_protect',
          label: '過度な期待から守り段階的成長を強調',
          text: '才能は本物だが、まだ若い。メディアの皆さんも焦らず温かく見守ってほしい。着実に育てていく。',
          tone: 'protective',
          trustDelta: 3,
          boardDelta: 2
        },
        {
          id: 'c_yg_push',
          label: '定位置争いへのさらなる刺激を促す',
          text: '今日のようなプレーを続ければレギュラーも遠くない。先輩たちにとっても良い刺激になっている。',
          tone: 'ambitious',
          trustDelta: 2,
          boardDelta: 2
        },
        {
          id: 'c_yg_academy',
          label: 'クラブの育成方針・スカウト陣を称賛',
          text: '素晴らしいタレントを育ててくれた育成スタッフの功績も大きい。クラブの未来は間違いなく明るい。',
          tone: 'positive',
          trustDelta: 2,
          boardDelta: 3
        }
      ]
    });
  }

  if (s.slumpStarName) {
    pool.push({
      id: 'q_slump_star',
      category: '主力不振への質問',
      reporterRole: 'タブロイド紙記者',
      question: `攻撃・中盤の要である${s.slumpStarName}選手が今日は本来の輝きを欠いたように見えました。次戦の起用はどうお考えですか？`,
      choices: [
        {
          id: 'c_ss_back',
          label: '絶対的信頼を強調して全面擁護',
          text: `${s.slumpStarName}はチームに不可欠なワールドクラスの選手だ。誰でも調子の波はある。私とチームは彼を100%信頼している。`,
          tone: 'protective',
          trustDelta: 3,
          boardDelta: 1
        },
        {
          id: 'c_ss_tactical_care',
          label: '相手マークの厳しさと戦術的課題を説明',
          text: '今日は相手が彼に2人、3人とマークをつけてきた。彼を孤立させない周りのサポートを改善するのは私の仕事だ。',
          tone: 'tactical',
          trustDelta: 2,
          boardDelta: 2
        },
        {
          id: 'c_ss_competition',
          label: '聖域なき定位置争いを示唆',
          text: '誰であってもパフォーマンスが基準に届かなければ競争は避けられない。練習での反応を見てスタメンを決める。',
          tone: 'critical',
          trustDelta: -1,
          boardDelta: 2
        },
        {
          id: 'c_ss_rest',
          label: '疲労考慮・コンディション回復に言及',
          text: 'ここ数試合続けてフル稼働してもらっていた。蓄積疲労も考慮し、ベストな状態で戻れるようケアしたい。',
          tone: 'accountable',
          trustDelta: 2,
          boardDelta: 1
        }
      ]
    });
  }

  if (s.winStreak >= 3) {
    pool.push({
      id: 'q_winstreak',
      category: '連勝街道',
      reporterRole: 'リーグ公式メディア',
      question: `これで公式戦${s.winStreak}連勝と絶好調です。チーム内の雰囲気と勢いをどう維持していきますか？`,
      choices: [
        {
          id: 'c_ws_humble',
          label: '「慢心が最大の敵」と引き締め',
          text: '連勝は喜ばしいが、慢心が生まれた瞬間に足元を掬われる。勝って兜の緒を締め、基本に忠実であり続ける。',
          tone: 'accountable',
          trustDelta: 2,
          boardDelta: 3
        },
        {
          id: 'c_ws_momentum',
          label: '勢いを全面に出しさらなる連勝を狙う',
          text: '今ロッカールームには「負ける気がしない」というポジティブな空気が流れている。この波に乗ってどこまでも行く。',
          tone: 'ambitious',
          trustDelta: 3,
          boardDelta: 2
        },
        {
          id: 'c_ws_rotation',
          label: 'コンディション管理とローテーションの重要性を語る',
          text: '好調を維持するには疲れを溜めないこと。ベンチメンバーも含めた総力戦で連勝を伸ばしたい。',
          tone: 'tactical',
          trustDelta: 2,
          boardDelta: 2
        },
        {
          id: 'c_ws_culture',
          label: '毎日のトレーニングの質の高さを強調',
          text: '試合の結果は週間の練習の鏡だ。競争心とリスペクトを両立できている今のスカッドを誇りに思う。',
          tone: 'positive',
          trustDelta: 3,
          boardDelta: 2
        }
      ]
    });
  } else if (s.lossStreak >= 2 || s.winlessStreak >= 3) {
    pool.push({
      id: 'q_slump_streak',
      category: '未勝利脱出への質問',
      reporterRole: '現地メディア記者',
      question: `ここ数試合白星から遠ざかっており、プレッシャーも増しているのではないでしょうか。現状をどう打破しますか？`,
      choices: [
        {
          id: 'c_st_calm',
          label: '冷静さとデータに基づく信頼を語る',
          text: '周囲の雑音は気にしていない。チャンスクリエイト数など内容は改善しており、1勝すれば流れは劇的に変わる。',
          tone: 'protective',
          trustDelta: 2,
          boardDelta: 1
        },
        {
          id: 'c_st_change',
          label: 'システムやメンバー刷新を検討',
          text: '同じことを繰り返して違う結果は望めない。次節に向けて戦術面・起用面で思い切った変化を加えることも視野に入れる。',
          tone: 'tactical',
          trustDelta: 0,
          boardDelta: 2
        },
        {
          id: 'c_st_fight',
          label: '団結と不退転の覚悟を示す',
          text: '苦しい時こそクラブの真価が問われる。スタッフも選手も誰一人下を向いていない。必ずこのトンネルを抜ける。',
          tone: 'accountable',
          trustDelta: 3,
          boardDelta: 1
        },
        {
          id: 'c_st_defense_first',
          label: 'まず失点を減らす現実路線へ',
          text: '勝てない時期はまず無失点で試合を終えることが特効薬になる。守備の堅さを取り戻すところから再構築する。',
          tone: 'tactical',
          trustDelta: 1,
          boardDelta: 2
        }
      ]
    });
  }

  // Fallback general tactical & next-match questions so we always have >= 3 distinct questions
  pool.push({
    id: 'q_tactics_fatigue',
    category: '戦術・疲労マネジメント',
    reporterRole: '戦術分析記者',
    question: `本日の試合運びにおける戦術選択と、選手のスタミナ・疲労マネジメントについて指揮官の手応えをお聞かせください。`,
    choices: [
      {
        id: 'c_tf_balanced',
        label: '状況に応じた柔軟な修正を評価',
        text: '相手の出方に合わせてプレスの位置やテンポを調整できた。選手たちの戦術的柔軟性には手応えを感じている。',
        tone: 'tactical',
        trustDelta: 2,
        boardDelta: 2
      },
      {
        id: 'c_tf_rotation',
        label: '連戦を見据えた体調管理を重視',
        text: 'シーズンは長いマラソンだ。疲労の蓄積具合を見ながら、ベストのコンディションで次の試合を迎えられるようマネジメントしていく。',
        tone: 'protective',
        trustDelta: 2,
        boardDelta: 1
      },
      {
        id: 'c_tf_intense',
        label: '高いインテンシティの継続を要求',
        text: '我々のスタイルは激しいプレッシングと切り替えの速さが命だ。体力的にきつい場面でも基準を落とさず戦いたい。',
        tone: 'ambitious',
        trustDelta: 1,
        boardDelta: 2
      },
      {
        id: 'c_tf_refine',
        label: '細部の連係向上へ課題を設定',
        text: 'ボール保持時のポジショニングにはまだ伸び代がある。映像を振り返り、次の練習で攻撃の質を高めたい。',
        tone: 'accountable',
        trustDelta: 1,
        boardDelta: 2
      }
    ]
  });

  pool.push({
    id: 'q_next_match',
    category: '次節・ファンへのメッセージ',
    reporterRole: 'クラブ公式番組キャスター',
    question: `最後に、今日の${s.userClubName}の戦いを見守ったサポーターと、次節へ向けたメッセージをお願いします。`,
    choices: [
      {
        id: 'c_nm_gratitude',
        label: '熱い声援への感謝と次の勝利を約束',
        text: '今日も素晴らしい雰囲気を作ってくれたサポーターに感謝したい。次節もピッチで全力を尽くし、誇れる試合を見せる。',
        tone: 'positive',
        trustDelta: 2,
        boardDelta: 2
      },
      {
        id: 'c_nm_ambition',
        label: '目標達成へ強い決意を宣言',
        text: '我々の目標はブレない。目の前の1試合1試合に勝利し、シーズンの終わりに全員で歓喜を分かち合いたい。',
        tone: 'ambitious',
        trustDelta: 2,
        boardDelta: 3
      },
      {
        id: 'c_nm_recovery',
        label: 'まずはリカバリーと入念な準備を強調',
        text: '今日の疲れをしっかり抜いた上で、次の対戦相手の分析に入る。謙虚に、そして貪欲に準備を進めるだけだ。',
        tone: 'tactical',
        trustDelta: 2,
        boardDelta: 2
      },
      {
        id: 'c_nm_unity',
        label: 'チーム・フロント・ファンの結束を呼びかけ',
        text: '良い時も苦しい時も一つになって戦えるのがこのクラブの強みだ。引き続き熱いサポートをお願いしたい。',
        tone: 'protective',
        trustDelta: 3,
        boardDelta: 2
      }
    ]
  });

  // Deduplicate by id and pick `count`
  const seen = new Set<string>();
  const unique: InterviewQuestionItem[] = [];
  for (const q of pool) {
    if (!seen.has(q.id)) {
      seen.add(q.id);
      unique.push(q);
    }
    if (unique.length >= count) break;
  }

  return unique;
}

export { buildTransferInterviewRequest, resolveTransferInterview };

export function getPendingTransferInterviews(state: GameWorldState): TransferInterviewRequest[] {
  return (state.transferInterviews || []).filter(i => i.status === 'pending');
}

export function ensureTransferPolicyInterview(state: GameWorldState): GameWorldState {
  const existing = getPendingTransferInterviews(state);
  if (existing.length > 0) return state;
  return upsertTransferRumorAndPost(state, {
    scenario: 'reinforcement_policy',
    forceCreateInterview: true
  });
}

