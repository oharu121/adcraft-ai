'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import type { Dictionary, Locale } from '@/lib/dictionaries';

export interface HeaderProps {
  className?: string;
  dict: Dictionary;
  locale: Locale;
}

/**
 * Simple navigation header for the application
 * Responsive design with mobile menu support
 */
export function Header({ className, dict, locale }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <header className={cn(
      'bg-white border-b border-slate-200 sticky top-0 z-50',
      'backdrop-blur-sm bg-white/95',
      className
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link 
              href={`/${locale}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={handleMenuClose}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-900">
                  {dict.header.title}
                </h1>
                <p className="text-xs text-slate-500 -mt-1">
                  {dict.header.subtitle}
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href={`/${locale}`}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              {dict.navigation.home}
            </Link>
            <Link
              href={`/${locale}/gallery`}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              {dict.navigation.gallery}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              {dict.navigation.about}
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                href="/en"
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded transition-colors',
                  locale === 'en' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                EN
              </Link>
              <Link
                href="/ja"
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded transition-colors',
                  locale === 'ja' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                JP
              </Link>
            </div>

            {/* Cost Tracker */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-slate-600 font-medium">
                {dict.header.budget}: $300
              </span>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={handleMobileMenuToggle}
              aria-expanded={isMobileMenuOpen}
              aria-label={dict.navigation.toggleMenu}
            >
              <svg
                className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  isMobileMenuOpen && 'rotate-90'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href={`/${locale}`}
                className="block px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md font-medium transition-colors"
                onClick={handleMenuClose}
              >
                {dict.navigation.generate}
              </Link>
              <Link
                href={`/${locale}/gallery`}
                className="block px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md font-medium transition-colors"
                onClick={handleMenuClose}
              >
                {dict.navigation.gallery}
              </Link>
              <Link
                href={`/${locale}/about`}
                className="block px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md font-medium transition-colors"
                onClick={handleMenuClose}
              >
                {dict.navigation.about}
              </Link>
              
              {/* Mobile Budget Display */}
              <div className="flex items-center gap-2 px-3 py-2 text-sm border-t border-slate-100 mt-2 pt-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-600 font-medium">
                  {dict.header.remainingBudget}: $300
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}