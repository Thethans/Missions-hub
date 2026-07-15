// Ambient augmentation for jest-dom's matchers (toBeInTheDocument, etc.) on
// vitest's `expect`. vitest.setup.js already imports the runtime half
// ('@testing-library/jest-dom/vitest'); this repo's tsconfig.json is scoped
// to src/features/prayer-map only, so existing plain-JS tests elsewhere never
// needed this, but the prayer-map feature's own .ts/.tsx tests do.
import '@testing-library/jest-dom/vitest';
