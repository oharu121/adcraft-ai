"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import AgentAvatar from "@/components/ui/AgentAvatar";

interface AboutClientProps {
  locale: Locale;
  dict: Dictionary;
}

export default function AboutClient({ locale, dict }: AboutClientProps) {
  const t = dict.about;

  // Animation refs for scroll effects
  const heroRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<HTMLDivElement>(null);
  const techStackRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in-up");
          entry.target.classList.remove("opacity-0", "translate-y-8");
        }
      });
    }, observerOptions);

    const elements = [heroRef, agentsRef, techStackRef, journeyRef];
    elements.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-green-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center"></div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative z-10 px-6 py-20 opacity-0 translate-y-8 transition-all duration-1000"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
            {t?.title || "About AdCraft AI"}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
            {t?.subtitle ||
              "Transforming product images into compelling commercial videos using multi-agent AI systems"}
          </p>

          {/* Floating Video Preview Mock */}
          <div className="relative mx-auto w-80 h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl animate-pulse"></div>
            <div className="flex items-center justify-center h-full">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Agent System Section */}
      <section
        ref={agentsRef}
        className="relative z-10 px-6 py-20 opacity-0 translate-y-8 transition-all duration-1000"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            {t?.agentsTitle || "Multi-Agent AI System"}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Maya - Product Intelligence */}
            <div className="group relative bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-8 rounded-2xl backdrop-blur-lg border border-blue-500/20 hover:border-blue-400/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <AgentAvatar agent="maya" size="lg" state="idle" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-blue-300">
                  {t?.maya?.title || "Maya - Product Intelligence"}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {t?.maya?.description ||
                    "Advanced computer vision and NLP to analyze product images, extract features, and understand market positioning."}
                </p>
              </div>
            </div>

            {/* David - Creative Director */}
            <div className="group relative bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-8 rounded-2xl backdrop-blur-lg border border-purple-500/20 hover:border-purple-400/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <AgentAvatar agent="david" size="lg" state="idle" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-purple-300">
                  {t?.david?.title || "David - Creative Director"}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {t?.david?.description ||
                    "Strategic creative planning, visual direction, and brand storytelling to craft compelling commercial narratives."}
                </p>
              </div>
            </div>

            {/* Zara - Video Producer */}
            <div className="group relative bg-gradient-to-br from-green-900/50 to-green-800/30 p-8 rounded-2xl backdrop-blur-lg border border-green-500/20 hover:border-green-400/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <AgentAvatar agent="zara" size="lg" state="idle" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-green-300">
                  {t?.zara?.title || "Zara - Video Producer"}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {t?.zara?.description ||
                    "Advanced video generation using Google's Veo API, transforming creative concepts into professional commercials."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section
        ref={techStackRef}
        className="relative z-10 px-6 py-20 opacity-0 translate-y-8 transition-all duration-1000"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            {t?.techTitle || "Powered by Cutting-Edge Technology"}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Next.js 15", icon: "⚡" },
              { name: "Google Vertex AI", icon: "🧠" },
              { name: "Veo API", icon: "🎥" },
              { name: "TypeScript", icon: "📝" },
              { name: "Tailwind CSS", icon: "🎨" },
              { name: "Cloud Run", icon: "☁️" },
              { name: "Zustand", icon: "🗃️" },
              { name: "React Player", icon: "▶️" },
            ].map((tech, index) => (
              <div
                key={tech.name}
                className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/30 rounded-xl backdrop-blur-lg border border-gray-600/20 hover:border-gray-500/50 transition-all duration-300 transform hover:scale-110"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="text-3xl mb-3 group-hover:scale-125 transition-transform duration-300">
                  {tech.icon}
                </div>
                <div className="text-sm font-medium text-gray-300">{tech.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flexible Input Methods */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-teal-500 bg-clip-text text-transparent">
            {t?.inputTitle || "Two Ways to Start Your Commercial"}
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Image Upload Method */}
            <div className="group relative bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 p-8 rounded-2xl backdrop-blur-lg border border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-500 transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-cyan-300 text-center">
                  {t?.imageUpload?.title || "Upload Product Image"}
                </h3>
                <p className="text-gray-300 leading-relaxed text-center mb-6">
                  {t?.imageUpload?.description || "Already have a product photo? Perfect! Simply drag and drop your image to begin instant AI analysis and commercial generation."}
                </p>
                <div className="flex justify-center space-x-4 text-sm text-gray-400">
                  <span>• JPG/PNG</span>
                  <span>• Max 10MB</span>
                  <span>• Instant Analysis</span>
                </div>
              </div>
            </div>

            {/* Text Prompt Method */}
            <div className="group relative bg-gradient-to-br from-teal-900/50 to-teal-800/30 p-8 rounded-2xl backdrop-blur-lg border border-teal-500/20 hover:border-teal-400/50 transition-all duration-500 transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-teal-300 text-center">
                  {t?.textPrompt?.title || "Describe Your Product"}
                </h3>
                <p className="text-gray-300 leading-relaxed text-center mb-6">
                  {t?.textPrompt?.description || "No image yet? No problem! Describe your product in words and our AI will generate a stunning product image before creating your commercial."}
                </p>
                <div className="flex justify-center space-x-4 text-sm text-gray-400">
                  <span>• AI Image Generation</span>
                  <span>• Creative Freedom</span>
                  <span>• Professional Quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Process Flow */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-4 px-8 py-4 bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl backdrop-blur-lg border border-gray-600/20">
              <span className="text-cyan-400 font-semibold">📸 Image Upload</span>
              <span className="text-gray-500">or</span>
              <span className="text-teal-400 font-semibold">✏️ Text Description</span>
              <span className="text-gray-500">→</span>
              <span className="text-purple-400 font-semibold">🤖 AI Analysis</span>
              <span className="text-gray-500">→</span>
              <span className="text-pink-400 font-semibold">🎬 Commercial Video</span>
            </div>
          </div>
        </div>
      </section>

      {/* User Journey */}
      <section
        ref={journeyRef}
        className="relative z-10 px-6 py-20 opacity-0 translate-y-8 transition-all duration-1000"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">
            {t?.journeyTitle || "Your Journey from Image to Commercial"}
          </h2>

          <div className="relative">
            {/* Animated Connection Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-30"></div>

            <div className="space-y-16">
              {[
                {
                  step: "01",
                  title: t?.steps?.upload || "Upload Product Image",
                  description:
                    t?.steps?.uploadDesc ||
                    "Simply drag and drop your product image to begin the AI analysis process.",
                  icon: "📤",
                  side: "left",
                },
                {
                  step: "02",
                  title: t?.steps?.analyze || "AI Analysis",
                  description:
                    t?.steps?.analyzeDesc ||
                    "Maya analyzes your product, extracting features, benefits, and market positioning.",
                  icon: "🔍",
                  side: "right",
                },
                {
                  step: "03",
                  title: t?.steps?.create || "Creative Direction",
                  description:
                    t?.steps?.createDesc ||
                    "David crafts compelling visual narratives and brand storytelling strategies.",
                  icon: "🎨",
                  side: "left",
                },
                {
                  step: "04",
                  title: t?.steps?.produce || "Video Production",
                  description:
                    t?.steps?.produceDesc ||
                    "Zara generates your professional commercial video using advanced AI technology.",
                  icon: "🎬",
                  side: "right",
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className={`flex items-center ${item.side === "right" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`flex-1 ${item.side === "right" ? "pl-12" : "pr-12"}`}>
                    <div className="group bg-gradient-to-br from-gray-800/50 to-gray-700/30 p-8 rounded-2xl backdrop-blur-lg border border-gray-600/20 hover:border-gray-500/50 transition-all duration-500 transform hover:scale-105">
                      <div className="flex items-center mb-4">
                        <div className="text-3xl mr-4 group-hover:scale-125 transition-transform duration-300">
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-400 mb-1">
                            Step {item.step}
                          </div>
                          <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                        </div>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  {/* Central Circle */}
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-gray-900">
                      {item.step}
                    </div>
                  </div>

                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t?.ctaTitle || "Ready to Transform Your Product?"}
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            {t?.ctaDesc || "Join the future of AI-powered commercial video creation"}
          </p>
          <Link
            href={`/${locale}`}
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl text-white font-bold text-lg hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            {t?.ctaButton || "Start Creating Now"}
          </Link>
        </div>
      </section>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
