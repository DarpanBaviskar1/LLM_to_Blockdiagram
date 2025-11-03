import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from './ui/card';
import { Upload, FileText } from 'lucide-react';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileUpload, isLoading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isLoading
  });

  return (
    <Card className="h-full">
      <CardContent className="p-6 h-full">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors h-full flex flex-col items-center justify-center
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          `}
        >
          <input {...getInputProps()} />
          
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-lg font-medium">Processing...</p>
              <p className="text-sm text-gray-500">Generating your chart</p>
            </>
          ) : (
            <>
              {isDragActive ? (
                <>
                  <Upload className="h-12 w-12 text-blue-500 mb-4" />
                  <p className="text-lg font-medium text-blue-500">Drop your PDF here</p>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium">Drop your PDF here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    or click to select a file
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
