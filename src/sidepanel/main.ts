import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

// 创建Vue应用实例
const app = createApp(App);

// 添加Pinia状态管理
const pinia = createPinia();
app.use(pinia);

// 挂载应用
app.mount('#app');

console.log('Chrome Tree Tab Manager - Vue App loaded');