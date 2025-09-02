import React, { useState, useEffect } from 'react';
import './NL2SQLPage.css';
import axios from 'axios';
import config from '../config';

const NL2SQLPage = ({ onNavigate }) => {
  // State management
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visualizationData, setVisualizationData] = useState(null);
  const [error, setError] = useState(null);

  // Load user sessions on component mount
  useEffect(() => {
    loadUserSessions();
  }, []);

  // Load chat history when session changes
  useEffect(() => {
    if (currentSession) {
      loadSessionHistory(currentSession.id_chat_session);
    }
  }, [currentSession]);

  // API Functions
  const loadUserSessions = async () => {
    try {
      const response = await axios.get(`${config.BASE_URL}/api/chat/sessions`);
      if (response.data.status === 'success') {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setError('Failed to load chat sessions');
    }
  };

  const loadSessionHistory = async (sessionId) => {
    try {
      const response = await axios.get(`${config.BASE_URL}/api/chat/sessions/${sessionId}`);
      if (response.data.status === 'success') {
        setChatHistory(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load session history:', error);
      setError('Failed to load session history');
    }
  };

  const createNewSession = async () => {
    try {
      const response = await axios.post(`${config.BASE_URL}/api/chat/sessions`, {
        title: `New NL2SQL Session - ${new Date().toLocaleString()}`,
        datasource_id: 1 // TODO: Make this dynamic based on user selection
      });
      
      if (response.data.status === 'success') {
        const newSession = response.data.data;
        setSessions(prev => [newSession, ...prev]);
        setCurrentSession(newSession);
        setChatHistory([]);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      setError('Failed to create new session');
    }
  };

  const sendNL2SQLQuery = async () => {
    if (!prompt.trim()) return;
    if (!currentSession) {
      await createNewSession();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${config.BASE_URL}/api/kelola-dashboard/nl2sql/generate`, {
        prompt: prompt.trim(),
        id_datasource: 1, // TODO: Make this dynamic
        session_id: currentSession.id_chat_session,
        execute: true,
        save_visualization: false
      });

      if (response.data.success) {
        const { sql_query, executed_data, explanation, confidence_score } = response.data.data;
        
        // Add user message to chat history
        const userMessage = {
          role: 'user',
          content: prompt.trim(),
          timestamp: new Date().toISOString()
        };

        // Add assistant response to chat history
        const assistantMessage = {
          role: 'assistant',
          content: {
            sql_query,
            explanation,
            confidence_score,
            executed_data: executed_data || null
          },
          timestamp: new Date().toISOString()
        };

        setChatHistory(prev => [...prev, userMessage, assistantMessage]);
        setVisualizationData(executed_data);
        setPrompt('');
        
        // Reload session history to get the latest from server
        setTimeout(() => loadSessionHistory(currentSession.id_chat_session), 500);
      } else {
        setError(response.data.message || 'Failed to generate SQL');
      }
    } catch (error) {
      console.error('NL2SQL Error:', error);
      setError('Failed to process your request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendNL2SQLQuery();
    }
  };

  const selectSession = (session) => {
    setCurrentSession(session);
    setVisualizationData(null);
    setError(null);
  };

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await axios.delete(`${config.BASE_URL}/api/chat/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id_chat_session !== sessionId));
      
      if (currentSession?.id_chat_session === sessionId) {
        setCurrentSession(null);
        setChatHistory([]);
        setVisualizationData(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      setError('Failed to delete session');
    }
  };

  const renderVisualization = () => {
    if (!visualizationData || !Array.isArray(visualizationData) || visualizationData.length === 0) {
      return (
        <div className="no-data-placeholder">
          <div className="no-data-content">
            <i className="fa fa-chart-bar fa-3x mb-3 text-muted"></i>
            <h5 className="text-muted">No Data to Display</h5>
            <p className="text-muted">Execute a query to see visualization results</p>
          </div>
        </div>
      );
    }

    return (
      <div className="visualization-container">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                {Object.keys(visualizationData[0]).map(key => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visualizationData.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, i) => (
                    <td key={i}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderChatMessage = (message, index) => {
    if (message.role === 'user') {
      return (
        <div key={index} className="chat-message user-message">
          <div className="message-content">
            <div className="message-text">{message.content}</div>
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      );
    } else if (message.role === 'assistant') {
      return (
        <div key={index} className="chat-message assistant-message">
          <div className="message-content">
            <div className="sql-query">
              <strong>Generated SQL:</strong>
              <pre className="sql-code">{message.content.sql_query}</pre>
            </div>
            {message.content.explanation && (
              <div className="explanation">
                <strong>Explanation:</strong>
                <p>{message.content.explanation}</p>
              </div>
            )}
            <div className="confidence-score">
              <small>Confidence: {(message.content.confidence_score * 100).toFixed(1)}%</small>
            </div>
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="nl2sql-page">
      {/* Navigation Header */}
      <div className="nl2sql-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => onNavigate('dashboard')}
              title="Back to Dashboard"
            >
              <i className="fa fa-arrow-left me-2"></i>
              Dashboard
            </button>
            <h4 className="page-title">Natural Language to SQL</h4>
          </div>
          <div className="header-right">
            <button 
              className="btn btn-outline-danger btn-sm"
              onClick={() => {
                localStorage.clear();
                delete axios.defaults.headers.common['Authorization'];
                window.location.reload();
              }}
              title="Logout"
            >
              <i className="fa fa-sign-out me-1"></i>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="nl2sql-content">
        {/* Left Sidebar - Sessions */}
        <div className="sessions-sidebar">
          <div className="sidebar-header">
            <h5>Chat Sessions</h5>
            <button 
              className="btn btn-primary btn-sm"
              onClick={createNewSession}
              title="Create New Session"
            >
              <i className="fa fa-plus"></i>
            </button>
          </div>
          
          <div className="sessions-list">
            {sessions.map(session => (
              <div 
                key={session.id_chat_session}
                className={`session-item ${currentSession?.id_chat_session === session.id_chat_session ? 'active' : ''}`}
                onClick={() => selectSession(session)}
              >
                <div className="session-title">{session.title}</div>
                <div className="session-meta">
                  <small>{new Date(session.created_at).toLocaleDateString()}</small>
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={(e) => deleteSession(session.id_chat_session, e)}
                    title="Delete Session"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
            
            {sessions.length === 0 && (
              <div className="no-sessions">
                <p className="text-muted">No chat sessions yet</p>
                <button className="btn btn-outline-primary" onClick={createNewSession}>
                  Create First Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Area - Visualization */}
        <div className="visualization-area">
          <div className="area-header">
            <h5>Query Results</h5>
            {currentSession && (
              <span className="current-session-name">{currentSession.title}</span>
            )}
          </div>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <div className="visualization-content">
            {renderVisualization()}
          </div>
        </div>

        {/* Right Sidebar - Chat & Input */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h5>Conversation</h5>
            {currentSession && (
              <small className="text-muted">
                Session: {currentSession.id_chat_session}
              </small>
            )}
          </div>
          
          {/* Chat History */}
          <div className="chat-history">
            {chatHistory.length === 0 ? (
              <div className="no-chat-placeholder">
                <i className="fa fa-comments fa-2x mb-2 text-muted"></i>
                <p className="text-muted">Start a conversation by asking a question</p>
              </div>
            ) : (
              chatHistory.map((message, index) => renderChatMessage(message, index))
            )}
          </div>

          {/* Input Area */}
          <div className="input-area">
            <div className="input-group">
              <textarea
                className="form-control"
                placeholder="Ask a question about your data..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                rows="3"
                disabled={isLoading}
              />
              <button 
                className="btn btn-primary"
                onClick={sendNL2SQLQuery}
                disabled={isLoading || !prompt.trim()}
              >
                {isLoading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Processing...
                  </span>
                ) : (
                  <span>
                    <i className="fa fa-paper-plane me-1"></i>
                    Send
                  </span>
                )}
              </button>
            </div>
            
            {!currentSession && (
              <small className="text-muted">
                No active session. A new session will be created when you send your first message.
              </small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NL2SQLPage;
