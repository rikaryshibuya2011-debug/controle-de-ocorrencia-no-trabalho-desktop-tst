import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  readLocalDatabase,
  writeLocalDatabase,
  generateMySQLDump,
  executeLocalSQLQuery,
  logDatabaseAction,
} from "./server/localDb";

dotenv.config();

// Safe __dirname for both ESM dev mode (tsx) and CJS production (esbuild --format=cjs).
// In CJS mode, esbuild sets import.meta to {} so import.meta.url is undefined.
// Fallback: process.argv[1] is the path to dist/server.cjs when spawned by Electron,
// so path.dirname(process.argv[1]) correctly resolves to the dist/ folder.
const __dirname = (() => {
  try {
    const url = import.meta?.url;
    if (url && url.startsWith('file:')) {
      return path.dirname(fileURLToPath(url));
    }
  } catch (_) { /* ignore */ }
  // CJS production fallback
  return path.dirname(process.argv[1] ?? process.execPath);
})();

// Lazy initialize Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // =========================================================================
  // LOCAL DATABASE (MySQL COMPATIBLE EMBEDDED ENGINE) ENDPOINTS
  // =========================================================================

  // 1. Get Database Status & Statistics
  app.get("/api/db/status", (_req, res) => {
    try {
      const db = readLocalDatabase();
      res.json({
        status: "connected",
        mode: "local_standalone",
        engine: db.metadata?.engine || "MySQL-Compatible Local Embedded Engine v2.0",
        databaseName: db.metadata?.databaseName || "sst_gestao_db",
        charset: db.metadata?.charset || "utf8mb4",
        lastSaved: db.metadata?.lastSaved,
        counts: {
          incidents: (db.incidents || []).length,
          hhtConfigs: (db.hhtConfigs || []).length,
          slideCustomElements: (db.slideCustomElements || []).length,
          auditLogs: (db.auditLogs || []).length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // 2. Synchronize / Load all tables from Local Database
  app.get("/api/db/sync", (_req, res) => {
    try {
      const db = readLocalDatabase();
      res.json({
        success: true,
        data: db,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 3. Save / Update all tables to Local Database on Disk
  app.post("/api/db/save-all", (req, res) => {
    try {
      const { incidents, hhtConfigs, slideCustomElements, slideTextOverrides } = req.body;
      const updated = writeLocalDatabase({
        ...(Array.isArray(incidents) && { incidents }),
        ...(Array.isArray(hhtConfigs) && { hhtConfigs }),
        ...(Array.isArray(slideCustomElements) && { slideCustomElements }),
        ...(slideTextOverrides && { slideTextOverrides }),
      });

      logDatabaseAction(
        "SYNC_SAVE",
        "ALL_TABLES",
        `Sincronização realizada. ${incidents?.length || 0} ocorrências, ${hhtConfigs?.length || 0} meses HHT gravados no disco.`
      );

      res.json({
        success: true,
        message: "Banco de dados local gravado com sucesso no disco.",
        lastSaved: updated.metadata.lastSaved,
      });
    } catch (error: any) {
      console.error("Erro ao salvar banco local:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 4. Export MySQL Dump Script (.sql)
  app.get("/api/db/export-mysql", (_req, res) => {
    try {
      const db = readLocalDatabase();
      const sqlDump = generateMySQLDump(db);

      res.setHeader("Content-Type", "application/sql; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sst_gestao_db_dump_${new Date().toISOString().split("T")[0]}.sql"`
      );
      res.send(sqlDump);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Execute Local SQL Query from console
  app.post("/api/db/execute-sql", (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Instrução SQL não fornecida." });
      }

      const db = readLocalDatabase();
      const result = executeLocalSQLQuery(query, db);

      logDatabaseAction("EXECUTE_QUERY", "CONSOLE", `Consulta SQL executada: ${query.substring(0, 80)}`);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Import SQL / JSON Backup
  app.post("/api/db/import-backup", (req, res) => {
    try {
      const { backupData } = req.body;
      if (!backupData) {
        return res.status(400).json({ error: "Dados de backup vazios." });
      }

      const updated = writeLocalDatabase({
        incidents: backupData.incidents || [],
        hhtConfigs: backupData.hhtConfigs || [],
        slideCustomElements: backupData.slideCustomElements || [],
        slideTextOverrides: backupData.slideTextOverrides || {},
      });

      logDatabaseAction(
        "RESTORE_BACKUP",
        "ALL_TABLES",
        `Restauração de backup concluída com ${(backupData.incidents || []).length} registros.`
      );

      res.json({
        success: true,
        message: "Backup restaurado com sucesso no banco de dados local!",
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Endpoint: Análise dos 5 Porquês com IA
  app.post("/api/ai/analyze-5whys", async (req, res) => {
    try {
      const { description, eventType, sector, tools, injuredBodyPart } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({
          error: "Chave GEMINI_API_KEY não configurada no servidor. Use a análise manual.",
        });
      }

      const prompt = `Você é um Especialista Sênior em Engenharia de Segurança do Trabalho e Investigação de Acidentes (Normas NBR 14280, NR-01 e Metodologia dos 5 Porquês).
Analise o seguinte relato de ocorrência de segurança:
- Tipo: ${eventType || "Não especificado"}
- Setor: ${sector || "Geral"}
- Equipamentos/Ferramentas: ${tools || "Não informado"}
- Parte do corpo/Lesão: ${injuredBodyPart || "Não informado"}
- Descrição dos Fatos: ${description || "Sem descrição"}

Gere uma análise estruturada contendo:
1. Problema Identificado (declaração clara e objetiva do desvio principal)
2. 1º Por quê (causa imediata direta)
3. 2º Por quê (fator antecedente)
4. 3º Por quê (fator de processo ou ambiental)
5. 4º Por quê (fator gerencial ou organizacional)
6. 5º Por quê / Causa Raiz definitiva (falha de barreira, sistema ou procedimento)
7. Categoria da Causa (Ex: Condição Insegura, Falha de Processo, Equipamento/Proteção, Fator Humano/Treinamento, Gestão)
8. Breve resumo explicativo da cadeia causal (2-3 linhas).

Retorne estritamente um JSON no seguinte formato:
{
  "problem": "...",
  "why1": "...",
  "why2": "...",
  "why3": "...",
  "why4": "...",
  "why5_root_cause": "...",
  "category": "Condição Insegura | Falha de Processo | Equipamento/Proteção | Fator Humano/Treinamento | Gestão",
  "causalSummary": "..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: any) {
      console.error("Erro na análise dos 5 Porquês:", error);
      res.status(500).json({
        error: error.message || "Falha ao gerar análise de causa raiz com IA",
      });
    }
  });

  // AI Endpoint: Sugestão de Planos de Ação 5W2H
  app.post("/api/ai/suggest-actions", async (req, res) => {
    try {
      const { problem, rootCause, sector, eventType, description } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({
          error: "Chave GEMINI_API_KEY não configurada no servidor.",
        });
      }

      const prompt = `Você é um Engenheiro de Segurança do Trabalho especialista em Hierarquia de Controle de Riscos (Eliminação > Substituição > Engenharia > Administrativo > EPI) e NRs brasileiras.
Com base no problema identificado e na causa raiz:
- Problema: ${problem || "Acidente de trabalho"}
- Causa Raiz: ${rootCause || "Falta de proteção e procedimento"}
- Setor: ${sector || "Operacional"}
- Tipo: ${eventType || "Ocorrência"}
- Contexto: ${description || ""}

Gere 3 a 5 medidas corretivas e preventivas no padrão 5W2H detalhado.
As ações devem ser práticas, específicas e com foco em evitar a recorrência definitiva.

Retorne estritamente um JSON no seguinte formato:
{
  "actions": [
    {
      "what": "O que fazer (Ação clara)",
      "how": "Como fazer (Método, norma aplicável ou procedimento)",
      "who": "Cargo/Responsável sugerido (ex: Supervisor de Manutenção, Técnico SST, Gerente de Operações)",
      "deadlineDays": 15,
      "category": "Engenharia" | "Administrativa" | "Treinamento" | "EPI" | "Eliminação",
      "priority": "Alta" | "Média" | "Crítica",
      "estimatedCost": "R$ 500,00 a R$ 2.000,00"
    }
  ],
  "applicableStandards": ["NR-12", "NR-01"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: any) {
      console.error("Erro na sugestão de ações:", error);
      res.status(500).json({
        error: error.message || "Falha ao sugerir plano de ação com IA",
      });
    }
  });

  // AI Endpoint: Resumo Executivo para Apresentação Gerencial
  app.post("/api/ai/executive-summary", async (req, res) => {
    try {
      const { kpis, incidentsSummary, monthYear } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({
          error: "Chave GEMINI_API_KEY não configurada.",
        });
      }

      const prompt = `Você é o Diretor de Segurança do Trabalho e Saúde Ocupacional da empresa.
Elabore um resumo executivo estratégico de alta relevância para a Diretoria e Reunião de CIPA relativo ao período ${monthYear || "do mês"}.
Dados de Desempenho e Indicadores SST:
${JSON.stringify(kpis, null, 2)}

Resumo das Ocorrências do Período:
${JSON.stringify(incidentsSummary, null, 2)}

Forneça:
1. Síntese Executiva do Desempenho de Segurança (2-3 parágrafos)
2. Principais Conquistas & Pontos de Alerta
3. Análise da Taxa de Frequência (TF) e Gravidade (TG) frente aos benchmarks e metas
4. 3 Recomendações Estratégicas e Prioridades para o Próximo Mês
5. Mensagem de engajamento da Liderança Operacional.

Retorne em JSON:
{
  "title": "Relatório Executivo Mensal de Segurança do Trabalho",
  "executiveOverview": "...",
  "keyHighlights": ["..."],
  "criticalAlerts": ["..."],
  "kpiAssessment": "...",
  "strategicPriorities": ["...", "...", "..."],
  "leadershipMessage": "..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: any) {
      console.error("Erro no resumo executivo:", error);
      res.status(500).json({
        error: error.message || "Falha ao gerar resumo executivo com IA",
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, server.cjs is compiled into dist/ folder by esbuild.
    // So __dirname IS the dist folder itself — no need to navigate up.
    const distPath = path.resolve(__dirname);
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server SST Incidents running on http://localhost:${PORT}`);
  });
}

startServer();
