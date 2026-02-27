import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCustomerTemplatesState } from "@/contexts/invoice/useCustomerTemplatesState";
import { CustomerTemplateRecord, InvoiceType } from "@/types";

const { readCustomerTemplatesMock, writeCustomerTemplatesMock, captureClientErrorMock } =
  vi.hoisted(() => ({
    readCustomerTemplatesMock: vi.fn(),
    writeCustomerTemplatesMock: vi.fn(),
    captureClientErrorMock: vi.fn(),
  }));

vi.mock("@/lib/storage/customerTemplates", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/storage/customerTemplates")
  >("@/lib/storage/customerTemplates");

  return {
    ...actual,
    readCustomerTemplates: readCustomerTemplatesMock,
    writeCustomerTemplates: writeCustomerTemplatesMock,
  };
});

vi.mock("@/lib/telemetry/clientTelemetry", () => ({
  captureClientError: captureClientErrorMock,
}));

const createTemplate = (id: string, name: string): CustomerTemplateRecord => ({
  id,
  name,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  sender: {
    name: "Ray Harrison",
    address: "123 Main St",
    city: "Calgary",
    state: "AB",
    country: "Canada",
    zip: "T2Z 0J1",
    phone: "",
    email: "ray@vestra.ca",
  },
  receiver: {
    name: "Alison Nelson",
    address: "456 Client Ave",
    city: "Calgary",
    state: "AB",
    country: "Canada",
    zip: "T2Z 0J1",
    phone: "",
    email: "alison@example.com",
  },
});

describe("useCustomerTemplatesState", () => {
  let currentValues: InvoiceType;
  let setValueMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    currentValues = {
      sender: createTemplate("s", "Sender Template").sender,
      receiver: createTemplate("r", "Receiver Template").receiver,
    } as InvoiceType;
    setValueMock = vi.fn();
    readCustomerTemplatesMock.mockReset();
    writeCustomerTemplatesMock.mockReset();
    captureClientErrorMock.mockReset();
    writeCustomerTemplatesMock.mockReturnValue(true);
  });

  const renderTemplatesState = () => {
    return renderHook(() =>
      useCustomerTemplatesState({
        getValues: (() => currentValues) as never,
        setValue: setValueMock as never,
      })
    );
  };

  it("hydrates templates from storage and marks hydration complete", async () => {
    readCustomerTemplatesMock.mockReturnValue([createTemplate("tpl-1", "Template 1")]);

    const { result } = renderTemplatesState();

    await waitFor(() => {
      expect(result.current.isCustomerTemplatesHydrated).toBe(true);
    });

    expect(result.current.customerTemplates).toHaveLength(1);
    expect(result.current.customerTemplates[0].name).toBe("Template 1");
  });

  it("applies selected template values into sender and receiver fields", async () => {
    const template = createTemplate("tpl-2", "Template 2");
    readCustomerTemplatesMock.mockReturnValue([template]);

    const { result } = renderTemplatesState();
    await waitFor(() => {
      expect(result.current.isCustomerTemplatesHydrated).toBe(true);
    });

    let applied = false;
    act(() => {
      applied = result.current.applyCustomerTemplate("tpl-2");
    });

    expect(applied).toBe(true);
    expect(setValueMock).toHaveBeenNthCalledWith(1, "sender", template.sender, {
      shouldDirty: true,
    });
    expect(setValueMock).toHaveBeenNthCalledWith(2, "receiver", template.receiver, {
      shouldDirty: true,
    });
  });

  it("saves new templates with trimmed names", async () => {
    readCustomerTemplatesMock.mockReturnValue([]);

    const { result } = renderTemplatesState();
    await waitFor(() => {
      expect(result.current.isCustomerTemplatesHydrated).toBe(true);
    });

    act(() => {
      result.current.saveCustomerTemplate("  ACME  ");
    });

    expect(writeCustomerTemplatesMock).toHaveBeenCalledTimes(1);
    const [[nextTemplates]] = writeCustomerTemplatesMock.mock.calls;
    expect(Array.isArray(nextTemplates)).toBe(true);
    expect(nextTemplates).toHaveLength(1);
    expect(nextTemplates[0].name).toBe("ACME");
  });
});
