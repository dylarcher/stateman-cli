import esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';

// Read package.json to get the package name for UMD global name (optional, but good practice)
let packageName = 'StateManLib'; // Default global name
try {
  const pkgJson = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
  // Convert package name to a suitable global variable name
  // e.g., @scope/my-package -> MyPackage or my-package -> MyPackage
  if (pkgJson.name) {
    packageName = pkgJson.name
      .replace(/^@.*\//, '') // Remove scope if present
      .replace(/-(\w)/g, (match, letter) => letter.toUpperCase()) // a-b -> aB
      .replace(/^(\w)/, (match, letter) => letter.toUpperCase()); // capitalize first letter
  }
} catch (e) {
  console.warn("Could not read package.json to determine UMD global name. Using default 'StateManLib'.", e);
}


const entryPoint = 'src/index.js';
const outDir = 'dist';

// Common esbuild options
const commonOptions = {
  entryPoints: [entryPoint],
  bundle: true,
  sourcemap: true,
  // In a real library, you might externalize peer dependencies like React, Vue, etc.
  // Here, redux, immutable, vanjs-core are treated as internal parts of the lib's functionality.
  // If they were meant to be peer dependencies, you'd list them in 'external'.
  external: ['immutable', 'redux', 'vanjs-core'],
  platform: 'neutral', // 'neutral' is good for libraries that can run in browser or node
  // Target can be specified, e.g., 'es2020'
};

async function build() {
  try {
    // Ensure output directory exists
    await fs.mkdir(outDir, { recursive: true });

    // ESM build
    await esbuild.build({
      ...commonOptions,
      format: 'esm',
      outfile: path.join(outDir, 'index.esm.js'),
    });
    console.log('ESM build complete: dist/index.esm.js');

    // CJS build
    await esbuild.build({
      ...commonOptions,
      format: 'cjs',
      outfile: path.join(outDir, 'index.cjs.js'),
    });
    console.log('CJS build complete: dist/index.cjs.js');

    // UMD build (minified)
    await esbuild.build({
      ...commonOptions,
      format: 'iife', // esbuild uses 'iife' for UMD-like browser bundles
      globalName: packageName, // Name for the global variable when used in a browser
      outfile: path.join(outDir, 'index.umd.js'),
      minify: true,
    });
    console.log(`UMD build complete (minified): dist/index.umd.js (global name: ${packageName})`);

    console.log('\nBuild process finished successfully!');

  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
