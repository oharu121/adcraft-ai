/**
 * Product Intelligence Agent - Image Upload Area
 * 
 * Drag-and-drop image upload interface with validation feedback,
 * progress indicators, and preview functionality.
 */

'use client';

import React, { useState, useCallback, useRef, DragEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export interface ImageUploadProps {
  onImageUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  maxFileSize?: number; // in bytes
  acceptedFormats?: string[];
  locale?: 'en' | 'ja';
  className?: string;
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
  uploadProgress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const ImageUploadArea: React.FC<ImageUploadProps> = ({
  onImageUpload,
  isUploading = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  locale = 'en',
  className = ''
}) => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Localized text
  const text = {
    en: {
      title: 'Upload Product Image',
      description: 'Drag and drop your product image here, or click to select',
      supportedFormats: 'Supported formats: JPEG, PNG, WebP',
      maxFileSize: `Maximum file size: ${Math.round(maxFileSize / (1024 * 1024))}MB`,
      dragActive: 'Drop your image here',
      selectFile: 'Select Image',
      uploading: 'Uploading...',
      uploadSuccess: 'Image uploaded successfully',
      uploadAnother: 'Upload Different Image',
      errorTitle: 'Upload Error',
      fileTooLarge: 'File size exceeds maximum limit',
      unsupportedFormat: 'Unsupported file format',
      uploadFailed: 'Failed to upload image',
      analyzing: 'Analyzing product image...',
      retryUpload: 'Retry Upload'
    },
    ja: {
      title: '商品画像をアップロード',
      description: '商品画像をここにドラッグ＆ドロップするか、クリックして選択してください',
      supportedFormats: '対応フォーマット: JPEG, PNG, WebP',
      maxFileSize: `最大ファイルサイズ: ${Math.round(maxFileSize / (1024 * 1024))}MB`,
      dragActive: '画像をここにドロップしてください',
      selectFile: '画像を選択',
      uploading: 'アップロード中...',
      uploadSuccess: '画像が正常にアップロードされました',
      uploadAnother: '別の画像をアップロード',
      errorTitle: 'アップロードエラー',
      fileTooLarge: 'ファイルサイズが上限を超えています',
      unsupportedFormat: 'サポートされていないファイル形式です',
      uploadFailed: '画像のアップロードに失敗しました',
      analyzing: '商品画像を分析中...',
      retryUpload: 'アップロードを再試行'
    }
  };

  const t = text[locale];

  // Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return t.fileTooLarge;
    }
    
    if (!acceptedFormats.includes(file.type)) {
      return t.unsupportedFormat;
    }
    
    return null;
  }, [maxFileSize, acceptedFormats, t]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError('');
    
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setUploadedImage({
      file,
      previewUrl,
      uploadProgress: 0,
      status: 'uploading'
    });

    try {
      await onImageUpload(file);
      
      setUploadedImage(prev => prev ? {
        ...prev,
        uploadProgress: 100,
        status: 'completed'
      } : null);

    } catch (error) {
      setUploadedImage(prev => prev ? {
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : t.uploadFailed
      } : null);
    }
  }, [onImageUpload, validateFile, t]);

  // Native drag and drop handlers
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    }
  }, [handleFileUpload, isUploading]);

  // Handle file input click
  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
      // Clear the input after handling
      e.target.value = '';
    }
  }, [handleFileUpload]);

  // Handle retry upload
  const handleRetry = useCallback(() => {
    if (uploadedImage) {
      handleFileUpload(uploadedImage.file);
    }
  }, [uploadedImage, handleFileUpload]);

  // Handle upload new image
  const handleUploadNew = useCallback(() => {
    if (uploadedImage?.previewUrl) {
      URL.revokeObjectURL(uploadedImage.previewUrl);
    }
    setUploadedImage(null);
    setValidationError('');
  }, [uploadedImage]);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <Card className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t.title}
          </h3>
          
          {!uploadedImage && (
            <p className="text-sm text-gray-600 mb-4">
              {t.description}
            </p>
          )}
        </div>

        {/* Upload Area */}
        {!uploadedImage && (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
              ${dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileInputClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {isUploading ? (
              <div className="space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm font-medium text-blue-600">
                  {t.uploading}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <div>
                  <p className="text-base font-medium text-gray-700 mb-1">
                    {dragActive ? t.dragActive : t.description}
                  </p>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileInputClick();
                    }}
                    disabled={isUploading}
                    className="mt-2"
                  >
                    {t.selectFile}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Preview */}
        {uploadedImage && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
              <img
                src={uploadedImage.previewUrl}
                alt="Product preview"
                className="w-full h-64 object-cover"
              />
              
              {/* Upload Status Overlay */}
              {uploadedImage.status === 'uploading' && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <LoadingSpinner size="lg" className="mb-2" />
                    <p className="text-sm font-medium">{t.analyzing}</p>
                  </div>
                </div>
              )}
              
              {uploadedImage.status === 'error' && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-12 h-12 mx-auto mb-2">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">{t.errorTitle}</p>
                  </div>
                </div>
              )}
              
              {uploadedImage.status === 'completed' && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            {/* File Info */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{uploadedImage.file.name}</span>
              <span>{formatFileSize(uploadedImage.file.size)}</span>
            </div>
            
            {/* Status Message */}
            {uploadedImage.status === 'completed' && (
              <div className="text-center">
                <p className="text-sm font-medium text-green-600 mb-2">
                  {t.uploadSuccess}
                </p>
              </div>
            )}
            
            {uploadedImage.status === 'error' && (
              <div className="text-center">
                <p className="text-sm font-medium text-red-600 mb-2">
                  {uploadedImage.error || t.uploadFailed}
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2 justify-center">
              {uploadedImage.status === 'error' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isUploading}
                >
                  {t.retryUpload}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadNew}
                disabled={isUploading}
              >
                {t.uploadAnother}
              </Button>
            </div>
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {validationError}
            </p>
          </div>
        )}

        {/* Help Text */}
        {!uploadedImage && (
          <div className="mt-4 text-center text-xs text-gray-500 space-y-1">
            <p>{t.supportedFormats}</p>
            <p>{t.maxFileSize}</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ImageUploadArea;