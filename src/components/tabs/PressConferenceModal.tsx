import React, { useState } from 'react';
import { MatchFixture, GameWorldState, NewsItem } from '../../types/game';
import { formatDateJP } from '../../engine/dateEngine';
import { MessageSquare, Send, CheckCircle, Newspaper, ThumbsUp, Activity, Sparkles } from 'lucide-react';

interface Props {
  fixture: MatchFixture;
  state: GameWorldState;
  onComplete: (updatedNews: NewsItem, trustDelta: number, boardDelta: number) => void;
  onClose: () => void;
}

const DEFAULT_QUESTIONS = [
  '「本日の試合結果について、指揮官としての総括をお聞かせください。」',
  '「今日の戦術的な変更や選手起用の狙いは、意図通りに機能したとお考えですか？」',
  '「サポーターから熱烈な声援が送られていましたが、次節に向けた意気込みを教えてください。」'
];

const QUICK_RESPONSES = [
  '選手たちが最後までプランを信じてハードワークしてくれた。誇りに思う。',
  '結果には満足しているが、まだ改善すべき課題はある。次節へ向けて気を引き締めたい。',
  '判定に疑問はあるが、審判の判断を受け入れる。我々は自分たちのフットボールを貫くだけだ。',
  '若手の台頭と主力のリーダーシップが融合した素晴らしいパフォーマンスだった。'
];

export const PressConferenceModal: React.FC<Props> = ({ fixture, state, onComplete, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [managerInput, setManagerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const oppClub = state.clubs[fixture.homeClubId === state.userClubId ? fixture.awayClubId : fixture.homeClubId];

  const question = DEFAULT_QUESTIONS[currentQuestionIndex];

  const handleSubmitStatement = async (statementText: string) => {
    if (!statementText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const isUserHome = fixture.homeClubId === state.userClubId;
    const userScore = isUserHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0);
    const oppScore = isUserHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0);
    const matchOutcomeStr = userScore > oppScore ? '勝利' : userScore === oppScore ? '引き分け' : '敗戦';
    const matchContext = `${userClub?.name} (${userScore} - ${oppScore}, ${matchOutcomeStr}) vs ${oppClub?.name}`;

    try {
      const response = await fetch('/api/press-conference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          managerResponse: statementText,
          matchContext,
          clubName: userClub?.name || '当クラブ',
          managerName: state.manager.name
        })
      });

      const data = await response.json();
      setAnalysisResult(data);

      const generatedNews: NewsItem = {
        id: `news_press_${Date.now()}`,
        date: state.currentDate,
        headline: data.headline || `【記者会見】${state.manager.name}監督の試合後コメント`,
        body: data.article || statementText,
        category: 'press',
        relatedClubId: userClub?.id,
        importance: 'high'
      };

      onComplete(generatedNews, data.playerTrustDelta || 1, data.boardConfidenceDelta || 1);
    } catch (err) {
      console.warn('API error, using local fallback:', err);
      const fallbackNews: NewsItem = {
        id: `news_press_${Date.now()}`,
        date: state.currentDate,
        headline: `【公式会見】${state.manager.name}監督、試合後に意気込みを語る`,
        body: `「${statementText}」と語った${state.manager.name}監督の発言に、ファンや選手からも強い信頼が寄せられた。`,
        category: 'press',
        relatedClubId: userClub?.id,
        importance: 'high'
      };
      setAnalysisResult({
        headline: fallbackNews.headline,
        article: fallbackNews.body,
        fanReaction: 'サポーターは好意的に受け止めています。',
        playerTrustDelta: 2,
        boardConfidenceDelta: 1,
        mediaGrade: 'A'
      });
      onComplete(fallbackNews, 2, 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center p-3 sm:p-6">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-4 sm:my-8 text-left pb-10">
        
        {/* Header Hero with Press Room Asset */}
        <div className="relative h-44 sm:h-52 w-full bg-slate-950 overflow-hidden">
          <img
            src="/src/assets/images/press_conference_room_1790585065670.jpg"
            alt="Press Room"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono tracking-wider mb-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>OFFICIAL POST-MATCH PRESS CONFERENCE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              {userClub?.name} 公式試合後記者会見
            </h2>
            <div className="text-xs text-slate-300 mt-0.5">
              出席: {state.manager.name} 監督 · {formatDateJP(state.currentDate)}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-5">
          {!analysisResult ? (
            <>
              {/* Journalist Question Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  フットボール専門記者からの質問:
                </span>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {question}
                </p>
              </div>

              {/* Free-Text Input Area */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>監督コメントを入力（自由回答形式）</span>
                  <span className="text-[10px] text-emerald-400">※AIが感情と戦術意図を記事化</span>
                </label>
                <textarea
                  rows={3}
                  value={managerInput}
                  onChange={e => setManagerInput(e.target.value)}
                  placeholder="例: 前半の戦術修正が的中した。選手たちの集中力とサポーターの声援に感謝したい。"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Template Choices */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-2 font-semibold">
                  またはクイック回答テンプレートを選択:
                </span>
                <div className="space-y-1.5">
                  {QUICK_RESPONSES.map((tmpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setManagerInput(tmpl);
                        handleSubmitStatement(tmpl);
                      }}
                      disabled={isSubmitting}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      「{tmpl}」
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  会見を終了して退室
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitStatement(managerInput)}
                  disabled={!managerInput.trim() || isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? '会見記事生成中...' : '会見コメントを発表'}</span>
                </button>
              </div>
            </>
          ) : (
            /* Media Analysis & Newspaper Result Screen */
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>記者会見が終了し、各メディアへ速報記事が配信されました！</span>
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
                <p className="text-xs text-slate-300 leading-relaxed">
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
                    <div>選手からの信頼度: <strong className="text-emerald-400 font-mono">+{analysisResult.playerTrustDelta}</strong></div>
                    <div>理事会・フロント評価: <strong className="text-emerald-400 font-mono">+{analysisResult.boardConfidenceDelta}</strong></div>
                  </div>
                </div>
              </div>

              <div className="text-right pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20"
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
