# Group Chat Design — Activity-Linked Group Chat

## Context

The Connect40 app has a chat feature that structurally supports group chat (type: 'direct' | 'group', participantIds array) but lacks the actual group chat experience. Users want automatic group chat creation when joining activities.

## Requirements

- When a user joins an activity, a group chat room is automatically created (or joined if it already exists)
- When a user leaves an activity, they are removed from the group chat
- System messages ("X joined", "X left") are posted on member changes
- Existing read receipt behavior (simple read/unread) is maintained
- Activity detail page shows a button to open the group chat

## Design

### Data Model Changes

**CHATROOM metadata — add `name` field:**
- Auto-populated from activity title

**MESSAGE — add `messageType` field:**
- `'user' | 'system'` (defaults to `'user'` for existing messages)

**New record pattern — activity-to-chatroom lookup:**
- `PK=ACTIVITY#<activityId>`, `SK=CHATROOM#<chatRoomId>`
- Enables O(1) lookup of whether an activity already has a chat room

### Backend Changes

**join Lambda:**
1. After successful activity join, query `ACTIVITY#<id>/CHATROOM#` to check for existing room
2. If no room: create room (name=activity title, type='group', activityId, participantIds=[host, joiner]) + create lookup record
3. If room exists: add user to participantIds + create USER participation record
4. Post system message ("Xさんが参加しました")
5. Notify existing members via WebSocket

**leave Lambda (new or extended):**
1. Query `ACTIVITY#<id>/CHATROOM#` for room ID
2. Remove user from participantIds
3. Delete USER participation record
4. Post system message ("Xさんが退出しました")
5. Notify remaining members via WebSocket

**getRooms Lambda fix:**
- Return room metadata (name, type, participantIds, activityId) alongside participation records
- Fix response format to match frontend expectations (`data.rooms`)

### Frontend Changes

**ChatList:** Display room name (from `room.name`), participant count, group icon
**ChatRoom:** Show room name in header, system message UI (centered, muted style)
**MessageBubble:** System message variant (no sender, centered text)
**ActivityDetail:** "Open group chat" button when user is a participant

### Existing Bug Fixes

- CDK references `getRooms.ts` but frontend expects `getRooms_fixed.ts` response format
- ChatList receives only participation records, not room metadata

## Approach

Approach A: Integrate chat logic directly into join/leave Lambdas. Chosen over event-driven (Approach B) for simplicity and immediate consistency, appropriate for the project's current scale.
