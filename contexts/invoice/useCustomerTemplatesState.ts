import { useCallback, useEffect, useState } from "react";
import { UseFormGetValues, UseFormSetValue } from "react-hook-form";

import {
  addCustomerTemplate,
  findCustomerTemplate,
  readCustomerTemplates,
  renameCustomerTemplate as renameCustomerTemplateInRecords,
  removeCustomerTemplate,
  writeCustomerTemplates,
} from "@/lib/storage/customerTemplates";
import { captureClientError } from "@/lib/telemetry/clientTelemetry";
import { CustomerTemplateRecord, InvoiceType } from "@/types";

type PersistCustomerTemplates = (
  nextRecords: CustomerTemplateRecord[],
  action: string,
  metadata?: Record<string, unknown>
) => void;

type UseCustomerTemplatesStateArgs = {
  getValues: UseFormGetValues<InvoiceType>;
  setValue: UseFormSetValue<InvoiceType>;
};

export const useCustomerTemplatesState = ({
  getValues,
  setValue,
}: UseCustomerTemplatesStateArgs) => {
  const [customerTemplates, setCustomerTemplates] = useState<
    CustomerTemplateRecord[]
  >([]);
  const [isCustomerTemplatesHydrated, setIsCustomerTemplatesHydrated] =
    useState(false);

  const persistCustomerTemplates = useCallback<PersistCustomerTemplates>(
    (nextRecords, action, metadata) => {
      setCustomerTemplates(nextRecords);
      const persisted = writeCustomerTemplates(nextRecords);
      if (!persisted) {
        captureClientError(
          "app_error",
          new Error("Failed to persist customer templates"),
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
      setCustomerTemplates(readCustomerTemplates());
    } catch (error) {
      captureClientError("app_error", error, {
        area: "invoice_context_templates_hydrate",
      });
    } finally {
      setIsCustomerTemplatesHydrated(true);
    }
  }, []);

  const saveCustomerTemplate = useCallback(
    (name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      const formValues = getValues();
      const nextTemplates = addCustomerTemplate(
        customerTemplates,
        trimmedName,
        formValues.sender,
        formValues.receiver
      );

      persistCustomerTemplates(nextTemplates, "save_template");
    },
    [customerTemplates, getValues, persistCustomerTemplates]
  );

  const applyCustomerTemplate = useCallback(
    (templateId: string) => {
      const template = findCustomerTemplate(customerTemplates, templateId);
      if (!template) return false;

      setValue("sender", template.sender, {
        shouldDirty: true,
      });

      setValue("receiver", template.receiver, {
        shouldDirty: true,
      });

      return true;
    },
    [customerTemplates, setValue]
  );

  const deleteCustomerTemplate = useCallback(
    (templateId: string) => {
      const nextTemplates = removeCustomerTemplate(customerTemplates, templateId);
      persistCustomerTemplates(nextTemplates, "delete_template", {
        templateId,
      });
    },
    [customerTemplates, persistCustomerTemplates]
  );

  const renameCustomerTemplate = useCallback(
    (templateId: string, name: string) => {
      const nextTemplates = renameCustomerTemplateInRecords(
        customerTemplates,
        templateId,
        name
      );

      if (nextTemplates === customerTemplates) {
        return false;
      }

      persistCustomerTemplates(nextTemplates, "rename_template", {
        templateId,
      });
      return true;
    },
    [customerTemplates, persistCustomerTemplates]
  );

  return {
    customerTemplates,
    isCustomerTemplatesHydrated,
    setCustomerTemplates,
    persistCustomerTemplates,
    saveCustomerTemplate,
    applyCustomerTemplate,
    deleteCustomerTemplate,
    renameCustomerTemplate,
  };
};

export type UseCustomerTemplatesStateReturn = ReturnType<
  typeof useCustomerTemplatesState
>;
