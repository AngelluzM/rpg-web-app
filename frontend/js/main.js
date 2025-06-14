const socket = io();

// UserId único persistente
const userId = localStorage.getItem('userId') || ('user_' + Math.random().toString(36).substr(2, 9));
localStorage.setItem('userId', userId);

// Elementos DOM
const nickInput = document.getElementById('nickName');
const btnHost = document.getElementById('btnHost');
const btnCliente = document.getElementById('btnCliente');
const roomInput = document.getElementById('roomCode');
const senhaInput = document.getElementById('roomPassword');
const joinBtn = document.getElementById('joinBtn');
const btnVoltar = document.getElementById('btnVoltar');
const statusDiv = document.getElementById('status');
const nickAlerta = document.getElementById('nickAlerta');

const lobbyDiv = document.getElementById('lobby');
const salaDiv = document.getElementById('sala');
const salaCodigoSpan = document.getElementById('salaCodigo');
const salaNickSpan = document.getElementById('salaNick');
const salaRoleSpan = document.getElementById('salaRole');
const listaJogadores = document.getElementById('listaJogadores');
const btnSair = document.getElementById('btnSair');

let role = null;

// Função para verificar nick preenchido
function verificaNick() {
  const nick = nickInput.value.trim();
  if (!nick) {
    nickAlerta.classList.remove('hidden');
    nickInput.classList.add('alerta');
    return false;
  }
  return true;
}

// Ocultar alerta ao focar no campo nick
nickInput.addEventListener('focus', () => {
  nickAlerta.classList.add('hidden');
  nickInput.classList.remove('alerta');
});

// Botão "Criar Sala"
btnHost.addEventListener('click', () => {
  if (!verificaNick()) return;

  role = 'host';
  senhaInput.classList.remove('hidden');
  joinBtn.textContent = "Confirmar";
  joinBtn.classList.remove('hidden');
  btnVoltar.classList.remove('hidden');
  roomInput.classList.add('hidden');

  btnHost.classList.add('hidden');
  btnCliente.classList.add('hidden');
});

// Botão "Acessar Sala"
btnCliente.addEventListener('click', () => {
  if (!verificaNick()) return;

  role = 'cliente';
  senhaInput.classList.remove('hidden');
  roomInput.classList.remove('hidden');
  joinBtn.textContent = "Confirmar";
  joinBtn.classList.remove('hidden');
  btnVoltar.classList.remove('hidden');

  btnHost.classList.add('hidden');
  btnCliente.classList.add('hidden');
});

// Botão "Voltar"
btnVoltar.addEventListener('click', () => {
  role = null;

  senhaInput.classList.add('hidden');
  roomInput.classList.add('hidden');
  joinBtn.classList.add('hidden');
  btnVoltar.classList.add('hidden');

  btnHost.classList.remove('hidden');
  btnCliente.classList.remove('hidden');

  nickInput.value = '';
  roomInput.value = '';
  senhaInput.value = '';
});

// Clique no botão "Confirmar"
joinBtn.addEventListener('click', () => {
  const nick = nickInput.value.trim();
  const senha = senhaInput.value.trim() || null;
  let roomCode = roomInput.value.trim();

  if (!nick) {
    showStatus("Informe um nick válido.", 'danger');
    return;
  }

  if (role === 'host') roomCode = gerarCodigoSala();
  if (role === 'cliente' && roomCode.length < 6) {
    showStatus("Código da sala inválido.", 'danger');
    return;
  }

  localStorage.setItem('nick', nick);
  localStorage.setItem('sala', roomCode);
  localStorage.setItem('papel', role);

  socket.emit('joinRoom', { roomCode, playerName: nick, role, senha, userId });
});

// Gerar código aleatório para sala
function gerarCodigoSala() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numeros = '0123456789';
  return [...Array(8)].map(() => Math.random() > 0.5 ? letras.charAt(Math.floor(Math.random() * letras.length)) : numeros.charAt(Math.floor(Math.random() * numeros.length))).join('');
}

// Evento: entrou na sala
socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
  lobbyDiv.classList.add('hidden');
  salaDiv.classList.remove('hidden');

  salaCodigoSpan.textContent = roomCode;
  salaNickSpan.textContent = playerName;
  salaRoleSpan.textContent = role.toUpperCase();

  showStatus("Conectado à sala!", 'success');
});

// Atualizar lista jogadores
socket.on('updatePlayerList', ({ jogadores }) => {
  listaJogadores.innerHTML = '';
  jogadores.forEach(({ nome, papel }) => {
    const li = document.createElement('li');
    li.textContent = `${nome} ${papel === 'host' ? '(Mestre)' : ''}`;
    listaJogadores.appendChild(li);
  });
});

// Receber erro do servidor
socket.on('errorMessage', (msg) => {
  showStatus(msg, 'danger');
});

// Exibir mensagens de status
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status-msg ${type}`;
  statusDiv.classList.remove('hidden');
  setTimeout(() => statusDiv.classList.add('hidden'), 4000);
}

// Botão "Desconectar"
btnSair.addEventListener('click', () => {
  localStorage.clear();
  window.location.reload();
});

// Reconexão automática ao recarregar a página
window.addEventListener('load', () => {
  const nick = localStorage.getItem('nick');
  const sala = localStorage.getItem('sala');
  const papel = localStorage.getItem('papel');

  if (nick && sala && papel) {
    socket.emit('joinRoom', { roomCode: sala, playerName: nick, role: papel, senha: null, userId });
  }
});

// Exportação JSON (exemplo básico)
document.getElementById('btnExportar').addEventListener('click', () => {
  const dados = {
    sala: localStorage.getItem('sala'),
    host: { userId, nome: localStorage.getItem('nick') },
    jogadores: [], // preencher depois
    mapa: {}, // preencher depois
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], {type: 'application/json'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `sala-${dados.sala}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
});

// Importação JSON (exemplo básico)
document.getElementById('inputImportar').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const dados = JSON.parse(e.target.result);
      showStatus("Sala importada com sucesso!", 'success');
    } catch {
      showStatus("Erro ao importar sala.", 'danger');
    }
  };
  reader.readAsText(file);
});
