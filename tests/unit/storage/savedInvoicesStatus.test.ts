import { describe, expect, it } from "vitest";

import {
  isSavedInvoiceOverdue,
  recordSavedInvoicePayment,
  updateSavedInvoiceStatus,
} from "@/lib/storage/savedInvoices";
import { InvoiceStatus, SavedInvoiceRecord } from "@/types";

type CreateRecordArgs = {
  id?: string;
  invoiceNumber?: string;
  status?: InvoiceStatus;
  documentType?: "invoice" | "quote";
  dueDate?: string;
  totalAmount?: number;
  amountPaid?: number;
};

const createRecord = ({
  id = "record-1",
  invoiceNumber = "INV-001",
  status = "draft",
  documentType = "invoice",
  dueDate = "2026-02-01T00:00:00.000Z",
  totalAmount = 100,
  amountPaid = 0,
}: CreateRecordArgs = {}): SavedInvoiceRecord => {
  return {
    id,
    invoiceNumber,
    status,
    createdAt: 100,
    updatedAt: 100,
    data: {
      sender: {
        name: "Sender",
        address: "",
        zipCode: "",
        city: "",
        country: "",
        email: "",
        phone: "",
        customInputs: [],
      },
      receiver: {
        name: "Receiver",
        address: "",
        zipCode: "",
        city: "",
        country: "",
        email: "",
        phone: "",
        customInputs: [],
      },
      details: {
        invoiceLogo: "",
        invoiceNumber,
        invoiceDate: "2026-01-01T00:00:00.000Z",
        dueDate,
        purchaseOrderNumber: "",
        currency: "CAD",
        language: "en",
        documentType,
        items: [],
        paymentInformation: {
          bankName: "",
          accountName: "",
          accountNumber: "",
        },
        taxDetails: {
          amount: 0,
          amountType: "amount",
          taxID: "",
        },
        discountDetails: {
          amount: 0,
          amountType: "amount",
        },
        shippingDetails: {
          cost: 0,
          costType: "amount",
        },
        subTotal: totalAmount,
        totalAmount,
        totalAmountInWords: "",
        additionalNotes: "",
        paymentTerms: "",
        updatedAt: "",
        pdfTemplate: 1,
      },
    },
    recurring: {
      enabled: false,
      frequency: null,
      baseInvoiceNumber: invoiceNumber,
      counter: 0,
      lastIssuedAt: null,
      nextIssueAt: null,
    },
    payment: {
      amountPaid,
      lastPaymentAt: null,
    },
    reminder: {
      enabled: true,
      lastSentAt: null,
      sendCount: 0,
      nextReminderAt: null,
    },
    timeline: [
      {
        id: "created-1",
        type: "created",
        at: 100,
      },
    ],
  };
};

describe("savedInvoices status behavior", () => {
  it("returns overdue true for open invoices and false for quotes", () => {
    const now = Date.parse("2026-03-01T00:00:00.000Z");
    const invoice = createRecord({
      id: "invoice-1",
      status: "sent",
      documentType: "invoice",
      dueDate: "2026-02-01T00:00:00.000Z",
    });
    const quote = createRecord({
      id: "quote-1",
      invoiceNumber: "QTE-001",
      status: "sent",
      documentType: "quote",
      dueDate: "2026-02-01T00:00:00.000Z",
    });

    expect(isSavedInvoiceOverdue(invoice, now)).toBe(true);
    expect(isSavedInvoiceOverdue(quote, now)).toBe(false);
  });

  it("does not record payments for quote documents", () => {
    const quote = createRecord({
      id: "quote-1",
      invoiceNumber: "QTE-001",
      status: "sent",
      documentType: "quote",
      amountPaid: 0,
      totalAmount: 500,
    });

    const next = recordSavedInvoicePayment([quote], "quote-1", 250);

    expect(next).toHaveLength(1);
    expect(next[0].payment.amountPaid).toBe(0);
    expect(next[0].status).toBe("sent");
    expect(next[0].timeline.some((event) => event.type === "payment_recorded")).toBe(
      false
    );
  });

  it("supports quote lifecycle statuses", () => {
    const quote = createRecord({
      id: "quote-1",
      invoiceNumber: "QTE-002",
      status: "sent",
      documentType: "quote",
    });

    const next = updateSavedInvoiceStatus([quote], "quote-1", "accepted");

    expect(next[0].status).toBe("accepted");
    expect(next[0].timeline.some((event) => event.type === "status_changed")).toBe(
      true
    );
  });
});
