import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session
from groq import Groq

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

API_KEY = os.getenv("GROQ_API_KEY")
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

client = Groq(api_key=API_KEY) if API_KEY else None

SYSTEM_PROMPT = {
    "role": "system",
    "content": (
        "You are Jarvis, a sharp, friendly, and highly capable AI assistant. "
        "Keep answers clear and helpful, and match the user's tone."
    ),
}

MAX_HISTORY_MESSAGES = 20  # keep last N messages (user+assistant) per session


@app.route("/")
def index():
    """Serve the chat UI and start a fresh conversation."""
    session["messages"] = []
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    """Send a user message to Groq and return the assistant's reply."""
    if client is None:
        return jsonify({"error": "Server misconfiguration: GROQ_API_KEY is not set."}), 500

    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()

    if not user_message:
        return jsonify({"error": "Message cannot be empty."}), 400

    messages = session.get("messages", [])
    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[SYSTEM_PROMPT] + messages,
            temperature=0.7,
            max_tokens=1024,
        )

        assistant_reply = response.choices[0].message.content
        messages.append({"role": "assistant", "content": assistant_reply})

        # Trim history so the session cookie / context window stays small
        session["messages"] = messages[-MAX_HISTORY_MESSAGES:]

        return jsonify({"reply": assistant_reply})

    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Something went wrong: {exc}"}), 500


@app.route("/api/reset", methods=["POST"])
def reset():
    """Clear the current conversation."""
    session["messages"] = []
    return jsonify({"status": "ok"})


@app.route("/healthz")
def health_check():
    return jsonify({"status": "ok", "model": MODEL, "configured": client is not None})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
