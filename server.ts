import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '1mb' }));

type AiProviderType = 'gemini' | 'openai';
type AiConnectionStatus =
  | 'connected'
  | 'connection_failed'
  | 'api_key_missing'
  | 'network_error'
  | 'generation_error'
  | 'unknown';

interface AiDiagnosticLog {
  id: string;
  timestamp: string;
  provider: AiProviderType;
  endpoint: string;
  status: AiConnectionStatus;
  statusLabel: string;
  message: string;
}

const GEMINI_MODEL = 'gemini-4-hydrogen';
const getOpenAIModel = () => (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim() || 'gpt-4o-mini';

const PLACEHOLDER_KEYS = new Set([
  'MY_GEMINI_API_KEY',
  'MY_OPENAI_API_KEY',
  'YOUR_API_KEY',
  'REPLACE_ME',
  'undefined',
  'null'
]);

function resolveServerKey(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || PLACEHOLDER_KEYS.has(trimmed)) return null;
  return trimmed;
}

function getStatusLabel(status: AiConnectionStatus): string {
  switch (status) {
    case 'connected':
      return '接続成功';
    case 'api_key_missing':
      return 'APIキー未設定';
    case 'network_error':
      return '通信エラー';
    case 'generation_error':
      return '回答生成エラー';
    case 'connection_failed':
      return '接続失敗';
    default:
      return '未検証';
  }
}

function sanitizeErrorMessage(err: unknown, keysToMask: Array<string | null>): string {
  const raw = err instanceof Error ? err.message : String(err || 'Unknown AI error');
  let safe = raw.replace(/AIza[0-9A-Za-z\-_]{10,}/g, '[REDACTED_KEY]')
    .replace(/sk-[0-9A-Za-z\-_]{10,}/g, '[REDACTED_KEY]')
    .replace(/Bearer\s+[0-9A-Za-z\-_.]+/gi, 'Bearer [REDACTED]');
  for (const k of keysToMask) {
    if (k && k.length >= 6) {
      safe = safe.split(k).join('[REDACTED_KEY]');
    }
  }
  return safe.slice(0, 220);
}

function classifyProviderError(err: unknown): AiConnectionStatus {
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  if (
    msg.includes('api key') ||
    msg.includes('apikey') ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('unauthorized') ||
    msg.includes('permission denied')
  ) {
    return 'connection_failed';
  }
  if (
    msg.includes('fetch failed') ||
    msg.includes('enotfound') ||
    msg.includes('etimedout') ||
    msg.includes('econnrefused') ||
    msg.includes('network') ||
    msg.includes('abort') ||
    msg.includes('timeout')
  ) {
    return 'network_error';
  }
  if (msg.includes('json') || msg.includes('parse') || msg.includes('empty response')) {
    return 'generation_error';
  }
  return 'connection_failed';
}

function getGeminiClient(): { client: GoogleGenAI | null; key: string | null } {
  const key = resolveServerKey(process.env.GEMINI_API_KEY);
  if (!key) return { client: null, key: null };
  return {
    client: new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    }),
    key
  };
}

function getOpenAIKey(): string | null {
  return resolveServerKey(process.env.OPENAI_API_KEY);
}

// Runtime AI admin preference & sanitized diagnostics
let activeProvider: AiProviderType = getGeminiClient().key
  ? 'gemini'
  : getOpenAIKey()
    ? 'openai'
    : 'gemini';

const providerRuntimeState: Record<
  AiProviderType,
  { status: AiConnectionStatus; statusLabel: string; lastCheckedAt?: string; lastError?: string }
> = {
  gemini: {
    status: getGeminiClient().key ? 'unknown' : 'api_key_missing',
    statusLabel: getGeminiClient().key ? '待機中 (未テスト)' : getStatusLabel('api_key_missing'),
    lastError: getGeminiClient().key ? undefined : 'サーバー環境変数 GEMINI_API_KEY が未設定です'
  },
  openai: {
    status: getOpenAIKey() ? 'unknown' : 'api_key_missing',
    statusLabel: getOpenAIKey() ? '待機中 (未テスト)' : getStatusLabel('api_key_missing'),
    lastError: getOpenAIKey() ? undefined : 'サーバー環境変数 OPENAI_API_KEY が未設定です'
  }
};

const diagnosticLogs: AiDiagnosticLog[] = [];

