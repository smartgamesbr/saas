
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This is a placeholder for environment variables.
// In a real build setup (like Vite or Create React App),
// environment variables are typically accessed via `import.meta.env` or `process.env`
// after being defined in .env files or during the build process.

// Gemini API Key Check
if (!process.env.API_KEY) {
  console.warn(
    "----------------------------------------------------------------------------------\n" +
    "WARNING: Variável de ambiente API_KEY (para Gemini API) não definida. \n" +
    "As funcionalidades de IA do Gemini (geração de texto e imagem) podem não funcionar.\n" +
    "Certifique-se de que API_KEY está corretamente configurada como uma variável de ambiente.\n" +
    "----------------------------------------------------------------------------------"
  );
}


// Supabase Env Vars Check
if (!process.env.SUPABASE_URL) {
  console.warn(
    "Variável de ambiente SUPABASE_URL não definida. " +
    "A autenticação e funcionalidades de usuário podem não funcionar."
  );
}
if (!process.env.SUPABASE_ANON_KEY) {
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
