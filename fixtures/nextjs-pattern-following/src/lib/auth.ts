import { cookies } from "next/headers";

export type AccountUser = {
  id: string;
  email: string;
};

export async function loadCurrentUser(): Promise<AccountUser> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("account_user_id")?.value;

  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }

  return {
    id: userId,
    email: "user@example.test",
  };
}