function recordDiagnostic(
  provider: AiProviderType,
  endpoint: string,
  status: AiConnectionStatus,
  message: string
) {
  const label = getStatusLabel(status);
  providerRuntimeState[provider] = {
    status,
    statusLabel: label,
    lastCheckedAt: new Date().toISOString(),
    lastError: status === 'connected' ? undefined : message
  };
  diagnosticLogs.unshift({
    id: `diag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    provider,
    endpoint,
    status,
    statusLabel: label,
    message
  });
  if (diagnosticLogs.length > 20) diagnosticLogs.pop();
}

function buildAiStatusPayload() {
  const gKey = resolveServerKey(process.env.GEMINI_API_KEY);
  const oKey = resolveServerKey(process.env.OPENAI_API_KEY);

  if (!gKey) {
    providerRuntimeState.gemini.status = 'api_key_missing';
    providerRuntimeState.gemini.statusLabel = getStatusLabel('api_key_missing');
  } else if (providerRuntimeState.gemini.status === 'api_key_missing') {
    providerRuntimeState.gemini.status = 'unknown';
    providerRuntimeState.gemini.statusLabel = '待機中 (未テスト)';
    providerRuntimeState.gemini.lastError = undefined;
  }

  if (!oKey) {
    providerRuntimeState.openai.status = 'api_key_missing';
    providerRuntimeState.openai.statusLabel = getStatusLabel('api_key_missing');
  } else if (providerRuntimeState.openai.status === 'api_key_missing') {
    providerRuntimeState.openai.status = 'unknown';
    providerRuntimeState.openai.statusLabel = '待機中 (未テスト)';
    providerRuntimeState.openai.lastError = undefined;
  }

  return {
    activeProvider,
    providers: {
      gemini: {
        configured: Boolean(gKey),
        model: GEMINI_MODEL,
        ...providerRuntimeState.gemini
      },
      openai: {
        configured: Boolean(oKey),
        model: getOpenAIModel(),
        ...providerRuntimeState.openai
      }
    },
    logs: diagnosticLogs
  };
}

async function callOpenAIChatCompletion(
  systemInstruction: string,
  userPrompt: string,
  expectJson: boolean = true
): Promise<string> {
  const openAiKey = getOpenAIKey();
  if (!openAiKey) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  try {
    const makeBody = (useCompletionTokens: boolean): Record<string, unknown> => {
      const p: Record<string, unknown> = {
        model: getOpenAIModel(),
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ]
      };
      if (useCompletionTokens) {
        p.max_completion_tokens = 1600;
      } else {
        p.max_tokens = 1200;
      }
      if (expectJson) {
        p.response_format = { type: 'json_object' };
      }
      return p;
    };

    const sendReq = (payload: Record<string, unknown>) =>
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

    let res = await sendReq(makeBody(true));
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 400 && errText.includes('max_completion_tokens')) {
        res = await sendReq(makeBody(false));
      } else {
        throw new Error(`OpenAI API HTTP ${res.status}: ${errText.slice(0, 160)}`);
      }
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenAI API HTTP ${res.status}: ${errText.slice(0, 160)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('OpenAI returned empty response');
    }
    return content.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseJsonObjectSafe(rawText: string): any {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

// GET /api/ai-status
app.get('/api/ai-status', (_req: Request, res: Response) => {
  res.json(buildAiStatusPayload());
});

// POST /api/ai-provider (Admin switch Gemini <-> OpenAI)
app.post('/api/ai-provider', (req: Request, res: Response) => {
  const requested = req.body?.provider;
  if (requested !== 'gemini' && requested !== 'openai') {
    return res.status(400).json({ error: 'provider must be "gemini" or "openai"' });
  }
  const providerKey: AiProviderType = requested;
  activeProvider = providerKey;
  const gKey = resolveServerKey(process.env.GEMINI_API_KEY);
  const oKey = getOpenAIKey();
  const hasKey = providerKey === 'gemini' ? Boolean(gKey) : Boolean(oKey);
  recordDiagnostic(
    providerKey,
    '/api/ai-provider',
    hasKey ? providerRuntimeState[providerKey].status : 'api_key_missing',
    hasKey
      ? `AIプロバイダーを ${providerKey === 'gemini' ? 'Gemini' : 'OpenAI'} に切り替えました`
      : `${providerKey === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'} が未設定のためフォールバック待機中です`
  );
  res.json(buildAiStatusPayload());
});

// POST /api/ai-test (Real provider health check without leaking keys)
app.post('/api/ai-test', async (req: Request, res: Response) => {
  const requested = req.body?.provider;
  const targetProvider: AiProviderType =
    requested === 'gemini' || requested === 'openai' ? requested : activeProvider;

  const { client: geminiClient, key: gKey } = getGeminiClient();
  const oKey = getOpenAIKey();

  if (targetProvider === 'gemini') {
    if (!geminiClient || !gKey) {
      recordDiagnostic('gemini', '/api/ai-test', 'api_key_missing', 'GEMINI_API_KEY が設定されていません');
      return res.json({
        ok: false,
        provider: 'gemini',
        model: GEMINI_MODEL,
        status: 'api_key_missing',
        statusLabel: getStatusLabel('api_key_missing'),
        message: 'サーバー側に有効な GEMINI_API_KEY が設定されていません。',
        state: buildAiStatusPayload()
      });
    }
    try {
      const response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: '接続テストです。「OK」とだけ短く返答してください。'
      });
      const text = (response.text || '').trim();
      if (!text) {
        throw new Error('Empty response from Gemini');
      }
      recordDiagnostic('gemini', '/api/ai-test', 'connected', `Gemini (${GEMINI_MODEL}) 疎通確認完了`);
      return res.json({
        ok: true,
        provider: 'gemini',
        model: GEMINI_MODEL,
        status: 'connected',
        statusLabel: getStatusLabel('connected'),
        message: `Gemini (${GEMINI_MODEL}) への接続と応答生成に成功しました。`,
        state: buildAiStatusPayload()
      });
    } catch (err) {
      const status = classifyProviderError(err);
      const safeMsg = sanitizeErrorMessage(err, [gKey, oKey]);
      recordDiagnostic('gemini', '/api/ai-test', status, safeMsg);
      return res.json({
        ok: false,
        provider: 'gemini',
        model: GEMINI_MODEL,
        status,
        statusLabel: getStatusLabel(status),
        message: `${getStatusLabel(status)}: ${safeMsg}`,
        state: buildAiStatusPayload()
      });
    }
  } else {
    if (!oKey) {
      recordDiagnostic('openai', '/api/ai-test', 'api_key_missing', 'OPENAI_API_KEY が設定されていません');
      return res.json({
        ok: false,
        provider: 'openai',
        model: getOpenAIModel(),
        status: 'api_key_missing',
        statusLabel: getStatusLabel('api_key_missing'),
        message: 'サーバー側に有効な OPENAI_API_KEY が設定されていません。',
        state: buildAiStatusPayload()
      });
    }
    try {
      const text = await callOpenAIChatCompletion(
        'Reply strictly with "OK".',
        'Connection check.',
        false
      );
      if (!text) {
        throw new Error('Empty response from OpenAI');
      }
      const model = getOpenAIModel();
      recordDiagnostic('openai', '/api/ai-test', 'connected', `OpenAI (${model}) 疎通確認完了`);
      return res.json({
        ok: true,
        provider: 'openai',
        model,
        status: 'connected',
        statusLabel: getStatusLabel('connected'),
        message: `OpenAI (${model}) への接続と応答生成に成功しました。`,
        state: buildAiStatusPayload()
      });
    } catch (err) {
      const status = classifyProviderError(err);
      const safeMsg = sanitizeErrorMessage(err, [gKey, oKey]);
      recordDiagnostic('openai', '/api/ai-test', status, safeMsg);
      return res.json({
        ok: false,
        provider: 'openai',
        model: getOpenAIModel(),
        status,
        statusLabel: getStatusLabel(status),
        message: `${getStatusLabel(status)}: ${safeMsg}`,
        state: buildAiStatusPayload()
      });
    }
  }
});

