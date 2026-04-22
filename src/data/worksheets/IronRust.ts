import { Task } from '../../types';

export const IronRustWorksheet: Task = {
  id: 'task-iron-rust',
  title: 'y8 8.3',
  description: 'Investigate the conditions required for iron to rust and how to prevent it.',
  units: [8],
  dueDate: '2026-04-29',
  status: 'active',
  type: 'worksheet',
  pdfUrl: 'https://msk8tathmqnxjo8k.public.blob.vercel-storage.com/y8%208.3.pdf',
  worksheetQuestions: [
    { 
      id: '83_f1', 
      section: 'Focus', 
      question: '1. What is the chemical name for rust?', 
      type: 'short-response', 
      page: 1 
    },
    { 
      id: '83_f2', 
      section: 'Focus', 
      question: '2. In which tube (A, B, or C) will the nail go rusty?', 
      type: 'short-response', 
      page: 1 
    },
    { 
      id: '83_f3', 
      section: 'Focus', 
      question: '3. How do the conditions in tube C prevent air reaching the iron nail?', 
      type: 'short-response', 
      page: 1 
    },
    { 
      id: '83_p4a', 
      section: 'Practice', 
      question: '4a. Is the nail in tube A going a little rusty an expected result?', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: '83_p4b', 
      section: 'Practice', 
      question: '4b. Suggest how this nail could have rusted.', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: '83_p5', 
      section: 'Practice', 
      question: '5. What could be done to the iron nails to stop them from rusting? Suggest two ideas.', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: '83_c6', 
      section: 'Challenge', 
      question: '6. Plan an investigation to find out if an iron nail rusts more quickly when it is warm rather than cold. Remember to think about the variable you will change, keep the same, and measure.', 
      type: 'short-response', 
      page: 2 
    }
  ]
};
