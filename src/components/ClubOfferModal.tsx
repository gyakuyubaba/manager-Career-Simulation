import React, { useState, useMemo } from 'react';
import { Club, ManagerProfile, LeagueKey, Player } from '../types/game';
import { ALL_CLUBS } from '../data/clubsData';
import { J2_20_CLUBS } from '../data/jLeagueData';
import { ALL_EUROPEAN_2ND_DIVISION_CLUBS } from '../data/europeanSecondDivisionClubs';
import { buildCompletePlayersRegistry } from '../data/squadPopulator';
import { generateClubVisionRoadmap } from '../engine/clubVisionEngine';
import { 
  Trophy, 
  DollarSign, 
  Target, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Search, 
  Check, 
  Building2,
  ChevronRight,
  Globe2,
  UserCheck
} from 'lucide-react';

interface Props {
  manager: ManagerProfile;
  offers: Club[];
  players?: Record<string, Player>;
  onSelectClub: (clubId: string) => void;
  onBackToManagerCreation?: () => void;
}

const ALL_SELECTABLE_CLUBS: Club[] = [
  ...ALL_CLUBS,
  ...J2_20_CLUBS,
  ...ALL_EUROPEAN_2ND_DIVISION_CLUBS
];

const LEAGUES: { id: LeagueKey; name: string; flag: string; count: number }[] = [
  { id: 'j1-league', name: 'J1百年構想リーグ', flag: '🇯🇵', count: 20 },
  { id: 'j2-league', name: 'J2リーグ', flag: '🇯🇵', count: 20 },
  { id: 'premier-league', name: 'プレミアリーグ', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', count: 20 },
  { id: 'championship', name: 'EFLチャンピオンシップ', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', count: 24 },
  { id: 'laliga', name: 'ラ・リーガ', flag: '🇪🇸', count: 20 },
  { id: 'segunda-division', name: 'セグンダ・ディビシオン', flag: '🇪🇸', count: 22 },
  { id: 'bundesliga', name: 'ブンデスリーガ', flag: '🇩🇪', count: 18 },
  { id: '2-bundesliga', name: '2.ブンデスリーガ', flag: '🇩🇪', count: 18 },
  { id: 'serie-a', name: 'セリエA', flag: '🇮🇹', count: 20 },
  { id: 'serie-b', name: 'セリエB', flag: '🇮🇹', count: 20 },
  { id: 'ligue-1', name: 'リーグ・アン', flag: '🇫🇷', count: 18 },
  { id: 'ligue-2', name: 'リーグ・ドゥ', flag: '🇫🇷', count: 18 }
];

export const ClubOfferModal: React.FC<Props> = ({ manager, offers, players, onSelectClub, onBackToManagerCreation }) => {
  // Safe players registry
  const allPlayersMap = useMemo(() => {
    if (players && Object.keys(players).length > 500) {
      return players;
    }
    return buildCompletePlayersRegistry();
  }, [players]);

  // Default to first offer or Vissel Kobe if manager is Japanese
  const initialDefaultId = (manager.nationality === '日本'
    ? (offers.find(c => c.league === 'j1-league')?.id || 'vissel-kobe')
    : (offers[0]?.id || 'arsenal'));

  const [selectedClubId, setSelectedClubId] = useState<string>(initialDefaultId);
  const [viewMode, setViewMode] = useState<'offers' | 'all'>('offers');
  const [selectedLeague, setSelectedLeague] = useState<LeagueKey | 'all'>('j1-league');
  const [searchQuery, setSearchQuery] = useState('');

  // Find currently selected club from all selectable clubs (including J1, J2, and European clubs)
  const selectedClub = ALL_SELECTABLE_CLUBS.find(c => c.id === selectedClubId) || 
                       offers.find(c => c.id === selectedClubId) || 
                       offers[0] || 
                       ALL_SELECTABLE_CLUBS[0];

  // Players belonging to currently selected club
  const clubPlayers = useMemo(() => {
    if (!selectedClub) return [];
    const list = Object.values(allPlayersMap).filter(p => p.clubId === selectedClub.id);
    return list.sort((a, b) => b.ovr - a.ovr);
  }, [allPlayersMap, selectedClub?.id]);

  // Roadmap & Club Vision Preview for selected club
  const roadmapPreview = useMemo(() => {
    if (!selectedClub) return null;
    return generateClubVisionRoadmap(selectedClub);
  }, [selectedClub]);

  // Filtered clubs for "All Clubs" browse mode
  const filteredClubs = ALL_SELECTABLE_CLUBS.filter(c => {
    const matchLeague = selectedLeague === 'all' || c.league === selectedLeague;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = q === '' || 
      c.name.toLowerCase().includes(q) || 
      c.shortName.toLowerCase().includes(q) ||
      c.stadiumName.toLowerCase().includes(q);
    return matchLeague && matchSearch;
  });

  const handleSelectLeagueTab = (lgId: LeagueKey | 'all') => {
    setSelectedLeague(lgId);
    // Auto-select first club of selected league so preview and bottom bar update immediately
    const firstOfLeague = ALL_SELECTABLE_CLUBS.find(c => c.league === lgId);
    if (firstOfLeague) {
      setSelectedClubId(firstOfLeague.id);
    }
  };

  const handleOpenJ1Mode = () => {
    setViewMode('all');
    setSelectedLeague('j1-league');
    const firstJ1 = ALL_SELECTABLE_CLUBS.find(c => c.league === 'j1-league');
    if (firstJ1) {
      setSelectedClubId(firstJ1.id);
    }
  };

  const handleOpenJ2Mode = () => {
    setViewMode('all');
    setSelectedLeague('j2-league');
    const firstJ2 = ALL_SELECTABLE_CLUBS.find(c => c.league === 'j2-league');
    if (firstJ2) {
      setSelectedClubId(firstJ2.id);
    }
  };

  const isCurrentJ1 = selectedClub.league === 'j1-league';
  const isCurrentJ2 = selectedClub.league === 'j2-league';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100 flex flex-col">
      {/* Scrollable Container with Bottom Padding for Sticky Bar */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 pt-5 pb-44">
        
        {/* Top Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2026/27 欧州5大リーグ ＋ 明治安田J1百年構想リーグ＆J2（実名選手完全登録）</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            監督就任クラブの決定
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl mx-auto">
            {manager.name}監督（{manager.style} / {manager.specialty}）の招聘を希望するクラブ一覧です。推薦オファーに加え、<span className="text-amber-400 font-bold">26/27 J1百年構想リーグ（全20クラブ）</span>、<span className="text-cyan-400 font-bold">J2（全20クラブ）</span>および欧州主要5大リーグ（全96クラブ）から全選手登録済みの状態で自由に就任先を選択できます。
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setViewMode('offers')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'offers'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>★ 推薦オファー（5クラブ）</span>
          </button>

          <button
            type="button"
            onClick={handleOpenJ1Mode}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'all' && selectedLeague === 'j1-league'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-400/25 ring-2 ring-amber-300'
                : 'bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-amber-950/30 hover:border-amber-400'
            }`}
          >
            <span className="text-base">🇯🇵</span>
            <span>J1百年構想 (20クラブ)</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-950/40 text-[10px] text-amber-900 font-black border border-amber-500/40">
              26/27
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenJ2Mode}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'all' && selectedLeague === 'j2-league'
                ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-lg shadow-cyan-400/25 ring-2 ring-cyan-300'
                : 'bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400'
            }`}
          >
            <span className="text-base">🇯🇵</span>
            <span>J2 (20クラブ)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('all');
              if (selectedLeague === 'j1-league' || selectedLeague === 'j2-league') {
                setSelectedLeague('premier-league');
                const firstPL = ALL_SELECTABLE_CLUBS.find(c => c.league === 'premier-league');
                if (firstPL) setSelectedClubId(firstPL.id);
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'all' && selectedLeague !== 'j1-league' && selectedLeague !== 'j2-league'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>欧州5大リーグ（96クラブ）から選択</span>
          </button>

          {onBackToManagerCreation && (
            <button
              type="button"
              onClick={onBackToManagerCreation}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all cursor-pointer"
            >
              ← 監督設定に戻る
            </button>
          )}
        </div>

        {/* MODE 1: 5 OFFICIAL OFFERS */}
        {viewMode === 'offers' && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-400">推薦オファー（代理人が選定した5クラブ）</span>
              <button 
                type="button"
                onClick={handleOpenJ1Mode}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>J1クラブを探す</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {offers.map(club => {
                const isSelected = club.id === selectedClubId;
                const isJ1 = club.league === 'j1-league';
                const tagLabel = 
                  club.tier === 'Elite' ? '強豪タイトル' :
                  club.tier === 'Upper' ? '上位争い' :
                  club.tier === 'Mid' ? '中堅プロジェクト' : '残留＆再建';

                return (
                  <div
                    key={club.id}
                    onClick={() => setSelectedClubId(club.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? isJ1
                          ? 'bg-slate-850 border-amber-400 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/10'
                          : 'bg-slate-850 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-500/10'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {isSelected && (
                      <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center ${
                        isJ1 ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 text-slate-950'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0" 
                          style={{ backgroundColor: club.primaryColor }}
                        />
                        <span className={`text-[10px] font-bold truncate uppercase font-mono px-1.5 py-0.5 rounded ${
                          isJ1 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isJ1 ? '🇯🇵 J1 LEAGUE' : club.league.replace('-', ' ')}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white truncate pr-4">
                        {club.name}
                      </div>

                      <div className="text-[11px] text-emerald-400 font-semibold mt-1 font-mono">
                        補強予算 €{(club.transferBudget / 1000000).toFixed(1)}M
                      </div>

                      <div className="text-[10px] text-slate-400 mt-1 truncate">
                        本拠地: {club.stadiumName}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{tagLabel}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClub(club.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? isJ1 ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <span>就任する</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 2: BROWSE ALL 116 CLUBS BY LEAGUE */}
        {viewMode === 'all' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 mb-6 space-y-4">
            
            {/* League Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {LEAGUES.map(lg => {
                const isActive = selectedLeague === lg.id;
                const isJ1 = lg.id === 'j1-league';
                return (
                  <button
                    key={lg.id}
                    type="button"
                    onClick={() => handleSelectLeagueTab(lg.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? isJ1
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25 font-black'
                          : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : isJ1
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{lg.flag}</span>
                    <span>{lg.name}</span>
                    <span className="text-[10px] opacity-75">({lg.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="クラブ名・略称・スタジアム名で検索 (例: 神戸, 町田, アーセナル, レアル)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Club Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1 scrollbar-thin">
              {filteredClubs.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-slate-500">
                  該当するクラブが見つかりませんでした。検索条件を変更してください。
                </div>
              ) : (
                filteredClubs.map(c => {
                  const isSelected = c.id === selectedClubId;
                  const isJ1 = c.league === 'j1-league';
                  const isJ2 = c.league === 'j2-league';
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClubId(c.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? isJ1
                            ? 'bg-slate-850 border-amber-400 ring-2 ring-amber-400/30'
                            : isJ2
                              ? 'bg-slate-850 border-cyan-400 ring-2 ring-cyan-400/30'
                              : 'bg-slate-850 border-emerald-500 ring-2 ring-emerald-500/25'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div 
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" 
                              style={{ backgroundColor: c.primaryColor }}
                            />
                            <span className="text-[10px] text-slate-400 font-mono font-bold truncate">{c.shortName}</span>
                          </div>
                          {isSelected && (
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              isJ1 ? 'bg-amber-400 text-slate-950' : isJ2 ? 'bg-cyan-400 text-slate-950' : 'bg-emerald-500 text-slate-950'
                            }`}>
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-white truncate">{c.name}</div>
                        <div className="flex items-center justify-between text-[10px] mt-1 font-mono">
                          <span className="text-emerald-400">€{(c.transferBudget / 1000000).toFixed(1)}M</span>
                          <span className="text-amber-300/90 text-[9px] font-sans">選手 25名登録済</span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[9px] text-slate-400">{isJ1 ? 'J1百年構想' : isJ2 ? 'J2' : c.tier}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClub(c.id);
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? isJ1 ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : isJ2 ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          就任する →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Selected Club Details Card */}
        {selectedClub && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            
            {/* Header / Identity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg border border-white/20 shrink-0"
                  style={{ backgroundColor: selectedClub.primaryColor }}
                >
                  {selectedClub.shortName}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                      {selectedClub.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 font-medium">
                      {selectedClub.country}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase font-mono border ${
                      isCurrentJ1 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {isCurrentJ1 ? '🇯🇵 J1 LEAGUE' : selectedClub.league.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>本拠地: {selectedClub.stadiumName}（収容 {selectedClub.stadiumCapacity.toLocaleString()}人）</span>
                  </div>
                </div>
              </div>

              {/* Salary & Contract Offer */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 bg-slate-950/60 p-3 sm:p-0 rounded-xl sm:bg-transparent">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">提示契約期間</div>
                  <div className="text-xs sm:text-sm font-semibold text-white">3年契約 (2029年6月まで)</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">監督年俸オファー</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                    €{(selectedClub.tier === 'Elite' ? 3800000 : selectedClub.tier === 'Upper' ? 2200000 : selectedClub.tier === 'Mid' ? 1200000 : 650000).toLocaleString()} /年
                  </div>
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>移籍補強予算</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-white font-mono">
                  €{(selectedClub.transferBudget / 1000000).toFixed(1)}M
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  週給予算: €{(selectedClub.wageBudget / 1000).toFixed(0)}k/週
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <span>クラブ目標</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  {selectedClub.target}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  格付け: {selectedClub.tier} ランク
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>サポーターの期待</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-amber-300 truncate">
                  {selectedClub.fanExpectation}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  サポーター基盤: 非常に熱狂的
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>基本戦術システム</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-purple-300 font-mono">
                  {selectedClub.currentFormation}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  クラブ名声度: {selectedClub.reputation} / 100
                </div>
              </div>
            </div>

            {/* Board Project Message */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-1">フロント・取締役会からのメッセージ</div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                「{manager.name}監督、貴殿の【{manager.style}】の指導方針と【{manager.specialty}】の実績に深く敬意を表します。当クラブが今季掲げる【{selectedClub.target}】を成し遂げるため、チーム編成の全権を委託し、戦力補強とアカデミー改革の全面バックアップをお約束いたします。」
              </p>
            </div>

            {/* Club Vision & Multi-Year Roadmap (クラブの未来予想図) */}
            {roadmapPreview && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs sm:text-sm font-bold text-white">
                      クラブの未来予想図 (Club Vision & Multi-Year Roadmap)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      理事会方針: {roadmapPreview.boardPatienceLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {roadmapPreview.division === 2 ? '2部リーグ (昇格挑戦)' : '1部トップリーグ'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {roadmapPreview.overviewPhilosophy}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-emerald-400 font-bold block mb-1">【1年目・短期目標】</span>
                    <span className="text-xs text-slate-200 leading-snug block">{roadmapPreview.shortTermObjective}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-blue-400 font-bold block mb-1">【2年目・中期目標】</span>
                    <span className="text-xs text-slate-200 leading-snug block">{roadmapPreview.midTermObjective}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-amber-400 font-bold block mb-1">【3〜5年後・長期ビジョン】</span>
                    <span className="text-xs text-slate-200 leading-snug block">{roadmapPreview.longTermObjective}</span>
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>補強方針: {roadmapPreview.transferPolicy}</span>
                </div>
              </div>
            )}

            {/* Squad Roster Preview (2026/27 Centenary & European Complete Authentic Squad) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {selectedClub.name} 所属登録選手（2026/27最新登録メンバー 全{clubPlayers.length}名）
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">
                    実在選手・背番号・ポジション完全登録済
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {clubPlayers.map((p, idx) => {
                  const posBg = 
                    p.position === 'GK' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position) ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position) ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    'bg-rose-500/20 text-rose-300 border-rose-500/30';

                  return (
                    <div 
                      key={p.id || idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 text-center text-[10px] font-mono text-slate-400 font-bold shrink-0">
                          #{p.shirtNumber || (idx + 1)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${posBg}`}>
                          {p.position}
                        </span>
                        <div className="truncate min-w-0">
                          <span className="text-white font-medium truncate block">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.nationality} · {p.age}歳
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                          p.ovr >= 80 ? 'bg-amber-500/20 text-amber-300' :
                          p.ovr >= 74 ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {p.ovr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Fixed Sticky Action Bar at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-4 py-3 sm:py-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 border border-white/20"
              style={{ backgroundColor: selectedClub.primaryColor }}
            >
              {selectedClub.shortName}
            </div>
            <div className="truncate">
              <div className="text-xs text-slate-400 truncate">
                選択中: <span className="text-white font-bold">{selectedClub.name}</span> ({isCurrentJ1 ? '🇯🇵 J1百年構想リーグ' : isCurrentJ2 ? '🇯🇵 J2リーグ' : selectedClub.league.replace('-', ' ')}) · <span className="text-emerald-400 font-semibold">25名登録済</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-mono">
                補強予算 €{(selectedClub.transferBudget / 1000000).toFixed(1)}M · 提示年俸 €{(selectedClub.tier === 'Elite' ? 3800000 : selectedClub.tier === 'Upper' ? 2200000 : selectedClub.tier === 'Mid' ? 1200000 : 650000).toLocaleString()}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectClub(selectedClub.id)}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-[0.98] ${
              isCurrentJ1 
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-300'
                : isCurrentJ2
                  ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 shadow-cyan-500/25 ring-2 ring-cyan-300'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
            }`}
          >
            <span>{selectedClub.name} の監督就任契約にサインする</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

        </div>
      </div>

    </div>
  );
};
