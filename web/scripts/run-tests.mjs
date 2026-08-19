import { execSync, spawnSync } from 'node:child_process';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const webRoot = resolve(__dirname, '..');
const testsDir = join(webRoot, 'src', 'tests');
const distTestsDir = join(webRoot, 'dist-tests');

if (!existsSync(distTestsDir)) {
  mkdirSync(distTestsDir, { recursive: true });
}

console.log('\n======================================================================');
console.log('🧪 LEMMA REPLAY GUARD — 4-TIER AUTOMATED E2E TEST SUITE RUNNER');
console.log('======================================================================\n');

// 1. Find all .test.ts files in src/tests
const testFiles = readdirSync(testsDir).filter(f => f.endsWith('.test.ts')).sort();
console.log(`📦 Discovered ${testFiles.length} test suites:`);
testFiles.forEach(f => console.log(`   • ${f}`));
console.log('');

// 2. Transpile TS test files using esbuild
const esbuildPath = join(webRoot, 'node_modules', '.bin', 'esbuild');
const compiledFiles = [];

for (const file of testFiles) {
  const srcPath = join(testsDir, file);
  const outName = file.replace(/\.ts$/, '.mjs');
  const outPath = join(distTestsDir, outName);

  const cmd = `"${esbuildPath}" "${srcPath}" --bundle --format=esm --platform=node --target=node20 --outfile="${outPath}" --packages=external`;
  execSync(cmd, { cwd: webRoot, stdio: 'pipe' });
  compiledFiles.push({ file, outPath });
}

console.log('⚡ All TypeScript test suites compiled with esbuild (target=Node20).\n');

// 3. Execute test suites individually with timing & status
console.log('----------------------------------------------------------------------');
console.log('RUNNING TEST SUITES');
console.log('----------------------------------------------------------------------');

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
let totalSuites = 0;
let suitesPassed = 0;
let suitesFailed = 0;

const startTime = performance.now();
const suiteResults = [];

for (const { file, outPath } of compiledFiles) {
  const fileStart = performance.now();
  const res = spawnSync('node', ['--test', outPath], {
    cwd: webRoot,
    encoding: 'utf8',
    env: process.env,
  });

  const fileDuration = (performance.now() - fileStart).toFixed(1);
  const isOk = res.status === 0;

  // Extract test counts from output
  const testMatch = res.stdout.match(/# tests (\d+)/);
  const passMatch = res.stdout.match(/# pass (\d+)/);
  const failMatch = res.stdout.match(/# fail (\d+)/);

  const testCount = testMatch ? parseInt(testMatch[1], 10) : 1;
  const passCount = passMatch ? parseInt(passMatch[1], 10) : (isOk ? 1 : 0);
  const failCount = failMatch ? parseInt(failMatch[1], 10) : (isOk ? 0 : 1);

  totalTests += testCount;
  totalPassed += passCount;
  totalFailed += failCount;
  totalSuites += 1;

  if (isOk) {
    suitesPassed += 1;
    console.log(`  ✅ PASS  ${file.padEnd(45)} (${passCount}/${testCount} tests in ${fileDuration}ms)`);
  } else {
    suitesFailed += 1;
    console.log(`  ❌ FAIL  ${file.padEnd(45)} (${passCount}/${testCount} tests in ${fileDuration}ms)`);
    console.log(res.stdout);
    if (res.stderr) console.error(res.stderr);
  }

  suiteResults.push({ file, isOk, testCount, passCount, failCount, duration: fileDuration });
}

const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);

console.log('----------------------------------------------------------------------');
console.log('📊 4-TIER TEST EXECUTION SUMMARY');
console.log('----------------------------------------------------------------------');
console.log(`  • Test Suites:       ${suitesPassed} passed, ${suitesFailed} failed, ${totalSuites} total`);
console.log(`  • Test Assertions:   ${totalPassed} passed, ${totalFailed} failed, ${totalTests} total`);
console.log(`  • Pass Rate:         ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
console.log(`  • Total Duration:    ${totalDuration}s`);
console.log('======================================================================\n');

if (totalFailed > 0 || suitesFailed > 0) {
  process.exit(1);
} else {
  console.log('🏆 ALL 4 TIERS PASSED WITH 100% SUCCESS RATE!\n');
  process.exit(0);
}
