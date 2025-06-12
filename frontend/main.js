const socket = io();

const nickInput = document.getElementById('nickName');
const btnHost = document.getElementById('btnHost');
const btnCliente = document.getElementById('btnCliente');
const roomInput = document.getElementById('roomCode');
const senhaInput = document.getElementById('roomPassword');
const roomContainer = document.getElementById('codigoSalaContainer');
const senhaContainer = document.getElementById('senhaSalaContainer');
const joinBtn = document.getElementById('joinBtn');
const statusDiv = document.getElementById('status');

// Lobby e Sala
const lobbyDiv = document.getElementById('lobby');
const salaDiv = document.getElementById('sala');

// Dados da sala
const salaCodigoSpan = document.getElementById('salaCodigo');
const salaNickSpan = document.getElementById('salaNick');
const salaRoleSpan = document.getElementById('salaRole');
const listaJogadores = document.getElementById('listaJogadores');

// 'host' ou 'cliente'
let role = null; 

// Ativa os botões quando o nick é preenchido
nickInput.addEventListener('input', () => {
  const valido = nickInput.value.trim().length > 0;
  btnHost.classList.toggle('disabled', !valido);
  btnCliente.classList.toggle('disabled', !valido);
});

// Seleção de papel
btnHost.addEventListener('click', () => {
  role = 'host';

  btnHost.classList.replace('btn-outline-primary', 'btn-primary');
  btnCliente.classList.replace('btn-secondary', 'btn-outline-secondary');

  roomContainer.classList.add('d-none');
  senhaContainer.classList.remove('d-none');
  joinBtn.classList.remove('d-none');

  senhaInput.placeholder = 'Defina uma senha para a sala (opcional)';
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


// Geração de código automático
function gerarCodigoSala() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numeros = '0123456789';
  let codigo = '';
  for (let i = 0; i < 4; i++) codigo += letras.charAt(Math.random() * letras.length | 0);
  for (let i = 0; i < 4; i++) codigo += numeros.charAt(Math.random() * numeros.length | 0);
  return codigo.split('').sort(() => Math.random() - 0.5).join('');
}

// Clique no botão "Entrar"
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

  socket.emit('joinRoom', { roomCode, playerName: nick, role, senha });

  console.log("role:", role);
  console.log("nick:", nick);
  console.log("roomCode:", roomCode);
  console.log("senha:", senha);
});


// Envia pro servidor
socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
	// Transição de telas
  lobbyDiv.classList.add('d-none');
  salaDiv.classList.remove('d-none');

// Preenche informações da sala
  salaCodigoSpan.textContent = roomCode;
  salaNickSpan.textContent = playerName;
  salaRoleSpan.textContent = role.toUpperCase();
// Adiciona jogador à lista
  adicionarJogadorNaLista(playerName, role); /* Quando o servidor confirma entrada*/
});

// Erro do servidor
socket.on('errorMessage', (msg) => {
  showStatus(msg, 'danger');
});

// Mostra mensagens no topo
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `alert alert-${type}`;
  statusDiv.classList.remove('d-none');
}
// Adiciona nome do jogador à lista lateral
function adicionarJogadorNaLista(nick, tipo) {
  const li = document.createElement('li');
  li.classList.add('list-group-item');
  li.textContent = `${nick} ${tipo === 'host' ? '(Mestre)' : ''}`;
  listaJogadores.appendChild(li);
}
