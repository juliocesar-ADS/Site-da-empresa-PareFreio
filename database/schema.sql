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
    nome VARCHAR(160) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    descricao TEXT NOT NULL,
    compatibilidade VARCHAR(200),
    imagem VARCHAR(220),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
