export type SupportTicket = {
  id: string;
  subject: string;
  body: string;
};

export const exampleTicket: SupportTicket = {
  id: "ticket-001",
  subject: "Invoice portal access",
  body: "Customer cannot access the invoice portal and needs a reset before Friday.",
};
