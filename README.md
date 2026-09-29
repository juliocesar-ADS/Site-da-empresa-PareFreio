<div align="center">

# 🚗 PareFreio — Catálogo de Peças Automotivas

Site institucional e catálogo de peças da **PareFreio**, construído com Flask, MySQL/SQLite, HTML, CSS e JavaScript.

[🌐 Acessar o site](#-link-do-site) · [⚙️ Como rodar localmente](#-como-rodar-localmente) · [🗄️ Banco de dados](#-banco-de-dados)

</div>

---

## 🔗 Link do site

https://juliocesar-ads.github.io/Site-da-empresa-PareFreio/

## ✨ Funcionalidades

| Recurso | Descrição |
| --- | --- |
| 🏠 Home premium | Landing page responsiva e otimizada para conversão |
| 🛒 Catálogo online | Produtos com busca, filtro, preço e fotos sincronizados pelo Supabase |
| 🔐 Conta opcional | Clientes navegam sem login e podem criar conta ou entrar |
| 🧰 Painel do dono | Criação, edição e exclusão protegidas de produtos |
| 🖼️ Fotos de produtos | Upload online JPG, PNG ou WebP de até 5 MB |
| 📨 Pedidos de contato | Visitantes enviam pedidos sem conta; só o dono pode consultá-los |
| 📄 Páginas completas | Produtos, categorias, contato e chatbot |
| 💬 WhatsApp flutuante | Botão fixo para atendimento direto pelo app |
| 🔍 SEO e animações | Metatags e animações responsivas com suporte a movimento reduzido |
| 🗄️ Persistência local | MySQL ou SQLite para executar a aplicação Flask localmente |

---

## ⚙️ Como rodar localmente

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

Abra `http://127.0.0.1:5000`.

Sem MySQL configurado, a execução Flask local cria automaticamente
`database/parefreio.sqlite3`, carrega o catálogo inicial e salva os pedidos
localmente. O login, o painel do dono e a sincronização online usam o projeto
Supabase gratuito configurado para o site publicado.

---

## 🗄️ Banco de dados

### Banco local Flask

Para MySQL, crie o banco e as tabelas:

```powershell
mysql -u root -p < database/schema.sql
```

Depois ajuste as variáveis em `.env`. SQLite local é usado automaticamente
quando as credenciais MySQL não estiverem configuradas.

### Banco online do site publicado (Supabase)

O projeto gratuito `parefreio-site` está configurado na região de São Paulo.
Seu schema já foi aplicado, com políticas de segurança, bucket de fotos e peças
iniciais sem preço informado. A chave incorporada ao site é uma chave pública
publishable e foi verificada contra a API do catálogo; não inclua chaves secretas
ou `service_role` no frontend.

O link de convite de acesso do dono foi enviado ao e-mail de publicação do
repositório. Depois de aceitar o convite, o usuário poderá definir a senha em
`/conta/`; a página de autenticação volta diretamente para essa rota. O acesso
ao painel já está autorizado somente para o usuário convidado.

Para autorizar uma conta de dono adicional, crie a conta e rode no SQL Editor,
substituindo o e-mail:

   ```sql
   INSERT INTO public.site_owners (user_id)
   SELECT id FROM auth.users WHERE lower(email) = lower('dono@empresa.com')
   ON CONFLICT (user_id) DO NOTHING;
   ```

Depois de autorizada, a conta verá **Painel do dono** no menu. O painel permite
cadastrar, editar e excluir produtos com preço, descrição, aplicação e fotos.
As mudanças aparecem no catálogo sem novo deploy. Clientes continuam navegando
sem login; cadastro e acesso são opcionais.

O frontend usa a chave pública do Supabase, enquanto o Row Level Security do
schema restringe gravações de produtos e fotos aos usuários cadastrados em
`site_owners`. O formulário de contato aceita visitantes sem conta, e os pedidos
só podem ser lidos pelo dono.

---

## 🚀 Publicação

O workflow em `.github/workflows/pages.yml` gera as páginas estáticas e publica
automaticamente no GitHub Pages a cada push em `main`. O catálogo busca dados do
Supabase em tempo real; cadastrar ou editar um produto não exige novo deploy.

---

## 🧰 Stack

- **Backend local:** Python + Flask
- **Banco local:** MySQL ou SQLite
- **Banco online e autenticação:** Supabase
- **Frontend:** HTML5, CSS3, JavaScript
- **Deploy:** GitHub Actions → GitHub Pages

## 📁 Estrutura do projeto

```text
.
├── .github/workflows/   # Build estático e publicação no Pages
├── database/            # Schemas MySQL e Supabase
├── scripts/             # Geração do site estático
├── static/              # CSS, JS e imagens
├── templates/           # Templates Jinja2 (Flask)
├── app.py               # Aplicação Flask e rotas
├── requirements.txt     # Dependências
└── .env.example         # Variáveis de ambiente local
```
