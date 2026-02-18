import { GoogleGenAI } from "@google/genai";
import { MaintenanceRecord } from "../types";

// Função para obter a instância da IA de forma segura
const getAIClient = () => {
  const apiKey = process.env.API_KEY || "";
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export async function getMaintenanceTips(maintenance: MaintenanceRecord): Promise<string> {
  const ai = getAIClient();
  if (!ai) return "Chave de IA não configurada. Configure o segredo API_KEY no deploy.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise esta tarefa de manutenção e forneça 3 dicas curtas e profissionais para aumentar a vida útil do item ou economizar custos:
      Nome: ${maintenance.name}
      Categoria: ${maintenance.category}
      Descrição: ${maintenance.description}
      Responda em português de forma concisa e direta.`,
    });

    return response.text || "Dicas temporariamente indisponíveis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro ao buscar sugestões inteligentes.";
  }
}

export async function generateMaintenanceReportSummary(records: MaintenanceRecord[]): Promise<string> {
  const ai = getAIClient();
  if (!ai) return "Sumário indisponível sem chave de API.";

  try {
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
    const summaryData = records.map(r => `${r.name} (${r.category}): R$ ${r.cost || 0}`).join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Com base nos seguintes gastos de manutenção: ${summaryData}. Total gasto: R$ ${totalCost}. 
      Faça um breve resumo executivo (máximo 4 linhas) sobre a saúde geral das manutenções e sugira onde pode haver economia.`,
    });

    return response.text || "Sumário indisponível.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Erro ao analisar dados financeiros.";
  }
}