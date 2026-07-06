import React, { useState } from "react";
import { MoveRight, ChevronRight, User, MapPin, Network, Clock, CheckCircle, ChevronLeft } from "lucide-react";
import { Instalacion, Cuadrilla, EstadoOT, FasesFin } from "../types";

interface GanttKanbanViewProps {
  instalaciones: Instalacion[];
  cuadrillas: Cuadrilla[];
  onUpdateOT: (otId: string, updatedFields: Partial<Instalacion>) => Promise<void>;
}

interface Column {
  id: string;
  title: string;
  color: string;
  description: string;
}

export const GanttKanbanView: React.FC<GanttKanbanViewProps> = ({
  instalaciones,
  cuadrillas,
  onUpdateOT,
}) => {
  const [activeTab, setActiveTab] = useState<"kanban" | "gantt">("kanban");
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  // Columns definition for Kanban
  const COLUMNS: Column[] = [
    { id: "pending", title: "En Programación", color: "border-t-slate-400 bg-slate-50/50", description: "OTs en backlog" },
    { id: "enrutamientos", title: "1. Enrutamientos", color: "border-t-sky-500 bg-sky-50/20", description: "Fusión nodo a última milla" },
    { id: "tendidoExterno", title: "2. Tendido Externo", color: "border-t-indigo-500 bg-indigo-50/20", description: "Poste a fachada" },
    { id: "tendidoInterno", title: "3. Tendido Interno", color: "border-t-purple-500 bg-purple-50/20", description: "Fachada a rack" },
    { id: "instalacionEquipos", title: "4. Equipos / Antena", color: "border-t-amber-500 bg-amber-50/20", description: "Configuración final" },
    { id: "ejecutada", title: "Ejecutada", color: "border-t-emerald-500 bg-emerald-50/30", description: "Entrega completada" }
  ];

  // Helper to place installations in columns
  const getOTColumn = (ot: Instalacion): string => {
    if (ot.estado === "Ejecutada") return "ejecutada";
    if (ot.estado === "En programación") return "pending";

    const phases = ot.fasesFin;
    if (ot.productoTecnologia === "Starlink") {
      // Starlink is single phase
      return phases.instalacionAntena ? "ejecutada" : "instalacionEquipos";
    }

    // F.O or GPON 4-phase tracking
    if (!phases.enrutamientos && !phases.cajaTieneSplitter) {
      return "enrutamientos";
    }
    if (!phases.tendidoExterno) {
      return "tendidoExterno";
    }
    if (!phases.tendidoInterno) {
      return "tendidoInterno";
    }
    if (!phases.instalacionEquipos) {
      return "instalacionEquipos";
    }

    return "ejecutada";
  };

  // Helper to transition OT to new column
  const moveOTToColumn = async (ot: Instalacion, colId: string) => {
    const nowStr = new Date().toISOString();
    let updatedFields: Partial<Instalacion> = {};
    const newFases: FasesFin = { ...ot.fasesFin };

    if (colId === "pending") {
      updatedFields = {
        estado: "En programación",
        porcentajeAvance: 0,
        fasesFin: ot.productoTecnologia === "Starlink" 
          ? { instalacionAntena: null }
          : { enrutamientos: null, tendidoExterno: null, tendidoInterno: null, instalacionEquipos: null, cajaTieneSplitter: ot.fasesFin.cajaTieneSplitter }
      };
    } else if (colId === "enrutamientos") {
      newFases.enrutamientos = null;
      newFases.tendidoExterno = null;
      newFases.tendidoInterno = null;
      newFases.instalacionEquipos = null;
      updatedFields = {
        estado: "En proceso",
        porcentajeAvance: ot.productoTecnologia === "GPON" && ot.fasesFin.cajaTieneSplitter ? 25 : 0,
        fasesFin: newFases
      };
    } else if (colId === "tendidoExterno") {
      newFases.enrutamientos = ot.fasesFin.enrutamientos || nowStr;
      newFases.tendidoExterno = null;
      newFases.tendidoInterno = null;
      newFases.instalacionEquipos = null;
      updatedFields = {
        estado: "En proceso",
        porcentajeAvance: 25,
        fasesFin: newFases
      };
    } else if (colId === "tendidoInterno") {
      newFases.enrutamientos = ot.fasesFin.enrutamientos || nowStr;
      newFases.tendidoExterno = ot.fasesFin.tendidoExterno || nowStr;
      newFases.tendidoInterno = null;
      newFases.instalacionEquipos = null;
      updatedFields = {
        estado: "En proceso",
        porcentajeAvance: 50,
        fasesFin: newFases
      };
    } else if (colId === "instalacionEquipos") {
      if (ot.productoTecnologia === "Starlink") {
        newFases.instalacionAntena = null;
        updatedFields = {
          estado: "En proceso",
          porcentajeAvance: 0,
          fasesFin: newFases
        };
      } else {
        newFases.enrutamientos = ot.fasesFin.enrutamientos || nowStr;
        newFases.tendidoExterno = ot.fasesFin.tendidoExterno || nowStr;
        newFases.tendidoInterno = ot.fasesFin.tendidoInterno || nowStr;
        newFases.instalacionEquipos = null;
        updatedFields = {
          estado: "En proceso",
          porcentajeAvance: 75,
          fasesFin: newFases
        };
      }
    } else if (colId === "ejecutada") {
      if (ot.productoTecnologia === "Starlink") {
        newFases.instalacionAntena = ot.fasesFin.instalacionAntena || nowStr;
      } else {
        newFases.enrutamientos = ot.fasesFin.enrutamientos || nowStr;
        newFases.tendidoExterno = ot.fasesFin.tendidoExterno || nowStr;
        newFases.tendidoInterno = ot.fasesFin.tendidoInterno || nowStr;
        newFases.instalacionEquipos = ot.fasesFin.instalacionEquipos || nowStr;
      }
      updatedFields = {
        estado: "Ejecutada",
        porcentajeAvance: 100,
        fasesFin: newFases
      };
    }

    try {
      await onUpdateOT(ot.id, updatedFields);
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, ot: Instalacion) => {
    e.dataTransfer.setData("text/plain", ot.id);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDraggedOverColumn(colId);
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const otId = e.dataTransfer.getData("text/plain");
    const otObj = instalaciones.find((o) => o.id === otId);
    if (otObj) {
      await moveOTToColumn(otObj, colId);
    }
  };

  return (
    <div className="space-y-4" id="gantt-kanban-section">
      
      {/* Sub-Header Tabs */}
      <div className="flex items-center justify-between bg-white p-1 rounded-lg border border-slate-200 max-w-sm shadow-sm">
        <button
          onClick={() => setActiveTab("kanban")}
          className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-md transition cursor-pointer text-center ${
            activeTab === "kanban"
              ? "bg-slate-100 text-slate-800 border border-slate-250 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          Tablero Kanban (Fases)
        </button>
        <button
          onClick={() => setActiveTab("gantt")}
          className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-md transition cursor-pointer text-center ${
            activeTab === "gantt"
              ? "bg-slate-100 text-slate-800 border border-slate-250 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          Diagrama de Gantt
        </button>
      </div>

      {activeTab === "kanban" ? (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-start" id="kanban-grid">
          {COLUMNS.map((column) => {
            const columnOTs = instalaciones.filter((o) => getOTColumn(o) === column.id);

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={() => setDraggedOverColumn(null)}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`border border-slate-200 rounded-xl flex flex-col h-[520px] transition duration-150 border-t-4 bg-white shadow-sm ${column.color} ${
                  draggedOverColumn === column.id ? "ring-2 ring-sky-500/30 bg-sky-50/10" : ""
                }`}
                id={`kanban-col-${column.id}`}
              >
                {/* Column Header */}
                <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-sans font-bold text-slate-800 uppercase tracking-wider truncate">
                      {column.title}
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-200 rounded-full text-slate-600 border border-slate-300">
                      {columnOTs.length}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-mono leading-tight">{column.description}</p>
                </div>

                {/* Column Body / Card stack */}
                <div className="p-2 overflow-y-auto flex-1 space-y-2">
                  {columnOTs.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-3 text-center">
                      <p className="text-[9px] text-slate-400 font-mono">Sin órdenes en esta fase</p>
                    </div>
                  ) : (
                    columnOTs.map((ot) => {
                      const slaOverdue = new Date(ot.fechaTentativaEntrega).getTime() < Date.now() && ot.estado !== "Ejecutada";

                      return (
                        <div
                          key={ot.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ot)}
                          className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm hover:border-sky-500/50 hover:shadow-md transition cursor-grab active:cursor-grabbing group relative"
                          id={`kanban-card-${ot.id}`}
                        >
                          {/* SLA Ribbon Indicator */}
                          <div className={`absolute top-0 right-0 w-1 h-full rounded-r ${
                            ot.estado === "Ejecutada" ? "bg-emerald-500" : slaOverdue ? "bg-rose-500" : "bg-sky-500"
                          }`} />

                          {/* OT & Tech */}
                          <div className="flex justify-between items-start gap-1 pr-1">
                            <span className="text-[11px] font-mono font-bold text-slate-900 group-hover:text-sky-600 transition">
                              {ot.ot}
                            </span>
                            <span className="text-[8px] font-mono px-1 py-0.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-500 leading-none">
                              {ot.productoTecnologia}
                            </span>
                          </div>

                          {/* Client */}
                          <p className="text-[11px] font-sans font-semibold text-slate-800 mt-1 truncate">
                            {ot.cliente}
                          </p>

                          {/* Location */}
                          <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                            <span>{ot.ciudad}</span>
                          </p>

                          {/* Crew Name */}
                          <p className="text-[9px] text-sky-700/80 flex items-center gap-1 mt-0.5 truncate">
                            <User className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                            <span>{ot.cuadrillaNombre || "Sin asignar"}</span>
                          </p>

                          {/* Interactive Move Buttons for mobile/iframe accessibility */}
                          <div className="flex items-center justify-between border-t border-slate-100 mt-2 pt-1.5 text-[9px]">
                            {/* Previous Column */}
                            <button
                              onClick={() => {
                                const idx = COLUMNS.findIndex((c) => c.id === column.id);
                                if (idx > 0) moveOTToColumn(ot, COLUMNS[idx - 1].id);
                              }}
                              disabled={column.id === "pending"}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer p-0.5"
                              title="Mover al estado anterior"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>

                            {/* Progress % */}
                            <span className="font-mono text-[8px] text-slate-400 font-semibold">
                              {ot.porcentajeAvance}%
                            </span>

                            {/* Next Column */}
                            <button
                              onClick={() => {
                                const idx = COLUMNS.findIndex((c) => c.id === column.id);
                                if (idx < COLUMNS.length - 1) moveOTToColumn(ot, COLUMNS[idx + 1].id);
                              }}
                              disabled={column.id === "ejecutada"}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer p-0.5"
                              title="Mover al siguiente estado"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DIAGRAMA DE GANTT DE CUADRILLAS */
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3" id="gantt-diagram-panel">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">Cronograma de Ejecución por Cuadrilla (Gantt)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Distribución y avance temporal de las OTs asignadas a cada cuadrilla activa.</p>
          </div>

          <div className="space-y-4 overflow-x-auto">
            {cuadrillas.map((crew) => {
              const crewOTs = instalaciones.filter((o) => o.cuadrilla === crew.id);

              return (
                <div key={crew.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center border-b border-slate-100 pb-3">
                  {/* Crew Header */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-sans font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> {crew.nombre}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{crew.integrantes}</p>
                    <p className="text-[9px] font-mono text-slate-400">Sede: {crew.ciudad}</p>
                  </div>

                  {/* Gantt Bar representations */}
                  <div className="md:col-span-3 flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg min-h-[50px] justify-center border border-slate-100">
                    {crewOTs.length === 0 ? (
                      <p className="text-[10px] text-slate-400 font-mono text-center">Sin asignaciones programadas</p>
                    ) : (
                      crewOTs.map((ot) => {
                        const dateOtObj = new Date(ot.fechaOt);
                        const dateTargetObj = new Date(ot.fechaTentativaEntrega);
                        const totalDuration = Math.max(1, Math.ceil((dateTargetObj.getTime() - dateOtObj.getTime()) / (1000 * 60 * 60 * 24)));
                        
                        return (
                          <div key={ot.id} className="space-y-0.5">
                            <div className="flex justify-between text-[9px] font-mono text-slate-400 px-1">
                              <span>OT: {ot.ot} ({ot.productoTecnologia})</span>
                              <span>Target: {new Date(ot.fechaTentativaEntrega).toLocaleDateString("es-ES")}</span>
                            </div>
                            
                            {/* Bar container representing progress */}
                            <div className="w-full bg-slate-200/50 rounded-full h-2.5 relative overflow-hidden group">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  ot.estado === "Ejecutada"
                                    ? "bg-emerald-500"
                                    : ot.estado === "Soporte"
                                    ? "bg-rose-500"
                                    : "bg-sky-500"
                                }`}
                                style={{ width: `${ot.porcentajeAvance}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-[7px] font-mono text-white font-bold pointer-events-none">
                                {ot.porcentajeAvance}% ({ot.estado})
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

