

## Plan: Cambiar fuente a Tahoma

### Cambios

1. **`src/index.css`**
   - Eliminar el `@import` de Google Fonts (Inter + Playfair Display)
   - Cambiar `font-family` del body de `'Inter'` a `'Tahoma', Geneva, sans-serif`
   - Cambiar `font-family` de `h1, h2, h3` de `'Playfair Display'` a `'Tahoma', Geneva, sans-serif`

2. **Email templates** (7 archivos en `supabase/functions/_shared/email-templates/`)
   - Reemplazar `"'Inter', Arial, sans-serif"` por `"'Tahoma', Geneva, sans-serif"` en el estilo `main`
   - Reemplazar `"'Playfair Display', Georgia, serif"` por `"'Tahoma', Geneva, sans-serif"` en los estilos `brand` y `h1`

Tahoma es una fuente del sistema, no requiere importar desde Google Fonts.

