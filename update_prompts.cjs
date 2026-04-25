const fs = require('fs');

function updatePrompt(filePath) {
  let data = fs.readFileSync(filePath, 'utf8');

  // We need to inject formattedResponses logic before the prompt and update the prompt

  const responsesRegex = /\$\{Object\.entries\(responses\)\.map\(\(\[id, req\]\) => \`\$\{id\}: \$\{req\}\`\)\.join\('\\n'\)\}/g;
  
  const mappedResponsesStr = `        const formattedResponses = Object.entries(responses)
          .map(([id, req]) => {
            let textReq = req;
            if (typeof req === 'string' && req.trim() === '') textReq = "[NO RESPONSE PROVIDED]";
            else if (req === undefined || req === null) textReq = "[NO RESPONSE PROVIDED]";
            else if (Array.isArray(req) && req.length === 0) textReq = "[NO RESPONSE PROVIDED]";
            else if (typeof req === 'object' && !Array.isArray(req) && Object.keys(req).length === 0) textReq = "[NO RESPONSE PROVIDED]";
            return \`\${id}: \${textReq}\`;
          }).join('\\n');

        const prompt = \`Grade this student submission.\n`;
  
  if (filePath.includes('TaskWorksheetView.tsx')) {
    const promptStart = '        const prompt = `Grade this student submission for the worksheet "${task.title}".';
    const promptEnd = '        5. The JSON must have an array of "questions" and a string "generalFeedback" for the Overall comments. Return ONLY valid JSON.`;';
    
    const startIdx = data.indexOf(promptStart);
    const endIdx = data.indexOf(promptEnd) + promptEnd.length;
    
    if (startIdx !== -1 && endIdx !== -1) {
     const replacement = `${mappedResponsesStr}
        CRITICAL INSTRUCTION: You must provide specific, detailed feedback for EVERY SINGLE QUESTION. Do NOT generate generic fallback messages like "Detailed feedback provided in report."

        GRADING LOGIC:
        You MUST strictly grade the student's response against the MARKSCHEME/RUBRIC provided below. Evaluate each question 1-to-1 against this rubric.

        - IF RESPONSE IS "[NO RESPONSE PROVIDED]" or Missing/Empty:
          * Score: 0 of X (where X is total marks for that question)
          * Feedback MUST start with exactly: "No response." followed by the correct answer from the rubric.
        - IF RESPONSE IS INCORRECT:
          * Score: 0 of X
          * Feedback MUST start with exactly: "Incorrect." followed by the correct answer and a brief explanation why it is incorrect based on the rubric.
        - IF RESPONSE IS CORRECT:
          * Score: Full marks (e.g. X of X)
          * Feedback MUST start with exactly: "Correct." followed by a brief explanation.

        MARKSCHEME/RUBRIC:
        \${markscheme}

        STUDENT RESPONSES (Format: QuestionID: Response):
        \${formattedResponses}

        GRADING PROTOCOL:
        1. FIRST, check each student response against the markscheme.
        2. Provide TEACHER'S FEEDBACK for each question using the strict format above. DO NOT use HTML or markdown in the feedback strings.
        3. LASTLY, generate the OVERALL COMMENTS (generalFeedback field). This MUST be done after grading all questions to accurately assess overall student performance, strengths, and weaknesses in this task based on the evaluated responses.
        4. Assign a score in "earned of total" format (e.g. "2 of 2", "0.5 of 1", "0 of 3") for the "score" field of each question.
        5. The JSON must have an array of "questions" and a string "generalFeedback" for the Overall comments. Return ONLY valid JSON.\`;`;
     
     data = data.substring(0, startIdx) + replacement + data.substring(endIdx);
     fs.writeFileSync(filePath, data);
     console.log(`Updated prompt in ${filePath}`);
    } else {
       console.log(`Failed to update prompt in ${filePath}`);
    }
  } else if (filePath.includes('TaskTestView.tsx')) {
    const promptStart = '        const prompt = `Grade this student submission for the assessment "${task.title}".';
    const promptEnd = '        5. The JSON must have an array of "questions" and a string "generalFeedback" for the Overall comments. Return ONLY valid JSON.`;';
    
    const startIdx = data.indexOf(promptStart);
    const endIdx = data.indexOf(promptEnd) + promptEnd.length;
    
    if (startIdx !== -1 && endIdx !== -1) {
     const replacement = `${mappedResponsesStr}
        CRITICAL INSTRUCTION: You must provide specific, detailed feedback for EVERY SINGLE QUESTION. Do NOT generate generic fallback messages like "Detailed feedback provided in report."

        GRADING LOGIC:
        You MUST strictly grade the student's response against the MARKSCHEME/RUBRIC provided below. Evaluate each question 1-to-1 against this rubric.

        - IF RESPONSE IS "[NO RESPONSE PROVIDED]" or Missing/Empty:
          * Score: 0 of X (where X is total marks for that question)
          * Feedback MUST start with exactly: "No response." followed by the correct answer from the rubric.
        - IF RESPONSE IS INCORRECT:
          * Score: 0 of X
          * Feedback MUST start with exactly: "Incorrect." followed by the correct answer and a brief explanation why it is incorrect based on the rubric.
        - IF RESPONSE IS CORRECT:
          * Score: Full marks (e.g. X of X)
          * Feedback MUST start with exactly: "Correct." followed by a brief explanation.

        MARKSCHEME/RUBRIC:
        \${markscheme}

        STUDENT RESPONSES (Format: QuestionID: Response):
        \${formattedResponses}

        GRADING PROTOCOL:
        1. FIRST, check each student response against the markscheme.
        2. Provide TEACHER'S FEEDBACK for each question using the strict format above. DO NOT use HTML or markdown in the feedback strings.
        3. LASTLY, generate the OVERALL COMMENTS (generalFeedback field). This MUST be done after grading all questions to accurately assess overall student performance, strengths, and weaknesses in this task based on the evaluated responses.
        4. Assign a score in "earned of total" format (e.g. "2 of 2", "0.5 of 1", "0 of 3") for the "score" field of each question.
        5. The JSON must have an array of "questions" and a string "generalFeedback" for the Overall comments. Return ONLY valid JSON.\`;`;
     
     data = data.substring(0, startIdx) + replacement + data.substring(endIdx);
     fs.writeFileSync(filePath, data);
     console.log(`Updated prompt in ${filePath}`);
    } else {
       console.log(`Failed to update prompt in ${filePath}`);
    }
  }


}

updatePrompt('src/components/views/TaskWorksheetView.tsx');
updatePrompt('src/components/views/TaskTestView.tsx');
