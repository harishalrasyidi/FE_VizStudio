import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, X, ArrowLeft, Database, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import config from '../config';
import './KnowledgeManagement.css';

const KnowledgeManagement = ({ onNavigate }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    id_datasource: 12,
    entry_type: '',
    term: '',
    content: '',
  });
  const [knowledgeData, setKnowledgeData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const knowledgeTypes = [
    'Terminologi Bisnis',
    'Kata Kunci SQL',
    'Metrik Bisnis',
    'Konsep Analitik',
    'Definisi Data',
  ];

  const fetchKnowledgeData = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/api/kelola-dashboard/knowledge-base`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: {
            id_datasource: 12,
            page,
            per_page: perPage,
          },
        }
      );
      setKnowledgeData(response.data.data);
      setCurrentPage(response.data.current_page);
      setTotalPages(response.data.last_page);
      setTotalItems(response.data.total);
    } catch (err) {
      console.error('Error fetching knowledge data:', err);
      setError(err.response?.data?.error || 'Gagal mengambil data pengetahuan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeData(currentPage);
  }, [currentPage]);

  const filteredData = knowledgeData.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entry_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.entry_type || !formData.term || !formData.content) {
      setError('Semua kolom wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editId) {
        await axios.put(
          `${config.API_BASE_URL}/api/kelola-dashboard/knowledge-base/${editId}`,
          {
            entry_type: formData.entry_type,
            term: formData.term,
            content: formData.content,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
      } else {
        await axios.post(
          `${config.API_BASE_URL}/api/kelola-dashboard/knowledge-base`,
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
      }
      await fetchKnowledgeData(currentPage);
      setFormData({
        id_datasource: 12,
        entry_type: '',
        term: '',
        content: '',
      });
      setEditId(null);
      setShowSidebar(false);
    } catch (err) {
      console.error('Error submitting knowledge:', err);
      setError(err.response?.data?.error || 'Gagal menyimpan data pengetahuan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id_datasource: item.id_datasource,
      entry_type: item.entry_type,
      term: item.term,
      content: item.content,
    });
    setEditId(item.id);
    setShowSidebar(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${config.API_BASE_URL}/api/kelola-dashboard/knowledge-base/${deleteId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      await fetchKnowledgeData(currentPage);
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting knowledge:', err);
      setError(err.response?.data?.error || 'Gagal menghapus data pengetahuan');
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const handleOpenDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleAddNew = () => {
    setEditId(null);
    setFormData({
      id_datasource: 12,
      entry_type: '',
      term: '',
      content: '',
    });
    setShowSidebar(true);
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
    setFormData({
      id_datasource: 12,
      entry_type: '',
      term: '',
      content: '',
    });
    setEditId(null);
    setError(null);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-button ${i === currentPage ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination-container">
        <button
          className="pagination-button pagination-nav"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Halaman Sebelumnya"
        >
          <ChevronLeft size={16} />
          <span className="pagination-text">Previous</span>
        </button>
        {pages}
        <button
          className="pagination-button pagination-nav"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Halaman Berikutnya"
        >
          <span className="pagination-text">Next</span>
          <ChevronRight size={16} />
        </button>
        <div className="pagination-info">
          Halaman {currentPage} dari {totalPages} (Total: {totalItems} data)
        </div>
      </div>
    );
  };

  return (
    <div className="knowledge-management">
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

        <div className="info-box">
          <div className="info-content">
            <strong>Tentang Basis Pengetahuan:</strong>
            <p>
              Kelola kamus bisnis dan terminologi yang digunakan dalam sistem. Basis
              pengetahuan ini membantu AI memahami konteks bisnis dan menghasilkan
              query yang lebih akurat dari bahasa natural.
            </p>
          </div>
        </div>

        <div className="controls-section">
          <button className="add-button" onClick={handleAddNew}>
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

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
        {showSidebar && (
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>{editId ? 'Edit Pengetahuan' : 'Tambah Pengetahuan Baru'}</h3>
              <button className="close-button" onClick={handleCloseSidebar}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="knowledge-form">
              <div className="form-group">
                <label htmlFor="entry_type">Tipe Pengetahuan</label>
                <select
                  id="entry_type"
                  name="entry_type"
                  value={formData.entry_type}
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
                <label htmlFor="content">Deskripsi / Nilai</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Masukkan deskripsi atau penjelasan detail..."
                  required
                  className="form-control textarea"
                  rows="6"
                />
              </div>

              <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Memproses...
                  </span>
                ) : editId ? (
                  'Update'
                ) : (
                  'Submit'
                )}
              </button>
            </form>
          </div>
        )}

        <div className="table-container">
          <div className="table-wrapper">
            {isLoading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Memuat...</span>
                </div>
              </div>
            ) : (
              <>
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
                          <td>{(currentPage - 1) * perPage + index + 1}</td>
                          <td>
                            <span
                              className={`type-badge ${item.entry_type
                                .replace(/\s+/g, '-')
                                .toLowerCase()}`}
                            >
                              {item.entry_type}
                            </span>
                          </td>
                          <td className="term-cell">{item.term}</td>
                          <td className="description-cell">{item.content}</td>
                          <td>
                            <button
                              className="action-button me-2"
                              onClick={() => handleEdit(item)}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="action-button text-danger"
                              onClick={() => handleOpenDeleteModal(item.id)}
                              title="Hapus"
                            >
                              <Trash2 size={16} />
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
                {totalPages > 1 && renderPagination()}
              </>
            )}
          </div>
        </div>

        {/* Modal Konfirmasi Hapus */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Konfirmasi Hapus</h3>
                <button className="modal-close-button" onClick={handleCloseDeleteModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p>Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.</p>
              </div>
              <div className="modal-footer">
                <button
                  className="modal-button cancel"
                  onClick={handleCloseDeleteModal}
                >
                  Batal
                </button>
                <button
                  className="modal-button delete"
                  onClick={handleDelete}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeManagement;