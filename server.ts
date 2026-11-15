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

app.use(express.json());

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// POST /api/press-conference endpoint
app.post('/api/press-conference', async (req: Request, res: Response) => {
  const { question, managerResponse, matchContext, clubName, managerName } = req.body;

  if (!managerResponse) {
    return res.status(400).json({ error: 'Manager response is required' });
  }

  // If Gemini API is available, generate real AI sports journalism
  if (ai) {
    try {
      const prompt = `
あなたは世界的なサッカー専門記者・スポーツアナリストです。
以下の試合直後の公式記者会見において、監督の発言を元にニュース記事と反響を生成してください。

【状況】
・クラブ: ${clubName || 'クラブ'}
・監督名: ${managerName || '監督'}
・試合状況: ${matchContext || '白熱した公式戦'}
・記者からの質問: ${question || '本日の試合についての総括をお願いします'}
・監督の生コメント（自由回答）: 「${managerResponse}」

【指示】
監督の発言のトーン（強気、選手を庇う、戦術的、審判への不満、謙虚、自信など）を深く洞察し、現実のスポーツ新聞・サッカー専門誌（The Athleticや日刊スポーツ風）のリアルな記事を作成してください。
以下のJSONスキーマで返答してください。
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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
        const parsed = JSON.parse(text.trim());
        return res.json(parsed);
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local news generator:', err);
    }
  }

  // Realistic fallback rule-based generation
  const isPositive = !managerResponse.includes('審判') && !managerResponse.includes('最悪') && !managerResponse.includes('責任');
  const isAggressive = managerResponse.includes('勝ち点') || managerResponse.includes('優勝') || managerResponse.includes('完璧') || managerResponse.includes('自信');
  
  const headline = isAggressive
    ? `【会見詳報】${managerName}監督、強気の言葉で選手を鼓舞「${managerResponse.slice(0, 20)}…」`
    : `【会見詳報】${clubName}の${managerName}監督が語る「${managerResponse.slice(0, 20)}…」`;

  const article = `試合後のフラッシュインタビューおよび記者会見に臨んだ${managerName}監督は、「${managerResponse}」と語り、チームの現在の立ち位置と次節への決意を述べた。冷静かつ的確な現状認識に対し、報道陣からも納得の声が上がった。`;

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

// POST /api/front-office-message endpoint (Smartphone Front Office AI Mail / Chat)
app.post('/api/front-office-message', async (req: Request, res: Response) => {
  const { userMessage, clubContext, squadSummary } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  const trimmedMsg = userMessage.trim();
  const clubName = clubContext?.clubName || 'クラブ';
  const transferBudget = Number(clubContext?.transferBudget ?? 0);
  const wageBudget = Number(clubContext?.wageBudget ?? 0);
  const currentWageSpend = Number(clubContext?.currentWageSpend ?? 0);
  const target = clubContext?.target || '上位進出';
  const leagueName = clubContext?.leagueName || 'リーグ';
  const squadList: Array<{ id: string; name: string; position: string; ovr: number; marketValue: number }> = Array.isArray(squadSummary) ? squadSummary : [];

  if (ai) {
    try {
      const squadText = squadList
        .slice(0, 30)
        .map(p => `- ${p.name} (id:${p.id}, pos:${p.position}, OVR:${p.ovr}, val:€${(p.marketValue / 1000000).toFixed(1)}M)`)
        .join('\n');

      const prompt = `あなたは「${clubName}」（${leagueName}）のスポーティングディレクター（フロント強化責任者）です。
監督からスマートフォン宛に以下の相談・要望が届きました。クラブの実際の数値と在籍選手リストに基づいて現実的かつ丁寧に回答してください。
破壊的または明確なリスト操作・予算再配分（選手を移籍リストに入れる／レンタルリストに入れる／移籍予算の一部を週給枠に回す）が会話内容に合致する場合のみ proposedAction を提案してください（自動実行はせず、監督の承認ボタン用データとして返します）。

【現在のクラブ実データ】
・クラブ名: ${clubName}
・目標: ${target}
・移籍予算: €${(transferBudget / 1000000).toFixed(1)}M
・週給上限: €${wageBudget.toLocaleString()} / 現在週給支出: €${currentWageSpend.toLocaleString()}

【在籍選手一部】
${squadText || '（データなし）'}

【監督からのメッセージ】
「${trimmedMsg}」`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: '日本語で簡潔（120〜220字）かつ現場感のあるフロント責任者として返答してください。存在しない選手名や数値を捏造しないでください。',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: 'フロントからの返信本文' },
              actionType: { type: Type.STRING, description: 'none, transfer_list, loan_list, または budget_rebalance' },
              targetPlayerId: { type: Type.STRING, description: '対象選手ID（該当する場合のみ）' },
              targetPlayerName: { type: Type.STRING, description: '対象選手名（該当する場合のみ）' },
              actionSummary: { type: Type.STRING, description: '承認ボタン表示用の短い提案要約' }
            },
            required: ['reply', 'actionType']
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text.trim());
        const actionType = parsed.actionType;
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
        return res.json({
          reply: parsed.reply,
          proposedAction,
          source: 'gemini'
        });
      }
    } catch (err) {
      console.warn('Gemini front-office API failed, using deterministic fallback:', err);
    }
  }

  // Deterministic server fallback matching local logic
  const lower = trimmedMsg.toLowerCase();
  const mentioned = squadList.find(p =>
    trimmedMsg.includes(p.name) ||
    p.name.split(/\s+/).some(part => part.length >= 2 && trimmedMsg.includes(part))
  );

  if (mentioned && (lower.includes('売') || lower.includes('放出') || lower.includes('移籍リスト') || lower.includes('sell'))) {
    return res.json({
      reply: `承知いたしました。${mentioned.name}（OVR ${mentioned.ovr} / 推定価値 €${(mentioned.marketValue / 1000000).toFixed(1)}M）の移籍リスト登録について手続きを準備しました。下のボタンで確定してください。`,
      proposedAction: {
        type: 'transfer_list',
        targetPlayerId: mentioned.id,
        targetPlayerName: mentioned.name,
        summary: `${mentioned.name} を移籍リストに登録する`,
        requiresConfirmation: true
      },
      source: 'fallback'
    });
  }

  if (mentioned && (lower.includes('レンタル') || lower.includes('loan') || lower.includes('武者修行'))) {
    return res.json({
      reply: `了解しました。${mentioned.name}を出場機会確保のためレンタルリストへ登録する案をご用意しました。下の承認ボタンで反映できます。`,
      proposedAction: {
        type: 'loan_list',
        targetPlayerId: mentioned.id,
        targetPlayerName: mentioned.name,
        summary: `${mentioned.name} をレンタルリストに登録する`,
        requiresConfirmation: true
      },
      source: 'fallback'
    });
  }

  if (lower.includes('予算') || lower.includes('給料') || lower.includes('週給') || lower.includes('資金') || lower.includes('budget')) {
    const availWage = Math.max(0, wageBudget - currentWageSpend);
    return res.json({
      reply: `現在の移籍予算は €${(transferBudget / 1000000).toFixed(1)}M、週給空き枠は €${availWage.toLocaleString()}/週 です。移籍予算の10%を週給枠へ回す再配分も可能です。`,
      proposedAction: transferBudget >= 2000000
        ? {
            type: 'budget_rebalance',
            summary: '移籍予算の10%（最大€2.0M）を週給予算枠へ再配分する',
            requiresConfirmation: true
          }
        : undefined,
      source: 'fallback'
    });
  }

  return res.json({
    reply: `${clubName}強化部です。監督のご相談（「${trimmedMsg.slice(0, 30)}${trimmedMsg.length > 30 ? '…' : ''}」）を受け付けました。目標「${target}」と移籍予算 €${(transferBudget / 1000000).toFixed(1)}M の範囲内で具体的な補強・放出案を検討いたします。`,
    source: 'fallback'
  });
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
