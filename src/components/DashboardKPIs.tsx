import React from "react";
import { Search, Calendar, Filter, Users, Network, MapPin, RefreshCw, Layers } from "lucide-react";
import { Instalacion, Cuadrilla } from "../types";

interface DashboardKPIsProps {
  instalaciones: Instalacion[];
  cuadrillas: Cuadrilla[];
  selectedTech: string;
  setSelectedTech: (tech: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedCuadrilla: string;
  setSelectedCuadrilla: (cuad: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onResetFilters: () => void;
}

export const DashboardKPIs: React.FC<DashboardKPIsProps> = ({
  instalaciones,
  cuadrillas,
  selectedTech,
  setSelectedTech,
  selectedCity,
  setSelectedCity,
  selectedCuadrilla,
  setSelectedCuadrilla,
  selectedStatus,
  setSelectedStatus,
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onResetFilters,
}) => {
  // Calculations
  const activeOTs = instalaciones.filter((ot) => 
    ["En programación", "En proceso", "Cliente", "Soporte"].includes(ot.estado)
  );
  
  const ejecutadasMes = instalaciones.filter((ot) => ot.estado === "Ejecutada");
  
  const backlogOTs = instalaciones.filter((ot) => ot.estado === "En programación");
  
  const vencidasOTs = instalaciones.filter((ot) => 
    ["En programación", "En proceso", "Cliente", "Soporte"].includes(ot.estado) && 
    new Date(ot.fechaTentativaEntrega).getTime() < Date.now()
  );

  // Extract unique cities
  const cities = Array.from(new Set(instalaciones.map((ot) => ot.ciudad).filter(Boolean)));

  return (
    <div className="space-y-4" id="dashboard-kpis-section">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI: Activas */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm hover:border-slate-300 transition duration-150 relative overflow-hidden" id="kpi-activas">
          <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">OTs Activas</p>
              <h3 className="text-2xl font-sans font-bold text-slate-900 mt-0.5">{activeOTs.length}</h3>
            </div>
            <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600 border border-sky-100 shadow-sm">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            En campo o reprogramadas
          </p>
        </div>

        {/* KPI: Ejecutadas */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm hover:border-slate-300 transition duration-150 relative overflow-hidden" id="kpi-ejecutadas">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">OTs Ejecutadas</p>
              <h3 className="text-2xl font-sans font-bold text-emerald-600 mt-0.5">{ejecutadasMes.length}</h3>
            </div>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100 shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 mt-2 font-semibold flex items-center gap-0.5">
            <span>✓</span> Finalizadas con éxito
          </p>
        </div>

        {/* KPI: Backlog */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm hover:border-slate-300 transition duration-150 relative overflow-hidden" id="kpi-backlog">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">En Backlog</p>
              <h3 className="text-2xl font-sans font-bold text-amber-600 mt-0.5">{backlogOTs.length}</h3>
            </div>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100 shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            Pendientes por asignación
          </p>
        </div>

        {/* KPI: Vencidas */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm hover:border-slate-300 transition duration-150 relative overflow-hidden" id="kpi-vencidas">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Fuera de SLA (Vencidas)</p>
              <h3 className="text-2xl font-sans font-bold text-rose-600 mt-0.5">{vencidasOTs.length}</h3>
            </div>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-100 shadow-sm">
              <span className="w-4 h-4 flex items-center justify-center font-bold text-sm">!</span>
            </div>
          </div>
          <p className="text-[10px] text-rose-600 mt-2 font-semibold flex items-center gap-0.5">
            ⚠️ Requieren reprogramación
          </p>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3" id="dashboard-filters">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">Panel de Filtros Dinámicos</h4>
          </div>
          {(selectedTech || selectedCity || selectedCuadrilla || selectedStatus || searchQuery || startDate || endDate) && (
            <button
              onClick={onResetFilters}
              className="text-[11px] text-sky-600 hover:text-sky-700 font-medium transition underline cursor-pointer"
            >
              Restablecer Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filter: Search Query */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-mono text-slate-500 font-semibold">Buscar OT, Cliente o CS</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej. OT-99482, Banco..."
                className="w-full bg-slate-50 border border-slate-250 focus:border-sky-500/60 rounded-md px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
            </div>
          </div>

          {/* Filter: Technology */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-mono text-slate-500 font-semibold">Tecnología / Producto</label>
            <div className="relative">
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 focus:border-sky-500/60 rounded-md px-2.5 py-1.5 text-xs text-slate-800 outline-none appearance-none cursor-pointer transition"
              >
                <option value="">Todas las Tecnologías</option>
                <option value="F.O.">Fibra Óptica (F.O.)</option>
                <option value="GPON">GPON (Fibra Compartida)</option>
                <option value="Starlink">Starlink (Satelital)</option>
              </select>
              <Network className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Filter: City */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-mono text-slate-500 font-semibold">Ciudad / Ubicación</label>
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 focus:border-sky-500/60 rounded-md px-2.5 py-1.5 text-xs text-slate-800 outline-none appearance-none cursor-pointer transition"
              >
                <option value="">Todas las Ciudades</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Filter: Cuadrilla */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-mono text-slate-500 font-semibold">Cuadrilla Asignada</label>
            <div className="relative">
              <select
                value={selectedCuadrilla}
                onChange={(e) => setSelectedCuadrilla(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 focus:border-sky-500/60 rounded-md px-2.5 py-1.5 text-xs text-slate-800 outline-none appearance-none cursor-pointer transition"
              >
                <option value="">Todas las Cuadrillas</option>
                {cuadrillas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <Users className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Filter: Status */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-mono text-slate-500 font-semibold">Estado Operativo</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 focus:border-sky-500/60 rounded-md px-2.5 py-1.5 text-xs text-slate-800 outline-none cursor-pointer transition"
            >
              <option value="">Todos los Estados</option>
              <option value="En programación">En programación</option>
              <option value="En proceso">En proceso</option>
              <option value="Cliente">Cliente (En espera de cliente)</option>
              <option value="Soporte">Soporte (Problemas técnicos)</option>
              <option value="Ejecutada">Ejecutada</option>
              <option value="Anulada">Anulada</option>
            </select>
          </div>

          {/* Filter: Start Date */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-mono text-slate-500 font-semibold">Fecha de OT Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 focus:border-sky-500/60 rounded-md px-2.5 py-1.5 text-xs text-slate-800 outline-none transition"
            />
          </div>

          {/* Filter: End Date */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-mono text-slate-500 font-semibold">Fecha de OT Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 focus:border-sky-500/60 rounded-md px-2.5 py-1.5 text-xs text-slate-800 outline-none transition"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
