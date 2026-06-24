export type Session = {
  userId: string;
  role: "admin" | "ops" | "viewer";
};

export async function requireProductionSession(): Promise<Session> {
  throw new Error("Fake risky auth seam: do not call from local eval slices.");
}
