import {
  Player,
  Club,
  TransferNegotiation,
  NewsItem,
  GameWorldState,
  IncomingAIOffer,
  PendingTransfer,
  PlayerInterestTier,
  CompetingOffer,
  LeagueKey,
  StandingsRow,
  TournamentCompetitionsState
} from '../types/game';
import { addDays, isTransferWindow } from './dateEngine';

// Realistic Derby & Direct Rivalry Mapping across all 6 leagues
export const CLUB_RIVALRIES: Record<string, string[]> = {
  // Premier League
  arsenal: ['tottenham', 'chelsea', 'man_united'],
  tottenham: ['arsenal', 'chelsea', 'west_ham'],
  chelsea: ['arsenal', 'tottenham', 'fulham'],
  liverpool: ['man_united', 'everton', 'man_city'],
  man_united: ['liverpool', 'man_city', 'arsenal'],
  man_city: ['man_united', 'liverpool'],
  aston_villa: ['wolves', 'birmingham'],
  wolves: ['aston_villa'],
  crystal_palace: ['brighton'],
  brighton: ['crystal_palace'],
  newcastle: ['sunderland'],
  southampton: ['portsmouth', 'bournemouth'],
  bournemouth: ['southampton'],
  everton: ['liverpool'],
  fulham: ['chelsea', 'brentford'],
  brentford: ['fulham'],
  nottingham_forest: ['leicester', 'derby'],
  leicester: ['nottingham_forest'],
  ipswich: ['norwich'],

  // LaLiga
  real_madrid: ['barcelona', 'atletico_madrid'],
  barcelona: ['real_madrid', 'espanyol', 'atletico_madrid'],
  atletico_madrid: ['real_madrid', 'barcelona'],
  athletic_club: ['real_sociedad'],
  real_sociedad: ['athletic_club'],
  real_betis: ['sevilla'],
  sevilla: ['real_betis'],
  valencia: ['villarreal', 'levante'],
  villarreal: ['valencia'],
  celta_vigo: ['deportivo'],
  girona: ['espanyol', 'barcelona'],
  espanyol: ['barcelona', 'girona'],
  rayo_vallecano: ['getafe', 'leganes', 'real_madrid'],
  getafe: ['leganes', 'rayo_vallecano'],
  leganes: ['getafe', 'rayo_vallecano'],

  // Bundesliga
  bayern: ['dortmund', 'mgladbach', 'leverkusen'],
  dortmund: ['schalke', 'bayern', 'bochum'],
  leverkusen: ['koln', 'mgladbach', 'bayern'],
  stuttgart: ['karlsruhe', 'freiburg'],
  freiburg: ['stuttgart'],
  frankfurt: ['mainz', 'darmstadt'],
  mainz: ['frankfurt'],
  werder_bremen: ['wolfsburg', 'hsv'],
  wolfsburg: ['werder_bremen'],
  st_pauli: ['hsv', 'holstein_kiel'],
  holstein_kiel: ['st_pauli'],
  bochum: ['dortmund'],
  union_berlin: ['hertha'],

  // Serie A
  inter: ['milan', 'juventus', 'roma'],
  milan: ['inter', 'juventus'],
  juventus: ['inter', 'milan', 'torino', 'fiorentina', 'napoli'],
  torino: ['juventus'],
  roma: ['lazio', 'napoli', 'juventus'],
  lazio: ['roma', 'napoli'],
  napoli: ['juventus', 'roma', 'lazio'],
  fiorentina: ['juventus'],
  genoa: ['sampdoria'],
  verona: ['venezia', 'vicenza'],
  venezia: ['verona'],
  parma: ['reggiana', 'bologna'],
  bologna: ['parma', 'fiorentina'],

  // Ligue 1
  psg: ['marseille', 'lyon'],
  marseille: ['psg', 'lyon', 'nice'],
  lyon: ['saint_etienne', 'marseille', 'psg'],
  saint_etienne: ['lyon'],
  nice: ['monaco', 'marseille'],
  monaco: ['nice'],
  lens: ['lille'],
  lille: ['lens'],
  rennes: ['nantes'],
  nantes: ['rennes']
};

export function isRivalClub(clubAId: string, clubBId: string): boolean {
  if (clubAId === clubBId) return false;
  const rivalsA = CLUB_RIVALRIES[clubAId] || [];
  const rivalsB = CLUB_RIVALRIES[clubBId] || [];
  return rivalsA.includes(clubBId) || rivalsB.includes(clubAId);
}

export function getLeaguePrestigeScore(league: LeagueKey | string): number {
  switch (league) {
    case 'premier-league': return 96;
    case 'laliga': return 93;
    case 'bundesliga': return 89;
    case 'serie-a': return 88;
    case 'ligue-1': return 84;
    case 'primeira-liga': return 79;
    case 'eredivisie': return 78;
    case 'pro-league': return 75;
    case 'super-lig': return 76;
    case 'championship': return 75;
    case 'j1-league': return 74;
    case '2-bundesliga':
    case 'segunda-division':
    case 'serie-b':
    case 'ligue-2': return 69;
    case 'j2-league': return 65;
    case 'j3-league': return 58;
    default: return 68;
  }
}

export function isClubInEuropeanComp(
  club: Club,
  tournaments?: TournamentCompetitionsState
): 'ucl' | 'uel' | 'uecl' | null {
  if (tournaments) {
    if (tournaments.ucl?.participantClubIds?.includes(club.id)) return 'ucl';
    if (tournaments.uel?.participantClubIds?.includes(club.id)) return 'uel';
    if (tournaments.uecl?.participantClubIds?.includes(club.id)) return 'uecl';
  }
  if (club.europeanFixedComp === 'ucl' || club.europeanFixedComp === 'uel' || club.europeanFixedComp === 'uecl') {
    return club.europeanFixedComp;
  }
  return null;
}

// Realistic transfer valuation (seller club's asking evaluation, intentionally decoupled from base marketValue)
export function calculatePlayerValuation(player: Player, club: Club, buyerClubId?: string): number {
  const baseValue = Math.max(250000, player.marketValue || 500000);
  let multiplier = 1.04;

  // Squad importance at current club: key players command strong markup, listed players get discount
  if (player.isTransferListed || player.transferListed) {
    multiplier *= 0.78;
  } else if (player.squadRole === '絶対的主力') {
    multiplier *= 1.24;
  } else if (player.squadRole === '重要選手') {
    multiplier *= 1.12;
  } else if (player.squadRole === '控え・バックアップ') {
    multiplier *= 0.90;
  }

  // Contract remaining multiplier
  const contractYears = player.contractYears ?? 3;
  if (contractYears <= 1) {
    multiplier *= 0.72; // Expiring bargain
  } else if (contractYears >= 4) {
    multiplier *= 1.18; // Long term security premium
  }

  // Potential and age
  if (player.age <= 21 && (player.potential || player.ovr) >= 85) {
    multiplier *= 1.24; // Wonderkid premium
  } else if (player.age >= 33) {
    multiplier *= 0.68; // Veteran discount
  }

  // Club reputation & financial leverage
  if (club.tier === 'Elite') {
    multiplier *= 1.12;
  } else if (club.tier === 'Lower') {
    multiplier *= 0.94;
  }

  // RIVALRY PENALTY: Asking price is higher when negotiating with a direct rival
  if (buyerClubId && isRivalClub(club.id, buyerClubId)) {
    multiplier *= 1.38;
  }

  const rawFee = baseValue * multiplier;
  const step = rawFee >= 5000000 ? 500000 : 100000;
  return Math.max(250000, Math.round(rawFee / step) * step);
}

