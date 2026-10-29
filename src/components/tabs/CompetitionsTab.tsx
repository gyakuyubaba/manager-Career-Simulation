import React, { useState } from 'react';
import { GameWorldState, LeagueKey, MatchFixture, CupKey } from '../../types/game';
import { ENABLE_J_LEAGUE } from '../../data/clubsData';
import { formatDateJP } from '../../engine/dateEngine';
import { SUPPORTED_CUPS, getEuropeanLeaguePhaseStandings, getTournamentBracket, getTournamentStatus } from '../../engine/cupEngine';
import { Trophy, Calendar, CheckCircle2, Clock, Shield, Swords } from 'lucide-react';

import { PlayerStatsTab } from './PlayerStatsTab';

interface Props {
  state: GameWorldState;
  onOpenMatch: (fixture: MatchFixture) => void;
}

const ALL_LEAGUE_NAMES: Record<LeagueKey, string> = {
  'premier-league': 'Premier League (イングランド)',
  'championship': 'EFL Championship (イングランド2部)',
  'laliga': 'LaLiga (スペイン)',
  'segunda-division': 'Segunda División (スペイン2部)',
  'bundesliga': 'Bundesliga (ドイツ)',
  '2-bundesliga': '2. Bundesliga (ドイツ2部)',
  'serie-a': 'Serie A (イタリア)',
  'serie-b': 'Serie B (イタリア2部)',
  'ligue-1': 'Ligue 1 (フランス)',
  'ligue-2': 'Ligue 2 (フランス2部)',
  'j1-league': '明治安田J1百年構想リーグ (日本)',
  'j2-league': '明治安田J2リーグ (日本)',
  'j3-league': '明治安田J3リーグ (日本)'
};

const LEAGUE_NAMES: Partial<Record<LeagueKey, string>> = ENABLE_J_LEAGUE 
  ? ALL_LEAGUE_NAMES 
  : {
      'premier-league': 'Premier League (イングランド)',
      'laliga': 'LaLiga (スペイン)',
      'bundesliga': 'Bundesliga (ドイツ)',
      'serie-a': 'Serie A (イタリア)',
      'ligue-1': 'Ligue 1 (フランス)'
    };

