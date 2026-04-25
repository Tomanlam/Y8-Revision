const fs = require('fs');
const path = 'src/components/views/TasksView.tsx';
let data = fs.readFileSync(path, 'utf8');

const testEditRegex = /<h2 className="text-3xl font-black text-center text-gray-800 uppercase tracking-tight">\s*\{isAdmin \? 'Assessment Controls' : 'Secure Assessment'\}\s*<\/h2>[\s\S]*?Save Questions & Markscheme\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/;

const testEditReplacement = `<h2 className="text-3xl font-black text-center text-gray-800 uppercase tracking-tight">
                  {isAdmin ? 'Assessment Controls' : 'Secure Assessment'}
                </h2>
              </div>
              
              {isAdmin ? (
                <div className="flex flex-col lg:flex-row gap-6 mb-8">
                  {/* Left Column: Properties */}
                  <div className="w-full lg:w-1/3 flex flex-col gap-4 shrink-0">
                  {/* Title Edit */}
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Test Title</span>
                    {isEditingTestTitle ? (
                       <div className="flex gap-2 w-full">
                         <input 
                           type="text"
                           value={editedTestTitle}
                           onChange={(e) => setEditedTestTitle(e.target.value)}
                           className="flex-1 text-center font-bold p-2 rounded-xl border-2 border-emerald-200 outline-none text-sm"
                           autoFocus
                         />
                         <button 
                           onClick={async () => {
                             if (onUpdateTask && selectedTaskForPasscode && editedTestTitle.trim()) {
                               await onUpdateTask(selectedTaskForPasscode.id, { title: editedTestTitle.trim() });
                               setSelectedTaskForPasscode({...selectedTaskForPasscode, title: editedTestTitle.trim()});
                               setIsEditingTestTitle(false);
                             }
                           }}
                           className="bg-emerald-500 text-white px-4 rounded-xl font-bold text-xs shadow-sm transition-transform active:scale-95"
                         >
                           Save
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 w-full justify-between group">
                         <span className="text-lg font-black text-gray-800 text-center flex-1 truncate">{selectedTaskForPasscode.title}</span>
                         <button 
                           onClick={() => {
                             setEditedTestTitle(selectedTaskForPasscode.title);
                             setIsEditingTestTitle(true);
                           }}
                           className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-emerald-500 transition-colors shrink-0 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                         >
                           <Edit size={16} />
                         </button>
                       </div>
                     )}
                  </div>

                  {/* Passcode Edit */}
                  <div className="bg-red-50 p-4 rounded-3xl border border-red-100 flex flex-col items-center justify-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Live Passcode</span>
                     {isEditingPasscode ? (
                       <div className="flex gap-2 w-full">
                         <input 
                           type="text"
                           value={editedPasscodeValue}
                           onChange={(e) => setEditedPasscodeValue(e.target.value.toUpperCase())}
                           className="flex-1 text-center font-black p-2 rounded-xl border-2 border-red-200 outline-none uppercase text-sm"
                           autoFocus
                         />
                         <button 
                           onClick={async () => {
                             if (onUpdateTask && selectedTaskForPasscode) {
                               await onUpdateTask(selectedTaskForPasscode.id, { passcode: editedPasscodeValue });
                               setSelectedTaskForPasscode({...selectedTaskForPasscode, passcode: editedPasscodeValue});
                               setIsEditingPasscode(false);
                             }
                           }}
                           className="bg-red-500 text-white px-4 rounded-xl font-bold text-xs shadow-sm transition-transform active:scale-95"
                         >
                           Save
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 group justify-between w-full">
                         <span className={\`text-2xl font-black text-red-600 tracking-tighter flex-1 text-center transition-all duration-300 \${!showPasscode ? 'blur-md opacity-70 select-none' : 'blur-none opacity-100'}\`}>
                           {selectedTaskForPasscode.passcode}
                         </span>
                         <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setShowPasscode(!showPasscode)}
                              className="p-2 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
                            >
                              <Eye size={16} className={showPasscode ? '' : 'opacity-40'} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditedPasscodeValue(selectedTaskForPasscode.passcode || '');
                                setIsEditingPasscode(true);
                              }}
                              className="p-2 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                         </div>
                       </div>
                     )}
                  </div>

                  {/* Due Date Edit */}
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Due Date</span>
                    {isEditingTestDate ? (
                       <div className="flex gap-2 w-full">
                         <input 
                           type="date"
                           value={editedTestDate}
                           onChange={(e) => setEditedTestDate(e.target.value)}
                           className="flex-1 text-center font-bold p-2 rounded-xl border-2 border-emerald-200 outline-none text-sm"
                           autoFocus
                         />
                         <button 
                           onClick={async () => {
                             if (onUpdateTask && selectedTaskForPasscode && editedTestDate) {
                               await onUpdateTask(selectedTaskForPasscode.id, { dueDate: editedTestDate });
                               setSelectedTaskForPasscode({...selectedTaskForPasscode, dueDate: editedTestDate});
                               setIsEditingTestDate(false);
                             }
                           }}
                           className="bg-emerald-500 text-white px-4 rounded-xl font-bold text-xs shadow-sm transition-transform active:scale-95"
                         >
                           Save
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 justify-between w-full group">
                         <span className="text-lg font-black text-gray-800 text-center flex-1">
                           {format(selectedTaskForPasscode.dueDate.includes('T') ? parseISO(selectedTaskForPasscode.dueDate) : new Date(selectedTaskForPasscode.dueDate + 'T00:00:00'), 'MMM d, yyyy')}
                         </span>
                         <button 
                           onClick={() => {
                             setEditedTestDate(selectedTaskForPasscode.dueDate.split('T')[0]);
                             setIsEditingTestDate(true);
                           }}
                           className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-emerald-500 transition-colors shrink-0 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                         >
                           <Edit size={16} />
                         </button>
                       </div>
                     )}
                  </div>
                  
                  {/* Time Limit Edit */}
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-2 mb-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Time Limit</span>
                    <div className="flex items-center justify-center w-full gap-4">
                      <button 
                        onClick={() => {
                          const newLimit = (selectedTaskForPasscode.timeLimit || 60) - 5;
                          if (newLimit > 0 && onUpdateTask) {
                            onUpdateTask(selectedTaskForPasscode.id, { timeLimit: newLimit });
                            setSelectedTaskForPasscode({...selectedTaskForPasscode, timeLimit: newLimit});
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg font-bold shrink-0 shadow-sm active:scale-95"
                      >
                        -
                      </button>
                      <span className="text-2xl font-black text-gray-800 w-16 text-center">{selectedTaskForPasscode.timeLimit}m</span>
                      <button 
                        onClick={() => {
                          const newLimit = (selectedTaskForPasscode.timeLimit || 60) + 5;
                          if (onUpdateTask) {
                            onUpdateTask(selectedTaskForPasscode.id, { timeLimit: newLimit });
                            setSelectedTaskForPasscode({...selectedTaskForPasscode, timeLimit: newLimit});
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg font-bold shrink-0 shadow-sm active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  </div>
                  {/* Right Column: JSON Configs */}
                  <div className="w-full lg:w-2/3 flex flex-col md:flex-row gap-6 min-h-0">
                    <div className="flex-1 flex flex-col h-64 md:h-[400px]">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Questions JSON</label>
                        <button 
                          onClick={() => {
                             navigator.clipboard.writeText(\`Generate a balanced set of 10 questions in JSON format. include MCQ, Short Response, and Table types. use IDs like "test_\${Date.now()}_q1".\\n1. "mcq" (requires "options": array of strings)\\n2. "short-response"\\n3. "table" (requires "tableData": 2D array of strings. Use "" for cells where user input is required, and pre-fill other cells with headers or data.)\\n4. "tick-cross" (binary selection of ✓ or ✕)\\n5. "reorder" (requires "items": array of strings in random initial order)\\nOutput a STRICT JSON array.\`);
                             alert('Prompt Copied!');
                          }}
                          className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                        >
                          <Copy size={12} /> Prompt
                        </button>
                      </div>
                      <textarea 
                        value={editingTaskQuestionsJson}
                        onChange={e => setEditingTaskQuestionsJson(e.target.value)}
                        className="w-full flex-1 p-4 rounded-2xl border-2 border-gray-100 font-mono text-[10px] leading-relaxed focus:border-red-500 outline-none resize-none custom-scrollbar bg-slate-50/50 shadow-inner"
                        placeholder="[ { id: 'q1', type: 'short-response', ... } ]"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col h-64 md:h-[400px]">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Markscheme</label>
                        <button 
                          onClick={() => {
                             navigator.clipboard.writeText(\`Generate a markscheme for the provided questions. It should contain detailed criteria for each question to guide the grading process.\`);
                             alert('Prompt Copied!');
                          }}
                          className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                        >
                          <Copy size={12} /> Prompt
                        </button>
                      </div>
                      <textarea 
                        value={editingTaskMarkscheme}
                        onChange={e => setEditingTaskMarkscheme(e.target.value)}
                        className="w-full flex-1 p-4 rounded-2xl border-2 border-gray-100 font-mono text-[10px] leading-relaxed focus:border-red-500 outline-none resize-none custom-scrollbar bg-slate-50/50 shadow-inner"
                        placeholder="Content that AI will evaluate against"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 w-full">
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
                        }
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-2xl font-black tracking-widest uppercase text-xs shadow-[0_4px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
                    >
                      Save Questions & Markscheme
                    </button>
                </div>
              </div>`;

if (!testEditRegex.test(data)) {
  console.log("Could not find Test Edit regex match.");
} else {
  data = data.replace(testEditRegex, testEditReplacement);
  console.log("Replaced Test Edit");
}

fs.writeFileSync(path, data);
