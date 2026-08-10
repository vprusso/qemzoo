// MathJax is configured with startup.typeset disabled, so nothing is typeset
// until a page script asks for it. The page scripts render their content from
// local JSON, which almost always resolves before the MathJax bundle finishes
// loading from the CDN, so checking for MathJax.typesetPromise at render time
// silently does nothing and the page shows raw LaTeX. Wait for startup instead:
// MathJax replaces the inline config object with the real one and only then
// exposes startup.promise.
function typesetMath(retries = 200) {
  const mj = window.MathJax;
  if (mj && mj.startup && mj.startup.promise) {
    mj.startup.promise.then(() => mj.typesetPromise()).catch(() => {});
  } else if (retries > 0) {
    setTimeout(() => typesetMath(retries - 1), 50);
  }
}
