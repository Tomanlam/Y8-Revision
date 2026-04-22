import { Task } from '../../types';

export const EnergyChangesWorksheet: Task = {
  id: 'task-energy-changes',
  title: 'y8 8.2',
  description: 'Understand energy transfers in chemical reactions and identify endothermic/exothermic processes.',
  units: [8],
  dueDate: '2026-04-27',
  status: 'active',
  type: 'worksheet',
  pdfUrl: 'https://msk8tathmqnxjo8k.public.blob.vercel-storage.com/y8%208.2.pdf',
  worksheetQuestions: [
    { 
      id: '82_f1', 
      section: 'Focus', 
      question: '1. For each of the reactions in the table, write exothermic or endothermic.', 
      type: 'table', 
      page: 1,
      tableData: [
        ['Reaction', 'Start temperature in °C', 'Final temperature in °C', 'Exothermic or endothermic'],
        ['A', '21', '45', ''],
        ['B', '18', '22', ''],
        ['C', '19', '16', ''],
        ['D', '18', '20', '']
      ]
    },
    { 
      id: '82_f2', 
      section: 'Focus', 
      question: '2. Sherbet sweets react in your mouth to give a cool, fizzy feeling. Is this an exothermic or endothermic reaction?', 
      type: 'short-response', 
      page: 1 
    },
    { 
      id: '82_f3', 
      section: 'Focus', 
      question: '3. When magnesium ribbon reacts with hydrochloric acid, the test tube gets warm. Is this an exothermic or endothermic reaction?', 
      type: 'short-response', 
      page: 1 
    },
    { 
      id: '82_p1a', 
      section: 'Practice', 
      question: '1a. Which of the reactions shown in the bar chart are endothermic and which are exothermic?', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: '82_p1b', 
      section: 'Practice', 
      question: '1b. Which of these reactions has the largest temperature change?', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: '82_p1c', 
      section: 'Practice', 
      question: '1c. Sofia and Marcus used insulated cups rather than test tubes or glass beakers for their reactions. Suggest why this was a sensible idea.', 
      type: 'short-response', 
      page: 3 
    },
    { 
      id: '82_p2', 
      section: 'Practice', 
      question: '2. Give an example of a useful product that involves an exothermic reaction or process.', 
      type: 'short-response', 
      page: 3 
    },
    { 
      id: '82_p3', 
      section: 'Practice', 
      question: '3. Give an example of a useful product that involves an endothermic reaction or process.', 
      type: 'short-response', 
      page: 3 
    },
    { 
      id: '82_c1', 
      section: 'Challenge', 
      question: '1. Explain the difference between an endothermic reaction and an endothermic process. Give one example of each.', 
      type: 'short-response', 
      page: 3 
    },
    { 
      id: '82_c2', 
      section: 'Challenge', 
      question: '2. Use particle theory to help you explain why the arrangement (soda in bowl with water and wet cloth) will help to keep their bottles of soda cool.', 
      type: 'short-response', 
      page: 4 
    }
  ]
};
