import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app import app


OUTPUT = ROOT / "_site"
PAGES = {
    "": "/",
    "produtos": "/produtos",
    "servicos": "/servicos",
    "contato": "/contato",
    "chatbot": "/chatbot",
    "conta": "/conta",
    "admin": "/admin",
}


def rewrite_links(html, prefix):
    html = html.replace('href="/static/', f'href="{prefix}static/')
    html = html.replace('src="/static/', f'src="{prefix}static/')
    for route in ("produtos", "servicos", "contato", "chatbot", "conta", "admin"):
        html = html.replace(f'href="/{route}"', f'href="{prefix}{route}/"')
    html = html.replace('href="/"', f'href="{prefix}"')
    return html


def main():
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    shutil.copytree(ROOT / "static", OUTPUT / "static")
    config = {
        "url": os.environ.get("SUPABASE_URL", ""),
        "anonKey": os.environ.get("SUPABASE_ANON_KEY", ""),
    }
    config_path = OUTPUT / "static" / "js" / "supabase-config.js"
    config_path.write_text(
        "window.PAREFREIO_STATIC_SITE = true;\n"
        "window.PAREFREIO_SUPABASE = "
        + json.dumps(config, ensure_ascii=True)
        + ";\n",
        encoding="utf-8",
    )

    client = app.test_client()
    for folder, route in PAGES.items():
        response = client.get(route)
        if response.status_code != 200:
            raise RuntimeError(f"Falha ao gerar {route}: HTTP {response.status_code}")
        target = OUTPUT / folder
        target.mkdir(exist_ok=True)
        prefix = "../" if folder else ""
        (target / "index.html").write_text(
            rewrite_links(response.get_data(as_text=True), prefix),
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
