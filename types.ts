
export enum Age {
  CINCO = "5 anos",
  SEIS = "6 anos",
  SETE = "7 anos",
  OITO = "8 anos",
  NOVE = "9 anos",
  DEZ = "10 anos",
  ONZE = "11 anos",
  DOZE = "12 anos",
  TREZE = "13 anos",
  CATORZE = "14 anos",
  QUINZE = "15 anos",
}

export enum SchoolYear {
  NAO_ESTUDA = "Não está na escola",
  INFANTIL = "Ensino infantil",
  PRIMEIRO_ANO = "1º ano",
  SEGUNDO_ANO = "2º ano",
  TERCEIRO_ANO = "3º ano",
  QUARTO_ANO = "4º ano",
  QUINTO_ANO = "5º ano",
  SEXTO_ANO = "6º ano",
  SETIMO_ANO = "7º ano",
  OITAVO_ANO = "8º ano",
}

export enum Subject {
  COLORIR = "Para Colorir",
  PORTUGUES = "Português",
  MATEMATICA = "Matemática",
  HISTORIA = "História",
  GEOGRAFIA = "Geografia",
  CIENCIAS = "Ciências",
  FILOSOFIA = "Filosofia",
  SOCIOLOGIA = "Sociologia",
  ARTES = "Artes",
  CALIGRAFIA = "Caligrafia",
  INGLES = "Inglês",
  ESPANHOL = "Espanhol",
  ALFABETIZACAO = "Alfabetização",
  LUDICA = "Lúdica",
  RECORTAR = "Para Recortar",
  TECNOLOGIA = "Tecnologia",
  EDUCACAO_FISICA = "Educação Física",
  CIDADANIA = "Cidadania",
  MEIO_AMBIENTE = "Meio Ambiente",
  VALORES_ETICA = "Valores e Ética",
}

export enum ActivityComponent {
  IMAGEM_TEXTO_PERGUNTAS = "Imagem + Texto com perguntas",
  TEXTO_PERGUNTAS = "Texto com perguntas",
  IMAGEM_PERGUNTAS = "Imagem com perguntas",
  MULTIPLA_ESCOLHA = "Múltipla escolha",
  VERDADEIRO_FALSO = "Verdadeiro ou falso",
  CACA_PALAVRAS = "Caça-palavras",
  COMPLETE_LACUNAS = "Complete as lacunas",
  ASSOCIE_COLUNAS = "Associe as colunas",
  ORDENAR_FRASES_EVENTOS = "Ordenar frases/eventos",
}

// For clarity in PageStructure, but mirrors ActivityComponent
export type ActivitySectionType = ActivityComponent | Subject.COLORIR | Subject.RECORTAR | "Texto Geral";


export interface PageConfig {
  id: string;
  subject: Subject | "";
}

export interface ActivityFormData {
  age: Age | "";
  schoolYear: SchoolYear | "";
  numPages: number;
  pageConfigs: PageConfig[];
  activityComponents: ActivityComponent[];
  specificTopic: string;
}

export interface Question {
  id: string;
  text: string;
  answerLines?: number; // Número de linhas para esta pergunta específica
  options?: string[]; // For Multiple Choice Questions (MCQ)
  answerKey?: string; // For MCQ correct option text or True/False answer or other specific answer
}

export interface ActivitySection {
  id: string;
  type: ActivitySectionType; 
  title?: string; 
  textContent?: string; // Instruções gerais, texto para leitura, palavras para caça-palavras
  questions?: Question[]; // Array de perguntas estruturadas para a seção
  options?: string[]; // Section-level options (e.g., for "Ordenar Frases/Eventos")
  answerKey?: string | string[]; // Section-level answer key (e.g., for "Complete Lacunas", "Associe Colunas")
  imagePrompt?: string; 
  generatedImageId?: string; 
  wordSearchGridData?: string; // JSON string for caça-palavras grid
}

export interface PageStructure {
  pageNumber: number;
  subject: Subject;
  pageTitle?: string; 
  sections: ActivitySection[];
}

export interface GeneratedImage {
  id: string; 
  base64Data: string; 
  promptUsed?: string; 
}

export interface GeneratedPage {
  id: string; 
  pageNumber: number;
  structure: PageStructure;
  images: GeneratedImage[]; 
}

// Updated User type for Supabase
export interface User {
  id: string; // Supabase user ID
  email: string; // Supabase user email
  isAdmin: boolean;
  isSubscribed: boolean;
  // Add any other app-specific profile fields you might need
}

export interface SavedActivity {
  id: string; // UUID from Supabase
  user_id: string; // Foreign key to auth.users.id
  created_at: string; // Timestamp string
  activity_name: string;
  form_data: ActivityFormData; // The form input used to generate this
  generated_pages_data: GeneratedPage[]; // The actual generated content
}
