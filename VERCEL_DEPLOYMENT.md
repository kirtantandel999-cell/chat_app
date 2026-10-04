# Deploying Full-Stack (Backend + Frontend) on Vercel

This repository is now fully configured for **monorepo full-stack deployment on Vercel**.

---

## Architecture on Vercel

- **Frontend**: Built from `client/` as static assets output to `client/dist`.
- **Backend**: Express REST API runs as a **Vercel Serverless Function** via [`api/index.js`](api/index.js).
- **Routing**: `vercel.json` automatically routes:
  - `/api/(.*)` -> `/api/index.js` (Express backend)
  - `/(.*)` -> `/client/dist/index.html` (React SPA)
- **MongoDB**: Cached serverless connection pool (`server/src/config/db.js`).
- **REST Fallback for Chat**: Messages send and fetch via REST API automatically if WebSockets are not connected, ensuring chats work on serverless environments.

---

## 1-Click / Git Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure full-stack Vercel deployment"
git push origin main
```

### 2. Import on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import your GitHub repository (`chat_app`).
3. Leave **Root Directory** as `./` (the root of the project).
4. Vercel will automatically read [`vercel.json`](vercel.json):
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/dist`

### 3. Add Environment Variables on Vercel
In the Vercel project settings under **Environment Variables**, add:

| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `MONGO_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/chat_app?retryWrites=true&w=majority` | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | `your_strong_jwt_random_secret_string` | Secret key for JWT tokens |
| `NODE_ENV` | `production` | Node environment |
| `CLIENT_URL` | `https://your-project.vercel.app` | Your Vercel domain (or `*` for all origins) |
| `VITE_API_URL` | `/api` | Relative `/api` endpoint for the frontend |

### 4. Deploy
Click **Deploy**!
Once finished, both your frontend React app and backend Express endpoints (`/api/*`) will run under the same domain.
