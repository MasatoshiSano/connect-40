import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { errorResponse, successResponse } from '../../layers/common/nodejs/utils';

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

type RefineMode = 'refine' | 'category' | 'tags';

interface RefineTextInput {
  text: string;
  type: 'activity' | 'bio';
  mode?: RefineMode;
  title?: string;
  category?: string;
  userContext: {
    nickname: string;
    age: number;
    interests: string[];
    location?: string;
  };
}

const VALID_CATEGORIES = ['sports', 'outdoor', 'hobby', 'food', 'culture', 'business', 'other'] as const;

const ACTIVITY_TAGS_LIST = [
  '料理教室', 'ハイキング', '写真撮影', '読書会', '語学交換',
  'ボードゲーム', 'サイクリング', 'ヨガ・瞑想', '音楽演奏', 'アート・クラフト',
  '釣り', 'ガーデニング', '映画鑑賞', 'ランニング', 'ダンス',
  'キャンプ', 'バードウォッチング', '茶道・華道', 'カフェ巡り', '旅行計画',
  'ボランティア', 'スポーツ観戦', '料理・グルメ', '登山', '温泉巡り',
  'DIY・ものづくり', '天体観測', '動物・ペット', '音楽鑑賞', '歴史探訪',
  'ゴルフ', 'テニス', 'フットサル', 'バスケットボール', 'バドミントン',
  'スキー・スノボ', 'サーフィン', 'マラソン', '温泉・サウナ', 'ワイン・日本酒',
  'コーヒー巡り', 'プログラミング', '副業・起業', '資格勉強', '子育て仲間',
  'ペット連れOK', 'シニア歓迎', '外国語', 'オンライン可', 'グルメ探索',
] as const;

const SYSTEM_PROMPTS: Record<'activity' | 'bio', string> = {
  activity: `あなたはConnect40（40代のためのコミュニティアプリ）のライティングアシスタントです。
アクティビティの説明文を、タイトルの内容に完全に沿った、40代が仲間を誘うような自然で親しみやすい文章に整えてください。

整え方の指針：
・タイトルのテーマ・活動内容を中心に据え、それが伝わる具体的な描写を入れること
・「一緒にやりませんか？」「ぜひ参加してください！」など、仲間を呼ぶ温かい呼びかけ口調にすること
・40代のリアルな感覚（久しぶりの挑戦・仲間との時間・ちょっとした非日常など）に共感できる表現を使うこと
・元の文章が短くても雑でも、タイトルに合った魅力的な内容に積極的に書き直すこと
・150〜200文字程度でまとめること
・整えた文章のみを返すこと（前置き・説明・引用符不要）`,
  bio: `あなたはConnect40（40代のためのコミュニティアプリ）のライティングアシスタントです。
ユーザーの自己紹介文を、40代の仲間が話しかけたくなるような親しみやすい文章に整えてください。

整え方の指針：
・「同世代の仲間と何かしたい」という雰囲気が自然に伝わる口調にすること
・趣味・興味・バックグラウンドを自然に盛り込み、会話のきっかけになる要素を残すこと
・堅すぎず・砕けすぎず、40代らしい落ち着きと温かさを持たせること
・元の文章が短くても雑でも、魅力的な自己紹介に積極的に書き直すこと
・150〜200文字程度でまとめること
・整えた文章のみを返すこと（前置き・説明・引用符不要）`,
};

const CATEGORY_SYSTEM_PROMPT = `あなたはConnect40（40代のためのコミュニティアプリ）のカテゴリ分類アシスタントです。
アクティビティのタイトルと説明文から、最も適切なカテゴリを1つ選んでください。

カテゴリ一覧：
- sports: スポーツ（サッカー、テニス、ゴルフ、ランニング等）
- outdoor: アウトドア（キャンプ、BBQ、釣り、ハイキング等）
- hobby: 趣味（写真、音楽、ゲーム、映画鑑賞等）
- food: グルメ（カフェ巡り、居酒屋、料理、ワイン等）
- culture: 文化（美術館、博物館、旅行、街歩き等）
- business: ビジネス（起業、投資、プログラミング、勉強会等）
- other: その他

カテゴリIDのみを返してください（例: sports）。余計な説明は不要です。`;

function isValidType(type: string): type is 'activity' | 'bio' {
  return type === 'activity' || type === 'bio';
}

