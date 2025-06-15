import { socket } from './socket.js';
import { limparDadosJogador } from './storage.js';
import { showStatus } from './utils.js';

export function iniciarSala() {
  // Elementos principais da sala
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
  // Abas
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-tab');

    // Remove "active" de todos
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    // Ativa clicado
    btn.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

  // Ao entrar na sala
  socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
    lobbyDiv.classList.add('hidden');
    salaDiv.classList.remove('hidden');

    salaCodigoSpan.textContent = roomCode;
    salaNickSpan.textContent = playerName;
    salaRoleSpan.textContent = role.toUpperCase();

    showStatus(statusDiv, "Conectado à sala!", 'success');

    // Mostrar ou ocultar botão de exportar com base no papel
    if (role === 'host') {
      btnExportar.classList.remove('hidden');
	  inputImportar.classList.remove('hidden');
	  labelImportar.classList.remove('hidden');
    } else {
      btnExportar.classList.add('hidden');
	  inputImportar.classList.add('hidden');
	  labelImportar.classList.add('hidden');
    }
  });

  // Atualizar lista de jogadores
  socket.on('updatePlayerList', ({ jogadores }) => {
    listaJogadores.innerHTML = '';
    jogadores.forEach(({ nome, papel }) => {
      const li = document.createElement('li');
      li.textContent = `${nome} ${papel === 'host' ? '(Mestre)' : ''}`;
      listaJogadores.appendChild(li);
    });
  });

  // Desconectar e limpar tudo
  btnSair.addEventListener('click', () => {
    limparDadosJogador();
    window.location.reload();
  });

  // Exportar sala (apenas host)
  btnExportar.addEventListener('click', () => {
    const papel = localStorage.getItem('papel');
    if (papel !== 'host') {
      showStatus(statusDiv, "Apenas o Mestre pode exportar a sala!", 'danger');
      return;
    }

    const dados = {
      sala: localStorage.getItem('sala'),
      host: {
        userId: localStorage.getItem('userId'),
        nome: localStorage.getItem('nick')
      },
      jogadores: [], // Popular depois com dados reais se quiser
      mapa: {},      // Idem
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sala-${dados.sala}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  // Importar sala JSON (qualquer um pode abrir, só exemplo)
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

  // Recebe erros do servidor na sala também
  socket.on('errorMessage', (msg) => {
    showStatus(statusDiv, msg, 'danger');
  });
}
