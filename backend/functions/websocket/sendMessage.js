"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_apigatewaymanagementapi_1 = require("@aws-sdk/client-apigatewaymanagementapi");
const crypto_1 = require("crypto");
const client = new client_dynamodb_1.DynamoDBClient({});
const ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;
const handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const apiGatewayClient = new client_apigatewaymanagementapi_1.ApiGatewayManagementApiClient({
        endpoint: `https://${domain}/${stage}`,
    });
    try {
        const body = JSON.parse(event.body || '{}');
        const { chatRoomId, content } = body;
        if (!chatRoomId || !content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'chatRoomId and content are required' }),
            };
        }
        // Get sender's userId from connection
        const connectionQuery = await ddbDocClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `CONNECTION#${connectionId}`,
            },
        }));
        const connection = connectionQuery.Items?.[0];
        if (!connection) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Connection not found' }),
            };
        }
        const senderId = connection.userId;
        const messageId = (0, crypto_1.randomUUID)();
        const timestamp = Date.now();
        const now = new Date().toISOString();
        // Store message in DynamoDB
        const message = {
            PK: `CHATROOM#${chatRoomId}`,
            SK: `MESSAGE#${timestamp}#${messageId}`,
            Type: 'Message',
            messageId,
            chatRoomId,
            senderId,
            content,
            readBy: [senderId], // Sender has read their own message
            createdAt: now,
            timestamp,
        };
        await ddbDocClient.send(new lib_dynamodb_1.PutCommand({
            TableName: TABLE_NAME,
            Item: message,
        }));
        // Update chatRoom's lastMessageAt
        await ddbDocClient.send(new lib_dynamodb_1.PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: `CHATROOM#${chatRoomId}`,
                SK: 'LASTMESSAGE',
                lastMessageAt: now,
                lastMessage: content.substring(0, 100),
            },
        }));
        // Get all participants' connections
        const chatRoomQuery = await ddbDocClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': `CHATROOM#${chatRoomId}`,
                ':sk': 'METADATA',
            },
        }));
        const chatRoom = chatRoomQuery.Items?.[0];
        if (!chatRoom) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Chat room not found' }),
            };
        }
        const participantIds = chatRoom.participantIds;
        // Get all active connections for participants
        const connections = [];
        for (const participantId of participantIds) {
            const userConnections = await ddbDocClient.send(new lib_dynamodb_1.QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `USER#${participantId}`,
                    ':sk': 'CONNECTION#',
                },
            }));
            if (userConnections.Items) {
                connections.push(...userConnections.Items.map((item) => item.connectionId));
            }
        }
        // Broadcast message to all connected participants
        const messageData = JSON.stringify({
            type: 'message',
            data: {
                messageId,
                chatRoomId,
                senderId,
                content,
                createdAt: now,
                timestamp,
            },
        });
        await Promise.allSettled(connections.map(async (connId) => {
            try {
                await apiGatewayClient.send(new client_apigatewaymanagementapi_1.PostToConnectionCommand({
                    ConnectionId: connId,
                    Data: Buffer.from(messageData),
                }));
            }
            catch (error) {
                // If connection is stale (GoneException), delete it
                if (error.statusCode === 410) {
                    console.log(`Stale connection: ${connId}, deleting...`);
                    await ddbDocClient.send(new lib_dynamodb_1.DeleteCommand({
                        TableName: TABLE_NAME,
                        Key: {
                            PK: `CONNECTION#${connId}`,
                            SK: 'METADATA',
                        },
                    }));
                }
            }
        }));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Message sent', messageId }),
        };
    }
    catch (error) {
        console.error('Error sending message:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send message' }),
        };
    }
};
exports.handler = handler;
