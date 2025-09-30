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
        };
        await saveConfig();
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
    };
});