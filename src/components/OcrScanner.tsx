// src/components/OcrScanner.tsx

import { useState } from 'react';
import { Upload, Scan, X, Loader2 } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface OcrScannerProps {
  onTextExtracted?: (text: string) => void;
}

export default function OcrScanner({ onTextExtracted }: OcrScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setExtractedText('');
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(image, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const text = result.data.text;
      setExtractedText(text);
      onTextExtracted?.(text);
    } catch (error) {
      console.error('OCR failed:', error);
      setExtractedText('Error: Failed to extract text');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setExtractedText('');
    setProgress(0);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          OCR Scanner
        </h2>
        {image && (
          <button
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Upload Area */}
      {!image && (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Upload a screenshot to extract text
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Choose Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Image Preview */}
      {image && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <img src={image} alt="Preview" className="w-full h-auto" />
          </div>

          {/* Scan Button */}
          {!isProcessing && !extractedText && (
            <button
              onClick={handleScan}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-medium"
            >
              <Scan className="w-5 h-5" />
              Extract Text
            </button>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing... {progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-slate-900 dark:bg-slate-50 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Extracted Text */}
          {extractedText && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Extracted Text
              </label>
              <textarea
                value={extractedText}
                readOnly
                rows={10}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-mono text-sm resize-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(extractedText)}
                className="w-full px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
              >
                Copy to Clipboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
