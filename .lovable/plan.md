

# Correccion: Validar documentos requeridos antes de auto-aprobar

## Problema
La logica de auto-aprobacion en `RequestReview.tsx` (linea 111) solo verifica que todos los documentos **subidos** esten aprobados. No valida que el usuario haya subido **todos los documentos requeridos** segun la matriz documental de su categoria.

Ejemplo: Si la categoria requiere 5 documentos y el usuario solo subio 3, al aprobar esos 3 el sistema auto-aprueba porque "todos los documentos existentes estan aprobados".

## Solucion

### Cambio en `src/pages/admin/RequestReview.tsx`

En la funcion `handleApproveDoc`, despues de aprobar un documento individual:

1. Obtener la lista de documentos requeridos (no condicionales) de `documentMatrixByCategory` usando la categoria del perfil del usuario
2. Verificar que para **cada documento requerido** exista al menos un documento subido con estado "approved"
3. Solo si el 100% de los requeridos estan cubiertos y aprobados, proceder con la auto-aprobacion

### Cambios en la barra de progreso

Actualmente la barra muestra `aprobados / subidos`. Deberia mostrar `aprobados / requeridos` para que el admin vea claramente cuantos faltan.

### Detalle tecnico

```
// Importar documentMatrixByCategory (ya importado categoryLabels del mismo archivo)
import { categoryLabels, documentMatrixByCategory } from "@/lib/document-matrix";

// En handleApproveDoc, reemplazar la validacion actual:
const updatedDocs = documents.map(d => d.id === docId ? {...d, status: "approved"} : d);
const allApproved = updatedDocs.every(d => d.status === "approved");

// Por esta validacion correcta:
const category = profile?.category;
const requirements = category ? documentMatrixByCategory[category] || [] : [];
const requiredDocs = requirements.filter(r => !r.conditional);
const updatedDocs = documents.map(d => d.id === docId ? {...d, status: "approved"} : d);

const allRequiredApproved = requiredDocs.every(req => 
  updatedDocs.some(d => d.document_type === req.key && d.status === "approved")
);

// Solo auto-aprobar si TODOS los requeridos tienen documento aprobado
if (allRequiredApproved && requiredDocs.length > 0 && profile) { ... }
```

Para la barra de progreso, calcular contra requeridos:

```
const requiredDocs = requirements.filter(r => !r.conditional);
const approvedCount = requiredDocs.filter(req => 
  documents.some(d => d.document_type === req.key && d.status === "approved")
).length;
const progressPercent = requiredDocs.length > 0 ? (approvedCount / requiredDocs.length) * 100 : 0;
```

### Archivos a modificar
- `src/pages/admin/RequestReview.tsx` - Agregar import de `documentMatrixByCategory`, corregir logica de auto-aprobacion y barra de progreso

