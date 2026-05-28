import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('patient app Vite config', () => {
  it('proxies API calls to the local backend during development', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.js'), 'utf8');

    expect(config).toContain("'/api'");
    expect(config).toContain("process.env.VITE_API_TARGET || 'http://localhost:3001'");
    expect(config).toContain('target: apiTarget');
    expect(config).toContain('changeOrigin: true');
  });
});
