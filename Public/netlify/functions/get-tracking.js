const XLSX = require('xlsx');
const { JWT } = require('google-auth-library');

exports.handler = async (event) => {
    const num = event.queryStringParameters.num;
    if (!num) {
        return { statusCode: 400, body: JSON.stringify({ error: "El número de guía es requerido" }) };
    }

    const SHEET_ID = process.env.TRACKING_SPREADSHEET_ID; 
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
            throw new Error(`Error de Google Sheets: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const sheetName = "Tracking";
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
            throw new Error(`No se encontró la pestaña llamada "${sheetName}"`);
        }

        // Usamos raw: false para obtener el valor formateado (como string) y evitar problemas con números largos
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        
        if (!rows || rows.length === 0) throw new Error("La hoja de cálculo está vacía");

        const headers = rows[0].map(h => h ? h.toString().trim() : "");
        // Buscamos la columna "Numero de Guia" ignorando tildes y mayúsculas
        const searchIndex = headers.findIndex(h => 
            h.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "NUMERO DE GUIA"
        );
        
        if (searchIndex === -1) throw new Error("No se encontró la columna 'Numero de Guia'");

        const fila = rows.find((row, idx) => 
            idx > 0 && row[searchIndex] && row[searchIndex].toString().trim() === num.trim()
        );

        if (!fila) {
            return { statusCode: 404, body: JSON.stringify({ error: "No encontrado" }) };
        }

        // Solo devolvemos los datos necesarios, filtrando nombres reales si es necesario
        const resultado = headers.map((h, i) => ({ label: h, value: fila[i] }))
                                 .filter(item => item.value && !["MARCA TEMPORAL", "NOMBRE DEL CLIENTE"].includes(item.label.toUpperCase()));

        return {
            statusCode: 200,
            body: JSON.stringify(resultado)
        };
    } catch (error) {
        console.error("Error en get-tracking:", error.message);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};