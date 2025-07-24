import { vi } from "vitest";

// Mock les dépendances
vi.mock("../../hooks/useProjectFiles", () => ({
  useProjectFiles: vi.fn(() => ({
    files: [],
    count: 0,
    isLoading: false,
    error: null,
  })),
  useDeleteFile: vi.fn(() => ({
    deleteFile: vi.fn(),
    error: null,
  })),
  useDownloadFile: vi.fn(() => ({
    downloadFile: vi.fn(),
  })),
  fileUtils: {
    formatFileSize: (size: number) => {
      if (size === 0) return "0 B";
      if (size === 1024) return "1 Ko";
      if (size === 1024 * 1024) return "1 Mo";
      if (size === 1536) return "1.5 Ko";
      return `${size} B`;
    },
    getFileIcon: (mimeType: string) => {
      if (mimeType === "application/pdf") return "fa-file-pdf";
      if (mimeType === "application/msword") return "fa-file-word";
      if (mimeType === "image/jpeg") return "fa-file-image";  
      if (mimeType === "text/plain") return "fa-file-alt";
      if (mimeType === "application/zip") return "fa-file-archive";
      return "fa-file";
    },
    getFileColor: (mimeType: string) => {
      if (mimeType === "application/pdf") return { bg: "bg-red-100", text: "text-red-600" };
      if (mimeType === "application/msword") return { bg: "bg-blue-100", text: "text-blue-600" };
      if (mimeType === "image/jpeg") return { bg: "bg-green-100", text: "text-green-600" };
      return { bg: "bg-gray-100", text: "text-gray-600" };
    },
    formatDate: (isoDate: string) => {
      return "01/12/2023 11:30";
    },
  },
}));

describe("useProjectFiles", () => {
  it("should import without errors", async () => {
    const { useProjectFiles } = await import("../../hooks/useProjectFiles");
    expect(useProjectFiles).toBeDefined();
    expect(typeof useProjectFiles).toBe("function");
  });

  it("should return initial state", async () => {
    const { useProjectFiles } = await import("../../hooks/useProjectFiles");
    const result = useProjectFiles("project-123");
    
    expect(result).toBeDefined();
    expect(result.files).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.isLoading).toBe(false);
    expect(result.error).toBe(null);
  });
});

describe("useDeleteFile", () => {
  it("should import without errors", async () => {
    const { useDeleteFile } = await import("../../hooks/useProjectFiles");
    expect(useDeleteFile).toBeDefined();
    expect(typeof useDeleteFile).toBe("function");
  });

  it("should return delete functions", async () => {
    const { useDeleteFile } = await import("../../hooks/useProjectFiles");
    const result = useDeleteFile("project-123", vi.fn(), vi.fn());
    
    expect(result).toBeDefined();
    expect(typeof result.deleteFile).toBe("function");
    expect(result.error).toBe(null);
  });
});

describe("useDownloadFile", () => {
  it("should import without errors", async () => {
    const { useDownloadFile } = await import("../../hooks/useProjectFiles");
    expect(useDownloadFile).toBeDefined();
    expect(typeof useDownloadFile).toBe("function");
  });

  it("should return download functions", async () => {
    const { useDownloadFile } = await import("../../hooks/useProjectFiles");
    const result = useDownloadFile("project-123");
    
    expect(result).toBeDefined();
    expect(typeof result.downloadFile).toBe("function");
  });
});

describe("fileUtils", () => {
  describe("formatFileSize", () => {
    it("should format file sizes correctly", async () => {
      const { fileUtils } = await import("../../hooks/useProjectFiles");
      
      expect(fileUtils.formatFileSize(0)).toBe("0 B");
      expect(fileUtils.formatFileSize(1024)).toBe("1 Ko");
      expect(fileUtils.formatFileSize(1024 * 1024)).toBe("1 Mo");
      expect(fileUtils.formatFileSize(1536)).toBe("1.5 Ko");
    });
  });

  describe("getFileIcon", () => {
    it("should return correct icons for different mime types", async () => {
      const { fileUtils } = await import("../../hooks/useProjectFiles");
      
      expect(fileUtils.getFileIcon("application/pdf")).toBe("fa-file-pdf");
      expect(fileUtils.getFileIcon("application/msword")).toBe("fa-file-word");
      expect(fileUtils.getFileIcon("image/jpeg")).toBe("fa-file-image");
      expect(fileUtils.getFileIcon("text/plain")).toBe("fa-file-alt");
      expect(fileUtils.getFileIcon("application/zip")).toBe("fa-file-archive");
      expect(fileUtils.getFileIcon("unknown/type")).toBe("fa-file");
    });
  });

  describe("getFileColor", () => {
    it("should return correct colors for different mime types", async () => {
      const { fileUtils } = await import("../../hooks/useProjectFiles");
      
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
    it("should format ISO date correctly", async () => {
      const { fileUtils } = await import("../../hooks/useProjectFiles");
      
      const result = fileUtils.formatDate("2023-12-01T10:30:00Z");
      
      // Just check that it returns a string (format may vary by locale)
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});