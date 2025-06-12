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

const salas = {};

io.on('connection', (socket) => {
  console.log('Conectado:', socket.id);

  socket.on('joinRoom', ({ roomCode, playerName, role, senha, userId }) => {
    if (!roomCode || !playerName || !role || !userId) {
      socket.emit('errorMessage', 'Dados incompletos para conexão.');
      return;
    }

    senha = (senha || '').trim();

    if (!salas[roomCode]) {
      if (role !== 'host') {
        socket.emit('errorMessage', 'Sala não encontrada!');
        return;
      }

      // Criar nova sala
      salas[roomCode] = {
        senha: senha || null,
        host: socket.id,
        jogadores: [{
          id: socket.id,
          userId,
          nome: playerName,
          papel: role
        }]
      };
    } else {
      const sala = salas[roomCode];

      if (role === 'host' && sala.host !== socket.id) {
        const hostReconectando = sala.jogadores.find(j => j.userId === userId && j.papel === 'host');
        if (hostReconectando) {
          sala.host = socket.id;
          hostReconectando.id = socket.id;
        } else {
          socket.emit('errorMessage', 'Já existe uma sala com esse código.');
          return;
        }
      }

      // Verifica senha
      if (sala.senha && sala.senha !== senha) {
        socket.emit('errorMessage', 'Senha incorreta!');
        return;
      }

      // Verifica se jogador já existe (reconectando)
      const jogador = sala.jogadores.find(j => j.userId === userId);
      if (jogador) {
        jogador.id = socket.id;
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
    io.to(roomCode).emit('updatePlayerList', {
      jogadores: salas[roomCode].jogadores
    });
  });

  socket.on('disconnect', () => {
    console.log('Desconectado:', socket.id);
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
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
