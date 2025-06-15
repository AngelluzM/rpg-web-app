import { socket } from './socket.js';
import { gerarCodigoSala, showStatus } from './utils.js';
import { salvarDadosJogador, limparDadosJogador } from './storage.js';

export function iniciarLobby() {
  // DOM Elements
  const nickInput = document.getElementById('nickName');
  const nickAlerta = document.getElementById('nickAlerta');
  const btnHost = document.getElementById('btnHost');
  const btnCliente = document.getElementById('btnCliente');
  const roomInput = document.getElementById('roomCode');
  const senhaInput = document.getElementById('roomPassword');
  const limiteInput = document.getElementById('limiteJogadores');
  const joinBtn = document.getElementById('joinBtn');
  const btnVoltar = document.getElementById('btnVoltar');
  const statusDiv = document.getElementById('status');
  const sidebar = document.getElementById('sidebar');

  let role = null;

  // Checar Nick
  function verificaNick() {
    const nick = nickInput.value.trim();
    if (!nick) {
      nickAlerta.classList.remove('hidden');
      nickInput.classList.add('alerta');
      return false;
    }
    return true;
  }

  // Ocultar alerta ao focar
  nickInput.addEventListener('focus', () => {
    nickAlerta.classList.add('hidden');
    nickInput.classList.remove('alerta');
  });

  // Botão Criar Sala
  btnHost.addEventListener('click', () => {
    if (!verificaNick()) return;

    role = 'host';
	
	console.log("Botão Criar Sala clicado!");
	console.log("limiteInput:", limiteInput);
	
    senhaInput.classList.remove('hidden');
    limiteInput.classList.remove('hidden');
    joinBtn.textContent = 'Confirmar';
    joinBtn.classList.remove('hidden');
    btnVoltar.classList.remove('hidden');
	

    roomInput.classList.add('hidden');
    btnHost.classList.add('hidden');
    btnCliente.classList.add('hidden');
  });

  // Botão Acessar Sala
  btnCliente.addEventListener('click', () => {
    if (!verificaNick()) return;

    role = 'cliente';

    senhaInput.classList.remove('hidden');
    roomInput.classList.remove('hidden');
    joinBtn.textContent = 'Confirmar';
    joinBtn.classList.remove('hidden');
    btnVoltar.classList.remove('hidden');	

    limiteInput.classList.add('hidden'); // cliente não define limite

    btnHost.classList.add('hidden');
    btnCliente.classList.add('hidden');
  });

  // Botão Voltar
  btnVoltar.addEventListener('click', () => {
    role = null;
    senhaInput.classList.add('hidden');
    limiteInput.classList.add('hidden');
    roomInput.classList.add('hidden');
    joinBtn.classList.add('hidden');
    btnVoltar.classList.add('hidden');
	
    btnHost.classList.remove('hidden');
    btnCliente.classList.remove('hidden');

    nickInput.value = '';
    roomInput.value = '';
    senhaInput.value = '';
    limiteInput.value = 5;
  });

  // Botão Confirmar
joinBtn.addEventListener('click', () => {
  const nick = nickInput.value.trim();
  const senha = senhaInput.value.trim() || null;
  let roomCode = roomInput.value.trim();
  const limite = parseInt(limiteInput.value, 10) || 5;
  const userId = localStorage.getItem('userId') || ('user_' + Math.random().toString(36).substr(2, 9));
  localStorage.setItem('userId', userId);

  if (!nick) {
    showStatus(statusDiv, "Informe um nick válido.", 'danger');
    return;
  }

  if (role === 'host') {
    roomCode = gerarCodigoSala();
  }

  if (role === 'cliente' && roomCode.length < 6) {
    showStatus(statusDiv, "Código da sala inválido.", 'danger');
    return;
  }

  salvarDadosJogador({ nick, sala: roomCode, papel: role });

  socket.emit('joinRoom', {
    roomCode,
    playerName: nick,
    role,
    senha,
    userId,
    limite
  });
});

}
