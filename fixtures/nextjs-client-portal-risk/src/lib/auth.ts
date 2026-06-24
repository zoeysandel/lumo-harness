import { cookies } from "next/headers";

export type PortalUser = {
  id: string;
  email: string;
  role: "owner" | "success_manager";
};

export async function requirePortalUser(): Promise<PortalUser> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("portal_user_id")?.value;

  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }

  return {
    id: userId,
    email: "success@example.test",
    role: "success_manager",
  };
}

