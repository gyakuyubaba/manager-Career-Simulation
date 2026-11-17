import React, { useState, useMemo, useEffect } from 'react';
import { MatchFixture, GameWorldState, NewsItem } from '../../types/game';
import { formatDateJP } from '../../engine/dateEngine';
import {
  generatePostMatchInterviewQuestions,
  InterviewQuestionItem,
  InterviewChoice
} from '../../engine/interviewEngine';
import { MessageSquare, Send, CheckCircle, ThumbsUp, Activity, Sparkles, ChevronRight } from 'lucide-react';

export interface CompletedInterviewRecord {
  id: string;
  fixtureId: string;
  date: string;
  opponentName: string;
  scoreStr: string;
  qa: Array<{ question: string; answer: string; category?: string }>;
  headline: string;
  trustDelta: number;
  boardDelta: number;
}

interface Props {
  fixture: MatchFixture;
  state: GameWorldState;
  onComplete: (
    updatedNews: NewsItem,
    trustDelta: number,
    boardDelta: number,
    interviewRecord?: CompletedInterviewRecord
  ) => void;
  onClose: () => void;
}

export const PressConferenceModal: React.FC<Props> = ({ fixture, state, onComplete, onClose }) => {
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const isUserHome = fixture.homeClubId === state.userClubId;
  const oppClub = state.clubs[isUserHome ? fixture.awayClubId : fixture.homeClubId];

  const userScore = isUserHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0);
  const oppScore = isUserHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0);
  const scoreStr = `${userScore}-${oppScore}`;

  const baseQuestions = useMemo(
    () => generatePostMatchInterviewQuestions({ fixture, state, count: 3 }),
    [fixture.id]
  );

  const [questions, setQuestions] = useState<InterviewQuestionItem[]>(baseQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [managerInput, setManagerInput] = useState('');
  const [qaTranscript, setQaTranscript] = useState<
    Array<{ question: string; answer: string; category: string; trustDelta: number; boardDelta: number }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Optional async AI question enrichment (only applied if user hasn't answered any question yet)
  useEffect(() => {
    let active = true;
    const keyEvents = (fixture.events || [])
      .filter(e => e.type === 'goal' || e.type === 'penalty' || e.type === 'injury' || e.type === 'red_card')
      .slice(0, 8)
      .map(e => `${e.minute}分 ${e.type} ${e.playerName || ''}`)
      .join(' / ');

    const storedProvider = (() => {
      try {
        const v = window.localStorage.getItem('soccer_mgr_ai_provider_v1');
        return v === 'gemini' || v === 'openai' ? v : undefined;
      } catch {
        return undefined;
      }
    })();

    fetch('/api/press-conference-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: storedProvider,
        clubName: userClub?.name || '自クラブ',
        opponentName: oppClub?.name || '相手クラブ',
        scoreStr: `${userClub?.name} ${userScore} - ${oppScore} ${oppClub?.name}`,
        matchContext: `${fixture.competitionName} ${userScore}-${oppScore}`,
        eventsSummary: keyEvents
      })
    })
      .then(res => {
        const ct = res.headers.get('content-type') || '';
        return res.ok && ct.toLowerCase().includes('application/json') ? res.json() : null;
      })
      .then(data => {
        if (!active || !data?.ok || !Array.isArray(data.questions) || data.questions.length === 0) return;
        setQaTranscript(prev => {
          if (prev.length > 0) return prev;
          const validAi = data.questions.filter(
            (q: any) => q?.question && Array.isArray(q.choices) && q.choices.length >= 3
          );
          if (validAi.length > 0) {
            setQuestions(prevQs => {
              const merged = [validAi[0], ...prevQs.slice(1)];
              return merged.slice(0, 3);
            });
          }
          return prev;
        });
      })
      .catch(() => {
        // Keep deterministic questions silently on network/API unavailability
      });

    return () => {
      active = false;
    };
  }, [fixture.id]);

  const activeQuestion = questions[currentQuestionIndex] || questions[0];

  const finalizePressConference = async (
    finalTranscript: Array<{ question: string; answer: string; category: string; trustDelta: number; boardDelta: number }>
  ) => {
    if (finalTranscript.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    const matchOutcomeStr = userScore > oppScore ? '勝利' : userScore === oppScore ? '引き分け' : '敗戦';
    const matchContext = `${userClub?.name} (${userScore} - ${oppScore}, ${matchOutcomeStr}) vs ${oppClub?.name}`;

    const choiceTrustSum = finalTranscript.reduce((sum, item) => sum + item.trustDelta, 0);
    const choiceBoardSum = finalTranscript.reduce((sum, item) => sum + item.boardDelta, 0);
    const latestAnswer = finalTranscript[finalTranscript.length - 1]?.answer || '';
    const interviewId = `interview_${fixture.id}_${Date.now()}`;

    const storedProvider = (() => {
      try {
        const v = window.localStorage.getItem('soccer_mgr_ai_provider_v1');
        return v === 'gemini' || v === 'openai' ? v : undefined;
      } catch {
        return undefined;
      }
    })();

    try {
      const response = await fetch('/api/press-conference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: storedProvider,
          question: finalTranscript[0]?.question,
          managerResponse: latestAnswer,
          qaList: finalTranscript.map(x => ({
            question: x.question,
            answer: x.answer,
            category: x.category
          })),
          matchContext,
          clubName: userClub?.name || '当クラブ',
          managerName: state.manager.name
        })
      });

      const ct = response.headers.get('content-type') || '';
      if (!response.ok || !ct.toLowerCase().includes('application/json')) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const totalTrustDelta = Math.max(-5, Math.min(8, Math.round((choiceTrustSum + (data.playerTrustDelta || 0)) / 2)));
      const totalBoardDelta = Math.max(-5, Math.min(8, Math.round((choiceBoardSum + (data.boardConfidenceDelta || 0)) / 2)));

      const resultObj = {
        ...data,
        playerTrustDelta: totalTrustDelta,
        boardConfidenceDelta: totalBoardDelta
      };
      setAnalysisResult(resultObj);

      const qaDigest = finalTranscript.map((x, idx) => `【Q${idx + 1}: ${x.category}】「${x.answer}」`).join(' ');
      const generatedNews: NewsItem = {
        id: `news_press_${Date.now()}`,
        date: state.currentDate,
        headline: data.headline || `【記者会見】${state.manager.name}監督、${oppClub?.name}戦後に語る`,
        body: `${data.article || latestAnswer}\n\n${qaDigest}`,
        category: 'press',
        relatedClubId: userClub?.id,
        importance: 'high'
      };

      const record: CompletedInterviewRecord = {
        id: interviewId,
        fixtureId: fixture.id,
        date: state.currentDate,
        opponentName: oppClub?.name || '対戦相手',
        scoreStr,
        qa: finalTranscript.map(x => ({ question: x.question, answer: x.answer, category: x.category })),
        headline: generatedNews.headline,
        trustDelta: totalTrustDelta,
        boardDelta: totalBoardDelta
      };

      onComplete(generatedNews, totalTrustDelta, totalBoardDelta, record);
    } catch (err) {
      console.warn('API error, using local fallback:', err);
      const totalTrustDelta = Math.max(-5, Math.min(8, choiceTrustSum));
      const totalBoardDelta = Math.max(-5, Math.min(8, choiceBoardSum));
      const qaDigest = finalTranscript.map((x, idx) => `【Q${idx + 1}: ${x.category}】「${x.answer}」`).join(' ');
      const fallbackNews: NewsItem = {
        id: `news_press_${Date.now()}`,
        date: state.currentDate,
        headline: `【公式会見】${state.manager.name}監督、${oppClub?.name}戦（${scoreStr}）後に見解を語る`,
        body: `「${latestAnswer}」と語った${state.manager.name}監督の発言に、クラブ内外から大きな関心が集まった。\n\n${qaDigest}`,
        category: 'press',
        relatedClubId: userClub?.id,
        importance: 'high'
      };
      setAnalysisResult({
        headline: fallbackNews.headline,
        article: fallbackNews.body,
        fanReaction: totalTrustDelta >= 0 ? 'サポーターは指揮官の言葉に前向きな反応を示しています。' : 'SNS上では様々な議論が交わされています。',
        playerTrustDelta: totalTrustDelta,
        boardConfidenceDelta: totalBoardDelta,
        mediaGrade: totalTrustDelta >= 3 ? 'A' : 'B+'
      });
      const record: CompletedInterviewRecord = {
        id: interviewId,
        fixtureId: fixture.id,
        date: state.currentDate,
        opponentName: oppClub?.name || '対戦相手',
        scoreStr,
        qa: finalTranscript.map(x => ({ question: x.question, answer: x.answer, category: x.category })),
        headline: fallbackNews.headline,
        trustDelta: totalTrustDelta,
        boardDelta: totalBoardDelta
      };
      onComplete(fallbackNews, totalTrustDelta, totalBoardDelta, record);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerQuestion = (answerText: string, choice?: InterviewChoice) => {
    if (!answerText.trim() || isSubmitting || !activeQuestion) return;

    const entry = {
      question: activeQuestion.question,
      answer: answerText.trim(),
      category: activeQuestion.category,
      trustDelta: choice ? choice.trustDelta : 1,
      boardDelta: choice ? choice.boardDelta : 1
    };

    const nextTranscript = [...qaTranscript, entry];
    setQaTranscript(nextTranscript);
    setManagerInput('');

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finalizePressConference(nextTranscript);
    }
  };

  const getToneBadge = (tone: InterviewChoice['tone']) => {
    switch (tone) {
      case 'positive':
        return { text: '称賛・鼓舞', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'tactical':
        return { text: '戦術分析', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
      case 'protective':
        return { text: '選手擁護', cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
      case 'ambitious':
        return { text: '野心・闘志', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'accountable':
        return { text: '責任・反省', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
      case 'critical':
        return { text: '厳しい注文', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
      default:
        return { text: 'コメント', cls: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center p-3 sm:p-6">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-4 sm:my-8 text-left pb-10">

          {/* Header Hero with Press Room Asset */}
          <div className="relative h-44 sm:h-48 w-full bg-slate-950 overflow-hidden">
            <img
              src="/src/assets/images/press_conference_room_1790585065670.jpg"
              alt="Press Room"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/65 to-transparent" />

            <div className="absolute bottom-4 left-5 right-5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>OFFICIAL POST-MATCH PRESS CONFERENCE</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-950/85 border border-slate-700 text-[11px] font-mono text-slate-200">
                  vs {oppClub?.shortName || oppClub?.name} ({scoreStr})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                {userClub?.name} 公式試合後記者会見
              </h2>
              <div className="text-xs text-slate-300 mt-0.5">
                出席: {state.manager.name} 監督 · {formatDateJP(state.currentDate)} · {fixture.competitionName}
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-7 space-y-5">
            {!analysisResult ? (
              <>
                {/* Question Progress Indicator */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    {questions.map((q, idx) => (
                      <span
                        key={q.id}
                        className={`px-2.5 py-1 rounded-lg font-mono font-bold border ${
                          idx === currentQuestionIndex
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : idx < qaTranscript.length
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        Q{idx + 1} · {q.category}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {currentQuestionIndex + 1} / {questions.length} 問目
                  </span>
                </div>

                {/* Previous Answers Summary */}
                {qaTranscript.length > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">これまでの回答ログ</div>
                    {qaTranscript.map((item, idx) => (
                      <div key={idx} className="text-[11px] text-slate-300 border-l-2 border-emerald-500/60 pl-2">
                        <span className="text-emerald-400 font-bold">[{item.category}]</span> 「{item.answer}」
                      </div>
                    ))}
                  </div>
                )}

                {/* Journalist Question Box */}
                {activeQuestion && (
                  <div className="bg-slate-950/85 border border-emerald-500/30 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider">
                        {activeQuestion.reporterRole}からの質問:
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-bold">
                        {activeQuestion.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      「{activeQuestion.question}」
                    </p>
                  </div>
                )}

                {/* Dynamic Match-Context Choice Buttons (4-5 choices per question) */}
                {activeQuestion && (
                  <div>
                    <span className="text-[11px] text-slate-300 block mb-2 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>回答スタンスを選択（{activeQuestion.choices.length}択）:</span>
                    </span>
                    <div className="space-y-2">
                      {activeQuestion.choices.map((choice) => {
                        const badge = getToneBadge(choice.tone);
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => handleAnswerQuestion(choice.text, choice)}
                            disabled={isSubmitting}
                            className="w-full text-left p-3 rounded-xl bg-slate-800/65 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/60 transition-all cursor-pointer space-y-1 group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center gap-1.5">
                                <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{choice.label}</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.cls}`}>
                                {badge.text}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed pl-5">
                              「{choice.text}」
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Free-Text Input Area */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                    <span>または自由記述で直接コメントする</span>
                    <span className="text-[10px] text-emerald-400">※記事内容と信頼度に反映</span>
                  </label>
                  <textarea
                    rows={2}
                    value={managerInput}
                    onChange={e => setManagerInput(e.target.value)}
                    placeholder="例: 試合終盤まで選手たちがハードワークを貫いてくれた。次節に向けてまた良い準備をしたい。"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                  >
                    会見をスキップして退室
                  </button>

                  <div className="flex items-center gap-2">
                    {qaTranscript.length > 0 && (
                      <button
                        type="button"
                        onClick={() => finalizePressConference(qaTranscript)}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 text-sky-200 text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? '記事生成中...' : `ここまでの${qaTranscript.length}問で会見を締める`}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAnswerQuestion(managerInput)}
                      disabled={!managerInput.trim() || isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {isSubmitting
                          ? '会見記事生成中...'
                          : currentQuestionIndex + 1 < questions.length
                            ? '自由コメントで次の質問へ'
                            : '自由コメントで会見完了'}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Media Analysis & Newspaper Result Screen */
              <div className="space-y-5 animate-in fade-in">
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>全{qaTranscript.length}問の記者会見が完了し、各メディアへ記事が配信されました！</span>
                </div>

                {/* Newspaper Clip */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-b border-slate-800 pb-2">
                    <span>FOOTBALL DAILY NEWSWIRE</span>
                    <span className="text-emerald-400 font-bold">メディア評価: {analysisResult.mediaGrade}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {analysisResult.headline}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {analysisResult.article}
                  </p>
                </div>

                {/* Reactions & Morale Impact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
                      <span>サポーター・SNSの反応</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {analysisResult.fanReaction}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>クラブ内インパクト</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div>
                        選手からの信頼度:{' '}
                        <strong className={`font-mono ${analysisResult.playerTrustDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {analysisResult.playerTrustDelta >= 0 ? `+${analysisResult.playerTrustDelta}` : analysisResult.playerTrustDelta}
                        </strong>
                      </div>
                      <div>
                        理事会・フロント評価:{' '}
                        <strong className={`font-mono ${analysisResult.boardConfidenceDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {analysisResult.boardConfidenceDelta >= 0 ? `+${analysisResult.boardConfidenceDelta}` : analysisResult.boardConfidenceDelta}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    会見を終了してホームに戻る
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

