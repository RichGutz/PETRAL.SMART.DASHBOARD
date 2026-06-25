# 📑 Acta de Conformidad: Lógica Matemática y Voyage Calculations

## 1. Contexto de la Validación
En el marco del Hito 1 (Diseño y Lógica) del Proyecto Geeksoft, el equipo operativo y comercial de Naviera Petral certifica que ha revisado y aprobado la arquitectura matemática que el software utilizará para proyectar el P&L de los viajes SPOT y Forecast. 

## 2. Ecuaciones y Reglas de Negocio Aprobadas
El equipo valida que el sistema descarte los promedios globales y utilice el **Modelo de Consumo Granular de Búnker (IFO & MDO)**, calculando el gasto exacto en cuatro fases operativas independientes:
* **Navegación:** $\text{Días de Mar} \times \text{Consumo Sea}$
* **Tiempos Muertos:** $\text{Horas Fijas Burocráticas} \times \text{Consumo Idle}$
* **Inyección de Carga:** $\text{Velocidad del Terminal (MIN)} \times \text{Consumo Load}$
* **Bombeo de Descarga:** $\text{Potencia de Bomba del Buque (MIN)} \times \text{Consumo Disch}$

## 3. Casos de Prueba (Pruebas Unitarias de Convergencia)
Se corrieron los siguientes escenarios idénticos tanto en el "Excel Legacy" como en el "Motor Geeksoft", confirmando convergencia financiera al centavo (Error = $0.00):

| Parámetro Evaluado | B/T TABLONES (Control 1) | B/T MOQUEGUA (Control 2) |
| :--- | :--- | :--- |
| **Ruta Comercial** | Ilo - Matarani (Solo Ida) | Ilo - Matarani (Solo Ida) |
| **Volumen (MT)** | 13,500 MT | 13,500 MT |
| **Duración Exacta** | 3.769205 Días | 4.080076 Días |
| **Costo Búnker USD** | \$14,459.61 (Puro IFO) | \$18,560.53 (Híbrido IFO+MDO) |
| **Margen del Viaje** | \$201,175.39 | \$199,074.47 |
| **P/L Neto (Cierre)**| \$144,637.32 | \$146,033.49 |

## 4. Conformidad Formal
Con la firma de este documento, el cliente autoriza a Geeksoft a blindar estas ecuaciones en la base de datos y backend productivo, dando por superada la validación de la lógica financiera del núcleo del sistema.

* **Firma Geeksoft:** ___________________________
* **Firma Naviera Petral (Comercial):** ___________________________
* **Firma Naviera Petral (Operaciones):** ___________________________