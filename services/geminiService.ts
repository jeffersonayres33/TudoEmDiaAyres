import { GoogleGenAI } from "@google/genai";
import { MaintenanceRecord } from "../types";

// Note: GoogleGenAI client is initialized inside each function to ensure the most up-to-date API key is used
// and to follow the guideline of creating a new instance right before making an API call.

export async function getMaintenanceTips(maintenance: MaintenanceRecord): Promise<string> {
  // Always use the required format for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise esta tarefa de manutenção e forneça 3 dicas curtas e profissionais para aumentar a vida útil do item ou economizar custos:
      Nome: ${maintenance.name}
      Categoria: ${maintenance.category}
      Descrição: ${maintenance.description}
      Responda em português de forma concisa e direta.`,
    });

    // Accessing .text as a property as per latest SDK definition
    return response.text || "Dicas temporariamente indisponíveis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro ao buscar sugestões inteligentes.";
  }
}

export async function generateMaintenanceReportSummary(records: MaintenanceRecord[]): Promise<string> {
  // Always use the required format for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
    const summaryData = records.map(r => `${r.name} (${r.category}): R$ ${r.cost || 0}`).join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Com base nos seguintes gastos de manutenção: ${summaryData}. Total gasto: R$ ${totalCost}. 
      Faça um breve resumo executivo (máximo 4 linhas) sobre a saúde geral das manutenções e sugira onde pode haver economia.`,
    });

    // Accessing .text as a property as per latest SDK definition
    return response.text || "Sumário indisponível.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Erro ao analisar dados financeiros.";
  }
}