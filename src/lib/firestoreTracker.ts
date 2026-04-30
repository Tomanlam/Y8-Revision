import { 
  getDoc as origGetDoc, 
  getDocs as origGetDocs, 
  setDoc as origSetDoc, 
  updateDoc as origUpdateDoc, 
  deleteDoc as origDeleteDoc, 
  addDoc as origAddDoc, 
  onSnapshot as origOnSnapshot,
  getDocFromServer as origGetDocFromServer 
} from 'firebase/firestore';

import { trackRead, trackWrite, trackListenerAdded, trackListenerRemoved } from './UsageTracker';

export const getDoc: typeof origGetDoc = (async (...args: any[]) => {
  const result = await (origGetDoc as any)(...args);
  trackRead(1);
  return result;
}) as any;

export const getDocFromServer: typeof origGetDocFromServer = (async (...args: any[]) => {
  const result = await (origGetDocFromServer as any)(...args);
  trackRead(1);
  return result;
}) as any;

export const getDocs: typeof origGetDocs = (async (...args: any[]) => {
  const result = await (origGetDocs as any)(...args);
  trackRead(result.empty ? 1 : result.size);
  return result;
}) as any;

export const setDoc: typeof origSetDoc = (async (...args: any[]) => {
  await (origSetDoc as any)(...args);
  trackWrite(1);
}) as any;

export const updateDoc: typeof origUpdateDoc = (async (...args: any[]) => {
  await (origUpdateDoc as any)(...args);
  trackWrite(1);
}) as any;

export const deleteDoc: typeof origDeleteDoc = (async (...args: any[]) => {
  await (origDeleteDoc as any)(...args);
  trackWrite(1);
}) as any;

export const addDoc: typeof origAddDoc = (async (...args: any[]) => {
  const result = await (origAddDoc as any)(...args);
  trackWrite(1);
  return result;
}) as any;

export const onSnapshot: typeof origOnSnapshot = ((...args: any[]) => {
  trackListenerAdded();
  
  // Create a wrapped callback or observer
  const originalCallback = (typeof args[1] === 'function' ? args[1] : (args[1] as any)?.next);
  
  if (typeof args[1] === 'function') {
    (args as any)[1] = (snapshot: any) => {
      // If it's a query snapshot, we count changes, if it's a document snapshot, we count 1 on change
      if (snapshot.docChanges) {
         const changes = snapshot.docChanges();
         if (changes.length > 0) trackRead(changes.length);
         else trackRead(1); // empty list read costs 1
      } else {
         trackRead(1);
      }
      return originalCallback(snapshot);
    };
  } else if (args[1] && typeof args[1] === 'object' && 'next' in args[1]) {
    (args[1] as any).next = (snapshot: any) => {
      if (snapshot.docChanges) {
         const changes = snapshot.docChanges();
         if (changes.length > 0) trackRead(changes.length);
         else trackRead(1);
      } else {
         trackRead(1);
      }
      return originalCallback(snapshot);
    };
  }

  const unsubscribe = (origOnSnapshot as any)(...args);
  return () => {
    trackListenerRemoved();
    unsubscribe();
  };
}) as any;

export * from 'firebase/firestore';
