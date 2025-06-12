const socket = io();

// Elementos da interface
const nickInput = document.getElementById('nickName');
const btnHost = document.getElementById('btnHost');
const btnCliente = document.getElementById('btnCliente');
const roomInput = document.getElementById('roomCode');
const senhaInput = document.getElementById('roomPassword');
const roomContainer = document.getElementById('codigoSalaContainer');
const senhaContainer = document.getElementById('senhaSalaContainer');
const joinBtn = document.getElementById('joinBtn');
const statusDiv = document.getElementById('status');

const lobbyDiv = document.getElementById('lobby');
const salaDiv = document.getElementById('sala');

const salaCodigoSpan = document.getElementById('salaCodigo');
const salaNickSpan = document.getElementById('salaNick');
const salaRoleSpan = document.getElementById('salaRole');
const listaJogadores = document.getElementById('listaJogadores');

let role = null;

// Ativa botões quando digita nick
nickInput.addEventListener('input', () => {
  const valido = nickInput.value.trim().length > 0;
  btnHost.classList.toggle('disabled', !valido);
  btnCliente.classList.toggle('disabled', !valido);
});

// Botão: Criar Jogo
btnHost.addEventListener('click', () => {
  role = 'host';
  btnHost.classList.replace('btn-outline-primary', 'btn-primary');
  btnCliente.classList.replace('btn-secondary', 'btn-outline-secondary');
  roomContainer.classList.add('d-none');
  senhaContainer.classList.remove('d-none');
  joinBtn.classList.remove('d-none');
  senhaInput.placeholder = 'Defina uma senha para a sala (opcional)';
});

// Botão: Entrar em Jogo
btnCliente.addEventListener('click', () => {
  role = 'cliente';
  btnCliente.classList.replace('btn-outline-secondary', 'btn-secondary');
  btnHost.classList.replace('btn-primary', 'btn-outline-primary');
  roomContainer.classList.remove('d-none');
  senhaContainer.classList.remove('d-none');
  joinBtn.classList.remove('d-none');
  senhaInput.placeholder = 'Digite a senha da sala';
});

// Gera código aleatório para host
function gerarCodigoSala() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numeros = '0123456789';
  let codigo = '';
  for (let i = 0; i < 4; i++) codigo += letras.charAt(Math.random() * letras.length | 0);
  for (let i = 0; i < 4; i++) codigo += numeros.charAt(Math.random() * numeros.length | 0);
  return codigo.split('').sort(() => Math.random() - 0.5).join('');
}

// Botão: Entrar
joinBtn.addEventListener('click', () => {
  const nick = nickInput.value.trim();
  if (!nick) return showStatus("Informe um nick válido", 'danger');

  let roomCode = roomInput.value.trim();
  const senha = document.getElementById('roomPassword')?.value?.trim() || null;

  if (role === 'host') {
    roomCode = gerarCodigoSala();
  }

  if (role === 'cliente' && roomCode.length < 6) {
    return showStatus("Digite um código de sala válido", 'danger');
  }

  // Salva sessão local
  localStorage.setItem('nick', nick);
  localStorage.setItem('sala', roomCode);
  localStorage.setItem('papel', role);

  // Envia pro servidor
  socket.emit('joinRoom', { roomCode, playerName: nick, role, senha });

  console.log("role:", role);
  console.log("nick:", nick);
  console.log("roomCode:", roomCode);
  console.log("senha:", senha);
});

// Entrou com sucesso
socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
  lobbyDiv.classList.add('d-none');
  salaDiv.classList.remove('d-none');

  salaCodigoSpan.textContent = roomCode;
  salaNickSpan.textContent = playerName;
  salaRoleSpan.textContent = role.toUpperCase();
});

// Atualiza lista de jogadores conectados
socket.on('updatePlayerList', ({ jogadores }) => {
  listaJogadores.innerHTML = '';
  jogadores.forEach(({ nome, papel }) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.textContent = `${nome} ${papel === 'host' ? '(Mestre)' : ''}`;
    listaJogadores.appendChild(li);
  });
});

// Exibe erro
socket.on('errorMessage', (msg) => {
  showStatus(msg, 'danger');
});

// Mostra mensagem no topo
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `alert alert-${type}`;
  statusDiv.classList.remove('d-none');
}

// Tenta reconectar usando localStorage
window.addEventListener('load', () => {
  const nick = localStorage.getItem('nick');
  const sala = localStorage.getItem('sala');
  const papel = localStorage.getItem('papel');

  if (nick && sala && papel) {
    socket.emit('joinRoom', {
      roomCode: sala,
      playerName: nick,
      role: papel,
      senha: null // Aqui poderia pedir novamente se necessário
    });
  }
});
