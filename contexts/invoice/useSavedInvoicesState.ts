import { useCallback, useEffect, useState } from "react";
import { UseFormGetValues } from "react-hook-form";
import {
  duplicateSavedInvoiceRecord,
  generateNextRecurringInvoice as generateNextRecurringInvoiceInRecords,
  markSavedInvoiceReminderSent as markSavedInvoiceReminderSentInRecords,
  readSavedInvoices,
  recordSavedInvoicePayment as recordSavedInvoicePaymentInRecords,
  removeSavedInvoiceRecord,
  setSavedInvoiceRecurring as setSavedInvoiceRecurringInRecords,
  upsertSavedInvoiceRecord,
  updateSavedInvoiceStatus as updateSavedInvoiceStatusInRecords,
  writeSavedInvoices,
} from "@/lib/storage/savedInvoices";
import { SHORT_DATE_OPTIONS } from "@/lib/variables";
import { captureClientError } from "@/lib/telemetry/clientTelemetry";
import {
  InvoiceStatus,
  InvoiceType,
  RecurringFrequency,
  SavedInvoiceRecord,
} from "@/types";

type PersistSavedInvoices = (
  nextRecords: SavedInvoiceRecord[],
  action: string,
  metadata?: Record<string, unknown>
) => void;

type UseSavedInvoicesStateArgs = {
  getValues: UseFormGetValues<InvoiceType>;
  invoicePdf: Blob;
  saveInvoiceSuccess: () => void;
  modifiedInvoiceSuccess: () => void;
};

export const useSavedInvoicesState = ({
  getValues,
  invoicePdf,
  saveInvoiceSuccess,
  modifiedInvoiceSuccess,
}: UseSavedInvoicesStateArgs) => {
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoiceRecord[]>([]);
  const [isSavedInvoicesHydrated, setIsSavedInvoicesHydrated] = useState(false);

  const persistSavedInvoices = useCallback<PersistSavedInvoices>(
    (nextRecords, action, metadata) => {
      setSavedInvoices(nextRecords);
      const persisted = writeSavedInvoices(nextRecords);
      if (!persisted) {
        captureClientError(
          "app_error",
          new Error("Failed to persist saved invoices"),
          {
            action,
            ...(metadata || {}),
          }
        );
      }
    },
    []
  );

  useEffect(() => {
    try {
      setSavedInvoices(readSavedInvoices());
    } catch (error) {
      captureClientError("app_error", error, {
        area: "invoice_context_storage_hydrate",
      });
    } finally {
      setIsSavedInvoicesHydrated(true);
    }
  }, []);

  const saveInvoice = useCallback(() => {
    if (!invoicePdf || invoicePdf.size === 0) return;

    const formValues = JSON.parse(JSON.stringify(getValues())) as InvoiceType;
    formValues.details.updatedAt = new Date().toLocaleDateString(
      "en-US",
      SHORT_DATE_OPTIONS
    );

    const alreadyExists = savedInvoices.some(
      (record) => record.invoiceNumber === formValues.details.invoiceNumber
    );

    const { nextRecords } = upsertSavedInvoiceRecord(
      savedInvoices,
      formValues,
      "draft"
    );

    persistSavedInvoices(nextRecords, "save_invoice");

    if (alreadyExists) {
      modifiedInvoiceSuccess();
    } else {
      saveInvoiceSuccess();
    }
  }, [
    getValues,
    invoicePdf,
    modifiedInvoiceSuccess,
    persistSavedInvoices,
    saveInvoiceSuccess,
    savedInvoices,
  ]);

  const deleteInvoice = useCallback(
    (id: string) => {
      const updatedInvoices = removeSavedInvoiceRecord(savedInvoices, id);
      persistSavedInvoices(updatedInvoices, "delete_invoice", { id });
    },
    [persistSavedInvoices, savedInvoices]
  );

  const duplicateInvoice = useCallback(
    (id: string) => {
      const updatedInvoices = duplicateSavedInvoiceRecord(savedInvoices, id);
      persistSavedInvoices(updatedInvoices, "duplicate_invoice", { id });
    },
    [persistSavedInvoices, savedInvoices]
  );

  const updateSavedInvoiceStatus = useCallback(
    (id: string, status: InvoiceStatus) => {
      const updatedInvoices = updateSavedInvoiceStatusInRecords(
        savedInvoices,
        id,
        status
      );

      persistSavedInvoices(updatedInvoices, "update_status", { id, status });
    },
    [persistSavedInvoices, savedInvoices]
  );

  const recordInvoicePayment = useCallback(
    (id: string, amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) return false;

      const hasTarget = savedInvoices.some((record) => record.id === id);
      if (!hasTarget) return false;

      const updatedInvoices = recordSavedInvoicePaymentInRecords(
        savedInvoices,
        id,
        amount
      );
      persistSavedInvoices(updatedInvoices, "record_payment", { id, amount });
      return true;
    },
    [persistSavedInvoices, savedInvoices]
  );

  const markInvoiceReminderSent = useCallback(
    (id: string) => {
      const hasTarget = savedInvoices.some((record) => record.id === id);
      if (!hasTarget) return false;

      const updatedInvoices = markSavedInvoiceReminderSentInRecords(savedInvoices, id);
      persistSavedInvoices(updatedInvoices, "mark_reminder_sent", { id });
      return true;
    },
    [persistSavedInvoices, savedInvoices]
  );

  const setInvoiceRecurring = useCallback(
    (id: string, frequency: RecurringFrequency | null) => {
      const hasTarget = savedInvoices.some((record) => record.id === id);
      if (!hasTarget) return false;

      const updatedInvoices = setSavedInvoiceRecurringInRecords(
        savedInvoices,
        id,
        frequency
      );
      persistSavedInvoices(updatedInvoices, "set_recurring", {
        id,
        frequency: frequency || "none",
      });
      return true;
    },
    [persistSavedInvoices, savedInvoices]
  );

  const generateRecurringInvoice = useCallback(
    (id: string) => {
      const updatedInvoices = generateNextRecurringInvoiceInRecords(savedInvoices, id);
      if (updatedInvoices === savedInvoices) return false;

      persistSavedInvoices(updatedInvoices, "generate_recurring_invoice", { id });
      return true;
    },
    [persistSavedInvoices, savedInvoices]
  );

  return {
    savedInvoices,
    isSavedInvoicesHydrated,
    setSavedInvoices,
    persistSavedInvoices,
    saveInvoice,
    deleteInvoice,
    duplicateInvoice,
    updateSavedInvoiceStatus,
    recordInvoicePayment,
    markInvoiceReminderSent,
    setInvoiceRecurring,
    generateRecurringInvoice,
  };
};

export type UseSavedInvoicesStateReturn = ReturnType<typeof useSavedInvoicesState>;
