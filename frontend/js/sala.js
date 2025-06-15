import { socket } from './socket.js';
import { limparDadosJogador } from './storage.js';
import { showStatus } from './utils.js';

export function iniciarSala() {
  const salaDiv = document.getElementById('sala');
  const lobbyDiv = document.getElementById('lobby');
  const salaCodigoSpan = document.getElementById('salaCodigo');
  const salaNickSpan = document.getElementById('salaNick');
  const salaRoleSpan = document.getElementById('salaRole');
  const listaJogadores = document.getElementById('listaJogadores');
  const btnSair = document.getElementById('btnSair');
  const btnExportar = document.getElementById('btnExportar');
  const labelImportar = document.getElementById('labelImportar');
  const inputImportar = document.getElementById('inputImportar');
  const btnCopyCodigo = document.getElementById('btnCopyCodigo');
  const statusDiv = document.getElementById('status');

  // Quando entra na sala
  socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
    lobbyDiv.classList.add('hidden');
    salaDiv.classList.remove('hidden');
	
	console.log('✅ Sidebar (sala) VISÍVEL!');

    salaCodigoSpan.textContent = roomCode;
    salaNickSpan.textContent = playerName;
    salaRoleSpan.textContent = role.toUpperCase();

    showStatus(statusDiv, "Conectado à sala!", 'success');

    if (role === 'host') {
      btnExportar.classList.remove('hidden');
      labelImportar.classList.remove('hidden');
    } else {
      btnExportar.classList.add('hidden');
      labelImportar.classList.add('hidden');
    }
  });

  // Atualiza a lista de jogadores sempre com o HOST no topo
  socket.on('updatePlayerList', ({ jogadores }) => {
    listaJogadores.innerHTML = '';

    const host = jogadores.find(j => j.papel === 'host');
    const clientes = jogadores.filter(j => j.papel !== 'host');

    if (host) {
      const liHost = document.createElement('li');
      liHost.textContent = `${host.nome} (Mestre)`;
      listaJogadores.appendChild(liHost);
    }

    clientes.forEach(({ nome }) => {
      const li = document.createElement('li');
      li.textContent = nome;
      listaJogadores.appendChild(li);
    });
  });

  // Evento de copiar código da sala
  btnCopyCodigo.addEventListener('click', () => {
    const codigo = salaCodigoSpan.textContent.trim();
    if (codigo) {
      navigator.clipboard.writeText(codigo).then(() => {
        btnCopyCodigo.textContent = '✅';
        setTimeout(() => {
          btnCopyCodigo.textContent = '📋';
        }, 1000);
      });
    }
  });

  // Botão para desconectar
  btnSair.addEventListener('click', () => {
    limparDadosJogador();
    window.location.reload();
  });

  // Exportar sala JSON (exemplo mock)
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
      jogadores: [], // Popular futuramente
      mapa: {}, // Popular futuramente
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sala-${dados.sala}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  // Importar sala JSON (exemplo básico)
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
}
