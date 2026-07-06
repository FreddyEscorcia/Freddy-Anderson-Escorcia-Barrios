import React, { useState } from "react";
import { X, Calendar, User, MapPin, CheckCircle, Clock, AlertTriangle, MessageSquare, ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";
import { Instalacion, Cuadrilla, EstadoOT, Comentario } from "../types";

interface OTDetailInspectorProps {
  ot: Instalacion | null;
  onClose: () => void;
  cuadrillas: Cuadrilla[];
  onUpdateOT: (otId: string, updatedFields: Partial<Instalacion>) => Promise<void>;
  currentUserEmail: string;
}

export const OTDetailInspector: React.FC<OTDetailInspectorProps> = ({
  ot,
  onClose,
  cuadrillas,
  onUpdateOT,
  currentUserEmail,
}) => {
  const [newComment, setNewComment] = useState("");
  const [causaReprogramacion, setCausaReprogramacion] = useState("");
  const [selectedCuadrilla, setSelectedCuadrilla] = useState("");
  const [tempEstado, setTempEstado] = useState<EstadoOT | "">("");

  if (!ot) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentObj: Comentario = {
      autor: "Coordinador",
      autorEmail: currentUserEmail,
      fecha: new Date().toISOString(),
      comentario: newComment.trim(),
      causaReprogramacion: causaReprogramacion || undefined
    };

    const updatedComments = [...(ot.comentarios || []), commentObj];

    try {
      await onUpdateOT(ot.id, { comentarios: updatedComments });
      setNewComment("");
      setCausaReprogramacion("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCrew = async (crewId: string) => {
    if (!crewId) return;
    const selectedCrew = cuadrillas.find(c => c.id === crewId);
    if (selectedCrew) {
      try {
        await onUpdateOT(ot.id, {
          cuadrilla: crewId,
          cuadrillaNombre: selectedCrew.nombre,
          implementador: selectedCrew.integrantes.split("(")[0].trim()
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateState = async (state: EstadoOT) => {
    try {
      await onUpdateOT(ot.id, { estado: state });
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle/Complete individual phases manually
  const handleTogglePhase = async (phaseName: string) => {
    const newFases = { ...ot.fasesFin };
    const nowStr = new Date().toISOString();

    // Check current state of this phase
    const isCompleted = !!(newFases as any)[phaseName];
    (newFases as any)[phaseName] = isCompleted ? null : nowStr;

    // Recalculate percentage of progress
    let donePhases = 0;
    let totalPhases = 0;

    if (ot.productoTecnologia === "Starlink") {
      totalPhases = 1;
      if (newFases.instalacionAntena) donePhases++;
    } else {
      totalPhases = 4;
      if (newFases.enrutamientos || newFases.cajaTieneSplitter) donePhases++;
      if (newFases.tendidoExterno) donePhases++;
      if (newFases.tendidoInterno) donePhases++;
      if (newFases.instalacionEquipos) donePhases++;
    }

    const calculatedProgress = Math.round((donePhases / totalPhases) * 100);
    const calculatedState: EstadoOT = calculatedProgress === 100 ? "Ejecutada" : "En proceso";

    try {
      await onUpdateOT(ot.id, {
        fasesFin: newFases,
        porcentajeAvance: calculatedProgress,
        estado: calculatedState
      });
    } catch (err) {
      console.error(err);
    }
  };

  const slaOverdue = new Date(ot.fechaTentativaEntrega).getTime() < Date.now() && ot.estado !== "Ejecutada";

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full transform transition duration-200" id="ot-detail-inspector">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-sky-700 uppercase tracking-wider">{ot.productoTecnologia}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${ot.estado === "Ejecutada" ? "bg-emerald-500 animate-pulse" : ot.estado === "Anulada" ? "bg-slate-400" : "bg-sky-500"}`} />
            <span className="text-[11px] font-sans text-slate-600 font-bold">{ot.estado}</span>
          </div>
          <h3 className="text-sm font-sans font-bold text-slate-800 mt-0.5">Inspección de OT: {ot.ot}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        
        {/* Quick SLA Banner */}
        {slaOverdue ? (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2.5 text-[11px] text-rose-800">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">¡SLA Vencido!</p>
              <p className="text-rose-700 mt-0.5">La fecha tentativa de entrega expiró el {new Date(ot.fechaTentativaEntrega).toLocaleDateString("es-ES")}. Requiere atención prioritaria o reprogramación.</p>
            </div>
          </div>
        ) : (
          <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg flex items-start gap-2.5 text-[11px] text-sky-800">
            <Clock className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">SLA Vigente (A Tiempo)</p>
              <p className="text-sky-700 mt-0.5">Fecha tentativa de entrega: {new Date(ot.fechaTentativaEntrega).toLocaleDateString("es-ES")}.</p>
            </div>
          </div>
        )}

        {/* Section: Operational Stepper */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
            <h4 className="text-[10px] font-sans font-bold uppercase text-slate-600">Fases y Progreso de Instalación</h4>
            <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
              {ot.porcentajeAvance}% Completado
            </span>
          </div>

          <div className="space-y-2">
            {ot.productoTecnologia === "Starlink" ? (
              // Starlink single-phase
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-xs">
                <div className="space-y-0.5">
                  <p className="text-xs font-sans font-bold text-slate-800">Montaje y Configuración de Antena</p>
                  <p className="text-[10px] text-slate-500">
                    {ot.fasesFin.instalacionAntena 
                      ? `Completado el ${new Date(ot.fasesFin.instalacionAntena).toLocaleDateString("es-ES")}` 
                      : "Fase pendiente"}
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePhase("instalacionAntena")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition shadow-xs ${
                    ot.fasesFin.instalacionAntena 
                      ? "bg-emerald-600 text-white hover:bg-emerald-500" 
                      : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                  }`}
                >
                  {ot.fasesFin.instalacionAntena ? "Desmarcar" : "Completar"}
                </button>
              </div>
            ) : (
              // F.O. and GPON multi-phase
              <div className="space-y-2">
                {/* Phase 1: Enrutamiento */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-sans font-bold text-slate-800">Fase 1: Enrutamientos</p>
                      {ot.productoTecnologia === "GPON" && ot.fasesFin.cajaTieneSplitter && (
                        <span className="text-[8px] font-mono bg-sky-50 text-sky-700 border border-sky-250 px-1 py-0.5 rounded font-bold">
                          Splitter Auto
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {ot.fasesFin.cajaTieneSplitter 
                        ? "Completado automático (Splitter en caja)" 
                        : ot.fasesFin.enrutamientos 
                        ? `Completado el ${new Date(ot.fasesFin.enrutamientos).toLocaleDateString("es-ES")}` 
                        : "Fase pendiente"}
                    </p>
                  </div>
                  {!ot.fasesFin.cajaTieneSplitter && (
                    <button
                      onClick={() => handleTogglePhase("enrutamientos")}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition shadow-xs ${
                        ot.fasesFin.enrutamientos 
                          ? "bg-sky-600 text-white hover:bg-sky-500" 
                          : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                      }`}
                    >
                      {ot.fasesFin.enrutamientos ? "Desmarcar" : "Completar"}
                    </button>
                  )}
                </div>

                {/* Phase 2: Tendido Externo */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <div className="space-y-0.5">
                    <p className="text-xs font-sans font-bold text-slate-800">Fase 2: Tendido Externo (Poste a Fachada)</p>
                    <p className="text-[10px] text-slate-500">
                      {ot.fasesFin.tendidoExterno 
                        ? `Completado el ${new Date(ot.fasesFin.tendidoExterno).toLocaleDateString("es-ES")}` 
                        : "Fase pendiente"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePhase("tendidoExterno")}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition shadow-xs ${
                      ot.fasesFin.tendidoExterno 
                        ? "bg-indigo-600 text-white hover:bg-indigo-500" 
                        : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {ot.fasesFin.tendidoExterno ? "Desmarcar" : "Completar"}
                  </button>
                </div>

                {/* Phase 3: Tendido Interno */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <div className="space-y-0.5">
                    <p className="text-xs font-sans font-bold text-slate-800">Fase 3: Tendido Interno (Fachada a Rack)</p>
                    <p className="text-[10px] text-slate-500">
                      {ot.fasesFin.tendidoInterno 
                        ? `Completado el ${new Date(ot.fasesFin.tendidoInterno).toLocaleDateString("es-ES")}` 
                        : "Fase pendiente"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePhase("tendidoInterno")}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition shadow-xs ${
                      ot.fasesFin.tendidoInterno 
                        ? "bg-purple-600 text-white hover:bg-purple-500" 
                        : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {ot.fasesFin.tendidoInterno ? "Desmarcar" : "Completar"}
                  </button>
                </div>

                {/* Phase 4: Equipos */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <div className="space-y-0.5">
                    <p className="text-xs font-sans font-bold text-slate-800">Fase 4: Instalación de Equipos</p>
                    <p className="text-[10px] text-slate-500">
                      {ot.fasesFin.instalacionEquipos 
                        ? `Completado el ${new Date(ot.fasesFin.instalacionEquipos).toLocaleDateString("es-ES")}` 
                        : "Fase pendiente"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePhase("instalacionEquipos")}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition shadow-xs ${
                      ot.fasesFin.instalacionEquipos 
                        ? "bg-amber-600 text-white hover:bg-amber-500" 
                        : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {ot.fasesFin.instalacionEquipos ? "Desmarcar" : "Completar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section: General Info & Reassignment */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3">
          <h4 className="text-[10px] font-sans font-bold uppercase text-slate-600 border-b border-slate-200 pb-1.5">Información de la Orden</h4>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-500 font-mono text-[10px] font-bold uppercase">Cliente:</p>
              <p className="font-semibold text-slate-800 mt-0.5">{ot.cliente}</p>
            </div>
            <div>
              <p className="text-slate-500 font-mono text-[10px] font-bold uppercase">Subcliente (Sede):</p>
              <p className="font-semibold text-slate-800 mt-0.5">{ot.subcliente || "No especificado"}</p>
            </div>
            <div>
              <p className="text-slate-500 font-mono text-[10px] font-bold uppercase">Orden CS CRM:</p>
              <p className="font-semibold text-slate-850 font-mono">{ot.ordenCs}</p>
            </div>
            <div>
              <p className="text-slate-500 font-mono text-[10px] font-bold uppercase">Capacidad (BW):</p>
              <p className="font-semibold text-slate-800 mt-0.5">{ot.bwCapacidad}</p>
            </div>
            <div>
              <p className="text-slate-500 font-mono text-[10px] font-bold uppercase">Ubicación y Dirección:</p>
              <p className="font-semibold text-slate-800 mt-0.5">{ot.direccion}, {ot.ciudad}</p>
            </div>
            <div>
              <p className="text-slate-500 font-mono text-[10px] font-bold uppercase">Coordenadas:</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-slate-700 font-mono">{ot.coordenadas || "4.65,-74.05"}</span>
                {ot.coordenadas && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${ot.coordenadas}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-0.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Assign Dropdown */}
          <div className="border-t border-slate-200 pt-2.5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Reasignar Cuadrilla</label>
              <select
                value={ot.cuadrilla}
                onChange={(e) => handleUpdateCrew(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded px-2 py-1 text-xs text-slate-800 outline-none cursor-pointer transition"
              >
                <option value="">Seleccionar cuadrilla...</option>
                {cuadrillas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Modificar Estado General</label>
              <select
                value={ot.estado}
                onChange={(e) => handleUpdateState(e.target.value as EstadoOT)}
                className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded px-2 py-1 text-xs text-slate-800 outline-none cursor-pointer transition"
              >
                <option value="En programación">En programación</option>
                <option value="En proceso">En proceso</option>
                <option value="Cliente">Cliente (En espera)</option>
                <option value="Soporte">Soporte (Problemas técnicos)</option>
                <option value="Ejecutada">Ejecutada</option>
                <option value="Anulada">Anulada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Escalamiento ODC (if active) */}
        {ot.escaladaOdc && (
          <div className="bg-rose-50/75 border border-rose-200 p-3.5 rounded-lg space-y-2 text-xs text-rose-900 shadow-xs">
            <h5 className="font-sans font-bold flex items-center gap-1.5 text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" /> ESCALAMIENTO ODC ACTIVO (MIGUEL)
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-rose-850">
              <p><strong className="text-rose-950 uppercase">Motivo:</strong> {ot.motivoEscalamientoOdc || "Planta Externa"}</p>
              <p><strong className="text-rose-950 uppercase">Estado ODC:</strong> {ot.estadoEscalamientoOdc || "Pendiente"}</p>
              <p className="col-span-2"><strong className="text-rose-950 uppercase">Fecha Esc.:</strong> {ot.fechaEscalamientoOdc ? new Date(ot.fechaEscalamientoOdc).toLocaleDateString("es-ES") : "N/A"}</p>
              {ot.comentariosOdc && (
                <p className="col-span-2 italic bg-white/60 p-2 rounded border border-rose-100">
                  "{ot.comentariosOdc}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Section: Expenses (Gastos de OT) */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2.5">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
            <h4 className="text-[10px] font-sans font-bold uppercase text-slate-600">Gastos Registrados en esta OT</h4>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 px-1.5 py-0.5 rounded">
              Total: ${(ot.gastos || []).reduce((sum, g) => sum + g.monto, 0).toLocaleString("es-CO")} COP
            </span>
          </div>

          {/* Mini-List of expenses */}
          {(!ot.gastos || ot.gastos.length === 0) ? (
            <p className="text-[10px] text-slate-400 font-mono italic">No se han registrado gastos en esta orden de trabajo.</p>
          ) : (
            <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
              {ot.gastos.map((g, i) => (
                <div key={g.id || i} className="bg-white p-2 rounded border border-slate-150 flex justify-between items-center text-[11px] font-medium shadow-xs">
                  <div>
                    <p className="text-slate-800 font-bold">{g.concepto}</p>
                    <p className="text-[9px] text-slate-400 font-mono">{new Date(g.fecha + "T12:00:00").toLocaleDateString("es-ES")} • {g.registradoPor.split("@")[0]}</p>
                  </div>
                  <strong className="text-slate-900">${g.monto.toLocaleString("es-CO")}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Comments & Reprogramming History */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-sans font-bold uppercase text-slate-600 flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-slate-500" /> Historial de Comentarios / Reprogramaciones</h4>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 shadow-xs">
            
            {/* Previous Comment Stack */}
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
              {!ot.comentarios || ot.comentarios.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-mono text-center py-4">No hay comentarios en esta OT.</p>
              ) : (
                ot.comentarios.map((c, i) => (
                  <div key={i} className="bg-white p-2.5 rounded border border-slate-150 text-[11px] space-y-1 shadow-xs">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <strong>{c.autor}</strong>
                      <span>{new Date(c.fecha).toLocaleDateString("es-ES")} {new Date(c.fecha).toLocaleTimeString("es-ES", {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-slate-700 font-medium mt-0.5">{c.comentario}</p>
                    {c.causaReprogramacion && (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded text-[9px] text-rose-700 font-mono font-bold">
                        ⚠️ Causa: {c.causaReprogramacion}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* New Comment Form */}
            <form onSubmit={handleAddComment} className="border-t border-slate-200 pt-2.5 space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Añadir comentario técnico u observación de avance..."
                rows={2}
                className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded p-2 text-xs text-slate-850 placeholder-slate-400 outline-none resize-none transition focus:ring-1 focus:ring-sky-500/15"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-[9px] font-mono text-slate-500 uppercase font-bold">Causa Reprog:</label>
                  <select
                    value={causaReprogramacion}
                    onChange={(e) => setCausaReprogramacion(e.target.value)}
                    className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-600 outline-none cursor-pointer transition"
                  >
                    <option value="">Ninguna...</option>
                    <option value="Cliente ausente">Cliente ausente</option>
                    <option value="Problemas de red principal">Problemas de red principal</option>
                    <option value="Falta de permisos administración">Falta de permisos adm.</option>
                    <option value="Problemas climáticos">Problemas climáticos</option>
                    <option value="Falta de materiales o herramientas">Falta de materiales</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-sans font-bold rounded text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-white" /> Comentar
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};
