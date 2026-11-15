import React, { useState, useMemo } from 'react';
import { Club, GameWorldState, Player } from '../types/game';
import { recalculateDynamicMarketValue } from '../engine/valuationEngine';
import { addSmartphoneNotification } from '../engine/smartphoneEngine';
import { Check, MessageSquare, Search, Shield, Users, X } from 'lucide-react';

interface Props {
  state: GameWorldState;
  onUpdateState: (newState: GameWorldState) => void;
  onInspectPlayer: (player: Player) => void;
  onClose: () => void;
}

interface HubChatEntry {
  sender: 'player' | 'user';
  text: string;
}

export const TeamHubModal: React.FC<Props> = ({
  state,
  onUpdateState,
  onInspectPlayer,
  onClose
}) => {
  const userClub: Club | null = state.userClubId ? state.clubs[state.userClubId] : null;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [negotiatingPlayerId, setNegotiatingPlayerId] = useState<string | null>(null);
  const [proposedWage, setProposedWage] = useState<number>(20000);
  const [proposedYears, setProposedYears] = useState<number>(3);
  const [proposedRole, setProposedRole] = useState<Player['squadRole']>('重要選手');
  const [chatHistory, setChatHistory] = useState<HubChatEntry[]>([]);
  const [negotiationDone, setNegotiationDone] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const squadPlayers = useMemo(() => {
    if (!userClub) return [];
    const list = userClub.playerIds
      .map(id => state.players[id])
      .filter(Boolean)
      .sort((a, b) => b.ovr - a.ovr);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      p => p.name.toLowerCase().includes(q) || p.position.toLowerCase().includes(q)
    );
  }, [userClub, state.players, searchQuery]);

  const negotiatingPlayer = negotiatingPlayerId ? state.players[negotiatingPlayerId] : null;

  const openContractNegotiation = (p: Player) => {
    setNegotiatingPlayerId(p.id);
    setProposedWage(Math.max(5000, Math.round((p.wage * 1.1) / 1000) * 1000));
    setProposedYears(Math.min(5, Math.max(2, (p.contractYears || 2) + 1)));
    setProposedRole(p.squadRole);
    setNegotiationDone(false);
    setFeedbackBanner(null);
    setChatHistory([
      {
        sender: 'player',
        text: `${p.name}（${p.age}歳 / OVR ${p.ovr}）の代理人です。現在の週給は €${p.wage.toLocaleString()}、契約残年数は ${p.contractYears}年、チーム内の役割は「${p.squadRole}」です。契約更新・役割見直しのご提案をお聞かせください。`
      }
    ]);
  };

  const handleSubmitContractProposal = () => {
    if (!negotiatingPlayer || !userClub || negotiationDone) return;

    const currentWage = negotiatingPlayer.wage;
    const wageDelta = proposedWage - currentWage;
    const availableWageRoom = Math.max(0, userClub.wageBudget - userClub.currentWageSpend);

    if (wageDelta > availableWageRoom) {
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'user',
          text: `週給 €${proposedWage.toLocaleString()} / 契約${proposedYears}年 / 役割「${proposedRole}」を提案したい。`
        },
        {
          sender: 'player',
          text: `クラブの週給予算空き枠（残り €${availableWageRoom.toLocaleString()}/週）を超過しているため、財務部門の承認が得られません。もう少し抑えた金額で再提示してください。`
        }
      ]);
      return;
    }

    const roleRanks: Record<Player['squadRole'], number> = {
      '絶対的主力': 5,
      '重要選手': 4,
      'ローテーション': 3,
      '若手・育成枠': 2,
      '控え・バックアップ': 1
    };

    const trust = negotiatingPlayer.managerTrust ?? 70;
    const expectedWage = Math.round(
      currentWage * (negotiatingPlayer.age >= 32 ? 0.92 : negotiatingPlayer.ovr >= 82 ? 1.12 : 1.05)
    );
    const roleDowngraded = roleRanks[proposedRole] < roleRanks[negotiatingPlayer.squadRole];

    const userMsg: HubChatEntry = {
      sender: 'user',
      text: `新しい条件として週給 €${proposedWage.toLocaleString()}、契約期間 ${proposedYears}年、チーム内役割「${proposedRole}」を提示する。`
    };

    if (proposedWage < expectedWage * 0.85 || (roleDowngraded && proposedWage <= currentWage)) {
      const counterWage = Math.max(expectedWage, Math.round((currentWage * 1.08) / 1000) * 1000);
      setChatHistory(prev => [
        ...prev,
        userMsg,
        {
          sender: 'player',
          text: `${roleDowngraded ? '役割の引き下げが含まれるため慎重にならざるを得ません。' : '選手の評価に見合うもう少し高い週給を希望しています。'} 週給 €${counterWage.toLocaleString()} 前後であれば前向きにサインできます。`
        }
      ]);
      setProposedWage(counterWage);
      return;
    }

    // Agreement reached -> atomically update player, wage spend, market value, and smartphone notification
    const updatedPlayerRaw: Player = {
      ...negotiatingPlayer,
      wage: proposedWage,
      contractYears: proposedYears,
      contractYearsRemaining: proposedYears,
      squadRole: proposedRole,
      managerTrust: Math.min(100, trust + 8),
      satisfaction: Math.min(100, (negotiatingPlayer.satisfaction ?? 75) + 10)
    };
    const revaluedPlayer = recalculateDynamicMarketValue(
      updatedPlayerRaw,
      state.currentDate,
      `契約更新・役割見直し（${proposedYears}年）`
    );

    const updatedClub: Club = {
      ...userClub,
      currentWageSpend: Math.max(0, userClub.currentWageSpend + wageDelta)
    };

    let nextState: GameWorldState = {
      ...state,
      players: {
        ...state.players,
        [revaluedPlayer.id]: revaluedPlayer
      },
      clubs: {
        ...state.clubs,
        [updatedClub.id]: updatedClub
      }
    };

    nextState = addSmartphoneNotification(nextState, {
      date: state.currentDate,
      type: 'board',
      title: `契約合意完了：${revaluedPlayer.name}`,
      message: `${revaluedPlayer.name}と週給 €${proposedWage.toLocaleString()}・${proposedYears}年契約・役割「${proposedRole}」で合意しました。`
    });

    onUpdateState(nextState);
    setNegotiationDone(true);
    setChatHistory(prev => [
      ...prev,
      userMsg,
      {
        sender: 'player',
        text: `素晴らしい誠意あるオファーに感謝します！週給 €${proposedWage.toLocaleString()}・${proposedYears}年契約・役割「${proposedRole}」にて合意・サインいたしました！`
      }
    ]);
    setFeedbackBanner(`${revaluedPlayer.name}との契約・役割交渉が成立しました！`);
  };

  if (!userClub) return null;

  const availWage = Math.max(0, userClub.wageBudget - userClub.currentWageSpend);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-950/95 px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                チームハブ — {userClub.name}
              </h3>
              <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                所属 {squadPlayers.length}名 · 空き週給枠 €{availWage.toLocaleString()} / 週 · 移籍予算 €{(userClub.transferBudget / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            aria-label="チームハブを閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {feedbackBanner && (
            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackBanner}</span>
            </div>
          )}

          {negotiatingPlayer ? (
            /* In-Club Contract/Wage/Role Chat View */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold">
                    CLUB CONTRACT & ROLE NEGOTIATION
                  </span>
                  <h4 className="text-base font-bold text-white">
                    {negotiatingPlayer.name} ({negotiatingPlayer.position}, {negotiatingPlayer.age}歳 · OVR {negotiatingPlayer.ovr})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setNegotiatingPlayerId(null)}
                  className="min-h-[40px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
                >
                  選手一覧へ戻る
                </button>
              </div>

              {/* Chat Dialogue Bubbles */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                {chatHistory.map((msg, idx) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'rounded-tr-sm bg-emerald-600/25 border border-emerald-500/40 text-emerald-100'
                            : 'rounded-tl-sm bg-slate-900 border border-slate-800 text-slate-200'
                        }`}
                      >
                        <span className={`text-[10px] font-bold block mb-0.5 ${isUser ? 'text-emerald-300' : 'text-amber-300'}`}>
                          {isUser ? 'あなた（監督）' : `${negotiatingPlayer.name} / 代理人`}
                        </span>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Proposal Controls */}
              {!negotiationDone && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">提示週給 (€)</label>
                    <input
                      type="number"
                      step={1000}
                      min={1000}
                      value={proposedWage}
                      onChange={e => setProposedWage(Math.max(1000, Number(e.target.value)))}
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs font-mono font-bold text-emerald-400 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">契約年数</label>
                    <select
                      value={proposedYears}
                      onChange={e => setProposedYears(Number(e.target.value))}
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs text-white"
                    >
                      <option value={1}>1年</option>
                      <option value={2}>2年</option>
                      <option value={3}>3年</option>
                      <option value={4}>4年</option>
                      <option value={5}>5年</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">チーム内役割</label>
                    <select
                      value={proposedRole}
                      onChange={e => setProposedRole(e.target.value as Player['squadRole'])}
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs text-white"
                    >
                      <option value="絶対的主力">絶対的主力</option>
                      <option value="重要選手">重要選手</option>
                      <option value="ローテーション">ローテーション</option>
                      <option value="若手・育成枠">若手・育成枠</option>
                      <option value="控え・バックアップ">控え・バックアップ</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3 flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSubmitContractProposal}
                      className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                    >
                      新契約条件を提示する
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Squad List Overview */
            <>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="選手名・ポジションで絞り込み..."
                  className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {squadPlayers.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-mono font-bold border border-blue-800">
                            {p.position}
                          </span>
                          <span className="font-bold text-sm text-white truncate">{p.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                          {p.age}歳 · 役割: <span className="text-slate-200 font-sans">{p.squadRole}</span> · 信頼 {p.managerTrust ?? 75}%
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-mono font-black text-emerald-400 tabular-nums">{p.ovr}</div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums">POT {p.potential}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono tabular-nums pt-2 border-t border-slate-800/80">
                      <span>週給 €{p.wage.toLocaleString()}</span>
                      <span>残契約 {p.contractYears}年</span>
                      <span className="text-emerald-400">価値 €{(p.marketValue / 1000000).toFixed(1)}M</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openContractNegotiation(p)}
                        className="flex-1 min-h-[44px] px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>契約・年俸交渉</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onInspectPlayer(p)}
                        className="min-h-[44px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>詳細</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
