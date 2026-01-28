import { NORMALIZED_ADMIN_PHONE } from "./constants";
import { getDb } from "./mongodb";

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

  const db = await getDb();
  const usersCollection = db.collection("users");
  const adminUser = await usersCollection.findOne({
    phoneNormalized: normalizedHeader,
    isAdmin: true,
  });

  return adminUser ? normalizedHeader : null;
}
