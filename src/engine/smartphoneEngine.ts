import {
  Club,
  FrontOfficeMessageRecord,
  FrontOfficeProposedAction,
  GameWorldState,
  ManagerJobOffer,
  MatchFixture,
  Player,
  SmartphoneEmail,
  SmartphoneNewsComment,
  SmartphoneNewsPost,
  SmartphoneNotification,
  SmartphoneState
} from '../types/game';
import { getDefaultTacticsForClub } from '../data/squadPopulator';
import { generateDiverseSnsComments } from './socialRumorEngine';

const LEAGUE_LABELS: Record<string, string> = {
  'j1-league': '明治安田J1リーグ',
  'j2-league': '明治安田J2リーグ',
  'j3-league': '明治安田J3リーグ',
  'premier-league': 'プレミアリーグ',
  'championship': 'EFLチャンピオンシップ',
  'laliga': 'ラ・リーガ',
  'segunda-division': 'セグンダ・ディビシオン',
  'bundesliga': 'ブンデスリーガ',
  '2-bundesliga': '2. ブンデスリーガ',
  'serie-a': 'セリエA',
  'serie-b': 'セリエB',
  'ligue-1': 'リーグ・アン',
  'ligue-2': 'リーグ・ドゥ',
  'super-lig': 'スュペル・リグ',
  'primeira-liga': 'リーガ・ポルトガル',
  'eredivisie': 'エールディヴィジ',
  'pro-league': 'ベルギー・プロ・リーグ'
};

export function ensureSmartphoneState(state: GameWorldState): GameWorldState {
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const initialDate = state.currentDate || '2026-07-01';

  if (state.smartphone) {
    const existingFeed = state.smartphone.newsFeed || [];
    const needsStarterUpgrade =
      userClub &&
      existingFeed.some(
        p => p.id.startsWith('sp_news_init_') && (!p.relatedClubId || p.comments.length < 10)
      );

    if (!needsStarterUpgrade) return state;

    const upgradedComments = generateDiverseSnsComments(
      {
        kind: 'club_intro',
        userClub,
        managerName: state.manager.name,
        date: initialDate,
        state
      },
      `init_${userClub.id}_${initialDate}`,
      14
    );

    const upgradedFeed = existingFeed.map(p =>
      p.id.startsWith('sp_news_init_') && (!p.relatedClubId || p.comments.length < 10)
        ? {
            ...p,
            title: `【新体制始動】${userClub.name}が${state.manager.name}監督の下で2026/27シーズンへ`,
            summary: `${userClub.name}は${state.manager.name}監督を新指揮官に迎え、目標「${userClub.target}」の達成に向けてチーム始動を迎えました。`,
            relatedClubId: userClub.id,
            comments: upgradedComments
          }
        : p
    );

    const hasWelcomeMail = state.smartphone.emails.some(e => e.id.startsWith('sp_mail_welcome_'));
    const upgradedEmails = hasWelcomeMail
      ? state.smartphone.emails
      : [
          {
            id: `sp_mail_welcome_${initialDate}`,
            date: initialDate,
            senderType: 'front_office' as const,
            senderName: `${userClub.shortName} 強化部・フロント`,
            senderRole: 'スポーティングディレクター',
            subject: `${state.manager.name}監督への就任ご挨拶と今季方針`,
            body: `${state.manager.name}監督、改めまして${userClub.name}へようこそ。今季のクラブ目標は「${userClub.target}」、移籍予算は€${(userClub.transferBudget / 1000000).toFixed(1)}Mとなっております。補強方針や放出リストのご相談があればいつでもスマホの「フロントとの連絡」からお送りください。`,
            isRead: false,
            isReplied: false
          },
          ...state.smartphone.emails
        ];

    return {
      ...state,
      smartphone: {
        ...state.smartphone,
        newsFeed: upgradedFeed,
        emails: upgradedEmails
      }
    };
  }

  const starterComments = generateDiverseSnsComments(
    {
      kind: 'club_intro',
      userClub,
      managerName: state.manager.name,
      date: initialDate,
      state
    },
    `init_${userClub ? userClub.id : 'world'}_${initialDate}`,
    14
  );

  const starterNews: SmartphoneNewsPost[] = [
    {
      id: `sp_news_init_${initialDate}`,
      date: initialDate,
      title: userClub
        ? `【新体制始動】${userClub.name}が${state.manager.name}監督の下で2026/27シーズンへ`
        : '2026/27シーズン サッカー界の最新動向',
      summary: userClub
        ? `${userClub.name}は${state.manager.name}監督を新指揮官に迎え、目標「${userClub.target}」の達成に向けてチーム始動を迎えました。`
        : '2026/27シーズンの開幕に向けた各クラブの動きが活発化しています。',
      category: 'club',
      relatedClubId: userClub?.id,
      isRead: false,
      comments: starterComments
    }
  ];

  const starterEmails: SmartphoneEmail[] = userClub
    ? [
        {
          id: `sp_mail_welcome_${initialDate}`,
          date: initialDate,
          senderType: 'front_office',
          senderName: `${userClub.shortName} 強化部・フロント`,
          senderRole: 'スポーティングディレクター',
          subject: `${state.manager.name}監督への就任ご挨拶と今季方針`,
          body: `${state.manager.name}監督、改めまして${userClub.name}へようこそ。今季のクラブ目標は「${userClub.target}」、移籍予算は€${(userClub.transferBudget / 1000000).toFixed(1)}Mとなっております。補強方針や放出リストのご相談があればいつでもスマホの「フロントとの連絡」からお送りください。`,
          isRead: false,
          isReplied: false
        }
      ]
    : [];

  const starterNotices: SmartphoneNotification[] = userClub
    ? [
        {
          id: `sp_notice_init_${initialDate}`,
          date: initialDate,
          type: 'board',
          title: 'クラブ公式通達：2026/27シーズン運営開始',
          message: `目標「${userClub.target}」の達成と持続可能なクラブ運営をよろしくお願いいたします。`,
          isRead: false
        }
      ]
    : [];

  const initialSmartphone: SmartphoneState = {
    newsFeed: starterNews,
    emails: starterEmails,
    clubNotices: starterNotices,
    notifications: [],
    frontOfficeThread: [
      {
        id: `fo_init_${initialDate}`,
        date: initialDate,
        sender: 'front_office',
        text: userClub
          ? `${userClub.name}強化部です。補強ターゲットの相談、不要選手の移籍リスト登録、予算配分など何でもお申し付けください。`
          : 'フロント連絡窓口です。',
      }
    ],
    lastEvaluatedDate: initialDate,
    generatedTriggerKeys: []
  };

  return {
    ...state,
    smartphone: initialSmartphone
  };
}

export function getUnreadSmartphoneCount(state: GameWorldState): number {
  const sp = state.smartphone;
  if (!sp) return 0;
  // News, Transfer info, Club notices, and Manager notifications do NOT emit unread notifications.
  // Only genuine actionable items (unread Player DMs & pending Manager Job Offers) count.
  const playerDmUnread = sp.emails.filter(e => e.senderType === 'player' && !e.isRead).length;
  const pendingOffers = (state.managerJobOffers || []).filter(o => o.status === 'pending').length;
  return playerDmUnread + pendingOffers;
}

export function addSmartphoneNotification(
  state: GameWorldState,
  _notif: Omit<SmartphoneNotification, 'id' | 'isRead'>
): GameWorldState {
  // Manager/news/transfer notifications are completely silenced per specification;
  // users inspect News / Transfers / Notices manually inside the Smartphone app.
  return ensureSmartphoneState(state);
}

