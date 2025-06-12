const socket = io();

// Geração e persistência de ID do jogador
function gerarUserId() {
  return 'user_' + Math.random().toString(36).substring(2, 10);
}

const userId = localStorage.getItem('userId') || gerarUserId();
localStorage.setItem('userId', userId);

// Referência de elementos
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

btnHost.addEventListener('click', () => {
  role = 'host';
  btnHost.classList.replace('btn-outline-primary', 'btn-primary');
  btnCliente.classList.replace('btn-secondary', 'btn-outline-secondary');
  roomContainer.classList.add('d-none');
  senhaContainer.classList.remove('d-none');
  joinBtn.classList.remove('d-none');
  senhaInput.placeholder = 'Defina uma senha (opcional)';
});

btnCliente.addEventListener('click', () => {
  role = 'cliente';
  btnCliente.classList.replace('btn-outline-secondary', 'btn-secondary');
  btnHost.classList.replace('btn-primary', 'btn-outline-primary');
  roomContainer.classList.remove('d-none');
  senhaContainer.classList.remove('d-none');
  joinBtn.classList.remove('d-none');
  senhaInput.placeholder = 'Digite a senha da sala';
});

function gerarCodigoSala() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numeros = '0123456789';
  let codigo = '';
  for (let i = 0; i < 4; i++) codigo += letras.charAt(Math.random() * letras.length | 0);
  for (let i = 0; i < 4; i++) codigo += numeros.charAt(Math.random() * numeros.length | 0);
  return codigo.split('').sort(() => Math.random() - 0.5).join('');
}

joinBtn.addEventListener('click', () => {
  const nick = nickInput.value.trim();
  if (!nick) return showStatus("Informe um nick válido", 'danger');

  let roomCode = roomInput.value.trim();
  const senha = document.getElementById('roomPassword')?.value?.trim() || null;

  if (role === 'host') roomCode = gerarCodigoSala();
  if (role === 'cliente' && roomCode.length < 6) {
    return showStatus("Digite um código válido", 'danger');
  }

  localStorage.setItem('nick', nick);
  localStorage.setItem('sala', roomCode);
  localStorage.setItem('papel', role);

  socket.emit('joinRoom', { roomCode, playerName: nick, role, senha, userId });
});

socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
  lobbyDiv.classList.add('d-none');
  salaDiv.classList.remove('d-none');
  salaCodigoSpan.textContent = roomCode;
  salaNickSpan.textContent = playerName;
  salaRoleSpan.textContent = role.toUpperCase();
});

socket.on('updatePlayerList', ({ jogadores }) => {
  listaJogadores.innerHTML = '';
  jogadores.forEach(({ nome, papel }) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.textContent = `${nome} ${papel === 'host' ? '(Mestre)' : ''}`;
    listaJogadores.appendChild(li);
  });
});

socket.on('errorMessage', (msg) => {
  showStatus(msg, 'danger');
});

function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `alert alert-${type}`;
  statusDiv.classList.remove('d-none');
}

// Reentrar automaticamente se possível
window.addEventListener('load', () => {
  const nick = localStorage.getItem('nick');
  const sala = localStorage.getItem('sala');
  const papel = localStorage.getItem('papel');

  if (nick && sala && papel) {
    socket.emit('joinRoom', {
      roomCode: sala,
      playerName: nick,
      role: papel,
      senha: null,
      userId
    });
  }
});
