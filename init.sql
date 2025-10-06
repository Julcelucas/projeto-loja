-- ==============================================
-- BANCO DE DADOS: projecto
-- Script: init.sql
-- Descrição: Criação completa das tabelas principais
-- ==============================================

CREATE DATABASE IF NOT EXISTS projecto CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE projecto;

-- ==============================================
-- 1️⃣ Tabela: usuarios
-- ==============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'usuario') DEFAULT 'usuario',
    codigoToken VARCHAR(10) DEFAULT NULL,
    expiracaoToken BIGINT DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 2️⃣ Tabela: codigo_secreto
-- ==============================================
CREATE TABLE IF NOT EXISTS codigo_secreto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 3️⃣ Tabela: produtos
-- ==============================================
CREATE TABLE IF NOT EXISTS produtos (
    codigo INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    imagem VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL
);

-- ==============================================
-- 4️⃣ Tabela: carrinho
-- ==============================================
CREATE TABLE IF NOT EXISTS carrinho (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    quantidade INT DEFAULT 1,
    UNIQUE KEY unique_produto_usuario (produto_id, usuario_id),
    FOREIGN KEY (produto_id) REFERENCES produtos(codigo) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ==============================================
-- 5️⃣ Tabela: vendas
-- ==============================================
CREATE TABLE IF NOT EXISTS vendas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ==============================================
-- 6️⃣ Tabela: visitas
-- ==============================================
CREATE TABLE IF NOT EXISTS visitas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pagina VARCHAR(100) DEFAULT NULL,
    ip VARCHAR(45) DEFAULT NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- Inserção opcional de um usuário admin inicial
-- (altera a senha manualmente com hash bcrypt depois)
-- ==============================================
INSERT INTO usuarios (nome, email, senha, tipo)
VALUES ('Administrador', 'admin@gmail.com', '$2b$10$O5zG/8SosA.hXnFXg0b29Ob6faMrH2i.FYElH7KPsD8lcBGtDOoYy', 'admin')
ON DUPLICATE KEY UPDATE email = email;
