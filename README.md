# PareFreio Site

Site catálogo de peças automotivas da PareFreio, feito com Flask, MySQL, HTML, CSS e JavaScript.

## Recursos

- Home premium responsiva
- Páginas de produtos, categorias, contato e chatbot
- Botão flutuante de WhatsApp
- Formulário com envio para API Flask
- Estrutura preparada para MySQL
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

## Banco MySQL

Crie o banco e as tabelas com:

```powershell
mysql -u root -p < database/schema.sql
```

Depois ajuste o arquivo `.env` com usuário, senha, host e banco.

## Observação comercial

O conteúdo foi ajustado para posicionar a PareFreio como loja de peças automotivas. O site não promete instalação, manutenção ou mão de obra.
 
feito com ajuda do codex