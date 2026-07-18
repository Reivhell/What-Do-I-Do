# 🚀 Deploying to Railway

This guide explains how to deploy **What Do I Do** (the NestJS server and React Vite client) to [Railway](https://railway.app).

Since this is a monorepo with shared packages (`@whatdo/shared`), both services must build from the repository root (`/`) to resolve local workspace dependencies correctly.

---

## 📦 Deployment Overview

You will deploy **two separate services** from this single repository:
1. **API Server (`whatdo-server`)**: Backed by a persistent SQLite volume.
2. **Frontend Client (`whatdo-client`)**: Serves the static Vite React app using `serve`.

---

## 1. Deploying the API Server (`whatdo-server`)

The API server runs NestJS with a SQLite database. Follow these steps to deploy it:

### Steps:
1. In the Railway Dashboard, click **New Project** -> **Deploy from GitHub repo**.
2. Select your repository.
3. In the service card settings (cog icon):
   - **Service Name**: Set to `whatdo-server` (or similar).
   - **Root Directory**: Keep it as `/` (default).
   - **Railway Config File**: Set to `/server/railway.toml` (or `/railway.toml`).
4. **Volume Mount (Crucial for SQLite)**:
   - Go to the **Settings** tab of the server service.
   - Click **Add Volume**. Mount the volume at `/data` (e.g. size 1GB-10GB).
5. **Environment Variables**:
   - Go to the **Variables** tab of the server service.
   - Add the following environment variables:
     * `NODE_ENV`: `production`
     * `SERVER_HOST`: `0.0.0.0` (required for external traffic)
     * `DATABASE_PATH`: `/data/what-do-i-do.db` (points to the persistent volume mount)
     * `CORS_ORIGIN`: `https://your-frontend-client.up.railway.app` (your frontend service's public URL)
     * `JWT_SECRET`: A secure random string.

Railway will automatically run migrations and start the NestJS backend. You can verify it by checking the service logs or visiting `https://your-server.up.railway.app/api/settings` (it should return a response).

---

## 2. Deploying the Frontend Client (`whatdo-client`)

The frontend is a static React application built with Vite. It needs to know the API Server's URL during the build phase.

### Steps:
1. In your Railway project, click **New** -> **Github Repo** and select the same repository again (creating a second service).
2. In the service card settings (cog icon):
   - **Service Name**: Set to `whatdo-client` (or similar).
   - **Root Directory**: Keep it as `/` (default).
   - **Railway Config File**: Set to `/client/railway.toml`.
3. **Environment Variables**:
   - Go to the **Variables** tab.
   - Add the following environment variables:
     * `VITE_API_URL`: `https://your-server.up.railway.app` (the public domain URL of your API Server)
     * `NODE_ENV`: `production`

Railway will build the client using `npm run build -w client` (which automatically injects `VITE_API_URL` into the compiled JS bundle) and then serve it using `serve -s` (with SPA fallback support for React Router).

---

## 🧩 How Config as Code works

The repository includes configuration files in each directory:
- [railway.toml](file:///home/sejel/Documents/what%20do%20i%20do/railway.toml) / [server/railway.toml](file:///home/sejel/Documents/what%20do%20i%20do/server/railway.toml): Tells Railway how to compile workspace dependencies and start NestJS.
- [client/railway.toml](file:///home/sejel/Documents/what%20do%20i%20do/client/railway.toml): Tells Railway how to compile Vite and use `serve` to handle Single Page Application (SPA) client-side routes.
