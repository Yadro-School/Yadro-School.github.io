# Сторонние библиотеки сайта

Лежат рядом с сайтом, чтобы не грузить код с чужих CDN (подмена на CDN = чужой код на странице с данными учеников). Взяты из npm, версии зафиксированы. Обновлять только целиком, с проверкой распознавания расписания.

| Файл | Пакет и лицензия | Размер | Хэш |
|---|---|---|---|
| `xlsx.full.min.js` | xlsx 0.18.5 (SheetJS, Apache-2.0) | 861 КБ | `sha384-vtjasyidUo0kW94K5MXDXntzOJpQgBKXmE7e2Ga4LG0skTTLeBi97eFAXsqewJjw` |
| `pdf.min.js` | pdfjs-dist 3.11.174 (Apache-2.0) | 312 КБ | `sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e` |
| `pdf.worker.min.js` | pdfjs-dist 3.11.174 (Apache-2.0) | 1061 КБ | `sha384-SnzOobpRMLXZ52iJvZm/C0fYw0OQemTXzTjIsdsfMcrCtCEe9qgzxTd3RSklO5x2` |
| `qrcode.js` | qrcode-generator 1.4.4 (MIT) | 55 КБ | `sha384-8FWZA6BGMXhsfO+BLtrJK0We6gg5o1JyO8xQm6peWDEUs17ACA5ziE/NIAkl9z2k` |
| `tesseract.min.js` | tesseract.js 5.1.1 (Apache-2.0) | 65 КБ | `sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F` |
| `tesseract-worker.min.js` | tesseract.js 5.1.1 worker (Apache-2.0) | 120 КБ | `sha384-zxn+VqofFzXpH99dUb3fa4ywoSBQJPy6/6oEaJHPlblZXr53a0g1Jl6720vgSzB7` |
| `tesseract-core/tesseract-core-lstm.wasm.js` | tesseract.js-core 5.1.1 (Apache-2.0) | 3845 КБ | `sha384-EKWY5JDwphQoyxhvYU7eaCcyQ0EdV6fZK3L2vzfZcv2ichRdNd6pSnyWPNv6fMuR` |
| `tesseract-core/tesseract-core-simd-lstm.wasm.js` | tesseract.js-core 5.1.1 (Apache-2.0) | 3846 КБ | `sha384-YM1G+zaWYy9VSRP2C101LCgzh7n3Hqb6OEm9qDoZYgCADsni3nnECskC3WialQB7` |
| `lang/rus.traineddata.gz` | tessdata_fast rus (Tesseract 5, Apache-2.0) — на нём проверено распознавание фото и сканов | 1572 КБ | `sha384-P/9fYc2ZWeD2yUuXL0mnxenEI2dO2P04czHtkaf//SLP3wBbcevTTnfdvTCMxL5r` |
