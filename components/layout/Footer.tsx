'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import type { Dictionary } from '@/lib/dictionaries';

export interface FooterProps {
  className?: string;
  dict: Dictionary;
}

/**
 * Basic footer component with project information
 * Contains links, hackathon details, and technical credits
 */
export function Footer({ className, dict }: FooterProps) {
  return (
    <footer className={cn(
      'bg-slate-50 border-t border-slate-200 mt-auto',
      className
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
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
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {dict.header.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {dict.header.subtitle}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4 max-w-md">
              Transform text prompts into professional video content using cutting-edge 
              AI technology. Built for the AI Agent Hackathon 2025.
            </p>
            
            {/* Hackathon Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-700 font-medium">
                AI Agent Hackathon 2025
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">
              Features
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/"
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Video Generation
                </Link>
              </li>
              <li>
                <Link 
                  href="/gallery"
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sample Gallery
                </Link>
              </li>
              <li>
                <Link 
                  href="/about"
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  About Project
                </Link>
              </li>
            </ul>
          </div>

          {/* Technical Info */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">
              Technology
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.568 14.568c-.707.707-1.854.707-2.561 0L12 11.561l-3.007 3.007c-.707.707-1.854.707-2.561 0-.707-.707-.707-1.854 0-2.561L9.439 9l-3.007-3.007c-.707-.707-.707-1.854 0-2.561.707-.707 1.854-.707 2.561 0L12 6.439l3.007-3.007c.707-.707 1.854-.707 2.561 0 .707.707.707 1.854 0 2.561L14.561 9l3.007 3.007c.707.707.707 1.854 0 2.561z"/>
                </svg>
                Google DeepMind Veo
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 2.18c5.42 0 9.82 4.4 9.82 9.82 0 5.42-4.4 9.82-9.82 9.82-5.42 0-9.82-4.4-9.82-9.82 0-5.42 4.4-9.82 9.82-9.82z"/>
                </svg>
                Vertex AI Gemini
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/>
                </svg>
                Google Cloud Run
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 01-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 00-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 00-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 01-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 01-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 01.174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 004.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 002.466-2.163 11.944 11.944 0 002.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 00-2.499-.523A33.119 33.119 0 0011.573 0z"/>
                </svg>
                Next.js & TypeScript
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              <p>
                {dict.footer.copyright}
              </p>
              <p className="mt-1">
                {dict.footer.poweredBy} • {dict.footer.version}
              </p>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-600">System Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-slate-600">GCP Asia-Northeast1</span>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h5 className="text-sm font-medium text-yellow-800">
                  Demo Application
                </h5>
                <p className="text-xs text-yellow-700 mt-1">
                  This is a demonstration application built for the AI Agent Hackathon 2025. 
                  Video generation costs approximately $1.50 per 15-second video. 
                  Generated content is automatically deleted after 12 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}