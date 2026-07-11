'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { CHANNEL_ENUM } from '@/lib/schemas/feedback';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 5000;

export function CsvUploadModal({ isOpen, onClose, onSuccess }: CsvUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    successCount: number;
    failureCount: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setError(null);
    setSummary(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const downloadTemplate = () => {
    const headers = ['content', 'channel', 'featureArea', 'createdAt'];
    const rows = [
      ['This is a sample feedback!', CHANNEL_ENUM[0], 'Dashboard', new Date().toISOString()],
    ];
    const csv = Papa.unparse({ fields: headers, data: rows });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'feedback_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSummary(null);
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File exceeds the 5MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: async (results) => {
        if (results.errors.length > 0) {
          setError(`CSV Parsing Error: ${results.errors[0].message}`);
          setIsProcessing(false);
          return;
        }

        if (results.data.length > MAX_ROWS) {
          setError(`File exceeds the ${MAX_ROWS} row limit.`);
          setIsProcessing(false);
          return;
        }

        try {
          const res = await fetch('/api/feedback/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: results.data }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Upload failed');
          }

          setSummary(data.summary);
          if (data.summary.successCount > 0) {
            onSuccess();
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setIsProcessing(false);
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#13132B] border border-white/10 rounded-2xl shadow-2xl p-8 z-50 overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />

            <div className="flex justify-between items-center mb-6 relative">
              <h2 className="text-2xl font-semibold text-white">Bulk Upload Feedback</h2>
              <button
                onClick={downloadTemplate}
                className="text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-300 transition-colors border border-indigo-500/30"
              >
                Download CSV Template
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm relative">
                {error}
              </div>
            )}

            {!summary ? (
              <div className="relative flex-1">
                <div
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                    file
                      ? 'border-indigo-500/50 bg-indigo-500/5'
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div>
                      <p className="text-white font-medium text-lg mb-2">{file.name}</p>
                      <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                      <button
                        onClick={() => setFile(null)}
                        className="mt-4 text-sm text-red-400 hover:text-red-300"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                      >
                        Select CSV File
                      </button>
                      <p className="text-gray-400 text-sm mt-4">Max {MAX_ROWS} rows, up to 5MB.</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={handleClose}
                    className="px-5 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || isProcessing}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isProcessing ? 'Processing...' : 'Upload Data'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative flex-1 overflow-auto">
                <div className="flex items-center gap-6 mb-6 p-6 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex-1 text-center border-r border-white/10">
                    <p className="text-3xl font-bold text-green-400 mb-1">{summary.successCount}</p>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Imported</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-3xl font-bold text-red-400 mb-1">{summary.failureCount}</p>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Failed</p>
                  </div>
                </div>

                {summary.errors.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-3">Error Report</h3>
                    <div className="bg-black/30 rounded-xl p-4 overflow-y-auto max-h-[40vh] border border-red-500/20">
                      <ul className="space-y-2 text-sm text-red-300 font-mono">
                        {summary.errors.map((err, i) => (
                          <li
                            key={i}
                            className="pb-2 border-b border-white/5 last:border-0 last:pb-0"
                          >
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
