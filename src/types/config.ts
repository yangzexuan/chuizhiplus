/**
 * 配置管理类型定义
 */

import type { Config } from '@/stores/config';

/**
 * 配置项类型
 */
export type ConfigItemType = 'number' | 'boolean' | 'string' | 'select';

/**
 * 配置项元数据
 */
export interface ConfigItem {
    key: keyof Config;
    label: string;
    description: string;
    type: ConfigItemType;
    defaultValue: any;
    min?: number;
    max?: number;
    step?: number;
    options?: Array<{ value: any; label: string }>;
}

/**
 * 配置分类
 */
export interface ConfigCategory {
    id: string;
    name: string;
    description?: string;
    items: ConfigItem[];
}

/**
 * 配置验证结果
 */
export interface ValidationResult {
    valid: boolean;
    errors?: Record<string, string>;
}

/**
 * 配置预设
 */
export interface ConfigPreset {
    id: string;
    name: string;
    description?: string;
    config: Partial<Config>;
}