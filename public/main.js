let interval = null;
let currentQR = null;

async function generateQR() {

  const sessionId = document.getElementById('sessionId').value;
  const statusEl = document.getElementById('status');
  const qrImage = document.getElementById('qrImage');

  if (!sessionId) {
    alert("Escribí un nombre de sesión");
    return;
  }

  statusEl.className = "status text-info";
  statusEl.innerText = "Generando QR...";

  await fetch('/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });

  qrImage.style.display = "none";
  currentQR = null;

  if (interval) clearInterval(interval);

  interval = setInterval(async () => {

    const res = await fetch(`/qr/${sessionId}`);

    if (res.ok) {
      const data = await res.json();

      if (data.qr !== currentQR) {
        currentQR = data.qr;
        qrImage.src = data.qr;
        qrImage.style.display = "block";

        statusEl.className = "status text-primary";
        statusEl.innerText = "Escaneá el QR con WhatsApp";
      }
    } else {
      // Si ya no hay QR, asumimos que se conectó
      statusEl.className = "status text-success";
      statusEl.innerText = "Sesión conectada correctamente ✅";
      clearInterval(interval);
    }

  }, 2000);
}