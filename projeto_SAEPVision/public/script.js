let usuarioAtivo = null;

document.addEventListener("DOMContentLoaded", () => {
    carregarPublicacoes();
});

function verificarAutenticacao(event) {
    if (!usuarioAtivo) {
        if (event) event.target.blur();
        abrirModalLogin();
        return false;
    }
    return true;
}

function abrirModalLogin() { document.getElementById('modal-login').style.display = 'flex'; }
function fecharModalLogin() { document.getElementById('modal-login').style.display = 'none'; limparErrosLogin(); }
function toggleMenu() { document.getElementById('menu-lateral').classList.toggle('aberto'); }

function limparErrosLogin() {
    document.getElementById('erro-email').innerText = '';
    document.getElementById('erro-senha').innerText = '';
    document.getElementById('erro-credenciais').innerText = '';
}

async function efetuarLogin() {
    limparErrosLogin();
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    let valido = true;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        document.getElementById('erro-email').innerText = 'E-mail inválido ou vazio.';
        valido = false;
    }
    if (!senha) {
        document.getElementById('erro-senha').innerText = 'A senha é obrigatória e não pode estar vazia.';
        valido = false;
    }
    if (!valido) return;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        
        if (res.ok) {
            const data = await res.json();
            usuarioAtivo = data.user;
            fecharModalLogin();
            atualizarInterface();
        } else {
            document.getElementById('erro-credenciais').innerText = 'Usuário não encontrado ou senha incorreta';
        }
    } catch (err) {
        console.error('Erro na autenticação:', err);
    }
}

function efetuarLogout() {
    usuarioAtivo = null;
    toggleMenu();
    atualizarInterface();
}

function atualizarInterface() {
    const btnAuth = document.getElementById('btn-auth');
    const btnPerfil = document.getElementById('btn-perfil');
    
    if (usuarioAtivo) {
        document.getElementById('user-handle').innerText = usuarioAtivo.nome_usuario;
        document.getElementById('user-avatar').src = usuarioAtivo.imagem_usuario || 'imagens_usuarios/usuario1.png';
        btnAuth.style.display = 'none';
        
        if (usuarioAtivo.tipo === 'fotografo') {
            btnPerfil.disabled = false;
            document.getElementById('secao-cadastro').style.display = 'block';
            atualizarEstatisticas();
        } else {
            btnPerfil.disabled = true;
            document.getElementById('secao-cadastro').style.display = 'none';
        }
    } else {
        document.getElementById('user-handle').innerText = '@SAEPVision';
        document.getElementById('user-avatar').src = 'imagens_usuarios/usuario1.png';
        btnAuth.style.display = 'block';
        btnPerfil.disabled = true;
        document.getElementById('secao-cadastro').style.display = 'none';
    }
    carregarPublicacoes();
}

async function atualizarEstatisticas() {
    if (!usuarioAtivo || usuarioAtivo.tipo !== 'fotografo') return;
    try {
        const res = await fetch(`/api/fotografo/${usuarioAtivo.id_usuario}/estatisticas`);
        const data = await res.json();
        document.getElementById('total-likes').innerText = data.likes || 0;
        document.getElementById('total-pubs').innerText = data.publicacoes || 0;
    } catch (err) {
        console.error('Erro ao carregar estatísticas', err);
    }
}

async function carregarPublicacoes(busca = '') {
    const userId = usuarioAtivo ? usuarioAtivo.id_usuario : 0;
    try {
        const res = await fetch(`/api/publicacoes?busca=${busca}&userId=${userId}`);
        const galeria = document.getElementById('galeria');
        galeria.innerHTML = '';
        document.getElementById('erro-busca').innerText = '';

        if (res.status === 404) {
            document.getElementById('erro-busca').innerText = 'Fotógrafo não encontrado';
            return;
        }

        const publicacoes = await res.json();
        publicacoes.forEach(pub => {
            const corCoracao = pub.curtido ? '#FF0000' : '#000000';
            const btnLixeira = (usuarioAtivo && usuarioAtivo.id_usuario === pub.id_usuario) 
                ? `<div class="btn-excluir" onclick="excluirPublicacao(${pub.id_publicacao})"><img src="icones/lixeira.svg" alt="Excluir" width="20"></div>` 
                : '';

            galeria.innerHTML += `
                <div class="card-foto">
                    <div class="tooltip">
                        <p>Foto tirada por: ${pub.nome_fotografo}</p>
                        <p>Local: ${pub.local_foto}</p>
                    </div>
                    <img src="/uploads/${pub.url_fotografia}" class="foto-img" alt="${pub.titulo_imagem}">
                    <div class="card-info">
                        <span>${pub.titulo_imagem}</span>
                        <div class="acoes-foto">
                            <div class="btn-curtir" onclick="alternarCurtida(${pub.id_publicacao})">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="${corCoracao}">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                                <span>${pub.total_curtidas}</span>
                            </div>
                            ${btnLixeira}
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error('Erro ao listar publicações:', err);
    }
}

function buscarFotografo() {
    if (!verificarAutenticacao()) return;
    const termo = document.getElementById('input-busca').value.replace('@', '');
    carregarPublicacoes(termo);
}

function carregarMinhasPublicacoes() {
    if (usuarioAtivo) {
        carregarPublicacoes(usuarioAtivo.nome_usuario);
        toggleMenu();
    }
}

async function alternarCurtida(idPublicacao) {
    if (!verificarAutenticacao()) return;
    try {
        await fetch(`/api/publicacoes/${idPublicacao}/curtir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: usuarioAtivo.id_usuario })
        });
        carregarPublicacoes();
        atualizarEstatisticas();
    } catch (err) {
        console.error('Erro ao curtir', err);
    }
}

async function excluirPublicacao(idPublicacao) {
    try {
        await fetch(`/api/publicacoes/${idPublicacao}`, { method: 'DELETE' });
        carregarPublicacoes();
        atualizarEstatisticas();
    } catch (err) {
        console.error('Erro ao excluir', err);
    }
}

function atualizarNomeArquivo() {
    const input = document.getElementById('foto-arquivo');
    const nomeSpan = document.getElementById('nome-arquivo');
    nomeSpan.innerText = input.files[0] ? input.files[0].name : 'Nenhum arquivo escolhido';
}

async function cadastrarPublicacao() {
    const titulo = document.getElementById('foto-titulo').value;
    const local = document.getElementById('foto-local').value;
    const arquivo = document.getElementById('foto-arquivo').files[0];
    
    document.getElementById('erro-titulo').innerText = '';
    document.getElementById('erro-local').innerText = '';
    document.getElementById('erro-arquivo').innerText = '';
    
    let valido = true;
    if (!titulo) { document.getElementById('erro-titulo').innerText = 'Campo obrigatório'; valido = false; }
    if (!local) { document.getElementById('erro-local').innerText = 'Campo obrigatório'; valido = false; }
    if (!arquivo) { document.getElementById('erro-arquivo').innerText = 'Nenhum arquivo escolhido'; valido = false; }
    
    if (!valido) return;

    const formData = new FormData();
    formData.append('titulo_imagem', titulo);
    formData.append('local_foto', local);
    formData.append('imagem', arquivo);
    formData.append('id_usuario', usuarioAtivo.id_usuario);

    try {
        const res = await fetch('/api/publicacoes', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            document.getElementById('foto-titulo').value = '';
            document.getElementById('foto-local').value = '';
            document.getElementById('foto-arquivo').value = '';
            atualizarNomeArquivo();
            carregarPublicacoes();
            atualizarEstatisticas();
        }
    } catch (err) {
        console.error('Erro no cadastro', err);
    }
}