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

export function getFatigueInfo(fatigue: number): { clamped: number; labelText: string; label: string; barColor: string; textColor: string } {
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

  return { clamped, labelText, label: labelText, barColor, textColor };
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
  const { t } = useI18n();
  const { clamped, barColor, textColor } = getFatigueInfo(fatigue);

  // Remaining stamina capacity: 100 when fresh (0 fatigue), draining as fatigue grows
  const staminaRemaining = Math.max(8, 100 - clamped);

  // Height sizing
  const hClass = size === 'xs' ? 'h-2' : size === 'sm' ? 'h-2.5' : size === 'md' ? 'h-3' : 'h-3.5';
  const textClass = size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <div className={`space-y-0.5 ${className}`}>
      {/* Header Row (Optional: only shows numerical percentage or fraction, no verbal label strings) */}
      {showLabel && (
        <div className={`flex items-center justify-between gap-1.5 ${textClass}`}>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">{t.fatigue}</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            {showFraction ? (
              <span className={`font-bold ${textColor}`}>{clamped} / 100</span>
            ) : (
              <span className={`font-bold ${textColor}`}>{clamped}%</span>
            )}

            {/* Optional Condition Dot */}
            {showCondition && condition && (
              <ConditionDot condition={condition} />
            )}
          </div>
        </div>
      )}

      {/* Progress Bar Track */}
      <div className={`w-full bg-slate-950/90 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner ${hClass}`}>
        <div 
          className={`h-full rounded-full transition-all duration-300 shadow-sm ${barColor}`}
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
