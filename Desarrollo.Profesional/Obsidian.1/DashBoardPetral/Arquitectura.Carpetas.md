# 📂 Arquitectura de Directorios (Vertical Slicing)

Este documento define la estructura oficial del ecosistema de desarrollo para el dashboard. Todo el código fuente reside bajo la carpeta unificada de trabajo profesional.

Esta arquitectura da soporte directo a lo planteado en la [[Especificacion.Commercial.Forecast]].

## 📍 Raíz del Proyecto
Ubicación base: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\`

---

## 1. ⚙️ El Backend (`Geeksoft_Engine`)
Esta carpeta contiene la API de FastAPI, el motor financiero de Python y la configuración de Supabase.

```text
Geeksoft_Engine/
├── supabase/                     # Migraciones, config y DB local
├── backend/                      # Código fuente de FastAPI
│   ├── main.py                   # Punto de entrada. Inicializa app y routers.
│   ├── database.py               # Singleton de conexión a Supabase
│   ├── engine.py                 # Cálculos matemáticos core (TCE, P&L)
│   ├── api/
│   │   └── routers/              # Endpoints agrupados por dominio
│   │       └── forecast.py       # Controlador de Commercial Forecast
│   ├── services/                 # Lógica de negocio orquestada
│   │   └── forecast_service.py   # Lógica de iteración y llamadas a engine
│   ├── models/                   # Validadores Pydantic de In/Out
│   │   └── forecast_models.py    
│   └── tests/                    # Pruebas unitarias
└── .env                          # Secretos y variables locales
```

## 2. 🖥️ El Frontend (`Geeksoft_Frontend`)
Esta carpeta es una aplicación React construida con Vite y TypeScript, enfocada puramente en renderizar las UIs interactivas solicitadas.

```text
Geeksoft_Frontend/
├── package.json
├── vite.config.ts
├── src/
│   ├── App.tsx                   # Enrutador base
│   ├── pages/                    # Pantallas principales
│   │   └── CommercialForecast/   # Pantalla contenedora del Dashboard
│   ├── components/               # Componentes aislados y reutilizables
│   │   └── CommercialForecast/   
│   │       ├── PivotGrid.tsx     # Ag-Grid con rowspans y colores jerárquicos
│   │       ├── InteractiveChart.tsx # Gráfico cruzado ECharts
│   │       └── ScenarioControls.tsx # Sliders "What-If"
│   └── services/                 # Comunicación externa
│       └── api.ts                # Funciones fetch hacia Geeksoft_Engine
```

## 3. 🧠 La Documentación (`Obsidian.1`)
Tu segundo cerebro. Contiene toda la especificación funcional y operativa.
- [[Especificacion.Commercial.Forecast]]
- [[Reproduccion.Motor.PL]]
- [[Maestro.Aduanas]]

---

> 💡 **Regla de Oro:** 
> Nunca mezclar la interfaz con el motor lógico. Cualquier cambio matemático profundo se hace en `Geeksoft_Engine`. Cualquier cambio de botones, colores o agrupación visual se hace en `Geeksoft_Frontend`. El nexo entre ambos es estrictamente JSON a través de los `routers`.
