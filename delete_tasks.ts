import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

// Read firebase config
const configData = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(configData);
const db = getFirestore(app, configData.firestoreDatabaseId);

async function main() {
  const querySnapshot = await getDocs(collection(db, "tasks"));
  for (const item of querySnapshot.docs) {
    const data = item.data();
    if (data.title && (data.title.toLowerCase() === "y8 8.4" || data.title.toLowerCase() === "y8 8.5")) {
      await deleteDoc(doc(db, "tasks", item.id));
      console.log(`Deleted task: ${data.title} (${item.id})`);
    }
  }
  process.exit(0);
}

main().catch(console.error);
