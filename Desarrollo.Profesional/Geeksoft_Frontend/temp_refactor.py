import sys
import re

with open('src/pages/Tools/SpaghettiMap_V2.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

header_match = re.search(r'(<h3 className=\"text-petral-teal text-xs font-bold uppercase tracking-widest mb-4 text-center\">Línea de Tiempo</h3>)', content)

ribbon_regex = r'(                    {\/\* Scenario Ribbon \*\/}\n                    {context\.forecastName && \(\n                        <div className=\"bg-sky-50.*?</div>\n                    \)}\n)'
ribbon_match = re.search(ribbon_regex, content, re.DOTALL)

controls_regex = r'(                    {\/\* Controls Panel \*\/}\n                    <div className=\"bg-white border border-slate-200 rounded-lg p-3 mt-3 shadow-sm flex flex-col gap-3 shrink-0\">\n.*?                    </div>\n                </div>\n\n                {\/\* COLUMN 2: ECharts Map \*\/})'
controls_match = re.search(controls_regex, content, re.DOTALL)

if header_match and ribbon_match and controls_match:
    # 1. Remove the old Ribbon
    content = content.replace(ribbon_match.group(1), '')
    
    # 2. Remove the old controls and replace with closing divs
    content = re.sub(controls_regex, '                </div>\n\n                {/* COLUMN 2: ECharts Map */}', content, flags=re.DOTALL)
    
    # 3. New Controls text
    new_controls = '''                    {/* Controls Panel (Top) */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 shadow-sm flex flex-col gap-3 shrink-0">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-600">Nodos (Pies y Líneas)</span>
                            <button
                                onClick={() => setShowPies(!showPies)}
                                className={`w-10 h-5 rounded-full relative transition-colors focus:outline-none ${showPies ? 'bg-petral-teal' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${showPies ? 'translate-x-5' : 'translate-x-0'}`}></span>
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 pt-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600">Animación</span>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="10" 
                                        value={playSpeed} 
                                        onChange={(e) => setPlaySpeed(Number(e.target.value) || 2)}
                                        className="w-10 h-6 text-center text-xs font-bold border border-slate-300 rounded text-slate-700 bg-slate-50 focus:outline-none focus:border-petral-teal"
                                    />
                                    <span className="text-[10px] text-slate-500 font-bold">seg/mes</span>
                                </div>
                            </div>
                            <button
                                onClick={handlePlayAnimation}
                                className={`w-full py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${isPlaying ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-petral-blue text-white hover:bg-blue-800'}`}
                            >
                                {isPlaying ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                        </svg>
                                        Detener
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Reproducir Mes a Mes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <h3 className="text-petral-teal text-xs font-bold uppercase tracking-widest mb-4 text-center">Línea de Tiempo</h3>'''
    
    new_ribbon = '''
                    {/* Scenario Ribbon */}
                    {context.forecastName && (
                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 mt-3 flex flex-col justify-center items-center shadow-sm text-center">
                            <span className="text-[10px] text-sky-600 uppercase tracking-wider font-bold mb-0.5">Escenario Activo</span>
                            <span className="text-xs font-semibold text-sky-800 flex items-center gap-1">
                                📁 {context.forecastName}
                            </span>
                        </div>
                    )}
                </div>'''

    content = content.replace(header_match.group(1), new_controls)
    content = content.replace('                </div>\n\n                {/* COLUMN 2: ECharts Map */}', new_ribbon + '\n\n                {/* COLUMN 2: ECharts Map */}')
    
    with open('src/pages/Tools/SpaghettiMap_V2.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print('Layout successfully refactored!')
else:
    print('Could not find matches')
    if not header_match: print('Header not found')
    if not ribbon_match: print('Ribbon not found')
    if not controls_match: print('Controls not found')
