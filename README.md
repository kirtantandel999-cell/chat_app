# TaskFlow Chat

A modern, responsive real-time 1-to-1 chat web application with **Dark & Light Mode** and **Photo & File Sharing**, built with Node.js, Express, MongoDB (GridFS), Socket.IO, React, Vite, and Tailwind CSS v4.

---

## 1. Features
- **Dark & Light Mode:** Seamless support for Light, Dark, and System (OS match) modes with zero flash of unstyled theme on initial load.
- **User Authentication:** Secure JWT registration, login, and profile updates with password invalidation.
- **User Search & Discovery:** Discover other users by name or email to initiate 1-to-1 chats.
- **Real-Time 1-to-1 Messaging:** Real-time message exchange powered by Socket.IO with acknowledgement callbacks.
- **Photo & File Sharing:** Secure upload and sharing of photos (JPG, PNG, GIF, WebP) and files (PDF, DOCX, XLSX, PPTX, TXT, CSV, ZIP) up to 10 MB backed by MongoDB GridFS.
- **Image Previews & Direct Opening:** In-chat image thumbnails opening directly in a new tab via memory-safe blob object URLs.
- **Online / Offline Presence:** In-memory tracking of live connections and real-time user presence indicators.
- **Live Typing Indicators:** Real-time feedback when your contact is typing.
- **Unread Counts & Read Receipts:** Tracks unread messages per conversation, marked as read upon viewing.
- **Cursor-Paginated History:** Chronological message loading with scroll-to-top older message fetching.
- **Responsive Two-Panel Interface:** Split desktop layout and adaptive mobile chat views with accessibility focus indicators.

---

## 2. Tech Stack
- **Backend:** Node.js (ES modules), Express, MongoDB (Mongoose & GridFS), Multer, Socket.IO, JWT + bcrypt, Zod.
- **Frontend:** React 18, Vite, React Router v6, Axios, Socket.IO Client, Tailwind CSS v4 with `@custom-variant dark`.
- **Testing:** Vitest with Supertest & MongoMemoryServer (backend), Vitest with Testing Library & jsdom (frontend).

---

## 3. Folder Structure
```text
chat-application/
├── server/
│   ├── src/
│   │   ├── config/          # DB connection, GridFS bucket, env validation
│   │   ├── models/          # User, Conversation, Message (with attachment schema)
│   │   ├── controllers/     # authController, conversationController, fileController, userController
│   │   ├── routes/          # Express route declarations (auth, conversations, files, users)
│   │   ├── sockets/         # Socket.IO auth, chat handlers, presence
│   │   ├── middleware/      # authMiddleware, uploadMiddleware, validate, errorHandler
│   │   ├── utils/           # fileUtils (MIME validation, rate limiters)
│   │   ├── validators/      # Zod validation schemas
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # HTTP server & Socket.IO initialization
│   └── tests/               # Hermetic Vitest test suites (auth, conversations, messages, attachments, sockets)
├── client/
│   ├── src/
│   │   ├── api/             # Axios instance & domain API modules
│   │   ├── components/      # UI components (ThemeToggle, ChatWindow, MessageBubble, MessageInput, etc.)
│   │   ├── context/         # ThemeContext, AuthContext, SocketContext, ChatContext
│   │   ├── hooks/           # useTheme, useAuth, useConversations, useMessages, useFileUrl, useTyping
│   │   ├── layouts/         # AuthLayout, MainLayout, Navbar, Footer
│   │   ├── pages/           # Chat, Profile, Login, Register, NotFound
│   │   └── routes/          # Router & Route Guards
│   └── src/__tests__/       # Vitest client component tests (Theme, MessageInput, MessageBubble, Button, ProtectedRoute)
└── README.md
```

---

## 4. Getting Started

### Prerequisites
- Node.js LTS and npm
- MongoDB database (local MongoDB instance or free MongoDB Atlas cluster)
  > **Note on MongoDB Atlas:** The free M0 cluster provides 512 MB of total storage. Uploading attachments will count against this limit; configure `MAX_FILE_SIZE_MB` appropriately.

### Local Setup
1. **Server Configuration:**
   ```bash
   cd server
   cp .env.example .env
   # Populate MONGO_URI and JWT_SECRET in server/.env
   npm install
   npm run dev      # Runs API & WebSockets on http://localhost:5000
   ```
