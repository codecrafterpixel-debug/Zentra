# ZENTRA Clothing Brand

A static clothing storefront with admin product management and a shared backend API for product persistence.

## Features

- Home, shop, auth, admin, and user-panel pages
- Admin-only product CRUD flow
- Shared API layer for product persistence

## Local development

1. Open the project folder in a browser or local server.
2. Start the local API if needed:
   - `node api/products.js`
3. Update the API URL in `js/config.js` if required.

## Deployment

- Frontend: Netlify/Vercel
- Backend/API: Vercel or another hosted service
- Database: Supabase/PostgreSQL

## Supabase setup

1. In your Supabase project, create a `products` table with the same fields used by the API.
2. Set these environment variables in Vercel for the backend deployment:
   - `DB_HOST` or `POSTGRES_HOST`
   - `DB_PORT` or `POSTGRES_PORT`
   - `DB_NAME` or `POSTGRES_DATABASE`
   - `DB_USER` or `POSTGRES_USER`
   - `DB_PASSWORD` or `POSTGRES_PASSWORD`
   - `DB_SSLMODE` or `PGSSLMODE` (optional, default: `prefer`)
3. Deploy the project and verify `/api/health` returns `ok`.
