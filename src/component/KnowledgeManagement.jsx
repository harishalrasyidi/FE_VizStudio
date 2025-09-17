import React, { useState } from 'react';
import { Search, Plus, MoreVertical, X, ArrowLeft, Database } from 'lucide-react';
import './KnowledgeManagement.css';

const KnowledgeManagement = ({ onNavigate }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: '',
    term: '',
    description: ''
  });

  // Data dummy untuk tabel
  const [knowledgeData, setKnowledgeData] = useState([
    {
      id: 1,
      type: 'Terminologi Bisnis',
      term: 'ROI (Return on Investment)',
      description: 'Rasio keuntungan atau kerugian dari suatu investasi relatif terhadap jumlah uang yang diinvestasikan.'
    },
    {
      id: 2,
      type: 'Kata Kunci SQL',
      term: 'SELECT',
      description: 'Perintah untuk mengambil data dari tabel database. Digunakan untuk menampilkan kolom tertentu atau semua kolom.'
    },
    {
      id: 3,
      type: 'Metrik Bisnis',
      term: 'Conversion Rate',
      description: 'Persentase pengunjung yang melakukan tindakan yang diinginkan (pembelian, pendaftaran, dll).'
    },
    {
      id: 4,
      type: 'Terminologi Bisnis',
      term: 'KPI (Key Performance Indicator)',
      description: 'Indikator kinerja utama yang digunakan untuk mengukur efektivitas pencapaian tujuan bisnis.'
    },
    {
      id: 5,
      type: 'Kata Kunci SQL',
      term: 'JOIN',
      description: 'Operasi untuk menggabungkan data dari dua atau lebih tabel berdasarkan kolom yang berkaitan.'
    },
    {
      id: 6,
      type: 'Metrik Bisnis',
      term: 'ARPU (Average Revenue Per User)',
      description: 'Rata-rata pendapatan yang dihasilkan per pengguna dalam periode waktu tertentu.'
    }
  ]);

  const knowledgeTypes = [
    'Terminologi Bisnis',
    'Kata Kunci SQL',
    'Metrik Bisnis',
    'Konsep Analitik',
    'Definisi Data'
  ];

  // Filter data berdasarkan pencarian
  const filteredData = knowledgeData.filter(item =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.type && formData.term && formData.description) {
      const newKnowledge = {
        id: knowledgeData.length + 1,
        type: formData.type,
        term: formData.term,
        description: formData.description
      };
      setKnowledgeData(prev => [...prev, newKnowledge]);
      setFormData({ type: '', term: '', description: '' });
      setShowSidebar(false);
    }
  };

  const handleAddNew = () => {
    setShowSidebar(true);
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
    setFormData({ type: '', term: '', description: '' });
  };

  return (
    <div className="knowledge-management">
      {/* Header */}
      <div className="knowledge-header">
        <div className="navigation-bar">
          {onNavigate && (
            <div className="nav-buttons">
              <button
                className="btn btn-outline-secondary btn-sm me-2"
                onClick={() => onNavigate('dashboard')}
                title="Kembali ke Dashboard"
              >
                <ArrowLeft size={16} className="me-1" />
                Dashboard
              </button>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => onNavigate('nl2sql')}
                title="Natural Language to SQL"
              >
                <Database size={16} className="me-1" />
                NL2SQL
              </button>
            </div>
          )}
        </div>
        <h1 className="knowledge-title">Manajemen Basis Pengetahuan</h1>
        
        {/* Info Box */}
        <div className="info-box">
          <div className="info-content">
            <strong>Tentang Basis Pengetahuan:</strong>
            <p>
              Kelola kamus bisnis dan terminologi yang digunakan dalam sistem. 
              Basis pengetahuan ini membantu AI memahami konteks bisnis dan menghasilkan 
              query yang lebih akurat dari bahasa natural.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="controls-section">
          <button 
            className="add-button"
            onClick={handleAddNew}
          >
            <Plus size={16} />
            ADD NEW +
          </button>
          
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari pengetahuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
        {/* Sidebar Form */}
        {showSidebar && (
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>Tambah Pengetahuan Baru</h3>
              <button 
                className="close-button"
                onClick={handleCloseSidebar}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="knowledge-form">
              <div className="form-group">
                <label htmlFor="type">Tipe Pengetahuan</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                >
                  <option value="">Pilih tipe pengetahuan...</option>
                  {knowledgeTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="term">Istilah / Kata Kunci</label>
                <input
                  type="text"
                  id="term"
                  name="term"
                  value={formData.term}
                  onChange={handleInputChange}
                  placeholder="Masukkan istilah atau kata kunci..."
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Deskripsi / Nilai</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Masukkan deskripsi atau penjelasan detail..."
                  required
                  className="form-control textarea"
                  rows="6"
                />
              </div>

              <button type="submit" className="submit-button">
                Submit
              </button>
            </form>
          </div>
        )}

        {/* Table Content */}
        <div className="table-container">
          <div className="table-wrapper">
            <table className="knowledge-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tipe Pengetahuan</th>
                  <th>Istilah / Kata Kunci / Pertanyaan</th>
                  <th>Deskripsi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <span className={`type-badge ${item.type.replace(/\s+/g, '-').toLowerCase()}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="term-cell">{item.term}</td>
                      <td className="description-cell">{item.description}</td>
                      <td>
                        <button className="action-button">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">
                      Tidak ada data yang ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeManagement;