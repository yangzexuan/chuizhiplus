import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import path from 'path';

describe('Project Structure', () => {
  const srcDir = path.resolve(__dirname, '../../src');

  it('should have required source directories', () => {
    expect(existsSync(path.join(srcDir, 'background'))).toBe(true);
    expect(existsSync(path.join(srcDir, 'sidepanel'))).toBe(true);
    expect(existsSync(path.join(srcDir, 'components'))).toBe(true);
    expect(existsSync(path.join(srcDir, 'stores'))).toBe(true);
    expect(existsSync(path.join(srcDir, 'utils'))).toBe(true);
    expect(existsSync(path.join(srcDir, 'types'))).toBe(true);
  });

  it('should have required configuration files', () => {
    const rootDir = path.resolve(__dirname, '../..');
    expect(existsSync(path.join(rootDir, 'package.json'))).toBe(true);
    expect(existsSync(path.join(rootDir, 'tsconfig.json'))).toBe(true);
    expect(existsSync(path.join(rootDir, 'vite.config.ts'))).toBe(true);
  });

  it('should have required source files', () => {
    expect(existsSync(path.join(srcDir, 'manifest.json'))).toBe(true);
    expect(existsSync(path.join(srcDir, 'sidepanel', 'index.html'))).toBe(true);
    expect(existsSync(path.join(srcDir, 'sidepanel', 'main.ts'))).toBe(true);
    expect(existsSync(path.join(srcDir, 'background', 'service-worker.ts'))).toBe(true);
  });
});