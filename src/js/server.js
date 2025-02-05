require("dotenv").config();
const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// Importa o TemplateHandler do easy-template-x
const { TemplateHandler } = require("easy-template-x");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

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
    console.log("Dados do Google Sheets recebidos:", dados);

    // Se houver um número de referência na query, filtra os dados
    const numeroReferencia = req.query.numeroReferencia;
    if (numeroReferencia) {
      const dadosFiltrados = dados.filter(row => row[0].includes(numeroReferencia));
      return res.json({ success: true, data: dadosFiltrados });
    }

    res.json({ success: true, data: dados });
  } catch (error) {
    console.error("Erro na rota /api/sheets:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para gerar o documento .docx usando easy-template-x com TemplateHandler
app.post("/api/generate-docx", async (req, res) => {
  const { numeroReferencia } = req.body;
  console.log("Recebido numeroReferencia:", numeroReferencia);

  try {
    // Carregar o template DOCX
    const templatePath = path.join(__dirname, "model.docx");
    console.log("Caminho do template:", templatePath);

    if (!fs.existsSync(templatePath)) {
      throw new Error("O arquivo model.docx não foi encontrado no caminho: " + templatePath);
    }

    // Lê o template como Buffer (sem especificar encoding)
    const templateContent = fs.readFileSync(templatePath);
    console.log("Template lido com sucesso. Tamanho do buffer:", templateContent.length);

    // Preparar os dados para substituição
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const horaAtual = new Date().toLocaleTimeString("pt-BR");
    console.log("Data atual:", dataAtual, "Hora atual:", horaAtual);

    const data = {
        
             numeroReferencia: numeroReferencia, data: dataAtual, hora: horaAtual 
        
    };
    console.log("Dados para injeção no template:", data);

    // Instanciar o TemplateHandler e processar o template
    const handler = new TemplateHandler();
    const report = await handler.process(templateContent, data);
    console.log("Relatório gerado com sucesso. Tamanho do buffer do relatório:", report.length);

    const fileName = `Sinistro_${numeroReferencia}.docx`;
    console.log("Nome do arquivo gerado:", fileName);

    // Configurar os headers e enviar o documento gerado para download
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(report);
  } catch (error) {
    console.error("Erro ao gerar o arquivo DOCX:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar o servidor
app.listen(PORT, () => console.log(`🔥 Servidor rodando em http://localhost:${PORT}`));
