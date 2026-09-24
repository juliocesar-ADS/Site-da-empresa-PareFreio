<div align="center">

# 🚗 PareFreio — Catálogo de Peças Automotivas

Site institucional e catálogo de peças da **PareFreio**, construído com Flask, MySQL/SQLite, HTML, CSS e JavaScript.

[🌐 Acessar o site](#-link-do-site) · [⚙️ Como rodar localmente](#-como-rodar-localmente) · [🗄️ Banco de dados](#-banco-de-dados)

</div>

---

## 🔗 Link do site

(https://juliocesar-ads.github.io/Site-da-empresa-PareFreio/)


## ✨ Funcionalidades

| Recurso | Descrição |
| --- | --- |
| 🏠 Home premium | Landing page responsiva e otimizada para conversão |
| 🛒 Catálogo dinâmico | Peças carregadas do banco com **busca** e **filtro por categoria** |
| 📄 Páginas completas | Produtos, categorias, contato e chatbot |
| 💬 WhatsApp flutuante | Botão fixo para atendimento direto pelo app |
| 📨 Formulário de orçamento | Envia para a API Flask e persiste o lead no banco |
| 🤖 Chatbot | Atendimento automatizado no site |
| 🔍 SEO básico | Metatags configuradas nas páginas principais |
| 🗄️ Persistência flexível | MySQL em produção ou SQLite (`database/parefreio.sqlite3`) em desenvolvimento |

---

## 🧰 Stack

- **Backend:** Python + Flask
- **Banco:** MySQL (produção) / SQLite (local)
- **Frontend:** HTML5, CSS3, JavaScript
- **Deploy:** GitHub Actions → GitHub Pages
- **Automação:** Scripts de geração de catálogo estático em `scripts/`

---

## 📁 Estrutura do projeto

```text
.
├── .github/workflows/   # CI/CD: build estático + publicação no Pages
├── database/            # schema.sql e banco SQLite local
├── scripts/             # Geração do catálogo e build das páginas
├── static/              # CSS, JS e imagens
├── templates/           # Templates Jinja2 (Flask)
├── app.py               # Aplicação Flask e rotas da API
├── requirements.txt     # Dependências
├── Procfile             # Deploy em PaaS (Heroku/Railway)
└── .env.example         # Variáveis de ambiente de exemplo