export function createTransferNegotiation(
  state: GameWorldState,
  targetPlayer: Player,
  options?: {
    negotiationType?: 'permanent' | 'loan' | 'buy_option' | 'dev_loan';
    bidFee?: number;
    buyOptionFee?: number;
    wageOffer?: number;
    contractYears?: number;
    squadRole?: Player['squadRole'];
    signingBonus?: number;
    joinTiming?: 'immediate' | 'next_window' | 'next_season';
  }
): TransferNegotiation {
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const isFreeAgent = targetPlayer.clubId === 'free_agent' || targetPlayer.clubId === '';
  const sellerClub = state.clubs[targetPlayer.clubId] || state.clubs['free_agent'];
  const currentDate = state.currentDate || '2026-07-01';
  const negotiationType = options?.negotiationType || 'permanent';
  const isLoan = negotiationType !== 'permanent';
  const valuation = isFreeAgent || !sellerClub
    ? 0
    : calculatePlayerValuation(targetPlayer, sellerClub, userClub?.id);

  const defaultBid = isFreeAgent
    ? 0
    : isLoan
      ? Math.round(valuation * (negotiationType === 'dev_loan' ? 0.08 : 0.12))
      : valuation;

  const initialBid = options?.bidFee ?? defaultBid;
  const defaultWage = options?.wageOffer ?? Math.round((targetPlayer.wage || 10000) * (isFreeAgent ? 1.05 : 1.15));
  const defaultRole = options?.squadRole ?? (targetPlayer.ovr >= 85 ? '絶対的主力' : '重要選手');
  const defaultYears = options?.contractYears ?? (isLoan ? 1 : targetPlayer.age >= 36 ? 2 : 3);
  const interest = calculatePlayerInterestInUserClub(
    targetPlayer,
    userClub,
    state.manager,
    Boolean(targetPlayer.userDeclaredInterest || state.declaredInterestPlayerIds?.includes(targetPlayer.id)),
    {
      standings: state.standings,
      tournaments: state.tournaments,
      clubs: state.clubs,
      offeredWage: defaultWage,
      offeredRole: defaultRole,
      offeredYears: defaultYears,
      currentDate
    }
  );

  const deadlineDate = addDays(currentDate, 14);

  if (isFreeAgent) {
    return {
      id: `neg_fa_${Date.now()}_${targetPlayer.id}`,
      playerId: targetPlayer.id,
      sellerClubId: 'free_agent',
      buyerClubId: userClub?.id || '',
      status: 'player_negotiating',
      isLoan: false,
      negotiationType: 'permanent',
      createdDate: currentDate,
      lastUpdatedDate: currentDate,
      negotiationDeadline: deadlineDate,
      interestTier: interest.level,
      interestScore: interest.score,
      interestReasons: interest.reasons,
      acquisitionProbability: interest.acquisitionProbability,
      competingOffers: [],
      initialAskingPrice: 0,
      currentBidFee: 0,
      clubAgreedFee: 0,
      clubPatience: 3,
      clubMessages: [
        {
          sender: 'ai',
          text: `【フリーエージェント】${targetPlayer.name}は現在無所属のため、移籍金ゼロ（€0）で獲得可能です。代理人と個人条件（週給・契約年数・役割）を交渉してください。`,
          date: currentDate
        }
      ],
      wageOffered: defaultWage,
      wageDemanded: Math.round((targetPlayer.wage || 10000) * 1.05),
      contractYearsOffered: targetPlayer.age >= 38 ? 1 : 2,
      squadRoleOffered: defaultRole,
      signingBonusOffered: options?.signingBonus ?? 500000,
      playerPatience: 3,
      playerMessages: [
        {
          sender: 'agent',
          text: `「${targetPlayer.name}の代理人です。移籍金ゼロでの獲得交渉が可能です。提示週給・起用役割・契約年数をお知らせください。」`,
          date: currentDate
        }
      ],
      joinTiming: options?.joinTiming || (state.isTransferWindowOpen ? 'immediate' : 'next_window')
    };
  }

  return {
    id: `neg_${Date.now()}_${targetPlayer.id}`,
    playerId: targetPlayer.id,
    sellerClubId: sellerClub?.id || targetPlayer.clubId,
    buyerClubId: userClub?.id || '',
    status: 'club_negotiating',
    isLoan,
    negotiationType,
    buyOptionFee: options?.buyOptionFee ?? (negotiationType === 'buy_option' ? Math.round(valuation * 1.25) : undefined),
    createdDate: currentDate,
    lastUpdatedDate: currentDate,
    negotiationDeadline: deadlineDate,
    interestTier: interest.level,
    interestScore: interest.score,
    interestReasons: interest.reasons,
    acquisitionProbability: interest.acquisitionProbability,
    competingOffers: [],
    initialAskingPrice: valuation,
    currentBidFee: initialBid,
    clubPatience: 3,
    clubMessages: [
      {
        sender: 'ai',
        text: `「${sellerClub?.name || '所属クラブ'}の強化担当です。${targetPlayer.name}（推定市場価値 €${(targetPlayer.marketValue / 1000000).toFixed(1)}M / クラブ査定額 €${(valuation / 1000000).toFixed(1)}M）の交渉を開始します。」`,
        date: currentDate
      }
    ],
    wageOffered: defaultWage,
    wageDemanded: Math.round((targetPlayer.wage || 10000) * 1.15),
    contractYearsOffered: defaultYears,
    squadRoleOffered: defaultRole,
    signingBonusOffered: options?.signingBonus ?? 500000,
    playerPatience: 3,
    playerMessages: [],
    joinTiming: options?.joinTiming || (state.isTransferWindowOpen ? 'immediate' : 'next_window')
  };
}

export function handleClubNegotiationStep(
  negotiation: TransferNegotiation,
  userOfferedFee: number,
  sellerClub: Club,
  player: Player,
  currentDate?: string
): {
  updatedNegotiation: TransferNegotiation;
  responseMessage: string;
  isAgreed: boolean;
  isCollapsed: boolean;
} {
  const isRival = isRivalClub(sellerClub.id, negotiation.buyerClubId);
  const fullValuation = calculatePlayerValuation(player, sellerClub, negotiation.buyerClubId);
  const isLoan = !!negotiation.isLoan;
  const loanRatio = negotiation.negotiationType === 'dev_loan' ? 0.08 : negotiation.negotiationType === 'buy_option' ? 0.14 : 0.12;
  const targetValuation = isLoan ? Math.max(100000, Math.round(fullValuation * loanRatio)) : fullValuation;
  const dateLabel = currentDate || negotiation.lastUpdatedDate || '今日';

  const minAcceptableFee = Math.round(targetValuation * (isRival ? 0.98 : 0.90));
  const askingPrice = Math.round(targetValuation * (isRival ? 1.18 : 1.08));

  const updated: TransferNegotiation = {
    ...negotiation,
    currentBidFee: userOfferedFee,
    lastUpdatedDate: dateLabel,
    clubMessages: [
      ...(negotiation.clubMessages || []),
      {
        sender: 'user',
        text: `${isLoan ? 'レンタル料' : '移籍金'} €${(userOfferedFee / 1000000).toFixed(2)}M を正式提示しました。`,
        date: dateLabel
      }
    ]
  };

  if (userOfferedFee >= minAcceptableFee) {
    updated.status = 'club_agreed';
    updated.clubAgreedFee = userOfferedFee;
    const msg = isRival
      ? `【ライバル間合意】${sellerClub.name}は提示額 €${(userOfferedFee / 1000000).toFixed(1)}M を受諾しました。選手本人・代理人との契約条件交渉に進んでください。`
      : `【クラブ間合意】${sellerClub.name}と移籍金 €${(userOfferedFee / 1000000).toFixed(1)}M で合意に達しました。続いて個人条件の交渉へ進んでください。`;

    updated.clubMessages.push({ sender: 'ai', text: msg, date: dateLabel });
    return {
      updatedNegotiation: updated,
      responseMessage: msg,
      isAgreed: true,
      isCollapsed: false
    };
  }

  const insultThreshold = isRival ? targetValuation * 0.72 : targetValuation * 0.62;
  const isInsulting = userOfferedFee < insultThreshold;

  if (isInsulting) {
    updated.clubPatience -= isRival ? 2 : 1;
    if (updated.clubPatience <= 0) {
      updated.status = 'collapsed';
      updated.cooldownUntil = addDays(currentDate || '2026-07-01', 10);
      updated.outcomeReason = `移籍金提示（€${(userOfferedFee / 1000000).toFixed(1)}M）が${sellerClub.name}の評価額を大きく下回り決裂`;
      const msg = isRival
        ? `「ライバルクラブからの低額オファーは到底受け入れられません。今回の交渉は打ち切ります。」(10日間再交渉不可)`
        : `「評価額との乖離が大きく、これ以上の協議は困難と判断しました。交渉を打ち切ります。」(10日間再交渉不可)`;

      updated.clubMessages.push({ sender: 'ai', text: msg, date: dateLabel });
      return { updatedNegotiation: updated, responseMessage: msg, isAgreed: false, isCollapsed: true };
    } else {
      const msg = isRival
        ? `「宿敵への売却には相場以上の条件が不可欠です。再提示をお願いします。(残忍耐度: ${updated.clubPatience})」`
        : `「提示額はクラブ査定を下回っています。より誠意ある条件の提示をお願いします。(残忍耐度: ${updated.clubPatience})」`;

      updated.clubMessages.push({ sender: 'ai', text: msg, date: dateLabel });
      return { updatedNegotiation: updated, responseMessage: msg, isAgreed: false, isCollapsed: false };
    }
  }

  const counterFee = Math.max(minAcceptableFee, Math.round((askingPrice - userOfferedFee * 0.12) / 100000) * 100000);
  const msg = isRival
    ? `「€${(counterFee / 1000000).toFixed(1)}M であれば宿敵への移籍であっても承認せざるを得ません。」`
    : `「${player.name}の価値を踏まえ、€${(counterFee / 1000000).toFixed(1)}M であればクラブ間合意が可能です。」`;

  updated.clubMessages.push({ sender: 'ai', text: msg, date: dateLabel });
  return { updatedNegotiation: updated, responseMessage: msg, isAgreed: false, isCollapsed: false };
}

