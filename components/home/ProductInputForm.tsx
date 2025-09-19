"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui";
import { ImageUploadArea, ImageSelectionGrid } from "@/components/product-intelligence";
import { useProductIntelligenceStore } from "@/lib/stores/product-intelligence-store";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import { SessionStatus } from "@/lib/agents/product-intelligence/enums";

interface ProductInputFormProps {
  dict: Dictionary;
  locale: Locale;
  onImageUpload: (file: File) => Promise<void>;
  onTextSubmit: () => void;
  onValidationError: (message: string) => void;
  productNameInputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function ProductInputForm({
  dict,
  locale,
  onImageUpload,
  onTextSubmit,
  onValidationError,
  productNameInputRef,
}: ProductInputFormProps) {
  // Zustand store
  const {
    productName,
    productDescription,
    inputMode,
    sessionStatus,
    showProductNameError,
    setProductName,
    setProductDescription,
    setInputMode,
    setShowProductNameError,
  } = useProductIntelligenceStore();

  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Local state for image generation
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showImageSelection, setShowImageSelection] = useState(false);

  const handleProductNameFocus = () => {
    setTimeout(() => {
      productNameInputRef?.current?.focus();
    }, 100);
  };

  const handleGenerateImages = async () => {
    if (!productName.trim() || !productDescription.trim()) {
      onValidationError(dict.productIntelligence.productNameRequired);
      return;
    }

    setIsGeneratingImages(true);
    setShowImageSelection(false);

    try {
      const response = await fetch('/api/agents/product-intelligence/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          productDescription,
          locale
        }),
      });

      const result = await response.json();

      if (result.success && result.data.images) {
        setGeneratedImages(result.data.images);
        setShowImageSelection(true);
        setSelectedImageIndex(null);
      } else {
        onValidationError(result.error || dict.productIntelligence.imageGeneration.noImages);
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      onValidationError(dict.productIntelligence.imageGeneration.noImages);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleImageSelect = async (selectedImage: string, index: number) => {
    setSelectedImageIndex(index);

    // Convert base64 to File for upload processing
    try {
      const byteCharacters = atob(selectedImage);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const file = new File([byteArray], `${productName}-generated-${index + 1}.jpg`, {
        type: 'image/jpeg',
      });

      // Call the existing image upload handler
      await onImageUpload(file);
    } catch (error) {
      console.error('Failed to process selected image:', error);
      onValidationError('Failed to process selected image');
    }
  };

  const handleTextModeSubmit = () => {
    if (!productName.trim()) {
      setShowProductNameError(true);
      return;
    }

    if (!productDescription.trim()) {
      onValidationError('Product description is required');
      return;
    }

    // Generate images first, then user can select one
    handleGenerateImages();
  };

  return (
    <Card variant="magical" glow className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          {dict.productIntelligence.stepEnterInfo}
        </h2>
        <p className="text-gray-300 text-sm">{dict.productIntelligence.stepDescription}</p>
      </div>

      {/* Input Mode Toggle */}
      <div className="mb-6">
        <div className="flex rounded-lg bg-gray-800 p-1 max-w-md mx-auto">
          <button
            onClick={() => {
              setInputMode("image");
              setTimeout(() => {
                productNameInputRef?.current?.focus();
              }, 100);
            }}
            className={`cursor-pointer flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              inputMode === "image"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {dict.productIntelligence.uploadMethods.imageToCommercial}
          </button>
          <button
            onClick={() => {
              setInputMode("text");
              setTimeout(() => {
                productName ? textInputRef.current?.focus() : productNameInputRef?.current?.focus();
              }, 100);
            }}
            className={`cursor-pointer flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              inputMode === "text"
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {dict.productIntelligence.uploadMethods.textToCommercial}
          </button>
        </div>
      </div>

      {/* Required Product Name Input */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-white">
          <svg
            className="w-4 h-4 mr-2 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          {dict.productIntelligence.productName}
          <span className="text-red-400 ml-1">*</span>
        </label>
        <input
          ref={productNameInputRef}
          type="text"
          value={productName}
          onChange={(e) => {
            setProductName(e.target.value);
            // Clear error state when user starts typing
            if (showProductNameError) {
              setShowProductNameError(false);
            }
          }}
          placeholder={dict.productIntelligence.productNameExample}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 ${
            showProductNameError
              ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-900/10"
              : productName.trim().length > 0
                ? "border-green-500/70 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-900/10"
                : "border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
          disabled={sessionStatus === SessionStatus.ANALYZING}
          maxLength={100}
          required
        />
        <div className="mb-3">
          {showProductNameError ? (
            <p className="text-xs text-red-400 flex items-center mt-1">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {dict.productIntelligence.productNameRequiredShort}
            </p>
          ) : productName.trim().length > 0 ? (
            <p className="text-xs text-green-400 flex items-center mt-1">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {dict.productIntelligence.productNameReady}
            </p>
          ) : null}
        </div>
      </div>

      {/* Image Upload Mode */}
      {inputMode === "image" && (
        <ImageUploadArea
          onImageUpload={onImageUpload}
          dict={dict}
          isUploading={sessionStatus === SessionStatus.ANALYZING}
          locale={locale}
          productName={productName}
          onValidationError={onValidationError}
        />
      )}

      {/* Text Input Mode */}
      {inputMode === "text" && (
        <div className="space-y-4">
          {!showImageSelection ? (
            <>
              <div className="relative">
                <textarea
                  value={productDescription}
                  ref={textInputRef}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder={dict.productIntelligence.productDescriptionExample}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none transition-colors"
                  rows={6}
                  disabled={sessionStatus === SessionStatus.ANALYZING || isGeneratingImages}
                />
              </div>

              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>{productDescription.length}/1000</span>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {dict.productIntelligence.moreDetails}
                </div>
              </div>

              <button
                onClick={handleTextModeSubmit}
                disabled={
                  !productDescription.trim() ||
                  !productName.trim() ||
                  sessionStatus === SessionStatus.ANALYZING ||
                  isGeneratingImages
                }
                className="cursor-pointer w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {isGeneratingImages ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {dict.productIntelligence.imageGeneration.generating}
                  </div>
                ) : sessionStatus === SessionStatus.ANALYZING ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {dict.productIntelligence.analyzing}
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 inline mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {dict.productIntelligence.imageGeneration.generateImages}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Image Selection Grid */}
              <ImageSelectionGrid
                images={generatedImages}
                onImageSelect={handleImageSelect}
                dict={dict}
                isLoading={isGeneratingImages}
              />

              {/* Regenerate Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateImages}
                  disabled={isGeneratingImages || sessionStatus === SessionStatus.ANALYZING}
                  className="cursor-pointer flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4 inline mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {dict.productIntelligence.imageGeneration.regenerateImages}
                </button>

                <button
                  onClick={() => {
                    setShowImageSelection(false);
                    setGeneratedImages([]);
                    setSelectedImageIndex(null);
                  }}
                  className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-500 transition-all duration-200"
                >
                  {dict.common.back}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
