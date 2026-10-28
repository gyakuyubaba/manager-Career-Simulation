import React, { useState } from 'react';
import { GameWorldState } from '../types/game';
import { formatDateJP } from '../engine/dateEngine';
import { useI18n } from '../i18n/LanguageContext';
import { Calendar, FastForward, Play, ChevronDown, DollarSign, Activity, Globe } from 'lucide-react';

interface Props {
  state: GameWorldState;
  onAdvanceDay: () => void;
  onFastForward: (type: 'next_match' | 'transfer_deadline' | 'days_7' | 'end_of_month') => void;
  onRequestReset?: () => void;
  onResetCareer?: () => void;
  isSimulating: boolean;
}

export const HeaderNav: React.FC<Props> = ({ state, onAdvanceDay, onFastForward, onRequestReset, onResetCareer, isSimulating }) => {
  const [showSkipMenu, setShowSkipMenu] = useState(false);
  const { language, setLanguage, t } = useI18n();

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Zone 1: Manager & Club Wordmark */}
          <div className="flex items-center gap-3 min-w-0">
            {userClub && (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                style={{ backgroundColor: userClub.primaryColor }}
              >
                {userClub.shortName}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight truncate">
                  {userClub?.name || (language === 'en' ? 'Unemployed' : language === 'es' ? 'Sin equipo' : 'フリー監督')}
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-400">·</span>
                <span className="hidden sm:inline-block text-xs text-slate-400 truncate">
                  {state.manager.name} ({state.manager.avatar})
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-slate-300 font-semibold">{formatDateJP(state.currentDate)}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">{state.season}</span>
              </div>
            </div>
          </div>

          {/* Zone 2: Budgets & Board (Desktop) */}
          {userClub && (
            <div className="hidden lg:flex items-center gap-5 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.transferBudget}:</span>
                <span className="font-bold text-white font-mono">
                  €{(userClub.transferBudget / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.boardConfidence}:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {state.boardConfidence}%
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  state.boardConfidence >= 60 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  state.boardConfidence >= 40 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  state.boardConfidence >= 20 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  'bg-red-600 text-white font-black'
                }`}>
                  {state.boardConfidenceStage || (state.boardConfidence >= 60 ? '通常' : state.boardConfidence >= 40 ? '警告' : state.boardConfidence >= 20 ? '解任危機' : '解任')}
                </span>
              </div>
              {state.isTransferWindowOpen && (
                <div className="text-[11px] text-amber-300 font-mono">
                  {t.transferDeadlineDays} {state.transferWindowClosingDays}日
                </div>
              )}
            </div>
          )}

          {/* Zone 3: Date Advance & Skip Controls */}
          <div className="flex items-center gap-2 relative shrink-0">
            {/* Advance 1 Day Primary CTA */}
            <button
              type="button"
              onClick={onAdvanceDay}
              disabled={isSimulating}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t.nextDay}</span>
            </button>

            {/* Fast Forward Menu Toggle */}
            <button
              type="button"
              onClick={() => setShowSkipMenu(!showSkipMenu)}
              disabled={isSimulating}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
              title="期間スキップ"
            >
              <FastForward className="w-4 h-4 text-emerald-400" />
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Skip Dropdown Menu */}
            {showSkipMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  一括日程進行（スマートスキップ）
                </div>
                <button
                  type="button"
                  onClick={() => { setShowSkipMenu(false); onFastForward('next_match'); }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition-colors flex items-center justify-between"
                >
                  <span>次の試合まで進む</span>
                  <span className="text-[10px] text-slate-500">自動停止</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSkipMenu(false); onFastForward('transfer_deadline'); }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition-colors flex items-center justify-between"
                >
                  <span>移籍市場閉幕まで進む</span>
                  <span className="text-[10px] text-slate-500">8/31</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSkipMenu(false); onFastForward('days_7'); }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition-colors flex items-center justify-between"
                >
                  <span>1週間進む（7日間）</span>
                  <span className="text-[10px] text-slate-500">+7日</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSkipMenu(false); onFastForward('end_of_month'); }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition-colors flex items-center justify-between"
                >
                  <span>月末まで進む</span>
                  <span className="text-[10px] text-slate-500">月更新</span>
                </button>

                {(onRequestReset || onResetCareer) && (
                  <>
                    <div className="my-1 border-t border-slate-800" />
                    <button
                      type="button"
                      onClick={() => { 
                        setShowSkipMenu(false); 
                        if (onRequestReset) {
                          onRequestReset();
                        } else if (onResetCareer) {
                          onResetCareer();
                        }
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors flex items-center justify-between font-semibold cursor-pointer"
                    >
                      <span>🔄 データ初期化・新規開始</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
