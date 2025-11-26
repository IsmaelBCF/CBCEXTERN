import { GoogleGenAI, Tool } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FLASH_MODEL = 'gemini-2.5-flash';
const PRO_MODEL = 'gemini-3-pro-preview';

export const analyzeLocationContext = async (
  lat: number,
  lng: number,
  query: string
): Promise<string> => {
  try {
    const tools: Tool[] = [
      {
        googleMaps: {}
      }
    ];

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Contexto: Usuário é um funcionário de energia solar em campo na localização ${lat}, ${lng}.
      Pergunta do usuário: ${query}.
      Instrução: Forneça informações relevantes sobre o local ou arredores usando o Google Maps. Se for sobre clientes potenciais, procure empresas ou residências próximas.`,
      config: {
        tools: tools,
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        },
      },
    });

    // Check for grounding chunks first to see if maps were used effectively
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let mapsLinks = "";
    
    if (grounding) {
        // Simple extraction of map links if available to append to text
        grounding.forEach(chunk => {
            if (chunk.web?.uri) {
                mapsLinks += `\nFonte: ${chunk.web.title || 'Link'} (${chunk.web.uri})`;
            }
            if (chunk.maps?.uri) {
                mapsLinks += `\nLocal: ${chunk.maps.title || 'Mapa'} (${chunk.maps.uri})`;
            }
        });
    }

    return response.text + (mapsLinks ? `\n\n${mapsLinks}` : "");

  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Não foi possível analisar a localização no momento. Verifique sua conexão.";
  }
};

export const generateReport = async (data: any[]): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: PRO_MODEL,
            contents: `Atue como um Analista de Inteligência de Negócios Sênior para a CBC Energias Renováveis.
            
            Analise profundamente os seguintes dados brutos coletados em campo pelas equipes de Vendas e Instalação.
            
            Seus objetivos:
            1. Identificar padrões de eficiência (ex: horários com mais fechamentos, regiões com mais recusas).
            2. Detectar gargalos operacionais.
            3. Sugerir 3 ações estratégicas concretas para a diretoria.
            
            Dados Brutos: ${JSON.stringify(data)}`,
            config: {
                thinkingConfig: {
                    thinkingBudget: 32768
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating report:", error);
        return "Erro ao gerar relatório avançado. Tente novamente mais tarde.";
    }
}