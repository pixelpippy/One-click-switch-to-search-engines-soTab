// ==UserScript==
// @name                soTab - Search Engine Switcher (Fixed)
// @name:zh-CN          搜索引擎一键切换 soTab 修复版
// @description         在常用的搜索引擎页面中添加互相切换的按钮。修复百度、必应失效问题。
// @author              Moshel / Gemini Update
// @namespace           http://hzy.pw
// @match               *://*.baidu.com/*
// @exclude             *://*.baidu.com/link?*
// @match               *://*.so.com/*
// @match               *://*.bing.com/*
// @match               *://*.zhihu.com/search?*
// @match               *://*.soku.com/*
// @match               *://*.sogou.com/*
// @match               *://*.google.com/*
// @match               *://*.google.com.hk/*
// @grant               GM_addStyle
// @run-at              document_end
// @version             1.6.0
// ==/UserScript==

(function () {
    'use strict';

    const sites = ['baidu', 'bing', 'so.com', '', 'zhihu', 'google', 'soku', 'sogou'];
    const sitesName = ['百度', '必应', '好搜', 'ALLSO', '知乎', '谷歌', '搜库', '搜狗'];

    const styleText = `
        .soTab {
            position: fixed;
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 0 10px 10px 0;
            color: #fff;
            padding: 12px 15px;
            bottom: 120px;
            left: -285px; /* 初始隐藏大部分 */
            width: 300px;
            z-index: 2147483647; /* 确保在最顶层 */
            transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 14px;
            box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
            line-height: 1.5;
        }
        .soTab:hover {
            left: 0px;
            opacity: 1;
        }
        .soTab_title {
            font-weight: bold;
            margin-bottom: 8px !important;
            color: #eee !important;
            display: block;
        }
        .soTab a {
            color: #0cf !important;
            margin-right: 15px;
            text-decoration: none !important;
            display: inline-block;
            margin-bottom: 5px;
        }
        .soTab a:hover {
            text-decoration: underline !important;
        }
    `;

    let lastKeyword = '';

    function getKeywords() {
        const searchParams = new URLSearchParams(location.search);
        const keys = ['wd', 'word', 'w', 'q', 'query', 'search'];
        for (let key of keys) {
            if (searchParams.has(key)) {
                return encodeURIComponent(searchParams.get(key));
            }
        }
        // 针对某些单页应用的特殊处理（如 Google 异步加载后的 hash）
        const hashParams = new URLSearchParams(location.hash.substring(1));
        for (let key of keys) {
            if (hashParams.has(key)) {
                return encodeURIComponent(hashParams.get(key));
            }
        }
        return '';
    }

    function createPanel() {
        // 防止重复创建
        if (document.getElementById('soTab')) return;

        let siteID = -1;
        for (let i = 0; i < sites.length; i++) {
            if (sites[i] && location.hostname.includes(sites[i])) {
                siteID = i;
                break;
            }
        }
        if (siteID === -1) return;

        // 判断类型 (0:normal, 1:pic, 2:zhidao, 3:video, 4:xueshu)
        let kindID = 0;
        if (location.href.includes('image') || location.href.includes('tbm=isch') || location.href.includes('pic.')) kindID = 1;
        else if (location.href.includes('zhidao') || location.href.includes('zhihu') || location.href.includes('wenwen')) kindID = 2;
        else if (location.href.includes('video') || location.href.includes('tbm=vid') || location.href.includes('v.')) kindID = 3;
        else if (location.href.includes('xueshu') || location.href.includes('scholar')) kindID = 4;

        let links = [];
        const kw = getKeywords();
        if (!kw) return; // 没有关键词则不显示

        if (kindID === 0) {
            links = [
                'https://www.baidu.com/s?wd=',
                'https://www.bing.com/search?pc=MOZI&form=MOZLBR&q=',
                'https://www.so.com/s?q=',
                'http://h2y.github.io/allso/#',
                'https://www.zhihu.com/search?q=',
                'https://www.google.com/search?q=',
                '',
                'https://www.sogou.com/web?query=',
            ];
        } else if (kindID === 1) {
            links = [
                'https://image.baidu.com/search/index?tn=baiduimage&word=',
                'https://cn.bing.com/images/search?q=',
                'https://image.so.com/i?q=',
                '', '',
                'https://www.google.com/search?tbm=isch&q=',
            ];
        }

        const panel = document.createElement('div');
        panel.id = 'soTab';
        // 关键点：针对 Bing，class 必须包含 b_ 开头，防止被其脚本自动清除
        panel.className = `b_soTab soTab site_${siteID}`;

        let html = `<span class='soTab_title'>soTab 切换引擎：</span>`;
        links.forEach((link, idx) => {
            if (link && idx !== siteID) {
                html += `<a href="${link}${kw}" target="_blank">${sitesName[idx]}</a>`;
            }
        });

        panel.innerHTML = html;
        
        // 注入到 body，并设置 data-for 防止百度清除
        const style = GM_addStyle(styleText);
        if (style) style.dataset.for = "result";
        
        document.body.appendChild(panel);
    }

    // 核心修复：定时检查是否存在，若被删除了则重新创建
    // 同时也监控 URL 变化
    function run() {
        const currentKw = getKeywords();
        const panel = document.getElementById('soTab');
        
        if (!panel || currentKw !== lastKeyword) {
            if (panel) panel.remove();
            lastKeyword = currentKw;
            createPanel();
        }
    }

    // 初始化
    setTimeout(run, 1000);
    
    // 每 2 秒检查一次页面状态（应对异步加载）
    setInterval(run, 2000);

    // 监听 URL 变化（针对 Google/Bing 的单页跳转）
    window.addEventListener('popstate', run);
    window.addEventListener('hashchange', run);

})();
