import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DRAFT_PERSIST_DEBOUNCE_MS,
  useInvoiceDraftPersistence,
} from "@/contexts/invoice/useInvoiceDraftPersistence";
import { InvoiceType } from "@/types";

const { writeInvoiceDraftMock } = vi.hoisted(() => ({
  writeInvoiceDraftMock: vi.fn(),
}));

vi.mock("@/lib/storage/invoiceDraft", () => ({
  writeInvoiceDraft: writeInvoiceDraftMock,
}));

describe("useInvoiceDraftPersistence", () => {
  type WatchCallback = (value: Partial<InvoiceType>) => void;
  let watchCallback: WatchCallback | null = null;
  let unsubscribeMock: ReturnType<typeof vi.fn>;
  let watchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeInvoiceDraftMock.mockReset();

    watchCallback = null;
    unsubscribeMock = vi.fn();
    watchMock = vi.fn((callback: WatchCallback) => {
      watchCallback = callback;
      return {
        unsubscribe: unsubscribeMock,
      };
    });
  });

  it("persists form draft after debounce", () => {
    renderHook(() =>
      useInvoiceDraftPersistence({
        watch: watchMock as never,
      })
    );

    expect(watchMock).toHaveBeenCalledTimes(1);
    expect(writeInvoiceDraftMock).not.toHaveBeenCalled();

    watchCallback?.({
      details: {
        invoiceNumber: "INV-1",
      },
    } as Partial<InvoiceType>);

    vi.advanceTimersByTime(DRAFT_PERSIST_DEBOUNCE_MS - 1);
    expect(writeInvoiceDraftMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(writeInvoiceDraftMock).toHaveBeenCalledTimes(1);
    expect(writeInvoiceDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          invoiceNumber: "INV-1",
        }),
      })
    );
  });

  it("coalesces rapid watch updates and persists only the latest", () => {
    renderHook(() =>
      useInvoiceDraftPersistence({
        watch: watchMock as never,
        delayMs: 100,
      })
    );

    watchCallback?.({
      details: {
        invoiceNumber: "INV-1",
      },
    } as Partial<InvoiceType>);
    vi.advanceTimersByTime(50);

    watchCallback?.({
      details: {
        invoiceNumber: "INV-2",
      },
    } as Partial<InvoiceType>);
    vi.advanceTimersByTime(99);
    expect(writeInvoiceDraftMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(writeInvoiceDraftMock).toHaveBeenCalledTimes(1);
    expect(writeInvoiceDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          invoiceNumber: "INV-2",
        }),
      })
    );
  });

  it("unsubscribes and clears pending debounce timer on unmount", () => {
    const { unmount } = renderHook(() =>
      useInvoiceDraftPersistence({
        watch: watchMock as never,
        delayMs: 100,
      })
    );

    watchCallback?.({
      details: {
        invoiceNumber: "INV-3",
      },
    } as Partial<InvoiceType>);
    unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(writeInvoiceDraftMock).not.toHaveBeenCalled();
  });
});
