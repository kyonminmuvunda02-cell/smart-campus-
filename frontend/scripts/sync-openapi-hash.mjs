import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const openapiPath = path.resolve('openapi.json');
const hashPath = path.resolve('openapi.hash');

if (fs.existsSync(openapiPath)) {
  const fileBuffer = fs.readFileSync(openapiPath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const hex = hashSum.digest('hex');
  fs.writeFileSync(hashPath, hex);
  console.log(`OpenAPI hash synced: ${hex.substring(0, 8)}...`);
} else {
  console.warn('openapi.json not found, skipping hash sync.');
}
