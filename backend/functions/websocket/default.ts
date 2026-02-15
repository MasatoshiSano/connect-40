import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  console.log('Default route handler called', event);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Default route',
      route: event.requestContext.routeKey,
    }),
  };
};
