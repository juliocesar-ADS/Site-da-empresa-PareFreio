const config = window.PAREFREIO_SUPABASE || {};
const isConfigured = Boolean(config.url && config.anonKey);
const productSelect = "id,name,category,description,compatibility,price,image_url,active,created_at";
const imageBucket = "product-images";
let supabase = null;
let currentProducts = [];
let adminProducts = [];
let ownerUser = null;
let contactFailureMessage = "Banco online ainda não configurado. Abrindo o WhatsApp sem salvar o pedido no site.";

function showStatus(selector, message, isError = false) {
    document.querySelectorAll(selector).forEach((element) => {
        element.textContent = message;
        element.classList.toggle("is-error", isError);
    });
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);
}

function formatPrice(price) {
    if (price === null || price === undefined) return "Consulte o preço";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function productCard(product, compact = false) {
    const name = escapeHtml(product.name);
    const category = escapeHtml(product.category);
    const image = product.image_url
        ? `<img src="${escapeHtml(product.image_url)}" alt="${name}" loading="lazy">`
        : `<span>${category}</span>`;
    const description = escapeHtml(product.description);
    const compatibility = escapeHtml(product.compatibility || "Consulte a aplicação para o seu veículo.");
    const message = encodeURIComponent(`Olá, tenho interesse em ${product.name}. Meu veículo é: `);
    return `
        <article class="product-card live-product-card" data-aos="fade-up" data-product-card data-category="${category}" data-name="${name.toLocaleLowerCase("pt-BR")}">
            <div class="product-img${product.image_url ? " has-image" : ""}">${image}</div>
            <p class="product-category">${category}</p>
            <h2>${name}</h2>
            ${compact ? "" : `<p>${description}</p><small>${compatibility}</small>`}
            <strong class="product-price">${formatPrice(product.price)}</strong>
            <a class="btn primary compact" href="https://api.whatsapp.com/send?phone=5511962658271&amp;text=${message}" target="_blank" rel="noopener noreferrer">Consultar peça</a>
        </article>
    `;
}

function renderCatalog(products) {
    currentProducts = products;
    document.querySelectorAll("[data-products-live]").forEach((grid) => {
        const displayed = grid.hasAttribute("data-featured-products") ? products.slice(0, 4) : products;
        grid.innerHTML = displayed.map((product) => productCard(product, grid.hasAttribute("data-featured-products"))).join("");
    });

    const category = document.querySelector("[data-product-category]");
    if (category) {
        const selected = category.value;
        const categories = [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
        category.replaceChildren(new Option("Todas as categorias", ""));
        categories.forEach((item) => category.add(new Option(item, item)));
        category.value = categories.includes(selected) ? selected : "";
    }

    window.filterPareFreioProducts?.();
    if (window.AOS) window.AOS.refreshHard();
}

async function loadProducts() {
    const grid = document.querySelector("[data-products-live]");
    if (!grid || !supabase) return;

    let data;
    let error;
    try {
        ({ data, error } = await supabase
            .from("products")
            .select(productSelect)
            .eq("active", true)
            .order("created_at", { ascending: false }));
    } catch (requestError) {
        console.error("Falha de conexão ao carregar produtos:", requestError);
        showStatus("[data-catalog-status]", "Não foi possível conectar ao catálogo online. Exibindo os dados disponíveis.", true);
        return;
    }

    if (error) {
        console.error("Falha ao carregar produtos do catálogo:", error);
        showStatus("[data-catalog-status]", "Não foi possível atualizar o catálogo online. Exibindo os dados disponíveis; tente novamente mais tarde.", true);
        return;
    }

    renderCatalog(data || []);
}

function updateOwnerNavigation(isOwner) {
    document.querySelectorAll("[data-owner-link]").forEach((link) => {
        link.hidden = !isOwner;
    });
}

async function checkOwner(user) {
    if (!user || !supabase) return false;
    const { data, error } = await supabase
        .from("site_owners")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Falha ao verificar permissões do painel:", error);
        showStatus("[data-admin-auth-status]", "Não foi possível verificar sua autorização. Confira a configuração do banco.", true);
        return false;
    }
    return Boolean(data);
}

function resetProductForm() {
    const form = document.querySelector("[data-product-form]");
    if (!form) return;
    form.reset();
    form.elements.id.value = "";
    form.dataset.existingImage = "";
    document.querySelector("[data-product-form-title]").textContent = "Cadastrar peça";
    document.querySelector("[data-product-submit]").textContent = "Publicar peça";
    document.querySelector("[data-product-cancel]").hidden = true;
    document.querySelector("[data-current-image]").textContent = "";
}

function startEdit(product) {
    const form = document.querySelector("[data-product-form]");
    form.elements.id.value = product.id;
    form.elements.name.value = product.name;
    form.elements.category.value = product.category;
    form.elements.price.value = product.price;
    form.elements.description.value = product.description;
    form.elements.compatibility.value = product.compatibility || "";
    form.dataset.existingImage = product.image_url || "";
    document.querySelector("[data-product-form-title]").textContent = "Editar peça";
    document.querySelector("[data-product-submit]").textContent = "Salvar alterações";
    document.querySelector("[data-product-cancel]").hidden = false;
    document.querySelector("[data-current-image]").textContent = product.image_url ? "A foto atual será mantida se você não selecionar outra." : "";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderAdminProducts(products) {
    const container = document.querySelector("[data-admin-products]");
    if (!container) return;
    if (!products.length) {
        container.innerHTML = '<p class="catalog-empty">Ainda não há peças cadastradas. Use o formulário para publicar a primeira.</p>';
        return;
    }

    container.innerHTML = products.map((product) => `
        <article class="admin-product-row">
            <div class="admin-product-thumb">${product.image_url
                ? `<img src="${escapeHtml(product.image_url)}" alt="" loading="lazy">`
                : `<span>${escapeHtml(product.category)}</span>`}</div>
            <div class="admin-product-info">
                <strong>${escapeHtml(product.name)}</strong>
                <span>${escapeHtml(product.category)} · ${formatPrice(product.price)}</span>
            </div>
            <div class="admin-product-actions">
                <button class="text-button" type="button" data-edit-product="${escapeHtml(product.id)}">Editar</button>
                <button class="text-button danger-button" type="button" data-delete-product="${escapeHtml(product.id)}">Excluir</button>
            </div>
        </article>
    `).join("");

    container.querySelectorAll("[data-edit-product]").forEach((button) => {
        button.addEventListener("click", () => {
            const product = products.find((item) => item.id === button.dataset.editProduct);
            if (product) startEdit(product);
        });
    });
    container.querySelectorAll("[data-delete-product]").forEach((button) => {
        button.addEventListener("click", () => deleteProduct(button.dataset.deleteProduct));
    });
}

async function loadAdminProducts() {
    if (!supabase || !ownerUser) return;
    showStatus("[data-admin-list-status]", "Carregando produtos...");
    let data;
    let error;
    try {
        ({ data, error } = await supabase
            .from("products")
            .select(productSelect)
            .order("created_at", { ascending: false }));
    } catch (requestError) {
        showStatus("[data-admin-list-status]", `Não foi possível carregar os produtos: ${requestError.message}`, true);
        return;
    }
    if (error) {
        showStatus("[data-admin-list-status]", `Não foi possível carregar os produtos: ${error.message}`, true);
        return;
    }
    adminProducts = data || [];
    renderAdminProducts(data || []);
    showStatus("[data-admin-list-status]", `${data.length} produto(s) no catálogo.`);
}

async function loadAdminLeads() {
    if (!supabase || !ownerUser) return;
    let data;
    let error;
    try {
        ({ data, error } = await supabase
            .from("leads")
            .select("id,name,email,phone,vehicle,message,created_at")
            .order("created_at", { ascending: false })
            .limit(50));
    } catch (requestError) {
        showStatus("[data-admin-leads-status]", `Não foi possível carregar os pedidos: ${requestError.message}`, true);
        return;
    }
    if (error) {
        showStatus("[data-admin-leads-status]", `Não foi possível carregar os pedidos: ${error.message}`, true);
        return;
    }

    const container = document.querySelector("[data-admin-leads]");
    if (!container) return;
    if (!data.length) {
        container.innerHTML = '<p class="catalog-empty">Nenhum pedido recebido ainda.</p>';
        showStatus("[data-admin-leads-status]", "");
        return;
    }

    container.innerHTML = data.map((lead) => `
        <article class="admin-lead-card">
            <div class="admin-form-heading">
                <strong>${escapeHtml(lead.name)}</strong>
                <time>${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(lead.created_at))}</time>
            </div>
            <p>${escapeHtml(lead.message)}</p>
            <div class="admin-lead-meta">
                <a href="https://api.whatsapp.com/send?phone=${encodeURIComponent(lead.phone.replace(/\D/g, ""))}" target="_blank" rel="noopener noreferrer">${escapeHtml(lead.phone)}</a>
                ${lead.email ? `<a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>` : ""}
                ${lead.vehicle ? `<span>Veículo: ${escapeHtml(lead.vehicle)}</span>` : ""}
            </div>
        </article>
    `).join("");
    showStatus("[data-admin-leads-status]", `${data.length} pedido(s) recente(s).`);
}

function storagePathFromUrl(url) {
    const marker = `/storage/v1/object/public/${imageBucket}/`;
    const index = url.indexOf(marker);
    return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
}

async function removeOldImage(url) {
    const path = url && storagePathFromUrl(url);
    if (!path) return;
    const { error } = await supabase.storage.from(imageBucket).remove([path]);
    if (error) throw error;
}

async function uploadProductImage(file) {
    if (!file) return null;
    const accepted = ["image/jpeg", "image/png", "image/webp"];
    if (!accepted.includes(file.type)) throw new Error("Envie uma imagem JPG, PNG ou WebP.");
    if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");

    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${ownerUser.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(imageBucket).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(imageBucket).getPublicUrl(path);
    return data.publicUrl;
}

async function saveProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = document.querySelector("[data-product-submit]");
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const previous = adminProducts.find((product) => product.id === id);
    let uploadedUrl = null;
    button.disabled = true;
    showStatus("[data-admin-status]", "Salvando produto e foto...");

    try {
        const imageFile = formData.get("image");
        uploadedUrl = await uploadProductImage(imageFile?.size ? imageFile : null);
        const product = {
            name: String(formData.get("name")).trim(),
            category: String(formData.get("category")).trim(),
            price: Number(formData.get("price")),
            description: String(formData.get("description")).trim(),
            compatibility: String(formData.get("compatibility")).trim() || null,
            image_url: uploadedUrl || previous?.image_url || null,
            active: true,
            updated_at: new Date().toISOString(),
        };
        const query = id
            ? supabase.from("products").update(product).eq("id", id)
            : supabase.from("products").insert(product);
        const { error } = await query;
        if (error) throw error;

        if (uploadedUrl && previous?.image_url) {
            try {
                await removeOldImage(previous.image_url);
            } catch (error) {
                console.error("Produto salvo, mas a imagem anterior não foi removida:", error);
                showStatus("[data-admin-status]", "Produto salvo. A foto antiga não pôde ser removida do armazenamento.", true);
                resetProductForm();
                await loadAdminProducts();
                await loadProducts();
                return;
            }
        }

        showStatus("[data-admin-status]", id ? "Produto atualizado e publicado no catálogo." : "Produto cadastrado e publicado no catálogo.");
        resetProductForm();
        await loadAdminProducts();
        await loadProducts();
    } catch (error) {
        console.error("Falha ao salvar produto:", error);
        if (uploadedUrl && (!previous || uploadedUrl !== previous.image_url)) {
            try {
                await removeOldImage(uploadedUrl);
            } catch (cleanupError) {
                console.error("Falha ao remover foto após erro ao salvar:", cleanupError);
            }
        }
        showStatus("[data-admin-status]", `Não foi possível salvar o produto: ${error.message}`, true);
    } finally {
        button.disabled = false;
    }
}

async function deleteProduct(id) {
    const product = adminProducts.find((item) => item.id === id);
    if (!product || !window.confirm(`Excluir "${product.name}" do catálogo?`)) return;
    showStatus("[data-admin-list-status]", "Excluindo produto...");
    let error;
    try {
        ({ error } = await supabase.from("products").delete().eq("id", id));
    } catch (requestError) {
        showStatus("[data-admin-list-status]", `Não foi possível excluir o produto: ${requestError.message}`, true);
        return;
    }
    if (error) {
        showStatus("[data-admin-list-status]", `Não foi possível excluir o produto: ${error.message}`, true);
        return;
    }
    try {
        await removeOldImage(product.image_url);
    } catch (error) {
        console.error("Produto excluído, mas a foto não pôde ser removida:", error);
        showStatus("[data-admin-list-status]", "Produto excluído. A foto antiga não pôde ser removida do armazenamento.", true);
        await loadAdminProducts();
        await loadProducts();
        return;
    }
    showStatus("[data-admin-status]", "Produto removido do catálogo.");
    await loadAdminProducts();
    await loadProducts();
}

async function syncSession(session) {
    const user = session?.user || null;
    try {
        ownerUser = await checkOwner(user);
    } catch (error) {
        console.error("Falha ao verificar a sessão:", error);
        ownerUser = false;
        showStatus("[data-admin-auth-status]", `Não foi possível verificar sua conta: ${error.message}`, true);
    }
    updateOwnerNavigation(ownerUser);

    const panel = document.querySelector("[data-admin-panel]");
    const locked = document.querySelector("[data-admin-locked]");
    if (!panel || !locked) return;

    panel.hidden = !ownerUser;
    locked.hidden = ownerUser;
    if (ownerUser) {
        await loadAdminProducts();
        await loadAdminLeads();
    }
    else if (user) showStatus("[data-admin-auth-status]", "Esta conta não tem autorização do dono. O catálogo público continua disponível.", true);
}

function setupContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = new FormData(form);
        const status = document.querySelector("[data-form-status]");
        const name = String(values.get("nome")).trim();
        const phone = String(values.get("telefone")).trim();
        const email = String(values.get("email") || "").trim();
        const vehicle = String(values.get("veiculo") || "").trim();
        const message = String(values.get("mensagem")).trim();

        if (!supabase) {
            status.textContent = contactFailureMessage;
            const fallback = `Olá, sou ${name}. Veículo: ${vehicle || "não informado"}. Mensagem: ${message}`;
            window.location.href = `https://api.whatsapp.com/send?phone=5511962658271&text=${encodeURIComponent(fallback)}`;
            return;
        }

        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        status.textContent = "Registrando seu pedido...";
        let error;
        try {
            ({ error } = await supabase.from("leads").insert({
                name,
                phone,
                email: email || null,
                vehicle: vehicle || null,
                message,
            }));
        } catch (requestError) {
            error = requestError;
        } finally {
            submit.disabled = false;
        }
        if (error) {
            console.error("Falha ao registrar o pedido:", error);
            status.textContent = `Não foi possível registrar sua solicitação: ${error.message}`;
            status.classList.add("is-error");
            return;
        }
        status.textContent = "Pedido registrado. Abrindo o WhatsApp para continuar o atendimento.";
        status.classList.remove("is-error");
        const text = `Olá, sou ${name}. Veículo: ${vehicle || "não informado"}. Mensagem: ${message}`;
        window.location.href = `https://api.whatsapp.com/send?phone=5511962658271&text=${encodeURIComponent(text)}`;
        form.reset();
    });
}