export function handlePlayerNegotiationStep(
  negotiation: TransferNegotiation,
  wageOffered: number,
  contractYears: number,
  role: Player['squadRole'],
  bonus: number,
  player: Player,
  buyerClub: Club,
  currentDate?: string
): {
  updatedNegotiation: TransferNegotiation;
  responseMessage: string;
  isCompleted: boolean;
  isTermsAgreed: boolean;
  isCollapsed: boolean;
} {
  if (negotiation.isLoan && contractYears > 1) {
    return {
      updatedNegotiation: negotiation,
      responseMessage: '期限付き移籍（レンタル）の期間は最長1シーズン（半年または1年）までに制限されています。2年以上の契約は選択できません。',
      isCompleted: false,
      isTermsAgreed: false,
      isCollapsed: false
    };
  }

  const dateLabel = currentDate || negotiation.lastUpdatedDate || '今日';
  const isRival = isRivalClub(player.clubId, buyerClub.id);
  const interestScore = negotiation.interestScore ?? 55;
  const updated: TransferNegotiation = {
    ...negotiation,
    wageOffered,
    contractYearsOffered: contractYears,
    squadRoleOffered: role,
    signingBonusOffered: bonus,
    lastUpdatedDate: dateLabel,
    playerMessages: [
      ...(negotiation.playerMessages || []),
      {
        sender: 'user',
        text: `週給 €${Math.round(wageOffered / 1000)}k · 契約 ${contractYears}年 · 役割「${role}」· 契約金 €${(bonus / 1000000).toFixed(1)}M を提示しました。`,
        date: dateLabel
      }
    ]
  };

  // Base wage demand adjusted by player's interest in buyerClub
  let wageDemand = Math.round((player.wage || 10000) * 1.12);
  if (role === '絶対的主力') wageDemand = Math.round(wageDemand * 1.06);
  if (interestScore < 35) wageDemand = Math.round(wageDemand * 1.20);
  else if (interestScore >= 78) wageDemand = Math.round(wageDemand * 0.95);

  if (isRival && player.contractYears > 1 && player.personality !== '野心的') {
    wageDemand = Math.round(wageDemand * 1.22);
  }
  updated.wageDemanded = wageDemand;

  // Very low interest blocks weak roles or lowball wages
  const isWageOk = wageOffered >= wageDemand * 0.94;
  const isRoleOk =
    interestScore < 25
      ? role === '絶対的主力'
      : role === '絶対的主力' || role === '重要選手' || (player.age >= 33 && role === 'ローテーション');
  const isBonusOk = isRival ? bonus >= Math.min(2500000, player.marketValue * 0.04) : bonus >= 0;

  if (isWageOk && isRoleOk && isBonusOk) {
    // Transition to 'terms_agreed' — explicit user finalization required to complete joining!
    updated.status = 'terms_agreed';
    updated.acquisitionProbability = Math.min(
      97,
      Math.max(60, Math.round(72 + (interestScore - 50) * 0.35 - (updated.competingOffers?.length || 0) * 12))
    );
    const msg = isRival
      ? `【個人条件合意（最終確定待ち）】「ライバルクラブからのオファーでしたが、提示条件に納得しました。交渉リストから「最終確定」を押して契約を完了してください。」`
      : `【個人条件合意（最終確定待ち）】「提示いただいた年俸・役割・契約年数に合意しました。交渉リストまたは本画面の「契約を最終確定」ボタンで入団手続きが完了します。」`;

    updated.playerMessages.push({ sender: 'agent', text: msg, date: dateLabel });
    return {
      updatedNegotiation: updated,
      responseMessage: msg,
      isCompleted: true,
      isTermsAgreed: true,
      isCollapsed: false
    };
  }

  updated.playerPatience -= isRival ? 2 : 1;
  if (updated.playerPatience <= 0) {
    updated.status = 'collapsed';
    updated.cooldownUntil = addDays(currentDate || '2026-07-01', 10);
    updated.outcomeReason = !isRoleOk
      ? `希望する起用役割（${role}）やクラブ関心度の不足により個人条件交渉が決裂`
      : `提示週給（€${Math.round(wageOffered / 1000)}k）が要求水準（€${Math.round(wageDemand / 1000)}k）に達せず決裂`;
    const msg = isRival
      ? `「ライバル移籍のリスクに見合う条件ではないと判断しました。交渉を終了します。」(10日間再交渉不可)`
      : `「希望する待遇・起用方針と乖離しているため、今回の移籍は見送らせていただきます。」(10日間再交渉不可)`;

    updated.playerMessages.push({ sender: 'agent', text: msg, date: dateLabel });
    return {
      updatedNegotiation: updated,
      responseMessage: msg,
      isCompleted: false,
      isTermsAgreed: false,
      isCollapsed: true
    };
  }

  const counterWage = Math.round(wageDemand * 1.05);
  const roleHint = !isRoleOk ? '「絶対的主力」など主力級の起用確約と、' : '';
  const msg = isRival
    ? `「ライバル移籍のため${roleHint}週給 €${Math.round(counterWage / 1000)}k 以上・契約金を希望しています。(残忍耐度: ${updated.playerPatience})」`
    : `「${roleHint}週給 €${Math.round(counterWage / 1000)}k 程度の条件をご検討いただけますか？(残忍耐度: ${updated.playerPatience})」`;

  updated.playerMessages.push({ sender: 'agent', text: msg, date: dateLabel });
  return {
    updatedNegotiation: updated,
    responseMessage: msg,
    isCompleted: false,
    isTermsAgreed: false,
    isCollapsed: false
  };
}

export function finalizeAgreedTransfer(
  state: GameWorldState,
  playerId: string,
  joinTiming?: 'immediate' | 'next_window' | 'next_season'
): { success: boolean; message: string; updatedState: GameWorldState } {
  const neg = state.negotiations?.[playerId];
  const player = state.players[playerId];
  const buyerClub = state.userClubId ? state.clubs[state.userClubId] : null;
  if (!neg || !player || !buyerClub) {
    return { success: false, message: '対象の交渉データまたは選手が見つかりません。', updatedState: state };
  }
  if (neg.status === 'hijacked') {
    return {
      success: false,
      message: `${player.name}は他クラブ（${neg.hijackedByClubName || '競合クラブ'}）へ横取り移籍したため確定できません。`,
      updatedState: state
    };
  }
  if (neg.status !== 'terms_agreed') {
    return {
      success: false,
      message: 'クラブ間合意と個人条件合意の両方が完了してから最終確定できます。',
      updatedState: state
    };
  }
  if (player.clubId === buyerClub.id) {
    return { success: false, message: `${player.name}は既に自クラブに所属しています。`, updatedState: state };
  }
  const transferFee = neg.sellerClubId === 'free_agent' ? 0 : neg.currentBidFee;
  if (buyerClub.transferBudget < transferFee) {
    return {
      success: false,
      message: `移籍予算が不足しています (必要: €${(transferFee / 1000000).toFixed(1)}M / 現在: €${(buyerClub.transferBudget / 1000000).toFixed(1)}M)`,
      updatedState: state
    };
  }
  const availableWage = buyerClub.wageBudget - buyerClub.currentWageSpend;
  if (neg.wageOffered > availableWage) {
    return {
      success: false,
      message: `週給予算枠が不足しています (空き: €${Math.round(availableWage / 1000)}k / 提示: €${Math.round(neg.wageOffered / 1000)}k)`,
      updatedState: state
    };
  }

  const chosenTiming = state.isTransferWindowOpen
    ? (joinTiming || neg.joinTiming || 'immediate')
    : ((joinTiming || neg.joinTiming) === 'next_season' ? 'next_season' : 'next_window');

  const finalizedNeg: TransferNegotiation = {
    ...neg,
    status: 'completed',
    joinTiming: chosenTiming,
    lastUpdatedDate: state.currentDate,
    outcomeReason: chosenTiming === 'immediate' ? '契約締結・即戦力合流完了' : '契約締結・合流日確定済み'
  };

  const completedState = executeTransferCompletion(state, finalizedNeg);
  const updatedNegotiations = {
    ...(completedState.negotiations || {}),
    [playerId]: finalizedNeg
  };

  return {
    success: true,
    message: `${player.name}の契約手続きを最終確定しました！`,
    updatedState: {
      ...completedState,
      negotiations: updatedNegotiations
    }
  };
}

export function withdrawNegotiation(
  state: GameWorldState,
  playerId: string
): GameWorldState {
  const nextNegotiations = { ...(state.negotiations || {}) };
  delete nextNegotiations[playerId];
  return {
    ...state,
    negotiations: nextNegotiations
  };
}

export function calculateJoinDate(currentDate: string, timing: 'immediate' | 'next_window' | 'next_season'): string {
  if (timing === 'immediate') return currentDate;
  const parts = currentDate.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (timing === 'next_season') {
    if (month >= 7) {
      return `${year + 1}-07-01`;
    } else {
      return `${year}-07-01`;
    }
  }

  // timing === 'next_window'
  if (month >= 7) {
    return `${year + 1}-01-01`;
  } else {
    return `${year}-07-01`;
  }
}

