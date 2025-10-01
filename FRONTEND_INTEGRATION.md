# NL2SQL Frontend Integration Documentation

## Overview
Frontend React terintegrasi dengan Laravel backend untuk mengelola chat sessions dan FastAPI untuk NL2SQL processing. Sistem menggunakan UUID session_id untuk kompatibilitas penuh.

## Key Features

### 1. **Chat Session Management**
- ✅ Load user's chat sessions from Laravel backend
- ✅ Create new chat sessions with auto-generated UUID
- ✅ Delete chat sessions with confirmation
- ✅ Load chat history for selected sessions
- ✅ Real-time session switching

### 2. **NL2SQL Integration**
- ✅ Auto-create session if none exists when sending query
- ✅ Send session_id to FastAPI for chat history persistence
- ✅ Display conversation history from database
- ✅ Support for SQL query results visualization

### 3. **UI/UX Improvements**
- ✅ Loading states for all async operations
- ✅ Session creation/deletion with visual feedback
- ✅ Hover effects for session interactions
- ✅ UUID display with shortened format
- ✅ Better error handling and user messages

## API Integration

### Laravel Backend Endpoints Used:

1. **GET `/api/chat-sessions`**
   - Load user's chat sessions
   - Headers: `Authorization: Bearer {token}`
   - Response: `{ status: 'success', data: [sessions] }`

2. **POST `/api/chat-sessions`**
   - Create new chat session
   - Body: `{ title: string, datasource_id: number }`
   - Response: `{ status: 'success', data: session }`

3. **GET `/api/chat-sessions/{sessionId}`**
   - Load chat history for specific session
   - Response: `{ status: 'success', data: { session, messages } }`

4. **DELETE `/api/chat-sessions/{sessionId}`**
   - Delete chat session and its history
   - Response: `{ status: 'success', message: string }`

### FastAPI Integration:

1. **POST `/api/kelola-dashboard/nl2sql/generate`**
   - Generate SQL from natural language
   - Body includes: `session_id` for chat history persistence
   - Automatic conversation saving to PostgreSQL chat_history table

## Data Flow

```
1. User opens NL2SQL page
   └── Load sessions from Laravel (/api/chat-sessions)

2. User selects session
   └── Load chat history (/api/chat-sessions/{id})
   └── Display previous conversations

3. User sends query
   ├── Auto-create session if none exists
   ├── Send to FastAPI with session_id
   ├── FastAPI saves to PostgreSQL chat_history
   └── Display results and update chat

4. User creates new session
   └── POST to Laravel (/api/chat-sessions)
   └── Auto-select new session

5. User deletes session
   └── DELETE from Laravel (/api/chat-sessions/{id})
   └── Clean up chat_history via model relationships
```

## State Management

### Key React States:
```javascript
const [sessions, setSessions] = useState([]);           // User's chat sessions
const [currentSession, setCurrentSession] = useState(null); // Active session
const [chatHistory, setChatHistory] = useState([]);    // Current session messages
const [isLoadingSessions, setIsLoadingSessions] = useState(false); // Loading sessions
const [isCreatingSession, setIsCreatingSession] = useState(false); // Creating session
```

### Session Object Structure:
```javascript
{
  id_chat_session: 123,           // Auto-increment ID (backward compatibility)
  session_id: "uuid-string",     // UUID for FastAPI compatibility
  title: "Session Title",
  datasource_id: 12,
  user_id: 1,
  created_at: "2025-09-24T...",
  modified_at: "2025-09-24T..."
}
```

### Message Object Structure:
```javascript
{
  role: 'user' | 'assistant',
  content: string | {
    sql_query: string,
    explanation: string,
    confidence_score: number,
    executed_data: array
  },
  timestamp: string
}
```

## Error Handling

### Frontend Error Handling:
- Network errors with user-friendly messages
- Session creation/deletion failures
- Query processing errors
- Loading state management

### Backend Error Handling:
- Authentication failures (401)
- Permission errors (403)
- Session not found (404)
- Server errors (500)

## Security Features

1. **Authentication**: All requests require Bearer token
2. **Authorization**: Users can only access their own sessions
3. **Input Validation**: Prompt and session data validation
4. **CSRF Protection**: Laravel CSRF handling
5. **SQL Injection Prevention**: Parameterized queries

## Performance Optimizations

1. **Lazy Loading**: Sessions loaded on demand
2. **Efficient Updates**: State updates only when necessary
3. **Debounced Actions**: Prevent rapid API calls
4. **Caching**: Browser caching for static assets
5. **Optimistic Updates**: UI updates before API confirmation

## Usage Examples

### Creating New Session:
```javascript
await createNewSession();
// Auto-generates title with timestamp
// Sets datasource_id to default (12)
// Switches to new session automatically
```

### Sending Query with Session:
```javascript
await sendNL2SQLQuery();
// Auto-creates session if none exists
// Includes session_id in FastAPI request
// Updates chat history in real-time
```

### Session Management:
```javascript
await selectSession(session);    // Load session with history
await deleteSession(sessionId);  // Delete with confirmation
await loadSessions();           // Refresh session list
```

## Responsive Design

- **Desktop**: 3-column layout (sessions | visualization | chat)
- **Tablet**: Column stacking with optimal heights
- **Mobile**: Single column with collapsible sections

## Future Enhancements

1. **Real-time Updates**: WebSocket for live session updates
2. **Session Sharing**: Share sessions between users
3. **Export Features**: Export chat history and results
4. **Advanced Filters**: Filter sessions by date, datasource
5. **Bulk Operations**: Multi-select session management
6. **Session Templates**: Pre-defined session types

This integration provides a seamless experience between React frontend, Laravel backend, and FastAPI NL2SQL service with full chat session persistence and management capabilities.