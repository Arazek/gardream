"""
Lightweight webhook server for automated deployments.
Validates requests using either:
  - GitHub: HMAC-SHA256 signature in X-Hub-Signature-256 header
  - Generic: plain secret in X-Webhook-Secret header
"""

import hashlib
import hmac
import json
import os
import subprocess
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")
PORT = int(os.environ.get("WEBHOOK_PORT", "9000"))

ROUTES = {
    "/deploy/gardream": "/app/deploy-gardream.sh",
}


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify GitHub HMAC-SHA256 signature."""
    if not signature.startswith("sha256="):
        return False
    expected = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


def verify_request(headers: dict, body: bytes) -> bool:
    """Validate the webhook request using either GitHub HMAC or plain secret."""
    # GitHub signature
    gh_sig = headers.get("X-Hub-Signature-256", "")
    if gh_sig:
        return verify_signature(body, gh_sig)

    # Plain secret header (GitLab X-Gitlab-Token or generic X-Webhook-Secret)
    plain = headers.get("X-Webhook-Secret", "") or headers.get("X-Gitlab-Token", "")
    if plain:
        return hmac.compare_digest(plain, WEBHOOK_SECRET)

    return False


def run_deploy(script: str, path: str):
    """Run a deploy script in the background."""
    print(f"[webhook] Running {script} for {path}")
    try:
        result = subprocess.run(
            ["bash", script],
            capture_output=True,
            text=True,
            timeout=300,
        )
        print(f"[webhook] {path} stdout:\n{result.stdout}")
        if result.returncode != 0:
            print(f"[webhook] {path} stderr:\n{result.stderr}")
        print(f"[webhook] {path} exit code: {result.returncode}")
    except subprocess.TimeoutExpired:
        print(f"[webhook] {path} timed out after 300s")
    except Exception as e:
        print(f"[webhook] {path} error: {e}")


class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b""

        if not WEBHOOK_SECRET:
            self.send_error(500, "WEBHOOK_SECRET not configured")
            return

        if not verify_request(dict(self.headers), body):
            self.send_error(401, "Invalid signature")
            return

        script = ROUTES.get(self.path)
        if not script:
            self.send_error(404, "Unknown route")
            return

        # Check for master/main branch in payload (GitHub/GitLab)
        try:
            payload = json.loads(body) if body else {}
            ref = payload.get("ref", "")
            if ref and ref not in ("refs/heads/master", "refs/heads/main"):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"status":"skipped","reason":"not master/main branch"}')
                print(f"[webhook] Skipped {self.path} — ref: {ref}")
                return
        except (json.JSONDecodeError, AttributeError):
            pass

        # Run deploy asynchronously
        thread = threading.Thread(target=run_deploy, args=(script, self.path))
        thread.start()

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"deploying"}')

    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"ok","routes":["/deploy/gardream"]}')

    def log_message(self, format, *args):
        print(f"[webhook] {args[0]}")


if __name__ == "__main__":
    if not WEBHOOK_SECRET:
        print("[webhook] WARNING: WEBHOOK_SECRET is not set!")
    print(f"[webhook] Listening on port {PORT}")
    print(f"[webhook] Routes: {list(ROUTES.keys())}")
    server = HTTPServer(("0.0.0.0", PORT), WebhookHandler)
    server.serve_forever()