// Complete transfer execution (Requirement 2 & 4: Atomic Squad and Transaction Updates)
export function executeTransferCompletion(
  state: GameWorldState,
  negotiation: TransferNegotiation
): GameWorldState {
  const player = state.players[negotiation.playerId];
  const buyerClub = state.clubs[negotiation.buyerClubId];
  const sellerClub = state.clubs[negotiation.sellerClubId] || state.clubs['free_agent'];
  if (!player || !buyerClub) return state;

  const isFreeAgent = !sellerClub || sellerClub.id === 'free_agent' || negotiation.sellerClubId === 'free_agent';
  const isRival = isFreeAgent ? false : (sellerClub ? isRivalClub(sellerClub.id, buyerClub.id) : false);
  const transferFee = isFreeAgent ? 0 : negotiation.currentBidFee;
  const weeklyWage = negotiation.wageOffered;
  const isLoan = !!negotiation.isLoan;

  // Requirement 10: Transfer window timing check & pending transfers
  const isWindowOpen = isTransferWindow(state.currentDate);
  const requestedTiming = negotiation.joinTiming || (isWindowOpen ? 'immediate' : 'next_window');
  // Forbid immediate join outside transfer window
  const actualTiming = (!isWindowOpen && requestedTiming === 'immediate') ? 'next_window' : requestedTiming;

  if (actualTiming !== 'immediate') {
    const joinDate = calculateJoinDate(state.currentDate, actualTiming);

    // Deduct transfer fee now from buyer and credit seller
    buyerClub.transferBudget -= transferFee;
    if (!isFreeAgent && sellerClub && sellerClub.id !== 'free_agent') {
      sellerClub.transferBudget += Math.round(transferFee * 0.95);
    }

    const pendingRecord: PendingTransfer = {
      id: `pending_${Date.now()}_${player.id}`,
      playerId: player.id,
      playerName: player.name,
      sellerClubId: sellerClub ? sellerClub.id : 'free_agent',
      buyerClubId: buyerClub.id,
      fee: transferFee,
      wage: weeklyWage,
      contractYears: negotiation.contractYearsOffered,
      type: negotiation.negotiationType || (isLoan ? 'loan' : 'permanent'),
      agreedDate: state.currentDate,
      joinDate,
      timingChoice: actualTiming
    };

    const timingLabel = actualTiming === 'next_season' ? '来シーズン開始時' : '次の移籍期間開始時';
    const pendingNews: NewsItem = {
      id: `news_pending_agree_${Date.now()}_${player.id}`,
      date: state.currentDate,
      headline: `【移籍合意】${buyerClub.name}、${player.name}の獲得合意を正式発表！${timingLabel}に加入へ`,
      body: `${buyerClub.name}は${sellerClub?.name || '無所属'}所属の${player.name}（${player.age}歳）について、移籍金€${(transferFee / 1000000).toFixed(1)}Mでの獲得合意を発表しました。合流日は${joinDate}付となり、それまでは現所属に留まります。`,
      category: 'transfer',
      relatedClubId: buyerClub.id,
      relatedPlayerId: player.id,
      importance: 'high'
    };

    return {
      ...state,
      clubs: {
        ...state.clubs,
        [buyerClub.id]: buyerClub,
        ...(sellerClub && sellerClub.id !== 'free_agent' ? { [sellerClub.id]: sellerClub } : {})
      },
      pendingTransfers: [...(state.pendingTransfers || []), pendingRecord],
      news: [pendingNews, ...state.news]
    };
  }

  // 1. Financial Movement
  buyerClub.transferBudget -= transferFee;
  if (!isFreeAgent && sellerClub) {
    sellerClub.transferBudget += Math.round(transferFee * 0.95);
    sellerClub.currentWageSpend = Math.max(0, sellerClub.currentWageSpend - player.wage);
  }
  buyerClub.currentWageSpend += weeklyWage;

  // 2. Transfer Squad registration atomically
  if (sellerClub) {
    const oldClubPlayerIds = (sellerClub.playerIds || []).filter(id => id !== player.id);
    sellerClub.playerIds = oldClubPlayerIds;
  }
  const newClubPlayerIds = buyerClub.playerIds.includes(player.id) ? buyerClub.playerIds : [...buyerClub.playerIds, player.id];
  buyerClub.playerIds = newClubPlayerIds;

  // 3. Update player data
  const finalContractYears = isLoan 
    ? Math.min(1, negotiation.contractYearsOffered || 1) // Maximum 1 season loan limit (Requirement 3)
    : negotiation.contractYearsOffered;
  const loanDays = finalContractYears <= 0.5 ? 180 : 365;

  const updatedPlayer: Player = {
    ...player,
    clubId: buyerClub.id,
    wage: weeklyWage,
    contractYears: finalContractYears,
    squadRole: negotiation.squadRoleOffered,
    managerTrust: 90,
    squadStatus: 'OUT_OF_SQUAD',
    isLoaned: isLoan,
    loanFromClubId: isLoan ? sellerClub.id : undefined,
    parentClubId: isLoan ? sellerClub.id : undefined,
    loanClubId: isLoan ? buyerClub.id : undefined,
    loanStartDate: isLoan ? state.currentDate : undefined,
    loanEndDate: isLoan ? addDays(state.currentDate, loanDays) : undefined,
    loanType: negotiation.negotiationType,
    buyOptionFee: negotiation.buyOptionFee,
    loanOptionBuyFee: negotiation.buyOptionFee,
    developmentLoan: negotiation.negotiationType === 'dev_loan'
  };

  // 4. Update user tactics lineup if user's club is involved (Requirements 3 & 4)
  let updatedTactics = { ...state.tactics };
  let autoReplacementNews: NewsItem | null = null;
  let autoChangeNotice: {
    transferredPlayerName: string;
    replacedPlayerName: string | null;
    position: string;
    date: string;
  } | undefined = undefined;

  if (state.userClubId === buyerClub.id) {
    if (!updatedTactics.lineup.reserves.includes(player.id)) {
      updatedTactics.lineup.reserves.push(player.id);
    }
  }

  if (state.userClubId === sellerClub.id) {
    const starterSlotIndex = updatedTactics.lineup.starters.findIndex(s => s.playerId === player.id);

    if (starterSlotIndex !== -1) {
      const slotPos = updatedTactics.lineup.starters[starterSlotIndex].position;

      // Adaptable position mapping for realistic replacement
      const ADAPTABLE_MAP: Record<string, string[]> = {
        ST: ['CF', 'RW', 'LW', 'CAM'],
        CF: ['ST', 'CAM', 'RW', 'LW'],
        LW: ['LM', 'RW', 'ST', 'CAM'],
        RW: ['RM', 'LW', 'ST', 'CAM'],
        CAM: ['CM', 'CF', 'LW', 'RW'],
        CM: ['CDM', 'CAM', 'RM', 'LM'],
        CDM: ['CM', 'CB'],
        LM: ['LW', 'LWB', 'CM', 'RM'],
        RM: ['RW', 'RWB', 'CM', 'LM'],
        LB: ['LWB', 'CB', 'RB'],
        RB: ['RWB', 'CB', 'LB'],
        LWB: ['LB', 'LM'],
        RWB: ['RB', 'RM'],
        CB: ['CDM', 'LB', 'RB'],
        GK: ['GK']
      };

      const isEligible = (p: Player | undefined): p is Player => {
        if (!p) return false;
        if (p.id === player.id) return false;
        if (p.clubId !== sellerClub.id) return false;
        if (p.injury?.isInjured || p.injuryStatus === 'INJURED') return false;
        if (p.suspension?.isSuspended) return false;
        return true;
      };

      // Priority 1: Bench player of the exact same position
      const benchPlayers = updatedTactics.lineup.bench
        .map(id => state.players[id])
        .filter(isEligible);

      let candidate = benchPlayers
        .filter(p => p.position === slotPos)
        .sort((a, b) => b.ovr - a.ovr)[0];

      // Priority 2: Bench player with adaptable position
      if (!candidate) {
        const adaptablePositions = ADAPTABLE_MAP[slotPos] || [];
        candidate = benchPlayers
          .filter(p => adaptablePositions.includes(p.position))
          .sort((a, b) => b.ovr - a.ovr)[0];
      }

      // Priority 3: Best suited player from remaining squad (reserves)
      if (!candidate) {
        const reservePlayers = (sellerClub.playerIds || [])
          .filter(id => id !== player.id && !updatedTactics.lineup.starters.some(s => s.playerId === id) && !updatedTactics.lineup.bench.includes(id))
          .map(id => state.players[id])
          .filter(isEligible);

        candidate = reservePlayers
          .filter(p => p.position === slotPos)
          .sort((a, b) => b.ovr - a.ovr)[0];

        if (!candidate) {
          const adaptablePositions = ADAPTABLE_MAP[slotPos] || [];
          candidate = reservePlayers
            .filter(p => adaptablePositions.includes(p.position))
            .sort((a, b) => b.ovr - a.ovr)[0];
        }
      }

      if (candidate) {
        // Automatically promote candidate into starter slot
        updatedTactics.lineup.starters[starterSlotIndex] = {
          ...updatedTactics.lineup.starters[starterSlotIndex],
          playerId: candidate.id
        };

        // Remove from bench or reserves (leaving bench spot vacant)
        updatedTactics.lineup.bench = updatedTactics.lineup.bench.filter(id => id !== candidate.id);
        updatedTactics.lineup.reserves = updatedTactics.lineup.reserves.filter(id => id !== candidate.id && id !== player.id);

        if (state.players[candidate.id]) {
          state.players[candidate.id].squadStatus = 'STARTING';
        }

        autoReplacementNews = {
          id: `news_squad_auto_${Date.now()}_${candidate.id}`,
          date: state.currentDate,
          headline: `【スタメン変更】${player.name}が移籍したため、${candidate.name}がスタメンに変更されました`,
          body: `スタメン主力である${player.name}の移籍に伴い、ベンチの${candidate.name}が${slotPos}のスタメンへ自動昇格しました。チーム編成画面で最新の布陣をご確認ください。`,
          category: 'transfer',
          relatedClubId: sellerClub.id,
          relatedPlayerId: candidate.id,
          importance: 'high'
        };

        autoChangeNotice = {
          transferredPlayerName: player.name,
          replacedPlayerName: candidate.name,
          position: slotPos,
          date: state.currentDate
        };
      } else {
        // No suitable candidate: leave starter slot vacant
        updatedTactics.lineup.starters[starterSlotIndex] = {
          ...updatedTactics.lineup.starters[starterSlotIndex],
          playerId: ''
        };

        updatedTactics.lineup.bench = updatedTactics.lineup.bench.filter(id => id !== player.id);
        updatedTactics.lineup.reserves = updatedTactics.lineup.reserves.filter(id => id !== player.id);

        autoReplacementNews = {
          id: `news_squad_vacant_${Date.now()}_${player.id}`,
          date: state.currentDate,
          headline: `【スタメン空席警告】${player.name}の移籍に伴い、スタメンに空きがあります`,
          body: `${player.name}が他クラブへ移籍しましたが、適任の控え選手が不在のためスタメン（${slotPos}）に空き枠が生じています。チーム編成画面で後任選手を直接配置してください。`,
          category: 'transfer',
          relatedClubId: sellerClub.id,
          importance: 'high'
        };

        autoChangeNotice = {
          transferredPlayerName: player.name,
          replacedPlayerName: null,
          position: slotPos,
          date: state.currentDate
        };
      }
    } else {
      updatedTactics.lineup.bench = updatedTactics.lineup.bench.filter(id => id !== player.id);
      updatedTactics.lineup.reserves = updatedTactics.lineup.reserves.filter(id => id !== player.id);
    }
  }

  // 5. Add to transfer history
  const transferType = negotiation.negotiationType || (isLoan ? 'loan' : 'permanent');
  const historyList = [...(state.transferHistory || [])];
  historyList.unshift({
    id: `tr_${Date.now()}_${player.id}`,
    date: state.currentDate,
    playerId: player.id,
    playerName: player.name,
    sellerClubId: sellerClub.id,
    buyerClubId: buyerClub.id,
    fee: transferFee,
    type: transferType
  });

  // 6. Generate breaking news
  let newsTitle = '';
  let newsBody = '';

  if (negotiation.negotiationType === 'dev_loan') {
    newsTitle = `【育成型レンタル】若手有望株${player.name}が${buyerClub.name}へ期限付き移籍加入！`;
    newsBody = `出場機会の確保と急成長を目指し、${sellerClub.name}所属の${player.name}が${buyerClub.name}への育成型期限付き移籍で合意しました。`;
  } else if (isLoan) {
    newsTitle = negotiation.buyOptionFee 
      ? `【買取OP付きレンタル】${player.name}が${buyerClub.name}へ加入！買取OP €${(negotiation.buyOptionFee / 1000000).toFixed(1)}M`
      : `【期限付き移籍】${player.name}が${buyerClub.name}へ1年間のレンタル移籍で合意`;
    newsBody = `${sellerClub.name}から${buyerClub.name}へ、${player.name}の期限付き移籍が正式成立。即戦力としての活躍が期待されます。`;
  } else if (isFreeAgent) {
    newsTitle = `【電撃フリー獲得】${buyerClub.name}が世界的名手${player.name}と契約！移籍金ゼロの超大型補強`;
    newsBody = `移籍市場に激震！無所属（フリーエージェント）となっていた世界的スーパースター${player.name}（${player.age}歳）に対し、${buyerClub.name}が熱烈なオファーを提示。移籍金ゼロでの電撃契約が正式発表されました。新天地での背番号や活躍に世界中のフットボールファンから熱い視線が注がれています。`;
  } else if (isRival) {
    newsTitle = `【禁断のライバル移籍】${player.name}が宿敵${buyerClub.name}へ電撃加入！移籍金€${(transferFee / 1000000).toFixed(1)}Mの衝撃`;
    newsBody = `サッカー界に激震。${sellerClub?.name || '前所属クラブ'}の主力である${player.name}が長年の宿敵${buyerClub.name}への完全移籍を正式発表しました。`;
  } else {
    newsTitle = `【大型移籍決定】${player.name}が${buyerClub.name}へ完全移籍！移籍金€${(transferFee / 1000000).toFixed(1)}Mでサイン`;
    newsBody = `移籍市場にビッグニュース。${player.name}が${sellerClub?.name || '前所属クラブ'}から${buyerClub.name}への移籍を完了しました。新天地での背番号やデビュー戦に早くも大きな注目が集まっています。`;
  }

  const transferNews: NewsItem = {
    id: `news_tr_${Date.now()}`,
    date: state.currentDate,
    headline: newsTitle,
    body: newsBody,
    category: 'transfer',
    relatedClubId: buyerClub.id,
    relatedPlayerId: player.id,
    importance: 'high'
  };

  const additionalNews: NewsItem[] = [transferNews];
  if (autoReplacementNews) {
    additionalNews.unshift(autoReplacementNews);
  }

  return {
    ...state,
    tactics: updatedTactics,
    lastSquadAutoChangeNotice: autoChangeNotice !== undefined ? autoChangeNotice : state.lastSquadAutoChangeNotice,
    clubs: {
      ...state.clubs,
      [buyerClub.id]: buyerClub,
      ...(sellerClub ? { [sellerClub.id]: sellerClub } : {})
    },
    players: {
      ...state.players,
      [player.id]: updatedPlayer
    },
    news: [...additionalNews, ...state.news],
    transferHistory: historyList
  };
}

