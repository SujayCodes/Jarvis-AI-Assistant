# Jarvis — AI Assistant

A fast, Groq-powered AI assistant with a dark, HUD-styled chat interface.
Backend: Flask + Groq (`llama-3.3-70b-versatile`). Frontend: plain HTML/CSS/JS.

## Project structure

```
jarvis-ai-assistant/
├── app.py                  # Flask app (chat + reset API routes)
├── requirements.txt        # Python dependencies
├── .env                    # Your local secrets (NOT committed)
├── .env.example            # Template for the .env file
├── .gitignore
├── vercel.json             # Vercel deployment config
├── templates/
│   └── index.html          # Chat UI markup
└── static/
    ├── css/style.css       # Theme + animations
    └── js/script.js        # Chat logic (fetch, rendering, UI state)
```

## Run it locally

1. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up your environment variables**. A `.env` file is already included with
   your Groq key. If you ever need to recreate it, copy the example:
   ```bash
   cp .env.example .env
   ```
   Then fill in:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   SECRET_KEY=any_long_random_string
   ```

4. **Run the app**:
   ```bash
   python app.py
   ```
   Visit `http://localhost:5000`.

## Pushing to GitHub

The `.gitignore` already excludes `.env`, so your API key won't be committed.
Before pushing, double check:

```bash
git init
git add .
git status   # confirm .env is NOT listed
git commit -m "Initial commit: Jarvis AI assistant"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Deploying on Vercel

This repo includes a `vercel.json` that runs `app.py` as a Python serverless
function via `@vercel/python`.

1. Push the project to GitHub (see above).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
3. In **Settings → Environment Variables**, add:
   - `GROQ_API_KEY` = your Groq key
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
   - `SECRET_KEY` = a long random string
4. Deploy. Vercel will build using `vercel.json` and serve your Flask app.

> Note: Vercel functions are stateless between invocations, so conversation
> history is stored in a signed session cookie (via `flask.session`) rather
> than server memory — this keeps multi-turn context working correctly in
> production.

## Important: rotate your API key

The Groq key you shared was pasted in plain text in our conversation, so
treat it as exposed. Before (or right after) you push this repo anywhere,
generate a new key in the [Groq Console](https://console.groq.com/keys),
revoke the old one, and update it in your `.env` file locally and in your
Vercel project's environment variables.

## API routes

| Route          | Method | Description                          |
|-----------------|--------|---------------------------------------|
| `/`             | GET    | Serves the chat UI, resets session    |
| `/api/chat`     | POST   | `{ "message": "..." }` → `{ "reply": "..." }` |
| `/api/reset`    | POST   | Clears the conversation history       |
| `/healthz`      | GET    | Health check / config status          |
