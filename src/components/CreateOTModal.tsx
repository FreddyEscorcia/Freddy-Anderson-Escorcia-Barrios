import React, { useState, useEffect } from "react";
import { X, Network, MapPin, Calendar, Users, AlertCircle, Plus } from "lucide-react";
import { Tecnologia, EstadoOT, Instalacion, Cuadrilla } from "../types";

interface CreateOTModalProps {
  isOpen: boolean;
  onClose: () => void;
  cuadrillas: Cuadrilla[];
  onSubmit: (data: Partial<Instalacion>) => Promise<void>;
  currentUserEmail: string;
}

export const CreateOTModal: React.FC<CreateOTModalProps> = ({
  isOpen,
  onClose,
  cuadrillas,
  onSubmit,
  currentUserEmail,
}) => {
  const [ot, setOt] = useState("");
  const [ordenCs, setOrdenCs] = useState("");
  const [cliente, setCliente] = useState("");
  const [subcliente, setSubcliente] = useState("");
  const [productoTecnologia, setProductoTecnologia] = useState<Tecnologia>("F.O.");
  const [bwCapacidad, setBwCapacidad] = useState("100 Mbps");
  const [zonal, setZonal] = useState("Zonal Centro");
  const [departamento, setDepartamento] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [coordenadas, setCoordenadas] = useState("");
  const [fechaOt, setFechaOt] = useState(new Date().toISOString().substring(0, 10));
  const [diasObjetivo, setDiasObjetivo] = useState(5);
  const [fechaTentativaEntrega, setFechaTentativaEntrega] = useState("");
  const [cuadrilla, setCuadrilla] = useState("");
  const [jefeZonal, setJefeZonal] = useState("");
  const [gestor, setGestor] = useState("");
  const [implementador, setImplementador] = useState("");
  const [estado, setEstado] = useState<EstadoOT>("En programación");
  const [comentarioInicial, setComentarioInicial] = useState("");
  
  // GPON specific state
  const [cajaTieneSplitter, setCajaTieneSplitter] = useState(false);

  // Auto-calculate target date
  useEffect(() => {
    if (fechaOt && diasObjetivo) {
      const baseDate = new Date(fechaOt);
      baseDate.setDate(baseDate.getDate() + Number(diasObjetivo));
      setFechaTentativaEntrega(baseDate.toISOString().substring(0, 10));
    }
  }, [fechaOt, diasObjetivo]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ot || !cliente || !productoTecnologia) {
      alert("Por favor, complete los campos obligatorios: OT, Cliente y Tecnología.");
      return;
    }

    const selectedCuadrillaObj = cuadrillas.find((c) => c.id === cuadrilla);

    // Dynamic initial progress percentage based on technology
    let initialProgress = 0;
    const initialFases: any = {};

    if (productoTecnologia === "F.O.") {
      initialFases.enrutamientos = null;
      initialFases.tendidoExterno = null;
      initialFases.tendidoInterno = null;
      initialFases.instalacionEquipos = null;
    } else if (productoTecnologia === "GPON") {
      initialFases.cajaTieneSplitter = cajaTieneSplitter;
      if (cajaTieneSplitter) {
        // Automatically completes Phase 1 (Enrutamientos)
        initialFases.enrutamientos = new Date().toISOString();
        initialProgress = 25; // 1 out of 4 phases completed
      } else {
        initialFases.enrutamientos = null;
      }
      initialFases.tendidoExterno = null;
      initialFases.tendidoInterno = null;
      initialFases.instalacionEquipos = null;
    } else if (productoTecnologia === "Starlink") {
      initialFases.instalacionAntena = null;
    }

    const newOT: Partial<Instalacion> = {
      ot: ot.trim().toUpperCase(),
      ordenCs: ordenCs.trim() || `CS-${Math.floor(100000 + Math.random() * 900000)}`,
      cliente: cliente.trim(),
      subcliente: subcliente.trim() || undefined,
      productoTecnologia,
      bwCapacidad,
      zonal,
      departamento: departamento.trim() || "Cundinamarca",
      ciudad: ciudad.trim() || "Bogotá",
      direccion: direccion.trim() || "No especificada",
      coordenadas: coordenadas.trim() || undefined,
      fechaOt: new Date(fechaOt).toISOString(),
      fechaTentativaEntrega: new Date(fechaTentativaEntrega).toISOString(),
      diasObjetivo: Number(diasObjetivo),
      semaforo: "Verde",
      cuadrilla,
      cuadrillaNombre: selectedCuadrillaObj?.nombre || "",
      jefeZonal: jefeZonal.trim() || "Coordinador General",
      gestor: gestor.trim() || "Gestor Web",
      implementador: implementador.trim() || selectedCuadrillaObj?.integrantes.split("(")[0].trim() || "",
      estado,
      porcentajeAvance: initialProgress,
      fasesFin: initialFases,
      comentarios: comentarioInicial.trim()
        ? [
            {
              autor: "Coordinador",
              autorEmail: currentUserEmail,
              fecha: new Date().toISOString(),
              comentario: comentarioInicial.trim()
            }
          ]
        : []
    };

    try {
      await onSubmit(newOT);
      onClose();
      // Reset state
      setOt("");
      setOrdenCs("");
      setCliente("");
      setSubcliente("");
      setBwCapacidad("100 Mbps");
      setDepartamento("");
      setCiudad("");
      setDireccion("");
      setCoordenadas("");
      setCuadrilla("");
      setJefeZonal("");
      setGestor("");
      setImplementador("");
      setComentarioInicial("");
      setCajaTieneSplitter(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" id="create-ot-modal">
      <div className="bg-white border border-slate-250 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-sans font-bold text-slate-800 uppercase tracking-wider">Ingresar Nueva Orden de Trabajo (OT)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-150 text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
          
          {/* Sección 1: Datos Generales */}
          <div className="space-y-3">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Network className="w-3.5 h-3.5" /> 1. Datos Generales de la OT
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Código OT *</label>
                <input
                  type="text"
                  required
                  value={ot}
                  onChange={(e) => setOt(e.target.value)}
                  placeholder="Ej. OT-20394"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Número Orden CS</label>
                <input
                  type="text"
                  value={ordenCs}
                  onChange={(e) => setOrdenCs(e.target.value)}
                  placeholder="Ej. CS-982103"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Tecnología / Producto *</label>
                <select
                  value={productoTecnologia}
                  onChange={(e) => setProductoTecnologia(e.target.value as Tecnologia)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 outline-none cursor-pointer transition"
                >
                  <option value="F.O.">Fibra Óptica (F.O.)</option>
                  <option value="GPON">GPON (Fibra Compartida)</option>
                  <option value="Starlink">Starlink (Satelital)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Cliente *</label>
                <input
                  type="text"
                  required
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nombre o Razón Social de la empresa"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Ancho de Banda / Capacidad</label>
                <input
                  type="text"
                  value={bwCapacidad}
                  onChange={(e) => setBwCapacidad(e.target.value)}
                  placeholder="Ej. 300 Mbps, 1 Gbps Dedicado"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Subcliente (Sede / Sucursal)</label>
                <input
                  type="text"
                  value={subcliente}
                  onChange={(e) => setSubcliente(e.target.value)}
                  placeholder="Ej. Sede Norte, Planta 2"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              {/* Lógica condicional GPON */}
              {productoTecnologia === "GPON" && (
                <div className="flex items-center gap-2 bg-sky-50 border border-sky-100 p-2.5 rounded self-end h-[34px]">
                  <input
                    type="checkbox"
                    id="splitter_check"
                    checked={cajaTieneSplitter}
                    onChange={(e) => setCajaTieneSplitter(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 bg-white focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="splitter_check" className="text-[11px] font-sans text-slate-700 cursor-pointer font-medium">
                    La caja de última milla ya tiene Splitter (Auto-completar Enrutamiento)
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Sección 2: Ubicación */}
          <div className="space-y-3">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <MapPin className="w-3.5 h-3.5" /> 2. Ubicación y Georreferenciación
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Zonal</label>
                <select
                  value={zonal}
                  onChange={(e) => setZonal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 outline-none cursor-pointer transition"
                >
                  <option value="Zonal Centro">Zonal Centro</option>
                  <option value="Zonal Noroccidente">Zonal Noroccidente</option>
                  <option value="Zonal Suroccidente">Zonal Suroccidente</option>
                  <option value="Zonal Norte">Zonal Norte</option>
                  <option value="Zonal Oriente">Zonal Oriente</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Departamento</label>
                <input
                  type="text"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  placeholder="Ej. Antioquia, Cundinamarca"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Ciudad</label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej. Medellín, Cali"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Coordenadas Lat,Long</label>
                <input
                  type="text"
                  value={coordenadas}
                  onChange={(e) => setCoordenadas(e.target.value)}
                  placeholder="Ej. 4.6562,-74.0560"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-sans font-semibold text-slate-600">Dirección de Instalación</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Dirección exacta del cliente"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
              />
            </div>
          </div>

          {/* Sección 3: Fechas y Asignación */}
          <div className="space-y-3">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Calendar className="w-3.5 h-3.5" /> 3. Tiempos, SLA y Asignación
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Fecha de OT</label>
                <input
                  type="date"
                  value={fechaOt}
                  onChange={(e) => setFechaOt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Días Objetivo (SLA)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={diasObjetivo}
                  onChange={(e) => setDiasObjetivo(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Fecha Tentativa de Entrega</label>
                <input
                  type="date"
                  disabled
                  value={fechaTentativaEntrega}
                  className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-500 outline-none font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Asignar Cuadrilla</label>
                <select
                  value={cuadrilla}
                  onChange={(e) => setCuadrilla(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 outline-none cursor-pointer transition"
                >
                  <option value="">Seleccionar Cuadrilla...</option>
                  {cuadrillas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Jefe Zonal</label>
                <input
                  type="text"
                  value={jefeZonal}
                  onChange={(e) => setJefeZonal(e.target.value)}
                  placeholder="Ej. Ing. Laura Restrepo"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Gestor</label>
                <input
                  type="text"
                  value={gestor}
                  onChange={(e) => setGestor(e.target.value)}
                  placeholder="Ej. Andrés Silva"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-sans font-semibold text-slate-600">Estado Inicial</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoOT)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 outline-none cursor-pointer transition"
                >
                  <option value="En programación">En programación</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Soporte">Soporte</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección 4: Observaciones */}
          <div className="space-y-3">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <AlertCircle className="w-3.5 h-3.5" /> 4. Observación Inicial o Comentarios
            </h4>
            
            <div className="space-y-1">
              <label className="text-[11px] font-sans font-semibold text-slate-600">Comentario Inicial de Arranque</label>
              <textarea
                value={comentarioInicial}
                onChange={(e) => setComentarioInicial(e.target.value)}
                placeholder="Indique detalles iniciales sobre la viabilidad, materiales solicitados, u otras precisiones..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none resize-none transition"
              />
            </div>
          </div>

          {/* Footer buttons inside modal body to scroll with form */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded text-xs font-sans font-semibold text-slate-600 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-sans font-semibold rounded text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white" /> Guardar OT
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
