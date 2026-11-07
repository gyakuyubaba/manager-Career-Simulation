import React, { useState, useEffect, useRef } from 'react';
import { MatchFixture, GameWorldState, TeamTactics, MatchEvent, Player, CompetitionCategory, FormationName } from '../../types/game';
import { simulateFullMatch, generateAssistantCoachAdvice, finalMatchEligibilityCheck, MatchEligibilityCheckResult, fastForwardRemainingMatch, isMatchRequiringDecider } from '../../engine/matchEngine';
import { autoReplaceIneligiblePlayers } from '../../engine/dataValidator';
import { getDefaultTacticsForClub } from '../../data/squadPopulator';
import { updateTacticsFormation } from '../../engine/tacticsEngine';
import { determineMatchOutcome } from '../../engine/dateEngine';
import { FatigueGauge, ConditionDot } from '../common/FatigueGauge';
import { PlayerReplacementModal } from '../PlayerReplacementModal';
import { useI18n } from '../../i18n/LanguageContext';
import { 
  Play, 
  Pause, 
  FastForward,
  RotateCcw, 
  Activity, 
  Shield, 
  ArrowRight, 
  MessageSquare, 
  Award, 
  Check,
  Zap,
  Clock,
  Flame,
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  Trophy,
  Sparkles
} from 'lucide-react';

interface Props {
  fixture: MatchFixture;
  state: GameWorldState;
  onUpdateTactics?: (tactics: TeamTactics) => void;
  onFinishMatch: (updatedFixture: MatchFixture, updatedPlayers: Record<string, Player>) => void;
  onOpenPressConference: (fixture: MatchFixture) => void;
  onClose: () => void;
}

