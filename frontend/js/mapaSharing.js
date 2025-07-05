// MapaSharing.js - inicial
export function iniciarMapaSharing() {
  // Seleciona elementos ou cria dinamicamente
  const mapaContainer = document.getElementById('mapaContainer');
  const mapaCanvas = document.getElementById('mapaCanvas');
  const menuZoom = document.getElementById('menuZoom');
  // ...lógica de zoom, upload, eventos etc
  // Exemplo:
  // document.getElementById('zoomMais').onclick = () => { ... }
}
import { socket } from './socket.js';

const inputMapa = document.getElementById('inputMapa');
const btnUploadMapa = document.getElementById('btnUploadMapa');
const mapaDiv = document.getElementById('mapa');

if (btnUploadMapa) {
  btnUploadMapa.addEventListener('click', () => inputMapa.click());
}

if (inputMapa) {
  inputMapa.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const imgBase64 = evt.target.result;
      // Envia para o backend
      socket.emit('uploadMapa', {
        sala: localStorage.getItem('sala'),
        imgBase64
      });
    };
    reader.readAsDataURL(file);
  });
}

// Exibe a imagem do mapa em todos
socket.on('updateMapa', ({ imgBase64 }) => {
  if (!imgBase64) {
    mapaDiv.innerHTML = '';
    return;
  }
  mapaDiv.innerHTML = `<img src="${imgBase64}" style="width:100%;height:auto;display:block;border-radius:10px;">`;
});
