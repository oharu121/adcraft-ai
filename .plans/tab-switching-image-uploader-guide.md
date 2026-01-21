# Implementation Guide: Tab Switching & Image Uploader Components

A comprehensive guide for Claude Code to implement similar UI components based on AdCraft AI patterns.

---

## Overview

This guide documents the implementation of:
1. **Tab Switching Component** - Toggle between "Image to Commercial" and "Text to Commercial" modes
2. **Image Uploader with Drag & Drop** - Full-featured upload area with validation, preview, and status feedback

---

## 1. Tab Switching Component

### File Location
`components/home/ProductInputForm.tsx` (lines 140-190)

### Implementation Pattern

```typescript
// Tab container with pill-style background
<div className="flex rounded-lg bg-gray-800 p-1 max-w-md mx-auto">

  {/* Tab 1: Image Mode */}
  <button
    onClick={() => {
      setInputMode("image");
      // Focus handling after tab switch
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }}
    className={`cursor-pointer flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      inputMode === "image"
        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
        : "text-gray-300 hover:text-white"
    }`}
  >
    <svg className="w-4 h-4 mr-2" ...>
      {/* Icon SVG path */}
    </svg>
    {t.imageToCommercial}
  </button>

  {/* Tab 2: Text Mode */}
  <button
    onClick={() => {
      setInputMode("text");
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }}
    className={`cursor-pointer flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      inputMode === "text"
        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
        : "text-gray-300 hover:text-white"
    }`}
  >
    <svg className="w-4 h-4 mr-2" ...>
      {/* Icon SVG path */}
    </svg>
    {t.textToCommercial}
  </button>
</div>
```

### Key Styling Classes

| Element | Classes | Purpose |
|---------|---------|---------|
| Container | `flex rounded-lg bg-gray-800 p-1` | Dark pill background |
| Active Tab (Image) | `bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md` | Purple-pink gradient |
| Active Tab (Text) | `bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md` | Yellow-orange gradient |
| Inactive Tab | `text-gray-300 hover:text-white` | Subtle with hover |
| All Buttons | `cursor-pointer flex-1 rounded-md transition-all duration-200` | Shared base styles |

### State Management (Zustand)

```typescript
// In store file
interface Store {
  inputMode: 'image' | 'text';
  setInputMode: (mode: 'image' | 'text') => void;
}

// Usage in component
const { inputMode, setInputMode } = useStore();
```

### Conditional Rendering

```typescript
{inputMode === "image" && <ImageUploadArea ... />}
{inputMode === "text" && <TextInputArea ... />}
```

---

## 2. Image Uploader with Drag & Drop

### File Location
`components/product-intelligence/ImageUploadArea.tsx`

### Props Interface

```typescript
interface ImageUploadProps {
  onImageUpload: (file: File) => Promise<void>;
  dict: Dictionary;           // Localization
  isUploading?: boolean;      // External loading state
  maxFileSize?: number;       // Default: 10MB
  acceptedFormats?: string[]; // Default: ['image/jpeg', 'image/png', 'image/webp']
  locale?: 'en' | 'ja';
  className?: string;
  productName?: string;       // Required field validation
  onValidationError?: (message: string) => void;
}
```

### Upload State Interface

```typescript
interface UploadedImage {
  file: File;
  previewUrl: string;
  uploadProgress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}
```

### Drag & Drop Implementation

```typescript
const [dragActive, setDragActive] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);

// Drag over - show visual feedback
const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(true);
}, []);

// Drag leave - remove feedback
const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
}, []);

// Drop - process file
const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);

  if (isUploading) return;

  // Pre-validation (e.g., required field check)
  if (!productName.trim()) {
    onValidationError?.(t.productNameRequired);
    return;
  }

  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    handleFileUpload(files[0]);
  }
}, [handleFileUpload, isUploading, productName]);
```

### File Validation

