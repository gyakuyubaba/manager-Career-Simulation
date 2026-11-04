import { GameWorldState, UnexpectedEvent, UnexpectedEventChoice, UnexpectedEventCategory, Player, NewsItem } from '../types/game';

interface EventTemplate {
  category: UnexpectedEventCategory;
  categoryLabel: string;
  titleTemplate: (context: EventContext) => string;
  descriptionTemplate: (context: EventContext) => string;
  choicesGenerator: (context: EventContext) => UnexpectedEventChoice[];
  isEligible?: (context: EventContext) => boolean;
}

interface EventContext {
  state: GameWorldState;
  userClub: any;
  starPlayer?: Player;
  disgruntledPlayer?: Player;
  youngPlayer?: Player;
  veteranPlayer?: Player;
  captain?: Player;
}

const TEMPLATES: EventTemplate[] = [
  // 1. Club Internal: Playing time dispute (Requirement 12: only low minutes/starts players complain)
  {
    category: 'club_internal',
    categoryLabel: 'クラブ内部・選手関係',
    isEligible: (ctx) => Boolean(ctx.disgruntledPlayer),
    titleTemplate: (ctx) => `【選手面談】${ctx.disgruntledPlayer?.name || '選手'}が出場機会への不満を表明`,
    descriptionTemplate: (ctx) => 
      `主力格でありながら出番が限られている${ctx.disgruntledPlayer?.name || '選手'}が監督室を訪れ、「自分のキャリアにとって今が最も重要な時期。もっと先発で起用されるべきだ」と強い語気で出場機会の確約を求めてきました。`,
    choicesGenerator: (ctx) => [
      {
        id: 'promise_start',
        label: 'A: 次の試合での先発起用を約束する',
        description: '選手の不満を一時的に鎮め、信頼を高めますが、チーム内の競争意識に影響を与える可能性があります。',
        effects: {
          managerTrustDelta: +6,
          moraleDelta: +4,
          newsHeadline: `【チーム内動向】${ctx.userClub?.name}の指揮官、${ctx.disgruntledPlayer?.name || '選手'}の強い直訴に応え起用を明言`
        }
      },
      {
        id: 'fair_competition',
        label: 'B: 「ポジションは実力と練習態度で勝ち取るものだ」と説く',
        description: 'チーム規律を重視し監督の威厳を保ちます。選手のモチベーションは一時的に揺らぐかもしれません。',
        effects: {
          boardConfidenceDelta: +3,
          managerTrustDelta: -3,
          moraleDelta: 0,
          newsHeadline: `【指揮官の信念】「特別扱いはしない」${ctx.userClub?.name}指揮官、チーム内競争の徹底を宣言`
        }
      },
      {
        id: 'discuss_transfer',
        label: 'C: 「納得できないなら移籍の道も検討する」と突き放す',
        description: '不満分子に妥協しない断固たる姿勢。移籍市場での売却検討に入ります。',
        effects: {
          managerTrustDelta: -10,
          moraleDelta: -5,
          boardConfidenceDelta: -2,
          newsHeadline: `【移籍の噂】${ctx.disgruntledPlayer?.name || '主力選手'}と指揮官に不協和音か？${ctx.userClub?.name}内に緊張走る`
        }
      }
    ]
  },

  // 2. Club Internal: Youth wonderkid breakthrough
  {
    category: 'club_internal',
    categoryLabel: 'クラブ内部・若手育成',
    titleTemplate: (ctx) => `【覚醒の兆候】若手有望株の${ctx.youngPlayer?.name || '若手選手'}が急成長！`,
    descriptionTemplate: (ctx) =>
      `ユース出身・若手枠の${ctx.youngPlayer?.name || '若手選手'}（${ctx.youngPlayer?.age || 19}歳）が日々のトレーニングで目覚ましい躍進を見せています。コーチ陣からも「今すぐにでも実戦で通用するレベル」と絶賛の声が上がっています。`,
    choicesGenerator: (ctx) => [
      {
        id: 'promote_lineup',
        label: 'A: 次節のトップチームベンチ入りを即決する',
        description: '若手のモチベーションが最高潮に達し、クラブの育成方針にサポーターが歓喜します。',
        effects: {
          managerTrustDelta: +8,
          moraleDelta: +6,
          boardConfidenceDelta: +4,
          newsHeadline: `【期待の新星】${ctx.userClub?.name}、急成長の${ctx.youngPlayer?.name || '若手'}をトップ戦線に抜擢へ！`
        }
      },
      {
        id: 'careful_development',
        label: 'B: 「焦らずじっくり基礎を固めよう」と慎重に指導する',
        description: '怪我やプレッシャーを防ぎ、堅実な育成プロセスを維持します。',
        effects: {
          managerTrustDelta: +4,
          moraleDelta: +2,
          boardConfidenceDelta: +2,
          newsHeadline: `【育成重視】${ctx.youngPlayer?.name || '若手'}の成長に指揮官は冷静「一歩ずつ大成させたい」`
        }
      }
    ]
  },

  // 3. Match Related: Scouting report leak / tactical preparation
  {
    category: 'match_related',
    categoryLabel: '試合・戦術分析',
    titleTemplate: () => `【戦術分析】次節の対戦相手がこちらのシステムを徹底対策しているとの情報`,
    descriptionTemplate: () =>
      `分析アナリスト陣から緊急報告。「相手監督が直近3試合の我々のビルドアップとプレス回避の癖を徹底研究し、特効戦術を用意している疑いがある」とのことです。`,
    choicesGenerator: (ctx) => [
      {
        id: 'stick_philosophy',
        label: 'A: 自分たちのスタイルを信じ、微調整にとどめて正面突破を図る',
        description: 'チーム戦術の完成度と自信を優先します。',
        effects: {
          moraleDelta: +5,
          managerTrustDelta: +3,
          newsHeadline: `【揺るがぬ哲学】相手の対策報道にも動じず、指揮官は王道の自分たちのサッカーを貫く姿勢`
        }
      },
      {
        id: 'surprise_tactic',
        label: 'B: 相手の裏をかくサプライズ配置と非対称シフトを緊急練習する',
        description: '戦術的奇襲を仕掛けます。選手の理解度にわずかなリスクを伴います。',
        effects: {
          moraleDelta: +2,
          boardConfidenceDelta: +2,
          newsHeadline: `【奇策の予兆】${ctx.userClub?.name || 'チーム'}指揮官、対戦相手の対策を打破する奇襲シフトを秘密裏にテストか`
        }
      }
    ]
  },

  // 4. Transfer Related: Mega club inquiry
  {
    category: 'transfer_related',
    categoryLabel: '移籍市場・選手動向',
    titleTemplate: (ctx) => `【電撃関心】欧州メガクラブが${ctx.starPlayer?.name || '主力選手'}の獲得を極秘打診`,
    descriptionTemplate: (ctx) =>
      `代理人を通じて欧州屈指のメガクラブから正式オファーに向けた予備接触がありました。「市場価値を大幅に上回る移籍金を用意する用意がある」とのことです。選手自身もビッグクラブへの憧れを隠しきれない様子です。`,
    choicesGenerator: (ctx) => [
      {
        id: 'not_for_sale',
        label: 'A: 「絶対に非売品だ」と完全拒否の声明を出す',
        description: '中心戦力を死守します。選手が一時的に落胆する可能性があります。',
        effects: {
          managerTrustDelta: -3,
          boardConfidenceDelta: +4,
          newsHeadline: `【断固拒否】${ctx.userClub?.name}、メガクラブからの接触を一蹴！「${ctx.starPlayer?.name || '選手'}はクラブの宝」`
        }
      },
      {
        id: 'set_high_price',
        label: 'B: 「適正な巨額移籍金（市場価値の1.5倍）なら交渉に応じる」と通告',
        description: '移籍資金確保の現実路線。大型補強への原資となる可能性があります。',
        effects: {
          boardConfidenceDelta: +3,
          budgetDelta: +10000000,
          newsHeadline: `【移籍市場加熱】${ctx.starPlayer?.name || '選手'}にメガクラブの手が伸びる！移籍金の行方に注目`
        }
      }
    ]
  },

  // 5. Board & Management: Sponsor Special Bonus
  {
    category: 'board_management',
    categoryLabel: 'クラブ経営・理事会',
    titleTemplate: (ctx) => `【臨時予算】グローバルスポンサー企業からの特別支援金の交付`,
    descriptionTemplate: (ctx) =>
      `クラブの好調な露出と監督の手腕を評価し、メジャースポンサーが緊急で特別支援金€2.5M（約4億円）のクラブ予算追加交付を理事会に承認しました。`,
    choicesGenerator: () => [
      {
        id: 'invest_transfer',
        label: 'A: 移籍・補強予算に全額を回す',
        description: '市場での戦力補強に直結させます。',
        effects: {
          budgetDelta: +2500000,
          boardConfidenceDelta: +5,
          newsHeadline: `【財務強化】スポンサーからの特別支援金€2.5Mが移籍予算へ追加承認！`
        }
      },
      {
        id: 'invest_facilities',
        label: 'B: 医療・コンディショニング施設と分析機材に投資する',
        description: '選手の疲労回復と怪我リスク軽減に繋がります。',
        effects: {
          fatigueDelta: -10,
          moraleDelta: +8,
          boardConfidenceDelta: +6,
          newsHeadline: `【クラブ近代化】特別支援金をメディカル・分析ラボの最新化へ投入！選手のコンディション向上へ`
        }
      }
    ]
  },

  // 6. Manager Related: Press conference provocation
  {
    category: 'manager_related',
    categoryLabel: 'メディア対応・監督自身',
    titleTemplate: () => `【記者会見】著名な辛口ジャーナリストからの挑発的な質問`,
    descriptionTemplate: () =>
      `定例記者会見で、辛口コラムニストから「あなたの戦術は時代遅れで、相手に読まれているのではないか？」とあからさまな挑発質問が投げかけられました。`,
    choicesGenerator: () => [
      {
        id: 'calm_witty',
        label: 'A: 冷静かつ知的なユーモアで返答し、会見場を味方につける',
        description: '大人の風格を見せ、メディアとサポーターからの評価が上がります。',
        effects: {
          boardConfidenceDelta: +4,
          moraleDelta: +4,
          newsHeadline: `【指揮官の品格】会見場を沸かせた監督の当意即妙な返し！メディアから絶賛の嵐`
        }
      },
      {
        id: 'passion_counter',
        label: 'B: 熱意と信念を熱弁し、「ピッチ上の結果で証明してみせる」と反論',
        description: '選手たちの闘争心に火をつけ、ロッカールームの結束が高まります。',
        effects: {
          managerTrustDelta: +6,
          moraleDelta: +8,
          newsHeadline: `【闘志剥き出し】「結果を見ろ」監督の熱い反論にサポーター共鳴！チームの団結が加速`
        }
      }
    ]
  }
];

