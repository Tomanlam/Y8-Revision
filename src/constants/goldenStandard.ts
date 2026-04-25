import { Task } from '../types';

export const GOLDEN_STANDARD_QUESTIONS = [
  {
    id: "gs_q1",
    type: "mcq",
    question: "Which of the following is a primary color in the additive color model (RGB)?",
    options: ["Yellow", "Green", "Orange", "Purple"],
    page: 1
  },
  {
    id: "gs_q2",
    type: "short-response",
    question: "Explain why the sky appears blue during a clear day. Use valid scientific terminology.",
    page: 1
  },
  {
    id: "gs_q3",
    type: "table",
    question: "Complete the following table tracking square roots of perfect squares.",
    tableData: [
      ["Number (x)", "Square Root (√x)"],
      ["4", ""],
      ["9", "3"],
      ["16", ""]
    ],
    page: 1
  },
  {
    id: "gs_q4",
    type: "tick-cross",
    question: "The Sun is classified as a planet in our solar system.",
    page: 1
  },
  {
    id: "gs_q5",
    type: "reorder",
    question: "Order these historical events chronologically from EARLIEST to LATEST.",
    items: [
      "Apollo 11 Moon Landing (1969)",
      "World War II Ends (1945)",
      "World War I Begins (1914)",
      "The Great Depression (1929)"
    ],
    page: 1
  },
  {
    id: "gs_q6",
    type: "mcq",
    question: "Which organelle is primarily responsible for ATP production in eukaryotic cells?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
    page: 1
  }
];

export const GOLDEN_STANDARD_MARKSCHEME = JSON.stringify({
  "grading_standard": "Golden Standard Assessment v1.0",
  "questions": {
    "gs_q1": {
      "type": "mcq",
      "correct_answer": "Green",
      "marks": 1,
      "rationale": "In the additive RGB model, Green is a primary color. Yellow is subtractive/secondary in RGB."
    },
    "gs_q2": {
      "type": "short-response",
      "total_marks": 2,
      "rubric": [
        {
          "criterion": "Mentions 'Rayleigh scattering'",
          "marks": 1
        },
        {
          "criterion": "Explains that shorter wavelengths (blue/violet) are scattered more by atmospheric molecules",
          "marks": 1
        }
      ]
    },
    "gs_q3": {
      "type": "table",
      "total_marks": 2,
      "expected_values": {
        "Square Root of 4": "2",
        "Square Root of 16": "4"
      },
      "marking_guide": "1 mark for each correctly filled cell."
    },
    "gs_q4": {
      "type": "tick-cross",
      "correct_answer": "✕",
      "marks": 1,
      "rationale": "The Sun is a G-type main-sequence star, not a planet."
    },
    "gs_q5": {
      "type": "reorder",
      "correct_sequence": [
        "World War I Begins (1914)",
        "The Great Depression (1929)",
        "World War II Ends (1945)",
        "Apollo 11 Moon Landing (1969)"
      ],
      "max_marks": 2,
      "partial_credit": "1 mark if 3 out of 4 are in correct relative positions."
    },
    "gs_q6": {
      "type": "mcq",
      "correct_answer": "Mitochondria",
      "marks": 1,
      "rationale": "Mitochondria are the powerhouses of the cell where cellular respiration occurs."
    }
  }
}, null, 2);

export const GOLDEN_STANDARD_WORKSHEET: Partial<Task> = {
  title: "SAMPLE WORKSHEET",
  description: "A perfect reference worksheet for testing all interactive question types and AI grading logic.",
  type: "worksheet",
  units: [1],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  worksheetQuestions: GOLDEN_STANDARD_QUESTIONS,
  markschemeContent: GOLDEN_STANDARD_MARKSCHEME
};

export const GOLDEN_STANDARD_TEST: Partial<Task> = {
  title: "SAMPLE TEST",
  description: "A secure assessment baseline for verifying test integrity, passcodes, and rigorous grading.",
  type: "test",
  units: [1],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  passcode: "GOLDEN2024",
  timeLimit: 30,
  worksheetQuestions: GOLDEN_STANDARD_QUESTIONS,
  markschemeContent: GOLDEN_STANDARD_MARKSCHEME
};
