
import { GoogleGenAI } from "@google/genai";
import { MaintenanceRecord } from "../types";

// Always initialize the client using the named parameter and process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates specific maintenance tips based on record details.
 */
export async function getMaintenanceTips(maintenance: MaintenanceRecord): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise esta tarefa de manutenção e forneça 3 dicas curtas e profissionais para aumentar a vida útil do item ou economizar custos:
      Nome: ${maintenance.name}
      Categoria: ${maintenance.category}
      Descrição: ${maintenance.description}
      Responda em português de forma concisa e direta.`,
    });

    // Access text property directly from the response object.
    return response.text || "Não foi possível gerar dicas no momento.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Ocorreu um erro ao buscar sugestões inteligentes.";
  }
}

/**
 * Generates an executive summary of maintenance expenses and health.
 */
export async function generateMaintenanceReportSummary(records: MaintenanceRecord[]): Promise<string> {
  try {
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
    const summaryData = records.map(r => `${r.name} (${r.category}): R$ ${r.cost || 0}`).join(", ");
    
    const response = await ai.models.generateContent({
      // Using gemini-3-pro-preview for complex text tasks involving data analysis and reasoning.
      model: 'gemini-3-pro-preview',
      contents: `Com base nos seguintes gastos de manutenção: ${summaryData}. Total gasto: R$ ${totalCost}. 
      Faça um breve resumo executivo (máximo 4 linhas) sobre a saúde geral das manutenções e sugira onde pode haver economia.`,
    });

    return response.text || "";
  } catch (error) {
    console.error("Error generating report summary:", error);
    return "Erro ao gerar sumário.";
  }
}
