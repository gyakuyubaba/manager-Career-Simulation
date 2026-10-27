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
  const [modalTab, setModalTab] = useState<'positions' | 'growth'>('positions');
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
        </div>

        {modalTab === 'growth' ? (
          <div className="mb-5">
            <PlayerGrowthView player={player} />
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
