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

export function getFatigueInfo(fatigue: number): { clamped: number; label: string; labelText: string; barColor: string; textColor: string } {
  const clamped = Math.max(0, Math.min(100, Math.round(fatigue)));

  // User specification:
  // - 溜まってなかったら (0〜24%): ゲージはそのままの色 (bg-sky-400 / 鮮やかなベースカラー)
  // - あまり溜まってなかったら (25〜49%): 緑 (bg-emerald-400)
  // - まあまあ溜まってたら (50〜74%): オレンジ (bg-amber-400)
  // - めっちゃ溜まってたら (75〜100%): 赤 (bg-red-500)
  let barColor = 'bg-sky-400';
  let textColor = 'text-sky-400';
  let labelText = '疲労が少ない';

  if (clamped >= 90) {
    barColor = 'bg-red-500';
    textColor = 'text-red-400';
    labelText = '非常に疲労';
  } else if (clamped >= 75) {
    barColor = 'bg-red-500';
    textColor = 'text-red-400';
    labelText = 'かなり疲労';
  } else if (clamped >= 50) {
    barColor = 'bg-amber-400';
    textColor = 'text-amber-400';
    labelText = '疲労あり';
  } else if (clamped >= 25) {
    barColor = 'bg-emerald-400';
    textColor = 'text-emerald-400';
    labelText = '軽い疲労';
  } else {
    barColor = 'bg-sky-400';
    textColor = 'text-sky-400';
    labelText = '疲労が少ない';
  }

  return { clamped, label: labelText, labelText, barColor, textColor };
}

export const FatigueGauge: React.FC<Props> = ({
  fatigue,
  condition,
  showCondition = false,
  size = 'sm',
  showLabel = false,
  showFraction = false,
  className = ''
}) => {
  const { clamped, barColor, textColor } = getFatigueInfo(fatigue);

  // Remaining stamina capacity: 100 when fresh (0 fatigue), draining as fatigue grows
  const staminaRemaining = Math.max(6, 100 - clamped);

  // Height sizing: sleek horizontal bars
  const hClass = size === 'xs' ? 'h-1.5' : size === 'sm' ? 'h-2' : size === 'md' ? 'h-2.5' : 'h-3';
  const textClass = size === 'xs' ? 'text-[9px]' : size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div className={`space-y-0.5 select-none ${className}`}>
      {/* Optional header row: only if showFraction/showCondition is explicitly requested, NEVER display word labels */}
      {(showFraction || (showCondition && condition)) && (
        <div className={`flex items-center justify-between gap-1 leading-none ${textClass}`}>
          {showFraction && (
            <span className={`font-mono font-bold ${textColor}`}>
              {100 - clamped}%
            </span>
          )}
          {showCondition && condition && (
            <ConditionDot condition={condition} />
          )}
        </div>
      )}

      {/* Progress Bar Track: dark sleek capsule */}
      <div className={`w-full bg-slate-950/90 rounded-full overflow-hidden p-[1px] border border-slate-700/70 shadow-inner ${hClass}`}>
        <div 
          className={`h-full rounded-full transition-all duration-300 shadow-xs ${barColor}`}
          style={{ width: `${staminaRemaining}%` }}
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
