# 🗺️ Plan Maestro y Especificación de Documentación AS-BUILT — PETRAL SMART DASHBOARD

> **Estado**: Documento de Referencia Oficial de Arquitectura Construida (AS-BUILT)
> **Directorio Raíz**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\06_AS_BUILT\`
> **Propósito**: Guía técnica de ingeniería para desarrolladores, auditores y agentes AI sobre el estado final del software.

---

## 🎯 Objetivo General

Esta carpeta contiene la documentación oficial **AS-BUILT** (tal como fue construido) del sistema **PETRAL SMART DASHBOARD**. Cada módulo, maestro, motor financiero, API REST y componente de infraestructura cuenta con un documento Markdown dedicado que refleja con precisión la implementación en producción.

---

## 📂 Estructura de Carpetas del Vault AS-BUILT

```text
DashBoardPetral/06_AS_BUILT/
├── 📁 00_Fundamentos_y_Arquitectura/
│   ├── 00_AS_BUILT_Indice_General_Dashboard.md
│   ├── 01_AS_BUILT_Arquitectura_General_y_Stack_Tecnico.md
│   ├── 02_AS_BUILT_Modelo_Entidad_Relacion_Supabase_PostgreSQL.md
│   └── 03_AS_BUILT_Despliegue_VPS_Nginx_Systemd_SSL.md
│
├── 📁 01_Maestros/
│   ├── AS_BUILT_Maestro_01_Buques_VesselsMaster.md
│   ├── AS_BUILT_Maestro_02_Rutas_RuteadorSpot_RouteMaster.md
│   ├── AS_BUILT_Maestro_03_Clientes_ClientsMaster.md
│   ├── AS_BUILT_Maestro_04_Contratos_ContractsMaster.md
│   ├── AS_BUILT_Maestro_05_Puertos_PortsMaster.md
│   ├── AS_BUILT_Maestro_06_Costos_Portuarios_PortCostsMaster.md
│   ├── AS_BUILT_Maestro_07_Tarifario_Portuario_PortTariffsMaster.md
│   ├── AS_BUILT_Maestro_08_Sources_Sinks_SourcesSinksMaster.md
│   └── AS_BUILT_Maestro_09_Precios_Bunker_BunkerMaster.md
│
├── 📁 02_Herramientas_y_Motores/
│   ├── AS_BUILT_Herramienta_01_Multicotizador_Spot.md
│   ├── AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard.md
│   ├── AS_BUILT_Herramienta_03_Analisis_Grafico_Commercial.md
│   ├── AS_BUILT_Herramienta_04_Analisis_Grafico_Liquidaciones.md
│   ├── AS_BUILT_Herramienta_05_Auditoria_PDF_Liquidaciones_WeasyPrint.md
│   ├── AS_BUILT_Herramienta_06_Mapa_de_Espaguetis.md
│   ├── AS_BUILT_Herramienta_07_Auditoria_Ledger_VoyageLedger.md
│   ├── AS_BUILT_Herramienta_08_Auditoria_Engine_PL.md
│   ├── AS_BUILT_Herramienta_09_Auditoria_Final_Dual.md
│   ├── AS_BUILT_Herramienta_10_Visor_Flowcharts_Sistema.md
│   └── AS_BUILT_Herramienta_11_Documentacion_Interactiva.md
│
└── 📁 03_Seguridad_y_Permisos/
    └── AS_BUILT_Sistema_Auth_JWT_Roles_y_Permisos.md
```

---

## 🔗 Convención de Anclaje Bi-direccional en Obsidian

1. Todos los documentos utilizan la sintaxis de **Wikilinks nativos `[[Nombre_De_Nota]]`**.
2. Cada Herramienta posee enlaces explícitos a sus Maestros consumidores en la sección `### 📥 Inyección de Dependencias Maestras`.
3. Cada Maestro posee enlaces explícitos a sus Herramientas consumidoras en la sección `### 📤 Consumidores en el Sistema`.
4. Todos los documentos incluyen barra de navegación breadcrumb en la parte superior e inferior.