// POST /api/press-conference-questions (Dynamic AI press questions grounded in match facts)
app.post('/api/press-conference-questions', async (req: Request, res: Response) => {
  const { clubName, opponentName, matchContext, scoreStr, eventsSummary } = req.body || {};
  const { client: geminiClient, key: gKey } = getGeminiClient();
  const oKey = getOpenAIKey();

  if (!geminiClient && !oKey) {
    return res.json({ ok: false, questions: [], fallback: true });
  }

  const prompt = `
あなたはサッカージャーナリストです。以下の試合結果・事実のみに基づき、試合直後インタビューの質問を3問、それぞれ4つの監督回答選択肢付きで生成してください。架空の得点者や存在しない出来事を作らないでください。

【試合データ】
・自クラブ: ${clubName || '当クラブ'}
・対戦相手: ${opponentName || '相手クラブ'}
・スコア・結果: ${scoreStr || matchContext || '公式戦終了'}
・試合中の主な出来事: ${eventsSummary || '90分間の激闘'}

必ず以下のJSONオブジェクトのみを返してください:
{
  "questions": [
    {
      "id": "ai_q_1",
      "category": "短いカテゴリ名",
      "reporterRole": "記者肩書",
      "question": "質問文",
      "choices": [
        { "id": "c1", "label": "短い見出し(12文字以内)", "text": "具体的な回答コメント", "tone": "positive", "trustDelta": 2, "boardDelta": 2 }
      ]
    }
  ]
}
tone は "positive" | "tactical" | "protective" | "ambitious" | "accountable" | "critical" のいずれか、trustDelta と boardDelta は -2 から +3 の整数にしてください。
`;

  try {
    if (activeProvider === 'openai' && oKey) {
      const raw = await callOpenAIChatCompletion(
        'あなたは日本語スポーツメディアの記者です。必ず指定JSONオブジェクトのみで回答してください。',
        prompt,
        true
      );
      const parsed = parseJsonObjectSafe(raw);
      if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
        recordDiagnostic('openai', '/api/press-conference-questions', 'connected', '会見質問生成成功');
        return res.json({ ok: true, questions: parsed.questions.slice(0, 3) });
      }
    } else if (geminiClient) {
      const response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      const text = response.text;
      if (text) {
        const parsed = parseJsonObjectSafe(text);
        if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
          recordDiagnostic('gemini', '/api/press-conference-questions', 'connected', '会見質問生成成功');
          return res.json({ ok: true, questions: parsed.questions.slice(0, 3) });
        }
      }
    }
  } catch (err) {
    const status = classifyProviderError(err);
    const provider: AiProviderType = activeProvider === 'openai' && oKey ? 'openai' : 'gemini';
    recordDiagnostic(provider, '/api/press-conference-questions', status, sanitizeErrorMessage(err, [gKey, oKey]));
  }

  return res.json({ ok: false, questions: [], fallback: true });
});

