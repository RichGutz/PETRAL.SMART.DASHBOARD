import streamlit as st
import base64
from pathlib import Path

# Configuración única y global de la página
st.set_page_config(
    page_title="Naviera Petral Smart Dashboard",
    page_icon="🚢",
    layout="wide"
)

# Inicializar estado de autenticación en la sesión de Streamlit
if "authenticated" not in st.session_state:
    st.session_state["authenticated"] = False

def get_base64_image(image_path: str) -> str:
    """Carga una imagen local y la convierte en un Data URI base64."""
    try:
        path = Path(image_path)
        if not path.exists():
            return ""
        ext = path.suffix.lower().replace(".", "")
        if ext == "jpg":
            ext = "jpeg"
        with open(path, "rb") as img_file:
            encoded = base64.b64encode(img_file.read()).decode()
            return f"data:image/{ext};base64,{encoded}"
    except Exception:
        return ""

import streamlit as st
import base64
from pathlib import Path

# Configuración única y global de la página
st.set_page_config(
    page_title="Naviera Petral Smart Dashboard",
    page_icon="🚢",
    layout="wide"
)

# Inicializar estado de autenticación en la sesión de Streamlit
if "authenticated" not in st.session_state:
    st.session_state["authenticated"] = False

def get_base64_image(image_path: str) -> str:
    """Carga una imagen local y la convierte en un Data URI base64."""
    try:
        path = Path(image_path)
        if not path.exists():
            return ""
        ext = path.suffix.lower().replace(".", "")
        if ext == "jpg":
            ext = "jpeg"
        with open(path, "rb") as img_file:
            encoded = base64.b64encode(img_file.read()).decode()
            return f"data:image/{ext};base64,{encoded}"
    except Exception:
        return ""

