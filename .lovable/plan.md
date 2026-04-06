

## Plan: Reordenar y actualizar labels en `document-matrix.ts`

Archivo único: `src/lib/document-matrix.ts`. Sin cambios en ningún otro archivo.

### Cambio 1 — Reordenar `acta_prorroga` en Constructor

Mover de posición 11 (línea 61, después de `referencia_bancaria`) a después de `contrato_obra` (línea 58). El orden resultante será:

1. commonGenerated (2)
2. acta_constitutiva
3. declaracion_islr_iva
4. acta_asamblea
5. cedula_accionistas
6. rif_empresa_accionistas
7. registro_fotografico
8. memoria_descriptiva
9. contrato_obra
10. **acta_prorroga** ← movido aquí
11. referencias_comerciales
12. referencia_bancaria

### Cambio 2 — Actualizar labels

**Distribuidor (líneas 42, 45, 46, 47):**
- `"Cédula de Accionistas"` → `"Cédula de Identidad de los Accionistas"`
- `"Registro Fotográfico"` → `"Registro Fotográfico (mín. 4 fotos a color)"`
- `"Referencias Comerciales (3)"` → `"Referencias Comerciales — 3 originales, vigencia ≤ 90 días"`
- `"Referencia Bancaria"` → `"Referencia Bancaria — 1 original, vigencia ≤ 30 días"`

**Constructor (líneas 54, 56, 57, 59, 60):**
- Mismos 4 labels que distribuidor
- `"Memoria Descriptiva"` → `"Memoria Descriptiva (firmada por Ingeniero o Arquitecto)"`

**Emprendedor (líneas 69, 70, 71):**
- `"Registro IVSS"` → `"Registro del Emprendimiento en el IVSS"`
- `"Registro INCES"` → `"Registro del Emprendimiento en el INCES"`
- `"Registro FAOV"` → `"Registro del Emprendimiento en el FAOV"`

**Alcaldía (líneas 75, 76, 77, 78):**
- `"Gaceta Oficial"` → `"Gaceta Oficial de la Alcaldía o Gobernación"`
- `"Nombramiento de Autoridad"` → `"Gaceta de Nombramiento del Alcalde o Gobernador"`
- `"Cédula de la Autoridad"` → `"Cédula de Identidad del Alcalde o Responsable"`
- `"RIF Institucional"` → `"RIF de la Alcaldía/Gobernación y del Alcalde/Gobernador"`