function setupAccountForms() {
    const loginForm = document.querySelector("[data-auth-login]");
    loginForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = new FormData(loginForm);
        showStatus("[data-login-status]", "Validando acesso...");
        let data;
        let error;
        try {
            ({ data, error } = await supabase.auth.signInWithPassword({
                email: String(values.get("email")).trim(),
                password: String(values.get("password")),
            }));
        } catch (requestError) {
            showStatus("[data-login-status]", `Não foi possível entrar: ${requestError.message}`, true);
            return;
        }
        if (error) {
            showStatus("[data-login-status]", `Não foi possível entrar: ${error.message}`, true);
            return;
        }
        if (await checkOwner(data.user)) {
            window.location.href = "../admin/";
        } else {
            showStatus("[data-login-status]", "Acesso realizado. Clientes podem continuar navegando pelo catálogo.");
        }
    });

    const signupForm = document.querySelector("[data-auth-signup]");
    signupForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = new FormData(signupForm);
        showStatus("[data-signup-status]", "Criando sua conta...");
        let error;
        try {
            ({ error } = await supabase.auth.signUp({
                email: String(values.get("email")).trim(),
                password: String(values.get("password")),
                options: { data: { full_name: String(values.get("name")).trim() } },
            }));
        } catch (requestError) {
            showStatus("[data-signup-status]", `Não foi possível criar a conta: ${requestError.message}`, true);
            return;
        }
        if (error) {
            showStatus("[data-signup-status]", `Não foi possível criar a conta: ${error.message}`, true);
            return;
        }
        signupForm.reset();
        showStatus("[data-signup-status]", "Cadastro recebido. Confira seu e-mail para confirmar a conta, se a confirmação estiver ativada.");
    });

    document.querySelector("[data-password-reset]")?.addEventListener("click", async () => {
        const email = loginForm.elements.email.value.trim();
        if (!email) {
            showStatus("[data-login-status]", "Informe seu e-mail antes de pedir a recuperação da senha.", true);
            return;
        }
        let error;
        try {
            ({ error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.href,
            }));
        } catch (requestError) {
            showStatus("[data-login-status]", `Não foi possível enviar a recuperação: ${requestError.message}`, true);
            return;
        }
        showStatus("[data-login-status]", error
            ? `Não foi possível enviar a recuperação: ${error.message}`
            : "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.", Boolean(error));
    });

    const passwordForm = document.querySelector("[data-password-update]");
    passwordForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const password = new FormData(passwordForm).get("password");
        let error;
        try {
            ({ error } = await supabase.auth.updateUser({ password: String(password) }));
        } catch (requestError) {
            showStatus("[data-password-status]", `Não foi possível atualizar a senha: ${requestError.message}`, true);
            return;
        }
        if (error) {
            showStatus("[data-password-status]", `Não foi possível atualizar a senha: ${error.message}`, true);
            return;
        }
        passwordForm.reset();
        passwordForm.hidden = true;
        showStatus("[data-login-status]", "Senha atualizada. Você já pode entrar com a nova senha.");
    });
}

