import React, { useState } from "react";
import { Instalacion, Cuadrilla, Gasto } from "../types";
import { DollarSign, Plus, FileSpreadsheet, Trash2, Calendar, User, List, PiggyBank, Briefcase } from "lucide-react";

interface ExpensesTrackerProps {
  instalaciones: Instalacion[];
  cuadrillas: Cuadrilla[];
  onUpdateOT: (otId: string, updatedFields: Partial<Instalacion>) => Promise<void>;
  currentUserEmail: string;
}

export const ExpensesTracker: React.FC<ExpensesTrackerProps> = ({
  instalaciones,
  cuadrillas,
  onUpdateOT,
  currentUserEmail,
}) => {
  // Local form state
  const [selectedOtId, setSelectedOtId] = useState("");
  const [concepto, setConcepto] = useState("Combustible");
  const [customConcepto, setCustomConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Collect all expenses from all OTs
  const allExpenses: (Gasto & { otId: string; cliente: string; cuadrillaNombre?: string })[] = [];
  
  instalaciones.forEach((ot) => {
    if (ot.gastos && Array.isArray(ot.gastos)) {
      ot.gastos.forEach((g) => {
        allExpenses.push({
          ...g,
          otId: ot.ot,
          cliente: ot.cliente,
          cuadrillaNombre: ot.cuadrillaNombre || cuadrillas.find((c) => c.id === ot.cuadrilla)?.nombre || "No asignada",
        });
      });
    }
  });

  // Sort expenses by date descending
  allExpenses.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Calculations for KPIs
  const totalIncurred = allExpenses.reduce((sum, g) => sum + g.monto, 0);
  const avgExpensePerOt = instalaciones.length > 0 ? totalIncurred / instalaciones.length : 0;
  
  // Expenses by Category
  const categorySplit: Record<string, number> = {
    Combustible: 0,
    Viáticos: 0,
    "Materiales adicionales": 0,
    Peajes: 0,
    Otros: 0,
  };

  allExpenses.forEach((g) => {
    const key = categorySplit[g.concepto] !== undefined ? g.concepto : "Otros";
    categorySplit[key] += g.monto;
  });

  // Active installations for select dropdown (non-anuladas)
  const activeOtsForSelect = instalaciones.filter((ot) => ot.estado !== "Anulada");

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!selectedOtId) {
      setErrorMsg("Debe seleccionar una Orden de Trabajo (OT).");
      return;
    }

    const numericMonto = parseFloat(monto);
    if (isNaN(numericMonto) || numericMonto <= 0) {
      setErrorMsg("Debe ingresar un monto válido mayor a cero.");
      return;
    }

    const ot = instalaciones.find((o) => o.ot === selectedOtId);
    if (!ot) {
      setErrorMsg("La OT seleccionada no existe.");
      return;
    }

    const finalConcept = concepto === "Otros" && customConcepto.trim() ? customConcepto.trim() : concepto;

    const newExpense: Gasto = {
      id: "EXP-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      fecha,
      concepto: finalConcept,
      monto: numericMonto,
      registradoPor: currentUserEmail,
    };

    const updatedExpenses = [...(ot.gastos || []), newExpense];

    try {
      await onUpdateOT(selectedOtId, { gastos: updatedExpenses });
      setSuccessMsg(`Gasto registrado con éxito en la OT ${selectedOtId}`);
      // Reset form
      setMonto("");
      setCustomConcepto("");
    } catch (err: any) {
      setErrorMsg("Error al guardar el gasto: " + err.message);
    }
  };

  const handleDeleteExpense = async (otId: string, expenseId: string) => {
    if (!window.confirm("¿Está seguro de eliminar este registro de gasto?")) return;
    
    const ot = instalaciones.find((o) => o.ot === otId);
    if (!ot || !ot.gastos) return;

    const updatedExpenses = ot.gastos.filter((g) => g.id !== expenseId);

    try {
      await onUpdateOT(otId, { gastos: updatedExpenses });
    } catch (err: any) {
      alert("Error al eliminar el gasto: " + err.message);
    }
  };

  return (
    <div className="space-y-4" id="expenses-tracker-view">
      
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800 font-sans">Control de Gastos de Instalación</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y auditoría en tiempo real de viáticos, combustible, peajes y materiales adicionales asignados a cuadrillas. Corresponde a la hoja de <strong>Gastos</strong> del Coordinador.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          Moneda: <strong className="text-emerald-700">COP / Pesos</strong>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Incurred */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Total Gastos Operativos</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">${totalIncurred.toLocaleString("es-CO")}</h3>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Acumulado total de todas las cuadrillas</p>
        </div>

        {/* Avg per OT */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-full blur-xl" />
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Promedio de Gasto por OT</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">${Math.round(avgExpensePerOt).toLocaleString("es-CO")}</h3>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Costo promedio de campo por instalación</p>
        </div>

        {/* Expenses Count */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl" />
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">Registros de Gasto</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{allExpenses.length} ítems</h3>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Comprobantes cargados al sistema</p>
        </div>
      </div>

      {/* Split layout: Add expense form and Expenses List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Form panel */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm h-fit space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" /> Registrar Nuevo Gasto
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Asigne costos operativos directamente a una OT activa.</p>
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

          <form onSubmit={handleSubmitExpense} className="space-y-3.5 text-xs">
            {/* OT Selection */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Seleccionar OT de Destino</label>
              <select
                value={selectedOtId}
                onChange={(e) => setSelectedOtId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded px-2.5 py-1.5 text-slate-800 outline-none transition"
              >
                <option value="">-- Seleccionar instalación --</option>
                {activeOtsForSelect.map((ot) => (
                  <option key={ot.ot} value={ot.ot}>
                    {ot.ot} - {ot.cliente} ({ot.ciudad})
                  </option>
                ))}
              </select>
            </div>

            {/* Concept dropdown */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Concepto de Gasto</label>
              <select
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded px-2.5 py-1.5 text-slate-800 outline-none transition"
              >
                <option value="Combustible">Combustible</option>
                <option value="Viáticos">Viáticos / Alimentación</option>
                <option value="Materiales adicionales">Materiales adicionales (Fibra/Mástil/Herrajes)</option>
                <option value="Peajes">Peajes / Transporte</option>
                <option value="Otros">Otro Concepto...</option>
              </select>
            </div>

            {concepto === "Otros" && (
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Especifique Concepto</label>
                <input
                  type="text"
                  value={customConcepto}
                  onChange={(e) => setCustomConcepto(e.target.value)}
                  placeholder="Ej. Alquiler de Escalera, Parqueadero..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 outline-none transition"
                />
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Monto (COP)</label>
              <div className="relative">
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej. 120000"
                  required
                  min="1"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded pl-7 pr-2.5 py-1.5 text-slate-800 placeholder-slate-400 outline-none transition"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 font-mono font-bold">$</span>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Fecha del Gasto</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded px-2.5 py-1.5 text-slate-800 outline-none transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition duration-150 cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-white" />
              <span>Grabar Gasto Operativo</span>
            </button>
          </form>

          {/* Mini Category Summary */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <h5 className="text-[10px] font-mono text-slate-400 uppercase font-bold">Distribución por Categorías</h5>
            <div className="space-y-1.5 text-[11px]">
              {Object.entries(categorySplit).map(([cat, val]) => {
                const pct = totalIncurred > 0 ? (val / totalIncurred) * 100 : 0;
                return (
                  <div key={cat} className="space-y-0.5">
                    <div className="flex justify-between text-slate-600">
                      <span>{cat}</span>
                      <strong className="text-slate-800">${val.toLocaleString("es-CO")}</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* List table panel */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm lg:col-span-2 space-y-3">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <List className="w-4 h-4 text-emerald-600" /> Registro Diario de Gastos
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Todos los costos registrados ordenados de más reciente a más antiguo.</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 border border-slate-200 rounded font-bold">
              {allExpenses.length} Registros
            </span>
          </div>

          <div className="overflow-x-auto">
            {allExpenses.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <DollarSign className="w-8 h-8 text-slate-300 mx-auto animate-bounce" />
                <p className="text-xs text-slate-400 font-mono">No se han registrado gastos operativos en ninguna OT aún.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase bg-slate-50/50">
                    <th className="py-2.5 px-3">OT</th>
                    <th className="py-2.5 px-3">Cuadrilla</th>
                    <th className="py-2.5 px-3">Concepto</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {allExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/50 text-slate-700 font-medium">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded text-[11px]">
                          {expense.otId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 truncate max-w-[140px]" title={expense.cuadrillaNombre}>
                        {expense.cuadrillaNombre}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            expense.concepto === "Combustible" ? "bg-amber-400" :
                            expense.concepto === "Viáticos" ? "bg-indigo-400" :
                            expense.concepto === "Peajes" ? "bg-sky-400" : "bg-emerald-400"
                          }`} />
                          {expense.concepto}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {new Date(expense.fecha + "T12:00:00").toLocaleDateString("es-ES")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-950">
                        ${expense.monto.toLocaleString("es-CO")}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteExpense(expense.otId, expense.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
