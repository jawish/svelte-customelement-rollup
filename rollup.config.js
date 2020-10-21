import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';

const name = pkg.name
	.replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
	.replace(/^\w/, m => m.toUpperCase())
	.replace(/-\w/g, m => m[1].toUpperCase());

export default {
	input: 'src/index.js',
	output: [
		{ file: pkg.module, 'format': 'es' },
		{ file: pkg.main, 'format': 'umd', name }
	],
	plugins: [
		svelte({ customElement: true, include: /\.wc\.svelte$/,
			css: css => { css.write('dist/bundle.css'); }
		}),
		svelte({ customElement: false, exclude: /\.wc\.svelte$/,
			css: css => { css.write('dist/bundle.css'); }
		}),
		resolve()
	]
};
