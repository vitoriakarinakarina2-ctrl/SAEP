CREATE TABLE IF NOT EXISTS tb_usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    nome_usuario VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    imagem_usuario VARCHAR(255) DEFAULT 'usuario1.png',
    tipo ENUM('usuario', 'fotografo') NOT NULL DEFAULT 'usuario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_publicacao (
    id_publicacao INT AUTO_INCREMENT PRIMARY KEY,
    titulo_imagem VARCHAR(150) NOT NULL,
    local_foto VARCHAR(150) NOT NULL,
    id_usuario INT NOT NULL,
    url_fotografia VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES tb_usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tb_curtida (
    id_curtida INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_publicacao INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (id_usuario, id_publicacao),
    FOREIGN KEY (id_usuario) REFERENCES tb_usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_publicacao) REFERENCES tb_publicacao(id_publicacao) ON DELETE CASCADE
);

INSERT INTO tb_usuario (nome, nome_usuario, email, senha, tipo) VALUES ('João Fotógrafo', 'joao.foto', 'joao@teste.com', '123456', 'fotografo');