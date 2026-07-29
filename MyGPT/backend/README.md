# MyGPT — Backend

Express + MongoDB API powering MyGPT: Google OAuth login, JWT access/refresh
tokens, chat + message history, image/PDF uploads, and a unified proxy that
calls Gemini, OpenAI or Claude using **the user's own pasted API key** (no key
ever lives in your `.env` — each user adds their own from the in-app Settings
modal).

## 1. Install

```bash
cd backend
npm install
cp .env.sample .env
```

## 2. Fill in `.env`

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers (copy the string **without** the db name at the end, e.g. `mongodb+srv://user:pass@cluster0.mongodb.net`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → Create OAuth client ID → Web application |
| `GOOGLE_CALLBACK_URL` | Must exactly match an "Authorized redirect URI" on that OAuth client, e.g. `http://localhost:8000/api/v1/auth/google/callback` |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | Any long random strings (e.g. `openssl rand -hex 32`) |
| `ENCRYPTION_KEY` | Exactly 32 characters — used to AES-encrypt the LLM API keys users paste in Settings before they're saved to MongoDB |
| `CLIENT_SUCCESS_REDIRECT_URL` / `CLIENT_FAILURE_REDIRECT_URL` | Where the browser lands after Google login — point these at your frontend, e.g. `http://localhost:5173/auth/callback` and `http://localhost:5173/login` |

**Google Cloud Console checklist:**
1. Create a project → APIs & Services → OAuth consent screen → fill basic info, add your email as a test user if the app is in "Testing" mode.
2. APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type: **Web application**.
3. Authorized redirect URIs: add `http://localhost:8000/api/v1/auth/google/callback` (and your production URL later).
4. Copy the generated Client ID / Client Secret into `.env`.

## 3. Run

```bash
npm run dev      # nodemon, auto-restarts
# or
npm start
```

Server boots on `http://localhost:8000`. Health check: `GET /`.

## Where do users put their Gemini/GPT/Claude API key?

**Not in `.env`.** Each logged-in user pastes their own key in the frontend's
Settings modal (gear icon next to their avatar), which calls
`PUT /api/v1/users/api-keys`. The key is AES-256 encrypted with
`ENCRYPTION_KEY` before being saved on that user's document in MongoDB, and
decrypted in-memory only at the moment a message is sent to that provider.

## Project structure

```
backend/
├── public/
│   ├── temp/         # scratch space
│   └── uploads/       # uploaded images & PDFs, served at /uploads/<file>
├── src/
│   ├── controllers/    # auth, chat, message, file, user
│   ├── db/             # mongoose connection
│   ├── middlewares/     # JWT auth, multer upload, error handler
│   ├── models/          # User, Chat, Message, File
│   ├── routes/
│   ├── utils/            # ApiError, ApiResponse, asyncHandler, encryption, llmProviders, passport
│   ├── app.js            # express app + route mounting
│   ├── constants.js
│   └── index.js          # entry point (dotenv → connectDB → listen)
├── server.js              # convenience root entry (`node server.js`)
├── .env.sample
└── package.json
```

## API overview

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/v1/auth/google` | Start Google login |
| GET | `/api/v1/auth/google/callback` | OAuth callback, sets cookies |
| POST | `/api/v1/auth/refresh-token` | Rotate access token using refresh cookie |
| POST | `/api/v1/auth/logout` | Clear cookies + stored refresh token |
| GET | `/api/v1/auth/me` | Current logged-in user |
| GET/PUT | `/api/v1/users/api-keys` | View (masked) / save a provider API key |
| DELETE | `/api/v1/users/api-keys/:provider` | Remove a saved key |
| POST/GET | `/api/v1/chats` | Create / list chats |
| GET/PATCH/DELETE | `/api/v1/chats/:chatId` | Read / rename / pin / delete a chat |
| GET | `/api/v1/chats/:chatId/messages` | Full message history for a chat |
| POST | `/api/v1/messages` | Send a message → calls the LLM → returns the reply |
| POST | `/api/v1/files/upload` | Upload image(s)/PDF(s) (`multipart/form-data`, field `files`) |
| GET | `/api/v1/files` | List uploaded files (Library), optional `?type=image\|pdf` |
| DELETE | `/api/v1/files/:fileId` | Delete an uploaded file |

## Notes / next steps for production

- File storage is local disk (`public/uploads`) — swap in S3/Cloudinary for production/multi-instance deployments.
- Refresh tokens are stored as a single raw token per user; for multi-device support, switch to storing a hashed token per session/device.
- Add rate limiting (e.g. `express-rate-limit`) before exposing this publicly, since LLM calls cost the user money per request.
