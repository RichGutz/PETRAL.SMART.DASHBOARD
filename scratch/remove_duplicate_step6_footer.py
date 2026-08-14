import os

# Remove duplicate Step 6 block from SaveLoadQuoteModals.tsx
p_modal = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\SaveLoadQuoteModals.tsx'

with open(p_modal, 'r', encoding='utf-8') as f:
    c_modal = f.read()

# Delete lines 39 to 68 (the duplicated Step 6 footer block)
dup_block = """            {/* 6. GRABAR Y EXPORTAR COMPONENT */}
            <div className="bg-white border border-slate-300 rounded shadow-sm p-2 mt-3 select-none flex-shrink-0 w-full">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 flex-nowrap whitespace-nowrap gap-2 w-full">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-black uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 tracking-wide whitespace-nowrap">
                            6. GRABAR Y EXPORTAR
                        </span>
                    </div>

                    <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap shrink-0">
                        <button
                            onClick={() => {
                                const suggested = getSuggestedRouteName(selectedClient);
                                setRouteName(suggested);
                                setShowSaveModal(true);
                            }}
                            className="h-7 text-xs font-black uppercase tracking-wider rounded px-3.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                        >
                            <Save size={14} /> 💾 Grabar
                        </button>

                        <button
                            onClick={handlePrintPDF}
                            className="h-7 text-xs font-bold rounded px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                        >
                            🖨️ Export PDF
                        </button>
                    </div>
                </div>
            </div>"""

c_modal = c_modal.replace(dup_block, "")

with open(p_modal, 'w', encoding='utf-8') as f:
    f.write(c_modal)

print("DUPLICATE STEP 6 BLOCK REMOVED FROM SaveLoadQuoteModals.tsx SUCCESSFULLY!")
