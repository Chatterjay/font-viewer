import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import "./style.css";
import App from "./App.vue";
import { injectCssVariables } from "./utils/cssVariables.js";
import { APP_INFO } from "./constants/index.js";


// 导入视图组件
import ChangelogView from "./views/ChangelogView.vue";

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            name: "home",
        },
        {
            path: "/changelog",
            name: "changelog",
            component: ChangelogView,
        },
    ],
});

// 注入CSS变量
injectCssVariables();

// 创建应用实例
const app = createApp(App);

// 使用路由
app.use(router);

// 挂载应用
app.mount("#app");

// 清理本地缓存，确保使用最新版本
const clearCacheOnUpdate = async () => {
    try {
        // 获取上次启动的版本号
        const lastVersion = localStorage.getItem('lastRunVersion');
        const currentVersion = APP_INFO.VERSION;

        console.log(`版本检查: 当前版本=${currentVersion}, 上次运行版本=${lastVersion || '未知'}`);

        // 如果版本不同，清理缓存
        if (lastVersion && lastVersion !== currentVersion) {
            console.log('检测到版本更新，清理缓存...');

            // 清除可能影响更新的缓存项
            localStorage.removeItem('updateInfo');
            localStorage.removeItem('lastUpdateCheck');

            // 强制更新资源
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.update();
                        console.log('已更新Service Worker');
                    }
                }
            } catch (e) {
                console.warn('更新Service Worker失败:', e);
            }

            console.log('缓存清理完成');
        }

        // 保存当前版本作为最后运行版本
        localStorage.setItem('lastRunVersion', currentVersion);
    } catch (error) {
        console.error('清理缓存失败:', error);
    }
};

// 在应用初始化时调用
clearCacheOnUpdate();
