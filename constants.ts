
import { Age, SchoolYear, Subject, ActivityComponent } from './types';

export const APP_NAME = "Gerador de Atividade com IA";
export const APP_DOMAIN = "geradordeatividade.com.br"; // Used for localStorage key prefix

export const ADMIN_EMAIL = "contato@smartcriacao.com";
// Admin password for mock login: "sdfjgsdf454@@f" (not used directly in frontend check for security)

export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";
export const GEMINI_IMAGE_MODEL = "imagen-3.0-generate-002"; // Added for Gemini image generation

export const MAX_PAGES_FREE_TIER = 1;
export const MAX_PAGES_SUBSCRIBED = 5;

export const AGE_OPTIONS: { value: Age; label: string }[] = Object.values(Age).map(age => ({ value: age, label: age }));
export const SCHOOL_YEAR_OPTIONS: { value: SchoolYear; label: string }[] = Object.values(SchoolYear).map(year => ({ value: year, label: year }));
export const NUM_PAGES_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "1 página" },
  { value: 2, label: "2 páginas" },
  { value: 3, label: "3 páginas" },
  { value: 4, label: "4 páginas" },
  { value: 5, label: "5 páginas" },
];
export const SUBJECT_OPTIONS: { value: Subject; label: string }[] = Object.values(Subject).map(subject => ({ value: subject, label: subject }));
export const ACTIVITY_COMPONENT_OPTIONS: { value: ActivityComponent; label: string }[] = Object.values(ActivityComponent).map(component => ({ value: component, label: component }));
