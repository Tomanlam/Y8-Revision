const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace old Prompt Logic
  const oldPromptRegex = /CRITICAL INSTRUCTION: You must provide a specific teacher's feedback for EVERY SINGLE QUESTION listed\.[\s\S]*?GRADING LOGIC:[\s\S]*?5\. DO NOT INCLUDE <cite> tags or any HTML in the feedback\. Use plain text\./g;
  
  const newPromptText = `CRITICAL INSTRUCTION: You must provide specific feedback for EVERY SINGLE QUESTION listed.

        GRADING LOGIC:
        You MUST strictly grade the student's response against the MARKSCHEME/RUBRIC provided below. Do not output generic messages like "Detailed feedback provided in report."
        
        - IF RESPONSE IS MISSING (empty string or whitespace): 
          * Score: 0 of Total
          * Feedback: Must start with "No response. " then provide the correct answer according to the rubric.
        - IF RESPONSE IS INCORRECT (error or incomplete): 
          * Score: Partial or 0 of Total
          * Feedback: Must start with "Incorrect. " then provide the correct answer and a brief explanation according to the rubric.
        - IF RESPONSE IS CORRECT: 
          * Score: Full marks (e.g., 1 of 1, 2 of 2)
          * Feedback: Must start with "Correct. " then provide a brief explanation.
        
        OVERALL COMMENTS:
        You must also provide an 'Overall comments' section (generalFeedback field) detailing how the student did overall in the worksheet/test, including their strengths and what could be improved.
        
        For EACH question:
        1. Evaluate response strictly against the markscheme.
        2. DO NOT INCLUDE <cite> tags or HTML in the feedback. Use plain text.`;
        
  content = content.replace(oldPromptRegex, newPromptText);
  
  // Also we want to ensure 'Overall comments' is what maps to `generalFeedback`
  const jsonFormatRegex = /Return ONLY valid JSON\./g;
  const newJsonFormatText = `The JSON must have an array of "questions" and a string "generalFeedback" for the Overall comments. Return ONLY valid JSON.`;
  content = content.replace(jsonFormatRegex, newJsonFormatText);

  // Update Examiner Summary text to Overall comments
  content = content.replace(/Teacher's general summary/g, 'Overall comments');
  content = content.replace(/Teacher\\'s summary/g, 'Overall comments');
  content = content.replace(/Teacher's summary/g, 'Overall comments');
  content = content.replace(/Examiner summary/g, 'Overall comments');

  fs.writeFileSync(filePath, content);
}

patchFile('src/components/views/TaskTestView.tsx');
patchFile('src/components/views/TaskWorksheetView.tsx');
console.log('done patching prompts');
