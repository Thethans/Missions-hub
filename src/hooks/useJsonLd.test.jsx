import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import useJsonLd from './useJsonLd.js';

function Probe({ id, schema }) {
  useJsonLd(id, schema);
  return null;
}

describe('useJsonLd', () => {
  afterEach(() => {
    cleanup();
    document.querySelectorAll('script[data-jsonld]').forEach((el) => el.remove());
  });

  it('injects a script[type=application/ld+json] into <head> keyed by id', () => {
    render(<Probe id="org" schema={{ '@type': 'Organization', name: 'Fielded' }} />);

    const script = document.querySelector('script[data-jsonld="org"]');
    expect(script).toBeInTheDocument();
    expect(script.type).toBe('application/ld+json');
    expect(JSON.parse(script.textContent)).toEqual({ '@type': 'Organization', name: 'Fielded' });
  });

  it('lets two different ids coexist without clobbering each other', () => {
    render(
      <>
        <Probe id="org" schema={{ '@type': 'Organization' }} />
        <Probe id="faq" schema={{ '@type': 'FAQPage' }} />
      </>
    );

    expect(document.querySelectorAll('script[data-jsonld]')).toHaveLength(2);
    expect(JSON.parse(document.querySelector('script[data-jsonld="org"]').textContent)['@type']).toBe('Organization');
    expect(JSON.parse(document.querySelector('script[data-jsonld="faq"]').textContent)['@type']).toBe('FAQPage');
  });

  it('escapes "<" so a literal </script> in content can never close the tag early', () => {
    render(<Probe id="danger" schema={{ text: '</script><script>alert(1)</script>' }} />);

    const script = document.querySelector('script[data-jsonld="danger"]');
    expect(script.textContent).not.toContain('</script>');
    expect(JSON.parse(script.textContent).text).toBe('</script><script>alert(1)</script>');
  });

  it('removes its script on unmount', () => {
    const { unmount } = render(<Probe id="temp" schema={{ a: 1 }} />);
    expect(document.querySelector('script[data-jsonld="temp"]')).toBeInTheDocument();

    unmount();

    expect(document.querySelector('script[data-jsonld="temp"]')).not.toBeInTheDocument();
  });

  it('does nothing when schema is falsy', () => {
    render(<Probe id="none" schema={null} />);
    expect(document.querySelector('script[data-jsonld="none"]')).not.toBeInTheDocument();
  });
});
