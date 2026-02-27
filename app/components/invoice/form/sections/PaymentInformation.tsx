"use client";

import { useState } from "react";

import { useFormContext, useWatch } from "react-hook-form";

// Components
import { BaseButton, FormInput, Subheading } from "@/app/components";
import { toast } from "@/components/ui/use-toast";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import { normalizeDocumentType } from "@/lib/invoice/documentType";
import { createPaymentLink } from "@/services/invoice/client/createPaymentLink";
import { InvoiceType } from "@/types";

const PaymentInformation = () => {
  const { _t } = useTranslationContext();
  const { control, getValues, setValue } = useFormContext<InvoiceType>();
  const [isGeneratingPaymentLink, setIsGeneratingPaymentLink] = useState(false);

  const documentType = useWatch({
    control,
    name: "details.documentType",
  });
  const totalAmount = useWatch({
    control,
    name: "details.totalAmount",
  });

  const canGeneratePaymentLink =
    Number.isFinite(Number(totalAmount)) && Number(totalAmount) > 0;

  const handleGeneratePaymentLink = async () => {
    const formValues = getValues();
    const invoiceNumber = formValues.details.invoiceNumber.trim();
    const amount = Number(formValues.details.totalAmount);

    if (!invoiceNumber) {
      toast({
        variant: "destructive",
        title: _t("form.steps.paymentInfo.paymentLinkErrors.missingInvoiceNumber"),
        description: _t("form.steps.paymentInfo.paymentLinkErrors.updateInvoiceNumber"),
      });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: _t("form.steps.paymentInfo.paymentLinkErrors.invalidAmount"),
        description: _t("form.steps.paymentInfo.paymentLinkErrors.updateTotalAmount"),
      });
      return;
    }

    setIsGeneratingPaymentLink(true);

    try {
      const url = await createPaymentLink({
        invoiceNumber,
        documentType: normalizeDocumentType(documentType),
        currency: formValues.details.currency,
        amount,
        customerEmail: formValues.receiver.email,
      });

      setValue("details.paymentLinkUrl", url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      toast({
        title: _t("form.steps.paymentInfo.paymentLinkSuccess.title"),
        description: _t("form.steps.paymentInfo.paymentLinkSuccess.description"),
      });
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : _t("form.steps.paymentInfo.paymentLinkErrors.generic");

      toast({
        variant: "destructive",
        title: _t("form.steps.paymentInfo.paymentLinkErrors.generic"),
        description: reason,
      });
    } finally {
      setIsGeneratingPaymentLink(false);
    }
  };

  return (
    <section>
      <Subheading>{_t("form.steps.paymentInfo.heading")}:</Subheading>
      <div className="flex flex-wrap gap-10 mt-5">
        <FormInput
          name="details.paymentInformation.bankName"
          label={_t("form.steps.paymentInfo.bankName")}
          placeholder={_t("form.steps.paymentInfo.bankName")}
          vertical
        />
        <FormInput
          name="details.paymentInformation.accountName"
          label={_t("form.steps.paymentInfo.accountName")}
          placeholder={_t("form.steps.paymentInfo.accountName")}
          vertical
        />
        <FormInput
          name="details.paymentInformation.accountNumber"
          label={_t("form.steps.paymentInfo.accountNumber")}
          placeholder={_t("form.steps.paymentInfo.accountNumber")}
          vertical
        />
        <div className="flex flex-col gap-2">
          <FormInput
            name="details.paymentLinkUrl"
            label={_t("form.steps.paymentInfo.paymentLinkUrl")}
            placeholder={_t("form.steps.paymentInfo.paymentLinkPlaceholder")}
            className="w-[26rem]"
            vertical
          />
          <BaseButton
            variant="outline"
            className="w-fit"
            onClick={handleGeneratePaymentLink}
            loading={isGeneratingPaymentLink}
            loadingText={_t("form.steps.paymentInfo.generatingPaymentLink")}
            disabled={!canGeneratePaymentLink || isGeneratingPaymentLink}
          >
            {_t("form.steps.paymentInfo.generatePaymentLink")}
          </BaseButton>
        </div>
      </div>
    </section>
  );
};

export default PaymentInformation;
