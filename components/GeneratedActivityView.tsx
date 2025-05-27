
import React from 'react';
import { GeneratedPage, ActivitySection, GeneratedImage, Subject, ActivityComponent, Question, ActivitySectionType } from '../types'; 
import LoadingSpinner from './LoadingSpinner';

interface GeneratedActivityViewProps {
  pages: GeneratedPage[];
  onDownloadPdf: () => void;
  isGeneratingPdf: boolean;
  onClearResults: () => void;
  onSaveActivity: (activityName: string) => void; // New prop
  isSavingActivity: boolean; // New prop
  activityName?: string; // Optional: if viewing a saved activity, its name can be displayed
}

const renderTextContent = (text?: string, className: string = "mb-2 text-sm md:text-base leading-relaxed") => {
  if (!text) return null;
  return text.split('\n').map((paragraph, index) => (
    <p key={index} className={className}>{paragraph}</p>
  ));
};

const renderOptionsList = (options?: string[], listType: 'disc' | 'alpha' = 'disc') => {
  if (!options || options.length === 0) return null;
  return (
    <ul className={`${listType === 'disc' ? 'list-disc' : 'list-none'} list-inside pl-4 mt-2 space-y-1`}>
      {options.map((option, index) => (
        <li key={index} className="text-sm md:text-base">
          {listType === 'alpha' ? `${String.fromCharCode(65 + index)}. ` : ''}{option}
        </li>
      ))}
    </ul>
  );
};

