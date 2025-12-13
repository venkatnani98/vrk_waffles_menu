import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase.js";

export async function getCatalogueItems() {
  const q = query(
    collection(db, "catalogue"),
    where("isAvailable", "==", true)
  );

  const snapshot = await getDocs(q);

  const items = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return items;
}
