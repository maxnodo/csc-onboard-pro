
# Aprobacion Automatica de Documentacion y Notificacion por Correo

## Problema actual
- Existen botones manuales "Aprobar Documentacion" y "Rechazar Solicitud" que no deberian estar
- La aprobacion de la documentacion completa debe ser automatica cuando el 100% de los documentos individuales estan aprobados

## Solucion propuesta

### 1. Eliminar botones manuales de la UI
- Remover la tarjeta "Acciones" con los botones "Aprobar Documentacion" y "Rechazar Solicitud"
- Remover los dialogos asociados (Approve Dialog y Reject Request Dialog)
- Remover el estado y funciones relacionadas: `showApprove`, `selectedSede`, `showReject`, `rejectReason`, `handleApproveRequest`, `handleRejectRequest`

### 2. Auto-aprobacion al aprobar documentos individuales
- Despues de aprobar un documento individual (`handleApproveDoc`), verificar si TODOS los documentos del usuario ya estan aprobados
- Si el 100% esta aprobado, actualizar automaticamente el perfil a `approved_documentation`
- Mostrar un toast informando que la documentacion fue aprobada automaticamente

**Nota sobre la sede**: Actualmente la aprobacion manual requiere asignar una sede. Con la auto-aprobacion, la sede se asignaria en el paso del aprobador presencial (Panel del Aprobador), que ya existe en el sistema. Por lo tanto no se necesita asignar sede en este paso.

### 3. Notificacion por correo electronico
- Crear una nueva edge function `notify-documentation-approved` que envie un correo al usuario cuando su documentacion es aprobada
- El correo indicara que la documentacion fue aprobada y que debe acercarse a la sucursal
- Crear un template de correo React Email con el estilo CSC existente
- La edge function se invocara desde el frontend despues de la auto-aprobacion

### 4. Barra de progreso visual
- Agregar un indicador de progreso en la seccion de documentos que muestre cuantos documentos estan aprobados vs total
- Ejemplo: "5/8 documentos aprobados" con una barra de progreso

## Detalles tecnicos

### Cambios en `RequestReview.tsx`
- Eliminar: tarjeta "Acciones", dialogos de aprobacion/rechazo de solicitud, estados y handlers relacionados
- Modificar `handleApproveDoc` para verificar si todos los documentos quedan aprobados tras la accion
- Si todos aprobados: actualizar perfil a `approved_documentation` y llamar a la edge function de notificacion
- Agregar barra de progreso con conteo de aprobados

### Nueva edge function: `notify-documentation-approved`
```
supabase/functions/notify-documentation-approved/index.ts
```
- Recibe `userId`, `email`, `fullName` en el body
- Usa Resend (via LOVABLE_API_KEY y sendLovableEmail) con el dominio ya configurado `notify.csc.otronodo.com`
- Envia correo con template indicando aprobacion y que debe acercarse a la sucursal

### Nuevo template de correo
```
supabase/functions/_shared/email-templates/documentation-approved.tsx
```
- Estilo consistente con los templates existentes (colores CSC, tipografia)
- Contenido: "Su documentacion ha sido aprobada. Debe acercarse a la sucursal mas cercana para completar el proceso"

### Flujo completo
1. Admin aprueba documento individual (check verde)
2. Sistema verifica: todos los documentos aprobados?
3. Si: actualiza perfil a `approved_documentation`, envia correo, muestra toast
4. No: continua revision normal
