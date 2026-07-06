import React from "react";
import { Instalacion } from "../types";
import { CheckCircle2, Award, Clock, ArrowDownToLine, Star, Zap, Gauge } from "lucide-react";

interface ExecutedReportProps {
  instalaciones: Instalacion[];
}

export const ExecutedReport: React.FC<ExecutedReportProps> = ({ instalaciones }) => {
  // Only executed installations
  const executedOts = instalaciones.filter((ot) => ot.estado === "Ejecutada");

  // Calculations
  const totalExecuted = executedOts.length;

  // SLA Compliance (delivered on or before target days)
  let onTimeCount = 0;
  let totalDays = 0;
  let fastestDays = 999;

  executedOts.forEach((ot) => {
    const start = new Date(ot.fechaOt).getTime();
    const end = new Date(ot.updatedAt).getTime();
    const durationDays = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    
    totalDays += durationDays;
    
    if (durationDays < fastestDays) {
      fastestDays = durationDays;
    }

    if (durationDays <= ot.diasObjetivo) {
      onTimeCount++;
    }
  });

  const avgExecutionDays = totalExecuted > 0 ? (totalDays / totalExecuted).toFixed(1) : "0";
  const complianceRate = totalExecuted > 0 ? ((onTimeCount / totalExecuted) * 100).toFixed(0) : "0";
  const resolvedFastest = fastestDays === 999 ? "0" : fastestDays;

  // CSV Export helper
  const handleExportCSV = () => {
    if (executedOts.length === 0) {
      alert("No hay registros ejecutados para exportar.");
      return;
    }

    // Define CSV columns
    const headers = [
      "OT",
      "CS_CRM",
      "Cliente",
      "Subcliente",
      "Tecnologia",
      "BW",
      "Ciudad",
      "Direccion",
      "Fecha_OT",
      "Fecha_Ejecucion",
      "Dias_Objetivo",
      "Dias_Transcurridos",
      "SLA_Estado"
    ];

    const rows = executedOts.map((ot) => {
      const start = new Date(ot.fechaOt).getTime();
      const end = new Date(ot.updatedAt).getTime();
      const durationDays = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      const slaState = durationDays <= ot.diasObjetivo ? "CUMPLIDO" : "VENCIDO";

      return [
        ot.ot,
        ot.ordenCs,
        `"${ot.cliente.replace(/"/g, '""')}"`,
        `"${(ot.subcliente || "").replace(/"/g, '""')}"`,
        ot.productoTecnologia,
        ot.bwCapacidad,
        ot.ciudad,
        `"${ot.direccion.replace(/"/g, '""')}"`,
        new Date(ot.fechaOt).toLocaleDateString("es-ES"),
        new Date(ot.updatedAt).toLocaleDateString("es-ES"),
        ot.diasObjetivo,
        durationDays,
        slaState
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Instalaciones_Ejecutadas_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4" id="executed-report-view">
      
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800 font-sans">Reporte de Instalaciones Ejecutadas (Miguel)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditoría de niveles de servicio (SLA) y tiempos de entrega de órdenes finalizadas. Corresponde a las hojas de Excel <strong>EJECUTADAS (MIGUEL)</strong> y métricas de <strong>T.EJE</strong>.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow transition duration-150 shrink-0"
        >
          <ArrowDownToLine className="w-4 h-4 text-white" />
          <span>Exportar a CSV / Excel</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Total Ejecutadas */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Total OTs Entregadas</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalExecuted} OTs</h3>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Facturadas y operativas en campo</p>
        </div>

        {/* SLA Compliance */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Cumplimiento de SLA</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{complianceRate}%</h3>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${complianceRate}%` }} />
          </div>
        </div>

        {/* Average Delivery Time */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Tiempo Medio de Entrega</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{avgExecutionDays} días</h3>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Desde asignación inicial a firma acta</p>
        </div>

        {/* Fastest Delivery */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-full blur-xl" />
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Despliegue más Rápido</p>
          <h3 className="text-2xl font-bold text-sky-600 mt-1">{resolvedFastest} {resolvedFastest === 1 ? "día" : "días"}</h3>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Récord operativo en zona norte</p>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
        <div className="border-b border-slate-100 pb-2">
          <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-600" /> Historial Operativo de Entregas (Norte 1)
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Auditoría detallada de cada orden finalizada con sus respectivos tiempos reales de ejecución.</p>
        </div>

        <div className="overflow-x-auto">
          {executedOts.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-mono">No hay registros ejecutados en la base de datos.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase bg-slate-50/50">
                  <th className="py-2.5 px-3">OT / CS</th>
                  <th className="py-2.5 px-3">Cliente / Sede</th>
                  <th className="py-2.5 px-3">Tecnología</th>
                  <th className="py-2.5 px-3 text-center">Fases Completadas</th>
                  <th className="py-2.5 px-3">Fecha OT</th>
                  <th className="py-2.5 px-3">Fecha Ejecutado</th>
                  <th className="py-2.5 px-3 text-right">T. Ejecución</th>
                  <th className="py-2.5 px-3 text-center">SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {executedOts.map((ot) => {
                  const start = new Date(ot.fechaOt).getTime();
                  const end = new Date(ot.updatedAt).getTime();
                  const durationDays = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
                  const isSlaCompliant = durationDays <= ot.diasObjetivo;

                  return (
                    <tr key={ot.ot} className="hover:bg-slate-50/50 text-slate-700 font-medium">
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <p className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded text-[11px] w-fit">
                            {ot.ot}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{ot.ordenCs}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">{ot.cliente}</p>
                          <p className="text-[10px] text-slate-500">{ot.direccion}, {ot.ciudad}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-bold">
                        {ot.productoTecnologia}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {ot.productoTecnologia === "Starlink" ? (
                            <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              Montaje Antena (✓)
                            </span>
                          ) : (
                            <>
                              <span className="text-[9px] bg-sky-50 text-sky-700 px-1 rounded border border-sky-100">Enr (✓)</span>
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 rounded border border-indigo-100">Ext (✓)</span>
                              <span className="text-[9px] bg-purple-50 text-purple-700 px-1 rounded border border-purple-100">Int (✓)</span>
                              <span className="text-[9px] bg-amber-50 text-amber-700 px-1 rounded border border-amber-100">Eqp (✓)</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {new Date(ot.fechaOt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {new Date(ot.updatedAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-950">{durationDays} {durationDays === 1 ? "día" : "días"}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Objetivo: {ot.diasObjetivo}d</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase border ${
                          isSlaCompliant 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {isSlaCompliant ? "CUMPLIDO" : "VENCIDO"}
                        </span>
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
  );
};
