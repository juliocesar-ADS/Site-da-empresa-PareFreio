import os
from datetime import datetime
from urllib.parse import quote_plus

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
import pymysql


load_dotenv()

app = Flask(__name__)

app.config["MYSQL_HOST"] = os.getenv("MYSQL_HOST", "localhost")
app.config["MYSQL_USER"] = os.getenv("MYSQL_USER", "root")
app.config["MYSQL_PASSWORD"] = os.getenv("MYSQL_PASSWORD", "")
app.config["MYSQL_DB"] = os.getenv("MYSQL_DB", "parefreio")


def get_connection():
    return pymysql.connect(
        host=app.config["MYSQL_HOST"],
        user=app.config["MYSQL_USER"],
        password=app.config["MYSQL_PASSWORD"],
        database=app.config["MYSQL_DB"],
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


PRODUCTS = [
    {
        "name": "Pincas Dianteiras e Traseiras",
        "category": "Freios",
        "description": "Pinças de freio dianteiras e traseiras para diversas aplicações.",
        "compatibility": "Consultar por modelo, ano e motorização.",
    },
    {
        "name": "Caixa de Direção Elétrica",
        "category": "Direção",
        "description": "Caixas de direção elétrica com procedência e aplicação correta.",
        "compatibility": "Consulte pelo modelo, ano e versão do veículo.",
    },
    {
        "name": "Caixa de Direção Mecânica",
        "category": "Direção",
        "description": "Caixas de direção mecânica para reposição automotiva.",
        "compatibility": "Consulte disponibilidade pelo veículo.",
    },
    {
        "name": "Caixa de Direção Hidráulica",
        "category": "Direção",
        "description": "Caixas de direção hidráulica para linha leve e utilitários.",
        "compatibility": "Consulte por modelo, ano e motorização.",
    },
    {
        "name": "Terminais de Direção",
        "category": "Direção",
        "description": "Terminais de direção para reposição com encaixe correto.",
        "compatibility": "Aplicação sob consulta.",
    },
    {
        "name": "Hidrovácuos",
        "category": "Freios",
        "description": "Hidrovácuos para sistemas de freio de diversas aplicações.",
        "compatibility": "Consulte disponibilidade pelo chassi ou modelo.",
    },
    {
        "name": "Bandejas de Suspensão",
        "category": "Suspensão",
        "description": "Bandejas de suspensão para reposição automotiva.",
        "compatibility": "Modelos nacionais e importados sob consulta.",
    },
    {
        "name": "Buchas e Pivôs",
        "category": "Suspensão",
        "description": "Buchas e pivôs para suspensão, estabilidade e segurança.",
        "compatibility": "Consulte pelo modelo do veículo.",
    },
    {
        "name": "Amortecedores",
        "category": "Suspensão",
        "description": "Amortecedores para reposição em diferentes modelos.",
        "compatibility": "Disponibilidade sob consulta.",
    },
    {
        "name": "Kit de Embreagem",
        "category": "Embreagem",
        "description": "Kit de embreagem para reposição conforme aplicação do veículo.",
        "compatibility": "Consulte por modelo, ano e motor.",
    },
]


SERVICES = [
    {
        "title": "Freios",
        "items": ["Pinças dianteiras", "Pinças traseiras", "Hidrovácuos"],
    },
    {
        "title": "Direção",
        "items": ["Caixa de direção elétrica", "Caixa de direção mecânica", "Caixa de direção hidráulica", "Terminais"],
    },
    {
        "title": "Suspensão",
        "items": ["Bandejas", "Buchas", "Pivôs", "Amortecedores"],
    },
    {
        "title": "Embreagem",
        "items": ["Kit de embreagem"],
    },
]


def save_lead(data):
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO leads (nome, telefone, email, veiculo, mensagem, origem, criado_em)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    data.get("nome"),
                    data.get("telefone"),
                    data.get("email"),
                    data.get("veiculo"),
                    data.get("mensagem"),
                    data.get("origem", "site"),
                    datetime.utcnow(),
                ),
            )
        connection.commit()
        connection.close()
        return True
    except Exception as exc:
        app.logger.warning("Lead not saved: %s", exc)
        return False


@app.route("/")
def index():
    return render_template("index.html", products=PRODUCTS[:4], services=SERVICES)


@app.route("/produtos")
def produtos():
    return render_template("produtos.html", products=PRODUCTS)


@app.route("/servicos")
def servicos():
    return render_template("servicos.html", services=SERVICES)


@app.route("/contato")
def contato():
    return render_template("contato.html")


@app.route("/chatbot")
def chatbot():
    return render_template("chatbot.html")


@app.post("/api/contato")
def api_contato():
    data = request.get_json(silent=True) or request.form.to_dict()
    required = ["nome", "telefone", "mensagem"]

    if any(not data.get(field) for field in required):
        return jsonify({"ok": False, "message": "Preencha nome, telefone e mensagem."}), 400

    saved = save_lead(data)
    whatsapp_message = quote_plus(
        f"Olá, sou {data.get('nome')} e quero atendimento da PareFreio. "
        f"Veículo: {data.get('veiculo', 'não informado')}. "
        f"Mensagem: {data.get('mensagem')}"
    )

    return jsonify(
        {
            "ok": True,
            "saved": saved,
            "message": "Solicitação recebida. Vamos direcionar você para o WhatsApp.",
            "whatsapp": f"https://api.whatsapp.com/send?phone=5511962658271&text={whatsapp_message}",
        }
    )


@app.post("/api/orcamento")
def api_orcamento():
    data = request.get_json(silent=True) or {}
    problema = (data.get("problema") or "").lower()

    sugestoes = {
        "freio": "Peças de freio: pinças dianteiras, pinças traseiras e hidrovácuos.",
        "direcao": "Peças de direção: caixa elétrica, mecânica, hidráulica e terminais.",
        "embreagem": "Em embreagem, trabalhamos com kit de embreagem.",
        "suspensao": "Peças de suspensão: bandejas, buchas, pivôs e amortecedores.",
    }
    estimativa = "Informe o sintoma ou peça desejada para indicarmos a categoria correta."

    for termo, resposta in sugestoes.items():
        if termo in problema:
            estimativa = resposta
            break

    return jsonify(
        {
            "ok": True,
            "estimativa": estimativa,
            "observacao": "A confirmação depende do modelo, ano, motor e disponibilidade em estoque.",
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
