import { LucideIcon } from 'lucide-react';

export type AppMode = 'splash' | 'dashboard' | 'revision' | 'quiz' | 'vocab' | 'user-stats' | 'about' | 'playground' | 'quick-facts' | 'tasks' | 'worksheet' | 'test' | 'achievement' | 'command-center';

export interface QuizSubMode {
  id: string;
  title: string;
  description: string;
  id_prefix: number;
}

export interface SessionStats {
  [unitId: number]: {
    attemptedQuestions: string[];
    masteredVocab: string[];
  }
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  progress: SessionStats;
  lastSeen: string;
  isAdmin?: boolean;
  isParent?: boolean;
  childName?: string;
  childEmails?: string[];
  isGuest?: boolean;
}

export interface ChallengeResponse {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export interface ChallengeRecord {
  id: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
  selectedUnits: number[];
  responses: ChallengeResponse[];
}

export interface Task {
  id: string;
  originalId?: string; // ID from initial definitions
  title: string;
  description: string;
  units: number[];
  dueDate: string;
  status: 'active' | 'archived';
  createdAt?: string;
  type?: 'standard' | 'worksheet' | 'test';
  pdfUrl?: string;
  markschemeContent?: string;
  passcode?: string;
  timeLimit?: number; // in minutes
  isABVersion?: boolean;
  partnerTaskJson?: string; // For B version if applicable
  worksheetQuestions?: (Question & { 
    page?: number; 
    section?: string; 
    instruction?: string;
    tableData?: string[][];
    columnHeaders?: string[];
    rowHeaders?: string[];
    items?: string[]; // for reordering
  })[];
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId: string;
  studentName: string;
  completedAt: string;
  results: {
    score: number;
    total: number;
    unitId?: number;
    cheatLogs?: Record<string, number>;
    feedback?: Record<string, { score: string, feedback: string }>;
    generalFeedback?: string;
    tabSwitches?: number;
  };
  responses: Record<string, any>;
  feedback?: Record<string, { score: string, feedback: string }> | string;
  generalFeedback?: string;
}

export type OperationType = 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
  }
}

export interface NavItem {
  mode: AppMode;
  icon: LucideIcon;
  label: string;
}

export interface Question {
  id: string;
  text?: string;
  question?: string;
  type?: 'mcq' | 'short-response' | 'table' | 'file-upload' | string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  correct?: number; 
}

export interface Vocab {
  term: string;
  definition: string;
  traditional: string;
  simplified: string;
}

export interface Concept {
  title: string;
  content: string;
}

export interface Unit {
  id: number;
  title: string;
  titleTraditional?: string;
  titleSimplified?: string;
  description: string;
  descriptionTraditional?: string;
  descriptionSimplified?: string;
  color: string;
  concepts: string[] | Concept[];
  conceptsTraditional?: string[];
  conceptsSimplified?: string[];
  vocab: Vocab[];
  questions: Question[];
  pdfUrl?: string;
}
