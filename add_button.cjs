const fs = require('fs');

const path = 'src/components/views/TasksView.tsx';
let data = fs.readFileSync(path, 'utf8');

const regex = /<button[\s\S]*?<Download size=\{10\} \/> Graded Reports\s*<\/button>/;

if (regex.test(data)) {
   const insertButton = `
                        {ungradedCount > 0 && typeof doBatchGrade === 'function' && (
                          <button
                            onClick={() => doBatchGrade(task, filteredSubs)}
                            disabled={batchGradingTask !== null}
                            className={\`text-[9px] uppercase font-black tracking-widest \${batchGradingTask === task.id ? 'text-orange-600 bg-orange-50/50' : 'text-purple-600 bg-purple-50/50 border-purple-100 hover:bg-purple-100'} px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border\`}
                          >
                            {batchGradingTask === task.id ? (
                              <><div className="w-3 h-3 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" /> Grading...</>
                            ) : (
                              <><Target size={10} /> Batch Grade</>
                            )}
                          </button>
                        )}`;
   data = data.replace(regex, (match) => match + insertButton);
   fs.writeFileSync(path, data);
   console.log('Added batch grade button');
} else {
   console.log('Failed to match');
}
