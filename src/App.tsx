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
import { advanceOneDay, fastForwardUntil, applyMatchResultToWorld, simulatePendingAIFixturesForDate } from './engine/dateEngine';
import { exerciseLoanBuyOption } from './engine/transferEngine';
import { generatePreSeasonTourOptions, generatePreSeasonFixtures, createPreSeasonScheduleNews } from './engine/preSeasonEngine';
import { HeaderNav } from './components/HeaderNav';
import { BottomTabBar, MainTab } from './components/BottomTabBar';
import { ManagerCreationModal } from './components/ManagerCreationModal';
import { ClubOfferModal } from './components/ClubOfferModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { HomeDashboardTab } from './components/tabs/HomeDashboardTab';
import { TacticsSquadTab } from './components/tabs/TacticsSquadTab';
import { TransferMarketTab } from './components/tabs/TransferMarketTab';
import { CompetitionsTab } from './components/tabs/CompetitionsTab';
import { ManagerCareerTab } from './components/tabs/ManagerCareerTab';
import { MatchSimulationView } from './components/tabs/MatchSimulationView';
import { PressConferenceModal } from './components/tabs/PressConferenceModal';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { Bell, AlertCircle, CheckCircle, Database } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameWorldState | null>(null);
  const [isStorageReady, setIsStorageReady] = useState<boolean>(false);
  const [storageToast, setStorageToast] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Modal overlays
  const [activeMatchFixture, setActiveMatchFixture] = useState<MatchFixture | null>(null);
  const [activePressFixture, setActivePressFixture] = useState<MatchFixture | null>(null);
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);
  const [dayAlertMessage, setDayAlertMessage] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

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
              message: 'セーブデータを最新のスキーマバージョンへ安全に自動移行しました。',
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
  const handleManagerCreated = (profile: ManagerProfile) => {
    const newWorld = createNewGameWorld(profile);
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

  // Pre-season registration
  const handleSelectPreSeason = (tournamentId: string) => {
    if (!gameState || !gameState.userClubId) return;
    const userClub = gameState.clubs[gameState.userClubId];
    if (!userClub) return;

    const tourOptions = generatePreSeasonTourOptions(userClub, gameState.manager);
    const chosenTour = tourOptions.find(t => t.id === tournamentId) || tourOptions[0];
    const prizeBonus = chosenTour?.prizeMoney || 1500000;

    // Generate fresh randomized opponents matching this selected tournament
    const newPsFixtures = generatePreSeasonFixtures(
      gameState.clubs,
      userClub.id,
      parseInt(gameState.season.split('/')[0], 10) || 2026,
      gameState.manager,
      tournamentId
    );

    // Replace upcoming pre-season fixtures in fixtures array with the new tournament fixtures
    const otherFixtures = gameState.fixtures.filter(f => f.competition !== 'pre-season' || f.status === 'finished');
    const updatedFixtures = [...newPsFixtures, ...otherFixtures].sort((a, b) => a.date.localeCompare(b.date));

    // Grant tournament preparation prize money bonus
    const updatedClub: Club = {
      ...userClub,
      transferBudget: userClub.transferBudget + prizeBonus
    };

    const scheduleNews = createPreSeasonScheduleNews(
      updatedClub,
      newPsFixtures,
      gameState.clubs,
      gameState.currentDate
    );

    const regNews: NewsItem = {
      id: `news_ps_reg_${Date.now()}`,
      date: gameState.currentDate,
      headline: `【サマーツアー参加決定】${userClub.name}、「${chosenTour?.name}」への参戦を正式発表！`,
      body: `新シーズンへの調整と戦力強化を目指し、${userClub.name}が「${chosenTour?.name}」（賞金総額€${(prizeBonus / 1000000).toFixed(1)}M）への参加登録を完了しました。新戦力の試運転とチーム連携の深化に期待が集まります。`,
      category: 'tournament',
      relatedClubId: userClub.id,
      importance: 'high'
    };

    const nextState: GameWorldState = {
      ...gameState,
      clubs: {
        ...gameState.clubs,
        [userClub.id]: updatedClub
      },
      selectedPreSeason: tournamentId,
      fixtures: updatedFixtures,
      news: [regNews, scheduleNews, ...gameState.news]
    };

    saveGameState(nextState);
    setGameState(nextState);

    setDayAlertMessage(`「${chosenTour?.name}」への参加登録が完了しました！準備金€${(prizeBonus / 1000000).toFixed(1)}Mがクラブ予算に加算されました。`);
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
    const stateWithAllMatches = simulatePendingAIFixturesForDate(stateWithMatchResult, updatedFixture.date);

    setGameState(stateWithAllMatches);
  };

  // Press conference completion
  const handlePressComplete = (news: NewsItem, trustDelta: number, boardDelta: number) => {
    if (!gameState) return;

    setGameState({
      ...gameState,
      boardConfidence: Math.min(100, Math.max(10, gameState.boardConfidence + boardDelta)),
      news: [news, ...gameState.news]
    });

    setActivePressFixture(null);
    setActiveMatchFixture(null);
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

  // PHASE 2: MANAGER CREATED, BUT NO CLUB SELECTED -> SHOW 5 OFFERS
  if (!gameState.userClubId) {
    const offers = getInitialClubOffers(gameState.clubs);
    return (
      <ClubOfferModal 
        manager={gameState.manager} 
        offers={offers} 
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
          />
        )}

        {activeTab === 'tactics' && (
          <TacticsSquadTab
            state={gameState}
            onUpdateTactics={handleUpdateTactics}
            onSelectPlayer={(p) => setInspectingPlayer(p)}
            onUpdateState={(ns) => setGameState(ns)}
          />
        )}

        {activeTab === 'transfers' && (
          <TransferMarketTab
            state={gameState}
            onUpdateState={(ns) => setGameState(ns)}
            onSelectPlayer={(p) => setInspectingPlayer(p)}
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
        unreadNewsCount={gameState.news.length}
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

      {/* POST-MATCH PRESS CONFERENCE MODAL */}
      {activePressFixture && (
        <PressConferenceModal
          fixture={activePressFixture}
          state={gameState}
          onComplete={handlePressComplete}
          onClose={() => setActivePressFixture(null)}
        />
      )}

      {/* PLAYER DETAILS INSPECTOR MODAL */}
      {inspectingPlayer && (
        <PlayerDetailModal
          player={inspectingPlayer}
          club={stateClubForPlayer(gameState, inspectingPlayer.clubId)}
          isUserPlayer={inspectingPlayer.clubId === gameState.userClubId}
          onToggleTransferList={handleToggleTransferList}
          onToggleLoanList={handleToggleLoanList}
          onExerciseBuyOption={handleExerciseBuyOption}
          onClose={() => setInspectingPlayer(null)}
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
