"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { Dictionary } from "@/lib/dictionaries";

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
    <footer className={cn("bg-slate-50 border-t border-slate-200 mt-auto", className)}>
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
                <h3 className="text-lg font-bold text-slate-900">{dict.header.title}</h3>
                <p className="text-sm text-slate-500">{dict.header.subtitle}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4 max-w-md">{dict.footer.description}</p>

            {/* Hackathon Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-700 font-medium">{dict.footer.hackathonBadge}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">
              {dict.footer.sections.features}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {dict.footer.links.videoGeneration}
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {dict.footer.links.sampleGallery}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {dict.footer.links.aboutProject}
                </Link>
              </li>
            </ul>
          </div>

          {/* Technical Info */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">
              {dict.footer.sections.technology}
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a
                  href="https://deepmind.google/technologies/veo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <img
                    src="/product-logo/google_deepmind.ico"
                    alt="Google DeepMind"
                    className="w-4 h-4"
                  />
                  Google DeepMind Veo
                </a>
              </li>
              <li>
                <a
                  href="https://ai.google.dev/gemini-api/docs/imagen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <img src="/product-logo/ai-studio.png" alt="Google Imagen" className="w-4 h-4" />
                  Imagen 4.0
                </a>
              </li>
              <li>
                <a
                  href="https://gemini.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <img src="/product-logo/gemini.png" alt="Vertex AI" className="w-4 h-4" />
                  Gemini AI
                </a>
              </li>
              <li>
                <a
                  href="https://cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <img
                    src="/product-logo/google_cloud.ico"
                    alt="Google Cloud"
                    className="w-4 h-4"
                  />
                  Google Cloud
                </a>
              </li>
              <li>
                <a
                  href="https://firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <img src="/product-logo/firestore.png" alt="Firestore" className="w-4 h-4" />
                  Cloud Firestore
                </a>
              </li>
              <li>
                <a
                  href="https://nextjs.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <img src="/product-logo/nextjs.ico" alt="Next.js" className="w-4 h-4" />
                  Next.js & TypeScript
                </a>
              </li>
            </ul>
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
              <h5 className="text-sm font-medium text-yellow-800">{dict.footer.notice.title}</h5>
              <p className="text-xs text-yellow-700 mt-1">{dict.footer.notice.description}</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              <p>{dict.footer.copyright}</p>
              <p className="mt-1">
                {dict.footer.poweredBy} • {dict.footer.version}
              </p>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-600">{dict.footer.status.systemOnline}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-slate-600">{dict.footer.status.region}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
