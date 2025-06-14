const socket = io();

// Gerar e persistir userId único
const userId = localStorage.getItem('userId') || ('user_' + Math.random().toString(36).substr(2, 9));
localStorage.setItem('userId', userId);

// Referências de elementos do DOM
const nickInput = document.getElementById('nickName');
const btnHost = document.getElementById('btnHost');
const btnCliente = document.getElementById('btnCliente');
const roomInput = document.getElementById('roomCode');
const senhaInput = document.getElementById('roomPassword');
const joinBtn = document.getElementById('joinBtn');
const statusDiv = document.getElementById('status');

const lobbyDiv = document.getElementById('lobby');
const salaDiv = document.getElementById('sala');

const salaCodigoSpan = document.getElementById('salaCodigo');
const salaNickSpan = document.getElementById('salaNick');
const salaRoleSpan = document.getElementById('salaRole');
const listaJogadores = document.getElementById('listaJogadores');
const btnSair = document.getElementById('btnSair');

let role = null;

// Inicializa campos escondidos
roomInput.classList.add('hidden');
senhaInput.classList.add('hidden');
joinBtn.classList.add('hidden');

// Ativa botões se nick preenchido
nickInput.addEventListener('input', () => {
  const valido = nickInput.value.trim().length > 0;
  btnHost.disabled = !valido;
  btnCliente.disabled = !valido;
});

// Criar Jogo (Host)
btnHost.addEventListener('click', () => {
  role = 'host';
  btnHost.disabled = true;
  btnCliente.disabled = false;

  roomInput.classList.add('hidden');
  senhaInput.classList.remove('hidden');
  joinBtn.classList.remove('hidden');
});

// Entrar em Jogo (Cliente)
btnCliente.addEventListener('click', () => {
  role = 'cliente';
  btnCliente.disabled = true;
  btnHost.disabled = false;

  roomInput.classList.remove('hidden');
  senhaInput.classList.remove('hidden');
  joinBtn.classList.remove('hidden');
});

// Entrar na sala
joinBtn.addEventListener('click', () => {
  const nick = nickInput.value.trim();
  const senha = senhaInput.value.trim() || null;
  let roomCode = roomInput.value.trim();

  if (role === 'host') roomCode = gerarCodigoSala();
  if (role === 'cliente' && roomCode.length < 6) return showStatus("Código inválido.", 'danger');

  localStorage.setItem('nick', nick);
  localStorage.setItem('sala', roomCode);
  localStorage.setItem('papel', role);

  socket.emit('joinRoom', { roomCode, playerName: nick, role, senha, userId });
});

// Geração de código aleatório pra sala
function gerarCodigoSala() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numeros = '0123456789';
  return [...Array(8)].map(() => Math.random() > 0.5 ? letras.charAt(Math.floor(Math.random() * letras.length)) : numeros.charAt(Math.floor(Math.random() * numeros.length))).join('');
}

// Entrou com sucesso
socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
  lobbyDiv.classList.add('hidden');
  salaDiv.classList.remove('hidden');

  salaCodigoSpan.textContent = roomCode;
  salaNickSpan.textContent = playerName;
  salaRoleSpan.textContent = role.toUpperCase();

  showStatus("Conectado à sala!", 'success');
});

// Atualiza lista de jogadores conectados
socket.on('updatePlayerList', ({ jogadores }) => {
  listaJogadores.innerHTML = '';
  jogadores.forEach(({ nome, papel }) => {
    const li = document.createElement('li');
    li.textContent = `${nome} ${papel === 'host' ? '(Mestre)' : ''}`;
    listaJogadores.appendChild(li);
  });
});

// Mensagem de erro do servidor
socket.on('errorMessage', (msg) => {
  showStatus(msg, 'danger');
});

// Exibe status/mensagem
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status-msg ${type}`;
  statusDiv.classList.remove('hidden');
  setTimeout(() => statusDiv.classList.add('hidden'), 4000);
}

// Botão desconectar
btnSair.addEventListener('click', () => {
  localStorage.clear();
  window.location.reload();
});

// Reentrar automaticamente usando localStorage
window.addEventListener('load', () => {
  const nick = localStorage.getItem('nick');
  const sala = localStorage.getItem('sala');
  const papel = localStorage.getItem('papel');

  if (nick && sala && papel) {
    socket.emit('joinRoom', { roomCode: sala, playerName: nick, role: papel, senha: null, userId });
  }
});

// Exportar sala como JSON
document.getElementById('btnExportar').addEventListener('click', () => {
  const dados = {
    sala: localStorage.getItem('sala'),
    host: { userId, nome: localStorage.getItem('nick') },
    jogadores: [], // integrar dados reais depois
    mapa: {},      // integrar dados reais depois
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], {type: 'application/json'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `sala-${dados.sala}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
});

// Importar sala JSON
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
