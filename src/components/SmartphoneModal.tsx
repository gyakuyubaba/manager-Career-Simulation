import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  AiConnectionStatus,
  AiProviderType,
  FrontOfficeMessageRecord,
  GameWorldState,
  ManagerJobOffer,
  SmartphoneEmail
} from '../types/game';
import {
  analyzeFrontOfficeSquadContext,
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
  Mic,
  Newspaper,
  Repeat2,
  Send,
  Shield,
  ThumbsUp,
  Trophy,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import { ensureTransferPolicyInterview, getPendingTransferInterviews } from '../engine/interviewEngine';
import { resolveTransferInterview } from '../engine/socialRumorEngine';

type SmartphoneAppId =
  | 'launcher'
  | 'news'
  | 'mail'
  | 'notices'
  | 'player_dm'
  | 'front_office'
  | 'notifications'
  | 'transfers'
  | 'matches'
  | 'interviews';

interface Props {
  state: GameWorldState;
  onUpdateState: (newState: GameWorldState) => void;
  onOpenTeamHub: () => void;
  onClose: () => void;
}

const AI_PROVIDER_STORAGE_KEY = 'soccer_mgr_ai_provider_v1';

function readStoredAiProvider(): AiProviderType | null {
  try {
    const raw = window.localStorage.getItem(AI_PROVIDER_STORAGE_KEY);
    return raw === 'gemini' || raw === 'openai' ? raw : null;
  } catch {
    return null;
  }
}

function saveStoredAiProvider(provider: AiProviderType): void {
  try {
    window.localStorage.setItem(AI_PROVIDER_STORAGE_KEY, provider);
  } catch {
    // ignore storage restriction
  }
}

async function safeParseJsonResponse(res: Response): Promise<any | null> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.toLowerCase().includes('application/json')) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchApiJson(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 12000
): Promise<{
  ok: boolean;
  status: number;
  data: any | null;
  isStaticHostHtml: boolean;
  isTimeout: boolean;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const isJson = ct.includes('application/json');
    const data = isJson ? await safeParseJsonResponse(res) : null;
    const isStaticHostHtml = !isJson && ct.includes('text/html');
    return { ok: res.ok && Boolean(data), status: res.status, data, isStaticHostHtml, isTimeout: false };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return { ok: false, status: 0, data: null, isStaticHostHtml: false, isTimeout: isAbort };
  } finally {
    clearTimeout(timer);
  }
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
  const [repostedCommentIds, setRepostedCommentIds] = useState<Record<string, boolean>>({});
  const [newsCategoryFilter, setNewsCategoryFilter] = useState<'all' | 'rumor' | 'match'>('all');
  const [snsFilter, setSnsFilter] = useState<'all' | 'positive' | 'critical' | 'analysis' | 'banter'>('all');
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [foInput, setFoInput] = useState<string>('');
  const [isSendingFo, setIsSendingFo] = useState<boolean>(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AiProviderType>(
    () => readStoredAiProvider() || 'gemini'
  );
  const [aiStatusState, setAiStatusState] = useState<{
    activeProvider: AiProviderType;
    providers: Record<
      AiProviderType,
      {
        configured: boolean;
        model: string;
        status: AiConnectionStatus;
        statusLabel: string;
        lastError?: string;
      }
    >;
    logs: Array<{
      id: string;
      timestamp: string;
      provider: AiProviderType;
      endpoint: string;
      status: AiConnectionStatus;
      statusLabel: string;
      message: string;
    }>;
  } | null>(null);
  const [isTestingAi, setIsTestingAi] = useState<boolean>(false);
  const [isSwitchingAi, setIsSwitchingAi] = useState<boolean>(false);
  const [showAiDiagnostics, setShowAiDiagnostics] = useState<boolean>(false);
  const [aiTestFeedback, setAiTestFeedback] = useState<string | null>(null);

  const switchSeqRef = useRef<number>(0);
  const userTouchedProviderRef = useRef<boolean>(false);

  const effectiveActiveProvider: AiProviderType = selectedProvider;

  const refreshAiStatus = async () => {
    const seqAtStart = switchSeqRef.current;
    const result = await fetchApiJson('/api/ai-status', { method: 'GET' }, 8000);
    if (!result.ok || !result.data?.providers) return;
    const data = result.data;
    if (seqAtStart !== switchSeqRef.current || userTouchedProviderRef.current) {
      setAiStatusState({ ...data, activeProvider: selectedProvider });
      return;
    }

    const storedPref = readStoredAiProvider();
    if (storedPref && data.activeProvider !== storedPref) {
      const syncRes = await fetchApiJson(
        '/api/ai-provider',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: storedPref })
        },
        8000
      );
      if (syncRes.ok && syncRes.data?.providers) {
        setAiStatusState(syncRes.data);
        setSelectedProvider(storedPref);
        return;
      }
      setAiStatusState({ ...data, activeProvider: storedPref });
      setSelectedProvider(storedPref);
      return;
    }

    let nextProvider: AiProviderType = storedPref || data.activeProvider || 'gemini';
    if (!storedPref) {
      const gemConf = Boolean(data.providers.gemini?.configured);
      const oaiConf = Boolean(data.providers.openai?.configured);
      if (!gemConf && oaiConf) nextProvider = 'openai';
      else if (gemConf && !oaiConf) nextProvider = 'gemini';
    }
    setAiStatusState({ ...data, activeProvider: nextProvider });
    setSelectedProvider(nextProvider);
  };

  useEffect(() => {
    if (activeApp === 'front_office') {
      refreshAiStatus();
    }
  }, [activeApp]);

  const handleSwitchAiProvider = async (provider: AiProviderType) => {
    const nextSeq = ++switchSeqRef.current;
    userTouchedProviderRef.current = true;

    setSelectedProvider(provider);
    saveStoredAiProvider(provider);
    setAiStatusState(prev => (prev ? { ...prev, activeProvider: provider } : prev));
    setIsSwitchingAi(true);

    const providerLabel = provider === 'gemini' ? 'Gemini' : 'OpenAI (ChatGPT)';

    try {
      const result = await fetchApiJson(
        '/api/ai-provider',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider })
        },
        8000
      );
      if (nextSeq !== switchSeqRef.current) return;

      if (result.ok && result.data?.providers) {
        setAiStatusState(result.data);
        const provConfigured = result.data.providers?.[provider]?.configured;
        setAiTestFeedback(
          provConfigured
            ? `AIプロバイダーを ${providerLabel} に切り替えました。`
            : `AIプロバイダーを ${providerLabel} に切り替えました（※サーバー側APIキー未設定のためローカル分析フォールバックで動作します）。`
        );
      } else if (result.isStaticHostHtml) {
        setAiTestFeedback(
          `${providerLabel} を選択しました（※静的配信環境のためバックエンドAI APIが利用できずローカル戦力分析で動作します）。`
        );
      } else {
        setAiTestFeedback(
          `${providerLabel} を選択しました（※サーバーAPI未接続環境のためローカル戦力分析で動作します）。`
        );
      }
    } finally {
      if (nextSeq === switchSeqRef.current) {
        setIsSwitchingAi(false);
      }
    }
  };

  const handleRunAiConnectionTest = async () => {
    setIsTestingAi(true);
    setAiTestFeedback(null);
    try {
      const provider = effectiveActiveProvider;
      const result = await fetchApiJson(
        '/api/ai-test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider })
        },
        20000
      );
      if (result.ok && result.data) {
        if (result.data.state) setAiStatusState({ ...result.data.state, activeProvider: provider });
        setAiTestFeedback(result.data.message || result.data.statusLabel || '接続確認完了');
      } else if (result.isStaticHostHtml) {
        setAiTestFeedback('接続不可: 静的サイト配信（GitHub Pages等）では /api/* サーバーが動作しないためローカル戦力分析モードとなります。');
      } else if (result.isTimeout) {
        setAiTestFeedback('接続タイムアウト: サーバーの応答が20秒以内に返りませんでした。');
      } else {
        setAiTestFeedback(`接続テスト不可 (HTTP ${result.status || '通信失敗'} / バックエンドAPI未応答)`);
      }
    } finally {
      setIsTestingAi(false);
    }
  };

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

  const handleToggleRepostComment = (postId: string, commentId: string) => {
    const key = `${postId}_${commentId}`;
    const already = !!repostedCommentIds[key];
    setRepostedCommentIds(prev => ({ ...prev, [key]: !already }));
    const updatedPosts = sp.newsFeed.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        comments: post.comments.map(c =>
          c.id === commentId
            ? { ...c, reposts: Math.max(0, (c.reposts ?? 0) + (already ? -1 : 1)) }
            : c
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

  const handleAnswerTransferInterview = (interviewId: string, choiceId: string) => {
    const res = resolveTransferInterview(safeState, interviewId, choiceId);
    onUpdateState(res.updatedState);
    setActionBanner(`取材回答を公開しました（${res.effectSummary}）`);
    setTimeout(() => setActionBanner(null), 4000);
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

    const foContext = analyzeFrontOfficeSquadContext(safeState);

    const recentMatchesSummary = safeState.fixtures
      .filter(f => f.status === 'finished' && (f.homeClubId === safeState.userClubId || f.awayClubId === safeState.userClubId))
      .slice(-5)
      .reverse()
      .map(f => {
        const isHome = f.homeClubId === safeState.userClubId;
        const oppId = isHome ? f.awayClubId : f.homeClubId;
        const myScore = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
        const oppScore = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
        return {
          date: f.date,
          competition: f.competitionName || f.competition,
          opponent: safeState.clubs[oppId]?.name || oppId,
          score: `${myScore}-${oppScore}`,
          result: myScore > oppScore ? '勝' : myScore < oppScore ? '敗' : '分'
        };
      });

    const recentTransfersSummary = (safeState.transferHistory || [])
      .filter(t => t.buyerClubId === safeState.userClubId || t.sellerClubId === safeState.userClubId)
      .slice(0, 5)
      .map(t => ({
        date: t.date,
        playerName: t.playerName,
        fee: t.fee,
        direction: t.buyerClubId === safeState.userClubId ? '加入' : '放出'
      }));

    const leagueTable = userClub ? (safeState.standings[userClub.league] || []) : [];
    const tableIdx = userClub ? leagueTable.findIndex(r => r.clubId === userClub.id) : -1;
    const standingsPosition = tableIdx >= 0
      ? {
          rank: tableIdx + 1,
          played: leagueTable[tableIdx].played,
          points: leagueTable[tableIdx].points,
          goalDiff: leagueTable[tableIdx].goalDiff
        }
      : null;

    const threadHistorySummary = withUserMsg.smartphone!.frontOfficeThread
      .slice(-8)
      .map(m => ({ sender: m.sender, text: m.text }));

    let replyText = '';
    let proposedAction = undefined;
    let analysisSummary: string | undefined = undefined;
    let recommendations: FrontOfficeMessageRecord['recommendations'] = undefined;
    let modelUsed: string | undefined = undefined;
    let providerUsed: AiProviderType | undefined = effectiveActiveProvider;
    let isAiGenerated: boolean | undefined = undefined;
    let connectionStatus: AiConnectionStatus | undefined = undefined;
    let errorDetail: string | undefined = undefined;

    const result = await fetchApiJson(
      '/api/front-office-message',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: msgText,
          provider: effectiveActiveProvider,
          clubContext: {
            clubName: userClub?.name || 'クラブ',
            currentLeague: userClub?.league || 'league',
            leagueName: userClub?.league || 'league',
            formation: foContext.formation,
            weaknessesSummary: foContext.weaknessesSummary,
            boardConfidence: safeState.boardConfidence,
            transferBudget: userClub?.transferBudget || 0,
            wageBudget: userClub?.wageBudget || 0,
            currentWageSpend: userClub?.currentWageSpend || 0,
            target: userClub?.target || '上位進出'
          },
          squadSummary: foContext.squadSummary,
          recentMatches: recentMatchesSummary,
          recentTransfers: recentTransfersSummary,
          standingsPosition,
          marketTargets: foContext.marketTargets,
          threadHistory: threadHistorySummary
        })
      },
      22000
    );

    if (result.ok && result.data) {
      const data = result.data;
      replyText = data.reply;
      proposedAction = data.proposedAction;
      analysisSummary = data.analysisSummary;
      recommendations = Array.isArray(data.recommendations) ? data.recommendations : undefined;
      modelUsed = data.modelUsed;
      providerUsed = data.providerUsed || effectiveActiveProvider;
      isAiGenerated = Boolean(data.isAiGenerated);
      connectionStatus = data.connectionStatus;
      errorDetail = data.errorDetail;
      refreshAiStatus();
    } else {
      const fallback = buildDeterministicFrontOfficeReply(withUserMsg, msgText);
      replyText = fallback.reply;
      analysisSummary = fallback.analysisSummary;
      recommendations = fallback.recommendations;
      proposedAction = fallback.proposedAction;
      isAiGenerated = false;
      connectionStatus = 'network_error';
      errorDetail = result.isStaticHostHtml
        ? '静的ホスティング環境のためバックエンドAPIが未接続です。ローカル戦力分析で応答しました。'
        : result.isTimeout
          ? 'AI応答がタイムアウトしたためローカル戦力分析で応答しました。'
          : `サーバーとの通信に失敗したためローカル戦力分析で応答しました (${result.status || 'network'})。`;
    }

    const foMsg: FrontOfficeMessageRecord = {
      id: `fo_rep_${Date.now()}`,
      date: withUserMsg.currentDate,
      sender: 'front_office',
      text: replyText,
      analysisSummary,
      recommendations,
      proposedAction,
      modelUsed,
      providerUsed,
      isAiGenerated,
      connectionStatus,
      errorDetail
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
                    } else if (selectedInterviewId) {
                      setSelectedInterviewId(null);
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
                {(() => {
                  const pendingIntCount = getPendingTransferInterviews(safeState).length;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (pendingIntCount === 0) {
                          onUpdateState(ensureTransferPolicyInterview(safeState));
                        }
                        setSelectedInterviewId(null);
                        setActiveApp('interviews');
                      }}
                      className="w-full mt-1.5 min-h-[38px] px-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-sky-500/35 flex items-center justify-between text-[11px] text-sky-300 font-bold cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5" />
                        <span>移籍メディア取材ルーム</span>
                      </span>
                      <span className="font-mono text-emerald-400 tabular-nums">
                        {pendingIntCount > 0 ? `待機 ${pendingIntCount}件 →` : '開く →'}
                      </span>
                    </button>
                  );
                })()}
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

          {/* APP 1: NEWS + みんなの反応・移籍SNS */}
          {activeApp === 'news' && !selectedPost && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white">ニュース・移籍SNSタイムライン</span>
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">{sp.newsFeed.length}件</span>
              </div>

              {/* Quick Interview Bar */}
              {(() => {
                const pendingInts = getPendingTransferInterviews(safeState);
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (pendingInts.length === 0) {
                        const ensured = ensureTransferPolicyInterview(safeState);
                        onUpdateState(ensured);
                      }
                      setActiveApp('interviews');
                    }}
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-sky-500/40 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2 font-bold text-sky-300">
                      <Mic className="w-4 h-4 shrink-0" />
                      <span>移籍報道・監督インタビュー対応</span>
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400 font-bold tabular-nums">
                      {pendingInts.length > 0 ? `待機 ${pendingInts.length}件 →` : '補強方針を語る →'}
                    </span>
                  </button>
                );
              })()}

              {/* Category Filter */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'all' as const, label: 'すべて' },
                  { id: 'rumor' as const, label: '移籍の噂・決定' },
                  { id: 'match' as const, label: '試合・クラブ' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setNewsCategoryFilter(tab.id)}
                    className={`min-h-[38px] rounded-xl text-[11px] font-bold border cursor-pointer transition-colors ${
                      newsCategoryFilter === tab.id
                        ? 'bg-sky-500/20 border-sky-400/60 text-sky-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {sp.newsFeed
                .filter(post => {
                  if (newsCategoryFilter === 'rumor') return Boolean(post.isTransferRumor || post.category === 'transfer');
                  if (newsCategoryFilter === 'match') return post.category !== 'transfer' && !post.isTransferRumor;
                  return true;
                })
                .map(post => {
                  const credColor =
                    post.rumorCredibility === '非常に高い'
                      ? 'text-emerald-400'
                      : post.rumorCredibility === '高い'
                        ? 'text-sky-400'
                        : post.rumorCredibility === '普通'
                          ? 'text-amber-300'
                          : 'text-rose-400';
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => {
                        setSnsFilter('all');
                        markNewsRead(post.id);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        post.isRead
                          ? 'bg-slate-900/70 border-slate-800'
                          : 'bg-slate-900 border-sky-500/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                        <span className="text-sky-400 uppercase font-bold">
                          {post.isTransferRumor ? '移籍SNS' : post.category}
                          {post.mediaSource ? ` · ${post.mediaSource}` : ''}
                        </span>
                        <span className="text-slate-400 tabular-nums">{post.date}</span>
                      </div>
                      <div className="text-xs font-bold text-white leading-snug">{post.title}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{post.summary}</p>
                      {post.isTransferRumor && (
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono pt-0.5">
                          <span className={
                            post.transferStatusLabel === '移籍成立' || post.transferStatusLabel === '契約延長'
                              ? 'text-emerald-400 font-bold'
                              : post.transferStatusLabel === '移籍不成立' || post.transferStatusLabel === '退団決定' || post.transferStatusLabel === '契約満了'
                                ? 'text-rose-400 font-bold'
                                : post.hasFormalOffer
                                  ? 'text-emerald-400 font-bold'
                                  : 'text-amber-300'
                          }>
                            {post.transferStatusLabel || (post.hasFormalOffer ? '正式オファーあり' : '関心・噂段階')}
                          </span>
                          {post.rumorCredibility && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className={`font-bold ${credColor}`}>信頼度: {post.rumorCredibility}</span>
                            </>
                          )}
                        </div>
                      )}
                      <div className="text-[10px] text-emerald-400 font-semibold flex items-center justify-between">
                        <span>💬 SNS反応 {post.comments.length}件を見る →</span>
                        {post.managerStatement && <span className="text-sky-300">🎤 監督コメント反映済</span>}
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {activeApp === 'news' && selectedPost && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-sky-400 uppercase font-bold">
                    {selectedPost.isTransferRumor ? '移籍SNS報道' : selectedPost.category}
                    {selectedPost.mediaSource ? ` · ${selectedPost.mediaSource}` : ''}
                  </span>
                  <span className="tabular-nums">{selectedPost.date}</span>
                </div>
                <h4 className="text-sm font-bold text-white leading-snug">{selectedPost.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedPost.summary}</p>
                {selectedPost.isTransferRumor && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={selectedPost.hasFormalOffer || selectedPost.transferStatusLabel === '移籍成立' ? 'text-emerald-400 font-bold' : 'text-amber-300 font-semibold'}>
                        状態: {selectedPost.transferStatusLabel || (selectedPost.hasFormalOffer ? '正式オファー／クラブ間協議あり' : '正式オファーなし（関心・検討段階）')}
                      </span>
                      {selectedPost.rumorCredibility && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-200 font-bold">信頼度: {selectedPost.rumorCredibility}</span>
                        </>
                      )}
                    </div>
                    {selectedPost.transferMeta && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                        {selectedPost.transferMeta.fromClubName && selectedPost.transferMeta.toClubName && (
                          <span>
                            {selectedPost.transferMeta.fromClubName} → <span className="text-slate-200 font-semibold">{selectedPost.transferMeta.toClubName}</span>
                          </span>
                        )}
                        {selectedPost.transferMeta.transferTypeLabel && (
                          <span>· {selectedPost.transferMeta.transferTypeLabel}</span>
                        )}
                        {selectedPost.transferMeta.feeDisplay && (
                          <span className="text-emerald-300 font-semibold">· {selectedPost.transferMeta.feeDisplay}</span>
                        )}
                        {selectedPost.transferMeta.contractYears !== undefined && (
                          <span>· {selectedPost.transferMeta.contractYears}年契約</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {selectedPost.managerStatement && (
                  <div className="mt-2 p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/35 space-y-1 text-xs">
                    <div className="text-[10px] font-bold text-sky-300">
                      🎤 {safeState.manager.name}監督の公式コメント（{selectedPost.managerStatement.date}）
                    </div>
                    <p className="text-slate-200 leading-relaxed">「{selectedPost.managerStatement.quote}」</p>
                  </div>
                )}
                {(() => {
                  const linkedInt = (safeState.transferInterviews || []).find(
                    i =>
                      i.status === 'pending' &&
                      (i.linkedNewsPostId === selectedPost.id ||
                        (selectedPost.relatedPlayerId && i.relatedPlayerId === selectedPost.relatedPlayerId))
                  );
                  if (!linkedInt) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInterviewId(linkedInt.id);
                        setActiveApp('interviews');
                      }}
                      className="w-full min-h-[44px] mt-1 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span>この報道についての記者インタビューに回答する</span>
                    </button>
                  );
                })()}
              </div>

              {/* SNS Perspective Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                {[
                  { id: 'all' as const, label: `すべて (${selectedPost.comments.length})` },
                  { id: 'positive' as const, label: '肯定・期待' },
                  { id: 'critical' as const, label: '批判・疑問' },
                  { id: 'analysis' as const, label: '戦術・経営' },
                  { id: 'banter' as const, label: 'ネタ・他サポ' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSnsFilter(f.id)}
                    className={`min-h-[44px] px-2.5 rounded-lg border font-bold whitespace-nowrap cursor-pointer ${
                      snsFilter === f.id
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 px-1 flex items-center justify-between">
                  <span>💬 SNSのみんなの反応</span>
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">{selectedPost.comments.length}件投稿</span>
                </div>
                {selectedPost.comments
                  .filter(cmt => {
                    if (snsFilter === 'all') return true;
                    const p = cmt.perspectiveLabel || '';
                    const r = cmt.authorRole || '';
                    if (snsFilter === 'positive') return cmt.sentiment === 'positive';
                    if (snsFilter === 'critical') return cmt.sentiment === 'critical' || p.includes('批判') || p.includes('疑問') || p.includes('懐疑') || p.includes('反対') || p.includes('懸念');
                    if (snsFilter === 'analysis') return p.includes('戦術') || p.includes('経営') || p.includes('財務') || p.includes('移籍金') || p.includes('若手') || p.includes('分析') || r.includes('戦術') || r.includes('財務') || r.includes('育成');
                    if (snsFilter === 'banter') return p.includes('皮肉') || p.includes('ジョーク') || p.includes('ユーモア') || p.includes('ライバル') || p.includes('他クラブ') || p.includes('他サポ') || r.includes('ネタ') || r.includes('皮肉') || r.includes('ライバル');
                    return true;
                  })
                  .map(cmt => {
                    const key = `${selectedPost.id}_${cmt.id}`;
                    const isLiked = !!likedCommentIds[key];
                    const isReposted = !!repostedCommentIds[key];
                    const roleColor =
                      cmt.sentiment === 'positive'
                        ? 'text-emerald-400'
                        : cmt.sentiment === 'critical'
                          ? 'text-rose-400'
                          : cmt.sentiment === 'mixed'
                            ? 'text-amber-300'
                            : 'text-sky-400';
                    return (
                      <div key={cmt.id} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-start justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${cmt.avatar?.bgClass || 'bg-slate-800 text-slate-300'}`}>
                              {cmt.avatar?.emoji || '💬'}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">{cmt.author}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {cmt.handle} · {cmt.authorRole || 'サポ'} · {cmt.postedAt || '数分後'}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold shrink-0 ${roleColor}`}>
                            {cmt.perspectiveLabel || cmt.authorRole || 'サポ反応'}
                          </span>
                        </div>
                        {cmt.replyToAuthor && (
                          <div className="text-[10px] text-sky-400 font-mono">
                            返信先: {cmt.replyToAuthor}
                          </div>
                        )}
                        <p className="text-xs text-slate-200 leading-relaxed">{cmt.text}</p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleToggleLikeComment(selectedPost.id, cmt.id)}
                            className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                              isLiked ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Heart className="w-3 h-3" />
                            <span className="tabular-nums">{cmt.likes}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleRepostComment(selectedPost.id, cmt.id)}
                            className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                              isReposted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Repeat2 className="w-3 h-3" />
                            <span className="tabular-nums">{cmt.reposts ?? 0}</span>
                          </button>
                          {cmt.wave && cmt.wave > 1 && (
                            <span className="text-[10px] text-sky-400 font-semibold ml-auto">続報・会見後</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* APP 9: TRANSFER INTERVIEWS */}
          {activeApp === 'interviews' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-sky-400" />
                  <span>移籍報道・監督インタビュー</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInterviewId(null);
                    setActiveApp('news');
                  }}
                  className="text-[11px] text-sky-400 font-bold cursor-pointer"
                >
                  SNSニュースへ →
                </button>
              </div>

              {(safeState.transferInterviews || []).length === 0 ? (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                  <p className="text-xs text-slate-400">現在待機中の移籍関連メディア取材はありません。</p>
                  <button
                    type="button"
                    onClick={() => onUpdateState(ensureTransferPolicyInterview(safeState))}
                    className="min-h-[44px] px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    補強方針の囲み取材を受ける
                  </button>
                </div>
              ) : (
                (safeState.transferInterviews || [])
                  .filter(inv => !selectedInterviewId || inv.id === selectedInterviewId)
                  .slice(0, 8)
                  .map(inv => (
                    <div key={inv.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="text-sky-400 font-bold">{inv.mediaSource} · {inv.scenarioLabel}</span>
                        <span className="tabular-nums">{inv.createdDate}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        <span className={inv.hasFormalOffer ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
                          {inv.hasFormalOffer ? '正式オファー確認済' : '噂・関心段階'}
                        </span>
                        {inv.credibility ? ` · 信頼度: ${inv.credibility}` : ''}
                      </div>
                      <p className="text-xs font-bold text-white leading-relaxed">「{inv.question}」</p>

                      {inv.status === 'pending' ? (
                        <div className="space-y-1.5 pt-1">
                          {inv.choices.map(ch => (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => handleAnswerTransferInterview(inv.id, ch.id)}
                              className="w-full text-left min-h-[44px] p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 transition-colors cursor-pointer space-y-0.5"
                            >
                              <div className="text-[11px] font-bold text-emerald-300">{ch.label}</div>
                              <div className="text-[11px] text-slate-300 leading-snug">{ch.text}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] space-y-1">
                          <div className="text-emerald-300 font-bold">✓ 回答済み ({inv.answeredDate})</div>
                          <div className="text-slate-200">「{inv.answerText}」</div>
                          {inv.linkedNewsPostId && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInterviewId(null);
                                setActiveApp('news');
                                markNewsRead(inv.linkedNewsPostId!);
                              }}
                              className="text-sky-400 font-bold text-[10px] pt-1 cursor-pointer"
                            >
                              連動したSNS反応を見る →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
              )}
              {selectedInterviewId && (
                <button
                  type="button"
                  onClick={() => setSelectedInterviewId(null)}
                  className="w-full min-h-[40px] rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold cursor-pointer"
                >
                  すべての取材リストを表示
                </button>
              )}
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

          {/* APP 3: FRONT OFFICE CHAT (AI + ACTION BUTTONS + PROVIDER ADMIN) */}
          {activeApp === 'front_office' && (
            <div className="flex flex-col h-full space-y-2.5">
              <div className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-white">強化部・フロントAIホットライン</strong>
                  {(() => {
                    const ap = effectiveActiveProvider;
                    const pState = aiStatusState?.providers?.[ap];
                    const isOk = pState?.status === 'connected';
                    const isMissing = pState?.status === 'api_key_missing';
                    const statusLabel = pState?.statusLabel || (aiStatusState ? '未検証' : 'ローカル分析待機');
                    return (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isOk
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isMissing
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {ap === 'gemini' ? 'Gemini' : 'OpenAI'} · {statusLabel}
                      </span>
                    );
                  })()}
                </div>

                {/* Admin AI Provider Toggle & Connection Check */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-1" role="group" aria-label="AIプロバイダー選択">
                    {(['gemini', 'openai'] as AiProviderType[]).map(prov => {
                      const active = effectiveActiveProvider === prov;
                      const configured = aiStatusState?.providers?.[prov]?.configured;
                      return (
                        <button
                          key={prov}
                          type="button"
                          aria-pressed={active}
                          onClick={() => handleSwitchAiProvider(prov)}
                          className={`min-h-[36px] px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            active
                              ? 'bg-indigo-500/30 border-indigo-400 text-indigo-100 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {prov === 'gemini' ? 'Gemini' : 'OpenAI'}
                          {aiStatusState ? (configured ? ' ●' : ' ○') : active ? ' ✓' : ''}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isTestingAi}
                      onClick={handleRunAiConnectionTest}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-emerald-300 border border-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      {isTestingAi ? '確認中...' : '接続テスト'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAiDiagnostics(v => !v)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700 cursor-pointer"
                    >
                      ログ
                    </button>
                  </div>
                </div>

                {aiTestFeedback && (
                  <div className="text-[10px] text-amber-200 bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
                    {aiTestFeedback}
                  </div>
                )}

                {showAiDiagnostics && aiStatusState && (
                  <div className="text-[10px] bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1 max-h-28 overflow-y-auto">
                    <div className="text-slate-400 font-bold">
                      AI接続診断 (Gemini: {aiStatusState.providers.gemini.statusLabel} / OpenAI: {aiStatusState.providers.openai.statusLabel})
                    </div>
                    {aiStatusState.logs.length === 0 ? (
                      <div className="text-slate-500">まだ診断ログはありません。「接続テスト」を実行できます。</div>
                    ) : (
                      aiStatusState.logs.slice(0, 6).map(l => (
                        <div key={l.id} className="text-slate-300 border-t border-slate-900 pt-1">
                          <span className="font-mono text-indigo-300">[{l.provider}]</span>{' '}
                          <span className="font-bold">{l.statusLabel}:</span> {l.message}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Quick Suggestions */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {[
                  '今のチームの弱点は？',
                  '若手のCBを探して',
                  '50M以内でSTを補強したい',
                  '誰を放出した方がいい？',
                  '現在の予算と週給枠を再配分したい'
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
              <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 min-h-[200px]">
                {sp.frontOfficeThread.map(msg => {
                  const isUser = msg.sender === 'manager';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'rounded-tr-sm bg-emerald-600/25 border border-emerald-500/40 text-emerald-100'
                            : 'rounded-tl-sm bg-slate-950 border border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-slate-400 mb-0.5 flex items-center justify-between gap-2">
                          <span>{isUser ? 'あなた（監督）' : '強化部・フロント'} · {msg.date}</span>
                          {!isUser && msg.isAiGenerated && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[9px]">
                              {msg.providerUsed === 'openai' ? 'OpenAI' : 'Gemini'} AI
                            </span>
                          )}
                          {!isUser && msg.isAiGenerated === false && msg.connectionStatus && msg.connectionStatus !== 'connected' && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-[9px]">
                              {msg.connectionStatus === 'api_key_missing'
                                ? 'APIキー未設定/ローカル分析'
                                : msg.connectionStatus === 'network_error'
                                  ? '通信エラー/ローカル分析'
                                  : '接続失敗/ローカル分析'}
                            </span>
                          )}
                        </div>
                        <p>{msg.text}</p>
                        {!isUser && msg.errorDetail && (
                          <div className="mt-1.5 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-300">
                            診断情報: {msg.errorDetail}
                          </div>
                        )}
                        {!isUser && msg.analysisSummary && (
                          <div className="mt-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
                            <span className="text-[10px] font-bold text-sky-400 block mb-0.5">現状分析</span>
                            <span>{msg.analysisSummary}</span>
                          </div>
                        )}
                        {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {msg.recommendations.map((rec, rIdx) => (
                              <div key={rIdx} className="p-2 rounded-xl bg-slate-900/80 border border-indigo-500/25 text-[11px]">
                                <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 uppercase font-mono">
                                    {rec.category || rec.position || '提案'}
                                  </span>
                                  <span>{rec.title || rec.playerName || 'フロント提案'}</span>
                                </div>
                                <p className="text-slate-300 mt-0.5 leading-snug">{rec.detail || rec.reason || rec.merit || ''}</p>
                              </div>
                            ))}
                          </div>
                        )}
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
                  placeholder="補強条件・選手放出・予算相談などを入力..."
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
