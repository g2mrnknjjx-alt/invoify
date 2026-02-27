import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useInvoicePdfActions } from "@/contexts/invoice/useInvoicePdfActions";
import { toPdfFilename } from "@/lib/invoice/pdfFilename";
import { InvoiceType } from "@/types";

const {
  cleanupPdfCacheMock,
  listCachedPdfMetadataMock,
  getCachedPdfMock,
  upsertCachedPdfMock,
  generatePdfBlobMock,
  trackClientEventMock,
  captureClientErrorMock,
} = vi.hoisted(() => ({
  cleanupPdfCacheMock: vi.fn(),
  listCachedPdfMetadataMock: vi.fn(),
  getCachedPdfMock: vi.fn(),
  upsertCachedPdfMock: vi.fn(),
  generatePdfBlobMock: vi.fn(),
  trackClientEventMock: vi.fn(),
  captureClientErrorMock: vi.fn(),
}));

vi.mock("@/lib/storage/pdfCache", () => ({
  cleanupPdfCache: cleanupPdfCacheMock,
  listCachedPdfMetadata: listCachedPdfMetadataMock,
  getCachedPdf: getCachedPdfMock,
  upsertCachedPdf: upsertCachedPdfMock,
}));

vi.mock("@/lib/storage/invoiceDraft", () => ({
  clearInvoiceDraft: vi.fn(),
}));

vi.mock("@/lib/storage/userPreferences", () => ({
  readUserPreferences: vi.fn(() => ({
    defaultCurrency: "USD",
    defaultTemplateId: 1,
    defaultLocale: "en",
  })),
  applyUserPreferencesToInvoice: vi.fn((invoice) => invoice),
}));

vi.mock("@/lib/workers/pdfGeneratorClient", () => ({
  generatePdfBlob: generatePdfBlobMock,
}));

vi.mock("@/lib/telemetry/clientTelemetry", () => ({
  trackClientEvent: trackClientEventMock,
  captureClientError: captureClientErrorMock,
}));

const createInvoice = (overrides?: {
  recipientName?: string;
  invoiceNumber?: string;
  documentType?: "invoice" | "quote";
}) => {
  return {
    receiver: {
      name: overrides?.recipientName || "Client Name",
    },
    details: {
      invoiceNumber: overrides?.invoiceNumber || "INV-1",
      documentType: overrides?.documentType || "invoice",
    },
  } as unknown as InvoiceType;
};

describe("useInvoicePdfActions", () => {
  let currentValues: InvoiceType;
  const resetMock = vi.fn();
  const newInvoiceSuccessMock = vi.fn();
  const pdfGenerationSuccessMock = vi.fn();

  beforeEach(() => {
    currentValues = createInvoice();
    resetMock.mockReset();
    newInvoiceSuccessMock.mockReset();
    pdfGenerationSuccessMock.mockReset();

    cleanupPdfCacheMock.mockResolvedValue(undefined);
    listCachedPdfMetadataMock.mockResolvedValue([]);
    getCachedPdfMock.mockResolvedValue(null);
    upsertCachedPdfMock.mockResolvedValue(null);
    generatePdfBlobMock.mockResolvedValue(
      new Blob(["pdf"], { type: "application/pdf" })
    );
    trackClientEventMock.mockReset();
    captureClientErrorMock.mockReset();
  });

  const renderPdfActions = () => {
    return renderHook(() =>
      useInvoicePdfActions({
        getValues: (() => currentValues) as never,
        reset: resetMock as never,
        newInvoiceSuccess: newInvoiceSuccessMock,
        pdfGenerationSuccess: pdfGenerationSuccessMock,
      })
    );
  };

  it("uses current form/source values when no PDF snapshot exists", async () => {
    currentValues = createInvoice({
      recipientName: "Current Client",
      invoiceNumber: "QTE-7",
      documentType: "quote",
    });
    const explicitSource = createInvoice({
      recipientName: "Explicit Client",
      invoiceNumber: "INV-72",
      documentType: "invoice",
    });

    const { result } = renderPdfActions();
    await waitFor(() => {
      expect(result.current.isPdfCacheHydrated).toBe(true);
    });

    expect(result.current.resolvePdfFilenameMeta()).toEqual({
      recipientName: "Current Client",
      invoiceNumber: "QTE-7",
      documentType: "quote",
    });
    expect(result.current.resolvePdfFilenameMeta(explicitSource)).toEqual({
      recipientName: "Explicit Client",
      invoiceNumber: "INV-72",
      documentType: "invoice",
    });
  });

  it("prefers generated PDF snapshot metadata over current form values", async () => {
    currentValues = createInvoice({
      recipientName: "Before Generate",
      invoiceNumber: "INV-101",
      documentType: "invoice",
    });

    const generatedInvoice = createInvoice({
      recipientName: "Snapshot Client",
      invoiceNumber: "INV-101",
      documentType: "invoice",
    });

    const { result } = renderPdfActions();
    await waitFor(() => {
      expect(result.current.isPdfCacheHydrated).toBe(true);
    });

    await act(async () => {
      await result.current.generatePdf(generatedInvoice);
    });

    currentValues = createInvoice({
      recipientName: "Edited Later",
      invoiceNumber: "QTE-999",
      documentType: "quote",
    });

    const resolvedMeta = result.current.resolvePdfFilenameMeta();
    expect(resolvedMeta).toEqual({
      recipientName: "Snapshot Client",
      invoiceNumber: "INV-101",
      documentType: "invoice",
    });
    expect(result.current.resolvePdfFilenameMeta(currentValues)).toEqual(
      resolvedMeta
    );
    expect(toPdfFilename(resolvedMeta)).toBe("Snapshot_Client_Invoice_INV-101.pdf");
  });

  it("keeps quote filename label from generated snapshot after form toggles", async () => {
    currentValues = createInvoice({
      recipientName: "Alison Nelson",
      invoiceNumber: "QTE-42",
      documentType: "quote",
    });

    const generatedQuote = createInvoice({
      recipientName: "Alison Nelson",
      invoiceNumber: "QTE-42",
      documentType: "quote",
    });

    const { result } = renderPdfActions();
    await waitFor(() => {
      expect(result.current.isPdfCacheHydrated).toBe(true);
    });

    await act(async () => {
      await result.current.generatePdf(generatedQuote);
    });

    currentValues = createInvoice({
      recipientName: "Alison Nelson",
      invoiceNumber: "INV-42",
      documentType: "invoice",
    });

    const resolvedMeta = result.current.resolvePdfFilenameMeta();
    expect(resolvedMeta.documentType).toBe("quote");
    expect(toPdfFilename(resolvedMeta)).toBe("Alison_Nelson_Quote_QTE-42.pdf");
  });
});