export const MatchSimulationView: React.FC<Props> = ({ 
  fixture, 
  state, 
  onUpdateTactics,
  onFinishMatch, 
  onOpenPressConference,
  onClose 
}) => {
  const { t } = useI18n();

  const homeClub = state.clubs[fixture.homeClubId];
  const awayClub = state.clubs[fixture.awayClubId];
  const isUserHome = fixture.homeClubId === state.userClubId;

  // Manual player replacement modal target (Requirement 1, 2, 3)
  const [manualReplaceTarget, setManualReplaceTarget] = useState<Player | null>(null);

  // Match progression states
  const [matchPhase, setMatchPhase] = useState<
    'pre' | 'first_half' | 'halftime' | 'second_half' | 'fulltime_pause' | 'extra_first' | 'et_halftime' | 'extra_second' | 'et_fulltime' | 'penalty_shootout' | 'finished'
  >('pre');
  const [minute, setMinute] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x, 4x, or instant
  
  // Highlight overlay for dramatic events (Goal, Red Card, Penalty)
  const [activeHighlightEvent, setActiveHighlightEvent] = useState<MatchEvent | null>(null);

  // Active view tab in match view
  const [activeTab, setActiveTab] = useState<'formation' | 'pitch' | 'events' | 'stats' | 'subs' | 'tactics'>('formation');
  // Dedicated pre-match preparation tab
  const [preMatchTab, setPreMatchTab] = useState<'formation' | 'squad' | 'tactics' | 'preview'>('formation');
  const [inMatchTacticsToast, setInMatchTacticsToast] = useState<string | null>(null);

  // Track players who have already been subbed off to strictly forbid re-entry
  const [subbedOutPlayerIds, setSubbedOutPlayerIds] = useState<string[]>([]);

  // In-match user tactical instructions
  const [tactics, setTactics] = useState<TeamTactics>(state.tactics);
  const [inMatchMentality, setInMatchMentality] = useState<'攻撃的' | 'バランス' | '守備的' | 'ゲーゲンプレス' | 'カウンター'>('バランス');

  // Pre-simulated full events & stats pool
  const [simulatedResult, setSimulatedResult] = useState<any>(null);
  const [currentScore, setCurrentScore] = useState<[number, number]>([0, 0]);
  const [revealedEvents, setRevealedEvents] = useState<MatchEvent[]>([]);
  const [subCount, setSubCount] = useState<number>(0);
  const scoreRef = useRef<[number, number]>([0, 0]);
  const revealedEventsRef = useRef<MatchEvent[]>([]);
  const completedFinalFixtureRef = useRef<MatchFixture | null>(null);

  // Pause modals (Requirements 1 & 2)
  const [showHalftimeModal, setShowHalftimeModal] = useState<boolean>(false);
  const [showFulltimeModal, setShowFulltimeModal] = useState<boolean>(false);
  const [showEtHalftimeModal, setShowEtHalftimeModal] = useState<boolean>(false);
  const [showEtFulltimeModal, setShowEtFulltimeModal] = useState<boolean>(false);
  const [showChampionshipCelebration, setShowChampionshipCelebration] = useState<boolean>(false);
  const [showRunnerUpModal, setShowRunnerUpModal] = useState<boolean>(false);

  // PK Shootout state (Requirement 1: 5 kicks + sudden death)
  const [pkState, setPkState] = useState<{
    homeKicks: (boolean | null)[];
    awayKicks: (boolean | null)[];
    homeKickers: string[];
    awayKickers: string[];
    stepIndex: number;
    homeScore: number;
    awayScore: number;
    isFinished: boolean;
  }>({
    homeKicks: [null, null, null, null, null],
    awayKicks: [null, null, null, null, null],
    homeKickers: [],
    awayKickers: [],
    stepIndex: 0,
    homeScore: 0,
    awayScore: 0,
    isFinished: false
  });

  // In-match substitution selector
  const [subPlayerOffId, setSubPlayerOffId] = useState<string | null>(null);
  const [subPlayerOnId, setSubPlayerOnId] = useState<string | null>(null);

  // Unified In-match incident modal state (Requirement 1: 負傷およびレッドカード発生時の即座一時停止)
  const [activeIncidentNotice, setActiveIncidentNotice] = useState<{
    id: string;
    minute: number;
    type: 'injury' | 'red_card' | 'second_yellow';
    player: Player | { id: string; name: string; position?: string; shirtNumber?: number; clubId?: string };
    clubId: string;
    clubName: string;
    isUserClub: boolean;
    injuryDetails?: {
      type: string;
      recoveryDays: number;
      returnDate: string;
      needsSub: boolean;
    };
    redCardDetails?: {
      isSecondYellow: boolean;
      reason: string;
    };
    event: MatchEvent;
  } | null>(null);
  const handledIncidentsRef = useRef<Set<string>>(new Set());
  const [injurySubChoiceId, setInjurySubChoiceId] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Complete match and evaluate championship / runner up if final
  const handleCompleteMatch = (
    explicitScore?: [number, number],
    explicitEvents?: MatchEvent[],
    customPenaltyShootout?: { homeScore: number; awayScore: number; winnerClubId?: string; kickers?: any[] }
  ) => {
    setIsPlaying(false);
    setMatchPhase('finished');

    const finalScore: [number, number] = explicitScore || scoreRef.current;
    const finalEvents: MatchEvent[] = explicitEvents || revealedEventsRef.current;

    scoreRef.current = finalScore;
    revealedEventsRef.current = finalEvents;
    setCurrentScore(finalScore);
    setRevealedEvents(finalEvents);

    if (simulatedResult) {
      const isQuarterOrSemi = Boolean(
        (fixture.round && (
          fixture.round.includes('準') || 
          fixture.round.includes('Quarter') || 
          fixture.round.includes('Semi') || 
          fixture.round.includes('Play-off') ||
          fixture.round.includes('1/4') ||
          fixture.round.includes('1/2')
        ))
      );
      const isFinal = !isQuarterOrSemi && Boolean(
        fixture.isFinal ||
        fixture.round === '決勝' ||
        fixture.round === 'Final' ||
        (fixture.round && fixture.round.endsWith('決勝') && !fixture.round.includes('準'))
      );
      const finalPk = customPenaltyShootout || simulatedResult.fixture.penaltyShootout;
      
      const outcome = determineMatchOutcome({
        homeClubId: homeClub.id,
        awayClubId: awayClub.id,
        homeScore: finalScore[0],
        awayScore: finalScore[1],
        penaltyShootout: finalPk
      });

      const finalFixture: MatchFixture = {
        ...simulatedResult.fixture,
        status: 'finished',
        homeScore: finalScore[0],
        awayScore: finalScore[1],
        winnerClubId: outcome.winnerClubId,
        resultType: outcome.resultType,
        extraTimePlayed: minute > 90 || simulatedResult.fixture.extraTimePlayed,
        penaltyShootout: finalPk,
        events: finalEvents,
        stats: {
          ...simulatedResult.fixture.stats,
          homeScore: finalScore[0],
          awayScore: finalScore[1]
        },
        isResultApplied: false
      };

      completedFinalFixtureRef.current = finalFixture;
      onFinishMatch(finalFixture, simulatedResult.updatedPlayers);

      if (isFinal) {
        if (outcome.winnerClubId === state.userClubId) {
          setShowChampionshipCelebration(true);
        } else if (outcome.winnerClubId) {
          setShowRunnerUpModal(true);
        }
      }
    }
  };

  // Initialize simulation pool on mount
  useEffect(() => {
    if (!homeClub || !awayClub) return;
    const homeTac = isUserHome ? state.tactics : getDefaultTacticsForClub(homeClub, state.players);
    const awayTac = !isUserHome ? state.tactics : getDefaultTacticsForClub(awayClub, state.players);

    const result = simulateFullMatch(fixture, homeClub, awayClub, homeTac, awayTac, state.players);
    setSimulatedResult(result);
  }, []);

  const isHighlightPausedRef = useRef<boolean>(false);

  // Helper to trigger incident pause and modal
  const triggerIncidentPause = (e: MatchEvent, eventMin: number) => {
    const key = `${e.minute}_${e.type}_${e.playerId || 'unknown'}`;
    if (handledIncidentsRef.current.has(key)) return false;
    handledIncidentsRef.current.add(key);

    isHighlightPausedRef.current = false;
    setIsPlaying(false);

    const isUserTeam = e.clubId === state.userClubId;
    const targetClub = state.clubs[e.clubId] || (e.clubId === homeClub.id ? homeClub : awayClub);
    const p = state.players[e.playerId || ''] || simulatedResult?.updatedPlayers?.[e.playerId || ''] || {
      id: e.playerId || 'unknown',
      name: e.playerName || '選手',
      position: 'MF',
      shirtNumber: 10,
      clubId: e.clubId
    };
    const updatedP = simulatedResult?.updatedPlayers?.[e.playerId || ''] || p;

    if (e.type === 'injury') {
      const injuryType = updatedP?.injury?.type || '足首捻挫';
      const recoveryDays = updatedP?.injury?.recoveryDays || 14;
      const returnDate = updatedP?.injury?.returnDate || updatedP?.injuryReturnDate || '未定';

      setActiveIncidentNotice({
        id: key,
        minute: eventMin,
        type: 'injury',
        player: p,
        clubId: e.clubId,
        clubName: targetClub?.name || 'チーム',
        isUserClub: isUserTeam,
        injuryDetails: {
          type: injuryType,
          recoveryDays,
          returnDate,
          needsSub: true
        },
        event: e
      });
      setInjurySubChoiceId(null);
      return true;
    } else if (e.type === 'red_card' || e.type === 'second_yellow') {
      const isSecondYellow = e.type === 'second_yellow';
      const reason = isSecondYellow ? '累積警告（イエローカード2枚目）による退場' : '危険なプレーによる直接レッドカード';

      setActiveIncidentNotice({
        id: key,
        minute: eventMin,
        type: e.type,
        player: p,
        clubId: e.clubId,
        clubName: targetClub?.name || 'チーム',
        isUserClub: isUserTeam,
        redCardDetails: {
          isSecondYellow,
          reason
        },
        event: e
      });
      return true;
    }
    return false;
  };

  // Timer loop for paced live match simulation
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = simSpeed === 4 ? 180 : simSpeed === 2 ? 500 : 1200;

    const interval = setInterval(() => {
      if (isHighlightPausedRef.current) return;

      setMinute(prev => {
        const nextMin = prev + 1;

        // Check for events in this minute
        if (simulatedResult?.fixture?.events) {
          const newEvents = simulatedResult.fixture.events.filter((e: MatchEvent) => e.minute === nextMin);
          if (newEvents.length > 0) {
            const incident = newEvents.find((e: MatchEvent) => 
              (e.type === 'injury' || e.type === 'red_card' || e.type === 'second_yellow') &&
              !handledIncidentsRef.current.has(`${e.minute}_${e.type}_${e.playerId || 'unknown'}`)
            );

            revealedEventsRef.current = [...revealedEventsRef.current, ...newEvents];
            setRevealedEvents(revealedEventsRef.current);
            newEvents.forEach((e: MatchEvent) => {
              if (e.type === 'goal') {
                if (e.clubId === homeClub.id) {
                  scoreRef.current = [scoreRef.current[0] + 1, scoreRef.current[1]];
                } else {
                  scoreRef.current = [scoreRef.current[0], scoreRef.current[1] + 1];
                }
                setCurrentScore(scoreRef.current);

                isHighlightPausedRef.current = true;
                setActiveHighlightEvent(e);
                const pauseDuration = simSpeed === 4 ? 1800 : simSpeed === 2 ? 2600 : 3600;
                setTimeout(() => {
                  setActiveHighlightEvent(null);
                  isHighlightPausedRef.current = false;
                }, pauseDuration);
              }
            });

            if (incident) {
              triggerIncidentPause(incident, nextMin);
              return nextMin;
            }
          }
        }

        // Halftime at 45'
        if (nextMin === 45 && matchPhase === 'first_half') {
          setIsPlaying(false);
          setMatchPhase('halftime');
          setShowHalftimeModal(true);
          return 45;
        }

        // Pause Point ①: Full time at 90'
        if (nextMin === 90 && matchPhase === 'second_half') {
          setIsPlaying(false);
          const { requiresDecider, isTwoLeggedSecondLeg } = isMatchRequiringDecider(fixture);
          let isTiedAt90 = false;
          if (requiresDecider) {
            if (isTwoLeggedSecondLeg && fixture.leg1Score) {
              const aggHome = (fixture.leg1Score.awayScore ?? fixture.leg1Score.away ?? 0) + scoreRef.current[0];
              const aggAway = (fixture.leg1Score.homeScore ?? fixture.leg1Score.home ?? 0) + scoreRef.current[1];
              isTiedAt90 = (aggHome === aggAway);
            } else {
              isTiedAt90 = (scoreRef.current[0] === scoreRef.current[1]);
            }
          }

          if (isTiedAt90) {
            setMatchPhase('fulltime_pause');
            setShowFulltimeModal(true);
            return 90;
          } else {
            handleCompleteMatch(scoreRef.current, revealedEventsRef.current);
            return 90;
          }
        }

        // Pause Point ②: Extra time halftime at 105'
        if (nextMin === 105 && matchPhase === 'extra_first') {
          setIsPlaying(false);
          setMatchPhase('et_halftime');
          setShowEtHalftimeModal(true);
          return 105;
        }

        // Pause Point ③: Extra time full time at 120'
        if (nextMin >= 120 && matchPhase === 'extra_second') {
          setIsPlaying(false);
          const { requiresDecider, isTwoLeggedSecondLeg } = isMatchRequiringDecider(fixture);
          let stillTiedAfterET = false;
          if (requiresDecider) {
            if (isTwoLeggedSecondLeg && fixture.leg1Score) {
              const aggHome = (fixture.leg1Score.awayScore ?? fixture.leg1Score.away ?? 0) + scoreRef.current[0];
              const aggAway = (fixture.leg1Score.homeScore ?? fixture.leg1Score.home ?? 0) + scoreRef.current[1];
              stillTiedAfterET = (aggHome === aggAway);
            } else {
              stillTiedAfterET = (scoreRef.current[0] === scoreRef.current[1]);
            }
          }

          if (stillTiedAfterET) {
            setMatchPhase('et_fulltime');
            setShowEtFulltimeModal(true);
            return 120;
          } else {
            handleCompleteMatch(scoreRef.current, revealedEventsRef.current);
            return 120;
          }
        }

        return nextMin;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, simulatedResult, matchPhase, currentScore]);

  // Auto scroll commentary
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [revealedEvents]);

  const [eligibilityResult, setEligibilityResult] = useState<MatchEligibilityCheckResult | null>(() => {
    return finalMatchEligibilityCheck(
      tactics.lineup.starters.map(s => s.playerId),
      tactics.lineup.bench,
      state.userClubId || '',
      state.players,
      state.currentDate,
      fixture.competition
    );
  });
  const [dateAlert, setDateAlert] = useState<string | null>(null);

  const handleAutoReplaceIneligible = () => {
    const res = autoReplaceIneligiblePlayers(
      tactics.lineup.starters.map(s => s.playerId),
      tactics.lineup.bench,
      state.userClubId || '',
      state.players,
      state.currentDate
    );

    const newStarters = res.starters.map((pId, idx) => ({
      ...tactics.lineup.starters[idx],
      playerId: pId
    }));

    const newTactics: TeamTactics = {
      ...tactics,
      lineup: {
        ...tactics.lineup,
        starters: newStarters,
        bench: res.bench
      }
    };

    setTactics(newTactics);

    const check = finalMatchEligibilityCheck(
      res.starters,
      res.bench,
      state.userClubId || '',
      state.players,
      state.currentDate
    );
    setEligibilityResult(check.isEligible ? null : check);
  };

  const handleStartKickoff = () => {
    // 1. Match date check (Requirement 12)
    if (fixture.date > state.currentDate) {
      setDateAlert(`この試合はまだ開始できません。(試合予定日: ${fixture.date} / 現在ゲーム日: ${state.currentDate})`);
      return;
    }
    setDateAlert(null);

    // 2. FINAL_MATCH_ELIGIBILITY_CHECK (Requirement 1, 9, 10)
    const check = finalMatchEligibilityCheck(
      tactics.lineup.starters.map(s => s.playerId),
      tactics.lineup.bench,
      state.userClubId || '',
      state.players,
      state.currentDate,
      fixture.competition
    );

    if (!check.isEligible) {
      setEligibilityResult(check);
      return;
    }

    setEligibilityResult(null);
    setMatchPhase('first_half');
    setIsPlaying(true);
  };

  const handleResumeSecondHalf = () => {
    setShowHalftimeModal(false);
    setMatchPhase('second_half');
    setIsPlaying(true);
  };

  const handleStartExtraFirstHalf = () => {
    setShowFulltimeModal(false);
    setMatchPhase('extra_first');
    setIsPlaying(true);
  };

  const handleStartExtraSecondHalf = () => {
    setShowEtHalftimeModal(false);
    setMatchPhase('extra_second');
    setIsPlaying(true);
  };

  const handleStartPenaltyShootout = () => {
    setShowEtFulltimeModal(false);
    setMatchPhase('penalty_shootout');
    const homeShooters = tactics.lineup.starters.map(s => state.players[s.playerId]?.name || '選手').slice(0, 5);
    const oppPlayers = (isUserHome ? awayClub : homeClub)?.playerIds || [];
    const awayShooters = oppPlayers.slice(0, 5).map(id => state.players[id]?.name || '相手選手');
    setPkState({
      homeKicks: [null, null, null, null, null],
      awayKicks: [null, null, null, null, null],
      homeKickers: homeShooters,
      awayKickers: awayShooters,
      stepIndex: 0,
      homeScore: 0,
      awayScore: 0,
      isFinished: false
    });
  };

  const handleInstantPkShootout = () => {
    let pHome = 0;
    let pAway = 0;
    const hKicks: boolean[] = [];
    const aKicks: boolean[] = [];
    for (let k = 0; k < 5; k++) {
      const hSucc = Math.random() < 0.76;
      const aSucc = Math.random() < 0.76;
      if (hSucc) pHome++;
      if (aSucc) pAway++;
      hKicks.push(hSucc);
      aKicks.push(aSucc);
    }
    while (pHome === pAway) {
      const hSucc = Math.random() < 0.70;
      const aSucc = Math.random() < 0.70;
      if (hSucc) pHome++;
      if (aSucc) pAway++;
      hKicks.push(hSucc);
      aKicks.push(aSucc);
      if (pHome !== pAway) break;
      if (pHome > 20) { pHome++; hKicks.push(true); aKicks.push(false); break; }
    }
    setPkState({
      homeKicks: hKicks,
      awayKicks: aKicks,
      homeKickers: pkState.homeKickers,
      awayKickers: pkState.awayKickers,
      stepIndex: hKicks.length * 2,
      homeScore: pHome,
      awayScore: pAway,
      isFinished: true
    });
    handleCompleteMatch(scoreRef.current, revealedEventsRef.current, { 
      homeScore: pHome, 
      awayScore: pAway, 
      winnerClubId: pHome > pAway ? homeClub.id : awayClub.id 
    });
  };

  // Skip simulation to end of current phase (Pause points at 90m, 105m, 120m respected!)
  const handleInstantSkip = () => {
    if (!homeClub || !awayClub) return;

    let targetMin = 45;
    if (minute < 45) targetMin = 45;
    else if (minute < 90) targetMin = 90;
    else if (minute < 105) targetMin = 105;
    else targetMin = 120;

    const allEvents: MatchEvent[] = simulatedResult?.fixture?.events || [];

    // Search ahead for any unhandled incident
    const upcomingIncidents = allEvents.filter(
      (e: MatchEvent) =>
        e.minute > minute &&
        e.minute <= targetMin &&
        (e.type === 'injury' || e.type === 'red_card' || e.type === 'second_yellow') &&
        !handledIncidentsRef.current.has(`${e.minute}_${e.type}_${e.playerId || 'unknown'}`)
    ).sort((a, b) => a.minute - b.minute);

    if (upcomingIncidents.length > 0) {
      const incident = upcomingIncidents[0];
      const stopMin = incident.minute;
      const eventsUpToStop = allEvents.filter((e: MatchEvent) => e.minute <= stopMin);
      
      let hScore = 0;
      let aScore = 0;
      eventsUpToStop.forEach((e: MatchEvent) => {
        if (e.type === 'goal') {
          if (e.clubId === homeClub.id) hScore++;
          else aScore++;
        }
      });
      scoreRef.current = [hScore, aScore];
      revealedEventsRef.current = eventsUpToStop;
      setCurrentScore([hScore, aScore]);
      setRevealedEvents(eventsUpToStop);
      setMinute(stopMin);
      setIsPlaying(false);
      triggerIncidentPause(incident, stopMin);
      return;
    }

    const homeTac = isUserHome ? tactics : getDefaultTacticsForClub(homeClub, state.players);
    const awayTac = !isUserHome ? tactics : getDefaultTacticsForClub(awayClub, state.players);

    if (minute < 45) {
      const res = fastForwardRemainingMatch(
        minute,
        revealedEventsRef.current,
        scoreRef.current,
        fixture,
        homeClub,
        awayClub,
        homeTac,
        awayTac,
        state.players,
        simulatedResult
      );

      const firstHalfEvents = (res.fixture.events || []).filter((e: MatchEvent) => e.minute <= 45);
      let hScore = 0;
      let aScore = 0;
      firstHalfEvents.forEach((e: MatchEvent) => {
        if (e.type === 'goal') {
          if (e.clubId === homeClub.id) hScore++;
          else aScore++;
        }
      });
      scoreRef.current = [hScore, aScore];
      revealedEventsRef.current = firstHalfEvents;
      setCurrentScore([hScore, aScore]);
      setRevealedEvents(firstHalfEvents);
      setMinute(45);
      setIsPlaying(false);
      setMatchPhase('halftime');
      setShowHalftimeModal(true);
    } else if (minute < 90) {
      const res = fastForwardRemainingMatch(
        minute,
        revealedEventsRef.current,
        scoreRef.current,
        fixture,
        homeClub,
        awayClub,
        homeTac,
        awayTac,
        state.players,
        simulatedResult
      );

      const events90 = (res.fixture.events || []).filter((e: MatchEvent) => e.minute <= 90);
      let hScore = 0;
      let aScore = 0;
      events90.forEach((e: MatchEvent) => {
        if (e.type === 'goal') {
          if (e.clubId === homeClub.id) hScore++;
          else aScore++;
        }
      });
      scoreRef.current = [hScore, aScore];
      revealedEventsRef.current = events90;
      setCurrentScore([hScore, aScore]);
      setRevealedEvents(events90);
      setMinute(90);
      setIsPlaying(false);

      const { requiresDecider, isTwoLeggedSecondLeg } = isMatchRequiringDecider(fixture);
      let isTiedAt90 = false;
      if (requiresDecider) {
        if (isTwoLeggedSecondLeg && fixture.leg1Score) {
          const aggHome = (fixture.leg1Score.awayScore ?? fixture.leg1Score.away ?? 0) + hScore;
          const aggAway = (fixture.leg1Score.homeScore ?? fixture.leg1Score.home ?? 0) + aScore;
          isTiedAt90 = (aggHome === aggAway);
        } else {
          isTiedAt90 = (hScore === aScore);
        }
      }

      if (isTiedAt90) {
        setMatchPhase('fulltime_pause');
        setShowFulltimeModal(true);
      } else {
        handleCompleteMatch([hScore, aScore], events90);
      }
    } else if (minute < 105) {
      setMinute(105);
      setIsPlaying(false);
      setMatchPhase('et_halftime');
      setShowEtHalftimeModal(true);
    } else {
      const res = fastForwardRemainingMatch(
        minute,
        revealedEventsRef.current,
        scoreRef.current,
        fixture,
        homeClub,
        awayClub,
        homeTac,
        awayTac,
        state.players,
        simulatedResult
      );

      const events120 = (res.fixture.events || []).filter((e: MatchEvent) => e.minute <= 120);
      let hScore = 0;
      let aScore = 0;
      events120.forEach((e: MatchEvent) => {
        if (e.type === 'goal') {
          if (e.clubId === homeClub.id) hScore++;
          else aScore++;
        }
      });
      scoreRef.current = [hScore, aScore];
      revealedEventsRef.current = events120;
      setCurrentScore([hScore, aScore]);
      setRevealedEvents(events120);
      setMinute(120);
      setIsPlaying(false);

      const { requiresDecider, isTwoLeggedSecondLeg } = isMatchRequiringDecider(fixture);
      let stillTied = false;
      if (requiresDecider) {
        if (isTwoLeggedSecondLeg && fixture.leg1Score) {
          const aggHome = (fixture.leg1Score.awayScore ?? fixture.leg1Score.away ?? 0) + hScore;
          const aggAway = (fixture.leg1Score.homeScore ?? fixture.leg1Score.home ?? 0) + aScore;
          stillTied = (aggHome === aggAway);
        } else {
          stillTied = (hScore === aScore);
        }
      }

      if (stillTied) {
        setMatchPhase('et_fulltime');
        setShowEtFulltimeModal(true);
      } else {
        handleCompleteMatch([hScore, aScore], events120);
      }
    }
  };

  // Perform substitution
  const handleExecuteSub = () => {
    if (!subPlayerOffId || !subPlayerOnId || subCount >= 5) return;
    if (subbedOutPlayerIds.includes(subPlayerOnId)) return; // Strictly forbid re-entry of subbed off player

    const offPlayer = state.players[subPlayerOffId];
    const onPlayer = state.players[subPlayerOnId];

    // Add sub event
    const subEvent: MatchEvent = {
      minute,
      type: 'sub',
      clubId: state.userClubId || '',
      playerId: offPlayer?.id || '',
      playerName: offPlayer?.name || '',
      subInPlayerId: onPlayer?.id,
      subInPlayerName: onPlayer?.name,
      description: `🔄 選手交代: OUT: ${offPlayer?.name} (${offPlayer?.position}) ➔ IN: ${onPlayer?.name} (${onPlayer?.position})`
    };

    setRevealedEvents(prev => [...prev, subEvent]);
    setSubCount(c => c + 1);
    setSubbedOutPlayerIds(prev => [...prev, subPlayerOffId]);

    // Swap in active tactics
    const newStarters = tactics.lineup.starters.map(s => {
      if (s.playerId === subPlayerOffId) {
        return { ...s, playerId: subPlayerOnId };
      }
      return s;
    });
    const newBench = tactics.lineup.bench.map(id => id === subPlayerOnId ? subPlayerOffId : id);

    setTactics({
      ...tactics,
      lineup: {
        ...tactics.lineup,
        starters: newStarters,
        bench: newBench
      }
    });

    setSubPlayerOffId(null);
    setSubPlayerOnId(null);
  };

  // Confirm Incident (Injury or Red Card) and resume (Requirement 1: 負傷・レッドカード共通の停止と再開)
  const handleConfirmIncident = (resumeMatch = true) => {
    if (!activeIncidentNotice) return;
    const inc = activeIncidentNotice;

    if (inc.type === 'injury') {
      const injuredPlayer = inc.player as Player;
      const injuryType = inc.injuryDetails?.type || '足首捻挫';
      const recoveryDays = inc.injuryDetails?.recoveryDays || 14;
      const returnDate = inc.injuryDetails?.returnDate || '未定';

      if (inc.isUserClub) {
        if (injurySubChoiceId && subCount < 5) {
          const subInPlayer = state.players[injurySubChoiceId];
          const subEvent: MatchEvent = {
            minute: inc.minute,
            type: 'sub',
            clubId: state.userClubId || '',
            playerId: injuredPlayer.id,
            playerName: injuredPlayer.name,
            subInPlayerId: subInPlayer?.id,
            subInPlayerName: subInPlayer?.name,
            description: `🔄 負傷交代 (${inc.minute}分): OUT: ${injuredPlayer.name} (負傷退場・全治${recoveryDays}日) ➔ IN: ${subInPlayer?.name} (${subInPlayer?.position})`
          };

          setRevealedEvents(prev => [...prev, subEvent]);
          setSubCount(c => c + 1);

          const newStarters = tactics.lineup.starters.map(s => {
            if (s.playerId === injuredPlayer.id) {
              return { ...s, playerId: injurySubChoiceId };
            }
            return s;
          });
          const newBench = tactics.lineup.bench.filter(id => id !== injurySubChoiceId);

          setTactics({
            ...tactics,
            lineup: {
              ...tactics.lineup,
              starters: newStarters,
              bench: newBench
            }
          });
        } else {
          const tenManEvent: MatchEvent = {
            minute: inc.minute,
            type: 'sub',
            clubId: state.userClubId || '',
            playerId: injuredPlayer.id,
            playerName: injuredPlayer.name,
            description: `🚑 負傷退場 (${inc.minute}分): ${injuredPlayer.name}が負傷によりピッチを去りました（交代枠なし・10名で試合続行）`
          };
          setRevealedEvents(prev => [...prev, tenManEvent]);

          const newStarters = tactics.lineup.starters.filter(s => s.playerId !== injuredPlayer.id);
          setTactics({
            ...tactics,
            lineup: {
              ...tactics.lineup,
              starters: newStarters,
              bench: tactics.lineup.bench
            }
          });
        }
      }

      if (simulatedResult?.updatedPlayers?.[injuredPlayer.id]) {
        simulatedResult.updatedPlayers[injuredPlayer.id].injury = {
          isInjured: true,
          type: injuryType,
          recoveryDays,
          returnDate
        };
        simulatedResult.updatedPlayers[injuredPlayer.id].injuryStatus = 'INJURED';
        simulatedResult.updatedPlayers[injuredPlayer.id].injuryReturnDate = returnDate;
        simulatedResult.updatedPlayers[injuredPlayer.id].squadStatus = 'OUT_OF_SQUAD';
      }
    } else if (inc.type === 'red_card' || inc.type === 'second_yellow') {
      if (inc.isUserClub) {
        // Red card on user club: player removed from active starters (plays with 10)
        const newStarters = tactics.lineup.starters.filter(s => s.playerId !== inc.player.id);
        setTactics({
          ...tactics,
          lineup: {
            ...tactics.lineup,
            starters: newStarters,
            bench: tactics.lineup.bench
          }
        });
      }
    }

    setActiveIncidentNotice(null);
    setInjurySubChoiceId(null);
    if (resumeMatch) {
      setIsPlaying(true);
    }
  };

  // Extract all goals scored so far for header display
  const homeGoals = revealedEvents.filter(e => e.type === 'goal' && e.clubId === homeClub.id);
  const awayGoals = revealedEvents.filter(e => e.type === 'goal' && e.clubId === awayClub.id);

  // User club and opponent starters for lineup and fatigue view
  const userStarters = tactics.lineup.starters.map(s => state.players[s.playerId]).filter(Boolean);
  const userBench = tactics.lineup.bench.map(id => state.players[id]).filter(Boolean);

  const homeTactics = isUserHome ? tactics : getDefaultTacticsForClub(homeClub, state.players);
  const awayTactics = !isUserHome ? tactics : getDefaultTacticsForClub(awayClub, state.players);

  const homeStartersList = homeTactics.lineup.starters.map(s => ({
    ...s,
    player: state.players[s.playerId]
  })).filter(s => Boolean(s.player));

  const awayStartersList = awayTactics.lineup.starters.map(s => ({
    ...s,
    player: state.players[s.playerId]
  })).filter(s => Boolean(s.player));

  const homeBenchList = (homeTactics.lineup.bench || []).map(id => state.players[id]).filter(Boolean);
  const awayBenchList = (awayTactics.lineup.bench || []).map(id => state.players[id]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex flex-col text-slate-100">
      
      {/* MATCH HEADER SCOREBOARD */}
      <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 shadow-2xl backdrop-blur-md px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-6">
          
          {/* Home Club */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end text-right min-w-0">
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-1.5 justify-end">
                <span>{homeClub?.name}</span>
                {isUserHome && <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1 rounded">YOU</span>}
              </div>
              {/* Home Goalscorers */}
              <div className="text-[10px] text-emerald-400 font-mono truncate">
                {homeGoals.map(g => `${g.playerName} ${g.minute}'`).join(', ')}
              </div>
            </div>
            <div 
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 border border-white/20 shadow-md"
              style={{ backgroundColor: homeClub?.primaryColor }}
            >
              {homeClub?.shortName}
            </div>
          </div>

          {/* Score & Match Clock Centerpiece (00:00, 05:00... time display) */}
          <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 min-w-[130px] sm:min-w-[150px]">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white flex items-center gap-2">
              <span className={currentScore[0] > currentScore[1] ? 'text-emerald-400' : 'text-white'}>{currentScore[0]}</span>
              <span className="text-slate-500 text-lg">-</span>
              <span className={currentScore[1] > currentScore[0] ? 'text-emerald-400' : 'text-white'}>{currentScore[1]}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono mt-0.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-extrabold text-emerald-400 tracking-wider">
                {String(minute).padStart(2, '0')}:00
              </span>
              <span className="text-slate-500">·</span>
                {matchPhase === 'pre' ? t.matchDay : 
                 matchPhase === 'halftime' ? t.halftime : 
                 matchPhase === 'fulltime_pause' ? '90分終了 (延長戦)' :
                 matchPhase === 'extra_first' ? '延長前半' :
                 matchPhase === 'et_halftime' ? '延長ハーフタイム' :
                 matchPhase === 'extra_second' ? '延長後半' :
                 matchPhase === 'et_fulltime' ? '延長120分終了 (PK前)' :
                 matchPhase === 'penalty_shootout' ? 'PK戦 (PENALTIES)' :
                 matchPhase === 'finished' ? t.matchFinished : 
                 minute <= 45 ? '1st Half' : '2nd Half'}
            </div>
          </div>

          {/* Away Club */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start text-left min-w-0">
            <div 
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 border border-white/20 shadow-md"
              style={{ backgroundColor: awayClub?.primaryColor }}
            >
              {awayClub?.shortName}
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-1.5">
                <span>{awayClub?.name}</span>
                {!isUserHome && <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1 rounded">YOU</span>}
              </div>
              {/* Away Goalscorers */}
              <div className="text-[10px] text-emerald-400 font-mono truncate">
                {awayGoals.map(g => `${g.playerName} ${g.minute}'`).join(', ')}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* DRAMATIC GOAL & EVENT HIGHLIGHT BANNER POPUP (Requirements 3 & 4) */}
      {activeHighlightEvent && (
        <div className={`py-3.5 px-4 shadow-2xl animate-in slide-in-from-top duration-300 z-30 flex items-center justify-center gap-3 ${
          activeHighlightEvent.type === 'goal'
            ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-slate-950 font-display'
            : activeHighlightEvent.type === 'red_card'
            ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-white'
            : activeHighlightEvent.type === 'var'
            ? 'bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-700 text-white'
            : activeHighlightEvent.type === 'save'
            ? 'bg-gradient-to-r from-blue-700 via-sky-600 to-blue-700 text-white'
            : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950'
        }`}>
          {activeHighlightEvent.type === 'goal' || activeHighlightEvent.type === 'penalty' ? (
            <div className="flex items-center gap-3.5 text-center sm:text-left max-w-2xl">
              <span className="text-4xl animate-bounce shrink-0">⚽</span>
              <div>
                <div className="text-xs sm:text-sm font-black tracking-widest uppercase opacity-90">
                  【GOAL!! GOAL!! GOAL!!】 {activeHighlightEvent.minute}&apos; ({String(activeHighlightEvent.minute).padStart(2, '0')}:00)
                </div>
                <div className="text-lg sm:text-xl font-black">
                  得点者: {activeHighlightEvent.playerName} {activeHighlightEvent.assistPlayerName ? `(アシスト: ${activeHighlightEvent.assistPlayerName})` : ''}
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-950 mt-1 leading-snug line-clamp-2">
                  {activeHighlightEvent.description}
                </p>
              </div>
            </div>
          ) : activeHighlightEvent.type === 'red_card' ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">🟥</span>
              <div>
                <div className="text-xs uppercase font-extrabold tracking-wider">
                  一発退場！ RED CARD ({activeHighlightEvent.minute}&apos;)
                </div>
                <div className="font-black text-base sm:text-lg">
                  {activeHighlightEvent.playerName} にレッドカード提示
                </div>
              </div>
            </div>
          ) : activeHighlightEvent.type === 'var' ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">📺</span>
              <div>
                <div className="text-xs uppercase font-extrabold tracking-wider text-purple-200">
                  VAR REVIEW ({activeHighlightEvent.minute}&apos;)
                </div>
                <div className="font-black text-sm sm:text-base">
                  {activeHighlightEvent.description}
                </div>
              </div>
            </div>
          ) : activeHighlightEvent.type === 'save' ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧤</span>
              <div>
                <div className="text-xs uppercase font-extrabold tracking-wider text-sky-200">
                  決定機阻止 / BIG CHANCE ({activeHighlightEvent.minute}&apos;)
                </div>
                <div className="font-black text-sm sm:text-base">
                  {activeHighlightEvent.description}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚑</span>
              <div className="font-bold text-sm sm:text-base">
                {activeHighlightEvent.minute}&apos; {t.injury}: {activeHighlightEvent.playerName}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MAIN SIMULATION WORKSPACE */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-4 space-y-4">
        
        {/* Pre-Match Eligibility or Date Alert Banner (Requirements 9, 10, 12) */}
        {matchPhase === 'pre' && (
          <>
            {(fixture.date > state.currentDate || dateAlert) && (
              <div className="bg-amber-950/80 border border-amber-600/60 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-200">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold">
                    {dateAlert || `この試合はまだ開始できません。試合予定日: ${fixture.date} (現在ゲーム日: ${state.currentDate})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 cursor-pointer"
                >
                  日程に戻る
                </button>
              </div>
            )}

            {eligibilityResult && !eligibilityResult.isEligible && (
              <div className="bg-red-950/90 border-2 border-red-500/80 rounded-2xl p-4 text-red-200 shadow-xl space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-800/60 pb-2.5">
                  <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm sm:text-base">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>出場できない選手が含まれています</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const firstIneligible = eligibilityResult.ineligibleStarters[0]?.player || eligibilityResult.ineligibleBench[0]?.player;
                        if (firstIneligible) setManualReplaceTarget(firstIneligible);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 text-xs font-black shadow-md shadow-amber-500/30 cursor-pointer shrink-0 transition-transform flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>選手を変更</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoReplaceIneligible}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer shrink-0 transition-colors"
                    >
                      <span>自動最適化</span>
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-red-300">
                  ※負傷中・出場停止処分中の選手は試合への出場・ベンチ入りが禁止されています。「選手を変更」から交代選手を直接選択してください。
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {eligibilityResult.ineligibleAll.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl text-xs border border-red-900/50">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-red-900 text-red-200 font-bold text-[10px] shrink-0">
                          {item.badge}
                        </span>
                        <span className="font-bold text-white">{item.player.name}</span>
                        <span className="text-slate-400 text-[11px]">({item.role === 'STARTER' ? 'スタメン' : 'ベンチ'})</span>
                        <span className="text-red-300 text-[11px] font-medium ml-2">{item.reason}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setManualReplaceTarget(item.player)}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>選手を変更</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Speed & Timeline Playback Controls (Requirement 3) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
          {/* Play / Pause / Kickoff Button */}
          <div className="flex items-center gap-2">
            {matchPhase === 'pre' && (
              <button
                type="button"
                onClick={handleStartKickoff}
                disabled={fixture.date > state.currentDate || (eligibilityResult !== null && !eligibilityResult.isEligible)}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  fixture.date > state.currentDate || (eligibilityResult !== null && !eligibilityResult.isEligible)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 shadow-emerald-500/20'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {fixture.date > state.currentDate 
                    ? `この試合はまだ開始できません (${fixture.date})` 
                    : (eligibilityResult && !eligibilityResult.isEligible)
                    ? '出場資格エラー（選手を入れ替えてください）'
                    : t.kickoff}
                </span>
              </button>
            )}

            {(matchPhase === 'first_half' || matchPhase === 'second_half' || matchPhase === 'extra_first' || matchPhase === 'extra_second') && (
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  isPlaying 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                    : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? '一時停止 (Pause)' : '再開 (Resume)'}</span>
              </button>
            )}

            {matchPhase === 'halftime' && (
              <button
                type="button"
                onClick={handleResumeSecondHalf}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.secondHalf}</span>
              </button>
            )}

            {matchPhase === 'fulltime_pause' && (
              <button
                type="button"
                onClick={handleStartExtraFirstHalf}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>延長戦を開始する (延長前半へ)</span>
              </button>
            )}

            {matchPhase === 'et_halftime' && (
              <button
                type="button"
                onClick={handleStartExtraSecondHalf}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>延長後半を開始する</span>
              </button>
            )}

            {matchPhase === 'et_fulltime' && (
              <button
                type="button"
                onClick={handleStartPenaltyShootout}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-500/20 animate-pulse"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>PK戦を開始する</span>
              </button>
            )}

            {/* Instant Skip Button */}
            {matchPhase !== 'finished' && (
              <button
                type="button"
                onClick={handleInstantSkip}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700 flex items-center gap-1.5"
                title="即時シミュレーション"
              >
                <FastForward className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.speedInstant}</span>
              </button>
            )}
          </div>

          {/* Simulation Speed Toggles: 1x (Normal), 2x (Fast), 4x (Very Fast) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold px-2">{t.speed}:</span>
            {[
              { val: 1, label: t.speedNormal },
              { val: 2, label: t.speedFast },
              { val: 4, label: t.speedVeryFast }
            ].map(s => (
              <button
                key={s.val}
                type="button"
                onClick={() => setSimSpeed(s.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  simSpeed === s.val
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* PRE-MATCH PREPARATION WORKSPACE (Requirement 9) */}
        {matchPhase === 'pre' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setPreMatchTab('formation')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  preMatchTab === 'formation'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🏟️ 両チームフォーメーション図
              </button>
              <button
                type="button"
                onClick={() => setPreMatchTab('squad')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  preMatchTab === 'squad'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                📋 メンバー表＆コンディション一覧
              </button>
              <button
                type="button"
                onClick={() => setPreMatchTab('tactics')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  preMatchTab === 'tactics'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                ⚙️ チーム戦術情報
              </button>
              <button
                type="button"
                onClick={() => setPreMatchTab('preview')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  preMatchTab === 'preview'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                ℹ️ 試合・会場情報
              </button>
            </div>

            {/* PRE-MATCH TAB 1: DUAL FORMATIONS */}
            {preMatchTab === 'formation' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Pitch */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: homeClub?.primaryColor }} />
                      <span className="font-bold text-white text-sm">{homeClub?.name}</span>
                      {isUserHome && <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1 rounded">YOU</span>}
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      {homeTactics.formation}
                    </span>
                  </div>
                  <div className="relative w-full h-80 bg-emerald-950/80 rounded-2xl border-2 border-emerald-600/40 overflow-hidden shadow-inner">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-emerald-500/30" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-500/30" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-14 border-b border-x border-emerald-500/30" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-14 border-t border-x border-emerald-500/30" />
                    {homeStartersList.map((s, idx) => {
                      const p = s.player;
                      return (
                        <div
                          key={p.id || idx}
                          style={{ left: `${s.pitchX}%`, top: `${s.pitchY}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] text-white border-2 border-white/80 shadow-md"
                            style={{ backgroundColor: homeClub?.primaryColor || '#10b981' }}
                          >
                            {p.shirtNumber || s.position}
                          </div>
                          <div className="bg-slate-950/90 text-white text-[9px] font-bold px-1 rounded border border-slate-700/80 mt-0.5 truncate max-w-[65px] text-center">
                            {p.name.split(' ').pop()}
                          </div>
                          <div className="w-11 mt-0.5">
                            <FatigueGauge fatigue={p.fatigue ?? 0} size="xs" showLabel={false} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Away Pitch */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: awayClub?.primaryColor }} />
                      <span className="font-bold text-white text-sm">{awayClub?.name}</span>
                      {!isUserHome && <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1 rounded">YOU</span>}
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-500/30">
                      {awayTactics.formation}
                    </span>
                  </div>
                  <div className="relative w-full h-80 bg-emerald-950/80 rounded-2xl border-2 border-emerald-600/40 overflow-hidden shadow-inner">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-emerald-500/30" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-500/30" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-14 border-b border-x border-emerald-500/30" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-14 border-t border-x border-emerald-500/30" />
                    {awayStartersList.map((s, idx) => {
                      const p = s.player;
                      return (
                        <div
                          key={p.id || idx}
                          style={{ left: `${s.pitchX}%`, top: `${s.pitchY}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] text-white border-2 border-white/80 shadow-md"
                            style={{ backgroundColor: awayClub?.primaryColor || '#3b82f6' }}
                          >
                            {p.shirtNumber || s.position}
                          </div>
                          <div className="bg-slate-950/90 text-white text-[9px] font-bold px-1 rounded border border-slate-700/80 mt-0.5 truncate max-w-[65px] text-center">
                            {p.name.split(' ').pop()}
                          </div>
                          <div className="w-11 mt-0.5">
                            <FatigueGauge fatigue={p.fatigue ?? 0} size="xs" showLabel={false} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PRE-MATCH TAB 2: SQUAD AND CONDITION LIST */}
            {preMatchTab === 'squad' && (
              <div className="space-y-4">
                {/* Starters */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>⚽ {isUserHome ? homeClub?.name : awayClub?.name} 先発メンバー (11名)</span>
                    </h3>
                    <span className="text-xs font-mono text-emerald-400 font-bold">先発 XI</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {userStarters.map(p => {
                      const compId = (fixture.competition || '').toLowerCase();
                      const compCat: CompetitionCategory = (compId.includes('pre-season') || compId.includes('preseason')) ? 'preseason' :
                        (compId.includes('ucl') || compId.includes('champions')) ? 'ucl' :
                        (compId.includes('uel') || (compId.includes('europa') && !compId.includes('conference'))) ? 'uel' :
                        (compId.includes('uecl') || compId.includes('conference')) ? 'uecl' :
                        (compId.includes('cup') || compId.includes('fa') || compId.includes('carabao') || compId.includes('copa') || compId.includes('coppa') || compId.includes('dfb')) ? 'domestic_cup' : 'league';
                      const catRemaining = p.suspension?.competitionSuspensions ? p.suspension.competitionSuspensions[compCat] : undefined;
                      const isSuspended = p.suspension && (
                        ((catRemaining ?? 0) > 0) ||
                        (p.suspension.matchesRemaining > 0 && p.suspension.isSuspended)
                      );
                      const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;

                      return (
                        <div key={p.id} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-mono">#{p.shirtNumber}</span>
                              <span className="text-xs font-bold text-blue-400 font-mono w-7">{p.position}</span>
                              <span className="text-xs font-bold text-white">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isSuspended ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/80 text-red-200 border border-red-700 font-bold">
                                  出場停止
                                </span>
                              ) : isInjured ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-900/80 text-rose-200 border border-rose-700 font-bold">
                                  負傷
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                                  出場可
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setManualReplaceTarget(p)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 cursor-pointer"
                              >
                                変更
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <div className="flex items-center gap-2">
                              <span>OVR {p.ovr}</span>
                              <span>STA {p.stamina || 75}</span>
                            </div>
                            <ConditionDot condition={p.condition} showLabel />
                          </div>
                          <FatigueGauge fatigue={p.fatigue} size="sm" showFraction />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bench */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>💺 ベンチ入りメンバー ({userBench.length}名)</span>
                    </h3>
                    <span className="text-xs font-mono text-slate-400">控え</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {userBench.map(p => {
                      const isSuspended = p.suspension && (
                        (((p.suspension.competitionSuspensions as any)?.[fixture.competition] || 0) > 0) ||
                        (p.suspension.matchesRemaining > 0 && p.suspension.isSuspended)
                      );
                      const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;

                      return (
                        <div key={p.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-mono">#{p.shirtNumber}</span>
                              <span className="text-xs font-bold text-slate-400 font-mono w-7">{p.position}</span>
                              <span className="text-xs font-bold text-slate-200">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isSuspended ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/80 text-red-200 border border-red-700 font-bold">
                                  出場停止
                                </span>
                              ) : isInjured ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-900/80 text-rose-200 border border-rose-700 font-bold">
                                  負傷
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                                  出場可
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setManualReplaceTarget(p)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 cursor-pointer"
                              >
                                変更
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <div className="flex items-center gap-2">
                              <span>OVR {p.ovr}</span>
                              <span>STA {p.stamina || 75}</span>
                            </div>
                            <ConditionDot condition={p.condition} showLabel />
                          </div>
                          <FatigueGauge fatigue={p.fatigue} size="sm" showFraction />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PRE-MATCH TAB 3: TACTICS INFO */}
            {preMatchTab === 'tactics' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-white">チーム戦術詳細比較</h3>
                  <p className="text-xs text-slate-400 mt-0.5">両チームのフォーメーション、攻撃・守備スタイル、プレス強度です。</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Home Club */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white text-sm">{homeClub?.name}</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{homeTactics.formation}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/40">
                        <span className="text-slate-400">攻撃スタイル</span>
                        <span className="font-bold text-slate-200">{homeTactics.instructions?.attackingStyle || 'ポゼッション・パス'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/40">
                        <span className="text-slate-400">守備スタイル</span>
                        <span className="font-bold text-slate-200">{homeTactics.instructions?.defensiveStyle || 'ハイプレス'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/40">
                        <span className="text-slate-400">プレス強度</span>
                        <span className="font-bold text-slate-200">{homeTactics.instructions?.pressIntensity || '非常に激しい'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">ディフェンスライン</span>
                        <span className="font-bold text-slate-200">{homeTactics.instructions?.defensiveLine || 'ハイライン'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Away Club */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white text-sm">{awayClub?.name}</span>
                      <span className="text-xs font-mono font-bold text-blue-400">{awayTactics.formation}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/40">
                        <span className="text-slate-400">攻撃スタイル</span>
                        <span className="font-bold text-slate-200">{awayTactics.instructions?.attackingStyle || 'ダイレクト・カウンター'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/40">
                        <span className="text-slate-400">守備スタイル</span>
                        <span className="font-bold text-slate-200">{awayTactics.instructions?.defensiveStyle || 'ミドルブロック'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/40">
                        <span className="text-slate-400">プレス強度</span>
                        <span className="font-bold text-slate-200">{awayTactics.instructions?.pressIntensity || '標準的'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">ディフェンスライン</span>
                        <span className="font-bold text-slate-200">{awayTactics.instructions?.defensiveLine || '標準'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRE-MATCH TAB 4: MATCH PREVIEW */}
            {preMatchTab === 'preview' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-white">試合・会場インフォメーション</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-mono text-[11px] block">大会 / ラウンド</span>
                    <span className="text-white font-bold">{fixture.competitionName} · {fixture.round || '公式戦'}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-mono text-[11px] block">試合日程</span>
                    <span className="text-emerald-400 font-mono font-bold">{fixture.date} ({fixture.time || '15:00'})</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-mono text-[11px] block">スタジアム / 会場</span>
                    <span className="text-white font-bold">
                      {fixture.isNeutralVenue ? '中立地スタジアム' : (homeClub?.stadiumName || `${homeClub?.name} スタジアム`)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-mono text-[11px] block">天候 / 主審</span>
                    <span className="text-slate-200 font-medium">
                      {fixture.weather || '晴れ (微風)'} · 主審: {fixture.referee || '公式担当審判'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* In-Match View Switcher Tabs: Pitch Lineup / Events Log / Live Stats / Substitutions */}
        {matchPhase !== 'pre' && (
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('formation')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'formation'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>🏟️ フォーメーション</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pitch')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'pitch'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📋 選手・疲労一覧
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer relative ${
                activeTab === 'events'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              ⏱️ {t.matchEvents} ({revealedEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📊 試合スタッツ
            </button>
            {matchPhase !== 'finished' && (
              <button
                type="button"
                onClick={() => setActiveTab('subs')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'subs'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🔄 選手交代 ({subCount}/5)
              </button>
            )}
            {matchPhase !== 'finished' && (
              <button
                type="button"
                onClick={() => setActiveTab('tactics')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'tactics'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>⚙️ 試合中戦術変更</span>
              </button>
            )}
          </div>
        )}

        {/* IN-MATCH TAB 0: REAL-TIME DUAL FORMATIONS (Requirements 1, 2, 3) */}
        {activeTab === 'formation' && matchPhase !== 'pre' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🏟️ 試合中フォーメーション・配置図</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {minute}&apos; リアルタイム連動
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  自クラブの選手をタップするとベンチ選手との即時交代メニューが開きます（交代枠: 残り {5 - subCount}名）
                </p>
              </div>
              {matchPhase !== 'finished' && subCount < 5 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('subs')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>選手交代リストを開く</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Pitch */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: homeClub?.primaryColor }} />
                    <span className="font-bold text-white text-sm">{homeClub?.name}</span>
                    {isUserHome && <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1 rounded">YOU</span>}
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    {homeTactics.formation}
                  </span>
                </div>
                <div className="relative w-full h-84 bg-emerald-950/80 rounded-2xl border-2 border-emerald-600/40 overflow-hidden shadow-inner">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-emerald-500/30" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-500/30" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-14 border-b border-x border-emerald-500/30" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-14 border-t border-x border-emerald-500/30" />
                  {homeStartersList.map((s, idx) => {
                    const p = s.player;
                    const dynamicFatigue = Math.min(100, Math.round((p.fatigue || 20) + (minute * 0.25)));
                    const isUserPlayer = isUserHome;
                    return (
                      <div
                        key={p.id || idx}
                        style={{ left: `${s.pitchX}%`, top: `${s.pitchY}%` }}
                        onClick={() => {
                          if (isUserPlayer && matchPhase !== 'finished') {
                            setSubPlayerOffId(p.id);
                            setActiveTab('subs');
                          }
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 ${
                          isUserPlayer && matchPhase !== 'finished' ? 'cursor-pointer group hover:scale-110 transition-transform' : ''
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] text-white border-2 border-white/80 shadow-md relative"
                          style={{ backgroundColor: homeClub?.primaryColor || '#10b981' }}
                        >
                          {p.shirtNumber || s.position}
                          {isUserPlayer && matchPhase !== 'finished' && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
                          )}
                        </div>
                        <div className="bg-slate-950/95 text-white text-[9px] font-bold px-1 rounded border border-slate-700/80 mt-0.5 truncate max-w-[70px] text-center shadow-xs">
                          {p.name.split(' ').pop()}
                        </div>
                        <div className="w-11 mt-0.5">
                          <FatigueGauge fatigue={dynamicFatigue} size="xs" showLabel={false} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Away Pitch */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: awayClub?.primaryColor }} />
                    <span className="font-bold text-white text-sm">{awayClub?.name}</span>
                    {!isUserHome && <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1 rounded">YOU</span>}
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-500/30">
                    {awayTactics.formation}
                  </span>
                </div>
                <div className="relative w-full h-84 bg-emerald-950/80 rounded-2xl border-2 border-emerald-600/40 overflow-hidden shadow-inner">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-emerald-500/30" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-500/30" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-14 border-b border-x border-emerald-500/30" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-14 border-t border-x border-emerald-500/30" />
                  {awayStartersList.map((s, idx) => {
                    const p = s.player;
                    const dynamicFatigue = Math.min(100, Math.round((p.fatigue ?? 0) + (minute * 0.25)));
                    const isUserPlayer = !isUserHome;
                    return (
                      <div
                        key={p.id || idx}
                        style={{ left: `${s.pitchX}%`, top: `${s.pitchY}%` }}
                        onClick={() => {
                          if (isUserPlayer && matchPhase !== 'finished') {
                            setSubPlayerOffId(p.id);
                            setActiveTab('subs');
                          }
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 ${
                          isUserPlayer && matchPhase !== 'finished' ? 'cursor-pointer group hover:scale-110 transition-transform' : ''
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] text-white border-2 border-white/80 shadow-md relative"
                          style={{ backgroundColor: awayClub?.primaryColor || '#3b82f6' }}
                        >
                          {p.shirtNumber || s.position}
                          {isUserPlayer && matchPhase !== 'finished' && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
                          )}
                        </div>
                        <div className="bg-slate-950/95 text-white text-[9px] font-bold px-1 rounded border border-slate-700/80 mt-0.5 truncate max-w-[70px] text-center shadow-xs">
                          {p.name.split(' ').pop()}
                        </div>
                        <div className="w-11 mt-0.5">
                          <FatigueGauge fatigue={dynamicFatigue} size="xs" showLabel={false} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: PITCH & SQUAD FATIGUE GAUGES (Requirements 6 & 7) */}
        {activeTab === 'pitch' && matchPhase !== 'pre' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">出場選手の疲労ゲージ＆コンディション一覧</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ※疲労が高まると後半の決定力・反応速度が低下し、負傷リスクが上昇します。
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">11 Players</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {userStarters.map(p => {
                // Dynamic in-match fatigue: increases as match minutes advance
                const dynamicFatigue = Math.min(100, Math.round(p.fatigue + (minute * 0.25)));

                return (
                  <div key={p.id} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">#{p.shirtNumber}</span>
                        <span className="text-xs font-bold text-blue-400 font-mono w-7">{p.position}</span>
                        <span className="text-xs font-bold text-white">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ConditionDot condition={p.condition} showLabel />
                        <span className="text-xs font-mono font-bold text-slate-300">OVR {p.ovr}</span>
                      </div>
                    </div>

                    {/* Fatigue Gauge Component */}
                    <FatigueGauge 
                      fatigue={dynamicFatigue}
                      size="sm"
                      showFraction
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED MATCH EVENT TIMELINE & LOGS (Requirements 4 & 5) */}
        {activeTab === 'events' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>⏱️ {t.liveTimeline}</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">{revealedEvents.length} Events</span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
              {revealedEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  キックオフ後に試合イベントが順次記録されます...
                </div>
              ) : (
                revealedEvents.map((e, idx) => {
                  const isHome = e.clubId === homeClub.id;
                  const club = isHome ? homeClub : awayClub;

                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all text-xs flex items-start gap-3 ${
                        e.type === 'goal'
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                          : e.type === 'red_card'
                          ? 'bg-red-950/40 border-red-500/60'
                          : e.type === 'yellow_card'
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      {/* Minute badge */}
                      <span className="font-mono font-extrabold text-xs text-emerald-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 shrink-0">
                        {e.minute}&apos;
                      </span>

                      {/* Event icon & description */}
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span className="text-sm">
                            {e.type === 'goal' ? '⚽ GOAL!' :
                             e.type === 'yellow_card' ? '🟨 YELLOW' :
                             e.type === 'red_card' ? '🟥 RED' :
                             e.type === 'injury' ? '🚑 INJURY' :
                             e.type === 'sub' ? '🔄 SUB' : '⚠️ CHANCE'}
                          </span>
                          <span>·</span>
                          <span className="text-slate-300">{club?.name}</span>
                        </div>

                        {/* Player & Scorer info */}
                        <div className="mt-1 font-semibold text-slate-200">
                          {e.type === 'goal' || e.type === 'penalty' ? (
                            <div className="space-y-1.5">
                              <div>
                                <span className="text-emerald-300 font-bold text-sm">{e.playerName}</span>
                                {e.assistPlayerName && (
                                  <span className="text-slate-400 text-[11px] ml-2 font-normal">
                                    ({t.assist}: {e.assistPlayerName})
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-emerald-900/40">
                                {e.description}
                              </p>
                            </div>
                          ) : (
                            <div>{e.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* TAB 3: LIVE MATCH STATS */}
        {activeTab === 'stats' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
              📊 試合統計 (Match Statistics)
            </h3>

            <div className="space-y-4 max-w-lg mx-auto py-2 text-xs">
              {/* Possession */}
              <div>
                <div className="flex justify-between font-mono font-bold mb-1">
                  <span>{homeClub?.shortName} 52%</span>
                  <span className="text-slate-400 font-sans">{t.possession}</span>
                  <span>48% {awayClub?.shortName}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '52%' }} />
                  <div className="h-full bg-red-500" style={{ width: '48%' }} />
                </div>
              </div>

              {/* Shots on Target */}
              <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                <span className="font-mono font-bold text-white text-sm">{currentScore[0] * 3 + 2}</span>
                <span className="text-slate-400">{t.shotsOnTarget}</span>
                <span className="font-mono font-bold text-white text-sm">{currentScore[1] * 3 + 1}</span>
              </div>

              {/* Total Shots */}
              <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                <span className="font-mono font-bold text-white text-sm">{currentScore[0] * 4 + 5}</span>
                <span className="text-slate-400">{t.shots}</span>
                <span className="font-mono font-bold text-white text-sm">{currentScore[1] * 4 + 4}</span>
              </div>

              {/* Expected Goals (xG) */}
              <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                <span className="font-mono font-bold text-emerald-400 text-sm">{(currentScore[0] * 0.65 + 0.4).toFixed(2)}</span>
                <span className="text-slate-400">{t.expectedGoals}</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{(currentScore[1] * 0.65 + 0.3).toFixed(2)}</span>
              </div>

              {/* Corners */}
              <div className="flex justify-between items-center py-2">
                <span className="font-mono font-bold text-white text-sm">5</span>
                <span className="text-slate-400">{t.corners}</span>
                <span className="font-mono font-bold text-white text-sm">4</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: IN-MATCH SUBSTITUTIONS */}
        {activeTab === 'subs' && matchPhase !== 'finished' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">戦術介入・選手交代 (Substitutions)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  交代枠: 残り {5 - subCount}名 / OUT選手とIN選手を選択して交代を実行します。
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400">{subCount} / 5 完了</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Player to Sub OFF (from Starters) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-red-400">OUT (ベンチへ下げる選手)</label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {userStarters.map(p => {
                    const isSelected = subPlayerOffId === p.id;
                    const dynamicFatigue = Math.min(100, Math.round(p.fatigue + (minute * 0.25)));

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSubPlayerOffId(p.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-950/60 border-red-500 ring-1 ring-red-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-400 font-mono w-7">{p.position}</span>
                            <span className="text-xs font-bold text-white">{p.name}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-300">OVR {p.ovr}</span>
                        </div>
                        <FatigueGauge fatigue={dynamicFatigue} size="xs" showFraction />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Player to Sub ON (from Bench) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-emerald-400">IN (ピッチへ投入する選手)</label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {userBench.map(p => {
                    const isSelected = subPlayerOnId === p.id;
                    const isInjured = p.injury?.isInjured || p.injuryStatus === 'INJURED' || (state.currentDate && p.injuryReturnDate && p.injuryReturnDate > state.currentDate);
                    const isSuspended = p.suspension?.isSuspended;
                    const isSubbedOff = subbedOutPlayerIds.includes(p.id);
                    const isUnavailable = isInjured || isSuspended || isSubbedOff;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => setSubPlayerOnId(p.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/40'
                            : isUnavailable
                            ? 'opacity-40 bg-slate-950 border-slate-900 cursor-not-allowed'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-400 font-mono w-7">{p.position}</span>
                            <span className="text-xs font-bold text-white">{p.name}</span>
                            {isInjured && (
                              <span className="px-1.5 py-0.2 rounded bg-red-900 text-red-200 text-[9px] font-bold">
                                【負傷】
                              </span>
                            )}
                            {isSuspended && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-900 text-amber-200 text-[9px] font-bold">
                                【停止】
                              </span>
                            )}
                            {isSubbedOff && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] font-bold">
                                【交代済】
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-300">OVR {p.ovr}</span>
                        </div>
                        <FatigueGauge fatigue={p.fatigue} size="xs" showFraction />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Execute Sub Button */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={handleExecuteSub}
                disabled={!subPlayerOffId || !subPlayerOnId || subCount >= 5}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                交代を実行する (Confirm Substitution)
              </button>
            </div>
          </div>
        )}

        {/* IN-MATCH TAB 5: REAL-TIME TACTICS & FORMATION ADJUSTMENT */}
        {activeTab === 'tactics' && matchPhase !== 'pre' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚙️ 試合中戦術・フォーメーション即時変更</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {minute}&apos; リアルタイム反映
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  スコアや相手の出方に合わせ、試合中にフォーメーションや戦術指示を即座に切り替えます。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('formation')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>🏟️ ピッチ配置を確認</span>
              </button>
            </div>

            {inMatchTacticsToast && (
              <div className="bg-emerald-950/90 border border-emerald-500/80 rounded-2xl p-3 text-emerald-200 text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{inMatchTacticsToast}</span>
              </div>
            )}

            {/* Formation Selector & Quick Presets */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">フォーメーション変更:</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    現在: {tactics.formation}
                  </span>
                </div>
                <select
                  value={tactics.formation}
                  onChange={e => {
                    const newForm = e.target.value as FormationName;
                    const updated = updateTacticsFormation(tactics, newForm);
                    setTactics(updated);
                    onUpdateTactics?.(updated);
                    setInMatchTacticsToast(`フォーメーションを ${newForm} に変更しました`);
                    setTimeout(() => setInMatchTacticsToast(null), 3000);
                  }}
                  className="bg-slate-800 border border-emerald-500/50 hover:border-emerald-400 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  <optgroup label="名将モデル・現代戦術系" className="bg-slate-900 text-slate-300 font-bold">
                    <option value="3-2-2-3 (WM・ボックスMF)">3-2-2-3 (WM・ボックスMF / シティ型)</option>
                    <option value="4-3-3 偽9番 (ゼロトップ)">4-3-3 偽9番 (ゼロトップ / スペイン流動型)</option>
                    <option value="4-2-4 電撃カウンター型">4-2-4 電撃カウンター型 (超攻撃2トップ)</option>
                    <option value="5-2-1-2 堅守速攻 (カテナチオ)">5-2-1-2 堅守速攻 (カテナチオ / 5バック堅守)</option>
                    <option value="3-3-3-1 全方位プレス (ビエルサ流)">3-3-3-1 全方位プレス (ビエルサ流マンマーク)</option>
                  </optgroup>
                  <optgroup label="4バック系（標準・バランス）" className="bg-slate-900 text-slate-300 font-bold">
                    <option value="4-3-3">4-3-3（標準・ウイング）</option>
                    <option value="4-3-3 Holding">4-3-3 Holding（ダブルボランチ）</option>
                    <option value="4-3-3 Attacking">4-3-3 Attacking（攻撃的インサイドハーフ）</option>
                    <option value="4-2-3-1">4-2-3-1（トップ下司令塔型）</option>
                    <option value="4-4-2">4-4-2（クラシック2トップ）</option>
                    <option value="4-1-2-3">4-1-2-3（アンカー＋2インサイド）</option>
                    <option value="4-5-1">4-5-1（中盤密集型）</option>
                    <option value="4-2-4">4-2-4（4トップ急襲型）</option>
                  </optgroup>
                  <optgroup label="3バック系（攻撃的・幅広展開）" className="bg-slate-900 text-slate-300 font-bold">
                    <option value="3-5-2">3-5-2（幅広ウイングバック＋2トップ）</option>
                    <option value="3-4-3">3-4-3（ダイナミック3トップ）</option>
                    <option value="3-4-2-1">3-4-2-1（シャドー2枚）</option>
                    <option value="3-2-4-1">3-2-4-1（中盤4枚支配型）</option>
                  </optgroup>
                  <optgroup label="5バック系（堅守速攻・逃げ切り）" className="bg-slate-900 text-slate-300 font-bold">
                    <option value="5-3-2">5-3-2（強固な中央封鎖）</option>
                    <option value="5-4-1">5-4-1（ペナルティエリア鉄壁ブロック）</option>
                    <option value="5-2-3">5-2-3（5バック＋3トップ速攻）</option>
                  </optgroup>
                  <optgroup label="変則戦術系" className="bg-slate-900 text-slate-300 font-bold">
                    <option value="非対称4-3-3">非対称4-3-3（片側偏重型）</option>
                    <option value="ダイヤモンド型4-4-2">ダイヤモンド型4-4-2（中盤中央支配）</option>
                  </optgroup>
                </select>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="text-[11px] text-slate-400 shrink-0 font-semibold mr-1">ワンタッチ切替:</span>
                {[
                  '4-3-3',
                  '3-2-2-3 (WM・ボックスMF)',
                  '4-2-3-1',
                  '4-4-2',
                  '4-3-3 偽9番 (ゼロトップ)',
                  '5-4-1',
                  '5-2-1-2 堅守速攻 (カテナチオ)',
                  '4-2-4 電撃カウンター型'
                ].map(preset => {
                  const isCurrent = tactics.formation === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const updated = updateTacticsFormation(tactics, preset as FormationName);
                        setTactics(updated);
                        onUpdateTactics?.(updated);
                        setInMatchTacticsToast(`フォーメーションを ${preset} に変更しました`);
                        setTimeout(() => setInMatchTacticsToast(null), 3000);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tactical Instructions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Attacking Style */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <label className="text-xs font-bold text-slate-300">攻撃スタイル (Build-up)</label>
                <select
                  value={tactics.instructions.attackingStyle}
                  onChange={e => {
                    const updated: TeamTactics = {
                      ...tactics,
                      instructions: { ...tactics.instructions, attackingStyle: e.target.value as any }
                    };
                    setTactics(updated);
                    onUpdateTactics?.(updated);
                    setInMatchTacticsToast(`攻撃スタイルを「${e.target.value}」に変更`);
                    setTimeout(() => setInMatchTacticsToast(null), 2500);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ポゼッション・パス">ポゼッション・パス（ショートパス主体）</option>
                  <option value="ダイレクト・カウンター">ダイレクト・カウンター（即座に縦へ）</option>
                  <option value="サイド攻撃・クロス">サイド攻撃・クロス（ウイングから放り込む）</option>
                  <option value="中央突破">中央突破（バイタルワンツー）</option>
                  <option value="偽9番・流動的ゼロトップ">偽9番・流動的ゼロトップ（CF引いて優位）</option>
                  <option value="ポジショナルプレー・ハーフスペース攻略">ポジショナルプレー・ハーフスペース攻略</option>
                  <option value="ティキタカ・超近距離パス回し">ティキタカ・超近距離パス回し</option>
                  <option value="ロングボール・ターゲットマン">ロングボール・ターゲットマン</option>
                </select>
              </div>

              {/* Defensive Style */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <label className="text-xs font-bold text-slate-300">守備スタイル (Defensive Approach)</label>
                <select
                  value={tactics.instructions.defensiveStyle}
                  onChange={e => {
                    const updated: TeamTactics = {
                      ...tactics,
                      instructions: { ...tactics.instructions, defensiveStyle: e.target.value as any }
                    };
                    setTactics(updated);
                    onUpdateTactics?.(updated);
                    setInMatchTacticsToast(`守備スタイルを「${e.target.value}」に変更`);
                    setTimeout(() => setInMatchTacticsToast(null), 2500);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ハイプレス">ハイプレス（敵陣深くからボール狩り）</option>
                  <option value="ミドルブロック">ミドルブロック（中盤で網を張り奪還）</option>
                  <option value="ローブロック・堅守">ローブロック・堅守（自陣PA前を固める）</option>
                  <option value="ゲーゲンプレス">ゲーゲンプレス（5秒以内全力即時奪還）</option>
                  <option value="オールコート・マンツーマン">オールコート・マンツーマン（密着マーク徹底）</option>
                  <option value="カテナチオ・中央完全封鎖">カテナチオ・中央完全封鎖（鉄壁ブロック）</option>
                  <option value="サイド誘導トラップ">サイド誘導トラップ（タッチライン際で刈り取る）</option>
                </select>
              </div>

              {/* Press Intensity */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <label className="text-xs font-bold text-slate-300">プレッシング強度 (Pressing Intensity)</label>
                <select
                  value={tactics.instructions.pressIntensity}
                  onChange={e => {
                    const updated: TeamTactics = {
                      ...tactics,
                      instructions: { ...tactics.instructions, pressIntensity: e.target.value as any }
                    };
                    setTactics(updated);
                    onUpdateTactics?.(updated);
                    setInMatchTacticsToast(`プレス強度を「${e.target.value}」に変更`);
                    setTimeout(() => setInMatchTacticsToast(null), 2500);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="非常に激しい">非常に激しい（スタミナ消費大・球際激突）</option>
                  <option value="標準的">標準的（バランスの取れたプレス管理）</option>
                  <option value="自陣引き気味">自陣引き気味（スタミナ温存・省エネ守備）</option>
                  <option value="相手CB・GK限定猛プレス">相手CB・GK限定猛プレス（出足を狙い撃ち）</option>
                  <option value="セカンドボール回収特化">セカンドボール回収特化（ルーズボール予測）</option>
                </select>
              </div>

              {/* Defensive Line */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <label className="text-xs font-bold text-slate-300">ディフェンスラインの高さ (Defensive Line)</label>
                <select
                  value={tactics.instructions.defensiveLine}
                  onChange={e => {
                    const updated: TeamTactics = {
                      ...tactics,
                      instructions: { ...tactics.instructions, defensiveLine: e.target.value as any }
                    };
                    setTactics(updated);
                    onUpdateTactics?.(updated);
                    setInMatchTacticsToast(`ライン高さを「${e.target.value}」に変更`);
                    setTimeout(() => setInMatchTacticsToast(null), 2500);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ハイライン">ハイライン（オフサイドトラップ）</option>
                  <option value="標準">標準（バランスの取れた位置取り）</option>
                  <option value="ディープライン">ディープライン（裏のスペース警戒）</option>
                  <option value="超ハイライン・オフサイドトラップ特化">超ハイライン・オフサイドトラップ特化</option>
                  <option value="可変ディフェンスライン">可変ディフェンスライン（ボール位置に応じ伸縮）</option>
                </select>
              </div>

              {/* Tempo */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <label className="text-xs font-bold text-slate-300">試合のテンポ (Tempo)</label>
                <select
                  value={tactics.instructions.tempo}
                  onChange={e => {
                    const updated: TeamTactics = {
                      ...tactics,
                      instructions: { ...tactics.instructions, tempo: e.target.value as any }
                    };
                    setTactics(updated);
                    onUpdateTactics?.(updated);
                    setInMatchTacticsToast(`テンポを「${e.target.value}」に変更`);
                    setTimeout(() => setInMatchTacticsToast(null), 2500);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="高速テンポ">高速テンポ（素早いパス・攻守切替最優先）</option>
                  <option value="標準">標準テンポ</option>
                  <option value="じっくりビルドアップ">じっくりビルドアップ（安全第一）</option>
                  <option value="電光石火・超ハイテンポ">電光石火・超ハイテンポ（超高速展開）</option>
                  <option value="緩急コントロール・ゲーム支配">緩急コントロール・ゲーム支配</option>
                </select>
              </div>

              {/* Counter Urgency */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <label className="text-xs font-bold text-slate-300">カウンター意識 (Counter Urgency)</label>
                <select
                  value={tactics.instructions.counterUrgency}
                  onChange={e => {
                    const updated: TeamTactics = {
                      ...tactics,
                      instructions: { ...tactics.instructions, counterUrgency: e.target.value as any }
                    };
                    setTactics(updated);
                    onUpdateTactics?.(updated);
                    setInMatchTacticsToast(`カウンター意識を「${e.target.value}」に変更`);
                    setTimeout(() => setInMatchTacticsToast(null), 2500);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ボール奪取時即カウンター">ボール奪取時即カウンター（前線へ矢の速攻）</option>
                  <option value="一度落ち着いて組み立て">一度落ち着いて組み立て（ボール保持・陣形整備）</option>
                  <option value="サイド高速展開カウンター">サイド高速展開カウンター（ウイング走力活用）</option>
                  <option value="ファウルストップ警戒・ボールキープ">ファウルストップ警戒・ボールキープ</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* FINISHED STATE OVERVIEW (Post-match summary, MOTM, Proceed to Press Conference) */}
        {matchPhase === 'finished' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
            <div className="text-center pb-4 border-b border-slate-800 space-y-2">
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                試合結果 (FULL TIME RESULT)
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
                {homeClub?.name} {currentScore[0]} - {currentScore[1]} {awayClub?.name}
              </h2>

              {/* Extra Time and Penalty Shootout Detailed Breakdown */}
              {(fixture.extraTimePlayed || minute > 90 || simulatedResult?.fixture?.extraTimePlayed) && (
                <div className="text-xs sm:text-sm font-semibold text-amber-300 font-mono">
                  延長戦：{currentScore[0]} - {currentScore[1]}
                </div>
              )}

              {simulatedResult?.fixture?.penaltyShootout && (
                <div className="mt-3 p-4 bg-slate-950 rounded-2xl border border-rose-500/40 text-center space-y-2">
                  <div className="text-lg sm:text-xl font-black text-rose-400 font-mono">
                    PK戦：{simulatedResult.fixture.penaltyShootout.homeScore} - {simulatedResult.fixture.penaltyShootout.awayScore}
                  </div>
                  <div className="text-sm font-extrabold text-emerald-400">
                    勝者：{
                      simulatedResult.fixture.penaltyShootout.winnerClubId === homeClub?.id 
                        ? `${homeClub?.name} (${homeClub?.shortName})`
                        : `${awayClub?.name} (${awayClub?.shortName})`
                    }
                  </div>

                  {/* Kicker by Kicker Results */}
                  {simulatedResult.fixture.penaltyShootout.kickers && simulatedResult.fixture.penaltyShootout.kickers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-left max-w-xl mx-auto">
                      <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                        <span>🎯 PK戦キッカー詳細</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {simulatedResult.fixture.penaltyShootout.homeScore} - {simulatedResult.fixture.penaltyShootout.awayScore}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Home Kickers */}
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                          <div className="font-bold text-slate-200 mb-1.5 flex items-center gap-1.5 border-b border-slate-800 pb-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: homeClub?.primaryColor }} />
                            <span>{homeClub?.shortName || homeClub?.name}</span>
                          </div>
                          <div className="space-y-1">
                            {simulatedResult.fixture.penaltyShootout.kickers
                              .filter((k: any) => k.clubId === homeClub?.id)
                              .map((k: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-[11px] font-mono py-0.5">
                                  <span className="truncate pr-1 text-slate-300">{i + 1}. {k.playerName}</span>
                                  <span className={k.scored ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                    {k.scored ? '⭕ 成功' : '❌ 失敗'}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Away Kickers */}
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                          <div className="font-bold text-slate-200 mb-1.5 flex items-center gap-1.5 border-b border-slate-800 pb-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: awayClub?.primaryColor }} />
                            <span>{awayClub?.shortName || awayClub?.name}</span>
                          </div>
                          <div className="space-y-1">
                            {simulatedResult.fixture.penaltyShootout.kickers
                              .filter((k: any) => k.clubId === awayClub?.id)
                              .map((k: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-[11px] font-mono py-0.5">
                                  <span className="truncate pr-1 text-slate-300">{i + 1}. {k.playerName}</span>
                                  <span className={k.scored ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                    {k.scored ? '⭕ 成功' : '❌ 失敗'}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scorer Summary (Requirement 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
              <div>
                <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <span>⚽ {homeClub?.name} 得点者</span>
                </div>
                {homeGoals.length === 0 ? (
                  <div className="text-slate-500">得点なし</div>
                ) : (
                  homeGoals.map((g, i) => (
                    <div key={i} className="text-slate-300 py-1 border-b border-slate-800/40 last:border-0">
                      <div className="flex items-center gap-1 font-mono">
                        <span className="font-bold text-emerald-400">{g.playerName}</span> ({g.minute}&apos;)
                        {g.assistPlayerName && <span className="text-slate-500 text-[11px] ml-1.5 font-sans">アシスト: {g.assistPlayerName}</span>}
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-snug">
                        {g.description}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div>
                <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <span>⚽ {awayClub?.name} 得点者</span>
                </div>
                {awayGoals.length === 0 ? (
                  <div className="text-slate-500">得点なし</div>
                ) : (
                  awayGoals.map((g, i) => (
                    <div key={i} className="text-slate-300 py-1 border-b border-slate-800/40 last:border-0">
                      <div className="flex items-center gap-1 font-mono">
                        <span className="font-bold text-emerald-400">{g.playerName}</span> ({g.minute}&apos;)
                        {g.assistPlayerName && <span className="text-slate-500 text-[11px] ml-1.5 font-sans">アシスト: {g.assistPlayerName}</span>}
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-snug">
                        {g.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Proceed Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  if (completedFinalFixtureRef.current) {
                    onFinishMatch(completedFinalFixtureRef.current, simulatedResult.updatedPlayers);
                  }
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                ホーム画面へ戻る
              </button>

              <button
                type="button"
                onClick={() => onOpenPressConference(completedFinalFixtureRef.current || fixture)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer"
              >
                <span>{t.proceedToPress}</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* UNIFIED IN-MATCH INCIDENT MODAL (Requirement 1: 負傷・レッドカード発生時の完全停止・手動再開モーダル) */}
        {activeIncidentNotice && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-red-500/80 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
              
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-red-500/30 pb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                  activeIncidentNotice.type === 'injury'
                    ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                    : 'bg-rose-600/30 border border-rose-500 text-rose-300'
                }`}>
                  {activeIncidentNotice.type === 'injury' ? '🚑' : '🟥'}
                </div>
                <div>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                    {activeIncidentNotice.type === 'injury' 
                      ? `負傷発生による試合一時停止 (${activeIncidentNotice.minute}分)`
                      : `退場処分による試合一時停止 (${activeIncidentNotice.minute}分)`}
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {activeIncidentNotice.player.name} 選手（{activeIncidentNotice.clubName}）
                  </h3>
                </div>
              </div>

              {/* Incident Details Card */}
              {activeIncidentNotice.type === 'injury' ? (
                <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 space-y-1.5">
                  <div className="text-sm font-bold text-red-300 flex items-center gap-2">
                    <span>❌</span>
                    <span>{activeIncidentNotice.player.name} 選手はプレー続行不可能です</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    初期診断：<strong className="text-white">{activeIncidentNotice.injuryDetails?.type}</strong>（全治約{activeIncidentNotice.injuryDetails?.recoveryDays}日・復帰予定日: {activeIncidentNotice.injuryDetails?.returnDate}）
                  </div>
                  <div className="text-[11px] text-slate-400">
                    所属: {activeIncidentNotice.clubName} {activeIncidentNotice.isUserClub ? '（自クラブ）' : '（対戦相手）'} · 次節以降の公式戦も欠場となります。
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 space-y-1.5">
                  <div className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <span>🟥</span>
                    <span>
                      {activeIncidentNotice.redCardDetails?.isSecondYellow ? 'イエローカード2枚目（警告退場処分）' : '一発レッドカード（即座退場処分）'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    退場理由：<strong className="text-white">{activeIncidentNotice.redCardDetails?.reason}</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {activeIncidentNotice.clubName}は残り時間を10名で戦うことになります。次節も出場停止処分となります。
                  </div>
                </div>
              )}

              {/* Substitution selection if user club injury */}
              {activeIncidentNotice.type === 'injury' && activeIncidentNotice.isUserClub && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">
                      交代選手を選択してください (ベンチメンバー / 残り交代枠: {5 - subCount})
                    </span>
                    <span className="text-slate-400 font-mono">
                      {userBench.length}名 待機中
                    </span>
                  </div>

                  {subCount < 5 && userBench.length > 0 ? (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {userBench.map(p => {
                        const isSelected = injurySubChoiceId === p.id;
                        const isInj = p.injury?.isInjured || p.injuryStatus === 'INJURED';
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={isInj}
                            onClick={() => setInjurySubChoiceId(p.id)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40'
                                : isInj
                                ? 'opacity-40 bg-slate-950 border-slate-900 cursor-not-allowed'
                                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 text-slate-500 font-mono text-[11px]">#{p.shirtNumber}</span>
                                <span className="w-8 font-bold text-blue-400 font-mono text-xs">{p.position}</span>
                                <div>
                                  <div className="text-xs font-bold text-white">{p.name}</div>
                                  <div className="text-[10px] text-slate-400">{p.age}歳 · {p.playstyle}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-emerald-400">OVR {p.ovr}</span>
                                <span className="text-[10px] text-slate-400">疲労 {p.fatigue}%</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300">
                      交代枠上限(5枠)に達しているかベンチが不在のため、残り時間を10名で戦います。
                    </div>
                  )}
                </div>
              )}

              {/* Opponent injury notice */}
              {activeIncidentNotice.type === 'injury' && !activeIncidentNotice.isUserClub && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  相手チームのメディカルスタッフがピッチへ入り、負傷選手を搬送しました。相手ベンチは交代カードを切って試合を再開します。
                </div>
              )}

              {/* Action button */}
              <div className="pt-2 flex justify-end">
                {activeIncidentNotice.type === 'injury' && activeIncidentNotice.isUserClub ? (
                  <button
                    type="button"
                    onClick={() => handleConfirmIncident(true)}
                    disabled={subCount < 5 && userBench.length > 0 && !injurySubChoiceId}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 active:scale-[0.98] text-white font-bold text-xs sm:text-sm cursor-pointer shadow-lg shadow-red-600/30 transition-all"
                  >
                    {subCount < 5 && userBench.length > 0
                      ? (injurySubChoiceId ? '交代を実行して試合再開' : '交代選手を選択してください')
                      : '10人で試合を再開する'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmIncident(true)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs sm:text-sm cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    内容を確認して試合を再開する (Resume Match)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PK SHOOTOUT ARENA (Requirement 1: 5 kicks + sudden death) */}
        {matchPhase === 'penalty_shootout' && (
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚽</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">PK戦 (PENALTY SHOOTOUT)</h3>
                  <p className="text-xs text-slate-400">延長戦終了時同点のためPK戦にて勝者を決定します (5本＋サドンデス)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {pkState.homeScore} - {pkState.awayScore}
                </span>
              </div>
            </div>

            {/* Scoreboard of kicks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Home Team Kicks */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{homeClub?.name}</span>
                  <span className="font-mono text-emerald-400">{pkState.homeScore} 成功</span>
                </div>
                <div className="flex items-center gap-2">
                  {pkState.homeKicks.map((res, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${
                        res === true
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : res === false
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {res === true ? '◯' : res === false ? '✕' : (i + 1)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Team Kicks */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{awayClub?.name}</span>
                  <span className="font-mono text-emerald-400">{pkState.awayScore} 成功</span>
                </div>
                <div className="flex items-center gap-2">
                  {pkState.awayKicks.map((res, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${
                        res === true
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : res === false
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {res === true ? '◯' : res === false ? '✕' : (i + 1)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shootout Control Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-mono">
                {pkState.homeKicks.length > 5 ? '【サドンデス方式】決着がつくまで1本ずつ進行中' : `第${Math.min(5, Math.floor(pkState.stepIndex / 2) + 1)}巡目`}
              </span>

              <button
                type="button"
                onClick={handleInstantPkShootout}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-transform active:scale-95"
              >
                <span>PK戦の勝敗を決着させる</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PAUSE POINT ①: 90 MIN FULLTIME MODAL (Requirement 2) */}
        {showFulltimeModal && matchPhase === 'fulltime_pause' && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg text-amber-400 shrink-0">
                  ⏱️
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    試合一時停止 (PAUSE POINT 1)
                  </span>
                  <h3 className="text-lg font-black text-white">
                    後半終了 (90分) - 延長戦突入
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
                <div className="text-xs text-slate-400">90分スコア</div>
                <div className="text-3xl font-black font-mono text-white">
                  {homeClub?.shortName} {currentScore[0]} - {currentScore[1]} {awayClub?.shortName}
                </div>
                <p className="text-xs text-amber-300">
                  ※本大会のレギュレーションにより、同点のため前後半各15分の延長戦を実施します。
                </p>
                <div className="text-[11px] text-slate-400">
                  交代枠残り: {5 - subCount}名 / 一時停止中に戦術変更や選手交代が可能です。
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFulltimeModal(false);
                    setActiveTab('subs');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  戦術・交代を確認する
                </button>
                <button
                  type="button"
                  onClick={handleStartExtraFirstHalf}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
                >
                  延長戦を開始する (延長前半へ)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAUSE POINT ②: 105 MIN EXTRA TIME HALFTIME MODAL (Requirement 2) */}
        {showEtHalftimeModal && matchPhase === 'et_halftime' && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg text-amber-400 shrink-0">
                  ⏱️
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    試合一時停止 (PAUSE POINT 2)
                  </span>
                  <h3 className="text-lg font-black text-white">
                    延長前半終了 (105分)
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
                <div className="text-xs text-slate-400">105分時点スコア</div>
                <div className="text-3xl font-black font-mono text-white">
                  {homeClub?.shortName} {currentScore[0]} - {currentScore[1]} {awayClub?.shortName}
                </div>
                <p className="text-xs text-slate-300">
                  選手の疲労蓄積が進んでいます。残り15分の延長後半に向けて指示を出してください。
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEtHalftimeModal(false);
                    setActiveTab('subs');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  交代・戦術を修正
                </button>
                <button
                  type="button"
                  onClick={handleStartExtraSecondHalf}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
                >
                  延長後半を開始する (106-120分)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAUSE POINT ③: 120 MIN PRE-PK CONFIRMATION MODAL (Requirement 1 & 2) */}
        {showEtFulltimeModal && matchPhase === 'et_fulltime' && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3 border-b border-rose-500/30 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-lg text-rose-400 shrink-0">
                  🎯
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                    試合一時停止 (PAUSE POINT 3)
                  </span>
                  <h3 className="text-lg font-black text-white">
                    延長後半終了 (120分) - PK戦突入確認
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
                <div className="text-xs text-slate-400">120分最終スコア</div>
                <div className="text-3xl font-black font-mono text-white">
                  {homeClub?.shortName} {currentScore[0]} - {currentScore[1]} {awayClub?.shortName}
                </div>
                <p className="text-xs text-rose-300 font-bold">
                  【PK戦突入】120分の激闘を終えて決着がつかず、勝敗はPK戦（ペナルティシュートアウト）に委ねられます。
                </p>
                <div className="text-[11px] text-slate-400">
                  ※PK戦の得点は通常試合スコアや個人得点、得失点差には加算されず、別枠で記録されます。
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartPenaltyShootout}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-black text-sm cursor-pointer shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>PK戦を開始する (Proceed to PK Shootout)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAMPIONSHIP VICTORY CELEBRATION MODAL (Requirement 8) */}
        {showChampionshipCelebration && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/30 border-2 border-amber-400 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-300 shadow-xl shadow-amber-500/30 animate-bounce">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  CHAMPIONS · 大会制覇
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
                  {state.userClubId ? state.clubs[state.userClubId]?.name : ''} 優勝決定！
                </h2>
                <div className="text-sm font-bold text-amber-400">
                  {fixture.competition} 制覇
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                <div className="text-xs text-slate-400">決勝戦結果</div>
                <div className="text-2xl font-black font-mono text-white">
                  {homeClub?.name} {currentScore[0]} - {currentScore[1]} {awayClub?.name}
                  {simulatedResult?.fixture?.penaltyShootout && (
                    <span className="text-amber-400 text-base ml-2">
                      (PK {simulatedResult.fixture.penaltyShootout.homeScore} - {simulatedResult.fixture.penaltyShootout.awayScore})
                    </span>
                  )}
                </div>

                {/* Season titles count */}
                <div className="pt-2 border-t border-slate-800 text-xs text-emerald-400 font-bold">
                  🏆 今シーズン獲得タイトル: {(state.userClubId && state.clubTitlesHistory?.[state.userClubId]?.length || 0) >= 3 ? '3冠（トレブル）の歴史的偉業達成！' : (state.userClubId && state.clubTitlesHistory?.[state.userClubId]?.length || 0) === 2 ? '今季2冠達成！' : '今季タイトル獲得！'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChampionshipCelebration(false);
                    onOpenPressConference(fixture);
                  }}
                  className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>優勝記者会見へ進む</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChampionshipCelebration(false);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  閉じる (ダッシュボードへ)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RUNNER-UP MODAL (Requirement 8) */}
        {showRunnerUpModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-lg w-full p-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center mx-auto text-slate-300">
                🥈
              </div>
              <h3 className="text-xl font-bold text-white">
                準優勝 (Runner-up)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                惜しくも決勝で敗れ、タイトル獲得には届きませんでしたが、大会準優勝という素晴らしい足跡を残しました。
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRunnerUpModal(false);
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MANUAL PRE-MATCH PLAYER REPLACEMENT MODAL (Requirement 1, 2, 3) */}
        {manualReplaceTarget && (
          <PlayerReplacementModal
            isOpen={true}
            oldPlayer={manualReplaceTarget}
            state={state}
            tactics={tactics}
            onCompleteReplacement={(newTactics, updatedPlayers, msg) => {
              setTactics(newTactics);
              if (onUpdateTactics) onUpdateTactics(newTactics);
              
              // Re-check eligibility
              const newCheck = finalMatchEligibilityCheck(
                newTactics.lineup.starters.map(s => s.playerId),
                newTactics.lineup.bench,
                state.userClubId || '',
                updatedPlayers,
                state.currentDate,
                fixture.competition
              );
              setEligibilityResult(newCheck.isEligible ? null : newCheck);
              setManualReplaceTarget(null);

              // Re-initialize simulatedResult with new valid lineup
              if (homeClub && awayClub) {
                const homeTac = isUserHome ? newTactics : getDefaultTacticsForClub(homeClub, updatedPlayers);
                const awayTac = !isUserHome ? newTactics : getDefaultTacticsForClub(awayClub, updatedPlayers);
                const newRes = simulateFullMatch(fixture, homeClub, awayClub, homeTac, awayTac, updatedPlayers);
                setSimulatedResult(newRes);
              }
            }}
            onClose={() => setManualReplaceTarget(null)}
          />
        )}

      </div>
    </div>
  );
};
