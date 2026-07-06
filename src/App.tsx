import { useState, useEffect } from "react";
import { onAuthStateChanged, User, signInAnonymously } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, updateDoc, writeBatch, query, getDocs } from "firebase/firestore";
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from "./firebase";
import { Instalacion, Cuadrilla, Tecnologia, EstadoOT } from "./types";
import { MOCK_CUADRILLAS, generateMockInstalaciones } from "./seedData";

// Components
import { DashboardKPIs } from "./components/DashboardKPIs";
import { OTTableList } from "./components/OTTableList";
import { GanttKanbanView } from "./components/GanttKanbanView";
import { CreateOTModal } from "./components/CreateOTModal";
import { BulkImport } from "./components/BulkImport";
import { WebhookInfo } from "./components/WebhookInfo";
import { OTDetailInspector } from "./components/OTDetailInspector";
import { ExecutedReport } from "./components/ExecutedReport";
import { ExpensesTracker } from "./components/ExpensesTracker";
import { EscalationsOdc } from "./components/EscalationsOdc";
import { BrigadesManager } from "./components/BrigadesManager";

// Icons
import { 
  Activity, 
  Layers, 
  Users, 
  Terminal, 
  Plus, 
  LogOut, 
  RotateCcw, 
  CheckCircle, 
  MapPin, 
  Wifi, 
  ShieldAlert,
  Loader2,
  FileSpreadsheet
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);
  const [guestEmail, setGuestEmail] = useState("coordinador.demo@telecom-sync.com");

  // Core Data State
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([]);
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "kanban" | "ejecutadas" | "gastos" | "escalamientos" | "brigadas" | "bulk" | "webhook" >("dashboard");

  // Filter States
  const [selectedTech, setSelectedTech] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCuadrilla, setSelectedCuadrilla] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals & Inspectors
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOT, setSelectedOT] = useState<Instalacion | null>(null);

  // Auth changed observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setGuestMode(false);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch Cuadrillas and Instalaciones in real-time once user is logged in or guest mode is active
  useEffect(() => {
    if (!user && !guestMode) return;

    setDbLoading(true);

    // Snapshot for Cuadrillas
    const pathCuadrillas = "cuadrillas";
    const unsubscribeCuadrillas = onSnapshot(
      collection(db, pathCuadrillas),
      (snapshot) => {
        const list: Cuadrilla[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Cuadrilla);
        });
        setCuadrillas(list);
        
        // Auto-seed cuadrillas if empty
        if (list.length === 0) {
          seedDefaultCuadrillas();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathCuadrillas);
      }
    );

    // Snapshot for Instalaciones
    const pathInstalaciones = "instalaciones";
    const unsubscribeInstalaciones = onSnapshot(
      collection(db, pathInstalaciones),
      (snapshot) => {
        const list: Instalacion[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Instalacion);
        });
        setInstalaciones(list);
        setDbLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathInstalaciones);
        setDbLoading(false);
      }
    );

    return () => {
      unsubscribeCuadrillas();
      unsubscribeInstalaciones();
    };
  }, [user, guestMode]);

  // Seed default Cuadrillas helper
  const seedDefaultCuadrillas = async () => {
    try {
      const batch = writeBatch(db);
      MOCK_CUADRILLAS.forEach((crew) => {
        const docRef = doc(db, "cuadrillas", crew.id);
        batch.set(docRef, crew);
      });
      await batch.commit();
      console.log("Mock Cuadrillas seeded successfully.");
    } catch (err) {
      console.error("Failed to seed mock cuadrillas", err);
    }
  };

  // Seed database with mock installations
  const handleSeedMockData = async () => {
    setDbLoading(true);
    try {
      const batch = writeBatch(db);
      const mocks = generateMockInstalaciones();
      mocks.forEach((ot) => {
        const docRef = doc(db, "instalaciones", ot.id);
        batch.set(docRef, ot);
      });
      await batch.commit();
      alert("¡Éxito! Datos demo cargados en la base de datos.");
    } catch (err) {
      alert("Fallo al cargar datos demo: " + err);
    } finally {
      setDbLoading(false);
    }
  };

  // Clear all installations helper
  const handleClearDatabase = async () => {
    if (!window.confirm("¿Está seguro de limpiar TODA la base de datos de instalaciones?")) return;
    setDbLoading(true);
    try {
      const q = query(collection(db, "instalaciones"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      alert("Base de datos de instalaciones limpia.");
    } catch (err) {
      alert("Error limpiando base de datos: " + err);
    } finally {
      setDbLoading(false);
    }
  };

  // Add Single OT
  const handleCreateOT = async (otData: Partial<Instalacion>) => {
    if (!otData.ot) return;
    const pathName = "instalaciones";
    try {
      const finalDoc = {
        ...otData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid || "GUEST_COORDINATOR"
      };
      await setDoc(doc(db, pathName, otData.ot), finalDoc);
      alert(`OT ${otData.ot} ingresada exitosamente.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${pathName}/${otData.ot}`);
    }
  };

  // Update OT Fields (including comments/phases)
  const handleUpdateOT = async (otId: string, updatedFields: Partial<Instalacion>) => {
    const pathName = "instalaciones";
    try {
      const docRef = doc(db, pathName, otId);
      const finalUpdates = {
        ...updatedFields,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, finalUpdates);
      
      // Update locally selected OT inspector if active
      if (selectedOT && selectedOT.id === otId) {
        setSelectedOT((prev) => prev ? { ...prev, ...finalUpdates } as Instalacion : null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${pathName}/${otId}`);
    }
  };

  // Bulk Import handler
  const handleBulkImport = async (newOTs: Partial<Instalacion>[]): Promise<number> => {
    const pathName = "instalaciones";
    try {
      const batch = writeBatch(db);
      newOTs.forEach((ot) => {
        if (ot.ot) {
          const docRef = doc(db, pathName, ot.ot);
          batch.set(docRef, {
            ...ot,
            createdBy: user?.uid || "BULK_LOAD"
          });
        }
      });
      await batch.commit();
      return newOTs.length;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, pathName);
      throw err;
    }
  };

  // Login wrappers
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      alert("Error de autenticación con Google: " + err);
    }
  };

  const handleGuestAccess = async () => {
    setGuestMode(true);
  };

  const handleLogout = async () => {
    if (guestMode) {
      setGuestMode(false);
    } else {
      await logoutUser();
    }
    setInstalaciones([]);
    setCuadrillas([]);
    setSelectedOT(null);
  };

  // Filter Logic
  const filteredInstalaciones = instalaciones.filter((ot) => {
    // Search query match (OT, Client, Subclient, Order CS)
    const matchesSearch = !searchQuery || 
      ot.ot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ot.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ot.subcliente && ot.subcliente.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ot.ordenCs.toLowerCase().includes(searchQuery.toLowerCase());

    // Technology match
    const matchesTech = !selectedTech || ot.productoTecnologia === selectedTech;

    // City match
    const matchesCity = !selectedCity || ot.ciudad === selectedCity;

    // Cuadrilla match
    const matchesCuadrilla = !selectedCuadrilla || ot.cuadrilla === selectedCuadrilla;

    // Status match
    const matchesStatus = !selectedStatus || ot.estado === selectedStatus;

    // Date range match
    let matchesDateRange = true;
    if (startDate) {
      matchesDateRange = matchesDateRange && new Date(ot.fechaOt) >= new Date(startDate);
    }
    if (endDate) {
      // Add end of day constraint
      const resolvedEndDate = new Date(endDate);
      resolvedEndDate.setHours(23, 59, 59, 999);
      matchesDateRange = matchesDateRange && new Date(ot.fechaOt) <= resolvedEndDate;
    }

    return matchesSearch && matchesTech && matchesCity && matchesCuadrilla && matchesStatus && matchesDateRange;
  });

  const handleResetFilters = () => {
    setSelectedTech("");
    setSelectedCity("");
    setSelectedCuadrilla("");
    setSelectedStatus("");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  };

  const effectiveEmail = user?.email || guestEmail;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 font-sans">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-3" />
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Iniciando Telecom Sync...</p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user && !guestMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden font-sans text-slate-700">
        
        {/* Background futuristic accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]" />

        <div className="w-full max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-lg space-y-6 relative z-10 text-center" id="login-card">
          
          {/* Logo / Badge */}
          <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-sans font-bold text-slate-900 tracking-tight">Telecom Sync Pro</h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Portal centralizado para el Control, Seguimiento y Despacho de Instalaciones de Fibra Óptica, GPON y Starlink.
            </p>
          </div>

          {/* Key Features preview */}
          <div className="grid grid-cols-2 gap-2 text-left py-3.5 border-y border-slate-200">
            <div className="space-y-0.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-800">🔀 Flujos de Fibra & GPON</h4>
              <p className="text-[9px] text-slate-500 leading-tight">4 fases de control técnico con auto-compleciones.</p>
            </div>
            <div className="space-y-0.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-800">🛰️ Starlink Satelital</h4>
              <p className="text-[9px] text-slate-500 leading-tight">Fase simplificada de orientación y montaje de antena.</p>
            </div>
            <div className="space-y-0.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-800">📁 Ingreso Unitario & Bulk</h4>
              <p className="text-[9px] text-slate-500 leading-tight">Cargas manuales rápidas o masivas vía Excel/CSV.</p>
            </div>
            <div className="space-y-0.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-800">⚡ Webhook CRM Live</h4>
              <p className="text-[9px] text-slate-500 leading-tight">Entradas automáticas en tiempo real mediante API.</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition duration-150 cursor-pointer text-sm"
            >
              {/* Simple inline Google G SVG logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Acceder con Google Auth</span>
            </button>

            <button
              onClick={handleGuestAccess}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-lg border border-slate-300 shadow-sm transition duration-150 cursor-pointer text-xs"
            >
              Acceder como Coordinador Demo (Sin registro)
            </button>
          </div>

          <div className="text-[10px] text-slate-400 font-mono">
            Soporta Firestore Enterprise Edition de alta disponibilidad.
          </div>

        </div>
      </div>
    );
  }

  // MAIN APPLICATION PANEL
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-sky-500 selection:text-slate-950" id="telecom-main-app">
      
      {/* 1. TOP HEADER */}
      <header className="bg-slate-900 border-b border-slate-850 px-4 py-2 sticky top-0 z-30 flex flex-col sm:flex-row justify-between items-center gap-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center shadow">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-sans font-bold text-white tracking-tight">Telecom Sync Pro</h1>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Control y Seguimiento Operativo</p>
          </div>
        </div>

        {/* Database Status & Control buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Base de Datos: Conectada</span>
          </div>

          {/* Quick Demo loader buttons */}
          <button
            onClick={handleSeedMockData}
            title="Cargar registros iniciales de demostración"
            className="p-1 px-2 bg-slate-850 hover:bg-slate-800 rounded border border-slate-750 text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer transition"
          >
            <RotateCcw className="w-3 h-3 text-sky-400" />
            <span>Demo Data</span>
          </button>

          {/* Wipe button */}
          <button
            onClick={handleClearDatabase}
            title="Borrar todas las OTs para empezar de cero"
            className="p-1 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded text-rose-400 text-[11px] flex items-center gap-1 cursor-pointer transition"
          >
            <span>Limpiar BD</span>
          </button>

          {/* Profile & Logout */}
          <div className="h-5 w-px bg-slate-850 mx-0.5 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[11px] font-semibold text-white">{user?.displayName || "Coordinador"}</p>
              <p className="text-[8px] text-slate-400 font-mono">{effectiveEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 bg-slate-850 hover:bg-rose-500/15 border border-slate-750 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>


      {/* 2. NAVIGATION BAR */}
      <nav className="bg-white border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center gap-2 shadow-sm">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          🗂️ Base OTs (BD)
        </button>
        <button
          onClick={() => setActiveTab("kanban")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "kanban"
              ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          🔄 Kanban & Gantt
        </button>
        <button
          onClick={() => setActiveTab("ejecutadas")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "ejecutadas"
              ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          ✓ Ejecutadas (Miguel)
        </button>
        <button
          onClick={() => setActiveTab("gastos")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "gastos"
              ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          💵 Gastos ($)
        </button>
        <button
          onClick={() => setActiveTab("escalamientos")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "escalamientos"
              ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          🚨 Escalamientos ODC
        </button>
        <button
          onClick={() => setActiveTab("brigadas")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "brigadas"
              ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          👥 Brigadas
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "bulk"
              ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Carga Masiva (Bulk)</span>
        </button>
        <button
          onClick={() => setActiveTab("webhook")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "webhook"
              ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-sky-600" />
          <span>API Webhook</span>
        </button>

        <div className="flex-1" />

        {/* Create Manual OT Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-sans font-semibold rounded-lg text-xs flex items-center gap-1 shadow transition duration-150 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-950" />
          <span>Ingreso Unitario (Manual)</span>
        </button>
      </nav>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 p-4 space-y-4 max-w-7xl mx-auto w-full">
        {dbLoading && (
          <div className="bg-sky-50 border border-sky-100 p-2 rounded-lg flex items-center gap-2 text-xs text-sky-700 animate-pulse justify-center">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
            <span>Sincronizando cambios de la base de datos de Telecomunicaciones en tiempo real...</span>
          </div>
        )}

        {/* Render Active View */}
        {activeTab === "dashboard" && (
          <div className="space-y-4" id="dashboard-tab-content">
            <DashboardKPIs
              instalaciones={instalaciones}
              cuadrillas={cuadrillas}
              selectedTech={selectedTech}
              setSelectedTech={setSelectedTech}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              selectedCuadrilla={selectedCuadrilla}
              setSelectedCuadrilla={setSelectedCuadrilla}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onResetFilters={handleResetFilters}
            />

            <OTTableList
              instalaciones={filteredInstalaciones}
              onSelectOT={(ot) => setSelectedOT(ot)}
            />
          </div>
        )}

        {activeTab === "kanban" && (
          <GanttKanbanView
            instalaciones={filteredInstalaciones}
            cuadrillas={cuadrillas}
            onUpdateOT={handleUpdateOT}
          />
        )}

        {activeTab === "ejecutadas" && (
          <ExecutedReport instalaciones={instalaciones} />
        )}

        {activeTab === "gastos" && (
          <ExpensesTracker
            instalaciones={instalaciones}
            cuadrillas={cuadrillas}
            onUpdateOT={handleUpdateOT}
            currentUserEmail={effectiveEmail}
          />
        )}

        {activeTab === "escalamientos" && (
          <EscalationsOdc
            instalaciones={instalaciones}
            onUpdateOT={handleUpdateOT}
            currentUserEmail={effectiveEmail}
          />
        )}

        {activeTab === "brigadas" && (
          <BrigadesManager
            cuadrillas={cuadrillas}
            instalaciones={instalaciones}
          />
        )}

        {activeTab === "bulk" && (
          <BulkImport
            onImport={handleBulkImport}
            currentUserEmail={effectiveEmail}
          />
        )}

        {activeTab === "webhook" && (
          <WebhookInfo
            appUrl={(import.meta as any).env.VITE_APP_URL || ""}
          />
        )}
      </main>

      {/* 4. FLOATING FOOTER DECORATION */}
      <footer className="bg-white px-4 py-2.5 border-t border-slate-200 text-center text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
        <p className="font-mono text-[11px] text-slate-400">Telecom Sync Pro v1.0.0 © 2026 | Arquitectura React/Vite + Firestore Enterprise</p>
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Webhook API Activo
          </span>
          <span>•</span>
          <span className="text-slate-500">Usuario: {effectiveEmail}</span>
        </div>
      </footer>

      {/* 5. MANUAL OT CREATION MODAL */}
      <CreateOTModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        cuadrillas={cuadrillas}
        onSubmit={handleCreateOT}
        currentUserEmail={effectiveEmail}
      />

      {/* 6. SLIDING OT DETAIL INSPECTOR */}
      {selectedOT && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedOT(null)} 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          />
          <OTDetailInspector
            ot={selectedOT}
            onClose={() => setSelectedOT(null)}
            cuadrillas={cuadrillas}
            onUpdateOT={handleUpdateOT}
            currentUserEmail={effectiveEmail}
          />
        </>
      )}

    </div>
  );
}
