# Custom Agent Rules

- **Gemini Model Choice:** When assigning or updating the AI model, prefer the latest available "lite" model (e.g., `gemini-3.1-flash-lite-preview`) to minimize API and token cost, unless otherwise requested for highly complex reasoning tasks.
- **Grading Feedback Format:** Always format scores as 'X of X' instead of 'X / X' (e.g. 5 of 10).
- **Grading Prompt Logic:** Grading prompts must include an 'Overall comments' section detailing the student's strengths and what could be improved. The feedback for missing must be 'No response.' followed by correct answer, for incorrect it must be 'Incorrect.' followed by correct answer and briefly explain why, and for correct it must be 'Correct.' followed by brief explanation. Never use generic generated messages. Evaluate strictly against the provided markscheme/rubric.
