import { describe, it, expect } from 'vitest';
import manifest from '../../src/manifest.json';

describe('Manifest V3 Configuration', () => {
  it('should have correct manifest version', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('should have required permissions', () => {
    const requiredPermissions = ['tabs', 'activeTab', 'storage', 'sidePanel'];
    requiredPermissions.forEach(permission => {
      expect(manifest.permissions).toContain(permission);
    });
  });

  it('should define service worker background script', () => {
    expect(manifest.background).toBeDefined();
    expect(manifest.background.service_worker).toBe('background/service-worker.js');
  });

  it('should define side panel configuration', () => {
    expect(manifest.side_panel).toBeDefined();
    expect(manifest.side_panel.default_path).toBe('sidepanel/index.html');
  });

  it('should have valid extension metadata', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.description).toBeTruthy();
  });
});