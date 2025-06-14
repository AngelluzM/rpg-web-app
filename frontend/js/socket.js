import { showStatus } from './utils.js';

export const socket = io();

// ⚙️ Configuração global: trata erro geral de conexão (opcional)
socket.on('connect_error', () => {
  console.warn('Erro de conexão com o servidor.');
});

// ⚙️ Você pode ouvir mensagens genéricas aqui, se quiser
socket.on('errorMessage', (msg) => {
  const statusDiv = document.getElementById('status');
  if (statusDiv) {
    showStatus(statusDiv, msg, 'danger');
  } else {
    console.warn("Erro:", msg);
  }
});

// 🚀 Não esqueça: eventos específicos (joinedRoom, updatePlayerList)
// são registrados no `lobby.js` e `sala.js`, não aqui.
// O `socket.js` apenas centraliza o objeto.
