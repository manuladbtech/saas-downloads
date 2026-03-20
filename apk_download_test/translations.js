const translations = {
    'en': {
        'page-title': 'Download App - Smart Architecture Detection',
        'meta-description': 'Download the latest version of our app optimized for your device architecture.',
        'hero-title': 'Get the App',
        'hero-subtitle': 'Experience the game with maximum performance. We\'ll help you pick the right version for your device.',
        'status-analyzing': 'Analyzing device compatibility...',
        'badge-recommended': 'Recommended',
        'card-arm64-desc': 'Optimized for modern 64-bit devices. Provides better performance and security.',
        'card-arm32-desc': 'Compatible with older or budget devices. Solid stability for classic hardware.',
        'card-other-title': 'Other Versions',
        'card-other-desc': 'Looking for PC emulators or universal versions?',
        'btn-download': 'Download APK',
        'btn-universal': 'Universal APK',
        'footer-text': 'Not sure which one to pick? The highlighted version is auto-detected for your system.',
        'status-premium': '<strong>Premium device detected.</strong> ARM64 build is optimized for your hardware.',
        'status-compatibility': 'Compatibility mode enabled. ARMv7 build selected for maximum stability.',
        'status-desktop': 'Desktop/Emulator detected. Use the Universal or x64 versions.',
        'status-standard': 'Standard device detected. Recommending our most compatible 64-bit build.',
        'copy-link': 'Copy Site Link',
        'link-copied': 'Link Copied!',
        'lang-en': 'English',
        'lang-zh': '简体中文'
    },
    'zh': {
        'page-title': '下载应用 - 智能架构检测',
        'meta-description': '下载针对您的设备架构优化的最新版本应用。',
        'hero-title': '获取应用',
        'hero-subtitle': '以最高性能体验游戏。我们将帮助您为您的设备选择正确的版本。',
        'status-analyzing': '正在分析设备兼容性...',
        'badge-recommended': '推荐',
        'card-arm64-desc': '针对现代 64 位设备进行了优化。提供更好的性能和安全性。',
        'card-arm32-desc': '兼容旧款或低端设备。为经典硬件提供稳定的运行。',
        'card-other-title': '其他版本',
        'card-other-desc': '正在寻找 PC 模拟器或通用版本？',
        'btn-download': '下载 APK',
        'btn-universal': '通用 APK',
        'footer-text': '不确定选择哪一个？突出显示的版本是为您的系统自动检测的。',
        'status-premium': '<strong>检测到高端设备。</strong> ARM64 版本已针对您的硬件进行了优化。',
        'status-compatibility': '已启用兼容模式。已为您的硬件选择 ARMv7 版本。',
        'status-desktop': '检测到桌面/模拟器。请使用通用或 x64 版本。',
        'status-standard': '检测到标准设备。推荐我们最兼容的 64 位版本。',
        'copy-link': '复制站点链接',
        'link-copied': '链接已复制！',
        'lang-en': 'English',
        'lang-zh': '简体中文'
    }
};

let currentLang = localStorage.getItem('preferredLanguage') || 
                  (navigator.language.startsWith('zh') ? 'zh' : 'en');

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    window.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
    document.documentElement.setAttribute('lang', lang);
    updateTranslations();
    
    // Update active state of language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

function updateTranslations() {
    const t = translations[currentLang];
    
    // Update Title and Meta
    document.title = t['page-title'];
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t['meta-description']);

    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t[key];
            } else {
                el.innerHTML = t[key];
            }
        }
    });

    // Re-run status update if detection already happened
    if (window.lastArch) {
        updateStatusText(window.lastArch);
    }
}

function updateStatusText(arch) {
    const statusText = document.getElementById('status-text');
    if (!statusText) return;
    
    const t = translations[currentLang];
    switch (arch) {
        case 'arm64':
            statusText.innerHTML = t['status-premium'];
            break;
        case 'arm32':
            statusText.innerText = t['status-compatibility'];
            break;
        case 'x64':
            statusText.innerText = t['status-desktop'];
            break;
        default:
            statusText.innerText = t['status-standard'];
    }
}

// Export for use in other scripts
window.translations = translations;
window.setLanguage = setLanguage;
window.updateStatusText = updateStatusText;
window.currentLang = currentLang;

document.addEventListener('DOMContentLoaded', () => {
    updateTranslations();
    
    // Set initial active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
});
