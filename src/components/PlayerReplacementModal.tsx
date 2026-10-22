import React, { useState, useMemo, useEffect } from 'react';
import { GameWorldState, Player, TeamTactics, Position } from '../types/game';
import { executePlayerReplacement } from '../engine/dataValidator';
import { ConditionDot } from './common/FatigueGauge';
import { 
  Users, 
  ArrowLeftRight, 
  Search, 
  AlertCircle, 
  AlertTriangle, 
  Check, 
  X, 
  Shield 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  oldPlayer: Player | null;
  state: GameWorldState;
  tactics: TeamTactics;
  onCompleteReplacement: (newTactics: TeamTactics, updatedPlayers: Record<string, Player>, message: string) => void;
  onClose: () => void;
}

export const PlayerReplacementModal: React.FC<Props> = ({
  isOpen,
  oldPlayer,
  state,
  tactics,
  onCompleteReplacement,
  onClose
}) => {
  const isOldGk = oldPlayer?.position === 'GK';
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'GK' | 'DF' | 'MF' | 'FW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFilter(oldPlayer?.position === 'GK' ? 'GK' : 'ALL');
      setSearchQuery('');
      setErrorMessage(null);
    }
  }, [isOpen, oldPlayer]);

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;

  const candidatePlayers = useMemo(() => {
    if (!userClub || !oldPlayer) return [];
    
    return Object.values(state.players)
      .filter((p): p is Player => {
        if (!p || p.id === oldPlayer.id) return false;
        if (p.clubId !== state.userClubId) return false;
        if (p.isLoaned && p.loanClubId && p.loanClubId !== state.userClubId) return false;
        // CRITICAL REQUIREMENT: Strict separation between GK and Outfield
        if (isOldGk && p.position !== 'GK') return false;
        if (!isOldGk && p.position === 'GK') return false;
        return true;
      })
      .sort((a, b) => {
        // Priority 1: Same position as oldPlayer
        const aSamePos = a.position === oldPlayer.position;
        const bSamePos = b.position === oldPlayer.position;
        if (aSamePos && !bSamePos) return -1;
        if (!aSamePos && bSamePos) return 1;

        // Priority 2: Alternative position matches
        const aAltMatches = a.altPositions?.includes(oldPlayer.position);
        const bAltMatches = b.altPositions?.includes(oldPlayer.position);
        if (aAltMatches && !bAltMatches) return -1;
        if (!aAltMatches && bAltMatches) return 1;

        // Priority 3: OVR descending
        return b.ovr - a.ovr;
      });
  }, [userClub, oldPlayer, state.players, state.userClubId, isOldGk]);

  if (!isOpen || !oldPlayer || !userClub) return null;

  // Starter / Bench status check for candidate
  const isStarter = (pId: string) => tactics.lineup.starters.some(s => s.playerId === pId);
  const isBench = (pId: string) => tactics.lineup.bench.includes(pId);

  // Position category filter
  const matchesCategory = (pos: Position) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'GK') return pos === 'GK';
    if (selectedFilter === 'DF') return ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);
    if (selectedFilter === 'MF') return ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos);
    if (selectedFilter === 'FW') return ['ST', 'CF', 'LW', 'RW'].includes(pos);
    return true;
  };

  const filteredCandidates = candidatePlayers.filter(p => {
    if (!matchesCategory(p.position)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.position.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSelectCandidate = (candidate: Player) => {
    setErrorMessage(null);

    // Strict validation
    if (candidate.injury?.isInjured || candidate.injuryStatus === 'INJURED') {
      setErrorMessage(`【選択不可】${candidate.name}選手は負傷中のため選択できません。(復帰予定: ${candidate.injuryReturnDate || '未定'})`);
      return;
    }
    if (candidate.suspension?.isSuspended || (candidate.suspension?.matchesRemaining || 0) > 0) {
      setErrorMessage(`【選択不可】${candidate.name}選手は出場停止処分中のため選択できません。(残: ${candidate.suspension?.matchesRemaining || 1}試合)`);
      return;
    }
    if (candidate.clubId !== state.userClubId) {
      setErrorMessage(`【選択不可】他クラブ所属の選手は選択できません。`);
      return;
    }
    if (candidate.isLoaned && candidate.loanClubId !== state.userClubId) {
      setErrorMessage(`【選択不可】レンタル移籍中の選手は選択できません。`);
      return;
    }

    if (isOldGk && candidate.position !== 'GK') {
      setErrorMessage(`【GK配置制限】GK枠にはフィールドプレイヤーを配置できません。控えGKを選択してください。`);
      return;
    }
    if (!isOldGk && candidate.position === 'GK') {
      setErrorMessage(`【GK配置制限】GKはフィールドプレイヤー枠には配置できません。正GK枠と交代してください。`);
      return;
    }

    const result = executePlayerReplacement(
      tactics,
      state.players,
      state.userClubId || '',
      oldPlayer.id,
      candidate.id
    );

    if (!result.success) {
      setErrorMessage(result.message || '選手の入れ替えに失敗しました。');
      return;
    }

    const msg = `選手を入れ替えました: 「${oldPlayer.name} (${oldPlayer.position}) ➔ ${candidate.name} (${candidate.position})」即座に保存されました。`;
    onCompleteReplacement(result.newTactics, result.updatedPlayers, msg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>選手変更・配置の直接入れ替え</span>
              </h3>
              <p className="text-xs text-slate-400">
                選択した選手と入れ替える選手をクラブ一覧から選択してください（即時保存）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Replaced Player Banner */}
        <div className="px-4 sm:px-5 pt-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold">変更対象:</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-xs">
                  {oldPlayer.position}
                </span>
                <span className="font-mono text-slate-400 text-xs">#{oldPlayer.shirtNumber}</span>
                <span className="font-bold text-white text-sm">{oldPlayer.name}</span>
                <span className="text-xs text-slate-400 font-mono">OVR {oldPlayer.ovr}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {oldPlayer.injury?.isInjured ? (
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold">
                  負傷中
                </span>
              ) : oldPlayer.suspension?.isSuspended ? (
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                  出場停止中
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                  {isStarter(oldPlayer.id) ? 'スタメン' : isBench(oldPlayer.id) ? 'ベンチ' : '控え'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 bg-red-950/90 border border-red-600/80 rounded-2xl text-red-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="px-4 sm:px-5 pt-3 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Position Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(isOldGk ? (['GK'] as const) : (['ALL', 'DF', 'MF', 'FW'] as const)).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedFilter === tab
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'ALL' ? 'すべて' : tab}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="選手名で検索..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-2 space-y-2">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              該当する選手が見つかりませんでした。
            </div>
          ) : (
            filteredCandidates.map(candidate => {
              const isInjured = candidate.injury?.isInjured || candidate.injuryStatus === 'INJURED';
              const isSuspended = candidate.suspension?.isSuspended || (candidate.suspension?.matchesRemaining || 0) > 0;
              const isOtherClub = candidate.clubId !== state.userClubId;
              const isLoanedOut = candidate.isLoaned && candidate.loanClubId !== state.userClubId;
              const isSelectable = !isInjured && !isSuspended && !isOtherClub && !isLoanedOut;

              const candidateIsStarter = isStarter(candidate.id);
              const candidateIsBench = isBench(candidate.id);
              const isExactPos = candidate.position === oldPlayer.position;

              return (
                <div
                  key={candidate.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    !isSelectable
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                      : 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono text-xs text-slate-500 text-right">
                      #{candidate.shirtNumber}
                    </span>
                    <span className={`w-9 text-center py-0.5 rounded text-xs font-mono font-bold ${
                      isExactPos 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {candidate.position}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">{candidate.name}</span>
                        <ConditionDot condition={candidate.condition} />
                        {isExactPos && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-800">
                            同ポジション適性
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{candidate.age}歳</span>
                        <span>·</span>
                        <span>{candidate.playstyle}</span>
                        <span>·</span>
                        <span className="text-slate-500">
                          {candidateIsStarter ? '現在スタメン' : candidateIsBench ? '現在ベンチ' : '控え・ベンチ外'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-emerald-400">{candidate.ovr}</div>
                      <div className="text-[10px] text-slate-500">疲労: {candidate.fatigue}%</div>
                    </div>

                    {!isSelectable ? (
                      <span className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-bold text-center">
                        {isInjured 
                          ? '負傷中 (選択不可)' 
                          : isSuspended 
                            ? '出場停止中 (選択不可)' 
                            : isOtherClub 
                              ? '他クラブ所属' 
                              : '選択不可'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectCandidate(candidate)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>この選手と交代</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>※選択と同時にフォーメーションと登録が保存されます。</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
