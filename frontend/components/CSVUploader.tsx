/**
 * CSVUploader Component
 * 
 * CSVファイルのドラッグ&ドロップアップロード機能を提供
 * - 複数ファイル対応
 * - ファイル形式バリデーション
 * - アップロード進捗表示
 * - エラーハンドリング
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

interface UploadedFile {
  /** ファイル名 */
  name: string;
  /** ファイルサイズ（バイト） */
  size: number;
  /** アップロード状況 */
  status: 'pending' | 'uploading' | 'success' | 'error';
  /** エラーメッセージ（エラー時） */
  errorMessage?: string;
  /** アップロード進捗（0-100%） */
  progress: number;
  /** ファイルID（成功時） */
  fileId?: string;
}

interface CSVUploaderProps {
  /** アップロード完了時のコールバック */
  onUploadComplete?: (files: UploadedFile[]) => void;
  /** アップロードエラー時のコールバック */
  onUploadError?: (error: string) => void;
  /** 最大ファイル数 */
  maxFiles?: number;
  /** 最大ファイルサイズ（MB） */
  maxSizeMB?: number;
}

/**
 * ファイルサイズを人間が読みやすい形式にフォーマット
 * @param bytes - バイト数
 * @returns フォーマット済み文字列
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * CSVファイルの基本バリデーション
 * @param file - ファイルオブジェクト
 * @returns バリデーション結果
 */
const validateCSVFile = (file: File): { isValid: boolean; error?: string } => {
  // ファイル拡張子チェック
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { isValid: false, error: 'CSVファイルのみアップロード可能です' };
  }

  // ファイルサイズチェック（10MB制限）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'ファイルサイズが10MBを超えています' };
  }

  return { isValid: true };
};

const CSVUploader: React.FC<CSVUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSizeMB = 10
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * ファイルアップロード処理
   * @param files - アップロードするファイル配列
   */
  const handleFileUpload = useCallback(async (files: File[]) => {
    setIsUploading(true);
    
    const newFiles: UploadedFile[] = files.map(file => ({
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileIndex = uploadedFiles.length + i;

        // ファイルバリデーション
        const validation = validateCSVFile(file);
        if (!validation.isValid) {
          setUploadedFiles(prev => prev.map((f, idx) => 
            idx === fileIndex 
              ? { ...f, status: 'error', errorMessage: validation.error }
              : f
          ));
          continue;
        }

        // CSVパース処理
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex 
            ? { ...f, status: 'uploading', progress: 25 }
            : f
        ));

        // PapaParseでCSVを解析
        const parseResult = await new Promise<Papa.ParseResult<any>>((resolve) => {
          Papa.parse(file as any, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: (error: any) => {
              resolve({ data: [], errors: [error], meta: {} as any });
            }
          });
        });

        if (parseResult.errors.length > 0) {
          setUploadedFiles(prev => prev.map((f, idx) => 
            idx === fileIndex 
              ? { 
                  ...f, 
                  status: 'error', 
                  errorMessage: `CSV解析エラー: ${parseResult.errors[0].message}` 
                }
              : f
          ));
          continue;
        }

        // 進捗更新
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex 
            ? { ...f, progress: 50 }
            : f
        ));

        // サーバーへのアップロード（模擬）
        try {
          // TODO: 実際のAPI呼び出しに置き換え
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const fileId = `file_${Date.now()}_${i}`;
          
          setUploadedFiles(prev => prev.map((f, idx) => 
            idx === fileIndex 
              ? { 
                  ...f, 
                  status: 'success', 
                  progress: 100,
                  fileId 
                }
              : f
          ));
        } catch (uploadError) {
          setUploadedFiles(prev => prev.map((f, idx) => 
            idx === fileIndex 
              ? { 
                  ...f, 
                  status: 'error', 
                  errorMessage: 'アップロードに失敗しました' 
                }
              : f
          ));
        }
      }

      // 完了コールバック
      const successFiles = uploadedFiles.filter(f => f.status === 'success');
      onUploadComplete?.(successFiles);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アップロードエラーが発生しました';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [uploadedFiles, onUploadComplete, onUploadError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > maxFiles) {
      onUploadError?.(`最大${maxFiles}ファイルまでアップロード可能です`);
      return;
    }
    
    handleFileUpload(acceptedFiles);
  }, [maxFiles, handleFileUpload, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles,
    maxSize: maxSizeMB * 1024 * 1024,
  });

  /**
   * ファイル削除処理
   * @param index - 削除するファイルのインデックス
   */
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * 全ファイルクリア
   */
  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* ドロップゾーン */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-pachislot-orange-500 bg-pachislot-orange-50' 
            : 'border-gray-300 hover:border-pachislot-orange-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className="text-pachislot-orange-500">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          
          {isDragActive ? (
            <p className="text-lg font-medium text-pachislot-orange-600">
              ファイルをドロップしてください
            </p>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                CSVファイルをドラッグ&ドロップ
              </p>
              <p className="text-sm text-gray-500 mb-4">
                または <span className="text-pachislot-orange-500 font-medium">クリックして選択</span>
              </p>
              <p className="text-xs text-gray-400">
                最大{maxFiles}ファイル、{maxSizeMB}MBまで
              </p>
            </div>
          )}
        </div>
      </div>

      {/* アップロードファイル一覧 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              アップロードファイル ({uploadedFiles.length})
            </h3>
            <button
              onClick={clearAllFiles}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={isUploading}
            >
              すべてクリア
            </button>
          </div>

          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {file.status === 'success' && (
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-green-600">
                              <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                          </div>
                        )}
                        {file.status === 'error' && (
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-600">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                          </div>
                        )}
                        {(file.status === 'pending' || file.status === 'uploading') && (
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                        {file.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">
                            {file.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 進捗バー */}
                    {(file.status === 'uploading' || file.status === 'pending') && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-pachislot-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeFile(index)}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                    disabled={isUploading}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVUploader; 