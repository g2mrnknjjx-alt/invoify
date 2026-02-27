"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { useAuthContext } from "@/contexts/AuthContext";
import {
  useInvoiceDraftPersistence,
} from "@/contexts/invoice/useInvoiceDraftPersistence";
import {
  useInvoiceExportAndEmail,
} from "@/contexts/invoice/useInvoiceExportAndEmail";
import { useInvoicePdfActions } from "@/contexts/invoice/useInvoicePdfActions";
import { useSavedInvoicesState } from "@/contexts/invoice/useSavedInvoicesState";
import { useInvoiceSyncState } from "@/contexts/invoice/useInvoiceSyncState";
import useToasts from "@/hooks/useToasts";
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

const defaultInvoiceContext = {
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

export const InvoiceContext = createContext(defaultInvoiceContext);

type InvoiceContextValue = typeof defaultInvoiceContext;

type PdfViewerContextValue = Pick<InvoiceContextValue, "invoicePdf">;
type PdfViewerStateContextValue = {
  hasGeneratedPdf: boolean;
};
type FinalPdfContextValue = Pick<
  InvoiceContextValue,
  | "pdfUrl"
  | "removeFinalPdf"
  | "previewPdfInTab"
  | "downloadPdf"
  | "printPdf"
  | "saveInvoice"
  | "sendPdfToMail"
>;
type InvoiceActionsContextValue = Pick<
  InvoiceContextValue,
  "invoicePdfLoading" | "newInvoice" | "removeFinalPdf"
>;
type InvoiceSubmissionContextValue = Pick<InvoiceContextValue, "onFormSubmit">;
type InvoiceImportExportContextValue = Pick<
  InvoiceContextValue,
  "invoicePdfLoading" | "importInvoice" | "exportInvoiceAs"
>;
type InvoiceSyncContextValue = Pick<
  InvoiceContextValue,
  | "syncStatus"
  | "syncConflicts"
  | "resolveSyncConflict"
  | "resolveSyncConflictsWithDefaults"
>;
type CustomerTemplatesContextValue = Pick<
  InvoiceContextValue,
  | "customerTemplates"
  | "saveCustomerTemplate"
  | "applyCustomerTemplate"
  | "renameCustomerTemplate"
  | "deleteCustomerTemplate"
>;

type SavedInvoicesListContextValue = Pick<
  InvoiceContextValue,
  | "savedInvoices"
  | "onFormSubmit"
  | "deleteInvoice"
  | "duplicateInvoice"
  | "updateSavedInvoiceStatus"
  | "recordInvoicePayment"
  | "markInvoiceReminderSent"
  | "setInvoiceRecurring"
  | "generateRecurringInvoice"
  | "restorePdfFromCache"
  | "getCachedPdfMeta"
>;
type SavedInvoicesListDataContextValue = Pick<
  SavedInvoicesListContextValue,
  "savedInvoices" | "getCachedPdfMeta"
>;
type SavedInvoicesListActionsContextValue = Omit<
  SavedInvoicesListContextValue,
  "savedInvoices" | "getCachedPdfMeta"
>;

const defaultPdfViewerContext: PdfViewerContextValue = {
  invoicePdf: defaultInvoiceContext.invoicePdf,
};
const defaultPdfViewerStateContext: PdfViewerStateContextValue = {
  hasGeneratedPdf: false,
};
const defaultFinalPdfContext: FinalPdfContextValue = {
  pdfUrl: defaultInvoiceContext.pdfUrl,
  removeFinalPdf: defaultInvoiceContext.removeFinalPdf,
  previewPdfInTab: defaultInvoiceContext.previewPdfInTab,
  downloadPdf: defaultInvoiceContext.downloadPdf,
  printPdf: defaultInvoiceContext.printPdf,
  saveInvoice: defaultInvoiceContext.saveInvoice,
  sendPdfToMail: defaultInvoiceContext.sendPdfToMail,
};
const defaultInvoiceActionsContext: InvoiceActionsContextValue = {
  invoicePdfLoading: defaultInvoiceContext.invoicePdfLoading,
  newInvoice: defaultInvoiceContext.newInvoice,
  removeFinalPdf: defaultInvoiceContext.removeFinalPdf,
};
const defaultInvoiceSubmissionContext: InvoiceSubmissionContextValue = {
  onFormSubmit: defaultInvoiceContext.onFormSubmit,
};
const defaultInvoiceImportExportContext: InvoiceImportExportContextValue = {
  invoicePdfLoading: defaultInvoiceContext.invoicePdfLoading,
  importInvoice: defaultInvoiceContext.importInvoice,
  exportInvoiceAs: defaultInvoiceContext.exportInvoiceAs,
};
const defaultInvoiceSyncContext: InvoiceSyncContextValue = {
  syncStatus: defaultInvoiceContext.syncStatus,
  syncConflicts: defaultInvoiceContext.syncConflicts,
  resolveSyncConflict: defaultInvoiceContext.resolveSyncConflict,
  resolveSyncConflictsWithDefaults:
    defaultInvoiceContext.resolveSyncConflictsWithDefaults,
};
const defaultCustomerTemplatesContext: CustomerTemplatesContextValue = {
  customerTemplates: defaultInvoiceContext.customerTemplates,
  saveCustomerTemplate: defaultInvoiceContext.saveCustomerTemplate,
  applyCustomerTemplate: defaultInvoiceContext.applyCustomerTemplate,
  renameCustomerTemplate: defaultInvoiceContext.renameCustomerTemplate,
  deleteCustomerTemplate: defaultInvoiceContext.deleteCustomerTemplate,
};

const defaultSavedInvoicesListDataContext: SavedInvoicesListDataContextValue = {
  savedInvoices: defaultInvoiceContext.savedInvoices,
  getCachedPdfMeta: defaultInvoiceContext.getCachedPdfMeta,
};
const defaultSavedInvoicesListActionsContext: SavedInvoicesListActionsContextValue = {
  onFormSubmit: defaultInvoiceContext.onFormSubmit,
  deleteInvoice: defaultInvoiceContext.deleteInvoice,
  duplicateInvoice: defaultInvoiceContext.duplicateInvoice,
  updateSavedInvoiceStatus: defaultInvoiceContext.updateSavedInvoiceStatus,
  recordInvoicePayment: defaultInvoiceContext.recordInvoicePayment,
  markInvoiceReminderSent: defaultInvoiceContext.markInvoiceReminderSent,
  setInvoiceRecurring: defaultInvoiceContext.setInvoiceRecurring,
  generateRecurringInvoice: defaultInvoiceContext.generateRecurringInvoice,
  restorePdfFromCache: defaultInvoiceContext.restorePdfFromCache,
};

const InvoicePdfViewerContext = createContext(defaultPdfViewerContext);
const InvoicePdfViewerStateContext = createContext(defaultPdfViewerStateContext);
const FinalPdfContext = createContext(defaultFinalPdfContext);
const InvoiceActionsContext = createContext(defaultInvoiceActionsContext);
const InvoiceSubmissionContext = createContext(defaultInvoiceSubmissionContext);
const InvoiceImportExportContext = createContext(defaultInvoiceImportExportContext);
const InvoiceSyncContext = createContext(defaultInvoiceSyncContext);
const CustomerTemplatesContext = createContext(defaultCustomerTemplatesContext);
const SavedInvoicesListDataContext = createContext(
  defaultSavedInvoicesListDataContext
);
const SavedInvoicesListActionsContext = createContext(
  defaultSavedInvoicesListActionsContext
);

export const useInvoiceContext = () => {
  return useContext(InvoiceContext);
};

export const useInvoicePdfViewerContext = () => {
  return useContext(InvoicePdfViewerContext);
};

export const useInvoicePdfViewerState = () => {
  return useContext(InvoicePdfViewerStateContext);
};

export const useFinalPdfContext = () => {
  return useContext(FinalPdfContext);
};

export const useInvoiceActionsContext = () => {
  return useContext(InvoiceActionsContext);
};

export const useInvoiceSubmissionContext = () => {
  return useContext(InvoiceSubmissionContext);
};

export const useInvoiceImportExportContext = () => {
  return useContext(InvoiceImportExportContext);
};

export const useInvoiceSyncContext = () => {
  return useContext(InvoiceSyncContext);
};

export const useCustomerTemplatesContext = () => {
  return useContext(CustomerTemplatesContext);
};

export const useSavedInvoicesListContext = () => {
  const data = useSavedInvoicesListData();
  const actions = useSavedInvoicesListActions();

  return useMemo(
    () => ({
      ...data,
      ...actions,
    }),
    [actions, data]
  );
};

export const useSavedInvoicesListData = () => {
  return useContext(SavedInvoicesListDataContext);
};

export const useSavedInvoicesListActions = () => {
  return useContext(SavedInvoicesListActionsContext);
};

type InvoiceContextProviderProps = {
  children: React.ReactNode;
};

export const InvoiceContextProvider = ({ children }: InvoiceContextProviderProps) => {
  const {
    newInvoiceSuccess,
    pdfGenerationSuccess,
    saveInvoiceSuccess,
    modifiedInvoiceSuccess,
    sendPdfSuccess,
    sendPdfError,
    importInvoiceError,
    exportInvoiceError,
  } = useToasts();

  const { getValues, reset, setValue, watch } = useFormContext<InvoiceType>();
  const { accessToken, isAuthenticated, user } = useAuthContext();

  useInvoiceDraftPersistence({ watch });

  const pdfActions = useInvoicePdfActions({
    getValues,
    reset,
    newInvoiceSuccess,
    pdfGenerationSuccess,
  });

  const savedState = useSavedInvoicesState({
    getValues,
    setValue,
    invoicePdf: pdfActions.invoicePdf,
    saveInvoiceSuccess,
    modifiedInvoiceSuccess,
  });

  const isStorageHydrated =
    savedState.isRecordsHydrated && pdfActions.isPdfCacheHydrated;

  const syncState = useInvoiceSyncState({
    isStorageHydrated,
    savedInvoices: savedState.savedInvoices,
    customerTemplates: savedState.customerTemplates,
    persistSavedInvoices: savedState.persistSavedInvoices,
    persistCustomerTemplates: savedState.persistCustomerTemplates,
    accessToken,
    isAuthenticated,
    userId: user?.id || null,
  });

  const exportAndEmail = useInvoiceExportAndEmail({
    getValues,
    reset,
    invoicePdf: pdfActions.invoicePdf,
    savedInvoices: savedState.savedInvoices,
    persistSavedInvoices: savedState.persistSavedInvoices,
    resolvePdfFilenameMeta: pdfActions.resolvePdfFilenameMeta,
    sendPdfSuccess,
    sendPdfError,
    importInvoiceError,
    exportInvoiceError,
  });

  const contextValue = useMemo(
    () => ({
      invoicePdf: pdfActions.invoicePdf,
      invoicePdfLoading: pdfActions.invoicePdfLoading,
      savedInvoices: savedState.savedInvoices,
      customerTemplates: savedState.customerTemplates,
      syncConflicts: syncState.syncConflicts,
      syncStatus: syncState.syncStatus,
      pdfUrl: pdfActions.pdfUrl,
      onFormSubmit: pdfActions.onFormSubmit,
      newInvoice: pdfActions.newInvoice,
      generatePdf: pdfActions.generatePdf,
      removeFinalPdf: pdfActions.removeFinalPdf,
      downloadPdf: pdfActions.downloadPdf,
      printPdf: pdfActions.printPdf,
      previewPdfInTab: pdfActions.previewPdfInTab,
      saveInvoice: savedState.saveInvoice,
      deleteInvoice: savedState.deleteInvoice,
      duplicateInvoice: savedState.duplicateInvoice,
      updateSavedInvoiceStatus: savedState.updateSavedInvoiceStatus,
      recordInvoicePayment: savedState.recordInvoicePayment,
      markInvoiceReminderSent: savedState.markInvoiceReminderSent,
      setInvoiceRecurring: savedState.setInvoiceRecurring,
      generateRecurringInvoice: savedState.generateRecurringInvoice,
      sendPdfToMail: exportAndEmail.sendPdfToMail,
      exportInvoiceAs: exportAndEmail.exportInvoiceAs,
      importInvoice: exportAndEmail.importInvoice,
      restorePdfFromCache: pdfActions.restorePdfFromCache,
      getCachedPdfMeta: pdfActions.getCachedPdfMeta,
      hasCachedPdf: pdfActions.hasCachedPdf,
      saveCustomerTemplate: savedState.saveCustomerTemplate,
      applyCustomerTemplate: savedState.applyCustomerTemplate,
      renameCustomerTemplate: savedState.renameCustomerTemplate,
      deleteCustomerTemplate: savedState.deleteCustomerTemplate,
      resolveSyncConflict: syncState.resolveSyncConflict,
      resolveSyncConflictsWithDefaults: syncState.resolveSyncConflictsWithDefaults,
    }),
    [
      exportAndEmail.exportInvoiceAs,
      exportAndEmail.importInvoice,
      exportAndEmail.sendPdfToMail,
      pdfActions.downloadPdf,
      pdfActions.generatePdf,
      pdfActions.getCachedPdfMeta,
      pdfActions.hasCachedPdf,
      pdfActions.invoicePdf,
      pdfActions.invoicePdfLoading,
      pdfActions.newInvoice,
      pdfActions.onFormSubmit,
      pdfActions.pdfUrl,
      pdfActions.previewPdfInTab,
      pdfActions.printPdf,
      pdfActions.removeFinalPdf,
      pdfActions.restorePdfFromCache,
      savedState.applyCustomerTemplate,
      savedState.customerTemplates,
      savedState.deleteCustomerTemplate,
      savedState.deleteInvoice,
      savedState.duplicateInvoice,
      savedState.generateRecurringInvoice,
      savedState.markInvoiceReminderSent,
      savedState.recordInvoicePayment,
      savedState.renameCustomerTemplate,
      savedState.saveCustomerTemplate,
      savedState.saveInvoice,
      savedState.savedInvoices,
      savedState.setInvoiceRecurring,
      savedState.updateSavedInvoiceStatus,
      syncState.resolveSyncConflict,
      syncState.resolveSyncConflictsWithDefaults,
      syncState.syncConflicts,
      syncState.syncStatus,
    ]
  );

  const pdfViewerContextValue = useMemo(
    () => ({
      invoicePdf: pdfActions.invoicePdf,
    }),
    [pdfActions.invoicePdf]
  );
  const pdfViewerStateContextValue = useMemo(
    () => ({
      hasGeneratedPdf: pdfActions.invoicePdf.size > 0,
    }),
    [pdfActions.invoicePdf.size]
  );
  const finalPdfContextValue = useMemo(
    () => ({
      pdfUrl: pdfActions.pdfUrl,
      removeFinalPdf: pdfActions.removeFinalPdf,
      previewPdfInTab: pdfActions.previewPdfInTab,
      downloadPdf: pdfActions.downloadPdf,
      printPdf: pdfActions.printPdf,
      saveInvoice: savedState.saveInvoice,
      sendPdfToMail: exportAndEmail.sendPdfToMail,
    }),
    [
      exportAndEmail.sendPdfToMail,
      pdfActions.downloadPdf,
      pdfActions.pdfUrl,
      pdfActions.previewPdfInTab,
      pdfActions.printPdf,
      pdfActions.removeFinalPdf,
      savedState.saveInvoice,
    ]
  );
  const invoiceActionsContextValue = useMemo(
    () => ({
      invoicePdfLoading: pdfActions.invoicePdfLoading,
      newInvoice: pdfActions.newInvoice,
      removeFinalPdf: pdfActions.removeFinalPdf,
    }),
    [pdfActions.invoicePdfLoading, pdfActions.newInvoice, pdfActions.removeFinalPdf]
  );
  const invoiceSubmissionContextValue = useMemo(
    () => ({
      onFormSubmit: pdfActions.onFormSubmit,
    }),
    [pdfActions.onFormSubmit]
  );
  const invoiceImportExportContextValue = useMemo(
    () => ({
      invoicePdfLoading: pdfActions.invoicePdfLoading,
      importInvoice: exportAndEmail.importInvoice,
      exportInvoiceAs: exportAndEmail.exportInvoiceAs,
    }),
    [
      exportAndEmail.exportInvoiceAs,
      exportAndEmail.importInvoice,
      pdfActions.invoicePdfLoading,
    ]
  );
  const invoiceSyncContextValue = useMemo(
    () => ({
      syncStatus: syncState.syncStatus,
      syncConflicts: syncState.syncConflicts,
      resolveSyncConflict: syncState.resolveSyncConflict,
      resolveSyncConflictsWithDefaults: syncState.resolveSyncConflictsWithDefaults,
    }),
    [
      syncState.resolveSyncConflict,
      syncState.resolveSyncConflictsWithDefaults,
      syncState.syncConflicts,
      syncState.syncStatus,
    ]
  );
  const customerTemplatesContextValue = useMemo(
    () => ({
      customerTemplates: savedState.customerTemplates,
      saveCustomerTemplate: savedState.saveCustomerTemplate,
      applyCustomerTemplate: savedState.applyCustomerTemplate,
      renameCustomerTemplate: savedState.renameCustomerTemplate,
      deleteCustomerTemplate: savedState.deleteCustomerTemplate,
    }),
    [
      savedState.applyCustomerTemplate,
      savedState.customerTemplates,
      savedState.deleteCustomerTemplate,
      savedState.renameCustomerTemplate,
      savedState.saveCustomerTemplate,
    ]
  );

  const savedInvoicesListDataContextValue = useMemo(
    () => ({
      savedInvoices: savedState.savedInvoices,
      getCachedPdfMeta: pdfActions.getCachedPdfMeta,
    }),
    [pdfActions.getCachedPdfMeta, savedState.savedInvoices]
  );

  const savedInvoicesListActionsContextValue = useMemo(
    () => ({
      onFormSubmit: pdfActions.onFormSubmit,
      deleteInvoice: savedState.deleteInvoice,
      duplicateInvoice: savedState.duplicateInvoice,
      updateSavedInvoiceStatus: savedState.updateSavedInvoiceStatus,
      recordInvoicePayment: savedState.recordInvoicePayment,
      markInvoiceReminderSent: savedState.markInvoiceReminderSent,
      setInvoiceRecurring: savedState.setInvoiceRecurring,
      generateRecurringInvoice: savedState.generateRecurringInvoice,
      restorePdfFromCache: pdfActions.restorePdfFromCache,
    }),
    [
      pdfActions.onFormSubmit,
      pdfActions.restorePdfFromCache,
      savedState.deleteInvoice,
      savedState.duplicateInvoice,
      savedState.generateRecurringInvoice,
      savedState.markInvoiceReminderSent,
      savedState.recordInvoicePayment,
      savedState.setInvoiceRecurring,
      savedState.updateSavedInvoiceStatus,
    ]
  );
  return (
    <InvoiceContext.Provider value={contextValue}>
      <InvoicePdfViewerContext.Provider value={pdfViewerContextValue}>
        <InvoicePdfViewerStateContext.Provider value={pdfViewerStateContextValue}>
          <FinalPdfContext.Provider value={finalPdfContextValue}>
            <InvoiceActionsContext.Provider value={invoiceActionsContextValue}>
              <InvoiceSubmissionContext.Provider value={invoiceSubmissionContextValue}>
                <InvoiceImportExportContext.Provider value={invoiceImportExportContextValue}>
                  <InvoiceSyncContext.Provider value={invoiceSyncContextValue}>
                    <CustomerTemplatesContext.Provider
                      value={customerTemplatesContextValue}
                    >
                      <SavedInvoicesListDataContext.Provider
                        value={savedInvoicesListDataContextValue}
                      >
                        <SavedInvoicesListActionsContext.Provider
                          value={savedInvoicesListActionsContextValue}
                        >
                          {children}
                        </SavedInvoicesListActionsContext.Provider>
                      </SavedInvoicesListDataContext.Provider>
                    </CustomerTemplatesContext.Provider>
                  </InvoiceSyncContext.Provider>
                </InvoiceImportExportContext.Provider>
              </InvoiceSubmissionContext.Provider>
            </InvoiceActionsContext.Provider>
          </FinalPdfContext.Provider>
        </InvoicePdfViewerStateContext.Provider>
      </InvoicePdfViewerContext.Provider>
    </InvoiceContext.Provider>
  );
};
