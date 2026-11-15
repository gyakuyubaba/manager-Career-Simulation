import React from 'react';
import { Player, Position } from '../../types/game';
import { getPlayablePositionsWithGrades, PlayablePositionGrade } from '../../data/playerPositionsHelper';
import { Shield, Sparkles, CheckCircle, Info } from 'lucide-react';

interface Props {
  player: Player;
}

// Coordinate mapping for visual mini-pitch (0 to 100%)
const PITCH_POSITIONS: Record<Position, { x: number; y: number }> = {
  GK: { x: 50, y: 88 },
  CB: { x: 50, y: 72 },
  LB: { x: 18, y: 68 },
  RB: { x: 82, y: 68 },
  LWB: { x: 14, y: 52 },
  RWB: { x: 86, y: 52 },
  CDM: { x: 50, y: 56 },
  CM: { x: 50, y: 44 },
  CAM: { x: 50, y: 32 },
  LM: { x: 18, y: 40 },
  RM: { x: 82, y: 40 },
  LW: { x: 22, y: 22 },
  RW: { x: 78, y: 22 },
  CF: { x: 50, y: 22 },
  ST: { x: 50, y: 12 }
};

export const PlayablePositionsMap: React.FC<Props> = ({ player }) => {
  const playableList = getPlayablePositionsWithGrades(player);
  const positionGradeMap = new Map<Position, PlayablePositionGrade>();
  playableList.forEach(item => positionGradeMap.set(item.position, item));

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            守れるポジション・適性一覧（現実準拠）
          </h4>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> ◎本職
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> ○サブ適性
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> △類似起用可
          </span>
        </div>
      </div>

      {/* Mini Pitch & Detailed Badges Split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* Tactical Mini Pitch (5 cols on md) */}
        <div className="md:col-span-5 relative w-full aspect-[4/5] max-w-[240px] mx-auto rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-2 shadow-inner overflow-hidden select-none">
          {/* Pitch lines SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
            <rect x="6%" y="5%" width="88%" height="90%" fill="none" stroke="#fff" strokeWidth="1.5" />
            <line x1="6%" y1="50%" x2="94%" y2="50%" stroke="#fff" strokeWidth="1.5" />
            <circle cx="50%" cy="50%" r="16%" fill="none" stroke="#fff" strokeWidth="1.5" />
            <rect x="25%" y="5%" width="50%" height="16%" fill="none" stroke="#fff" strokeWidth="1.5" />
            <rect x="25%" y="79%" width="50%" height="16%" fill="none" stroke="#fff" strokeWidth="1.5" />
          </svg>

          {/* Interactive Position Dots on Pitch */}
          {(Object.entries(PITCH_POSITIONS) as [Position, { x: number; y: number }][]).map(([pos, coords]) => {
            const gradeInfo = positionGradeMap.get(pos);
            const isPlayable = !!gradeInfo;
            const isPrimary = gradeInfo?.grade === 'S';
            const isSecondary = gradeInfo?.grade === 'A';
            const isRelated = gradeInfo?.grade === 'B';

            return (
              <div
                key={pos}
                style={{
                  position: 'absolute',
                  left: `${coords.x}%`,
                  top: `${coords.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`transition-all duration-200 z-10 flex items-center justify-center ${
                  isPrimary
                    ? 'w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-300 scale-110'
                    : isSecondary
                      ? 'w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] shadow-md shadow-cyan-500/40 ring-1 ring-cyan-200'
                      : isRelated
                        ? 'w-5 h-5 rounded-full bg-amber-500/90 text-slate-950 font-bold text-[8px] opacity-90 ring-1 ring-amber-300'
                        : 'w-4 h-4 rounded-full bg-slate-800/40 text-slate-600 font-mono text-[7px] border border-slate-700/30'
                }`}
                title={gradeInfo ? `${pos}: ${gradeInfo.label}` : pos}
              >
                {pos}
              </div>
            );
          })}
        </div>

        {/* Playable Positions List (7 cols on md) */}
        <div className="md:col-span-7 space-y-2">
          <div className="text-[11px] text-slate-400 font-medium">
            実戦起用可能なポジションと適性判定:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {playableList.map((item) => {
              const effectiveOvr = item.grade === 'S'
                ? player.ovr
                : item.grade === 'A'
                  ? Math.max(40, player.ovr - 2)
                  : Math.max(40, player.ovr - 5);

              const badgeColor = item.grade === 'S'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : item.grade === 'A'
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300';

              return (
                <div
                  key={item.position}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    item.grade === 'S'
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : item.grade === 'A'
                        ? 'bg-slate-900 border-cyan-500/30'
                        : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-md font-mono font-black text-xs border ${badgeColor}`}>
                      {item.symbol} {item.position === 'CF' ? 'CF (シャドー)' : item.position}
                    </span>
                    <div className="truncate">
                      <span className="text-[11px] font-bold text-white block truncate">{item.category}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{item.label}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] text-slate-400 block">実効</span>
                    <span className={`font-mono font-bold text-xs ${
                      effectiveOvr >= 80 ? 'text-amber-400' : effectiveOvr >= 74 ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      {effectiveOvr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-500 pt-1 flex items-center gap-1.5">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>◎および○のポジションは能力低下がほぼなく、自然にスタメン起用が可能です。</span>
          </div>
        </div>

      </div>
    </div>
  );
};
