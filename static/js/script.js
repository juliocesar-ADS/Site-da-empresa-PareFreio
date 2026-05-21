const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (navToggle && nav) {
    navToggle.addEventListener("click", () => nav.classList.toggle("open"));
}

if (window.AOS) {
    AOS.init({ duration: 700, once: true, offset: 80 });
}

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const status = document.querySelector("[data-form-status]");
        const formData = new FormData(contactForm);
        const payload = Object.fromEntries(formData.entries());

        status.textContent = "Enviando...";

        try {
            const response = await fetch("/api/contato", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) {
                status.textContent = data.message || "Confira os campos e tente novamente.";
                return;
            }

            status.textContent = data.message;
            window.location.href = data.whatsapp;
            contactForm.reset();
        } catch (error) {
            status.textContent = "Não foi possível enviar agora. Chame pelo WhatsApp.";
        }
    });
}

const chat = document.querySelector("[data-chat]");

if (chat) {
    const messages = document.querySelector("[data-chat-messages]");
    const form = document.querySelector("[data-chat-form]");
    const input = document.querySelector("[data-chat-input]");

    const answers = [
        {
            keywords: ["1", "servico", "servicos", "serviço", "serviços", "freio", "direcao", "direção", "suspensao", "suspensão", "embreagem"],
            text: "Vendemos peças para freios, direção, suspensão e embreagem. Não fazemos mão de obra, mas ajudamos você a identificar a peça correta.",
        },
        {
            keywords: ["2", "produto", "produtos", "peca", "peça", "pecas", "peças", "catalogo", "catálogo"],
            text: "Temos caixas de direção elétrica, mecânica e hidráulica, terminais, pinças dianteiras e traseiras, hidrovácuos, bandejas, buchas, pivôs, amortecedores e kit de embreagem.",
        },
        {
            keywords: ["3", "orcamento", "orçamento", "preco", "preço", "valor", "cotacao", "cotação"],
            text: "Para orçamento, envie modelo, ano, motor e a peça que procura. Posso te direcionar para o WhatsApp: (11) 96265-8271.",
        },
        {
            keywords: ["4", "local", "localizacao", "localização", "endereco", "endereço", "mapa"],
            text: "Estamos na Rua R Giosue Carducci, 10. Você também encontra o mapa na página de contato.",
        },
        {
            keywords: ["horario", "abre", "fecha", "funciona"],
            text: "Consulte o horário atualizado pelo WhatsApp para evitar desencontro.",
        },
    ];

    function addMessage(text, type = "bot") {
        const bubble = document.createElement("div");
        bubble.className = `message ${type}`;
        bubble.textContent = text;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
    }

    function answerFor(text) {
        const normalized = text.toLowerCase();
        const match = answers.find((item) => item.keywords.some((word) => normalized.includes(word)));
        return match ? match.text : "Posso ajudar com produtos, orçamento, localização e contato. Escolha 1, 2, 3 ou 4.";
    }

    addMessage("Olá! Bem-vindo à PareFreio. Como podemos ajudar? 1 - Produtos e categorias | 2 - Catálogo | 3 - Orçamento | 4 - Localização");

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, "user");
        input.value = "";
        setTimeout(() => addMessage(answerFor(text)), 250);
    });
}
