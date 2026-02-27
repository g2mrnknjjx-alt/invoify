import React, { createContext, useContext, useMemo } from "react";

import {
  defaultInvoiceContext,
  InvoiceContextValue,
} from "@/contexts/invoice/invoiceContextDefaults";

export type PdfViewerContextValue = Pick<InvoiceContextValue, "invoicePdf">;
export type PdfViewerStateContextValue = {
  hasGeneratedPdf: boolean;
};
export type FinalPdfContextValue = Pick<
  InvoiceContextValue,
  | "pdfUrl"
  | "removeFinalPdf"
  | "previewPdfInTab"
  | "downloadPdf"
  | "printPdf"
  | "saveInvoice"
  | "sendPdfToMail"
>;
export type InvoiceActionsContextValue = Pick<
  InvoiceContextValue,
  "invoicePdfLoading" | "newInvoice" | "removeFinalPdf"
>;
export type InvoiceSubmissionContextValue = Pick<
  InvoiceContextValue,
  "onFormSubmit"
>;
export type InvoiceImportExportContextValue = Pick<
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
export type InvoiceSyncDataContextValue = Pick<
  InvoiceSyncContextValue,
  "syncStatus" | "syncConflicts"
>;
export type InvoiceSyncActionsContextValue = Omit<
  InvoiceSyncContextValue,
  "syncStatus" | "syncConflicts"
>;
type CustomerTemplatesContextValue = Pick<
  InvoiceContextValue,
  | "customerTemplates"
  | "saveCustomerTemplate"
  | "applyCustomerTemplate"
  | "renameCustomerTemplate"
  | "deleteCustomerTemplate"
>;
export type CustomerTemplatesDataContextValue = Pick<
  CustomerTemplatesContextValue,
  "customerTemplates"
>;
export type CustomerTemplatesActionsContextValue = Omit<
  CustomerTemplatesContextValue,
  "customerTemplates"
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
export type SavedInvoicesListDataContextValue = Pick<
  SavedInvoicesListContextValue,
  "savedInvoices" | "getCachedPdfMeta"
>;
export type SavedInvoicesListActionsContextValue = Omit<
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
const defaultInvoiceSyncDataContext: InvoiceSyncDataContextValue = {
  syncStatus: defaultInvoiceContext.syncStatus,
  syncConflicts: defaultInvoiceContext.syncConflicts,
};
const defaultInvoiceSyncActionsContext: InvoiceSyncActionsContextValue = {
  resolveSyncConflict: defaultInvoiceContext.resolveSyncConflict,
  resolveSyncConflictsWithDefaults:
    defaultInvoiceContext.resolveSyncConflictsWithDefaults,
};
const defaultCustomerTemplatesDataContext: CustomerTemplatesDataContextValue = {
  customerTemplates: defaultInvoiceContext.customerTemplates,
};
const defaultCustomerTemplatesActionsContext: CustomerTemplatesActionsContextValue = {
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
const InvoiceSyncDataContext = createContext(defaultInvoiceSyncDataContext);
const InvoiceSyncActionsContext = createContext(defaultInvoiceSyncActionsContext);
const CustomerTemplatesDataContext = createContext(defaultCustomerTemplatesDataContext);
const CustomerTemplatesActionsContext = createContext(
  defaultCustomerTemplatesActionsContext
);
const SavedInvoicesListDataContext = createContext(defaultSavedInvoicesListDataContext);
const SavedInvoicesListActionsContext = createContext(
  defaultSavedInvoicesListActionsContext
);

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
  const data = useInvoiceSyncData();
  const actions = useInvoiceSyncActions();

  return useMemo(
    () => ({
      ...data,
      ...actions,
    }),
    [actions, data]
  );
};

export const useInvoiceSyncData = () => {
  return useContext(InvoiceSyncDataContext);
};

export const useInvoiceSyncActions = () => {
  return useContext(InvoiceSyncActionsContext);
};

export const useCustomerTemplatesContext = () => {
  const data = useCustomerTemplatesData();
  const actions = useCustomerTemplatesActions();

  return useMemo(
    () => ({
      ...data,
      ...actions,
    }),
    [actions, data]
  );
};

export const useCustomerTemplatesData = () => {
  return useContext(CustomerTemplatesDataContext);
};

export const useCustomerTemplatesActions = () => {
  return useContext(CustomerTemplatesActionsContext);
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

type InvoiceSelectorProvidersProps = {
  children: React.ReactNode;
  pdfViewerContextValue: PdfViewerContextValue;
  pdfViewerStateContextValue: PdfViewerStateContextValue;
  finalPdfContextValue: FinalPdfContextValue;
  invoiceActionsContextValue: InvoiceActionsContextValue;
  invoiceSubmissionContextValue: InvoiceSubmissionContextValue;
  invoiceImportExportContextValue: InvoiceImportExportContextValue;
  invoiceSyncDataContextValue: InvoiceSyncDataContextValue;
  invoiceSyncActionsContextValue: InvoiceSyncActionsContextValue;
  customerTemplatesDataContextValue: CustomerTemplatesDataContextValue;
  customerTemplatesActionsContextValue: CustomerTemplatesActionsContextValue;
  savedInvoicesListDataContextValue: SavedInvoicesListDataContextValue;
  savedInvoicesListActionsContextValue: SavedInvoicesListActionsContextValue;
};

export const InvoiceSelectorProviders = ({
  children,
  pdfViewerContextValue,
  pdfViewerStateContextValue,
  finalPdfContextValue,
  invoiceActionsContextValue,
  invoiceSubmissionContextValue,
  invoiceImportExportContextValue,
  invoiceSyncDataContextValue,
  invoiceSyncActionsContextValue,
  customerTemplatesDataContextValue,
  customerTemplatesActionsContextValue,
  savedInvoicesListDataContextValue,
  savedInvoicesListActionsContextValue,
}: InvoiceSelectorProvidersProps) => {
  return (
    <InvoicePdfViewerContext.Provider value={pdfViewerContextValue}>
      <InvoicePdfViewerStateContext.Provider value={pdfViewerStateContextValue}>
        <FinalPdfContext.Provider value={finalPdfContextValue}>
          <InvoiceActionsContext.Provider value={invoiceActionsContextValue}>
            <InvoiceSubmissionContext.Provider value={invoiceSubmissionContextValue}>
              <InvoiceImportExportContext.Provider value={invoiceImportExportContextValue}>
                <InvoiceSyncDataContext.Provider value={invoiceSyncDataContextValue}>
                  <InvoiceSyncActionsContext.Provider
                    value={invoiceSyncActionsContextValue}
                  >
                    <CustomerTemplatesDataContext.Provider
                      value={customerTemplatesDataContextValue}
                    >
                      <CustomerTemplatesActionsContext.Provider
                        value={customerTemplatesActionsContextValue}
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
                      </CustomerTemplatesActionsContext.Provider>
                    </CustomerTemplatesDataContext.Provider>
                  </InvoiceSyncActionsContext.Provider>
                </InvoiceSyncDataContext.Provider>
              </InvoiceImportExportContext.Provider>
            </InvoiceSubmissionContext.Provider>
          </InvoiceActionsContext.Provider>
        </FinalPdfContext.Provider>
      </InvoicePdfViewerStateContext.Provider>
    </InvoicePdfViewerContext.Provider>
  );
};
