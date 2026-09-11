CREATE DATABASE IF NOT EXISTS parefreio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE parefreio;

CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    telefone VARCHAR(40) NOT NULL,
    email VARCHAR(160),
    veiculo VARCHAR(160),
    mensagem TEXT NOT NULL,
    origem VARCHAR(60) DEFAULT 'site',
    criado_em DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(160) NOT NULL UNIQUE,
    categoria VARCHAR(80) NOT NULL,
    descricao TEXT NOT NULL,
    compatibilidade VARCHAR(200),
    imagem VARCHAR(220),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO produtos (nome, categoria, descricao, compatibilidade) VALUES
    ('Pinças Dianteiras e Traseiras', 'Freios', 'Pinças de freio dianteiras e traseiras para diversas aplicações.', 'Consultar por modelo, ano e motorização.'),
    ('Caixa de Direção Elétrica', 'Direção', 'Caixas de direção elétrica com procedência e aplicação correta.', 'Consulte pelo modelo, ano e versão do veículo.'),
    ('Caixa de Direção Mecânica', 'Direção', 'Caixas de direção mecânica para reposição automotiva.', 'Consulte disponibilidade pelo veículo.'),
    ('Caixa de Direção Hidráulica', 'Direção', 'Caixas de direção hidráulica para linha leve e utilitários.', 'Consulte por modelo, ano e motorização.'),
    ('Terminais de Direção', 'Direção', 'Terminais de direção para reposição com encaixe correto.', 'Aplicação sob consulta.'),
    ('Hidrovácuos', 'Freios', 'Hidrovácuos para sistemas de freio de diversas aplicações.', 'Consulte disponibilidade pelo chassi ou modelo.'),
    ('Bandejas de Suspensão', 'Suspensão', 'Bandejas de suspensão para reposição automotiva.', 'Modelos nacionais e importados sob consulta.'),
    ('Buchas e Pivôs', 'Suspensão', 'Buchas e pivôs para suspensão, estabilidade e segurança.', 'Consulte pelo modelo do veículo.'),
    ('Amortecedores', 'Suspensão', 'Amortecedores para reposição em diferentes modelos.', 'Disponibilidade sob consulta.'),
    ('Kit de Embreagem', 'Embreagem', 'Kit de embreagem para reposição conforme aplicação do veículo.', 'Consulte por modelo, ano e motor.');
