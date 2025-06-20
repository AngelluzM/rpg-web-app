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

  // Quando entra na sala
  socket.on('joinedRoom', ({ roomCode, playerName, role }) => {
    lobbyDiv.classList.add('hidden');
    salaDiv.classList.remove('hidden');
	sidebar.classList.remove('hidden');

	
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
  btnSair.addEventListener('click', () => {
    limparDadosJogador();
	sidebar.classList.add('hidden');
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
    link.download = `sala-${dados.sala}-${dados.host.name}.json`;
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
  inputImportar.click();
});

// 2️⃣ O input faz a mágica quando o arquivo for escolhido:
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
