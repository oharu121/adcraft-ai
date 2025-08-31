'use client';

import { useCallback, useState } from 'react';
import { Card } from '@/components/ui';
import { 
  PromptInput, 
  GenerateButton, 
  ProgressTracker, 
  VideoDisplay 
} from '@/components/video-generator';
import { useVideoGeneration } from '@/hooks';
import type { Dictionary, Locale } from '@/lib/dictionaries';

interface HomeClientProps {
  dict: Dictionary;
  locale: Locale;
}

export default function HomeClient({ dict }: HomeClientProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [duration, setDuration] = useState(15);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [style, setStyle] = useState('realistic');

  const [state, actions] = useVideoGeneration({
    onSuccess: (videoUrl, jobId) => {
      console.log('Video generation successful:', { videoUrl, jobId });
    },
    onError: (error) => {
      console.error('Video generation error:', error);
    },
    onProgress: (progress, status) => {
      console.log('Progress update:', { progress, status });
    },
  });

  const handleGenerate = useCallback(async () => {
    if (!state.prompt.trim()) {
      return;
    }

    try {
      await actions.generateVideo({
        duration,
        aspectRatio,
        style,
      });
    } catch (error) {
      console.error('Failed to generate video:', error);
    }
  }, [state.prompt, duration, aspectRatio, style, actions]);

  const handleCancel = useCallback(async () => {
    await actions.cancelGeneration();
  }, [actions]);

  const handleReset = useCallback(() => {
    actions.resetState();
    setShowAdvanced(false);
  }, [actions]);

  const isGenerating = state.status === 'generating' || state.status === 'processing';
  const isCompleted = state.status === 'completed';

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl relative">
        {/* Floating Orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
          <div className="floating-orb absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
          <div className="floating-orb absolute top-1/2 right-1/3 w-20 h-20 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-xl"></div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16 relative min-h-[60vh] md:min-h-[80vh] flex flex-col justify-center">
          <div className="inline-block mb-4 md:mb-6">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 magical-text px-4">
            {dict.home.heroTitle}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-3 md:mb-4 max-w-2xl mx-auto leading-relaxed px-4">
            {dict.home.heroSubtitle}
          </p>
          <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8 px-4">
            {dict.home.heroCost}
          </p>

          {/* Scroll Indicator - Hidden on mobile */}
          <div className="hidden md:block absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6 md:space-y-8">
          {/* Input Section */}
          <Card variant="magical" hover glow className="p-4 md:p-8">
            <div className="space-y-6 md:space-y-8">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 md:mb-6">
                  {dict.home.describeVideo}
                </h2>
                <PromptInput
                  value={state.prompt}
                  onChange={actions.setPrompt}
                  placeholder={dict.home.placeholder}
                  disabled={isGenerating}
                  maxLength={500}
                  dict={dict}
                />
              </div>

              {/* Advanced Options */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-gray-300 hover:text-white text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <span>{showAdvanced ? '▼' : '▶'}</span>
                  {dict.home.advancedOptions}
                </button>

                {showAdvanced && (
                  <div className="mt-4 md:mt-6 p-4 md:p-6 glass-card rounded-xl space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-3">
                          {dict.home.duration}
                        </label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full px-4 py-3 magical-input text-white rounded-lg"
                          disabled={isGenerating}
                        >
                          <option value={5}>{dict.duration['5seconds']}</option>
                          <option value={10}>{dict.duration['10seconds']}</option>
                          <option value={15}>{dict.duration['15seconds']}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-3">
                          {dict.home.aspectRatio}
                        </label>
                        <select
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value)}
                          className="w-full px-4 py-3 magical-input text-white rounded-lg"
                          disabled={isGenerating}
                        >
                          <option value="16:9">{dict.aspectRatio['16:9']}</option>
                          <option value="9:16">{dict.aspectRatio['9:16']}</option>
                          <option value="1:1">{dict.aspectRatio['1:1']}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-3">
                          {dict.home.style}
                        </label>
                        <select
                          value={style}
                          onChange={(e) => setStyle(e.target.value)}
                          className="w-full px-4 py-3 magical-input text-white rounded-lg"
                          disabled={isGenerating}
                        >
                          <option value="realistic">{dict.style.realistic}</option>
                          <option value="cinematic">{dict.style.cinematic}</option>
                          <option value="animated">{dict.style.animated}</option>
                          <option value="artistic">{dict.style.artistic}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Generation Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <GenerateButton
                  onGenerate={handleGenerate}
                  disabled={!state.prompt.trim() || isGenerating}
                  isLoading={isGenerating}
                  prompt={state.prompt}
                  estimatedCost={state.estimatedCost}
                  dict={dict}
                />
                
                {isGenerating && (
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 text-gray-300 hover:text-white font-medium transition-colors glass-card rounded-lg"
                  >
                    {dict.common.cancel}
                  </button>
                )}

                {isCompleted && (
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 magical-button text-white font-medium rounded-lg"
                  >
                    {dict.home.createAnother}
                  </button>
                )}
              </div>

              {/* Cost Estimate */}
              <div className="text-sm text-gray-300">
                <p>
                  {dict.home.estimatedCost.replace('${cost}', state.estimatedCost.toFixed(2))}
                </p>
              </div>
            </div>
          </Card>

          {/* Progress Section */}
          {(isGenerating || isCompleted) && (
            <Card variant="magical" glow className="p-4 md:p-8">
              <ProgressTracker
                jobId={state.jobId}
                status={state.status === 'idle' ? 'pending' : 
                       state.status === 'generating' ? 'processing' : 
                       state.status}
                progress={state.progress}
                estimatedTimeRemaining={state.estimatedTimeRemaining}
                error={state.error}
                onCancel={handleCancel}
              />
            </Card>
          )}

          {/* Video Display Section */}
          {state.videoUrl && (
            <Card variant="magical" hover glow className="p-4 md:p-8">
              <VideoDisplay
                videoUrl={state.videoUrl}
                thumbnailUrl={state.thumbnailUrl}
                title={`Generated Video: ${state.prompt.slice(0, 50)}...`}
                onDownload={() => {
                  if (state.videoUrl) {
                    const link = document.createElement('a');
                    link.href = state.videoUrl;
                    link.download = `video-${state.jobId || Date.now()}.mp4`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
              />
            </Card>
          )}

          {/* Error Display */}
          {state.error && state.status === 'failed' && (
            <Card variant="magical" className="p-4 md:p-8 border-red-400/30 bg-red-900/20">
              <div className="text-center">
                <div className="text-red-400 font-semibold mb-3 md:mb-4 text-lg">
                  {dict.home.generationFailed}
                </div>
                <div className="text-red-300 mb-4 md:mb-6 text-sm md:text-base">
                  {state.error}
                </div>
                <button
                  onClick={handleReset}
                  className="px-6 md:px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all hover:scale-105 text-sm md:text-base"
                >
                  {dict.home.tryAgain}
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}