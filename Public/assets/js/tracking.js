// Lógica de Rastreo de Paquetes

async function buscarTracking() {
    const num = document.getElementById('trackingNum').value;
    const resBox = document.getElementById('resultadoRastreo');
    const infoDetalle = document.getElementById('infoDetalle');

    if(!num) return alert("Por favor ingresa un número");

    infoDetalle.innerHTML = "Buscando...";
    resBox.style.display = "block";

    try {
        const response = await fetch(`/.netlify/functions/get-tracking?num=${encodeURIComponent(num)}`);
        
        if (response.status === 404) {
            infoDetalle.innerHTML = "❌ No se encontró el Tracking ID.";
            return;
        }
        if (!response.ok) throw new Error("Error en el servidor de seguridad.");

        const datos = await response.json();

        if (datos && datos.length > 0) {
            let contenido = `<div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">`;
            let waMsg = "Consulta Tracking:\n";
            
            datos.forEach((item, i) => {
                waMsg += `• ${item.label}: ${item.value}\n`;

                if (i === datos.length - 1) {
                    contenido += `<div class="dato-destacado">${item.label}: ${item.value}</div>`;
                } else {
                    contenido += `<div><strong>${item.label}:</strong> ${item.value}</div>`;
                }
            });

            const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`;
            contenido += `
                <a href="${waLink}" target="_blank" class="btn-whatsapp-track" style="margin-top:1.2rem; background:#25d366; color:white; padding:8px 20px; border-radius:50px; text-decoration:none; display:flex; align-items:center; gap:6px;">
                    <i class="fab fa-whatsapp"></i> Consultar WhatsApp
                </a>`;

            contenido += `</div>`;
            infoDetalle.innerHTML = contenido;
        } else {
            infoDetalle.innerHTML = "❌ No se encontró el Tracking ID.";
        }

    } catch (error) {
        console.error(error);
        infoDetalle.innerHTML = `⚠️ Error: ${error.message}`;
    }
}