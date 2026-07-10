import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement these — several components rely on them
// (usePrefersReducedMotion via matchMedia, JourneySection via
// ResizeObserver, framer-motion's whileInView/useInView via
// IntersectionObserver). Safe no-op/never-fires stubs are enough for
// rendering + smoke tests; nothing here asserts on their callbacks firing.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom's window.scrollTo exists but logs "Not implemented" noise — RootLayout
// calls it on every route change, so just make it a no-op for tests.
window.scrollTo = () => {};

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}
