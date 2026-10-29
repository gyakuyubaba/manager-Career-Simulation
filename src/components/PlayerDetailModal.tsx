import React, { useState } from 'react';
import { Player, Club } from '../types/game';
import { FatigueGauge, ConditionDot } from './common/FatigueGauge';
import { PlayablePositionsMap } from './common/PlayablePositionsMap';
import { PlayerGrowthView } from './common/PlayerGrowthView';
import { useI18n } from '../i18n/LanguageContext';
import { Shield, Heart, Zap, Award, AlertTriangle, Calendar, DollarSign, X, TrendingUp, UserCheck } from 'lucide-react';

interface Props {
  player: Player | null;
  club: Club | null;
  isUserPlayer?: boolean;
  onToggleTransferList?: (playerId: string) => void;
  onToggleLoanList?: (playerId: string) => void;
  onExerciseBuyOption?: (player: Player) => void;
  onUpdateShirtNumber?: (playerId: string, newNumber: number, forceSwap: boolean) => { success: boolean; message: string; conflictPlayer?: Player };
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<Props> = ({ 
  player, 
  club, 
  isUserPlayer = false,
  onToggleTransferList,
  onToggleLoanList,
  onExerciseBuyOption,
  onUpdateShirtNumber,
  onClose 
}) => {
  const { t } = useI18n();
  const [modalTab, setModalTab] = useState<'positions' | 'growth' | 'season_stats'>('positions');
  const [selectedSeasonScope, setSelectedSeasonScope] = useState<string>('current');
  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [shirtNumInput, setShirtNumInput] = useState(player?.shirtNumber || 1);
  const [shirtMsg, setShirtMsg] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Player | null>(null);

  if (!player) return null;

  const handleSaveNumber = (forceSwap: boolean = false) => {
    if (!onUpdateShirtNumber) return;
    const res = onUpdateShirtNumber(player.id, shirtNumInput, forceSwap);
    if (!res.success && res.conflictPlayer) {
      setConflict(res.conflictPlayer);
      return;
    }
    setShirtMsg(res.message);
    setConflict(null);
    setIsEditingNumber(false);
    setTimeout(() => setShirtMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center p-3 sm:p-6">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-4 sm:my-8 transition-all text-left pb-10">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-bold text-white shadow-lg shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">OVR</span>
              <span className="text-2xl text-emerald-400 font-mono font-black">{player.ovr}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white">{player.name}</h3>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-xs font-mono font-bold border border-blue-800">
                  {player.position}
                </span>
                
                {isUserPlayer && onUpdateShirtNumber ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-yellow-300 font-mono font-bold">#{player.shirtNumber}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingNumber(!isEditingNumber);
                        setShirtNumInput(player.shirtNumber);
                        setConflict(null);
                      }}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 cursor-pointer"
                    >
                      背番号変更
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-mono">#{player.shirtNumber}</span>
                )}
              </div>

              {isEditingNumber && (
                <div className="mt-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  {conflict ? (
                    <div className="text-[11px] text-amber-300">
                      背番号 #{shirtNumInput} は既に {conflict.name} が着用しています。
                      <div className="mt-1 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveNumber(true)}
                          className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px]"
                        >
                          スワップして変更
                        </button>
                        <button
                          type="button"
                          onClick={() => setConflict(null)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px]"
                        >
                          別の番号にする
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={shirtNumInput}
                        onChange={e => setShirtNumInput(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                        className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNumber(false)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px]"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingNumber(false)}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px]"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              )}

              {shirtMsg && (
                <div className="text-[11px] text-emerald-400 mt-1 font-semibold">{shirtMsg}</div>
              )}

              <div className="text-xs text-slate-400 mt-1">
                {player.age}歳 · {player.nationality} · 利き足: {player.preferredFoot} · 所属: <strong className="text-slate-200">{club?.name || 'フリー'}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setModalTab('positions')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modalTab === 'positions'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>守れるポジション・能力詳細</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('growth')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modalTab === 'growth'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>選手成長の可視化・能力推移</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('season_stats')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modalTab === 'season_stats'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>個人成績（今季・過去・通算）</span>
          </button>
        </div>

