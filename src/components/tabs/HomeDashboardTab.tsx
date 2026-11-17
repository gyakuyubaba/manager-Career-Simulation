import stadiumImg from '../../assets/images/stadium_pitch_hero_1790585035252.jpg';
import React from 'react';
import { GameWorldState, MatchFixture } from '../../types/game';
import { formatDateJP, addDays } from '../../engine/dateEngine';
import { generatePreSeasonInvitations } from '../../engine/preSeasonEngine';
import { 
  Trophy, 
  Calendar, 
  ArrowRight, 
  Newspaper, 
  ShieldAlert, 
  TrendingUp, 
  DollarSign, 
  Sparkles,
  Compass,
  Target,
  Flag,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  X
} from 'lucide-react';
import { generateClubVisionRoadmap } from '../../engine/clubVisionEngine';
import { getUnreadSmartphoneCount } from '../../engine/smartphoneEngine';

interface Props {
  state: GameWorldState;
  onOpenMatch: (fixture: MatchFixture) => void;
  onSelectPreSeason: (tournamentId: string) => void;
  onNavigateTab: (tab: 'tactics' | 'transfers' | 'fixtures' | 'club') => void;
  onOpenSmartphone?: () => void;
  onDismissPreSeasonBanner?: (year: number) => void;
}

