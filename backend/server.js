const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Inicializa o app e o servidor
const app = express();
app.use(cors());

// Servir arquivos estáticos da pasta "frontend"
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Rota principal: servir o index.html da raiz do projeto
app.get('/', (req, res) => {
  const indexPath = path.join(process.cwd(), 'index.html');
  console.log('Servindo index.html de:', indexPath);
  res.sendFile(indexPath);
});

// Cria servidor HTTP e WebSocket
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

// Lógica de conexão via WebSocket
io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  socket.on('joinRoom', ({ roomCode, playerName, role }) => {
    if (!roomCode || !playerName || !role) {
      socket.emit('errorMessage', 'Todos os campos são obrigatórios!');
      return;
    }

    socket.join(roomCode);
    console.log(`${playerName} (${role}) entrou na sala ${roomCode}`);

    socket.emit('joinedRoom', { roomCode, playerName, role });
  });

  socket.on('disconnect', () => {
    console.log('Jogador desconectado:', socket.id);
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
