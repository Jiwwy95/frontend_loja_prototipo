# Frontend – Prototipo Rutas Turísticas Loja

Incluye:
- Buscador con barra de texto y filtros (presupuesto, duración).
- Tarjetas con imagen, nombre, descripción, lugares, precio.
- Modal “Ver más” y botón “Agregar a itinerario” (localStorage).
- Fallback a `mock-data.json` si la API no está disponible.

## Ejecutar
1) Doble clic en `index.html` (para una demo rápida).
2) Recomendado: servir con un server local para evitar CORS:
```bash
python -m http.server 5500
```
Abrir http://localhost:5500

## Configurar Backend
Editar `static/config.js`:
```js
window.APP_CONFIG = {
  API_BASE_URL: 'http://localhost:5000',
  USE_MOCK_WHEN_OFFLINE: true
};
```
Contrato esperado de `/buscar` (GET): `q`, `budget` (barato|medio|alto), `duration` (1-3|4-6|7-10).
La respuesta puede usar `id` o `_id`. El frontend lo adapta.

## Estructura
```
frontend_loja_prototipo/
├─ index.html
├─ static/
│  ├─ app.js
│  ├─ config.js
│  ├─ styles.css
│  ├─ img/placeholder.png
│  └─ mock-data.json
```