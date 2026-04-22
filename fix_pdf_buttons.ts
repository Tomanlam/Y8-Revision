import fs from 'fs';
const path = 'src/components/views/TasksView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                            <div className="flex flex-col gap-2 mt-auto">
                              {onViewSubmission && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewSubmission(sub, task);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_4px_0_0_#2563eb] active:shadow-none active:translate-y-1 transition-all"
                                >
                                  <Eye size={16} />
                                  Check response
                                </button>
                              )}
                              
                              <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateResponsePDF(sub, task);
                                  }}
                                  className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all"
                                >
                                  <FileText size={14} />
                                  PDF
                                </button>
                                {isAdmin && onDeleteSubmission && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSubmission(sub.id);
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-red-100 hover:bg-red-100 hover:border-red-200 transition-all"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>`;

const replacement = `                            <div className="flex flex-col gap-2 mt-auto">
                              {onViewSubmission && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewSubmission(sub, task);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_4px_0_0_#2563eb] active:shadow-none active:translate-y-1 transition-all"
                                >
                                  <Eye size={16} />
                                  Check response
                                </button>
                              )}
                              
                              <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateResponsePDF(sub, task, false);
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-emerald-100 hover:bg-emerald-100 transition-all"
                                  >
                                    <FileText size={14} />
                                    Student PDF
                                  </button>
                                  {sub.feedback ? (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        generateResponsePDF(sub, task, true);
                                      }}
                                      className="flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-600 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-amber-100 hover:bg-amber-100 transition-all shadow-sm"
                                    >
                                      <FileText size={14} />
                                      Marked Report
                                    </button>
                                  ) : (
                                    <div className="flex items-center justify-center py-3 bg-gray-50 text-gray-300 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-gray-100 italic">
                                      Not Graded
                                    </div>
                                  )}
                                </div>

                                {isAdmin && onDeleteSubmission && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSubmission(sub.id);
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-red-100 hover:bg-red-100 hover:border-red-200 transition-all w-full"
                                  >
                                    <Trash2 size={14} />
                                    Delete Submission
                                  </button>
                                )}
                              </div>
                            </div>`;

// Use simple string replacement (risky if not exact but manual checking suggests it's close)
if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log("Success");
} else {
    // Try without trailing space/special chars if indentation is weird
    console.log("Target not found exactly");
}
