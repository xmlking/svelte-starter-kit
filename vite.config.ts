import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

// Get current tag/commit and last commit date from git
const pexec = promisify(exec);

const [gitTag, gitDate] = (await Promise.allSettled([pexec('git describe --tags || git rev-parse --short HEAD'), pexec('git log -1 --format=%cd --date=format:"%Y-%m-%d %H:%M"')])).map((v) =>
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	JSON.stringify(v.value?.stdout.trim())
);

/** @type {import('vite').UserConfig} */
const config: UserConfig = {
	plugins: [sveltekit()],
	define: {
		// Eliminate in-source test code
		'import.meta.vitest': 'undefined',
		// to burn-in release version in the footer.svelte
		__APP_VERSION__: JSON.stringify(process.env.npm_package_version),
		__GIT_TAG__: gitTag,
		__GIT_DATE__: gitDate
	},
	test: {
		// jest like globals
		globals: true,
		environment: 'jsdom',
		// in-source testing
		includeSource: ['src/**/*.{js,ts,svelte}'],
		// Add @testing-library/jest-dom matchers & setup MSW
		setupFiles: ['./src/setupTest.js', './src/mocks/setup.ts'],
		// Exclude files in c8
		coverage: {
			exclude: ['src/setupTest.js', 'src/mocks']
		},
		deps: {
			// Put Svelte component here, e.g., inline: [/svelte-multiselect/, /msw/]
			inline: [/msw/]
		},
		// Exclude playwright tests folder
		exclude: [...configDefaults.exclude, 'tests']
	}
};

export default config;
