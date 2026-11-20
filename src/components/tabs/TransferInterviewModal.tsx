import React, { useState } from 'react';
import {
  GameWorldState,
  SmartphoneNewsComment,
  TransferInterviewRequest
} from '../../types/game';
import { resolveTransferInterview } from '../../engine/socialRumorEngine';
import { formatDateJP } from '../../engine/dateEngine';
import {
  CheckCircle2,
  Heart,
  MessageSquare,
  Mic,
  Repeat2,
  Send,
  X
} from 'lucide-react';

interface Props {
  interview: TransferInterviewRequest;
  state: GameWorldState;
  onUpdateState: (newState: GameWorldState) => void;
  onClose: () => void;
}

export const TransferInterviewModal: React.FC<Props> = ({
  interview,
  state,
  onUpdateState,
  onClose
}) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>('');
  const [resultView, setResultView] = useState<{
    headline: string;
    effectSummary: string;
    reactiveComments: SmartphoneNewsComment[];
    answerQuote: string;
  } | null>(null);

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const credibilityColor =
    interview.credibility === '非常に高い'
      ? 'text-emerald-400'
      : interview.credibility === '高い'
        ? 'text-sky-400'
        : interview.credibility === '普通'
          ? 'text-amber-300'
          : 'text-rose-400';

  const handleAnswer = (choiceId: string, overrideText?: string) => {
    const choice = interview.choices.find(c => c.id === choiceId) || interview.choices[0];
    if (!choice) return;
    const res = resolveTransferInterview(state, interview.id, choice.id, overrideText);
    onUpdateState(res.updatedState);
    setResultView({
      headline: res.headline,
      effectSummary: res.effectSummary,
      reactiveComments: res.reactiveComments,
      answerQuote: overrideText?.trim() ? overrideText.trim() : choice.text
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-sky-400 font-bold">
              <Mic className="w-4 h-4 shrink-0" />
              <span>移籍・補強 メディア囲み取材</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {interview.mediaSource} · {interview.reporterRole} · {formatDateJP(interview.createdDate)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {!resultView ? (
            <>
              {/* Fact-Check Context Strip */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-bold text-slate-200">{interview.scenarioLabel}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className={interview.hasFormalOffer ? 'text-emerald-400 font-bold' : 'text-amber-300 font-semibold'}>
                      {interview.hasFormalOffer ? '事実確認: 正式オファー／協議中' : '事実確認: 噂・関心段階（正式オファーなし）'}
                    </span>
                    {interview.credibility && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className={`font-bold ${credibilityColor}`}>信頼度: {interview.credibility}</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {userClub?.name} ({state.manager.name}監督) への取材背景: {interview.contextSummary}
                </p>
              </div>

              {/* Journalist Question */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80 space-y-2">
                <div className="text-[11px] font-bold text-sky-400">
                  {interview.mediaSource}（{interview.reporterRole}）からの質問
                </div>
                <p className="text-sm font-bold text-white leading-relaxed">
                  「{interview.question}」
                </p>
              </div>

              {/* Choice Options (3-5 nuanced answers) */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">
                  回答スタンスを選択してください（選択に応じてSNS反応・選手関心・報道が変化）
                </div>
                {interview.choices.map(choice => {
                  const isPicked = selectedChoiceId === choice.id;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleAnswer(choice.id)}
                      onMouseEnter={() => setSelectedChoiceId(choice.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 min-h-[44px] ${
                        isPicked
                          ? 'bg-slate-800/95 border-emerald-500/60'
                          : 'bg-slate-900/90 hover:bg-slate-800/80 border-slate-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-300">{choice.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">選択して回答 →</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">「{choice.text}」</p>
                      <div className="text-[10px] text-slate-400 pt-0.5">{choice.effectSummary}</div>
                    </button>
                  );
                })}
              </div>

              {/* Optional Custom Free Comment */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block">
                  または自由コメントで補足して回答する（上のスタンスと組み合わせ可）
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="例：我々は冷静に市場を見極めている。良い話があれば動く。"
                    className="flex-1 min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={!customText.trim()}
                    onClick={() => handleAnswer(interview.choices[2]?.id || interview.choices[0].id, customText)}
                    className="min-h-[44px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>自由回答</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Post-Answer Immediate Media & SNS Reaction View */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>取材記事が配信され、SNSで反応が広がっています</span>
                </div>
                <h4 className="text-sm font-bold text-white">{resultView.headline}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {state.manager.name}監督コメント: 「{resultView.answerQuote}」
                </p>
                <div className="text-[11px] text-emerald-300 font-semibold pt-1">
                  波及効果: {resultView.effectSummary}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    <span>会見直後のSNSタイムライン反応 ({resultView.reactiveComments.length}件追加)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">スマホのニュースでも全件確認可</span>
                </div>

                {resultView.reactiveComments.map(cmt => (
                  <div key={cmt.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${cmt.avatar?.bgClass || 'bg-slate-800 text-slate-300'}`}>
                          {cmt.avatar?.emoji || '💬'}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{cmt.author}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {cmt.handle} · {cmt.authorRole || 'サポ'} · {cmt.postedAt || '直後'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{cmt.perspectiveLabel}</span>
                    </div>
                    {cmt.replyToAuthor && (
                      <div className="text-[10px] text-sky-400 font-mono">返信先: {cmt.replyToAuthor}</div>
                    )}
                    <p className="text-xs text-slate-200 leading-relaxed">{cmt.text}</p>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 tabular-nums pt-0.5">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" /> {cmt.likes}</span>
                      <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3 text-emerald-400" /> {cmt.reposts ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  確認して閉じる
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
