const fs = require('fs');
const path = 'src/components/views/TasksView.tsx';
let data = fs.readFileSync(path, 'utf8');

// For "Assessment Controls" (admin) lines
// We find it by looking for "Assessment Controls"
const testEditRegex = /<h2 className="text-3xl font-black text-center text-gray-800 uppercase tracking-tight">\s*\{isAdmin \? 'Assessment Controls' : 'Secure Assessment'\}\s*<\/h2>[\s\S]*?className="bg-red-50 text-red-600 px-6 py-4 rounded-3xl font-black uppercase tracking-widest hover:bg-red-100 transition-colors shadow-sm active:scale-95"\s*>\s*Close\s*<\/button>\s*<\/div>\s*<\/div>\s*\)\s*:\s*\([\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/motion\.div>/;

// For "Edit Task Details" lines
const worksheetEditRegex = /\{editingTask && \([\s\S]*?<motion\.div \n* *initial=\{\{ opacity: 0[\s\S]*?className="bg-white rounded-\[3rem\] p-6 md:p-12 shadow-xl border-2 border-emerald-100 max-w-2xl w-full mx-auto mb-12 fixed top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 z-50 max-h-\[90vh\] overflow-y-auto"[\s\S]*?<\/motion\.div>\n* *\)\}/;

const newWorksheetEdit = `{editingTask && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-6 md:p-12 shadow-xl border-2 border-emerald-100 max-w-6xl w-full mx-auto mb-12 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-h-[90vh] overflow-y-auto flex flex-col"
        >
          <div className="flex items-center gap-6 mb-8 shrink-0">
            <div className="w-16 h-16 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-inner">
              <Plus size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Edit Task Details</h2>
              <p className="text-gray-500 font-medium">Update the task name, dates, questions, and markscheme.</p>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-12 flex-1 min-h-0">
            {/* Left Column: Properties */}
            <div className="w-full lg:w-1/3 space-y-6 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Task Name</label>
                  <input 
                    type="text" 
                    value={editingTask.title}
                    onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold focus:border-emerald-500 outline-none text-xl"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Due Date</label>
                  <input 
                    type="date" 
                    value={editingTask.dueDate.split('T')[0]}
                    onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row gap-4 mt-auto">
                <button 
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="flex-1 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50 border-2 border-transparent transition-colors"
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
                  }}
                  className="flex-1 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Right Column: JSON Configs */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6 min-h-0">
              <div className="flex-1 flex flex-col min-h-[300px]">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Questions JSON</label>
                <textarea 
                  value={editingTaskQuestionsJson}
                  onChange={e => setEditingTaskQuestionsJson(e.target.value)}
                  className="w-full flex-1 p-6 rounded-2xl border-2 border-gray-100 font-mono text-[10px] sm:text-xs leading-relaxed focus:border-emerald-500 outline-none resize-none custom-scrollbar bg-slate-50/50"
                  placeholder="[ { id: 'q1', type: 'short-response', ... } ]"
                />
              </div>
              
              <div className="flex-1 flex flex-col min-h-[300px]">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Markscheme Text/JSON</label>
                <textarea 
                  value={editingTaskMarkscheme}
                  onChange={e => setEditingTaskMarkscheme(e.target.value)}
                  className="w-full flex-1 p-6 rounded-2xl border-2 border-gray-100 font-mono text-[10px] sm:text-xs leading-relaxed focus:border-emerald-500 outline-none resize-none custom-scrollbar bg-slate-50/50"
                  placeholder="Content that AI will evaluate against"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}`;

if (!worksheetEditRegex.test(data)) {
  console.log("Could not find Edit Task Details regex match.");
} else {
  data = data.replace(worksheetEditRegex, newWorksheetEdit);
  console.log("Replaced Edit Task Details");
}

fs.writeFileSync(path, data);
