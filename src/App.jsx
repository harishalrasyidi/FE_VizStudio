// App.jsx
import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import {AiOutlineLogout} from "react-icons/ai";
import "./assets/css/dashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";
import "font-awesome/css/font-awesome.min.css";
import Header from "./component/Header";
import Sidebar from "./component/Sidebar";
import Register from "./component/Register";
import Login from "./component/Login";
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import VisualisasiChart from "./component/Visualiaze";
import Canvas from "./component/Canvas";
import NL2SQLPage from "./component/NL2SQLPage";
import axios from "axios";

function App() {
  const [canvasData, setCanvasData] = useState([]);
  const [canvasQuery, setCanvasQuery] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' atau 'register'
  const [userAccessLevel, setUserAccessLevel] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' atau 'nl2sql'

  useEffect(() => {
    // Cek apakah ada token tersimpan di localStorage
    const token = localStorage.getItem('token');
    const tokenType = localStorage.getItem('token_type');
    if (token && tokenType) {
      // Set default header untuk axios
      axios.defaults.headers.common['Authorization'] = `${tokenType} ${token}`;
      setIsAuthenticated(true);
      const accessLevel = localStorage.getItem('access');
      setUserAccessLevel(accessLevel || 'none');
    }
  }, []);

  // Function untuk handle successful registration/login
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    const accessLevel = localStorage.getItem('access');
    setUserAccessLevel(accessLevel || 'none');
  };

  // Function untuk beralih antara login dan register
  const switchAuthView = (view) => {
    setAuthView(view);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthView('login');
  };

  // Jika belum authenticated, tampilkan halaman auth (login/register)
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <Register 
          onAuthSuccess={handleAuthSuccess}
          onSwitchLogin={() => switchAuthView('login')}
        />
      );
    } else {
      return (
        <Login 
          onAuthSuccess={handleAuthSuccess}
          onSwitchRegister={() => switchAuthView('register')}
        />
      );
    }
  }

  if (userAccessLevel === 'none') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <button 
            className="btn btn-outline-danger btn-sm d-flex align-items-center"
            onClick={() => {
                localStorage.clear();
                delete axios.defaults.headers.common['Authorization'];
                window.location.reload();
            }}
            title="Logout"
          >
            <AiOutlineLogout className="me-1" />
            Keluar
          </button>
        </div>
        <h1>Akses Ditolak</h1>
        <p>Anda belum memiliki akses untuk melihat dasbor ini.</p>
      </div>
    );
  }

  return (
    <>
      {currentPage === 'nl2sql' ? (
        <NL2SQLPage onNavigate={setCurrentPage} />
      ) : (
        <>
          {/* <Header
            currentCanvasIndex={currentCanvasIndex}
            setCurrentCanvasIndex={setCurrentCanvasIndex} // Pass setter to Header
          /> */}
          <div className="main-container">
            <Sidebar 
              setCanvasData={setCanvasData} 
              setCanvasQuery={setCanvasQuery}
              onNavigate={setCurrentPage}
            />
            {/* <Canvas currentCanvasIndex={currentCanvasIndex}/> */}
            {/* <Canvas 
              data={canvasData} 
              query={canvasQuery} 
            /> */}
          </div>
          {/* <VisualisasiChart requestPayload={requestPayload} /> */}
        </>
      )}
    </>
  );
}

export default App;
