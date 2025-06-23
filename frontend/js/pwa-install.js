// frontend/js/pwa-install.js

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Só mostra o banner se ainda não existe outro igual
  if (document.getElementById('pwaInstallBanner')) return;

  const installBanner = document.createElement('div');
  installBanner.id = 'pwaInstallBanner';
  installBanner.innerHTML = `
    <div style="background:#5317B3;color:#fff;padding:16px 20px;position:fixed;bottom:20px;left:50%;transform:translateX(-50%);border-radius:10px;z-index:9999;box-shadow:0 2px 14px #0008;display:flex;align-items:center;gap:20px;">
      <span>Deseja instalar o app?</span>
      <button id="btnInstallApp" style="padding:7px 20px;border:none;background:#fff;color:#5317B3;font-weight:bold;border-radius:6px;cursor:pointer;">Instalar</button>
      <span id="closeInstallBanner" style="margin-left:10px;cursor:pointer;font-size:1.5em;">×</span>
    </div>
  `;
  document.body.appendChild(installBanner);

  document.getElementById('btnInstallApp').onclick = async () => {
    installBanner.remove();
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  };
  document.getElementById('closeInstallBanner').onclick = () => {
    installBanner.remove();
  };
});

// Service Worker para PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
