/**
 * 配置状态管理 Store
 * 
 * 职责：
 * - 管理用户配置和首选项
 * - 持久化配置到Chrome Storage
 * - 提供配置的读取和更新接口
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ExtensionConfig, ConfigUpdate } from '@/types';
import { DEFAULT_CONFIG } from '@/types/config';

const STORAGE_KEY = 'extension-config';

export const useConfigStore = defineStore('config', () => {
    // ==================== State ====================

    /**
     * 扩展配置
     */
    const config = ref<ExtensionConfig>({ ...DEFAULT_CONFIG });

    /**
     * 配置是否已加载
     */
    const isLoaded = ref(false);

    // ==================== Actions ====================

    /**
     * 从Chrome Storage加载配置
     */
    async function loadConfig(): Promise<void> {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEY);
            if (result[STORAGE_KEY]) {
                // 合并存储的配置和默认配置
                config.value = {
                    ...DEFAULT_CONFIG,
                    ...result[STORAGE_KEY],
                };
            }
            isLoaded.value = true;
        } catch (error) {
            console.error('加载配置失败:', error);
            // 使用默认配置
            config.value = { ...DEFAULT_CONFIG };
            isLoaded.value = true;
        }
    }

    /**
     * 保存配置到Chrome Storage
     */
    async function saveConfig(): Promise<void> {
        try {
            await chrome.storage.local.set({
                [STORAGE_KEY]: config.value,
            });
        } catch (error) {
            console.error('保存配置失败:', error);
            throw error;
        }
    }

    /**
     * 更新配置
     */
    async function updateConfig(updates: ConfigUpdate): Promise<void> {
        // 更新配置
        Object.assign(config.value, updates);

        // 保存到存储
        await saveConfig();
    }

    /**
     * 重置配置为默认值
     */
    async function resetConfig(): Promise<void> {
        config.value = { ...DEFAULT_CONFIG };
        await saveConfig();
    }

    /**
     * 导出配置为JSON
     */
    function exportConfig(): string {
        return JSON.stringify(config.value, null, 2);
    }

    /**
     * 从JSON导入配置
     */
    async function importConfig(json: string): Promise<void> {
        try {
            const imported = JSON.parse(json);

            // 验证配置格式
            if (typeof imported !== 'object' || imported === null) {
                throw new Error('无效的配置格式');
            }

            // 合并默认配置确保所有字段存在
            config.value = {
                ...DEFAULT_CONFIG,
                ...imported,
            };

            await saveConfig();
        } catch (error) {
            console.error('导入配置失败:', error);
            throw error;
        }
    }

    // ==================== Return ====================

    return {
        // State
        config,
        isLoaded,

        // Actions
        loadConfig,
        saveConfig,
        updateConfig,
        resetConfig,
        exportConfig,
        importConfig,
    };
});
