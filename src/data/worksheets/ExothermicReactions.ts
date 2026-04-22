import { Task, Question } from '../../types';

export const ExothermicReactionsWorksheet: Task = {
  id: 'task-exothermic-reactions',
  title: 'y8 8.1',
  description: 'Identify variables and interpret results in exothermic reaction experiments.',
  units: [8],
  dueDate: '2026-04-23',
  status: 'active',
  type: 'worksheet',
  pdfUrl: '/y8 8.1.pdf',
  worksheetQuestions: [
    { 
      id: 'ex1_1', 
      section: 'Focus', 
      instruction: 'Sofia and Marcus are measuring the temperature rise in a reaction between magnesium ribbon and hydrochloric acid.',
      question: '1. What is the independent variable in this investigation?', 
      type: 'short-response', 
      page: 1 
    },
    { id: 'ex1_2', section: 'Focus', question: '2. What is the dependent variable?', type: 'short-response', page: 1 },
    { id: 'ex1_3', section: 'Focus', question: '3. What are the control variables? State at least two.', type: 'short-response', page: 1 },
    { 
      id: 'ex2_4_table', 
      section: 'Focus',
      instruction: 'Sofia and Marcus do some tests first, to find out how much they must change the length of magnesium each time. Complete the table with the temperature change.',
      question: '4. Here are the results of these tests. Complete the table.', 
      type: 'table', 
      page: 2,
      tableData: [
        ['Length of ribbon in cm', 'Start temperature in °C', 'End temperature in °C', 'Temperature change in °C'],
        ['0.5', '19.0', '36.0', ''],
        ['1.0', '19.0', '36.0', ''],
        ['1.5', '19.0', '36.5', '']
      ]
    },
    { id: 'ex2_5', section: 'Focus', question: '5. Describe what the results show.', type: 'short-response', page: 2 },
    { id: 'ex2_6', section: 'Focus', question: '6. Do Sofia and Marcus have enough data? Explain.', type: 'short-response', page: 2 },
    { id: 'ex2_7', section: 'Focus', question: '7. What is the interval in length they used?', type: 'short-response', page: 2 },
    { id: 'ex2_8', section: 'Focus', question: '8. Larger or smaller interval? Explain why.', type: 'short-response', page: 2 },
    { id: 'ex2_9', section: 'Focus', question: '9. Suggest how many different lengths they should use.', type: 'short-response', page: 2 },
    { id: 'ex3_10', section: 'Focus', question: '10. How can they reduce heat loss from the test tube?', type: 'short-response', page: 3 },
    { id: 'ex3_11', section: 'Focus', question: '11. Explain how to make sure results are reliable.', type: 'short-response', page: 3 },
    { 
      id: 'ex3_p1', 
      section: 'Practice', 
      instruction: 'This exercise you will help you to look critically at the evidence from an investigation.',
      question: '1. Word equation for magnesium + sulfuric acid.', 
      type: 'short-response', 
      page: 3 
    },
    { id: 'ex3_p2_context', section: 'Practice', question: '2. Zara and Arun investigation: Read the context on the left.', type: 'short-response', page: 3 },
    { id: 'ex4_a', section: 'Practice', question: 'a. Which variable did they need to change?', type: 'short-response', page: 4 },
    { id: 'ex4_b', section: 'Practice', question: 'b. Which variable(s) did they keep the same?', type: 'short-response', page: 4 },
    { id: 'ex4_c', section: 'Practice', question: 'c. Which variable should they have kept the same?', type: 'short-response', page: 4 },
    { id: 'ex4_d', section: 'Practice', question: 'd. What conclusions can you draw from these results?', type: 'short-response', page: 4 },
    { id: 'ex5_e', section: 'Practice', question: 'e. Suggest how to make results more reliable.', type: 'short-response', page: 5 },
    { 
      id: 'ex5_ch1', 
      section: 'Challenge', 
      instruction: 'In this exercise, you will answer questions about exothermic reactions. Then you will plan an investigation.',
      question: '1. Word equation for potassium + water.', 
      type: 'short-response', 
      page: 5 
    },
    { id: 'ex5_ch2', section: 'Challenge', question: '2. What is the chemical energy changed to?', type: 'short-response', page: 5 },
    { id: 'ex5_ch3', section: 'Challenge', question: '3. What safety precautions should be taken?', type: 'short-response', page: 5 },
    { id: 'ex5_ch4', section: 'Challenge', question: '4. Suggest a way of measuring energy given out.', type: 'short-response', page: 5 },
    { id: 'ex6_5', section: 'Challenge', question: '5. Explain how you would carry out an investigation to answer the question: Do different metals produce different increases in temperature?', type: 'short-response', page: 6 },
    { id: 'ex6_6', section: 'Challenge', question: '6. Which type of graph would you suggest Amal use to present these results?', type: 'short-response', page: 6 },
    { id: 'ex7_g1', section: 'Challenge', question: 'Give a reason for your choice.', type: 'short-response', page: 7 }
  ]
};
