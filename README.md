# Reporte de Control de Plagas — Fumigaciones Hoffmann's

Aplicación web para generar **reportes de servicio de control de plagas** en PDF,
membretados con la marca Fumigaciones Hoffmann's. Funciona 100 % en el navegador:
no necesita servidor, instalación ni base de datos.

## Cómo usarla

1. Abre `index.html` en el navegador (doble clic o arrástralo a la ventana).
2. Llena los datos del servicio, marca plagas/productos/actividades, captura la firma
   y, si quieres, adjunta fotos.
3. Haz clic en **📄 Generar PDF**. El reporte se descarga listo para imprimir o enviar.

> Requiere conexión a internet la primera vez, porque la librería jsPDF se carga
> desde un CDN.

## Funcionalidades

- **Configuración de empresa** (nombre, dirección, teléfono, correo, licencia y logo).
  Se guarda en el navegador (`localStorage`), así que solo se captura una vez.
- **Datos del servicio**: cliente, fecha, técnico y **firma** dibujada en pantalla
  (funciona con mouse o con el dedo en celular).
- **Catálogos** de plagas y actividades con opciones base + las que agregues, y un
  catálogo de productos. Todo lo agregado queda guardado.
- **Hallazgos** y **recomendaciones** en texto libre.
- **Anexo fotográfico**: adjunta fotos con descripción. Cada foto se **reduce y
  recomprime automáticamente** al subirla para que el PDF no pese de más.
- **Folio automático** por reporte (con fecha y hora).

## El PDF

- **Membrete en todas las hojas**: logo + folio + línea verde de la marca.
- **Pie de página en todas las hojas**: contacto de la empresa + número de página.
- **Orden de las hojas**: 1) información del servicio · 2) anexo fotográfico ·
  3) firma del técnico.
- **Identidad de marca**: tipografía Nunito Sans incrustada y paleta de colores:

  | Color  | Hex       |
  |--------|-----------|
  | Verde  | `#3CB54D`  |
  | Gris   | `#333333`  |
  | Blanco | `#FFFFFF`  |

Si por algún motivo no carga el archivo de marca, el PDF se genera igual con un estilo
básico (sin logo y con tipografía estándar), en lugar de fallar.

## Estructura del proyecto

| Archivo        | Para qué sirve                                                        |
|----------------|----------------------------------------------------------------------|
| `index.html`   | Estructura de la página y formularios.                                |
| `styles.css`   | Estilos de la interfaz.                                               |
| `app.js`       | Lógica: catálogos, fotos, firma y generación del PDF.                 |
| `brand.js`     | Recursos de marca incrustados (logo y fuente Nunito Sans en base64).  |
| `docs/`        | Archivos fuente de la marca (logo original y tipografía).             |

## Dependencias

- [jsPDF 2.5.1](https://github.com/parallax/jsPDF) — generación del PDF (vía CDN).

## Notas

- Todos los datos (empresa, catálogos, fotos) viven en el `localStorage` del navegador;
  no se envían a ningún servidor.
- Los archivos `app.js` y `brand.js` se cargan con un parámetro de versión
  (`?v=...`) para forzar que el navegador tome siempre la versión más reciente.