function isValidCategory(category: string): category is typeof VALID_CATEGORIES[number] {
  return (VALID_CATEGORIES as readonly string[]).includes(category);
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const input: RefineTextInput = JSON.parse(event.body || '{}');
    const mode: RefineMode = input.mode ?? 'refine';

    if (mode === 'category') {
      // Category recommendation mode
      if (!input.title && !input.text) {
        return errorResponse(400, 'INVALID_INPUT', 'title or text is required for category mode');
      }

      const userMessage = `以下のアクティビティに最適なカテゴリを選んでください。

タイトル: ${input.title ?? ''}
説明: ${input.text ?? ''}`;

      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 50,
        system: CATEGORY_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      };

      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        body: JSON.stringify(payload),
        contentType: 'application/json',
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const rawCategory = (responseBody.content?.[0]?.text ?? '').trim().toLowerCase();
      const category = isValidCategory(rawCategory) ? rawCategory : 'other';

      return successResponse({ category });
    }

    if (mode === 'tags') {
      const tagSystemPrompt = `あなたはConnect40（40代のためのコミュニティアプリ）のタグ推薦アシスタントです。
アクティビティのタイトル・説明・カテゴリから、関連性の高いタグを以下のリストから必ず3〜5件選んでください。

【絶対ルール】
1. 以下のリスト内のタグのみを使うこと（リスト外の文字列は一切禁止）
2. 必ず3件以上5件以下を選ぶこと。直接一致するタグが少ない場合は、参加者が関心を持ちそな隣接するタグを補って3件以上にすること
3. JSON配列のみを返すこと。説明・前置き・コードブロック記号は不要

利用可能なタグ（このリスト内からのみ選択）:
${ACTIVITY_TAGS_LIST.join('、')}

【出力例】
入力「週末ゴルフ仲間募集！初心者歓迎 / sports / ゴルフ場でのラウンドを楽しむ会」
→ ["ゴルフ","スポーツ観戦","旅行計画","温泉・サウナ"]

入力「読書会メンバー募集 / hobby / 月1回集まって課題本を読む」
→ ["読書会","カフェ巡り","語学交換","ボードゲーム"]

入力「朝のランニング仲間 / sports / 週3回公園を走る」
→ ["ランニング","マラソン","ハイキング","サイクリング"]`;

      const tagUserMessage = `タイトル: ${input.title ?? ''}
カテゴリ: ${input.category ?? ''}
説明: ${input.text ?? ''}`;

      const tagPayload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 200,
        system: tagSystemPrompt,
        messages: [{ role: 'user', content: tagUserMessage }],
      };

      const tagCommand = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        body: JSON.stringify(tagPayload),
        contentType: 'application/json',
      });

      const tagResponse = await bedrockClient.send(tagCommand);
      const tagResponseBody = JSON.parse(new TextDecoder().decode(tagResponse.body));
      const rawTagText = (tagResponseBody.content?.[0]?.text ?? '[]').trim();

      let tags: string[] = [];
      try {
        const parsed = JSON.parse(rawTagText);
        if (Array.isArray(parsed)) {
          tags = parsed
            .filter((t): t is string => typeof t === 'string')
            .filter((t) => (ACTIVITY_TAGS_LIST as readonly string[]).includes(t))
            .slice(0, 5);
        }
      } catch {
        tags = [];
      }

      return successResponse({ tags });
    }

    // Refine mode (default)
    if (!input.text || !input.type || !input.userContext) {
      return errorResponse(400, 'INVALID_INPUT', 'Missing required fields');
    }
    if (!isValidType(input.type)) {
      return errorResponse(400, 'INVALID_TYPE', 'type must be activity or bio');
    }

    const systemPrompt = SYSTEM_PROMPTS[input.type];

    const titleSection = input.title
      ? `アクティビティタイトル:「${input.title}」\n\nこのタイトルのアクティビティの説明文として自然に読めるよう整えてください。\n`
      : '';

    const userMessage = `${titleSection}
ユーザー情報：
- ニックネーム: ${input.userContext.nickname}
- 年齢: ${input.userContext.age}歳
- 興味・趣味: ${input.userContext.interests.join('、')}
${input.userContext.location ? `- 場所: ${input.userContext.location}` : ''}

元の文章：
${input.text}`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    };

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      body: JSON.stringify(payload),
      contentType: 'application/json',
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const refinedText = responseBody.content?.[0]?.text ?? input.text;

    return successResponse({ refinedText });
  } catch (error) {
    console.error('AI refine error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to refine text');
  }
};
