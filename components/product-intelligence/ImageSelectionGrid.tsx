"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import type { Dictionary } from "@/lib/dictionaries";

interface ImageSelectionGridProps {
  images: string[]; // Base64 encoded images
  onImageSelect: (selectedImage: string, index: number) => void;
  dict: Dictionary;
  isLoading?: boolean;
}

export function ImageSelectionGrid({
  images,
  onImageSelect,
  dict,
  isLoading = false
}: ImageSelectionGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleImageClick = (image: string, index: number) => {
    setSelectedIndex(index);
    onImageSelect(image, index);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {dict.productIntelligence.imageGeneration.generating}
          </h3>
          <p className="text-gray-400 text-sm">
            {dict.productIntelligence.imageGeneration.generatingDescription}
          </p>
        </div>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>{dict.productIntelligence.imageGeneration.noImages}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-2">
          {dict.productIntelligence.imageGeneration.selectImage}
        </h3>
        <p className="text-gray-400 text-sm">
          {dict.productIntelligence.imageGeneration.selectImageDescription}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            onClick={() => handleImageClick(image, index)}
            className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 ${
              selectedIndex === index
                ? "ring-4 ring-blue-500 shadow-lg"
                : "hover:ring-2 hover:ring-blue-300"
            }`}
          >
            <img
              src={`data:image/jpeg;base64,${image}`}
              alt={`${dict.productIntelligence.imageGeneration.generatedImage} ${index + 1}`}
              className="w-full h-48 object-cover"
            />

            {/* Selection indicator */}
            {selectedIndex === index && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Image number badge */}
            <div className="absolute top-2 left-2 w-6 h-6 bg-black/70 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {index + 1}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200" />
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <div className="flex items-center text-blue-300 text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {dict.productIntelligence.imageGeneration.imageSelected.replace("{number}", String(selectedIndex + 1))}
          </div>
        </div>
      )}
    </Card>
  );
}