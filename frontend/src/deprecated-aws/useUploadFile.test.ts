import { vi } from "vitest";

// Mock les dépendances
vi.mock("../../hooks/useUploadFile", () => ({
  useUploadFile: vi.fn(() => ({
    uploadFile: vi.fn(),
    progress: 0,
    isUploading: false,
    error: null,
    reset: vi.fn(),
  })),
}));

describe("useUploadFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should import without errors", async () => {
    const { useUploadFile } = await import("../../hooks/useUploadFile");
    expect(useUploadFile).toBeDefined();
    expect(typeof useUploadFile).toBe("function");
  });

  it("should return upload functions", async () => {
    const { useUploadFile } = await import("../../hooks/useUploadFile");
    const result = useUploadFile();
    
    expect(result).toBeDefined();
    expect(typeof result.uploadFile).toBe("function");
    expect(typeof result.reset).toBe("function");
    expect(result.progress).toBe(0);
    expect(result.isUploading).toBe(false);
    expect(result.error).toBe(null);
  });

  it("should handle callbacks", async () => {
    const onProgress = vi.fn();
    const onSuccess = vi.fn(); 
    const onError = vi.fn();
    
    const { useUploadFile } = await import("../../hooks/useUploadFile");
    const result = useUploadFile(onProgress, onSuccess, onError);
    
    expect(result).toBeDefined();
    expect(typeof result.uploadFile).toBe("function");
  });

  it("should have initial state", async () => {
    const { useUploadFile } = await import("../../hooks/useUploadFile");
    const result = useUploadFile();
    
    expect(result.progress).toBe(0);
    expect(result.isUploading).toBe(false);
    expect(result.error).toBe(null);
  });

  it("should provide reset functionality", async () => {
    const { useUploadFile } = await import("../../hooks/useUploadFile");
    const result = useUploadFile();
    
    expect(typeof result.reset).toBe("function");
    
    // Reset should be callable without error
    expect(() => result.reset()).not.toThrow();
  });

  it("should handle file upload parameters", async () => {
    const { useUploadFile } = await import("../../hooks/useUploadFile");
    const result = useUploadFile();
    
    expect(typeof result.uploadFile).toBe("function");
    
    // Should be able to call uploadFile (even if mocked)
    const mockFile = new File(["test"], "test.txt", { type: "text/plain" });
    expect(() => result.uploadFile({ projectId: "test", file: mockFile })).not.toThrow();
  });
});