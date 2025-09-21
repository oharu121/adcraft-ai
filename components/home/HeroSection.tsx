import type { Dictionary } from "@/lib/dictionaries";

interface HeroSectionProps {
  dict: Dictionary;
  onScrollToSection: () => void;
  onFocusProductName?: () => void;
}

export default function HeroSection({
  dict,
  onScrollToSection,
  onFocusProductName,
}: HeroSectionProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Floating Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
        <div className="floating-orb absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
        <div className="floating-orb absolute top-1/2 right-1/3 w-20 h-20 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-xl"></div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 md:mb-8 magical-text">
          {dict.productIntelligence.title}
        </h1>

        <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-4 md:mb-6 max-w-4xl mx-auto leading-relaxed">
          {dict.productIntelligence.subtitle}
        </p>

        <p className="text-lg md:text-xl text-gray-400 mb-8 md:mb-12 max-w-3xl mx-auto">
          {dict.productIntelligence.description}
        </p>

        {/* Call to Action Button */}
        <button
          onClick={() => {
            onScrollToSection();
            onFocusProductName?.();
          }}
          className="cursor-pointer inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl mb-10"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          {dict.productIntelligence.getStarted}
        </button>

        {/* Scroll Indicator */}
        <div className="flex justify-center animate-bounce">
          <svg
            className="w-6 h-6 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
