// JS transpilation target for vite/esbuild.
// Replaces fe-build's babel + browserslist setup; modern evergreen browsers only.
// Override via .febuild: { esbuild: { target: ['es2018', 'safari14'] } }
export default {
  target: 'es2020',
};
