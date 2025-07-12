import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useProjectFiles, useDeleteFile, useDownloadFile, fileUtils } from "../../hooks/useProjectFiles";

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

// Mock DOM methods
const mockCreateElement = jest.fn();
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(document, "createElement", { value: mockCreateElement });
Object.defineProperty(document.body, "appendChild", { value: mockAppendChild });
Object.defineProperty(document.body, "removeChild", { value: mockRemoveChild });
Object.defineProperty(window.URL, "createObjectURL", { value: mockCreateObjectURL });
Object.defineProperty(window.URL, "revokeObjectURL", { value: mockRevokeObjectURL });

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

describe("useProjectFiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue("mock-token");
  });

  it("should fetch project files successfully", async () => {
    const mockFiles = [
      {
        id: "file-1",
        filename: "test.pdf",
        mimeType: "application/pdf",
        size: 1024,
        url: "https://bucket.s3.amazonaws.com/test.pdf",
        type: "DOCUMENT",
        commandeId: "project-123",
        uploadedAt: "2023-12-01T10:00:00Z",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: mockFiles, count: 1 }),
    } as Response);

    const { result } = renderHook(
      () => useProjectFiles("project-123"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.files).toEqual(mockFiles);
    expect(result.current.count).toBe(1);
    expect(result.current.error).toBeNull();

    expect(mockFetch).toHaveBeenCalledWith("/api/files/projects/project-123/files", {
      method: "GET",
      headers: {
        "Authorization": "Bearer mock-token",
        "Content-Type": "application/json",
      },
    });
  });

  it("should handle fetch error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => ({ message: "Access denied" }),
    } as Response);

    const { result } = renderHook(
      () => useProjectFiles("project-123"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.files).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.error?.message).toBe("Access denied");
  });

  it("should not fetch if projectId is empty", () => {
    const { result } = renderHook(
      () => useProjectFiles(""),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.files).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should not fetch if disabled", () => {
    const { result } = renderHook(
      () => useProjectFiles("project-123", false),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.files).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should handle missing token", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Token d'authentification manquant" }),
    } as Response);

    const { result } = renderHook(
      () => useProjectFiles("project-123"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe("Token d'authentification manquant");
  });
});

describe("useDeleteFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue("mock-token");
  });

  it("should delete file successfully", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "File deleted successfully" }),
    } as Response);

    const { result } = renderHook(
      () => useDeleteFile("project-123", onSuccess, onError),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.deleteFile("file-123");
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/files/projects/project-123/files/file-123", {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer mock-token",
        "Content-Type": "application/json",
      },
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("should handle delete error", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: "Access denied" }),
    } as Response);

    const { result } = renderHook(
      () => useDeleteFile("project-123", onSuccess, onError),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.deleteFile("file-123");
      } catch (error) {
        // Expected to throw
      }
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("Access denied");
    expect(result.current.error).toBe("Access denied");
  });
});

describe("useDownloadFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue("mock-token");
    
    // Setup DOM mocks
    const mockLink = {
      href: "",
      download: "",
      target: "",
      click: mockClick,
    };
    mockCreateElement.mockReturnValue(mockLink);
    mockCreateObjectURL.mockReturnValue("blob:mock-url");
  });

  it("should download S3 file directly", async () => {
    const { result } = renderHook(() => useDownloadFile("project-123"));

    const mockFile = {
      id: "file-1",
      filename: "test.pdf",
      mimeType: "application/pdf",
      size: 1024,
      url: "https://bucket.s3.amazonaws.com/test.pdf",
      type: "DOCUMENT" as const,
      commandeId: "project-123",
      uploadedAt: "2023-12-01T10:00:00Z",
    };

    await act(async () => {
      await result.current.downloadFile(mockFile);
    });

    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockClick).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
  });

  it("should download non-S3 file via API", async () => {
    const mockBlob = new Blob(["file content"], { type: "application/pdf" });
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as Response);

    const { result } = renderHook(() => useDownloadFile("project-123"));

    const mockFile = {
      id: "file-1",
      filename: "test.pdf",
      mimeType: "application/pdf",
      size: 1024,
      url: "http://localhost:3001/uploads/test.pdf",
      type: "DOCUMENT" as const,
      commandeId: "project-123",
      uploadedAt: "2023-12-01T10:00:00Z",
    };

    await act(async () => {
      await result.current.downloadFile(mockFile);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/files/download/file-1", {
      method: "GET",
      headers: {
        "Authorization": "Bearer mock-token",
      },
    });

    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    expect(mockClick).toHaveBeenCalled();
  });

  it("should handle download error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() => useDownloadFile("project-123"));

    const mockFile = {
      id: "file-1",
      filename: "test.pdf",
      mimeType: "application/pdf",
      size: 1024,
      url: "http://localhost:3001/uploads/test.pdf",
      type: "DOCUMENT" as const,
      commandeId: "project-123",
      uploadedAt: "2023-12-01T10:00:00Z",
    };

    await expect(async () => {
      await result.current.downloadFile(mockFile);
    }).rejects.toThrow("Erreur lors du téléchargement: 404");
  });
});

describe("fileUtils", () => {
  describe("formatFileSize", () => {
    it("should format file sizes correctly", () => {
      expect(fileUtils.formatFileSize(0)).toBe("0 B");
      expect(fileUtils.formatFileSize(1024)).toBe("1.0 Ko");
      expect(fileUtils.formatFileSize(1024 * 1024)).toBe("1.0 Mo");
      expect(fileUtils.formatFileSize(1536)).toBe("1.5 Ko");
    });
  });

  describe("getFileIcon", () => {
    it("should return correct icons for different mime types", () => {
      expect(fileUtils.getFileIcon("application/pdf")).toBe("fa-file-pdf");
      expect(fileUtils.getFileIcon("application/msword")).toBe("fa-file-word");
      expect(fileUtils.getFileIcon("image/jpeg")).toBe("fa-file-image");
      expect(fileUtils.getFileIcon("text/plain")).toBe("fa-file-alt");
      expect(fileUtils.getFileIcon("application/zip")).toBe("fa-file-archive");
      expect(fileUtils.getFileIcon("unknown/type")).toBe("fa-file");
    });
  });

  describe("getFileColor", () => {
    it("should return correct colors for different mime types", () => {
      expect(fileUtils.getFileColor("application/pdf")).toEqual({
        bg: "bg-red-100",
        text: "text-red-600",
      });
      expect(fileUtils.getFileColor("application/msword")).toEqual({
        bg: "bg-blue-100",
        text: "text-blue-600",
      });
      expect(fileUtils.getFileColor("image/jpeg")).toEqual({
        bg: "bg-green-100",
        text: "text-green-600",
      });
    });
  });

  describe("formatDate", () => {
    it("should format ISO date correctly", () => {
      const isoDate = "2023-12-01T10:30:00Z";
      const result = fileUtils.formatDate(isoDate);
      
      // The exact format depends on the locale, but it should contain the date parts
      expect(result).toMatch(/01\/12\/2023/);
      expect(result).toMatch(/10:30/);
    });
  });
});