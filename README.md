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
localmente. O login, o painel do dono e a sincronização online são ativados
quando o Supabase estiver configurado na publicação GitHub Pages.

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

1. Crie um projeto Supabase e abra o **SQL Editor**.
2. Execute todo o conteúdo de [`database/supabase.sql`](./database/supabase.sql).
   O script cria as tabelas, políticas de acesso, bucket público de fotos e peças
   iniciais. As peças sem preço informado aparecem como “Consulte o preço”.
3. No GitHub, abra **Settings > Secrets and variables > Actions > Variables** e
   crie `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os dados de **Project Settings >
   API** do Supabase. Use somente a chave pública `anon`/publishable. Nunca use
   nem publique a `service_role` key.
4. Em **Authentication > URL Configuration** no Supabase, configure o URL do
   site como `https://juliocesar-ads.github.io/Site-da-empresa-PareFreio/` e
   inclua esse endereço e `https://juliocesar-ads.github.io/**` na lista de
   redirecionamentos permitidos.
5. Faça um push na branch `main` para publicar a configuração do Supabase.
6. Acesse `/conta/` no site, crie a conta do dono e confirme o e-mail, se
   solicitado.
7. No SQL Editor do Supabase, autorize somente essa conta como dona, substituindo
   o e-mail:

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
automaticamente no GitHub Pages a cada push em `main`. Adicione as variáveis
Supabase descritas acima ao repositório para ativar o catálogo online e o login.

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
