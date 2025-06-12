const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Servir arquivos estáticos do frontend
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

// Estrutura de controle de salas
const salas = {};

io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  socket.on('joinRoom', ({ roomCode, playerName, role, senha }) => {
    if (!roomCode || !playerName || !role) {
      socket.emit('errorMessage', 'Todos os campos são obrigatórios!');
      return;
    }

    senha = (senha || '').trim();

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
    }

    socket.join(roomCode);

    // Confirmação para o jogador que entrou
    socket.emit('joinedRoom', { roomCode, playerName, role });

    // Atualiza lista de jogadores para todos da sala
    io.to(roomCode).emit('updatePlayerList', {
      jogadores: salas[roomCode].jogadores
    });
  });

  socket.on('disconnect', () => {
    console.log('Jogador desconectado:', socket.id);

    // Remove jogador de qualquer sala que estiver
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


  console.log('Novo jogador conectado:', socket.id);

  socket.on('joinRoom', ({ roomCode, playerName, role, senha }) => {
    if (!roomCode || !playerName || !role) {
      socket.emit('errorMessage', 'Todos os campos são obrigatórios!');
      return;
    }

    // Sanitize senha (remove espaços e garante string)
    senha = (senha || '').trim();

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

      // Logs de debug
      console.log(`Tentando entrar na sala ${roomCode}`);
      console.log(`Senha esperada: "${sala.senha}"`);
      console.log(`Senha recebida: "${senha}"`);

      if (sala.senha && sala.senha !== senha) {
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
    // Em breve: remover jogador da sala
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
