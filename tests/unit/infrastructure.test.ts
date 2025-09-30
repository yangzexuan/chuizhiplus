/**
 * 基础设施测试 - 验证项目基础配置文件的正确性
 * 
 * 测试目标：
 * 1. package.json存在且包含必需的依赖
 * 2. tsconfig.json存在且配置正确
 * 3. vite.config.ts存在且配置Chrome扩展构建
 * 4. src/manifest.json存在且符合Manifest V3规范
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const projectRoot = resolve(__dirname, '../..');

describe('项目基础设施', () => {
    describe('package.json', () => {
        it('应该存在', () => {
            const packageJsonPath = resolve(projectRoot, 'package.json');
            expect(existsSync(packageJsonPath)).toBe(true);
        });

        it('应该包含必需的依赖', () => {
            const packageJsonPath = resolve(projectRoot, 'package.json');
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

            // 检查核心依赖
            expect(packageJson.dependencies).toHaveProperty('vue');
            expect(packageJson.dependencies).toHaveProperty('pinia');

            // 检查开发依赖
            expect(packageJson.devDependencies).toHaveProperty('vite');
            expect(packageJson.devDependencies).toHaveProperty('typescript');
            expect(packageJson.devDependencies).toHaveProperty('@vitejs/plugin-vue');
            expect(packageJson.devDependencies).toHaveProperty('vitest');
        });

        it('应该包含必需的脚本命令', () => {
            const packageJsonPath = resolve(projectRoot, 'package.json');
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

            expect(packageJson.scripts).toHaveProperty('dev');
            expect(packageJson.scripts).toHaveProperty('build');
            expect(packageJson.scripts).toHaveProperty('test');
            expect(packageJson.scripts).toHaveProperty('type-check');
        });
    });

    describe('tsconfig.json', () => {
        it('应该存在', () => {
            const tsconfigPath = resolve(projectRoot, 'tsconfig.json');
            expect(existsSync(tsconfigPath)).toBe(true);
        });

        it('应该配置正确的编译选项', () => {
            const tsconfigPath = resolve(projectRoot, 'tsconfig.json');
            const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));

            expect(tsconfig.compilerOptions.target).toBeDefined();
            expect(tsconfig.compilerOptions.module).toBeDefined();
            expect(tsconfig.compilerOptions.strict).toBe(true);
            expect(tsconfig.compilerOptions.types).toContain('chrome');
        });
    });

    describe('vite.config.ts', () => {
        it('应该存在', () => {
            const viteConfigPath = resolve(projectRoot, 'vite.config.ts');
            expect(existsSync(viteConfigPath)).toBe(true);
        });
    });

    describe('src/manifest.json', () => {
        it('应该存在', () => {
            const manifestPath = resolve(projectRoot, 'src/manifest.json');
            expect(existsSync(manifestPath)).toBe(true);
        });

        it('应该符合Manifest V3规范', () => {
            const manifestPath = resolve(projectRoot, 'src/manifest.json');
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

            // 验证必需字段
            expect(manifest.manifest_version).toBe(3);
            expect(manifest.name).toBeDefined();
            expect(manifest.version).toBeDefined();
            expect(manifest.description).toBeDefined();
        });

        it('应该声明必需的权限', () => {
            const manifestPath = resolve(projectRoot, 'src/manifest.json');
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

            expect(manifest.permissions).toContain('tabs');
            expect(manifest.permissions).toContain('storage');
            expect(manifest.permissions).toContain('sidePanel');
        });

        it('应该配置Service Worker', () => {
            const manifestPath = resolve(projectRoot, 'src/manifest.json');
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

            expect(manifest.background).toBeDefined();
            expect(manifest.background.service_worker).toBeDefined();
            expect(manifest.background.type).toBe('module');
        });

        it('应该配置Side Panel', () => {
            const manifestPath = resolve(projectRoot, 'src/manifest.json');
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

            expect(manifest.side_panel).toBeDefined();
            expect(manifest.side_panel.default_path).toBeDefined();
        });
    });

    describe('目录结构', () => {
        it('应该存在src目录', () => {
            const srcPath = resolve(projectRoot, 'src');
            expect(existsSync(srcPath)).toBe(true);
        });

        it('应该存在src/background目录', () => {
            const backgroundPath = resolve(projectRoot, 'src/background');
            expect(existsSync(backgroundPath)).toBe(true);
        });

        it('应该存在src/sidepanel目录', () => {
            const sidepanelPath = resolve(projectRoot, 'src/sidepanel');
            expect(existsSync(sidepanelPath)).toBe(true);
        });

        it('应该存在src/components目录', () => {
            const componentsPath = resolve(projectRoot, 'src/components');
            expect(existsSync(componentsPath)).toBe(true);
        });

        it('应该存在src/stores目录', () => {
            const storesPath = resolve(projectRoot, 'src/stores');
            expect(existsSync(storesPath)).toBe(true);
        });

        it('应该存在src/utils目录', () => {
            const utilsPath = resolve(projectRoot, 'src/utils');
            expect(existsSync(utilsPath)).toBe(true);
        });

        it('应该存在src/types目录', () => {
            const typesPath = resolve(projectRoot, 'src/types');
            expect(existsSync(typesPath)).toBe(true);
        });
    });
});