const renderQuestions = (questions?: Question[], sectionType?: ActivitySectionType) => {
  if (!questions || questions.length === 0) return null;
  return (
    <div className="questions-container mt-4"> {/* Increased mt for spacing after two-column layout */}
      {questions.map(q => (
        <div key={q.id} className="question-block mb-5 p-2 border-b border-slate-200 last:border-b-0">
          <p className="text-sm md:text-base leading-relaxed font-medium mb-1">{q.text}</p>
          
          {sectionType === ActivityComponent.MULTIPLA_ESCOLHA && q.options && q.options.length > 0 && (
            renderOptionsList(q.options, 'alpha')
          )}

          {q.answerLines && q.answerLines > 0 && sectionType !== ActivityComponent.MULTIPLA_ESCOLHA && (
            <div className="answer-lines mt-2">
              {Array.from({ length: q.answerLines }).map((_, i) => (
                <div key={i} className="answer-line"></div> 
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};


const RenderSection: React.FC<{ section: ActivitySection; images: GeneratedImage[] }> = ({ section, images }) => {
  const image = section.generatedImageId ? images.find(img => img.id === section.generatedImageId) : null;
  
  const imageStyle: React.CSSProperties = {
    maxHeight: '110mm', 
    maxWidth: '100%', 
    width: 'auto',      
    height: 'auto',     
    objectFit: 'contain', 
    display: 'block',     
    margin: '0 auto', // Centered within its container, no extra top/bottom margin here
    border: '1px solid #e2e8f0', 
    borderRadius: '0.25rem' 
  };
  
  const renderWordSearch = () => {
    if (!section.wordSearchGridData || typeof section.wordSearchGridData !== 'string' || section.wordSearchGridData.trim() === "") {
      return <p className="text-red-500 text-sm">Oops! A grade do caça-palavras não pôde ser gerada. Tente novamente ou com outras opções.</p>;
    }
    try {
      const gridRows: string[] = JSON.parse(section.wordSearchGridData);
      if (!Array.isArray(gridRows) || !gridRows.every(row => typeof row === 'string' && row.length === (gridRows[0]?.length || 0) && !row.includes(' '))) {
        console.error("Formato da grade inválido ou contém espaços/linhas de tamanhos diferentes.", section.wordSearchGridData);
        throw new Error("Formato da grade inválido ou contém espaços/linhas de tamanhos diferentes.");
      }
      return (
        <div className="word-search-content mt-3">
          {section.title && <h4 className="text-md font-semibold text-sky-700 mb-2">{section.title}</h4>}
          <table className="word-search-grid mx-auto border-collapse border border-slate-400 my-3">
            <tbody>
              {gridRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.split('').map((char, charIndex) => (
                    <td key={`${rowIndex}-${charIndex}`} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border border-slate-300 text-center font-mono text-sm sm:text-base md:text-lg uppercase">
                      {char}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {section.textContent && ( 
            <div className="word-search-words mt-3">
              <h5 className="text-sm font-semibold mb-1">Palavras para encontrar:</h5>
              {renderOptionsList(section.textContent.split(/, ?|\n/gm).map(w => w.trim()).filter(w => w))}
            </div>
          )}
        </div>
      );
    } catch (e) {
      console.error("Erro ao parsear ou renderizar caça-palavras:", e, "Dados recebidos:", section.wordSearchGridData);
      return <p className="text-red-500 text-sm">Houve um problema ao exibir o caça-palavras. Verifique os dados.</p>;
    }
  };

  // New layout for IMAGEM_TEXTO_PERGUNTAS
  if (section.type === ActivityComponent.IMAGEM_TEXTO_PERGUNTAS && image) {
    return (
      <div className="activity-section mb-6 p-3 border border-dashed border-slate-300 rounded min-h-[100px]">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Image Column */}
          <div className="w-full md:w-2/5 flex-shrink-0">
            <img 
              src={`data:image/png;base64,${image.base64Data}`} 
              alt={section.title || 'Imagem da atividade'} 
              style={imageStyle}
            />
          </div>
          {/* Text Column */}
          <div className="w-full md:w-3/5">
            {section.title && <h4 className="text-md font-semibold text-sky-700 mb-2">{section.title}</h4>}
            {renderTextContent(section.textContent, "text-sm md:text-base leading-relaxed")}
          </div>
        </div>
        {/* Questions below the two-column layout */}
        {renderQuestions(section.questions, section.type)}
      </div>
    );
  }


  return (
    <div className="activity-section mb-6 p-3 border border-dashed border-slate-300 rounded min-h-[100px]">
      {section.title && section.type !== ActivityComponent.CACA_PALAVRAS && (
         <h4 className="text-md font-semibold text-sky-700 mb-2">{section.title}</h4>
      )}
      
      {section.type === Subject.COLORIR && image && (
        <div className="coloring-image-container text-center">
          {renderTextContent(section.textContent)}
          <img 
            src={`data:image/png;base64,${image.base64Data}`} 
            alt={section.title || 'Imagem para colorir'} 
            style={{...imageStyle, margin: '10px auto'}} // Re-add vertical margin for these specific types
          />
        </div>
      )}

      {section.type === Subject.RECORTAR && image && (
         <div className="cutting-image-container text-center">
          {renderTextContent(section.textContent)}
          <img 
            src={`data:image/png;base64,${image.base64Data}`} 
            alt={section.title || 'Imagem para recortar'} 
            style={{...imageStyle, margin: '10px auto', borderStyle: 'dashed', borderColor: '#94a3b8' /* slate-400 */}}
          />
        </div>
      )}

      {/* IMAGEM_PERGUNTAS (sem texto ao lado, imagem acima das perguntas) */}
      {section.type === ActivityComponent.IMAGEM_PERGUNTAS && image && (
        <div className="image-with-questions-container my-3">
            <img 
                src={`data:image/png;base64,${image.base64Data}`} 
                alt={section.title || 'Imagem da atividade'} 
                style={{...imageStyle, margin: '10px auto'}}
            />
            {renderQuestions(section.questions, section.type)}
        </div>
      )}
      
      {section.type === ActivityComponent.CACA_PALAVRAS && renderWordSearch()}
      
      {/* Generic rendering for other types that don't have special image layouts */}
      { section.type !== Subject.COLORIR && 
        section.type !== Subject.RECORTAR &&
        section.type !== ActivityComponent.IMAGEM_PERGUNTAS &&
        section.type !== ActivityComponent.IMAGEM_TEXTO_PERGUNTAS && // Already handled
        section.type !== ActivityComponent.CACA_PALAVRAS && (
          <>
            {renderTextContent(section.textContent)}
            {renderQuestions(section.questions, section.type)}
            
            { section.type === ActivityComponent.ORDENAR_FRASES_EVENTOS &&
              renderOptionsList(section.options)
            }
          </>
      )}
    </div>
  );
};


const GeneratedActivityView: React.FC<GeneratedActivityViewProps> = ({ 
    pages, 
    onDownloadPdf, 
    isGeneratingPdf, 
    onClearResults,
    onSaveActivity,
    isSavingActivity,
    activityName
}) => {
  if (!pages || pages.length === 0) {
    return null;
  }

  const handleSaveClick = () => {
    const defaultName = activityName || `Atividade de ${pages[0]?.structure.subject || 'Geral'} - ${new Date().toLocaleDateString('pt-BR')}`;
    const name = window.prompt("Como deseja nomear esta atividade?", defaultName);
    if (name && name.trim() !== "") {
      onSaveActivity(name.trim());
    }
  };

  return (
    <div className="mt-10">
      <div className="flex flex-wrap justify-between items-center mb-6 px-2 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">
            {activityName ? `Visualizando: ${activityName}` : "Atividade Gerada"}
        </h2>
        <div className="flex items-center gap-3">
            <button
                onClick={handleSaveClick}
                disabled={isSavingActivity || !!activityName} // Disable if already saved (indicated by activityName)
                className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
            {isSavingActivity ? (
                <><LoadingSpinner size="sm" /> Salvando...</>
            ) : activityName ? (
                "Atividade Salva"
            ) : (
                "Salvar Atividade"
            )}
            </button>
            <button
                onClick={onClearResults}
                className="text-sm text-slate-600 hover:text-sky-600 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors"
            >
                {activityName ? "Voltar ao Gerador" : "Limpar e Gerar Nova"}
            </button>
        </div>
      </div>
      
      <div id="pdf-render-area" className="space-y-8">
        {pages.sort((a,b) => a.pageNumber - b.pageNumber).map((page) => (
          <div 
            key={page.id} 
            id={`page-render-${page.id}`} 
            className="page-render-container" 
          >
            <header className="mb-6 text-center border-b pb-3 border-slate-200">
              {page.structure.pageTitle && <h3 className="text-xl font-bold text-sky-800 mb-1">{page.structure.pageTitle}</h3>}
              <p className="text-sm text-slate-500">Matéria: {page.structure.subject} - Página {page.pageNumber}</p>
            </header>
            
            <main>
              {page.structure.sections.map(section => (
                <RenderSection key={section.id} section={section} images={page.images} />
              ))}
            </main>

            <footer className="mt-auto pt-6 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-500">Gerador de Atividade com IA - {page.structure.subject} - Página {page.pageNumber} / {pages.length}</p>
            </footer>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-white rounded-lg shadow-md">
        <button
          onClick={onDownloadPdf}
          disabled={isGeneratingPdf}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isGeneratingPdf ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Gerando PDF...</span>
            </>
          ) : (
            'Baixar PDF da Atividade Completa'
          )}
        </button>
      </div>
    </div>
  );
};

export default GeneratedActivityView;
