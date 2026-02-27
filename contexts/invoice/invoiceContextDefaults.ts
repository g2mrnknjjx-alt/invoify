import {
  CachedPdfMeta,
  CustomerTemplateRecord,
  EmailMessageOptions,
  ExportTypes,
  InvoiceStatus,
  InvoiceType,
  RecurringFrequency,
  SavedInvoiceRecord,
  SyncConflictChoice,
  SyncConflictSummary,
  SyncStatus,
} from "@/types";

export const defaultInvoiceContext = {
  invoicePdf: new Blob(),
  invoicePdfLoading: false,
  savedInvoices: [] as SavedInvoiceRecord[],
  customerTemplates: [] as CustomerTemplateRecord[],
  syncConflicts: [] as SyncConflictSummary[],
  syncStatus: {
    state: "idle",
    provider: "local",
    lastAttemptAt: null,
    lastSuccessAt: null,
    reason: null,
    errorMessage: null,
  } as SyncStatus,
  pdfUrl: null as string | null,
  onFormSubmit: (_values: InvoiceType) => {},
  newInvoice: () => {},
  generatePdf: async (_data: InvoiceType) => {},
  removeFinalPdf: () => {},
  downloadPdf: () => {},
  printPdf: () => {},
  previewPdfInTab: () => {},
  saveInvoice: () => {},
  deleteInvoice: (_id: string) => {},
  duplicateInvoice: (_id: string) => {},
  updateSavedInvoiceStatus: (_id: string, _status: InvoiceStatus) => {},
  recordInvoicePayment: (_id: string, _amount: number) => false,
  markInvoiceReminderSent: (_id: string) => false,
  setInvoiceRecurring: (_id: string, _frequency: RecurringFrequency | null) =>
    false,
  generateRecurringInvoice: (_id: string) => false,
  sendPdfToMail: (
    _email: string,
    _messageOptions?: EmailMessageOptions
  ): Promise<void> => Promise.resolve(),
  exportInvoiceAs: (_exportAs: ExportTypes) => {},
  importInvoice: (_file: File) => {},
  restorePdfFromCache: async (_invoiceNumber: string) => false,
  getCachedPdfMeta: (_invoiceNumber: string) => null as CachedPdfMeta | null,
  hasCachedPdf: (_invoiceNumber: string) => false,
  saveCustomerTemplate: (_name: string) => {},
  applyCustomerTemplate: (_templateId: string) => false,
  renameCustomerTemplate: (_templateId: string, _name: string) => false,
  deleteCustomerTemplate: (_templateId: string) => {},
  resolveSyncConflict: (_conflictId: string, _choice: SyncConflictChoice) =>
    false,
  resolveSyncConflictsWithDefaults: () => 0,
};

export type InvoiceContextValue = typeof defaultInvoiceContext;
