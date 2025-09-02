import React, { useState, useEffect } from "react";
import { AiOutlineDatabase, AiOutlinePieChart, AiOutlineLogout, AiOutlineUser,
AiOutlineCheck, AiOutlineClose, AiOutlineEdit} from "react-icons/ai";
import { FaPlus } from "react-icons/fa";
import { TbSql } from "react-icons/tb";
import logo from "../assets/img/Logo TBI.png";
import config from "../config";
import axios from "axios";

const Header = ({
  currentCanvasIndex,
  setCurrentCanvasIndex,
  setCanvases,
  canvases,
  currentCanvasId,
  setCurrentCanvasId,
  totalCanvasCount,
  setTotalCanvasCount,
  userAccessLevel,
  onNavigate
  }) => {
  const [userName, setUserName] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [editingAccess, setEditingAccess] = useState(null);
  const [newAccessValue, setNewAccessValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const accessLevels = [
    { value: 'view', label: 'View', color: 'info' },
    { value: 'edit', label: 'Edit', color: 'warning' },
    { value: 'admin', label: 'Admin', color: 'success' },
    { value: 'none', label: 'Tidak Ada Akses', color: 'secondary' }
  ];

  useEffect(() => {
  // Cek apakah ada currentCanvasIndex yang disimpan di localStorage
  const savedIndex = localStorage.getItem("currentCanvasIndex");
  const savedCanvasId = localStorage.getItem("currentCanvasId");

  if (savedIndex !== null && typeof setCurrentCanvasIndex === 'function') {
    setCurrentCanvasIndex(parseInt(savedIndex));
  }

  if (savedCanvasId !== null && typeof setCurrentCanvasId === 'function') {
    setCurrentCanvasId(parseInt(savedCanvasId));
  }

  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    setUserName(userData.name);
  }

    // Fetch canvases from API
    axios
      .get(`${config.API_BASE_URL}/api/kelola-dashboard/project/1/canvases`)
      .then((response) => {
        if (response.data.success) {
          // Filter canvases where is_deleted is false
          const activeCanvases = response.data.canvases;
          setCanvases(activeCanvases);
          setTotalCanvasCount(activeCanvases.length); // Update the total canvases count

          // Log canvas index and id_canvas
          activeCanvases.forEach((canvas, index) => {
            console.log(`Canvas Index: ${index}, Canvas ID: ${canvas.id}`);
          });
        } else {
          console.error("Failed to fetch canvases:", response.data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching canvases:", error);
      });
  }, [setCanvases, setCurrentCanvasIndex, setCurrentCanvasId, setTotalCanvasCount]);

  const fetchUserEmails = async () => {
    setLoadingEmails(true);
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/otentikasi/get-user`);
      if (response.data.success) {
        setUsersList(response.data.data);
      } else {
        console.error("Failed to fetch user emails:", response.data.message);
        setUsersList([]);
      }
    } catch (error) {
      console.error("Error fetching user emails:", error);
      setUsersList([]);
    } finally {
      setLoadingEmails(false);
    }
  };
  
  // Function to handle user authorization dropdown toggle
  const handleUserAuthClick = () => {
    if (!showUserDropdown) {
      fetchUserEmails(); // Fetch emails when opening dropdown
    }
    setShowUserDropdown(!showUserDropdown);
  };
  
    // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#user-dropdown-container')) {
        setShowUserDropdown(false);
        setEditingAccess(null);
        setSearchQuery('');
        setNewAccessValue('');
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (editingAccess) {
          setEditingAccess(null);
          setNewAccessValue('');
        } else if (showUserDropdown) {
          setShowUserDropdown(false);
          setSearchQuery('');
        }
      }
    };

    if (showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showUserDropdown, editingAccess]);
  
  const handleUpdateAccess = async (userId, newAccess, createdBy) => {
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const createdBy = currentUser?.name || 'Unknown';
      const response = await axios.post(`${config.API_BASE_URL}/api/otentikasi/update-access`, {
        id_user: userId,
        id_project: 1, // Assuming project ID 1, adjust as needed
        access: newAccess,
        created_by: createdBy,
        modified_by: createdBy
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Update local state
        setUsersList(prevUsers => 
          prevUsers.map(user => 
            user.id_user === userId
              ? {
                  ...user,
                  projects_access: newAccess === 'none' 
                    ? user.projects_access.filter(acc => acc.id_project !== 1)
                    : user.projects_access.some(acc => acc.id_project === 1)
                      ? user.projects_access.map(acc => 
                          acc.id_project === 1 ? { ...acc, access: newAccess, modified_by: createdBy } : acc
                        )
                      : [...user.projects_access, { id_project: 1, access: newAccess, modified_by: createdBy  }]
                }
              : user
          )
        );
        
        setEditingAccess(null);
        console.log('Access updated successfully');
      } else {
        console.error('Failed to update access:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating access:', error);
    }
  };

  // Get user's current access level for project 1
  const getUserAccess = (user) => {
    const projectAccess = user.projects_access?.find(acc => acc.id_project === 1);
    return projectAccess ? projectAccess.access : 'none';
  };

  // Get access level info
  const getAccessInfo = (access) => {
    return accessLevels.find(level => level.value === access) || accessLevels[3];
  };

  // Filter users based on search query
  const filteredUsers = usersList.filter(user => 
    //user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      try {
        // Panggil API logout Laravel
        await axios.post(`${config.API_BASE_URL}/api/logout`);

        // Hapus semua data dari localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user');

        // Hapus header authorization
        delete axios.defaults.headers.common['Authorization'];

        // Reset state ke login
        if (typeof onLogout === 'function') {
          onLogout();
        }

        console.log('Logout berhasil');
        window.location.reload();
      } catch (error) {
        console.error('Error during logout:', error);

        // Tetap logout meski API gagal
        localStorage.removeItem('token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user');
        localStorage.removeItem('access');

        delete axios.defaults.headers.common['Authorization'];

        if (typeof onLogout === 'function') {
          onLogout();
        }

        window.location.reload()
      }
    }
  };

  const goToNextCanvas = () => {
  const newIndex = currentCanvasIndex + 1;
  if (newIndex < canvases.length && canvases[newIndex]?.id) {
    const newCanvasId = canvases[newIndex].id;
    setCurrentCanvasIndex(newIndex);
    setCurrentCanvasId(newCanvasId);
    localStorage.setItem("currentCanvasIndex", newIndex);
    localStorage.setItem("currentCanvasId", newCanvasId);
    console.log("Canvas Index: ", newIndex);
    console.log("Canvas ID: ", newCanvasId);
  } else {
    console.warn("Next canvas not ready or undefined:", canvases[newIndex]);
  }
};
const goToPreviousCanvas = () => {
  if (currentCanvasIndex > 0 && canvases.length > 0) {
    const newIndex = currentCanvasIndex - 1;
    const newCanvasId = canvases[newIndex].id;

    setCurrentCanvasIndex(newIndex);
    setCurrentCanvasId(newCanvasId);

    localStorage.setItem("currentCanvasIndex", newIndex);
    localStorage.setItem("currentCanvasId", newCanvasId);

    console.log("Canvas Index: ", newIndex);
    console.log("Canvas ID: ", newCanvasId);
  }
};

  return (
    <header className="header fixed-top d-flex align-items-center justify-content-between p-3 bg-white shadow">
      <div className="d-flex align-items-center">
        <div className="logo me-3">
          <img src={logo} alt="Logo" width={10} height={10} />
        </div>
        <div className="d-flex flex-column">
          <span className="fw-bold">Tools Dasbor Interaktif</span>
          <div className="d-flex justify-content-center align-items-center text-muted" style={{ cursor: 'pointer' }}>
            <span
              className="cursor-pointer"
              onClick={goToPreviousCanvas}
              style={{ padding: "0 10px", fontSize: "20px" }}
            >
              &#8592;
            </span>
            <span id="menu-canvas">
              Kanvas {currentCanvasIndex + 1} dari {totalCanvasCount}
            </span>
            <span
              className="cursor-pointer"
              onClick={goToNextCanvas}
              style={{ padding: "0 10px", fontSize: "20px" }}
            >
              &#8594;
            </span>
            <span className="mx-2">|</span>

            {userAccessLevel !== 'view' &&(
              <>
              <span id="menu-data" className="cursor-pointer d-flex align-items-center">
                <AiOutlineDatabase className="me-1" />
                Pilih Data
              </span>

              <span className="mx-2">|</span>

              <span id="menu-visualisasi" className="cursor-pointer d-flex align-items-center">
                <AiOutlinePieChart className="me-1" />
                Konfigurasi
              </span>

              <span className="mx-2">|</span>

              <span id="menu-query" className="cursor-pointer d-flex align-items-center">
                <TbSql className="me-1 mt-1" />
                Query
              </span>

              <span className="mx-2">|</span>

              <span 
                id="menu-nl2sql" 
                className="cursor-pointer d-flex align-items-center"
                onClick={() => onNavigate && onNavigate('nl2sql')}
                title="Natural Language to SQL"
              >
                <TbSql className="me-1 mt-1" />
                NL2SQL
              </span>

              <span className="mx-2">|</span>
              
              <span id="menu-tambah-datasource" className="cursor-pointer d-flex align-items-center">
                <FaPlus className="me-1" />
                Tambah Datasource
              </span>
              {userAccessLevel == 'admin' && (
                <>
                  <span className="mx-2">|</span>
                  <div id="user-dropdown-container" className="position-relative">
                    <span 
                      id="menu-user" 
                      className="cursor-pointer d-flex align-items-center" 
                      onClick={handleUserAuthClick}
                    >
                      <AiOutlineUser className="me-1" />
                      Otorisasi Pengguna
                    </span>
                    {showUserDropdown && (
                      <div className="position-absolute bg-white border rounded shadow-lg mt-2 py-2"
                        style={{ 
                          minWidth: '400px', 
                          maxHeight: '500px', 
                          overflowY: 'auto',
                          zIndex: 1000,
                          top: '100%',
                          left: '0'
                        }}
                      >
                        {/* Header */}
                        <div className="px-3 py-2 border-bottom">
                          <strong className="text-secondary">Manajemen Pengguna</strong>
                          <div className="mt-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Cari pengguna..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>

                        {loadingEmails ? (
                          <div className="px-3 py-4 text-center">
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            Memuat data pengguna...
                          </div>
                        ) : filteredUsers.length > 0 ? (
                          <div>
                            {filteredUsers.map((user) => {
                              const currentAccess = getUserAccess(user);
                              const accessInfo = getAccessInfo(currentAccess);
                              const isEditing = editingAccess === user.id_user;
                              
                              return (
                                <div 
                                  key={user.id_user} 
                                  className={`px-3 py-3 border-bottom ${isEditing ? 'bg-light' : ''}`}
                                  style={{ backgroundColor: isEditing ? '#f8f9fa' : 'transparent' }}
                                >
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center mb-1">
                                        <AiOutlineUser className="me-2 text-muted" />
                                        <div>
                                          <div className="text-muted small">{user.email}</div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="d-flex align-items-center">
                                      {isEditing ? (
                                        <div className="d-flex align-items-center">
                                          <select
                                            className="form-select form-select-sm me-2"
                                            value={newAccessValue}
                                            onChange={(e) => setNewAccessValue(e.target.value)}
                                            style={{ minWidth: '120px' }}
                                          >
                                            {accessLevels.map(level => (
                                              <option key={level.value} value={level.value}>
                                                {level.label}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            className="btn btn-success btn-sm me-1"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleUpdateAccess(user.id_user, newAccessValue);
                                            }}
                                          >
                                            <AiOutlineCheck />
                                          </button>
                                          <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingAccess(null);
                                              setNewAccessValue('');
                                            }}
                                          >
                                            <AiOutlineClose />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="d-flex align-items-center">
                                          <span className={`badge bg-${accessInfo.color} me-2`}>
                                            {accessInfo.label}
                                          </span>
                                          <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (editingAccess && editingAccess !== user.id_user) {
                                                setEditingAccess(null);
                                                setNewAccessValue('');
                                              }
                                              setEditingAccess(user.id_user);
                                              setNewAccessValue(currentAccess);
                                            }}
                                            title="Edit akses pengguna"
                                          >
                                            <AiOutlineEdit />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-3 py-4 text-muted text-center">
                            {searchQuery ? 
                              `Tidak ada pengguna yang ditemukan untuk "${searchQuery}"` : 
                              'Tidak ada pengguna terdaftar'
                            }
                          </div>
                        )}

                        {/* Footer with summary */}
                        {!loadingEmails && filteredUsers.length > 0 && (
                          <div className="px-3 py-2 border-top bg-light">
                            <div className="d-flex justify-content-between align-items-center text-muted small">
                              <span>
                                {searchQuery ? 
                                  `${filteredUsers.length} dari ${usersList.length} pengguna` :
                                  `Total: ${usersList.length} pengguna`
                                }
                              </span>
                              <div className="d-flex gap-2">
                                {accessLevels.slice(0, 3).map(level => {
                                  const count = filteredUsers.filter(user => 
                                    getUserAccess(user) === level.value
                                  ).length;
                                  return (
                                    <span key={level.value} className={`badge bg-${level.color}`}>
                                      {level.label}: {count}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              </>  
            )}
        </div>
        </div>
      </div>
      {/* Right Section - Welcome Message and Logout */}
      <div className="d-flex align-items-center">
        {userName && (
          <span className="me-3 text-muted">
            Selamat datang, <strong>{userName}</strong>
          </span>
        )}
        <button 
          className="btn btn-outline-danger btn-sm d-flex align-items-center"
          onClick={handleLogout}
          title="Logout"
        >
          <AiOutlineLogout className="me-1" />
          Keluar
        </button>
      </div>
    </header>
  );
};

export default Header;