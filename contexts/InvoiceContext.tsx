"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { useAuthContext } from "@/contexts/AuthContext";
import {
  defaultInvoiceContext,
  InvoiceContextValue,
} from "@/contexts/invoice/invoiceContextDefaults";
import {
  CustomerTemplatesActionsContextValue,
  CustomerTemplatesDataContextValue,
  FinalPdfContextValue,
  InvoiceActionsContextValue,
  InvoiceImportExportContextValue,
  InvoiceSelectorProviders,
  InvoiceSubmissionContextValue,
  InvoiceSyncActionsContextValue,
  InvoiceSyncDataContextValue,
  PdfViewerContextValue,
  PdfViewerStateContextValue,
  SavedInvoicesListActionsContextValue,
  SavedInvoicesListDataContextValue,
} from "@/contexts/invoice/invoiceSelectorContexts";
import {
  useCustomerTemplatesState,
} from "@/contexts/invoice/useCustomerTemplatesState";
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
import { InvoiceType } from "@/types";

export const InvoiceContext = createContext(defaultInvoiceContext);

export const useInvoiceContext = () => {
  return useContext(InvoiceContext);
};

export {
  useCustomerTemplatesActions,
  useCustomerTemplatesContext,
  useCustomerTemplatesData,
  useFinalPdfContext,
  useInvoiceActionsContext,
  useInvoiceImportExportContext,
  useInvoicePdfViewerContext,
  useInvoicePdfViewerState,
  useInvoiceSubmissionContext,
  useInvoiceSyncActions,
  useInvoiceSyncContext,
  useInvoiceSyncData,
  useSavedInvoicesListActions,
  useSavedInvoicesListContext,
  useSavedInvoicesListData,
} from "@/contexts/invoice/invoiceSelectorContexts";

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
    invoicePdf: pdfActions.invoicePdf,
    saveInvoiceSuccess,
    modifiedInvoiceSuccess,
  });

  const customerTemplatesState = useCustomerTemplatesState({
    getValues,
    setValue,
  });

  const isStorageHydrated =
    savedState.isSavedInvoicesHydrated &&
    customerTemplatesState.isCustomerTemplatesHydrated &&
    pdfActions.isPdfCacheHydrated;

  const syncState = useInvoiceSyncState({
    isStorageHydrated,
    savedInvoices: savedState.savedInvoices,
    customerTemplates: customerTemplatesState.customerTemplates,
    persistSavedInvoices: savedState.persistSavedInvoices,
    persistCustomerTemplates: customerTemplatesState.persistCustomerTemplates,
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

  const contextValue = useMemo<InvoiceContextValue>(
    () => ({
      invoicePdf: pdfActions.invoicePdf,
      invoicePdfLoading: pdfActions.invoicePdfLoading,
      savedInvoices: savedState.savedInvoices,
      customerTemplates: customerTemplatesState.customerTemplates,
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
      saveCustomerTemplate: customerTemplatesState.saveCustomerTemplate,
      applyCustomerTemplate: customerTemplatesState.applyCustomerTemplate,
      renameCustomerTemplate: customerTemplatesState.renameCustomerTemplate,
      deleteCustomerTemplate: customerTemplatesState.deleteCustomerTemplate,
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
      customerTemplatesState.applyCustomerTemplate,
      customerTemplatesState.customerTemplates,
      customerTemplatesState.deleteCustomerTemplate,
      customerTemplatesState.renameCustomerTemplate,
      customerTemplatesState.saveCustomerTemplate,
      savedState.deleteInvoice,
      savedState.duplicateInvoice,
      savedState.generateRecurringInvoice,
      savedState.markInvoiceReminderSent,
      savedState.recordInvoicePayment,
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

  const pdfViewerContextValue = useMemo<PdfViewerContextValue>(
    () => ({
      invoicePdf: pdfActions.invoicePdf,
    }),
    [pdfActions.invoicePdf]
  );
  const pdfViewerStateContextValue = useMemo<PdfViewerStateContextValue>(
    () => ({
      hasGeneratedPdf: pdfActions.invoicePdf.size > 0,
    }),
    [pdfActions.invoicePdf.size]
  );
  const finalPdfContextValue = useMemo<FinalPdfContextValue>(
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
  const invoiceActionsContextValue = useMemo<InvoiceActionsContextValue>(
    () => ({
      invoicePdfLoading: pdfActions.invoicePdfLoading,
      newInvoice: pdfActions.newInvoice,
      removeFinalPdf: pdfActions.removeFinalPdf,
    }),
    [pdfActions.invoicePdfLoading, pdfActions.newInvoice, pdfActions.removeFinalPdf]
  );
  const invoiceSubmissionContextValue = useMemo<InvoiceSubmissionContextValue>(
    () => ({
      onFormSubmit: pdfActions.onFormSubmit,
    }),
    [pdfActions.onFormSubmit]
  );
  const invoiceImportExportContextValue = useMemo<InvoiceImportExportContextValue>(
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
  const invoiceSyncDataContextValue = useMemo<InvoiceSyncDataContextValue>(
    () => ({
      syncStatus: syncState.syncStatus,
      syncConflicts: syncState.syncConflicts,
    }),
    [syncState.syncConflicts, syncState.syncStatus]
  );
  const invoiceSyncActionsContextValue = useMemo<InvoiceSyncActionsContextValue>(
    () => ({
      resolveSyncConflict: syncState.resolveSyncConflict,
      resolveSyncConflictsWithDefaults: syncState.resolveSyncConflictsWithDefaults,
    }),
    [
      syncState.resolveSyncConflict,
      syncState.resolveSyncConflictsWithDefaults,
    ]
  );
  const customerTemplatesDataContextValue =
    useMemo<CustomerTemplatesDataContextValue>(
    () => ({
      customerTemplates: customerTemplatesState.customerTemplates,
    }),
    [customerTemplatesState.customerTemplates]
  );
  const customerTemplatesActionsContextValue =
    useMemo<CustomerTemplatesActionsContextValue>(
    () => ({
      saveCustomerTemplate: customerTemplatesState.saveCustomerTemplate,
      applyCustomerTemplate: customerTemplatesState.applyCustomerTemplate,
      renameCustomerTemplate: customerTemplatesState.renameCustomerTemplate,
      deleteCustomerTemplate: customerTemplatesState.deleteCustomerTemplate,
    }),
    [
      customerTemplatesState.applyCustomerTemplate,
      customerTemplatesState.deleteCustomerTemplate,
      customerTemplatesState.renameCustomerTemplate,
      customerTemplatesState.saveCustomerTemplate,
    ]
  );

  const savedInvoicesListDataContextValue = useMemo<SavedInvoicesListDataContextValue>(
    () => ({
      savedInvoices: savedState.savedInvoices,
      getCachedPdfMeta: pdfActions.getCachedPdfMeta,
    }),
    [pdfActions.getCachedPdfMeta, savedState.savedInvoices]
  );

  const savedInvoicesListActionsContextValue =
    useMemo<SavedInvoicesListActionsContextValue>(
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
      <InvoiceSelectorProviders
        pdfViewerContextValue={pdfViewerContextValue}
        pdfViewerStateContextValue={pdfViewerStateContextValue}
        finalPdfContextValue={finalPdfContextValue}
        invoiceActionsContextValue={invoiceActionsContextValue}
        invoiceSubmissionContextValue={invoiceSubmissionContextValue}
        invoiceImportExportContextValue={invoiceImportExportContextValue}
        invoiceSyncDataContextValue={invoiceSyncDataContextValue}
        invoiceSyncActionsContextValue={invoiceSyncActionsContextValue}
        customerTemplatesDataContextValue={customerTemplatesDataContextValue}
        customerTemplatesActionsContextValue={customerTemplatesActionsContextValue}
        savedInvoicesListDataContextValue={savedInvoicesListDataContextValue}
        savedInvoicesListActionsContextValue={savedInvoicesListActionsContextValue}
      >
        {children}
      </InvoiceSelectorProviders>
    </InvoiceContext.Provider>
  );
};
