const fs = require('fs');
const path = 'src/components/views/TasksView.tsx';
let data = fs.readFileSync(path, 'utf8');

// The main parent grid for assessment controls
data = data.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">',
  '<div className="flex flex-col lg:flex-row gap-8 mb-8">'
);

// Group the first 4 items into the Left Column
data = data.replace(
  '{/* Title Edit */}',
  '<div className="w-full lg:w-1/3 flex flex-col gap-4 shrink-0">\n                  {/* Title Edit */}'
);

// End of Time Limit Edit block is right before Questions JSON block
data = data.replace(
  '<div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">',
  '</div>\n                  {/* Right Column: JSON Configs */}\n                  <div className="w-full lg:w-2/3 flex flex-col gap-6 min-h-0">'
);

// Change Questions JSON container 
data = data.replace(
  '<div className="space-y-2">\n                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Questions JSON</label>\n                      <textarea \n                        value={editingTaskQuestionsJson}\n                        onChange={e => setEditingTaskQuestionsJson(e.target.value)}\n                        className="w-full pl-4 p-4 rounded-2xl border-2 border-gray-100 font-mono text-[10px] focus:border-emerald-500 outline-none h-24 resize-y"\n                        placeholder="[ { id: \'q1\', type: \'short-response\', ... } ]"\n                      />\n                    </div>',
  '<div className="flex-1 flex flex-col min-h-[300px]">\n                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Questions JSON</label>\n                      <textarea \n                        value={editingTaskQuestionsJson}\n                        onChange={e => setEditingTaskQuestionsJson(e.target.value)}\n                        className="w-full flex-1 p-6 rounded-2xl border-2 border-gray-100 font-mono text-[10px] sm:text-xs leading-relaxed focus:border-red-500 outline-none resize-none custom-scrollbar bg-slate-50/50"\n                        placeholder="[ { id: \'q1\', type: \'short-response\', ... } ]"\n                      />\n                    </div>'
);

data = data.replace(
  '<div className="space-y-2">\n                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Markscheme Text/JSON</label>\n                      <textarea \n                        value={editingTaskMarkscheme}\n                        onChange={e => setEditingTaskMarkscheme(e.target.value)}\n                        className="w-full pl-4 p-4 rounded-2xl border-2 border-gray-100 font-mono text-[10px] focus:border-emerald-500 outline-none h-24 resize-y"\n                        placeholder="Content that AI will evaluate against"\n                      />\n                    </div>',
  '<div className="flex-1 flex flex-col min-h-[300px]">\n                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Markscheme Text/JSON</label>\n                      <textarea \n                        value={editingTaskMarkscheme}\n                        onChange={e => setEditingTaskMarkscheme(e.target.value)}\n                        className="w-full flex-1 p-6 rounded-2xl border-2 border-gray-100 font-mono text-[10px] sm:text-xs leading-relaxed focus:border-red-500 outline-none resize-none custom-scrollbar bg-slate-50/50"\n                        placeholder="Content that AI will evaluate against"\n                      />\n                    </div>'
);

// For the Save Questions button, remove the col-span wrap, it’s already in our flex column
data = data.replace(
  /<div className="col-span-1 md:col-span-2">\n                    <button \n                      onClick=\{\s*async \(\) =>/g,
  '<button \n                      onClick={async () =>'
);

data = data.replace(
  /Save Questions & Markscheme\n                    <\/button>\n                  <\/div>/g,
  'Save Questions & Markscheme\n                    </button>'
);

// We need to also expand the modal width so there's enough room for left and right pane.
data = data.replace(
  /className=\{`bg-white rounded-\[2\.5rem\] p-10 \$\{isAdmin \? 'max-w-4xl' : 'max-w-md'\} w-full shadow-2xl border-4 border-red-50`\}/,
  'className={`bg-white rounded-[2.5rem] p-10 ${isAdmin ? \'max-w-6xl flex flex-col max-h-[90vh]\' : \'max-w-md\'} w-full shadow-2xl border-4 border-red-50`}'
);

fs.writeFileSync(path, data);
console.log("Rewrote Assessment Controls layout");