// POST /api/press-conference endpoint
app.post('/api/press-conference', async (req: Request, res: Response) => {
  const { question, managerResponse, matchContext, clubName, managerName, qaList } = req.body;

  const formattedQaList = Array.isArray(qaList) && qaList.length > 0
    ? qaList
        .map((item: any, idx: number) => `Q${idx + 1}: ${item.question || ''}\nA${idx + 1}: 「${item.answer || ''}」`)
        .join('\n')
    : '';

  const effectiveResponse = managerResponse || (Array.isArray(qaList) && qaList[0]?.answer) || '';

  if (!effectiveResponse) {
    return res.status(400).json({ error: 'Manager response is required' });
  }

  const prompt = `
あなたは世界的なサッカー専門記者・スポーツアナリストです。
以下の試合直後の公式記者会見において、監督の発言を元にニュース記事と反響を生成してください。

【状況】
・クラブ: ${clubName || 'クラブ'}
・監督名: ${managerName || '監督'}
・試合状況: ${matchContext || '白熱した公式戦'}
${formattedQaList ? `【質疑応答ログ】\n${formattedQaList}` : `・記者からの質問: ${question || '本日の試合についての総括をお願いします'}\n・監督の生コメント（自由回答）: 「${effectiveResponse}」`}

【指示】
監督の発言のトーン（強気、選手を庇う、戦術的、審判への不満、謙虚、自信など）を深く洞察し、現実のスポーツ新聞・サッカー専門誌のリアルな記事を作成してください。
必ず以下のJSONキーを持つJSONオブジェクトのみを返してください:
{ "headline": string, "article": string, "fanReaction": string, "playerTrustDelta": integer(-5..5), "boardConfidenceDelta": integer(-5..5), "mediaGrade": string }
`;

  const { client: geminiClient, key: gKey } = getGeminiClient();
  const oKey = getOpenAIKey();

  if (activeProvider === 'openai' && oKey) {
    try {
      const raw = await callOpenAIChatCompletion(
        'あなたは日本語スポーツメディアの記者です。必ず指定されたJSON形式のみで回答してください。',
        prompt,
        true
      );
      const parsed = parseJsonObjectSafe(raw);
      recordDiagnostic('openai', '/api/press-conference', 'connected', '会見記事生成成功');
      return res.json(parsed);
    } catch (err) {
      const status = classifyProviderError(err);
      recordDiagnostic('openai', '/api/press-conference', status, sanitizeErrorMessage(err, [gKey, oKey]));
    }
  } else if (geminiClient) {
    try {
      const response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: 'スポーツ新聞の目を引く見出し' },
              article: { type: Type.STRING, description: '記者会見の様子と発言を引用した150〜200文字の本文記事' },
              fanReaction: { type: Type.STRING, description: 'サポーターSNSや現地のファンの声（肯定・疑問・熱狂など）' },
              playerTrustDelta: { type: Type.INTEGER, description: '選手からの信頼度変化 (-5から+5の整数)' },
              boardConfidenceDelta: { type: Type.INTEGER, description: 'フロント・理事会からの評価変化 (-5から+5の整数)' },
              mediaGrade: { type: Type.STRING, description: 'メディアによる会見評価 (A+, A, B, C, Dなど)' }
            },
            required: ['headline', 'article', 'fanReaction', 'playerTrustDelta', 'boardConfidenceDelta', 'mediaGrade']
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = parseJsonObjectSafe(text);
        recordDiagnostic('gemini', '/api/press-conference', 'connected', '会見記事生成成功');
        return res.json(parsed);
      }
    } catch (err) {
      const status = classifyProviderError(err);
      recordDiagnostic('gemini', '/api/press-conference', status, sanitizeErrorMessage(err, [gKey, oKey]));
    }
  }

  // Realistic fallback rule-based generation
  const combinedText = formattedQaList || effectiveResponse;
  const isPositive = !combinedText.includes('審判') && !combinedText.includes('最悪') && !combinedText.includes('プロの基準を満たしていない');
  const isAggressive = combinedText.includes('勝ち点') || combinedText.includes('優勝') || combinedText.includes('完璧') || combinedText.includes('自信');

  const headline = isAggressive
    ? `【会見詳報】${managerName}監督、強気の言葉で選手を鼓舞「${effectiveResponse.slice(0, 22)}…」`
    : `【会見詳報】${clubName}の${managerName}監督が語る「${effectiveResponse.slice(0, 22)}…」`;

  const article = formattedQaList
    ? `試合後の記者会見に出席した${managerName}監督は、全${Array.isArray(qaList) ? qaList.length : 1}問の質問に対し「${effectiveResponse}」などと回答し、試合の収穫と課題を明確に語った。冷静かつ的確な現状認識に報道陣からも納得の声が上がった。`
    : `試合後のフラッシュインタビューおよび記者会見に臨んだ${managerName}監督は、「${effectiveResponse}」と語り、チームの現在の立ち位置と次節への決意を述べた。冷静かつ的確な現状認識に対し、報道陣からも納得の声が上がった。`;

  const fanReaction = isPositive
    ? 'サポーターからは「頼もしい監督の言葉に勇気づけられた」「次節も信じてついていく」と好意的な反応が多数。'
    : 'SNS上ではサポーターによる議論が沸騰。「厳しい言葉だが的を射ている」「次節のスタメン変更に期待」などの声が寄せられた。';

  return res.json({
    headline,
    article,
    fanReaction,
    playerTrustDelta: isPositive ? 2 : -1,
    boardConfidenceDelta: 1,
    mediaGrade: isAggressive ? 'A' : 'B+'
  });
});

interface SquadMemberCtx {
  id: string;
  name: string;
  position: string;
  ovr: number;
  age?: number;
  fatigue?: number;
  marketValue: number;
  wage?: number;
  contractYears?: number;
  squadStatus?: string;
}

interface MarketTargetCtx {
  id: string;
  name: string;
  position: string;
  ovr: number;
  age?: number;
  potential?: number;
  marketValue: number;
  clubName?: string;
}

