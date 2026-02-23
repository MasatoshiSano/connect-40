import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { errorResponse, successResponse } from '../../layers/common/nodejs/utils';

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

type RefineMode = 'refine' | 'category';

interface RefineTextInput {
  text: string;
  type: 'activity' | 'bio';
  mode?: RefineMode;
  title?: string;
  userContext: {
    nickname: string;
    age: number;
    interests: string[];
    location?: string;
  };
}

const VALID_CATEGORIES = ['sports', 'outdoor', 'hobby', 'food', 'culture', 'business', 'other'] as const;

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
