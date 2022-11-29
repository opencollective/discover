import fs from 'fs';
import { join } from 'path';

const dataDirectory = join(process.cwd(), '_dump');

export function getPostSlugs() {
  return fs.readdirSync(dataDirectory);
}

export function getDataDump(hostSlug: string, tag: string, period: string) {
  const files = fs.readdirSync(join(dataDirectory, hostSlug));
  const fileName = `${tag}-${period}.json`;
  const file = files.find(file => file === fileName);
  if (file) {
    const fullPath = join(dataDirectory, hostSlug, `${tag}-${period}.json`);
    const json = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(json);
    return data;
  }
  return null;
}
