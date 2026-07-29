# MyGPT — Frontend

React + Vite + Tailwind chat UI styled after ChatGPT: sidebar with New chat /
Search / Library, recent conversations, Google login, and a Settings modal
where each user pastes their own Gemini / OpenAI / Claude API key.

## 1. Install

```bash
cd frontend
npm install
cp .env.sample .env
```

`.env` only needs one value:

```
VITE_API_URL=http://localhost:8000/api/v1
```

Point this at wherever the backend is running.

## 2. Run

```bash
npm run dev
```

Opens on `http://localhost:5173`. Make sure the backend is running first and
that `backend/.env`'s `CORS_ORIGIN` includes `http://localhost:5173`.

## How login works

Clicking **Continue with Google** on the login screen redirects the full
browser to the backend's `/api/v1/auth/google` route (not an API call — a
real navigation, since Google OAuth needs a top-level redirect). The backend
handles the Google handshake, sets `httpOnly` access/refresh cookies, then
redirects back to `VITE` app at `/auth/callback`, which simply re-checks
`/auth/me` and drops the user into the chat UI.

## How the API key flow works

1. User signs in with Google.
2. They click the gear icon next to their avatar (bottom-left) → Settings.
3. They paste a Gemini / OpenAI / Claude key and hit Save — it's sent to the
   backend and encrypted at rest, never stored in the browser.
4. The model switcher in the top bar lets them pick which connected provider
   to chat with per-conversation.

## Project structure

```
frontend/
├── src/
│   ├── api/            # axios instance (with auto refresh-token retry) + endpoint wrappers
│   ├── components/      # Sidebar, MessageBubble, MessageInput, modals, ModelSelector, Avatar
│   ├── context/          # AuthContext (current user, login/logout)
│   ├── pages/             # Login, AuthCallback, Chat (main app)
│   ├── App.jsx             # routes + protected route guard
│   ├── main.jsx
│   └── index.css            # ChatGPT-style dark theme + markdown styling
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Build for production

```bash
npm run build
```

Outputs static files to `dist/` — deploy to Vercel/Netlify/any static host,
and set `VITE_API_URL` to your deployed backend's URL at build time.
