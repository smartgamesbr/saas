import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ActivityFormData, PageConfig, Subject, PageStructure, ActivitySectionType, ActivityComponent, Question, Age } from '../types';
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL } from '../constants';

// Initialize GoogleGenAI with the API key from environment variables
const apiKey = import.meta.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is not defined in environment variables. AI functionalities will fail.");
}

const ai = new GoogleGenAI({ apiKey });

const cleanJsonString = (jsonStr: string): string => {
  let cleaned = jsonStr.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleaned.match(fenceRegex);
  if (match && match[2]) {
    cleaned = match[2].trim();
  }
  return cleaned;
};

const getPedagogicalGuidelines = (age: Age | string): string => {
  const guidelines: Record<Age | string, string> = {
    [Age.CINCO]: "Habilidades: Pré-alfabetização, reconhecimento de cores, formas, números até 10. Cuidados: A maioria ainda não lê. Foque em: Atividades visuais e lúdicas (recortar, colar, colorir). Ligação entre imagem e palavra. Jogos simples (ligue os pontos, tracejado, formas geométricas).",
    [Age.SEIS]: "Habilidades: Início da alfabetização, contagem, coordenação motora. Cuidados: Incluir atividades com sílabas, vogais, letras. Atividades com traçado de palavras simples. Introdução de noções básicas de adição.",
    [Age.SETE]: "Habilidades: Alfabetização em andamento, leitura de frases curtas. Cuidados: Textos com frases simples e claras. Exercícios de completar palavras, caça-palavras básico. Operações de soma e subtração.",
    [Age.OITO]: "Habilidades: Leitura e escrita mais fluente, compreensão de pequenos textos. Cuidados: Atividades com interpretação de texto curto. Introdução a multiplicação. Perguntas com alternativas (marcar X).",
    [Age.NOVE]: "Habilidades: Autonomia para leitura, resolução de problemas simples. Cuidados: Questões de múltipla escolha com mais complexidade. Operações matemáticas com mais etapas. Textos com perguntas abertas e de interpretação.",
    [Age.DEZ]: "Habilidades: Compreensão textual mais profunda, início de pensamento lógico. Cuidados: Redações curtas. Questões com 'complete', 'responda com suas palavras'. Introdução a frações e problemas matemáticos contextualizados.",
    [Age.ONZE]: "Habilidades: Argumentação inicial, pensamento crítico em formação. Cuidados: Atividades de análise (ex: 'o que você entendeu?', 'qual a intenção do autor?'). Interpretação de gráficos e tabelas. Exercícios de gramática contextualizados.",
    [Age.DOZE]: "Habilidades: Capacidade de abstração mais sólida. Cuidados: Debates, temas sociais simples. Produção de textos com introdução, desenvolvimento e conclusão. Problemas matemáticos envolvendo porcentagem e proporção.",
    [Age.TREZE]: "Habilidades: Maior maturidade de leitura e escrita, argumentação mais forte. Cuidados: Textos reflexivos com perguntas críticas. Interpretação de poemas e textos literários. Matemática: equações simples e geometria.",
    [Age.CATORZE]: "Habilidades: Capacidade de análise, síntese e comparação. Cuidados: Questões de inferência e interpretação subjetiva. Produções textuais argumentativas. Matemática: expressões algébricas, gráficos.",
    [Age.QUINZE]: "Habilidades: Autonomia total em leitura e resolução de problemas complexos. Cuidados: Desafios interdisciplinares. Discussões filosóficas, sociais, históricas. Questões que exigem raciocínio crítico e comparações entre temas."
  };
  return guidelines[age] || "Adapte o conteúdo para a idade e desenvolvimento do aluno.";
};

const getRandomUppercaseLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));

