import React, { useState } from 'react';
import { GameWorldState, ScoutProspect } from '../../types/game';
import { 
  SCOUT_REGIONS, canScoutThisMonth, dispatchMonthlyScout, signScoutedProspect 
} from '../../engine/scoutEngine';
import { 
  Compass, Sparkles, CheckCircle2, AlertCircle, Shield, Award, UserCheck, Star, 
  MapPin, Send, Zap, ChevronRight
} from 'lucide-react';

interface Props {
  state: GameWorldState;
  onUpdateState: (newState: GameWorldState) => void;
}

export const ScoutTab: React.FC<Props> = ({ state, onUpdateState }) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>(SCOUT_REGIONS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<'japan' | 'overseas'>('japan');
  const [signingModalProspect, setSigningModalProspect] = useState<ScoutProspect | null>(null);
  const [asType2Registration, setAsType2Registration] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const availableThisMonth = canScoutThisMonth(state);
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;

  const currentProspects = state.scoutMonthlyState?.prospects || [];
  const signedPlayerId = state.scoutMonthlyState?.signedPlayerId;

  // Handle Dispatch
  const handleDispatch = () => {
    if (!availableThisMonth) return;
    const { prospects, updatedState } = dispatchMonthlyScout(state, selectedRegionId);
    onUpdateState({
      ...state,
      ...updatedState
    });
    setActionMessage(`【スカウト完了】5名の有望選手候補を発掘しました！レポートを確認してください。`);
  };

  // Handle Signing
  const handleConfirmSign = () => {
    if (!signingModalProspect) return;
    try {
      const { updatedState, signedPlayer, newsItem } = signScoutedProspect(
        state, 
        signingModalProspect.id, 
        asType2Registration
      );
      onUpdateState(updatedState);
      setSigningModalProspect(null);
      setActionMessage(`🎉 ${signedPlayer.name}選手との契約（${asType2Registration ? '2種登録' : 'プロ契約'}）が完了しました！チーム編成に合流しました。`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredRegions = SCOUT_REGIONS.filter(r => r.category === selectedCategory);
  const activeRegion = SCOUT_REGIONS.find(r => r.id === selectedRegionId) || SCOUT_REGIONS[0];

  return (
    <div className="space-y-5 pb-20">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white font-display">スカウト網・次世代有望株発掘</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            月1回、日本国内の名門高校（青森山田・市船・静学・大津等）や海外ユース拠点へスカウトを派遣し、未来のスターを獲得できます。
          </p>
        </div>

        {/* Monthly Status Badge */}
        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold ${
          availableThisMonth
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-slate-800 border-slate-700 text-slate-400'
        }`}>
          {availableThisMonth ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>今月のスカウト: 派遣可能 ({state.currentDate.slice(0, 7)})</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-slate-500" />
              <span>今月派遣済み (翌月1日に再派遣可能)</span>
            </>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-emerald-400 hover:text-white font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Region Selector Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">派遣対象地域を選択</h3>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('japan')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedCategory === 'japan' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇯🇵 国内高校・ユース
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('overseas')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedCategory === 'overseas' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌍 海外アカデミー
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {filteredRegions.map(region => (
            <div
              key={region.id}
              onClick={() => setSelectedRegionId(region.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                selectedRegionId === region.id
                  ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 font-bold">
                <span className="text-white">{region.name}</span>
                {selectedRegionId === region.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                {region.description}
              </p>
              <div className="text-[10px] text-emerald-400/90 font-mono">
                重点項目: {region.focusTraits}
              </div>
            </div>
          ))}
        </div>

        {/* Dispatch Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
          <div className="text-xs text-slate-400">
            選択地域: <strong className="text-white">{activeRegion.name}</strong>
          </div>

          <button
            type="button"
            disabled={!availableThisMonth}
            onClick={handleDispatch}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              availableThisMonth
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>スカウトを派遣して有望選手を発掘 (月1回)</span>
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* PROSPECTS REPORT (5 PLAYERS) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {currentProspects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white font-display">スカウティングレポート（候補5名）</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              ※ 今月獲得できる選手は最大1名です。
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProspects.map((prospect, idx) => {
              const isGenerational = prospect.isGenerationalTalent;
              const isSigned = signedPlayerId === prospect.id || state.players[`signed_${prospect.id}`] !== undefined;
              const alreadySignedAnother = !!signedPlayerId && !isSigned;

              return (
                <div
                  key={prospect.id}
                  className={`p-5 rounded-3xl border transition-all relative flex flex-col justify-between ${
                    isGenerational
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-950/50 border-amber-400 shadow-xl shadow-amber-500/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
                  }`}
                >
                  {isGenerational && (
                    <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Star className="w-3 h-3 fill-slate-950" />
                      <span>10年に1人の怪物・超新星</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                            {prospect.position}
                          </span>
                          <h4 className="text-sm font-bold text-white">{prospect.name}</h4>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {prospect.nationality} · {prospect.age}歳 · 利き足: {prospect.preferredFoot}
                        </div>
                        <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
                          {prospect.schoolOrAcademy ? `🏫 ${prospect.schoolOrAcademy}` : `📍 ${prospect.originRegion}`}
                        </div>
                      </div>

                      {/* Ratings Badge */}
                      <div className="text-right font-mono">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[10px] text-slate-400">OVR</span>
                          <span className={`text-base font-black ${isGenerational ? 'text-amber-300 text-lg' : 'text-emerald-400'}`}>
                            {prospect.ovr}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[10px] text-slate-400">POT</span>
                          <span className="text-xs font-bold text-amber-300">
                            {prospect.potential}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scout Report Note */}
                    <div className={`p-3 rounded-2xl text-[11px] leading-relaxed border ${
                      isGenerational
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}>
                      {prospect.scoutReport}
                    </div>

                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-6 gap-1 bg-slate-950/40 p-2 rounded-xl text-center text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500 block">PAC</span>
                        <span className="font-bold text-white">{prospect.pace}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">SHO</span>
                        <span className="font-bold text-white">{prospect.shooting}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">PAS</span>
                        <span className="font-bold text-white">{prospect.passing}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">DRI</span>
                        <span className="font-bold text-white">{prospect.dribbling}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">DEF</span>
                        <span className="font-bold text-white">{prospect.defending}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">PHY</span>
                        <span className="font-bold text-white">{prospect.physical}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    {isSigned ? (
                      <div className="w-full py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>獲得・契約済み</span>
                      </div>
                    ) : alreadySignedAnother ? (
                      <div className="w-full py-2 bg-slate-800/60 text-slate-500 rounded-xl text-center text-xs">
                        今月は別選手を獲得済み
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSigningModalProspect(prospect);
                            setAsType2Registration(false);
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isGenerational
                              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-black'
                              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                          }`}
                        >
                          プロ契約する
                        </button>

                        {prospect.isType2Eligible && (
                          <button
                            type="button"
                            onClick={() => {
                              setSigningModalProspect(prospect);
                              setAsType2Registration(true);
                            }}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            2種登録
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* SIGNING CONFIRMATION MODAL */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {signingModalProspect && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
                ✍️
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {asType2Registration ? '2種登録（特別指定・高校生）の締結' : 'プロ契約の締結確認'}
                </h3>
                <p className="text-xs text-slate-400">
                  {signingModalProspect.name} 選手 ({signingModalProspect.age}歳 · {signingModalProspect.position})
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">総合値 / 潜在能力:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {signingModalProspect.ovr} / {signingModalProspect.potential}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">所属元・高校:</span>
                <span className="text-white font-semibold">
                  {signingModalProspect.schoolOrAcademy || signingModalProspect.originRegion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">契約区分:</span>
                <span className={`font-bold ${asType2Registration ? 'text-purple-400' : 'text-emerald-400'}`}>
                  {asType2Registration ? '2種登録（高校在学中）' : 'プロ契約 (3年)'}
                </span>
              </div>

              {asType2Registration && (
                <div className="mt-2 p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-xl text-[11px] text-purple-200">
                  ⚠️ 2種登録選手は高校の公式戦（選手権予選・本大会、インターハイなど）と日程が重複する公式戦には出場できません。
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSigningModalProspect(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmSign}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                契約を正式締結する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
