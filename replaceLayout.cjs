const fs = require('fs');

const path = 'src/components/views/TasksView.tsx';
let data = fs.readFileSync(path, 'utf8');

const regex = /<motion\.div[\s\S]*?className="bg-white rounded-\[3rem\] p-6 md:p-12 shadow-xl border-2 border-emerald-100 max-w-2xl w-full mx-auto mb-12 fixed top-\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 z-50 max-h-\[90vh\] overflow-y-auto"[\s\S]*?<div className="flex items-center gap-6 mb-8">[\s\S]*?<h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Edit Task Details<\/h2>[\s\S]*?<p className="text-gray-500 font-medium">Update the task name or due date instantly\.<\/p>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<div className="space-y-6">[\s\S]*?<div className="space-y-4">[\s\S]*?<label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Task Name<\/label>[\s\S]*?<input \n\s*type="text" \n\s*value={editingTask\.title}[\s\S]*?onChange={e => setEditingTask\(\{\.\.\.editingTask, title: e\.target\.value\}\)}[\s\S]*?className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold focus:border-emerald-500 outline-none text-xl"[\s\S]*?\/>[\s\S]*?<\/div>[\s\S]*?<div className="space-y-4">[\s\S]*?<label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Due Date<\/label>[\s\S]*?<input \n\s*type="date" \n\s*value={editingTask\.dueDate\.split\('T'\)\[0\]}[\s\S]*?onChange={e => setEditingTask\(\{\.\.\.editingTask, dueDate: e\.target\.value\}\)}[\s\S]*?className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none focus:border-emerald-500"[\s\S]*?\/>[\s\S]*?<\/div>[\s\S]*?<div className="grid grid-cols-1 md:grid-cols-2 gap-4">[\s\S]*?<div className="space-y-2">[\s\S]*?<label className="block text-\[10px\] font-black text-gray-400 uppercase tracking-widest text-center">Questions JSON<\/label>[\s\S]*?<textarea \n\s*value={editingTaskQuestionsJson}[\s\S]*?onChange={e => setEditingTaskQuestionsJson\(e\.target\.value\)}[\s\S]*?className="w-full pl-4 p-4 rounded-2xl border-2 border-gray-100 font-mono text-\[10px\] focus:border-emerald-500 outline-none h-24 resize-y"[\s\S]*?placeholder="\[ \{ id: 'q1', type: 'short-response', \.\.\. \} \]"[\s\S]*?\/>[\s\S]*?<\/div>[\s\S]*?<div className="space-y-2">[\s\S]*?<label className="block text-\[10px\] font-black text-gray-400 uppercase tracking-widest text-center">Markscheme Text\/JSON<\/label>[\s\S]*?<textarea \n\s*value={editingTaskMarkscheme}[\s\S]*?onChange={e => setEditingTaskMarkscheme\(e\.target\.value\)}[\s\S]*?className="w-full pl-4 p-4 rounded-2xl border-2 border-gray-100 font-mono text-\[10px\] focus:border-emerald-500 outline-none h-24 resize-y"[\s\S]*?placeholder="Content that AI will evaluate against"[\s\S]*?\/>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<div className="flex justify-end gap-4 mt-8">[\s\S]*?<button \n\s*type="button"[\s\S]*?onClick=\{\(\) => \{\n\s*setEditingTask\(null\);\n\s*setEditingTaskQuestionsJson\(''\);\n\s*setEditingTaskMarkscheme\(''\);\n\s*\}\}[\s\S]*?className="px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50"[\s\S]*?>[\s\S]*?Cancel[\s\S]*?<\/button>[\s\S]*?<button \n\s*type="button"[\s\S]*?onClick={async \(\) => \{\n\s*await updateTask\(editingTask\.id, \{ \n\s*title: editingTask\.title, \n\s*dueDate: editingTask\.dueDate,\n\s*worksheetQuestions: editingTaskQuestionsJson \? JSON\.parse\(editingTaskQuestionsJson\) : undefined,\n\s*markschemeContent: editingTaskMarkscheme \|\| undefined\n\s*\}\);\n\s*setEditingTask\(null\);\n\s*setEditingTaskQuestionsJson\(''\);\n\s*setEditingTaskMarkscheme\(''\);\n\s*\}\}[\s\S]*?className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-\[0_6px_0_0_#059669\] active:translate-y-1 active:shadow-none transition-all"[\s\S]*?>[\s\S]*?Save Changes[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/motion\.div>/;

const replacement = `<motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-6 md:p-12 shadow-xl border-2 border-emerald-100 max-w-5xl w-full mx-auto mb-12 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-inner">
              <Plus size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Edit Task Details</h2>
              <p className="text-gray-500 font-medium">Update the task name, dates, questions, and markscheme.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6 flex flex-col justify-between">
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

              <div className="pt-8 flex gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setEditingTaskQuestionsJson('');
                    setEditingTaskMarkscheme('');
                  }}
                  className="flex-1 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    await updateTask(editingTask.id, { 
                      title: editingTask.title, 
                      dueDate: editingTask.dueDate,
                      worksheetQuestions: editingTaskQuestionsJson ? JSON.parse(editingTaskQuestionsJson) : undefined,
                      markschemeContent: editingTaskMarkscheme || undefined
                    });
                    setEditingTask(null);
                    setEditingTaskQuestionsJson('');
                    setEditingTaskMarkscheme('');
                  }}
                  className="flex-1 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Questions JSON</label>
                <textarea 
                  value={editingTaskQuestionsJson}
                  onChange={e => setEditingTaskQuestionsJson(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 font-mono text-[10px] focus:border-emerald-500 outline-none h-[180px] resize-none custom-scrollbar bg-slate-50"
                  placeholder="[ { id: 'q1', type: 'short-response', ... } ]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Markscheme Text/JSON</label>
                <textarea 
                  value={editingTaskMarkscheme}
                  onChange={e => setEditingTaskMarkscheme(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 font-mono text-[10px] focus:border-emerald-500 outline-none h-[180px] resize-none custom-scrollbar bg-slate-50"
                  placeholder="Content that AI will evaluate against"
                />
              </div>
            </div>
          </div>
        </motion.div>`;

data = data.replace(regex, replacement);
data = data.replace(/\$\{submission.results.score\} \/ \$\{submission.results.total\}/g, '${submission.results.score} of ${submission.results.total}');
data = data.replace(/\$\{sub.results\?.score\} \/ \$\{sub.results\?.total\}/g, '${sub.results?.score} of ${sub.results?.total}');

fs.writeFileSync(path, data);
console.log('done rewriting editing task view');
