# 🚀 Plan de Implementación General: Maestro de Costos Portuarios & Motor Dinámico (Modelo P x Q)

> **Filosofía**: Desarrollo progresivo basado en la **Ecuación Fundamental de Costos Portuarios: $\text{Costo} = P \times Q$**
> - **$Q$ (Cantidad / Dimensiones Operativas)**: Jalado dinámicamente del **Maestro de Buques** ($\text{LOA}$, $\text{GRT}$, $\text{DWT}$) y **Maestro de Puertos/Terminales** (ritmo $\text{MT/h}$, remolques, ventana temporal atraque/desatraque).
> - **$P$ (Precios / Tarifas Unitarias)**: Jalado dinámicamente del **Maestro Tarifario** (`PORT_COSTS_MATRIX`).
> - **Auditoría & Cotizador**: Presenta la liquidación completa en **una sola ventana con vista dividida (Split-View)** de dos PDFs en paralelo (Carga y Descarga).

---

## 🗺️ Mapa General de la Arquitectura P x Q

```mermaid
graph TD
    subgraph CAPA_Q["1. DIMENSIÓN CANTIDADES (Q)"]
        Buques["Maestro de Buques (VESSELS)<br>• LOA, GRT, DWT"]
        Terminales["Maestro Puertos & Terminales<br>• Ritmos Carga/Descarga (MT/h)<br>• Remolcadores (IN/OUT)<br>• Ventana Atraque / Desatraque"]
        Operacion["Inputs Operativos Usuario<br>• Carga MT, Fechas Inicio/Fin"]
        
        Buques --> CalcQ["Cálculo de Consumos Q<br>Q_horas = Desatraque - Atraque<br>Q_física = LOA, GRT<br>Q_servicios = Remolques, Lanchas"]
        Terminales --> CalcQ
        Operacion --> CalcQ
    end

    subgraph CAPA_P["2. DIMENSIÓN PRECIOS (P)"]
        Tarifario["Maestro Tarifas (PORT_COSTS_MATRIX)<br>• P_muellaje ($1.50/m/h)<br>• P_remolcaje ($800/remolque)<br>• P_faro ($0.03/$0.12 GRT)<br>• P_practicaje (MAX(750, 0.055*GRT))<br>• P_agencia ($1,000 Flat)"]
    end

    subgraph MOTOR["3. MOTOR DE AUDITORÍA & LIQUIDACIÓN (P x Q)"]
        Multiplicador["Costo Rubro = P (Tarifario) x Q (Buque/Terminal/Horas)"]
        CalcQ --> Multiplicador
        Tarifario --> Multiplicador
    end

    subgraph VISOR["4. VISOR DUAL LADO A LADO (SPLIT-VIEW IFRAMES)"]
        PdfCarga["📄 PDF 1: Acta Auditoría Puerto Carga (Callao APM)"]
        PdfDescarga["📄 PDF 2: Acta Auditoría Puerto Descarga (Matarani Tisur)"]
        PrintPDF["🖨️ Exportación e Impresión Limpia PDF A4 Separados"]
        
        Multiplicador --> PdfCarga --> PrintPDF
        Multiplicador --> PdfDescarga --> PrintPDF
    end
```

---

## 📌 ESTADO DE AVANCE ACTUAL (RESUMEN EJECUTIVO)

| Capa / Etapa | Alcance / Entregable | Estado |
| :---: | :--- | :---: |
| **Capa 1 (LÓGICA P x Q)** | Levantamiento Lógico $P \times Q$ & Flujogramas Lineales PDF (Callao, Marcona, Matarani, Ilo) | **✅ COMPLETADO** |
| **Capa 2 (UI MAESTROS)** | `PortTariffsMaster.tsx` ($P$), `PortsMaster_V2.tsx` & `VesselTerminalMatrix.tsx` ($Q$) | **✅ COMPLETADO** |
| **Capa 3 (TABLAS BD)** | Esquema Supabase + Sembrados Oficiales (`seed_callao_experta.py`, `seed_matarani_experta.py`, etc.) | **✅ COMPLETADO** |
| **Capa 4 (MOTOR BACKEND)** | `Geeksoft_Engine/backend/port_engines/` con `calculator_callao.py` desacoplado | **✅ COMPLETADO** |
| **Capa 5 (AUDITORÍA VOYAGE DUAL)** | Visor Dual Lado a Lado Split-View (Carga vs Descarga) con recargo Casino y 3 Bloques | **✅ COMPLETADO** |
| **Capa 6 (MOTORES PUERTOS PERÚ)** | Desarrollo específico de motores de cálculo dinámico para Matarani, Marcona e Ilo | **🚀 PRÓXIMA ETAPA** |

---

## 📅 HOJA DE RUTA PRÓXIMA ETAPA: MOTORES ESPECÍFICOS POR PUERTO PERUANO

1. **`calculator_matarani.py` (TISUR Matarani)**:
   - Motor dinámico para amarraderos C y F de Tisur, tarifas de muellaje por metro/hora y remolques Tramarsa.
2. **`calculator_marcona.py` (Shougang Hierro Perú)**:
   - Motor dinámico para muelle San Nicolás (Marcona), tarifas específicas de amarradero mineralero.
3. **`calculator_ilo.py` (Southern Perú SPCC / ENAPU Ilo)**:
   - Motor dinámico para terminal de fundición SPCC y Muelle Fiscal ENAPU Ilo.

---

## 📌 Documentación de Referencia en Obsidian

- 📄 `Obsidian.Maestro.Costos.Portuarios/motores.calculo.complejo.md`
- 📄 `Obsidian.Maestro.Costos.Portuarios/hta.auditoria.md`
- 📄 `Obsidian.Maestro.Costos.Portuarios/Reglas.Costos.Callao_Experta.md`
- 📄 `Obsidian.Maestro.Costos.Portuarios/Reglas.Costos.Matarani_Experta.md`
- 📄 `Obsidian.Maestro.Costos.Portuarios/Reglas.Costos.Marcona_Experta.md`
- 📄 `Obsidian.Maestro.Costos.Portuarios/Reglas.Costos.Ilo_Experta.md`
