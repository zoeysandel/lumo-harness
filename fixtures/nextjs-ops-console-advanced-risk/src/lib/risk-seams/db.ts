export async function writeDatabaseRecord(_table: string, _payload: unknown) {
  throw new Error("Fake risky database seam: local fixtures must not write database records.");
}

export async function readDatabaseRecord(_table: string, _id: string) {
  throw new Error("Fake risky database seam: use src/lib/data.ts for fixture data.");
}