function buildContextAwareFallbackResponse(params: {
  trimmedMsg: string;
  clubName: string;
  leagueName: string;
  formation: string;
  weaknessesSummary: string;
  target: string;
  boardConfidence: number;
  transferBudget: number;
  availWage: number;
  squadList: SquadMemberCtx[];
  targetList: MarketTargetCtx[];
  standingsPosition: any;
  providerUsed: AiProviderType;
  modelUsed: string;
  connectionStatus: AiConnectionStatus;
  errorDetail: string;
}) {
  const {
    trimmedMsg,
    clubName,
    formation,
    weaknessesSummary,
    target,
    boardConfidence,
    transferBudget,
    availWage,
    squadList,
    targetList,
    standingsPosition,
    providerUsed,
    modelUsed,
    connectionStatus,
    errorDetail
  } = params;

  const lower = trimmedMsg.toLowerCase();
  const avgOvr = squadList.length > 0
    ? (squadList.reduce((acc, p) => acc + p.ovr, 0) / squadList.length).toFixed(1)
    : '75.0';

  const mentioned = squadList.find(p =>
    trimmedMsg.includes(p.name) ||
    p.name.split(/\s+/).some(part => part.length >= 2 && trimmedMsg.includes(part))
  );

  // Explicit sell / release query
  if (
    lower.includes('放出') ||
    lower.includes('売') ||
    lower.includes('整理') ||
    lower.includes('余剰') ||
    lower.includes('sell')
  ) {
    const candidate = mentioned || [...squadList]
      .sort((a, b) => {
        const aScore = (a.contractYears !== undefined && a.contractYears <= 1 ? 25 : 0) + (a.age && a.age >= 30 ? 15 : 0) - a.ovr;
        const bScore = (b.contractYears !== undefined && b.contractYears <= 1 ? 25 : 0) + (b.age && b.age >= 30 ? 15 : 0) - b.ovr;
        return bScore - aScore;
      })[0];

    const sellCandidates = candidate
      ? squadList
          .filter(p => p.id !== candidate.id)
          .sort((a, b) => a.ovr - b.ovr)
          .slice(0, 2)
      : [];

    const recs = [
      ...(candidate
        ? [{
            category: 'squad',
            title: `売却候補筆頭: ${candidate.name}`,
            detail: `${candidate.position} / ${candidate.age ?? '-'}歳 / OVR ${candidate.ovr} / 推定価値 €${(candidate.marketValue / 1000000).toFixed(1)}M`,
            targetPlayerId: candidate.id,
            targetPlayerName: candidate.name
          }]
        : []),
      ...sellCandidates.map(s => ({
        category: 'finance',
        title: `次点放出候補: ${s.name}`,
        detail: `${s.position} / ${s.age ?? '-'}歳 / OVR ${s.ovr} / 価値 €${(s.marketValue / 1000000).toFixed(1)}M`,
        targetPlayerId: s.id,
        targetPlayerName: s.name
      }))
    ];

    return {
      reply: candidate
        ? `${clubName}強化部です。スカッドバランスと予算枠を踏まえると、${candidate.name}（${candidate.position} / OVR ${candidate.ovr} / 推定価値 €${(candidate.marketValue / 1000000).toFixed(1)}M）が整理候補として現実的です。下の承認ボタンで移籍リスト登録へ進めます。`
        : `${clubName}スカッドの整理候補を精査しました。対象選手名をご指定いただければ、すぐに移籍・レンタル登録案を作成します。`,
      analysisSummary: `${clubName}（平均OVR ${avgOvr} / 移籍予算 €${(transferBudget / 1000000).toFixed(1)}M）の給与圧縮・資金確保プランです。`,
      recommendations: recs,
      proposedAction: candidate
        ? {
            type: 'transfer_list' as const,
            targetPlayerId: candidate.id,
            targetPlayerName: candidate.name,
            summary: `${candidate.name} を移籍リストに登録する`,
            requiresConfirmation: true
          }
        : undefined,
      source: 'fallback',
      providerUsed,
      modelUsed,
      isAiGenerated: false,
      connectionStatus,
      errorDetail
    };
  }

  // Loan intent
  if (mentioned && (lower.includes('レンタル') || lower.includes('loan') || lower.includes('武者修行'))) {
    return {
      reply: `了解しました。${mentioned.name}（${mentioned.position} / OVR ${mentioned.ovr}）を出場機会確保のためレンタルリストへ登録する案をご用意しました。下の承認ボタンで反映できます。`,
      analysisSummary: `実戦経験の付与と週給枠の有効活用を両立するレンタル案です。`,
      recommendations: [{
        category: 'squad',
        title: `レンタル案: ${mentioned.name}`,
        detail: `${mentioned.position} · OVR ${mentioned.ovr} · 週給 €${(mentioned.wage || 0).toLocaleString()}`,
        targetPlayerId: mentioned.id,
        targetPlayerName: mentioned.name
      }],
      proposedAction: {
        type: 'loan_list' as const,
        targetPlayerId: mentioned.id,
        targetPlayerName: mentioned.name,
        summary: `${mentioned.name} をレンタルリストに登録する`,
        requiresConfirmation: true
      },
      source: 'fallback',
      providerUsed,
      modelUsed,
      isAiGenerated: false,
      connectionStatus,
      errorDetail
    };
  }

  // Budget rebalance intent
  if (lower.includes('予算') || lower.includes('給料') || lower.includes('週給') || lower.includes('資金') || lower.includes('再配分') || lower.includes('budget')) {
    return {
      reply: `現在の移籍予算は €${(transferBudget / 1000000).toFixed(1)}M、週給空き枠は €${availWage.toLocaleString()}/週 です。契約更改や新規獲得の給与余力を広げるため、移籍予算の一部（最大€2.0M）を週給枠へ回す案をご提案します。`,
      analysisSummary: `目標「${target}」に向けた資金配分の見直し提案です。`,
      recommendations: [{
        category: 'finance',
        title: '予算・週給ステータス',
        detail: `移籍予算 €${(transferBudget / 1000000).toFixed(1)}M / 週給残 €${availWage.toLocaleString()}/週`
      }],
      proposedAction: transferBudget >= 2000000
        ? {
            type: 'budget_rebalance' as const,
            summary: '移籍予算の10%（最大€2.0M）を週給予算枠へ再配分する',
            requiresConfirmation: true
          }
        : undefined,
      source: 'fallback',
      providerUsed,
      modelUsed,
      isAiGenerated: false,
      connectionStatus,
      errorDetail
    };
  }

  // Targeted scouting / position / young / budget cap query (e.g. "若手のCB", "50M以内でST", "弱点")
  const wantsYoung = lower.includes('若手') || lower.includes('young') || lower.includes('将来');
  const capMatch = trimmedMsg.match(/(\d+)\s*[mM]/);
  const explicitCap = capMatch ? Number(capMatch[1]) * 1000000 : null;

  const posFilters: string[] = [];
  if (trimmedMsg.includes('CB') || lower.includes('センターバック')) posFilters.push('CB');
  if (trimmedMsg.includes('RB') || trimmedMsg.includes('LB') || lower.includes('サイドバック') || lower.includes('df')) {
    posFilters.push('RB', 'LB', 'LWB', 'RWB', 'CB');
  }
  if (trimmedMsg.includes('ST') || trimmedMsg.includes('CF') || lower.includes('フォワード') || lower.includes('ストライカー') || lower.includes('点取り屋')) {
    posFilters.push('ST', 'CF');
  }
  if (trimmedMsg.includes('WG') || trimmedMsg.includes('LW') || trimmedMsg.includes('RW') || lower.includes('ウイング')) {
    posFilters.push('LW', 'RW', 'LM', 'RM');
  }
  if (trimmedMsg.includes('CM') || trimmedMsg.includes('CDM') || trimmedMsg.includes('CAM') || lower.includes('ボランチ') || lower.includes('中盤') || lower.includes('トップ下')) {
    posFilters.push('CDM', 'CM', 'CAM');
  }
  if (trimmedMsg.includes('GK') || lower.includes('キーパー')) {
    posFilters.push('GK');
  }

  let filteredTargets = [...targetList];
  if (posFilters.length > 0) {
    const matchedPos = filteredTargets.filter(t => posFilters.includes(t.position));
    if (matchedPos.length > 0) filteredTargets = matchedPos;
  }
  if (wantsYoung) {
    const youngOnly = filteredTargets.filter(t => (t.age ?? 25) <= 23);
    if (youngOnly.length > 0) filteredTargets = youngOnly;
  }
  if (explicitCap && explicitCap > 0) {
    const withinCap = filteredTargets.filter(t => t.marketValue <= explicitCap);
    if (withinCap.length > 0) filteredTargets = withinCap;
  }

  const topPicks = filteredTargets.sort((a, b) => b.ovr - a.ovr).slice(0, 3);
  const rankText = standingsPosition ? `${standingsPosition.rank}位（勝点${standingsPosition.points}）` : '開幕準備段階';

  const wantsWeakness = lower.includes('弱点') || lower.includes('課題') || lower.includes('分析') || lower.includes('フォーメーション') || lower.includes('戦術');
  const recs = [
    ...(wantsWeakness || topPicks.length === 0
      ? [{
          category: 'tactical',
          title: `チーム診断 (${formation})`,
          detail: weaknessesSummary || `平均OVR ${avgOvr} / 移籍予算 €${(transferBudget / 1000000).toFixed(1)}M / 順位 ${rankText}`
        }]
      : []),
    ...topPicks.map(t => ({
      category: 'reinforce',
      title: `${t.name} (${t.clubName || '所属クラブ'})`,
      detail: `${t.position} · ${t.age ?? '-'}歳 · OVR ${t.ovr}${t.potential ? ` (POT ${t.potential})` : ''} · €${(t.marketValue / 1000000).toFixed(1)}M`,
      targetPlayerId: t.id,
      targetPlayerName: t.name
    }))
  ].slice(0, 3);

  const pickNames = topPicks.map(t => `${t.name}(${t.position}/OVR${t.ovr}/€${(t.marketValue / 1000000).toFixed(1)}M)`).join('、');

  return {
    reply: wantsWeakness
      ? `${clubName}の現状分析です。フォーメーション「${formation}」基準での課題は【${weaknessesSummary}】。現在順位は${rankText}、移籍予算は€${(transferBudget / 1000000).toFixed(1)}Mです。${pickNames ? `市場内の適合候補として ${pickNames} をリストアップしました。` : ''}`
      : pickNames
        ? `ご希望条件に合う実在の獲得候補を市場データから抽出しました：${pickNames}。いずれも現在の予算範囲・編成条件に沿って交渉可能な候補です（自動獲得は行いません）。`
        : `${clubName}強化部です。現在の順位は${rankText}、移籍予算は €${(transferBudget / 1000000).toFixed(1)}M（週給残 €${availWage.toLocaleString()}/週）です。具体的なポジションや条件をご指定いただければ候補を絞り込みます。`,
    analysisSummary: `${clubName} (${formation}) · 平均OVR ${avgOvr} · 理事会信頼度 ${boardConfidence}% / ${weaknessesSummary || '補強精査中'}`,
    recommendations: recs,
    source: 'fallback',
    providerUsed,
    modelUsed,
    isAiGenerated: false,
    connectionStatus,
    errorDetail
  };
}

