import React, { useState } from "react";
import ResumeEditor from "./ResumeEditor";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Expected JSON, got:", text);
        throw new Error("Expected JSON, got: " + text);
      }
      if (!res.ok) {
        // Show backend error message if available
        throw new Error(data.message || "Upload failed");
      }
      console.log("Backend response:", data); // Debug log
      if (data.success && data.data) {
        setUploadedFile(data.data);
      } else {
        setError(data.message || "Failed to upload resume");
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (uploadedFile) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-blue-700">Resume Uploaded</h2>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-green-800 font-semibold">File: {uploadedFile.fileName}</p>
          <p className="text-green-800">Size: {(uploadedFile.fileSize / 1024).toFixed(2)} KB</p>
          <p className="text-green-800">Type: {uploadedFile.fileType}</p>
          <p className="text-green-800">Path: {uploadedFile.filePath}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-blue-700">Upload Resume</h2>
      <div className="border-2 border-dashed border-blue-300 p-6 rounded-lg bg-white">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {file && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-blue-800">Selected: {file.name}</p>
            <button
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload & Analyze"}
            </button>
          </div>
        )}
        {error && (
          <div className="text-red-600 mt-2 p-3 bg-red-50 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
} 