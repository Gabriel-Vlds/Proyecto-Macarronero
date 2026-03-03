# Proyecto Macarronero

Plataforma full stack para venta de cursos y kits, con:
- Backend `Node.js + Express + MySQL`.
- Frontend `Angular`.
- Integracion de pagos con `Stripe`.
- Integracion de video con `Mux` (carga directa, playback y soporte de playback firmado).

## Estructura principal

- `macarronero-backend/`: API REST, auth JWT, pagos, cursos, kits, suscripciones.
- `macarronero-frontend/`: app Angular para usuarios y admin.
- `DOCUMENTACION.md`: documentacion funcional/tecnica extendida.
- `render.yaml`: referencia de despliegue en Render.

## Requisitos

- Node.js 20+
- npm 10+
- MySQL 8+

## Backend (local)

1. Ir a carpeta backend:
	- `cd macarronero-backend`
2. Instalar dependencias:
	- `npm install`
3. Crear variables de entorno:
	- copiar `.env.example` -> `.env`
4. Iniciar API:
	- `npm run dev`

API base local:
- `http://localhost:3000/api`

Health:
- `http://localhost:3000/health`

## Frontend (local)

1. Ir a carpeta frontend:
	- `cd macarronero-frontend`
2. Instalar dependencias:
	- `npm install`
3. Iniciar app:
	- `npm start`

App local:
- `http://localhost:4200`

## Variables de entorno importantes (backend)

- `PORT`
- `FRONTEND_URL`
- `CORS_ORIGIN`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`
- `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`
- `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_KEY_PRIVATE` (para playback firmado)

## Estado funcional actual

- CRUD admin de cursos/kits/clientes.
- Carga de video a Mux desde admin.
- Soporte para URL manual o `playback_id` en lecciones.
- Reproduccion en detalle de curso con `mux-player`.
- Playback firmado en backend cuando hay signing key configurada.
- Watermark dinamico en reproductor para disuasion.
- Vista `Mi cuenta` robustecida para evitar cargas indefinidas.

## Notas de calidad

- Build frontend validado con `npm run build`.
- Test unitario actual del proyecto puede fallar por configuracion base de routing en `app.spec.ts` (preexistente).

## Produccion

- API productiva esperada: `https://macarronero-api.onrender.com/api`
- Frontend productivo esperado en servicio estatico de Render.