// POST /api/front-office-message endpoint (Smartphone Front Office AI Mail / Chat)
app.post('/api/front-office-message', async (req: Request, res: Response) => {
  const {
    userMessage,
    provider: requestedProvider,
    clubContext,
    squadSummary,
    recentMatches,
    recentTransfers,
    standingsPosition,
    marketTargets,
    threadHistory
  } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  const chosenProvider: AiProviderType =
    requestedProvider === 'gemini' || requestedProvider === 'openai' ? requestedProvider : activeProvider;

  const trimmedMsg = userMessage.trim();
  const clubName = clubContext?.clubName || 'クラブ';
  const transferBudget = Number(clubContext?.transferBudget ?? 0);
  const wageBudget = Number(clubContext?.wageBudget ?? 0);
  const currentWageSpend = Number(clubContext?.currentWageSpend ?? 0);
  const target = clubContext?.target || '上位進出';
  const leagueName = clubContext?.leagueName || clubContext?.currentLeague || 'リーグ';
  const formation = clubContext?.formation || '4-3-3';
  const weaknessesSummary = clubContext?.weaknessesSummary || '特記なし';
  const boardConfidence = Number(clubContext?.boardConfidence ?? 75);
  const availWage = Math.max(0, wageBudget - currentWageSpend);

  const squadList: SquadMemberCtx[] = Array.isArray(squadSummary) ? squadSummary : [];
  const targetList: MarketTargetCtx[] = Array.isArray(marketTargets) ? marketTargets : [];
  const matchesList: Array<{ date?: string; opponent?: string; score?: string; competition?: string; result?: string }> =
    Array.isArray(recentMatches) ? recentMatches : [];
  const transfersList: Array<{ playerName?: string; type?: string; fee?: number; date?: string; direction?: string }> =
    Array.isArray(recentTransfers) ? recentTransfers : [];
  const historyList: Array<{ sender?: string; text?: string }> =
    Array.isArray(threadHistory) ? threadHistory : [];

  const squadText = squadList
    .slice(0, 35)
    .map(p => `- ${p.name} (id:${p.id}, pos:${p.position}, age:${p.age ?? '-'}, OVR:${p.ovr}, fatigue:${p.fatigue ?? 0}%, contract:${p.contractYears ?? '-'}年, wage:€${(p.wage ?? 0).toLocaleString()}, val:€${(p.marketValue / 1000000).toFixed(1)}M)`)
    .join('\n');

  const marketText = targetList
    .slice(0, 40)
    .map(t => `- ${t.name} (id:${t.id}, pos:${t.position}, age:${t.age ?? '-'}, OVR:${t.ovr}, POT:${t.potential ?? '-'}, club:${t.clubName || '無所属'}, val:€${(t.marketValue / 1000000).toFixed(1)}M)`)
    .join('\n');

  const matchesText = matchesList
    .slice(0, 5)
    .map(m => `- ${m.date || ''} [${m.competition || ''}] vs ${m.opponent || ''} (${m.score || ''} ${m.result || ''})`)
    .join('\n');

  const transfersText = transfersList
    .slice(0, 5)
    .map(t => `- ${t.date || ''} ${t.direction || ''} ${t.playerName || ''} (€${((t.fee || 0) / 1000000).toFixed(1)}M)`)
    .join('\n');

  const historyText = historyList
    .slice(-8)
    .map(h => `${h.sender === 'manager' ? '監督' : 'フロント'}: ${h.text || ''}`)
    .join('\n');

  const standingsText = standingsPosition
    ? `順位 ${standingsPosition.rank ?? '-'}位 / ${standingsPosition.played ?? 0}試合 ${standingsPosition.points ?? 0}勝点 (得失点差 ${standingsPosition.goalDiff ?? 0})`
    : '集計中';

  const systemInstruction = [
    'あなたはプロサッカークラブの有能なスポーティングディレクター兼フロント強化責任者です。',
    '必ず日本語で自然かつプロフェッショナルに回答してください（ChatGPTレベルの自然な対話力と正確な数値分析）。',
    '提供された実データ（スカッド・市場候補・戦績・予算・弱点分析）に存在しない架空の選手名や架空の数値を絶対に創作・捏造しないでください。',
    '移籍交渉や選手売却を自動で実行してはいけません。明確な選手操作(transfer_list / loan_list)または予算配分(budget_rebalance)を提案する場合のみ actionType を設定してください（必ず監督承認ボタン経由で実行されます）。',
    '返答は必ずJSONオブジェクトのみで、次の形式に従ってください:',
    '{ "reply": string(120〜320字で監督の質問に的確回答), "analysisSummary": string(1〜2文), "recommendations": [{"category":"reinforce"|"squad"|"finance"|"tactical","title":string,"detail":string,"targetPlayerId"?:string,"targetPlayerName"?:string}], "actionType": "none"|"transfer_list"|"loan_list"|"budget_rebalance", "targetPlayerId"?: string, "targetPlayerName"?: string, "actionSummary"?: string }'
  ].join('\n');

  const prompt = `【現在のクラブ実データ】
・クラブ名: ${clubName} (${leagueName})
・使用フォーメーション: ${formation}
・現在順位: ${standingsText}
・目標: ${target} / 理事会信頼度: ${boardConfidence}%
・移籍予算: €${(transferBudget / 1000000).toFixed(1)}M
・週給上限: €${wageBudget.toLocaleString()} / 現在週給支出: €${currentWageSpend.toLocaleString()} / 週給空き枠: €${availWage.toLocaleString()}
・チーム弱点・編成診断: ${weaknessesSummary}

【直近試合結果】
${matchesText || '（直近試合なし）'}

【直近移籍動向】
${transfersText || '（直近移籍なし）'}

【在籍スカッド一覧】
${squadText || '（データなし）'}

【予算内で獲得可能な実在市場候補一覧】
${marketText || '（市場候補なし）'}

【直近会話履歴】
${historyText || '（初回相談）'}

【今回の監督からのメッセージ】
「${trimmedMsg}」`;

  const { client: geminiClient, key: gKey } = getGeminiClient();
  const oKey = getOpenAIKey();
  const modelUsed = chosenProvider === 'openai' ? getOpenAIModel() : GEMINI_MODEL;

  const formatSuccessResponse = (parsed: any, provider: AiProviderType, usedModel: string) => {
    const actionType = parsed?.actionType;
    const proposedAction =
      actionType === 'transfer_list' || actionType === 'loan_list' || actionType === 'budget_rebalance'
        ? {
            type: actionType,
            targetPlayerId: parsed.targetPlayerId || undefined,
            targetPlayerName: parsed.targetPlayerName || undefined,
            summary: parsed.actionSummary || 'フロント提案を実行する',
            requiresConfirmation: true
          }
        : undefined;
    const cleanRecs = Array.isArray(parsed?.recommendations)
      ? parsed.recommendations.slice(0, 3).map((r: any) => ({
          category: (['reinforce', 'squad', 'finance', 'tactical'].includes(r?.category) ? r.category : 'squad') as 'reinforce' | 'squad' | 'finance' | 'tactical',
          title: String(r?.title || '強化提案'),
          detail: String(r?.detail || ''),
          targetPlayerId: r?.targetPlayerId ? String(r.targetPlayerId) : undefined,
          targetPlayerName: r?.targetPlayerName ? String(r.targetPlayerName) : undefined
        }))
      : [];

    if (!parsed?.reply || typeof parsed.reply !== 'string') {
      throw new Error('AI JSON response missing reply field');
    }

    return {
      reply: parsed.reply,
      analysisSummary: typeof parsed.analysisSummary === 'string' ? parsed.analysisSummary : '',
      recommendations: cleanRecs,
      proposedAction,
      source: provider,
      providerUsed: provider,
      modelUsed: usedModel,
      isAiGenerated: true,
      connectionStatus: 'connected' as AiConnectionStatus
    };
  };

  if (chosenProvider === 'gemini') {
    if (!geminiClient || !gKey) {
      const msg = 'GEMINI_API_KEY がサーバー環境変数に設定されていません。';
      recordDiagnostic('gemini', '/api/front-office-message', 'api_key_missing', msg);
      return res.json(buildContextAwareFallbackResponse({
        trimmedMsg,
        clubName,
        leagueName,
        formation,
        weaknessesSummary,
        target,
        boardConfidence,
        transferBudget,
        availWage,
        squadList,
        targetList,
        standingsPosition,
        providerUsed: 'gemini',
        modelUsed: GEMINI_MODEL,
        connectionStatus: 'api_key_missing',
        errorDetail: msg
      }));
    }

    try {
      const response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: 'フロント強化責任者からの返信メッセージ本文' },
              analysisSummary: { type: Type.STRING, description: '現在の戦力・予算・成績に基づく短い現状分析' },
              recommendations: {
                type: Type.ARRAY,
                description: '具体的な提案カード（1〜3件）',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: 'reinforce, squad, finance, tactical のいずれか' },
                    title: { type: Type.STRING, description: '短い見出し' },
                    detail: { type: Type.STRING, description: '数値や実在選手名に基づく提案内容' },
                    targetPlayerId: { type: Type.STRING, description: '関連する選手ID（任意）' },
                    targetPlayerName: { type: Type.STRING, description: '関連する選手名（任意）' }
                  },
                  required: ['category', 'title', 'detail']
                }
              },
              actionType: { type: Type.STRING, description: 'none, transfer_list, loan_list, または budget_rebalance' },
              targetPlayerId: { type: Type.STRING, description: '対象選手ID（該当する場合のみ）' },
              targetPlayerName: { type: Type.STRING, description: '対象選手名（該当する場合のみ）' },
              actionSummary: { type: Type.STRING, description: '承認ボタン表示用の短い提案要約' }
            },
            required: ['reply', 'analysisSummary', 'recommendations', 'actionType']
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini');
      }
      const parsed = parseJsonObjectSafe(text);
      const formatted = formatSuccessResponse(parsed, 'gemini', GEMINI_MODEL);
      recordDiagnostic('gemini', '/api/front-office-message', 'connected', `Gemini (${GEMINI_MODEL}) 回答生成成功`);
      return res.json(formatted);
    } catch (err) {
      const status = classifyProviderError(err);
      const safeMsg = sanitizeErrorMessage(err, [gKey, oKey]);
      recordDiagnostic('gemini', '/api/front-office-message', status, safeMsg);
      return res.json(buildContextAwareFallbackResponse({
        trimmedMsg,
        clubName,
        leagueName,
        formation,
        weaknessesSummary,
        target,
        boardConfidence,
        transferBudget,
        availWage,
        squadList,
        targetList,
        standingsPosition,
        providerUsed: 'gemini',
        modelUsed: GEMINI_MODEL,
        connectionStatus: status,
        errorDetail: safeMsg
      }));
    }
  } else {
    if (!oKey) {
      const msg = 'OPENAI_API_KEY がサーバー環境変数に設定されていません。';
      recordDiagnostic('openai', '/api/front-office-message', 'api_key_missing', msg);
      return res.json(buildContextAwareFallbackResponse({
        trimmedMsg,
        clubName,
        leagueName,
        formation,
        weaknessesSummary,
        target,
        boardConfidence,
        transferBudget,
        availWage,
        squadList,
        targetList,
        standingsPosition,
        providerUsed: 'openai',
        modelUsed,
        connectionStatus: 'api_key_missing',
        errorDetail: msg
      }));
    }

    try {
      const text = await callOpenAIChatCompletion(systemInstruction, prompt, true);
      const parsed = parseJsonObjectSafe(text);
      const formatted = formatSuccessResponse(parsed, 'openai', modelUsed);
      recordDiagnostic('openai', '/api/front-office-message', 'connected', `OpenAI (${modelUsed}) 回答生成成功`);
      return res.json(formatted);
    } catch (err) {
      const status = classifyProviderError(err);
      const safeMsg = sanitizeErrorMessage(err, [gKey, oKey]);
      recordDiagnostic('openai', '/api/front-office-message', status, safeMsg);
      return res.json(buildContextAwareFallbackResponse({
        trimmedMsg,
        clubName,
        leagueName,
        formation,
        weaknessesSummary,
        target,
        boardConfidence,
        transferBudget,
        availWage,
        squadList,
        targetList,
        standingsPosition,
        providerUsed: 'openai',
        modelUsed,
        connectionStatus: status,
        errorDetail: safeMsg
      }));
    }
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
