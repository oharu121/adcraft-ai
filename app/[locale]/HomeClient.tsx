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
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            {dict.home.heroTitle}
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            {dict.home.heroSubtitle}
          </p>
          <p className="text-sm text-slate-500">
            {dict.home.heroCost}
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Input Section */}
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
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
                  className="text-slate-600 hover:text-slate-800 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <span>{showAdvanced ? '▼' : '▶'}</span>
                  {dict.home.advancedOptions}
                </button>

                {showAdvanced && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {dict.home.duration}
                        </label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isGenerating}
                        >
                          <option value={5}>{dict.duration['5seconds']}</option>
                          <option value={10}>{dict.duration['10seconds']}</option>
                          <option value={15}>{dict.duration['15seconds']}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {dict.home.aspectRatio}
                        </label>
                        <select
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isGenerating}
                        >
                          <option value="16:9">{dict.aspectRatio['16:9']}</option>
                          <option value="9:16">{dict.aspectRatio['9:16']}</option>
                          <option value="1:1">{dict.aspectRatio['1:1']}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {dict.home.style}
                        </label>
                        <select
                          value={style}
                          onChange={(e) => setStyle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                  >
                    {dict.common.cancel}
                  </button>
                )}

                {isCompleted && (
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {dict.home.createAnother}
                  </button>
                )}
              </div>

              {/* Cost Estimate */}
              <div className="text-sm text-slate-600">
                <p>
                  {dict.home.estimatedCost.replace('${cost}', state.estimatedCost.toFixed(2))}
                </p>
              </div>
            </div>
          </Card>

          {/* Progress Section */}
          {(isGenerating || isCompleted) && (
            <Card className="p-6">
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
            <Card className="p-6">
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
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="text-center">
                <div className="text-red-600 font-semibold mb-2">
                  {dict.home.generationFailed}
                </div>
                <div className="text-red-700 mb-4">
                  {state.error}
                </div>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
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