import http.server
import socketserver
import subprocess
import os

PORT = 5005
# A very simple token for basic security
TOKEN = "MARK_UPDATE_2026"

class TriggerHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/update-photos"):
            # Check for token in query params
            if f"token={TOKEN}" in self.path:
                self.send_response(200)
                self.send_header("Content-type", "text/plain")
                self.send_header("Access-Control-Allow-Origin", "*") # Allow CORS
                self.end_headers()
                
                try:
                    # Execute the scraper script
                    script_path = os.path.join(os.path.dirname(__file__), "update_google_photos_links.py")
                    print(f"Executing: {script_path}")
                    result = subprocess.run(["python3", script_path], capture_output=True, text=True)
                    
                    response = f"✅ Script executed successfully.\n\nOutput:\n{result.stdout}"
                    if result.stderr:
                        response += f"\nErrors:\n{result.stderr}"
                    
                    self.wfile.write(response.encode())
                except Exception as e:
                    self.wfile.write(f"❌ Error executing script: {e}".encode())
            else:
                self.send_response(401)
                self.end_headers()
                self.wfile.write(b"Unauthorized")
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With")
        self.end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), TriggerHandler) as httpd:
        print(f"🚀 Trigger Server listening on port {PORT}")
        print(f"Endpoint: http://localhost:{PORT}/update-photos?token={TOKEN}")
        httpd.serve_forever()
