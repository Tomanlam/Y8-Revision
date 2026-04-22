import { Task } from '../../types';

export const ReactionsWaterSteamWorksheet: Task = {
  id: 'task-water-steam',
  title: 'y8 8.4',
  description: 'Compare the reactions of different metals with cold water and steam.',
  units: [8],
  dueDate: '2026-04-30',
  status: 'active',
  type: 'worksheet',
  pdfUrl: 'https://msk8tathmqnxjo8k.public.blob.vercel-storage.com/y8%208.4.pdf',
  worksheetQuestions: [
    { 
      id: '84_f1', 
      section: 'Focus', 
      question: '1. Place the metals (zinc, copper, potassium, magnesium) in order of their reactivity with water, starting with the most reactive.', 
      type: 'interactive-sorting', 
      page: 1 
    },
    { 
      id: '84_f2', 
      section: 'Focus', 
      question: '2. Write the word equation for the reaction between potassium and water.', 
      type: 'short-response', 
      page: 1 
    },
    { 
      id: '84_f3', 
      section: 'Focus', 
      question: '3. Name another metal that reacts in a similar way to potassium.', 
      type: 'short-response', 
      page: 1 
    },
    { 
      id: '84_p4', 
      section: 'Practice', 
      question: '4. Using the information provided, explain why copper is used for the roofs of some buildings and magnesium is not.', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: '84_p5', 
      section: 'Practice', 
      question: '5. Write the word equation for the reaction between calcium and water.', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: '84_p6', 
      section: 'Practice', 
      question: '6. Use the diagram on page 2. Label the apparatus set up to demonstrate the reaction of metals with steam.', 
      type: 'interactive-diagram', 
      page: 2 
    },
    { 
      id: '84_p7', 
      section: 'Practice', 
      question: '7. Which gas is given off in this reaction?', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: '84_p8', 
      section: 'Practice', 
      question: '8. How do you test for this gas?', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: '84_p9', 
      section: 'Practice', 
      question: '9. Write the word equation for the reaction between magnesium and steam.', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: '84_c10', 
      section: 'Challenge', 
      question: '10. Draw and label the apparatus you could use to collect the gas given off in this reaction (Describe your drawing).', 
      type: 'interactive-apparatus', 
      page: 3 
    },
    { 
      id: '84_c11', 
      section: 'Challenge', 
      question: '11. Explain why copper is used in heating systems and explain what would happen if pipes made of iron were used.', 
      type: 'short-response', 
      page: 3 
    }
  ]
};
