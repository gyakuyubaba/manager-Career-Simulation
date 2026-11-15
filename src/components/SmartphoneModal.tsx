import React, { useState, useMemo } from 'react';
import {
  FrontOfficeMessageRecord,
  GameWorldState,
  ManagerJobOffer,
  SmartphoneEmail
} from '../types/game';
import {
  applyFrontOfficeProposedAction,
  buildDeterministicFrontOfficeReply,
  ensureSmartphoneState,
  getUnreadSmartphoneCount,
  respondToManagerJobOffer,
  respondToPlayerEmail
} from '../engine/smartphoneEngine';
import { formatDateJP } from '../engine/dateEngine';
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  Heart,
  Home,
  Mail,
  MessageSquare,
  Newspaper,
  Send,
  Shield,
  ThumbsUp,
  Trophy,
  UserCheck,
  Users,
  X
} from 'lucide-react';

type SmartphoneAppId =
  | 'launcher'
  | 'news'
  | 'mail'
  | 'notices'
  | 'player_dm'
  | 'front_office'
  | 'notifications'
  | 'transfers'
  | 'matches';

interface Props {
  state: GameWorldState;
  onUpdateState: (newState: GameWorldState) => void;
  onOpenTeamHub: () => void;
  onClose: () => void;
}

export const SmartphoneModal: React.FC<Props> = ({
  state,
  onUpdateState,
  onOpenTeamHub,
  onClose
}) => {
  const safeState = useMemo(() => ensureSmartphoneState(state), [state]);
  const sp = safeState.smartphone!;
  const userClub = safeState.userClubId ? safeState.clubs[safeState.userClubId] : null;

  const [activeApp, setActiveApp] = useState<SmartphoneAppId>('launcher');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});
  const [foInput, setFoInput] = useState<string>('');
  const [isSendingFo, setIsSendingFo] = useState<boolean>(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const unreadTotal = getUnreadSmartphoneCount(safeState);
  const unreadPlayerDms = sp.emails.filter(e => e.senderType === 'player' && !e.isRead).length;
  const pendingJobOffers = (safeState.managerJobOffers || []).filter(o => o.status === 'pending');

  const markNewsRead = (postId: string) => {
    setSelectedPostId(postId);
    const updated = {
      ...safeState,
      smartphone: {
        ...sp,
        newsFeed: sp.newsFeed.map(n => (n.id === postId ? { ...n, isRead: true } : n))
      }
    };
    onUpdateState(updated);
  };

  const markEmailRead = (emailId: string) => {
    setSelectedEmailId(emailId);
    const updated = {
      ...safeState,
      smartphone: {
        ...sp,
        emails: sp.emails.map(e => (e.id === emailId ? { ...e, isRead: true } : e))
      }
    };
    onUpdateState(updated);
  };

  const markAllNotificationsRead = (target: 'notices' | 'notifications') => {
    const updated = {
      ...safeState,
      smartphone: {
        ...sp,
        clubNotices:
          target === 'notices'
            ? sp.clubNotices.map(n => ({ ...n, isRead: true }))
            : sp.clubNotices,
        notifications:
          target === 'notifications'
            ? sp.notifications.map(n => ({ ...n, isRead: true }))
            : sp.notifications
      }
    };
    onUpdateState(updated);
  };

  const handleToggleLikeComment = (postId: string, commentId: string) => {
    const key = `${postId}_${commentId}`;
    const already = !!likedCommentIds[key];
    setLikedCommentIds(prev => ({ ...prev, [key]: !already }));
    const updatedPosts = sp.newsFeed.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        comments: post.comments.map(c =>
          c.id === commentId ? { ...c, likes: Math.max(0, c.likes + (already ? -1 : 1)) } : c
        )
      };
    });
    onUpdateState({
      ...safeState,
      smartphone: {
        ...sp,
        newsFeed: updatedPosts
      }
    });
  };

  const handleReplyPlayerEmail = (emailId: string, optionId: string) => {
    const next = respondToPlayerEmail(safeState, emailId, optionId);
    onUpdateState(next);
    setActionBanner('選手へ返信を送信しました。信頼度・満足度に反映されています。');
    setTimeout(() => setActionBanner(null), 3500);
  };

  const handleJobOfferAction = (offerId: string, action: 'accept' | 'decline' | 'negotiate') => {
    const res = respondToManagerJobOffer(safeState, offerId, action);
    onUpdateState(res.state);
    setActionBanner(res.message);
    setTimeout(() => setActionBanner(null), 4000);
  };

  const handleSendFrontOfficeMessage = async (customText?: string) => {
    const msgText = (customText ?? foInput).trim();
    if (!msgText || isSendingFo) return;

    setFoInput('');
    setIsSendingFo(true);

    const userMsg: FrontOfficeMessageRecord = {
      id: `fo_user_${Date.now()}`,
      date: safeState.currentDate,
      sender: 'manager',
      text: msgText
    };

    const withUserMsg: GameWorldState = {
      ...safeState,
      smartphone: {
        ...sp,
        frontOfficeThread: [...sp.frontOfficeThread, userMsg]
      }
    };
    onUpdateState(withUserMsg);

    const squadSummary = (userClub?.playerIds || [])
      .map(id => safeState.players[id])
      .filter(Boolean)
      .slice(0, 30)
      .map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        ovr: p.ovr,
        marketValue: p.marketValue
      }));

    let replyText = '';
    let proposedAction = undefined;

    try {
      const response = await fetch('/api/front-office-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: msgText,
          clubContext: {
            clubName: userClub?.name || 'クラブ',
            transferBudget: userClub?.transferBudget || 0,
            wageBudget: userClub?.wageBudget || 0,
            currentWageSpend: userClub?.currentWageSpend || 0,
            target: userClub?.target || '上位進出',
            leagueName: userClub?.league || 'league'
          },
          squadSummary
        })
      });

      if (response.ok) {
        const data = await response.json();
        replyText = data.reply;
        proposedAction = data.proposedAction;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch {
      const fallback = buildDeterministicFrontOfficeReply(withUserMsg, msgText);
      replyText = fallback.reply;
      proposedAction = fallback.proposedAction;
    }

    const foMsg: FrontOfficeMessageRecord = {
      id: `fo_rep_${Date.now()}`,
      date: withUserMsg.currentDate,
      sender: 'front_office',
      text: replyText,
      proposedAction
    };

    onUpdateState({
      ...withUserMsg,
      smartphone: {
        ...withUserMsg.smartphone!,
        frontOfficeThread: [...withUserMsg.smartphone!.frontOfficeThread, foMsg].slice(-40)
      }
    });
    setIsSendingFo(false);
  };

  const handleApplyProposedAction = (messageId: string) => {
    const res = applyFrontOfficeProposedAction(safeState, messageId);
    onUpdateState(res.state);
    setActionBanner(res.message);
    setTimeout(() => setActionBanner(null), 4000);
  };

  const selectedPost = sp.newsFeed.find(p => p.id === selectedPostId) || null;
  const selectedEmail: SmartphoneEmail | null = sp.emails.find(e => e.id === selectedEmailId) || null;

  const userMatches = useMemo(() => {
    if (!safeState.userClubId) return [];
    return safeState.fixtures.filter(
      f => f.homeClubId === safeState.userClubId || f.awayClubId === safeState.userClubId
    );
  }, [safeState.fixtures, safeState.userClubId]);

  const recentPlayedMatches = userMatches.filter(f => f.status === 'finished').slice(-6).reverse();
  const upcomingMatches = userMatches.filter(f => f.status === 'upcoming').slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      {/* Smartphone Outer Chassis */}
      <div className="w-full max-w-md h-[88vh] max-h-[820px] min-h-[540px] bg-slate-950 border-[3px] border-slate-700/90 rounded-[36px] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Top Phone Status Bar & Speaker Notch */}
        <div className="bg-slate-900/95 px-5 pt-3 pb-2.5 border-b border-slate-800 shrink-0">
          <div className="w-20 h-1.5 bg-slate-800 rounded-full mx-auto mb-2.5" />
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {activeApp !== 'launcher' && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPostId) {
                      setSelectedPostId(null);
                    } else if (selectedEmailId) {
                      setSelectedEmailId(null);
                    } else {
                      setActiveApp('launcher');
                    }
                  }}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  aria-label="戻る"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="truncate">
                <span className="font-mono font-bold text-emerald-400 tabular-nums">{formatDateJP(safeState.currentDate)}</span>
                <span className="text-[11px] text-slate-400 block truncate">{userClub?.name || '監督携帯'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadTotal > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-bold tabular-nums">
                  未読 {unreadTotal}
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                aria-label="スマホを閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionBanner && (
          <div className="mx-3 mt-2.5 px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionBanner}</span>
          </div>
        )}

        {/* Main Scrollable Screen Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          
          {/* LAUNCHER HOME SCREEN */}
          {activeApp === 'launcher' && (
            <div className="space-y-4">
              {/* Mini Club Summary Widget */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{safeState.manager.name} 監督</span>
                  <span className="font-mono text-emerald-400 font-bold tabular-nums">信頼度 {safeState.boardConfidence}%</span>
                </div>
                <div className="text-sm font-bold text-white">{userClub?.name || 'クラブ未所属'}</div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                  <span>移籍予算 €{((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M</span>
                  <span>監督オファー {pendingJobOffers.length}件</span>
                </div>
              </div>

              {/* App Grid (All buttons >= 44px) */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'news' as const,
                    label: 'ニュース',
                    sub: 'みんなの反応',
                    badge: 0,
                    color: 'bg-sky-500/15 border-sky-500/35 text-sky-300',
                    icon: Newspaper
                  },
                  {
                    id: 'mail' as const,
                    label: 'メール',
                    sub: '返信・オファー',
                    badge: unreadPlayerDms + pendingJobOffers.length,
                    color: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
                    icon: Mail
                  },
                  {
                    id: 'front_office' as const,
                    label: 'フロント連絡',
                    sub: '補強・リスト相談',
                    badge: 0,
                    color: 'bg-indigo-500/15 border-indigo-500/35 text-indigo-300',
                    icon: Building2
                  },
                  {
                    id: 'player_dm' as const,
                    label: '選手DM',
                    sub: '個人メッセージ',
                    badge: unreadPlayerDms,
                    color: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
                    icon: MessageSquare
                  },
                  {
                    id: 'notices' as const,
                    label: 'お知らせ',
                    sub: 'クラブ公式通達',
                    badge: 0,
                    color: 'bg-purple-500/15 border-purple-500/35 text-purple-300',
                    icon: Shield
                  },
                  {
                    id: 'notifications' as const,
                    label: '監督通知',
                    sub: 'スキル・査定',
                    badge: 0,
                    color: 'bg-rose-500/15 border-rose-500/35 text-rose-300',
                    icon: Bell
                  },
                  {
                    id: 'transfers' as const,
                    label: '移籍情報',
                    sub: '市場・オファー',
                    badge: 0,
                    color: 'bg-teal-500/15 border-teal-500/35 text-teal-300',
                    icon: Briefcase
                  },
                  {
                    id: 'matches' as const,
                    label: '試合情報',
                    sub: '日程・結果',
                    badge: 0,
                    color: 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300',
                    icon: Calendar
                  }
                ].map(app => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        setSelectedPostId(null);
                        setSelectedEmailId(null);
                        setActiveApp(app.id);
                      }}
                      className="relative min-h-[92px] p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer active:scale-[0.97]"
                    >
                      {app.badge > 0 && (
                        <span className="absolute top-1.5 right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-black flex items-center justify-center tabular-nums">
                          {app.badge}
                        </span>
                      )}
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${app.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white leading-tight">{app.label}</span>
                      <span className="text-[9px] text-slate-400 leading-tight">{app.sub}</span>
                    </button>
                  );
                })}

                {/* Team Hub App Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTeamHub();
                  }}
                  className="relative min-h-[92px] p-2.5 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/40 flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer active:scale-[0.97]"
                >
                  <div className="w-10 h-10 rounded-xl border bg-emerald-500/20 border-emerald-500/40 text-emerald-300 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-emerald-200 leading-tight">チームハブ</span>
                  <span className="text-[9px] text-emerald-400/80 leading-tight">契約・年俸交渉</span>
                </button>
              </div>
            </div>
          )}

          {/* APP 1: NEWS + みんなの反応 */}
          {activeApp === 'news' && !selectedPost && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>サッカーニュース・試合反響</span>
                <span className="text-[10px] text-slate-400 font-mono">{sp.newsFeed.length}件</span>
              </div>
              {sp.newsFeed.map(post => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => markNewsRead(post.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    post.isRead
                      ? 'bg-slate-900/70 border-slate-800'
                      : 'bg-slate-900 border-sky-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-sky-400 uppercase font-bold">{post.category}</span>
                    <span className="text-slate-400 tabular-nums">{post.date}</span>
                  </div>
                  <div className="text-xs font-bold text-white leading-snug">{post.title}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{post.summary}</p>
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    💬 みんなの反応 {post.comments.length}件を見る →
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeApp === 'news' && selectedPost && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-sky-400 uppercase font-bold">{selectedPost.category}</span>
                  <span className="tabular-nums">{selectedPost.date}</span>
                </div>
                <h4 className="text-sm font-bold text-white leading-snug">{selectedPost.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedPost.summary}</p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 px-1">
                  💬 みんなの反応（試合結果・内容連動コメント）
                </div>
                {selectedPost.comments.map(cmt => {
                  const likeKey = `${selectedPost.id}_${cmt.id}`;
                  const isLiked = !!likedCommentIds[likeKey];
                  const sentimentBadge =
                    cmt.sentiment === 'positive'
                      ? 'text-emerald-400'
                      : cmt.sentiment === 'critical'
                        ? 'text-rose-400'
                        : 'text-slate-400';
                  return (
                    <div key={cmt.id} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="font-bold text-white">
                          {cmt.author} <span className={`font-mono font-normal ${sentimentBadge}`}>{cmt.handle}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleLikeComment(selectedPost.id, cmt.id)}
                          className={`min-h-[32px] px-2 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                            isLiked ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Heart className="w-3 h-3" />
                          <span className="tabular-nums">{cmt.likes}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{cmt.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* APP 2 & 4: MAIL & PLAYER DM */}
          {(activeApp === 'mail' || activeApp === 'player_dm') && !selectedEmail && (
            <div className="space-y-3">
              {/* Pending Manager Job Offers Highlight */}
              {activeApp === 'mail' && pendingJobOffers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-amber-300">
                    🏆 届いている監督就任オファー ({pendingJobOffers.length}件)
                  </div>
                  {pendingJobOffers.map((offer: ManagerJobOffer) => (
                    <div key={offer.id} className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{offer.clubName}</span>
                        <span className="text-[10px] font-mono text-amber-300">{offer.leagueName}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{offer.message}</p>
                      <div className="text-[11px] font-mono text-emerald-300 tabular-nums">
                        契約{offer.contractYears}年 / 週給 €{offer.weeklyWage.toLocaleString()} / 予算 €{(offer.transferBudget / 1000000).toFixed(1)}M
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleJobOfferAction(offer.id, 'accept')}
                          className="min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          受諾して就任
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJobOfferAction(offer.id, 'negotiate')}
                          className="min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                        >
                          条件交渉
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJobOfferAction(offer.id, 'decline')}
                          className="min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                        >
                          辞退
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs font-bold text-white">
                {activeApp === 'player_dm' ? '選手からの個別メッセージ' : '受信メールボックス'}
              </div>
              {sp.emails
                .filter(e => activeApp === 'mail' || e.senderType === 'player')
                .map(email => (
                  <button
                    key={email.id}
                    type="button"
                    onClick={() => markEmailRead(email.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                      email.isRead
                        ? 'bg-slate-900/70 border-slate-800'
                        : 'bg-slate-900 border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-emerald-400">{email.senderName}</span>
                      <span className="text-slate-400 font-mono tabular-nums">{email.date}</span>
                    </div>
                    <div className="text-xs font-bold text-white">{email.subject}</div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{email.body}</p>
                    <div className="text-[10px] font-semibold text-slate-500">
                      {email.isReplied ? `✓ 返信済み (${email.replyChosenLabel || '対応済'})` : email.replyOptions ? '💬 返信選択あり' : 'タップして詳細を見る'}
                    </div>
                  </button>
                ))}
            </div>
          )}

          {(activeApp === 'mail' || activeApp === 'player_dm') && selectedEmail && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-emerald-400 block">{selectedEmail.senderName}</span>
                    <span className="text-slate-500">{selectedEmail.senderRole}</span>
                  </div>
                  <span className="text-slate-400 font-mono tabular-nums">{selectedEmail.date}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{selectedEmail.subject}</h4>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{selectedEmail.body}</p>
              </div>

              {selectedEmail.isReplied && selectedEmail.replyText && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1 ml-4">
                  <div className="text-[10px] font-bold text-emerald-400">あなたの返信 ({selectedEmail.replyDate})</div>
                  <p className="text-emerald-100 leading-relaxed">{selectedEmail.replyText}</p>
                </div>
              )}

              {!selectedEmail.isReplied && selectedEmail.replyOptions && selectedEmail.replyOptions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">返信を選択してください:</div>
                  {selectedEmail.replyOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleReplyPlayerEmail(selectedEmail.id, opt.id)}
                      className="w-full min-h-[48px] text-left p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 space-y-1 cursor-pointer transition-colors"
                    >
                      <div className="text-xs font-bold text-emerald-300">{opt.label}</div>
                      <div className="text-[11px] text-slate-300">「{opt.replyPreview}」</div>
                      <div className="text-[10px] text-slate-500">{opt.outcomeDescription}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* APP 3: FRONT OFFICE CHAT (AI + ACTION BUTTONS) */}
          {activeApp === 'front_office' && (
            <div className="flex flex-col h-full space-y-3">
              <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl p-3">
                <strong className="text-white block mb-1">強化部・フロント直通ホットライン</strong>
                補強方針・予算再配分・選手の移籍リストやレンタル登録の相談を送信できます。
              </div>

              {/* Quick Suggestions */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {[
                  '補強ポイントを分析してほしい',
                  '現在の予算と週給枠を再配分したい',
                  '放出候補の選手を整理したい'
                ].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendFrontOfficeMessage(q)}
                    className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 whitespace-nowrap cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Thread */}
              <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 min-h-[220px]">
                {sp.frontOfficeThread.map(msg => {
                  const isUser = msg.sender === 'manager';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'rounded-tr-sm bg-emerald-600/25 border border-emerald-500/40 text-emerald-100'
                            : 'rounded-tl-sm bg-slate-950 border border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-slate-400 mb-0.5">
                          {isUser ? 'あなた（監督）' : '強化部・フロント'} · {msg.date}
                        </div>
                        <p>{msg.text}</p>
                        {msg.proposedAction && msg.proposedAction.type !== 'none' && (
                          <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5">
                            <div className="text-[11px] font-bold text-amber-300">
                              提案: {msg.proposedAction.summary}
                            </div>
                            {msg.proposedAction.applied ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                                <Check className="w-3.5 h-3.5" /> 実行済み
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApplyProposedAction(msg.id)}
                                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                              >
                                この提案を承認・実行する
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isSendingFo && (
                  <div className="text-xs text-slate-400 px-2">フロントが回答を作成中...</div>
                )}
              </div>

              {/* Input Row */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={foInput}
                  onChange={e => setFoInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendFrontOfficeMessage();
                  }}
                  placeholder="選手名＋放出/レンタル、予算相談などを入力..."
                  className="flex-1 min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={!foInput.trim() || isSendingFo}
                  onClick={() => handleSendFrontOfficeMessage()}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 cursor-pointer"
                  aria-label="送信"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* APP 5 & 6: CLUB NOTICES & MANAGER NOTIFICATIONS */}
          {(activeApp === 'notices' || activeApp === 'notifications') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {activeApp === 'notices' ? 'クラブからの公式お知らせ' : '監督の通知（成長・衰退・査定）'}
                </span>
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead(activeApp)}
                  className="min-h-[36px] px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-bold cursor-pointer"
                >
                  すべて既読にする
                </button>
              </div>
              {(activeApp === 'notices' ? sp.clubNotices : sp.notifications).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                  新しい通知はまだありません。
                </div>
              ) : (
                (activeApp === 'notices' ? sp.clubNotices : sp.notifications).map(item => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border space-y-1 ${
                      item.isRead ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-900 border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 uppercase font-bold">{item.type}</span>
                      <span className="text-slate-400 tabular-nums">{item.date}</span>
                    </div>
                    <div className="text-xs font-bold text-white">{item.title}</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{item.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* APP 7: TRANSFERS FEED */}
          {activeApp === 'transfers' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-white">最新移籍・オファー動向</div>
              {(safeState.incomingOffers || []).filter(o => o.status === 'pending').length > 0 && (
                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-300">
                    届いている獲得オファー（移籍市場タブで回答可能）
                  </div>
                  {(safeState.incomingOffers || [])
                    .filter(o => o.status === 'pending')
                    .map(o => {
                      const p = safeState.players[o.playerId];
                      const buyer = safeState.clubs[o.buyerClubId];
                      return (
                        <div key={o.id} className="text-[11px] text-slate-200 flex justify-between">
                          <span>{p?.name || o.playerId} ← {buyer?.shortName || o.buyerClubId}</span>
                          <span className="font-mono text-emerald-400 tabular-nums">€{(o.fee / 1000000).toFixed(1)}M</span>
                        </div>
                      );
                    })}
                </div>
              )}

              {(safeState.transferHistory || []).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                  成立した移籍取引はまだありません。
                </div>
              ) : (
                (safeState.transferHistory || []).slice(0, 20).map(tr => (
                  <div key={tr.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{tr.playerName}</div>
                      <div className="text-[10px] text-slate-400">
                        {safeState.clubs[tr.sellerClubId]?.shortName || tr.sellerClubId} → {safeState.clubs[tr.buyerClubId]?.shortName || tr.buyerClubId}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono text-emerald-400 font-bold tabular-nums">
                      €{(tr.fee / 1000000).toFixed(1)}M
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* APP 8: MATCHES FEED */}
          {activeApp === 'matches' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-white">直近の試合結果</div>
              {recentPlayedMatches.length === 0 ? (
                <div className="p-4 text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                  消化済みの公式戦はまだありません。
                </div>
              ) : (
                recentPlayedMatches.map(m => (
                  <div key={m.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-mono block tabular-nums">{m.date} · {m.competitionName}</span>
                      <span className="font-bold text-white truncate block">
                        {safeState.clubs[m.homeClubId]?.shortName || m.homeClubId} vs {safeState.clubs[m.awayClubId]?.shortName || m.awayClubId}
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-400 text-sm shrink-0 tabular-nums">
                      {m.homeScore} - {m.awayScore}
                    </span>
                  </div>
                ))
              )}

              <div className="text-xs font-bold text-white pt-1">今後の試合予定</div>
              {upcomingMatches.map(m => (
                <div key={m.id} className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-mono block tabular-nums">{m.date} · {m.competitionName}</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {safeState.clubs[m.homeClubId]?.shortName || m.homeClubId} vs {safeState.clubs[m.awayClubId]?.shortName || m.awayClubId}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 shrink-0">予定</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="bg-slate-900/95 px-5 py-2.5 border-t border-slate-800 flex items-center justify-around shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedPostId(null);
              setSelectedEmailId(null);
              setActiveApp('launcher');
            }}
            className="min-h-[40px] px-4 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>ホーム</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPostId(null);
              setSelectedEmailId(null);
              setActiveApp('mail');
            }}
            className="min-h-[40px] px-4 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>メール</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPostId(null);
              setSelectedEmailId(null);
              setActiveApp('front_office');
            }}
            className="min-h-[40px] px-4 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>フロント</span>
          </button>
        </div>

      </div>
    </div>
  );
};
