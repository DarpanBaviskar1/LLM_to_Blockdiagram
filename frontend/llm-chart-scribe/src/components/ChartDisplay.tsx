import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MermaidEditor } from './MermaidEditor';

interface ChartDisplayProps {
  mermaidCode?: string;
  isLoading?: boolean;
  error?: string;
  onCodeChange?: (code: string) => void;
}

export const ChartDisplay: React.FC<ChartDisplayProps> = ({ 
  mermaidCode, 
  isLoading, 
  error,
  onCodeChange
}) => {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Generated Chart</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p>Processing PDF and generating chart...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Generated Chart</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-red-500">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mermaidCode) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Generated Chart</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Upload a PDF to generate a chart</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <MermaidEditor 
      initialCode={mermaidCode}
      onCodeChange={onCodeChange}
    />
  );
};
