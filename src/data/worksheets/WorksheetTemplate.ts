import { Task } from '../../types';

/**
 * Template for creating new Interactive Worksheets in the system.
 * 
 * Instructions:
 * 1. Copy this template file for each new worksheet.
 * 2. Assign a unique `id` and `pdfUrl` (ensure the PDF is in the public folder).
 * 3. Define questions chronologically by `page`.
 * 4. Add the new Task object to the `INITIAL_TASKS` array in `App.tsx` or import it where needed.
 */

export const WorksheetTemplate: Task = {
  id: 'template-worksheet-id', // UNIQUE ID
  title: 'Worksheet Title (Matches PDF filename)',
  description: 'A brief description of the worksheet for the student task list.',
  units: [1], // Number identifying the unit/topic
  dueDate: '2026-12-31',
  status: 'active',
  type: 'worksheet',
  pdfUrl: '/filename.pdf', // Path to the uploaded PDF in public folder
  worksheetQuestions: [
    // Standard Short Response Question
    { 
      id: 'q1', 
      section: 'Section Name (e.g., Focus, Practice)', 
      instruction: 'Optional contextual instructions to display before this block of questions.',
      question: '1. Question text here', 
      type: 'short-response', 
      page: 1 
    },
    
    // Multiple Choice Question
    { 
      id: 'q2', 
      section: 'Section Name', 
      question: '2. Which of the following is true?', 
      type: 'mcq', 
      options: ['Option A', 'Option B', 'Option C'],
      page: 1 
    },

    // Interactive Data Table
    { 
      id: 'q3_table', 
      section: 'Section Name',
      instruction: 'Fill in the missing data in the table below.',
      question: '3. Complete the data table.', 
      type: 'table', 
      page: 2,
      tableData: [
        // Top row acts as headers
        ['Column 1 Header', 'Column 2 Header', 'Column 3 Header'],
        // Empty string '' represents an input field for the student
        ['Row 1, Col 1', 'Row 1, Col 2', ''], 
        ['Row 2, Col 1', '', ''],
      ]
    }
  ]
};
