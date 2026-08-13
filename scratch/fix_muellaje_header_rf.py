path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_thead = """                    <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 h-8 select-none font-sans text-[10.5px] uppercase tracking-wider">
                            <th className="border-r border-slate-300 text-center p-0.5">
                                <div className="flex items-center justify-center gap-0.5">
                                    <span className="font-black text-[10.5px] text-slate-800 uppercase">LEG</span>
                                    <button
                                        onClick={handleAddTramo}
                                        className="w-4 h-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] flex items-center justify-center shadow-sm cursor-pointer"
                                        title="Agregar Tramo (+)"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={handleRemoveLastTramo}
                                        disabled={tramos.length <= 1}
                                        className="w-4 h-4 rounded bg-red-600 hover:bg-red-700 text-white font-black text-[11px] flex items-center justify-center shadow-sm disabled:opacity-30 cursor-pointer"
                                        title="Borrar Tramo (-)"
                                    >
                                        -
                                    </button>
                                </div>
                            </th>
                            <th className="border-r border-slate-300 text-center">Tipo</th>
                            <th className="border-r border-slate-300 text-left pl-2">Puerto</th>
                            <th className="border-r border-slate-300 text-right pr-2">Dist (NM)</th>
                            <th className="border-r border-slate-300 text-right pr-2">W.F (%)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Vel (kn)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Días Mar</th>
                            <th className="border-r border-slate-300 text-right pr-2">Días Pto</th>
                            <th className="border-r border-slate-300 text-right pr-2">Time to Count (H)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Posic (h)</th>
                            <th className="border-r border-slate-300 text-center">Op. Dest</th>
                            <th className="border-r border-slate-300 text-right pr-2">Ritmo (C/D)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Q (MT)</th>
                            <th className="border-r border-slate-300 text-right pr-2">F ($/t)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Costo Pto</th>
                            <th className="border-r border-slate-300 text-right pr-2">Flete ($)</th>
                            <th className="border-r border-slate-300 text-right pr-2">Bunker ($)</th>
                            <th colSpan={2} className="border-r border-slate-300 text-center p-0 font-bold bg-slate-100 text-slate-700" title="Muellaje (Cifra y Refacturación)">MUELLAJE</th>
                        </tr>
                    </thead>"""

new_thead = """                    <thead>
                        {/* Fila 1 de Encabezados */}
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 h-5 select-none font-sans text-[10px] uppercase tracking-wider">
                            <th rowSpan={2} className="border-r border-slate-300 text-center p-0.5">
                                <div className="flex items-center justify-center gap-0.5">
                                    <span className="font-black text-[10px] text-slate-800 uppercase">LEG</span>
                                    <button
                                        onClick={handleAddTramo}
                                        className="w-4 h-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] flex items-center justify-center shadow-sm cursor-pointer"
                                        title="Agregar Tramo (+)"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={handleRemoveLastTramo}
                                        disabled={tramos.length <= 1}
                                        className="w-4 h-4 rounded bg-red-600 hover:bg-red-700 text-white font-black text-[11px] flex items-center justify-center shadow-sm disabled:opacity-30 cursor-pointer"
                                        title="Borrar Tramo (-)"
                                    >
                                        -
                                    </button>
                                </div>
                            </th>
                            <th rowSpan={2} className="border-r border-slate-300 text-center">Tipo</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-left pl-2">Puerto</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Dist (NM)</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">W.F (%)</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Vel (kn)</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Días Mar</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Días Pto</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Time to Count (H)</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Posic (h)</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-center">Op. Dest</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Ritmo (C/D)</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Q (MT)</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">F ($/t)</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Costo Pto</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Flete ($)</th>
                            <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Bunker ($)</th>
                            <th colSpan={2} className="border-r border-slate-300 text-center p-0.5 font-black bg-blue-100/80 text-blue-950 border-b border-blue-200" title="Muellaje (Cifra y Refacturación)">MUELLAJE</th>
                        </tr>
                        {/* Fila 2 de Encabezados (Sub-columnas independientes MUELLAJE y RF) */}
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 h-4 select-none font-sans text-[9px] uppercase tracking-wider">
                            <th className="border-r border-slate-300 text-right pr-2 bg-slate-100 text-slate-700" title="Monto USD de Muellaje">MUELLAJE</th>
                            <th className="border-r border-slate-300 text-center bg-blue-50/80 text-blue-900 font-black" title="Refacturar Muellaje al Cliente">RF</th>
                        </tr>
                    </thead>"""

if old_thead in code:
    code = code.replace(old_thead, new_thead)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("MUELLAJE & RF SUB-HEADERS UPDATED SUCCESSFULLY!")
else:
    print("WARNING: Could not find exact old_thead match in MultiCotizadorExcel.tsx")
