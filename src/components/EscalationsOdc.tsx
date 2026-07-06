import React, { useState } from "react";
import { Instalacion, EstadoOT } from "../types";
import { ShieldAlert, Plus, CheckCircle2, AlertTriangle, Clock, List, ArrowRight, MessageSquare } from "lucide-react";

interface EscalationsOdcProps {
  instalaciones: Instalacion[];
  onUpdateOT: (otId: string, updatedFields: Partial<Instalacion>) => Promise<void>;
  currentUserEmail: string;
}

export const EscalationsOdc: React.FC<EscalationsOdcProps> = ({
  instalaciones,
  onUpdateOT,
  currentUserEmail,
}) => {
  // Form State
  const [selectedOtId, setSelectedOtId] = useState("");
  const [motivo, setMotivo] = useState("Postes sin canalización (Obra Civil)");
  const [customMotivo, setCustomMotivo] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Filter installations that are currently escalated OR in Soporte state
  const escalatedOts = instalaciones.filter(
    (ot) => ot.escaladaOdc === true || ot.estado === "Soporte"
  );

  // Active OTs available to escalate (not executed, not annulled, not already escalated)
  const availableToEscalate = instalaciones.filter(
    (ot) => ot.estado !== "Ejecutada" && ot.estado !== "Anulada" && !ot.escaladaOdc
  );

  // KPIs
  const totalEscalations = escalatedOts.length;
  const pendingOdc = escalatedOts.filter((ot) => ot.estadoEscalamientoOdc === "Pendiente" || !ot.estadoEscalamientoOdc).length;
  const inReviewOdc = escalatedOts.filter((ot) => ot.estadoEscalamientoOdc === "En revisión").length;
  const scheduledOdc = escalatedOts.filter((ot) => ot.estadoEscalamientoOdc === "Programado").length;
  const solvedOdc = instalaciones.filter((ot) => ot.escaladaOdc && ot.estadoEscalamientoOdc === "Solucionado").length;

  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!selectedOtId) {
      setErrorMsg("Debe elegir una Orden de Trabajo (OT).");
      return;
    }

    const ot = instalaciones.find((o) => o.ot === selectedOtId);
    if (!ot) {
      setErrorMsg("La OT elegida no existe.");
      return;
    }

    const finalMotivo = motivo === "Otros" && customMotivo.trim() ? customMotivo.trim() : motivo;
    const nowStr = new Date().toISOString();

    // Create a comment recording this escalation
    const escalationComment = {
      autor: "Coordinador de Instalaciones",
      autorEmail: currentUserEmail,
      fecha: nowStr,
      comentario: `🚨 OT ESCALADA A ODC (Miguel). Motivo: ${finalMotivo}. Comentario inicial: ${comentarios || "Sin comentarios adicionales."}`,
      causaReprogramacion: "Escalamiento ODC",
    };

    const updatedComments = [...(ot.comentarios || []), escalationComment];

    const updates: Partial<Instalacion> = {
      estado: "Soporte", // Move state to Support
      escaladaOdc: true,
      fechaEscalamientoOdc: nowStr,
      motivoEscalamientoOdc: finalMotivo,
      estadoEscalamientoOdc: "Pendiente",
      comentariosOdc: comentarios,
      comentarios: updatedComments,
    };

    try {
      await onUpdateOT(selectedOtId, updates);
      setSuccessMsg(`OT ${selectedOtId} escalada exitosamente a ODC y transferida a estado "Soporte".`);
      // Reset form
      setSelectedOtId("");
      setComentarios("");
      setCustomMotivo("");
    } catch (err: any) {
      setErrorMsg("Fallo al escalar OT: " + err.message);
    }
  };

  const handleUpdateStatus = async (otId: string, newOdcStatus: "Pendiente" | "En revisión" | "Programado" | "Solucionado" | "Cancelado") => {
    const ot = instalaciones.find((o) => o.ot === otId);
    if (!ot) return;

    const nowStr = new Date().toISOString();
    let updatedState: EstadoOT = ot.estado;

    const actionComment = {
      autor: "Coordinador de Instalaciones",
      autorEmail: currentUserEmail,
      fecha: nowStr,
      comentario: `⚙️ ODC Escalamiento actualizado a estado: "${newOdcStatus}".`,
    };

    const updatedComments = [...(ot.comentarios || []), actionComment];

    const updates: Partial<Instalacion> = {
      estadoEscalamientoOdc: newOdcStatus,
      comentarios: updatedComments,
    };

    // If solved, let's restore it to "En proceso" or prompt transition
    if (newOdcStatus === "Solucionado") {
      updates.estado = "En proceso"; // Return to field process
      updates.porcentajeAvance = Math.max(ot.porcentajeAvance, 25); // At least 25% done
      
      const solveComment = {
        autor: "Coordinador de Instalaciones",
        autorEmail: currentUserEmail,
        fecha: nowStr,
        comentario: `✓ Escalamiento a ODC RESUELTO. La obra civil o impedimento físico fue solucionado. OT regresa a campo (En proceso).`,
      };
      updates.comentarios = [...updatedComments, solveComment];
    }

    try {
      await onUpdateOT(otId, updates);
      alert(`Estado de escalamiento para ${otId} actualizado a ${newOdcStatus}.`);
    } catch (err: any) {
      alert("Error al actualizar estado de escalamiento: " + err.message);
    }
  };

  return (
    <div className="space-y-4" id="escalations-odc-view">
      
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-800 font-sans">Escalamientos a Obra de Cable & ODC (Miguel)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Control y seguimiento de instalaciones bloqueadas que requieren intervención externa de planta externa, obra civil o permisos especiales. Corresponde a la hoja <strong>ESCALAMIENTOS A ODC</strong>.
          </p>
        </div>
        <div className="text-xs font-mono text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg font-bold">
          Prioridad: ALTA OPERATIVA
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Total Escaladas */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Total Escalamientos</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">{totalEscalations} OTs</h3>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Bajo revisión de Obra de Cable (Miguel)</p>
        </div>

        {/* Pending ODC */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl" />
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Pendientes de Análisis</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingOdc} OTs</h3>
          <p className="text-[10px] text-rose-600 mt-1.5 font-semibold">Requieren atención inmediata</p>
        </div>

        {/* In review / programados */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">En Diseño / Programadas</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{inReviewOdc + scheduledOdc} OTs</h3>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Con solución o estudio en curso</p>
        </div>

        {/* Resueltas */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Solucionadas (Histórico)</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{solvedOdc} OTs</h3>
          <p className="text-[10px] text-emerald-600 mt-1.5 font-semibold flex items-center gap-0.5">
            <span>✓</span> Retornadas a campo con éxito
          </p>
        </div>
      </div>

      {/* Split layout: Escalate Form and Escalations List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Form panel */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm h-fit space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" /> Escalar OT a ODC
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Transfiera una OT a revisión técnica de planta externa.</p>
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

          <form onSubmit={handleEscalateSubmit} className="space-y-3.5 text-xs">
            {/* OT Selection */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Seleccionar OT Elegible</label>
              <select
                value={selectedOtId}
                onChange={(e) => setSelectedOtId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded px-2.5 py-1.5 text-slate-800 outline-none transition cursor-pointer"
              >
                <option value="">-- Seleccionar instalación --</option>
                {availableToEscalate.map((ot) => (
                  <option key={ot.ot} value={ot.ot}>
                    {ot.ot} - {ot.cliente} ({ot.ciudad})
                  </option>
                ))}
              </select>
            </div>

            {/* Motivo dropdown */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Motivo de Escalamiento</label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded px-2.5 py-1.5 text-slate-800 outline-none transition cursor-pointer"
              >
                <option value="Postes sin canalización (Obra Civil)">Postes sin canalización / Obra Civil</option>
                <option value="Caja de distribución saturada (Sin puertos)">Caja saturada (Sin puertos disponibles)</option>
                <option value="Autorización rechazada por Administración">Rechazo de Administración / Co-propietarios</option>
                <option value="Se requiere poda de árboles o redes eléctricas">Poda o redes de alta tensión bloqueando</option>
                <option value="Distancia excede límite de última milla (> 300m)">Distancia excede límite de última milla</option>
                <option value="Otros">Otro motivo...</option>
              </select>
            </div>

            {motivo === "Otros" && (
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Especifique Motivo</label>
                <input
                  type="text"
                  value={customMotivo}
                  onChange={(e) => setCustomMotivo(e.target.value)}
                  placeholder="Ej. Problema de canalización subterránea..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 outline-none transition"
                />
              </div>
            )}

            {/* Comments */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Detalles / Diagnóstico Técnico</label>
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Describa el bloqueo físico detalladamente..."
                required
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 outline-none transition resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-sans font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition duration-150 cursor-pointer"
            >
              <span>Escalar e Iniciar Flujo ODC</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Timeline Info (T.ES concept) */}
          <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px] text-slate-500">
            <h5 className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" /> SLA de Escalamiento (T.ES)
            </h5>
            <p className="leading-relaxed">
              El tiempo de escalamiento se calcula desde la fecha de apertura en ODC hasta su resolución. El objetivo operativo es resolver bloqueos en un máximo de <strong className="text-slate-700">7 días calendario</strong>.
            </p>
          </div>

        </div>

        {/* List table panel */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm lg:col-span-2 space-y-3">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <List className="w-4 h-4 text-rose-600" /> OTs Escaladas a ODC / Pendientes
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Listado de órdenes en estado de Soporte esperando liberación física.</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-rose-50 px-2 py-0.5 border border-rose-200 rounded font-bold">
              {escalatedOts.length} Activas
            </span>
          </div>

          <div className="overflow-x-auto">
            {escalatedOts.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">No hay OTs en escalamiento o soporte actualmente. ¡Excelente!</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase bg-slate-50/50">
                    <th className="py-2.5 px-3">OT / Cliente</th>
                    <th className="py-2.5 px-3">Motivo del Bloqueo</th>
                    <th className="py-2.5 px-3">Fecha Esc.</th>
                    <th className="py-2.5 px-3">Estado ODC</th>
                    <th className="py-2.5 px-3 text-center">Acciones Operativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {escalatedOts.map((ot) => {
                    // Calculate days in escalation
                    const escDate = ot.fechaEscalamientoOdc ? new Date(ot.fechaEscalamientoOdc) : new Date(ot.createdAt);
                    const daysInEsc = Math.max(0, Math.floor((Date.now() - escDate.getTime()) / (1000 * 60 * 60 * 24)));
                    
                    return (
                      <tr key={ot.ot} className="hover:bg-slate-50/50 text-slate-700">
                        <td className="py-3 px-3 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-rose-800 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded text-[11px]">
                              {ot.ot}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">({ot.ciudad})</span>
                          </div>
                          <p className="font-semibold text-slate-900 truncate max-w-[140px]" title={ot.cliente}>
                            {ot.cliente}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              {ot.motivoEscalamientoOdc || "No especificado"}
                            </p>
                            <p className="text-[10px] text-slate-500 italic truncate max-w-[200px]" title={ot.comentariosOdc || ""}>
                              "{ot.comentariosOdc || "Sin comentarios."}"
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <div className="space-y-0.5">
                            <p>{escDate.toLocaleDateString("es-ES")}</p>
                            <span className={`inline-block text-[9px] font-bold px-1 rounded ${
                              daysInEsc > 7 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              Hace {daysInEsc} {daysInEsc === 1 ? "día" : "días"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={ot.estadoEscalamientoOdc || "Pendiente"}
                            onChange={(e) => handleUpdateStatus(ot.ot, e.target.value as any)}
                            className={`px-2 py-1 rounded text-[11px] font-bold outline-none cursor-pointer border ${
                              ot.estadoEscalamientoOdc === "Solucionado" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : ot.estadoEscalamientoOdc === "Programado"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : ot.estadoEscalamientoOdc === "En revisión"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En revisión">En revisión</option>
                            <option value="Programado">Programado</option>
                            <option value="Solucionado">Solucionado (✓)</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleUpdateStatus(ot.ot, "Solucionado")}
                            disabled={ot.estadoEscalamientoOdc === "Solucionado"}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded font-sans font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span>Solucionar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