// Exercise Loan Buy Option (Requirement 6)
export function exerciseLoanBuyOption(
  state: GameWorldState,
  playerId: string
): { success: boolean; message: string; updatedState: GameWorldState } {
  const player = state.players[playerId];
  if (!player || !player.isLoaned || !player.loanOptionBuyFee || !player.loanFromClubId) {
    return { success: false, message: 'この選手には買取オプションが設定されていません。', updatedState: state };
  }

  const buyerClub = state.clubs[player.clubId];
  const sellerClub = state.clubs[player.loanFromClubId];
  if (!buyerClub || !sellerClub) {
    return { success: false, message: 'クラブ情報が見つかりません。', updatedState: state };
  }

  const buyFee = player.loanOptionBuyFee;
  if (buyerClub.transferBudget < buyFee) {
    return { 
      success: false, 
      message: `移籍予算が不足しています (必要額: €${(buyFee / 1000000).toFixed(1)}M / 現在予算: €${(buyerClub.transferBudget / 1000000).toFixed(1)}M)`, 
      updatedState: state 
    };
  }

  // Execute buy option
  buyerClub.transferBudget -= buyFee;
  sellerClub.transferBudget += Math.round(buyFee * 0.95);

  const updatedPlayer: Player = {
    ...player,
    isLoaned: false,
    loanFromClubId: undefined,
    parentClubId: undefined,
    loanOptionBuyFee: undefined,
    buyOptionFee: undefined,
    loanStartDate: undefined,
    loanEndDate: undefined,
    contractYears: 3,
    managerTrust: 95
  };

  const buyNews: NewsItem = {
    id: `news_buy_op_${Date.now()}`,
    date: state.currentDate,
    headline: `【買取OP行使】${buyerClub.name}、${player.name}の保有権を完全獲得！(移籍金€${(buyFee / 1000000).toFixed(1)}M)`,
    body: `期限付き移籍中だった${player.name}について、${buyerClub.name}が契約条項の買取オプションを正式行使。保有元${sellerClub.name}から完全移籍で獲得しました。`,
    category: 'transfer',
    relatedClubId: buyerClub.id,
    relatedPlayerId: player.id,
    importance: 'high'
  };

  const historyList = [...(state.transferHistory || [])];
  historyList.unshift({
    id: `tr_buy_op_${Date.now()}_${player.id}`,
    date: state.currentDate,
    playerId: player.id,
    playerName: player.name,
    sellerClubId: sellerClub.id,
    buyerClubId: buyerClub.id,
    fee: buyFee,
    type: 'permanent'
  });

  return {
    success: true,
    message: `${player.name}の買取オプションを行使し、完全移籍が完了しました！`,
    updatedState: {
      ...state,
      clubs: {
        ...state.clubs,
        [buyerClub.id]: buyerClub,
        [sellerClub.id]: sellerClub
      },
      players: {
        ...state.players,
        [player.id]: updatedPlayer
      },
      news: [buyNews, ...state.news],
      transferHistory: historyList
    }
  };
}

// Direct Negotiation Evaluation Engine (Requirements 5, 6, 7 & 28)
export function evaluateAICounterProposal(
  offer: IncomingAIOffer,
  targetPlayer: Player,
  buyerClub: Club,
  proposedFee: number,
  proposedBonus: number,
  installments: number,
  sellOnPercentage: number,
  buybackClause: boolean
): {
  decision: 'accept' | 'counter' | 'reject';
  aiMessage: string;
  counterFee?: number;
  counterBonus?: number;
  newPatience: number;
} {
  const currentPatience = offer.aiPatience ?? 3;
  const maxAffordable = buyerClub.transferBudget * 0.95;
  const fairMarketValue = targetPlayer.marketValue;
  const isRival = isRivalClub(buyerClub.id, targetPlayer.clubId);

  // Installment & clause penalties / incentives
  let effectiveProposed = proposedFee + proposedBonus * 0.5;
  if (installments > 1) effectiveProposed *= (1 - (installments - 1) * 0.03); // installments are slightly cheaper present value for buyer
  if (sellOnPercentage > 0) effectiveProposed += (fairMarketValue * (sellOnPercentage / 100) * 0.3);
  if (buybackClause) effectiveProposed += fairMarketValue * 0.15; // buyer dislikes buyback clauses

  const upperLimit = Math.min(maxAffordable, Math.round(fairMarketValue * (isRival ? 1.4 : 1.25)));

  // If proposed exceeds affordable budget or greed threshold (>150% of upper limit) or patience exhausted
  if (effectiveProposed > upperLimit * 1.50 || proposedFee > maxAffordable || currentPatience <= 0) {
    return {
      decision: 'reject',
      aiMessage: `「当クラブの予算と選手査定から著しく乖離しており、これ以上交渉を続ける価値がないと判断いたしました。オファーを正式に取り下げます。」`,
      newPatience: 0
    };
  }

  // If proposed is reasonable (within upper limit)
  if (effectiveProposed <= upperLimit * 1.05) {
    return {
      decision: 'accept',
      aiMessage: `「提示いただいた条件（移籍金 €${(proposedFee / 1000000).toFixed(1)}M${proposedBonus > 0 ? ` ＋ ボーナス €${(proposedBonus / 1000000).toFixed(1)}M` : ''}${installments > 1 ? ` / ${installments}回分割` : ''}）に合意いたします。移籍手続きを完了させましょう。」`,
      counterFee: proposedFee,
      counterBonus: proposedBonus,
      newPatience: currentPatience
    };
  }

  // Counter proposal from AI with multi-stage patience (Requirement 8)
  const compromiseFee = Math.round((offer.fee + proposedFee) / 2 / 500000) * 500000;
  const compromiseBonus = proposedBonus > 0 ? Math.round(proposedBonus * 0.8 / 500000) * 500000 : Math.round(fairMarketValue * 0.08 / 500000) * 500000;
  const isFinalWarning = (currentPatience - 1) <= 1;

  const warningText = isFinalWarning ? '【最終提示】' : '';
  const aiMessage = isFinalWarning
    ? `「これが当クラブからの最終提示です。移籍金 €${(compromiseFee / 1000000).toFixed(1)}M ＋ 活躍ボーナス €${(compromiseBonus / 1000000).toFixed(1)}M。これ以上の条件引き上げには応じられず、決裂となります。」`
    : `「€${(proposedFee / 1000000).toFixed(1)}Mは要求が高すぎます。移籍金 €${(compromiseFee / 1000000).toFixed(1)}M ＋ 活躍ボーナス €${(compromiseBonus / 1000000).toFixed(1)}M なら合意可能です。これが当クラブからの再提案です。」`;

  return {
    decision: 'counter',
    aiMessage,
    counterFee: compromiseFee,
    counterBonus: compromiseBonus,
    newPatience: Math.max(0, currentPatience - 1)
  };
}

/**
 * Requirement 7: Reject incoming offer and apply 30-day cooldown to prevent repeat bids
 */
export function rejectIncomingOffer(
  state: GameWorldState,
  offerId: string
): GameWorldState {
  const offer = (state.incomingOffers || []).find(o => o.id === offerId);
  const updatedOffers = (state.incomingOffers || []).map(o => {
    if (o.id === offerId) return { ...o, status: 'rejected' as const };
    return o;
  });

  const cooldowns = { ...(state.recentOffersCooldown || {}) };
  if (offer) {
    cooldowns[`${offer.buyerClubId}_${offer.playerId}`] = addDays(state.currentDate, 30);
  }

  return {
    ...state,
    incomingOffers: updatedOffers,
    recentOffersCooldown: cooldowns
  };
}

/**
 * Calculate 5-tier player interest level in user's club (0 - 100)
 */
