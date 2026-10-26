const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME || 'saepvision'
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Rota de Login
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM tb_usuario WHERE email = ? AND senha = ?', [email, senha]);
        if (rows.length > 0) {
            res.json({ user: rows[0] });
        } else {
            res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar Publicações
app.get('/api/publicacoes', async (req, res) => {
    const busca = req.query.busca || '';
    const userId = req.query.userId || 0;
    try {
        let query = `
            SELECT p.*, u.nome AS nome_fotografo,
            (SELECT COUNT(*) FROM tb_curtida WHERE id_publicacao = p.id_publicacao) AS total_curtidas,
            EXISTS(SELECT 1 FROM tb_curtida WHERE id_publicacao = p.id_publicacao AND id_usuario = ?) AS curtido
            FROM tb_publicacao p 
            JOIN tb_usuario u ON p.id_usuario = u.id_usuario
        `;
        let params = [userId];

        if (busca) {
            const [userRows] = await pool.query('SELECT id_usuario FROM tb_usuario WHERE nome_usuario = ?', [busca]);
            if (userRows.length === 0) return res.status(404).json({ error: 'Fotógrafo não encontrado' });
            query += ' WHERE p.id_usuario = ?';
            params.push(userRows[0].id_usuario);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cadastrar Publicação
app.post('/api/publicacoes', upload.single('imagem'), async (req, res) => {
    const { titulo_imagem, local_foto, id_usuario } = req.body;
    const url_fotografia = req.file ? req.file.filename : '';
    try {
        await pool.query(
            'INSERT INTO tb_publicacao (titulo_imagem, local_foto, id_usuario, url_fotografia) VALUES (?, ?, ?, ?)',
            [titulo_imagem, local_foto, id_usuario, url_fotografia]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Curtir Publicação
app.post('/api/publicacoes/:id/curtir', async (req, res) => {
    const id_publicacao = req.params.id;
    const { id_usuario } = req.body;
    try {
        const [exist] = await pool.query('SELECT * FROM tb_curtida WHERE id_usuario = ? AND id_publicacao = ?', [id_usuario, id_publicacao]);
        if (exist.length > 0) {
            await pool.query('DELETE FROM tb_curtida WHERE id_usuario = ? AND id_publicacao = ?', [id_usuario, id_publicacao]);
        } else {
            await pool.query('INSERT INTO tb_curtida (id_usuario, id_publicacao) VALUES (?, ?)', [id_usuario, id_publicacao]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Excluir Publicação
app.delete('/api/publicacoes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM tb_publicacao WHERE id_publicacao = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Estatísticas do Fotógrafo
app.get('/api/fotografo/:id/estatisticas', async (req, res) => {
    try {
        const [pubs] = await pool.query('SELECT COUNT(*) as publicacoes FROM tb_publicacao WHERE id_usuario = ?', [req.params.id]);
        const [likes] = await pool.query('SELECT COUNT(*) as likes FROM tb_curtida c JOIN tb_publicacao p ON c.id_publicacao = p.id_publicacao WHERE p.id_usuario = ?', [req.params.id]);
        res.json({ publicacoes: pubs[0].publicacoes, likes: likes[0].likes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));