/**
 * Generates strictly fact-checked fan reactions ("みんなの反応") anchored to real fixture outcomes.
 */
function buildFactCheckedMatchComments(
  fixture: MatchFixture,
  userClub: Club,
  oppClub: Club,
  isUserHome: boolean,
  players: Record<string, Player>,
  managerName: string = '監督',
  boardConfidence: number = 75,
  consecutiveLosses: number = 0,
  state?: GameWorldState
): SmartphoneNewsComment[] {
  return generateDiverseSnsComments(
    {
      kind: 'match',
      fixture,
      userClub,
      oppClub,
      isUserHome,
      players,
      managerName,
      boardConfidence,
      consecutiveLosses,
      state
    },
    `match_${fixture.id}`
  );
}

export function recordMatchSmartphoneUpdate(state: GameWorldState, fixture: MatchFixture): GameWorldState {
  if (!state.userClubId) return state;
  const isUserMatch = fixture.homeClubId === state.userClubId || fixture.awayClubId === state.userClubId;
  if (!isUserMatch) return state;

  const withSp = ensureSmartphoneState(state);
  const sp = withSp.smartphone!;
  const userClub = withSp.clubs[withSp.userClubId!];
  const oppClubId = fixture.homeClubId === withSp.userClubId ? fixture.awayClubId : fixture.homeClubId;
  const oppClub = withSp.clubs[oppClubId];
  if (!userClub || !oppClub) return withSp;

  const isUserHome = fixture.homeClubId === userClub.id;
  const h = fixture.homeScore ?? 0;
  const a = fixture.awayScore ?? 0;
  const uScore = isUserHome ? h : a;
  const oScore = isUserHome ? a : h;

  const resultLabel = uScore > oScore ? '勝利' : uScore < oScore ? '敗戦' : '引き分け';
  const postId = `sp_news_match_${fixture.id}`;
  if (sp.newsFeed.some(n => n.id === postId)) return withSp;

  const post: SmartphoneNewsPost = {
    id: postId,
    date: fixture.date,
    title: `【${fixture.competitionName}】${userClub.name} ${uScore}-${oScore} ${oppClub.name}（${resultLabel}）`,
    summary: `${fixture.date}に行われた${oppClub.name}戦は ${uScore}-${oScore} で${resultLabel}となりました。${fixture.motmPlayerId && withSp.players[fixture.motmPlayerId] ? `MOMは${withSp.players[fixture.motmPlayerId].name}。` : ''}`,
    category: 'match',
    relatedClubId: userClub.id,
    isRead: false,
    comments: buildFactCheckedMatchComments(
      fixture,
      userClub,
      oppClub,
      isUserHome,
      withSp.players,
      withSp.manager.name,
      withSp.boardConfidence,
      withSp.consecutiveLosses,
      withSp
    )
  };

  let nextState: GameWorldState = {
    ...withSp,
    smartphone: {
      ...sp,
      newsFeed: [post, ...sp.newsFeed].slice(0, 60)
    }
  };

  // Evaluate Manager Job Offers on match completion
  nextState = evaluateManagerJobOffers(nextState, fixture.date);
  return nextState;
}

/**
 * Evaluate earned manager job offers based on real club performance, win rate, reputation, and milestones.
 * Prevents day-1 spam or unrealistic giant club offers when underperforming.
 */
export function evaluateManagerJobOffers(
  state: GameWorldState,
  date: string,
  ignoreThrottle: boolean = false
): GameWorldState {
  if (!state.userClubId || state.isSacked) return state;
  const userClub = state.clubs[state.userClubId];
  if (!userClub) return state;

  const withSp = ensureSmartphoneState(state);
  const sp = withSp.smartphone!;
  const existingOffers = [...(withSp.managerJobOffers || [])];
  const pendingCount = existingOffers.filter(o => o.status === 'pending').length;
  if (pendingCount >= 3) return withSp;

  const matches = withSp.manager.matchesManaged || 0;
  // Require meaningful track record (at least 6 managed matches unless unemployed)
  if (!ignoreThrottle && matches < 6 && !withSp.isManagerFreeAgent) return withSp;

  const winRate = matches > 0 ? (withSp.manager.wins || 0) / matches : 0;
  const leagueRows = withSp.standings[userClub.league] || [];
  const rankIdx = leagueRows.findIndex(r => r.clubId === userClub.id);
  const rank = rankIdx >= 0 ? rankIdx + 1 : Math.ceil(leagueRows.length / 2) || 10;
  const totalTeams = leagueRows.length || 20;

  const rep = withSp.manager.reputation || 65;
  const trophies = withSp.manager.careerTrophies || 0;

  // Determine whether current trajectory deserves an external offer
  const overperforming = rank <= Math.max(4, Math.ceil(totalTeams * 0.25)) && winRate >= 0.48;
  const solidRecord = winRate >= 0.42 && withSp.boardConfidence >= 65 && matches >= 10;
  if (!ignoreThrottle && !overperforming && !solidRecord && trophies === 0) return withSp;

  // Throttle offers: at most once every 35 days
  const lastOfferDate = existingOffers[0]?.date;
  if (!ignoreThrottle && lastOfferDate) {
    const diffDays = Math.abs(Math.floor((new Date(date).getTime() - new Date(lastOfferDate).getTime()) / 86400000));
    if (diffDays < 35) return withSp;
  }

  // Filter realistic destination clubs matching manager reputation
  const effectiveScore = rep + (winRate - 0.4) * 25 + trophies * 5 + (overperforming ? 8 : 0);
  const candidateClubs = Object.values(withSp.clubs).filter(c => {
    if (c.id === 'free_agent' || c.id === userClub.id || c.isTournamentOnly || (c.league as string) === 'uefa-tournament') return false;
    if (existingOffers.some(o => o.clubId === c.id && o.status === 'pending')) return false;
    if (c.tier === 'Elite' && effectiveScore < 88) return false;
    if (c.tier === 'Upper' && effectiveScore < 75) return false;
    if (c.tier === 'Mid' && effectiveScore < 58) return false;
    return true;
  });

  if (candidateClubs.length === 0) return withSp;

  // Prefer clubs of similar or +1 tier step up
  const steppedClubs = candidateClubs.filter(c => Math.abs((c.reputation || 70) - Math.min(92, effectiveScore)) <= 14);
  const pool = steppedClubs.length > 0 ? steppedClubs : candidateClubs;
  const pickedClub = pool[Math.floor((date.charCodeAt(date.length - 1) + matches) % pool.length)];

  const offerId = `job_offer_${pickedClub.id}_${date}`;
  const offer: ManagerJobOffer = {
    id: offerId,
    date,
    clubId: pickedClub.id,
    clubName: pickedClub.name,
    leagueKey: pickedClub.league,
    leagueName: LEAGUE_LABELS[pickedClub.league] || pickedClub.league,
    tier: pickedClub.tier,
    weeklyWage: Math.round((pickedClub.wageBudget || 200000) * 0.045 / 1000) * 1000,
    contractYears: 3,
    transferBudget: pickedClub.transferBudget,
    wageBudget: pickedClub.wageBudget,
    target: pickedClub.target,
    fanExpectation: pickedClub.fanExpectation,
    status: 'pending',
    reason: overperforming
      ? `${userClub.name}での上位躍進と手腕（勝率${Math.round(winRate * 100)}%）を高く評価`
      : `安定したチームマネジメントと実績を評価しての正式オファー`,
    reputationRequired: Math.round(effectiveScore),
    negotiationCount: 0,
    message: `${pickedClub.name}役員会より正式な監督就任オファーが届きました。現在の${userClub.name}での指揮実績を高く評価し、目標「${pickedClub.target}」の達成を託したいと考えています。`
  };

  const offerMail: SmartphoneEmail = {
    id: `sp_mail_offer_${offerId}`,
    date,
    senderType: 'club_offer',
    senderId: pickedClub.id,
    senderName: `${pickedClub.name} 取締役会`,
    senderRole: 'クラブ会長・強化責任者',
    subject: `【正式監督オファー】${pickedClub.name} 監督就任のご打診`,
    body: `${state.manager.name}様。${offer.message}\n\n提示条件：契約3年 / 週給 €${offer.weeklyWage.toLocaleString()} / 移籍予算 €${(offer.transferBudget / 1000000).toFixed(1)}M`,
    isRead: false,
    isReplied: false,
    relatedOfferId: offerId
  };

  return {
    ...withSp,
    managerJobOffers: [offer, ...existingOffers].slice(0, 15),
    smartphone: {
      ...sp,
      emails: [offerMail, ...sp.emails].slice(0, 80)
    }
  };
}