```typescript
const validateFile = useCallback((file: File): string | null => {
  if (file.size > maxFileSize) {
    return t.fileTooLarge;
  }
  if (!acceptedFormats.includes(file.type)) {
    return t.unsupportedFormat;
  }
  return null;
}, [maxFileSize, acceptedFormats, t]);
```

### Upload Area JSX

```typescript
<div
  className={`
    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
    ${dragActive
      ? 'border-blue-500 bg-blue-50'           // Drag active state
      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
    }
    ${isUploading ? 'pointer-events-none opacity-50' : ''}
  `}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  onClick={handleFileInputClick}
>
  {/* Hidden file input */}
  <input
    ref={fileInputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={handleFileInputChange}
    className="hidden"
  />

  {/* Upload icon and text */}
  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
    <svg className="w-8 h-8 text-blue-500" ...>
      {/* Cloud upload icon */}
    </svg>
  </div>

  <p className="text-base font-medium text-gray-700">
    {dragActive ? t.dragActive : t.description}
  </p>

  <Button variant="primary" size="sm" onClick={handleFileInputClick}>
    {t.selectFile}
  </Button>
</div>
```

### Image Preview with Status Overlays

```typescript
{uploadedImage && (
  <div className="relative rounded-lg overflow-hidden bg-gray-100">
    <img
      src={uploadedImage.previewUrl}
      alt="Preview"
      className="w-full h-64 object-cover"
    />

    {/* Uploading overlay */}
    {uploadedImage.status === 'uploading' && (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <LoadingSpinner />
        <p className="text-white">{t.analyzing}</p>
      </div>
    )}

    {/* Error overlay */}
    {uploadedImage.status === 'error' && (
      <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center">
        <p className="text-white">{t.errorTitle}</p>
      </div>
    )}

    {/* Success badge */}
    {uploadedImage.status === 'completed' && (
      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
        <CheckIcon className="w-4 h-4 text-white" />
      </div>
    )}
  </div>
)}
```

---

## 3. My Honest Opinion

### What Works Well

1. **State Management with Zustand** - The pattern of keeping `inputMode` and form state in Zustand is excellent. State persists across component unmounts, which is critical for good UX.

2. **Clean Conditional Rendering** - The `{inputMode === "image" && ...}` pattern is simple and readable.

3. **Comprehensive Validation** - Validating prerequisites (product name) before allowing upload prevents user frustration.

4. **Localization from Day 1** - Using `dict.section.key` pattern makes i18n straightforward.

5. **Status Overlay Pattern** - The upload/error/success overlays on the preview image are polished UX.

### Areas for Improvement

1. **Tab Component Could Be Extracted** - The tab switching logic is inline. For reuse, extract to a generic `<TabGroup>` component:

```typescript
// Better abstraction
<TabGroup
  tabs={[
    { id: 'image', label: t.imageMode, icon: ImageIcon, gradient: 'purple-pink' },
    { id: 'text', label: t.textMode, icon: TextIcon, gradient: 'yellow-orange' }
  ]}
  activeTab={inputMode}
  onChange={setInputMode}
/>
```

2. **Drag & Drop Could Use a Hook** - The drag handlers are boilerplate. Consider:

```typescript
// Custom hook approach
const { dragActive, dragHandlers } = useDragAndDrop({
  onDrop: handleFileUpload,
  validate: validateFile
});
```

3. **File Input Click Validation is Awkward** - The pattern of validating before `fileInputRef.click()` is repeated. This could be cleaner:

```typescript
// Current: validation before click (repeated)
const handleFileInputClick = useCallback(() => {
  if (!productName.trim()) { /* error */ return; }
  fileInputRef.current?.click();
}, [productName]);

// Better: single validation point in upload handler
```

4. **No Upload Progress Tracking** - The `uploadProgress` field exists but isn't actually tracked. For large files, real progress would improve UX.

5. **Memory Leak Potential** - `URL.createObjectURL()` is called but cleanup only happens in `handleUploadNew`. If the component unmounts mid-upload, the object URL leaks.

