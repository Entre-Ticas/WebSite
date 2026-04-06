const XLSX = require('xlsx');
const { JWT } = require('google-auth-library');

exports.handler = async () => {
    const SHEET_ID = process.env.CATALOG_SPREADSHEET_ID;
    const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    // Limpiamos la clave de posibles comillas o espacios accidentales
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');

    try {
        const auth = new JWT({
            email: CLIENT_EMAIL,
            key: PRIVATE_KEY,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets.readonly',
                'https://www.googleapis.com/auth/drive.readonly' // Requerido para exportar XLSX
            ],
        });

        const tokens = await auth.authorize();
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Error al exportar Google Sheet: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const worksheet = workbook.Sheets["Stock"];
        
        if (!worksheet) {
            throw new Error("No se encontró la pestaña llamada 'Stock' en el Excel.");
        }
        
        // Convertimos a JSON. Si tu tabla empieza con encabezados en la fila 3, range: 2 es correcto.
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 2 });

        const productos = rows.filter(r => r && r[2]).map(r => ({
            img: r[0] || '',
            category: r[1] || 'General',
            name: r[2],
            size: r[3] || 'N/A',
            price: r[4] || '',
            stock: r[5] || 'Agotado'
        }));

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productos)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};