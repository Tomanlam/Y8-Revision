const fs = require('fs');
const path = 'src/components/views/TasksView.tsx';
let data = fs.readFileSync(path, 'utf8');

const worksheetEditRegex = /\{editingTask && \([\s\S]*?<motion\.div \n* *initial=\{\{ opacity: 0[\s\S]*?className="bg-white rounded-\[3rem\] p-6 md:p-12 shadow-xl border-2 border-emerald-100 max-w-6xl w-full mx-auto mb-12 fixed top-1\/4 md:top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 z-50 max-h-\[90vh\] overflow-y-auto flex flex-col"[\s\S]*?<\/motion\.div>\n* *\)\}/;
// Note: previous replace updated it to top-1/2, max-w-6xl. Let me just use a more generic replace.

const replaceGeneric = /\{editingTask && \([\s\S]*?<motion\.div[\s\S]*?className="bg-white rounded-\[3rem\] p-6 md:p-12 shadow-xl border-2 border-emerald-100 max-w-6xl w-full mx-auto mb-12 fixed top-[^"]+"[\s\S]*?<\/motion\.div>\n* *\)\}/;

const worksheetEditReplacement = `{editingTask && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-6 lg:p-10 shadow-xl border-4 border-emerald-50 max-w-6xl w-full mx-auto mb-12 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-h-[95vh] overflow-y-auto flex flex-col"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shrink-0 pb-6 border-b-2 border-gray-50">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 shadow-inner">
                <Plus size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Edit Task Details</h2>
                <p className="text-gray-500 font-medium text-sm">Update the task name, dates, questions, and markscheme.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setEditingTaskQuestionsJson('');
                  setEditingTaskMarkscheme('');
                }}
                className="flex-1 md:flex-none px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-50 border-2 border-transparent transition-colors shadow-sm active:scale-95"
              >
                Discard
              </button>
              <button 
                onClick={async () => {
                 if (onUpdateTask) {
                   let parsedQ = editingTask.worksheetQuestions;
                   try {
                     if (editingTaskQuestionsJson.trim()) {
                       parsedQ = JSON.parse(editingTaskQuestionsJson);
                     } else {
                       parsedQ = [];
                     }
                   } catch(e) { 
                     alert("Invalid JSON for questions. Continuing without modifying questions block."); 
                   }
                   await onUpdateTask(editingTask.id, { 
                     title: editingTask.title, 
                     dueDate: editingTask.dueDate,
                     worksheetQuestions: parsedQ,
                     markschemeContent: editingTaskMarkscheme || undefined
                   });
                 }
                 setEditingTask(null);
                 setEditingTaskQuestionsJson('');
                 setEditingTaskMarkscheme('');
                }}
                className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_4px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
              >
                Save
              </button>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
            {/* Left Column: Properties */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6 shrink-0">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center gap-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Name</label>
                <input 
                  type="text" 
                  value={editingTask.title}
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full p-4 rounded-2xl border-2 border-white font-bold bg-white focus:border-emerald-500 outline-none text-base shadow-sm"
                />
              </div>
              
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center gap-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</label>
                <input 
                  type="date" 
                  value={editingTask.dueDate.split('T')[0]}
                  onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})}
                  className="w-full p-4 rounded-2xl border-2 border-white bg-white font-bold outline-none focus:border-emerald-500 shadow-sm"
                />
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
                  className="w-full flex-1 p-5 rounded-2xl border-2 border-gray-100 font-mono text-[10px] leading-relaxed focus:border-emerald-500 outline-none resize-none custom-scrollbar bg-slate-50/50 shadow-inner"
                  placeholder="[ { id: 'q1', type: 'short-response', ... } ]"
                />
              </div>
              
              <div className="flex-1 flex flex-col h-64 md:h-[400px]">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Markscheme Text/JSON</label>
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
                  className="w-full flex-1 p-5 rounded-2xl border-2 border-gray-100 font-mono text-[10px] leading-relaxed focus:border-emerald-500 outline-none resize-none custom-scrollbar bg-slate-50/50 shadow-inner"
                  placeholder="Content that AI will evaluate against"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}`;

if (!replaceGeneric.test(data)) {
  console.log("Could not find generic Match");
  // Let's try simple match
  const startIdx = data.indexOf('{editingTask && (');
  if (startIdx > -1) {
    const motionDivEnd = data.indexOf('</motion.div>', startIdx) + '</motion.div>'.length;
    const blockEnd = data.indexOf(')}', motionDivEnd) + 2;
    data = data.substring(0, startIdx) + worksheetEditReplacement + data.substring(blockEnd);
    console.log("Replaced with index-based substring");
  } else {
    console.log("Could not find with indexOf either");
  }
} else {
  data = data.replace(replaceGeneric, worksheetEditReplacement);
  console.log("Replaced generic regex match");
}

fs.writeFileSync(path, data);
