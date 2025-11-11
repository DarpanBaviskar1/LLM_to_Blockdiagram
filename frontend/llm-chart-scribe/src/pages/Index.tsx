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
  const [inputMode, setInputMode] = useState<'document' | 'text'>('document');
  const [textInput, setTextInput] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError("");
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://llm-to-blockdiagram.vercel.app/api/process-pdf", {
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

  const handleTextSubmit = async () => {
    setIsLoading(true);
    setError("");
    setUploadedFile(null);

    try {
      const response = await fetch("https://llm-to-blockdiagram.vercel.app/api/process-text", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput }),
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
            Transform documents or pasted text into interactive flowcharts using AI
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh]">
          {/* Left side - Upload and Document info */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className={`px-3 py-1 rounded cursor-pointer ${inputMode === 'document' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => setInputMode('document')}>Document</label>
              <label className={`px-3 py-1 rounded cursor-pointer ${inputMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => setInputMode('text')}>Text</label>
            </div>

            {inputMode === 'document' ? (
              <UploadZone onFileUpload={handleFileUpload} isLoading={isLoading} />
            ) : (
              <div className="h-full">
                <div className="bg-white rounded-lg p-4 border border-gray-200 h-full flex flex-col">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste or type your text here..."
                    className="flex-1 w-full p-3 border rounded resize-none focus:outline-none focus:ring"
                    rows={12}
                    disabled={isLoading}
                  />
                  <div className="mt-3 flex items-center justify-end">
                    <button
                      onClick={handleTextSubmit}
                      disabled={isLoading || !textInput.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                      Generate Chart
                    </button>
                  </div>
                </div>
              </div>
            )}

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
