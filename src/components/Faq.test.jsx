import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Faq from './Faq.jsx';

describe('Faq', () => {
  // useJsonLd (like usePageMeta) injects into document.head directly, which
  // outlives RTL's own container cleanup — without this, a script left over
  // from one test is still there for the next.
  afterEach(() => {
    document.querySelectorAll('script[data-jsonld]').forEach((el) => el.remove());
  });

  it('renders the visible questions', () => {
    render(<Faq />);
    expect(screen.getByText('Is Fielded affiliated with any of the agencies it lists?')).toBeInTheDocument();
  });

  it('embeds a matching FAQPage JSON-LD block in <head>, straight from the same real Q&A data', async () => {
    render(<Faq />);
    const script = await waitFor(() => {
      const el = document.querySelector('script[data-jsonld="faq"]');
      expect(el).toBeInTheDocument();
      return el;
    });

    const schema = JSON.parse(script.textContent);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity.length).toBeGreaterThan(0);
    expect(schema.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'Is Fielded affiliated with any of the agencies it lists?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: expect.stringContaining("No. Fielded doesn't receive any benefit")
      }
    });
  });
});
