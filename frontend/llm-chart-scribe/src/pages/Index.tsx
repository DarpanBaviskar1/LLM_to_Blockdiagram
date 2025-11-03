import React, { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { ChartDisplay } from "@/components/ChartDisplay";
import { DocumentCard } from "@/components/DocumentCard";

interface ProcessingResult {
  mermaid_code: string;
  raw_mermaid: string;
  summary: string;
  stats: {
    text_length: number;
    summary_length: number;
    mermaid_length: number;
  };
}

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentMermaidCode, setCurrentMermaidCode] = useState<string>("");

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError("");
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5000/api/process-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Processing failed");
      }

      setResult(data);
      setCurrentMermaidCode(data.mermaid_code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResult(null);
      setCurrentMermaidCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCurrentMermaidCode(newCode);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LLM Chart Scribe
          </h1>
          <p className="text-lg text-gray-600">
            Transform PDF documents into interactive flowcharts using AI
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh]">
          {/* Left side - Upload and Document info */}
          <div className="space-y-6">
            <UploadZone onFileUpload={handleFileUpload} isLoading={isLoading} />

            {uploadedFile && (
              <DocumentCard
                filename={uploadedFile.name}
                uploadedAt={new Date(uploadedFile.lastModified).toISOString()}
                status={isLoading ? "processing" : error ? "error" : result ? "completed" : "processing"}
              />
            )}
          </div>

          {/* Right side - Chart Display with Editor */}
          <ChartDisplay
            mermaidCode={result?.mermaid_code}
            isLoading={isLoading}
            error={error}
            onCodeChange={handleCodeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
