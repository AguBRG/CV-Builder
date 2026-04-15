# CV Builder Web

Aplicación web estática para cargar una sola vez la información de tu CV y generar dos formatos:

- ATS (1 columna)
- Personal (2 columnas)

Incluye:

- Vista previa instantánea
- Chequeo rápido de keywords ATS
- Guardado local automático en navegador
- Descarga en HTML
- Impresión a PDF

## Cómo usar

1. Abrí `index.html` en tu navegador.
2. Carga tus datos (datos base, experiencia, educación, idiomas).
3. Ingresa keywords del aviso para validar cobertura ATS.
4. Elige formato ATS o Personal.
5. Presiona "Generar CV".
6. Exporta con:
   - "Descargar HTML" para compartir/editar.
   - "Imprimir / PDF" para generar PDF.

## Recomendaciones ATS

- Usa nombres de sección estándar: Resumen profesional, Experiencia, Educación, Habilidades, Idiomas.
- Incluye keywords exactas del aviso.
- Prioriza logros con métrica (porcentaje, tiempo, impacto).
- Mantén consistencia de fechas y cargos.
- Evita texto en imágenes y diseños que rompan la lectura automática.

## Estructura

- `index.html`: interfaz y templates dinámicos
- `styles/app.css`: estilo de la app
- `styles/cv.css`: estilo del CV y reglas de impresión
- `scripts/app.js`: lógica de formulario, render y exportación
