const fs = require('fs');

const path = 'src/components/views/TasksView.tsx';
let data = fs.readFileSync(path, 'utf8');

const regex = /const TasksView = \(\{[\s\S]*?onWipeCleanSlate\n\}\: TasksViewProps\) => \{/;
const match = regex.exec(data);

if (match) {
  const insertStart = match.index + match[0].length;
  
  const functionToAdd = `
  const [batchGradingTask, setBatchGradingTask] = React.useState<string | null>(null);

  const doBatchGrade = async (task: Task, submissions: TaskSubmission[]) => {
    setBatchGradingTask(task.id);
    const ungraded = submissions.filter(s => !s.feedback);
    
    for (let i = 0; i < ungraded.length; i++) {
      const sub = ungraded[i];
      try {
        const markscheme = task.markschemeContent || "No markscheme provided.";
        const responses = sub.responses || {};
        
        const formattedResponses = Object.entries(responses)
          .map(([id, req]) => {
            let textReq = req;
            if (typeof req === 'string' && req.trim() === '') textReq = "[NO RESPONSE PROVIDED]";
            else if (req === undefined || req === null) textReq = "[NO RESPONSE PROVIDED]";
            else if (Array.isArray(req) && req.length === 0) textReq = "[NO RESPONSE PROVIDED]";
            else if (typeof req === 'object' && !Array.isArray(req) && Object.keys(req).length === 0) textReq = "[NO RESPONSE PROVIDED]";
            return \`\${id}: \${textReq}\`;
          }).join('\\n');

        const prompt = \`Grade this student submission.\\n
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
        5. The JSON must have an array of "questions" and a string "generalFeedback" for the Overall comments. Return ONLY valid JSON.\`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      score: { type: Type.STRING },
                      feedback: { type: Type.STRING }
                    }
                  }
                },
                generalFeedback: { type: Type.STRING }
              }
            }
          }
        });

        if (!response.text) throw new Error("AI returned an empty response.");

        let cleanText = response.text.replace(/\\x60\\x60\\x60json/gi, '').replace(/\\x60\\x60\\x60/g, '').trim();
        const parsed = JSON.parse(cleanText);
        const rawFeedbackArray = Array.isArray(parsed.questions) ? parsed.questions : [];
        const generalResult = parsed.generalFeedback || "";
        
        const feedbackResult: Record<string, { score: string, feedback: string }> = {};
        task.worksheetQuestions?.forEach(q => {
          const targetId = q.id.trim();
          const targetIdLower = targetId.toLowerCase();
          
          let aiFeedback = rawFeedbackArray.find(f => {
            if (!f.id) return false;
            const fIdOrig = String(f.id).trim();
            const fIdLower = fIdOrig.toLowerCase();
            return fIdLower === targetIdLower || fIdOrig === targetId || fIdOrig.includes(targetId) || targetId.includes(fIdOrig);
          });
          
          if (!aiFeedback) aiFeedback = { score: "0 of 1", feedback: "Could not evaluate response against markscheme." };
          feedbackResult[targetId] = { score: String(aiFeedback.score), feedback: String(aiFeedback.feedback) };
        });

        let earned = 0; let total = 0;
        Object.values(feedbackResult).forEach(f => {
          const match = String(f.score).match(/(\\d+(?:\\.\\d+)?)\\s*(?:\\/|of)\\s*(\\d+(?:\\.\\d+)?)/);
          if (match) { earned += parseFloat(match[1]); total += parseFloat(match[2]); }
        });
        
        const results = {
          score: earned,
          total: total || task.worksheetQuestions?.length || 0,
          feedback: feedbackResult,
          generalFeedback: generalResult,
          cheatLogs: sub.results?.cheatLogs,
        };
        
        // update sub locally and in db:
        const payload = { ...sub, feedback: "Graded", completedAt: sub.completedAt || new Date().toISOString(), results };
        
        if (typeof onUpdateTask === 'undefined') {
          // fallback update db doc directly? Actually, wait, TaskWorksheet uses onComplete which bubbles up.
        }
        
        // Let's just update the submission document.
        try {
           const subRef = doc(db, 'submissions', sub.id);
           await setDoc(subRef, payload, { merge: true });
        } catch(e) {
           console.error("Firebase update failed", e);
        }
        // mutate state if possible
        sub.feedback = "Graded";
        sub.results = results;
        
      } catch (err) {
        console.error("Batch grading failed for ", sub.id, err);
      }
    }
    
    setBatchGradingTask(null);
    alert('Batch grading complete for: ' + task.title);
  };
`;
  data = data.substring(0, insertStart) + functionToAdd + data.substring(insertStart);
} else {
  console.log("Could not find insertion point for doBatchGrade");
}

fs.writeFileSync(path, data);
console.log("Added doBatchGrade");
