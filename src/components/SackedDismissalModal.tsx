import React from 'react';
import { GameWorldState } from '../types/game';
import { AlertTriangle, ArrowRight, Briefcase, Award } from 'lucide-react';

interface Props {
  state: GameWorldState;
  onProceedToNewOffers: () => void;
}

export const SackedDismissalModal: React.FC<Props> = ({ state, onProceedToNewOffers }) => {
  const currentClub = state.userClubId ? state.clubs[state.userClubId] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center">
        
        {/* Warning Badge */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
            OFFICIAL BOARD ANNOUNCEMENT
          </div>
          <h2 className="text-2xl font-black text-white font-display">
            監督解任通告
          </h2>
          <p className="text-sm font-semibold text-slate-300">
            {currentClub?.name || '所属クラブ'} 取締役会より正式決定
          </p>
        </div>

        {/* Dismissal Explanation */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            「直近の公式戦における成績不振および取締役会信頼度（現在{state.boardConfidence}%）の低下を受け、取締役会は慎重に協議を重ねた結果、本日付で<span className="text-white font-bold">{state.manager.name}監督</span>との契約解除を決定いたしました。」
          </p>
        </div>

        {/* New Opportunity Highlight */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-left space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Briefcase className="w-4 h-4 shrink-0" />
            <span>新たな挑戦の舞台：5クラブから招聘オファー受領</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            しかし、あなたの監督キャリアはここで終わりではありません。これまでの指導手腕と戦術的実績を高く評価する<span className="text-emerald-300 font-bold">国内外の5クラブ</span>から、緊急の就任オファーが届いています！新天地を選び、名誉挽回へ向けキャリアを再興しましょう。
          </p>
          <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              通算指揮: {state.manager.matchesManaged}試合
            </span>
            <span>通算勝率: {state.manager.matchesManaged > 0 ? Math.round((state.manager.wins / state.manager.matchesManaged) * 100) : 0}%</span>
            <span>獲得タイトル: {state.manager.careerTrophies}冠</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onProceedToNewOffers}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm sm:text-base transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>新たな5クラブからのオファーを確認する</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
};
