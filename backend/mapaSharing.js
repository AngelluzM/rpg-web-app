module.exports = function(io, salas) {
  // Eventos de upload, update, broadcast do mapa
  io.on('connection', socket => {
    socket.on('uploadMapa', ({ sala, imgBase64 }) => {
      if (!salas[sala]) return;
      salas[sala].mapaImg = imgBase64;
      io.to(sala).emit('updateMapa', { imgBase64 });
    });
    // ...outros eventos: tokens, camadas, permissões
  });
}
