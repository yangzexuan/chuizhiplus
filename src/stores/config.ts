/**
 * 配置状态管理 Store
 * 
 * 职责：
 * - 管理用户配置选项
 * - 提供配置的读写接口
 * - 持久化配置到 Chrome Storage
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ConfigCategory, ConfigItem, ConfigPreset, ValidationResult } from '@/types/config';

/**
 * 配置接口
 */
export interface Config {
    panelWidth: number;
    panelVisible: boolean;
    theme: 'light' | 'dark' | 'auto';
    closeConfirmThreshold: number;
    enableCloseConfirmation: boolean;
    protectPinnedTabs: boolean;
    undoTimeWindow: number; // 撤销时间窗口（毫秒）
}

export const useConfigStore = defineStore('config', () => {
    // ==================== State ====================

    /**
     * 配置对象
     */
    const config = ref<Config>({
        panelWidth: 300,
        panelVisible: true,
        theme: 'auto',
        closeConfirmThreshold: 3,
        enableCloseConfirmation: true,
        protectPinnedTabs: true,
        undoTimeWindow: 5000, // 5秒撤销时间窗口
    });

    /**
     * 关闭标签页确认阈值（便捷访问）
     */
    const closeConfirmThreshold = computed(() => config.value.closeConfirmThreshold);

    /**
     * 是否启用关闭确认（便捷访问）
     */
    const enableCloseConfirmation = computed(() => config.value.enableCloseConfirmation);

    /**
     * 是否保护固定的标签页（便捷访问）
     */
    const protectPinnedTabs = computed(() => config.value.protectPinnedTabs);

    // ==================== Actions ====================

    /**
     * 更新配置
     */
    async function updateConfig(updates: Partial<Config>): Promise<void> {
        config.value = { ...config.value, ...updates };
        await saveConfig();
    }

    /**
     * 从 Chrome Storage 加载配置
     */
    async function loadConfig(): Promise<void> {
        try {
            const result = await chrome.storage.local.get('app-config');
            const savedConfig = result['app-config'];

            if (savedConfig) {
                config.value = { ...config.value, ...savedConfig };
            }

            console.log('配置已加载');
        } catch (error) {
            console.error('加载配置失败:', error);
        }
    }

    /**
     * 保存配置到 Chrome Storage
     */
    async function saveConfig(): Promise<void> {
        try {
            await chrome.storage.local.set({
                'app-config': config.value,
            });

            console.log('配置已保存');
        } catch (error) {
            console.error('保存配置失败:', error);
        }
    }

    /**
     * 重置配置到默认值
     */
    async function resetConfig(): Promise<void> {
        config.value = {
            panelWidth: 300,
            panelVisible: true,
            theme: 'auto',
            closeConfirmThreshold: 3,
            enableCloseConfirmation: true,
            protectPinnedTabs: true,
            undoTimeWindow: 5000,
        };
        await saveConfig();
    }

    // ==================== 配置管理功能 ====================

    /**
     * 获取配置分类
     */
    function getConfigCategories(): ConfigCategory[] {
        return [
            {
                id: 'basic',
                name: '基础设置',
                description: '面板显示和主题设置',
                items: [
                    {
                        key: 'panelWidth',
                        label: '面板宽度',
                        description: '侧边面板的宽度（像素）',
                        type: 'number',
                        defaultValue: 300,
                        min: 200,
                        max: 600,
                        step: 10,
                    },
                    {
                        key: 'panelVisible',
                        label: '面板可见',
                        description: '是否默认显示侧边面板',
                        type: 'boolean',
                        defaultValue: true,
                    },
                ],
            },
            {
                id: 'display',
                name: '显示设置',
                description: '主题和外观设置',
                items: [
                    {
                        key: 'theme',
                        label: '主题',
                        description: '界面主题配色',
                        type: 'select',
                        defaultValue: 'auto',
                        options: [
                            { value: 'light', label: '浅色' },
                            { value: 'dark', label: '深色' },
                            { value: 'auto', label: '跟随系统' },
                        ],
                    },
                ],
            },
            {
                id: 'behavior',
                name: '行为设置',
                description: '关闭行为和保护规则',
                items: [
                    {
                        key: 'closeConfirmThreshold',
                        label: '关闭确认阈值',
                        description: '关闭标签页数量超过此值时显示确认对话框',
                        type: 'number',
                        defaultValue: 3,
                        min: 1,
                        max: 20,
                        step: 1,
                    },
                    {
                        key: 'enableCloseConfirmation',
                        label: '启用关闭确认',
                        description: '关闭父节点时是否显示确认对话框',
                        type: 'boolean',
                        defaultValue: true,
                    },
                    {
                        key: 'protectPinnedTabs',
                        label: '保护固定标签页',
                        description: '是否保护固定的标签页不被关闭',
                        type: 'boolean',
                        defaultValue: true,
                    },
                    {
                        key: 'undoTimeWindow',
                        label: '撤销时间窗口',
                        description: '关闭标签页后可以撤销的时间（毫秒）',
                        type: 'number',
                        defaultValue: 5000,
                        min: 1000,
                        max: 30000,
                        step: 1000,
                    },
                ],
            },
        ];
    }

    /**
     * 验证配置
     */
    function validateConfig(updates: Partial<Config>): ValidationResult {
        const errors: Record<string, string> = {};
        const categories = getConfigCategories();
        const allItems = categories.flatMap(c => c.items);

        for (const [key, value] of Object.entries(updates)) {
            const item = allItems.find(i => i.key === key);

            if (!item) {
                errors[key] = '无效的配置键';
                continue;
            }

            if (item.type === 'number') {
                if (typeof value !== 'number') {
                    errors[key] = '必须是数字';
                } else if (item.min !== undefined && value < item.min) {
                    errors[key] = `不能小于 ${item.min}`;
                } else if (item.max !== undefined && value > item.max) {
                    errors[key] = `不能大于 ${item.max}`;
                }
            } else if (item.type === 'boolean') {
                if (typeof value !== 'boolean') {
                    errors[key] = '必须是布尔值';
                }
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors: Object.keys(errors).length > 0 ? errors : undefined,
        };
    }

    /**
     * 获取配置项的值
     */
    function getConfigValue<K extends keyof Config>(key: K): Config[K] {
        return config.value[key];
    }

    /**
     * 设置配置项的值
     */
    async function setConfigValue<K extends keyof Config>(key: K, value: Config[K]): Promise<void> {
        const validation = validateConfig({ [key]: value } as Partial<Config>);
        
        if (!validation.valid) {
            throw new Error(validation.errors?.[key] || '配置验证失败');
        }

        config.value[key] = value;
        await saveConfig();
    }

    /**
     * 获取配置预设列表
     */
    function getPresets(): ConfigPreset[] {
        return [
            {
                id: 'default',
                name: '默认',
                description: '推荐的默认设置',
                config: {
                    panelWidth: 300,
                    panelVisible: true,
                    theme: 'auto',
                    closeConfirmThreshold: 3,
                    enableCloseConfirmation: true,
                    protectPinnedTabs: true,
                    undoTimeWindow: 5000,
                },
            },
            {
                id: 'compact',
                name: '紧凑',
                description: '节省空间的紧凑布局',
                config: {
                    panelWidth: 250,
                    panelVisible: true,
                    theme: 'auto',
                    closeConfirmThreshold: 5,
                    enableCloseConfirmation: false,
                    protectPinnedTabs: true,
                    undoTimeWindow: 3000,
                },
            },
            {
                id: 'safe',
                name: '安全',
                description: '更多保护和确认',
                config: {
                    panelWidth: 350,
                    panelVisible: true,
                    theme: 'auto',
                    closeConfirmThreshold: 1,
                    enableCloseConfirmation: true,
                    protectPinnedTabs: true,
                    undoTimeWindow: 10000,
                },
            },
        ];
    }

    /**
     * 应用配置预设
     */
    async function applyPreset(presetId: string): Promise<void> {
        const presets = getPresets();
        const preset = presets.find(p => p.id === presetId);

        if (!preset) {
            throw new Error(`未找到预设: ${presetId}`);
        }

        await updateConfig(preset.config);
    }

    /**
     * 获取配置项描述
     */
    function getConfigDescription(key: keyof Config): string {
        const categories = getConfigCategories();
        const allItems = categories.flatMap(c => c.items);
        const item = allItems.find(i => i.key === key);

        return item?.description || '';
    }

    // ==================== Return ====================

    return {
        // State
        config,
        closeConfirmThreshold,
        enableCloseConfirmation,
        protectPinnedTabs,

        // Actions
        updateConfig,
        loadConfig,
        saveConfig,
        resetConfig,

        // Configuration Management
        getConfigCategories,
        validateConfig,
        getConfigValue,
        setConfigValue,
        getPresets,
        applyPreset,
        getConfigDescription,
    };
});