2. **Client Configuration:**
   ```bash
   cd ../client
   cp .env.example .env
   npm install
   npm run dev      # Runs frontend on http://localhost:5173
   ```
3. Open `http://localhost:5173` in your browser, register two test users across two windows, and start chatting and sharing files!

---

## 5. Environment Variables

| Variable | Location | Default / Example | Purpose |
|---|---|---|---|
| `PORT` | Server | `5000` | Port for the HTTP & WebSocket server |
| `NODE_ENV` | Server | `development` | Runtime environment mode |
| `MONGO_URI` | Server | `mongodb://127.0.0.1:27017/chat_db` | MongoDB connection string |
| `JWT_SECRET` | Server | `long_random_jwt_secret_key` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Server | `7d` | Token expiration duration |
| `CLIENT_URL` | Server | `http://localhost:5173` | Allowed CORS origin |
| `MAX_FILE_SIZE_MB` | Server | `10` | Maximum file attachment size in MB |
| `VITE_API_URL` | Client | `/api` | Base path for REST API calls |
| `VITE_SOCKET_URL` | Client | `/` | Base URL for Socket.IO connection |

---

## 6. API & Socket Overview

### REST Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user account |
| POST | `/api/auth/login` | Public | Authenticate user & issue JWT |
| GET | `/api/auth/me` | Protected | Restore active session user profile |
| PATCH | `/api/auth/change-password` | Protected | Change password & refresh token |
| GET | `/api/users?search=` | Protected | Search users (excludes caller) |
| GET | `/api/users/me` | Protected | Get personal profile |
| PATCH | `/api/users/me` | Protected | Update personal name/email |
| DELETE | `/api/users/me` | Protected | Delete account & cascade chat data |
| GET | `/api/conversations` | Protected | List user conversations with unread counts |
| POST | `/api/conversations` | Protected | Get or create 1-to-1 conversation |
| GET | `/api/conversations/:id/messages` | Protected | Fetch messages with cursor pagination |
| POST | `/api/conversations/:id/messages` | Protected | Multipart upload of file/photo with optional caption |
| POST | `/api/conversations/:id/read` | Protected | Mark conversation messages as read |
| GET | `/api/files/:fileId` | Protected | Stream attached file/image from GridFS (participants only) |

### Socket.IO Events
- **Client to Server:** `message:send` (with ack), `typing:start`, `typing:stop`
- **Server to Client:** `message:new`, `typing:update`, `presence:init`, `presence:update`, `conversation:updated`

---

## 7. Scripts
- `npm run dev:server`: Starts server with Nodemon on port 5000.
- `npm run dev:client`: Starts Vite client dev server on port 5173.
- `npm test`: Runs both backend and frontend test suites.

---

## 8. Testing
- **Server Tests:** Run `npm test` inside `/server` to run in-memory Mongo test suites covering Auth, Conversations, Cursor Messages, File Uploads/Downloads (GridFS), and live Sockets (29 tests).
- **Client Tests:** Run `npm test` inside `/client` to run Vitest tests covering `ThemeToggle`, `useTheme`, `MessageInput`, `MessageBubble`, `Button`, and `ProtectedRoute` (22 tests).

---

## 9. Deployment
- **Server:** Deploy `/server` to a persistent Node host (Render, Railway, Fly.io). Set build command to `npm install` and start to `npm start`. Configure production environment variables.
- **Client:** Deploy `/client` to Vercel or Netlify. Set build command to `npm run build` and output to `dist`. Configure `VITE_API_URL` and `VITE_SOCKET_URL` to point to the live server.

---

## 10. Troubleshooting
- **Cannot connect to MongoDB:** Verify `MONGO_URI`, ensure local MongoDB is started or check MongoDB Atlas network IP access.
- **CORS error:** Ensure `CLIENT_URL` in `server/.env` exactly matches the frontend origin.
- **Socket Disconnected / Reconnecting:** Ensure server is running and proxy or `VITE_SOCKET_URL` points to the active server origin.
- **Blank page on refresh in production:** Ensure `_redirects` (Netlify) or `vercel.json` rewrites are present in deployment.
- **File upload 413 error:** File exceeds `MAX_FILE_SIZE_MB` limit (default 10 MB).
- **File upload 429 error:** Upload rate limit exceeded (maximum 10 file uploads per minute per user).
- **Theme Flashing:** The blocking inline script in `index.html` prevents white flashes before first paint.
