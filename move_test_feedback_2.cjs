const fs = require('fs');

function moveGeneralFeedbackTestManual(filePath) {
  let data = fs.readFileSync(filePath, 'utf8');

  // Find the generalFeedback block
  const startStr = '            {generalFeedback && (\n              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 space-y-3">';
  const startIdx = data.indexOf(startStr);
  if (startIdx === -1) {
    console.log(`Could not find generalFeedback block in ${filePath}`);
    return;
  }

  const endStr = '              </motion.div>\n            )}\n\n';
  let endIdx = data.indexOf(endStr, startIdx);
  if (endIdx === -1) {
    console.log(`Could not find end of generalFeedback block in ${filePath}`);
    return;
  }
  
  const block = data.substring(startIdx, endIdx + endStr.length) + '\n';
  
  data = data.substring(0, startIdx) + data.substring(endIdx + endStr.length);
  
  // Find insertion point, which is after mapping questionsByPage:
  /*
  871:               );
  872:             })}
  873:           </div>
  */
  
  const insertMarker = '                </div>\n              );\n            })}';
  const insertIdx = data.indexOf(insertMarker);
  
  if (insertIdx !== -1) {
    const afterInsertIdx = insertIdx + insertMarker.length;
    data = data.substring(0, afterInsertIdx) + '\n\n' + block + data.substring(afterInsertIdx);
    fs.writeFileSync(filePath, data);
    console.log(`Successfully moved generalFeedback in ${filePath}`);
  } else {
    console.log('Could not find insert marker!');
  }
}

moveGeneralFeedbackTestManual('src/components/views/TaskTestView.tsx');
