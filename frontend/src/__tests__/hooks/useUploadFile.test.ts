import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useUploadFile } from "../../hooks/useUploadFile";

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Mock XMLHttpRequest
class MockXMLHttpRequest {
  upload = { addEventListener: jest.fn() };
  addEventListener = jest.fn();
  open = jest.fn();
  send = jest.fn();
  status = 200;
  statusText = "OK";

  constructor() {
    // Simulate successful upload after a short delay
    setTimeout(() => {
      this.upload.addEventListener.mock.calls.forEach(([event, callback]) => {
        if (event === "progress") {
          callback({ lengthComputable: true, loaded: 50, total: 100 });
          callback({ lengthComputable: true, loaded: 100, total: 100 });
        }
      });
      this.addEventListener.mock.calls.forEach(([event, callback]) => {
        if (event === "load") {
          callback();
        }
      });
    }, 10);
  }
}

global.XMLHttpRequest = MockXMLHttpRequest as any;

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useUploadFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue("mock-token");
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("should upload file successfully", async () => {
    const onProgress = jest.fn();
    const onSuccess = jest.fn();
    const onError = jest.fn();

    // Mock successful API response for file creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uploadUrl: "https://test-bucket.s3.amazonaws.com/",
        fields: {
          key: "test-file-key",
          bucket: "test-bucket",
          "Content-Type": "application/pdf",
        },
        fileId: "file-123",
      }),
    } as Response);

    const { result } = renderHook(
      () => useUploadFile(onProgress, onSuccess, onError),
      { wrapper: createWrapper() }
    );

    const file = new File(["test content"], "test.pdf", { type: "application/pdf" });

    await act(async () => {
      await result.current.uploadFile({ projectId: "project-123", file });
    });

    await waitFor(() => {
      expect(result.current.isUploading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/files/projects/project-123/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer mock-token",
      },
      body: JSON.stringify({
        name: "test.pdf",
        size: file.size,
        mime: "application/pdf",
      }),
    });

    expect(onProgress).toHaveBeenCalledWith({
      loaded: expect.any(Number),
      total: expect.any(Number),
      percentage: expect.any(Number),
    });

    expect(onSuccess).toHaveBeenCalledWith("file-123");
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.progress).toBe(100);
    expect(result.current.error).toBeNull();
  });

  it("should handle API error during file creation", async () => {
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: "File too large",
      }),
    } as Response);

    const { result } = renderHook(
      () => useUploadFile(undefined, undefined, onError),
      { wrapper: createWrapper() }
    );

    const file = new File(["test content"], "test.pdf", { type: "application/pdf" });

    await act(async () => {
      try {
        await result.current.uploadFile({ projectId: "project-123", file });
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.isUploading).toBe(false);
    });

    expect(onError).toHaveBeenCalledWith("File too large");
    expect(result.current.error).toBe("File too large");
  });

  it("should handle S3 upload error", async () => {
    const onError = jest.fn();

    // Mock successful API response but failed S3 upload
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uploadUrl: "https://test-bucket.s3.amazonaws.com/",
        fields: { key: "test-file-key" },
        fileId: "file-123",
      }),
    } as Response);

    // Mock XMLHttpRequest with error
    class MockXMLHttpRequestError {
      upload = { addEventListener: jest.fn() };
      addEventListener = jest.fn();
      open = jest.fn();
      send = jest.fn();
      status = 500;
      statusText = "Internal Server Error";

      constructor() {
        setTimeout(() => {
          this.addEventListener.mock.calls.forEach(([event, callback]) => {
            if (event === "error") {
              callback();
            }
          });
        }, 10);
      }
    }

    global.XMLHttpRequest = MockXMLHttpRequestError as any;

    const { result } = renderHook(
      () => useUploadFile(undefined, undefined, onError),
      { wrapper: createWrapper() }
    );

    const file = new File(["test content"], "test.pdf", { type: "application/pdf" });

    await act(async () => {
      try {
        await result.current.uploadFile({ projectId: "project-123", file });
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.isUploading).toBe(false);
    });

    expect(onError).toHaveBeenCalledWith("Erreur réseau lors de l'upload");
    expect(result.current.error).toBe("Erreur réseau lors de l'upload");
  });

  it("should track upload progress", async () => {
    const onProgress = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uploadUrl: "https://test-bucket.s3.amazonaws.com/",
        fields: { key: "test-file-key" },
        fileId: "file-123",
      }),
    } as Response);

    const { result } = renderHook(
      () => useUploadFile(onProgress),
      { wrapper: createWrapper() }
    );

    const file = new File(["test content"], "test.pdf", { type: "application/pdf" });

    await act(async () => {
      await result.current.uploadFile({ projectId: "project-123", file });
    });

    await waitFor(() => {
      expect(result.current.progress).toBe(100);
    });

    expect(onProgress).toHaveBeenCalledWith({
      loaded: 50,
      total: 100,
      percentage: 50,
    });

    expect(onProgress).toHaveBeenCalledWith({
      loaded: 100,
      total: 100,
      percentage: 100,
    });
  });

  it("should reset state", () => {
    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.isUploading).toBe(false);
  });

  it("should handle missing token", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(),
    });

    const file = new File(["test content"], "test.pdf", { type: "application/pdf" });

    await act(async () => {
      try {
        await result.current.uploadFile({ projectId: "project-123", file });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/files/projects/project-123/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer null",
      },
      body: expect.any(String),
    });
  });
});