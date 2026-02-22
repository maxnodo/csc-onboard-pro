

# Sistema de Onboarding Documental – CSC
## Corporación Socialista de Cemento

Sistema multi-fase para registro, carga documental, validación administrativa y aprobación presencial de usuarios.

---

## FASE 1 – Registro, Onboarding y Carga Documental

### 1.1 Autenticación y Registro
- Registro con email y contraseña
- Verificación de email obligatoria
- Estado inicial `pending_verification` → `onboarding_started` al verificar
- Diseño institucional con paleta corporativa (tonos industriales/formales, placeholder por ahora)

### 1.2 Selección de Categoría
- Pantalla de selección entre las 4 categorías: Distribuidor/Ferretería/Bloquera/Transformador, Constructor, Emprendedor, Alcaldía/Gobernación
- Al seleccionar, se genera dinámicamente la matriz documental correspondiente con los 3 tipos: FILE_UPLOAD, FORM_FIELD, FORM_GENERATED + FILE_UPLOAD

### 1.3 Onboarding por Etapas (3 pasos)
- **Etapa 1 – Información General**: formulario estructurado según categoría (Razón Social, RIF, dirección, representante legal, etc.) con guardado automático
- **Etapa 2 – Documentación**: carga de archivos (PDF/JPG/PNG), soporte de múltiples archivos donde aplique, indicador de estado por documento (Pendiente/Subido), validación de tipo y tamaño
- **Etapa 3 – Declaraciones y Confirmación**: aceptación de términos, declaración jurada, confirmación final → estado `under_review`
- Barra de progreso visual por porcentaje en todo el proceso

### 1.4 Generación de Documentos
- Generación automática de Hoja de Consignación y Carta de Solicitud con formato profesional base
- El usuario descarga, firma y re-sube el documento firmado

### 1.5 Base de Datos
- Tablas: usuarios (con perfil), sedes, documentos, formularios, roles
- Almacenamiento de archivos en Supabase Storage
- Matriz documental configurable por categoría
- Tabla de sedes con datos iniciales (10 plantas)

---

## FASE 2 – Panel Administrativo

### 2.1 Dashboard Admin
- Vista de solicitudes por categoría y filtros por estado
- Revisión individual de documentos con visor integrado
- Aprobar/Rechazar documentos con motivo obligatorio
- Historial de decisiones por solicitud

### 2.2 Gestión de Estados
- Cambio de estado: `under_review` → `approved_documentation` o `rejected`
- Asignación obligatoria de sede al aprobar (selección entre sedes autorizadas para el admin)
- Bloqueo de activación si `sede_id` es NULL
- Notificaciones por email al usuario ante cambios de estado

### 2.3 Gestión de Sedes
- CRUD de sedes (activar/desactivar)
- Cambio de sede post-activación con historial de auditoría obligatorio (admin_id, sede anterior, nueva sede, motivo, fecha)
- Notificación por email al usuario cuando su sede cambia

### 2.4 Roles y Permisos
- Sistema de roles: USER, ADMIN, APPROVER, SUPERADMIN
- ADMIN limitado a sedes autorizadas (excepto SUPERADMIN)
- Tabla de relación many-to-many entre admins/aprobadores y sedes

---

## FASE 3 – Aprobador Presencial y Automatizaciones

### 3.1 Panel del Aprobador
- Vista de usuarios en estado `approved_documentation` asignados a sus sedes autorizadas
- Verificación presencial: confirmar identidad, firma de Términos y Condiciones
- Activación final → estado `active_final`
- Rechazo presencial con motivo obligatorio y opción de devolver a revisión documental
- Email automático al usuario según resultado

### 3.2 Vencimiento Automático
- Vigencia de 30 días para `approved_documentation`
- Cambio automático a `expired_documentation` al vencer (sin eliminar documentos)
- Notificación por email al usuario
- Opción de reactivación manual por ADMIN sin nueva carga documental

### 3.3 Emails Transaccionales
- Notificaciones en cada cambio de estado con tono formal/institucional
- Branding CSC en todos los correos
- Templates para: verificación, aprobación documental, rechazo, activación final, cambio de sede, vencimiento

---

## Diseño y UX
- Interfaz profesional, institucional y corporativa
- Desktop prioritario, adaptable a tablet
- Colores sobrios/industriales (placeholders, reemplazables por branding real)
- Formularios claros y bien espaciados
- Estados visuales diferenciados con colores y badges
- Tono formal en todos los mensajes y notificaciones