async function initialize() {
    if (!isConfigured) {
        const message = "O acesso online ainda precisa ser conectado ao projeto Supabase.";
        setupContactForm();
        showStatus("[data-login-status], [data-signup-status]", message, true);
        showStatus("[data-admin-auth-status]", message, true);
        if (document.querySelector("[data-products-live]")) {
            showStatus("[data-catalog-status]", "Mostrando o catálogo de demonstração. O catálogo online será ativado após configurar o banco.");
        }
        return;
    }

    setupContactForm();
    try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        supabase = createClient(config.url, config.anonKey, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        setupAccountForms();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        await syncSession(data.session);
        await loadProducts();

        supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                const passwordForm = document.querySelector("[data-password-update]");
                if (passwordForm) {
                    passwordForm.hidden = false;
                    passwordForm.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }
            void syncSession(session);
        });
        supabase.channel("public-product-catalog")
            .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
                void loadProducts();
                void loadAdminProducts();
                void loadAdminLeads();
            })
            .subscribe();
        supabase.channel("public-contact-requests")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => {
                void loadAdminLeads();
            })
            .subscribe();

        document.querySelector("[data-product-form]")?.addEventListener("submit", saveProduct);
        document.querySelector("[data-product-cancel]")?.addEventListener("click", resetProductForm);
        document.querySelectorAll("[data-auth-logout]").forEach((button) => {
            button.addEventListener("click", async () => {
                const { error } = await supabase.auth.signOut();
                if (error) showStatus("[data-admin-status]", `Não foi possível sair: ${error.message}`, true);
                else window.location.href = "../conta/";
            });
        });
    } catch (error) {
        console.error("Falha ao inicializar a conexão online:", error);
        contactFailureMessage = "Não foi possível conectar ao banco online. Abrindo o WhatsApp sem salvar o pedido no site.";
        showStatus("[data-login-status], [data-signup-status], [data-admin-auth-status]", `Não foi possível conectar ao serviço online: ${error.message}`, true);
        showStatus("[data-catalog-status]", "Falha ao conectar ao catálogo online. Os dados atuais continuam disponíveis.", true);
    }
}

void initialize();
