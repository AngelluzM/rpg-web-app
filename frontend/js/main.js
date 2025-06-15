import { iniciarLobby } from './lobby.js';
import { iniciarSala } from './sala.js';
import { socket } from './socket.js';

// 🚀 Garante que tudo só roda DEPOIS que o DOM estiver 100% pronto
window.addEventListener('DOMContentLoaded', () => {
  //iniciarSocket();
  iniciarLobby();
  iniciarSala();
});

// AUTO-REENTRADA: se tiver dados salvos, reconecta
const nick = localStorage.getItem('nick');
const sala = localStorage.getItem('sala');
const papel = localStorage.getItem('papel');
const userId = localStorage.getItem('userId') || ('user_' + Math.random().toString(36).substr(2, 9));
localStorage.setItem('userId', userId);

if (nick && sala && papel) {
  socket.emit('joinRoom', {
    roomCode: sala,
    playerName: nick,
    role: papel,
    senha: null,
    userId,
    limite: 5  // default, o server ignora se não for host
  });
}