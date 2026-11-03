import React, { useState } from 'react';
import { UnexpectedEvent, UnexpectedEventChoice } from '../types/game';
import { AlertCircle, Zap, Shield, TrendingUp, DollarSign, CheckCircle2, Award } from 'lucide-react';

interface Props {
  event: UnexpectedEvent;
  onSelectChoice: (eventId: string, choiceId: string) => void;
}

export const UnexpectedEventModal: React.FC<Props> = ({ event, onSelectChoice }) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>(event.choices[0]?.id || '');

  const handleConfirm = () => {
    if (!selectedChoiceId) return;
    onSelectChoice(event.id, selectedChoiceId);
  };

  const categoryColor = 
    event.category === 'club_internal' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
    event.category === 'match_related' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
    event.category === 'transfer_related' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' :
    event.category === 'board_management' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
    'bg-rose-500/20 text-rose-400 border-rose-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Ribbon */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryColor} flex items-center gap-1.5`}>
              <Zap className="w-3.5 h-3.5" />
              <span>{event.categoryLabel}</span>
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">{event.date}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug font-display">
            {event.title}
          </h2>
        </div>

        {/* Narrative Description */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
            {event.description}
          </div>

          {/* Choices Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                指揮官の判断・対応を選択
              </span>
              <span className="text-[11px] text-slate-500">※選択によってクラブと選手に影響が生じます</span>
            </div>

            <div className="space-y-2.5">
              {event.choices.map((choice) => {
                const isSelected = selectedChoiceId === choice.id;
                return (
                  <div
                    key={choice.id}
                    onClick={() => setSelectedChoiceId(choice.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`text-sm font-bold ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                        {choice.label}
                      </span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-emerald-400 bg-emerald-500 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-2.5">
                      {choice.description}
                    </p>

                    {/* Effect Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                      {choice.effects.boardConfidenceDelta !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${
                          choice.effects.boardConfidenceDelta > 0 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          理事会信頼 {choice.effects.boardConfidenceDelta > 0 ? `+${choice.effects.boardConfidenceDelta}%` : `${choice.effects.boardConfidenceDelta}%`}
                        </span>
                      )}
                      {choice.effects.managerTrustDelta !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${
                          choice.effects.managerTrustDelta > 0 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          選手信頼度 {choice.effects.managerTrustDelta > 0 ? `+${choice.effects.managerTrustDelta}` : `${choice.effects.managerTrustDelta}`}
                        </span>
                      )}
                      {choice.effects.budgetDelta !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${
                          choice.effects.budgetDelta > 0 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          予算変動 {choice.effects.budgetDelta > 0 ? `+€${(choice.effects.budgetDelta / 1000000).toFixed(1)}M` : `-€${(Math.abs(choice.effects.budgetDelta) / 1000000).toFixed(1)}M`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            決断を下す（決定）
          </button>
        </div>

      </div>
    </div>
  );
};
