# PareFreio Site

Site catálogo de peças automotivas da PareFreio, feito com Flask, MySQL, HTML, CSS e JavaScript.

## Recursos

- Home premium responsiva
- Páginas de produtos, categorias, contato e chatbot
- Catálogo de peças carregado do banco com busca e filtro por categoria
- Botão flutuante de WhatsApp
- Formulário com envio para API Flask
- Leads e produtos persistidos em MySQL ou SQLite local
- SEO básico com metatags

## Como rodar

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

Abra `http://127.0.0.1:5000`.

Sem MySQL configurado, o site cria automaticamente `database/parefreio.sqlite3`,
carrega o catálogo inicial e salva os pedidos de orçamento localmente.

## GitHub Pages

O workflow em `.github/workflows/pages.yml` gera uma versão estática das páginas
e publica automaticamente no GitHub Pages a cada push na branch `main`.
No GitHub, abra **Settings > Pages**, selecione **GitHub Actions** como fonte
de publicação e acesse a URL exibida após a primeira execução do workflow.

## Banco MySQL

Crie o banco e as tabelas com:

```powershell
mysql -u root -p < database/schema.sql
```

Depois ajuste o arquivo `.env` com usuário, senha, host e banco.

## Observação comercial

O conteúdo foi ajustado para posicionar a PareFreio como loja de peças automotivas. O site não promete instalação, manutenção ou mão de obra.
 
feito com ajuda do codex