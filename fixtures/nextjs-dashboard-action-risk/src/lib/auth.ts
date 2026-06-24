import { cookies } from "next/headers";

export type DashboardUser = {
  id: string;
  email: string;
  role: "admin" | "operator";
};

export async function requireDashboardUser(): Promise<DashboardUser> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("dashboard_user_id")?.value;

  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }

  return {
    id: userId,
    email: "operator@example.test",
    role: "operator",
  };
}
