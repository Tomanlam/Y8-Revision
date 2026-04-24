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
    const templateTitles = ["y8 8.1", "y8 8.2", "y8 8.3", "y8 metal reactions"];
    if (data.title && templateTitles.includes(data.title.toLowerCase())) {
      await deleteDoc(doc(db, "tasks", item.id));
      console.log(`Deleted task: ${data.title} (${item.id})`);
    }
  }
  process.exit(0);
}

main().catch(console.error);