type PlayerDmTopic = 'playtime' | 'contract' | 'wage' | 'loan' | 'transfer' | 'role';

function addIsoDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffIsoDays(a: string, b: string): number {
  const ta = new Date(`${a}T00:00:00Z`).getTime();
  const tb = new Date(`${b}T00:00:00Z`).getTime();
  return Math.abs(Math.floor((tb - ta) / 86400000));
}

function deterministicUnitRoll(seedText: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function computeExpectedFairWage(player: Player, club: Club): number {
  const ovr = player.ovr || 70;
  let base = 4000;
  if (ovr >= 90) base = 240000;
  else if (ovr >= 86) base = 150000;
  else if (ovr >= 82) base = 95000;
  else if (ovr >= 78) base = 52000;
  else if (ovr >= 74) base = 26000;
  else if (ovr >= 70) base = 12000;
  else base = 6000;

  if (club.league.startsWith('j')) base *= 0.35;
  else if (club.league !== 'premier-league' && club.league !== 'laliga' && club.league !== 'bundesliga' && club.league !== 'serie-a' && club.league !== 'ligue-1') {
    base *= 0.65;
  }
  return Math.max(2000, Math.round(base));
}

interface PlayerDmCandidate {
  player: Player;
  topic: PlayerDmTopic;
  priority: number;
  buildEmail: (nextDate: string, key: string) => SmartphoneEmail;
}

/**
 * Daily smartphone event processor:
 * - Player DMs ONLY on genuine game conditions with realistic monthly pacing:
 *   - Normal state: 0-2 DMs/month
 *   - Multiple dissatisfaction factors: 1-3 DMs/month
 *   - Critical unresolved issues: higher chance
 *   - Strictly blocks consecutive DMs from the same player and duplicate unresolved topics
 * - Club notices saved passively without emitting unread notification badges
 */
export function processDailySmartphoneEvents(state: GameWorldState, nextDate: string): GameWorldState {
  if (!state.userClubId) return ensureSmartphoneState(state);
  const withSp = ensureSmartphoneState(state);
  const sp = withSp.smartphone!;
  const userClub = withSp.clubs[withSp.userClubId!];
  if (!userClub) return withSp;

  const triggerKeys = new Set(sp.generatedTriggerKeys || []);
  const newEmails: SmartphoneEmail[] = [];
  const newNotices: SmartphoneNotification[] = [];
  const nextCooldowns: Record<string, string> = { ...(sp.playerDmCooldowns || {}) };
  let nextLastPlayerDmDate = sp.lastPlayerDmDate;
  let nextLastPlayerDmPlayerId = sp.lastPlayerDmPlayerId;
  const nextMonthlyCounts = { ...(sp.monthlyPlayerDmCounts || {}) };

  const starterIds = new Set((withSp.tactics?.lineup?.starters || []).map(s => s.playerId));
  const benchIds = new Set(withSp.tactics?.lineup?.bench || []);
  const teamPlayers = userClub.playerIds.map(id => withSp.players[id]).filter(Boolean);
  const seasonMonth = nextDate.slice(0, 7);

  const playerEmailsInHistory = sp.emails.filter(e => e.senderType === 'player');
  const recentPlayerMail = playerEmailsInHistory[0];
  const lastDmDate = recentPlayerMail?.date || sp.lastPlayerDmDate;
  const lastDmPlayerId = recentPlayerMail?.relatedPlayerId || sp.lastPlayerDmPlayerId;
  const daysSinceLastPlayerMail = lastDmDate ? diffIsoDays(lastDmDate, nextDate) : 99;
  const playerMailsThisMonth = playerEmailsInHistory.filter(e => e.date.startsWith(seasonMonth)).length;

  const teamMaxApps = Math.max(1, ...teamPlayers.map(tp => tp.stats?.appearances || 0));

  // Collect all genuine dissatisfaction triggers across the squad
  const candidates: PlayerDmCandidate[] = [];

  for (const p of teamPlayers) {
    if (p.isRetired) continue;
    const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
    const isStarter = starterIds.has(p.id);
    const apps = p.stats?.appearances || 0;
    const playRatio = teamMaxApps >= 4 ? apps / teamMaxApps : 1;
    const yearsLeft = p.contractYearsRemaining ?? p.contractYears ?? 3;

    // 1. Playing time concern (NEVER for starters or >= 45% appearance share)
    if (!isInjured && !isStarter && playRatio < 0.45 && p.ovr >= 70) {
      const wantsPlay = p.squadRole === '絶対的主力' || p.squadRole === '重要選手' || p.personality === '出場機会重視';
      if (wantsPlay) {
        const isCriticalZeroPlay = p.squadRole === '絶対的主力' && apps === 0 && teamMaxApps >= 6;
        candidates.push({
          player: p,
          topic: 'playtime',
          priority: isCriticalZeroPlay ? 96 : p.squadRole === '絶対的主力' ? 82 : 70,
          buildEmail: (date, key) => ({
            id: `sp_mail_${key}`,
            date,
            senderType: 'player',
            senderId: p.id,
            senderName: p.name,
            senderRole: `${p.position} · ${p.squadRole}`,
            subject: '出場機会についてお話しさせてください',
            body: `監督、お忙しいところ失礼します。${p.name}です。最近の試合で先発メンバーから外れることが続いており、自分のコンディションや立場について不安を感じています。今後の起用方針を聞かせていただけませんか？`,
            isRead: false,
            isReplied: false,
            relatedPlayerId: p.id,
            triggerKey: key,
            dmTopic: 'playtime',
            replyOptions: [
              {
                id: 'promise_minutes',
                label: '次の数試合で必ずチャンスを与える',
                replyPreview: 'トレーニングの取り組みは評価している。近い試合で必ず出場の機会を作るので準備しておいてくれ。',
                outcomeDescription: '信頼度 +8 / 満足度 +12（直近起用への期待が高まる）',
                effectType: 'promise_minutes'
              },
              {
                id: 'tactical_explain',
                label: '戦術的バランスと競争の必要性を説く',
                replyPreview: '今は相手との相性と戦術バランスを優先している。チーム内競争に勝てばポジションは戻ってくる。',
                outcomeDescription: '信頼度 +2 / 誠実な対話として納得',
                effectType: 'trust_up'
              },
              {
                id: 'loan_or_transfer',
                label: '出場機会のために移籍/レンタルも容認する',
                replyPreview: '君のキャリアにとって試合に出ることが最優先なら、移籍リストやレンタルでの出場機会確保も検討しよう。',
                outcomeDescription: '信頼度 -3 / 本人をレンタル/移籍リスト候補に柔軟対応',
                effectType: 'loan_allow'
              }
            ]
          })
        });
      }
    }

    // 2. Expiring contract inquiry (<= 1 year left)
    if (yearsLeft <= 1 && p.ovr >= 72) {
      const isCriticalExpiry = yearsLeft <= 0.5 && p.ovr >= 78;
      candidates.push({
        player: p,
        topic: 'contract',
        priority: isCriticalExpiry ? 91 : 68,
        buildEmail: (date, key) => ({
          id: `sp_mail_${key}`,
          date,
          senderType: 'player',
          senderId: p.id,
          senderName: p.name,
          senderRole: `${p.position} · 残契約${p.contractYears}年`,
          subject: '今後の契約と来季の去就について',
          body: `監督、${p.name}です。現在の契約期間が残り少なくなっており、今後のキャリアと契約更新についてクラブや監督と前向きに話し合いたいと考えています。`,
          isRead: false,
          isReplied: false,
          relatedPlayerId: p.id,
          triggerKey: key,
          dmTopic: 'contract',
          replyOptions: [
            {
              id: 'welcome_renewal',
              label: '契約延長を強く望んでいると伝える',
              replyPreview: '君はチームに不可欠な戦力だ。チームハブから正式な契約延長交渉を始めよう。',
              outcomeDescription: '信頼度 +10 / 満足度 +10（契約交渉への好感度上昇）',
              effectType: 'trust_up'
            },
            {
              id: 'wait_performance',
              label: 'シーズン成績を見て判断すると伝える',
              replyPreview: 'ピッチ上での結果を見てからクラブと条件を詰めたい。引き続き全力でプレーしてほしい。',
              outcomeDescription: '信頼度 -2 / 現状維持',
              effectType: 'acknowledge'
            },
            {
              id: 'allow_move',
              label: '新たな挑戦（移籍）も尊重すると伝える',
              replyPreview: 'もし他クラブでの新しい挑戦を望むなら、クラブとして柔軟にオファーを検討する。',
              outcomeDescription: '移籍容認スタンス（移籍リスト連携可能）',
              effectType: 'transfer_allow'
            }
          ]
        })
      });
    }

    // 3. Wage dissatisfaction vs OVR / club level
    const fairWage = computeExpectedFairWage(p, userClub);
    if (!p.isYouthRegen && p.ovr >= 73 && p.wage < fairWage * 0.65 && (p.age >= 21 || p.squadRole !== '若手・育成枠')) {
      const severeUnderpay = p.wage < fairWage * 0.48 || p.personality === '給与重視';
      candidates.push({
        player: p,
        topic: 'wage',
        priority: severeUnderpay ? 79 : 60,
        buildEmail: (date, key) => ({
          id: `sp_mail_${key}`,
          date,
          senderType: 'player',
          senderId: p.id,
          senderName: p.name,
          senderRole: `${p.position} · 週給 €${p.wage.toLocaleString()}`,
          subject: '現在の年俸・契約条件の見直しのお願い',
          body: `監督、恐れ入ります。${p.name}です。チーム内での役割や現在の実力を踏まえ、週給条件について一度見直しをご相談できないかと考えています。チームハブで交渉の場をいただけないでしょうか。`,
          isRead: false,
          isReplied: false,
          relatedPlayerId: p.id,
          triggerKey: key,
          dmTopic: 'wage',
          replyOptions: [
            {
              id: 'promise_wage_review',
              label: 'チームハブで昇給交渉を行うと約束する',
              replyPreview: '貢献度に見合う条件を検討する価値がある。近日中にチームハブで条件を見直そう。',
              outcomeDescription: '信頼度 +5 / 満足度 +8',
              effectType: 'wage_talk'
            },
            {
              id: 'explain_budget_cap',
              label: 'クラブの給与枠の制約を丁寧に説明する',
              replyPreview: '評価はしているが今はクラブ全体の給与バランスを守る必要がある。活躍を続ければ必ず考慮する。',
              outcomeDescription: '信頼度 +2 / 現状維持',
              effectType: 'acknowledge'
            }
          ]
        })
      });
    }

    // 4. Young player loan request
    if (!isInjured && !isStarter && !p.isLoaned && !p.isLoanListed && p.age <= 22 && p.ovr >= 63 && p.ovr <= 77 && teamMaxApps >= 5 && apps <= 1) {
      candidates.push({
        player: p,
        topic: 'loan',
        priority: 58,
        buildEmail: (date, key) => ({
          id: `sp_mail_${key}`,
          date,
          senderType: 'player',
          senderId: p.id,
          senderName: p.name,
          senderRole: `${p.position} · ${p.age}歳`,
          subject: '成長のためのレンタル移籍について相談',
          body: `監督、${p.name}です。トップチームで出場機会を得るのは簡単な競争ではないと感じています。もし当面の出番が限られるなら、実戦経験を積むためにレンタル移籍も検討していただけないでしょうか？`,
          isRead: false,
          isReplied: false,
          relatedPlayerId: p.id,
          triggerKey: key,
          dmTopic: 'loan',
          replyOptions: [
            {
              id: 'approve_loan',
              label: 'レンタルリストへ登録し実戦機会を探す',
              replyPreview: '試合経験を積むことは成長に不可欠だ。レンタルで成長できるクラブを探そう。',
              outcomeDescription: '信頼度 +4 / レンタルリスト登録',
              effectType: 'loan_allow'
            },
            {
              id: 'keep_for_cup',
              label: 'チームに残してカップ戦や交代で起用すると伝える',
              replyPreview: '過密日程の中で必ず君の力が必要になる。チームに残ってアピールを続けてくれ。',
              outcomeDescription: '信頼度 +3 / チーム残留',
              effectType: 'trust_up'
            }
          ]
        })
      });
    }

    // 5. Senior player transfer wish due to low morale / frozen out
    if (!isStarter && !p.isTransferListed && p.age >= 23 && ((p.satisfaction ?? 75) < 58 || (p.managerTrust ?? 70) < 58 || (teamMaxApps >= 8 && apps <= 1 && p.ovr >= 74))) {
      const isCritical = (p.satisfaction ?? 75) < 46 || (p.managerTrust ?? 70) < 46;
      candidates.push({
        player: p,
        topic: 'transfer',
        priority: isCritical ? 90 : 75,
        buildEmail: (date, key) => ({
          id: `sp_mail_${key}`,
          date,
          senderType: 'player',
          senderId: p.id,
          senderName: p.name,
          senderRole: `${p.position} · ${p.squadRole}`,
          subject: '移籍について前向きに検討させてほしい',
          body: `監督、率直にお伝えします。現在の自分の状況や起用バランスを踏まえると、他クラブで新たな環境を求めるべき時期ではないかと考えています。移籍市場での動きを容認していただけますか？`,
          isRead: false,
          isReplied: false,
          relatedPlayerId: p.id,
          triggerKey: key,
          dmTopic: 'transfer',
          replyOptions: [
            {
              id: 'accept_transfer_request',
              label: '移籍を容認し移籍リストへ登録する',
              replyPreview: '希望は理解した。双方にとって良い条件が届けば移籍を前向きに進めよう。',
              outcomeDescription: '移籍リスト登録',
              effectType: 'transfer_allow'
            },
            {
              id: 'convince_to_stay',
              label: 'チームに不可欠だと説得し慰留する',
              replyPreview: '簡単には手放せない。今後の起用と対話を通じて信頼関係を取り戻したい。',
              outcomeDescription: '信頼度 +5 / 満足度 +6',
              effectType: 'trust_up'
            }
          ]
        })
      });
    }

    // 6. Squad role dissatisfaction (star player stuck in backup/rotation role)
    if (p.ovr >= 82 && (p.squadRole === '控え・バックアップ' || p.squadRole === 'ローテーション') && teamMaxApps >= 4 && playRatio < 0.55) {
      candidates.push({
        player: p,
        topic: 'role',
        priority: 71,
        buildEmail: (date, key) => ({
          id: `sp_mail_${key}`,
          date,
          senderType: 'player',
          senderId: p.id,
          senderName: p.name,
          senderRole: `${p.position} · OVR ${p.ovr}`,
          subject: 'チーム内の序列・役割設定について',
          body: `監督、${p.name}です。現在の自分の実力であれば主力の一角としてチームを牽引できると自負しています。チーム内での位置づけ（役割設定）を見直していただけないでしょうか。`,
          isRead: false,
          isReplied: false,
          relatedPlayerId: p.id,
          triggerKey: key,
          dmTopic: 'role',
          replyOptions: [
            {
              id: 'review_role',
              label: 'チームハブで役割の見直しを検討する',
              replyPreview: '実力は認めている。チームハブで役割と契約条件のバランスを見直そう。',
              outcomeDescription: '信頼度 +6 / 満足度 +8',
              effectType: 'trust_up'
            },
            {
              id: 'maintain_hierarchy',
              label: '現状の役割でプロとしての貢献を求める',
              replyPreview: 'チーム全体のバランス上の判断だ。どの役割でも結果を出し続けてほしい。',
              outcomeDescription: '信頼度 -2 / 現状維持',
              effectType: 'acknowledge'
            }
          ]
        })
      });
    }
  }

  // Filter out anti-spam violations:
  // - NEVER consecutive DM from the same player
  // - NEVER send to a player who already has an unreplied DM
  // - NEVER repeat an unresolved / recently sent (<= 55 days) topic for the same player
  // - Enforce >= 25 days per-player cooldown across any topic
  const eligible = candidates
    .filter(c => {
      const pId = c.player.id;
      if (lastDmPlayerId && pId === lastDmPlayerId) return false;
      const hasUnreplied = playerEmailsInHistory.some(e => e.relatedPlayerId === pId && !e.isReplied);
      if (hasUnreplied) return false;

      const sameTopicRecent = playerEmailsInHistory.some(
        e =>
          e.relatedPlayerId === pId &&
          (e.dmTopic === c.topic || e.triggerKey?.startsWith(`${c.topic}_${pId}`)) &&
          diffIsoDays(e.date, nextDate) < 55
      );
      if (sameTopicRecent) return false;

      const topicCd = nextCooldowns[`${pId}_${c.topic}`];
      if (topicCd && topicCd > nextDate) return false;

      const playerCd = nextCooldowns[`player_${pId}`];
      if (playerCd && playerCd > nextDate) return false;

      return true;
    })
    .sort((a, b) => b.priority - a.priority);

  if (eligible.length > 0) {
    const distinctIssuePlayers = new Set(candidates.map(c => c.player.id)).size;
    const topCandidate = eligible[0];
    const hasCritical = topCandidate.priority >= 90;
    const hasMultiIssue = distinctIssuePlayers >= 2;
    const monthlyCap = hasMultiIssue ? 3 : 2;
    const minGapDays = hasCritical ? 7 : hasMultiIssue ? 8 : 13;

    if (playerMailsThisMonth < monthlyCap && daysSinceLastPlayerMail >= minGapDays) {
      let shouldSend = false;
      if (hasCritical) {
        shouldSend = true;
      } else {
        const roll = deterministicUnitRoll(`${nextDate}_${userClub.id}_${topCandidate.player.id}_${topCandidate.topic}`);
        if (hasMultiIssue) {
          shouldSend = daysSinceLastPlayerMail >= 11 || roll < 0.38;
        } else {
          // Normal state: average 0-2 DMs per month
          shouldSend = daysSinceLastPlayerMail >= 15 && roll < 0.30;
        }
      }

      if (shouldSend) {
        const key = `${topCandidate.topic}_${topCandidate.player.id}_${nextDate}`;
        triggerKeys.add(key);
        newEmails.push(topCandidate.buildEmail(nextDate, key));
        nextLastPlayerDmDate = nextDate;
        nextLastPlayerDmPlayerId = topCandidate.player.id;
        nextMonthlyCounts[seasonMonth] = playerMailsThisMonth + 1;
        nextCooldowns[`${topCandidate.player.id}_${topCandidate.topic}`] = addIsoDays(nextDate, 55);
        nextCooldowns[`player_${topCandidate.player.id}`] = addIsoDays(nextDate, 28);
      }
    }
  }

  // Monthly Front Office / Club Notice check (saved passively on 1st or 15th; zero notification badge)
  const dayNum = parseInt(nextDate.slice(8, 10), 10);
  if ((dayNum === 1 || dayNum === 15) && !triggerKeys.has(`fo_notice_${nextDate}`)) {
    triggerKeys.add(`fo_notice_${nextDate}`);
    const injuredCount = teamPlayers.filter(p => p.injuryStatus === 'INJURED' || p.injury?.isInjured).length;
    const expiringCount = teamPlayers.filter(p => (p.contractYearsRemaining ?? p.contractYears ?? 3) <= 1).length;
    newNotices.push({
      id: `sp_notice_club_${nextDate}`,
      date: nextDate,
      type: 'board',
      title: `クラブ定例レポート（${nextDate}）`,
      message: `残り移籍予算 €${(userClub.transferBudget / 1000000).toFixed(1)}M / 負傷者 ${injuredCount}名 / 契約残1年以下 ${expiringCount}名。${expiringCount > 0 ? 'チームハブから契約更新をご検討ください。' : 'チーム状態は安定しています。'}`,
      isRead: true
    });
  }

  void benchIds;
  return {
    ...withSp,
    smartphone: {
      ...sp,
      emails: [...newEmails, ...sp.emails].slice(0, 80),
      clubNotices: [...newNotices, ...sp.clubNotices].slice(0, 60),
      lastEvaluatedDate: nextDate,
      generatedTriggerKeys: Array.from(triggerKeys).slice(-200),
      lastPlayerDmDate: nextLastPlayerDmDate,
      lastPlayerDmPlayerId: nextLastPlayerDmPlayerId,
      monthlyPlayerDmCounts: nextMonthlyCounts,
      playerDmCooldowns: nextCooldowns
    }
  };
}

export function respondToPlayerEmail(
  state: GameWorldState,
  emailId: string,
  replyOptionId: string
): GameWorldState {
  const withSp = ensureSmartphoneState(state);
  const sp = withSp.smartphone!;
  const email = sp.emails.find(e => e.id === emailId);
  if (!email || email.isReplied) return withSp;

  const option = email.replyOptions?.find(o => o.id === replyOptionId);
  if (!option) return withSp;

  const updatedPlayers = { ...withSp.players };
  if (email.relatedPlayerId && updatedPlayers[email.relatedPlayerId]) {
    const p = { ...updatedPlayers[email.relatedPlayerId] };
    let trust = p.managerTrust ?? 70;
    let sat = p.satisfaction ?? 75;

    switch (option.effectType) {
      case 'trust_up':
        trust = Math.min(100, trust + 8);
        sat = Math.min(100, sat + 10);
        break;
      case 'promise_minutes':
        trust = Math.min(100, trust + 8);
        sat = Math.min(100, sat + 12);
        break;
      case 'wage_talk':
        trust = Math.min(100, trust + 5);
        sat = Math.min(100, sat + 8);
        break;
      case 'trust_down':
        trust = Math.max(10, trust - 6);
        sat = Math.max(10, sat - 8);
        break;
      case 'transfer_allow':
        p.isTransferListed = true;
        p.transferListed = true;
        break;
      case 'loan_allow':
        p.isLoanListed = true;
        p.loanListed = true;
        break;
      default:
        trust = Math.min(100, trust + 3);
        break;
    }

    p.managerTrust = trust;
    p.satisfaction = sat;
    updatedPlayers[p.id] = p;
  }

  const updatedEmails = sp.emails.map(e =>
    e.id === emailId
      ? {
          ...e,
          isRead: true,
          isReplied: true,
          replyChosenLabel: option.label,
          replyText: option.replyPreview,
          replyDate: withSp.currentDate
        }
      : e
  );

  const nextCooldowns = { ...(sp.playerDmCooldowns || {}) };
  if (email.relatedPlayerId && email.dmTopic) {
    nextCooldowns[`${email.relatedPlayerId}_${email.dmTopic}`] = addIsoDays(withSp.currentDate, 55);
  }

  return {
    ...withSp,
    players: updatedPlayers,
    smartphone: {
      ...sp,
      emails: updatedEmails,
      playerDmCooldowns: nextCooldowns
    }
  };
}

export function respondToManagerJobOffer(
  state: GameWorldState,
  offerId: string,
  action: 'accept' | 'decline' | 'negotiate'
): { state: GameWorldState; message: string } {
  const withSp = ensureSmartphoneState(state);
  const sp = withSp.smartphone!;
  const offers = [...(withSp.managerJobOffers || [])];
  const idx = offers.findIndex(o => o.id === offerId);
  if (idx === -1) return { state: withSp, message: 'オファーが見つかりません。' };

  const offer = offers[idx];

  if (action === 'decline') {
    offers[idx] = { ...offer, status: 'declined' };
    return {
      state: {
        ...withSp,
        managerJobOffers: offers,
        smartphone: {
          ...sp,
          emails: sp.emails.map(e =>
            e.relatedOfferId === offerId ? { ...e, isRead: true, isReplied: true, replyChosenLabel: 'オファーを辞退', replyDate: withSp.currentDate } : e
          )
        }
      },
      message: `${offer.clubName}からの監督就任オファーを辞退しました。`
    };
  }

  if (action === 'negotiate') {
    if ((offer.negotiationCount || 0) >= 2) {
      return { state: withSp, message: `${offer.clubName}とはこれ以上の条件引き上げ交渉はできません。` };
    }
    const improvedWage = Math.round(offer.weeklyWage * 1.12 / 1000) * 1000;
    const improvedBudget = Math.round(offer.transferBudget * 1.08);
    offers[idx] = {
      ...offer,
      weeklyWage: improvedWage,
      transferBudget: improvedBudget,
      negotiationCount: (offer.negotiationCount || 0) + 1,
      wageNegotiated: true
    };
    return {
      state: {
        ...withSp,
        managerJobOffers: offers
      },
      message: `条件交渉が成立！週給 €${improvedWage.toLocaleString()}、移籍予算 €${(improvedBudget / 1000000).toFixed(1)}M へ引き上げられました。`
    };
  }

  // ACCEPT -> Transition manager cleanly while preserving career history, trophies, stats
  const targetClub = withSp.clubs[offer.clubId];
  if (!targetClub) return { state: withSp, message: '移行先クラブが見つかりません。' };

  const oldClubId = withSp.userClubId;
  const pastManagedClubIds = Array.from(new Set([...(withSp.pastManagedClubIds || []), ...(oldClubId ? [oldClubId] : [])]));

  const updatedClubs = { ...withSp.clubs };
  if (oldClubId && updatedClubs[oldClubId]) {
    updatedClubs[oldClubId] = { ...updatedClubs[oldClubId], isUserClub: false };
  }
  updatedClubs[targetClub.id] = {
    ...updatedClubs[targetClub.id],
    isUserClub: true,
    transferBudget: offer.transferBudget
  };

  const newTactics = getDefaultTacticsForClub(updatedClubs[targetClub.id], withSp.players);
  const updatedFixtures = withSp.fixtures.map(f => ({
    ...f,
    isUserMatch: (f.homeClubId === targetClub.id || f.awayClubId === targetClub.id) && f.status === 'upcoming'
  }));

  offers[idx] = { ...offer, status: 'accepted' };
  const remainingOffers = offers.map((o, i) => (i === idx ? o : o.status === 'pending' ? { ...o, status: 'declined' as const } : o));

  const moveNewsTitle = `【監督電撃就任】${withSp.manager.name}監督が${targetClub.name}の新指揮官に就任！`;

  return {
    state: {
      ...withSp,
      userClubId: targetClub.id,
      isManagerFreeAgent: false,
      managerAppointmentDate: withSp.currentDate,
      pastManagedClubIds,
      boardConfidence: 85,
      fanApproval: 80,
      consecutiveLosses: 0,
      consecutiveWinless: 0,
      clubs: updatedClubs,
      tactics: newTactics,
      fixtures: updatedFixtures,
      managerJobOffers: remainingOffers,
      news: [
        {
          id: `news_mgr_move_${Date.now()}`,
          date: withSp.currentDate,
          headline: moveNewsTitle,
          body: `${withSp.manager.name}監督が${targetClub.name}からの正式オファーを受諾し、新指揮官として契約を締結しました。これまでのキャリア通算実績（${withSp.manager.wins}勝・タイトル${withSp.manager.careerTrophies}回）はそのまま引き継がれます。`,
          category: 'board',
          relatedClubId: targetClub.id,
          importance: 'high'
        },
        ...withSp.news
      ],
      smartphone: {
        ...sp,
        emails: sp.emails.map(e =>
          e.relatedOfferId === offerId ? { ...e, isRead: true, isReplied: true, replyChosenLabel: 'オファーを受諾・就任', replyDate: withSp.currentDate } : e
        ),
        clubNotices: [
          {
            id: `sp_notice_join_${Date.now()}`,
            date: withSp.currentDate,
            type: 'board',
            title: `${targetClub.name} 監督就任完了`,
            message: `ようこそ${targetClub.name}へ！目標「${targetClub.target}」に向けて全力を尽くしましょう。`,
            isRead: false
          },
          ...sp.clubNotices
        ]
      }
    },
    message: `${targetClub.name}の監督に正式就任しました！`
  };
}

export function applyFrontOfficeProposedAction(
  state: GameWorldState,
  messageId: string
): { state: GameWorldState; message: string } {
  const withSp = ensureSmartphoneState(state);
  const sp = withSp.smartphone!;
  const msgIdx = sp.frontOfficeThread.findIndex(m => m.id === messageId);
  if (msgIdx === -1) return { state: withSp, message: '対象メッセージが見つかりません。' };

  const msg = sp.frontOfficeThread[msgIdx];
  const action = msg.proposedAction;
  if (!action || action.applied || action.type === 'none') {
    return { state: withSp, message: '実行可能なアクションがありません。' };
  }

  let updatedPlayers = { ...withSp.players };
  let updatedClubs = { ...withSp.clubs };
  let resultMsg = 'フロントとの合意事項を実行しました。';

  if ((action.type === 'transfer_list' || action.type === 'loan_list') && action.targetPlayerId && updatedPlayers[action.targetPlayerId]) {
    const p = { ...updatedPlayers[action.targetPlayerId] };
    if (action.type === 'transfer_list') {
      p.isTransferListed = true;
      p.transferListed = true;
      resultMsg = `${p.name}を正式に移籍リストへ登録しました。`;
    } else {
      p.isLoanListed = true;
      p.loanListed = true;
      resultMsg = `${p.name}を期限付き移籍（レンタル）リストへ登録しました。`;
    }
    updatedPlayers[p.id] = p;
  } else if (action.type === 'budget_rebalance' && withSp.userClubId && updatedClubs[withSp.userClubId]) {
    const club = { ...updatedClubs[withSp.userClubId] };
    const shift = Math.min(2000000, Math.round(club.transferBudget * 0.1));
    club.transferBudget = Math.max(0, club.transferBudget - shift);
    club.wageBudget = club.wageBudget + Math.round(shift / 52);
    updatedClubs[club.id] = club;
    resultMsg = `移籍予算から€${(shift / 1000000).toFixed(1)}Mを週給予算枠(+€${Math.round(shift / 52).toLocaleString()}/週)へ再配分しました。`;
  }

  const nextThread = [...sp.frontOfficeThread];
  nextThread[msgIdx] = {
    ...msg,
    proposedAction: { ...action, applied: true }
  };
  nextThread.push({
    id: `fo_confirm_${Date.now()}`,
    date: withSp.currentDate,
    sender: 'front_office',
    text: `【承認・実行完了】${resultMsg}`
  });

  return {
    state: {
      ...withSp,
      players: updatedPlayers,
      clubs: updatedClubs,
      smartphone: {
        ...sp,
        frontOfficeThread: nextThread
      }
    },
    message: resultMsg
  };
}

/**
 * Builds rich squad, formation, weakness, and affordable market target context for Front Office AI.
 */
export function analyzeFrontOfficeSquadContext(state: GameWorldState): {
  formation: string;
  weaknessesSummary: string;
  squadSummary: Array<{
    id: string;
    name: string;
    position: string;
    ovr: number;
    age: number;
    fatigue: number;
    marketValue: number;
    wage: number;
    contractYears: number;
    squadStatus?: string;
  }>;
  marketTargets: Array<{
    id: string;
    name: string;
    position: string;
    ovr: number;
    age: number;
    potential: number;
    marketValue: number;
    clubName: string;
  }>;
} {
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const squadPlayers = (userClub?.playerIds || [])
    .map(id => state.players[id])
    .filter(Boolean)
    .sort((a, b) => b.ovr - a.ovr);

  const squadSummary = squadPlayers.slice(0, 35).map(p => ({
    id: p.id,
    name: p.name,
    position: p.position,
    ovr: p.ovr,
    age: p.age,
    fatigue: p.fatigue ?? 0,
    marketValue: p.marketValue,
    wage: p.wage,
    contractYears: p.contractYearsRemaining ?? p.contractYears ?? 2,
    squadStatus: p.squadStatus
  }));

  const formation = state.tactics?.formation || userClub?.currentFormation || '4-3-3';
  const starterIds = new Set((state.tactics?.lineup?.starters || []).map(s => s.playerId));
  const starters = squadPlayers.filter(p => starterIds.has(p.id));
  const cbCount = squadPlayers.filter(p => p.position === 'CB').length;
  const stCount = squadPlayers.filter(p => ['ST', 'CF'].includes(p.position)).length;
  const gkCount = squadPlayers.filter(p => p.position === 'GK').length;
  const midAvg = (() => {
    const m = squadPlayers.filter(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position));
    return m.length > 0 ? Math.round(m.reduce((s, p) => s + p.ovr, 0) / m.length) : 0;
  })();
  const defAvg = (() => {
    const d = squadPlayers.filter(p => ['CB', 'RB', 'LB', 'LWB', 'RWB'].includes(p.position));
    return d.length > 0 ? Math.round(d.reduce((s, p) => s + p.ovr, 0) / d.length) : 0;
  })();
  const attAvg = (() => {
    const a = squadPlayers.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p.position));
    return a.length > 0 ? Math.round(a.reduce((s, p) => s + p.ovr, 0) / a.length) : 0;
  })();
  const highFatigue = starters.filter(p => (p.fatigue ?? 0) >= 60).length;
  const agingStarters = starters.filter(p => p.age >= 32).length;
  const expiringCount = squadPlayers.filter(p => (p.contractYearsRemaining ?? p.contractYears ?? 2) <= 1).length;

  const weaknessNotes: string[] = [];
  if (gkCount < 2) weaknessNotes.push('GK層が薄い');
  if (cbCount < 3) weaknessNotes.push(`CBが${cbCount}名と薄く枚数補強推奨`);
  if (stCount < 2) weaknessNotes.push(`生粋のST/CFが${stCount}名のみ`);
  if (defAvg > 0 && defAvg <= Math.min(midAvg || 99, attAvg || 99) - 2) weaknessNotes.push(`守備陣平均OVR(${defAvg})が他セクションより低め`);
  if (attAvg > 0 && attAvg <= Math.min(midAvg || 99, defAvg || 99) - 2) weaknessNotes.push(`攻撃陣平均OVR(${attAvg})の底上げ余地あり`);
  if (agingStarters >= 3) weaknessNotes.push(`主力に32歳以上が${agingStarters}名おり世代交代検討`);
  if (highFatigue >= 2) weaknessNotes.push(`スタメン${highFatigue}名が高疲労`);
  if (expiringCount >= 3) weaknessNotes.push(`残契約1年以下が${expiringCount}名`);

  const weaknessesSummary = weaknessNotes.length > 0
    ? weaknessNotes.join(' / ')
    : `GK:${gkCount}・DF平均${defAvg}・MF平均${midAvg}・FW平均${attAvg}（全体バランス良好）`;

  const maxAffordable = Math.max(5000000, (userClub?.transferBudget || 0) * 1.15);
  const eligibleMarket = Object.values(state.players).filter(p => {
    if (!p || p.id.startsWith('euro_synth_')) return false;
    if (p.clubId === state.userClubId) return false;
    const c = state.clubs[p.clubId];
    if (c && (c.isTournamentOnly || (c.league as string) === 'uefa-tournament')) return false;
    return p.marketValue <= maxAffordable;
  });

  const pickedMap = new Map<string, Player>();
  const addTop = (list: Player[], limit: number) => {
    for (const p of list) {
      if (pickedMap.size >= 40) break;
      if (!pickedMap.has(p.id)) {
        pickedMap.set(p.id, p);
        limit--;
        if (limit <= 0) break;
      }
    }
  };

  // Top overall affordable
  addTop([...eligibleMarket].sort((a, b) => b.ovr - a.ovr), 12);
  // Young U23 CB/DF/MF/FW prospects
  addTop(eligibleMarket.filter(p => p.age <= 23 && p.position === 'CB').sort((a, b) => b.potential - a.potential || b.ovr - a.ovr), 6);
  addTop(eligibleMarket.filter(p => p.age <= 23 && ['ST', 'CF', 'LW', 'RW'].includes(p.position)).sort((a, b) => b.potential - a.potential || b.ovr - a.ovr), 6);
  addTop(eligibleMarket.filter(p => p.age <= 23 && ['CDM', 'CM', 'CAM', 'RB', 'LB', 'GK'].includes(p.position)).sort((a, b) => b.potential - a.potential || b.ovr - a.ovr), 6);
  // <= 50M value ST/CB bargains
  addTop(eligibleMarket.filter(p => p.marketValue <= 50000000 && ['ST', 'CF'].includes(p.position)).sort((a, b) => b.ovr - a.ovr), 5);
  addTop(eligibleMarket.filter(p => p.marketValue <= 50000000 && ['CB', 'CDM', 'CM'].includes(p.position)).sort((a, b) => b.ovr - a.ovr), 5);

  const marketTargets = Array.from(pickedMap.values()).map(p => ({
    id: p.id,
    name: p.name,
    position: p.position,
    ovr: p.ovr,
    age: p.age,
    potential: p.potential,
    marketValue: p.marketValue,
    clubName: state.clubs[p.clubId]?.name || '無所属'
  }));

  return {
    formation,
    weaknessesSummary,
    squadSummary,
    marketTargets
  };
}

