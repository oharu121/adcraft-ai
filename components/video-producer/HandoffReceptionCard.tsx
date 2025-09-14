/**
 * Alex - Video Producer Handoff Reception Card (DEFERRED)
 *
 * IMPLEMENTATION STATUS: DEFERRED FOR FUTURE DEVELOPMENT
 */

import React from 'react';

interface HandoffReceptionCardProps {
  handoffData: any; // DavidToAlexHandoffData when implemented
  onProcessHandoff: () => void;
}

export default function HandoffReceptionCard({
  handoffData,
  onProcessHandoff
}: HandoffReceptionCardProps) {
  // DEFERRED: This component will receive and display handoff data from David

  return (
    <div className="p-6 bg-white rounded-lg shadow border-2 border-yellow-300">
      {/* DEFERRED Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-gray-800">
            David → Alex Handoff Reception
          </h3>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
          DEFERRED
        </span>
      </div>

      {/* DEFERRED: Handoff Status */}
      <div className="mb-6">
        {handoffData ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium mb-2">
              Creative handoff received from David
            </p>
            <p className="text-sm text-green-600">
              Implementation pending: Handoff processing not yet available
            </p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">
              Waiting for creative handoff from David...
            </p>
            <p className="text-sm text-yellow-600 mt-1">
              (DEFERRED: Handoff reception implementation pending)
            </p>
          </div>
        )}
      </div>

      {/* DEFERRED: Handoff Contents Preview */}
      {handoffData && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">
            Handoff Contents (Preview - DEFERRED)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded opacity-60">
              <div className="text-sm font-medium text-gray-700">Creative Brief</div>
              <div className="text-xs text-gray-500">Concept & messaging</div>
            </div>
            <div className="p-3 bg-gray-50 rounded opacity-60">
              <div className="text-sm font-medium text-gray-700">Visual Assets</div>
              <div className="text-xs text-gray-500">Generated imagery</div>
            </div>
            <div className="p-3 bg-gray-50 rounded opacity-60">
              <div className="text-sm font-medium text-gray-700">Scene Composition</div>
              <div className="text-xs text-gray-500">Storyboard & timing</div>
            </div>
            <div className="p-3 bg-gray-50 rounded opacity-60">
              <div className="text-sm font-medium text-gray-700">Style Guide</div>
              <div className="text-xs text-gray-500">Visual direction</div>
            </div>
          </div>
        </div>
      )}

      {/* DEFERRED: Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onProcessHandoff}
          disabled={!handoffData}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Process Handoff (DEFERRED)
        </button>
        <button
          disabled
          className="px-4 py-2 border border-gray-300 text-gray-500 rounded cursor-not-allowed"
        >
          Review Details (DEFERRED)
        </button>
      </div>

      {/* DEFERRED: Implementation Note */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
        <strong>Implementation Note:</strong> Handoff reception and processing will be
        implemented after Maya/David migration is complete.
      </div>
    </div>
  );
}