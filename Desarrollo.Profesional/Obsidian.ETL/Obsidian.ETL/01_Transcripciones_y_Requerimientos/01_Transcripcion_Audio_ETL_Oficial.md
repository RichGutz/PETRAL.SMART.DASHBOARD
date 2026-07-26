# TRANSCRIPCIÓN OFICIAL Y REQUERIMIENTOS DEL MÓDULO ETL

> **Archivo Origen:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\audio_transcrip\LOOP.ETL.ogg`  
> **Motor de Transcripción:** OpenAI Whisper (base)  
> **Fecha de Procesamiento:** 2026-07-26  

---

## 1. TEXTO INTEGRO TRANSCRITO DE AUDIO

> *"Gemini nos acercamos a la etapa final del desarrollo del sistema, que es el ETL. Y nuestra aplicación lo que hace es un forecast de los ingresos, el profit, de acuerdo a una combinación de rutas con barcos a lo largo de un período. Esto tiene que contrastarse con la ejecución real, ¿OK?*
>
> *Entonces, los amigos de Petral me han alcanzado las liquidaciones reales en Excel de los dos barcos principales, la flota propia, que son el... Moquegua y el Tablones. Entonces, quiero crear acá una bóveda obsidian, yo te la voy a pasar, donde hagamos algo súper similar a cómo se desarrolló el maestro costos portuarios.*
>
> *Primero, yo te voy a pasar las liquidaciones como una imagen de los Exceles. Luego, acá solamente hay que leer, pero como los Exceles no son muy ordenados, intuyo que te va a ser difícil leer, vamos a tratar de que cada campo sea, digamos, desmenuzado para que tú lo puedas entender.*
>
> *Lo siguiente es vamos a crear algún tipo de motor que entienda bien cada uno de los Exceles. Luego, cuando tengamos ya creado y afinado ese motor, vamos a crear una tablita, donde coloquemos los datos de ejecución real, de cada viaje, de cada barco y cada barco que tiene ahí su ruta.*
>
> *Y finalmente, lo que vamos me hacer es que la herramienta de matriz financiera tenga la opción de jalar datos de ejecución. Me dejo entender. Entonces, así vamos a poder comparar a nivel venta y profit, lo pronosticado con lo ejecutado."*

---

## 2. DESGLOSE ESTRATÉGICO DE REQUERIMIENTOS

| Fase | Tarea Principal | Entregable Esperado |
| :--- | :--- | :--- |
| **Fase 1** | Lectura e Inspección de Imágenes/Exceles | Análisis desmenuzado de campos de B/T Moquegua y B/T Tablones. |
| **Fase 2** | Desarrollo de Motor Extractor | Parser Python/Node para lectura de proformas reales. |
| **Fase 3** | Tabla Base de Datos | Tabla Supabase `voyage_execution_real`. |
| **Fase 4** | Integración UI Matriz Financiera | Conector de ejecución real y tablero Forecast vs Real (Ventas & Profit). |
