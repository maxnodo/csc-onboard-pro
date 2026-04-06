

## Plan: Tres ajustes en `src/lib/document-matrix.ts`

Archivo único a modificar: `src/lib/document-matrix.ts`. Sin cambios en ningún otro archivo.

### Cambio 1 — Acta de Asamblea en Distribuidor y Constructor

Insertar en `documentMatrixByCategory.distribuidor` después de `declaracion_islr_iva`:
```ts
file("acta_asamblea", "Última Acta de Asamblea", { conditional: true, conditionalLabel: "Si aplica" }),
```

Insertar en `documentMatrixByCategory.constructor` después de `declaracion_islr_iva`:
```ts
file("acta_asamblea", "Última Acta de Asamblea", { conditional: true, conditionalLabel: "Si aplica" }),
```

### Cambio 2 — Campo RIF en formulario Emprendedor

Insertar en `formFieldsByCategory.emprendedor` después del campo `cedula`:
```ts
ff("rif", "RIF", "text", true, "V-12345678-9"),
```

### Cambio 3 — Campo RIF institucional en formulario Alcaldía

Insertar en `formFieldsByCategory.alcaldia` después del campo `nombre_ente`:
```ts
ff("rif_institucional", "RIF Institucional", "text", true, "G-20012345-0"),
```

### Resultado

Se mostrará el archivo completo resultante para verificación.

