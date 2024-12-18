// @ts-check
import { defineConfig } from 'astro/config';
import slideToolbarIntegration from './toolbar/slideTools-server.js';
import react from '@astrojs/react';

export default defineConfig({
	integrations: [slideToolbarIntegration,react()],
});
