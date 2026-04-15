# CV Builder Web

Aplicacion web estatica para cargar una sola vez la informacion de tu CV y generar dos formatos:

- ATS (1 columna)
- Personal (2 columnas)

Incluye:

- Vista previa instantanea
- Chequeo rapido de keywords ATS
- Guardado local automatico en navegador
- Descarga en HTML
- Impresion a PDF

## Como usar

1. Abri `index.html` en tu navegador.
2. Carga tus datos (datos base, experiencia, educacion, idiomas).
3. Ingresa keywords del aviso para validar cobertura ATS.
4. Elige formato ATS o Personal.
5. Presiona "Generar CV".
6. Exporta con:
   - "Descargar HTML" para compartir/editar.
   - "Imprimir / PDF" para generar PDF.

## Recomendaciones ATS

- Usa nombres de seccion estandar: Resumen profesional, Experiencia, Educacion, Habilidades, Idiomas.
- Incluye keywords exactas del aviso.
- Prioriza logros con metrica (porcentaje, tiempo, impacto).
- Manten consistencia de fechas y cargos.
- Evita texto en imagenes y disenos que rompan lectura automatica.

## Estructura

- `index.html`: interfaz y templates dinamicos
- `styles/app.css`: estilo de la app
- `styles/cv.css`: estilo del CV y reglas de impresion
- `scripts/app.js`: logica de formulario, render y exportacion
