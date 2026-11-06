"""
Lizon Mahmud — Portfolio contact backend (optional).

Run locally:
    pip install -r requirements.txt
    python app.py

Environment variables (never hard-code secrets):
    CONTACT_TO_EMAIL   destination address (defaults to owner email)
    SMTP_HOST          e.g. smtp.gmail.com
    SMTP_PORT          e.g. 587
    SMTP_USER          SMTP login
    SMTP_PASSWORD      SMTP app password
    ALLOWED_ORIGINS    comma-separated list, e.g. https://yourname.netlify.app
    FLASK_DEBUG        "1" to enable debug mode (local only)
"""
import os
import re
import smtplib
import logging
from email.message import EmailMessage

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024  # 16 KB request cap

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("portfolio")

ALLOWED_ORIGINS = [o.strip() for o in os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000"
).split(",") if o.strip()]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}}, methods=["POST", "OPTIONS"])

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

MAX_NAME = 100
MAX_EMAIL = 150
MAX_MESSAGE = 2000
MIN_MESSAGE = 5


def clean(value: str) -> str:
    return CONTROL_CHARS.sub("", str(value or "")).strip()


def validate(payload: dict):
    """Return (cleaned_dict, error_message)."""
    if not isinstance(payload, dict):
        return None, "Invalid request body."

    name = clean(payload.get("name"))
    email = clean(payload.get("email"))
    message = clean(payload.get("message"))

    if not name or len(name) > MAX_NAME:
        return None, "Please provide a valid name."
    if not email or len(email) > MAX_EMAIL or not EMAIL_RE.match(email):
        return None, "Please provide a valid email address."
    if len(message) < MIN_MESSAGE or len(message) > MAX_MESSAGE:
        return None, f"Message must be between {MIN_MESSAGE} and {MAX_MESSAGE} characters."

    return {"name": name, "email": email, "message": message}, None


def send_email(data: dict) -> None:
    host = os.environ.get("SMTP_HOST")
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    port = int(os.environ.get("SMTP_PORT", "587"))
    to_addr = os.environ.get("CONTACT_TO_EMAIL", "lizonmahmud9@gmail.com")

    if not (host and user and password):
        # No SMTP configured: log the message so it is never silently lost.
        log.warning("SMTP not configured. Contact received from %s", data["email"])
        log.info("MESSAGE: %s", data)
        return

    msg = EmailMessage()
    msg["Subject"] = f"Portfolio message from {data['name']}"
    msg["From"] = user
    msg["To"] = to_addr
    msg["Reply-To"] = data["email"]
    msg.set_content(f"From: {data['name']} <{data['email']}>\n\n{data['message']}")

    with smtplib.SMTP(host, port, timeout=15) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(msg)


@app.post("/api/contact")
def contact():
    payload = request.get_json(silent=True)
    data, error = validate(payload)
    if error:
        return jsonify(ok=False, error=error), 400

    try:
        send_email(data)
    except Exception:  # never leak internals to the client
        log.exception("Failed to send contact email")
        return jsonify(ok=False, error="Could not send message right now."), 502

    return jsonify(ok=True), 200


@app.get("/api/health")
def health():
    return jsonify(status="ok")


@app.errorhandler(413)
def too_large(_e):
    return jsonify(ok=False, error="Request too large."), 413


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("FLASK_DEBUG") == "1",
    )
