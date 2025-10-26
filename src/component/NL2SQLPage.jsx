import React, { useState, useEffect } from 'react';
import './NL2SQLPage.css';
import axios from 'axios';
import config from '../config';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const NL2SQLPage = ({ onNavigate }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [visualizationData, setVisualizationData] = useState(null);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('table');
  const [showChartSelector, setShowChartSelector] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  
  // Sidebar states
  const [isChatSidebarMinimized, setIsChatSidebarMinimized] = useState(false);
  const [isSessionSidebarMinimized, setIsSessionSidebarMinimized] = useState(false);

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    console.log('Updated Visualization Data:', JSON.stringify(visualizationData, null, 2));
  }, [visualizationData]);

  // Load user's chat sessions
  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/api/chat-sessions`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      
      if (response.data.status === 'success') {
        setSessions(response.data.data);
      } else {
        setError('Gagal memuat sesi chat');
      }
    } catch (error) {
      console.error('Load sessions error:', error);
      setError('Gagal memuat sesi chat');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Create new chat session
  const createNewSession = async () => {
    setIsCreatingSession(true);
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/api/chat-sessions`,
        {
          title: `Sesi Chat ${new Date().toLocaleString('id-ID')}`,
          datasource_id: 12 // Default datasource ID
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      
      if (response.data.status === 'success') {
        const newSession = response.data.data;
        setSessions(prev => [newSession, ...prev]);
        setCurrentSession(newSession);
        setChatHistory([]);
        setVisualizationData(null);
        setError(null);
      } else {
        setError('Gagal membuat sesi baru');
      }
    } catch (error) {
      console.error('Create session error:', error);
      setError('Gagal membuat sesi baru');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Load chat history for selected session
  const loadSessionHistory = async (sessionId) => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/api/chat-sessions/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      
      if (response.data.status === 'success') {
        const messages = response.data.data.messages.map(msg => ({
          role: msg.type === 'human' ? 'user' : 'assistant',
          content: msg.type === 'human' ? msg.content : {
            sql_query: msg.content.includes('```sql') ? msg.content.split('```sql')[1]?.split('```')[0]?.trim() : '',
            explanation: msg.content,
          },
          timestamp: msg.timestamp
        }));
        setChatHistory(messages);
      }
    } catch (error) {
      console.error('Load session history error:', error);
    }
  };

  // Delete chat session
  const deleteSession = async (sessionId, event) => {
    event.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus sesi ini?')) return;
    
    try {
      const response = await axios.delete(
        `${config.API_BASE_URL}/api/chat-sessions/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      
      if (response.data.status === 'success') {
        setSessions(prev => prev.filter(s => s.session_id !== sessionId));
        if (currentSession?.session_id === sessionId) {
          setCurrentSession(null);
          setChatHistory([]);
          setVisualizationData(null);
        }
      } else {
        setError('Gagal menghapus sesi');
      }
    } catch (error) {
      console.error('Delete session error:', error);
      setError('Gagal menghapus sesi');
    }
  };

  // Start editing session title
  const startEditSession = (session, event) => {
    event.stopPropagation();
    setEditingSession(session.session_id);
    setEditTitle(session.title);
  };

  // Cancel editing session title
  const cancelEditSession = () => {
    setEditingSession(null);
    setEditTitle('');
  };

  // Save edited session title
  const saveEditSession = async (sessionId, event) => {
    if (event) event.stopPropagation();
    if (!editTitle.trim()) return;
    
    setIsUpdatingSession(true);
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/api/chat-sessions/${sessionId}`,
        { title: editTitle.trim() },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      
      if (response.data.status === 'success') {
        // Update sessions list
        setSessions(sessions.map(s => 
          s.session_id === sessionId 
            ? { ...s, title: editTitle.trim() }
            : s
        ));
        
        // Update current session if it's the one being edited
        if (currentSession?.session_id === sessionId) {
          setCurrentSession({ ...currentSession, title: editTitle.trim() });
        }
        
        setEditingSession(null);
        setEditTitle('');
      } else {
        setError('Gagal mengupdate judul sesi');
      }
    } catch (error) {
      console.error('Update session error:', error);
      setError('Gagal mengupdate judul sesi');
    } finally {
      setIsUpdatingSession(false);
    }
  };

  // Handle key press in edit input
  const handleEditKeyPress = (e, sessionId) => {
    if (e.key === 'Enter') {
      saveEditSession(sessionId);
    } else if (e.key === 'Escape') {
      cancelEditSession();
    }
  };

  // Sidebar toggle functions
  const toggleChatSidebar = () => {
    setIsChatSidebarMinimized(!isChatSidebarMinimized);
  };

  const toggleSessionSidebar = () => {
    setIsSessionSidebarMinimized(!isSessionSidebarMinimized);
  };

  const sendNL2SQLQuery = async () => {
    if (!prompt.trim()) return;

    // Create session if none exists
    let sessionToUse = currentSession;
    if (!sessionToUse) {
      await createNewSession();
      sessionToUse = currentSession; // This should be updated after createNewSession
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/api/kelola-dashboard/nl2sql/generate`,
        {
          prompt: prompt.trim(),
          id_datasource: 12,
          session_id: sessionToUse?.session_id, // Include session_id for chat history
          execute: true,
          save_visualization: false,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      console.log('NL2SQL Response:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        const { sql_query, explanation, confidence_score, analysis, chart_recommendation } = response.data.data;
        const executed_data = response.data.executed_data;

        console.log('Executed Data:', JSON.stringify(executed_data, null, 2));
        console.log('Chart Recommendation:', chart_recommendation);

        if (chart_recommendation) {
          setChartType(chart_recommendation.recommended_type || 'table');
          setShowChartSelector(true);
        }

        const userMessage = {
          role: 'user',
          content: prompt.trim(),
          timestamp: new Date().toISOString(),
        };

        const assistantMessage = {
          role: 'assistant',
          content: {
            sql_query,
            explanation,
            confidence_score,
            analysis,
            executed_data: executed_data || null,
          },
          timestamp: new Date().toISOString(),
        };

        setChatHistory((prev) => [...prev, userMessage, assistantMessage]);

        const dataToSet = Array.isArray(executed_data) && executed_data.length > 0 ? [...executed_data] : [];
        console.log('Setting visualizationData:', JSON.stringify(dataToSet, null, 2));
        setVisualizationData(dataToSet);
        setPrompt('');
        setSortConfig({ key: null, direction: 'asc' });
      } else {
        setError(response.data.message || 'Gagal menghasilkan SQL');
      }
    } catch (error) {
      console.error('NL2SQL Error:', error);
      setError(error.response?.data?.message || 'Gagal memproses permintaan');
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

  const selectSession = async (session) => {
    setCurrentSession(session);
    setVisualizationData(null);
    setError(null);
    setChartType('table');
    setShowChartSelector(false);
    setSortConfig({ key: null, direction: 'asc' });
    
    // Load chat history for this session
    await loadSessionHistory(session.session_id);
  };

  const sortData = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedData = [...visualizationData].sort((a, b) => {
      const aValue = a[key] ?? '';
      const bValue = b[key] ?? '';
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    setVisualizationData(sortedData);
    setSortConfig({ key, direction });
  };

  const renderVisualization = () => {
    console.log('Rendering Visualization Data:', JSON.stringify(visualizationData, null, 2));
    console.log('Current Chart Type:', chartType);

    if (!visualizationData || !Array.isArray(visualizationData) || visualizationData.length === 0) {
      return (
        <div className="no-data-placeholder">
          <div className="no-data-content">
            <i className="fa fa-chart-bar fa-3x mb-3 text-muted"></i>
            <h5 className="text-muted">Tidak Ada Data untuk Ditampilkan</h5>
            <p className="text-muted">Jalankan query untuk melihat hasil visualisasi</p>
          </div>
        </div>
      );
    }

    const columns = Object.keys(visualizationData[0] || {});
    if (columns.length === 0) {
      console.warn('No columns found in visualization data');
      return (
        <div className="no-data-placeholder">
          <div className="no-data-content">
            <h5 className="text-muted">Data Tidak Valid</h5>
            <p className="text-muted">Data yang diterima tidak memiliki kolom</p>
          </div>
        </div>
      );
    }

    let chartComponent = null;
    let chartData = null;
    let chartOptions = null;

    if (chartType === 'table') {
      return (
        <div className="visualization-container">
          <div className="table-wrapper">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    {columns.map((key) => (
                      <th
                        key={key}
                        style={{ cursor: 'pointer' }}
                        onClick={() => sortData(key)}
                        title={`Klik untuk mengurutkan berdasarkan ${key}`}
                      >
                        {key}
                        {sortConfig.key === key && (
                          <span className="ms-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visualizationData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} title={String(value)}>{String(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    const isSingleColumn = columns.length === 1;
    const isAggregation = columns.length >= 2 && typeof visualizationData[0][columns[1]] === 'number';
    const isTimeSeries = columns.some((col) => col.toLowerCase().includes('date') || col.toLowerCase().includes('month') || col.toLowerCase().includes('year'));

    if (chartType === 'pie') {
      let labels, values;
      if (isAggregation) {
        labels = visualizationData.map((row) => String(row[columns[0]] || ''));
        values = visualizationData.map((row) => Number(row[columns[1]]) || 0);
      } else {
        const valueCounts = visualizationData.reduce((acc, row) => {
          const value = String(row[columns[0]] || '').trim();
          if (value) {
            acc[value] = (acc[value] || 0) + 1;
          }
          return acc;
        }, {});
        console.log('Pie Chart Value Counts:', JSON.stringify(valueCounts, null, 2));
        labels = Object.keys(valueCounts);
        values = Object.values(valueCounts);
      }

      if (labels.length === 0 || values.length === 0) {
        console.warn('No valid data for Pie Chart');
        return (
          <div className="no-data-placeholder">
            <div className="no-data-content">
              <h5 className="text-muted">Data Tidak Valid untuk Pie Chart</h5>
              <p className="text-muted">Data tidak cukup untuk menampilkan Pie Chart</p>
            </div>
          </div>
        );
      }

      chartData = {
        labels,
        datasets: [
          {
            label: isAggregation ? columns[1] : 'Jumlah',
            data: values,
            backgroundColor: ['#4CAF50', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#3F51B5', '#FFEB3B', '#E91E63', '#009688', '#FFC107'],
            borderColor: '#333',
            borderWidth: 1,
          },
        ],
      };

      chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: `Distribusi ${isAggregation ? columns[1] : columns[0]}` },
        },
      };

      chartComponent = <Pie data={chartData} options={chartOptions} />;
    } else if (chartType === 'line') {
      const labels = visualizationData.map((row) => String(row[columns[0]]));
      const values = visualizationData.map((row) => Number(row[columns[1]]) || 0);

      chartData = {
        labels,
        datasets: [
          {
            label: columns[1] || 'Nilai',
            data: values,
            backgroundColor: 'rgba(33, 150, 243, 0.2)',
            borderColor: '#2196F3',
            fill: true,
          },
        ],
      };

      chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Tren Data' },
        },
        scales: {
          x: { title: { display: true, text: columns[0] } },
          y: { title: { display: true, text: columns[1] || 'Nilai' } },
        },
      };

      chartComponent = <Line data={chartData} options={chartOptions} />;
    } else if (chartType === 'bar') {
      const labels = visualizationData.map((row) => String(row[columns[0]]));
      const values = visualizationData.map((row) => Number(row[columns[1]]) || 0);

      chartData = {
        labels,
        datasets: [
          {
            label: columns[1] || 'Jumlah',
            data: values,
            backgroundColor: ['#4CAF50', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#3F51B5', '#FFEB3B'],
            borderColor: '#333',
            borderWidth: 1,
          },
        ],
      };

      chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Jumlah Peserta per Provinsi' },
        },
        scales: {
          x: { title: { display: true, text: columns[0] } },
          y: { title: { display: true, text: columns[1] || 'Jumlah' } },
        },
      };

      chartComponent = <Bar data={chartData} options={chartOptions} />;
    }

    return (
      <div className="visualization-container">
        <div className="chart-container">
          {chartComponent}
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
            <div className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</div>
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
                <strong>Penjelasan:</strong>
                <p>{message.content.explanation}</p>
              </div>
            )}
            {message.content.analysis && (
              <div className="analysis">
                <strong>Analisis:</strong>
                <p>{message.content.analysis}</p>
              </div>
            )}
            <div className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="nl2sql-page">
      <div className="nl2sql-header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={() => onNavigate('dashboard')}
              title="Kembali ke Dashboard"
            >
              <i className="fa fa-arrow-left me-2"></i>
              Dashboard
            </button>
            <button
              className="btn btn-outline-info btn-sm"
              onClick={() => onNavigate('knowledge')}
              title="Kelola Basis Pengetahuan"
            >
              <i className="fa fa-book me-2"></i>
              Knowledge Base
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

      <div className="nl2sql-content">
        <div className={`sessions-sidebar ${isSessionSidebarMinimized ? 'minimized' : ''}`}>
          <button className="sidebar-toggle" onClick={toggleSessionSidebar} title="Toggle Session Sidebar">
            <i className={`fa fa-chevron-${isSessionSidebarMinimized ? 'right' : 'left'}`}></i>
          </button>
          
          <div className="sidebar-content">
            <div className="sidebar-header">
              <h5>Sesi Chat</h5>
              <button
                className="btn btn-primary btn-sm"
                onClick={createNewSession}
                disabled={isCreatingSession}
                title="Buat Sesi Baru"
              >
                {isCreatingSession ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <i className="fa fa-plus"></i>
                )}
              </button>
            </div>
            <div className="sessions-list">
            {isLoadingSessions ? (
              <div className="text-center p-3">
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Memuat sesi...
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`session-item ${currentSession?.session_id === session.session_id ? 'active' : ''}`}
                  onClick={() => editingSession !== session.session_id ? selectSession(session) : null}
                >
                  {editingSession === session.session_id ? (
                    <div className="session-edit-mode">
                      <input
                        type="text"
                        className="form-control form-control-sm mb-2"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyPress={(e) => handleEditKeyPress(e, session.session_id)}
                        onBlur={() => saveEditSession(session.session_id)}
                        placeholder="Masukkan judul sesi"
                        autoFocus
                        disabled={isUpdatingSession}
                      />
                      <div className="session-edit-actions">
                        <button
                          className="btn btn-success btn-sm me-1"
                          onClick={(e) => saveEditSession(session.session_id, e)}
                          disabled={isUpdatingSession || !editTitle.trim()}
                          title="Simpan"
                        >
                          {isUpdatingSession ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <i className="fa fa-check"></i>
                          )}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={cancelEditSession}
                          disabled={isUpdatingSession}
                          title="Batal"
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="session-title">{session.title}</div>
                      <div className="session-meta">
                        <small>{new Date(session.created_at).toLocaleDateString('id-ID')}</small>
                        <div className="session-actions">
                          <button
                            className="btn btn-outline-primary btn-sm me-1"
                            onClick={(e) => startEditSession(session, e)}
                            title="Edit Judul"
                          >
                            <i className="fa fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={(e) => deleteSession(session.session_id, e)}
                            title="Hapus Sesi"
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            {sessions.length === 0 && !isLoadingSessions && (
              <div className="no-sessions">
                <p className="text-muted">Belum ada sesi chat</p>
                <button
                  className="btn btn-outline-primary"
                  onClick={createNewSession}
                  disabled={isCreatingSession}
                >
                  {isCreatingSession ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Membuat...
                    </span>
                  ) : (
                    'Buat Sesi Pertama'
                )}
              </button>
            </div>
            )}
          </div>
          </div>
        </div>        <div className="visualization-area">
          <div className="area-header">
            <h5>Hasil Query</h5>
            {showChartSelector && visualizationData && (
              <div className="d-flex align-items-center gap-2">
                <select
                  className="form-select form-select-sm"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="table">Tabel</option>
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
            )}
            {currentSession && <span className="current-session-name">{currentSession.title}</span>}
          </div>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <div className="visualization-content">{renderVisualization()}</div>
        </div>

        <div className={`chat-sidebar ${isChatSidebarMinimized ? 'minimized' : ''}`}>
          <button className="sidebar-toggle" onClick={toggleChatSidebar} title="Toggle Chat Sidebar">
            <i className={`fa fa-chevron-${isChatSidebarMinimized ? 'left' : 'right'}`}></i>
          </button>
          
          <div className="sidebar-content">
            <div className="sidebar-header">
              <h5>Percakapan</h5>
              {currentSession && (
                <small className="text-muted">
                  Sesi: {currentSession.session_id.substring(0, 8)}...
                </small>
              )}
            </div>
            <div className="chat-history">
            {chatHistory.length === 0 ? (
              <div className="no-chat-placeholder">
                <i className="fa fa-comments fa-2x mb-2 text-muted"></i>
                <p className="text-muted">Mulai percakapan dengan mengajukan pertanyaan</p>
              </div>
            ) : (
              chatHistory.map((message, index) => renderChatMessage(message, index))
            )}
          </div>
          <div className="input-area">
            <div className="input-group">
              <textarea
                className="form-control"
                placeholder="Ajukan pertanyaan tentang data Anda..."
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
                    Memproses...
                  </span>
                ) : (
                  <span>
                    <i className="fa fa-paper-plane me-1"></i>
                    Kirim
                  </span>
                )}
              </button>
            </div>
            {!currentSession && (
              <small className="text-muted">
                Tidak ada sesi aktif. Sesi baru akan dibuat otomatis saat mengirim pertanyaan.
              </small>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NL2SQLPage;