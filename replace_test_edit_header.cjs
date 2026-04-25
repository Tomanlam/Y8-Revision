const fs = require('fs');

const path = 'src/components/views/TasksView.tsx';
let data = fs.readFileSync(path, 'utf8');

const regex = /className=\{\`bg-white rounded-\[2\.5rem\] p-10 \$\{isAdmin \? 'max-w-6xl flex flex-col max-h-\[90vh\]' : 'max-w-md'\} w-full shadow-2xl border-4 border-red-50\`\}\n\s*>\n\s*<div className="flex flex-col items-center mb-8">\n\s*<div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center text-red-500 shadow-inner mb-4">\n\s*<Lock size=\{40\} className="animate-bounce" \/>\n\s*<\/div>\n\s*<h2 className="text-3xl font-black text-center text-gray-800 uppercase tracking-tight">\n\s*\{isAdmin \? 'Assessment Controls' : 'Secure Assessment'\}\n\s*<\/h2>\n\s*<\/div>\n\s*\{isAdmin \? \(\n\s*<>\n\s*<div className="flex flex-col lg:flex-row gap-6 mb-8">/;

const replacement = `className={\`bg-white \${isAdmin ? 'rounded-[3rem] p-6 lg:p-10 shadow-xl border-4 border-red-50 max-w-6xl flex flex-col max-h-[95vh] w-full' : 'rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border-4 border-red-50'}\`}
            >
              {isAdmin ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shrink-0 pb-6 border-b-2 border-gray-50">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-red-50 rounded-[1.5rem] flex items-center justify-center text-red-500 shadow-inner">
                      <Lock size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Assessment Controls</h2>
                      <p className="text-gray-500 font-medium text-sm">Update the test name, passcodes, questions, and markscheme.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsPasscodeModalOpen(false);
                        setSelectedTaskForPasscode(null);
                        setPasscode('');
                        setPasscodeError(false);
                        setEditingTaskQuestionsJson('');
                        setEditingTaskMarkscheme('');
                      }}
                      className="flex-1 md:flex-none px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-50 border-2 border-transparent transition-colors shadow-sm active:scale-95"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={async () => {
                        if (onUpdateTask && selectedTaskForPasscode) {
                          let parsedQ = selectedTaskForPasscode.worksheetQuestions;
                          try {
                            if (editingTaskQuestionsJson.trim()) {
                              parsedQ = JSON.parse(editingTaskQuestionsJson);
                            } else {
                              parsedQ = [];
                            }
                          } catch(e) { 
                            alert("Invalid JSON for questions. Saving other changes only."); 
                          }
                          await onUpdateTask(selectedTaskForPasscode.id, { 
                            worksheetQuestions: parsedQ,
                            markschemeContent: editingTaskMarkscheme || undefined
                          });
                          setSelectedTaskForPasscode({...selectedTaskForPasscode, worksheetQuestions: parsedQ, markschemeContent: editingTaskMarkscheme});
                          alert("Content Updated!");
                          
                          setIsPasscodeModalOpen(false);
                          setSelectedTaskForPasscode(null);
                          setEditingTaskQuestionsJson('');
                          setEditingTaskMarkscheme('');
                        }
                      }}
                      className="flex-1 md:flex-none bg-red-500 hover:bg-red-400 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_4px_0_0_#ef4444] active:translate-y-1 active:shadow-none transition-all"
                    >
                      Save Questions & Markscheme
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center mb-8">
                  <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center text-red-500 shadow-inner mb-4">
                    <Lock size={40} className="animate-bounce" />
                  </div>
                  <h2 className="text-3xl font-black text-center text-gray-800 uppercase tracking-tight">
                    Secure Assessment
                  </h2>
                </div>
              )}
              
              {isAdmin ? (
                <>
                <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 mb-8">`;

if (regex.test(data)) {
   data = data.replace(regex, replacement);
   
   // remove the old save buttons at bottom
   const bottomRegex = /<div className="flex justify-end gap-4 w-full">\s*<button[\s\S]*?Save Questions & Markscheme\s*<\/button>\s*<\/div>/m;
   data = data.replace(bottomRegex, '');
   
   fs.writeFileSync(path, data);
   console.log('Replaced Test Edit modal styles');
} else {
    console.log('Match not found!');
}
