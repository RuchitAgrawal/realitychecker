import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/utils";

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
  file?: File | null;
  onError?: (err: string) => void;
  maxFileSize?: number;
}

const FileUploader = ({
  onFileSelect,
  file,
  onError,
  maxFileSize = 20 * 1024 * 1024,
}: FileUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selected = acceptedFiles[0];
      if (selected) onFileSelect?.(selected);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    maxSize: maxFileSize,
    onDropRejected: (rejections) => {
      const first = rejections[0];
      const code = first?.errors[0]?.code;
      if (first && code === "file-too-large") {
        onError?.(
          `File size exceeds the 20MB limit (${formatSize(first.file.size)}). Please upload a smaller file.`
        );
      } else if (code === "file-invalid-type") {
        onError?.("Only PDF files are supported. Please select a .pdf file.");
      } else {
        onError?.(
          first?.errors[0]?.message || "Could not accept file. Please try again."
        );
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`upload-zone ${isDragActive ? "drag-active" : ""}`}
      role="region"
      aria-label="PDF resume upload dropzone"
    >
      <input {...getInputProps()} aria-label="Resume PDF input" />
      {file ? (
        <div className="selected-file" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "6px",
                background: "#ffffff",
                border: "1px solid #e6e5e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#26251e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#26251e",
                  maxWidth: "260px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#807d72", marginTop: "0.125rem", fontFamily: "JetBrains Mono, monospace" }}>
                {formatSize(file.size)}
              </p>
            </div>
          </div>
          <button
            style={{
              width: "1.75rem",
              height: "1.75rem",
              borderRadius: "6px",
              background: "#ffffff",
              border: "1px solid #e6e5e0",
              color: "#807d72",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "0.8rem",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect?.(null);
            }}
            type="button"
            aria-label="Remove selected resume"
          >
            ✕
          </button>
        </div>
      ) : (
        <div>
          <div className="upload-zone-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#26251e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="upload-zone-title">
            {isDragActive ? "Drop your PDF here" : "Click to select or drag and drop your PDF"}
          </p>
          <p className="upload-zone-subtitle">PDF document up to {formatSize(maxFileSize)}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
