import { useState } from "react";

export function useResumeUpload() {
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadResume = async (file: File) => {
    setLoading(true);
    setError(null);
    setAiData(null);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Upload failed");
      setAiData(data.aiData);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return { uploadResume, loading, aiData, error };
}
