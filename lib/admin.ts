import { collection, getDocs, limit, query, where } from "firebase/firestore/lite";

import { NORMALIZED_ADMIN_PHONE } from "./constants";
import { getFirestoreDb } from "./firebase";

export async function getAuthorizedAdminPhone(request: Request): Promise<string | null> {
  const adminHeader = request.headers.get("x-admin-phone");
  if (!adminHeader) {
    return null;
  }

  const normalizedHeader = adminHeader.replace(/[^0-9+]/g, "");
  if (!normalizedHeader) {
    return null;
  }

  if (normalizedHeader === NORMALIZED_ADMIN_PHONE) {
    return normalizedHeader;
  }

  const db = getFirestoreDb();
  const usersCollection = collection(db, "users");
  const adminQuery = query(
    usersCollection,
    where("phoneNormalized", "==", normalizedHeader),
    where("isAdmin", "==", true),
    limit(1)
  );
  const snapshot = await getDocs(adminQuery);

  return snapshot.empty ? null : normalizedHeader;
}
