# 🔐 AS-BUILT: Sistema de Autenticación JWT, Roles y Permisos (RBAC)

> **Rutas UI**: `/login`, `/users`
> **Componentes React**: `Login.tsx`, `UsersPermissions.tsx`, `AuthProvider.tsx`, `ProtectedRoute.tsx`
> **Router Backend**: `backend/api/routers/auth.py`
> **Tabla Supabase**: `users`

---

## 🧭 Navegación
| [← Documentación Interactiva](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_11_Documentacion_Interactiva.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [← Volver al Plan Maestro](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/00_Plan_Maestro_AS_BUILT.md) |

---

## 🎯 1. Arquitectura de Seguridad y JWT Token Auth

El módulo de **Autenticación y Seguridad** protege la aplicación mediante tokens JWT (JSON Web Tokens) firmados en el backend FastAPI y persistidos en el cliente.

### 🛡️ Matriz de Módulos y Roles RBAC:
1. **`ADMIN`**: Acceso total al sistema, incluida la gestión de usuarios y roles en `/users`.
2. **`COMERCIAL`**: Acceso a la Matriz Financiera, Multicotizador, Clientes, Contratos y Precios de Búnker.
3. **`AUDITOR`**: Acceso a Auditoría Dual, Auditoría PxQ, Visor de PDFs y Gráficos de Liquidaciones.

```typescript
// Componente de Protección de Rutas en Frontend (ProtectedRoute.tsx)
<ProtectedRoute module="maestro_buques">
    <VesselsMaster />
</ProtectedRoute>
```

---

## 🔒 2. Encriptación de Credenciales
- Encriptación de passwords con **bcrypt** en Python backend (`auth.py`).
- Renovación y expiración automática de sesiones JWT.
