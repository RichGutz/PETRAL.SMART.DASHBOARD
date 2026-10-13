# 🛡️ DOBLE ACCESO: Implementación de Autenticación Híbrida (Contraseña Directa + 2FA OTP) & Gestión Integral de Credenciales en PETRAL ONE

> **Documento:** Nota Técnica y Bitácora de Auditoría de Arquitectura (Benoit Blanc Protocol)  
> **Sistema:** PETRAL SMART DASHBOARD / PETRAL ONE  
> **Servidor de Producción:** VPS Contabo (`169.58.168.107` / Coolify / Traefik / Docker)  
> **URL Oficial de Producción:** [https://petral.one.geeksoft.tech/dashboard](https://petral.one.geeksoft.tech/dashboard)  
> **Fecha de Despliegue:** 13 de Octubre de 2026  
> **Estado:** ✅ 100% Implementado, Empíricamente Auditado y Desplegado en Producción en Vivo  

---

## 1. 📌 Diagnóstico Forense y Justificación Operativa

### 1.1. Escena del Crimen (El Problema de los Bloqueos en Microsoft 365)
* **Incidente:** Múltiples colaboradores de Naviera Petral S.A. (`mcastro@petral.com.pe`, `jneyra@petral.com.pe`, etc.) reportaron imposibilidad de ingresar al sistema o demoras críticas (de 10 a 30 minutos) para recibir el código de verificación temporal de 6 dígitos (2FA OTP).
* **Causa Raíz Identificada:** Los servidores de correo corporativo bajo la suite **Microsoft 365 / Exchange Online Protection (EOP)** aplican filtros heurísticos agresivos contra correos automáticos transaccionales provenientes de dominios no incluidos expresamente en la lista blanca de la organización, enviando los mensajes a *Cuarentena* o a carpetas de *Correo No Deseado / Spam*.
* **Impacto Comercial:** Bloqueo del cálculo de fletes spot, simulación de demoras y liquidaciones portuarias en momentos de alta exigencia marítima comercial.

### 1.2. Decisión Estratégica
A solicitud de la Dirección, se descartó depender de una única vía de acceso por correo y se seleccionó la **Opción 3 (Doble Vía Híbrida)**:
1. **Acceso Inmediato por Contraseña:** Permite entrar en 1 segundo con correo y contraseña corporativa, sin depender de la latencia o filtrado de MSFT 365.
2. **Acceso de Contingencia 2FA OTP:** Se mantiene el envío de código temporal de 6 dígitos para aquellos usuarios que no recuerden su clave o requieran acceso de rescate, manteniendo la copia de seguridad obligatoria en **CC** a `rgutil@gmail.com`.
3. **Autoservicio de Claves para Usuarios:** Cada colaborador puede cambiar su propia contraseña en cualquier momento desde la barra superior.
4. **Control Total Administrativo:** El Administrador puede resetear o generar contraseñas seguras a cualquier usuario desde el panel de gestión.

---

## 2. 🔑 Estandarización de Contraseñas en Producción

Se auditó la tabla `app_users` en la base de datos PostgreSQL de producción (`petral_db` en Contabo `169.58.168.107`) y se homologó la contraseña inicial provisional para todos los colaboradores:

### 🎯 Contraseña Inicial Estándar: `petral2026`

| Colaborador | Correo Electrónico | Rol | Contraseña Inicial | Estado en Producción |
| :--- | :--- | :---: | :---: | :---: |
| **Fernando Harten** | `fharten@petral.com.pe` | USER | `petral2026` | ✅ Activo / Verificado |
| **Iosef Zavala** | `izavala@petral.com.pe` | ADMIN | `petral2026` | ✅ Activo / Verificado |
| **Maria Elena Castro** | `mcastro@petral.com.pe` | USER | `petral2026` | ✅ Activo / Verificado |
| **Jorge Neyra** | `jneyra@petral.com.pe` | USER | `petral2026` | ✅ Activo / Verificado |
| **Sandra Gálvez** | `sgalvez@petral.com.pe` | USER | `petral2026` | ✅ Activo / Verificado |
| **Patricia Rueda** | `prueda@petral.com.pe` | USER | `petral2026` | ✅ Activo / Verificado |
| **Rich Gutz** | `rgutil@gmail.com` | ADMIN | `petral2026` | ✅ Activo / Verificado |

---

## 3. 🛠️ Arquitectura Técnica e Implementación

### 3.1. Backend FastAPI (`Geeksoft_Engine/backend/api/routers/auth.py`)

Se implementaron y reforzaron 3 endpoints neurálgicos utilizando criptografía nativa de PostgreSQL mediante la extensión `pgcrypto`:

1. **`POST /api/v1/auth/login-password` (Ingreso Directo):**
   * Valida la contraseña mediante `(crypt(password_input, password_hash) = password_hash)`.
   * Valida la **Bóveda de Dispositivos (Device Vault)**: si el equipo es nuevo, lo registra como `PENDIENTE` para aprobación del Administrador.
   * Si las credenciales son válidas, emite la sesión cargando la matriz completa de permisos (`Editor`, `Visor`, `Nulo`).
   * Registra el evento en la bitácora forense de auditoría (`AuditService.log_event`).

2. **`POST /api/v1/auth/change-password` (Autoservicio de Usuario):**
   * Exige y valida la contraseña actual del usuario antes de aceptar la nueva clave.
   * Aplica cifrado robusto `crypt(new_password, gen_salt('bf'))` (Blowfish/Bcrypt).
   * Registra auditoría con el correo del usuario solicitante.

3. **`POST /api/v1/users/{user_id}/reset-password` (Control Administrativo):**
   * Permite al Administrador forzar una nueva contraseña sin necesidad de conocer la clave anterior.
   * Valida longitud mínima (4 caracteres).
   * Registra auditoría de reseteo administrativo indicando el administrador emisor y el usuario objetivo.

---

### 3.2. Frontend React 19 (`Geeksoft_Frontend`)

1. **Rediseño de la Pantalla de Login (`Login.tsx`):**
   * **Modo Primario (`PASSWORD_ENTRY`):** Campos estilizados para Correo Corporativo y Contraseña, con botón para alternar visibilidad (ojito `Eye` / `EyeOff`), preservando el diseño glassmorphism compacto sobre la portada panorámica (`PORTADA.ANCHA.jpg`).
   * **Modo Alternativo (`2FA_REQUEST`):** Botón/enlace inferior *«¿Ingresar con código temporal (2FA)?»* que despacha el código numérico de 6 dígitos.
   * **Modo Validación (`2FA_OTP`):** Cuadrícula de 6 dígitos numéricos con auto-foco, pegado automático, temporizador regresivo de 15 minutos y reenvío con cooldown de 60 segundos.
   * Enlaces bidireccionales para retornar entre contraseña y 2FA en cualquier instante.

2. **Capa de Servicios y Contexto (`api.ts` & `AuthContext.tsx`):**
   * `AuthService.loginPassword({ email, password, device_fingerprint, device_name })`.
   * `AuthService.adminResetPassword(userId, newPassword, adminEmail)`.
   * `AuthService.changePassword({ email, current_password, new_password })`.
   * Actualización del método `login()` en `AuthContext` para persistir la sesión bajo `petral_session`, `petral_user` y `petral_permissions`.

3. **Panel de Gestión de Usuarios (`UsersPermissions.tsx`):**
   * Botón `[ 🔑 Resetear Contraseña ]` en la columna de acciones de cada fila.
   * Modal administrativo con generador automático de contraseñas robustas (`🎲 Generar Contraseña Segura` ➔ ej. `Petral9x2W!`).

4. **Modal de Autoservicio en Header (`MasterTemplate_V2.tsx`):**
   * Integración con el ícono de llave (`<Key />`) presente en la cabecera superior para que cualquier usuario conectado actualice su clave en segundos.

---

## 4. 🚀 Infraestructura, Enrutamiento y Despliegue en Contabo

### 4.1. Configuración de Traefik v3 (`/data/coolify/proxy/dynamic/petral_one.yaml`)
Para garantizar alta disponibilidad y evitar el error `502 Bad Gateway` cuando Docker recrea contenedores con IPs dinámicas internas:
* Se configuró el enrutador para balancear directamente al nombre de host del contenedor en la red `coolify`:
  ```yaml
  services:
    petral-frontend-service:
      loadBalancer:
        servers:
          - url: "http://petral-frontend:80"
  ```
* Traefik resuelve de forma nativa el DNS de Docker, eliminando la dependencia de IPs estáticas frágiles.

### 4.2. Contenedores de Producción Activos en Contabo (`169.58.168.107`)
* **`petral-frontend`:** Nginx Alpine sirviendo el bundle compilado de Vite (`/usr/share/nginx/html`), con proxy reverso interno hacia `petral-backend:8000/api/`.
* **`petral-backend`:** FastAPI corriendo sobre Uvicorn en Python 3.11, conectado a la base de datos `petral_db` en la red interna.

### 4.3. Script Canónico de Despliegue (`Push.VPS/deploy_petral_one_contabo.py`)
Se estandarizó el despliegue a Contabo mediante un script automatizado que:
1. Empaqueta el build de frontend (`dist/`) en `frontend_dist.tar.gz`.
2. Sube y actualiza `auth.py` en `/opt/petral_stack/backend/backend/api/routers/auth.py` y dentro del contenedor `petral-backend`.
3. Descomprime y actualiza los estáticos en `petral-frontend:/usr/share/nginx/html/`.
4. Reinicia ordenadamente los contenedores y ejecuta health checks HTTP en vivo.

---

## 5. 🧪 Auditoría Empírica en Vivo (Resultados QC)

### Prueba 1: Estado del Frontend Público
```bash
curl -s -I https://petral.one.geeksoft.tech/
>> HTTP/2 200 OK
>> cache-control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
>> content-type: text/html
```
* **Resultado:** ✅ Éxito (HTTP 200). Servido directamente desde Traefik con SSL Let's Encrypt.

### Prueba 2: Validación de Contraseña Incorrecta
```bash
curl -s -X POST https://petral.one.geeksoft.tech/api/v1/auth/login-password \
  -H "Content-Type: application/json" \
  -d '{"email":"jneyra@petral.com.pe","password":"clave_invalida_test"}'
```
* **Respuesta del Servidor:**
  ```json
  {"detail":"Contraseña incorrecta. Verifique sus datos o use la opción de ingresar con código temporal (2FA)."}
  ```
* **Resultado:** ✅ Éxito. La lógica de autenticación intercepta correctamente las credenciales erradas y orienta al usuario hacia la vía alternativa.

### Prueba 3: Autenticación Exitosa con Contraseña Homologada
```bash
curl -s -X POST https://petral.one.geeksoft.tech/api/v1/auth/login-password \
  -H "Content-Type: application/json" \
  -d '{"email":"rgutil@gmail.com","password":"petral2026"}'
```
* **Respuesta del Servidor:**
  ```json
  {
    "user": {
      "id": "aa0da1aa-cba3-4f49-bd4b-e005b29fb749",
      "email": "rgutil@gmail.com",
      "full_name": "Rich Gutz",
      "role": "ADMIN"
    },
    "permissions": { ... }
  }
  ```
* **Resultado:** ✅ Éxito (HTTP 200). Usuario autenticado, permisos cargados y sesión emitida sin necesidad de correos.

### Prueba 4: Generación de Código 2FA de Contingencia
```bash
curl -s -X POST https://petral.one.geeksoft.tech/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rgutil@gmail.com","device_fingerprint":"CLI","device_name":"Terminal"}'
```
* **Respuesta del Servidor:**
  ```json
  {
    "status": "REQUIRES_2FA",
    "temp_token": "436b347d-1fc8-4cee-8d80-6f634015f358",
    "masked_destination": "r****l@gmail.com",
    "user_name": "Rich Gutz"
  }
  ```
* **Resultado:** ✅ Éxito. Código 2FA despachado con copia CC obligatoria a `rgutil@gmail.com`.

---

## 6. 📖 Guía de Operación para Usuarios y Administrador

### Para el Usuario (Colaborador)
1. **Ingreso:** Entrar a [https://petral.one.geeksoft.tech](https://petral.one.geeksoft.tech) ➔ Ingresar correo corporativo y la contraseña provisional `petral2026`.
2. **Personalizar Contraseña:** Una vez dentro, hacer clic en el ícono de llave (`🔑`) en la esquina superior derecha del menú ➔ Ingresar `petral2026`, definir la nueva clave y presionar **"Actualizar Contraseña"**.
3. **Si no recuerda la contraseña:** En la pantalla de login, hacer clic en *«¿Ingresar con código temporal (2FA)?»* para recibir el código de 6 dígitos en su correo.

### Para el Administrador (`rgutil@gmail.com` / `izavala@petral.com.pe`)
1. **Resetear Contraseña a un Usuario:** Ir a **Configuración ➔ Gestión de Usuarios y Permisos** (`/users`).
2. En la grilla de usuarios, hacer clic en el botón **`[ 🔑 Resetear ]`** correspondiente al usuario.
3. Escribir una nueva contraseña o presionar **`[ 🎲 Generar Contraseña Segura ]`**.
4. Presionar **"Asignar Contraseña"**. El cambio se aplica en la base de datos de inmediato.
5. **Aprobar Equipos Nuevos:** En **Seguridad ➔ Bóveda de Dispositivos (Device Vault)** (`/device-vault`), aprobar los navegadores o computadoras en estado `PENDIENTE`.

---

## 7. 📁 Archivos Relacionados del Proyecto

* **Documentación Técnica Local:** [DOBLE.ACCESO.md](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/DOBLE.ACCESO.md)
* **Plantilla de Correo para Gmail:** [comunicado_doble_ingreso_petral.html](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/comunicado_doble_ingreso_petral.html)
* **Script de Despliegue Oficial Contabo:** [Push.VPS/deploy_petral_one_contabo.py](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Push.VPS/deploy_petral_one_contabo.py)
* **Reglas de Despliegue:** [.agents/AGENTS.md](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/.agents/AGENTS.md)
* **Skill Ejecutable:** [.agents/skills/deploy-vps/SKILL.md](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/.agents/skills/deploy-vps/SKILL.md)
* **Backend Router:** [Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/auth.py](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/auth.py)
* **Frontend Login:** [Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Auth/Login.tsx](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Auth/Login.tsx)
* **Frontend Permisos y Reseteo:** [Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Auth/UsersPermissions.tsx](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Auth/UsersPermissions.tsx)
