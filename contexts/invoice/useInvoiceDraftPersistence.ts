import { useEffect, useRef } from "react";
import { UseFormWatch } from "react-hook-form";

import { writeInvoiceDraft } from "@/lib/storage/invoiceDraft";
import { InvoiceType } from "@/types";

export const DRAFT_PERSIST_DEBOUNCE_MS = 300;

type UseInvoiceDraftPersistenceArgs = {
  watch: UseFormWatch<InvoiceType>;
  delayMs?: number;
};

export const useInvoiceDraftPersistence = ({
  watch,
  delayMs = DRAFT_PERSIST_DEBOUNCE_MS,
}: UseInvoiceDraftPersistenceArgs) => {
  const persistTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const subscription = watch((value) => {
      if (persistTimeoutRef.current !== null) {
        window.clearTimeout(persistTimeoutRef.current);
      }

      persistTimeoutRef.current = window.setTimeout(() => {
        writeInvoiceDraft(value);
      }, delayMs);
    });

    return () => {
      subscription.unsubscribe();

      if (persistTimeoutRef.current !== null) {
        window.clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [delayMs, watch]);
};

export type UseInvoiceDraftPersistenceReturn = ReturnType<
  typeof useInvoiceDraftPersistence
>;
