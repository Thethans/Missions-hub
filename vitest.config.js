import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    globals: true,
    // .claude/worktrees/* are isolated checkouts Claude Code creates for
    // parallel/background work — each has its own node_modules, which can
    // go stale (duplicate React copies, etc.) if left around. Vitest's
    // default file discovery picks up test files from there too, which has
    // previously caused a pile of phantom failures unrelated to any real
    // code in this checkout.
    exclude: ['**/node_modules/**', '**/.claude/worktrees/**']
  }
});
