# NL2SQL Frontend Integration Testing Guide

## Testing Checklist

### 1. **Frontend-Backend Session Integration**

#### Test Case 1: Load Existing Sessions
- [ ] Open NL2SQL page
- [ ] Verify sessions load from `/api/chat-sessions`
- [ ] Check loading spinner appears during load
- [ ] Verify session list displays correctly with titles and dates
- [ ] Test empty state when no sessions exist

#### Test Case 2: Create New Session
- [ ] Click "+" button to create new session
- [ ] Verify POST request to `/api/chat-sessions`
- [ ] Check session appears in list immediately
- [ ] Verify auto-generated title with timestamp
- [ ] Test session auto-selection after creation

#### Test Case 3: Select Existing Session
- [ ] Click on existing session in list
- [ ] Verify session becomes active (highlighted)
- [ ] Check chat history loads from `/api/chat-sessions/{sessionId}`
- [ ] Verify previous conversations display correctly
- [ ] Test message parsing (user vs assistant messages)

#### Test Case 4: Delete Session
- [ ] Hover over session item to reveal delete button
- [ ] Click delete button and confirm
- [ ] Verify DELETE request to `/api/chat-sessions/{sessionId}`
- [ ] Check session removes from list immediately
- [ ] Test active session clearing when current session deleted

### 2. **NL2SQL Query Integration**

#### Test Case 5: Send Query with Session
- [ ] Select active session
- [ ] Type query in input area
- [ ] Send query and verify session_id included in FastAPI request
- [ ] Check chat history updates with new messages
- [ ] Verify SQL result visualization updates

#### Test Case 6: Auto-Create Session on Query
- [ ] Clear current session selection
- [ ] Send query without active session
- [ ] Verify new session creates automatically
- [ ] Check session appears in list and becomes active
- [ ] Test chat history shows the query and response

#### Test Case 7: Query Error Handling
- [ ] Send invalid/complex query
- [ ] Verify error displays appropriately
- [ ] Check session and chat history remain intact
- [ ] Test retry functionality

### 3. **FastAPI-Laravel Chat History Sync**

#### Test Case 8: Chat History Persistence
- [ ] Send multiple queries in same session
- [ ] Refresh page and reload same session
- [ ] Verify chat history persists across page loads
- [ ] Check message order and content accuracy
- [ ] Test session_id consistency

#### Test Case 9: Cross-System Message Format
- [ ] Send query through frontend
- [ ] Check message format in PostgreSQL chat_history table
- [ ] Verify LangChain JSONB structure
- [ ] Test message type parsing (human/ai)
- [ ] Check timestamp consistency

### 4. **UI/UX Testing**

#### Test Case 10: Loading States
- [ ] Test session loading spinner
- [ ] Check session creation loading state
- [ ] Verify query processing loading indicator
- [ ] Test disabled states during operations

#### Test Case 11: Responsive Design
- [ ] Test on desktop (3-column layout)
- [ ] Test on tablet (stacked layout)
- [ ] Test on mobile (single column)
- [ ] Verify scrolling works in all viewports

#### Test Case 12: Interactive Elements
- [ ] Test session hover effects
- [ ] Check delete button reveal on hover
- [ ] Verify active session highlighting
- [ ] Test button states (enabled/disabled)

### 5. **Error Scenarios**

#### Test Case 13: Network Errors
- [ ] Disconnect network and try loading sessions
- [ ] Test session creation with network failure
- [ ] Check query sending with API down
- [ ] Verify appropriate error messages display

#### Test Case 14: Authentication Errors
- [ ] Test with expired token
- [ ] Check unauthorized session access
- [ ] Verify login redirect behavior
- [ ] Test token refresh scenarios

#### Test Case 15: Data Validation
- [ ] Test empty query submission
- [ ] Check maximum query length handling
- [ ] Test special characters in queries
- [ ] Verify session title validation

## API Testing Commands

### Test Session Management:
```bash
# Load sessions
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/chat-sessions

# Create session
curl -X POST -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Session","datasource_id":12}' \
  http://localhost:8000/api/chat-sessions

# Get session history
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/chat-sessions/{session-uuid}

# Delete session
curl -X DELETE -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/chat-sessions/{session-uuid}
```

### Test NL2SQL with Session:
```bash
curl -X POST -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show all users",
    "id_datasource": 12,
    "session_id": "{session-uuid}",
    "execute": true
  }' \
  http://localhost:8000/api/kelola-dashboard/nl2sql/generate
```

## Database Verification

### Check Chat Sessions:
```sql
SELECT session_id, title, user_id, datasource_id, created_at 
FROM chat_sessions 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

### Check Chat History:
```sql
SELECT ch.id, ch.session_id, ch.message->>'type' as message_type, 
       ch.message->'data'->>'content' as content, ch.created_at
FROM chat_history ch 
WHERE ch.session_id = '{session-uuid}'
ORDER BY ch.created_at ASC;
```

### Verify UUID Consistency:
```sql
SELECT cs.session_id as laravel_session_id, 
       COUNT(ch.*) as message_count
FROM chat_sessions cs
LEFT JOIN chat_history ch ON cs.session_id = ch.session_id
GROUP BY cs.session_id;
```

## Performance Testing

### Load Testing:
- [ ] Test with 50+ sessions loaded
- [ ] Check large chat history rendering
- [ ] Verify scroll performance
- [ ] Test concurrent query processing

### Memory Usage:
- [ ] Monitor browser memory during long sessions
- [ ] Check for memory leaks with session switching
- [ ] Test chat history cleanup

## Browser Compatibility

### Test Browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Test Features:
- [ ] UUID support
- [ ] WebSocket connections (if implemented)
- [ ] Local storage handling
- [ ] CORS handling

## Production Readiness

### Security Check:
- [ ] Verify all API calls include authentication
- [ ] Check session isolation between users
- [ ] Test CSRF protection
- [ ] Verify input sanitization

### Error Monitoring:
- [ ] Test error logging and reporting
- [ ] Check user-friendly error messages
- [ ] Verify graceful degradation
- [ ] Test offline behavior

This comprehensive testing guide ensures full integration between React frontend, Laravel backend, and FastAPI NL2SQL service with robust chat session management.