// Conectar ao servidor Socket.io
const socket = io();

// Seleciona os elementos da interface
const roomInput = document.getElementById('roomCode');
const playerNameInput = document.getElementById('playerName');
const joinBtn = document.getElementById('joinBtn');
const statusDiv = document.getElementById('status');
const mapArea = document.getElementById('mapArea');

// Evento de clique no botão "Conectar"
joinBtn.addEventListener('click', () => {
  const roomCode = roomInput.value.trim();
  const playerName = playerNameInput.value.trim();

  if (!roomCode || !playerName) {
    showStatus('Preencha todos os campos!', 'danger');
    return;
  }

  // Envia evento para o servidor para ingressar na sala
  socket.emit('joinRoom', { roomCode, playerName });
});

// Evento de confirmação de entrada na sala
socket.on('joinedRoom', (data) => {
  showStatus(`Conectado à sala ${data.roomCode} como ${data.playerName}`, 'success');
  // Oculta inputs e botão
  roomInput.disabled = true;
  playerNameInput.disabled = true;
  joinBtn.disabled = true;
  // Mostra área de mapa
  mapArea.classList.remove('d-none');
});

// Evento de erro
socket.on('errorMessage', (msg) => {
  showStatus(msg, 'danger');
});

// Função utilitária pra exibir status
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `alert alert-${type}`;
  statusDiv.classList.remove('d-none');
}
