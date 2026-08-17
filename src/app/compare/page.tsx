'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface DeviceDetail {
  name: string;
  img: string;
  quickSpec: Array<{ name: string; value: string }>;
  detailSpec: Array<{
    category: string;
    specifications: Array<{ name: string; value: string }>;
  }>;
}

const STARTER_PROMPTS = [
  'Summarize the biggest differences.',
  'Which one is better for battery life?',
  'Which one is the better buy for photography?',
  'Which one should I pick for everyday use?',
];

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [deviceDetails, setDeviceDetails] = useState<Record<string, DeviceDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState<string | null>(null);
  const [assistantMeta, setAssistantMeta] = useState<string | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  const deviceIds = searchParams.get('devices')?.split(',').filter(Boolean) || [];
  const deviceIdsKey = deviceIds.join(',');

  useEffect(() => {
    const ids = deviceIdsKey ? deviceIdsKey.split(',').filter(Boolean) : [];

    if (ids.length === 0) {
      setError('No devices selected for comparison.');
      setLoading(false);
      return;
    }

    void loadDeviceDetails(ids);
  }, [deviceIdsKey]);

  const loadDeviceDetails = async (ids: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const responses = await Promise.all(
        ids.map(async (deviceId) => {
          const response = await fetch(`/api/phones/device/${deviceId}`);
          const payload = await response.json();

          if (!response.ok || payload.error) {
            throw new Error(payload.details || payload.error || `Failed to fetch ${deviceId}`);
          }

          return [deviceId, payload.device] as const;
        })
      );

      setDeviceDetails(Object.fromEntries(responses));
    } catch (loadError) {
      console.error('Error loading comparison:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load device comparison.');
    } finally {
      setLoading(false);
    }
  };

  const askAssistant = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? assistantPrompt).trim();
    if (!prompt || deviceIds.length < 2) {
      return;
    }

    setAssistantLoading(true);
    setAssistantError(null);

    try {
      const response = await fetch('/api/compare/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceIds,
          prompt,
        }),
      });

      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.details || payload.error || 'Failed to get assistant response.');
      }

      setAssistantPrompt(prompt);
      setAssistantAnswer(payload.answer || '');
      setAssistantMeta(
        payload.source === 'openai'
          ? `Answered with OpenAI (${payload.model})`
          : payload.source === 'huggingface'
            ? `Answered with Hugging Face open model (${payload.model})`
            : payload.source === 'ollama'
              ? `Answered locally with Ollama (${payload.model})`
              : `Showing a grounded fallback because the AI provider was unavailable`
      );
    } catch (loadError) {
      setAssistantError(loadError instanceof Error ? loadError.message : 'Failed to get assistant response.');
      setAssistantAnswer(null);
      setAssistantMeta(null);
    } finally {
      setAssistantLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="compare-shell">
        <div className="compare-status-card">
          <div className="spinner"></div>
          <p>Building your comparison view...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="compare-shell">
        <div className="compare-status-card error">
          <h1>Comparison unavailable</h1>
          <p>{error}</p>
          <Link href="/" className="primary-button link-button">
            Back to search
          </Link>
        </div>
      </main>
    );
  }

  const firstDevice = deviceDetails[deviceIds[0]];

  return (
    <main className="compare-shell">
      <section className="compare-hero">
        <div>
          <span className="eyebrow">Spec comparison</span>
          <h1>Side-by-side device breakdown</h1>
          <p>Review the core specs first, then scroll through the deeper category-by-category comparison.</p>
        </div>
        <div className="compare-actions">
          <Link href="/" className="ghost-link">
            Back to search
          </Link>
        </div>
      </section>

      <section className="compare-summary-grid">
        {deviceIds.map((deviceId) => {
          const detail = deviceDetails[deviceId];
          if (!detail) return null;

          return (
            <article key={deviceId} className="compare-device-card">
              <div className="compare-device-image">
                <img src={detail.img} alt={detail.name} />
              </div>
              <h2>{detail.name}</h2>
              <div className="quick-spec-list">
                {detail.quickSpec.map((spec) => (
                  <div key={`${deviceId}-${spec.name}`} className="quick-spec-row">
                    <span>{spec.name}</span>
                    <strong>{spec.value}</strong>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="comparison-section assistant-section">
        <div className="comparison-section-header">
          <span className="eyebrow">Comparison Copilot</span>
          <h2>Ask about the phones you’re comparing</h2>
        </div>

        <p className="assistant-copy">
          Ask for a recommendation, a camera breakdown, battery tradeoffs, or a quick summary of the biggest
          differences.
        </p>

        <div className="assistant-prompt-list">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="brand-pill"
              onClick={() => {
                setAssistantPrompt(prompt);
                void askAssistant(prompt);
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        <label className="assistant-field">
          <span>Your question</span>
          <textarea
            value={assistantPrompt}
            onChange={(event) => setAssistantPrompt(event.target.value)}
            placeholder="Which one is better for travel photos, battery life, and long-term value?"
            rows={4}
          />
        </label>

        <button
          type="button"
          className="primary-button compact"
          onClick={() => void askAssistant()}
          disabled={assistantLoading || assistantPrompt.trim().length === 0 || deviceIds.length < 2}
        >
          {assistantLoading ? 'Thinking...' : 'Ask comparison copilot'}
        </button>

        {assistantError && <p className="assistant-error">{assistantError}</p>}

        {assistantAnswer && (
          <div className="assistant-answer-card">
            {assistantMeta && <p className="assistant-meta">{assistantMeta}</p>}
            <div className="assistant-answer-text">{assistantAnswer}</div>
          </div>
        )}
      </section>

      <section className="compare-detail-sections">
        {firstDevice?.detailSpec.map((category, categoryIndex) => (
          <article key={category.category} className="comparison-section">
            <div className="comparison-section-header">
              <span className="eyebrow">{category.category}</span>
              <h2>{category.category} comparison</h2>
            </div>

            <div className="comparison-table-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Spec</th>
                    {deviceIds.map((deviceId) => (
                      <th key={`${category.category}-${deviceId}`}>{deviceDetails[deviceId]?.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {category.specifications.map((spec, specIndex) => (
                    <tr key={`${category.category}-${spec.name}`}>
                      <td>{spec.name}</td>
                      {deviceIds.map((deviceId) => {
                        const value =
                          deviceDetails[deviceId]?.detailSpec[categoryIndex]?.specifications[specIndex]?.value || 'N/A';

                        return <td key={`${deviceId}-${spec.name}`}>{value}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
