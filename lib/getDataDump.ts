import fs from 'fs';
import { join } from 'path';

const dataDirectory = join(process.cwd(), '_dump');

export function getDump(hostSlug: string) {
  try {
    const files = fs.readdirSync(dataDirectory);
    const fileName = `${hostSlug}.json`;
    const file = files.find(file => file === fileName);
    if (file) {
      const fullPath = join(dataDirectory, `${hostSlug}.json`);
      const json = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(json);
      return data;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err.message);
  }

  return null;
}
