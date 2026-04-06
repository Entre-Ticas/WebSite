// Lógica principal y navegación del sitio
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar links de redes sociales con variables de setup.js
    if (document.getElementById('btnWhatsappFlotante')) {
        document.getElementById('btnWhatsappFlotante').href = `https://wa.me/${WHATSAPP_NUMBER}`;
    }
    if (document.getElementById('btnTiktokFlotante')) {
        document.getElementById('btnTiktokFlotante').href = `https://www.tiktok.com/@${TikTok_user}`;
    }
    if (document.getElementById('btnInstagramFlotante')) {
        document.getElementById('btnInstagramFlotante').href = `https://www.instagram.com/${Instagram_user}`;
    }
    if (document.getElementById('btnFacebookFlotante')) {
        document.getElementById('btnFacebookFlotante').href = `https://www.facebook.com/${Facebook_user}`;
    }

    // Función para procesar el hash actual
    const handleRouting = () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            // Si el hash tiene un guion (ej: calc-2), solo usamos la primera parte (calc)
            const pageName = hash.split('-')[0];
            loadPage(pageName);
        }
    };

    // Ejecutar al cargar la página
    handleRouting();

    // Escuchar cambios en el hash sin recargar la página (ideal para PWA)
    window.addEventListener('hashchange', handleRouting);

    // Cerrar el menú social si se hace clic fuera de él (en cualquier otro sector)
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('socialMenu');
        const links = document.getElementById('socialLinks');
        if (menu && links && links.classList.contains('active') && !menu.contains(e.target)) {
            toggleSocialMenu();
        }
    });
});

function toggleSocialMenu() {
    const links = document.getElementById('socialLinks');
    const collage = document.getElementById('btnToggleCollage');
    const closeIcon = document.getElementById('btnToggleClose');
    
    links.classList.toggle('active');
    
    if (links.classList.contains('active')) {
        collage.style.display = 'none';
        closeIcon.style.display = 'block';
    } else {
        collage.style.display = 'grid';
        closeIcon.style.display = 'none';
    }
}

async function loadPage(page) {
    const container = document.getElementById('content-area');
    if (!container) return;
    
    // Colapsar el menú social si está abierto al cambiar de página
    const socialLinks = document.getElementById('socialLinks');
    if (socialLinks && socialLinks.classList.contains('active')) {
        toggleSocialMenu();
    }

    // Efecto de salida (hace la pantalla transparente temporalmente)
    container.classList.add('fade-out');
    
    setTimeout(async () => {
        try {
            if (page === 'home') {
                window.location.hash = '';
                location.reload(); 
                return;
            }
            
            // Importante: Verifica que las carpetas en Netlify tengan estas mayúsculas exactas
            const routes = {
                'calc': 'Calc/calc.html',
                'catalog': 'Catalog/catalog.html',
                'tracking': 'Tracking/tracking.html'
            };

            const url = routes[page];
            if (!url) throw new Error("Página no definida");

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error ${response.status}: No se encontró ${url}`);
            
            const html = await response.text();
            container.innerHTML = html;

            if (page === 'calc') {
                // La función init() ya se llama dentro del calc.html revertido
                if (typeof init === 'function') init();
            } else if (page === 'catalog' && typeof loadCatalog === 'function') {
                loadCatalog(); // Definida en catalog.js
            }

        } catch (error) {
            console.error("Error detallado:", error);
            container.innerHTML = `<h2>Error al cargar la sección.</h2>
                                   <p style="color:red;">Detalle: ${error.message}</p>`;
        }
        finally {
            // Quitar la transparencia siempre, incluso si hubo error
            container.classList.remove('fade-out');
            window.scrollTo(0, 0);
        }
    }, 300);
}