if not st.session_state["authenticated"]:
    # -------------------------------------------------------------------------
    # 🚢 VISTA 1: PORTADA Y FORMULARIO DE ACCESO (LOGIN ESTILO STRIPE)
    # -------------------------------------------------------------------------
    
    # Cargar recursos locales en memoria (Base64) para inyección directa en HTML/CSS
    moquegua_b64 = get_base64_image("Imagenes/moquegua.color.jpeg")
    tablones_b64 = get_base64_image("Imagenes/tablones.jpeg")
    petral_logo_b64 = get_base64_image("Imagenes/Logo.Petral.png")
    geeksoft_logo_b64 = get_base64_image("Imagenes/Logo.Geeksoft.png")
    
    # Inyectar estilos CSS avanzados para forzar layout estilo Stripe
    st.markdown(f"""
    <style>
    /* Ocultar barra superior y menú nativo de Streamlit */
    header[data-testid="stHeader"] {{
        visibility: hidden;
        height: 0%;
        display: none !important;
    }}
    div[data-testid="stToolbar"] {{
        visibility: hidden;
        display: none !important;
    }}
    #MainMenu {{
        visibility: hidden;
        display: none !important;
    }}
    footer {{
        visibility: hidden;
        display: none !important;
    }}
    
    /* Eliminar paddings nativos del contenedor principal de Streamlit */
    .main .block-container {{
        max-width: 100% !important;
        padding: 0rem !important;
        margin: 0rem !important;
        height: 100vh !important;
        background-color: #FFFFFF !important;
        overflow: hidden !important;
    }}
    
    /* Adaptación de contenedor horizontal nativo de Streamlit a pantalla dividida */
    div[data-testid="stHorizontalBlock"] {{
        gap: 0rem !important;
        width: 100vw !important;
        height: 100vh !important;
        margin: 0rem !important;
        padding: 0rem !important;
    }}
    
    /* Columna Izquierda: Panel de Login (45%) */
    div[data-testid="column"]:first-child {{
        width: 45% !important;
        flex: 1 1 45% !important;
        max-width: 45% !important;
        padding: 3rem 4rem !important;
        margin: 0rem !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        background-color: #FFFFFF !important;
        height: 100vh !important;
    }}
    
    /* Columna Derecha: Panel Visual Gradiente y Auroras (55%) */
    div[data-testid="column"]:last-child {{
        width: 55% !important;
        flex: 1 1 55% !important;
        max-width: 55% !important;
        padding: 4rem !important;
        margin: 0rem !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        background: radial-gradient(circle at 70% 30%, #1E3A8A 0%, #0F1E36 50%, #080F1D 100%) !important;
        position: relative !important;
        overflow: hidden !important;
        height: 100vh !important;
    }}

    /* Luces de fondo (Efecto Aurora) en la columna derecha */
    div[data-testid="column"]:last-child::before {{
        content: "";
        position: absolute;
        width: 300px;
        height: 300px;
        background: rgba(30, 58, 138, 0.4);
        filter: blur(100px);
        top: 20%;
        left: 20%;
        border-radius: 50%;
        z-index: 1;
    }}
    
    div[data-testid="column"]:last-child::after {{
        content: "";
        position: absolute;
        width: 400px;
        height: 400px;
        background: rgba(59, 130, 246, 0.15);
        filter: blur(120px);
        bottom: 10%;
        right: 10%;
        border-radius: 50%;
        z-index: 1;
    }}

    .widgets-container {{
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 480px;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }}
    
    /* Estilos de las Tarjetas Flotantes (Widgets) */
    .vessel-card {{
        background: rgba(255, 255, 255, 0.96);
        border-radius: 16px;
        padding: 1.25rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
        display: flex;
        gap: 1.25rem;
        align-items: center;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
        border: 1px solid rgba(255, 255, 255, 0.8);
        font-family: 'Inter', sans-serif;
    }}
    
    .vessel-card:hover {{
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.6);
    }}
    
    .vessel-card.card-moquegua {{
        align-self: flex-start;
        width: 95%;
    }}
    
    .vessel-card.card-tablones {{
        align-self: flex-end;
        width: 95%;
    }}
    
    .vessel-img-wrapper {{
        width: 120px;
        height: 120px;
        border-radius: 10px;
        overflow: hidden;
        flex-shrink: 0;
        border: 1px solid #E2E8F0;
    }}
    
    .vessel-img {{
        width: 100%;
        height: 100%;
        object-fit: cover;
    }}
    
    .vessel-details {{
        flex-grow: 1;
    }}
    
    .vessel-header {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }}
    
    .vessel-name {{
        font-size: 1.1rem;
        font-weight: 700;
        color: #0F172A;
    }}
    
    .vessel-status {{
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.25rem 0.6rem;
        border-radius: 12px;
        text-transform: uppercase;
    }}
    
    .vessel-status.active {{
        background-color: #DCFCE7;
        color: #15803D;
    }}
    
    .vessel-status.projected {{
        background-color: #DBEAFE;
        color: #1D4ED8;
    }}
    
    .vessel-meta-grid {{
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        border-top: 1px solid #F1F5F9;
        padding-top: 0.5rem;
    }}
    
    .meta-item {{
        display: flex;
        flex-direction: column;
    }}
    
    .meta-label {{
        font-size: 0.7rem;
        color: #64748B;
        text-transform: uppercase;
        font-weight: 500;
        letter-spacing: 0.3px;
    }}
    
    .meta-val {{
        font-size: 0.82rem;
        font-weight: 600;
        color: #334155;
    }}

    /* Estilización del formulario nativo de Streamlit */
    div[data-testid="stForm"] {{
        border: none !important;
        padding: 0rem !important;
        background-color: transparent !important;
        box-shadow: none !important;
        width: 100% !important;
        margin: 0rem !important;
    }}

    div[data-testid="stForm"] label p {{
        font-family: 'Inter', sans-serif !important;
        font-weight: 500 !important;
        color: #334155 !important;
        font-size: 0.88rem !important;
        margin-bottom: 0.3rem !important;
    }}

    div[data-testid="stForm"] input {{
        border-radius: 8px !important;
        border: 1px solid #E2E8F0 !important;
        padding: 0.75rem 0.9rem !important;
        font-family: 'Inter', sans-serif !important;
        background-color: #FFFFFF !important;
        color: #0F172A !important;
    }}

    button[data-testid="baseButton-formSubmit"] {{
        background-color: #0B2545 !important;
        color: #FFFFFF !important;
        border: none !important;
        width: 100% !important;
        padding: 0.75rem 1rem !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 0.95rem !important;
        font-family: 'Inter', sans-serif !important;
        transition: all 0.2s ease-in-out !important;
        margin-top: 1rem !important;
    }}

    button[data-testid="baseButton-formSubmit"]:hover {{
        background-color: #134074 !important;
        color: #FFFFFF !important;
    }}
    </style>
    """, unsafe_allow_html=True)
    
    # Crear estructura Split-Screen usando st.columns
    col_login, col_hero = st.columns([45, 55])
    
    with col_login:
        # Logo de Petral arriba
        if petral_logo_b64:
            st.markdown(f'<div style="margin-bottom: 2rem;"><img src="{petral_logo_b64}" style="max-width: 160px; height: auto;" /></div>', unsafe_allow_html=True)
        else:
            st.markdown('<h2 style="color: #0B2545; font-family: \'Inter\', sans-serif; font-weight: 700; margin-bottom: 2rem; letter-spacing: -0.5px;">NAVIERA PETRAL</h2>', unsafe_allow_html=True)
        
        # Contenido de Login
        st.markdown('<div style="margin-top: auto; margin-bottom: auto; max-width: 380px; width: 100%;">', unsafe_allow_html=True)
        st.markdown('<h2 style="font-size: 1.8rem; font-weight: 700; color: #0F172A; margin-bottom: 0.5rem; font-family: \'Inter\', sans-serif; letter-spacing: -0.5px;">Iniciar sesión</h2>', unsafe_allow_html=True)
        st.markdown('<p style="font-size: 0.95rem; color: #64748B; margin-bottom: 2rem; font-weight: 400; font-family: \'Inter\', sans-serif;">Ingrese sus credenciales para acceder al dashboard corporativo.</p>', unsafe_allow_html=True)
        
        # Formulario de Acceso
        with st.form("login_form", clear_on_submit=False):
            username = st.text_input("Usuario", placeholder="nombre@correo.com")
            password = st.text_input("Contraseña", type="password", placeholder="••••••••")
            
            submitted = st.form_submit_button("Ingresar al Sistema")
            
            if submitted:
                # Credenciales preliminares seguras
                if username == "admin" and password == "petral2026":
                    st.session_state["authenticated"] = True
                    st.success("Acceso concedido.")
                    st.rerun()
                else:
                    st.error("Credenciales incorrectas. Verifique los datos e intente nuevamente.")
                    
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Pie de página con marca Geeksoft abajo
        if geeksoft_logo_b64:
            st.markdown(f"""
            <div style="margin-top: auto; font-family: 'Inter', sans-serif; padding-top: 2rem;">
                <span style="font-size: 0.72rem; color: #94A3B8; display: block; margin-bottom: 0.2rem;">Desarrollado por</span>
                <img src="{geeksoft_logo_b64}" style="max-width: 85px; height: auto; opacity: 0.65;" />
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style="margin-top: auto; font-family: 'Inter', sans-serif; padding-top: 2rem;">
                <span style="font-size: 0.72rem; color: #94A3B8;">Powered by Geeksoft</span>
            </div>
            """, unsafe_allow_html=True)
        
    with col_hero:
        # Inyectar el contenedor con los widgets de buques en el panel degradado derecho
        st.markdown(f"""
        <div class="widgets-container">
            <!-- Widget B/T Moquegua -->
            <div class="vessel-card card-moquegua">
                <div class="vessel-img-wrapper">
                    {"<img class='vessel-img' src='" + moquegua_b64 + "' alt='B/T Moquegua'>" if moquegua_b64 else ""}
                </div>
                <div class="vessel-details">
                    <div class="vessel-header">
                        <span class="vessel-name">B/T Moquegua</span>
                        <span class="vessel-status active">Activo</span>
                    </div>
                    <div class="vessel-meta-grid">
                        <div class="meta-item">
                            <span class="meta-label">Estado</span>
                            <span class="meta-val">En Navegación</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Destino</span>
                            <span class="meta-val">Matarani</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Búnker</span>
                            <span class="meta-val">94.2%</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Eslora</span>
                            <span class="meta-val">228.4 m</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Widget B/T Tablones -->
            <div class="vessel-card card-tablones">
                <div class="vessel-img-wrapper">
                    {"<img class='vessel-img' src='" + tablones_b64 + "' alt='B/T Tablones'>" if tablones_b64 else ""}
                </div>
                <div class="vessel-details">
                    <div class="vessel-header">
                        <span class="vessel-name">B/T Tablones</span>
                        <span class="vessel-status projected">Proyectado</span>
                    </div>
                    <div class="vessel-meta-grid">
                        <div class="meta-item">
                            <span class="meta-label">Estado</span>
                            <span class="meta-val">En Puerto</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Puerto</span>
                            <span class="meta-val">Ilo</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Operación</span>
                            <span class="meta-val">Carga de Ácido</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Eslora</span>
                            <span class="meta-val">175.5 m</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

else:
    # -------------------------------------------------------------------------
    # 🚢 VISTA 2: APLICACIÓN PRINCIPAL (DASHBOARD LOGUEADO)
    # -------------------------------------------------------------------------
    
    # Barra superior de navegación / cabecera del dashboard
    col_title, col_user = st.columns([8, 2])
    with col_title:
        st.title("🚢 Naviera Petral - Smart Dashboard")
    with col_user:
        st.write("") # Alineación vertical
        st.markdown('<div style="text-align: right; font-family: \'Inter\', sans-serif; font-size: 0.9rem; color: #64748B; margin-top: 12px;">Sesión: <b>Administrador</b></div>', unsafe_allow_html=True)
        if st.button("Cerrar Sesión", key="logout_btn"):
            st.session_state["authenticated"] = False
            st.rerun()
            
    st.markdown("---")
    st.markdown("Bienvenido al sistema de control y proyección de Gross Margin para los buques **Moquegua** y **Tabelones**.")
    
    # Aquí se configurará la navegación modular del Dashboard

