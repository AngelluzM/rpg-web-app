// Gerar código de sala (8 caracteres: mix letras e números)
export function gerarCodigoSala() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numeros = '0123456789';
  return [...Array(8)]
    .map(() =>
      Math.random() > 0.5
        ? letras.charAt(Math.floor(Math.random() * letras.length))
        : numeros.charAt(Math.floor(Math.random() * numeros.length))
    )
    .join('');
}

// Mostrar mensagem de status na tela
export function showStatus(elemento, mensagem, tipo = 'info') {
  elemento.textContent = mensagem;
  elemento.className = `status-msg ${tipo}`;
  elemento.classList.remove('hidden');

  setTimeout(() => {
    elemento.classList.add('hidden');
  }, 4000);
}
