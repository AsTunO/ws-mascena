require("dotenv").config();
const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rota para buscar dados do Google Sheets com filtragem por número de referência
app.get("/api/sheets", async (req, res) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEET_ID}/values/${process.env.SHEET_NAME}?key=${process.env.GOOGLE_SHEETS_API_KEY}`;

    try {
        const response = await axios.get(url);
        const dados = response.data.values || [];

        // Se houver um número de referência na query, filtra os dados
        const numeroReferencia = req.query.numeroReferencia;
        if (numeroReferencia) {
            const dadosFiltrados = dados.filter(row => row[0].includes(numeroReferencia));
            return res.json({ success: true, data: dadosFiltrados });
        }

        res.json({ success: true, data: dados });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// Iniciar o servidor
app.listen(PORT, () => console.log(`🔥 Servidor rodando em http://localhost:${PORT}`));
