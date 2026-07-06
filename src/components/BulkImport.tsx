import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Play, HelpCircle } from "lucide-react";
import { Instalacion, Tecnologia } from "../types";

interface BulkImportProps {
  onImport: (items: Partial<Instalacion>[]) => Promise<number>;
  currentUserEmail: string;
}

interface ParsedRow {
  ot: string;
  cliente: string;
  productoTecnologia: Tecnologia;
  ordenCs: string;
  subcliente: string;
  bwCapacidad: string;
  zonal: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  coordenadas: string;
  diasObjetivo: number;
  isValid: boolean;
  errorMsg?: string;
}

export const BulkImport: React.FC<BulkImportProps> = ({ onImport, currentUserEmail }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [textPaste, setTextPaste] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const sampleCSV = `OT,OrdenCS,Cliente,Tecnologia,BW,Ciudad,Direccion,DiasObjetivo
OT-55101,CS-911024,Banco Atlantico,F.O.,200 Mbps,Bogota,Calle 100 #15-30,5
OT-55102,CS-911025,Clinica Santa Lucia,GPON,100 Mbps,Medellin,Calle 10 #43-20,5
OT-55103,CS-911026,Hacienda La Estrella,Starlink,220 Mbps,Popayan,Km 12 Via Oriente,7`;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const parseCSVContent = (content: string) => {
    try {
      const lines = content.split(/\r?\n/);
      if (lines.length < 2) {
        alert("El archivo o texto no contiene suficientes líneas (mínimo cabecera y una fila de datos).");
        return;
      }

      // Read header row
      const headerLine = lines[0].toLowerCase();
      const delimiter = headerLine.includes(";") ? ";" : ",";
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ""));

      // Match header positions
      const otIdx = headers.findIndex(h => h.includes("ot"));
      const clienteIdx = headers.findIndex(h => h.includes("client"));
      const techIdx = headers.findIndex(h => h.includes("tech") || h.includes("producto") || h.includes("tecnologia"));
      const csIdx = headers.findIndex(h => h.includes("cs") || h.includes("orden"));
      const subIdx = headers.findIndex(h => h.includes("sub"));
      const bwIdx = headers.findIndex(h => h.includes("bw") || h.includes("capacidad") || h.includes("ancho"));
      const zonalIdx = headers.findIndex(h => h.includes("zonal"));
      const deptIdx = headers.findIndex(h => h.includes("dept") || h.includes("departamento"));
      const ciudadIdx = headers.findIndex(h => h.includes("ciudad") || h.includes("city"));
      const dirIdx = headers.findIndex(h => h.includes("dir") || h.includes("direccion"));
      const coordIdx = headers.findIndex(h => h.includes("coord") || h.includes("lat"));
      const diasIdx = headers.findIndex(h => h.includes("dias") || h.includes("objetivo") || h.includes("sla"));

      const rows: ParsedRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty rows

        // Advanced cell splitter supporting quotes
        let cells: string[] = [];
        let insideQuotes = false;
        let currentCell = "";

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === delimiter && !insideQuotes) {
            cells.push(currentCell.trim().replace(/^"|"$/g, ""));
            currentCell = "";
          } else {
            currentCell += char;
          }
        }
        cells.push(currentCell.trim().replace(/^"|"$/g, ""));

        // Extract cells safely
        const otVal = otIdx >= 0 && cells[otIdx] ? cells[otIdx].trim() : "";
        const clientVal = clienteIdx >= 0 && cells[clienteIdx] ? cells[clienteIdx].trim() : "";
        let techVal = techIdx >= 0 && cells[techIdx] ? cells[techIdx].trim().toUpperCase() : "F.O.";
        
        // Normalize Tech Names
        if (techVal.includes("FIB") || techVal.includes("FO") || techVal === "F.O.") {
          techVal = "F.O.";
        } else if (techVal.includes("GPON") || techVal.includes("COMP")) {
          techVal = "GPON";
        } else if (techVal.includes("STAR") || techVal.includes("SAT")) {
          techVal = "Starlink";
        } else {
          techVal = "F.O."; // Default fallback
        }

        const csVal = csIdx >= 0 && cells[csIdx] ? cells[csIdx].trim() : "";
        const subVal = subIdx >= 0 && cells[subIdx] ? cells[subIdx].trim() : "";
        const bwVal = bwIdx >= 0 && cells[bwIdx] ? cells[bwIdx].trim() : "100 Mbps";
        const zonalVal = zonalIdx >= 0 && cells[zonalIdx] ? cells[zonalIdx].trim() : "Zonal Centro";
        const deptVal = deptIdx >= 0 && cells[deptIdx] ? cells[deptIdx].trim() : "Cundinamarca";
        const ciudadVal = ciudadIdx >= 0 && cells[ciudadIdx] ? cells[ciudadIdx].trim() : "Bogotá";
        const dirVal = dirIdx >= 0 && cells[dirIdx] ? cells[dirIdx].trim() : "No especificada";
        const coordVal = coordIdx >= 0 && cells[coordIdx] ? cells[coordIdx].trim() : "4.6097,-74.0817";
        const diasVal = diasIdx >= 0 && cells[diasIdx] ? Number(cells[diasIdx]) : 5;

        // Validations
        let isValid = true;
        let errorMsg = "";

        if (!otVal) {
          isValid = false;
          errorMsg = "OT es requerido.";
        } else if (!clientVal) {
          isValid = false;
          errorMsg = "Cliente es requerido.";
        }

        rows.push({
          ot: otVal.toUpperCase(),
          cliente: clientVal,
          productoTecnologia: techVal as Tecnologia,
          ordenCs: csVal,
          subcliente: subVal,
          bwCapacidad: bwVal,
          zonal: zonalVal,
          departamento: deptVal,
          ciudad: ciudadVal,
          direccion: dirVal,
          coordenadas: coordVal,
          diasObjetivo: isNaN(diasVal) ? 5 : diasVal,
          isValid,
          errorMsg,
        });
      }

      setParsedItems(rows);
      setImportStatus(null);
    } catch (err: any) {
      alert("Error parseando CSV: " + err.message);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseCSVContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseCSVContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTextSubmit = () => {
    if (!textPaste.trim()) {
      alert("Por favor, pegue un bloque de texto CSV válido.");
      return;
    }
    parseCSVContent(textPaste);
  };

  const handleExecuteImport = async () => {
    const validItems = parsedItems.filter(item => item.isValid);
    if (validItems.length === 0) {
      alert("No hay registros válidos para importar.");
      return;
    }

    setIsProcessing(true);
    setImportStatus(`Importando ${validItems.length} órdenes a Firestore...`);

    const finalUploads: Partial<Instalacion>[] = validItems.map(row => {
      const nowStr = new Date().toISOString();
      const initialFases: any = {};
      
      if (row.productoTecnologia === "F.O." || row.productoTecnologia === "GPON") {
        initialFases.enrutamientos = null;
        initialFases.tendidoExterno = null;
        initialFases.tendidoInterno = null;
        initialFases.instalacionEquipos = null;
      } else {
        initialFases.instalacionAntena = null;
      }

      return {
        ot: row.ot,
        ordenCs: row.ordenCs || `CS-${Math.floor(100000 + Math.random() * 900000)}`,
        cliente: row.cliente,
        subcliente: row.subcliente || undefined,
        productoTecnologia: row.productoTecnologia,
        bwCapacidad: row.bwCapacidad || "100 Mbps",
        zonal: row.zonal || "Zonal Centro",
        departamento: row.departamento || "Cundinamarca",
        ciudad: row.ciudad || "Bogotá",
        direccion: row.direccion || "No especificada",
        coordenadas: row.coordenadas || undefined,
        fechaOt: nowStr,
        fechaTentativaEntrega: new Date(Date.now() + row.diasObjetivo * 24 * 60 * 60 * 1000).toISOString(),
        diasObjetivo: row.diasObjetivo,
        semaforo: "Verde",
        cuadrilla: "",
        jefeZonal: "Coordinador Importaciones",
        gestor: "Importación Masiva",
        implementador: "",
        estado: "En programación",
        porcentajeAvance: 0,
        fasesFin: initialFases,
        comentarios: [
          {
            autor: "Importador de Excel",
            autorEmail: currentUserEmail,
            fecha: nowStr,
            comentario: "Orden cargada masivamente a la base de datos."
          }
        ],
        createdBy: "BULK_IMPORT"
      };
    });

    try {
      const importedCount = await onImport(finalUploads);
      setImportStatus(`¡Éxito! Se importaron ${importedCount} OTs exitosamente.`);
      setParsedItems([]);
      setTextPaste("");
    } catch (err: any) {
      setImportStatus(`Error al guardar datos: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4" id="bulk-import-module">
      
      {/* Module Title */}
      <div className="flex items-center justify-between border-b border-slate-150 pb-2">
        <div>
          <h3 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">Importador Masivo de Excel / CSV</h3>
          <p className="text-[11px] text-slate-500">Cargue cientos de instalaciones en segundos para el Backlog.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 shadow-sm cursor-pointer transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            {showHelp ? "Ocultar Guía" : "Ver Plantilla / Guía"}
          </button>
        </div>
      </div>

      {/* Guide/Template dropdown */}
      {showHelp && (
        <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs space-y-2 text-slate-700" id="import-guide">
          <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Especificación de Formato CSV / Excel
          </h4>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Asegúrese de que el archivo contenga las siguientes columnas en la primera fila. Puede usar delimitador de coma (<code className="text-sky-700">,</code>) o punto y coma (<code className="text-sky-700">;</code>). Las columnas obligatorias son **OT** y **Cliente**.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-600">
            <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
              <strong className="text-slate-800">OT (Obligatorio)</strong>: Código de orden único (ej. OT-82711).
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
              <strong className="text-slate-800">Cliente (Obligatorio)</strong>: Razón social o cliente (ej. Banco Nacional).
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
              <strong className="text-slate-800">Tecnologia</strong>: FO, F.O., GPON o Starlink (Opcional).
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
              <strong className="text-slate-800">DiasObjetivo</strong>: Cantidad de días del SLA (ej. 5, 7, 10).
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-slate-600 font-mono text-[10px]">Ejemplo de contenido copiable:</p>
            <pre className="bg-slate-900 p-2.5 rounded font-mono text-[9px] text-emerald-400 overflow-x-auto select-all">
              {sampleCSV}
            </pre>
          </div>
        </div>
      )}

      {/* TABS: Uploader vs Text Paste */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* DRAG AND DROP ZONE */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-sky-500 bg-sky-50"
              : "border-slate-300 hover:border-sky-500/50 bg-slate-50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          id="import-dragzone"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv, .txt"
            className="hidden"
          />
          <div className="p-2.5 bg-sky-100 rounded-full border border-sky-200 mb-2">
            <Upload className="w-5 h-5 text-sky-600" />
          </div>
          <h4 className="text-xs font-sans font-bold text-slate-800">Arrastre y suelte su archivo CSV</h4>
          <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs">
            O haga clic para examinar archivos de su ordenador (.csv, .txt)
          </p>
        </div>

        {/* TEXT-PASTE MÓDULO */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col justify-between" id="import-paste-zone">
          <div className="space-y-2">
            <h4 className="text-[10px] font-sans font-bold uppercase text-slate-600">Pegar Copia Directa de Celdas (CSV)</h4>
            <textarea
              value={textPaste}
              onChange={(e) => setTextPaste(e.target.value)}
              placeholder="OT,OrdenCS,Cliente,Tecnologia,BW,Ciudad,Direccion,DiasObjetivo&#10;OT-88210,CS-20194,Hotel Plaza,GPON,300M,Bogota,Calle 45 #8-10,5"
              rows={4}
              className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded p-2 text-[10px] font-mono text-slate-800 placeholder-slate-400 outline-none resize-none transition"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleTextSubmit}
              disabled={!textPaste.trim()}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 rounded text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <Play className="w-3 h-3 text-sky-600" /> Analizar Texto Pegado
            </button>
          </div>
        </div>

      </div>

      {/* PARSED TABLE PREVIEW */}
      {parsedItems.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white space-y-3 p-3 shadow-sm" id="import-preview-section">
          <div className="flex items-center justify-between border-b border-slate-150 pb-1.5">
            <h4 className="text-[11px] font-sans font-bold uppercase text-sky-700 flex items-center gap-1.5">
              <span>📊</span> Vista Previa del Análisis ({parsedItems.length} Registros Detectados)
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-semibold">
                Válidos: <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{parsedItems.filter(p => p.isValid).length}</strong> / 
                Inválidos: <strong className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">{parsedItems.filter(p => !p.isValid).length}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[200px] rounded border border-slate-100">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider bg-slate-50">
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3">Código OT</th>
                  <th className="py-2 px-3">Cliente</th>
                  <th className="py-2 px-3">Tecnología</th>
                  <th className="py-2 px-3">Ciudad</th>
                  <th className="py-2 px-3">SLA (Días)</th>
                  <th className="py-2 px-3">Detalle / Error</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 text-slate-700 align-middle">
                    <td className="py-1.5 px-3">
                      {item.isValid ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Ok
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1 text-[10px]">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> Fallo
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{item.ot || "—"}</td>
                    <td className="py-1.5 px-3 font-medium">{item.cliente || "—"}</td>
                    <td className="py-1.5 px-3">
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold text-slate-600">
                        {item.productoTecnologia}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-500">{item.ciudad}</td>
                    <td className="py-1.5 px-3 font-mono text-slate-500">{item.diasObjetivo} días</td>
                    <td className="py-1.5 px-3">
                      {item.isValid ? (
                        <span className="text-[10px] text-slate-400">Correcto para importación</span>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-bold">{item.errorMsg}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleExecuteImport}
              disabled={isProcessing || parsedItems.filter(p => p.isValid).length === 0}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 font-sans font-semibold rounded text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition"
            >
              {isProcessing ? "Procesando..." : `Procesar e Importar ${parsedItems.filter(p => p.isValid).length} Registros`}
            </button>
          </div>
        </div>
      )}

      {/* IMPORT EXECUTION STATUS */}
      {importStatus && (
        <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg flex items-center gap-2.5 text-xs text-sky-800 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
          <span>{importStatus}</span>
        </div>
      )}
    </div>
  );
};
