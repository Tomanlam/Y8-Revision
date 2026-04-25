const fs = require('fs');

function updateTaskView(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add onProgress prop
  if (!content.includes('onProgress: (')) {
    content = content.replace(
      'onComplete: (responses: Record<string, any>, results?: any) => void;',
      'onComplete: (responses: Record<string, any>, results?: any) => void;\n  onProgress?: (partialResults: any) => Promise<void>;'
    );
  }

  if (content.includes('onComplete, initialResponses')) {
      content = content.replace(
        'onComplete, initialResponses',
        'onComplete, onProgress, initialResponses'
      );
  }

  // Update findMatch for cleaner rubric extraction
  const findMatchRegex = /function findMatch\(obj\) \{[\s\S]*?foundVal = findMatch\(parsedMarkscheme\);/m;
  const newFindMatch = `let foundVal = null;
          if (Array.isArray(parsedMarkscheme)) {
             foundVal = parsedMarkscheme.find(item => {
               if (item && item.id && typeof item.id === 'string') {
                  const itemIdLower = item.id.toLowerCase();
                  return itemIdLower === lowerId || itemIdLower.endsWith('_' + suffix) || itemIdLower === suffix;
               }
               return false;
             });
          }

          if (!foundVal) {
             function findMatchFallback(obj) {
                if (!obj || typeof obj !== 'object') return null;
                if (Array.isArray(obj)) {
                   for(let item of obj) {
                      const res = findMatchFallback(item);
                      if (res) return res;
                   }
                } else {
                   if (obj.id && typeof obj.id === 'string') {
                      const objIdLower = obj.id.toLowerCase();
                      if (objIdLower === lowerId || objIdLower.endsWith('_' + suffix) || objIdLower === suffix) {
                         return obj;
                      }
                   }
                   for (const key of Object.keys(obj)) {
                      const lowerK = key.toLowerCase();
                      if (lowerK === lowerId || lowerK.endsWith('_' + suffix) || lowerK === suffix) {
                         return obj[key];
                      }
                   }
                   for (const key of Object.keys(obj)) {
                      if (typeof obj[key] === 'object') {
                         const res = findMatchFallback(obj[key]);
                         if (res) return res;
                      }
                   }
                }
                return null;
             }
             foundVal = findMatchFallback(parsedMarkscheme);
          }`;
  content = content.replace(findMatchRegex, newFindMatch);

  // Add progressive saving to grading loop
  const gradeLoopEndRegex = /setValidationFeedback\(prev => \(\{ \.\.\.prev, \[q\.id\]: parsed \}\)\);\n         \}/g;
  const newGradeLoopEnd = `setValidationFeedback(prev => ({ ...prev, [q.id]: parsed }));
           if (onProgress) {
              await onProgress({ feedback: currentFeedback });
           }
         }`;
  content = content.replace(gradeLoopEndRegex, newGradeLoopEnd);

  const gradeLoopCatchRegex = /setValidationFeedback\(prev => \(\{ \.\.\.prev, \[q\.id\]: currentFeedback\[q\.id\] \}\)\);\n       \}/g;
  const newGradeLoopCatch = `setValidationFeedback(prev => ({ ...prev, [q.id]: currentFeedback[q.id] }));
          if (onProgress) {
             await onProgress({ feedback: currentFeedback });
          }
       }`;
  content = content.replace(gradeLoopCatchRegex, newGradeLoopCatch);


  fs.writeFileSync(filePath, content);
}

updateTaskView('./src/components/views/TaskTestView.tsx');
updateTaskView('./src/components/views/TaskWorksheetView.tsx');
