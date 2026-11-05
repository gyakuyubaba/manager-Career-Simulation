import React, { useState } from 'react';
import { BallonDorCandidate } from '../../types/game';
import { Award, Trophy, Star, Sparkles, X, ChevronRight, User } from 'lucide-react';

interface Props {
  ceremony: {
    year: number;
    date: string;
    stage: 'nominees' | 'gala' | 'awarded';
    nominees: BallonDorCandidate[];
    winner: BallonDorCandidate;
    rankings: BallonDorCandidate[];
  };
  onClose: () => void;
}

export const BallonDorCeremonyModal: React.FC<Props> = ({ ceremony, onClose }) => {
  const [activeTab, setActiveTab] = useState<'winner' | 'rankings'>(
    ceremony.stage === 'nominees' ? 'rankings' : 'winner'
  );

  const winner = ceremony.winner || ceremony.rankings[0];
  const list = ceremony.rankings && ceremony.rankings.length > 0 ? ceremony.rankings : ceremony.nominees;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-left">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 text-white my-8 overflow-hidden">
        
        {/* Gold Glow Accents */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-amber-500/20 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-bold">
                  France Football Official Gala
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {ceremony.year}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Ballon d'Or 授賞式・世界年間最優秀選手
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('winner')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'winner'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>受賞者発表 (Gala Presentation)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rankings')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'rankings'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>全ノミネート順位 (Top 30 Rankings)</span>
          </button>
        </div>

        {/* Tab 1: Winner Announcement Gala */}
        {activeTab === 'winner' && (
          <div className="space-y-6">
            <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950 border border-amber-500/30 overflow-hidden text-center">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-4">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{ceremony.year} BALLON D'OR WINNER</span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>

              {/* Big Golden Trophy Icon */}
              <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-1 shadow-2xl shadow-amber-500/30 mb-4 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center border-4 border-amber-400/50">
                  <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 tracking-tight">
                {winner.playerName}
              </h1>

              <p className="text-sm font-bold text-slate-300 mt-1 flex items-center justify-center gap-2">
                <span>{winner.clubName}</span>
                <span>•</span>
                <span>{winner.nationality}</span>
                <span>•</span>
                <span className="text-amber-400 font-mono">OVR {winner.ovr}</span>
              </p>

              {/* Narrative Summary */}
              <div className="mt-4 max-w-xl mx-auto bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed text-left">
                {winner.summary || `圧倒的な個人パフォーマンスと決定力でチームを牽引。欧州舞台での輝かしい活躍が世界中の記者投票で圧倒的な支持を集め、栄誉ある${ceremony.year}年バロンドールに選出されました。`}
              </div>

              {/* Stats Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-2xl mx-auto">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 block font-mono">GOALS</span>
                  <span className="text-xl font-mono font-black text-emerald-400">{winner.goals}</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 block font-mono">ASSISTS</span>
                  <span className="text-xl font-mono font-black text-blue-400">{winner.assists}</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 block font-mono">AVG RATING</span>
                  <span className="text-xl font-mono font-black text-amber-400">{winner.avgRating?.toFixed(2) || '7.85'}</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 block font-mono">VOTE PROB</span>
                  <span className="text-xl font-mono font-black text-purple-400">{winner.winProbability || 85}%</span>
                </div>
              </div>

              <div className="mt-5 text-[11px] text-amber-400/80 font-mono">
                ※受賞選手は「絶好調（ピンク）」状態が付与され、クラブのサポーター支持率が上昇します。
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Rankings Table */}
        {activeTab === 'rankings' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden max-h-[460px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">順位</th>
                  <th className="py-3 px-3">選手名</th>
                  <th className="py-3 px-3">所属クラブ</th>
                  <th className="py-3 px-3">国籍</th>
                  <th className="py-3 px-3 text-center">ポジション</th>
                  <th className="py-3 px-3 text-center">OVR</th>
                  <th className="py-3 px-3 text-center">G / A</th>
                  <th className="py-3 px-3 text-center">評点</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {list.map((c, idx) => {
                  const rank = c.rank || idx + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <tr
                      key={c.playerId || `${c.playerName}_${idx}`}
                      className={`hover:bg-slate-900/70 transition-colors ${
                        rank === 1
                          ? 'bg-amber-500/10 font-bold'
                          : rank <= 3
                          ? 'bg-amber-500/5'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400">{rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                        {isTop3 && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                        <span>{c.playerName}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{c.clubName}</td>
                      <td className="py-3 px-3 text-slate-400">{c.nationality}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">{c.position}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{c.ovr}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {c.goals} / {c.assists}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-300">
                        {c.avgRating?.toFixed(2) || '7.50'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400">
            {ceremony.date} 発表 • UEFA / France Football 提携アワード
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/20"
          >
            授賞式を終える (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
