import React from 'react';
import { PlayerCondition } from '../../types/game';
import { useI18n } from '../../i18n/LanguageContext';

interface Props {
  fatigue: number; // 0 - 100
  condition?: PlayerCondition;
  showCondition?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showFraction?: boolean;
  className?: string;
}

export const FatigueGauge: React.FC<Props> = ({
  fatigue,
  condition,
  showCondition = false,
  size = 'sm',
  showLabel = true,
  showFraction = false,
  className = ''
}) => {
  const { t } = useI18n();
  const clamped = Math.max(0, Math.min(100, Math.round(fatigue)));

  // Qualitative label and color matching specification:
  // 15% 良好, 50% 普通, 80% 疲労あり, 95% 非常に疲労
  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-400';
  let labelText = '良好';

  if (clamped > 85) {
    barColor = 'bg-red-500';
    textColor = 'text-red-400';
    labelText = '非常に疲労';
  } else if (clamped > 60) {
    barColor = 'bg-orange-500';
    textColor = 'text-orange-400';
    labelText = '疲労あり';
  } else if (clamped > 25) {
    barColor = 'bg-amber-400';
    textColor = 'text-amber-300';
    labelText = '普通';
  } else {
    barColor = 'bg-emerald-500';
    textColor = 'text-emerald-400';
    labelText = '良好';
  }

  // Height sizing
  const hClass = size === 'xs' ? 'h-1.5' : size === 'sm' ? 'h-2' : size === 'md' ? 'h-2.5' : 'h-3';
  const textClass = size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Header Row */}
      {showLabel && (
        <div className={`flex items-center justify-between gap-1.5 ${textClass}`}>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">{t.fatigue}</span>
            <span className={`font-semibold ${textColor}`}>{labelText}</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            {showFraction ? (
              <span className={`font-bold ${textColor}`}>{clamped} / 100 ({labelText})</span>
            ) : (
              <span className={`font-bold ${textColor}`}>{clamped}% {labelText}</span>
            )}

            {/* Optional Condition Dot */}
            {showCondition && condition && (
              <ConditionDot condition={condition} />
            )}
          </div>
        </div>
      )}

      {/* Progress Bar Track */}
      <div className={`w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60 ${hClass}`}>
        <div 
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

export const ConditionDot: React.FC<{ condition: PlayerCondition; showLabel?: boolean }> = ({ 
  condition, 
  showLabel = false 
}) => {
  const { t } = useI18n();

  let dotColor = 'bg-slate-400';
  let title = t.condYellow;
  let shadow = '';

  switch (condition) {
    case 'pink':
      dotColor = 'bg-pink-500';
      shadow = 'shadow-sm shadow-pink-500/50';
      title = t.condPink;
      break;
    case 'red':
      dotColor = 'bg-red-500';
      shadow = 'shadow-sm shadow-red-500/50';
      title = t.condRed;
      break;
    case 'yellow':
      dotColor = 'bg-yellow-400';
      shadow = '';
      title = t.condYellow;
      break;
    case 'cyan':
      dotColor = 'bg-cyan-400';
      shadow = '';
      title = t.condCyan;
      break;
    case 'purple':
      dotColor = 'bg-purple-500';
      shadow = '';
      title = t.condPurple;
      break;
  }

  return (
    <div className="inline-flex items-center gap-1" title={title}>
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor} ${shadow}`} />
      {showLabel && <span className="text-[10px] text-slate-300">{title}</span>}
    </div>
  );
};