/**
 * Generates an unexpected event for today if conditions are met.
 * If forceProbability is provided (e.g. 1.0 in testing), skips cooldown and randomness.
 */
export function generateUnexpectedEventDaily(state: GameWorldState, forceProbability?: number): UnexpectedEvent | null {
  if (!state.userClubId) return null;
  const userClub = state.clubs[state.userClubId];
  if (!userClub) return null;

  // Check if there is already an unresolved active event
  if (state.activeUnexpectedEvent && !state.activeUnexpectedEvent.resolvedChoiceId) {
    return null;
  }

  // 14-day minimum cooldown check (Requirement 6)
  if (state.lastUnexpectedEventDate) {
    const lastDate = new Date(state.lastUnexpectedEventDate).getTime();
    const curDate = new Date(state.currentDate).getTime();
    const diffDays = Math.floor((curDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 14) {
      return null;
    }
  }

  if (forceProbability === undefined) {
    // Low-to-moderate realistic probability (4% chance per eligible day)
    const roll = Math.random();
    if (roll > 0.04) {
      return null;
    }
  }

  // Find club players for context
  const clubPlayers = (userClub.playerIds || []).map(id => state.players[id]).filter(Boolean);
  if (clubPlayers.length === 0) return null;

  // Identify candidate players
  const sortedByOvr = [...clubPlayers].sort((a, b) => (b.ovr || 70) - (a.ovr || 70));
  const starPlayer = sortedByOvr[0];
  const youngPlayer = clubPlayers.filter(p => p.age <= 21).sort((a, b) => (b.potential || 75) - (a.potential || 75))[0] || clubPlayers[clubPlayers.length - 1];
  const veteranPlayer = clubPlayers.filter(p => p.age >= 31)[0] || clubPlayers[0];
  const captain = clubPlayers[0];

  // Requirement 12: Find player who genuinely has high stature but low playing time
  const matchesPlayedByClub = (state.fixtures || []).filter(
    f => f.status === 'finished' && (f.homeClubId === userClub.id || f.awayClubId === userClub.id)
  ).length;

  const disgruntledCandidates = clubPlayers.filter(p => {
    if (p.injuryStatus === 'INJURED' || p.injury?.isInjured || p.suspension?.isSuspended) return false;
    const isHighRole = p.ovr >= 76 || p.squadRole === '絶対的主力' || p.squadRole === '重要選手';
    if (!isHighRole) return false;

    const starts = p.stats?.starts || 0;
    if (matchesPlayedByClub >= 3) {
      return (starts / matchesPlayedByClub) < 0.40;
    }
    const isCurrentlyStarting = state.tactics?.lineup?.starters?.some(s => s.playerId === p.id);
    return !isCurrentlyStarting;
  });

  const disgruntledPlayer = disgruntledCandidates.length > 0
    ? disgruntledCandidates.sort((a, b) => (b.ovr || 70) - (a.ovr || 70))[0]
    : undefined;

  const context: EventContext = {
    state,
    userClub,
    starPlayer,
    disgruntledPlayer,
    youngPlayer,
    veteranPlayer,
    captain
  };

  // Pick a random eligible template (Requirement 12)
  const eligibleTemplates = TEMPLATES.filter(t => !t.isEligible || t.isEligible(context));
  if (eligibleTemplates.length === 0) return null;

  const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];

  const eventId = `uevent_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const title = template.titleTemplate(context);
  const description = template.descriptionTemplate(context);
  const choices = template.choicesGenerator(context);

  const event: UnexpectedEvent = {
    id: eventId,
    date: state.currentDate,
    category: template.category,
    categoryLabel: template.categoryLabel,
    title,
    description,
    relatedPlayerId: starPlayer?.id,
    relatedPlayerName: starPlayer?.name,
    choices
  };

  return event;
}

/**
 * Resolves an active unexpected event by applying choice effects to the GameWorldState
 */
export function resolveUnexpectedEvent(
  state: GameWorldState,
  eventId: string,
  choiceId: string
): GameWorldState {
  const activeEvent = state.activeUnexpectedEvent;
  if (!activeEvent || activeEvent.id !== eventId) return state;

  const choice = activeEvent.choices.find(c => c.id === choiceId);
  if (!choice) return state;

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  let updatedBoardConfidence = state.boardConfidence;
  let updatedClubs = { ...state.clubs };
  let updatedPlayers = { ...state.players };
  let updatedNews = [...state.news];

  // Apply Effects
  if (choice.effects.boardConfidenceDelta) {
    updatedBoardConfidence = Math.max(10, Math.min(100, updatedBoardConfidence + choice.effects.boardConfidenceDelta));
  }

  if (choice.effects.budgetDelta && userClub) {
    updatedClubs[userClub.id] = {
      ...userClub,
      transferBudget: Math.max(0, userClub.transferBudget + choice.effects.budgetDelta)
    };
  }

  // Adjust player morale and trust
  if (choice.effects.managerTrustDelta || choice.effects.moraleDelta) {
    (userClub?.playerIds || []).forEach(pId => {
      const p = updatedPlayers[pId];
      if (p) {
        if (choice.effects.managerTrustDelta) {
          p.managerTrust = Math.max(10, Math.min(100, (p.managerTrust || 70) + choice.effects.managerTrustDelta));
        }
        if (choice.effects.moraleDelta) {
          // Improve condition slightly if positive
          if (choice.effects.moraleDelta > 0 && p.condition === 'purple') p.condition = 'cyan';
          else if (choice.effects.moraleDelta > 0 && p.condition === 'cyan') p.condition = 'yellow';
          else if (choice.effects.moraleDelta > 5 && p.condition === 'yellow') p.condition = 'red';
        }
      }
    });
  }

  if (choice.effects.fatigueDelta) {
    (userClub?.playerIds || []).forEach(pId => {
      const p = updatedPlayers[pId];
      if (p) {
        p.fatigue = Math.max(0, Math.min(100, p.fatigue + (choice.effects.fatigueDelta || 0)));
      }
    });
  }

  // Generate news item
  const newsItem: NewsItem = {
    id: `news_uevent_${Date.now()}`,
    date: state.currentDate,
    headline: choice.effects.newsHeadline || activeEvent.title,
    body: `${activeEvent.description}\n\n指揮官の決断: 「${choice.label}」を選択。\n${choice.description}`,
    category: 'board',
    relatedClubId: userClub?.id,
    importance: 'medium'
  };
  updatedNews.unshift(newsItem);

  const resolvedEvent: UnexpectedEvent = {
    ...activeEvent,
    resolvedChoiceId: choiceId,
    resolvedDate: state.currentDate
  };

  const updatedHistory = [...(state.unexpectedEventsHistory || []), resolvedEvent];
  const updatedProcessedEventIds = [...(state.processedEventIds || []), eventId];

  return {
    ...state,
    boardConfidence: updatedBoardConfidence,
    clubs: updatedClubs,
    players: updatedPlayers,
    news: updatedNews,
    activeUnexpectedEvent: null,
    unexpectedEventsHistory: updatedHistory,
    lastUnexpectedEventDate: state.currentDate,
    processedEventIds: updatedProcessedEventIds
  };
}

export const evaluateDailyUnexpectedEvent = generateUnexpectedEventDaily;
