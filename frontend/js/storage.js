// Salvar dados do jogador no localStorage
export function salvarDadosJogador({ nick, sala, papel }) {
  localStorage.setItem('nick', nick);
  localStorage.setItem('sala', sala);
  localStorage.setItem('papel', papel);
}

// Limpar dados do jogador do localStorage
export function limparDadosJogador() {
  localStorage.clear();
}
