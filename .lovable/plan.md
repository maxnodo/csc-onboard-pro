

## Plan: Agregar cintillo institucional al pie de todas las páginas (excepto login)

### Enfoque

Copiar la imagen al proyecto y crear un componente `InstitutionalFooter` reutilizable que se integre en los dos layouts principales: `AppLayout` (dashboard/admin) y `OnboardingLayout`.

### Archivos a modificar/crear

1. **Copiar imagen** → `src/assets/cintillo-header.png`

2. **Crear `src/components/InstitutionalFooter.tsx`**
   - Componente con fondo blanco, borde superior sutil, padding equilibrado
   - Importa la imagen desde `@/assets/cintillo-header.png`
   - Muestra la imagen centrada con `max-h` controlado para que sea elegante y no invasiva
   - Texto pequeño opcional: "© 2026 Corporación Socialista de Cemento, S.A."

3. **Modificar `src/components/AppLayout.tsx`**
   - Agregar `<InstitutionalFooter />` después del `<main>`, dentro del contenedor flex vertical

4. **Modificar `src/pages/onboarding/OnboardingLayout.tsx`**
   - Agregar `<InstitutionalFooter />` después del `<main>`

### Diseño visual

```text
┌─────────────────────────────────┐
│  Contenido de la página         │
│  ...                            │
├─────────────────────────────────┤  ← borde sutil
│  [cintillo institucional img]   │  ← centrado, altura ~40px
│  © 2026 CSC, S.A.              │  ← texto copyright pequeño
└─────────────────────────────────┘
```

- Fondo: blanco (`bg-white`) con borde superior `border-t`
- Imagen: centrada, `max-h-10` para mantener proporción profesional
- El footer NO aparece en `Auth.tsx` (login) ya que Auth no usa ninguno de estos layouts

### Técnico

- La imagen se importa como módulo ES6 desde `src/assets/` para optimización de bundling
- El componente es puro presentacional, sin lógica ni estado

