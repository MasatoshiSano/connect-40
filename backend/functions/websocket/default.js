"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    console.log('Default route handler called', event);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Default route',
            route: event.requestContext.routeKey,
        }),
    };
};
exports.handler = handler;
