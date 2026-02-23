"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({});
const ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;
const handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    try {
        // Get connection to find userId
        const queryResult = await ddbDocClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `CONNECTION#${connectionId}`,
            },
        }));
        const connection = queryResult.Items?.[0];
        if (!connection) {
            console.log(`Connection not found: ${connectionId}`);
            return { statusCode: 200, body: 'OK' };
        }
        const userId = connection.userId;
        // Delete connection record
        await ddbDocClient.send(new lib_dynamodb_1.DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `CONNECTION#${connectionId}`,
                SK: 'METADATA',
            },
        }));
        // Delete user-to-connection mapping
        if (userId) {
            await ddbDocClient.send(new lib_dynamodb_1.DeleteCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `USER#${userId}`,
                    SK: `CONNECTION#${connectionId}`,
                },
            }));
        }
        console.log(`Connection disconnected: ${connectionId}`);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Disconnected' }),
        };
    }
    catch (error) {
        console.error('Error removing connection:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to disconnect' }),
        };
    }
};
exports.handler = handler;
