import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { errorResponse, successResponse } from '../../layers/common/nodejs/utils';

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

interface RefineTextInput {
  text: string;
  type: 'activity' | 'bio';
  userContext: {
    nickname: string;
    age: number;
    interests: string[];
    location?: string;
  };
}

const SYSTEM_PROMPTS: Record<'activity' | 'bio', string> = {
  activity: `あなたはConnect40（40代のためのコミュニティアプリ）のライティングアシスタントです。
ユーザーのアクティビティ説明を、参加者が集まりやすい自然で温かみのある文章に推敲してください。
・ユーザーの思いや個性を大切にしながら改善してください
・40代の参加者が興味を持ちやすい表現を使ってください
・200文字以内でまとめてください
・推敲後のテキストのみを返してください（説明文不要）`,
  bio: `あなたはConnect40（40代のためのコミュニティアプリ）のライティングアシスタントです。
ユーザーの自己紹介文を、親しみやすく魅力的な文章に推敲してください。
・ユーザーの思いや個性を大切にしながら改善してください
・同世代の人が話しかけやすい自然な口調にしてください
・200文字以内でまとめてください
・推敲後のテキストのみを返してください（説明文不要）`,
};

function isValidType(type: string): type is 'activity' | 'bio' {
  return type === 'activity' || type === 'bio';
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
    if (!input.text || !input.type || !input.userContext) {
      return errorResponse(400, 'INVALID_INPUT', 'Missing required fields');
    }
    if (!isValidType(input.type)) {
      return errorResponse(400, 'INVALID_TYPE', 'type must be activity or bio');
    }

    const systemPrompt = SYSTEM_PROMPTS[input.type];
    const userMessage = `以下のテキストを推敲してください。

ユーザー情報：
- ニックネーム: ${input.userContext.nickname}
- 年齢: ${input.userContext.age}歳
- 興味・趣味: ${input.userContext.interests.join('、')}
${input.userContext.location ? `- 場所: ${input.userContext.location}` : ''}

推敲前のテキスト：
${input.text}`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    };

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-haiku-4-5-20251001-v1:0',
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
