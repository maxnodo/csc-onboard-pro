

## Plan: Subcategoría de Distribuidor en CategorySelection

### Comportamiento

Cuando el usuario hace clic en "Distribuidor", en lugar de ir directo al onboarding, la pantalla cambia a un segundo paso mostrando 5 opciones de tipo. Las otras 3 categorías siguen funcionando igual (clic → onboarding).

### Archivo a modificar

**Solo `src/pages/onboarding/CategorySelection.tsx`**

### Lógica

1. Agregar estado local `selectedCategory` (inicialmente `null`).
2. Al hacer clic en una categoría:
   - Si **no es** `distribuidor`: ejecutar `handleSelect` como ahora (update profile → navigate).
   - Si **es** `distribuidor`: setear `selectedCategory = "distribuidor"` para mostrar el segundo paso.
3. Segundo paso — se reemplaza el grid de categorías por:
   - Título: "Seleccione el tipo de Distribuidor"
   - 5 tarjetas con las opciones:
     - Distribuidor Minorista
     - Ferretería
     - Bloquera
     - Transformador
     - Concretos Premezclados / Firmas Personales
   - Botón "Volver" para regresar al paso de categorías (`selectedCategory = null`).
4. Al seleccionar un tipo:
   - Upsert en `form_data` con `{ subcategoria_distribuidor: "valor_seleccionado" }` para el usuario.
   - Luego ejecutar el `handleSelect("distribuidor")` existente (update profile → navigate).

### Persistencia

Se guarda en la tabla `form_data` existente. Si ya existe un registro para el usuario con categoría `distribuidor`, se hace update del campo JSONB; si no existe, se inserta uno nuevo. La clave dentro del JSON es `subcategoria_distribuidor` con el texto plano de la opción elegida.

### UI

Misma estructura visual que las tarjetas de categoría. Cada opción usa un icono apropiado de Lucide. El botón "Volver" aparece arriba del grid con una flecha izquierda.

