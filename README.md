# Naviera Petral Smart Dashboard

Este proyecto reemplaza el modelo tradicional en Excel para la medición del Gross Margin de los barcos Moquegua y Tabelones. 
Consiste en una aplicación web desarrollada con Streamlit en el Frontend y Supabase en el Backend.

## Estructura

- `frontend/`: Aplicación principal de Streamlit.
- `backend/`: Conexión a la base de datos Supabase.
- `data_models/`: Esquemas y validación de datos.
- `notebooks/`: Pruebas y exploración.

## Ejecución

1. Instalar dependencias: `pip install -r requirements.txt`
2. Configurar variables de entorno `.env` (`SUPABASE_URL`, `SUPABASE_KEY`)
3. Levantar app: `streamlit run frontend/app.py`
