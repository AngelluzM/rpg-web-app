const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const salas = {}; // estrutura de controle: { código: { senha, host, jogadores: [] } }


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

socket.on('joinRoom', ({ roomCode, playerName, role, senha }) => {
  if (!roomCode || !playerName || !role) {
    socket.emit('errorMessage', 'Todos os campos são obrigatórios!');
    return;
  }

  // Se é host, cria a sala
  if (role === 'host') {
    if (salas[roomCode]) {
      socket.emit('errorMessage', 'Já existe uma sala com esse código.');
      return;
    }

    salas[roomCode] = {
      host: socket.id,
      senha: senha || null,
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

    if (sala.senha && sala.senha !== senha) {
      socket.emit('errorMessage', 'Senha incorreta!');
      return;
    }

    sala.jogadores.push({ id: socket.id, nome: playerName, papel: 'cliente' });

    socket.join(roomCode);
    socket.emit('joinedRoom', { roomCode, playerName, role });

    // (Opcional) notificar os outros
    socket.to(roomCode).emit('playerJoined', { playerName });
  }
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
