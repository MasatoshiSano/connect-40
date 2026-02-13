# Phase 4: チャット機能（WebSocket）実装TODO

## 概要
WebSocket APIを使用したリアルタイムチャット機能の実装

## 実装済み
- WebSocket Stack（CDK）プレースホルダー作成済み

## 実装が必要な項目

### Backend

#### 1. WebSocket Lambda関数
- `backend/functions/websocket/connect.ts` - 接続ハンドラー
- `backend/functions/websocket/disconnect.ts` - 切断ハンドラー
- `backend/functions/websocket/sendMessage.ts` - メッセージ送信
- `backend/functions/websocket/getMessages.ts` - メッセージ履歴取得

#### 2. チャットルーム管理
- `backend/functions/chat/createRoom.ts` - チャットルーム作成
- `backend/functions/chat/getRooms.ts` - チャットルーム一覧
- `backend/functions/chat/getRoom.ts` - チャットルーム詳細

#### 3. DynamoDB設計
Connection管理:
- PK: `CONNECTION#{connectionId}`
- SK: `METADATA`
- userId, connectedAt

ChatRoom:
- PK: `CHATROOM#{roomId}`
- SK: `METADATA`
- participantIds, activityId, lastMessageAt

Message:
- PK: `CHATROOM#{roomId}`
- SK: `MESSAGE#{timestamp}#{messageId}`
- senderId, content, readBy[]

### Frontend

#### 1. WebSocket接続管理
- `frontend/src/services/websocket.ts` - WebSocket接続クラス
  - 接続・再接続ロジック
  - メッセージ送受信
  - イベントリスナー管理

#### 2. チャット状態管理
- `frontend/src/stores/chat.ts` - Zustand store
  - チャットルーム一覧
  - 現在のルーム
  - メッセージリスト
  - 未読数

#### 3. チャットUI
- `frontend/src/pages/chat/ChatList.tsx` - チャットルーム一覧
- `frontend/src/pages/chat/ChatRoom.tsx` - チャットルーム
- `frontend/src/components/chat/MessageBubble.tsx` - メッセージ表示
- `frontend/src/components/chat/MessageInput.tsx` - メッセージ入力

### CDK

#### 1. WebSocket Stack更新
- WebSocket API Gateway作成
- Lambda関数統合
- DynamoDB権限付与
- Connection管理テーブル

## 実装優先順位

1. **高**: チャットルーム作成・一覧（REST API）
2. **高**: WebSocket接続・切断ハンドラー
3. **高**: メッセージ送受信（WebSocket）
4. **中**: メッセージ履歴取得
5. **中**: 既読管理
6. **低**: 通知機能

## 参考
- AWS API Gateway WebSocket: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html
- DynamoDB Single Table Design for Chat: https://aws.amazon.com/blogs/database/
