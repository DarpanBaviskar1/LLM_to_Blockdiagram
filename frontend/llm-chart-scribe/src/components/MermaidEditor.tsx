import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Eye, 
  Code, 
  Download, 
  Copy, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Save,
  FileText,
  Image
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import mermaid from 'mermaid';
import html2canvas from 'html2canvas';

interface MermaidEditorProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  isLoading?: boolean;
}

export const MermaidEditor: React.FC<MermaidEditorProps> = ({
  initialCode = '',
  onCodeChange,
  isLoading = false
}) => {
  const [code, setCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'split'>('preview');
  const [zoom, setZoom] = useState(100);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string>('');
  const [lastValidCode, setLastValidCode] = useState(initialCode);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const mermaidElementRef = useRef<HTMLDivElement>(null);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'monospace',
      fontSize: 16,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  // Update code when initialCode changes
  useEffect(() => {
    if (initialCode && initialCode !== code) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Render Mermaid diagram
  const renderMermaid = useCallback(async (mermaidCode: string) => {
    if (!mermaidCode.trim() || !mermaidElementRef.current) return;

    setIsRendering(true);
    setRenderError('');

    try {
      // Clear previous content
      mermaidElementRef.current.innerHTML = '';
      
      // Generate unique ID
      const id = `mermaid-${Date.now()}`;
      
      // Validate and render
      const { svg } = await mermaid.render(id, mermaidCode);
      mermaidElementRef.current.innerHTML = svg;
      
      setLastValidCode(mermaidCode);
    } catch (error) {
      console.error('Mermaid render error:', error);
      setRenderError(error instanceof Error ? error.message : 'Rendering failed');
      
      // If there's an error, try to render the last valid code
      if (lastValidCode && lastValidCode !== mermaidCode) {
        try {
          const id = `mermaid-fallback-${Date.now()}`;
          const { svg } = await mermaid.render(id, lastValidCode);
          mermaidElementRef.current.innerHTML = svg;
        } catch (fallbackError) {
          mermaidElementRef.current.innerHTML = `
            <div class="text-red-500 p-4 text-center">
              <p class="font-semibold">Rendering Error:</p>
              <p class="text-sm mt-1">${error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          `;
        }
      }
    } finally {
      setIsRendering(false);
    }
  }, [lastValidCode]);

  // Handle code changes
  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode !== undefined) {
      setCode(newCode);
      onCodeChange?.(newCode);
    }
  };

  // Debounced render effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (code.trim()) {
        renderMermaid(code);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [code, renderMermaid]);

  // Export functions
  const exportAsSVG = () => {
    if (mermaidElementRef.current) {
      const svgElement = mermaidElementRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mermaid-diagram.svg';
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const exportAsPNG = async () => {
    if (mermaidElementRef.current) {
      try {
        const canvas = await html2canvas(mermaidElementRef.current, {
          backgroundColor: 'white',
          scale: 2
        });
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'mermaid-diagram.png';
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      } catch (error) {
        console.error('PNG export failed:', error);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  const copyMermaidCode = () => {
    const mermaidMarkdown = `\`\`\`mermaid\n${code}\n\`\`\``;
    navigator.clipboard.writeText(mermaidMarkdown);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Mermaid Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={renderError ? 'destructive' : 'default'}>
              {isRendering ? 'Rendering...' : renderError ? 'Error' : 'Ready'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => renderMermaid(code)}
              disabled={isRendering}
            >
              <RefreshCw className={`h-4 w-4 ${isRendering ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="split" className="flex items-center gap-1">
              <Maximize2 className="h-4 w-4" />
              Split
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs value={activeTab} className="h-full">
          {/* Editor Only */}
          <TabsContent value="editor" className="h-full m-0">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Lines: {code.split('\n').length} | Characters: {code.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={copyMermaidCode}>
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage="mermaid"
                  value={code}
                  onChange={handleCodeChange}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    theme: 'vs',
                    automaticLayout: true
                  }}
                />
              </div>
            </div>
          </TabsContent>

          {/* Preview Only */}
          <TabsContent value="preview" className="h-full m-0">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={exportAsSVG}>
                    <Download className="h-4 w-4 mr-1" />
                    SVG
                  </Button>
                  <Button variant="ghost" size="sm" onClick={exportAsPNG}>
                    <Image className="h-4 w-4 mr-1" />
                    PNG
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 flex items-center justify-center min-h-full">
                  <div 
                    ref={mermaidElementRef}
                    style={{ transform: `scale(${zoom / 100})` }}
                    className="transform-gpu"
                  />
                  {renderError && (
                    <div className="text-red-500 text-center p-4">
                      <p className="font-semibold">Rendering Error:</p>
                      <p className="text-sm mt-1">{renderError}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Split View */}
          <TabsContent value="split" className="h-full m-0">
            <div className="h-full flex">
              <div className="w-1/2 border-r">
                <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                  <span className="text-sm font-medium">Code Editor</span>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Editor
                  height="calc(100% - 45px)"
                  defaultLanguage="mermaid"
                  value={code}
                  onChange={handleCodeChange}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    theme: 'vs'
                  }}
                />
              </div>
              <div className="w-1/2 flex flex-col">
                <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                  <span className="text-sm font-medium">Live Preview</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoom(Math.max(25, zoom - 25))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-gray-600 min-w-[45px] text-center">
                      {zoom}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoom(Math.min(200, zoom + 25))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4 flex items-center justify-center min-h-full">
                    <div 
                      ref={previewRef}
                      style={{ transform: `scale(${zoom / 100})` }}
                      className="transform-gpu"
                    >
                      <div ref={mermaidElementRef} />
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};