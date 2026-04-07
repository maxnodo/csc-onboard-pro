

## Plan: Mostrar RIF en el diálogo de activación

Archivo único: `src/pages/admin/ApproverPanel.tsx`

### Cambio

En el `DialogDescription` del diálogo de activación (línea ~193), agregar el RIF del usuario seleccionado debajo del nombre. Se usa `getRif(selectedProfile.id)` que ya existe en el componente.

Resultado visual en el diálogo:

```text
Confirme la verificación presencial de **Luis Pérez**
RIF: J-12345678-9
```

Si el RIF no está disponible, no se muestra esa línea.

