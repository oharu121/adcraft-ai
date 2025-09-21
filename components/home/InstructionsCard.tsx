"use client";

import { Card } from "@/components/ui";
import { useProductIntelligenceStore } from "@/lib/stores/product-intelligence-store";
import type { Dictionary } from "@/lib/dictionaries";

interface InstructionsCardProps {
  dict: Dictionary;
}

export default function InstructionsCard({ dict }: InstructionsCardProps) {
  const { inputMode } = useProductIntelligenceStore();

  const instructions = inputMode === "image"
    ? dict.productIntelligence.imageMode
    : dict.productIntelligence.textMode;

  return (
    <Card className="p-6 bg-gray-800/30 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-3">
        {dict.productIntelligence.howItWorks}
      </h3>
      <div className="space-y-3 text-sm text-gray-300">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
            1
          </span>
          <p>{instructions.stepInstructions1}</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
            2
          </span>
          <p>{instructions.stepInstructions2}</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
            3
          </span>
          <p>{instructions.stepInstructions3}</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
            4
          </span>
          <p>{instructions.stepInstructions4}</p>
        </div>
      </div>
    </Card>
  );
}