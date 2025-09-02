import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaPlus, FaSearch, FaSync, FaTrash, FaCogs } from "react-icons/fa";
import { InputText } from "primereact/inputtext";
import SidebarDiagram from "./SidebarDiagram/SidebarDiagram";
import SidebarData from "./SidebarData";
import config from "../config";
import SidebarDatasource from "./SidebarDatasource";
import AddDatasource from "./AddDataSource";
import Canvas from "./Canvas";
import SidebarQuery from "./SidebarQuery";
import { GrDatabase } from "react-icons/gr";
import { DEFAULT_CONFIG } from "./SidebarDiagram/ConfigConstants";
import Header from "./Header";
import SidebarCanvas from "./SidebarCanvas";

const Sidebar = ({ onNavigate }) => {
  const [tables, setTables] = useState([]);
  const [groupedTables, setGroupedTables] = useState({});
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showAddDatasource, setShowAddDatasource] = useState(false);
  const [canvasData, setCanvasData] = useState([]);
  const [canvasQuery, setCanvasQuery] = useState("");
  const [visualizationType, setVisualizationType] = useState("");
  const visualizationTypeRef = useRef(visualizationType);
  const [currentCanvasIndex, setCurrentCanvasIndex] = useState(0);
  const [canvases, setCanvases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingConnections, setProcessingConnections] = useState({});
  const [currentCanvasId, setCurrentCanvasId] = useState(null);
  const [totalCanvasCount, setTotalCanvasCount] = useState(0);
  const [visualizationConfig, setVisualizationConfig] = useState({ ...DEFAULT_CONFIG });
  const [selectedVisualization, setSelectedVisualization] = useState(null);
  const [addNewVisualization, setAddNewVisualization] = useState(false);
  const [newVisualizationPayload, setNewVisualizationPayload] = useState(null);
  const [userAccessLevel, setUserAccessLevel] = useState('view');

  useEffect(() => {
    const access = localStorage.getItem('access') || 'view';
    setUserAccessLevel(access);
  }, []);

  const fetchAllTables = () => {
    setLoading(true);
    axios
      .get(`${config.API_BASE_URL}/api/kelola-dashboard/fetch-tables`)
      .then((response) => {
        if (response.data.success && response.data.data) {
          setTables(response.data.data.tables || []);
          setGroupedTables(response.data.data.grouped_tables || {});
        } else {
          setTables([]);
          setGroupedTables({});
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal mengambil data tabel:", error);
        setLoading(false);
        setTables([]);
        setGroupedTables({});
      });
  };

  useEffect(() => {
    if (userAccessLevel === 'view') {
      const sidebarIds = ["sidebar-data", "sidebar-diagram", "sidebar-query", "sidebar-canvas"];
      sidebarIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      return;
    }
    const sidebarData = document.getElementById("sidebar-data");
    const sidebarDiagram = document.getElementById("sidebar-diagram");
    const sidebarQuery = document.getElementById("sidebar-query");
    const sidebarCanvas = document.getElementById("sidebar-canvas");

    const menuData = document.getElementById("menu-data");
    const menuVisualisasi = document.getElementById("menu-visualisasi");

    if (sidebarData && sidebarDiagram && sidebarQuery && sidebarCanvas && menuData && menuVisualisasi) {
      if (selectedVisualization) {
        sidebarData.style.display = "none";
        sidebarDiagram.style.display = "block";
        menuData.classList.remove('active');
        menuVisualisasi.classList.add('active');
      } else {
        sidebarData.style.display = "block";
        sidebarDiagram.style.display = "none";
        menuData.classList.add('active');
        menuVisualisasi.classList.remove('active');
      }
      sidebarQuery.style.display = "none";
      sidebarCanvas.style.display = "none";
    }

    const menuClickHandler = (showSidebar) => {
      sidebarData.style.display = showSidebar === "data" ? "block" : "none";
      sidebarDiagram.style.display = showSidebar === "diagram" ? "block" : "none";
      sidebarQuery.style.display = showSidebar === "query" ? "block" : "none";
      sidebarCanvas.style.display = showSidebar === "canvas" ? "block" : "none";
    };

    const pilihDataBtn = document.getElementById("menu-data");
    const pilihVisualisasiBtn = document.getElementById("menu-visualisasi");
    const pilihQueryBtn = document.getElementById("menu-query");
    const pilihCanvasBtn = document.getElementById("menu-canvas");
    const tambahDatasourceBtn = document.getElementById("menu-tambah-datasource");

    if (pilihDataBtn) pilihDataBtn.addEventListener("click", () => menuClickHandler("data"));
    if (pilihVisualisasiBtn) pilihVisualisasiBtn.addEventListener("click", () => menuClickHandler("diagram"));
    if (pilihQueryBtn) pilihQueryBtn.addEventListener("click", () => menuClickHandler("query"));
    if (pilihCanvasBtn) pilihCanvasBtn.addEventListener("click", () => menuClickHandler("canvas"));
    if (tambahDatasourceBtn) tambahDatasourceBtn.addEventListener("click", () => setShowAddDatasource(true));

    return () => {
      if (pilihDataBtn) pilihDataBtn.removeEventListener("click", () => menuClickHandler("data"));
      if (pilihVisualisasiBtn) pilihVisualisasiBtn.removeEventListener("click", () => menuClickHandler("diagram"));
      if (pilihQueryBtn) pilihQueryBtn.removeEventListener("click", () => menuClickHandler("query"));
      if (pilihCanvasBtn) pilihCanvasBtn.removeEventListener("click", () => menuClickHandler("canvas"));
      if (tambahDatasourceBtn) tambahDatasourceBtn.removeEventListener("click", () => setShowAddDatasource(true));
    };
  }, [selectedVisualization, userAccessLevel]);

  useEffect(() => {
    if (userAccessLevel !== 'view') {
      fetchAllTables();
    } else {
      setLoading(false);
    }
  }, [userAccessLevel]);

  const handleBuildVisualization = (payload, query, data) => {
    setNewVisualizationPayload(payload);
    setCanvasData(data);
    setCanvasQuery(query);
    setVisualizationConfig({ ...DEFAULT_CONFIG });
    setAddNewVisualization(true);
    setSelectedVisualization(null);
  };

  useEffect(() => {
    if (canvases.length > 0) {
      const savedIndex = parseInt(localStorage.getItem("currentCanvasIndex"));
      const savedId = parseInt(localStorage.getItem("currentCanvasId"));

      const indexMatch = canvases.findIndex(c => c.id === savedId);
      if (!isNaN(savedIndex) && !isNaN(savedId) && indexMatch !== -1) {
        setCurrentCanvasIndex(indexMatch);
        setCurrentCanvasId(savedId);
      } else {
        setCurrentCanvasIndex(0);
        setCurrentCanvasId(canvases[0].id);
      }
    }
  }, [canvases]);

  const handleSaveSuccess = () => {
    setShowAddDatasource(false);
    fetchAllTables();
  };

  const fetchColumns = (table) => {
    if (columns[table]) return;

    axios
      .get(`${config.API_BASE_URL}/api/kelola-dashboard/fetch-column/${table}`)
      .then((response) => {
        const numericTypes = ['int', 'integer', 'smallint', 'bigint', 'decimal', 'numeric', 'real', 'double', 'float', 'money'];
        const dateTypes = ['date', 'time', 'timestamp'];
        const textTypes = ['char', 'varchar', 'text', 'string'];

        const processedColumns = response.data.data.map(col => {
          const typeName = col.type.toLowerCase();
          return {
            ...col,
            is_numeric_type: numericTypes.some(t => typeName.includes(t)),
            is_date_type: dateTypes.some(t => typeName.includes(t)),
            is_text_type: textTypes.some(t => typeName.includes(t)),
          };
        });
        setColumns((prev) => ({ ...prev, [table]: processedColumns }));
      })
      .catch((error) => {
        console.error(`Gagal mengambil kolom untuk tabel ${table}:`, error);
      });
  };

  const handleQuerySubmit = (query) => {
    const payload = {
      id_datasource: 1,
      type: 'sql',
    };

    setNewVisualizationPayload(payload);
    setCanvasQuery(query);
    setCanvasData({});
    setVisualizationConfig({ ...DEFAULT_CONFIG });
    setAddNewVisualization(true);
    setSelectedVisualization(null);
  };

  useEffect(() => {
    if (addNewVisualization && canvasQuery && visualizationType) {
      setTimeout(() => {
        setAddNewVisualization(false);
        setCanvasQuery("");
        setVisualizationType("");
        setNewVisualizationPayload(null);
      }, 500);
    }
  }, [addNewVisualization, canvasQuery, visualizationType]);

  const handleVisualizationTypeChange = (type) => {
    visualizationTypeRef.current = type;
    setVisualizationType(type);

    if (selectedVisualization && canvasQuery) {
      updateSelectedVisualizationType(type);
    } else if (canvasQuery && !selectedVisualization) {
      setAddNewVisualization(true);
    }
  };

  const updateSelectedVisualizationType = (newType) => {
    if (!selectedVisualization) return;

    setCanvases((prevCanvases) =>
      prevCanvases.map((canvas) =>
        canvas.id === currentCanvasId
          ? {
            ...canvas,
            visualizations: canvas.visualizations.map((viz) =>
              viz.id === selectedVisualization.id ? { ...viz, type: newType } : viz
            ),
          }
          : canvas
      )
    );
    setSelectedVisualization((prev) => ({ ...prev, type: newType }));
  };

  useEffect(() => {
    visualizationTypeRef.current = visualizationType;
  }, [visualizationType]);

  const handleVisualizationSelect = (visualization) => {
    setSelectedVisualization(visualization);
    if (visualization) {
      setVisualizationConfig(visualization.config || { ...DEFAULT_CONFIG });
      setVisualizationType(visualization.type || "");
    } else {
      setVisualizationConfig({ ...DEFAULT_CONFIG });
      setVisualizationType("");
    }
  };

  const handleConfigUpdate = (config) => {
    setVisualizationConfig(config);
    if (selectedVisualization) {
      setSelectedVisualization((prev) => ({ ...prev, config: { ...config } }));
    }
  };

  useEffect(() => {
    axios
      .get(`${config.API_BASE_URL}/api/kelola-dashboard/project/1/canvases`)
      .then((response) => {
        if (response.data.success) {
          const activeCanvases = response.data.canvases;
          setCanvases(activeCanvases);
          setTotalCanvasCount(activeCanvases.length);
        } else {
          console.error("Failed to fetch canvases:", response.data.message);
        }
      })
      .catch((error) => console.error("Error fetching canvases:", error));
  }, []);

  const handleEtlAction = async (action, connectionName) => {
    let confirmMessage = `Are you sure you want to ${action.replace('-', ' ')} the datasource '${connectionName}'?`;
    if (action === 'delete') {
      confirmMessage += " This action cannot be undone.";
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setProcessingConnections(prev => ({ ...prev, [connectionName]: action }));
    try {
      await axios.post(`${config.API_BASE_URL}/api/kelola-dashboard/etl/${action}`, { connection_name: connectionName });
      alert(`Datasource '${connectionName}' action '${action}' was successful!`);
      fetchAllTables();
    } catch (error) {
      console.error(`Error during ${action} for ${connectionName}:`, error);
      const errorMessage = error.response?.data?.message || `Failed to ${action} datasource '${connectionName}'.`;
      alert(errorMessage);
    } finally {
      setProcessingConnections(prev => {
        const newState = { ...prev };
        delete newState[connectionName];
        return newState;
      });
    }
  };

  const handleGlobalEtlAction = async (action) => {
    const actionText = action.replace('-', ' ');
    if (!window.confirm(`Are you sure you want to ${actionText} ALL datasources? This may take a long time.`)) {
        return;
    }

    const allDatasources = Object.keys(groupedTables);
    if (allDatasources.length === 0) {
        alert("No datasources to process.");
        return;
    }
    
    setProcessingConnections(prev => {
        const newProcessing = { ...prev };
        allDatasources.forEach(name => {
            newProcessing[name] = action;
        });
        return newProcessing;
    });

    try {
      const promises = allDatasources.map(connectionName =>
        axios.post(`${config.API_BASE_URL}/api/kelola-dashboard/etl/${action}`, { connection_name: connectionName })
      );

      const results = await Promise.allSettled(promises);
      
      let successCount = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
          console.log(`Action '${action}' for ${allDatasources[index]} was successful.`);
        } else {
          console.error(`Action '${action}' for ${allDatasources[index]} failed:`, result.reason.response?.data?.message || result.reason.message);
        }
      });
      
      alert(`Global action '${actionText}' finished. Successful: ${successCount}/${allDatasources.length}.`);
      fetchAllTables();

    } catch (error) {
       console.error(`A critical error occurred during global action ${action}:`, error);
       alert(`A critical error occurred during global action. See console for details.`);
    } finally {
       setProcessingConnections({});
    }
  };


  const renderSidebarContent = () => {
    if (loading) {
      return <div className="alert alert-info">Loading...</div>;
    }
    if (showAddDatasource) {
      return (
        <AddDatasource
          onCancel={() => setShowAddDatasource(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      );
    }
    if (Object.keys(groupedTables).length === 0) {
      return <SidebarDatasource onTambahDatasource={() => setShowAddDatasource(true)} />;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const filteredGroupedEntries = Object.entries(groupedTables)
      .map(([prefix, groupData]) => {
        const matchingTables = groupData.tables.filter(table =>
          table.table_name.toLowerCase().includes(lowerCaseQuery)
        );

        if (matchingTables.length > 0) {
          return [prefix, {
            ...groupData,
            tables: matchingTables
          }];
        }
        return null;
      })
      .filter(Boolean);

    return (
      <div id="sidebar" className="sidebar">
        <div className="sub-title d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <GrDatabase size={48} className="text-muted" />
            <span className="sub-text">Datasources</span>
          </div>
          <button
            className="btn btn-sm btn-outline-dark"
            onClick={() => setShowAddDatasource(true)}
            title="Tambah Datasource Baru"
          >
            <FaPlus />
          </button>
        </div>
        <hr className="full-line" />
        <div className="px-2 my-2 d-flex w-100 gap-2">
          <button className="btn btn-sm btn-outline-secondary w-50 h-100 d-flex align-items-center justify-content-center gap-1" onClick={() => handleGlobalEtlAction('refresh')}>
            <FaSync /> Refresh Data
          </button>
          <button className="btn btn-sm btn-outline-secondary w-50 h-100 d-flex align-items-center justify-content-center gap-1" onClick={() => handleGlobalEtlAction('full-refresh')}>
            <FaSync /> Full Refresh
          </button>
        </div>
        <div className="px-2 my-2 d-flex flex-column gap-2">
          <span className="p-input-icon-left w-100 pl-2">
            <InputText
              className="w-100"
              placeholder="Search datasource/table/column..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </span>
        </div>
        <hr className="full-line" />
        <div className="accordion" id="groupAccordion">
          {filteredGroupedEntries.map(([prefix, groupData], groupIndex) => (
            <div className="accordion-item" key={prefix}>
              <h2 className="accordion-header d-flex align-items-center" id={`group-heading-${groupIndex}`}>
                <button
                  className="accordion-button collapsed flex-grow-1"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#group-collapse-${groupIndex}`}
                  aria-expanded="false"
                  aria-controls={`group-collapse-${groupIndex}`}
                >
                  {prefix} ({groupData.table_count})
                  {processingConnections[prefix] && <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>}
                </button>
                <div className="dropdown">
                  <button className="btn btn-sm btn-light me-2" type="button" data-bs-toggle="dropdown" aria-expanded="false" disabled={!!processingConnections[prefix]}>
                    <FaCogs />
                  </button>
                  <ul className="dropdown-menu">
                    <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleEtlAction('refresh', prefix); }}>Refresh</a></li>
                    <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleEtlAction('full-refresh', prefix); }}>Full Refresh</a></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><a className="dropdown-item text-danger" href="#" onClick={(e) => { e.preventDefault(); handleEtlAction('delete', prefix); }}>Delete</a></li>
                  </ul>
                </div>
              </h2>
              <div
                id={`group-collapse-${groupIndex}`}
                className="accordion-collapse collapse"
                aria-labelledby={`group-heading-${groupIndex}`}
                data-bs-parent="#groupAccordion"
              >
                <div className="accordion-body p-2">
                  <div className="accordion" id={`table-accordion-${groupIndex}`}>
                    {groupData.tables.map((table, tableIndex) => (
                      <div className="accordion-item" key={table.full_name}>
                        <h2 className="accordion-header" id={`table-heading-${groupIndex}-${tableIndex}`}>
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#table-collapse-${groupIndex}-${tableIndex}`}
                            aria-expanded="false"
                            aria-controls={`table-collapse-${groupIndex}-${tableIndex}`}
                            onClick={() => {
                              setSelectedTable(table.full_name);
                              fetchColumns(table.full_name);
                            }}
                          >
                            {table.table_name}
                          </button>
                        </h2>
                        <div
                          id={`table-collapse-${groupIndex}-${tableIndex}`}
                          className="accordion-collapse collapse"
                          aria-labelledby={`table-heading-${groupIndex}-${tableIndex}`}
                          data-bs-parent={`#table-accordion-${groupIndex}`}
                        >
                          <div className="column-container">
                            {columns[table.full_name] ? (
                              columns[table.full_name]
                                .map((col, colIndex) => (
                                  <div
                                    key={colIndex}
                                    className="column-card"
                                    draggable={true}
                                    onDragStart={(event) => {
                                      const columnData = {
                                        columnName: col.name,
                                        tableName: table.full_name,
                                      };
                                      event.dataTransfer.setData("text/plain", JSON.stringify(columnData));
                                    }}
                                  >
                                    <span className="column-icons">
                                      {col.is_numeric_type ? "123" : col.is_text_type ? "ABC" : col.is_date_type ? "DATE" : "🔗"}
                                    </span>
                                    {col.name}
                                  </div>
                                ))
                            ) : (
                              <p className="text-muted p-2">Loading...</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {userAccessLevel !== 'view' && renderSidebarContent()}
      <Header
        currentCanvasIndex={currentCanvasIndex}
        setCurrentCanvasIndex={setCurrentCanvasIndex}
        canvases={canvases}
        setCanvases={setCanvases}
        setCurrentCanvasId={setCurrentCanvasId}
        totalCanvasCount={totalCanvasCount}
        userAccessLevel={userAccessLevel}
        onNavigate={onNavigate}
      />
      {userAccessLevel !== 'view' && (
        <>
          <SidebarCanvas
            currentCanvasIndex={currentCanvasIndex}
            setCurrentCanvasIndex={setCurrentCanvasIndex}
            currentCanvasId={currentCanvasId}
            setCurrentCanvasId={setCurrentCanvasId}
            totalCanvasCount={totalCanvasCount}
            setTotalCanvasCount={setTotalCanvasCount}
            canvases={canvases}
            setCanvases={setCanvases}
          />
          <SidebarData
            setCanvasData={setCanvasData}
            selectedTable={selectedTable}
            onBuildVisualization={handleBuildVisualization}
            onVisualizationTypeChange={handleVisualizationTypeChange}
            editingPayload={selectedVisualization ? selectedVisualization.builderPayload : null}
          />
          <SidebarDiagram
            onVisualizationTypeChange={handleVisualizationTypeChange}
            onVisualizationConfigChange={handleConfigUpdate}
            selectedVisualization={selectedVisualization}
            visualizationConfig={visualizationConfig}
          />
          <SidebarQuery
            onQuerySubmit={handleQuerySubmit}
            onVisualizationTypeChange={handleVisualizationTypeChange}
          />
        </>
      )}
      <Canvas
        data={canvasData}
        query={addNewVisualization ? canvasQuery : ""}
        visualizationType={addNewVisualization ? visualizationType : ""}
        visualizationConfig={visualizationConfig}
        onVisualizationSelect={handleVisualizationSelect}
        selectedVisualization={selectedVisualization}
        currentCanvasIndex={currentCanvasIndex}
        setCurrentCanvasIndex={setCurrentCanvasIndex}
        canvases={canvases}
        setCanvases={setCanvases}
        currentCanvasId={currentCanvasId}
        setCurrentCanvasId={setCurrentCanvasId}
        onUpdateVisualizationType={updateSelectedVisualizationType}
        newVisualizationPayload={newVisualizationPayload}
        userAccessLevel={userAccessLevel}
      />
    </>
  );
};

export default Sidebar;