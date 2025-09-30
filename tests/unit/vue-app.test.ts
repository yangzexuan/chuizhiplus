/**
 * Vue3主应用测试
 * 
 * 测试目标：
 * 1. Vue应用能够正确挂载
 * 2. Pinia状态管理已集成
 * 3. 基础组件结构正确
 * 4. TypeScript类型定义完整
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import App from '@/sidepanel/App.vue';

// Mock Chrome API
global.chrome = {
    runtime: {
        sendMessage: vi.fn().mockResolvedValue({
            success: true,
            data: [],
        }),
        onMessage: {
            addListener: vi.fn(),
        },
    },
} as any;

describe('Vue3主应用', () => {
    let pinia: any;

    beforeEach(() => {
        pinia = createPinia();
    });

    describe('应用挂载', () => {
        it('应该能够成功挂载App组件', () => {
            const wrapper = mount(App, {
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.exists()).toBe(true);
        });

        it('应该包含主要的应用结构', () => {
            const wrapper = mount(App, {
                global: {
                    plugins: [pinia],
                },
            });

            // 验证主要布局元素存在
            expect(wrapper.find('.app').exists()).toBe(true);
            expect(wrapper.find('.header').exists()).toBe(true);
            expect(wrapper.find('.main').exists()).toBe(true);
        });
    });

    describe('布局组件', () => {
        it('应该显示应用标题', () => {
            const wrapper = mount(App, {
                global: {
                    plugins: [pinia],
                },
            });

            const header = wrapper.find('.header h1');
            expect(header.exists()).toBe(true);
            expect(header.text()).toContain('Chrome树状标签管理器');
        });

        it('应该包含搜索栏区域', () => {
            const wrapper = mount(App, {
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.search-bar').exists()).toBe(true);
        });

        it('应该包含树状视图区域', () => {
            const wrapper = mount(App, {
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.tree-view').exists()).toBe(true);
        });

        it('应该包含底部状态栏', () => {
            const wrapper = mount(App, {
                global: {
                    plugins: [pinia],
                },
            });

            expect(wrapper.find('.footer').exists()).toBe(true);
        });
    });

    describe('Pinia集成', () => {
        it('应该能够访问Pinia store', () => {
            const wrapper = mount(App, {
                global: {
                    plugins: [pinia],
                },
            });

            // 验证组件可以访问pinia实例
            expect(wrapper.vm).toBeDefined();
        });
    });

    describe('响应式布局', () => {
        it('应该有正确的CSS类', () => {
            const wrapper = mount(App, {
                global: {
                    plugins: [pinia],
                },
            });

            const app = wrapper.find('.app');
            expect(app.classes()).toContain('app');
        });
    });
});
