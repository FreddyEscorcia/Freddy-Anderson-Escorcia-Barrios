import React from "react";
import { AlertTriangle, Clock, MapPin, Eye, ExternalLink, MessageSquare, ShieldAlert } from "lucide-react";
import { Instalacion } from "../types";

interface OTTableListProps {
  instalaciones: Instalacion[];
  onSelectOT: (ot: Instalacion) => void;
}

export const OTTableList: React.FC<OTTableListProps> = ({
  instalaciones,
  onSelectOT,
}) => {

  const getSlaBadge = (ot: Instalacion) => {
    if (ot.estado === "Ejecutada") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] text-emerald-700 font-semibold">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Entregada
        </span>
      );
    }

    const timeDiff = new Date(ot.fechaTentativaEntrega).getTime() - Date.now();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 border border-rose-200 rounded text-[9px] text-rose-700 font-semibold" title={`Vencida por ${Math.abs(daysDiff)} días`}>
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> Vencida ({Math.abs(daysDiff)} d)
        </span>
      );
    } else if (daysDiff <= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-700 font-semibold" title={`Cerca de vencer: ${daysDiff} días restantes`}>
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Próxima ({daysDiff} d)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 border border-sky-200 rounded text-[9px] text-sky-700 font-semibold" title={`${daysDiff} días restantes`}>
          <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" /> Al día ({daysDiff} d)
        </span>
      );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-3" id="ot-table-list-module">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">Base de Datos Centralizada de OTs</h3>
          <p className="text-[11px] text-slate-500">Total de registros filtrados: {instalaciones.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-mono bg-slate-50/70 text-[10px] uppercase font-bold tracking-wider">
              <th className="py-2.5 px-3">Código OT</th>
              <th className="py-2.5 px-3">Cliente / Sede</th>
              <th className="py-2.5 px-3">Tecnología</th>
              <th className="py-2.5 px-3">Capacidad (BW)</th>
              <th className="py-2.5 px-3">Ciudad / Zonal</th>
              <th className="py-2.5 px-3">Cuadrilla Asignada</th>
              <th className="py-2.5 px-3">SLA (Semaforo)</th>
              <th className="py-2.5 px-3">Estado / Avance</th>
              <th className="py-2.5 px-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {instalaciones.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 font-mono">
                  No se encontraron órdenes de trabajo que coincidan con los filtros activos.
                </td>
              </tr>
            ) : (
              instalaciones.map((ot) => (
                <tr
                  key={ot.id}
                  className="border-b border-slate-100 hover:bg-slate-50 text-slate-700 transition duration-150 align-middle"
                >
                  {/* OT ID */}
                  <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {ot.ot}
                  </td>

                  {/* Cliente */}
                  <td className="py-2 px-3">
                    <p className="font-semibold text-slate-850">{ot.cliente}</p>
                    {ot.subcliente && <p className="text-[9px] text-slate-400 font-mono">{ot.subcliente}</p>}
                  </td>

                  {/* Tecnología Badge */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      ot.productoTecnologia === "F.O."
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : ot.productoTecnologia === "GPON"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {ot.productoTecnologia}
                    </span>
                  </td>

                  {/* BW */}
                  <td className="py-2 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {ot.bwCapacidad}
                  </td>

                  {/* Ciudad */}
                  <td className="py-2 px-3">
                    <p className="text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{ot.ciudad}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">{ot.zonal}</p>
                  </td>

                  {/* Cuadrilla */}
                  <td className="py-2 px-3 text-sky-700 font-semibold whitespace-nowrap">
                    {ot.cuadrillaNombre || (
                      <span className="text-rose-500 text-[10px] italic font-medium">¡Sin Asignar!</span>
                    )}
                  </td>

                  {/* SLA Color */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    {getSlaBadge(ot)}
                  </td>

                  {/* Estado / Avance */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        ot.estado === "Ejecutada"
                          ? "bg-emerald-500"
                          : ot.estado === "Soporte"
                          ? "bg-rose-500"
                          : ot.estado === "Cliente"
                          ? "bg-amber-500"
                          : "bg-sky-500"
                      }`} />
                      <span className="font-semibold text-slate-800 text-[11px]">{ot.estado}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-20 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden border border-slate-200/40">
                      <div
                        className="bg-sky-500 h-full rounded-full"
                        style={{ width: `${ot.porcentajeAvance}%` }}
                      />
                    </div>
                  </td>

                  {/* View Action */}
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => onSelectOT(ot)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-250 rounded text-xs font-semibold flex items-center gap-1 mx-auto cursor-pointer transition shadow-sm"
                    >
                      <Eye className="w-3 h-3" /> Inspeccionar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
