import { socket } from './socket.js';
import { limparDadosJogador } from './storage.js';
import { showStatus } from './utils.js';

export function iniciarSala() {
  // Elementos da interface da sala
  const salaDiv = document.getElementById('sala');
  const lobbyDiv = document.getElementById('lobby');
  const salaCodigoSpan = document.getElementById('salaCodigo');
  const salaNickSpan = document.getElementById('salaNick');
  const salaRoleSpan = document.getElementById('salaRole');
  const listaJogadores = document.getElementById('listaJogadores');
  const btnSair = document.getElementById('btnSair');
  const btnExportar = document.getElementById('btnExportar');
  const inputImportar = document.getElementById('inputImportar');
  const statusDiv = document.getElementById('status');

  // Quando servidor confirma entrada na sala
  socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
    lobbyDiv.classList.add('hidden');
    salaDiv.classList.remove('hidden');

    salaCodigoSpan.textContent = roomCode;
    salaNickSpan.textContent = playerName;
    salaRoleSpan.textContent = role.toUpperCase();

    showStatus(statusDiv, "Conectado à sala!", 'success');
  });

  // Atualiza lista de jogadores
  socket.on('updatePlayerList', ({ jogadores }) => {
    listaJogadores.innerHTML = '';
    jogadores.forEach(({ nome, papel }) => {
      const li = document.createElement('li');
      li.textContent = `${nome} ${papel === 'host' ? '(Mestre)' : '(Cliente)'}`;
      listaJogadores.appendChild(li);
    });
  });

  // Desconectar e limpar tudo
  btnSair.addEventListener('click', () => {
    limparDadosJogador();
    window.location.reload();
  });

  // Exportar Sala como JSON (mock)
  btnExportar.addEventListener('click', () => {
    const dados = {
      sala: localStorage.getItem('sala'),
      host: {
        userId: localStorage.getItem('userId'),
        nome: localStorage.getItem('nick')
      },
      jogadores: [], // você pode preencher com jogadores reais depois
      mapa: {}, // idem
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sala-${dados.sala}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  // Importar Sala JSON (mock)
  inputImportar.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const dados = JSON.parse(e.target.result);
        showStatus(statusDiv, "Sala importada com sucesso!", 'success');
        console.log("Dados importados:", dados);
      } catch {
        showStatus(statusDiv, "Erro ao importar sala.", 'danger');
      }
    };
    reader.readAsText(file);
  });

  // Receber erro do servidor na sala também (opcional)
  socket.on('errorMessage', (msg) => {
    showStatus(statusDiv, msg, 'danger');
  });
}
