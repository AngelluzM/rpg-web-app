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

// 👇 Registro de salas e jogadores
const salas = {};

io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  socket.on('joinRoom', ({ roomCode, playerName, role, senha }) => {
    if (!roomCode || !playerName || !role) {
      socket.emit('errorMessage', 'Todos os campos são obrigatórios!');
      return;
    }

    if (role === 'host') {
      if (salas[roomCode]) {
        socket.emit('errorMessage', 'Já existe uma sala com esse código.');
        return;
      }

      salas[roomCode] = {
        senha: senha || null,
        host: socket.id,
        jogadores: [{ id: socket.id, nome: playerName, papel: 'host' }]
      };

      socket.join(roomCode);
      socket.emit('joinedRoom', { roomCode, playerName, role });

    } else {
      const sala = salas[roomCode];
      if (!sala) {
        socket.emit('errorMessage', 'Sala não encontrada!');
        return;
      }

      if (sala.senha && sala.senha !== (senha || '').trim()) {
        socket.emit('errorMessage', 'Senha incorreta!');
        return;
}


      sala.jogadores.push({ id: socket.id, nome: playerName, papel: 'cliente' });

      socket.join(roomCode);
      socket.emit('joinedRoom', { roomCode, playerName, role });

      socket.to(roomCode).emit('playerJoined', { playerName });
    }
  });

  socket.on('disconnect', () => {
    console.log('Jogador desconectado:', socket.id);
    // (Implementar: remover jogador da sala e notificar)
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
