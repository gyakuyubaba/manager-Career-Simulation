import React, { useState, useMemo } from 'react';
import { GameWorldState, LeagueKey, Player, Position } from '../../types/game';
import { generateBallonDorCandidates } from '../../engine/ballonDorEngine';
import { 
  Trophy, Search, Shield, Zap, Flame, Award, 
  ExternalLink, X, TrendingUp, AlertTriangle
} from 'lucide-react';

interface Props {
  state: GameWorldState;
  onSelectPlayer?: (playerId: string) => void;
}

const STATS_LEAGUES: { key: LeagueKey | 'all'; label: string }[] = [
  { key: 'all', label: '全リーグ総合' },
  { key: 'premier-league', label: 'Premier League' },
  { key: 'laliga', label: 'LaLiga' },
  { key: 'bundesliga', label: 'Bundesliga' },
  { key: 'serie-a', label: 'Serie A' },
  { key: 'ligue-1', label: 'Ligue 1' },
  { key: 'j1-league', label: 'J1リーグ' },
  { key: 'j2-league', label: 'J2リーグ' },
  { key: 'championship', label: 'Championship' }
];

export const PlayerStatsTab: React.FC<Props> = ({ state, onSelectPlayer }) => {
  const [selectedLeague, setSelectedLeague] = useState<LeagueKey | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<'scorers' | 'assists' | 'gk' | 'ratings' | 'minutes' | 'cards' | 'ballondor'>('scorers');
  const [statType, setStatType] = useState<'league' | 'cup' | 'total'>('total');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);

  // Filter players by league & search
  const filteredPlayers = useMemo(() => {
    return Object.values(state.players).filter(p => {
      if (p.clubId === 'free_agent') return false;
      const club = state.clubs[p.clubId];
      if (!club) return false;

      // League filter
      if (selectedLeague !== 'all' && club.league !== selectedLeague) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesClub = club.name.toLowerCase().includes(q) || club.shortName?.toLowerCase().includes(q);
        const matchesParentClub = p.parentClubId && state.clubs[p.parentClubId]?.name.toLowerCase().includes(q);
        return matchesName || matchesClub || matchesParentClub;
      }

      return true;
    });
  }, [state.players, state.clubs, selectedLeague, searchQuery]);

  // Rankings
  const topScorers = useMemo(() => {
    return [...filteredPlayers]
      .filter(p => p.position !== 'GK')
      .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0) || (b.stats?.avgRating || 0) - (a.stats?.avgRating || 0))
      .slice(0, 30);
  }, [filteredPlayers]);

  const topAssists = useMemo(() => {
    return [...filteredPlayers]
      .filter(p => p.position !== 'GK')
      .sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0) || (b.stats?.avgRating || 0) - (a.stats?.avgRating || 0))
      .slice(0, 30);
  }, [filteredPlayers]);

  const topGKs = useMemo(() => {
    return [...filteredPlayers]
      .filter(p => p.position === 'GK')
      .map(gk => {
        const apps = gk.stats?.appearances || 0;
        const cs = gk.stats?.cleanSheets || 0;
        const saves = gk.stats?.saves || Math.round(apps * 3.4);
        const conceded = gk.stats?.goalsConceded || Math.max(0, apps * 1.2 - cs);
        const concededPerMatch = apps > 0 ? (conceded / apps).toFixed(2) : '0.00';
        return {
          ...gk,
          derivedSaves: saves,
          derivedConceded: Math.round(conceded),
          derivedConcededRate: concededPerMatch
        };
      })
      .sort((a, b) => (b.stats?.cleanSheets || 0) - (a.stats?.cleanSheets || 0) || b.derivedSaves - a.derivedSaves)
      .slice(0, 30);
  }, [filteredPlayers]);

  const topRatings = useMemo(() => {
    return [...filteredPlayers]
      .filter(p => (p.stats?.appearances || 0) >= 3 || (p.stats?.minutes || 0) >= 180)
      .sort((a, b) => (b.stats?.avgRating || 0) - (a.stats?.avgRating || 0))
      .slice(0, 30);
  }, [filteredPlayers]);

  const topMinutes = useMemo(() => {
    return [...filteredPlayers]
      .sort((a, b) => (b.stats?.minutes || 0) - (a.stats?.minutes || 0))
      .slice(0, 30);
  }, [filteredPlayers]);

  const topCards = useMemo(() => {
    return [...filteredPlayers]
      .map(p => ({
        ...p,
        totalCardsScore: (p.stats?.redCards || 0) * 3 + (p.stats?.yellowCards || 0)
      }))
      .filter(p => p.totalCardsScore > 0)
      .sort((a, b) => b.totalCardsScore - a.totalCardsScore)
      .slice(0, 30);
  }, [filteredPlayers]);

  // Ballon d'Or Candidates
  const ballonDorCandidates = useMemo(() => {
    if (state.ballonDorRankings && state.ballonDorRankings.length > 0) {
      return state.ballonDorRankings;
    }
    return generateBallonDorCandidates(state);
  }, [state.ballonDorRankings, state]);

  return (
    <div className="space-y-5 pb-20">
      
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-display">個人成績・ランキング (Player Stats)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            得点王・アシスト・守護神GK・出場時間・警告数およびバロンドール年間オッズ予想です。
          </p>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="選手名・クラブ名で検索..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory('scorers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeCategory === 'scorers' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          ⚽ 得点ランキング
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('assists')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeCategory === 'assists' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          🎯 アシスト
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('gk')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeCategory === 'gk' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          🧤 GKランキング
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('ratings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeCategory === 'ratings' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          ⭐ 平均評価点
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('minutes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeCategory === 'minutes' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          ⏱️ 出場時間
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('cards')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeCategory === 'cards' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          🟨🟥 警告・退場
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('ballondor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeCategory === 'ballondor' ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'bg-slate-900 border border-amber-500/30 text-amber-300 hover:bg-slate-800'
          }`}
        >
          <span>🏆</span>
          <span>バロンドール予想・オッズ</span>
        </button>
      </div>

      {/* Sub-Filters: League Selector & Stat Type Toggle (only for stats, not ballondor) */}
      {activeCategory !== 'ballondor' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
          {/* League Dropdown/Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {STATS_LEAGUES.map(l => (
              <button
                key={l.key}
                type="button"
                onClick={() => setSelectedLeague(l.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedLeague === l.key
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Stat Type Toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800 self-start sm:self-auto text-[11px]">
            <button
              type="button"
              onClick={() => setStatType('total')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                statType === 'total' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              通算
            </button>
            <button
              type="button"
              onClick={() => setStatType('league')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                statType === 'league' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              リーグ戦
            </button>
            <button
              type="button"
              onClick={() => setStatType('cup')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                statType === 'cup' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              カップ戦
            </button>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. TOP SCORERS (得点ランキング) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeCategory === 'scorers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>得点ランキング TOP 30 (ゴール数・決定力)</span>
            <span className="text-slate-500 font-mono">選手をクリックして詳細プロフィール表示</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/40 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center w-12">順位</th>
                  <th className="py-3 px-4">選手名</th>
                  <th className="py-3 px-4">所属クラブ</th>
                  <th className="py-3 px-3 text-center">Pos</th>
                  <th className="py-3 px-3 text-center">年齢</th>
                  <th className="py-3 px-3 text-center">出場</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400 text-sm">ゴール</th>
                  <th className="py-3 px-3 text-center">アシスト</th>
                  <th className="py-3 px-3 text-center">平均採点</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topScorers.map((p, idx) => {
                  const club = state.clubs[p.clubId];
                  const isUserPlayer = p.clubId === state.userClubId;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setInspectingPlayer(p)}
                      className={`cursor-pointer transition-colors ${
                        isUserPlayer ? 'bg-emerald-950/20 text-emerald-300 font-semibold' : 'hover:bg-slate-800/30 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white hover:text-emerald-400 transition-colors">
                            {p.name}
                          </span>
                          {p.isLoaned && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              ローン中
                            </span>
                          )}
                          {p.isType2Registered && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              2種登録
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {club?.name || p.clubId}
                        {p.parentClubId && (
                          <span className="block text-[10px] text-slate-500">
                            (元所属: {state.clubs[p.parentClubId]?.name || p.parentClubId})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">{p.position}</td>
                      <td className="py-3 px-3 text-center font-mono">{p.age}</td>
                      <td className="py-3 px-3 text-center font-mono">{p.stats?.appearances || 0}</td>
                      <td className="py-3 px-4 text-center font-mono font-black text-emerald-400 text-sm">
                        {p.stats?.goals || 0}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">{p.stats?.assists || 0}</td>
                      <td className="py-3 px-3 text-center font-mono font-semibold">
                        {p.stats?.avgRating && p.stats.avgRating > 0 ? p.stats.avgRating.toFixed(2) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. TOP ASSISTS (アシストランキング) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeCategory === 'assists' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>アシストランキング TOP 30 (チャンスメイク・パス配給)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/40 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center w-12">順位</th>
                  <th className="py-3 px-4">選手名</th>
                  <th className="py-3 px-4">所属クラブ</th>
                  <th className="py-3 px-3 text-center">Pos</th>
                  <th className="py-3 px-3 text-center">出場</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400 text-sm">アシスト</th>
                  <th className="py-3 px-3 text-center">ゴール</th>
                  <th className="py-3 px-3 text-center">平均採点</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topAssists.map((p, idx) => {
                  const club = state.clubs[p.clubId];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setInspectingPlayer(p)}
                      className="cursor-pointer hover:bg-slate-800/30 text-slate-300"
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{club?.name}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">{p.position}</td>
                      <td className="py-3 px-3 text-center font-mono">{p.stats?.appearances || 0}</td>
                      <td className="py-3 px-4 text-center font-mono font-black text-emerald-400 text-sm">
                        {p.stats?.assists || 0}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{p.stats?.goals || 0}</td>
                      <td className="py-3 px-3 text-center font-mono">
                        {p.stats?.avgRating && p.stats.avgRating > 0 ? p.stats.avgRating.toFixed(2) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. GK RANKING (ゴールキーパー・クリーンシート・セーブ数・失点率) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeCategory === 'gk' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>GKランキング (クリーンシート数・セーブ数・失点数・1試合平均失点率)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/40 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center w-12">順位</th>
                  <th className="py-3 px-4">GK名</th>
                  <th className="py-3 px-4">所属クラブ</th>
                  <th className="py-3 px-3 text-center">出場試合</th>
                  <th className="py-3 px-4 text-center font-bold text-amber-300 text-sm">無失点 (CS)</th>
                  <th className="py-3 px-3 text-center text-blue-400 font-bold">セーブ数</th>
                  <th className="py-3 px-3 text-center text-rose-400">失点数</th>
                  <th className="py-3 px-3 text-center font-mono">1試合平均失点</th>
                  <th className="py-3 px-3 text-center">評価点</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topGKs.map((gk, idx) => {
                  const club = state.clubs[gk.clubId];
                  return (
                    <tr
                      key={gk.id}
                      onClick={() => setInspectingPlayer(gk)}
                      className="cursor-pointer hover:bg-slate-800/30 text-slate-300"
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-white">{gk.name}</td>
                      <td className="py-3 px-4 text-slate-300">{club?.name}</td>
                      <td className="py-3 px-3 text-center font-mono">{gk.stats?.appearances || 0}</td>
                      <td className="py-3 px-4 text-center font-mono font-black text-amber-300 text-sm">
                        {gk.stats?.cleanSheets || 0}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-400">
                        {gk.derivedSaves}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-rose-400">
                        {gk.derivedConceded}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                        {gk.derivedConcededRate}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {gk.stats?.avgRating && gk.stats.avgRating > 0 ? gk.stats.avgRating.toFixed(2) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 4. BALLON D'OR PREDICTIONS & ODDS (バロンドール予想・オッズ) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeCategory === 'ballondor' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-3xl p-5 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner">
                  🏆
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white font-display">バロンドール年間予想・オッズ</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                      欧州30名ノミネート
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/80 mt-1">
                    欧州主要リーグ所属選手を対象に、ゴール・アシスト・平均評価点・タイトル獲得実績からAIが受賞確率（％）をリアルタイム算出。
                  </p>
                </div>
              </div>

              {state.ballonDorWinnerAnnounced && (
                <div className="bg-amber-400/10 border border-amber-400/40 px-4 py-2 rounded-2xl flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-[10px] text-amber-300 block font-bold">年間最優秀選手（バロンドール受賞）</span>
                    <span className="text-xs font-black text-white">
                      {state.players[state.ballonDorWinnerId || '']?.name || '発表済み'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Candidates Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300">バロンドール候補者30名一覧（Jリーグ選手は対象外）</span>
              <span className="text-slate-400 font-mono">11月下旬 パリ・シャトレ座にて授賞式開催</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">予想順位</th>
                    <th className="py-3 px-4">候補選手</th>
                    <th className="py-3 px-4">所属クラブ</th>
                    <th className="py-3 px-3 text-center">国籍</th>
                    <th className="py-3 px-3 text-center">Pos</th>
                    <th className="py-3 px-3 text-center">OVR</th>
                    <th className="py-3 px-3 text-center text-emerald-400 font-bold">得点</th>
                    <th className="py-3 px-3 text-center text-blue-400 font-bold">アシスト</th>
                    <th className="py-3 px-3 text-center">平均採点</th>
                    <th className="py-3 px-4 text-center font-black text-amber-300 text-sm">受賞確率 (%)</th>
                    <th className="py-3 px-4">現地評価・総括</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ballonDorCandidates.map((c) => {
                    const isWinner = state.ballonDorWinnerAnnounced && state.ballonDorWinnerId === c.playerId;

                    return (
                      <tr
                        key={c.playerId}
                        className={`transition-colors ${
                          isWinner
                            ? 'bg-amber-950/40 text-amber-200 border-l-4 border-l-amber-400 font-bold'
                            : c.rank <= 3
                            ? 'bg-amber-950/15 text-slate-200 font-semibold'
                            : 'hover:bg-slate-800/30 text-slate-300'
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-mono font-bold text-sm">
                          {c.rank === 1 ? '🥇 1' : c.rank === 2 ? '🥈 2' : c.rank === 3 ? '🥉 3' : c.rank}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{c.playerName}</span>
                            {isWinner && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-slate-950 font-black">
                                受賞決定
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{c.clubName}</td>
                        <td className="py-3 px-3 text-center text-slate-400">{c.nationality}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">{c.position}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{c.ovr}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{c.goals}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-blue-400">{c.assists}</td>
                        <td className="py-3 px-3 text-center font-mono font-semibold">{c.avgRating.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono font-black text-amber-300 text-sm">
                              {c.winProbability}%
                            </span>
                            <div className="w-16 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                              <div
                                className="bg-amber-400 h-full rounded-full"
                                style={{ width: `${Math.min(100, c.winProbability * 2.5)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-400 truncate max-w-[240px]">
                          {c.summary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 5. RATINGS / MINUTES / CARDS TABLES */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeCategory === 'ratings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 text-xs font-bold text-slate-300">
            平均評価点ランキング TOP 30 (安定した高パフォーマンス)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/40 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center w-12">順位</th>
                  <th className="py-3 px-4">選手名</th>
                  <th className="py-3 px-4">所属クラブ</th>
                  <th className="py-3 px-3 text-center">Pos</th>
                  <th className="py-3 px-3 text-center">出場</th>
                  <th className="py-3 px-3 text-center">得点</th>
                  <th className="py-3 px-3 text-center">アシスト</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400 text-sm">平均評価点</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topRatings.map((p, idx) => (
                  <tr key={p.id} onClick={() => setInspectingPlayer(p)} className="cursor-pointer hover:bg-slate-800/30 text-slate-300">
                    <td className="py-3 px-3 text-center font-mono font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-4 text-slate-300">{state.clubs[p.clubId]?.name}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">{p.position}</td>
                    <td className="py-3 px-3 text-center font-mono">{p.stats?.appearances || 0}</td>
                    <td className="py-3 px-3 text-center font-mono">{p.stats?.goals || 0}</td>
                    <td className="py-3 px-3 text-center font-mono">{p.stats?.assists || 0}</td>
                    <td className="py-3 px-4 text-center font-mono font-black text-emerald-400 text-sm">
                      {p.stats?.avgRating && p.stats.avgRating > 0 ? p.stats.avgRating.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeCategory === 'minutes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 text-xs font-bold text-slate-300">
            総出場時間ランキング TOP 30 (鉄人・チームの中核)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/40 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center w-12">順位</th>
                  <th className="py-3 px-4">選手名</th>
                  <th className="py-3 px-4">所属クラブ</th>
                  <th className="py-3 px-3 text-center">Pos</th>
                  <th className="py-3 px-3 text-center">スタメン</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400 text-sm">総出場時間 (分)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topMinutes.map((p, idx) => (
                  <tr key={p.id} onClick={() => setInspectingPlayer(p)} className="cursor-pointer hover:bg-slate-800/30 text-slate-300">
                    <td className="py-3 px-3 text-center font-mono font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-4 text-slate-300">{state.clubs[p.clubId]?.name}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">{p.position}</td>
                    <td className="py-3 px-3 text-center font-mono">{p.stats?.starts || 0}</td>
                    <td className="py-3 px-4 text-center font-mono font-black text-emerald-400 text-sm">
                      {p.stats?.minutes || 0} 分
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeCategory === 'cards' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 text-xs font-bold text-slate-300">
            警告・退場数ランキング TOP 30 (激しい守備・規律管理)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/40 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center w-12">順位</th>
                  <th className="py-3 px-4">選手名</th>
                  <th className="py-3 px-4">所属クラブ</th>
                  <th className="py-3 px-3 text-center">Pos</th>
                  <th className="py-3 px-3 text-center text-amber-300 font-bold">イエロー (🟨)</th>
                  <th className="py-3 px-3 text-center text-rose-400 font-bold">レッド (🟥)</th>
                  <th className="py-3 px-3 text-center">現在出場停止</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topCards.map((p, idx) => (
                  <tr key={p.id} onClick={() => setInspectingPlayer(p)} className="cursor-pointer hover:bg-slate-800/30 text-slate-300">
                    <td className="py-3 px-3 text-center font-mono font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-4 text-slate-300">{state.clubs[p.clubId]?.name}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">{p.position}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-300">
                      {p.stats?.yellowCards || 0}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-rose-400">
                      {p.stats?.redCards || 0}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.suspension?.isSuspended ? (
                        <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                          停止中 (残{p.suspension.matchesRemaining}戦)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">なし</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* PLAYER DETAIL MODAL */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {inspectingPlayer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setInspectingPlayer(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {inspectingPlayer.position}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{inspectingPlayer.name}</h3>
                  <span className="font-mono text-xs text-slate-400">#{inspectingPlayer.shirtNumber}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {state.clubs[inspectingPlayer.clubId]?.name || inspectingPlayer.clubId}
                  {inspectingPlayer.isLoaned && inspectingPlayer.parentClubId && (
                    <span className="text-blue-400 ml-1">
                      (所属元: {state.clubs[inspectingPlayer.parentClubId]?.name || inspectingPlayer.parentClubId})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span>{inspectingPlayer.nationality}</span>
                  <span>·</span>
                  <span>{inspectingPlayer.age}歳 ({inspectingPlayer.birthDate})</span>
                  <span>·</span>
                  <span>利き足: {inspectingPlayer.preferredFoot}</span>
                </div>
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">総合値 (OVR)</span>
                <span className="text-base font-black text-emerald-400">{inspectingPlayer.ovr}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">潜在能力 (POT)</span>
                <span className="text-base font-black text-amber-300">{inspectingPlayer.potential}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">市場価値</span>
                <span className="text-xs font-bold text-white">€{(inspectingPlayer.marketValue / 1000000).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">週給</span>
                <span className="text-xs font-bold text-slate-300">€{(inspectingPlayer.wage / 1000).toFixed(0)}k</span>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400">2026/27 シーズン公式戦スタッツ</h4>
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">出場試合</span>
                  <span className="font-bold text-white">{inspectingPlayer.stats?.appearances || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">ゴール</span>
                  <span className="font-bold text-emerald-400">{inspectingPlayer.stats?.goals || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">アシスト</span>
                  <span className="font-bold text-blue-400">{inspectingPlayer.stats?.assists || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">平均採点</span>
                  <span className="font-bold text-white">
                    {inspectingPlayer.stats?.avgRating && inspectingPlayer.stats.avgRating > 0 ? inspectingPlayer.stats.avgRating.toFixed(2) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">クリーンシート</span>
                  <span className="font-bold text-amber-300">{inspectingPlayer.stats?.cleanSheets || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">出場時間</span>
                  <span className="font-bold text-slate-300">{inspectingPlayer.stats?.minutes || 0} 分</span>
                </div>
              </div>
            </div>

            {/* Loan info or Type 2 Info */}
            {inspectingPlayer.isType2Registered && (
              <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-xs text-purple-300">
                <span className="font-bold block mb-1">【2種登録選手情報】</span>
                <span>所属高校: {inspectingPlayer.type2HighSchool || '提携高校'}</span>
                <span className="block text-[11px] text-purple-400/80 mt-1">
                  高校公式戦（選手権予選・総体）と日程が重複する試合には出場できません。
                </span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingPlayer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
