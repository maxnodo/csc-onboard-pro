

## Plan: Cambiar color primario azul (#1e3a5f) a rojo (#CC1D21)

El color azul `#1e3a5f` se usa como color primario en toda la aplicación. `#CC1D21` en HSL es aproximadamente `358 82% 46%`. El cambio se aplicará en dos áreas:

### 1. Variables CSS en `src/index.css`

Reemplazar las variables CSS que usan el azul por el nuevo rojo:

| Variable | Valor actual (azul) | Nuevo valor (rojo) |
|---|---|---|
| `--primary` (light) | `215 60% 28%` | `358 82% 46%` |
| `--ring` (light) | `215 60% 28%` | `358 82% 46%` |
| `--sidebar-background` | `215 25% 15%` | `358 50% 20%` |
| `--sidebar-accent` | `215 30% 22%` | `358 45% 28%` |
| `--sidebar-border` | `215 20% 25%` | `358 30% 25%` |
| `--foreground` | `215 25% 15%` | `358 30% 15%` |
| `--card-foreground` | `215 25% 15%` | `358 30% 15%` |
| `--popover-foreground` | `215 25% 15%` | `358 30% 15%` |

Modo dark: ajustar equivalentes oscuros con la misma familia de tonos rojos.

### 2. Templates de email (6 archivos)

Reemplazar todas las ocurrencias de `#1e3a5f` por `#CC1D21` en:
- `signup.tsx`, `invite.tsx`, `recovery.tsx`, `magic-link.tsx`, `email-change.tsx`, `reauthentication.tsx`, `documentation-approved.tsx`

Esto afecta el color del texto de marca, botones y enlaces en los correos.

### Resultado

Todo el sistema (UI + emails) cambiará de azul corporativo a rojo `#CC1D21` manteniendo la misma estructura visual.

