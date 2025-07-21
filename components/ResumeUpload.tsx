import React, { useState } from "react";
import ResumeEditor from "./ResumeEditor";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<any>(null);
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
      console.log("Backend response:", data); // Debug log
      if (data.success && data.resume && data.resume.aiData) {
        console.log("Setting parsed resume:", data.resume.aiData); // Debug log
        setParsedResume(data.resume.aiData);
      } else {
        setError(data.message || "Failed to parse resume");
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (parsedResume) {
    return <ResumeEditor initialValues={parsedResume} />;
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
              {loading ? "Parsing with AI..." : "Parse with AI"}
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