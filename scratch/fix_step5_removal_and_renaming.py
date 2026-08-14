import os

# 1. Remove Step 5 from MultiCotizadorExcel.tsx top bar
p_excel = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'
with open(p_excel, 'r', encoding='utf-8') as f:
    code_excel = f.read()

old_step5_div = """                    {/* PASO 5: COSTOS PUERTO (STATIC / MATRIX) */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-1 shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                            5. COSTOS PUERTO:
                        </span>
                        <div className="flex rounded bg-slate-100 p-0.5 border border-slate-250">
                            <button
                                onClick={() => setLocalPortCostMode('static')}
                                className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${localPortCostMode === 'static' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                STATIC
                            </button>
                            <button
                                onClick={() => setLocalPortCostMode('matrix')}
                                className={`px-2 py-0.5 text-[9.5px] font-black uppercase rounded cursor-pointer ${localPortCostMode === 'matrix' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                MATRIX
                            </button>
                        </div>
                    </div>"""

code_excel = code_excel.replace(old_step5_div, "")

with open(p_excel, 'w', encoding='utf-8') as f:
    f.write(code_excel)


# 2. Rename Step 6 to Step 5 in SaveLoadQuoteModals.tsx
p_modals = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\SaveLoadQuoteModals.tsx'
with open(p_modals, 'r', encoding='utf-8') as f:
    code_modals = f.read()

code_modals = code_modals.replace("6. GRABAR Y EXPORTAR", "5. GRABAR Y EXPORTAR")

with open(p_modals, 'w', encoding='utf-8') as f:
    f.write(code_modals)

print("STEP 5 REMOVED FROM TOP BAR AND BOTTOM PANEL RENAMED TO 5. GRABAR Y EXPORTAR SUCCESSFULLY!")