export function calculatePlayerInterestInUserClub(
  player: Player,
  userClub: Club | null,
  manager: { reputation: number },
  isDeclaredInterest?: boolean,
  context?: {
    standings?: Record<LeagueKey, StandingsRow[]>;
    tournaments?: TournamentCompetitionsState;
    clubs?: Record<string, Club>;
    offeredWage?: number;
    offeredRole?: Player['squadRole'];
    offeredYears?: number;
    currentDate?: string;
  }
): {
  score: number;
  level: PlayerInterestTier;
  reason: string;
  reasons: string[];
  acquisitionProbability: number;
} {
  if (!userClub) {
    return {
      score: 35,
      level: '低い',
      reason: '所属クラブ未定',
      reasons: ['監督クラブ未決定'],
      acquisitionProbability: 25
    };
  }

  const reasons: string[] = [];
  let score = 46;
  const userRep = userClub.reputation || 50;
  const repBonus = Math.round((userRep - 58) * 0.42);
  score += repBonus;

  if (userClub.tier === 'Elite') {
    score += 18;
    reasons.push('トップクラブ（Elite）のブランド力');
  } else if (userClub.tier === 'Upper') {
    score += 9;
    reasons.push('上位クラブのプロジェクト');
  } else if (userClub.tier === 'Lower') {
    score -= 14;
    reasons.push('クラブ規模への慎重姿勢');
  }

  // League prestige contrast
  const targetLeaguePrestige = getLeaguePrestigeScore(userClub.league);
  const currentClub = context?.clubs?.[player.clubId];
  const currentLeaguePrestige = currentClub ? getLeaguePrestigeScore(currentClub.league) : 65;
  if (player.clubId === 'free_agent' || !player.clubId) {
    score += 14;
    reasons.push('フリーエージェントのため新天地を歓迎');
  } else {
    const prestigeDiff = targetLeaguePrestige - currentLeaguePrestige;
    if (prestigeDiff >= 10) {
      score += 12;
      reasons.push('より競争レベルの高いリーグへのステップアップ');
    } else if (prestigeDiff <= -12 && player.ovr >= 78) {
      score -= 14;
      reasons.push('現在の所属リーグ水準との格差');
    }
  }

  // European competition prestige
  const euroComp = isClubInEuropeanComp(userClub, context?.tournaments);
  if (euroComp === 'ucl') {
    score += 11;
    reasons.push('UCL出場権の魅力');
  } else if (euroComp === 'uel') {
    score += 5;
    reasons.push('UEL出場による国際舞台');
  } else if (player.ovr >= 85 && !euroComp) {
    score -= 8;
    reasons.push('欧州CL舞台へのこだわり');
  }

  // Current league standing position
  const leagueTable = context?.standings?.[userClub.league];
  if (leagueTable && leagueTable.length >= 8) {
    const sorted = [...leagueTable].sort((a, b) => (b.points - a.points) || (b.goalDiff - a.goalDiff));
    const rank = sorted.findIndex(r => r.clubId === userClub.id) + 1;
    if (rank >= 1 && rank <= 4 && sorted[0].played >= 3) {
      score += 6;
      reasons.push(`好調なリーグ順位（現在${rank}位）`);
    } else if (rank >= sorted.length - 3 && sorted[0].played >= 5) {
      score -= 8;
      reasons.push(`降格圏付近の順位リスク（現在${rank}位）`);
    }
  }

  // Positional competition & playing time expectation
  if (context?.offeredRole === '絶対的主力') {
    score += 7;
    reasons.push('絶対的主力としての起用約束');
  } else if (context?.offeredRole === '控え・バックアップ' && player.ovr >= 76) {
    score -= 14;
    reasons.push('出場機会減少への懸念');
  }

  // Offered wage comparison
  if (context?.offeredWage && player.wage > 0) {
    const wageRatio = context.offeredWage / player.wage;
    if (wageRatio >= 1.25) {
      score += 8;
      reasons.push('現行を上回る好待遇オファー');
    } else if (wageRatio < 0.95) {
      score -= 10;
      reasons.push('現行給与を下回る提示');
    }
  }

  // Personality & club loyalty
  if (player.personality === '野心的') {
    if (userClub.tier === 'Elite' || userClub.tier === 'Upper') score += 12;
    else score -= 12;
  } else if (player.personality === 'タイトル至上主義') {
    if (userRep >= 80 || euroComp === 'ucl') score += 12;
    else score -= 11;
  } else if (player.personality === 'クラブ愛') {
    score -= 18;
    reasons.push('現所属クラブへの強い愛着');
  } else if (player.personality === '出場機会重視') {
    if (player.squadRole === '控え・バックアップ' || player.squadRole === 'ローテーション') {
      score += 12;
      reasons.push('出場機会増加への強い意欲');
    }
  } else if (player.personality === '給与重視') {
    if (userClub.wageBudget > 1000000) score += 10;
  }

  // Age & OVR vs Club Gap
  if (player.ovr - userRep >= 14 && userClub.tier !== 'Elite') {
    score -= 14;
    reasons.push('選手の格と現在クラブ評価のギャップ');
  }

  // Rivalry resistance
  if (currentClub && isRivalClub(currentClub.id, userClub.id)) {
    score -= 16;
    reasons.push('ライバルクラブ間移籍への慎重姿勢');
  }

  // Manager reputation
  score += Math.round(((manager?.reputation || 50) - 50) * 0.18);

  if (isDeclaredInterest || player.userDeclaredInterest) {
    score += 12;
    reasons.push('監督からの熱烈な獲得関心表明');
  }

  // Subtle deterministic variation per player + month
  const monthSeed = (context?.currentDate || '2026-07-01').slice(0, 7);
  let seedHash = 0;
  const seedStr = `${player.id}_${userClub.id}_${monthSeed}`;
  for (let i = 0; i < seedStr.length; i++) {
    seedHash = ((seedHash * 31) + seedStr.charCodeAt(i)) | 0;
  }
  score += (Math.abs(seedHash) % 7) - 3; // -3 to +3

  score = Math.max(5, Math.min(98, score));

  let level: PlayerInterestTier = '普通';
  let reason = '';

  if (score >= 78) {
    level = '非常に高い';
    reason = `${userClub.name}への加入を強く熱望しており、交渉に極めて前向きです。`;
  } else if (score >= 60) {
    level = '高い';
    reason = `${userClub.name}のプロジェクトに関心を示しており、条件次第で合意可能性が高い状態です。`;
  } else if (score >= 42) {
    level = '普通';
    reason = `現環境との比較検討中であり、待遇・起用役割の提示次第で交渉が動きます。`;
  } else if (score >= 24) {
    level = '低い';
    reason = `現時点では移籍に消極的です。納得できる好条件や起用約束が必要になります。`;
  } else {
    level = '非常に低い';
    reason = `現所属への愛着やクラブ格差等により移籍への関心は極めて低く、大幅な条件上乗せが必要です。`;
  }

  const acquisitionProbability = Math.max(8, Math.min(96, Math.round(score * 0.92)));

  return {
    score,
    level,
    reason,
    reasons: reasons.slice(0, 4),
    acquisitionProbability
  };
}

/**
 * Computes comprehensive holistic transfer package attractiveness score
 * used when comparing competing AI club offers vs user club offer for shortlisted players.
 */
export function evaluateTransferPackageScore(params: {
  player: Player;
  club: Club;
  fee: number;
  weeklyWage: number;
  contractYears: number;
  squadRole: Player['squadRole'];
  standings?: Record<LeagueKey, StandingsRow[]>;
  tournaments?: TournamentCompetitionsState;
}): number {
  const { player, club, fee, weeklyWage, contractYears, squadRole, standings, tournaments } = params;
  const valuation = Math.max(500000, player.marketValue || 1000000);
  const feeRatio = fee / valuation;
  const wageRatio = weeklyWage / Math.max(5000, player.wage || 10000);

  let score = 0;
  score += Math.min(30, feeRatio * 22);
  score += Math.min(30, wageRatio * 18);
  score += Math.min(8, Math.max(1, contractYears) * 1.8);
  score += (club.reputation || 65) * 0.28;
  score += getLeaguePrestigeScore(club.league) * 0.22;

  const euroComp = isClubInEuropeanComp(club, tournaments);
  if (euroComp === 'ucl') score += 9;
  else if (euroComp === 'uel') score += 4.5;
  else if (euroComp === 'uecl') score += 2;

  if (squadRole === '絶対的主力') score += 8;
  else if (squadRole === '重要選手') score += 4;
  else if (squadRole === '控え・バックアップ') score -= 6;

  if (club.tier === 'Elite') score += 6;
  else if (club.tier === 'Upper') score += 3;

  const leagueTable = standings?.[club.league];
  if (leagueTable && leagueTable.length > 0 && leagueTable[0].played >= 3) {
    const sorted = [...leagueTable].sort((a, b) => (b.points - a.points) || (b.goalDiff - a.goalDiff));
    const rank = sorted.findIndex(r => r.clubId === club.id) + 1;
    if (rank >= 1 && rank <= 3) score += 4;
  }

  return Math.round(score * 10) / 10;
}

/**
 * Generates competing AI offers STRICTLY & EXCLUSIVELY for players in user's Favorites Shortlist (`shortlistPlayerIds`).
 * Non-shortlisted players never receive shortlist competing offers or post-agreement hijacks.
 */
