import React from 'react';
import { Player } from '../../types/game';
import { TrendingUp, Sparkles, Award, Star, Flame, Shield, Activity, Target, Zap, Clock } from 'lucide-react';

interface Props {
  player: Player;
}

export const PlayerGrowthView: React.FC<Props> = ({ player }) => {
  const initialOvr = player.initialOvr ?? player.ovr;
  const currentExact = player.exactOvr ?? player.ovr;
  const currentOvr = player.ovr;
  const potential = player.potential ?? Math.max(player.ovr + 3, 80);

  const deltaExact = Math.round((currentExact - initialOvr) * 10) / 10;
  const isGrowing = deltaExact > 0;
  const isDeclining = deltaExact < 0;

  // Sub-integer progress towards next integer OVR (0.0 to 0.9)
  const subProgress = Math.max(0, Math.min(100, Math.round(((currentExact - Math.floor(currentExact)) * 100))));
  const nextTargetOvr = Math.floor(currentExact) + 1;

  // Career Growth Phase based on age
  const getGrowthPhase = (age: number) => {
    if (age <= 21) {
      return {
        label: '急成長期 (Rapid Growth)',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: '🚀',
        desc: '試合出場と好パフォーマンスにより爆発的に能力が伸長する黄金期です。'
      };
    }
    if (age <= 25) {
      return {
        label: '安定成長期 (Developing)',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: '📈',
        desc: '戦術眼とスキルの成熟により、着実に実力を積み上げる期間です。'
      };
    }
    if (age <= 29) {
      return {
        label: '全盛期・ピーク (Prime)',
        badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        icon: '🌟',
        desc: 'フィジカルと経験が最も高い次元で融合したキャリア最高潮のステージです。'
      };
    }
    if (age <= 32) {
      return {
        label: '円熟維持期 (Experienced)',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: '⚖️',
        desc: '高い戦術理解度と老獪なプレーで能力を安定維持できる段階です。'
      };
    }
    return {
      label: 'ベテラン・衰退傾向 (Veteran)',
      badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      icon: '⏳',
      desc: '自然なフィジカル低下傾向があります。適切な休養と起用管理で長持ちさせられます。'
    };
  };

  const phase = getGrowthPhase(player.age);

  // Match ratings history & recent form
  const ratings = player.matchRatingsHistory || [];
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
    : null;

  const diffOvr = currentOvr - initialOvr;

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            選手成長・能力開発レポート (Player Development)
          </h4>
        </div>
        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 self-start sm:self-auto ${phase.badge}`}>
          <span>{phase.icon}</span>
          <span>{phase.label}</span>
        </span>
      </div>

      {/* Main Growth Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Initial -> Current OVR Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            総合値（OVR）推移
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-mono text-slate-400 line-through">
              {initialOvr}
            </span>
            <span className="text-2xl font-mono font-black text-white">
              {currentExact.toFixed(1)}
            </span>
            <span 
              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                isGrowing 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                  : isDeclining 
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-slate-800 text-slate-400'
              }`}
            >
              {deltaExact > 0 ? `+${deltaExact.toFixed(1)}` : `${deltaExact.toFixed(1)}`}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            開幕時 OVR {initialOvr} からの累計変動
          </p>
        </div>

        {/* Sub-Integer Progress Gauge to Next OVR */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
            <span className="uppercase tracking-wider">次回昇格への進捗</span>
            <span className="font-mono text-emerald-400 font-bold">{subProgress}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
              style={{ width: `${subProgress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>OVR {Math.floor(currentExact)}</span>
            <span className="text-slate-300 font-bold">目標: OVR {nextTargetOvr}</span>
          </div>
        </div>

        {/* Potential Ceiling Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
            <span className="uppercase tracking-wider">潜在ポテンシャル</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-black text-amber-400">
              {potential}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              (上限まで +{Math.max(0, potential - currentOvr)})
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {potential >= 88 ? '世界最高峰のワールドクラス素質' : potential >= 82 ? 'トップリーグ主力級の器' : '安定したクラブの即戦力'}
          </p>
        </div>
      </div>

      {/* Match Ratings & Recent Form Influence */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>直近公式戦の評価点推移 (評価点が高いほど成長が加速)</span>
          </div>
          {avgRating && (
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              平均採点: ★ {avgRating}
            </span>
          )}
        </div>

        {ratings.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {ratings.map((score, idx) => {
                const isGreat = score >= 7.5;
                const isPoor = score <= 6.0;
                return (
                  <div 
                    key={idx}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                      isGreat 
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80' 
                        : isPoor
                          ? 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                    title={`第${idx + 1}試合: 評価点 ${score.toFixed(1)}`}
                  >
                    {score.toFixed(1)}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              ※ 平均採点7.5以上を継続すると「好調ボーナス（成長スピード大幅加速）」が自動付与されます。
            </p>
          </div>
        ) : (
          <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            公式戦の採点データがまだ蓄積されていません。試合に出場させて活躍させることで、OVRが実戦経験を通じて上昇します。
          </div>
        )}
      </div>

      {/* Attributes Growth Delta */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>主要能力パラメータ成長内訳</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {diffOvr !== 0 ? `総合差分: ${diffOvr > 0 ? `+${diffOvr}` : diffOvr}` : '現在基準値'}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          {[
            { key: 'PAC', label: 'スピード', val: player.pace },
            { key: 'SHO', label: '決定力', val: player.shooting },
            { key: 'PAS', label: 'パス', val: player.passing },
            { key: 'DRI', label: 'ドリブル', val: player.dribbling },
            { key: 'DEF', label: '守備力', val: player.defending },
            { key: 'PHY', label: 'フィジカル', val: player.physical }
          ].map(attr => (
            <div key={attr.key} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">{attr.key}</span>
              <div className="text-sm font-bold text-white font-mono mt-0.5 flex items-center justify-center gap-1">
                <span>{attr.val}</span>
                {diffOvr > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold">↑</span>
                )}
                {diffOvr < 0 && (
                  <span className="text-[10px] text-rose-400 font-bold">↓</span>
                )}
              </div>
              <span className="text-[9px] text-slate-500 block">{attr.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Progression & Market Value History Summary */}
      {(player.skillHistory && player.skillHistory.length > 0) && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-400" />
              <span>スキル習得・習熟・衰退ログ</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{player.skillHistory.length}件</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {player.skillHistory.slice(0, 6).map((sh, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 text-[11px] p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="min-w-0">
                  <span className={`font-bold ${
                    sh.action === 'declined' ? 'text-rose-400' : sh.action === 'acquired' ? 'text-emerald-400' : 'text-cyan-300'
                  }`}>
                    {sh.skillName}
                  </span>
                  <span className="text-slate-400 ml-1.5">{sh.reason}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 tabular-nums">{sh.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(player.marketValueHistory && player.marketValueHistory.length > 0) && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-emerald-400" />
              <span>市場価値変動履歴 (Dynamic Valuation)</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
              現在 €{(player.marketValue / 1000000).toFixed(1)}M
            </span>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {player.marketValueHistory.slice(-5).reverse().map((mv, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 tabular-nums">{mv.date}</span>
                  <span className="text-slate-300 truncate">{mv.reason}</span>
                </div>
                <span className="font-mono font-bold text-emerald-300 shrink-0 tabular-nums">
                  €{(mv.value / 1000000).toFixed(1)}M
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coaching Advice */}
      <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-start gap-2.5">
        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <span className="font-bold text-amber-300 block">監督・育成スタッフ寸評:</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {phase.desc} 
            {player.fatigue >= 70 ? ' 現在疲労が蓄積しているため、1試合休養を挟むことでコンディション低下を防ぎ、安定した成長曲線を維持できます。' : ' 現在フィジカル状態は良好で、積極的な試合出場が能力値の伸長に最も効果的です。'}
          </p>
        </div>
      </div>
    </div>
  );
};