export const HomeDashboardTab: React.FC<Props> = ({ 
  state, 
  onOpenMatch, 
  onSelectPreSeason,
  onNavigateTab,
  onOpenSmartphone,
  onDismissPreSeasonBanner
}) => {
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const unreadSmartphone = getUnreadSmartphoneCount(state);

  // Next upcoming user fixture
  const nextFixture = state.fixtures.find(
    f => (f.homeClubId === state.userClubId || f.awayClubId === state.userClubId) && f.status === 'upcoming'
  );

  const opponentClub = nextFixture
    ? state.clubs[nextFixture.homeClubId === state.userClubId ? nextFixture.awayClubId : nextFixture.homeClubId]
    : null;

  const isHomeMatch = nextFixture?.homeClubId === state.userClubId;

  // Dynamic multi-year Pre-Season Summer Tour check (works in 2026, 2027, 2028...)
  const currentYearNum = parseInt((state.currentDate || '2026-07-01').slice(0, 4), 10) || 2026;
  const currentMmDd = (state.currentDate || '2026-07-01').slice(5);
  const isInPreSeasonWindow = currentMmDd >= '06-25' && currentMmDd <= '07-16';
  const activeTour =
    state.preSeasonTournament && state.preSeasonTournament.seasonYear === currentYearNum
      ? state.preSeasonTournament
      : undefined;
  const isPreSeasonOpen = isInPreSeasonWindow && !state.selectedPreSeason && !activeTour;

  const tourInvitations = isPreSeasonOpen
    ? (Array.isArray(state.preSeasonInvitations) &&
      state.preSeasonInvitations.length > 0 &&
      state.preSeasonInvitations.every(inv => inv.seasonYear === currentYearNum)
        ? state.preSeasonInvitations
        : userClub
          ? generatePreSeasonInvitations(userClub, state.clubs, state.manager, currentYearNum)
          : [])
    : [];

  const finalTourFixture = activeTour?.finalFixtureId
    ? state.fixtures.find(f => f.id === activeTour.finalFixtureId)
    : undefined;
  const hasPlayedPostTourMatch = Boolean(
    activeTour &&
      state.fixtures.some(
        f =>
          f.status === 'finished' &&
          f.competition !== 'pre-season' &&
          (f.homeClubId === state.userClubId || f.awayClubId === state.userClubId) &&
          f.date >= activeTour.endDate &&
          f.date.startsWith(String(currentYearNum))
      )
  );
  const isTourBannerDismissed = state.dismissedPreSeasonBannerYear === currentYearNum;
  const isWithinPostTourGrace = Boolean(
    activeTour && state.currentDate <= addDays(activeTour.endDate, 1)
  );
  const shouldShowActiveTourPanel = Boolean(
    activeTour &&
      (activeTour.stage !== 'completed' ||
        (!isTourBannerDismissed && !hasPlayedPostTourMatch && isWithinPostTourGrace))
  );

  return (
    <div className="space-y-5 pb-20">
      
      {/* Hero Stadium Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
                  <img
            src={stadiumImg}
            alt="Stadium Pitch"
            referrerPolicy="no-referrer"
            className="w-full h-44 sm:h-56 object-cover"
          />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{state.season} シーズン（2026/27公式選手名鑑・最新データ基準） 監督キャリア進行中</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              {userClub?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-300 mt-1.5 font-medium">
              <span>目標: {userClub?.target}</span>
              <span aria-hidden="true">·</span>
              <span>理事会信頼: <strong className="text-emerald-400 font-mono">{state.boardConfidence}%</strong></span>
              <span aria-hidden="true">·</span>
              <span>サポーター支持: <strong className="text-blue-400 font-mono">{state.fanApproval}%</strong></span>
            </div>
          </div>

          {onOpenSmartphone && (
            <button
              type="button"
              onClick={onOpenSmartphone}
              className="relative inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/50 text-white font-bold text-xs sm:text-sm shadow-xl backdrop-blur-md transition-all active:scale-[0.98] cursor-pointer shrink-0 self-start sm:self-end"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>スマホ</span>
              {unreadSmartphone > 0 && (
                <span className="px-1.5 py-0.5 min-w-[20px] rounded-full bg-rose-500 text-white text-[10px] font-black font-mono tabular-nums text-center shadow">
                  {unreadSmartphone > 99 ? '99+' : unreadSmartphone}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Multi-Year Pre-Season Summer Tour Invitations Banner */}
      {isPreSeasonOpen && tourInvitations.length > 0 && (
        <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/35 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Trophy className="w-4 h-4" />
                <span>{currentYearNum}年プレシーズン・サマーツアー招待状（申込締切: {currentYearNum}年7月16日）</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                8クラブ・2グループ（各3試合）＋各組首位による一発決勝戦のサマーツアー招待状が届いています。参加大会を選択してください。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tourInvitations.map(t => {
              const peerNames = (t.participants || [])
                .filter(id => id !== state.userClubId)
                .slice(0, 4)
                .map(id => state.clubs[id]?.shortName || state.clubs[id]?.name || id)
                .join(' / ');
              return (
                <div
                  key={t.id}
                  className="rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 p-3.5 flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">{t.name}</h3>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold shrink-0">
                        {t.hostCountry}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{t.invitationReason}</p>
                    <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800/80 font-mono">
                      <div>開催期間: {t.startDate} 〜 {t.finalDate}</div>
                      <div>参加形態: {t.eligibilityCondition}</div>
                      {peerNames && <div className="truncate">主な参加: {peerNames} 他</div>}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-1.5 text-center text-[10px] font-mono">
                      <div className="bg-slate-900 rounded-lg py-1 px-1.5 border border-slate-800">
                        <div className="text-slate-500">参加報酬</div>
                        <div className="text-slate-200 font-bold">€{((t.participationReward ?? 0) / 1000000).toFixed(1)}M</div>
                      </div>
                      <div className="bg-slate-900 rounded-lg py-1 px-1.5 border border-slate-800">
                        <div className="text-slate-500">準優勝</div>
                        <div className="text-cyan-300 font-bold">€{((t.runnerUpPrize ?? 0) / 1000000).toFixed(1)}M</div>
                      </div>
                      <div className="bg-amber-950/40 rounded-lg py-1 px-1.5 border border-amber-500/30">
                        <div className="text-amber-300">優勝賞金</div>
                        <div className="text-amber-200 font-black">€{((t.championPrize ?? t.prizeMoney ?? 0) / 1000000).toFixed(1)}M</div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectPreSeason(t.id)}
                    className="w-full px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    このツアーに参戦する
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active / Completed Summer Tour Group Standings & Reward Summary Panel */}
      {shouldShowActiveTourPanel && activeTour && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Trophy className="w-4 h-4" />
                <span>{activeTour.name} · {activeTour.hostCountry}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                方式: グループA/B（各3試合）→ 各組1位のみ決勝進出（{activeTour.startDate} 〜 {activeTour.endDate}）
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                activeTour.stage === 'completed'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : activeTour.stage === 'final'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-sky-500/15 text-sky-300 border-sky-500/40'
              }`}>
                {activeTour.stage === 'completed'
                  ? '大会終了'
                  : activeTour.stage === 'final'
                    ? '決勝戦ステージ'
                    : 'グループリーグ進行中'}
              </span>
              {activeTour.stage === 'completed' && onDismissPreSeasonBanner && (
                <button
                  type="button"
                  onClick={() => onDismissPreSeasonBanner(currentYearNum)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="大会結果は大会タブ・ニュースに保持されます"
                >
                  <X className="w-3 h-3" />
                  <span>ホーム表示を閉じる</span>
                </button>
              )}
            </div>
          </div>

          {activeTour.stage === 'completed' && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-amber-950/40 border border-emerald-500/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    大会閉幕！優勝: {state.clubs[activeTour.championClubId || '']?.name || activeTour.championClubId}
                    {finalTourFixture && finalTourFixture.homeScore !== undefined
                      ? `（決勝 ${finalTourFixture.homeScore} - ${finalTourFixture.awayScore}）`
                      : ''}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  最終順位: <strong className="text-amber-300">{activeTour.userFinalPlacement}</strong>
                  {' · '}
                  獲得報酬: <strong className="text-emerald-400 font-mono">€{(activeTour.prizeAwarded / 1000000).toFixed(2)}M</strong>
                </div>
              </div>
              {activeTour.rewardProcessed && (
                <div className="text-xs font-mono bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 shrink-0">
                  <div className="text-[10px] text-slate-400">移籍予算反映</div>
                  <div className="text-white font-bold">
                    €{(activeTour.budgetBefore / 1000000).toFixed(1)}M → <span className="text-emerald-400">€{(activeTour.budgetAfter / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {finalTourFixture && finalTourFixture.homeClubId !== 'tbd' && (
            <div className="rounded-2xl bg-amber-950/25 border border-amber-500/35 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-amber-300">決勝戦（各組首位対決）</span>
              <span className="font-bold text-white">
                {state.clubs[finalTourFixture.homeClubId]?.name}
                <span className="mx-2 font-mono text-amber-300">
                  {finalTourFixture.status === 'finished'
                    ? `${finalTourFixture.homeScore} - ${finalTourFixture.awayScore}`
                    : 'VS'}
                </span>
                {state.clubs[finalTourFixture.awayClubId]?.name}
              </span>
              <span className="text-[11px] font-mono text-slate-400">{formatDateJP(finalTourFixture.date)}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTour.groups.map(grp => (
              <div key={grp.groupId} className="rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden">
                <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{grp.groupName}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">1位のみ決勝進出</span>
                </div>
                <table className="w-full text-[11px] text-left">
                  <thead className="text-slate-500 font-mono border-b border-slate-800/80">
                    <tr>
                      <th className="py-1.5 px-2 text-center w-7">#</th>
                      <th className="py-1.5 px-2">クラブ</th>
                      <th className="py-1.5 px-1.5 text-center">試</th>
                      <th className="py-1.5 px-1.5 text-center">勝</th>
                      <th className="py-1.5 px-1.5 text-center">分</th>
                      <th className="py-1.5 px-1.5 text-center">負</th>
                      <th className="py-1.5 px-1.5 text-center">差</th>
                      <th className="py-1.5 px-2 text-center font-bold text-slate-300">勝点</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {grp.standings.map((row, idx) => {
                      const isUser = row.clubId === state.userClubId;
                      return (
                        <tr
                          key={row.clubId}
                          className={
                            idx === 0
                              ? 'bg-emerald-950/25 text-emerald-200'
                              : isUser
                                ? 'bg-slate-800/40 text-white'
                                : 'text-slate-300'
                          }
                        >
                          <td className="py-1.5 px-2 text-center font-mono font-bold">{idx + 1}</td>
                          <td className="py-1.5 px-2 truncate max-w-[130px] font-semibold">
                            {row.clubName}
                            {isUser && <span className="ml-1 text-[9px] text-emerald-400">(自)</span>}
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-mono">{row.played}</td>
                          <td className="py-1.5 px-1.5 text-center font-mono">{row.won}</td>
                          <td className="py-1.5 px-1.5 text-center font-mono">{row.drawn}</td>
                          <td className="py-1.5 px-1.5 text-center font-mono">{row.lost}</td>
                          <td className="py-1.5 px-1.5 text-center font-mono">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                          <td className="py-1.5 px-2 text-center font-mono font-black text-white">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Match Card */}
      {nextFixture && opponentClub ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
            <span className="font-semibold text-emerald-400 uppercase tracking-wider font-mono">
              NEXT FIXTURE · {nextFixture.competitionName}
            </span>
            <span className="font-mono text-slate-300">{formatDateJP(nextFixture.date)}</span>
          </div>

          <div className="grid grid-cols-3 items-center py-2 sm:py-4">
            {/* Home Team */}
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-bold text-white text-base sm:text-xl shadow-lg mb-2"
                style={{ backgroundColor: isHomeMatch ? userClub?.primaryColor : opponentClub.primaryColor }}
              >
                {isHomeMatch ? userClub?.shortName : opponentClub.shortName}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {isHomeMatch ? userClub?.name : opponentClub.name}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {isHomeMatch ? 'HOME' : 'AWAY'}
              </span>
            </div>

            {/* Match VS / Time */}
            <div className="flex flex-col items-center text-center">
              <span className="text-xl sm:text-2xl font-black text-slate-400 tracking-wider font-display">
                VS
              </span>
              <span className="text-xs text-slate-400 mt-1">
                会場: {isHomeMatch ? userClub?.stadiumName : opponentClub.stadiumName}
              </span>
              {nextFixture.date === state.currentDate && (
                <span className="mt-2 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold animate-pulse">
                  本日キックオフ
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-bold text-white text-base sm:text-xl shadow-lg mb-2"
                style={{ backgroundColor: !isHomeMatch ? userClub?.primaryColor : opponentClub.primaryColor }}
              >
                {!isHomeMatch ? userClub?.shortName : opponentClub.shortName}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {!isHomeMatch ? userClub?.name : opponentClub.name}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {!isHomeMatch ? 'HOME' : 'AWAY'}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              ※スタメン選定や戦術変更は「戦術・編成」タブから調整できます。
            </div>
            <button
              type="button"
              onClick={() => onOpenMatch(nextFixture)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{nextFixture.date === state.currentDate ? '試合を開始する (Kickoff)' : '試合プレビュー・出場確認'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-sm">
          現在予定されている直近の公式戦はありません。「次の日へ」または期間スキップで日程を進めてください。
        </div>
      )}

      {/* Quick Status Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Transfer Budget */}
        <div 
          onClick={() => onNavigateTab('transfers')}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>移籍補強予算</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono">
            €{((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">市場探査・補強交渉へ →</div>
        </div>

        {/* Squad Status */}
        <div 
          onClick={() => onNavigateTab('tactics')}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>スカッド構成</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono">
            {userClub?.playerIds.length || 0}名
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">フォーメーション: {state.tactics.formation} →</div>
        </div>

        {/* Board Confidence */}
        <div 
          onClick={() => onNavigateTab('club')}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>理事会評価</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
            {state.boardConfidence}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">解任リスク: 極めて低い</div>
        </div>

        {/* Transfer Window Status */}
        <div 
          onClick={() => onNavigateTab('transfers')}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>移籍市場状況</span>
          </div>
          <div className="text-sm font-bold text-amber-300">
            {state.isTransferWindowOpen ? `開口中 (残${state.transferWindowClosingDays}日)` : '閉塞中'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">8月31日デッドライン</div>
        </div>
      </div>

      {/* Requirement 3: クラブの未来予想図 (Club Vision & Roadmap) */}
      {userClub && (() => {
        const vision = state.clubVision || generateClubVisionRoadmap(userClub, state.season);
        const isDiv2 = vision.division === 2 || userClub.division === 2 || userClub.league === 'j2-league';
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                      クラブの未来予想図 (Club Vision & Roadmap)
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isDiv2 ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {isDiv2 ? '【2部リーグ所属】昇格・地盤構築プラン' : '【1部リーグ所属】国内・大陸コンペ挑戦プラン'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    理事会期待値: 【{vision.boardPatienceLevel}】 · 補強方針: {vision.transferPolicy}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">取締役会評価:</span>
                <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                  state.boardConfidence >= 70 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  state.boardConfidence >= 40 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                }`}>
                  信頼度 {state.boardConfidence}% {state.boardConfidence < 20 ? '(解任危機)' : ''}
                </span>
              </div>
            </div>

            {/* Philosophy Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">クラブの指導・育成哲学</span>
                <span>{vision.overviewPhilosophy}</span>
              </div>
            </div>

            {/* Yearly Roadmap Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { year: 1, title: '今季の至上命題 (Year 1)', objective: vision.shortTermObjective, isPrimary: true },
                { year: 2, title: '中期プラン (Year 2)', objective: vision.midTermObjective, isPrimary: false },
                { year: 3, title: '長期ビジョン (Year 3〜5)', objective: vision.longTermObjective, isPrimary: false }
              ].map(item => (
                <div 
                  key={item.year}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                    item.isPrimary 
                      ? 'bg-slate-950 border-purple-500/50 ring-1 ring-purple-500/20' 
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/60">
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        item.isPrimary ? 'bg-purple-900/60 text-purple-200' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.title}
                      </span>
                    </div>

                    <div className="text-xs text-slate-200 leading-relaxed font-medium">
                      {item.objective}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">進捗状況</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.isPrimary ? '進行中' : '次期フェーズ'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Individual Concrete Goals */}
            {vision.goals && vision.goals.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">【具体的な達成条件・ロードマップ目標】</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {vision.goals.map(g => (
                    <div key={g.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2">
                      <Target className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{g.title}</span>
                          <span className="text-[10px] text-purple-300 font-mono">({g.yearTarget}年目)</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{g.description}</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-1">条件: {g.targetCondition}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Squad Growth Spotlight Widget (選手成長の可視化ハイライト) */}
      {userClub && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                選手成長ハイライト (Squad Development Spotlight)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('tactics')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>戦術ボードで全選手確認</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(state.players)
              .filter(p => p.clubId === state.userClubId)
              .map(p => {
                const initOvr = p.initialOvr ?? p.ovr;
                const exactOvr = p.exactOvr ?? p.ovr;
                const delta = Math.round((exactOvr - initOvr) * 10) / 10;
                return { player: p, delta };
              })
              .sort((a, b) => b.delta - a.delta)
              .slice(0, 4)
              .map(({ player: p, delta }) => (
                <div 
                  key={p.id}
                  onClick={() => onNavigateTab('tactics')}
                  className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 cursor-pointer hover:border-emerald-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">
                      {p.position}
                    </span>
                    <span 
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        delta > 0 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : delta < 0
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {delta > 0 ? `+${delta.toFixed(1)}` : delta < 0 ? `${delta.toFixed(1)}` : '±0.0'}
                    </span>
                  </div>

                  <div className="my-2">
                    <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.age}歳 · POT {p.potential || (p.ovr + 5)}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                    <span className="text-slate-400 text-[10px]">現在能力</span>
                    <span className="font-mono font-black text-white text-sm">OVR {p.ovr}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Breaking News Feed (Linked to Game Events) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">ゲーム連動型 最新ニュース & 移籍速報</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">{state.news.length}件</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {state.news.slice(0, 5).map(item => (
            <div key={item.id} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1 font-mono">
                <span className="text-slate-300">{formatDateJP(item.date)}</span>
                <span>·</span>
                <span className="uppercase text-emerald-400 font-semibold">{item.category}</span>
              </div>
              <h4 className="text-sm font-bold text-white hover:text-emerald-300 transition-colors">
                {item.headline}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
