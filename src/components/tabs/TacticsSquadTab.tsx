import React, { useState, useMemo } from 'react';
import { GameWorldState, TeamTactics, FormationName, Player, Position, NewsItem } from '../../types/game';
import { Shield, Users, Activity, Shuffle, Sliders, AlertCircle, AlertTriangle, ArrowLeftRight, CheckCircle2, Move, ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';
import { PlayerReplacementModal } from '../PlayerReplacementModal';
import { executePlayerReplacement, updatePlayerShirtNumber } from '../../engine/dataValidator';
import { getPositionFitOvr, FORMATION_TEMPLATES, updateTacticsFormation } from '../../engine/tacticsEngine';

interface Props {
  state: GameWorldState;
  onUpdateTactics: (tactics: TeamTactics) => void;
  onSelectPlayer: (player: Player) => void;
  onUpdateState?: (newState: GameWorldState) => void;
}

const FORMATIONS: FormationName[] = [
  '4-3-3',
  '4-3-3 Holding',
  '4-3-3 Defensive',
  '4-3-3 Attacking',
  '4-2-3-1',
  '4-2-2-2',
  '4-4-2',
  '4-4-1-1',
  '4-1-4-1',
  '4-1-2-3',
  '4-1-3-2',
  '4-5-1',
  '4-3-1-2',
  '4-3-2-1',
  '4-2-4',
  '3-5-2',
  '3-4-3',
  '3-4-2-1',
  '3-4-1-2',
  '3-1-4-2',
  '3-2-4-1',
  '3-3-3-1',
  '5-3-2',
  '5-4-1',
  '5-2-3',
  '5-2-2-1',
  '5-3-1-1',
  // 変則フォーメーション (Requirement 10)
  '非対称4-3-3',
  '非対称4-2-3-1',
  'ダイヤモンド型4-4-2',
  'フラット型4-5-1',
  '2トップ＋トップ下型',
  '中央密集型',
  '両ウイング高位置型',
  '片側ウイング偏重型'
];

export const TacticsSquadTab: React.FC<Props> = ({ state, onUpdateTactics, onSelectPlayer, onUpdateState }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [pitchZoom, setPitchZoom] = useState<number>(100);
  const [replacingPlayer, setReplacingPlayer] = useState<Player | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'lineup' | 'instructions' | 'roles'>('lineup');
  const [benchLimitError, setBenchLimitError] = useState<string | null>(null);

  // Shirt number editing state
  const [editingShirtPlayer, setEditingShirtPlayer] = useState<Player | null>(null);
  const [shirtInputNumber, setShirtInputNumber] = useState<number>(1);
  const [shirtConflict, setShirtConflict] = useState<{
    targetPlayerId: string;
    conflictPlayer: Player;
    desiredNumber: number;
  } | null>(null);

  const handleShirtNumberChange = (playerId: string, newNumber: number, forceSwap: boolean = false) => {
    if (!state.userClubId) return;
    const res = updatePlayerShirtNumber(state.players, state.clubs, state.userClubId, playerId, newNumber, forceSwap);
    if (!res.success && res.conflictPlayer) {
      setShirtConflict({
        targetPlayerId: playerId,
        conflictPlayer: res.conflictPlayer,
        desiredNumber: newNumber
      });
      return;
    }
    if (res.success && onUpdateState) {
      onUpdateState({
        ...state,
        players: res.updatedPlayers
      });
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 4000);
      setEditingShirtPlayer(null);
      setShirtConflict(null);
    }
  };

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const tactics = state.tactics;

  const handleReplacementComplete = (newTactics: TeamTactics, updatedPlayers: Record<string, Player>, message: string) => {
    onUpdateTactics(newTactics);
    if (onUpdateState) {
      onUpdateState({
        ...state,
        tactics: newTactics,
        players: updatedPlayers
      });
    }
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4500);
    setSelectedPlayerId(null);
  };

  // Media reaction when a key/star player is unexpectedly excluded to OUT_OF_SQUAD (Requirement 10)
  const triggerStarPlayerBenchOutSpeculation = (p: Player) => {
    if (!p || p.ovr < 80 || p.injury?.isInjured || p.injuryStatus === 'INJURED' || p.suspension?.isSuspended) {
      return;
    }
    const headlines = [
      `【現地報道】${p.name}、まさかのベンチ外。移籍を希望しているのではないかとの憶測も`,
      `【戦術の波紋】主力${p.name}がメンバー外。監督との関係に注目集まる`
    ];
    const bodies = [
      `本日のチーム発表で主力選手である${p.name}がベンチ外となったことが判明。負傷や累積警告などの公式発表がない中でのメンバー外宣告に対し、現地メディアやファンコミュニティでは「今夏の移籍を希望しているのではないか」「監督との関係悪化の可能性も」など様々な憶測が飛び交っています。`,
      `看板選手の${p.name}が登録外に。現地記者は「首脳陣との戦術的対立や関係悪化によるものの可能性がある。今後の起用法次第では退団報道が過熱するだろう」と報じています。`
    ];
    const chosenIdx = Math.floor(Math.random() * headlines.length);
    const speculationNews: NewsItem = {
      id: `news_speculation_${Date.now()}_${p.id}`,
      date: state.currentDate,
      headline: headlines[chosenIdx],
      body: bodies[chosenIdx],
      category: 'press',
      relatedClubId: state.userClubId || undefined,
      relatedPlayerId: p.id,
      importance: 'high'
    };
    if (onUpdateState) {
      onUpdateState({
        ...state,
        news: [speculationNews, ...state.news]
      });
    }
  };

  // Swap between any two players (Requirement 1: スタメン同士・ベンチ・リザーブ間の確実な交換)
  const handleSwapBetween = (playerAId: string, playerBId: string) => {
    if (!playerAId || !playerBId) return;
    if (playerAId === playerBId) {
      setSelectedPlayerId(null);
      return;
    }
    setBenchLimitError(null);

    const pA = state.players[playerAId];
    const pB = state.players[playerBId];
    const starterA = tactics.lineup.starters.find(s => s.playerId === playerAId);
    const starterB = tactics.lineup.starters.find(s => s.playerId === playerBId);

    // CRITICAL REQUIREMENT: Prevent GK from being placed in an outfield starter slot (e.g. CB)
    if (starterA && starterB) {
      const isGkA = pA?.position === 'GK' || starterA.position === 'GK';
      const isGkB = pB?.position === 'GK' || starterB.position === 'GK';
      if (isGkA !== isGkB) {
        setBenchLimitError(`【GK配置制限】GKとフィールドプレイヤーのスタメン直接入れ替えはできません。正GKはゴールマウス枠専任です。`);
        setSelectedPlayerId(null);
        return;
      }
    }
    if (starterA && !starterB) {
      if (pB?.position === 'GK' && starterA.position !== 'GK') {
        setBenchLimitError(`【GK配置制限】${pB.name}選手はGKのため、フィールドプレイヤー枠（${starterA.position}等）には配置できません。正GK枠と交代してください。`);
        setSelectedPlayerId(null);
        return;
      }
      if (pB?.position !== 'GK' && (starterA.position === 'GK' || pA?.position === 'GK')) {
        setBenchLimitError(`【GK配置制限】${pB.name}選手はフィールドプレイヤーのため、GK枠には配置できません。控えGKを選択してください。`);
        setSelectedPlayerId(null);
        return;
      }
    }
    if (starterB && !starterA) {
      if (pA?.position === 'GK' && starterB.position !== 'GK') {
        setBenchLimitError(`【GK配置制限】${pA.name}選手はGKのため、フィールドプレイヤー枠（${starterB.position}等）には配置できません。正GK枠と交代してください。`);
        setSelectedPlayerId(null);
        return;
      }
      if (pA?.position !== 'GK' && (starterB.position === 'GK' || pB?.position === 'GK')) {
        setBenchLimitError(`【GK配置制限】${pA.name}選手はフィールドプレイヤーのため、GK枠には配置できません。控えGKを選択してください。`);
        setSelectedPlayerId(null);
        return;
      }
    }

    const result = executePlayerReplacement(
      tactics,
      state.players,
      state.userClubId || '',
      playerAId,
      playerBId
    );

    if (!result.success) {
      setBenchLimitError(result.message || '選手の入れ替えに失敗しました。');
      return;
    }

    onUpdateTactics(result.newTactics);
    if (onUpdateState) {
      onUpdateState({
        ...state,
        tactics: result.newTactics,
        players: result.updatedPlayers
      });
    }

    setToastMessage(`配置変更完了: ${pA?.name || '選手'} ⇄ ${pB?.name || '選手'}`);
    setTimeout(() => setToastMessage(null), 3500);
    setSelectedPlayerId(null);
  };

  // Legacy alias for handleSwap
  const handleSwap = (targetPlayerId: string) => {
    if (!selectedPlayerId) return;
    handleSwapBetween(selectedPlayerId, targetPlayerId);
  };

  // Move player from out-of-squad to bench (Strict 9-player maximum check: Requirement 11)
  const handlePromoteToBench = (playerId: string) => {
    const p = state.players[playerId];
    if (p?.injury?.isInjured || p?.injuryStatus === 'INJURED' || (state.currentDate && p?.injuryReturnDate && p.injuryReturnDate > state.currentDate)) {
      setBenchLimitError(`【負傷警告】${p?.name || 'この'}選手は負傷中のため、ベンチに登録できません。(復帰予定: ${p?.injuryReturnDate || '未定'})`);
      return;
    }

    let newBench = [...tactics.lineup.bench];
    if (newBench.length >= 9) {
      setBenchLimitError('ベンチには最大9人まで登録できます。');
      return;
    }
    setBenchLimitError(null);
    newBench.push(playerId);
    if (state.players[playerId]) {
      state.players[playerId].squadStatus = 'BENCH';
    }

    onUpdateTactics({
      ...tactics,
      lineup: {
        ...tactics.lineup,
        bench: newBench
      }
    });
  };

  // Demote player from bench to out-of-squad (Requirement 10 & 12)
  const handleDemoteToOutOfSquad = (playerId: string) => {
    setBenchLimitError(null);
    const newBench = tactics.lineup.bench.filter(id => id !== playerId);
    const demoted = state.players[playerId];
    if (demoted) {
      demoted.squadStatus = 'OUT_OF_SQUAD';
      triggerStarPlayerBenchOutSpeculation(demoted);
    }

    onUpdateTactics({
      ...tactics,
      lineup: {
        ...tactics.lineup,
        bench: newBench
      }
    });
  };

  const handleFormationChange = (formation: FormationName) => {
    const updated = updateTacticsFormation(tactics, formation, state.players);
    onUpdateTactics(updated);
    if (onUpdateState) {
      onUpdateState({
        ...state,
        tactics: updated,
        clubs: state.userClubId ? {
          ...state.clubs,
          [state.userClubId]: {
            ...state.clubs[state.userClubId],
            currentFormation: formation
          }
        } : state.clubs
      });
    }
    setToastMessage(`フォーメーションを【${formation}】に変更しました`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Free Drag Deformation (ピッチ上の任意位置への自由ドラッグ変形)
  const handleMovePlayerToPitchPosition = (playerId: string, pitchX: number, pitchY: number) => {
    const currentStarters = [...(tactics.lineup?.starters || [])];
    const starterIdx = currentStarters.findIndex(s => s.playerId === playerId);
    if (starterIdx !== -1) {
      const p = state.players[playerId];
      const isGk = p?.position === 'GK' || currentStarters[starterIdx].position === 'GK';

      let inferredPos: Position;
      let finalX = pitchX;
      let finalY = pitchY;

      if (isGk) {
        // CRITICAL BUG FIX: GKはゴールマウス領域に固定し、CB等フィールドへの誤変形を完全防止
        inferredPos = 'GK';
        finalX = Math.max(38, Math.min(62, pitchX));
        finalY = Math.max(86, Math.min(95, pitchY));
      } else {
        // フィールドプレイヤーはゴールマウスエリアに入らないよう制限
        finalY = Math.min(80, pitchY);
        if (finalY >= 65) {
          if (finalX <= 25) inferredPos = 'LB';
          else if (finalX >= 75) inferredPos = 'RB';
          else inferredPos = 'CB';
        } else if (finalY >= 48) {
          if (finalX <= 22) inferredPos = 'LWB';
          else if (finalX >= 78) inferredPos = 'RWB';
          else inferredPos = 'CDM';
        } else if (finalY >= 32) {
          if (finalX <= 24) inferredPos = 'LM';
          else if (finalX >= 76) inferredPos = 'RM';
          else if (finalY <= 40) inferredPos = 'CAM';
          else inferredPos = 'CM';
        } else {
          if (finalX <= 30) inferredPos = 'LW';
          else if (finalX >= 70) inferredPos = 'RW';
          else if (finalY <= 20) inferredPos = 'ST';
          else inferredPos = 'CF';
        }
      }

      currentStarters[starterIdx] = {
        ...currentStarters[starterIdx],
        pitchX: finalX,
        pitchY: finalY,
        position: inferredPos
      };

      onUpdateTactics({
        ...tactics,
        lineup: {
          ...tactics.lineup,
          starters: currentStarters
        }
      });
      setToastMessage(`選手の配置を更新しました (${inferredPos})`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Reset to default template coordinates
  const handleResetToTemplatePositions = () => {
    const template = FORMATION_TEMPLATES[tactics.formation];
    if (!template) return;
    const resetStarters = tactics.lineup.starters.map((s, idx) => ({
      ...s,
      pitchX: template[idx]?.pitchX ?? s.pitchX,
      pitchY: template[idx]?.pitchY ?? s.pitchY,
      position: template[idx]?.position ?? s.position
    }));
    onUpdateTactics({
      ...tactics,
      lineup: {
        ...tactics.lineup,
        starters: resetStarters
      }
    });
    setToastMessage(`フォーメーション【${tactics.formation}】の標準初期配置に復帰しました`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auto-fit squad members into starting XI with optimal positional suitability
  const handleAutoFitStartingXI = () => {
    if (!state.userClubId) return;
    const club = state.clubs[state.userClubId];
    if (!club) return;
    const allSquad = club.playerIds.map(id => state.players[id]).filter(Boolean);
    const template = FORMATION_TEMPLATES[tactics.formation];
    if (!template) return;

    // CRITICAL: Strict separation between GK and Outfield
    const gks = allSquad.filter(p => p.position === 'GK');
    const outfield = allSquad.filter(p => p.position !== 'GK');

    const assignedIds = new Set<string>();
    const newStarters = template.map(slot => {
      const isGkSlot = slot.position === 'GK';
      const pool = isGkSlot ? gks : outfield;

      let bestP: Player | null = null;
      let bestScore = -Infinity;

      pool.forEach(p => {
        if (assignedIds.has(p.id)) return;
        if (p.injury?.isInjured || p.suspension?.isSuspended) return;
        const fit = getPositionFitOvr(p, slot.position);
        const score = 100 - fit.penalty * 3 + p.ovr;
        if (score > bestScore) {
          bestScore = score;
          bestP = p;
        }
      });

      if (!bestP) {
        bestP = pool.find(p => !assignedIds.has(p.id)) || pool[0];
      }
      if (bestP) assignedIds.add(bestP.id);

      return {
        playerId: bestP?.id || '',
        position: slot.position,
        pitchX: slot.pitchX,
        pitchY: slot.pitchY
      };
    });

    // Bench: Guarantee 1 GK on bench, then up to 8 outfield players
    const benchGk = gks.find(p => !assignedIds.has(p.id));
    const remainingOutfield = outfield.filter(p => !assignedIds.has(p.id));
    const newBench: string[] = [];
    if (benchGk) {
      newBench.push(benchGk.id);
      assignedIds.add(benchGk.id);
    }
    for (const op of remainingOutfield) {
      if (newBench.length >= 9) break;
      newBench.push(op.id);
      assignedIds.add(op.id);
    }

    // Reserves: 3rd+ GK and remaining outfield
    const newReserves = allSquad.filter(p => !assignedIds.has(p.id)).map(p => p.id);

    const updatedTactics: TeamTactics = {
      ...tactics,
      lineup: {
        starters: newStarters,
        bench: newBench,
        reserves: newReserves
      }
    };

    onUpdateTactics(updatedTactics);
    setToastMessage('全所属選手からポジション適性・能力値最高のスタメンを自動最適編成しました！');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const starterCounts = useMemo(() => {
    let df = 0, mf = 0, fw = 0, gk = 0;
    (tactics.lineup?.starters || []).forEach(s => {
      if (s.position === 'GK') gk++;
      else if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(s.position)) df++;
      else if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(s.position)) mf++;
      else fw++;
    });
    return { gk, df, mf, fw };
  }, [tactics.lineup?.starters]);

  const POPULAR_PRESETS: FormationName[] = [
    '4-3-3',
    '4-2-3-1',
    '4-4-2',
    '3-5-2',
    '3-4-2-1',
    '5-3-2',
    '非対称4-3-3',
    '4-1-2-3'
  ];

  const FORMATION_GROUPS = [
    {
      group: '4バック系（標準・バランス）',
      items: [
        '4-3-3', '4-3-3 Holding', '4-3-3 Defensive', '4-3-3 Attacking',
        '4-2-3-1', '4-2-2-2', '4-4-2', '4-4-1-1', '4-1-4-1', '4-1-2-3',
        '4-1-3-2', '4-5-1', '4-3-1-2', '4-3-2-1', '4-2-4'
      ] as FormationName[]
    },
    {
      group: '3バック系（攻撃的・幅広展開）',
      items: [
        '3-5-2', '3-4-3', '3-4-2-1', '3-4-1-2', '3-1-4-2', '3-2-4-1', '3-3-3-1'
      ] as FormationName[]
    },
    {
      group: '5バック系（堅守速攻・低重心）',
      items: [
        '5-3-2', '5-4-1', '5-2-3', '5-2-2-1', '5-3-1-1'
      ] as FormationName[]
    },
    {
      group: 'バリエーション戦術系',
      items: [
        '非対称4-3-3', '非対称4-2-3-1', 'ダイヤモンド型4-4-2', 'フラット型4-5-1',
        '2トップ＋トップ下型', '中央密集型', '両ウイング高位置型', '片側ウイング偏重型'
      ] as FormationName[]
    }
  ];

  const renderConditionDot = (condition: Player['condition']) => {
    switch (condition) {
      case 'pink':
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50" title="絶好調 (+8%)" />;
      case 'red':
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" title="好調 (+4%)" />;
      case 'yellow':
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" title="普通 (0%)" />;
      case 'cyan':
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400" title="不調 (-4%)" />;
      case 'purple':
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500" title="絶不調 (-8%)" />;
      default:
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400" />;
    }
  };

  const starters = tactics.lineup.starters.map(s => {
    const player = state.players[s.playerId];
    return { ...s, player };
  });

  const benchPlayers = tactics.lineup.bench.map(id => state.players[id]).filter(Boolean);
  
  const starterIds = new Set(tactics.lineup.starters.map(s => s.playerId));
  const benchIds = new Set(tactics.lineup.bench);

  // Requirement 4: 正式な所属選手からスタメン・ベンチ以外を抽出 (他クラブ移籍・他クラブレンタル・重複排除)
  const reservePlayers = Object.values(state.players).filter(p => {
    if (p.clubId !== state.userClubId) return false;
    if (p.isLoaned && p.loanClubId && p.loanClubId !== state.userClubId) return false;
    if (starterIds.has(p.id) || benchIds.has(p.id)) return false;
    return true;
  });

  return (
    <div className="space-y-5 pb-20">
      
      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500/80 rounded-2xl p-3.5 flex items-center gap-2.5 text-emerald-200 text-xs sm:text-sm font-bold shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Sub-tabs & Formation Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-display">チーム編成・戦術司令塔</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                ピッチ配置連動・変形対応
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              所属選手: {userClub?.playerIds.length || 0}名 · 現在の配置: <span className="text-emerald-400 font-mono font-bold">{tactics.formation}</span>（GK: {starterCounts.gk} / DF: {starterCounts.df} / MF: {starterCounts.mf} / FW: {starterCounts.fw}）
            </div>
          </div>

          {/* Formation dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 shrink-0">フォーメーション:</span>
            <select
              value={tactics.formation}
              onChange={e => handleFormationChange(e.target.value as FormationName)}
              className="bg-slate-800 border border-emerald-500/50 hover:border-emerald-400 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer shadow-md"
            >
              {FORMATION_GROUPS.map(grp => (
                <optgroup key={grp.group} label={grp.group} className="bg-slate-900 text-slate-300 font-bold">
                  {grp.items.map(f => (
                    <option key={f} value={f} className="text-white bg-slate-800 py-1 font-sans">{f}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Preset Buttons */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] text-slate-400 shrink-0 font-semibold mr-1">クイック選択:</span>
          {POPULAR_PRESETS.map(preset => {
            const isCurrent = tactics.formation === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleFormationChange(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 hover:text-white'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('lineup')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'lineup'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          メンバー選定（スタメン・ベンチ）
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('instructions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'instructions'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          戦術指示（スタイル・プレス・ライン）
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'roles'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          役割・キッカー指定
        </button>
      </div>

      {/* TAB 1: LINEUP & TACTICAL BOARD */}
      {activeSubTab === 'lineup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Tactical Pitch Board (5 cols on lg) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                  TACTICAL BOARD ({tactics.formation})
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700">
                  DF:{starterCounts.df} · MF:{starterCounts.mf} · FW:{starterCounts.fw}
                </span>
                {selectedPlayerId && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 font-bold text-[10px] animate-pulse">
                    入替対象を選択中
                  </span>
                )}
              </div>

              {/* Pitch Zoom Controls (Requirement 5: 拡大・縮小操作) */}
              <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl px-2 py-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setPitchZoom(prev => Math.max(90, prev - 15))}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                  title="ピッチ縮小"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-300 min-w-[38px] text-center">
                  {pitchZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setPitchZoom(prev => Math.min(135, prev + 15))}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                  title="ピッチ拡大"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {pitchZoom !== 100 && (
                  <button
                    type="button"
                    onClick={() => setPitchZoom(100)}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 text-[10px] cursor-pointer"
                    title="100%にリセット"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Pitch Action Controls (適性自動最適化 & 整列リセット) */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 mb-3">
              <span className="text-xs text-slate-400 font-medium">スタメン編成・配置調整:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFitStartingXI}
                  className="px-3 py-1 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="全所属選手からポジション適性・総合値最高の11名を自動選出します"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>適性自動最適化</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToTemplatePositions}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="フォーメーション初期標準位置に整列リセット"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>整列リセット</span>
                </button>
              </div>
            </div>

            {/* Instruction tooltip */}
            <div className="mb-2 px-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                {selectedPlayerId 
                  ? '🔄 移動先のスタメンまたはベンチ選手をタップして配置入替してください' 
                  : '💡 選手をタップまたはドラッグして別の選手の位置へ移動させると配置入替・交代ができます'}
              </span>
              {selectedPlayerId && (
                <button
                  type="button"
                  onClick={() => setSelectedPlayerId(null)}
                  className="text-xs text-yellow-400 hover:underline font-bold"
                >
                  選択解除 ✕
                </button>
              )}
            </div>

            {/* Pitch Container with Grass Pattern (Scalable Zoom Wrapper & Drop Zone) */}
            <div className="relative w-full overflow-hidden rounded-2xl border-2 border-emerald-600/40 shadow-2xl bg-emerald-950/20">
              <div 
                className="relative w-full aspect-[3/4] pitch-pattern p-3 transition-transform duration-200 origin-top"
                style={{ transform: `scale(${pitchZoom / 100})` }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData('text/plain') || selectedPlayerId;
                  if (!draggedId) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const rawX = ((e.clientX - rect.left) / rect.width) * 100;
                  const rawY = ((e.clientY - rect.top) / rect.height) * 100;
                  const pitchX = Math.max(8, Math.min(92, Math.round(rawX)));
                  const pitchY = Math.max(10, Math.min(92, Math.round(rawY)));
                  handleMovePlayerToPitchPosition(draggedId, pitchX, pitchY);
                }}
              >
                {/* Pitch Markings SVG Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5%" y="4%" width="90%" height="92%" fill="none" stroke="#fff" strokeWidth="2" />
                    <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="#fff" strokeWidth="2" />
                    <circle cx="50%" cy="50%" r="14%" fill="none" stroke="#fff" strokeWidth="2" />
                    <circle cx="50%" cy="50%" r="1.5%" fill="#fff" />
                    <rect x="25%" y="4%" width="50%" height="16%" fill="none" stroke="#fff" strokeWidth="2" />
                    <rect x="37%" y="4%" width="26%" height="6%" fill="none" stroke="#fff" strokeWidth="2" />
                    <rect x="25%" y="80%" width="50%" height="16%" fill="none" stroke="#fff" strokeWidth="2" />
                    <rect x="37%" y="90%" width="26%" height="6%" fill="none" stroke="#fff" strokeWidth="2" />
                  </svg>
                </div>

                {/* Starter Player Pins (Enlarged & Re-evaluated: Requirement 1 & 5) */}
                {starters.map((item, idx) => {
                  const p = item.player;
                  if (!p) return null;
                  const isSelected = selectedPlayerId === p.id;
                  const isUnavailable = p.injury.isInjured || p.suspension.isSuspended;
                  const fit = getPositionFitOvr(p, item.position);

                  const initialOvr = p.initialOvr ?? p.ovr;
                  const exactOvr = p.exactOvr ?? p.ovr;
                  const growthDelta = Math.round((exactOvr - initialOvr) * 10) / 10;

                  return (
                    <div
                      key={p.id}
                      draggable={!isUnavailable}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', p.id);
                        setSelectedPlayerId(p.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const draggedId = e.dataTransfer.getData('text/plain') || selectedPlayerId;
                        if (draggedId && draggedId !== p.id) {
                          handleSwapBetween(draggedId, p.id);
                        }
                      }}
                      onClick={() => {
                        if (selectedPlayerId) {
                          if (selectedPlayerId === p.id) {
                            setSelectedPlayerId(null);
                          } else {
                            handleSwapBetween(selectedPlayerId, p.id);
                          }
                        } else {
                          setSelectedPlayerId(p.id);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        left: `${item.pitchX}%`,
                        top: `${item.pitchY}%`,
                        transform: 'translate(-50%, -50%)',
                        touchAction: 'manipulation',
                        transition: 'left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}
                      className={`group z-10 flex flex-col items-center cursor-pointer transition-all select-none ${
                        isSelected 
                          ? 'scale-115 z-30' 
                          : 'hover:scale-105 hover:z-20'
                      }`}
                    >
                      {/* Position Tag + Fit Grade Badge + Growth Indicator */}
                      <div className="flex items-center gap-0.5 mb-0.5 shadow-md">
                        <span className="px-1.5 py-0.2 rounded-l text-[10px] font-black uppercase bg-slate-950/95 text-emerald-400 border-l border-y border-slate-700">
                          {item.position}
                        </span>
                        <span 
                          className={`px-1 py-0.2 text-[9px] font-black border-y border-slate-700 ${
                            fit.fitGrade === 'S' ? 'bg-emerald-600 text-white' :
                            fit.fitGrade === 'A' ? 'bg-blue-600 text-white' :
                            fit.fitGrade === 'B' ? 'bg-amber-600 text-white' :
                            fit.fitGrade === 'C' ? 'bg-orange-600 text-white' : 'bg-red-700 text-white'
                          }`} 
                          title={`適性: ${fit.fitGrade} (実効OVR: ${fit.effectiveOvr})`}
                        >
                          {fit.fitGrade}
                        </span>
                        {growthDelta !== 0 && (
                          <span 
                            className={`px-1 py-0.2 rounded-r text-[9px] font-mono font-black border-r border-y border-slate-700 ${
                              growthDelta > 0 ? 'bg-emerald-800 text-emerald-200' : 'bg-rose-800 text-rose-200'
                            }`}
                            title={`能力変動: ${growthDelta > 0 ? `+${growthDelta}` : growthDelta}`}
                          >
                            {growthDelta > 0 ? `+${growthDelta}` : growthDelta}
                          </span>
                        )}
                      </div>

                      {/* Circle Avatar / Number (Enlarged size: w-12 h-12 sm:w-14 sm:h-14) */}
                      <div 
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center font-black text-sm sm:text-base shadow-2xl border-2 transition-all ${
                          isSelected 
                            ? 'border-yellow-400 bg-yellow-400 text-slate-950 ring-4 ring-yellow-400/50 shadow-yellow-400/40' 
                            : isUnavailable 
                              ? 'border-red-500 bg-red-950/90 text-red-200' 
                              : 'border-white bg-slate-950 text-white group-hover:border-emerald-400'
                        }`}
                      >
                        <span className="leading-none">#{p.shirtNumber}</span>
                      </div>

                      {/* Name Badge with Condition & Effective OVR */}
                      <div className="bg-slate-950/95 border border-slate-700/90 px-2 py-0.5 rounded-lg mt-1 text-[11px] sm:text-xs text-white flex items-center gap-1.5 shadow-xl whitespace-nowrap">
                        {renderConditionDot(p.condition)}
                        <span className="font-bold truncate max-w-[85px] sm:max-w-[110px]">{p.name.split(' ')[0]}</span>
                        <span className="text-emerald-400 font-mono font-black">{fit.effectiveOvr}</span>
                      </div>

                      {isUnavailable && (
                        <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded mt-0.5 shadow">
                          出場不可
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Bar for selected starter or bench player */}
            {selectedPlayerId && state.players[selectedPlayerId] && (
              <div className="mt-3 p-3 bg-slate-950 border border-yellow-500/60 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xl animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-yellow-400/20 text-yellow-300 font-mono font-bold text-xs">
                    {state.players[selectedPlayerId].position}
                  </span>
                  <span className="font-mono text-slate-400 text-xs">
                    #{state.players[selectedPlayerId].shirtNumber}
                  </span>
                  <span className="font-bold text-white text-xs">
                    {state.players[selectedPlayerId].name}
                  </span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    OVR {state.players[selectedPlayerId].ovr}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReplacingPlayer(state.players[selectedPlayerId])}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>一覧から変更</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const p = state.players[selectedPlayerId];
                      if (p) {
                        setEditingShirtPlayer(p);
                        setShirtInputNumber(p.shirtNumber);
                        setShirtConflict(null);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 text-xs font-bold cursor-pointer border border-yellow-500/40"
                    title="背番号を変更する"
                  >
                    #{state.players[selectedPlayerId].shirtNumber} 番号変更
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPlayer(state.players[selectedPlayerId])}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700"
                  >
                    詳細
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlayerId(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lineup Tables (7 cols on lg) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Starters Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  先発メンバー (Starting XI)
                </span>
                <span className="text-xs text-slate-400 font-mono">11名</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800 pb-1">
                      <th className="py-1.5 px-2">背番号</th>
                      <th className="py-1.5 px-2">位置</th>
                      <th className="py-1.5 px-2">選手名</th>
                      <th className="py-1.5 px-1 text-center">調子</th>
                      <th className="py-1.5 px-2 text-right">OVR</th>
                      <th className="py-1.5 px-2 text-center">成長</th>
                      <th className="py-1.5 px-2 text-right">疲労</th>
                      <th className="py-1.5 px-2 text-center">状態</th>
                      <th className="py-1.5 px-2 text-center">変更</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {starters.map(({ player: p }) => {
                      if (!p) return null;
                      const isSelected = selectedPlayerId === p.id;
                      const isInjured = p.injury.isInjured;
                      const isSuspended = p.suspension.isSuspended;

                      const initialOvr = p.initialOvr ?? p.ovr;
                      const exactOvr = p.exactOvr ?? p.ovr;
                      const growthDelta = Math.round((exactOvr - initialOvr) * 10) / 10;

                      return (
                        <tr 
                          key={p.id}
                          draggable={!isInjured && !isSuspended}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', p.id);
                            setSelectedPlayerId(p.id);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const draggedId = e.dataTransfer.getData('text/plain') || selectedPlayerId;
                            if (draggedId && draggedId !== p.id) {
                              handleSwapBetween(draggedId, p.id);
                            }
                          }}
                          onClick={() => {
                            if (selectedPlayerId) {
                              if (selectedPlayerId === p.id) {
                                setSelectedPlayerId(null);
                              } else {
                                handleSwapBetween(selectedPlayerId, p.id);
                              }
                            } else {
                              setSelectedPlayerId(p.id);
                            }
                          }}
                          className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                            isSelected ? 'bg-yellow-950/40 text-yellow-200 border-l-4 border-yellow-400' : 'text-slate-200'
                          }`}
                        >
                          <td 
                            className="py-2.5 px-2 font-mono text-slate-400 hover:text-yellow-300 font-bold transition-colors cursor-pointer"
                            title="クリックして背番号を変更"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingShirtPlayer(p);
                              setShirtInputNumber(p.shirtNumber);
                              setShirtConflict(null);
                            }}
                          >
                            #{p.shirtNumber}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="font-bold text-emerald-400 font-mono">{p.position}</span>
                          </td>
                          <td className="py-2.5 px-2">
                            <div 
                              onClick={(e) => { e.stopPropagation(); onSelectPlayer(p); }}
                              className="font-bold hover:underline text-xs sm:text-sm"
                            >
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-500">{p.age}歳 · {p.playstyle}</div>
                          </td>
                          <td className="py-2.5 px-1 text-center">
                            {renderConditionDot(p.condition)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-white text-xs sm:text-sm">
                            {p.ovr}
                          </td>
                          <td className="py-2.5 px-2 text-center" onClick={(e) => { e.stopPropagation(); onSelectPlayer(p); }}>
                            {growthDelta !== 0 ? (
                              <span 
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer hover:opacity-80 transition-opacity ${
                                  growthDelta > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}
                                title="クリックして選手成長レポートを開く"
                              >
                                {growthDelta > 0 ? `+${growthDelta}` : growthDelta}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            <span className={p.fatigue > 40 ? 'text-red-400' : 'text-slate-400'}>
                              {p.fatigue}%
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {isInjured ? (
                              <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-bold border border-red-800">
                                負傷
                              </span>
                            ) : isSuspended ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800">
                                停止
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-semibold">良好</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setReplacingPlayer(p)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 cursor-pointer transition-colors flex items-center gap-1 mx-auto"
                            >
                              <ArrowLeftRight className="w-2.5 h-2.5" />
                              <span>変更</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bench Table (Strict 9-player maximum: Requirement 11) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
              {benchLimitError && (
                <div className="mb-3 p-3 bg-red-950/80 border border-red-500 rounded-2xl flex items-center justify-between text-xs text-red-200 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-bold">{benchLimitError}</span>
                  </div>
                  <button type="button" onClick={() => setBenchLimitError(null)} className="text-red-400 hover:text-white text-xs font-bold cursor-pointer">
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    ベンチメンバー (最大9人 / 現在 {benchPlayers.length}名)
                  </span>
                  {selectedPlayerId && (
                    <span className="ml-2 text-[11px] text-yellow-400 font-semibold">
                      ← 交代させたいベンチ選手をタップしてください
                    </span>
                  )}
                </div>
                <span className={`text-xs font-mono font-bold ${benchPlayers.length >= 9 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {benchPlayers.length}/9名
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {benchPlayers.map(p => {
                  const isSelected = selectedPlayerId === p.id;
                  const isInjured = p.injury?.isInjured || p.injuryStatus === 'INJURED';
                  const isSuspended = p.suspension?.isSuspended;

                  return (
                    <div
                      key={p.id}
                      draggable={!isInjured && !isSuspended}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', p.id);
                        setSelectedPlayerId(p.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = e.dataTransfer.getData('text/plain') || selectedPlayerId;
                        if (draggedId && draggedId !== p.id) {
                          handleSwapBetween(draggedId, p.id);
                        }
                      }}
                      onClick={() => {
                        if (selectedPlayerId) {
                          if (selectedPlayerId === p.id) {
                            setSelectedPlayerId(null);
                          } else {
                            handleSwapBetween(selectedPlayerId, p.id);
                          }
                        } else {
                          setSelectedPlayerId(p.id);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-yellow-400 bg-yellow-950/30' 
                          : selectedPlayerId
                            ? 'border-emerald-500/60 hover:bg-emerald-950/30'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-5 text-slate-500 hover:text-yellow-300 font-mono text-[11px] font-bold cursor-pointer transition-colors"
                          title="クリックして背番号を変更"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingShirtPlayer(p);
                            setShirtInputNumber(p.shirtNumber);
                            setShirtConflict(null);
                          }}
                        >
                          #{p.shirtNumber}
                        </span>
                        <span className="w-8 font-bold text-blue-400 font-mono text-xs">{p.position}</span>
                        <div>
                          <div className="text-xs font-bold text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-500">{p.age}歳 · {p.playstyle}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderConditionDot(p.condition)}
                        <span className="text-xs font-mono font-bold text-white">{p.ovr}</span>
                        {(() => {
                          const bInit = p.initialOvr ?? p.ovr;
                          const bExact = p.exactOvr ?? p.ovr;
                          const bDelta = Math.round((bExact - bInit) * 10) / 10;
                          if (bDelta === 0) return null;
                          return (
                            <span 
                              className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold ${
                                bDelta > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                              title={`成長差分: ${bDelta > 0 ? `+${bDelta}` : bDelta}`}
                            >
                              {bDelta > 0 ? `+${bDelta}` : bDelta}
                            </span>
                          );
                        })()}
                        {selectedPlayerId && selectedPlayerId !== p.id ? (
                          <button
                            type="button"
                            className="px-2 py-1 rounded bg-emerald-500 text-slate-950 text-[10px] font-bold"
                          >
                            入替
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onSelectPlayer(p); }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 cursor-pointer"
                            >
                              詳細
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setReplacingPlayer(p); }}
                              className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 cursor-pointer flex items-center gap-1"
                              title="別の選手と入れ替える"
                            >
                              <ArrowLeftRight className="w-2.5 h-2.5" />
                              <span>変更</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDemoteToOutOfSquad(p.id); }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-300 text-[10px] border border-slate-700"
                              title="ベンチ外へ移動"
                            >
                              外す
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bench-Out (OUT_OF_SQUAD / 登録外・リザーブ) (Requirements 4, 5: 拡大・詳細情報表示) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    ベンチ外メンバー (Out of Squad / Reserves)
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    ※正式所属選手（他クラブ移籍・他クラブレンタル・重複データ排除済み）。
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">{reservePlayers.length}名</span>
              </div>

              {reservePlayers.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  現在ベンチ外の選手はいません。全選手がスタメンまたはベンチに登録されています。
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {reservePlayers.map(p => {
                    const isInjured = p.injury?.isInjured || p.injuryStatus === 'INJURED';
                    const isFatigued = p.fatigue > 45;
                    const isSuspended = p.suspension?.isSuspended;
                    const isSelected = selectedPlayerId === p.id;

                    return (
                      <div
                        key={p.id}
                        draggable={!isInjured && !isSuspended}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', p.id);
                          setSelectedPlayerId(p.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedId = e.dataTransfer.getData('text/plain') || selectedPlayerId;
                          if (draggedId && draggedId !== p.id) {
                            handleSwapBetween(draggedId, p.id);
                          }
                        }}
                        onClick={() => {
                          if (selectedPlayerId) {
                            if (selectedPlayerId === p.id) {
                              setSelectedPlayerId(null);
                            } else {
                              handleSwapBetween(selectedPlayerId, p.id);
                            }
                          } else {
                            setSelectedPlayerId(p.id);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-yellow-400 bg-yellow-950/30'
                            : selectedPlayerId && !isInjured && !isSuspended
                              ? 'border-yellow-500/50 hover:bg-yellow-950/20'
                              : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700'
                        }`}
                      >
                        {/* Requirement 4: 選手名、ポジション、OVR、年齢、コンディション、出場可否 */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span 
                            className="w-5 text-slate-600 hover:text-yellow-300 font-mono text-[11px] font-bold cursor-pointer transition-colors"
                            title="クリックして背番号を変更"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingShirtPlayer(p);
                              setShirtInputNumber(p.shirtNumber);
                              setShirtConflict(null);
                            }}
                          >
                            #{p.shirtNumber}
                          </span>
                          <span className="w-8 font-semibold text-slate-400 font-mono text-xs">{p.position}</span>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-200 truncate flex items-center gap-2">
                              <span>{p.name}</span>
                              <span className="text-[11px] font-mono text-slate-400 font-normal">({p.age}歳)</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isInjured && (
                                <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 text-[9px] font-bold border border-red-800">
                                  負傷 (全治{p.injury?.recoveryDays || p.injuryDaysRemaining || 7}日)
                                </span>
                              )}
                              {isFatigued && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 text-[9px] font-bold border border-amber-800">
                                  疲労高 ({p.fatigue}%)
                                </span>
                              )}
                              {isSuspended && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 text-[9px] font-bold border border-purple-800">
                                  出場停止
                                </span>
                              )}
                              {!isInjured && !isSuspended && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[9px] font-semibold border border-emerald-800/60">
                                  出場可
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500">
                                {p.playstyle}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {renderConditionDot(p.condition)}
                          <span className="text-xs font-mono font-bold text-slate-300">{p.ovr}</span>
                          
                          {selectedPlayerId && selectedPlayerId !== p.id ? (
                            <button
                              type="button"
                              disabled={isInjured || isSuspended}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                isInjured || isSuspended 
                                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                                  : 'bg-emerald-500 text-slate-950'
                              }`}
                            >
                              入替
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onSelectPlayer(p); }}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 cursor-pointer"
                              >
                                詳細
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setReplacingPlayer(p); }}
                                className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 cursor-pointer flex items-center gap-1"
                                title="別の選手と入れ替える"
                              >
                                <ArrowLeftRight className="w-2.5 h-2.5" />
                                <span>変更</span>
                              </button>
                              <button
                                type="button"
                                disabled={isInjured || isSuspended}
                                onClick={(e) => { e.stopPropagation(); handlePromoteToBench(p.id); }}
                                className={`px-2 py-1 rounded text-[10px] border font-semibold ${
                                  isInjured || isSuspended
                                    ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border-slate-700'
                                }`}
                              >
                                {isInjured ? '負傷中' : isSuspended ? '出場停止' : 'ベンチへ'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: TACTICAL INSTRUCTIONS */}
      {activeSubTab === 'instructions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">詳細戦術パラメータ設定</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              プレースタイルや相手クラブの相性に合わせて、攻撃・守備の原則を設定します。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Attacking Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">攻撃スタイル (Build-up)</label>
              <select
                value={tactics.instructions.attackingStyle}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  instructions: { ...tactics.instructions, attackingStyle: e.target.value as any }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ポゼッション・パス">ポゼッション・パス（ショートパスでじっくり崩す）</option>
                <option value="ダイレクト・カウンター">ダイレクト・カウンター（ボール奪取時即座に縦へ）</option>
                <option value="サイド攻撃・クロス">サイド攻撃・クロス（ウイング突破から中央へ放り込む）</option>
                <option value="中央突破">中央突破（バイタルエリアでワンツー連携）</option>
              </select>
            </div>

            {/* Defensive Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">守備スタイル (Pressing)</label>
              <select
                value={tactics.instructions.defensiveStyle}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  instructions: { ...tactics.instructions, defensiveStyle: e.target.value as any }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ハイプレス">ハイプレス（敵陣深くからボール狩り）</option>
                <option value="ミドルブロック">ミドルブロック（中盤で網を張りパスカット）</option>
                <option value="ローブロック・堅守">ローブロック・堅守（自陣ペナルティエリア前を固める）</option>
                <option value="ゲーゲンプレス">ゲーゲンプレス（奪われた瞬間5秒以内の全力即時奪還）</option>
              </select>
            </div>

            {/* Defensive Line */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">ディフェンスラインの高さ</label>
              <select
                value={tactics.instructions.defensiveLine}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  instructions: { ...tactics.instructions, defensiveLine: e.target.value as any }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ハイライン">ハイライン（オフサイドトラップ、コンパクト陣形）</option>
                <option value="標準">標準（バランスの取れた位置取り）</option>
                <option value="ディープライン">ディープライン（裏のスペースを警戒し深めに配置）</option>
              </select>
            </div>

            {/* Tempo */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">試合のテンポ・ペース配分</label>
              <select
                value={tactics.instructions.tempo}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  instructions: { ...tactics.instructions, tempo: e.target.value as any }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="高速テンポ">高速テンポ（素早いパス回し、攻守の切り替え最優先）</option>
                <option value="標準">標準テンポ</option>
                <option value="じっくりビルドアップ">じっくりビルドアップ（安全第一、無理な勝負は避ける）</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROLES & SET PIECES */}
      {activeSubTab === 'roles' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">キャプテン & セットプレーキッカー指名</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              リーダーシップやキック精度に応じた役割分担を決定します。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">キャプテン (主将)</label>
              <select
                value={tactics.roles.captainId || ''}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  roles: { ...tactics.roles, captainId: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                {starters.map(({ player: p }) => p && (
                  <option key={p.id} value={p.id}>{p.name} ({p.position}, OVR {p.ovr})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">PKキッカー</label>
              <select
                value={tactics.roles.penaltyTakerId || ''}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  roles: { ...tactics.roles, penaltyTakerId: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                {starters.map(({ player: p }) => p && (
                  <option key={p.id} value={p.id}>{p.name} (決定力 {p.shooting})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">FKキッカー (直接・間接)</label>
              <select
                value={tactics.roles.freeKickTakerId || ''}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  roles: { ...tactics.roles, freeKickTakerId: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                {starters.map(({ player: p }) => p && (
                  <option key={p.id} value={p.id}>{p.name} (パス {p.passing})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">CKキッカー (コーナーキック)</label>
              <select
                value={tactics.roles.cornerTakerId || ''}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  roles: { ...tactics.roles, cornerTakerId: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                {starters.map(({ player: p }) => p && (
                  <option key={p.id} value={p.id}>{p.name} (パス {p.passing})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER REPLACEMENT MODAL (Requirement 1, 2, 3) */}
      {replacingPlayer && (
        <PlayerReplacementModal
          isOpen={true}
          oldPlayer={replacingPlayer}
          state={state}
          tactics={tactics}
          onCompleteReplacement={handleReplacementComplete}
          onClose={() => setReplacingPlayer(null)}
        />
      )}

      {/* SHIRT NUMBER EDIT MODAL */}
      {editingShirtPlayer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>背番号編集</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">1〜99</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  <strong className="text-white">{editingShirtPlayer.name}</strong>（現在 #{editingShirtPlayer.shirtNumber}）
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setEditingShirtPlayer(null); setShirtConflict(null); }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {shirtConflict ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200 leading-relaxed">
                    <strong>背番号 #{shirtConflict.desiredNumber}</strong> は既に <strong className="text-white">{shirtConflict.conflictPlayer.name}</strong> が着用しています。
                    <div className="mt-1 text-slate-300">
                      背番号をスワップ（交換）して、{shirtConflict.conflictPlayer.name} には以前の背番号 #{editingShirtPlayer.shirtNumber} を割り当てますか？
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleShirtNumberChange(shirtConflict.targetPlayerId, shirtConflict.desiredNumber, true)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    スワップして変更
                  </button>
                  <button
                    type="button"
                    onClick={() => setShirtConflict(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    別の番号を選ぶ
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">新しい背番号 (1〜99)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={shirtInputNumber}
                      onChange={e => setShirtInputNumber(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                      className="w-24 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center text-xl font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs text-slate-400">番</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleShirtNumberChange(editingShirtPlayer.id, shirtInputNumber, false)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    決定して保存
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingShirtPlayer(null); setShirtConflict(null); }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
