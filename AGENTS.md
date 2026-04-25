# Custom Agent Rules

- **Gemini Model Choice:** When assigning or updating the AI model, prefer the latest available "lite" model (e.g., `gemini-3.1-flash-lite-preview`) to minimize API and token cost, unless otherwise requested for highly complex reasoning tasks.
- **Grading Feedback Format:** Always format scores as 'X of X' instead of 'X / X' (e.g. 5 of 10).
- **Grading Prompt Logic STRICT WORKFLOW:** 
  1. The prompt MUST instruct the model to perform a 1-to-1 check of each student's response against the provided markscheme/rubric for ALL questions in the task.
  2. It then must provide TEACHER'S FEEDBACK for each question using exactly the following format rules:
     - If no response is provided (marked by explicit `[NO RESPONSE PROVIDED]`), feedback MUST start with "No response." followed by the correct answer from the rubric, and score MUST be 0.
     - If an incorrect response is provided, feedback MUST start with "Incorrect." followed by the correct answer and a brief explanation why it is incorrect based on the rubric.
     - If a correct response is provided, feedback MUST start with "Correct." followed by a brief explanation.
     - Never use generic placeholder messages like "Detailed feedback provided in report."
  3. LASTLY, AFTER grading individual questions, it must generate the 'Overall comments' (Teacher's General Feedback) assessing the overall student performance, strengths, and weaknesses in the task.
