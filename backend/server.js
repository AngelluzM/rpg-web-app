const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Servir o frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*'
  }
});

// Quando o socket conectar
io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  // Evento: joinRoom
  socket.on('joinRoom', ({ roomCode, playerName }) => {
    if (!roomCode || !playerName) {
      socket.emit('errorMessage', 'Código da sala e nome são obrigatórios!');
      return;
    }

    // Entra na sala
    socket.join(roomCode);
    console.log(`${playerName} entrou na sala ${roomCode}`);

    // Confirma pro jogador
    socket.emit('joinedRoom', { roomCode, playerName });

    // (Opcional) Broadcast pra sala (exemplo de notificação pra outros)
    // socket.to(roomCode).emit('playerJoined', { playerName });
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log('Jogador desconectado:', socket.id);
  });
});

// Iniciar o servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
