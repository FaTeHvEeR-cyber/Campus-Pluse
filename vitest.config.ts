import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/utils/festEngine.ts', 'src/services/geminiService.ts',
        'src/validation/plannerContracts.ts', 'api/planner.ts'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: { statements: 95, lines: 95, functions: 95, branches: 70 },
    },
  },
});
