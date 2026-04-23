import { Task } from '../../types';

export const MetalReactionsWorksheet: Task = {
  id: 'task-metal-reactions',
  title: 'y8 Metal Reactions',
  description: 'Practise the reactivity series and word equations for common metal reactions.',
  units: [8],
  dueDate: '2026-04-29',
  status: 'active',
  type: 'worksheet',
  pdfUrl: 'https://msk8tathmqnxjo8k.public.blob.vercel-storage.com/y8%20metal%20reaction%20worksheet.pdf',
  worksheetQuestions: [
    { 
      id: 'mr_a1_1', 
      section: 'Part A - Reaction type practice', 
      instruction: '1. Rusting: Complete the word equation.',
      question: '1. Iron + water + oxygen →', 
      type: 'short-response', 
      page: 2 
    },
    { 
      id: 'mr_a2_1', 
      section: 'Part A - Reaction type practice', 
      instruction: '2. Metal + oxygen → metal oxide: Complete each word equation.',
      question: '1. Magnesium + oxygen →', 
      type: 'short-response', 
      page: 2 
    },
    { id: 'mr_a2_2', section: 'Part A', question: '2. Zinc + oxygen →', type: 'short-response', page: 2 },
    { id: 'mr_a2_3', section: 'Part A', question: '3. Copper + oxygen →', type: 'short-response', page: 2 },
    { id: 'mr_a2_4', section: 'Part A', question: '4. Calcium + oxygen →', type: 'short-response', page: 2 },
    { 
      id: 'mr_a3_1', 
      section: 'Part A - Reaction type practice', 
      instruction: '3. Metal + cold water → metal hydroxide + hydrogen: Complete each word equation.',
      question: '1. Sodium + cold water →', 
      type: 'short-response', 
      page: 2 
    },
    { id: 'mr_a3_2', section: 'Part A', question: '2. Potassium + cold water →', type: 'short-response', page: 2 },
    { id: 'mr_a3_3', section: 'Part A', question: '3. Calcium + cold water →', type: 'short-response', page: 2 },
    { id: 'mr_a3_4', section: 'Part A', question: '4. Choose a metal from the list that reacts with cold water and complete the equation: [Metal] + cold water → [Product 1] + [Product 2]', type: 'short-response', page: 2 },
    { 
      id: 'mr_a4_1', 
      section: 'Part A - Reaction type practice', 
      instruction: '4. Metal + hot steam → metal oxide + hydrogen: Complete each word equation.',
      question: '1. Magnesium + hot steam →', 
      type: 'short-response', 
      page: 2 
    },
    { id: 'mr_a4_2', section: 'Part A', question: '2. Zinc + hot steam →', type: 'short-response', page: 2 },
    { id: 'mr_a4_3', section: 'Part A', question: '3. Iron + hot steam →', type: 'short-response', page: 2 },
    { id: 'mr_a4_4', section: 'Part A', question: '4. Aluminium + hot steam →', type: 'short-response', page: 3 },
    { 
      id: 'mr_a5_1', 
      section: 'Part A - Reaction type practice', 
      instruction: '5. Metal + acid → metal salt + hydrogen: Complete each word equation.',
      question: '1. Magnesium + hydrochloric acid →', 
      type: 'short-response', 
      page: 3 
    },
    { id: 'mr_a5_2', section: 'Part A', question: '2. Zinc + sulfuric acid →', type: 'short-response', page: 3 },
    { id: 'mr_a5_3', section: 'Part A', question: '3. Iron + ethanoic acid →', type: 'short-response', page: 3 },
    { id: 'mr_a5_4', section: 'Part A', question: '4. Calcium + hydrochloric acid →', type: 'short-response', page: 3 },
    { 
      id: 'mr_b_1', 
      section: 'Part B - Mixed practice: write the reactants', 
      instruction: 'For each product side, complete the word equation by writing the reactants in words.',
      question: '1. [Reactant 1] + [Reactant 2] → magnesium oxide', 
      type: 'short-response', 
      page: 3 
    },
    { id: 'mr_b_2', section: 'Part B', question: '2. [R1] + [R2] → zinc sulfate + hydrogen', type: 'short-response', page: 3 },
    { id: 'mr_b_3', section: 'Part B', question: '3. [R1] + [R2] → sodium hydroxide + hydrogen', type: 'short-response', page: 3 },
    { id: 'mr_b_4', section: 'Part B', question: '4. [R1] + [R2] → iron oxide + hydrogen', type: 'short-response', page: 3 },
    { id: 'mr_b_5', section: 'Part B', question: '5. [R1] + [R2] → copper oxide', type: 'short-response', page: 3 },
    { id: 'mr_b_6', section: 'Part B', question: '6. [R1] + [R2] → calcium chloride + hydrogen', type: 'short-response', page: 3 },
    { id: 'mr_b_7', section: 'Part B', question: '7. [R1] + [R2] → potassium hydroxide + hydrogen', type: 'short-response', page: 3 },
    { id: 'mr_b_8', section: 'Part B', question: '8. [R1] + [R2] → aluminium oxide + hydrogen', type: 'short-response', page: 3 },
    { id: 'mr_b_9', section: 'Part B', question: '9. [R1] + [R2] → lead oxide', type: 'short-response', page: 3 },
    { id: 'mr_b_10', section: 'Part B', question: '10. [R1] + [R2] → magnesium ethanoate + hydrogen', type: 'short-response', page: 3 },
    { id: 'mr_b_11', section: 'Part B', question: '11. [R1] + [R2] → calcium hydroxide + hydrogen', type: 'short-response', page: 3 },
    { id: 'mr_b_12', section: 'Part B', question: '12. [R1] + [R2] → zinc oxide + hydrogen', type: 'short-response', page: 3 },
    { id: 'mr_b_13', section: 'Part B', question: '13. [R1] + [R2] → iron chloride + hydrogen', type: 'short-response', page: 4 },
    { id: 'mr_b_14', section: 'Part B', question: '14. [R1] + [R2] → sodium oxide', type: 'short-response', page: 4 },
    { id: 'mr_b_15', section: 'Part B', question: '15. [R1] + [R2] → aluminium sulfate + hydrogen', type: 'short-response', page: 4 }
  ]
};