### Recommendations for Your Project

1. **Use Zustand** - Don't use React Context for this level of state complexity. Zustand's simplicity wins.

2. **Keep the Styling Patterns** - The gradient tabs and dashed border drop zone are industry-standard and users understand them.

3. **Extract Reusable Hooks**:
   - `useDragAndDrop()` for drag handling
   - `useFileValidation()` for size/type checks

4. **Add Keyboard Navigation** - The current tabs aren't keyboard accessible. Add `role="tablist"`, `role="tab"`, and arrow key navigation.

5. **Consider React-Dropzone** - For production, `react-dropzone` handles edge cases (nested drops, directory drops) that this implementation doesn't.

---

## 4. Quick Implementation Checklist

### For Tab Switching:
- [ ] Create Zustand store with `inputMode` state
- [ ] Use `flex rounded-lg bg-gray-800 p-1` container
- [ ] Apply gradient backgrounds for active state
- [ ] Add `cursor-pointer` and `transition-all duration-200`
- [ ] Handle focus after tab switch with `setTimeout`

### For Image Uploader:
- [ ] Create `UploadedImage` state interface
- [ ] Implement `handleDragOver`, `handleDragLeave`, `handleDrop`
- [ ] Always `e.preventDefault()` and `e.stopPropagation()`
- [ ] Use hidden `<input type="file">` with ref
- [ ] Show visual feedback during drag (`dragActive` state)
- [ ] Create preview with `URL.createObjectURL()`
- [ ] Implement status overlays (uploading/error/success)
- [ ] Clean up object URLs on unmount

---

## 5. Files Referenced

| File | Purpose |
|------|---------|
| `components/home/ProductInputForm.tsx` | Tab switching + orchestration |
| `components/product-intelligence/ImageUploadArea.tsx` | Drag & drop uploader |
| `lib/stores/product-intelligence-store.ts` | Zustand state management |

---

## 6. Full Source Code Reference

### ProductInputForm.tsx (Complete Tab Section)

```typescript
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

      {/* Conditional content based on inputMode */}
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

      {inputMode === "text" && (
        <div className="space-y-4">
          {/* Text input content */}
        </div>
      )}
    </Card>
  );
}
```

### Zustand Store Pattern

```typescript
import { create } from 'zustand';

interface ProductIntelligenceStore {
  // Input mode state
  inputMode: 'image' | 'text';
  setInputMode: (mode: 'image' | 'text') => void;

  // Product input state
  productName: string;
  productDescription: string;
  setProductName: (name: string) => void;
  setProductDescription: (description: string) => void;

  // Image upload state
  uploadedImage: File | null;
  uploadedImageBase64: string | null;
  setUploadedImage: (file: File | null) => void;
  setUploadedImageBase64: (base64: string | null) => void;

  // UI state
  showProductNameError: boolean;
  setShowProductNameError: (show: boolean) => void;

  // Reset
  resetSession: () => void;
}

export const useProductIntelligenceStore = create<ProductIntelligenceStore>((set) => ({
  // Initial state
  inputMode: "image",
  productName: "",
  productDescription: "",
  uploadedImage: null,
  uploadedImageBase64: null,
  showProductNameError: false,

  // Actions
  setInputMode: (mode) => set({ inputMode: mode }),
  setProductName: (name) => set({ productName: name }),
  setProductDescription: (description) => set({ productDescription: description }),
  setUploadedImage: (file) => set({ uploadedImage: file }),
  setUploadedImageBase64: (base64) => set({ uploadedImageBase64: base64 }),
  setShowProductNameError: (show) => set({ showProductNameError: show }),

  resetSession: () => set({
    inputMode: "image",
    productName: "",
    productDescription: "",
    uploadedImage: null,
    uploadedImageBase64: null,
    showProductNameError: false,
  }),
}));
```

---

*This guide reflects honest analysis of a production codebase. The patterns work but aren't perfect - use them as a starting point and improve where noted.*