export const generateActivityPageStructure = async (
  formData: ActivityFormData,
  pageConfig: PageConfig,
  pageNumber: number,
  totalPages: number
): Promise<PageStructure> => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const { age, schoolYear, activityComponents, specificTopic } = formData;
  const subject = pageConfig.subject as Subject;
  const pedagogicalGuidance = getPedagogicalGuidelines(age);

  const componentSelectionInstruction = `Para esta página (Página ${pageNumber} de ${totalPages}), sua tarefa é criar UMA ÚNICA seção de atividade.
Selecione UM tipo de atividade para esta seção a partir da lista de componentes solicitados pelo usuário para toda a atividade: [${activityComponents.join(", ")}].
Se possível, escolha um componente da lista que ainda não foi usado nas páginas anteriores (se houver páginas anteriores).
A ÚNICA seção da página deve ser substancial e preencher bem uma página A4, considerando o conteúdo e a idade '${age}'.
Se a matéria principal da página for "${Subject.COLORIR}" ou "${Subject.RECORTAR}", este DEVE ser o tipo de componente selecionado para a única seção da página.
`;

  const detailedComponentInstructions = `
Instruções Detalhadas para Tipos de Seção (type) - FOCO EM CONTEÚDO SUBSTANCIAL PARA PREENCHER A PÁGINA:
CRÍTICO PARA TODAS AS IMAGENS: Todas as imagens solicitadas via 'imagePrompt' DEVEM ser geradas estritamente com '16:9 aspect ratio' para melhor encaixe em layouts de página A4 e para evitar que fiquem muito altas. Elas também devem ter 'ABSOLUTELY NO overlaid text, letters, words, or symbols'.
- "${Subject.COLORIR}": Crie UMA seção com "type": "${Subject.COLORIR}", "title" apropriado (ex: "Pinte o Dinossauro Amigável"), e um "imagePrompt" grande e detalhado para uma imagem de colorir rica em detalhes ou uma cena completa sobre o tópico ${specificTopic || subject}. O "imagePrompt" DEVE seguir as regras críticas para todas as imagens (16:9, sem texto sobreposto). "textContent" pode ser uma breve instrução como "Use suas cores favoritas para dar vida a este desenho!". Esta DEVE ser a única seção na página.
- "${Subject.RECORTAR}": Crie UMA seção com "type": "${Subject.RECORTAR}", "title" (ex: "Recorte as Formas Geométricas"), e um "imagePrompt" para múltiplos elementos ou uma cena com linhas tracejadas claras para recortar, sobre o tópico ${specificTopic || subject}. O "imagePrompt" DEVE seguir as regras críticas para todas as imagens (16:9, sem texto sobreposto). "textContent" pode ser uma breve instrução. Esta DEVE ser a única seção na página.
- "${ActivityComponent.CACA_PALAVRAS}":
    - "type": "${ActivityComponent.CACA_PALAVRAS}".
    - "title": Instrução principal clara e tema (ex: "Caça-Palavras: Animais da Fazenda").
    - "textContent": Deve listar um número SUBSTANCIAL de palavras a serem encontradas (ex: 10-15 palavras, dependendo da idade), separadas por vírgula ou em linhas.
    - "wordSearchGridData": CRÍTICO - DEVE ser uma STRING JSON válida, representando um array de strings (as linhas da grade).
    INSTRUÇÕES EXTREMAMENTE IMPORTANTES PARA A GRADE \`wordSearchGridData\`:

    REGRA 1: SEM ESPAÇOS NAS LINHAS
        - CADA string (linha) na grade DEVE ser uma sequência CONTÍNUA de letras MAIÚSCULAS.
        - **NÃO PODE HAVER NENHUM caractere de ESPAÇO (' ') dentro de NENHUMA string de linha.**
        - Letras acentuadas (Á, É, Ç) são permitidas APENAS se fizerem parte das palavras escondidas.

    REGRA 2: TODAS AS LINHAS COM O MESMO COMPRIMENTO (ABSOLUTAMENTE CRÍTICO!)
        1.  DECIDA O NÚMERO DE COLUNAS: Para ocupar bem a largura de uma página A4, a grade deve ter entre 22 a 26 colunas. Para uma proporção mais retangular, o número de linhas deve ser entre 14 a 18 linhas. Ajuste o número de colunas (dentro da faixa de 22-26) e o número de linhas (dentro da faixa de 14-18) conforme a idade "${age}" e a complexidade das palavras, mas mantenha a grade predominantemente mais larga do que alta dentro dessas faixas. Seja qual for o número de colunas escolhido, este será o comprimento EXATO de TODAS as linhas.
        2.  COMPRIMENTO UNIFORME OBRIGATÓRIO E INFLEXÍVEL: TODAS as strings (linhas) no array \`wordSearchGridData\` DEVEM ter EXATAMENTE o mesmo número de caracteres (o número de colunas decidido no passo 1). NENHUMA VARIAÇÃO DE COMPRIMENTO É PERMITIDA. ISTO É VITAL PARA A RENDERIZAÇÃO CORRETA.
            -   **VERIFICAÇÃO FINAL CRÍTICA ANTES DE GERAR O JSON:** Para CADA linha, conte os caracteres. CONFIRME que TODAS as linhas têm a MESMA contagem. Se uma linha for diferente, VOCÊ DEVE CORRIGI-LA IMEDIATAMENTE ANTES DE FINALIZAR O JSON. UMA ÚNICA FALHA AQUI INVALIDA A GRADE E QUEBRA A EXIBIÇÃO.

    REGRA 3: PREENCHIMENTO COMPLETO E ALEATÓRIO
        - TODAS as células da grade DEVEM ser preenchidas. Nenhuma célula pode ficar vazia.
        - As células que não fazem parte das palavras escondidas DEVEM ser preenchidas com letras MAIÚSCULAS ALEATÓRIAS (A-Z, sem acentos para o preenchimento). O preenchimento NÃO PODE formar padrões óbvios.

    REGRA 4: ESCONDER PALAVRAS (HORIZONTAL LTR E VERTICAL TTB APENAS)
        - Palavras de "textContent" DEVEM estar na grade.
        - Direções: APENAS Horizontal (esquerda para direita) e Vertical (cima para baixo).
        - **NÃO use palavras invertidas. NÃO use diagonais.**
        - Distribua as palavras de forma variada pela grade.

- "${ActivityComponent.TEXTO_PERGUNTAS}":
    - "type": "${ActivityComponent.TEXTO_PERGUNTAS}".
    - "title": Título para a seção.
    - "textContent": Um texto base para leitura de tamanho adequado para preencher boa parte da página, considerando a idade.
    - "questions": Array de 4 a 6 objetos de pergunta (ou mais, se as perguntas forem curtas), cada um com "id", "text", e "answerLines" (1-3).
- "${ActivityComponent.IMAGEM_PERGUNTAS}":
    - "type": "${ActivityComponent.IMAGEM_PERGUNTAS}".
    - "title": Título relacionado à imagem.
    - "imagePrompt": Prompt DETALHADO (regras 16:9, sem texto sobreposto).
    - "questions": Array de 4 a 6 objetos de pergunta sobre a imagem, cada um com "id", "text", e "answerLines".
- "${ActivityComponent.IMAGEM_TEXTO_PERGUNTAS}":
    - "type": "${ActivityComponent.IMAGEM_TEXTO_PERGUNTAS}".
    - "title": Título combinando imagem e texto.
    - "imagePrompt": Como em "Imagem com perguntas" (regras 16:9, sem texto sobreposto).
    - "textContent": Texto complementar curto.
    - "questions": Array de 4 a 6 objetos de pergunta, cada um com "id", "text", e "answerLines".
- "${ActivityComponent.MULTIPLA_ESCOLHA}":
    - "type": "${ActivityComponent.MULTIPLA_ESCOLHA}".
    - "title": Título.
    - "textContent": Opcional, instrução ou contexto.
    - "questions": Array de 5 a 8 objetos de pergunta. Cada pergunta DEVE ter "id", "text", "options" (3-4 alternativas), e opcionalmente "answerKey".
- "${ActivityComponent.VERDADEIRO_FALSO}":
    - "type": "${ActivityComponent.VERDADEIRO_FALSO}".
    - "title": Título.
    - "textContent": Opcional, instrução.
    - "questions": Array de 6 a 10 objetos de pergunta (afirmações). Cada pergunta deve ter "id", "text", e opcionalmente "answerKey".
- "${ActivityComponent.COMPLETE_LACUNAS}":
    - "type": "${ActivityComponent.COMPLETE_LACUNAS}".
    - "title": Título.
    - "textContent": Um parágrafo ou várias frases com múltiplas lacunas (ex: 5-8 lacunas), indicadas por "___" ou "[LACUNA]".
    - "answerKey": (Opcional) Array com as palavras corretas.
- "${ActivityComponent.ASSOCIE_COLUNAS}":
    - "type": "${ActivityComponent.ASSOCIE_COLUNAS}".
    - "title": Título.
    - "textContent": Instruções e as duas colunas com 5 a 7 pares para associar.
    - "answerKey": (Opcional) Array com as associações corretas.
- "${ActivityComponent.ORDENAR_FRASES_EVENTOS}":
    - "type": "${ActivityComponent.ORDENAR_FRASES_EVENTOS}".
    - "title": Título.
    - "textContent": Instruções.
    - "options": Array com 5 a 7 frases ou eventos para ordenar.
    - "answerKey": (Opcional) Array com os itens na ordem correta.
- "Texto Geral":
    - "type": "Texto Geral".
    - "title": Título para o texto informativo.
    - "textContent": Conteúdo textual informativo substancial para a página.
`;

  const prompt = `
Você é um especialista em design instrucional e criação de material didático.
Sua tarefa é gerar a estrutura de UMA ÚNICA página de atividade escolar em formato JSON.

Especificações da Atividade:
- Idade do Aluno: ${age}
- Ano Escolar: ${schoolYear}
- Matéria Principal da Página: ${subject}
- Tópico Específico (se houver): ${specificTopic || "Geral da matéria"}
- Página Atual: ${pageNumber} de ${totalPages}
- Componentes de Atividade Solicitados pelo Usuário (para toda a atividade): ${activityComponents.join(", ")}

**Orientações Pedagógicas Específicas para ${age}:**
${pedagogicalGuidance}

${componentSelectionInstruction}

Estrutura JSON de Saída Esperada (siga este formato RIGOROSAMENTE):
{
  "pageNumber": ${pageNumber},
  "subject": "${subject}",
  "pageTitle": "Um título criativo e relevante para a página sobre ${subject} e ${specificTopic || 'tópico geral'}",
  "sections": [
    // DEVE haver APENAS UMA seção aqui, conforme a instrução de seleção de componentes.
    // A seção deve ser rica em conteúdo para preencher bem a página A4.
    {
      "id": "section-id-aleatorio-1", 
      "type": "Tipo da seção escolhido (ex: '${ActivityComponent.TEXTO_PERGUNTAS}')",
      "title": "Título da Seção",
      "textContent": "Conteúdo textual relevante para o tipo de seção. Para Caça-Palavras, lista de palavras aqui.",
      "questions": [ 
        { 
          "id": "q-id-1", 
          "text": "Texto da pergunta ou afirmação?", 
          "answerLines": 2, 
          "options": ["Opção A", "Opção B"], 
          "answerKey": "Opção A" 
        }
      ],
      "options": [], 
      "answerKey": null, 
      "imagePrompt": "Se for uma seção com imagem, prompt DETALHADO em INGLÊS para gerar uma imagem educacional com 'imagen-3.0-generate-002'. O prompt DEVE EXPLICITAMENTE INCLUIR '16:9 aspect ratio' e 'ABSOLUTELY NO overlaid text, letters, words, or symbols.' Se não precisar de imagem, omita ou null.",
      "wordSearchGridData": null 
    }
  ]
}

${detailedComponentInstructions}

Importante:
- O array "sections" DEVE conter exatamente UM objeto de seção.
- A seção ÚNICA deve ser substancial e bem desenvolvida, visando preencher a maior parte de uma página A4.
- Adapte todo o conteúdo para a idade ("${age}") e ano escolar ("${schoolYear}"), seguindo as Orientações Pedagógicas.
- Gere IDs únicos para cada seção e cada pergunta.
- Seções de imagem DEVEM ter 'imagePrompt' seguindo as diretrizes (16:9, sem texto sobreposto).
- Para '${ActivityComponent.CACA_PALAVRAS}', o campo 'wordSearchGridData' é OBRIGATÓRIO e deve seguir o formato e as INSTRUÇÕES DETALHADAS PARA A GRADE DO CAÇA-PALAVRAS, especialmente as REGRAS (1, 2, 3, 4) e a REVISÃO FINAL CRÍTICA. 'textContent' deve ser a lista de palavras. LEMBRE-SE: A REGRA 2 (TODAS AS LINHAS COM O MESMO COMPRIMENTO) É ABSOLUTAMENTE CRUCIAL E INFLEXÍVEL.
- Para '${ActivityComponent.MULTIPLA_ESCOLHA}', cada pergunta em 'questions' deve ter seu próprio array 'options'.
- Gere APENAS o objeto JSON. Não inclua texto explicativo, comentários ou markdown antes ou depois do JSON.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const rawJson = response.text;
    const cleanedJson = cleanJsonString(rawJson);
    
    let structure = JSON.parse(cleanedJson) as PageStructure;

    structure.pageNumber = structure.pageNumber || pageNumber;
    structure.subject = structure.subject || subject;
    structure.sections = structure.sections || [];

    if (structure.sections.length !== 1) {
        console.warn(`AI gerou ${structure.sections.length} seções para a página ${pageNumber}, mas era esperado apenas 1. Usando a primeira seção ou criando uma vazia se necessário.`);
        if (structure.sections.length > 1) {
            structure.sections = [structure.sections[0]]; 
        } else if (structure.sections.length === 0) {
            structure.sections = [{ 
                id: `section-fallback-${crypto.randomUUID()}`,
                type: "Texto Geral", 
                title: "Seção não gerada corretamente",
                textContent: "Houve um problema ao gerar o conteúdo desta seção. Tente novamente."
            }];
        }
    }

    structure.sections.forEach(section => {
      section.id = section.id || `section-${crypto.randomUUID()}`;
      if (subject === Subject.COLORIR && section.imagePrompt && !section.type) section.type = Subject.COLORIR;
      if (subject === Subject.RECORTAR && section.imagePrompt && !section.type) section.type = Subject.RECORTAR;
      
      if (section.type === ActivityComponent.CACA_PALAVRAS && section.wordSearchGridData) {
        try {
          let gridRows = JSON.parse(section.wordSearchGridData as string);

          if (Array.isArray(gridRows) && gridRows.every(r => typeof r === 'string')) {
            if (gridRows.length === 0) {
                 console.warn(`Caça-Palavras (ID: ${section.id}): wordSearchGridData é um array vazio. A grade não será renderizada.`);
                 section.wordSearchGridData = null; // Invalidate if empty after parse
            } else {
                // Sanitize: Remove spaces and ensure uniform length
                const targetLength = gridRows[0].length; 
                
                if (targetLength === 0) {
                    console.warn(`Caça-Palavras (ID: ${section.id}): A primeira linha da grade tem comprimento 0. A grade pode não ser útil.`);
                    // Decide if to invalidate or proceed with empty strings
                }

                const sanitizedRows = gridRows.map((row: string) => {
                    let cleanedRow = row.replace(/\s/g, ''); // Remove any spaces
                    if (cleanedRow.length > targetLength) {
                        return cleanedRow.substring(0, targetLength);
                    }
                    while (cleanedRow.length < targetLength) {
                        cleanedRow += getRandomUppercaseLetter();
                    }
                    return cleanedRow;
                });
                
                // Final check on sanitized rows
                if (sanitizedRows.every(row => typeof row === 'string' && row.length === targetLength)) {
                    section.wordSearchGridData = JSON.stringify(sanitizedRows);
                } else {
                    console.warn(`Caça-Palavras (ID: ${section.id}, Título: ${section.title}): Falha ao sanitizar a grade para comprimentos uniformes. A primeira linha pode ter tido comprimento 0 ou outro problema inesperado. A grade pode não ser renderizada corretamente.`);
                    // section.wordSearchGridData = null; // Optionally invalidate
                }
            }
          } else {
            console.warn(`Caça-Palavras (ID: ${section.id}, Título: ${section.title}): wordSearchGridData não é um array de strings válido ou está vazio após o parse. Dados originais:`, section.wordSearchGridData);
            section.wordSearchGridData = null; // Invalidate if format is wrong
          }
        } catch (e) {
          console.error(`Caça-Palavras (ID: ${section.id}, Título: ${section.title}): Erro ao processar/sanitizar wordSearchGridData: ${e}. Dados originais:`, section.wordSearchGridData);
          section.wordSearchGridData = null; // Invalidate on error
        }
      } else if (section.type === ActivityComponent.CACA_PALAVRAS && !section.wordSearchGridData) {
         console.warn(`Seção Caça-Palavras (ID: ${section.id}, Título: ${section.title}) não possui wordSearchGridData. A grade não será renderizada.`);
      }

      if (section.questions) {
        section.questions.forEach(q => {
          q.id = q.id || `q-${crypto.randomUUID()}`;
          if (section.type !== ActivityComponent.MULTIPLA_ESCOLHA && section.type !== ActivityComponent.VERDADEIRO_FALSO) {
            q.answerLines = q.answerLines || 1; 
          }
        });
      }
    });
    
    return structure;

  } catch (error) {
    console.error("Error generating activity page structure with Gemini:", error);
    const message = error instanceof Error ? error.message : String(error);
    let rawResponseForError = "Raw response not available or too long.";
     try {
        const errorSource = (error instanceof SyntaxError && (error as any).message) ? 
                            (error as any).message.substring((error as any).message.indexOf("{"), (error as any).message.lastIndexOf("}") + 1) || (error as any).message 
                            : (error as any).sourceString || (error as any).bodyText || "";
         if(errorSource) rawResponseForError = errorSource.substring(0, 1000) + (errorSource.length > 1000 ? "..." : "");
    } catch (e) {/* ignore */}

    if (error instanceof SyntaxError) { 
        console.error("Raw response from Gemini (structure generation - likely malformed JSON):", rawResponseForError);
        throw new Error(`Falha ao analisar a estrutura da atividade (Gemini JSON Error): ${message}. Detalhes: ${rawResponseForError}`);
    }
    throw new Error(`Falha ao gerar estrutura da atividade (Gemini): ${message}. Detalhes: ${rawResponseForError}`);
  }
};

export const generateSectionImage = async (imagePrompt: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  if (!imagePrompt || imagePrompt.trim() === "") {
    throw new Error("Image prompt cannot be empty for generating a section image.");
  }

  let processedImagePrompt = imagePrompt;
  if (!/16:9 aspect ratio/i.test(processedImagePrompt)) {
    processedImagePrompt = `${processedImagePrompt.trim()}, 16:9 aspect ratio`;
  }
  if (!/ABSOLUTELY NO overlaid text/i.test(processedImagePrompt) && !/sem texto sobreposto/i.test(processedImagePrompt)) {
    processedImagePrompt = `${processedImagePrompt.trim()}, ABSOLUTELY NO overlaid text, letters, words, or symbols.`;
  }

  const fullPrompt = `${processedImagePrompt}, children's illustration style, clean lines, vibrant colors, visually appealing for educational material.`;
  console.log("Generating image with Gemini. Full Prompt:", fullPrompt);

  try {
    const response = await ai.models.generateImages({
        model: GEMINI_IMAGE_MODEL,
        prompt: fullPrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png' }, 
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      return response.generatedImages[0].image.imageBytes; 
    }
    console.error("Invalid response structure from Gemini Image API:", response);
    throw new Error("Nenhuma imagem base64 foi retornada pela API de Imagem Gemini ou a resposta é inválida.");

  } catch (error) {
    console.error("Error generating section image with Gemini:", error);
    let detailedMessage = error instanceof Error ? error.message : String(error);

    if (detailedMessage.includes("RESOURCE_EXHAUSTED") || detailedMessage.includes("429") || detailedMessage.includes("quota")) {
      detailedMessage = "Sua cota de geração de imagens foi excedida. Por favor, verifique seu plano e detalhes de faturamento com a API Gemini ou tente novamente mais tarde.";
    } else if (detailedMessage.includes("prompt was blocked") || detailedMessage.includes("PROHIBITED_CONTENT")) {
      detailedMessage = "O prompt para a imagem foi bloqueado por conter conteúdo potencialmente inadequado. Tente um prompt diferente.";
    }
     else {
      detailedMessage = `Falha ao gerar imagem da seção (Gemini Image): ${detailedMessage}`;
    }
    throw new Error(detailedMessage);
  }
};