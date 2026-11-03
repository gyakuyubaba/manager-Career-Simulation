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

export type CompetitionScope = 'total' | 'league' | 'domestic_cup' | 'ucl' | 'uel' | 'uecl' | 'past' | 'career';

interface StatsRankTableProps {
  title: string;
  subtitle?: string;
  players: any[];
  highlight: 'goals' | 'assists' | 'rating' | 'minutes' | 'cards' | 'cs' | 'saves';
  onInspect: (p: Player) => void;
  userClubId?: string | null;
  clubs: Record<string, any>;
}

const StatsRankTable: React.FC<StatsRankTableProps> = ({
  title,
  subtitle,
  players,
  highlight,
  onInspect,
  userClubId,
  clubs
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
        <span>{title}</span>
        <span className="text-slate-500 font-mono">{subtitle || '選手をクリックして詳細プロフィール表示'}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-950/40 text-slate-400 font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-2 text-center w-12">順位</th>
              <th className="py-3 px-3">選手名</th>
              <th className="py-3 px-3">所属クラブ</th>
              <th className="py-3 px-2 text-center">Pos</th>
              <th className="py-3 px-2 text-center" title="出場試合数">出場</th>
              <th className="py-3 px-2 text-center" title="先発出場数">先発</th>
              <th className="py-3 px-2 text-center" title="途中出場数">途中</th>
              <th className="py-3 px-2 text-center" title="総出場時間">時間</th>
              <th className={`py-3 px-2 text-center ${highlight === 'goals' ? 'text-emerald-400 font-bold' : ''}`} title="ゴール数">得点</th>
              <th className={`py-3 px-2 text-center ${highlight === 'assists' ? 'text-blue-400 font-bold' : ''}`} title="アシスト数">アシスト</th>
              <th className={`py-3 px-2 text-center ${highlight === 'rating' ? 'text-amber-300 font-bold' : ''}`} title="平均採点">評価</th>
              <th className="py-3 px-1.5 text-center text-amber-300" title="警告数">🟨</th>
              <th className="py-3 px-1.5 text-center text-rose-400" title="退場数">🟥</th>
              <th className={`py-3 px-2 text-center ${highlight === 'cs' ? 'text-teal-400 font-bold' : 'text-teal-300'}`} title="クリーンシート">CS</th>
              <th className={`py-3 px-2 text-center ${highlight === 'saves' ? 'text-indigo-400 font-bold' : 'text-indigo-300'}`} title="セーブ数">SV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {players.map((p, idx) => {
              const club = clubs[p.clubId];
              const isUserPlayer = p.clubId === userClubId;
              const st = p.currentScopedStats || {};
              const subs = Math.max(0, (st.appearances || 0) - (st.starts || 0));

              return (
                <tr
                  key={p.id}
                  onClick={() => onInspect(p)}
                  className={`cursor-pointer transition-colors ${
                    isUserPlayer ? 'bg-emerald-950/20 text-emerald-300 font-semibold' : 'hover:bg-slate-800/30 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-2 text-center font-mono font-bold">
                    {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white hover:text-emerald-400 transition-colors whitespace-nowrap">
                        {p.name}
                      </span>
                      {p.isLoaned && (
                        <span className="px-1 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          ローン
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 truncate max-w-[130px]">
                    {club?.name || p.clubId}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400">{p.position}</td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold">{st.appearances || 0}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-400">{st.starts || 0}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-500">{subs}</td>
                  <td className={`py-2.5 px-2 text-center font-mono ${highlight === 'minutes' ? 'font-black text-emerald-400 text-sm' : 'text-slate-300'}`}>
                    {st.minutes || 0}分
                  </td>
                  <td className={`py-2.5 px-2 text-center font-mono font-black ${highlight === 'goals' ? 'text-emerald-400 text-sm' : 'text-slate-200'}`}>
                    {st.goals || 0}
                  </td>
                  <td className={`py-2.5 px-2 text-center font-mono font-black ${highlight === 'assists' ? 'text-blue-400 text-sm' : 'text-slate-200'}`}>
                    {st.assists || 0}
                  </td>
                  <td className={`py-2.5 px-2 text-center font-mono font-bold ${highlight === 'rating' ? 'text-amber-300 text-sm' : 'text-slate-300'}`}>
                    {st.avgRating && st.avgRating > 0 ? st.avgRating.toFixed(2) : '-'}
                  </td>
                  <td className={`py-2.5 px-1.5 text-center font-mono font-bold ${highlight === 'cards' ? 'text-amber-300 text-sm' : 'text-amber-300/80'}`}>
                    {st.yellowCards || 0}
                  </td>
                  <td className={`py-2.5 px-1.5 text-center font-mono font-bold ${highlight === 'cards' ? 'text-rose-400 text-sm' : 'text-rose-400/80'}`}>
                    {st.redCards || 0}
                  </td>
                  <td className={`py-2.5 px-2 text-center font-mono font-bold ${highlight === 'cs' ? 'text-teal-400 text-sm' : 'text-teal-300'}`}>
                    {st.cleanSheets || 0}
                  </td>
                  <td className={`py-2.5 px-2 text-center font-mono font-bold ${highlight === 'saves' ? 'text-indigo-400 text-sm' : 'text-indigo-300'}`}>
                    {st.saves || 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const PlayerStatsTab: React.FC<Props> = ({ state, onSelectPlayer }) => {
  const [selectedLeague, setSelectedLeague] = useState<LeagueKey | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<'scorers' | 'assists' | 'gk' | 'ratings' | 'minutes' | 'cards' | 'ballondor'>('scorers');
  const [competitionScope, setCompetitionScope] = useState<CompetitionScope>('total');
  const [selectedPastSeason, setSelectedPastSeason] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);

  // Discover all past seasons archived in player records
  const availablePastSeasons = useMemo(() => {
    const sSet = new Set<string>();
    Object.values(state.players).forEach(p => {
      (p.seasonHistory || []).forEach(h => {
        if (h.seasonId) sSet.add(h.seasonId);
      });
    });
    return Array.from(sSet).sort().reverse();
  }, [state.players]);

  // Set default past season if available
  React.useEffect(() => {
    if (availablePastSeasons.length > 0 && !selectedPastSeason) {
      setSelectedPastSeason(availablePastSeasons[0]);
    }
  }, [availablePastSeasons, selectedPastSeason]);

  const matchesCompetitionFilter = (compId: string, filter: 'league' | 'domestic_cup' | 'ucl' | 'uel' | 'uecl'): boolean => {
    const lower = compId.toLowerCase();
    if (filter === 'ucl') {
      return lower === 'ucl' || lower.includes('champions-league') || lower.includes('champions_league');
    }
    if (filter === 'uel') {
      return lower === 'uel' || lower.includes('europa-league') || lower.includes('europa_league');
    }
    if (filter === 'uecl') {
      return lower === 'uecl' || lower.includes('conference-league') || lower.includes('conference_league');
    }
    if (filter === 'domestic_cup') {
      return (
        !lower.includes('ucl') &&
        !lower.includes('uel') &&
        !lower.includes('uecl') &&
        !lower.includes('champions') &&
        !lower.includes('conference') &&
        (
          lower.includes('cup') ||
          lower.includes('pokal') ||
          lower.includes('copa') ||
          lower.includes('coppa') ||
          lower.includes('coupe') ||
          lower.includes('emperor') ||
          lower.includes('trophy') ||
          lower.includes('shield') ||
          lower.includes('supercup')
        )
      );
    }
    if (filter === 'league') {
      return (
        !matchesCompetitionFilter(compId, 'ucl') &&
        !matchesCompetitionFilter(compId, 'uel') &&
        !matchesCompetitionFilter(compId, 'uecl') &&
        !matchesCompetitionFilter(compId, 'domestic_cup') &&
        compId !== 'pre-season'
      );
    }
    return true;
  };

  // Helper to extract stats according to competitionScope
  const getScopedPlayerStats = (p: Player) => {
    let rawStats: {
      appearances: number;
      starts: number;
      minutes: number;
      goals: number;
      assists: number;
      cleanSheets: number;
      yellowCards: number;
      redCards: number;
      avgRating: number;
      saves: number;
      goalsConceded: number;
    };

    if (competitionScope === 'total') {
      rawStats = p.stats
        ? {
            ...p.stats,
            saves: p.stats.saves || 0,
            goalsConceded: p.stats.goalsConceded || 0
          }
        : { appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 0, saves: 0, goalsConceded: 0 };
      return rawStats;
    }

    if (competitionScope === 'past') {
      const hist = (p.seasonHistory || []).find(h => h.seasonId === (selectedPastSeason || availablePastSeasons[0]));
      return hist ? {
        appearances: hist.appearances || 0,
        starts: hist.starts || 0,
        minutes: hist.minutes || 0,
        goals: hist.goals || 0,
        assists: hist.assists || 0,
        cleanSheets: hist.cleanSheets || 0,
        yellowCards: hist.yellowCards || 0,
        redCards: hist.redCards || 0,
        avgRating: hist.avgRating || 0,
        saves: hist.saves || 0,
        goalsConceded: hist.goalsConceded || 0
      } : { appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 0, saves: 0, goalsConceded: 0 };
    }

    if (competitionScope === 'career') {
      const historyList = p.seasonHistory || [];
      const totApps = (p.stats?.appearances || 0) + historyList.reduce((acc, h) => acc + (h.appearances || 0), 0);
      const totStarts = (p.stats?.starts || 0) + historyList.reduce((acc, h) => acc + (h.starts || 0), 0);
      const totMinutes = (p.stats?.minutes || 0) + historyList.reduce((acc, h) => acc + (h.minutes || 0), 0);
      const totGoals = (p.stats?.goals || 0) + historyList.reduce((acc, h) => acc + (h.goals || 0), 0);
      const totAssists = (p.stats?.assists || 0) + historyList.reduce((acc, h) => acc + (h.assists || 0), 0);
      const totClean = (p.stats?.cleanSheets || 0) + historyList.reduce((acc, h) => acc + (h.cleanSheets || 0), 0);
      const totYellow = (p.stats?.yellowCards || 0) + historyList.reduce((acc, h) => acc + (h.yellowCards || 0), 0);
      const totRed = (p.stats?.redCards || 0) + historyList.reduce((acc, h) => acc + (h.redCards || 0), 0);
      const weightedSum = ((p.stats?.avgRating || 0) * (p.stats?.appearances || 0)) +
        historyList.reduce((acc, h) => acc + ((h.avgRating || 0) * (h.appearances || 0)), 0);
      const avgR = totApps > 0 ? +(weightedSum / totApps).toFixed(2) : 0;
      const totSaves = (p.stats?.saves || 0) + historyList.reduce((acc, h) => acc + (h.saves || 0), 0);
      const totConceded = (p.stats?.goalsConceded || 0) + historyList.reduce((acc, h) => acc + (h.goalsConceded || 0), 0);

      return {
        appearances: totApps,
        starts: totStarts,
        minutes: totMinutes,
        goals: totGoals,
        assists: totAssists,
        cleanSheets: totClean,
        yellowCards: totYellow,
        redCards: totRed,
        avgRating: avgR,
        saves: totSaves,
        goalsConceded: totConceded
      };
    }

    // Specific Competition Category (league, domestic_cup, ucl, uel, uecl)
    const compStatsMap = p.competitionStats || {};
    let filteredApps = 0;
    let filteredStarts = 0;
    let filteredMins = 0;
    let filteredGoals = 0;
    let filteredAssists = 0;
    let filteredCS = 0;
    let filteredYellow = 0;
    let filteredRed = 0;
    let weightedRating = 0;
    let filteredSaves = 0;
    let filteredConceded = 0;

    Object.entries(compStatsMap).forEach(([compId, cs]) => {
      if (cs && matchesCompetitionFilter(compId, competitionScope)) {
        filteredApps += cs.appearances || 0;
        filteredStarts += cs.starts || 0;
        filteredMins += cs.minutes || 0;
        filteredGoals += cs.goals || 0;
        filteredAssists += cs.assists || 0;
        filteredCS += cs.cleanSheets || 0;
        filteredYellow += cs.yellowCards || 0;
        filteredRed += cs.redCards || 0;
        filteredSaves += cs.saves || 0;
        filteredConceded += cs.goalsConceded || 0;
        weightedRating += (cs.avgRating || 0) * (cs.appearances || 0);
      }
    });

    if (Object.keys(compStatsMap).length === 0 && competitionScope === 'league' && (p.stats?.appearances || 0) > 0) {
      rawStats = {
        ...p.stats,
        saves: p.stats.saves || 0,
        goalsConceded: p.stats.goalsConceded || 0
      };
    } else {
      rawStats = {
        appearances: filteredApps,
        starts: filteredStarts,
        minutes: filteredMins,
        goals: filteredGoals,
        assists: filteredAssists,
        cleanSheets: filteredCS,
        yellowCards: filteredYellow,
        redCards: filteredRed,
        avgRating: filteredApps > 0 ? +(weightedRating / filteredApps).toFixed(2) : 0,
        saves: filteredSaves,
        goalsConceded: filteredConceded
      };
    }
    return rawStats;
  };

  // Filter players by league & search with scoped stats
  const filteredPlayers = useMemo(() => {
    return Object.values(state.players)
      .filter(p => {
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
      })
      .map(p => ({
        ...p,
        currentScopedStats: getScopedPlayerStats(p)
      }));
  }, [state.players, state.clubs, selectedLeague, searchQuery, competitionScope, selectedPastSeason, availablePastSeasons]);

  // Rankings using currentScopedStats
  const topScorers = useMemo(() => {
    return [...filteredPlayers]
      .filter(p => p.position !== 'GK')
      .sort((a, b) => (b.currentScopedStats.goals || 0) - (a.currentScopedStats.goals || 0) || (b.currentScopedStats.avgRating || 0) - (a.currentScopedStats.avgRating || 0))
      .slice(0, 30);
  }, [filteredPlayers]);

  const topAssists = useMemo(() => {
    return [...filteredPlayers]
      .filter(p => p.position !== 'GK')
      .sort((a, b) => (b.currentScopedStats.assists || 0) - (a.currentScopedStats.assists || 0) || (b.currentScopedStats.avgRating || 0) - (a.currentScopedStats.avgRating || 0))
      .slice(0, 30);
  }, [filteredPlayers]);

  const topGKs = useMemo(() => {
    return [...filteredPlayers]
      .filter(p => p.position === 'GK')
      .map(gk => {
        const apps = gk.currentScopedStats.appearances || 0;
        const cs = gk.currentScopedStats.cleanSheets || 0;
        const saves = gk.currentScopedStats.saves || Math.round(apps * 3.4);
        const conceded = gk.currentScopedStats.goalsConceded || Math.max(0, Math.round(apps * 1.2 - cs));
        const concededPerMatch = apps > 0 ? (conceded / apps).toFixed(2) : '0.00';
        return {
          ...gk,
          derivedSaves: saves,
          derivedConceded: Math.round(conceded),
          derivedConcededRate: concededPerMatch
        };
      })
      .sort((a, b) => (b.currentScopedStats.cleanSheets || 0) - (a.currentScopedStats.cleanSheets || 0) || b.derivedSaves - a.derivedSaves)
      .slice(0, 30);
  }, [filteredPlayers]);

  const topRatings = useMemo(() => {
    return [...filteredPlayers]
      .filter(p => (p.currentScopedStats.appearances || 0) >= 1)
      .sort((a, b) => (b.currentScopedStats.avgRating || 0) - (a.currentScopedStats.avgRating || 0))
      .slice(0, 30);
  }, [filteredPlayers]);

  const topMinutes = useMemo(() => {
    return [...filteredPlayers]
      .sort((a, b) => (b.currentScopedStats.minutes || 0) - (a.currentScopedStats.minutes || 0))
      .slice(0, 30);
  }, [filteredPlayers]);

  const topCards = useMemo(() => {
    return [...filteredPlayers]
      .map(p => ({
        ...p,
        totalCardsScore: (p.currentScopedStats.redCards || 0) * 3 + (p.currentScopedStats.yellowCards || 0)
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

      {/* 8 Competition Scopes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">大会別成績:</span>
            {[
              { key: 'total', label: '今シーズン通算' },
              { key: 'league', label: 'リーグ戦' },
              { key: 'domestic_cup', label: '国内カップ戦' },
              { key: 'ucl', label: 'CL' },
              { key: 'uel', label: 'EL' },
              { key: 'uecl', label: 'ECL' },
              { key: 'past', label: '過去シーズン' },
              { key: 'career', label: 'キャリア通算' }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCompetitionScope(tab.key as CompetitionScope)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  competitionScope === tab.key
                    ? 'bg-emerald-500 text-slate-950 shadow-md ring-1 ring-emerald-400'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {competitionScope === 'past' && availablePastSeasons.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">シーズン選択:</span>
              <select
                value={selectedPastSeason}
                onChange={(e) => setSelectedPastSeason(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {availablePastSeasons.map(s => (
                  <option key={s} value={s}>{s} シーズン</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          {competitionScope === 'total' && '※ 今季の全公式戦（リーグ戦・国内カップ戦・欧州カップ戦）の合算個人スタッツ（プレシーズンは除外）'}
          {competitionScope === 'league' && '※ 国内リーグ戦のみの個人スタッツ'}
          {competitionScope === 'domestic_cup' && '※ 国内カップ戦（FAカップ、カラバオ杯、コパ等）のみの個人スタッツ'}
          {competitionScope === 'ucl' && '※ UEFAチャンピオンズリーグ（CL）のみの個人スタッツ'}
          {competitionScope === 'uel' && '※ UEFAヨーロッパリーグ（EL）のみの個人スタッツ'}
          {competitionScope === 'uecl' && '※ UEFAカンファレンスリーグ（ECL）のみの個人スタッツ'}
          {competitionScope === 'past' && '※ 過去シーズン確定アーカイブスタッツ'}
          {competitionScope === 'career' && '※ 全キャリア通算公式戦の累計個人スタッツ'}
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
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. TOP SCORERS (得点ランキング) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. TOP SCORERS (得点ランキング) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeCategory === 'scorers' && (
        <StatsRankTable
          title="得点ランキング TOP 30 (ゴール数・決定力)"
          subtitle="選手をクリックして詳細プロフィール表示"
          players={topScorers}
          highlight="goals"
          onInspect={setInspectingPlayer}
          userClubId={state.userClubId}
          clubs={state.clubs}
        />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. TOP ASSISTS (アシストランキング) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeCategory === 'assists' && (
        <StatsRankTable
          title="アシストランキング TOP 30 (チャンスメイク・パス配給)"
          subtitle="選手をクリックして詳細プロフィール表示"
          players={topAssists}
          highlight="assists"
          onInspect={setInspectingPlayer}
          userClubId={state.userClubId}
          clubs={state.clubs}
        />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. GK RANKING (ゴールキーパー・クリーンシート・セーブ数) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeCategory === 'gk' && (
        <StatsRankTable
          title="GKランキング TOP 30 (クリーンシート数・セーブ数・守護神)"
          subtitle="選手をクリックして詳細プロフィール表示"
          players={topGKs}
          highlight="cs"
          onInspect={setInspectingPlayer}
          userClubId={state.userClubId}
          clubs={state.clubs}
        />
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
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 5. RATINGS / MINUTES / CARDS TABLES */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeCategory === 'ratings' && (
        <StatsRankTable
          title="平均評価点ランキング TOP 30 (安定した高パフォーマンス)"
          subtitle="選手をクリックして詳細プロフィール表示"
          players={topRatings}
          highlight="rating"
          onInspect={setInspectingPlayer}
          userClubId={state.userClubId}
          clubs={state.clubs}
        />
      )}

      {activeCategory === 'minutes' && (
        <StatsRankTable
          title="総出場時間ランキング TOP 30 (鉄人・チームの中核)"
          subtitle="選手をクリックして詳細プロフィール表示"
          players={topMinutes}
          highlight="minutes"
          onInspect={setInspectingPlayer}
          userClubId={state.userClubId}
          clubs={state.clubs}
        />
      )}

      {activeCategory === 'cards' && (
        <StatsRankTable
          title="警告・退場数ランキング TOP 30 (激しい守備・規律管理)"
          subtitle="選手をクリックして詳細プロフィール表示"
          players={topCards}
          highlight="cards"
          onInspect={setInspectingPlayer}
          userClubId={state.userClubId}
          clubs={state.clubs}
        />
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
            {(() => {
              const curStats = getScopedPlayerStats(inspectingPlayer);
              const scopeTitles: Record<CompetitionScope, string> = {
                total: '2026/27 今シーズン全公式戦通算',
                league: '国内リーグ戦',
                domestic_cup: '国内カップ戦',
                ucl: 'UEFA チャンピオンズリーグ (CL)',
                uel: 'UEFA ヨーロッパリーグ (EL)',
                uecl: 'UEFA カンファレンスリーグ (ECL)',
                past: `${selectedPastSeason || availablePastSeasons[0] || '過去'} シーズン公式戦アーカイブ`,
                career: '生涯通算スタッツ (全シーズン公式戦累計)'
              };
              const scopeTitle = scopeTitles[competitionScope] || '公式戦スタッツ';

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300">{scopeTitle}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {competitionScope}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block">出場試合</span>
                      <span className="font-bold text-white">{curStats.appearances}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">ゴール</span>
                      <span className="font-bold text-emerald-400">{curStats.goals}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">アシスト</span>
                      <span className="font-bold text-blue-400">{curStats.assists}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">平均採点</span>
                      <span className="font-bold text-white">
                        {curStats.avgRating && curStats.avgRating > 0 ? curStats.avgRating.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">クリーンシート</span>
                      <span className="font-bold text-amber-300">{curStats.cleanSheets}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">出場時間</span>
                      <span className="font-bold text-slate-300">{curStats.minutes} 分</span>
                    </div>
                  </div>

                  {/* Past Season History Mini Table if present */}
                  {inspectingPlayer.seasonHistory && inspectingPlayer.seasonHistory.length > 0 && (
                    <div className="mt-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">過去シーズン履歴:</span>
                      <div className="max-h-28 overflow-y-auto divide-y divide-slate-800 text-[11px] font-mono">
                        {inspectingPlayer.seasonHistory.map(h => (
                          <div key={h.seasonId} className="py-1 flex items-center justify-between text-slate-300">
                            <span className="font-bold text-slate-400">{h.seasonId} ({h.clubName || h.clubId})</span>
                            <span>{h.appearances}試 {h.goals}G {h.assists}A (評: {h.avgRating > 0 ? h.avgRating.toFixed(1) : '-'})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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
