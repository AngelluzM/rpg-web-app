const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

// Defina o objeto salas ANTES de passar pro módulo do mapa!
const salas = {};

// Aqui, já passa io e salas pro seu módulo de mapa:
require('./mapaSharing.js')(io, salas);


// Isso serve manifest.json na raiz do site!
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../manifest.json'));
});

app.get('/icon-192.png', (req, res) => {
  res.sendFile(path.join(__dirname, '../icon-192.png'));
});

app.get('/icon-512.png', (req, res) => {
  res.sendFile(path.join(__dirname, '../icon-512.png'));
});

// Serve index.html para qualquer rota que não seja arquivo estático ou API
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  socket.on('joinRoom', ({ roomCode, playerName, role, senha, userId, limite }) => {
    if (!roomCode || !playerName || !role || !userId) {
      socket.emit('errorMessage', 'Dados incompletos para conexão.');
      return;
    }

    senha = (senha || '').trim();

    // Criar nova sala (host)
    if (!salas[roomCode]) {
      if (role !== 'host') {
        socket.emit('errorMessage', 'Sala não encontrada!');
        return;
      }

      salas[roomCode] = {
        senha: senha || null,
        host: socket.id,
        limiteJogadores: limite || 5,
        jogadores: [{
          id: socket.id,
          userId,
          nome: playerName,
          papel: role
        }],
		compendium: []
      };
    } else {
      const sala = salas[roomCode];

      // Checar senha se tiver
      if (sala.senha && sala.senha !== senha) {
        socket.emit('errorMessage', 'Senha incorreta!');
        return;
      }

      // ⚡ Conta apenas CLIENTES (não conta host)
      const numeroClientes = sala.jogadores.filter(j => j.papel === 'cliente').length;
      if (role === 'cliente' && numeroClientes >= sala.limiteJogadores) {
        socket.emit('errorMessage', 'Sala cheia! Não é possível entrar.');
        return;
      }

      // Evita duplicar mesmo cliente reconectando
      const jogadorExistente = sala.jogadores.find(j => j.userId === userId);
      if (jogadorExistente) {
        jogadorExistente.id = socket.id;
      } else {
        sala.jogadores.push({
          id: socket.id,
          userId,
          nome: playerName,
          papel: role
        });
		
      }
    }

    socket.join(roomCode);
    socket.emit('joinedRoom', { roomCode, playerName, role });

	if (salas[roomCode] && salas[roomCode].compendium) {
	  socket.emit('updateCompendium', { listaPdf: salas[roomCode].compendium });
	}

    io.to(roomCode).emit('updatePlayerList', {
      jogadores: salas[roomCode].jogadores
    });
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectou:', socket.id);
    for (const [codigo, sala] of Object.entries(salas)) {
      const index = sala.jogadores.findIndex(j => j.id === socket.id);
      if (index !== -1) {
        sala.jogadores.splice(index, 1);
        io.to(codigo).emit('updatePlayerList', {
          jogadores: sala.jogadores
        });
        break;
      }
    }
  });

	socket.on('addCompendium', ({ sala, titulo, url }) => {
		if (!salas[sala]) return;
		if (socket.id !== salas[sala].host) return;
		salas[sala].compendium.push({ titulo, url });
		io.to(sala).emit('updateCompendium', { listaPdf: salas[sala].compendium });
	  });

	  socket.on('editCompendium', ({ sala, index, titulo, url }) => {
		if (!salas[sala]) return;
		if (socket.id !== salas[sala].host) return;
		salas[sala].compendium[index] = { titulo, url };
		io.to(sala).emit('updateCompendium', { listaPdf: salas[sala].compendium });
	  });

	  socket.on('deleteCompendium', ({ sala, index }) => {
		if (!salas[sala]) return;
		if (socket.id !== salas[sala].host) return;
		salas[sala].compendium.splice(index, 1);
		io.to(sala).emit('updateCompendium', { listaPdf: salas[sala].compendium });
	  });


		socket.on('chatMessage', ({ sala, user, msg }) => {
		  if (!salas[sala]) return;
		  io.to(sala).emit('chatMessage', { user, msg });
		});


});



const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
