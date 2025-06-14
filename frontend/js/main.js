import { iniciarLobby } from './lobby.js';
import { iniciarSala } from './sala.js';
import { socket } from './socket.js';

// 🚀 Garante que tudo só roda DEPOIS que o DOM estiver 100% pronto
window.addEventListener('DOMContentLoaded', () => {
  //iniciarSocket();
  iniciarLobby();
  iniciarSala();
});
