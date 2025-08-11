import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	server: {
		host: 'localhost',
		port: 5173,
		https: {
			key: path.resolve(__dirname, 'self.key'),
      		cert: path.resolve(__dirname, 'self.crt'),
		}
	  },
	plugins: [sveltekit()]
});
