const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Possible locations to look for .env.test or .env (in order)
const candidates = [
  path.resolve(__dirname, '.env.test'), // backend/tests/.env.test
  path.resolve(__dirname, '..', '.env.test'), // backend/.env.test
  path.resolve(__dirname, '..', '..', '.env.test'), // repository root .env.test
  path.resolve(__dirname, '..', '..', '.env'), // repository root .env
];

let loaded = null;
for (const p of candidates) {
  try {
    if (fs.existsSync(p)) {
      const res = dotenv.config({ path: p });
      if (res.error) throw res.error;
      loaded = p;
      // stop at first successful load
      break;
    }
  } catch (err) {
    // continue to next candidate
  }
}

if (loaded) {
  // eslint-disable-next-line no-console
  console.log(`✅ Loaded environment from ${loaded}`);
} else {
  // eslint-disable-next-line no-console
  console.warn('⚠️  No .env.test or .env found in expected locations; continuing without loading file.');
}
