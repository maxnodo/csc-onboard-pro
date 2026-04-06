

## Plan: Búsqueda por RIF en el Panel del Aprobador

### Problema
El RIF se almacena en `form_data.form_data` (JSONB), no en `profiles`. La consulta actual solo carga `profiles`, por lo que no tiene acceso al RIF para filtrar.

### Cambios en `src/pages/admin/ApproverPanel.tsx`

1. **Cargar form_data junto con profiles**: Después de obtener los profiles, hacer una segunda consulta a `form_data` para todos los `user_id` de esos profiles (categoría `distribuidor`, `constructor`, etc.). Almacenar en un `Map<userId, formData>`.

2. **Extender el filtro de búsqueda**: En la función `filtered`, además de buscar en `email` y `full_name`, buscar en el campo `rif` (o `rif_institucional`) del `formData` correspondiente al usuario.

3. **Mostrar RIF en la tabla**: Agregar una columna "RIF" a la tabla que muestre el valor extraído del `form_data` de cada usuario. Si no tiene RIF, mostrar "—".

### Detalle técnico

- Nuevo estado: `formDataMap` (`Record<string, any>`).
- En `loadData`, después de obtener profiles, consultar `form_data` filtrando por los `user_id` obtenidos.
- El RIF puede estar bajo la clave `rif` o `rif_institucional` dependiendo de la categoría; se busca en ambos.
- No requiere cambios en la base de datos.

