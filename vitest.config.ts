import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.spec.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/index.ts'],
			thresholds: {
				branches: 99,
				functions: 99,
				lines: 99,
				statements: 99,
			},
		},
	},
});
