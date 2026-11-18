import React, { useState, useMemo } from 'react';
import { GameWorldState, Player, Position, TransferNegotiation, IncomingAIOffer, Club } from '../../types/game';
import { 
  handleClubNegotiationStep, 
  handlePlayerNegotiationStep, 
  executeTransferCompletion,
  evaluateAICounterProposal,
  calculatePlayerInterestInUserClub,
  calculatePlayerValuation,
  createTransferNegotiation,
  finalizeAgreedTransfer,
  withdrawNegotiation
} from '../../engine/transferEngine';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';

interface Props {
  state: GameWorldState;
  onUpdateState: (newState: GameWorldState) => void;
  onSelectPlayer: (player: Player) => void;
}

const ALL_POSITIONS: Position[] = ['ST', 'CF', 'RW', 'LW', 'CAM', 'CM', 'CDM', 'RM', 'LM', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'GK'];

export const TransferMarketTab: React.FC<Props> = ({ state, onUpdateState, onSelectPlayer }) => {
  // 1. Text Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // 2. Positions (multi-select)
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);
  
  // 3. Include Secondary/Historical positions
  const [includeSecondary, setIncludeSecondary] = useState(true);

  // 4. Playstyle
  const [playstyleFilter, setPlaystyleFilter] = useState<string>('ALL');

  // 5. Age range
  const [minAge, setMinAge] = useState<number>(15);
  const [maxAge, setMaxAge] = useState<number>(42);

  // 6. OVR range
  const [minOvr, setMinOvr] = useState<number>(50);
  const [maxOvr, setMaxOvr] = useState<number>(99);

  // 7. Potential range
  const [minPotential, setMinPotential] = useState<number>(50);
  const [maxPotential, setMaxPotential] = useState<number>(99);

  // 8. Max Market Value (in Millions)
  const [maxMarketValueM, setMaxMarketValueM] = useState<number>(200);

  // 9. Max Wage (in Thousands)
  const [maxWageK, setMaxWageK] = useState<number>(600);

  // 10. League
  const [leagueFilter, setLeagueFilter] = useState<string>('ALL');

  // 11. Club
  const [clubFilter, setClubFilter] = useState<string>('ALL');

  // 12. Nationality
  const [nationalityFilter, setNationalityFilter] = useState<string>('ALL');

  // 13. Free Agent Only
  const [freeAgentOnly, setFreeAgentOnly] = useState<boolean>(false);

  // 14. Transfer Listed Only
  const [transferListedOnly, setTransferListedOnly] = useState<boolean>(false);

  // 15. Loan Listed Only
  const [loanListedOnly, setLoanListedOnly] = useState<boolean>(false);

  // Shortlist (Favorites) Only filter
  const [shortlistOnly, setShortlistOnly] = useState<boolean>(false);

  // 16. Contract Expiring
  const [expiringFilter, setExpiringFilter] = useState<'ALL' | '1year' | '6months'>('ALL');

  // 17. Affordable transfer fee
  const [affordableOnly, setAffordableOnly] = useState<boolean>(false);

  // 18. Affordable wage
  const [affordableWageOnly, setAffordableWageOnly] = useState<boolean>(false);

  // 19. Negotiation ready (cooldown 0)
  const [negotiationReadyOnly, setNegotiationReadyOnly] = useState<boolean>(false);

  // 20. Sort Order
  const [sortBy, setSortBy] = useState<'ovr_desc' | 'ovr_asc' | 'pot_desc' | 'age_asc' | 'age_desc' | 'val_desc' | 'val_asc' | 'wage_desc'>('ovr_desc');

  // UI state
  const [marketViewTab, setMarketViewTab] = useState<'market' | 'shortlist' | 'negotiations'>('market');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [displayLimit, setDisplayLimit] = useState<number>(60);
  const [activeNegotiation, setActiveNegotiation] = useState<TransferNegotiation | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Negotiation input states
  const [negotiationType, setNegotiationType] = useState<'permanent' | 'loan' | 'buy_option' | 'dev_loan'>('permanent');
  const [buyOptionFee, setBuyOptionFee] = useState<number>(0);
  const [bidFee, setBidFee] = useState<number>(0);
  const [wageOffer, setWageOffer] = useState<number>(0);
  const [contractYears, setContractYears] = useState<number>(3);
  const [squadRole, setSquadRole] = useState<Player['squadRole']>('重要選手');
  const [signingBonus, setSigningBonus] = useState<number>(500000);
  const [joinTimingChoice, setJoinTimingChoice] = useState<'immediate' | 'next_window' | 'next_season'>('immediate');
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;

  const shortlistSet = useMemo(() => {
    const ids = new Set<string>(state.shortlistPlayerIds || []);
    Object.values(state.players).forEach(p => {
      if (p.isOnShortlist) ids.add(p.id);
    });
    return ids;
  }, [state.shortlistPlayerIds, state.players]);

  const shortlistPlayers = useMemo(() => {
    return Array.from(shortlistSet)
      .map(id => state.players[id])
      .filter((p): p is Player => Boolean(p && p.clubId !== state.userClubId))
      .sort((a, b) => b.ovr - a.ovr);
  }, [shortlistSet, state.players, state.userClubId]);

  const negotiationsList = useMemo(() => {
    const statusOrder: Record<TransferNegotiation['status'], number> = {
      terms_agreed: 0,
      player_negotiating: 1,
      club_agreed: 2,
      club_negotiating: 3,
      hijacked: 4,
      collapsed: 5,
      completed: 6
    };
    return Object.values(state.negotiations || {})
      .filter((n): n is TransferNegotiation => Boolean(n && state.players[n.playerId]))
      .sort((a, b) => {
        const oa = statusOrder[a.status] ?? 9;
        const ob = statusOrder[b.status] ?? 9;
        if (oa !== ob) return oa - ob;
        return (b.lastUpdatedDate || '').localeCompare(a.lastUpdatedDate || '');
      });
  }, [state.negotiations, state.players]);

  const toggleShortlist = (playerId: string) => {
    const currentList = state.shortlistPlayerIds || [];
    const isCurrentlyIn = shortlistSet.has(playerId);
    const nextList = isCurrentlyIn
      ? currentList.filter(id => id !== playerId)
      : Array.from(new Set([...currentList, playerId]));
    const target = state.players[playerId];
    const updatedPlayers = target
      ? { ...state.players, [playerId]: { ...target, isOnShortlist: !isCurrentlyIn } }
      : state.players;
    onUpdateState({
      ...state,
      shortlistPlayerIds: nextList,
      players: updatedPlayers
    });
  };

  const getCooldownDays = (playerId: string): number => {
    const neg = state.negotiations[playerId];
    if (!neg || !neg.cooldownUntil) return 0;
    const diff = Math.ceil((new Date(neg.cooldownUntil).getTime() - new Date(state.currentDate).getTime()) / (1000 * 3600 * 24));
    return Math.max(0, diff);
  };

  // Dynamic dropdown options derived from live database
  const availablePlaystyles = useMemo(() => {
    return Array.from(new Set(Object.values(state.players).map(p => p.playstyle).filter(Boolean))).sort();
  }, [state.players]);

  const availableNationalities = useMemo(() => {
    return Array.from(new Set(Object.values(state.players).map(p => p.nationality).filter(Boolean))).sort();
  }, [state.players]);

  const availableClubs = useMemo(() => {
    return Object.values(state.clubs)
      .filter(c =>
        c.id !== 'free_agent' &&
        !c.isTournamentOnly &&
        (c.league as string) !== 'uefa-tournament' &&
        (leagueFilter === 'ALL' || c.league === leagueFilter)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.clubs, leagueFilter]);

  // Comprehensive 20-Criteria Filter & Sort
  const allTargetPlayers = useMemo(() => {
    const filtered = Object.values(state.players).filter(p => {
      // 1. Exclude own club & ephemeral tournament players
      if (p.clubId === state.userClubId) return false;
      if (p.id.startsWith('euro_synth_')) return false;
      const pClub = state.clubs[p.clubId];
      if (pClub && (pClub.isTournamentOnly || (pClub.league as string) === 'uefa-tournament')) return false;

      // 2. Search term (name or club name)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const clubName = state.clubs[p.clubId]?.name?.toLowerCase() || '';
        if (!p.name.toLowerCase().includes(term) && !clubName.includes(term)) {
          return false;
        }
      }

      // 3. Position filter (multi-select + secondary support)
      if (selectedPositions.length > 0) {
        if (includeSecondary) {
          const playable = [
            p.position,
            ...(p.preferredPositions || []),
            ...(p.secondaryPositions || []),
            ...(p.historicalPositions || []),
            ...(p.altPositions || [])
          ];
          if (!selectedPositions.some(pos => playable.includes(pos))) {
            return false;
          }
        } else {
          if (!selectedPositions.includes(p.position)) {
            return false;
          }
        }
      }

      // 4. Playstyle
      if (playstyleFilter !== 'ALL' && p.playstyle !== playstyleFilter) {
        return false;
      }

      // 5. Age range
      if (p.age < minAge || p.age > maxAge) {
        return false;
      }

      // 6. OVR range
      if (p.ovr < minOvr || p.ovr > maxOvr) {
        return false;
      }

      // 7. Potential range
      const pot = p.potential ?? (p.ovr + 3);
      if (pot < minPotential || pot > maxPotential) {
        return false;
      }

      // 8. Market Value Max
      if (maxMarketValueM < 200 && p.marketValue > maxMarketValueM * 1000000) {
        return false;
      }

      // 9. Wage Max
      if (maxWageK < 600 && p.wage > maxWageK * 1000) {
        return false;
      }

      // 10. League
      if (leagueFilter !== 'ALL') {
        const club = state.clubs[p.clubId];
        if (!club || club.league !== leagueFilter) return false;
      }

      // 11. Club
      if (clubFilter !== 'ALL' && p.clubId !== clubFilter) {
        return false;
      }

      // 12. Nationality
      if (nationalityFilter !== 'ALL' && p.nationality !== nationalityFilter) {
        return false;
      }

      // 13. Free agent only
      if (freeAgentOnly && p.clubId !== 'free_agent' && p.clubId !== '') {
        return false;
      }

      // 14. Transfer listed only
      if (transferListedOnly && !p.transferListed) {
        return false;
      }

      // 15. Loan listed only
      if (loanListedOnly && !p.loanListed) {
        return false;
      }

      // Shortlist only
      if (shortlistOnly) {
        const isShortlisted = (state.shortlistPlayerIds && state.shortlistPlayerIds.includes(p.id)) || p.isOnShortlist;
        if (!isShortlisted) return false;
      }

      // 16. Expiring contract
      if (expiringFilter === '1year' && (p.contractYearsRemaining || 3) > 1) {
        return false;
      }
      if (expiringFilter === '6months' && (p.contractYearsRemaining || 3) > 0.5) {
        return false;
      }

      // 17. Affordable transfer budget
      if (affordableOnly && userClub && p.marketValue > userClub.transferBudget) {
        return false;
      }

      // 18. Affordable wage budget
      if (affordableWageOnly && userClub && p.wage > userClub.wageBudget) {
        return false;
      }

      // 19. Negotiation ready (cooldown === 0)
      if (negotiationReadyOnly) {
        const cooldown = getCooldownDays(p.id);
        if (cooldown > 0) return false;
      }

      return true;
    });

    // 20. Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'ovr_desc': return b.ovr - a.ovr;
        case 'ovr_asc': return a.ovr - b.ovr;
        case 'pot_desc': return (b.potential ?? b.ovr) - (a.potential ?? a.ovr);
        case 'age_asc': return a.age - b.age;
        case 'age_desc': return b.age - a.age;
        case 'val_desc': return b.marketValue - a.marketValue;
        case 'val_asc': return a.marketValue - b.marketValue;
        case 'wage_desc': return b.wage - a.wage;
        default: return b.ovr - a.ovr;
      }
    });

    return filtered;
  }, [
    state.players, 
    state.clubs, 
    state.userClubId, 
    userClub,
    searchTerm, 
    selectedPositions, 
    includeSecondary, 
    playstyleFilter, 
    minAge, 
    maxAge, 
    minOvr, 
    maxOvr, 
    minPotential, 
    maxPotential, 
    maxMarketValueM, 
    maxWageK, 
    leagueFilter, 
    clubFilter, 
    nationalityFilter, 
    freeAgentOnly, 
    transferListedOnly, 
    loanListedOnly,
    shortlistOnly,
    state.shortlistPlayerIds,
    state.negotiations,
    state.currentDate,
    expiringFilter, 
    affordableOnly, 
    affordableWageOnly, 
    negotiationReadyOnly, 
    sortBy
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedPositions([]);
    setIncludeSecondary(true);
    setPlaystyleFilter('ALL');
    setMinAge(15);
    setMaxAge(42);
    setMinOvr(50);
    setMaxOvr(99);
    setMinPotential(50);
    setMaxPotential(99);
    setMaxMarketValueM(200);
    setMaxWageK(600);
    setLeagueFilter('ALL');
    setClubFilter('ALL');
    setNationalityFilter('ALL');
    setFreeAgentOnly(false);
    setTransferListedOnly(false);
    setLoanListedOnly(false);
    setExpiringFilter('ALL');
    setAffordableOnly(false);
    setAffordableWageOnly(false);
    setNegotiationReadyOnly(false);
    setSortBy('ovr_desc');
  };

  const persistNegotiationInState = (neg: TransferNegotiation, baseState: GameWorldState = state): GameWorldState => {
    const nextState: GameWorldState = {
      ...baseState,
      negotiations: {
        ...(baseState.negotiations || {}),
        [neg.playerId]: neg
      }
    };
    onUpdateState(nextState);
    return nextState;
  };

  const syncInputsFromNegotiation = (neg: TransferNegotiation, targetPlayer: Player) => {
    setNegotiationType(neg.negotiationType || (neg.isLoan ? 'loan' : 'permanent'));
    setBuyOptionFee(neg.buyOptionFee ?? Math.round(targetPlayer.marketValue * 1.25));
    setBidFee(neg.currentBidFee);
    setWageOffer(neg.wageOffered);
    setContractYears(neg.contractYearsOffered);
    setSquadRole(neg.squadRoleOffered);
    setSigningBonus(neg.signingBonusOffered);
    setJoinTimingChoice(neg.joinTiming || (state.isTransferWindowOpen ? 'immediate' : 'next_window'));
    setBudgetError(null);
  };

  const startNegotiation = (targetPlayer: Player) => {
    setActionFeedback(null);
    const existing = state.negotiations?.[targetPlayer.id];
    if (
      existing &&
      ['club_negotiating', 'club_agreed', 'player_negotiating', 'terms_agreed'].includes(existing.status)
    ) {
      // Refresh interest readout and resume persisted negotiation
      const refreshedInterest = calculatePlayerInterestInUserClub(
        targetPlayer,
        userClub,
        state.manager,
        Boolean(targetPlayer.userDeclaredInterest || state.declaredInterestPlayerIds?.includes(targetPlayer.id)),
        { standings: state.standings, tournaments: state.tournaments, clubs: state.clubs, currentDate: state.currentDate }
      );
      const resumed: TransferNegotiation = {
        ...existing,
        interestTier: refreshedInterest.level,
        interestScore: refreshedInterest.score,
        interestReasons: refreshedInterest.reasons
      };
      syncInputsFromNegotiation(resumed, targetPlayer);
      setActiveNegotiation(resumed);
      return;
    }

    const cooldown = getCooldownDays(targetPlayer.id);
    if (cooldown > 0) {
      setActionFeedback({
        type: 'error',
        message: `${targetPlayer.name}との再交渉は10日間ルールによりあと ${cooldown} 日間待機が必要です。`
      });
      return;
    }

    const isFreeAgent = targetPlayer.clubId === 'free_agent' || targetPlayer.clubId === '';
    const sellerClub = state.clubs[targetPlayer.clubId] || state.clubs['free_agent'];
    if (!userClub) return;
    if (!sellerClub && !isFreeAgent) return;

    const initialNegotiation = createTransferNegotiation(state, targetPlayer);
    syncInputsFromNegotiation(initialNegotiation, targetPlayer);
    persistNegotiationInState(initialNegotiation);
    setActiveNegotiation(initialNegotiation);
  };

  const submitClubBid = () => {
    if (!activeNegotiation || !userClub) return;
    const targetPlayer = state.players[activeNegotiation.playerId];
    const sellerClub = state.clubs[activeNegotiation.sellerClubId];
    if (!targetPlayer || !sellerClub) return;

    if (bidFee > userClub.transferBudget) {
      setBudgetError(`移籍予算が不足しています (所持予算: €${(userClub.transferBudget / 1000000).toFixed(1)}M / 提示額: €${(bidFee / 1000000).toFixed(1)}M)`);
      return;
    }
    setBudgetError(null);

    const updatedWithMode: TransferNegotiation = {
      ...activeNegotiation,
      isLoan: negotiationType !== 'permanent',
      negotiationType,
      buyOptionFee: negotiationType === 'buy_option' ? buyOptionFee : undefined
    };

    const res = handleClubNegotiationStep(updatedWithMode, bidFee, sellerClub, targetPlayer, state.currentDate);

    if (res.isAgreed) {
      const updatedWithPlayerStage: TransferNegotiation = {
        ...res.updatedNegotiation,
        status: 'player_negotiating',
        playerMessages:
          res.updatedNegotiation.playerMessages && res.updatedNegotiation.playerMessages.length > 0
            ? res.updatedNegotiation.playerMessages
            : [
                {
                  sender: 'agent',
                  text: `「${targetPlayer.name}の公認代理人です。クラブ間合意の報告を受けました。本人の希望条件は週給€${Math.round((res.updatedNegotiation.wageDemanded || targetPlayer.wage * 1.15) / 1000)}k前後、契約年数、および明確なチーム内役割です。」`,
                  date: state.currentDate
                }
              ]
      };
      setActiveNegotiation(updatedWithPlayerStage);
      persistNegotiationInState(updatedWithPlayerStage);
    } else {
      setActiveNegotiation(res.updatedNegotiation);
      persistNegotiationInState(res.updatedNegotiation);
    }
  };

  const submitPlayerContractBid = () => {
    if (!activeNegotiation || !userClub) return;
    const targetPlayer = state.players[activeNegotiation.playerId];
    if (!targetPlayer) return;

    const availableWage = userClub.wageBudget - userClub.currentWageSpend;
    if (wageOffer > availableWage) {
      setBudgetError(`週給予算が不足しています (空き週給枠: €${(availableWage / 1000).toFixed(0)}k / 提示週給: €${(wageOffer / 1000).toFixed(0)}k)`);
      return;
    }
    setBudgetError(null);

    const res = handlePlayerNegotiationStep(
      activeNegotiation,
      wageOffer,
      contractYears,
      squadRole,
      signingBonus,
      targetPlayer,
      userClub,
      state.currentDate
    );

    const chosenTiming = state.isTransferWindowOpen
      ? joinTimingChoice
      : (joinTimingChoice === 'immediate' ? 'next_window' : joinTimingChoice);

    const nextNegotiation: TransferNegotiation = {
      ...res.updatedNegotiation,
      joinTiming: chosenTiming
    };

    setActiveNegotiation(nextNegotiation);
    persistNegotiationInState(nextNegotiation);

    if (res.isTermsAgreed) {
      setActionFeedback({
        type: 'info',
        message: `${targetPlayer.name}と個人条件に合意しました。内容を確認し「契約を最終確定する」を押すと入団が確定します。`
      });
    }
  };

  const handleFinalizeNegotiation = (playerId: string, chosenTiming?: 'immediate' | 'next_window' | 'next_season') => {
    const res = finalizeAgreedTransfer(state, playerId, chosenTiming);
    if (!res.success) {
      setBudgetError(res.message);
      setActionFeedback({ type: 'error', message: res.message });
      return;
    }
    setBudgetError(null);
    onUpdateState(res.updatedState);
    const completedNeg = res.updatedState.negotiations?.[playerId] || null;
    if (activeNegotiation?.playerId === playerId) {
      setActiveNegotiation(completedNeg);
    }
    setActionFeedback({ type: 'success', message: res.message });
  };

  const handleWithdrawNegotiation = (playerId: string) => {
    const nextState = withdrawNegotiation(state, playerId);
    onUpdateState(nextState);
    if (activeNegotiation?.playerId === playerId) {
      setActiveNegotiation(null);
    }
    setActionFeedback({ type: 'info', message: '交渉リストから削除しました。' });
  };

  // Handle incoming AI offer action (Accept / Reject)
  const handleIncomingOfferAction = (offerId: string, action: 'accept' | 'reject') => {
    const offer = state.incomingOffers?.find(o => o.id === offerId);
    if (!offer || !userClub) return;

    if (action === 'reject') {
      const updatedOffers = state.incomingOffers?.map(o => o.id === offerId ? { ...o, status: 'rejected' as const } : o);
      onUpdateState({ ...state, incomingOffers: updatedOffers });
      return;
    }

    // Accept transfer / loan
    const targetPlayer = state.players[offer.playerId];
    const buyerClub = state.clubs[offer.buyerClubId];
    if (!targetPlayer || !buyerClub) return;

    const mockNeg: TransferNegotiation = {
      id: `in_neg_${Date.now()}`,
      playerId: targetPlayer.id,
      sellerClubId: userClub.id,
      buyerClubId: buyerClub.id,
      status: 'completed',
      isLoan: offer.type !== 'permanent',
      negotiationType: offer.type,
      buyOptionFee: offer.buyOptionFee,
      initialAskingPrice: offer.fee,
      currentBidFee: offer.fee,
      clubPatience: 3,
      clubMessages: [],
      wageOffered: targetPlayer.wage,
      wageDemanded: targetPlayer.wage,
      contractYearsOffered: 3,
      squadRoleOffered: '重要選手',
      signingBonusOffered: 0,
      playerPatience: 3,
      playerMessages: []
    };

    const nextState = executeTransferCompletion(state, mockNeg);
    const updatedOffers = nextState.incomingOffers?.map(o => o.id === offerId ? { ...o, status: 'accepted' as const } : o);
    onUpdateState({ ...nextState, incomingOffers: updatedOffers });
    setDirectNegotiatingOfferId(null);
  };

  // Direct Negotiation for incoming offers (Requirements 5, 6, 7)
  const [directNegotiatingOfferId, setDirectNegotiatingOfferId] = useState<string | null>(null);
  const [proposedFee, setProposedFee] = useState<number>(0);
  const [proposedBonus, setProposedBonus] = useState<number>(0);
  const [installments, setInstallments] = useState<number>(1);
  const [sellOnPercentage, setSellOnPercentage] = useState<number>(0);
  const [buybackClause, setBuybackClause] = useState<boolean>(false);
  const [negotiationAgreed, setNegotiationAgreed] = useState<boolean>(false);

  const startDirectNegotiation = (offer: IncomingAIOffer) => {
    setDirectNegotiatingOfferId(offer.id);
    setProposedFee(offer.fee);
    setProposedBonus(offer.bonusFee || 0);
    setInstallments(offer.installments || 1);
    setSellOnPercentage(offer.sellOnPercentage || 0);
    setBuybackClause(offer.buybackClause || false);
    setNegotiationAgreed(false);
  };

  const handleSendCounterProposal = (offer: IncomingAIOffer) => {
    const targetPlayer = state.players[offer.playerId];
    const buyerClub = state.clubs[offer.buyerClubId];
    if (!targetPlayer || !buyerClub) return;

    const result = evaluateAICounterProposal(
      offer,
      targetPlayer,
      buyerClub,
      proposedFee,
      proposedBonus,
      installments,
      sellOnPercentage,
      buybackClause
    );

    const updatedDialogue = [
      ...(offer.dialogueHistory || []),
      {
        speaker: 'user' as const,
        message: `監督/クラブ提示: 「移籍金 €${(proposedFee / 1000000).toFixed(1)}M${proposedBonus > 0 ? ` ＋ 活躍ボーナス €${(proposedBonus / 1000000).toFixed(1)}M` : ''}${installments > 1 ? ` (${installments}回分割)` : ''}${sellOnPercentage > 0 ? ` (次回売却益${sellOnPercentage}%)` : ''}${buybackClause ? ` (買戻し特約)` : ''} を提案する。」`,
        termsSummary: `移籍金: €${(proposedFee / 1000000).toFixed(1)}M`
      },
      {
        speaker: 'ai' as const,
        message: `${buyerClub.name}: ${result.aiMessage}`,
        termsSummary: result.decision === 'counter' ? `再提示: €${((result.counterFee || proposedFee) / 1000000).toFixed(1)}M` : undefined
      }
    ];

    if (result.decision === 'accept') {
      setNegotiationAgreed(true);
      const updatedOffer: IncomingAIOffer = {
        ...offer,
        fee: proposedFee,
        bonusFee: proposedBonus,
        installments,
        sellOnPercentage,
        buybackClause,
        aiPatience: result.newPatience,
        dialogueHistory: updatedDialogue
      };
      const updatedOffers = state.incomingOffers?.map(o => o.id === offer.id ? updatedOffer : o);
      onUpdateState({ ...state, incomingOffers: updatedOffers });
    } else if (result.decision === 'reject') {
      const updatedOffer: IncomingAIOffer = {
        ...offer,
        status: 'rejected',
        aiPatience: 0,
        dialogueHistory: updatedDialogue
      };
      const updatedOffers = state.incomingOffers?.map(o => o.id === offer.id ? updatedOffer : o);
      onUpdateState({ ...state, incomingOffers: updatedOffers });
    } else {
      // Counter offer from AI
      if (result.counterFee) setProposedFee(result.counterFee);
      if (result.counterBonus !== undefined) setProposedBonus(result.counterBonus);
      const updatedOffer: IncomingAIOffer = {
        ...offer,
        fee: result.counterFee || offer.fee,
        bonusFee: result.counterBonus || offer.bonusFee,
        aiPatience: result.newPatience,
        negotiationRounds: (offer.negotiationRounds || 0) + 1,
        dialogueHistory: updatedDialogue
      };
      const updatedOffers = state.incomingOffers?.map(o => o.id === offer.id ? updatedOffer : o);
      onUpdateState({ ...state, incomingOffers: updatedOffers });
    }
  };

  const targetPlayerInNeg = activeNegotiation ? state.players[activeNegotiation.playerId] : null;
  const sellerClubInNeg = activeNegotiation 
    ? (state.clubs[activeNegotiation.sellerClubId] || { id: 'free_agent', name: 'フリーエージェント (無所属)' } as Club) 
    : null;

  return (
    <div className="space-y-5 pb-20">
      
      {/* Header & Market Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white font-display">移籍市場 & スカウティング</h2>
              <span className="text-xs font-semibold text-emerald-400 tabular-nums">
                {state.isTransferWindowOpen ? `移籍期間開口中 (残${state.transferWindowClosingDays}日)` : '移籍期間外'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              世界各国の実在選手を検索し、お気に入り登録・クラブ間交渉・個人条件合意を経て最終契約を確定します。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowSummaryModal(true)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              移籍市場まとめ
            </button>
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-right tabular-nums">
              <div className="text-[11px] text-slate-400">使用可能 移籍予算</div>
              <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                €{((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Sub-Tabs: Market | Shortlist | Negotiation List */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setMarketViewTab('market')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              marketViewTab === 'market'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            移籍市場
          </button>
          <button
            type="button"
            onClick={() => setMarketViewTab('shortlist')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors tabular-nums cursor-pointer ${
              marketViewTab === 'shortlist'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            ★ お気に入りリスト ({shortlistPlayers.length})
          </button>
          <button
            type="button"
            onClick={() => setMarketViewTab('negotiations')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors tabular-nums cursor-pointer ${
              marketViewTab === 'negotiations'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            交渉リスト ({negotiationsList.length})
          </button>
        </div>

        {actionFeedback && (
          <div
            className={`rounded-xl px-4 py-2.5 text-xs flex items-center justify-between gap-2 border ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : actionFeedback.type === 'error'
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                : 'bg-blue-950/50 border-blue-500/40 text-blue-200'
            }`}
          >
            <span>{actionFeedback.message}</span>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-slate-400 hover:text-white px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* INCOMING AI OFFERS SECTION (Requirement 7) */}
      {state.incomingOffers && state.incomingOffers.filter(o => o.status === 'pending').length > 0 && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-emerald-300">
                他クラブから届いている移籍オファー ({state.incomingOffers.filter(o => o.status === 'pending').length}件)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">受諾すると移籍金がクラブ資金へ即時反映されます</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.incomingOffers.filter(o => o.status === 'pending').map(offer => {
              const targetPlayer = state.players[offer.playerId];
              const buyer = state.clubs[offer.buyerClubId];
              if (!targetPlayer || !buyer) return null;

              const isLoan = offer.type !== 'permanent';
              return (
                <div key={offer.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white">{targetPlayer.name} ({targetPlayer.position})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono font-bold">
                        {offer.type === 'dev_loan' ? '育成レンタル' : isLoan ? 'レンタル' : '完全移籍'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      買い手: <strong className="text-emerald-400">{buyer.name}</strong>
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                      提示額: €{(offer.fee / 1000000).toFixed(1)}M {offer.buyOptionFee ? `(買取OP €${(offer.buyOptionFee / 1000000).toFixed(1)}M)` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleIncomingOfferAction(offer.id, 'accept')}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      受諾
                    </button>
                    <button
                      type="button"
                      onClick={() => startDirectNegotiation(offer)}
                      className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      直接交渉
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncomingOfferAction(offer.id, 'reject')}
                      className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      拒否
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DIRECT NEGOTIATION MODAL (Requirements 5, 6, 7 & 28) */}
      {directNegotiatingOfferId && (() => {
        const offer = state.incomingOffers?.find(o => o.id === directNegotiatingOfferId);
        if (!offer) return null;
        const targetPlayer = state.players[offer.playerId];
        const buyerClub = state.clubs[offer.buyerClubId];
        if (!targetPlayer || !buyerClub) return null;

        const isRejected = offer.status === 'rejected';

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
            <div className="bg-slate-900 border-2 border-slate-700/80 rounded-[28px] max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
              
              {/* Smartphone Messenger Header Bar */}
              <div className="bg-slate-950/95 px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md border border-white/15"
                    style={{ backgroundColor: buyerClub.primaryColor || '#2563eb' }}
                  >
                    {buyerClub.shortName?.slice(0, 3) || 'CLB'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                        交渉チャット
                      </span>
                      <span className="text-[11px] text-amber-400 font-mono tabular-nums">
                        忍耐度 {'★'.repeat(offer.aiPatience ?? 3)}{'☆'.repeat(Math.max(0, 3 - (offer.aiPatience ?? 3)))}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                      {buyerClub.name} 強化担当
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectNegotiatingOfferId(null)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  aria-label="交渉チャットを閉じる"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* Player Profile Summary Pill-free Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">交渉対象選手</span>
                    <span className="text-sm font-bold text-white truncate block">{targetPlayer.name} ({targetPlayer.position}, {targetPlayer.age}歳)</span>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
                      OVR <strong className="text-emerald-400">{targetPlayer.ovr}</strong> · 市場価値 <strong className="text-white">€{(targetPlayer.marketValue / 1000000).toFixed(1)}M</strong>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">相手移籍予算</span>
                    <span className="text-sm font-mono font-bold text-blue-400 tabular-nums">€{(buyerClub.transferBudget / 1000000).toFixed(1)}M</span>
                    <span className="text-[10px] text-slate-500 block">格: {buyerClub.tier}</span>
                  </div>
                </div>

                {/* Smartphone Messaging Chat Feed */}
                <div className="space-y-3 max-h-56 overflow-y-auto p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
                  {(offer.dialogueHistory || []).length === 0 ? (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-slate-200 shadow-sm">
                        <span className="text-[10px] text-blue-400 font-bold block mb-1">{buyerClub.shortName} 強化部</span>
                        <p className="leading-relaxed">
                          {targetPlayer.name}の獲得について€{(offer.fee / 1000000).toFixed(1)}Mの正式オファーをお送りしました。ご希望条件をご返信ください。
                        </p>
                      </div>
                    </div>
                  ) : (
                    (offer.dialogueHistory || []).map((diag, idx) => {
                      const isUser = diag.speaker === 'user';
                      return (
                        <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl shadow-sm ${
                              isUser
                                ? 'rounded-tr-sm bg-emerald-600/25 border border-emerald-500/40 text-emerald-100'
                                : 'rounded-tl-sm bg-slate-900 border border-slate-800 text-slate-200'
                            }`}
                          >
                            <span className={`text-[10px] font-bold block mb-1 ${isUser ? 'text-emerald-300 text-right' : 'text-blue-400'}`}>
                              {isUser ? 'あなた（監督）' : `${buyerClub.shortName} 強化部`}
                            </span>
                            <div className="leading-relaxed">{diag.message}</div>
                            {diag.termsSummary && (
                              <div className="text-[10px] text-slate-300/90 mt-1.5 pt-1 border-t border-white/10 font-mono tabular-nums">
                                {diag.termsSummary}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Negotiation Terms Input Form (if not rejected) */}
                {!isRejected ? (
                  <div className="space-y-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    {/* Fee proposal */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5 flex-wrap gap-2">
                        <span className="font-bold text-slate-300">① 基本移籍金（固定支払額）</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">直接数値入力: €</span>
                          <input
                            type="number"
                            step={500000}
                            min={100000}
                            value={proposedFee}
                            onChange={e => setProposedFee(Math.max(100000, Number(e.target.value)))}
                            className="w-36 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-400 text-right tabular-nums"
                          />
                          <span className="font-mono font-bold text-emerald-400 text-xs tabular-nums">
                            (€{(proposedFee / 1000000).toFixed(1)}M)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[-5000000, -2000000, 2000000, 5000000, 10000000].map(delta => (
                          <button
                            key={delta}
                            type="button"
                            onClick={() => setProposedFee(prev => Math.max(1000000, prev + delta))}
                            className="min-h-[38px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer tabular-nums"
                          >
                            {delta > 0 ? `+€${delta / 1000000}M` : `-€${Math.abs(delta) / 1000000}M`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bonus conditions */}
                    <div>
                      <span className="text-xs font-bold text-slate-300 block mb-1">② 成果インセンティブ・ボーナス</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                        {[
                          { label: 'ボーナスなし', fee: 0 },
                          { label: '欧州圏進出時 (+€3M)', fee: 3000000 },
                          { label: '公式戦20試合 (+€5M)', fee: 5000000 },
                          { label: 'リーグ優勝時 (+€8M)', fee: 8000000 }
                        ].map(b => (
                          <button
                            key={b.fee}
                            type="button"
                            onClick={() => setProposedBonus(b.fee)}
                            className={`min-h-[44px] p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              proposedBonus === b.fee
                                ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Installments & Clauses */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-1">③ 支払分割</span>
                        <select
                          value={installments}
                          onChange={e => setInstallments(Number(e.target.value))}
                          className="w-full min-h-[44px] bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                        >
                          <option value={1}>一括払い (即時受取)</option>
                          <option value={2}>2回分割払い (翌季受取)</option>
                          <option value={3}>3回分割払い</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-1">④ 次回売却時パーセンテージ</span>
                        <select
                          value={sellOnPercentage}
                          onChange={e => setSellOnPercentage(Number(e.target.value))}
                          className="w-full min-h-[44px] bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                        >
                          <option value={0}>条項なし (0%)</option>
                          <option value={10}>売却益 10% 還元</option>
                          <option value={15}>売却益 15% 還元</option>
                          <option value={20}>売却益 20% 還元</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-1">⑤ 買戻し条項</span>
                        <select
                          value={buybackClause ? 'yes' : 'no'}
                          onChange={e => setBuybackClause(e.target.value === 'yes')}
                          className="w-full min-h-[44px] bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                        >
                          <option value="no">付帯しない</option>
                          <option value="yes">2年以内 €{(targetPlayer.marketValue * 1.5 / 1000000).toFixed(1)}M 買戻し権</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-950/50 border border-red-800 rounded-2xl p-4 text-center text-red-300 text-xs">
                    <strong>交渉は決裂しました。</strong>
                    <p className="mt-1 text-slate-400">相手クラブは提示条件に反発し、オファーを取り下げました。</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  {!isRejected ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleIncomingOfferAction(offer.id, 'reject')}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        交渉打ち切り・拒否
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendCounterProposal(offer)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                          条件メッセージを送信
                        </button>

                        <button
                          type="button"
                          onClick={() => handleIncomingOfferAction(offer.id, 'accept')}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          {negotiationAgreed ? '★ 合意内容で移籍成立！' : '提示条件で受諾'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full text-right">
                      <button
                        type="button"
                        onClick={() => setDirectNegotiatingOfferId(null)}
                        className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                      >
                        閉じる
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Filter and Search Bar with 20-Criteria Capabilities */}
      {marketViewTab === 'market' && (
      <>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Top Row: Search Term, Sort, Toggle Advanced, Reset */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="選手名またはクラブ名で検索 (例: 久保, Saka, Haaland, 三笘, Brighton...)"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="ovr_desc">総合値 OVR (高い順)</option>
              <option value="ovr_asc">総合値 OVR (低い順)</option>
              <option value="pot_desc">ポテンシャル (高い順)</option>
              <option value="val_desc">市場価値 (高い順)</option>
              <option value="val_asc">市場価値 (安い順)</option>
              <option value="wage_desc">週給 (高い順)</option>
              <option value="age_asc">年齢 (若い順)</option>
              <option value="age_desc">年齢 (ベテラン順)</option>
            </select>

            {/* Toggle Detailed Filter Drawer */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showAdvancedFilters
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>詳細フィルタ (20項目)</span>
              {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="全条件をリセット"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">リセット</span>
            </button>
          </div>
        </div>

        {/* Position Filter Multi-Select Pills */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-semibold text-slate-400">ポジション選択 (複数選択可):</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={includeSecondary}
                onChange={e => setIncludeSecondary(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span className="text-[11px] text-emerald-300 font-semibold">適性・副ポジションを含める</span>
            </label>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedPositions([])}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 font-mono ${
                selectedPositions.length === 0
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              ALL (全位置)
            </button>

            {ALL_POSITIONS.map(pos => {
              const isSelected = selectedPositions.includes(pos);
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedPositions(selectedPositions.filter(p => p !== pos));
                    } else {
                      setSelectedPositions([...selectedPositions, pos]);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 font-mono ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {pos}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer (20 Criteria) */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
            {/* Row 1: League, Club, Nationality, Playstyle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">所属リーグ</label>
                <select
                  value={leagueFilter}
                  onChange={e => { setLeagueFilter(e.target.value); setClubFilter('ALL'); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">全リーグ (世界中)</option>
                  <option value="premier-league">🏴󠁧󠁢󠁥󠁮󠁧󠁿 プレミアリーグ (英1部)</option>
                  <option value="championship">🏴󠁧󠁢󠁥󠁮󠁧󠁿 チャンピオンシップ (英2部)</option>
                  <option value="laliga">🇪🇸 ラ・リーガ (西1部)</option>
                  <option value="segunda-division">🇪🇸 セグンダ (西2部)</option>
                  <option value="bundesliga">🇩🇪 ブンデスリーガ (独1部)</option>
                  <option value="2-bundesliga">🇩🇪 2.ブンデスリーガ (独2部)</option>
                  <option value="serie-a">🇮🇹 セリエA (伊1部)</option>
                  <option value="serie-b">🇮🇹 セリエB (伊2部)</option>
                  <option value="ligue-1">🇫🇷 リーグ・アン (仏1部)</option>
                  <option value="ligue-2">🇫🇷 リーグ・ドゥ (仏2部)</option>
                  <option value="primeira-liga">🇵🇹 プリメイラ・リーガ (葡1部)</option>
                  <option value="eredivisie">🇳🇱 エールディヴィジ (蘭1部)</option>
                  <option value="super-lig">🇹🇷 スュペル・リグ (土1部)</option>
                  <option value="pro-league">🇧🇪 ベルギー・プロ・リーグ (白1部)</option>
                  <option value="j1-league">🇯🇵 明治安田J1百年構想リーグ</option>
                  <option value="j2-league">🇯🇵 明治安田J2リーグ</option>
                  <option value="j3-league">🇯🇵 明治安田J3リーグ</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">所属クラブ</label>
                <select
                  value={clubFilter}
                  onChange={e => setClubFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">全クラブ</option>
                  {availableClubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">国籍</label>
                <select
                  value={nationalityFilter}
                  onChange={e => setNationalityFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">全国籍</option>
                  {availableNationalities.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">プレイスタイル</label>
                <select
                  value={playstyleFilter}
                  onChange={e => setPlaystyleFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">全スタイル</option>
                  {availablePlaystyles.map(ps => (
                    <option key={ps} value={ps}>{ps}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Age, OVR, Potential ranges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>年齢範囲</span>
                  <span className="font-mono text-emerald-400">{minAge}歳 〜 {maxAge}歳</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={15}
                    max={42}
                    value={minAge}
                    onChange={e => setMinAge(Math.min(Number(e.target.value), maxAge))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="range"
                    min={15}
                    max={42}
                    value={maxAge}
                    onChange={e => setMaxAge(Math.max(Number(e.target.value), minAge))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>能力値 (OVR) 範囲</span>
                  <span className="font-mono text-emerald-400">{minOvr} 〜 {maxOvr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={50}
                    max={99}
                    value={minOvr}
                    onChange={e => setMinOvr(Math.min(Number(e.target.value), maxOvr))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="range"
                    min={50}
                    max={99}
                    value={maxOvr}
                    onChange={e => setMaxOvr(Math.max(Number(e.target.value), minOvr))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>将来性 (潜在ポテンシャル)</span>
                  <span className="font-mono text-cyan-400">{minPotential} 〜 {maxPotential}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={50}
                    max={99}
                    value={minPotential}
                    onChange={e => setMinPotential(Math.min(Number(e.target.value), maxPotential))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <input
                    type="range"
                    min={50}
                    max={99}
                    value={maxPotential}
                    onChange={e => setMaxPotential(Math.max(Number(e.target.value), minPotential))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Financial Limits & Contract Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>上限移籍金 (推定市場価値)</span>
                  <span className="font-mono text-emerald-400">{maxMarketValueM >= 200 ? '無制限' : `〜€${maxMarketValueM}M`}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={maxMarketValueM}
                  onChange={e => setMaxMarketValueM(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>上限週給</span>
                  <span className="font-mono text-emerald-400">{maxWageK >= 600 ? '無制限' : `〜€${maxWageK}k/週`}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={600}
                  step={10}
                  value={maxWageK}
                  onChange={e => setMaxWageK(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">契約残り期間</label>
                <select
                  value={expiringFilter}
                  onChange={e => setExpiringFilter(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">全選手 (契約期間問わず)</option>
                  <option value="1year">契約残り1年以内 (お買い得/移籍金低下)</option>
                  <option value="6months">契約残り半年以内 (フリー獲得視野)</option>
                </select>
              </div>
            </div>

            {/* Row 4: Status Toggles */}
            <div className="flex items-center flex-wrap gap-2 pt-1 text-xs">
              <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer transition-colors ${
                shortlistOnly ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={shortlistOnly}
                  onChange={e => setShortlistOnly(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="font-semibold">★ 移籍リスト・お気に入り</span>
              </label>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeAgentOnly}
                  onChange={e => setFreeAgentOnly(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-slate-300 font-semibold">フリーエージェントのみ</span>
              </label>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transferListedOnly}
                  onChange={e => setTransferListedOnly(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-slate-300 font-semibold">移籍リスト掲載中</span>
              </label>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={loanListedOnly}
                  onChange={e => setLoanListedOnly(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-slate-300 font-semibold">レンタルリスト掲載中</span>
              </label>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={affordableOnly}
                  onChange={e => setAffordableOnly(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-emerald-300 font-semibold">クラブ移籍予算内</span>
              </label>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={affordableWageOnly}
                  onChange={e => setAffordableWageOnly(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-emerald-300 font-semibold">給与予算内</span>
              </label>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={negotiationReadyOnly}
                  onChange={e => setNegotiationReadyOnly(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-slate-300 font-semibold">即交渉可能 (冷却期間外)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Players List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="text-xs text-slate-400 mb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono text-sm">
              検索該当: {allTargetPlayers.length} 名
            </span>
            <span className="text-[11px] text-slate-500">
              (表示中: {Math.min(allTargetPlayers.length, displayLimit)} 名)
            </span>
          </div>
          <span className="text-[11px]">市場価値は推定評価額です。獲得交渉額とは異なります。</span>
        </div>

        {allTargetPlayers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <div className="text-base mb-1">🔍 該当する選手が見つかりませんでした</div>
            <p>フィルター条件を緩めるか、「リセット」を押して検索条件を初期化してください。</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {allTargetPlayers.slice(0, displayLimit).map(p => {
              const club = state.clubs[p.clubId];
              const potentialVal = p.potential ?? (p.ovr + (p.age <= 21 ? 6 : p.age <= 26 ? 3 : 0));
              const isShortlisted = shortlistSet.has(p.id);
              const existingNeg = state.negotiations?.[p.id];
              const interest = calculatePlayerInterestInUserClub(
                p,
                userClub,
                state.manager,
                Boolean(p.userDeclaredInterest || state.declaredInterestPlayerIds?.includes(p.id)),
                { standings: state.standings, tournaments: state.tournaments, clubs: state.clubs, currentDate: state.currentDate }
              );
              const cooldownDays = getCooldownDays(p.id);
              const isActiveNeg = existingNeg && ['club_negotiating', 'club_agreed', 'player_negotiating'].includes(existingNeg.status);
              const isTermsAgreed = existingNeg?.status === 'terms_agreed';

              return (
                <div 
                  key={p.id} 
                  className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                >
                  {/* Left: Player identity */}
                  <div 
                    onClick={() => onSelectPlayer(p)}
                    className="flex items-center gap-3 cursor-pointer min-w-0"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-bold text-white shrink-0 font-mono tabular-nums">
                      <span className="text-sm font-black text-white">{p.ovr}</span>
                      <span className="text-[9px] text-cyan-400 font-semibold" title={`潜在ポテンシャル: ${potentialVal}`}>
                        P{potentialVal}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white hover:text-emerald-300 transition-colors">
                          {p.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-300">
                          {p.position}
                        </span>
                        {p.shirtNumber && (
                          <span className="text-[11px] text-slate-500 font-mono tabular-nums">#{p.shirtNumber}</span>
                        )}
                        {p.transferListed && (
                          <span className="text-[11px] text-amber-300 font-semibold">移籍リスト</span>
                        )}
                        {p.loanListed && (
                          <span className="text-[11px] text-purple-300 font-semibold">レンタル可</span>
                        )}
                        {(p.clubId === 'free_agent' || !p.clubId) && (
                          <span className="text-[11px] text-amber-300 font-bold">無所属 (FREE)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {p.age}歳 · {p.nationality} · {p.playstyle} · 所属:{' '}
                        <strong className={p.clubId === 'free_agent' || !p.clubId ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {p.clubId === 'free_agent' || !p.clubId ? 'フリー (無所属)' : (club?.name || 'フリー')}
                        </strong>
                        {' · '}
                        関心度:{' '}
                        <span className={
                          interest.level === '非常に高い' ? 'text-emerald-400 font-semibold'
                          : interest.level === '高い' ? 'text-cyan-400 font-semibold'
                          : interest.level === '普通' ? 'text-blue-400 font-semibold'
                          : interest.level === '低い' ? 'text-amber-400 font-semibold'
                          : 'text-rose-400 font-semibold'
                        }>
                          {interest.level} ({interest.score})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Attributes snapshot */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center text-[10px] font-mono tabular-nums">
                    <div className="bg-slate-950 px-2 py-1 rounded-lg">
                      <span className="text-slate-500 block">PAC</span>
                      <span className="font-bold text-white">{p.pace}</span>
                    </div>
                    <div className="bg-slate-950 px-2 py-1 rounded-lg">
                      <span className="text-slate-500 block">SHO</span>
                      <span className="font-bold text-white">{p.shooting}</span>
                    </div>
                    <div className="bg-slate-950 px-2 py-1 rounded-lg">
                      <span className="text-slate-500 block">PAS</span>
                      <span className="font-bold text-white">{p.passing}</span>
                    </div>
                    <div className="bg-slate-950 px-2 py-1 rounded-lg">
                      <span className="text-slate-500 block">DRI</span>
                      <span className="font-bold text-white">{p.dribbling}</span>
                    </div>
                    <div className="hidden sm:block bg-slate-950 px-2 py-1 rounded-lg">
                      <span className="text-slate-500 block">DEF</span>
                      <span className="font-bold text-white">{p.defending}</span>
                    </div>
                    <div className="hidden sm:block bg-slate-950 px-2 py-1 rounded-lg">
                      <span className="text-slate-500 block">PHY</span>
                      <span className="font-bold text-white">{p.physical}</span>
                    </div>
                  </div>

                  {/* Right: Valuation, Shortlist Star & Make Bid Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <div className="text-right tabular-nums mr-1">
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        €{(p.marketValue / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-[10px] text-slate-500">週給 €{(p.wage / 1000).toFixed(0)}k · 契{p.contractYears}年</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleShortlist(p.id)}
                      title={isShortlisted ? 'お気に入りリストから解除' : 'お気に入りリストに追加'}
                      aria-label={isShortlisted ? 'お気に入り解除' : 'お気に入り登録'}
                      className={`min-h-[40px] min-w-[40px] px-2.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                        isShortlisted
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isShortlisted ? 'fill-amber-300' : ''}`} />
                    </button>

                    {cooldownDays > 0 ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-amber-400 font-semibold font-mono tabular-nums">
                          あと {cooldownDays} 日
                        </span>
                        <button
                          type="button"
                          disabled
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold cursor-not-allowed opacity-60 whitespace-nowrap"
                        >
                          冷却期間中
                        </button>
                      </div>
                    ) : isTermsAgreed ? (
                      <button
                        type="button"
                        onClick={() => startNegotiation(p)}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-400 hover:bg-emerald-300 text-slate-950 whitespace-nowrap cursor-pointer"
                      >
                        契約確定へ
                      </button>
                    ) : isActiveNeg ? (
                      <button
                        type="button"
                        onClick={() => startNegotiation(p)}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap cursor-pointer"
                      >
                        交渉を再開
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startNegotiation(p)}
                        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          p.clubId === 'free_agent' || !p.clubId
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        }`}
                      >
                        {p.clubId === 'free_agent' || !p.clubId ? 'フリー獲得交渉' : '獲得交渉を開始'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more button if results exceed displayLimit */}
        {allTargetPlayers.length > displayLimit && (
          <div className="pt-4 text-center border-t border-slate-800/80 mt-4">
            <button
              type="button"
              onClick={() => setDisplayLimit(prev => prev + 60)}
              className="min-h-[40px] px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              さらに60名を表示する (残り {allTargetPlayers.length - displayLimit} 名)
            </button>
          </div>
        )}
      </div>
      </>
      )}

      {/* FAVORITES SHORTLIST TAB */}
      {marketViewTab === 'shortlist' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">お気に入りリスト ({shortlistPlayers.length}名)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                登録中の注目選手は他クラブも動向を注視しており、移籍期間中は競合オファーや横取りオファーが発生する場合があります。
              </p>
            </div>
          </div>

          {shortlistPlayers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <p className="text-sm font-bold text-slate-300">お気に入りリストに選手が登録されていません</p>
              <p>移籍市場の選手行や選手詳細画面の「☆」ボタンから候補選手を登録できます。</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {shortlistPlayers.map(p => {
                const club = state.clubs[p.clubId];
                const neg = state.negotiations?.[p.id];
                const interest = calculatePlayerInterestInUserClub(
                  p,
                  userClub,
                  state.manager,
                  Boolean(p.userDeclaredInterest || state.declaredInterestPlayerIds?.includes(p.id)),
                  { standings: state.standings, tournaments: state.tournaments, clubs: state.clubs, currentDate: state.currentDate }
                );
                const askVal = club && club.id !== 'free_agent' ? calculatePlayerValuation(p, club, userClub?.id) : 0;
                const competingCount = neg?.competingOffers?.length || 0;
                const cooldownDays = getCooldownDays(p.id);

                return (
                  <div key={p.id} className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-2 hover:bg-slate-800/30 rounded-xl">
                    <div onClick={() => onSelectPlayer(p)} className="flex items-start gap-3 cursor-pointer min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-mono shrink-0 tabular-nums">
                        <span className="text-sm font-black text-white">{p.ovr}</span>
                        <span className="text-[9px] text-cyan-400">P{p.potential ?? p.ovr}</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white hover:text-emerald-300">{p.name}</span>
                          <span className="text-xs font-mono font-bold text-blue-300">{p.position}</span>
                          <span className="text-xs text-slate-400 tabular-nums">{p.age}歳 · {club?.name || 'フリー'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          関心度: <strong className="text-slate-200">{interest.level} ({interest.score}/100)</strong>
                          {' · '}
                          獲得可能性 <strong className="text-emerald-400">{interest.acquisitionProbability}%</strong>
                          {' · '}
                          市場価値 €{(p.marketValue / 1000000).toFixed(1)}M
                          {askVal > 0 && ` · 予想要求額 €${(askVal / 1000000).toFixed(1)}M`}
                        </div>
                        {competingCount > 0 && (
                          <div className="text-[11px] text-amber-300 font-semibold">
                            競合オファーあり ({competingCount}クラブ): {neg!.competingOffers!.map(o => `${o.clubName}(€${(o.offeredFee / 1000000).toFixed(1)}M)`).join(' · ')}
                          </div>
                        )}
                        {neg?.outcomeReason && (
                          <div className="text-[11px] text-slate-300">{neg.outcomeReason}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {cooldownDays > 0 ? (
                        <button
                          type="button"
                          disabled
                          className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold cursor-not-allowed whitespace-nowrap"
                        >
                          冷却中 (残{cooldownDays}日)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startNegotiation(p)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold whitespace-nowrap cursor-pointer"
                        >
                          {neg?.status === 'terms_agreed'
                            ? '契約確定へ進む'
                            : neg && ['club_negotiating', 'club_agreed', 'player_negotiating'].includes(neg.status)
                            ? '交渉を再開'
                            : '獲得交渉を開始'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleShortlist(p.id)}
                        className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold whitespace-nowrap cursor-pointer"
                      >
                        ★ お気に入り解除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PERSISTENT NEGOTIATION LIST TAB */}
      {marketViewTab === 'negotiations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">交渉リスト ({negotiationsList.length}件)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                進行中の交渉は日付を進めても維持され、条件改善・最終契約確定・取り下げ・再交渉をここから操作できます。
              </p>
            </div>
          </div>

          {negotiationsList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <p className="text-sm font-bold text-slate-300">現在進行中または履歴の交渉はありません</p>
              <p>移籍市場またはお気に入りリストから「獲得交渉を開始」を押すと、ここに交渉が保存されます。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {negotiationsList.map(neg => {
                const player = state.players[neg.playerId];
                if (!player) return null;
                const currentClub = state.clubs[player.clubId];
                const interest = calculatePlayerInterestInUserClub(
                  player,
                  userClub,
                  state.manager,
                  Boolean(player.userDeclaredInterest || state.declaredInterestPlayerIds?.includes(player.id)),
                  {
                    standings: state.standings,
                    tournaments: state.tournaments,
                    clubs: state.clubs,
                    offeredWage: neg.wageOffered,
                    offeredRole: neg.squadRoleOffered,
                    offeredYears: neg.contractYearsOffered,
                    currentDate: state.currentDate
                  }
                );
                const cooldownDays = getCooldownDays(player.id);
                const statusLabel =
                  neg.status === 'terms_agreed'
                    ? '個人条件合意済（最終確定待ち）'
                    : neg.status === 'player_negotiating'
                    ? '個人条件交渉中'
                    : neg.status === 'club_agreed'
                    ? 'クラブ間合意済'
                    : neg.status === 'club_negotiating'
                    ? 'クラブ間交渉中'
                    : neg.status === 'hijacked'
                    ? `横取り移籍により不成立 (${neg.hijackedByClubName || '競合クラブ'})`
                    : neg.status === 'collapsed'
                    ? '交渉破談'
                    : '契約完了';

                const statusTextColor =
                  neg.status === 'terms_agreed' || neg.status === 'completed'
                    ? 'text-emerald-400'
                    : neg.status === 'hijacked' || neg.status === 'collapsed'
                    ? 'text-rose-400'
                    : 'text-blue-400';

                const isOngoing = ['club_negotiating', 'club_agreed', 'player_negotiating', 'terms_agreed'].includes(neg.status);

                return (
                  <div key={neg.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div onClick={() => onSelectPlayer(player)} className="cursor-pointer min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white hover:text-emerald-300">{player.name}</span>
                          <span className="text-xs font-mono text-blue-300 font-bold">{player.position} · OVR {player.ovr}</span>
                          <span className={`text-xs font-bold ${statusTextColor}`}>{statusLabel}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          現所属: {currentClub?.name || 'フリー'}
                          {' · '}
                          関心度: {neg.interestTier || interest.level}
                          {' · '}
                          獲得可能性: <strong className="text-slate-200">{neg.acquisitionProbability ?? interest.acquisitionProbability}%</strong>
                          {neg.negotiationDeadline && ` · 交渉期限: ${neg.negotiationDeadline}`}
                        </div>
                      </div>

                      <div className="text-xs font-mono text-slate-300 tabular-nums shrink-0">
                        提示: €{(neg.currentBidFee / 1000000).toFixed(1)}M · 週給 €{Math.round(neg.wageOffered / 1000)}k · {neg.contractYearsOffered}年 · {neg.squadRoleOffered}
                      </div>
                    </div>

                    {neg.competingOffers && neg.competingOffers.length > 0 && (
                      <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-200 space-y-1 tabular-nums">
                        <div className="font-bold">競合クラブからの獲得オファー（お気に入り競合）:</div>
                        {neg.competingOffers.map(co => (
                          <div key={co.id}>
                            {co.clubName} ({co.clubTier}) — 移籍金 €{(co.offeredFee / 1000000).toFixed(1)}M · 週給 €{Math.round(co.wageOffered / 1000)}k · {co.squadRoleOffered}
                          </div>
                        ))}
                      </div>
                    )}

                    {neg.outcomeReason && (
                      <div className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                        結果理由: {neg.outcomeReason}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {neg.status === 'terms_agreed' && (
                        <button
                          type="button"
                          onClick={() => handleFinalizeNegotiation(player.id, neg.joinTiming)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold whitespace-nowrap cursor-pointer"
                        >
                          契約を最終確定する
                        </button>
                      )}

                      {isOngoing && (
                        <button
                          type="button"
                          onClick={() => startNegotiation(player)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                        >
                          {neg.status === 'terms_agreed' ? '条件を確認・変更' : '交渉を開く / 条件改善'}
                        </button>
                      )}

                      {neg.status === 'collapsed' && (
                        cooldownDays > 0 ? (
                          <span className="text-xs text-amber-400 font-mono tabular-nums px-2">
                            あと {cooldownDays} 日で再交渉可
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startNegotiation(player)}
                            className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                          >
                            再交渉を試みる
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => handleWithdrawNegotiation(player.id)}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold whitespace-nowrap cursor-pointer"
                      >
                        {isOngoing ? '交渉取り下げ' : '履歴から削除'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2-STAGE TRANSFER NEGOTIATION MODAL (Smartphone Messaging Chat UI) */}
      {activeNegotiation && targetPlayerInNeg && sellerClubInNeg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
          <div className="flex min-h-full items-start justify-center p-2 sm:p-6">
            <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700/80 rounded-[28px] shadow-2xl my-3 sm:my-6 text-left overflow-hidden">
            
            {/* Smartphone Messenger Header */}
            <div className="bg-slate-950/95 px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 border border-white/15 shadow-md"
                  style={{
                    backgroundColor:
                      activeNegotiation.status === 'player_negotiating'
                        ? '#10b981'
                        : sellerClubInNeg.primaryColor || '#334155'
                  }}
                >
                  {activeNegotiation.status === 'player_negotiating'
                    ? targetPlayerInNeg.position
                    : sellerClubInNeg.shortName?.slice(0, 3) || 'CLB'}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold font-mono block">
                    {activeNegotiation.sellerClubId === 'free_agent' || (activeNegotiation.status === 'player_negotiating' && activeNegotiation.currentBidFee === 0)
                      ? 'フリー獲得ダイレクトチャット（移籍金 €0）'
                      : (activeNegotiation.status === 'club_negotiating'
                        ? `STAGE 1 · ${sellerClubInNeg.name} 交渉チャット`
                        : activeNegotiation.status === 'player_negotiating'
                        ? `STAGE 2 · ${targetPlayerInNeg.name} 代理人チャット`
                        : 'TRANSFER CHAT')}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {targetPlayerInNeg.name} ({targetPlayerInNeg.position}, {targetPlayerInNeg.age}歳 · OVR {targetPlayerInNeg.ovr})
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                    現所属: {sellerClubInNeg.name} · 市場価値 €{(targetPlayerInNeg.marketValue / 1000000).toFixed(1)}M
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveNegotiation(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                aria-label="交渉モーダルを閉じる"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Current Transfer Budget Bar */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">自クラブ利用可能 移籍予算 / 空き週給</span>
                <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm tabular-nums">
                  €{((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M · 週給枠 €{Math.max(0, Math.round(((userClub?.wageBudget || 0) - (userClub?.currentWageSpend || 0)) / 1000))}k
                </span>
              </div>

              {/* Budget Error Banner */}
              {budgetError && (
                <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{budgetError}</span>
                </div>
              )}

              {/* STAGE 1: CLUB NEGOTIATION */}
              {activeNegotiation.status === 'club_negotiating' && (
                <div className="space-y-4">
                  {/* Contract Type Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-semibold block">移籍・レンタル契約形式</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => { setNegotiationType('permanent'); setBidFee(targetPlayerInNeg.marketValue); }}
                        className={`min-h-[44px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          negotiationType === 'permanent' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        完全移籍
                      </button>
                      <button
                        type="button"
                        onClick={() => { setNegotiationType('loan'); setBidFee(Math.round(targetPlayerInNeg.marketValue * 0.12)); }}
                        className={`min-h-[44px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          negotiationType === 'loan' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        期限付き移籍
                      </button>
                      <button
                        type="button"
                        onClick={() => { setNegotiationType('buy_option'); setBidFee(Math.round(targetPlayerInNeg.marketValue * 0.15)); }}
                        className={`min-h-[44px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          negotiationType === 'buy_option' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        買取OP付き
                      </button>
                      <button
                        type="button"
                        disabled={targetPlayerInNeg.age > 22}
                        onClick={() => { setNegotiationType('dev_loan'); setBidFee(Math.round(targetPlayerInNeg.marketValue * 0.08)); }}
                        className={`min-h-[44px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                          negotiationType === 'dev_loan' 
                            ? 'bg-emerald-500 text-slate-950 shadow cursor-pointer' 
                            : targetPlayerInNeg.age > 22 
                            ? 'bg-slate-900/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer'
                        }`}
                      >
                        育成型レンタル
                      </button>
                    </div>
                  </div>

                  {negotiationType === 'buy_option' && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="text-xs text-slate-300 block">付帯 買取オプション設定額 (€)</label>
                      <input
                        type="number"
                        step={1000000}
                        value={buyOptionFee}
                        onChange={e => setBuyOptionFee(Number(e.target.value))}
                        className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white tabular-nums"
                      />
                    </div>
                  )}

                  {/* Smartphone Chat Bubbles for Club Negotiation */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 max-h-56 overflow-y-auto space-y-3">
                    {activeNegotiation.clubMessages.map((msg, i) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              isUser
                                ? 'rounded-tr-sm bg-emerald-600/25 border border-emerald-500/40 text-emerald-100'
                                : 'rounded-tl-sm bg-slate-900 border border-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className={`text-[10px] font-bold ${isUser ? 'text-emerald-300' : 'text-blue-400'}`}>
                                {isUser ? 'あなた（監督）' : `${sellerClubInNeg.shortName || sellerClubInNeg.name} 強化担当`}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">{msg.date}</span>
                            </div>
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-300">提示移籍金 (オファー額)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">直接数値入力: €</span>
                        <input
                          type="number"
                          step={500000}
                          min={0}
                          value={bidFee}
                          onChange={e => setBidFee(Math.max(0, Number(e.target.value)))}
                          className="w-36 min-h-[40px] bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 text-right tabular-nums"
                        />
                        <span className="font-mono text-emerald-400 font-bold text-sm tabular-nums">
                          (€{(bidFee / 1000000).toFixed(1)}M)
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={Math.round(targetPlayerInNeg.marketValue * 0.4)}
                      max={Math.round(targetPlayerInNeg.marketValue * 2.5)}
                      step={500000}
                      value={bidFee}
                      onChange={e => setBidFee(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />

                    {bidFee > (userClub?.transferBudget || 0) && (
                      <div className="p-3 bg-rose-950/60 border border-rose-500 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>
                          移籍予算オーバー警告: 提示額（€{bidFee.toLocaleString()}）がクラブ移籍予算（€{(userClub?.transferBudget || 0).toLocaleString()}）を超過しています。
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                      <span>相場目安: €{(targetPlayerInNeg.marketValue * 0.4 / 1000000).toFixed(1)}M 〜 €{(targetPlayerInNeg.marketValue * 2 / 1000000).toFixed(1)}M</span>
                      <span>残忍耐度: <strong className="text-amber-400">{'★'.repeat(activeNegotiation.clubPatience)} ({activeNegotiation.clubPatience}回)</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveNegotiation(null)}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                    >
                      チャットを閉じて戻る
                    </button>

                    <button
                      type="button"
                      onClick={submitClubBid}
                      disabled={bidFee > (userClub?.transferBudget || 0)}
                      className={`min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                        bidFee > (userClub?.transferBudget || 0)
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                      }`}
                    >
                      {bidFee > (userClub?.transferBudget || 0) ? '移籍予算不足' : `€${(bidFee / 1000000).toFixed(1)}M の条件メッセージを送信`}
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 2: PLAYER CONTRACT NEGOTIATION */}
              {activeNegotiation.status === 'player_negotiating' && (
                <div className="space-y-4">
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>クラブ間合意完了！選手本人および代理人と個人条件を直接メッセージ交渉します。</span>
                  </div>

                  {/* Smartphone Chat Bubbles for Player/Agent Negotiation */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 max-h-56 overflow-y-auto space-y-3">
                    {activeNegotiation.playerMessages.map((msg, i) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              isUser
                                ? 'rounded-tr-sm bg-emerald-600/25 border border-emerald-500/40 text-emerald-100'
                                : 'rounded-tl-sm bg-slate-900 border border-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className={`text-[10px] font-bold ${isUser ? 'text-emerald-300' : 'text-amber-300'}`}>
                                {isUser ? 'あなた（監督）' : `${targetPlayerInNeg.name} 公認代理人`}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">{msg.date}</span>
                            </div>
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Contract Options Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">提示週給 (Weekly Wage)</label>
                      <input
                        type="number"
                        step={5000}
                        value={wageOffer}
                        onChange={e => setWageOffer(Number(e.target.value))}
                        className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white tabular-nums"
                      />
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums">現在給与: €{targetPlayerInNeg.wage.toLocaleString()} /週</span>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        {activeNegotiation.isLoan ? 'レンタル期間 (最大1シーズン制限)' : '契約期間'}
                      </label>
                      {activeNegotiation.isLoan ? (
                        <select
                          value={contractYears}
                          onChange={e => setContractYears(Number(e.target.value))}
                          className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value={0.5}>半年間 (6ヶ月)</option>
                          <option value={1}>1年間 (1シーズン)</option>
                        </select>
                      ) : (
                        <select
                          value={contractYears}
                          onChange={e => setContractYears(Number(e.target.value))}
                          className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value={1}>1年間</option>
                          <option value={2}>2年間</option>
                          <option value={3}>3年間 (標準)</option>
                          <option value={4}>4年間</option>
                          <option value={5}>5年間 (長期大型契約)</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">チーム内での役割 (Squad Role)</label>
                      <select
                        value={squadRole}
                        onChange={e => setSquadRole(e.target.value as any)}
                        className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="絶対的主力">絶対的主力 (Key Player)</option>
                        <option value="重要選手">重要選手 (Important)</option>
                        <option value="ローテーション">ローテーション (Rotation)</option>
                        <option value="控え・バックアップ">控え・バックアップ (Backup)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">契約ボーナス (Signing Bonus)</label>
                      <input
                        type="number"
                        step={100000}
                        value={signingBonus}
                        onChange={e => setSigningBonus(Number(e.target.value))}
                        className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white tabular-nums"
                      />
                    </div>

                    {/* Join Timing Selection */}
                    <div className="sm:col-span-2 pt-2 border-t border-slate-700/60">
                      <label className="text-xs text-slate-300 font-bold block mb-1.5 flex items-center justify-between">
                        <span>加入時期の選択 (Join Timing)</span>
                        {!state.isTransferWindowOpen && (
                          <span className="text-[10px] text-amber-400 font-normal">※現在は移籍期間外です（即時加入不可）</span>
                        )}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className={`min-h-[48px] p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          joinTimingChoice === 'immediate' 
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm' 
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        } ${!state.isTransferWindowOpen ? 'opacity-40 cursor-not-allowed' : ''}`}>
                          <input
                            type="radio"
                            name="joinTimingChoice"
                            value="immediate"
                            disabled={!state.isTransferWindowOpen}
                            checked={joinTimingChoice === 'immediate'}
                            onChange={() => setJoinTimingChoice('immediate')}
                            className="text-emerald-500"
                          />
                          <div>
                            <span className="font-bold block">即時加入</span>
                            <span className="text-[10px] text-slate-400 block">
                              {state.isTransferWindowOpen ? '成立後即座に合流' : '移籍期間外のため不可'}
                            </span>
                          </div>
                        </label>

                        <label className={`min-h-[48px] p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          joinTimingChoice === 'next_window' 
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm' 
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}>
                          <input
                            type="radio"
                            name="joinTimingChoice"
                            value="next_window"
                            checked={joinTimingChoice === 'next_window'}
                            onChange={() => setJoinTimingChoice('next_window')}
                            className="text-emerald-500"
                          />
                          <div>
                            <span className="font-bold block">次の移籍期間に加入</span>
                            <span className="text-[10px] text-slate-400 block">1月または7月に合流</span>
                          </div>
                        </label>

                        <label className={`min-h-[48px] p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          joinTimingChoice === 'next_season' 
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm' 
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}>
                          <input
                            type="radio"
                            name="joinTimingChoice"
                            value="next_season"
                            checked={joinTimingChoice === 'next_season'}
                            onChange={() => setJoinTimingChoice('next_season')}
                            className="text-emerald-500"
                          />
                          <div>
                            <span className="font-bold block">次のシーズンに加入</span>
                            <span className="text-[10px] text-slate-400 block">来年7月1日に合流</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] text-slate-400 font-mono">代理人忍耐度: {'★'.repeat(activeNegotiation.playerPatience)} ({activeNegotiation.playerPatience}回)</span>

                    <button
                      type="button"
                      onClick={submitPlayerContractBid}
                      disabled={wageOffer > ((userClub?.wageBudget || 0) - (userClub?.currentWageSpend || 0))}
                      className={`min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                        wageOffer > ((userClub?.wageBudget || 0) - (userClub?.currentWageSpend || 0))
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                      }`}
                    >
                      {wageOffer > ((userClub?.wageBudget || 0) - (userClub?.currentWageSpend || 0)) ? '給与予算超過' : '個人条件メッセージを送信'}
                    </button>
                  </div>
                </div>
              )}

              {/* TERMS AGREED - WAITING FOR EXPLICIT FINALIZATION */}
              {activeNegotiation.status === 'terms_agreed' && (
                <div className="space-y-4 py-2">
                  <div className="bg-emerald-950/35 border border-emerald-500/40 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <span>個人条件合意完了 — 最終契約確定待ち</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      クラブ間条件および個人契約条件の双方が合意に達しました。以下の契約内容を確認し、「最終契約を確定して獲得する」を押すことで正式加入が確定します。
                    </p>
                  </div>

                  {activeNegotiation.competingOffers && activeNegotiation.competingOffers.length > 0 && (
                    <div className="bg-amber-950/35 border border-amber-500/40 rounded-2xl p-3 text-xs text-amber-200 space-y-1">
                      <div className="font-bold">競合注意（お気に入り登録選手の横取りリスク）</div>
                      <div>
                        {activeNegotiation.competingOffers.map(co => `${co.clubName} (€${(co.offeredFee / 1000000).toFixed(1)}M / 週給€${Math.round(co.wageOffered / 1000)}k)`).join(' · ')}
                        が並行オファーを提示しています。確定を先延ばしにすると横取りされる可能性があります。
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs tabular-nums">
                    <div>
                      <span className="text-slate-400 block">合意移籍金</span>
                      <span className="font-mono font-bold text-white">€{(activeNegotiation.currentBidFee / 1000000).toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">提示週給</span>
                      <span className="font-mono font-bold text-emerald-400">€{Math.round(activeNegotiation.wageOffered / 1000)}k /週</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">契約年数 / 役割</span>
                      <span className="font-bold text-white">{activeNegotiation.contractYearsOffered}年 · {activeNegotiation.squadRoleOffered}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">推定成立確率</span>
                      <span className="font-mono font-bold text-cyan-400">{activeNegotiation.acquisitionProbability ?? 85}%</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveNegotiation(null)}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      後で確定する（交渉リストに保存）
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFinalizeNegotiation(activeNegotiation.playerId, joinTimingChoice)}
                      className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      最終契約を確定して獲得する
                    </button>
                  </div>
                </div>
              )}

              {/* COMPLETED SUCCESS */}
              {activeNegotiation.status === 'completed' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white font-display">
                    TRANSFER COMPLETED!
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    {targetPlayerInNeg.name} の契約手続きが完了しました！
                    背番号やスタメン起用は「戦術・編成」タブにて設定可能です。
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveNegotiation(null)}
                    className="min-h-[44px] px-8 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm cursor-pointer"
                  >
                    完了してスカッドを確認する
                  </button>
                </div>
              )}

              {/* HIJACKED BY RIVAL CLUB */}
              {activeNegotiation.status === 'hijacked' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white font-display">
                    他クラブへ電撃移籍成立（ハイジャック）
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    {activeNegotiation.outcomeReason || `${activeNegotiation.hijackedByClubName || '競合クラブ'}がより魅力的なオファーを提示し、契約が成立しました。`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveNegotiation(null)}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    閉じる
                  </button>
                </div>
              )}

              {/* COLLAPSED FAILURE */}
              {activeNegotiation.status === 'collapsed' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white font-display">
                    交渉破談 (NEGOTIATION FAILED)
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    {activeNegotiation.outcomeReason || '提示条件が相手側の許容水準を満たさず、交渉は打ち切られました。10日間ルールにより、この選手・クラブとの再交渉は10日間凍結されます。'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveNegotiation(null)}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    閉じる
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      )}

      {/* TRANSFER DEADLINE SUMMARY MODAL (Requirement 29) */}
      {(showSummaryModal || state.showDeadlineSummary) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
          <div className="flex min-h-full items-start justify-center p-3 sm:p-6">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-4 sm:my-8 text-left pb-10">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold font-mono">
                    OFFICIAL TRANSFER RECAP
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                    移籍市場まとめ (全クラブ移籍・レンタル一覧)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    自クラブおよび世界AIクラブ間で成立した全公式移籍ディールの一覧です。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowSummaryModal(false);
                    if (state.showDeadlineSummary) {
                      onUpdateState({ ...state, showDeadlineSummary: false });
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {(!state.transferHistory || state.transferHistory.length === 0) ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  成立した移籍・レンタル取引はまだありません。
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[60vh]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">選手</th>
                        <th className="py-2.5 px-3">移籍元</th>
                        <th className="py-2.5 px-3">移籍先</th>
                        <th className="py-2.5 px-3 text-right">移籍金</th>
                        <th className="py-2.5 px-3 text-center">形式</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {state.transferHistory.map(tr => {
                        const seller = state.clubs[tr.sellerClubId];
                        const buyer = state.clubs[tr.buyerClubId];
                        return (
                          <tr key={tr.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-bold text-white">{tr.playerName}</td>
                            <td className="py-2.5 px-3 text-slate-300">{seller?.shortName || tr.sellerClubId}</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-semibold">{buyer?.shortName || tr.buyerClubId}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                              {tr.fee > 0 ? `€${(tr.fee / 1000000).toFixed(1)}M` : '€0 (復帰/フリー)'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                tr.type === 'dev_loan'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : tr.type === 'loan'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}>
                                {tr.type === 'dev_loan' ? '育成レンタル' : tr.type === 'loan' ? 'レンタル' : '完全移籍'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="text-right pt-4 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSummaryModal(false);
                    if (state.showDeadlineSummary) {
                      onUpdateState({ ...state, showDeadlineSummary: false });
                    }
                  }}
                  className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  閉じる
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
