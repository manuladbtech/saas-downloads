/**
 * architecture-detection.js — Final Universal Production Version
 * 
 * Securely detects the correct CPU architecture for Android and Desktop devices.
 * Uses a RAM-Master tie-breaker to distinguish between:
 * 1. Budget 32-bit OS devices (e.g., Redmi 9A, A3)
 * 2. High-end 64-bit devices with legacy reporting strings
 */

/** ── Single source of truth for the APK version ── */
// const APP_VERSION = '0.0.5';

const BASE_URL = 'https://raw.githubusercontent.com/manuladbtech/saas-downloads/main/apks_on_github';

/** Injects versioned download URLs into all three buttons */
function setDownloadLinks() {
    const btn64   = document.getElementById('btn-arm64');
    const btn32   = document.getElementById('btn-arm32');
    const btnUniv = document.getElementById('btn-universal');

    // if (btn64)   btn64.href   = `${BASE_URL}/SAAS_${APP_VERSION}_arm64.apk`;
    // if (btn32)   btn32.href   = `${BASE_URL}/SAAS_${APP_VERSION}_arm.apk`;
    // if (btnUniv) btnUniv.href = `${BASE_URL}/SAAS_${APP_VERSION}_universal.apk`;

    if (btn64)   btn64.href   = `${BASE_URL}/SAAS_0.0.7_arm64.apk`;
    if (btn32)   btn32.href   = `${BASE_URL}/SAAS_0.0.8_arm.apk`;
    if (btnUniv) btnUniv.href = `${BASE_URL}/SAAS_0.0.9_universal.apk`;
}

async function detectArchitecture() {
    const platform = (navigator.platform || '').toLowerCase();
    const ua = navigator.userAgent.toLowerCase();
    const ram = navigator.deviceMemory || 0;

    // 1. Desktop & Emulator Logic (Prioritize x86/x64)
    if (platform.includes('x86') || platform.includes('amd64') || ua.includes('x86')) {
        return 'x64';
    }

    // 2. High-Entropy Modern API (Chrome 90+ on Android) - MOST RELIABLE
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            const hints = await navigator.userAgentData.getHighEntropyValues(['bitness', 'architecture']);
            if (hints.bitness === '64') return 'arm64';
            if (hints.bitness === '32') return 'arm32';
        } catch (e) { }
    }

    // 3. Explicit Architecture Strings
    const isPure64String = platform.includes('aarch64') || platform.includes('arm64') || ua.includes('aarch64');
    if (isPure64String) return 'arm64';

    // 4. Budget/Legacy OS Strings (armv8l, armv7, etc.)
    // If it specifically reports armv8l or armv7, it is almost certainly a 32-bit environment
    // (either 32-bit hardware or 32-bit OS on 64-bit hardware).
    const isBudgetOSString = /armv[78][l1i]/.test(platform) || /armv7/.test(ua);
    if (isBudgetOSString) return 'arm32';

    // 5. Fallback/Tie-Breaker
    // If we've reached here, the strings are ambiguous. 
    // We only recommend arm64 if we have a strong hint from the engine or high RAM.
    const engineSupports64 = (typeof BigInt64Array !== 'undefined');
    
    // We stay conservative: only return arm64 if it's NOT a budget string AND it has evidence of 64-bit capability.
    if (engineSupports64 && ram >= 4 && !isBudgetOSString) {
        return 'arm64';
    }

    return 'arm32'; // Safest default for Android
}

/**
 * UI Controller for Download Cards
 */
function updateUI(arch) {
    const loader = document.getElementById('loader');
    const statusCard = document.getElementById('status-card');
    const cardArm64 = document.getElementById('card-arm64');
    const cardArm32 = document.getElementById('card-arm32');

    // Store for translation switching
    window.lastArch = arch;

    // Transition: Swap loader for status card
    if (loader) loader.style.display = 'none';
    if (statusCard) statusCard.style.display = 'flex';

    // Reset highlights
    cardArm64?.classList.remove('recommended');
    cardArm32?.classList.remove('recommended');

    // Update status text via translation system
    if (window.updateStatusText) {
        window.updateStatusText(arch);
    }

    // Set CSS highlights
    switch (arch) {
        case 'arm64':
            cardArm64?.classList.add('recommended');
            break;
        case 'arm32':
            cardArm32?.classList.add('recommended');
            break;
        default:
            cardArm64?.classList.add('recommended');
    }

    // Trigger staggered entry animations
    document.querySelectorAll('.download-card').forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('show');
        }, index * 120);
    });
}

// Initialization Flow
window.addEventListener('DOMContentLoaded', async () => {
    // Set all download button URLs from the single APP_VERSION constant
    setDownloadLinks();

    // Elegant delay to ensure layout stability
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const arch = await detectArchitecture();
        updateUI(arch);
    } catch (error) {
        console.error("Detection System Error:", error);
        updateUI('arm64'); // Smart fallback
    }

    // Interaction Handlers
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const textSpan = copyBtn.querySelector('[data-i18n="copy-link"]');
                if (textSpan) {
                    const originalKey = 'copy-link';
                    const successKey = 'link-copied';
                    
                    textSpan.innerHTML = window.translations[window.currentLang][successKey];
                    setTimeout(() => { 
                        textSpan.innerHTML = window.translations[window.currentLang][originalKey]; 
                    }, 2000);
                }
            });
        });
    }
});