export function processShortlistCompetingOffers(
  state: GameWorldState,
  currentDate: string
): GameWorldState {
  const shortlistIds = state.shortlistPlayerIds || [];
  if (shortlistIds.length === 0) {
    return state;
  }

  let updatedState: GameWorldState = {
    ...state,
    negotiations: { ...(state.negotiations || {}) }
  };

  // First clean up overdue deadlines on any non-completed active negotiations
  Object.entries(updatedState.negotiations!).forEach(([pId, neg]) => {
    if (
      neg &&
      ['club_negotiating', 'club_agreed', 'player_negotiating', 'terms_agreed'].includes(neg.status) &&
      neg.negotiationDeadline &&
      currentDate > neg.negotiationDeadline
    ) {
      updatedState.negotiations![pId] = {
        ...neg,
        status: 'collapsed',
        lastUpdatedDate: currentDate,
        outcomeReason: `交渉期限（${neg.negotiationDeadline}）までに契約が確定しなかったため破談となりました`
      };
    }
  });

  if (!updatedState.isTransferWindowOpen) {
    return updatedState;
  }

  const candidateAIClubs = Object.values(updatedState.clubs).filter(
    c =>
      c.id !== updatedState.userClubId &&
      c.id !== 'free_agent' &&
      !c.isTournamentOnly &&
      (c.league as string) !== 'uefa-tournament' &&
      (c.playerIds?.length || 0) < 34
  );
  if (candidateAIClubs.length === 0) return updatedState;

  const userClub = updatedState.userClubId ? updatedState.clubs[updatedState.userClubId] : null;
  const hijackNews: NewsItem[] = [];

  for (const playerId of shortlistIds) {
    const player = updatedState.players[playerId];
    if (!player || player.clubId === updatedState.userClubId) continue;

    const existingNeg = updatedState.negotiations![playerId];
    if (existingNeg && (existingNeg.status === 'completed' || existingNeg.status === 'hijacked')) {
      continue;
    }

    // Only shortlisted players attract active AI rivals (higher chance if user has an open deal or terms_agreed!)
    const triggerChance = existingNeg?.status === 'terms_agreed'
      ? 0.45
      : existingNeg
        ? 0.36
        : 0.18;
    if (Math.random() > triggerChance) continue;

    const affordableBuyers = candidateAIClubs.filter(c => {
      if (c.id === player.clubId) return false;
      if (isRivalClub(c.id, player.clubId)) return false;
      const estimatedFee = player.clubId === 'free_agent' ? 0 : player.marketValue;
      if (c.transferBudget < estimatedFee * 1.05) return false;
      const availWage = Math.max(0, c.wageBudget - c.currentWageSpend);
      if (availWage < Math.max(10000, player.wage * 1.1)) return false;
      // Match club ambition with player OVR
      if (player.ovr >= 82 && c.tier !== 'Elite' && c.tier !== 'Upper') return false;
      return true;
    });

    if (affordableBuyers.length === 0) continue;

    // Pick strongest realistic competing club
    const rankedBuyers = [...affordableBuyers].sort((a, b) => (b.reputation || 70) - (a.reputation || 70));
    const rivalClub = rankedBuyers[Math.floor(Math.random() * Math.min(4, rankedBuyers.length))];

    const aiFee = player.clubId === 'free_agent'
      ? 0
      : Math.min(
          Math.floor(rivalClub.transferBudget * 0.85),
          Math.round(player.marketValue * (1.08 + Math.random() * 0.22))
        );
    const aiWage = Math.round(
      Math.max(player.wage * 1.25, existingNeg ? existingNeg.wageOffered * 1.12 : player.wage * 1.25)
    );
    const aiRole: Player['squadRole'] = player.ovr >= (rivalClub.reputation || 75) ? '絶対的主力' : '重要選手';
    const aiYears = player.age >= 34 ? 2 : 4;

    const aiPackageScore = evaluateTransferPackageScore({
      player,
      club: rivalClub,
      fee: aiFee,
      weeklyWage: aiWage,
      contractYears: aiYears,
      squadRole: aiRole,
      standings: updatedState.standings,
      tournaments: updatedState.tournaments
    });

    const rivalEuroComp = isClubInEuropeanComp(rivalClub, updatedState.tournaments);
    const newCompetingOffer: CompetingOffer = {
      id: `comp_${Date.now()}_${rivalClub.id}_${player.id}`,
      clubId: rivalClub.id,
      clubName: rivalClub.name,
      clubTier: rivalClub.tier,
      leagueKey: rivalClub.league,
      leagueName: rivalClub.league,
      hasEuropeanFootball: Boolean(rivalEuroComp),
      europeanCompetition: rivalEuroComp === 'ucl' ? 'UCL' : rivalEuroComp === 'uel' ? 'UEL' : rivalEuroComp === 'uecl' ? 'UECL' : 'NONE',
      offeredFee: aiFee,
      wageOffered: aiWage,
      contractYearsOffered: aiYears,
      squadRoleOffered: aiRole,
      totalPackageScore: aiPackageScore,
      submittedDate: currentDate,
      status: 'active'
    };

    const userPackageScore = existingNeg && userClub
      ? evaluateTransferPackageScore({
          player,
          club: userClub,
          fee: existingNeg.currentBidFee,
          weeklyWage: existingNeg.wageOffered,
          contractYears: existingNeg.contractYearsOffered,
          squadRole: existingNeg.squadRoleOffered,
          standings: updatedState.standings,
          tournaments: updatedState.tournaments
        })
      : 0;

    // Check if competing club beats user package sufficiently to hijack!
    const daysOpen = existingNeg?.createdDate
      ? Math.max(0, Math.round((new Date(currentDate).getTime() - new Date(existingNeg.createdDate).getTime()) / (1000 * 3600 * 24)))
      : 0;
    const isHijackWorthy =
      existingNeg &&
      ['club_negotiating', 'club_agreed', 'player_negotiating', 'terms_agreed'].includes(existingNeg.status) &&
      (aiPackageScore > userPackageScore * 1.03 || (existingNeg.status === 'terms_agreed' && daysOpen >= 2 && aiPackageScore >= userPackageScore * 0.98));

    if (isHijackWorthy && existingNeg) {
      newCompetingOffer.status = 'accepted_by_player';

      // Explain precisely WHY rival won
      const reasonParts: string[] = [];
      if (aiWage > existingNeg.wageOffered) {
        reasonParts.push(`より高額な週給条件（€${Math.round(aiWage / 1000)}k vs €${Math.round(existingNeg.wageOffered / 1000)}k）`);
      }
      if (aiFee > existingNeg.currentBidFee) {
        reasonParts.push(`売主提示移籍金の優位（€${(aiFee / 1000000).toFixed(1)}M vs €${(existingNeg.currentBidFee / 1000000).toFixed(1)}M）`);
      }
      if (isClubInEuropeanComp(rivalClub, updatedState.tournaments) === 'ucl' && (!userClub || isClubInEuropeanComp(userClub, updatedState.tournaments) !== 'ucl')) {
        reasonParts.push('UCL出場権の魅力');
      }
      if ((rivalClub.reputation || 70) > ((userClub?.reputation || 70) + 4)) {
        reasonParts.push(`${rivalClub.name}のクラブ格・国際的実績`);
      }
      const hijackReasonText = `${rivalClub.name}が横取り移籍を成立させました（決定要因: ${
        reasonParts.length > 0 ? reasonParts.join('、') : '総合パッケージ評価で優位'
      }）。`;

      const aiTransferNeg: TransferNegotiation = {
        id: `hijack_ai_${Date.now()}_${player.id}`,
        playerId: player.id,
        sellerClubId: player.clubId,
        buyerClubId: rivalClub.id,
        status: 'completed',
        isLoan: false,
        initialAskingPrice: player.marketValue,
        currentBidFee: aiFee,
        clubPatience: 3,
        clubMessages: [],
        wageOffered: aiWage,
        wageDemanded: aiWage,
        contractYearsOffered: aiYears,
        squadRoleOffered: aiRole,
        signingBonusOffered: 1000000,
        playerPatience: 3,
        playerMessages: []
      };

      updatedState = executeTransferCompletion(updatedState, aiTransferNeg);
      updatedState.negotiations![playerId] = {
        ...existingNeg,
        status: 'hijacked',
        lastUpdatedDate: currentDate,
        hijackedByClubId: rivalClub.id,
        hijackedByClubName: rivalClub.name,
        acquisitionProbability: 0,
        outcomeReason: hijackReasonText,
        competingOffers: [...(existingNeg.competingOffers || []).filter(o => o.clubId !== rivalClub.id), newCompetingOffer]
      };

      hijackNews.push({
        id: `news_hijack_${Date.now()}_${player.id}`,
        date: currentDate,
        headline: `【電撃ハイジャック】${rivalClub.name}が${player.name}を横取り獲得！`,
        body: `お気に入り登録および獲得交渉が進んでいた${player.name}について、${rivalClub.name}がより好条件（移籍金€${(aiFee / 1000000).toFixed(1)}M・週給€${Math.round(aiWage / 1000)}k）を提示して逆転合意に至りました。`,
        category: 'transfer',
        relatedClubId: rivalClub.id,
        relatedPlayerId: player.id,
        importance: 'high'
      });
    } else if (existingNeg) {
      // Update competingOffers & reduce user's acquisitionProbability
      const existingList = (existingNeg.competingOffers || []).filter(o => o.clubId !== rivalClub.id);
      const nextOffers = [...existingList, newCompetingOffer].slice(-4);
      const gapPenalty = Math.max(8, Math.round((aiPackageScore - userPackageScore) * 1.4));
      const baseProb = existingNeg.acquisitionProbability ?? 70;
      updatedState.negotiations![playerId] = {
        ...existingNeg,
        lastUpdatedDate: currentDate,
        competingOffers: nextOffers,
        acquisitionProbability: Math.max(10, Math.min(95, baseProb - gapPenalty))
      };
    } else if (Math.random() < 0.25 && player.squadRole !== '絶対的主力') {
      // Shortlisted player not yet negotiated by user may still be snapped up by rival AI club!
      const aiTransferNeg: TransferNegotiation = {
        id: `shortlist_ai_${Date.now()}_${player.id}`,
        playerId: player.id,
        sellerClubId: player.clubId,
        buyerClubId: rivalClub.id,
        status: 'completed',
        isLoan: false,
        initialAskingPrice: player.marketValue,
        currentBidFee: aiFee,
        clubPatience: 3,
        clubMessages: [],
        wageOffered: aiWage,
        wageDemanded: aiWage,
        contractYearsOffered: aiYears,
        squadRoleOffered: aiRole,
        signingBonusOffered: 500000,
        playerPatience: 3,
        playerMessages: []
      };
      updatedState = executeTransferCompletion(updatedState, aiTransferNeg);
    }
  }

  if (hijackNews.length > 0) {
    updatedState = {
      ...updatedState,
      news: [...hijackNews, ...(updatedState.news || [])]
    };
  }

  return updatedState;
}

