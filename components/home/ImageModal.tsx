"use client";

import { useProductIntelligenceStore } from "@/lib/stores/product-intelligence-store";
import type { Dictionary } from "@/lib/dictionaries";

interface ImageModalProps {
  dict: Dictionary;
}

export default function ImageModal({ dict }: ImageModalProps) {
  const {
    showImageModal,
    uploadedImage,
    setShowImageModal,
  } = useProductIntelligenceStore();

  if (!showImageModal || !uploadedImage) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={() => setShowImageModal(false)}
    >
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={() => setShowImageModal(false)}
          className="cursor-pointer absolute -top-4 -right-4 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 transition-colors z-10"
          title="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <img
          src={URL.createObjectURL(uploadedImage)}
          alt={dict.productIntelligence.productFullSize}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="absolute bottom-4 left-4 bg-black/70 rounded px-3 py-2">
          <span className="text-white text-sm font-medium">{uploadedImage.name}</span>
          <span className="text-gray-300 text-xs ml-2">
            {dict.productIntelligence.clickOutsideToClose}
          </span>
        </div>
      </div>
    </div>
  );
}