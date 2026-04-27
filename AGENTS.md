# Custom Agent Rules

- **Design Language Pattern (Bento Box & UI):**
  - **Cards (Bento Base):** Use heavily rounded corners (`rounded-[2rem]`), `backdrop-blur-xl`, semi-transparent backgrounds (e.g., `bg-white/10`, `bg-gradient-to-br from-.../90 to-.../90`), and thin borders (`border border-white/20`), along with `shadow-xl`.
  - **Bento Sub-cards (Info Areas):** Use nested smaller radii (`rounded-[1.2rem]`), `bg-white/10 border border-white/10`, `transition-colors hover:bg-white/20`. Small label text should be `text-[9px] font-black text-white/60 uppercase tracking-[0.2em]`.
  - **Action Buttons:** Use `bg-white/10 border border-white/20 text-white hover:bg-white hover:text-slate-900 rounded-2xl py-2.5 transition-all duration-300 group/btn`. For icon blocks inside buttons: `w-7 h-7 rounded-[0.6rem] bg-white/20 group-hover/btn:scale-110 flex items-center justify-center transition-transform text-current`. Button text should be `text-[6.5px]` to `text-[10px] font-black uppercase tracking-tight`.
  - **Navigation & Structural Overlays (Sidebar, Topbar, Mobile Nav):** Use heavily blurred, subtle backgrounds: `bg-white/5 backdrop-blur-md border-white/10`. (e.g., `border-r`, `border-b`, or full `border`).

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
