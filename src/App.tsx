import React, { useState, useEffect } from 'react';
import { 
  GameWorldState, 
  ManagerProfile, 
  MatchFixture, 
  Player, 
  TeamTactics, 
  NewsItem, 
  YouthProspect,
  Club
} from './types/game';
import { 
  createNewGameWorld, 
  getInitialClubOffers, 
  appointUserToClub, 
  loadGameState, 
  saveGameState, 
  clearGameState,
  resetGameWorldToInitial,
  loadGameFromStorage,
  saveGameToStorage,
  clearAllGameStorage
} from './engine/gameState';
import { advanceOneDay, fastForwardUntil, applyMatchResultToWorld, simulatePendingAIFixturesForDate, advanceDeadlineHours } from './engine/dateEngine';
import { exerciseLoanBuyOption } from './engine/transferEngine';
import { updatePlayerShirtNumber } from './engine/dataValidator';
import {
  generatePreSeasonInvitations,
  initializePreSeasonTournament,
  createPreSeasonScheduleNews
} from './engine/preSeasonEngine';
import { HeaderNav } from './components/HeaderNav';
import { BottomTabBar, MainTab } from './components/BottomTabBar';
import { ManagerCreationModal } from './components/ManagerCreationModal';
import { ClubOfferModal } from './components/ClubOfferModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { HomeDashboardTab } from './components/tabs/HomeDashboardTab';
import { TacticsSquadTab } from './components/tabs/TacticsSquadTab';
import { TransferMarketTab } from './components/tabs/TransferMarketTab';
import { ScoutTab } from './components/tabs/ScoutTab';
import { CompetitionsTab } from './components/tabs/CompetitionsTab';
import { ManagerCareerTab } from './components/tabs/ManagerCareerTab';
import { MatchSimulationView } from './components/tabs/MatchSimulationView';
import { PressConferenceModal, CompletedInterviewRecord } from './components/tabs/PressConferenceModal';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { SackedDismissalModal } from './components/SackedDismissalModal';
import { UnexpectedEventModal } from './components/UnexpectedEventModal';
import { BallonDorCeremonyModal } from './components/common/BallonDorCeremonyModal';
import { CalendarScheduleModal } from './components/common/CalendarScheduleModal';
import { SmartphoneModal } from './components/SmartphoneModal';
import { TeamHubModal } from './components/TeamHubModal';
import { resolveUnexpectedEvent } from './engine/unexpectedEventsEngine';
import { recordMatchSmartphoneUpdate } from './engine/smartphoneEngine';
import { Bell, AlertCircle, CheckCircle, Database } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameWorldState | null>(null);
  const [isStorageReady, setIsStorageReady] = useState<boolean>(false);
  const [storageToast, setStorageToast] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  // Modal overlays
  const [activeMatchFixture, setActiveMatchFixture] = useState<MatchFixture | null>(null);
  const [activePressFixture, setActivePressFixture] = useState<MatchFixture | null>(null);
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);
  const [dayAlertMessage, setDayAlertMessage] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showSmartphone, setShowSmartphone] = useState<boolean>(false);
  const [showTeamHub, setShowTeamHub] = useState<boolean>(false);

  // Initialize or load existing career safely from authoritative IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function initCareerStorage() {
      try {
        const res = await loadGameFromStorage();
        if (!isMounted) return;
        if (res.state) {
          setGameState(res.state);
          if (res.source.includes('backup')) {
            setStorageToast({
              message: 'セーブデータ整合性保護のため、バックアップ世代から安全に復元しました。',
              type: 'warn'
            });
            setTimeout(() => setStorageToast(null), 5000);
          } else if (res.migrated) {
            setStorageToast({
              message: '2026/27シーズン公式名鑑マスターデータへの安全な自動移行が完了しました。',
              type: 'info'
            });
            setTimeout(() => setStorageToast(null), 4000);
          }
        }
      } catch (err) {
        console.error('Failed to load career from permanent storage:', err);
      } finally {
        if (isMounted) {
          setIsStorageReady(true);
        }
      }
    }
    initCareerStorage();
    return () => { isMounted = false; };
  }, []);

  // Safe auto-save: Only saves when storage is initialized and valid state is loaded/active
  useEffect(() => {
    if (isStorageReady && gameState) {
      saveGameToStorage(gameState).catch(err => {
        console.warn('Auto-save error:', err);
      });
    }
  }, [gameState, isStorageReady]);

  // Step 1: Manager Creation
  const handleManagerCreated = (profile: ManagerProfile, startMode: 'preseason' | 'midseason' = 'preseason') => {
    const newWorld = createNewGameWorld(profile, undefined, startMode);
    setGameState(newWorld);
  };

  // Step 2: Club Selection from 5 offers
  const handleClubSelected = (clubId: string) => {
    if (!gameState) return;
    const updated = appointUserToClub(gameState, clubId);
    setGameState(updated);
    setActiveTab('home');
  };

  // Date advance 1 day
  const handleAdvanceDay = () => {
    if (!gameState || isSimulating) return;

    setIsSimulating(true);
    const result = advanceOneDay(gameState);
    setGameState(result.updatedState);
    setIsSimulating(false);

    if (result.hasUserMatchToday && result.userMatchFixture) {
      const oppClub = result.updatedState.clubs[result.userMatchFixture.homeClubId === result.updatedState.userClubId ? result.userMatchFixture.awayClubId : result.userMatchFixture.homeClubId];
      setDayAlertMessage(`⚽ 本日は試合日です（VS ${oppClub?.name || '対戦相手'}）。スタメンや戦術を確認の上、「試合を開始する」を押してください。`);
    } else if (result.stoppedReason) {
      setDayAlertMessage(result.stoppedReason);
    }
  };

  // Smart Fast Forward
  const handleFastForward = (type: 'next_match' | 'transfer_deadline' | 'days_7' | 'end_of_month') => {
    if (!gameState || isSimulating) return;

    setIsSimulating(true);
    const result = fastForwardUntil(gameState, type);
    setGameState(result.updatedState);
    setIsSimulating(false);

    if (result.hasUserMatchToday && result.userMatchFixture) {
      const oppClub = result.updatedState.clubs[result.userMatchFixture.homeClubId === result.updatedState.userClubId ? result.userMatchFixture.awayClubId : result.userMatchFixture.homeClubId];
      setDayAlertMessage(`⚽ 試合当日に到着しました（VS ${oppClub?.name || '対戦相手'}）。スタメンや戦術を確認の上、「試合を開始する」を押してください。`);
    } else if (result.stoppedReason) {
      setDayAlertMessage(result.stoppedReason);
    }
  };

  // Update Tactics
  const handleUpdateTactics = (tactics: TeamTactics) => {
    if (!gameState) return;
    setGameState({
      ...gameState,
      tactics
    });
  };

  // Pre-season Summer Tour invitation acceptance (8 clubs, 2 groups x 4, 3 group matches + Final)
  const handleSelectPreSeason = (tournamentId: string) => {
    if (!gameState || !gameState.userClubId) return;
    const userClub = gameState.clubs[gameState.userClubId];
    if (!userClub) return;

    const seasonYear =
      parseInt(gameState.currentDate.slice(0, 4), 10) ||
      parseInt(gameState.season.split('/')[0], 10) ||
      2026;

    const existingInvitations =
      Array.isArray(gameState.preSeasonInvitations) &&
      gameState.preSeasonInvitations.length > 0 &&
      gameState.preSeasonInvitations.every(inv => inv.seasonYear === seasonYear)
        ? gameState.preSeasonInvitations
        : generatePreSeasonInvitations(userClub, gameState.clubs, gameState.manager, seasonYear);

    const chosenInvitation =
      existingInvitations.find(t => t.id === tournamentId) || existingInvitations[0];
    if (!chosenInvitation) return;

    const seasonString = `${seasonYear}/${String(seasonYear + 1).slice(2)}`;
    const { tournamentState, fixtures: tourFixtures } = initializePreSeasonTournament(
      gameState.clubs,
      userClub.id,
      chosenInvitation,
      seasonYear,
      gameState.manager
    );
    tourFixtures.forEach(f => {
      f.seasonId = seasonString;
    });

    // Replace upcoming pre-season fixtures with the 8-club tournament schedule
    const otherFixtures = gameState.fixtures.filter(
      f => f.competition !== 'pre-season' || f.status === 'finished'
    );
    const updatedFixtures = [...tourFixtures, ...otherFixtures].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const scheduleNews = createPreSeasonScheduleNews(
      userClub,
      tourFixtures,
      gameState.clubs,
      gameState.currentDate
    );

    const champM = (tournamentState.championPrize / 1000000).toFixed(1);
    const partM = (tournamentState.participationReward / 1000000).toFixed(1);
    const regNews: NewsItem = {
      id: `news_ps_reg_${Date.now()}`,
      date: gameState.currentDate,
      headline: `【サマーツアー参戦決定】${userClub.name}、「${chosenInvitation.name}」への出場を正式発表！`,
      body: `開催地：${chosenInvitation.hostCountry}（${chosenInvitation.startDate}〜${chosenInvitation.finalDate}）。8クラブが2グループに分かれ各3試合を戦い、各組1位のみが一発勝負の決勝戦へ進出します。優勝賞金€${champM}M・参加報酬€${partM}Mは大会終了後に順位に応じて確定付与されます。`,
      category: 'tournament',
      relatedClubId: userClub.id,
      importance: 'high'
    };

    const nextState: GameWorldState = {
      ...gameState,
      selectedPreSeason: chosenInvitation.id,
      preSeasonInvitations: existingInvitations,
      preSeasonTournament: tournamentState,
      fixtures: updatedFixtures,
      news: [regNews, scheduleNews, ...gameState.news]
    };

    saveGameState(nextState);
    setGameState(nextState);

    setDayAlertMessage(
      `「${chosenInvitation.name}」への参戦が決定しました！グループステージ3試合を戦い、組首位で一発決勝進出・優勝賞金€${champM}Mを目指しましょう。`
    );
  };

  // Post match completion
  const handleFinishMatch = (updatedFixture: MatchFixture, updatedPlayers: Record<string, Player>) => {
    if (!gameState) return;

    const fixtureIdx = gameState.fixtures.findIndex(f => f.id === updatedFixture.id);
    const updatedFixtures = [...gameState.fixtures];
    if (fixtureIdx !== -1) {
      updatedFixtures[fixtureIdx] = updatedFixture;
    }

    // Requirement 1 & 10: Unified MATCH_RESULT processing for ALL clubs (evaluates board confidence, records, standings, injuries)
    const stateWithMatchResult = applyMatchResultToWorld(gameState, updatedFixture, updatedPlayers);

    // Simulate all other scheduled league matches for this round so ALL clubs update played and standings simultaneously
    let stateWithAllMatches = simulatePendingAIFixturesForDate(stateWithMatchResult, updatedFixture.date);
    stateWithAllMatches = recordMatchSmartphoneUpdate(stateWithAllMatches, updatedFixture);

    saveGameState(stateWithAllMatches);
    setGameState(stateWithAllMatches);
  };

  // Press conference completion (persists news, board confidence, player trust, and interview history)
  const handlePressComplete = (
    news: NewsItem,
    trustDelta: number,
    boardDelta: number,
    interviewRecord?: CompletedInterviewRecord
  ) => {
    if (!gameState) return;

    const updatedPlayers = { ...gameState.players };
    if (gameState.userClubId && trustDelta !== 0) {
      Object.entries(updatedPlayers).forEach(([pId, p]) => {
        if (p && p.clubId === gameState.userClubId) {
          updatedPlayers[pId] = {
            ...p,
            managerTrust: Math.max(10, Math.min(100, (p.managerTrust ?? 75) + trustDelta))
          };
        }
      });
    }

    const nextInterviewHistory = interviewRecord
      ? [interviewRecord, ...(gameState.interviewHistory || [])].slice(0, 30)
      : gameState.interviewHistory;

    const nextState: GameWorldState = {
      ...gameState,
      boardConfidence: Math.min(100, Math.max(10, gameState.boardConfidence + boardDelta)),
      players: updatedPlayers,
      news: [news, ...gameState.news],
      interviewHistory: nextInterviewHistory
    };

    saveGameState(nextState);
    setGameState(nextState);
  };

  // Promote youth player to first team
  const handlePromoteYouth = (prospect: YouthProspect) => {
    if (!gameState || !gameState.userClubId) return;

    const newPlayerId = `promoted_${prospect.id}_${Date.now()}`;
    const newPlayer: Player = {
      id: newPlayerId,
      name: prospect.name,
      age: prospect.age,
      birthDate: `${2026 - prospect.age}-08-10`,
      nationality: prospect.nationality,
      position: prospect.position,
      altPositions: [],
      preferredFoot: '右',
      ovr: prospect.ovr,
      potential: prospect.potential,
      pace: 76,
      shooting: 68,
      passing: 72,
      dribbling: 74,
      defending: 50,
      physical: 65,
      gk: 10,
      marketValue: 2500000,
      wage: 8000,
      contractYears: 3,
      clubId: gameState.userClubId,
      squadRole: '若手・育成枠',
      isLoaned: false,
      playstyle: prospect.playstyle,
      personality: prospect.personality,
      managerTrust: 85,
      relationships: [],
      condition: 'pink',
      fatigue: 0,
      injury: { isInjured: false },
      suspension: { isSuspended: false, matchesRemaining: 0 },
      stats: { appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 0 },
      shirtNumber: 38
    };

    const updatedPlayers = { ...gameState.players, [newPlayerId]: newPlayer };
    const userClub = gameState.clubs[gameState.userClubId];
    userClub.playerIds.push(newPlayerId);

    const updatedYouth = gameState.youthAcademy.map(y => y.id === prospect.id ? { ...y, promoted: true } : y);

    const promoteNews: NewsItem = {
      id: `news_prom_${Date.now()}`,
      date: gameState.currentDate,
      headline: `【アカデミー昇格】${userClub.name}、期待の新星${prospect.name}のトップ昇格を発表！`,
      body: `下部組織から逸材がトップチーム入り。${prospect.position}の${prospect.name}（${prospect.age}歳）がプロ契約を締結しました。指揮官は「将来を担う偉大なタレント」と太鼓判を押しています。`,
      category: 'youth',
      relatedClubId: userClub.id,
      relatedPlayerId: newPlayerId,
      importance: 'medium'
    };

    setGameState({
      ...gameState,
      players: updatedPlayers,
      youthAcademy: updatedYouth,
      news: [promoteNews, ...gameState.news]
    });

    setDayAlertMessage(`【昇格完了】${prospect.name} がトップチームに登録されました！`);
  };

  const handleToggleTransferList = (playerId: string) => {
    if (!gameState) return;
    const player = gameState.players[playerId];
    if (!player) return;
    const updated = { ...player, isTransferListed: !player.isTransferListed };
    setGameState({
      ...gameState,
      players: { ...gameState.players, [playerId]: updated }
    });
    setInspectingPlayer(updated);
  };

  const handleToggleLoanList = (playerId: string) => {
    if (!gameState) return;
    const player = gameState.players[playerId];
    if (!player) return;
    const updated = { ...player, isLoanListed: !player.isLoanListed };
    setGameState({
      ...gameState,
      players: { ...gameState.players, [playerId]: updated }
    });
    setInspectingPlayer(updated);
  };

  const handleExerciseBuyOption = (player: Player) => {
    if (!gameState) return;
    const res = exerciseLoanBuyOption(gameState, player.id);
    if (res.success) {
      setGameState(res.updatedState);
      setInspectingPlayer(res.updatedState.players[player.id]);
      setDayAlertMessage(res.message);
    } else {
      setDayAlertMessage(res.message);
    }
  };

  // Complete Career Reset with Automated Verification (Requirements 9-13)
  const handleExecuteResetCareer = (): { success: boolean; error?: string } => {
    // 1. Run automated verification & reset
    const result = resetGameWorldToInitial();
    if (!result.success) {
      console.error('Reset verification failed:', result.error);
      return { success: false, error: result.error || '初期化データ検証に失敗しました。' };
    }

    // 2. Clear all active modals and alerts
    setActiveMatchFixture(null);
    setActivePressFixture(null);
    setInspectingPlayer(null);
    setDayAlertMessage(null);
    setShowSmartphone(false);
    setShowTeamHub(false);
    setActiveTab('home');

    // 3. Clear memory state & storage (creates pre-reset safety backup in IndexedDB first)
    clearAllGameStorage().catch(err => console.error('Error during storage clear:', err));
    clearGameState();
    setGameState(null);

    return { success: true };
  };

  // Direct trigger
  const handleOpenResetModal = () => {
    setShowResetConfirmModal(true);
  };

  // PHASE 0: STORAGE INITIALIZING (Prevents premature ManagerCreationModal or overwriting existing save)
  if (!isStorageReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center max-w-sm text-center space-y-4 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Database className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-white tracking-wide">キャリアデータ読み込み中</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              IndexedDB永続ストレージおよびセーブバックアップ世代を照会しています...
            </p>
          </div>
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // PHASE 1: NO GAME STATE YET -> CREATE MANAGER (User explicitly initiates)
  if (!gameState) {
    return <ManagerCreationModal onComplete={handleManagerCreated} />;
  }

  // PHASE 1.5: SACKED STATE -> SHOW FORMAL DISMISSAL MODAL THEN RE-OFFER 5 CLUBS (仕様：監督解任したら、また5クラブからオファーが来る)
  if (gameState.isSacked) {
    return (
      <SackedDismissalModal
        state={gameState}
        onProceedToNewOffers={() => {
          const oldClubId = gameState.userClubId;
          const updatedClubs = { ...gameState.clubs };
          if (oldClubId && updatedClubs[oldClubId]) {
            updatedClubs[oldClubId] = {
              ...updatedClubs[oldClubId],
              isUserClub: false
            };
          }
          const sackedNews: NewsItem = {
            id: `news_sacked_transition_${Date.now()}`,
            date: gameState.currentDate,
            headline: `【新天地へ】前クラブを離れた${gameState.manager.name}監督、世界5クラブから就任オファーを受領`,
            body: `退任直後にもかかわらず、国内外の複数クラブが${gameState.manager.name}監督へ熱烈なアプローチを開始。5クラブから正式オファーが届き、新たな挑戦の舞台を選択することになります。`,
            category: 'press',
            importance: 'high'
          };
          setGameState({
            ...gameState,
            userClubId: null, // Transitions immediately to PHASE 2: ClubOfferModal with 5 offers!
            isSacked: false,
            boardConfidence: 85,
            fanApproval: 80,
            consecutiveLosses: 0,
            consecutiveWinless: 0,
            clubs: updatedClubs,
            news: [sackedNews, ...gameState.news]
          });
        }}
      />
    );
  }

  // PHASE 2: MANAGER CREATED, BUT NO CLUB SELECTED -> SHOW 5 OFFERS
  if (!gameState.userClubId) {
    const offers = getInitialClubOffers(gameState.clubs, gameState.manager);
    return (
      <ClubOfferModal 
        manager={gameState.manager} 
        offers={offers} 
        clubs={gameState.clubs}
        players={gameState.players}
        onSelectClub={handleClubSelected}
        onBackToManagerCreation={() => {
          clearGameState();
          setGameState(null);
        }}
      />
    );
  }

  // PHASE 3: MAIN FOOTBALL MANAGER INTERFACE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Bar Navigation */}
      <HeaderNav
        state={gameState}
        onAdvanceDay={handleAdvanceDay}
        onFastForward={handleFastForward}
        onOpenCalendar={() => setShowCalendar(true)}
        onAdvanceDeadlineHours={(hours) => {
          if (!gameState || isSimulating) return;
          setIsSimulating(true);
          const res = advanceDeadlineHours(gameState, hours);
          setGameState(res.updatedState);
          setIsSimulating(false);
          if (res.isFinished) {
            setDayAlertMessage('移籍市場のデッドラインデイが終了しました！全移籍ウィンドウがクローズされました。');
          }
        }}
        onRequestReset={handleOpenResetModal}
        onResetCareer={handleOpenResetModal}
        isSimulating={isSimulating}
      />

      {/* Storage & Backup Restoration Toast Banner */}
      {storageToast && (
        <div className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 pt-3 animate-in fade-in">
          <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            storageToast.type === 'warn'
              ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{storageToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setStorageToast(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3.5 sm:px-6 pt-4 pb-20">
        {activeTab === 'home' && (
          <HomeDashboardTab
            state={gameState}
            onOpenMatch={(f) => setActiveMatchFixture(f)}
            onSelectPreSeason={handleSelectPreSeason}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenSmartphone={() => setShowSmartphone(true)}
            onDismissPreSeasonBanner={(year) => {
              const next = { ...gameState, dismissedPreSeasonBannerYear: year };
              saveGameState(next);
              setGameState(next);
            }}
          />
        )}

        {activeTab === 'tactics' && (
          <TacticsSquadTab
            state={gameState}
            onUpdateTactics={handleUpdateTactics}
            onSelectPlayer={(p) => setInspectingPlayer(p)}
            onUpdateState={(ns) => setGameState(ns)}
            onOpenTeamHub={() => setShowTeamHub(true)}
          />
        )}

        {activeTab === 'transfers' && (
          <TransferMarketTab
            state={gameState}
            onUpdateState={(ns) => setGameState(ns)}
            onSelectPlayer={(p) => setInspectingPlayer(p)}
          />
        )}

        {activeTab === 'scout' && (
          <ScoutTab
            state={gameState}
            onUpdateState={(ns) => setGameState(ns)}
          />
        )}

        {activeTab === 'fixtures' && (
          <CompetitionsTab
            state={gameState}
            onOpenMatch={(f) => setActiveMatchFixture(f)}
          />
        )}

        {activeTab === 'club' && (
          <ManagerCareerTab
            state={gameState}
            onUpdateState={(ns) => setGameState(ns)}
            onPromoteYouth={handlePromoteYouth}
            onRequestReset={handleOpenResetModal}
            onResetCareer={handleOpenResetModal}
          />
        )}
      </main>

      {/* Ergonomic Bottom Thumb Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        unreadNewsCount={0}
        hasMatchToday={gameState.fixtures.some(f => f.date === gameState.currentDate && (f.homeClubId === gameState.userClubId || f.awayClubId === gameState.userClubId) && f.status === 'upcoming')}
      />

      {/* MATCH SIMULATION MODAL */}
      {activeMatchFixture && (
        <MatchSimulationView
          fixture={activeMatchFixture}
          state={gameState}
          onUpdateTactics={handleUpdateTactics}
          onFinishMatch={handleFinishMatch}
          onOpenPressConference={(f) => {
            setActivePressFixture(f);
            setActiveMatchFixture(null);
          }}
          onClose={() => setActiveMatchFixture(null)}
        />
      )}

      {/* UNEXPECTED EVENTS MODAL (Requirement 10: 「予期せぬ出来事」) */}
      {gameState.activeUnexpectedEvent && !gameState.activeUnexpectedEvent.resolvedChoiceId && (
        <UnexpectedEventModal
          event={gameState.activeUnexpectedEvent}
          onSelectChoice={(eventId, choiceId) => {
            const next = resolveUnexpectedEvent(gameState, eventId, choiceId);
            saveGameState(next);
            setGameState(next);
          }}
        />
      )}

      {/* POST-MATCH PRESS CONFERENCE MODAL */}
      {activePressFixture && (
        <PressConferenceModal
          fixture={activePressFixture}
          state={gameState}
          onComplete={handlePressComplete}
          onClose={() => {
            setActivePressFixture(null);
            setActiveMatchFixture(null);
          }}
        />
      )}

      {/* PLAYER DETAILS INSPECTOR MODAL */}
      {inspectingPlayer && (
        <PlayerDetailModal
          player={inspectingPlayer}
          club={stateClubForPlayer(gameState, inspectingPlayer.clubId)}
          isUserPlayer={inspectingPlayer.clubId === gameState.userClubId}
          isShortlisted={Boolean(
            (gameState.shortlistPlayerIds && gameState.shortlistPlayerIds.includes(inspectingPlayer.id)) || inspectingPlayer.isOnShortlist
          )}
          hasDeclaredInterest={Boolean(
            (gameState.declaredInterestPlayerIds && gameState.declaredInterestPlayerIds.includes(inspectingPlayer.id)) || inspectingPlayer.userDeclaredInterest
          )}
          onToggleShortlist={(pId) => {
            const currentList = gameState.shortlistPlayerIds || [];
            const isNowIn = !currentList.includes(pId);
            const nextList = isNowIn ? [...currentList, pId] : currentList.filter(id => id !== pId);
            const target = gameState.players[pId];
            const updatedPlayers = target ? { ...gameState.players, [pId]: { ...target, isOnShortlist: isNowIn } } : gameState.players;
            setGameState({
              ...gameState,
              shortlistPlayerIds: nextList,
              players: updatedPlayers
            });
            if (inspectingPlayer.id === pId) {
              setInspectingPlayer(updatedPlayers[pId] || inspectingPlayer);
            }
          }}
          onDeclareInterest={(pId) => {
            const currentDeclared = gameState.declaredInterestPlayerIds || [];
            if (currentDeclared.includes(pId)) return;
            const target = gameState.players[pId];
            if (!target) return;
            const boost = 15;
            const updatedInterest = Math.min(100, (target.clubInterestScore || 50) + boost);
            const updatedPlayers = {
              ...gameState.players,
              [pId]: {
                ...target,
                userDeclaredInterest: true,
                clubInterestScore: updatedInterest
              }
            };
            const userClub = gameState.userClubId ? gameState.clubs[gameState.userClubId] : null;
            const nextNews: NewsItem[] = [
              {
                id: `news_decl_${Date.now()}`,
                headline: `【獲得関心】${userClub?.name || '自クラブ'}が${target.name}への強い獲得関心を公に表明！`,
                body: `${gameState.manager.name}監督は記者会見で「${target.name}は我々のフットボール哲学に完璧に合致する素晴らしいタレントだ」と公言しました。`,
                date: gameState.currentDate,
                category: 'transfer',
                importance: 'medium'
              },
              ...gameState.news
            ];
            setGameState({
              ...gameState,
              declaredInterestPlayerIds: [...currentDeclared, pId],
              players: updatedPlayers,
              news: nextNews
            });
            setInspectingPlayer(updatedPlayers[pId]);
          }}
          onToggleTransferList={handleToggleTransferList}
          onToggleLoanList={handleToggleLoanList}
          onExerciseBuyOption={handleExerciseBuyOption}
          onUpdateShirtNumber={(playerId, newNumber, forceSwap) => {
            if (!gameState || !gameState.userClubId) return { success: false, message: 'クラブ未所属です' };
            const res = updatePlayerShirtNumber(gameState.players, gameState.clubs, gameState.userClubId, playerId, newNumber, forceSwap);
            if (res.success) {
              setGameState({
                ...gameState,
                players: res.updatedPlayers
              });
              if (inspectingPlayer.id === playerId) {
                setInspectingPlayer(res.updatedPlayers[playerId]);
              }
            }
            return res;
          }}
          onRecommendRetirement={(playerId) => {
            if (!gameState) return { accepted: false, message: 'ゲーム状態が無効です' };
            const p = gameState.players[playerId];
            if (!p) return { accepted: false, message: '選手が見つかりません' };

            const acceptProb = p.age >= 33 ? 0.85 : p.age >= 29 ? 0.45 : 0.15;
            const isAccepted = Math.random() < acceptProb;

            if (isAccepted) {
              const updatedPlayer: Player = {
                ...p,
                isRetired: true,
                retirementAnnounced: true,
                retirementDate: gameState.currentDate,
                retirementReason: `度重なる重傷（${p.injuryType || '長期離脱'}）に伴う現役引退`,
                squadStatus: 'OUT_OF_SQUAD'
              };
              const userClub = gameState.userClubId ? gameState.clubs[gameState.userClubId] : null;
              const retirementNews: NewsItem = {
                id: `news_retire_inj_${Date.now()}`,
                date: gameState.currentDate,
                headline: `【現役引退】${p.name}が度重なる怪我と戦い抜いた末、現役引退を表明`,
                body: `${userClub?.name}所属の${p.name}（${p.age}歳）が、クラブ・監督との面談を経て現役引退を正式に決断しました。${gameState.manager.name}監督は「彼のこれまでの献身と勇気ある戦いに最大の敬意を表する」とコメントしています。`,
                category: 'board',
                relatedClubId: userClub?.id,
                relatedPlayerId: p.id,
                importance: 'high'
              };
              setGameState({
                ...gameState,
                players: {
                  ...gameState.players,
                  [playerId]: updatedPlayer
                },
                news: [retirementNews, ...gameState.news].slice(0, 100)
              });
              setInspectingPlayer(updatedPlayer);
              return {
                accepted: true,
                message: `${p.name}選手は熟考の末、監督の言葉を受け入れて現役引退を決断しました。クラブのレジェンドとして功績が称えられます。`
              };
            } else {
              return {
                accepted: false,
                message: `${p.name}選手は「まだピッチを諦めたくない。過酷なリハビリを乗り越えて必ず復帰してみせる」と語り、現役続行への強い意志を示しました。`
              };
            }
          }}
          onClose={() => setInspectingPlayer(null)}
        />
      )}

      {/* BALLON D'OR CEREMONY MODAL */}
      {gameState?.activeBallonDorCeremony && (
        <BallonDorCeremonyModal
          ceremony={gameState.activeBallonDorCeremony}
          onClose={() => {
            setGameState({
              ...gameState,
              activeBallonDorCeremony: null
            });
          }}
        />
      )}

      {/* CALENDAR SCHEDULE MODAL */}
      {showCalendar && gameState && (
        <CalendarScheduleModal
          state={gameState}
          onFastForwardToDate={(targetDate) => {
            setShowCalendar(false);
            if (!gameState || isSimulating) return;
            setIsSimulating(true);
            let cur = gameState;
            let daysLimit = 60;
            while (cur.currentDate < targetDate && daysLimit > 0) {
              const res = advanceOneDay(cur, true);
              cur = res.updatedState;
              daysLimit--;
              if (res.hasUserMatchToday && !res.userSimulatedFixture) break;
            }
            setGameState(cur);
            setIsSimulating(false);
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* DAY PROGRESSION ALERT POPUP */}
      {dayAlertMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <Bell className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-bold text-white">日程進行 注目イベント通知</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {dayAlertMessage}
              </p>
              <div className="text-right pt-2">
                <button
                  type="button"
                  onClick={() => setDayAlertMessage(null)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  確認して再開
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMARTPHONE HUB MODAL */}
      {showSmartphone && gameState && (
        <SmartphoneModal
          state={gameState}
          onUpdateState={(ns) => {
            saveGameState(ns);
            setGameState(ns);
          }}
          onOpenTeamHub={() => setShowTeamHub(true)}
          onClose={() => setShowSmartphone(false)}
        />
      )}

      {/* TEAM HUB MODAL */}
      {showTeamHub && gameState && (
        <TeamHubModal
          state={gameState}
          onUpdateState={(ns) => {
            saveGameState(ns);
            setGameState(ns);
          }}
          onInspectPlayer={(p) => setInspectingPlayer(p)}
          onClose={() => setShowTeamHub(false)}
        />
      )}

      {/* GLOBAL RESET CONFIRMATION MODAL (Root Level to prevent clipping & z-index issues) */}
      <ResetConfirmationModal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        onConfirm={handleExecuteResetCareer}
      />

    </div>
  );
}

function stateClubForPlayer(state: GameWorldState, clubId: string) {
  return state.clubs[clubId] || null;
}