export const CompetitionsTab: React.FC<Props> = ({ state, onOpenMatch }) => {
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const initialLeague = userClub?.league || 'premier-league';

  const [selectedLeague, setSelectedLeague] = useState<LeagueKey>(initialLeague);
  const [selectedCup, setSelectedCup] = useState<CupKey>('ucl');
  const [viewMode, setViewMode] = useState<'standings' | 'player_stats' | 'cups' | 'fixtures'>('standings');
  const [euroSubMode, setEuroSubMode] = useState<'league_phase' | 'bracket'>('league_phase');

  const standings = state.standings[selectedLeague] || [];

  // Filter fixtures for selected league
  const leagueFixtures = state.fixtures.filter(f => f.competition === selectedLeague || f.competition === 'pre-season');

  // Cup data
  const currentCupMeta = SUPPORTED_CUPS.find(c => c.id === selectedCup) || SUPPORTED_CUPS[0];
  const isEuroCup = currentCupMeta.format === 'european-league-phase';
  const cupStatusInfo = getTournamentStatus(selectedCup, state.currentDate);
  const euroStandings = isEuroCup ? getEuropeanLeaguePhaseStandings(selectedCup as 'ucl' | 'uel' | 'uecl', state.clubs, state.fixtures) : [];
  const bracketRounds = getTournamentBracket(selectedCup, state);
  const cupFixtures = state.fixtures.filter(f => f.competition === selectedCup);

  return (
    <div className="space-y-5 pb-20">
      
      {/* Header & View Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-display">大会・順位表・対戦日程</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            欧州5大リーグ・明治安田Jリーグ、およびUEFAチャンピオンズリーグ・各国カップ戦の公式記録です。
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setViewMode('standings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'standings' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            順位表
          </button>
          <button
            type="button"
            onClick={() => setViewMode('player_stats')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'player_stats' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            個人成績 (Stats)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cups')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'cups' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            カップ戦 (Cups)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('fixtures')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'fixtures' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            日程・結果
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* VIEW MODE 1: LEAGUE STANDINGS */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {viewMode === 'standings' && (
        <div className="space-y-4">
          {/* League Selection Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(Object.keys(LEAGUE_NAMES) as LeagueKey[]).map(lKey => (
              <button
                key={lKey}
                type="button"
                onClick={() => setSelectedLeague(lKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedLeague === lKey
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {LEAGUE_NAMES[lKey]}
              </button>
            ))}
          </div>

          {/* Standings Table Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-200">
                {ALL_LEAGUE_NAMES[selectedLeague]} 順位表
              </span>
              <span className="text-xs text-slate-400 font-mono">
                クラブ数: {standings.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/40 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">順位</th>
                    <th className="py-3 px-4">クラブ</th>
                    <th className="py-3 px-3 text-center">試合</th>
                    <th className="py-3 px-3 text-center text-emerald-400">勝</th>
                    <th className="py-3 px-3 text-center text-slate-400">分</th>
                    <th className="py-3 px-3 text-center text-rose-400">負</th>
                    <th className="py-3 px-3 text-center">得点</th>
                    <th className="py-3 px-3 text-center">失点</th>
                    <th className="py-3 px-3 text-center">得失点差</th>
                    <th className="py-3 px-4 text-center font-bold text-white">勝点</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {standings.map((row, idx) => {
                    const isUserClub = row.clubId === state.userClubId;
                    const clubObj = state.clubs[row.clubId];

                    // Zone indicators for 1st and 2nd divisions
                    let zoneBg = '';
                    let zoneBadge = '';

                    const isTopDivision = ['premier-league', 'laliga', 'serie-a', 'bundesliga', 'ligue-1', 'j1-league'].includes(selectedLeague);
                    const isDiv2 = ['championship', 'segunda-division', '2-bundesliga', 'serie-b', 'ligue-2', 'j2-league'].includes(selectedLeague);

                    if (isTopDivision) {
                      if (idx < 4 && ['premier-league', 'laliga', 'serie-a'].includes(selectedLeague)) {
                        zoneBg = 'border-l-4 border-l-blue-500 bg-blue-950/10';
                        zoneBadge = 'UCL';
                      } else if (idx < 4 && selectedLeague === 'bundesliga') {
                        zoneBg = 'border-l-4 border-l-blue-500 bg-blue-950/10';
                        zoneBadge = 'UCL';
                      } else if (idx < 3 && selectedLeague === 'ligue-1') {
                        zoneBg = 'border-l-4 border-l-blue-500 bg-blue-950/10';
                        zoneBadge = 'UCL';
                      } else if (idx < 3 && selectedLeague === 'j1-league') {
                        zoneBg = 'border-l-4 border-l-emerald-500 bg-emerald-950/10';
                        zoneBadge = '上位';
                      } else if (idx >= standings.length - (['bundesliga', 'ligue-1'].includes(selectedLeague) ? 2 : 3)) {
                        zoneBg = 'border-l-4 border-l-rose-500 bg-rose-950/10';
                        zoneBadge = '降格圏';
                      }
                    } else if (isDiv2) {
                      if (selectedLeague === 'championship') {
                        if (idx < 2) {
                          zoneBg = 'border-l-4 border-l-emerald-500 bg-emerald-950/20';
                          zoneBadge = '自動昇格';
                        } else if (idx >= 2 && idx < 8) {
                          zoneBg = 'border-l-4 border-l-sky-500 bg-sky-950/20';
                          zoneBadge = 'PO進出';
                        } else if (idx >= standings.length - 3) {
                          zoneBg = 'border-l-4 border-l-rose-500 bg-rose-950/20';
                          zoneBadge = '降格圏';
                        }
                      } else if (selectedLeague === 'j2-league') {
                        if (idx < 2) {
                          zoneBg = 'border-l-4 border-l-emerald-500 bg-emerald-950/20';
                          zoneBadge = '自動昇格';
                        } else if (idx >= 2 && idx < 6) {
                          zoneBg = 'border-l-4 border-l-sky-500 bg-sky-950/20';
                          zoneBadge = 'PO進出';
                        } else if (idx >= standings.length - 3) {
                          zoneBg = 'border-l-4 border-l-rose-500 bg-rose-950/20';
                          zoneBadge = '降格圏';
                        }
                      } else if (selectedLeague === 'segunda-division') {
                        if (idx < 2) {
                          zoneBg = 'border-l-4 border-l-emerald-500 bg-emerald-950/20';
                          zoneBadge = '自動昇格';
                        } else if (idx >= 2 && idx < 6) {
                          zoneBg = 'border-l-4 border-l-sky-500 bg-sky-950/20';
                          zoneBadge = 'PO進出';
                        } else if (idx >= standings.length - 4) {
                          zoneBg = 'border-l-4 border-l-rose-500 bg-rose-950/20';
                          zoneBadge = '降格圏';
                        }
                      } else if (selectedLeague === '2-bundesliga' || selectedLeague === 'ligue-2') {
                        if (idx < 2) {
                          zoneBg = 'border-l-4 border-l-emerald-500 bg-emerald-950/20';
                          zoneBadge = '自動昇格';
                        } else if (idx === 2) {
                          zoneBg = 'border-l-4 border-l-amber-500 bg-amber-950/20';
                          zoneBadge = '入替戦';
                        } else if (idx >= standings.length - 2) {
                          zoneBg = 'border-l-4 border-l-rose-500 bg-rose-950/20';
                          zoneBadge = '降格圏';
                        }
                      } else if (selectedLeague === 'serie-b') {
                        if (idx < 2) {
                          zoneBg = 'border-l-4 border-l-emerald-500 bg-emerald-950/20';
                          zoneBadge = '自動昇格';
                        } else if (idx >= 2 && idx < 8) {
                          zoneBg = 'border-l-4 border-l-sky-500 bg-sky-950/20';
                          zoneBadge = 'PO進出';
                        } else if (idx >= standings.length - 3) {
                          zoneBg = 'border-l-4 border-l-rose-500 bg-rose-950/20';
                          zoneBadge = '降格圏';
                        }
                      }
                    }

                    return (
                      <tr
                        key={row.clubId}
                        className={`transition-colors ${zoneBg} ${
                          isUserClub ? 'bg-emerald-950/30 text-emerald-300 font-semibold' : 'hover:bg-slate-800/30 text-slate-300'
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span className="font-bold text-white truncate max-w-[220px]">
                            {clubObj?.name || row.clubName}
                          </span>
                          {zoneBadge && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              zoneBadge === '自動昇格' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              zoneBadge === 'PO進出' || zoneBadge === '入替戦' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                              zoneBadge === 'UCL' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {zoneBadge}
                            </span>
                          )}
                          {isUserClub && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              自クラブ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{row.played}</td>
                        <td className="py-3 px-3 text-center font-mono text-emerald-400">{row.won}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{row.drawn}</td>
                        <td className="py-3 px-3 text-center font-mono text-rose-400">{row.lost}</td>
                        <td className="py-3 px-3 text-center font-mono">{row.goalsFor}</td>
                        <td className="py-3 px-3 text-center font-mono">{row.goalsAgainst}</td>
                        <td className="py-3 px-3 text-center font-mono font-semibold">
                          {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-white text-sm">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Standings Legend */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
              <span className="font-bold text-slate-300">凡例:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                <span>自動昇格圏 (1〜2位)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block"></span>
                <span>昇格プレーオフ圏 (Championship 3〜8位 / J2 3〜6位)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
                <span>降格圏</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* VIEW MODE: PLAYER STATS (個人成績・ランキング・バロンドール) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {viewMode === 'player_stats' && (
        <PlayerStatsTab state={state} />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* VIEW MODE 2: CUP COMPETITIONS & BRACKETS (カップ戦) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {viewMode === 'cups' && (
        <div className="space-y-4">
          {/* Cup Selection Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {SUPPORTED_CUPS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCup(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedCup === c.id
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>{c.logo}</span>
                <span>{c.shortName}</span>
                <span className="text-[10px] opacity-75">({c.country})</span>
              </button>
            ))}
          </div>

          {/* Cup Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                {currentCupMeta.logo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{currentCupMeta.name}</h3>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                    cupStatusInfo.status === 'not_started' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : cupStatusInfo.status === 'in_progress'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  }`}>
                    {cupStatusInfo.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  形式: {currentCupMeta.format === 'european-league-phase' ? '36クラブ・新リーグフェーズ ＋ 決勝トーナメント' : 'ノックアウト・トーナメント方式 (一発勝負 / 準決勝2試合制)'} · 開催期間: {formatDateJP(cupStatusInfo.startDate)} 〜 {formatDateJP(cupStatusInfo.endDate)}
                </p>
              </div>
            </div>

            {/* Sub-mode for European Cups */}
            {isEuroCup && (
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEuroSubMode('league_phase')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    euroSubMode === 'league_phase' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  リーグフェーズ順位表 (36チーム)
                </button>
                <button
                  type="button"
                  onClick={() => setEuroSubMode('bracket')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    euroSubMode === 'bracket' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  決勝トーナメント表
                </button>
              </div>
            )}
          </div>

          {/* EUROPEAN LEAGUE PHASE STANDINGS */}
          {isEuroCup && euroSubMode === 'league_phase' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  36クラブ単一リーグフェーズ（上位8クラブが直接ベスト16、9〜24位がプレーオフ進出）
                </span>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-emerald-400 font-bold">■ 1-8位: 直接R16</span>
                  <span className="text-blue-400 font-bold">■ 9-24位: プレーオフ</span>
                  <span className="text-rose-400">■ 25-36位: 敗退</span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[560px]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 sticky top-0 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800 z-10">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">順位</th>
                      <th className="py-3 px-4">クラブ</th>
                      <th className="py-3 px-3 text-center">試合</th>
                      <th className="py-3 px-3 text-center text-emerald-400">勝</th>
                      <th className="py-3 px-3 text-center text-slate-400">分</th>
                      <th className="py-3 px-3 text-center text-rose-400">負</th>
                      <th className="py-3 px-3 text-center">得点</th>
                      <th className="py-3 px-3 text-center">失点</th>
                      <th className="py-3 px-3 text-center">得失点差</th>
                      <th className="py-3 px-4 text-center font-bold text-white">勝点</th>
                      <th className="py-3 px-3 text-center">進出区分</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {euroStandings.map((row, idx) => {
                      const isUserClub = row.clubId === state.userClubId;
                      const clubObj = state.clubs[row.clubId];

                      let statusBadge = '';
                      let borderClass = '';
                      if (idx < 8) {
                        statusBadge = 'ベスト16直接進出';
                        borderClass = 'border-l-4 border-l-emerald-500 bg-emerald-950/10';
                      } else if (idx < 24) {
                        statusBadge = 'プレーオフ進出';
                        borderClass = 'border-l-4 border-l-blue-500 bg-blue-950/10';
                      } else {
                        statusBadge = '敗退';
                        borderClass = 'border-l-4 border-l-rose-500/40 bg-rose-950/5';
                      }

                      return (
                        <tr
                          key={row.clubId}
                          className={`transition-colors ${borderClass} ${
                            isUserClub ? 'bg-amber-950/30 text-amber-300 font-bold' : 'hover:bg-slate-800/30 text-slate-300'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 flex items-center gap-2">
                            <span className="font-bold text-white truncate max-w-[200px]">
                              {clubObj?.name || row.clubName}
                            </span>
                            {isUserClub && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                自クラブ
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{row.played}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-emerald-400">{row.won}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">{row.drawn}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-rose-400">{row.lost}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{row.goalsFor}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{row.goalsAgainst}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold">
                            {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-white text-sm">
                            {row.points}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              idx < 8 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                              idx < 24 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                              'bg-slate-800 text-slate-500'
                            }`}>
                              {statusBadge}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TOURNAMENT BRACKET TREE */}
          {(!isEuroCup || euroSubMode === 'bracket') && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Swords className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">決勝トーナメント表 (Tournament Bracket)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
                  {bracketRounds.map((round, rIdx) => (
                    <div key={rIdx} className="space-y-3 min-w-[240px]">
                      <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center font-bold text-xs text-amber-300">
                        {round.roundName}
                      </div>

                      <div className="space-y-3">
                        {round.matches.map((match, mIdx) => {
                          const isUserMatch = match.homeClubId === state.userClubId || match.awayClubId === state.userClubId;
                          const isFinished = match.status === 'finished';

                          return (
                            <div
                              key={mIdx}
                              className={`p-3 rounded-2xl border transition-all text-xs ${
                                isUserMatch
                                  ? 'bg-emerald-950/30 border-emerald-500/60 shadow-md'
                                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2 font-mono">
                                <span>{match.date}</span>
                                {match.isTwoLegged && (
                                  <span className="text-amber-400 font-semibold">2試合制合計</span>
                                )}
                              </div>

                              {/* Home Club */}
                              <div className="flex items-center justify-between py-1">
                                <span className={`truncate max-w-[140px] font-bold ${
                                  match.winnerClubId === match.homeClubId ? 'text-white' : 'text-slate-400'
                                }`}>
                                  {match.homeClubName}
                                </span>
                                <span className="font-mono font-bold text-white text-sm">
                                  {isFinished ? match.homeScore : '-'}
                                </span>
                              </div>

                              {/* Away Club */}
                              <div className="flex items-center justify-between py-1">
                                <span className={`truncate max-w-[140px] font-bold ${
                                  match.winnerClubId === match.awayClubId ? 'text-white' : 'text-slate-400'
                                }`}>
                                  {match.awayClubName}
                                </span>
                                <span className="font-mono font-bold text-white text-sm">
                                  {isFinished ? match.awayScore : '-'}
                                </span>
                              </div>

                              {/* Details (PK, Aggregate) */}
                              {isFinished && (
                                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                                  {match.penaltyShootout ? (
                                    <span className="text-amber-400 font-bold">
                                      PK戦: {match.penaltyShootout.homeScore} - {match.penaltyShootout.awayScore}
                                    </span>
                                  ) : match.aggregateScore ? (
                                    <span className="text-slate-400 font-mono">
                                      {match.aggregateScore}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">90分決着</span>
                                  )}

                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>決着</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixtures list for this cup */}
              {cupFixtures.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-300">大会公式マッチスケジュール</h4>
                  <div className="divide-y divide-slate-800">
                    {cupFixtures.map(f => {
                      const isUser = f.homeClubId === state.userClubId || f.awayClubId === state.userClubId;
                      return (
                        <div key={f.id} className="py-2.5 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-mono">{formatDateJP(f.date)}</span>
                          <span className="text-white font-semibold">{f.competitionName}</span>
                          <span className="text-slate-300 font-mono">
                            {state.clubs[f.homeClubId]?.name || 'TBD'} vs {state.clubs[f.awayClubId]?.name || 'TBD'}
                          </span>
                          {f.status === 'finished' ? (
                            <span className="text-emerald-400 font-mono font-bold">{f.homeScore} - {f.awayScore}</span>
                          ) : isUser ? (
                            <button
                              type="button"
                              onClick={() => onOpenMatch(f)}
                              className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg cursor-pointer"
                            >
                              試合へ
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">未消化</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* VIEW MODE 3: LEAGUE FIXTURES & RESULTS */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {viewMode === 'fixtures' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200">
              {ALL_LEAGUE_NAMES[selectedLeague]} 対戦カード・試合結果
            </span>
            <span className="text-xs text-slate-400 font-mono">
              全{leagueFixtures.length}試合
            </span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
            {leagueFixtures.map(f => {
              const home = state.clubs[f.homeClubId];
              const away = state.clubs[f.awayClubId];
              const isUserMatch = f.homeClubId === state.userClubId || f.awayClubId === state.userClubId;

              return (
                <div
                  key={f.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isUserMatch ? 'bg-slate-800/40' : 'hover:bg-slate-800/20'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{formatDateJP(f.date)}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 font-semibold">{f.competitionName}</span>
                  </div>

                  {/* Teams and score */}
                  <div className="flex items-center justify-center gap-4 text-xs font-bold">
                    <span className={`text-right w-36 truncate ${f.homeClubId === state.userClubId ? 'text-emerald-400 font-black' : 'text-white'}`}>
                      {home?.name}
                    </span>
                    <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono text-sm">
                      {f.status === 'finished' ? (
                        <span>{f.homeScore} - {f.awayScore}</span>
                      ) : (
                        <span className="text-slate-500 text-xs">VS</span>
                      )}
                    </div>
                    <span className={`text-left w-36 truncate ${f.awayClubId === state.userClubId ? 'text-emerald-400 font-black' : 'text-white'}`}>
                      {away?.name}
                    </span>
                  </div>

                  {/* Action / Status */}
                  <div className="flex items-center justify-end gap-2">
                    {f.status === 'finished' ? (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>試合終了</span>
                      </span>
                    ) : isUserMatch ? (
                      <button
                        type="button"
                        onClick={() => onOpenMatch(f)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        試合へ
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>未消化</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