        {modalTab === 'growth' ? (
          <div className="mb-5">
            <PlayerGrowthView player={player} />
          </div>
        ) : modalTab === 'season_stats' ? (
          <div className="space-y-4 mb-5">
            {/* Season Selector Bar */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">表示対象シーズン:</span>
                <select
                  value={selectedSeasonScope}
                  onChange={(e) => setSelectedSeasonScope(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="current">2026/27 (今季・公式戦)</option>
                  {(player.seasonHistory || []).map(h => (
                    <option key={h.seasonId} value={h.seasonId}>
                      {h.seasonId} ({h.clubName || h.clubId})
                    </option>
                  ))}
                  <option value="career">生涯通算成績 (キャリア合計)</option>
                </select>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                {selectedSeasonScope === 'current'
                  ? '※ プレシーズンは除外された公式記録です'
                  : selectedSeasonScope === 'career'
                  ? '※ 確定済み全シーズンの合算数値です'
                  : '※ 過去シーズンの確定アーカイブ記録です'}
              </div>
            </div>

            {/* Resolved Stats Numbers */}
            {(() => {
              let dispStats = {
                appearances: player.stats?.appearances || 0,
                starts: player.stats?.starts || 0,
                minutes: player.stats?.minutes || 0,
                goals: player.stats?.goals || 0,
                assists: player.stats?.assists || 0,
                cleanSheets: player.stats?.cleanSheets || 0,
                yellowCards: player.stats?.yellowCards || 0,
                redCards: player.stats?.redCards || 0,
                avgRating: player.stats?.avgRating || 0,
                saves: player.stats?.saves || 0,
                goalsConceded: player.stats?.goalsConceded || 0,
                clubName: club?.name || player.clubId
              };

              if (selectedSeasonScope === 'career') {
                const historyList = player.seasonHistory || [];
                const totApps = (player.stats?.appearances || 0) + historyList.reduce((acc, h) => acc + (h.appearances || 0), 0);
                const totStarts = (player.stats?.starts || 0) + historyList.reduce((acc, h) => acc + (h.starts || 0), 0);
                const totMinutes = (player.stats?.minutes || 0) + historyList.reduce((acc, h) => acc + (h.minutes || 0), 0);
                const totGoals = (player.stats?.goals || 0) + historyList.reduce((acc, h) => acc + (h.goals || 0), 0);
                const totAssists = (player.stats?.assists || 0) + historyList.reduce((acc, h) => acc + (h.assists || 0), 0);
                const totClean = (player.stats?.cleanSheets || 0) + historyList.reduce((acc, h) => acc + (h.cleanSheets || 0), 0);
                const totYellow = (player.stats?.yellowCards || 0) + historyList.reduce((acc, h) => acc + (h.yellowCards || 0), 0);
                const totRed = (player.stats?.redCards || 0) + historyList.reduce((acc, h) => acc + (h.redCards || 0), 0);
                const weightedRatingSum = ((player.stats?.avgRating || 0) * (player.stats?.appearances || 0)) +
                  historyList.reduce((acc, h) => acc + ((h.avgRating || 0) * (h.appearances || 0)), 0);
                const avgR = totApps > 0 ? (weightedRatingSum / totApps) : 0;

                dispStats = {
                  appearances: totApps,
                  starts: totStarts,
                  minutes: totMinutes,
                  goals: totGoals,
                  assists: totAssists,
                  cleanSheets: totClean,
                  yellowCards: totYellow,
                  redCards: totRed,
                  avgRating: avgR,
                  saves: player.stats?.saves || 0,
                  goalsConceded: player.stats?.goalsConceded || 0,
                  clubName: '通算'
                };
              } else if (selectedSeasonScope !== 'current') {
                const hist = (player.seasonHistory || []).find(h => h.seasonId === selectedSeasonScope);
                if (hist) {
                  dispStats = {
                    appearances: hist.appearances || 0,
                    starts: hist.starts || 0,
                    minutes: hist.minutes || 0,
                    goals: hist.goals || 0,
                    assists: hist.assists || 0,
                    cleanSheets: hist.cleanSheets || 0,
                    yellowCards: hist.yellowCards || 0,
                    redCards: hist.redCards || 0,
                    avgRating: hist.avgRating || 0,
                    saves: 0,
                    goalsConceded: 0,
                    clubName: hist.clubName || hist.clubId
                  };
                }
              }

              return (
                <div className="space-y-4">
                  {/* Primary Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">出場数 / 先発</span>
                      <span className="text-lg font-bold text-white font-mono">
                        {dispStats.appearances} <span className="text-xs text-slate-400 font-normal">({dispStats.starts}先発)</span>
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">出場時間</span>
                      <span className="text-lg font-bold text-slate-200 font-mono">
                        {dispStats.minutes.toLocaleString()} <span className="text-xs text-slate-400 font-normal">分</span>
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">得点 / アシスト</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono">
                        {dispStats.goals} <span className="text-xs text-blue-400 font-bold">/ {dispStats.assists}</span>
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">平均評価点</span>
                      <span className="text-lg font-bold text-amber-400 font-mono">
                        {dispStats.avgRating > 0 ? dispStats.avgRating.toFixed(2) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Secondary Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block font-mono">クリーンシート</span>
                      <span className="text-sm font-bold text-amber-300 font-mono">{dispStats.cleanSheets} 試合</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block font-mono">警告 / 退場</span>
                      <span className="text-sm font-bold text-white font-mono">
                        🟨 {dispStats.yellowCards} · 🟥 {dispStats.redCards}
                      </span>
                    </div>
                    {player.position === 'GK' && (
                      <>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-500 block font-mono">セーブ数</span>
                          <span className="text-sm font-bold text-cyan-400 font-mono">{dispStats.saves || Math.round(dispStats.appearances * 3.2)} 回</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-500 block font-mono">失点 / 1試合平均</span>
                          <span className="text-sm font-bold text-rose-400 font-mono">
                            {dispStats.goalsConceded || Math.max(0, Math.round(dispStats.appearances * 1.1))} ({dispStats.appearances > 0 ? ((dispStats.goalsConceded || Math.round(dispStats.appearances * 1.1)) / dispStats.appearances).toFixed(2) : '0.00'})
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Chronological Season History Table */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300">
                      歴代シーズン戦績アーカイブ (Season-by-Season History)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">シーズン</th>
                            <th className="py-2.5 px-3">所属クラブ</th>
                            <th className="py-2.5 px-2 text-center">出場</th>
                            <th className="py-2.5 px-2 text-center">先発</th>
                            <th className="py-2.5 px-2 text-center text-emerald-400">得点</th>
                            <th className="py-2.5 px-2 text-center text-blue-400">アシスト</th>
                            <th className="py-2.5 px-2 text-center text-amber-300">CS</th>
                            <th className="py-2.5 px-2 text-center text-yellow-400">警告</th>
                            <th className="py-2.5 px-2 text-center">平均点</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {/* Current Season */}
                          <tr className="bg-emerald-950/20 text-slate-200">
                            <td className="py-2.5 px-3 font-bold text-emerald-400">2026/27 (今季)</td>
                            <td className="py-2.5 px-3 font-sans">{club?.name || player.clubId}</td>
                            <td className="py-2.5 px-2 text-center font-bold text-white">{player.stats?.appearances || 0}</td>
                            <td className="py-2.5 px-2 text-center">{player.stats?.starts || 0}</td>
                            <td className="py-2.5 px-2 text-center font-bold text-emerald-400">{player.stats?.goals || 0}</td>
                            <td className="py-2.5 px-2 text-center font-bold text-blue-400">{player.stats?.assists || 0}</td>
                            <td className="py-2.5 px-2 text-center">{player.stats?.cleanSheets || 0}</td>
                            <td className="py-2.5 px-2 text-center">{player.stats?.yellowCards || 0}</td>
                            <td className="py-2.5 px-2 text-center font-bold">
                              {player.stats?.avgRating && player.stats.avgRating > 0 ? player.stats.avgRating.toFixed(2) : '-'}
                            </td>
                          </tr>

                          {/* Past Seasons */}
                          {(player.seasonHistory || []).map(h => (
                            <tr key={h.seasonId} className="hover:bg-slate-900/40 text-slate-300">
                              <td className="py-2.5 px-3 font-semibold">{h.seasonId}</td>
                              <td className="py-2.5 px-3 font-sans">{h.clubName || h.clubId}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-white">{h.appearances}</td>
                              <td className="py-2.5 px-2 text-center">{h.starts}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-emerald-400">{h.goals}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-blue-400">{h.assists}</td>
                              <td className="py-2.5 px-2 text-center">{h.cleanSheets}</td>
                              <td className="py-2.5 px-2 text-center">{h.yellowCards}</td>
                              <td className="py-2.5 px-2 text-center font-bold">
                                {h.avgRating > 0 ? h.avgRating.toFixed(2) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            {/* Status Highlights: Fatigue & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t.fatigue} (Fatigue Gauge)
                </div>
                <FatigueGauge fatigue={player.fatigue} size="md" showFraction />
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t.condition} (Match Form)
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <ConditionDot condition={player.condition} showLabel />
                </div>
              </div>
            </div>

            {/* Contract, Health, and Trust Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">契約年数・役割</span>
                <div className="text-xs font-bold text-white mt-0.5">
                  残{player.contractYears}年 · {player.squadRole}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">市場価値・週給</span>
                <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                  €{(player.marketValue / 1000000).toFixed(1)}M (週給€{(player.wage / 1000).toFixed(0)}k)
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">健康状態・出場資格</span>
                <div className="text-xs font-bold mt-0.5">
                  {player.injuryStatus === 'INJURED' || player.injury?.isInjured ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-red-400 font-black">
                        <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-800 text-[10px]">【負傷】</span>
                        <span>負傷中（{player.injuryType || player.injury?.type || '負傷'}）</span>
                      </div>
                      <div className="text-[11px] text-red-300 font-mono">
                        復帰予定：{player.injuryReturnDate || player.injury?.returnDate || '診断中'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        あと {player.injuryDaysRemaining || player.injury?.recoveryDays || 0} 日
                      </div>
                    </div>
                  ) : player.suspension?.isSuspended ? (
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-[10px]">【出場停止】</span>
                      <span>停止中 (残{player.suspension.matchesRemaining}試合)</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        HEALTHY (出場可能)
                      </span>
                      {player.fatigue >= 70 && (
                        <div className="text-[10px] text-amber-400 font-bold">
                          【疲労蓄積警告: {player.fatigue}%】負傷リスク上昇中
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Playable Positions Map (守れるポジション・適性一覧) */}
            <div className="mb-4">
              <PlayablePositionsMap player={player} />
            </div>

            {/* Detailed Attributes */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-4">
              <div className="text-xs font-bold text-white mb-3 uppercase tracking-wider">
                能力パラメータ詳細 (Attributes)
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">PAC (スピード)</span>
                  <span className="text-base font-bold text-white font-mono">{player.pace}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">SHO (決定力)</span>
                  <span className="text-base font-bold text-white font-mono">{player.shooting}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">PAS (パス)</span>
                  <span className="text-base font-bold text-white font-mono">{player.passing}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">DRI (ドリブル)</span>
                  <span className="text-base font-bold text-white font-mono">{player.dribbling}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">DEF (守備力)</span>
                  <span className="text-base font-bold text-white font-mono">{player.defending}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">PHY (フィジカル)</span>
                  <span className="text-base font-bold text-white font-mono">{player.physical}</span>
                </div>
              </div>
            </div>

            {/* Personality & Playstyle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">プレースタイル</span>
                <span className="text-xs font-bold text-blue-300 mt-0.5 block">{player.playstyle}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">パーソナリティ (性格)</span>
                <span className="text-xs font-bold text-purple-300 mt-0.5 block">{player.personality}</span>
              </div>
            </div>
          </>
        )}

        {/* Transfer & Loan Listing Operations (Requirement 5 & 6) */}
        {isUserPlayer && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-4 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>移籍・レンタル リスト管理</span>
              <span className="text-[10px] text-slate-400 font-normal">リスト登録するとAIクラブからオファーが届きやすくなります</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleTransferList && onToggleTransferList(player.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  player.isTransferListed
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {player.isTransferListed ? '✓ 移籍リストから除外' : '＋ 移籍リストに追加'}
              </button>

              <button
                type="button"
                onClick={() => onToggleLoanList && onToggleLoanList(player.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  player.isLoanListed
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {player.isLoanListed ? '✓ 期限付き移籍リストから除外' : '＋ 期限付き移籍リストに追加'}
              </button>

              {player.isLoaned && player.loanOptionBuyFee && onExerciseBuyOption && (
                <button
                  type="button"
                  onClick={() => onExerciseBuyOption(player)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  買取オプションを行使 (€{(player.loanOptionBuyFee / 1000000).toFixed(1)}M)
                </button>
              )}
            </div>
          </div>
        )}

        <div className="text-right pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  </div>
  );
};
