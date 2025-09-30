/**
 * 配置管理系统测试
 * 
 * 测试目标：
 * 1. 实现配置页面的分类导航和设置选项界面
 * 2. 建立基础设置面板行为和显示选项配置
 * 3. 创建关闭行为配置的阈值和保护规则设置
 * 4. 添加拖拽和分组选项的灵敏度和规则配置
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useConfigStore } from '@/stores/config';

// Mock Chrome API
global.chrome = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
} as any;

describe('配置管理系统', () => {
  let configStore: ReturnType<typeof useConfigStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    configStore = useConfigStore();
    vi.clearAllMocks();
  });

  describe('配置分类', () => {
    it('应该有getConfigCategories方法', () => {
      expect(typeof configStore.getConfigCategories).toBe('function');
    });

    it('getConfigCategories应该返回配置分类列表', () => {
      const categories = configStore.getConfigCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('每个分类应该包含id、名称和配置项', () => {
      const categories = configStore.getConfigCategories();
      const category = categories[0];

      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('items');
      expect(Array.isArray(category.items)).toBe(true);
    });

    it('应该有基础设置分类', () => {
      const categories = configStore.getConfigCategories();
      const basicCategory = categories.find(c => c.id === 'basic');

      expect(basicCategory).toBeDefined();
      expect(basicCategory?.name).toBe('基础设置');
    });

    it('应该有行为设置分类', () => {
      const categories = configStore.getConfigCategories();
      const behaviorCategory = categories.find(c => c.id === 'behavior');

      expect(behaviorCategory).toBeDefined();
      expect(behaviorCategory?.name).toBe('行为设置');
    });

    it('应该有显示设置分类', () => {
      const categories = configStore.getConfigCategories();
      const displayCategory = categories.find(c => c.id === 'display');

      expect(displayCategory).toBeDefined();
      expect(displayCategory?.name).toBe('显示设置');
    });
  });

  describe('配置项元数据', () => {
    it('每个配置项应该包含完整的元数据', () => {
      const categories = configStore.getConfigCategories();
      const firstCategory = categories[0];
      const firstItem = firstCategory.items[0];

      expect(firstItem).toHaveProperty('key');
      expect(firstItem).toHaveProperty('label');
      expect(firstItem).toHaveProperty('type');
      expect(firstItem).toHaveProperty('defaultValue');
    });

    it('配置项应该支持不同的类型', () => {
      const categories = configStore.getConfigCategories();
      const allItems = categories.flatMap(c => c.items);

      const types = new Set(allItems.map(item => item.type));
      
      expect(types.has('number')).toBe(true);
      expect(types.has('boolean')).toBe(true);
    });

    it('数字类型的配置项应该有范围限制', () => {
      const categories = configStore.getConfigCategories();
      const allItems = categories.flatMap(c => c.items);
      const numberItem = allItems.find(item => item.type === 'number');

      expect(numberItem).toBeDefined();
      expect(numberItem).toHaveProperty('min');
      expect(numberItem).toHaveProperty('max');
    });
  });

  describe('配置验证', () => {
    it('应该有validateConfig方法', () => {
      expect(typeof configStore.validateConfig).toBe('function');
    });

    it('validateConfig应该验证配置值的有效性', () => {
      const validConfig = {
        panelWidth: 300,
        closeConfirmThreshold: 3,
      };

      const result = configStore.validateConfig(validConfig);
      expect(result.valid).toBe(true);
    });

    it('validateConfig应该拒绝超出范围的数值', () => {
      const invalidConfig = {
        panelWidth: 50, // 小于最小值
      };

      const result = configStore.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('validateConfig应该拒绝无效的配置键', () => {
      const invalidConfig = {
        invalidKey: 'value',
      };

      const result = configStore.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
    });
  });

  describe('配置项获取和设置', () => {
    it('应该有getConfigValue方法', () => {
      expect(typeof configStore.getConfigValue).toBe('function');
    });

    it('应该有setConfigValue方法', () => {
      expect(typeof configStore.setConfigValue).toBe('function');
    });

    it('getConfigValue应该返回指定配置项的值', () => {
      const value = configStore.getConfigValue('panelWidth');
      expect(value).toBe(300);
    });

    it('setConfigValue应该更新指定配置项的值', async () => {
      await configStore.setConfigValue('panelWidth', 400);
      expect(configStore.getConfigValue('panelWidth')).toBe(400);
    });

    it('setConfigValue应该验证配置值', async () => {
      await expect(
        configStore.setConfigValue('panelWidth', 50)
      ).rejects.toThrow();
    });
  });

  describe('配置预设', () => {
    it('应该有getPresets方法', () => {
      expect(typeof configStore.getPresets).toBe('function');
    });

    it('应该有applyPreset方法', () => {
      expect(typeof configStore.applyPreset).toBe('function');
    });

    it('getPresets应该返回预设配置列表', () => {
      const presets = configStore.getPresets();
      
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
    });

    it('每个预设应该包含id、名称和配置', () => {
      const presets = configStore.getPresets();
      const preset = presets[0];

      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('config');
    });

    it('applyPreset应该应用预设配置', async () => {
      const presets = configStore.getPresets();
      const preset = presets[0];

      await configStore.applyPreset(preset.id);

      // 验证配置已更新
      expect(configStore.config.panelWidth).toBe(preset.config.panelWidth);
    });

    it('应该有默认预设', () => {
      const presets = configStore.getPresets();
      const defaultPreset = presets.find(p => p.id === 'default');

      expect(defaultPreset).toBeDefined();
      expect(defaultPreset?.name).toBe('默认');
    });

    it('应该有紧凑预设', () => {
      const presets = configStore.getPresets();
      const compactPreset = presets.find(p => p.id === 'compact');

      expect(compactPreset).toBeDefined();
      expect(compactPreset?.name).toBe('紧凑');
    });
  });

  describe('配置描述和帮助', () => {
    it('每个配置项应该有描述', () => {
      const categories = configStore.getConfigCategories();
      const allItems = categories.flatMap(c => c.items);

      allItems.forEach(item => {
        expect(item).toHaveProperty('description');
        expect(typeof item.description).toBe('string');
        expect(item.description.length).toBeGreaterThan(0);
      });
    });

    it('应该有getConfigDescription方法', () => {
      expect(typeof configStore.getConfigDescription).toBe('function');
    });

    it('getConfigDescription应该返回配置项的描述', () => {
      const description = configStore.getConfigDescription('panelWidth');
      
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });
});
