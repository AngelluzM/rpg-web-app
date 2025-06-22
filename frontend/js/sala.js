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
  // const btnSair = document.getElementById('btnSair');
  const btnExportar = document.getElementById('btnExportar');
  const btnImportar = document.getElementById('btnImportar');
  const inputImportar = document.getElementById('inputImportar');
  const btnCopyCodigo = document.getElementById('btnCopyCodigo');
  const statusDiv = document.getElementById('status');
  const sidebar = document.getElementById('sidebar'); //SIDEBAR
  const btnAddPdf = document.getElementById('btnAddPdf');
  const modalAddPdf = document.getElementById('modalAddPdf');
  const pdfTitulo = document.getElementById('pdfTitulo');
  const pdfUrl = document.getElementById('pdfUrl');
  const btnEnviarPdf = document.getElementById('btnEnviarPdf');
  const btnCancelarPdf = document.getElementById('btnCancelarPdf');
  const listaCompendium = document.getElementById('listaCompendium');
  // Seleciona todos os botões de aba e as seções de conteúdo das abas
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  // variavel menu superior
  const relogioSala = document.getElementById('relogioSala');
  // variavel para o CHAT
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');

  // Quando entra na sala
  socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
    lobbyDiv.classList.add('hidden');
    salaDiv.classList.remove('hidden');
	sidebar.classList.remove('hidden');
	document.getElementById('menuBarraSala').classList.remove('hidden');

	// INICIA O RELÓGIO AO ENTRAR NA SALA
    function atualizarRelogio() {
      const agora = new Date();
      const h = agora.getHours().toString().padStart(2, '0');
      const m = agora.getMinutes().toString().padStart(2, '0');
      const s = agora.getSeconds().toString().padStart(2, '0');
      relogioSala.textContent = `${h}:${m}:${s}`;
    }
    setInterval(atualizarRelogio, 1000);
    atualizarRelogio();
  
  
	console.log('✅ Sidebar (sala) VISÍVEL!');

    salaCodigoSpan.textContent = roomCode;
    //salaNickSpan.textContent = playerName;
    //salaRoleSpan.textContent = role.toUpperCase();

    showStatus(statusDiv, "Conectado à sala!", 'success');

    if (role === 'host') {
      btnExportar.classList.remove('hidden');
      btnImportar.classList.remove('hidden');
	  btnAddPdf.classList.remove('hidden');
    } else {
      btnExportar.classList.add('hidden');
      btnImportar.classList.add('hidden');
	  btnAddPdf.classList.add('hidden');
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

	// Listener para atualização do Compendium
	socket.on('updateCompendium', ({ listaPdf }) => {
	  const listaCompendium = document.getElementById('listaCompendium');
	  listaCompendium.innerHTML = '';
	  listaPdf.forEach(({ titulo, url }) => {
		const li = document.createElement('li');
		const a = document.createElement('a');
		a.href = url;
		a.textContent = titulo;
		a.target = '_blank';
		li.appendChild(a);
		listaCompendium.appendChild(li);
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
	document.getElementById('btnSairSala').addEventListener('click', () => {
	  limparDadosJogador();
	  document.getElementById('sidebar').classList.add('hidden');
	  window.location.reload();
	});

  
  // Adiciona evento de clique em cada botão de aba para alternar a exibição
  tabButtons.forEach(button => {
	    button.addEventListener('click', () => {
      // Identifica a aba de destino a partir do atributo data-tab do botão clicado
      const abaDestino = button.dataset.tab;
      // Remove a classe 'active' de todos os botões e de todas as seções de conteúdo
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(section => section.classList.remove('active'));
      // Adiciona 'active' ao botão clicado e à seção de conteúdo correspondente
      button.classList.add('active');
      document.getElementById(abaDestino).classList.add('active');
    });
  });

  // Exportar sala JSON (exemplo mock)

	btnExportar.addEventListener('click', () => {
	  const papel = localStorage.getItem('papel');
	  if (papel !== 'host') {
		showStatus(statusDiv, "Apenas o Mestre pode exportar a sala!", 'danger');
		return;
	  }

	  // Dados persistentes do jogo
	  const compendium = window.compendium || [];
	  const mapa = window.mapa || {};
	  const config = window.config || {};

	  // Dados do host APENAS para referência e nome do arquivo
	  const hostInfo = {
		userId: localStorage.getItem('userId'),
		nome: localStorage.getItem('nick')
	  };

	  const dados = {
		host: hostInfo,          // Inclui host só para referência!
		compendium: compendium,
		mapa: mapa,
		config: config
	  };

	  // Usa nome do host no arquivo exportado
	  const nomeArquivo = `sala-${hostInfo.nome || 'mestre'}.json`;

	  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
	  const link = document.createElement('a');
	  link.href = URL.createObjectURL(blob);
	  link.download = nomeArquivo;
	  document.body.appendChild(link);
	  link.click();
	  link.remove();
	});



	// Abre modal
	btnAddPdf.addEventListener('click', () => {
	  modalAddPdf.classList.remove('hidden');
	});

	// Fecha modal
	btnCancelarPdf.addEventListener('click', () => {
	  modalAddPdf.classList.add('hidden');
	  pdfTitulo.value = '';
	  pdfUrl.value = '';
	});

	// Salva link na lista Compendium
	btnEnviarPdf.addEventListener('click', () => {
	  const titulo = pdfTitulo.value.trim();
	  const url = pdfUrl.value.trim();

	  if (!titulo || !url) {
		alert('Preencha título e URL!');
		return;
	  }
	  if (
		!(
		  url.includes('drive.google.com') ||
		  url.includes('docs.google.com') ||
		  url.includes('onedrive.live.com')
		)
	  ) {
		alert('Somente Google Drive, Google Docs ou OneDrive são aceitos!');
		return;
	  }

  // (Você pode remover o código que já adiciona o <li> localmente — quem cuida disso agora é o updateCompendium)

  // Envia para o servidor
  socket.emit('addCompendium', {
    sala: localStorage.getItem('sala'),
    titulo,
    url
  });

  // Limpa e fecha modal
  pdfTitulo.value = '';
  pdfUrl.value = '';
  modalAddPdf.classList.add('hidden');
});



// 1️⃣ O botão dispara o input:
	btnImportar.addEventListener('click', () => {
	  inputImportar.value = ''; // Limpa seleção anterior
	  inputImportar.click();
	});

	inputImportar.addEventListener('change', (event) => {
	  const file = event.target.files[0];
	  if (!file) return;

	  const reader = new FileReader();
	  reader.onload = (e) => {
		try {
		  const dados = JSON.parse(e.target.result);

		  // Restaura os dados no app
		  window.compendium = dados.compendium || [];
		  window.mapa = dados.mapa || {};
		  window.config = dados.config || {};

		  // Faça update visual/emit para servidor se precisar:
		  // Exemplo: atualizar UI do compendium, recarregar mapa, etc
		  // updateCompendiumUI(window.compendium);
		  // updateMapaUI(window.mapa);

		  showStatus(statusDiv, "Dados importados com sucesso!", 'success');
		} catch (err) {
		  showStatus(statusDiv, "Erro ao importar o arquivo!", 'danger');
		}
	  };
	  reader.readAsText(file);
	});
	
		// Chat events
	  chatSend.addEventListener('click', sendMessage);
	  chatInput.addEventListener('keydown', e => {
		if (e.key === 'Enter') sendMessage();
	  });

	  function sendMessage() {
		const msg = chatInput.value.trim();
		if (msg.length > 0) {
		  socket.emit('chatMessage', { sala: localStorage.getItem('sala'), msg });
		  chatInput.value = '';
		}
	  }

	  socket.on('chatMessage', ({ user, msg }) => {
		const div = document.createElement('div');
		div.textContent = `${user}: ${msg}`;
		chatMessages.appendChild(div);
		chatMessages.scrollTop = chatMessages.scrollHeight;
	  });// fim do chat events
	
}
