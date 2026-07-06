import React, { useState } from "react";
import { Terminal, Copy, Check, Send, AlertTriangle, Code2 } from "lucide-react";

interface WebhookInfoProps {
  appUrl: string;
}

export const WebhookInfo: React.FC<WebhookInfoProps> = ({ appUrl }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  
  // Interactive simulator states
  const [testOt, setTestOt] = useState(`OT-API-${Math.floor(10000 + Math.random() * 90000)}`);
  const [testClient, setTestClient] = useState("Hospital Metropolitano");
  const [testTech, setTestTech] = useState("GPON");
  const [testCs, setTestCs] = useState("CS-776102");
  const [testBw, setTestBw] = useState("400 Mbps");
  const [testCity, setTestCity] = useState("Cali");
  const [testDir, setTestDir] = useState("Avenida 4N #23-45");
  
  const [simResponse, setSimResponse] = useState<any | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const resolvedAppUrl = appUrl || window.location.origin;
  const webhookUrl = `${resolvedAppUrl}/api/webhook/ot`;
  const defaultApiKey = "genesis-secret-key-123";

  const curlCommand = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${defaultApiKey}" \\
  -d '{
    "ot": "${testOt}",
    "ordenCs": "${testCs}",
    "cliente": "${testClient}",
    "productoTecnologia": "${testTech}",
    "bwCapacidad": "${testBw}",
    "ciudad": "${testCity}",
    "direccion": "${testDir}",
    "diasObjetivo": 5
  }'`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runWebhookSimulation = async () => {
    setSimLoading(true);
    setSimResponse(null);
    try {
      const response = await fetch("/api/webhook/ot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": defaultApiKey
        },
        body: JSON.stringify({
          ot: testOt,
          ordenCs: testCs,
          cliente: testClient,
          productoTecnologia: testTech,
          bwCapacidad: testBw,
          ciudad: testCity,
          direccion: testDir,
          diasObjetivo: 5,
          fasesFin: testTech === "GPON" ? { cajaTieneSplitter: true } : {}
        })
      });

      const result = await response.json();
      setSimResponse(result);
      if (response.ok) {
        // Generate new OT ID for next test
        setTestOt(`OT-API-${Math.floor(10000 + Math.random() * 90000)}`);
      }
    } catch (err: any) {
      setSimResponse({ success: false, error: err.message || "Failed to contact Express Server." });
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4" id="webhook-api-module">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-150 pb-2">
        <div>
          <h3 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">Integración vía API / Webhook (Génesis CRM)</h3>
          <p className="text-[11px] text-slate-500">Conecte su sistema de despacho o CRM para ingresar OTs automáticamente en tiempo real.</p>
        </div>
        <span className="px-1.5 py-0.5 text-[9px] font-mono bg-sky-50 border border-sky-100 text-sky-700 rounded font-bold">
          API v1.0 Live
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* API Specification */}
        <div className="space-y-3" id="api-spec">
          <h4 className="text-xs font-sans font-bold text-slate-800 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-sky-600" /> Especificación Técnica de Endpoint
          </h4>

          <div className="space-y-2 text-xs">
            {/* Method & URL */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <p className="text-slate-500 font-mono text-[10px] font-bold uppercase">POST Endpoint:</p>
              <div className="flex items-center gap-2">
                <span className="bg-sky-600 text-white px-1.5 py-0.5 rounded font-mono font-bold text-[9px]">
                  POST
                </span>
                <code className="text-emerald-700 break-all select-all font-mono font-semibold text-[11px]">
                  {webhookUrl}
                </code>
              </div>
            </div>

            {/* Headers */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <p className="text-slate-500 font-mono text-[10px] font-bold uppercase">Encabezados obligatorios (Headers):</p>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600 font-semibold">Content-Type</span>
                  <span className="text-slate-500 font-medium">application/json</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-600 font-semibold">x-api-key</span>
                  <div className="flex items-center gap-1">
                    <code className="text-emerald-700 bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px] font-bold">{defaultApiKey}</code>
                    <button
                      onClick={() => copyToClipboard(defaultApiKey, setCopiedKey)}
                      className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payload description */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <p className="text-slate-500 font-mono text-[10px] font-bold uppercase">Campos del JSON:</p>
              <ul className="space-y-1 font-mono text-[10px] text-slate-600">
                <li>• <strong className="text-slate-800">ot</strong>: <span className="text-sky-700">string</span> - Código único de OT</li>
                <li>• <strong className="text-slate-800">cliente</strong>: <span className="text-sky-700">string</span> - Nombre del cliente</li>
                <li>• <strong className="text-slate-800">productoTecnologia</strong>: <span className="text-sky-700">string</span> - "F.O.", "GPON", o "Starlink"</li>
                <li>• <strong className="text-slate-800">ordenCs</strong>: <span className="text-slate-500">string</span> - Código del CRM (Opcional)</li>
                <li>• <strong className="text-slate-800">bwCapacidad</strong>: <span className="text-slate-500">string</span> - Ancho de banda (Opcional)</li>
                <li>• <strong className="text-slate-800">ciudad</strong>: <span className="text-slate-500">string</span> - Ciudad de instalación (Opcional)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CURL generator and copy */}
        <div className="space-y-3" id="api-curl-panel">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-sans font-bold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-600" /> Comando cURL para Pruebas
            </h4>
            <button
              onClick={() => copyToClipboard(curlCommand, setCopiedCurl)}
              className="flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-slate-950 bg-white border border-slate-200 rounded text-xs cursor-pointer transition shadow-xs"
            >
              {copiedCurl ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Copiar cURL</span>
                </>
              )}
            </button>
          </div>
          <pre className="bg-slate-900 border border-slate-800 p-3 rounded font-mono text-[9px] text-emerald-400 leading-relaxed overflow-x-auto h-[160px] whitespace-pre-wrap select-all">
            {curlCommand}
          </pre>
        </div>

      </div>

      {/* INTERACTIVE WEBHOOK SIMULATOR */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-3 shadow-sm" id="api-simulator">
        <h4 className="text-[11px] font-sans font-bold uppercase text-sky-700 flex items-center gap-1.5">
          <span>⚡</span> Simulador Interactivo de CRM Génesis (Pruébelo en Vivo)
        </h4>
        <p className="text-[11px] text-slate-500">
          Modifique los valores abajo y presione "Enviar Solicitud Webhook" para enviar una solicitud POST real a nuestro servidor local Express y verificar la respuesta e inserción inmediata en Firestore.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Código OT</label>
            <input
              type="text"
              value={testOt}
              onChange={(e) => setTestOt(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded px-2 py-1 text-xs text-slate-850 outline-none transition"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Cliente</label>
            <input
              type="text"
              value={testClient}
              onChange={(e) => setTestClient(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded px-2 py-1 text-xs text-slate-850 outline-none transition"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Tecnología</label>
            <select
              value={testTech}
              onChange={(e) => setTestTech(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded px-2 py-1 text-xs text-slate-850 outline-none cursor-pointer transition"
            >
              <option value="F.O.">F.O.</option>
              <option value="GPON">GPON</option>
              <option value="Starlink">Starlink</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Ciudad</label>
            <input
              type="text"
              value={testCity}
              onChange={(e) => setTestCity(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded px-2 py-1 text-xs text-slate-850 outline-none transition"
            />
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-slate-200 pt-3">
          <div className="flex-1">
            {simResponse && (
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${simResponse.success ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                  <span className="text-[9px] font-mono text-slate-400">
                    Servidor Express - Código de Respuesta: {simResponse.success ? "201 Created" : "Error"}
                  </span>
                </div>
                <pre className="font-mono text-[9px] text-sky-300 overflow-x-auto whitespace-pre-wrap max-h-[100px]">
                  {JSON.stringify(simResponse, null, 2)}
                </pre>
              </div>
            )}
            {!simResponse && (
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Simulador listo. Presione el botón a la derecha para disparar la llamada.</span>
              </div>
            )}
          </div>
          <button
            onClick={runWebhookSimulation}
            disabled={simLoading}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-sans font-bold rounded text-xs flex items-center gap-1 cursor-pointer self-start transition shadow-xs"
          >
            <Send className="w-3 h-3 text-white" />
            {simLoading ? "Simulando..." : "Enviar Solicitud Webhook"}
          </button>
        </div>

      </div>
    </div>
  );
};