// AI clubs autonomous transfer simulation during window
export function simulateAITransfers(state: GameWorldState): GameWorldState {
  if (!state.isTransferWindowOpen) return state;

  let updatedState = { ...state };
  const shortlistSet = new Set(updatedState.shortlistPlayerIds || []);
  const activeNegSet = new Set(
    Object.values(updatedState.negotiations || {})
      .filter(n => n && ['club_negotiating', 'club_agreed', 'player_negotiating', 'terms_agreed'].includes(n.status))
      .map(n => n.playerId)
  );

  // 1. Generate incoming AI offers to User's club (Requirements 7, 16 & 17)
  if (updatedState.userClubId && Math.random() < 0.35) {
    const userClub = updatedState.clubs[updatedState.userClubId];
    if (userClub && userClub.playerIds.length > 15) {
      const userPlayers = userClub.playerIds.map(id => updatedState.players[id]).filter(Boolean);
      const listed = userPlayers.filter(p => p.isTransferListed || p.isLoanListed);
      let targetPlayer: Player | null = null;
      if (listed.length > 0 && Math.random() < 0.60) {
        targetPlayer = listed[Math.floor(Math.random() * listed.length)];
      } else {
        const attractiveUnlisted = userPlayers.filter(p => p.ovr >= 74 || p.potential >= 82);
        if (attractiveUnlisted.length > 0 && Math.random() < 0.45) {
          targetPlayer = attractiveUnlisted[Math.floor(Math.random() * attractiveUnlisted.length)];
        }
      }

      if (targetPlayer) {
        const cooldowns = updatedState.recentOffersCooldown || {};
        const aiBuyers = Object.values(updatedState.clubs).filter(c => {
          if (c.id === userClub.id || c.id === 'free_agent' || c.isTournamentOnly || (c.league as string) === 'uefa-tournament') return false;
          if (c.transferBudget <= targetPlayer.marketValue * 0.85) return false;
          const key = `${c.id}_${targetPlayer.id}`;
          if (cooldowns[key] && cooldowns[key] > updatedState.currentDate) return false;
          const hasPending = (updatedState.incomingOffers || []).some(
            o => o.buyerClubId === c.id && o.playerId === targetPlayer.id && o.status === 'pending'
          );
          if (hasPending) return false;
          return true;
        });

        if (aiBuyers.length > 0) {
          const buyer = aiBuyers[Math.floor(Math.random() * aiBuyers.length)];
          const isLoanOffer = targetPlayer.isLoanListed || (!targetPlayer.isTransferListed && targetPlayer.age <= 22 && Math.random() < 0.40);
          
          const contractFactor = targetPlayer.contractYears <= 1 ? 0.85 : 1.10;
          const feeMultiplier = (0.95 + Math.random() * 0.25) * contractFactor;
          const maxAffordableByBuyer = Math.max(500000, Math.floor(buyer.transferBudget * 0.90));
          const calculatedFee = isLoanOffer ? Math.round(targetPlayer.marketValue * 0.12) : Math.round(targetPlayer.marketValue * feeMultiplier);
          const fee = Math.min(maxAffordableByBuyer, calculatedFee);
          const remainingForBonus = Math.max(0, maxAffordableByBuyer - fee);
          const bonusFee = isLoanOffer ? 0 : Math.min(remainingForBonus, Math.round(targetPlayer.marketValue * 0.10));
          
          const newOffer: IncomingAIOffer = {
            id: `in_offer_${Date.now()}_${targetPlayer.id}`,
            date: updatedState.currentDate,
            buyerClubId: buyer.id,
            playerId: targetPlayer.id,
            type: isLoanOffer ? (targetPlayer.age <= 21 ? 'dev_loan' : 'loan') : 'permanent',
            fee,
            bonusFee,
            bonusCondition: isLoanOffer ? undefined : '公式戦20試合出場時',
            installments: 1,
            sellOnPercentage: 0,
            buybackClause: false,
            wageContribution: Math.round(targetPlayer.wage * 0.9),
            buyOptionFee: isLoanOffer ? Math.round(targetPlayer.marketValue * 1.3) : undefined,
            status: 'pending',
            negotiationRounds: 0,
            aiPatience: 3,
            dialogueHistory: [
              {
                speaker: 'ai',
                message: `${buyer.name}: 「${targetPlayer.name}の獲得に向けて、基本移籍金 €${(fee / 1000000).toFixed(1)}M${bonusFee > 0 ? ` ＋ 活躍ボーナス €${(bonusFee / 1000000).toFixed(1)}M` : ''} を提示いたします。」`,
                termsSummary: `移籍金: €${(fee / 1000000).toFixed(1)}M${bonusFee > 0 ? ` + ボーナス€${(bonusFee / 1000000).toFixed(1)}M` : ''}`
              }
            ]
          };

          const offerNews: NewsItem = {
            id: `news_in_offer_${Date.now()}`,
            date: updatedState.currentDate,
            headline: `【移籍オファー着信】${buyer.name}から${targetPlayer.name}への獲得打診が到着！`,
            body: `${buyer.name}が当クラブ所属の${targetPlayer.name}に対し、${isLoanOffer ? '期限付き移籍（レンタル料€' + (fee/1000).toLocaleString() + 'k）' : '完全移籍（基本額€' + (fee/1000000).toFixed(1) + 'M＋ボーナス）'}オファーを正式提示しました。「移籍市場」タブで受諾・拒否・直接交渉が可能です。`,
            category: 'transfer',
            relatedClubId: userClub.id,
            relatedPlayerId: targetPlayer.id,
            importance: 'high'
          };

          updatedState = {
            ...updatedState,
            incomingOffers: [...(updatedState.incomingOffers || []), newOffer],
            news: [offerNews, ...updatedState.news]
          };
        }
      }
    }
  }

  // 2. AI to AI clubs autonomous transfer market (skips active user negotiations and non-user shortlist targets handled separately)
  if (Math.random() < 0.25) {
    const allClubs = Object.values(updatedState.clubs).filter(c => c.id !== updatedState.userClubId && c.id !== 'free_agent' && !c.isTournamentOnly && (c.league as string) !== 'uefa-tournament' && c.transferBudget > 15000000);
    if (allClubs.length >= 2) {
      const buyerClub = allClubs[Math.floor(Math.random() * allClubs.length)];
      const sellerClubCandidates = allClubs.filter(c => c.id !== buyerClub.id && !isRivalClub(buyerClub.id, c.id));
      if (sellerClubCandidates.length > 0) {
        const sellerClub = sellerClubCandidates[Math.floor(Math.random() * sellerClubCandidates.length)];

        const candidatePlayers = sellerClub.playerIds
          .map(id => updatedState.players[id])
          .filter(p => p && !activeNegSet.has(p.id) && !shortlistSet.has(p.id) && p.squadRole !== '絶対的主力' && p.marketValue < buyerClub.transferBudget * 0.65 && p.ovr >= 75);

        if (candidatePlayers.length > 0) {
          const targetPlayer = candidatePlayers[Math.floor(Math.random() * candidatePlayers.length)];
          const agreedFee = Math.round(targetPlayer.marketValue * (1.05 + Math.random() * 0.20));

          const mockNegotiation: TransferNegotiation = {
            id: `ai_neg_${Date.now()}`,
            playerId: targetPlayer.id,
            sellerClubId: sellerClub.id,
            buyerClubId: buyerClub.id,
            status: 'completed',
            isLoan: false,
            initialAskingPrice: targetPlayer.marketValue,
            currentBidFee: agreedFee,
            clubPatience: 3,
            clubMessages: [],
            wageOffered: Math.round(targetPlayer.wage * 1.15),
            wageDemanded: Math.round(targetPlayer.wage * 1.15),
            contractYearsOffered: 4,
            squadRoleOffered: '重要選手',
            signingBonusOffered: 1000000,
            playerPatience: 3,
            playerMessages: []
          };

          updatedState = executeTransferCompletion(updatedState, mockNegotiation);
        }
      }
    }
  }

  // 3. AI Clubs Autonomous Free Agent Signing (skipping active user negotiations)
  const availableFreeAgents = Object.values(updatedState.players).filter(p => 
    (p.clubId === 'free_agent' || p.clubId === '') && !activeNegSet.has(p.id) && !shortlistSet.has(p.id)
  );

  if (availableFreeAgents.length > 0 && Math.random() < 0.22) {
    const sortedCandidates = [...availableFreeAgents].sort((a, b) => b.ovr - a.ovr);
    const targetFA = (sortedCandidates.length >= 3 && Math.random() < 0.70)
      ? sortedCandidates[Math.floor(Math.random() * Math.min(3, sortedCandidates.length))]
      : sortedCandidates[Math.floor(Math.random() * sortedCandidates.length)];

    const eligibleClubs = Object.values(updatedState.clubs).filter(c => 
      c.id !== updatedState.userClubId && 
      c.id !== 'free_agent' &&
      !c.isTournamentOnly &&
      (c.league as string) !== 'uefa-tournament' &&
      (c.playerIds?.length || 0) < 32 &&
      (c.tier === 'Elite' || c.tier === 'Upper' || c.wageBudget > targetFA.wage * 4)
    );

    if (eligibleClubs.length > 0) {
      const topClubs = eligibleClubs.filter(c => c.tier === 'Elite' || c.tier === 'Upper');
      const buyerClub = (targetFA.ovr >= 84 && topClubs.length > 0)
        ? topClubs[Math.floor(Math.random() * topClubs.length)]
        : eligibleClubs[Math.floor(Math.random() * eligibleClubs.length)];

      const freeAgentNegotiation: TransferNegotiation = {
        id: `ai_fa_neg_${Date.now()}_${targetFA.id}`,
        playerId: targetFA.id,
        sellerClubId: 'free_agent',
        buyerClubId: buyerClub.id,
        status: 'completed',
        isLoan: false,
        negotiationType: 'permanent',
        initialAskingPrice: 0,
        currentBidFee: 0,
        clubPatience: 3,
        clubMessages: [],
        wageOffered: targetFA.wage,
        wageDemanded: targetFA.wage,
        contractYearsOffered: targetFA.age >= 38 ? 1 : 2,
        squadRoleOffered: targetFA.ovr >= 84 ? '絶対的主力' : '重要選手',
        signingBonusOffered: 1500000,
        playerPatience: 3,
        playerMessages: []
      };

      updatedState = executeTransferCompletion(updatedState, freeAgentNegotiation);
    }
  }

  return updatedState;
}
