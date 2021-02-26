export default {
	input: './src/index.js',
	external: name => /^[a-z]/.test(name),
	output: { file: 'dist/index.cjs.js', format: 'cjs', sourcemap: true, interop: false, preferConst: true },
};