/**
 * Local deterministic fallback generator for Front Office reply if backend API is unavailable.
 */
export function buildDeterministicFrontOfficeReply(
  state: GameWorldState,
  userMessage: string
): {
  reply: string;
  analysisSummary?: string;
  recommendations?: FrontOfficeMessageRecord['recommendations'];
  proposedAction?: FrontOfficeProposedAction;
} {
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const squad = userClub ? userClub.playerIds.map(id => state.players[id]).filter(Boolean) : [];
  const ctx = analyzeFrontOfficeSquadContext(state);
  const lower = userMessage.toLowerCase();

  const mentionedPlayer = squad.find(p =>
    userMessage.includes(p.name) ||
    p.name.split(/\s+/).some(part => part.length >= 2 && userMessage.includes(part))
  );

  if (lower.includes('売') || lower.includes('放出') || lower.includes('移籍リスト') || lower.includes('sell') || lower.includes('整理')) {
    const targetP = mentionedPlayer || [...squad].sort((a, b) => a.ovr - b.ovr)[0];
    if (targetP) {
      return {
        reply: `承知いたしました。${targetP.name}（${targetP.position} / OVR ${targetP.ovr} / 推定価値 €${(targetP.marketValue / 1000000).toFixed(1)}M）の移籍リスト登録について、オファー獲得に動きます。下の承認ボタンで確定してください（自動実行はしません）。`,
        analysisSummary: `${userClub?.name || 'クラブ'}の枠確保と給与圧縮のための現実的な売却候補です。`,
        recommendations: [{
          category: 'squad',
          title: `売却検討: ${targetP.name}`,
          detail: `${targetP.position} · OVR ${targetP.ovr} · 推定価値 €${(targetP.marketValue / 1000000).toFixed(1)}M`,
          targetPlayerId: targetP.id,
          targetPlayerName: targetP.name
        }],
        proposedAction: {
          type: 'transfer_list',
          targetPlayerId: targetP.id,
          targetPlayerName: targetP.name,
          summary: `${targetP.name} を移籍リストに登録する`,
          requiresConfirmation: true
        }
      };
    }
  }

  if (mentionedPlayer && (lower.includes('レンタル') || lower.includes('loan') || lower.includes('武者修行'))) {
    return {
      reply: `了解しました。${mentionedPlayer.name}（${mentionedPlayer.age}歳）の成長機会のため、レンタル移籍リストへ登録して獲得先を募りましょう。実行ボタンを押してください。`,
      proposedAction: {
        type: 'loan_list',
        targetPlayerId: mentionedPlayer.id,
        targetPlayerName: mentionedPlayer.name,
        summary: `${mentionedPlayer.name} をレンタルリストに登録する`,
        requiresConfirmation: true
      }
    };
  }

  if (lower.includes('予算') || lower.includes('給料') || lower.includes('週給') || lower.includes('資金') || lower.includes('budget')) {
    const availWage = userClub ? Math.max(0, userClub.wageBudget - userClub.currentWageSpend) : 0;
    return {
      reply: `現在の${userClub?.name || 'クラブ'}の財務状況は、移籍予算 €${((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M、週給空き枠 €${availWage.toLocaleString()}/週 となっております。移籍予算の一部を週給枠へ回すことも可能です。`,
      proposedAction: userClub && userClub.transferBudget >= 2000000
        ? {
            type: 'budget_rebalance',
            summary: '移籍予算の10%（最大€2.0M）を週給予算枠へ再配分する',
            requiresConfirmation: true
          }
        : undefined
    };
  }

  const wantsYoung = lower.includes('若手') || lower.includes('young');
  const capMatch = userMessage.match(/(\d+)\s*[mM]/);
  const cap = capMatch ? Number(capMatch[1]) * 1000000 : null;
  let candidates = [...ctx.marketTargets];
  if (userMessage.includes('CB')) candidates = candidates.filter(c => c.position === 'CB');
  else if (userMessage.includes('ST') || userMessage.includes('CF')) candidates = candidates.filter(c => ['ST', 'CF'].includes(c.position));
  else if (userMessage.includes('GK')) candidates = candidates.filter(c => c.position === 'GK');
  if (wantsYoung) candidates = candidates.filter(c => c.age <= 23);
  if (cap) candidates = candidates.filter(c => c.marketValue <= cap);

  const picks = candidates.sort((a, b) => b.ovr - a.ovr).slice(0, 3);
  if (picks.length > 0 && (lower.includes('補強') || lower.includes('探') || lower.includes('弱点') || lower.includes('弱い') || lower.includes('ポジション'))) {
    const names = picks.map(p => `${p.name}(${p.position}/OVR${p.ovr}/€${(p.marketValue / 1000000).toFixed(1)}M)`).join('、');
    return {
      reply: `現在の編成（${ctx.formation}）と課題（${ctx.weaknessesSummary}）に基づき、実在の獲得候補を抽出しました：${names}。移籍市場タブから詳細交渉をご検討ください。`,
      analysisSummary: `${userClub?.name || 'クラブ'}（移籍予算 €${((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M）の補強分析結果です。`,
      recommendations: picks.map(p => ({
        category: 'reinforce',
        title: `${p.name} (${p.clubName})`,
        detail: `${p.position} · ${p.age}歳 · OVR ${p.ovr} (POT ${p.potential}) · €${(p.marketValue / 1000000).toFixed(1)}M`,
        targetPlayerId: p.id,
        targetPlayerName: p.name
      }))
    };
  }

  return {
    reply: `${userClub?.name || 'クラブ'}強化部です。現状の編成分析（${ctx.weaknessesSummary}）と予算 €${((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M を踏まえ、補強・放出・予算相談にお応えします。ご希望の条件をお知らせください。`,
    analysisSummary: `フォーメーション ${ctx.formation} / ${ctx.weaknessesSummary}`
  };
}
