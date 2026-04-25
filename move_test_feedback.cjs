const fs = require('fs');

function moveGeneralFeedbackTest(filePath) {
  let data = fs.readFileSync(filePath, 'utf8');

  // Find the generalFeedback block
  const startStr = '            {generalFeedback && (\n              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 space-y-3">';
  const startIdx = data.indexOf(startStr);
  if (startIdx === -1) {
    console.log(`Could not find generalFeedback block in ${filePath}`);
    return;
  }

  // Find the end of the generalFeedback block
  const endStr = '              </motion.div>\n            )}';
  const endIdx = data.indexOf(endStr, startIdx);
  if (endIdx === -1) {
    console.log(`Could not find end of generalFeedback block in ${filePath}`);
    return;
  }

  const block = data.substring(startIdx, endIdx + endStr.length) + '\n';
  
  // Remove the block from its current position
  data = data.substring(0, startIdx) + data.substring(endIdx + endStr.length);

  // Find insertion point, e.g. after the "No interactive questions found for this test."
  let insertMarker = '{task.worksheetQuestions && task.worksheetQuestions.length === 0 && (';
  if (data.indexOf(insertMarker) === -1) {
    console.log(`Could not find insert marker in ${filePath}`);
    return;
  }
  
  const insertMarkerEndStr = '              </div>\n            )}';
  let insertIdx = data.indexOf(insertMarkerEndStr, data.indexOf(insertMarker));
  if (insertIdx !== -1) {
    insertIdx += insertMarkerEndStr.length;
    data = data.substring(0, insertIdx) + '\n' + block + data.substring(insertIdx);
    fs.writeFileSync(filePath, data);
    console.log(`Moved generalFeedback in ${filePath}`);
  } else {
    console.log(`Could not find insert marker end in ${filePath}`);
  }
}

moveGeneralFeedbackTest('src/components/views/TaskTestView.tsx');
