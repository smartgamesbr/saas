import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Check for Gemini API Key
if (!import.meta.env.GEMINI_API_KEY) {
  console.warn(
    "----------------------------------------------------------------------------------\n" +
    "WARNING: GEMINI_API_KEY não definida nas variáveis de ambiente. \n" +
    "As funcionalidades de IA do Gemini (geração de texto e imagem) podem não funcionar.\n" +
    "Certifique-se de que GEMINI_API_KEY está corretamente configurada como uma variável de ambiente.\n" +
    "----------------------------------------------------------------------------------"
  );
}

// Supabase Env Vars Check
if (!import.meta.env.SUPABASE_URL) {
  console.warn(
    "Variável de ambiente SUPABASE_URL não definida. " +
    "A autenticação e funcionalidades de usuário podem não funcionar."
  );
}
if (!import.meta.env.SUPABASE_ANON_KEY) {
  console.warn(
    "Variável de ambiente SUPABASE_ANON_KEY não definida. " +
    "A autenticação e funcionalidades de usuário podem não funcionar."
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);