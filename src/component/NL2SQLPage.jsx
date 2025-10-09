import React, { useState, useEffect } from 'react';
import './NL2SQLPage.css';
import axios from 'axios';
import config from '../config';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const NL2SQLPage = ({ onNavigate }) => {
  const [sessions] = useState([
    { id_chat_session: '1', title: 'Session 1', created_at: new Date().toISOString() },
    { id_chat_session: '2', title: 'Session 2', created_at: new Date().toISOString() },
  ]);
  const [currentSession, setCurrentSession] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visualizationData, setVisualizationData] = useState(null);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('table');
  const [showChartSelector, setShowChartSelector] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    console.log('Updated Visualization Data:', JSON.stringify(visualizationData, null, 2));
  }, [visualizationData]);

  const sendNL2SQLQuery = async () => {
  if (!prompt.trim()) return;

  setIsLoading(true);
  setError(null);

  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/kelola-dashboard/nl2sql/generate`,
      {
        prompt: prompt.trim(),
        id_datasource: 12,
        execute: true,
        save_visualization: false,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }
    );

    console.log('NL2SQL Response:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      const { sql_query, explanation, confidence_score, analysis, chart_recommendation, used_knowledge } =
        response.data.data;
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
          used_knowledge: used_knowledge || [], // Tambahkan konteks bisnis
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

  const selectSession = (session) => {
    setCurrentSession(session);
    setVisualizationData(null);
    setError(null);
    setChatHistory([]);
    setChartType('table');
    setShowChartSelector(false);
    setSortConfig({ key: null, direction: 'asc' });
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
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  {columns.map((key) => (
                    <th
                      key={key}
                      style={{ cursor: 'pointer' }}
                      onClick={() => sortData(key)}
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
                      <td key={i}>{String(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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

      chartComponent = <Pie data={chartData} options={chartOptions} height={300} />;
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

      chartComponent = <Line data={chartData} options={chartOptions} height={300} />;
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

      chartComponent = <Bar data={chartData} options={chartOptions} height={300} />;
    }

    return (
      <div className="visualization-container">
        {chartComponent}
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
          {message.content.used_knowledge && message.content.used_knowledge.length > 0 && (
            <div className="knowledge-context">
              <strong>Konteks Bisnis Digunakan:</strong>
              <ul>
                {message.content.used_knowledge.map((k, i) => (
                  <li key={i}>
                    <strong>{k.term}:</strong> {k.content}
                  </li>
                ))}
              </ul>
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
        <div className="sessions-sidebar">
          <div className="sidebar-header">
            <h5>Sesi Chat</h5>
            <button
              className="btn btn-primary btn-sm"
              title="Buat Sesi Baru"
              disabled
            >
              <i className="fa fa-plus"></i>
            </button>
          </div>
          <div className="sessions-list">
            {sessions.map((session) => (
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
                    title="Hapus Sesi"
                    disabled
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="no-sessions">
                <p className="text-muted">Belum ada sesi chat</p>
                <button
                  className="btn btn-outline-primary"
                  disabled
                >
                  Buat Sesi Pertama
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="visualization-area">
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

        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h5>Percakapan</h5>
            {currentSession && <small className="text-muted">Sesi: {currentSession.id_chat_session}</small>}
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
                Tidak ada sesi aktif. Mulai dengan mengirim pertanyaan.
              </small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NL2SQLPage;