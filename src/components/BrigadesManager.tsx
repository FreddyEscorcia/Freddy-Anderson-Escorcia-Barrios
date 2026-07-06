import React, { useState } from "react";
import { Cuadrilla, Instalacion } from "../types";
import { Users, Plus, CheckCircle, Activity, ShieldAlert, DollarSign, List, MapPin, CheckSquare } from "lucide-react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

interface BrigadesManagerProps {
  cuadrillas: Cuadrilla[];
  instalaciones: Instalacion[];
  onRefreshCrews?: () => void;
}

export const BrigadesManager: React.FC<BrigadesManagerProps> = ({
  cuadrillas,
  instalaciones,
}) => {
  // Crew Form State
  const [nombre, setNombre] = useState("");
  const [integrantes, setIntegrantes] = useState("");
  const [ciudad, setCiudad] = useState("Bogotá");
  const [zonal, setZonal] = useState("Zonal Centro");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Calculations per Cuadrilla
  const crewStats = cuadrillas.map((crew) => {
    // Filter OTs for this crew
    const crewOts = instalaciones.filter((ot) => ot.cuadrilla === crew.id);
    const activeOtsCount = crewOts.filter((ot) => 
      ["En programación", "En proceso", "Cliente", "Soporte"].includes(ot.estado)
    ).length;
    const completedOts = crewOts.filter((ot) => ot.estado === "Ejecutada");
    const completedOtsCount = completedOts.length;

    // SLA compliance rate for this crew
    let onTimeCount = 0;
    completedOts.forEach((ot) => {
      const start = new Date(ot.fechaOt).getTime();
      const end = new Date(ot.updatedAt).getTime();
      const durationDays = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      if (durationDays <= ot.diasObjetivo) {
        onTimeCount++;
      }
    });

    const slaCompliance = completedOtsCount > 0 ? Math.round((onTimeCount / completedOtsCount) * 100) : 100;

    // Total expenses for this crew
    let totalExpenses = 0;
    crewOts.forEach((ot) => {
      if (ot.gastos && Array.isArray(ot.gastos)) {
        ot.gastos.forEach((g) => {
          totalExpenses += g.monto;
        });
      }
    });

    return {
      ...crew,
      totalOts: crewOts.length,
      activeOts: activeOtsCount,
      completedOts: completedOtsCount,
      slaCompliance,
      totalExpenses,
    };
  });

  const activeCrewsCount = cuadrillas.filter((c) => c.activo).length;

  const handleSubmitCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!nombre.trim()) {
      setErrorMsg("Debe especificar el nombre de la cuadrilla.");
      return;
    }

    const newCrewId = "CUAD-" + Math.floor(100 + Math.random() * 900); // Generate simple sequential-like ID

    const newCrew: Cuadrilla = {
      id: newCrewId,
      nombre: nombre.trim(),
      integrantes: integrantes.trim() || "No especificados",
      ciudad,
      zonal,
      activo: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "cuadrillas", newCrewId), newCrew);
      setSuccessMsg(`Cuadrilla registrada con éxito con el ID: ${newCrewId}`);
      setNombre("");
      setIntegrantes("");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `cuadrillas/${newCrewId}`);
      setErrorMsg("Error al guardar la cuadrilla: " + err.message);
    }
  };

  return (
    <div className="space-y-4" id="brigades-manager-view">
      
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800 font-sans">Administración de Brigadas / Cuadrillas</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de cuadrillas de terreno, consulta de integrantes, efectividad en entrega de servicio (SLA) y balance de viáticos cargados. Corresponde a la hoja de <strong>BRIGADAS</strong>.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          Activas: <strong className="text-indigo-700">{activeCrewsCount} / {cuadrillas.length}</strong>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Active Crews */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Cuadrillas Registradas</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{cuadrillas.length} Equipos</h3>
          <p className="text-[10px] text-indigo-600 mt-1.5 font-semibold">{activeCrewsCount} cuadrillas en operación activa</p>
        </div>

        {/* Completed installations count */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Eficiencia Global SLA</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {crewStats.length > 0 
              ? Math.round(crewStats.reduce((sum, c) => sum + c.slaCompliance, 0) / crewStats.length)
              : 100}%
          </h3>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Tasa de cumplimiento promedio</p>
        </div>

        {/* Expenses total summary */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Gasto Medio por Cuadrilla</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            ${crewStats.length > 0 
              ? Math.round(crewStats.reduce((sum, c) => sum + c.totalExpenses, 0) / crewStats.length).toLocaleString("es-CO")
              : 0}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Viáticos y caja menor ejecutados</p>
        </div>
      </div>

      {/* Split layout: Add Crew and Crews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Form panel */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm h-fit space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" /> Registrar Nueva Cuadrilla
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Agregue un nuevo equipo operativo a la zona Norte 1.</p>
          </div>

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] font-semibold">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmitCrew} className="space-y-3.5 text-xs">
            {/* Crew Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Nombre del Equipo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Cuadrilla Epsilon - Fibra Zonal"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 outline-none transition"
              />
            </div>

            {/* Integrantes */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Integrantes / Técnicos (Nombres)</label>
              <input
                type="text"
                value={integrantes}
                onChange={(e) => setIntegrantes(e.target.value)}
                placeholder="Ej. Pedro Pérez (Líder), Mario Castro"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 outline-none transition"
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Ciudad Base</label>
              <select
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded px-2.5 py-1.5 text-slate-800 outline-none transition cursor-pointer"
              >
                <option value="Bogotá">Bogotá</option>
                <option value="Medellín">Medellín</option>
                <option value="Cali">Cali</option>
                <option value="Barranquilla">Barranquilla</option>
                <option value="Cartagena">Cartagena</option>
                <option value="Bucaramanga">Bucaramanga</option>
              </select>
            </div>

            {/* Zonal */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Zonal Geográfica</label>
              <select
                value={zonal}
                onChange={(e) => setZonal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded px-2.5 py-1.5 text-slate-800 outline-none transition cursor-pointer"
              >
                <option value="Zonal Centro">Zonal Centro</option>
                <option value="Zonal Noroccidente">Zonal Noroccidente</option>
                <option value="Zonal Suroccidente">Zonal Suroccidente</option>
                <option value="Zonal Norte">Zonal Norte</option>
                <option value="Zonal Oriente">Zonal Oriente</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition duration-150 cursor-pointer"
            >
              <Users className="w-4 h-4 text-white" />
              <span>Grabar Nueva Cuadrilla</span>
            </button>
          </form>

        </div>

        {/* Crews List Grid */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <List className="w-4 h-4 text-indigo-600" /> Plantilla de Personal de Campo
            </h4>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 border border-slate-200 rounded font-bold">
              {cuadrillas.length} Cuadrillas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {crewStats.map((crew) => (
              <div 
                key={crew.id} 
                className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-indigo-300 transition duration-150 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  {/* Crew Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase">
                        {crew.id}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{crew.nombre}</h4>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${crew.activo ? "bg-emerald-500" : "bg-slate-300"}`} />
                  </div>

                  {/* Members */}
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Integrantes:</p>
                    <p className="text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100 leading-tight">
                      {crew.integrantes}
                    </p>
                  </div>

                  {/* Location info */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{crew.ciudad} — {crew.zonal}</span>
                  </div>
                </div>

                {/* Statistics panel */}
                <div className="border-t border-slate-100 pt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="space-y-0.5 border-r border-slate-100">
                    <p className="text-slate-400 font-mono uppercase font-semibold">OTs Activas</p>
                    <p className="text-sm font-bold text-slate-800">{crew.activeOts}</p>
                  </div>
                  <div className="space-y-0.5 border-r border-slate-100">
                    <p className="text-slate-400 font-mono uppercase font-semibold">SLA Cumplido</p>
                    <p className="text-sm font-bold text-emerald-600">{crew.slaCompliance}%</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-slate-400 font-mono uppercase font-semibold">Gastos COP</p>
                    <p className="text-xs font-bold text-slate-950">${crew.totalExpenses.toLocaleString("es-CO")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
