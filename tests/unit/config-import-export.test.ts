/**
 * 配置导入导出功能测试
 * 
 * 测试目标：
 * 1. 建立配置文件的完整导入导出功能
 * 2. 实现配置更改的实时生效和预览效果
 * 3. 创建配置验证和错误处理机制
 * 4. 添加配置重置和默认值恢复功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useConfigStore, type Config } from '@/stores/config';

// Mock Chrome API
global.chrome = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
} as any;

describe('配置导入导出功能', () => {
  let configStore: ReturnType<typeof useConfigStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    configStore = useConfigStore();
    vi.clearAllMocks();
  });

  describe('配置导出', () => {
    it('应该有exportConfig方法', () => {
      expect(typeof configStore.exportConfig).toBe('function');
    });

    it('exportConfig应该返回JSON字符串', () => {
      const exported = configStore.exportConfig();

      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('导出的配置应该包含所有配置项', () => {
      const exported = configStore.exportConfig();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('panelWidth');
      expect(parsed).toHaveProperty('panelVisible');
      expect(parsed).toHaveProperty('theme');
      expect(parsed).toHaveProperty('closeConfirmThreshold');
      expect(parsed).toHaveProperty('enableCloseConfirmation');
      expect(parsed).toHaveProperty('protectPinnedTabs');
      expect(parsed).toHaveProperty('undoTimeWindow');
    });

    it('导出的配置应该包含版本信息', () => {
      const exported = configStore.exportConfig();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('version');
      expect(typeof parsed.version).toBe('string');
    });

    it('导出的配置应该包含时间戳', () => {
      const exported = configStore.exportConfig();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('exportedAt');
      expect(typeof parsed.exportedAt).toBe('number');
    });
  });

  describe('配置导入', () => {
    it('应该有importConfig方法', () => {
      expect(typeof configStore.importConfig).toBe('function');
    });

    it('importConfig应该接受JSON字符串', async () => {
      const configData = JSON.stringify({
        version: '1.0',
        exportedAt: Date.now(),
        panelWidth: 400,
        closeConfirmThreshold: 5,
      });

      await expect(
        configStore.importConfig(configData)
      ).resolves.not.toThrow();
    });

    it('importConfig应该更新配置值', async () => {
      const configData = JSON.stringify({
        version: '1.0',
        exportedAt: Date.now(),
        panelWidth: 400,
        closeConfirmThreshold: 5,
      });

      await configStore.importConfig(configData);

      expect(configStore.config.panelWidth).toBe(400);
      expect(configStore.config.closeConfirmThreshold).toBe(5);
    });

    it('importConfig应该验证配置格式', async () => {
      const invalidData = 'invalid json';

      await expect(
        configStore.importConfig(invalidData)
      ).rejects.toThrow();
    });

    it('importConfig应该验证配置值', async () => {
      const invalidConfig = JSON.stringify({
        version: '1.0',
        exportedAt: Date.now(),
        panelWidth: 50, // 小于最小值
      });

      await expect(
        configStore.importConfig(invalidConfig)
      ).rejects.toThrow();
    });

    it('importConfig应该忽略无效的配置键', async () => {
      const configData = JSON.stringify({
        version: '1.0',
        exportedAt: Date.now(),
        panelWidth: 400,
        invalidKey: 'value',
      });

      await configStore.importConfig(configData);

      expect(configStore.config.panelWidth).toBe(400);
      expect((configStore.config as any).invalidKey).toBeUndefined();
    });
  });

  describe('配置文件下载', () => {
    it('应该有downloadConfig方法', () => {
      expect(typeof configStore.downloadConfig).toBe('function');
    });

    it('downloadConfig应该创建Blob', () => {
      const blob = configStore.downloadConfig();

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('下载的Blob应该包含有效的JSON', async () => {
      const blob = configStore.downloadConfig();
      
      // 在测试环境中读取 Blob 内容
      const reader = new FileReader();
      const text = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });

      expect(() => JSON.parse(text)).not.toThrow();
    });
  });

  describe('配置文件上传', () => {
    it('应该有uploadConfig方法', () => {
      expect(typeof configStore.uploadConfig).toBe('function');
    });

    it('uploadConfig应该接受File对象', async () => {
      const configData = {
        version: '1.0',
        exportedAt: Date.now(),
        panelWidth: 400,
      };

      const blob = new Blob([JSON.stringify(configData)], { type: 'application/json' });
      const file = new File([blob], 'config.json', { type: 'application/json' });

      await expect(
        configStore.uploadConfig(file)
      ).resolves.not.toThrow();
    });

    it('uploadConfig应该更新配置', async () => {
      const configData = {
        version: '1.0',
        exportedAt: Date.now(),
        panelWidth: 450,
        closeConfirmThreshold: 7,
      };

      const blob = new Blob([JSON.stringify(configData)], { type: 'application/json' });
      const file = new File([blob], 'config.json', { type: 'application/json' });

      await configStore.uploadConfig(file);

      expect(configStore.config.panelWidth).toBe(450);
      expect(configStore.config.closeConfirmThreshold).toBe(7);
    });

    it('uploadConfig应该验证文件内容', async () => {
      const blob = new Blob(['invalid json'], { type: 'application/json' });
      const file = new File([blob], 'config.json', { type: 'application/json' });

      await expect(
        configStore.uploadConfig(file)
      ).rejects.toThrow();
    });
  });

  describe('配置重置', () => {
    it('重置配置应该恢复所有默认值', async () => {
      // 修改配置
      await configStore.updateConfig({
        panelWidth: 500,
        closeConfirmThreshold: 10,
      });

      // 重置
      await configStore.resetConfig();

      // 验证已恢复默认值
      expect(configStore.config.panelWidth).toBe(300);
      expect(configStore.config.closeConfirmThreshold).toBe(3);
    });
  });

  describe('配置实时预览', () => {
    it('应该有previewConfig方法', () => {
      expect(typeof configStore.previewConfig).toBe('function');
    });

    it('应该有applyPreview方法', () => {
      expect(typeof configStore.applyPreview).toBe('function');
    });

    it('应该有cancelPreview方法', () => {
      expect(typeof configStore.cancelPreview).toBe('function');
    });

    it('previewConfig应该临时应用配置而不保存', () => {
      const originalWidth = configStore.config.panelWidth;

      configStore.previewConfig({ panelWidth: 500 });

      expect(configStore.config.panelWidth).toBe(500);

      // 验证没有调用保存
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('cancelPreview应该恢复原始配置', () => {
      const originalWidth = configStore.config.panelWidth;

      configStore.previewConfig({ panelWidth: 500 });
      expect(configStore.config.panelWidth).toBe(500);

      configStore.cancelPreview();
      expect(configStore.config.panelWidth).toBe(originalWidth);
    });

    it('applyPreview应该永久应用预览的配置', async () => {
      configStore.previewConfig({ panelWidth: 500 });
      
      await configStore.applyPreview();

      expect(configStore.config.panelWidth).toBe(500);
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });
});
