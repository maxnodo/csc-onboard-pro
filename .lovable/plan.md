

## Plan: Reemplazar branding del login con logo institucional

### Situacion actual
La pagina Auth.tsx usa el icono `Building2` + texto "CSC" + "Corporacion Socialista de Cemento" como branding. Se reemplazara con las imagenes del logo real.

### Logica de uso de cada imagen
- **Logo letras blancas** → panel izquierdo (fondo rojo `bg-primary`) - el blanco contrasta perfectamente
- **Logo letras rojas** → version mobile (fondo claro) - el rojo se ve sobre fondo blanco

### Archivos

1. **Copiar imagenes** al proyecto:
   - `user-uploads://Logo_letras_blancas-2.png` → `src/assets/logo-letras-blancas.png`
   - `user-uploads://Logo_letras_rojas.png` → `src/assets/logo-letras-rojas.png`

2. **`src/pages/Auth.tsx`**
   - Eliminar import de `Building2`
   - Importar ambas imagenes desde `@/assets/`
   - **Panel izquierdo (desktop):** reemplazar el bloque del icono + texto (lineas 74-81) por la imagen blanca centrada con `max-h-28` o similar. Mantener el titulo "Sistema de Registro y Onboarding Documental" y la descripcion debajo
   - **Version mobile (lineas 99-105):** reemplazar `Building2` + texto por la imagen roja con `max-h-16`
   - El fondo rojo y los efectos decorativos se mantienen intactos

### Resultado visual (panel izquierdo)

```text
┌─────────────────────────┐
│  [fondo rojo actual]    │
│                         │
│   [Logo blanco CSC]     │  ← imagen centrada, ~h-28
│   Corp. Socialista...   │
│                         │
│   Sistema de Registro   │
│   y Onboarding          │
│   Documental            │
│                         │
│   Plataforma integral...│
└─────────────────────────┘
```

