const socket = io();

const nickInput = document.getElementById('nickName');
const btnHost = document.getElementById('btnHost');
const btnCliente = document.getElementById('btnCliente');
const roomInput = document.getElementById('roomCode');
const roomContainer = document.getElementById('codigoSalaContainer');
const joinBtn = document.getElementById('joinBtn');
const statusDiv = document.getElementById('status');

let role = null; // 'host' ou 'cliente'

// Ativa os botões quando o Nick é preenchido
nickInput.addEventListener('input', () => {
  const valido = nickInput.value.trim().length > 0;
  btnHost.classList.toggle('disabled', !valido);
  btnCliente.classList.toggle('disabled', !valido);
});

// Botão: Criar Jogo (HOST)
btnHost.addEventListener('click', () => {
  role = 'host';
  btnHost.classList.replace('btn-outline-primary', 'btn-primary');
  btnCliente.classList.replace('btn-secondary', 'btn-outline-secondary');
  roomContainer.classList.add('d-none');
  joinBtn.classList.remove('d-none');
});

// Botão: Entrar em Jogo (CLIENTE)
btnCliente.addEventListener('click', () => {
  role = 'cliente';
  btnCliente.classList.replace('btn-outline-secondary', 'btn-secondary');
  btnHost.classList.replace('btn-primary', 'btn-outline-primary');
  roomContainer.classList.remove('d-none');
  joinBtn.classList.remove('d-none');
});

// Geração de código automático (HOST)
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

  if (role === 'host') {
    roomCode = gerarCodigoSala();
  }

  if (role === 'cliente' && roomCode.length < 6) {
    return showStatus("Digite um código de sala válido", 'danger');
  }

  // Envia para o servidor
  socket.emit('joinRoom', { roomCode, playerName: nick, role });
});

// Sucesso: entrou na sala
socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
  showStatus(`Entrou como ${role.toUpperCase()} na sala ${roomCode}`, 'success');

  // Aqui você pode redirecionar para a próxima tela (ex: sala.html)
  // location.href = `/sala.html?nick=${playerName}&sala=${roomCode}&tipo=${role}`;
});

// Erro vindo do servidor
socket.on('errorMessage', (msg) => {
  showStatus(msg, 'danger');
});

// Função utilitária para mostrar mensagens
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `alert alert-${type}`;
  statusDiv.classList.remove('d-none');
}
