import http.server
import os
import webbrowser
from pathlib import Path

PORT = 8000
ROOT = Path(__file__).parent


def main():
    os.chdir(ROOT)
    httpd = http.server.HTTPServer(("", PORT), http.server.SimpleHTTPRequestHandler)
    print(f"Serving QEM Zoo at http://localhost:{PORT}")
    webbrowser.open(f"http://localhost:{PORT}")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
