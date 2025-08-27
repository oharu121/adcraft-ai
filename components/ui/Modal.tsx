'use client';

import {
  HTMLAttributes,
  forwardRef,
  useEffect,
  useRef,
  Fragment,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  title?: string;
  description?: string;
}

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Main Modal component with accessibility features
 * Includes focus trapping, escape key handling, and body scroll lock
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      title,
      description,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-7xl mx-4',
    };

    // Handle escape key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Handle focus management
    useEffect(() => {
      if (!isOpen) return;

      // Store previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);

      // Body scroll lock
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore focus
        previousActiveElement.current?.focus();
        // Restore scroll
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    // Focus trap
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    if (!isOpen) return null;

    const modalContent = (
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* Modal positioning */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            ref={modalRef}
            className={cn(
              // Base styles
              'relative w-full transform overflow-hidden',
              'rounded-lg bg-white shadow-xl transition-all',
              // Size classes
              sizeClasses[size],
              className
            )}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            {...props}
          >
            {/* Default header if title or description provided */}
            {(title || description) && (
              <ModalHeader onClose={onClose} showCloseButton={showCloseButton}>
                {title && (
                  <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-sm text-gray-600">
                    {description}
                  </p>
                )}
              </ModalHeader>
            )}

            {/* Custom content */}
            {children}
          </div>
        </div>
      </div>
    );

    // Render modal using portal
    return typeof window !== 'undefined'
      ? createPortal(modalContent, document.body)
      : null;
  }
);

/**
 * Modal Header component
 */
export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, onClose, showCloseButton = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start justify-between',
          'px-6 py-4 border-b border-gray-200',
          className
        )}
        {...props}
      >
        <div className="flex-1">{children}</div>

        {showCloseButton && onClose && (
          <button
            type="button"
            className={cn(
              'ml-4 p-1 rounded-md text-gray-400',
              'hover:text-gray-600 hover:bg-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'transition-colors'
            )}
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

/**
 * Modal Content component
 */
export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

/**
 * Modal Footer component
 */
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end gap-3',
          'px-6 py-4 border-t border-gray-200 bg-gray-50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

// Set display names
Modal.displayName = 'Modal';
ModalHeader.displayName = 'ModalHeader';
ModalContent.displayName = 'ModalContent';
ModalFooter.displayName = 'ModalFooter';