/**
 * architecture-detection.js — Final Universal Production Version
 * 
 * Securely detects the correct CPU architecture for Android and Desktop devices.
 * Uses a RAM-Master tie-breaker to distinguish between:
 * 1. Budget 32-bit OS devices (e.g., Redmi 9A, A3)
 * 2. High-end 64-bit devices with legacy reporting strings
 */

/** ── Single source of truth for the APK version ── */
const APP_VERSION = '0.0.5';

const BASE_URL = 'https://raw.githubusercontent.com/manuladbtech/saas-downloads/main/apks_on_github';

/** Injects versioned download URLs into all three buttons */
function setDownloadLinks() {
    const btn64   = document.getElementById('btn-arm64');
    const btn32   = document.getElementById('btn-arm32');
    const btnUniv = document.getElementById('btn-universal');

    if (btn64)   btn64.href   = `${BASE_URL}/SAAS_${APP_VERSION}_arm64.apk`;
    if (btn32)   btn32.href   = `${BASE_URL}/SAAS_${APP_VERSION}_arm.apk`;
    if (btnUniv) btnUniv.href = `${BASE_URL}/SAAS_${APP_VERSION}_universal.apk`;
}

async function detectArchitecture() {
    const platform = (navigator.platform || '').toLowerCase();
    const ua = navigator.userAgent.toLowerCase();
    const ram = navigator.deviceMemory || 0;

    // 1. Desktop & Emulator Logic
    if (platform.includes('x86') || platform.includes('amd64') || ua.includes('x86')) {
        return 'x64';
    }

    // 2. High-Entropy Modern API (Chrome 90+ on Android)
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            const hints = await navigator.userAgentData.getHighEntropyValues(['bitness', 'architecture']);
            if (hints.bitness === '64') return 'arm64';
            if (hints.bitness === '32') return 'arm32';
        } catch (e) { }
    }

    // 3. ARM Tie-Breaker Logic (RAM-Smart Approach)
    // Budget 32-bit OS usually reports platform 'armv8l' or 'armv7'.
    // We use a 4GB RAM threshold as the master decider for Android.
    const isGenericAndroid = ua.includes('android');
    const isBudgetOSString = /armv[78][l1i]/.test(platform) || /armv7/.test(ua);
    const isPure64String = platform.includes('aarch64') || platform.includes('arm64') || ua.includes('aarch64');

    if (isGenericAndroid) {
        // If it looks like budget OS (armv8l/armv7) OR it doesn't clearly say 64-bit:
        if (isBudgetOSString || !isPure64String) {
            // navigator.deviceMemory caps at 4 for any device with 4GB+ RAM (spec-defined fingerprint protection).
            // So ram === 4 means "4GB or more" — these are virtually always 64-bit capable devices (e.g. Galaxy A54 5G).
            if (ram >= 4) return 'arm64';
            // Devices with < 4GB RAM (Redmi 9A, etc.) are much safer on 32-bit (ARMv7).
            return 'arm32';
        }
    }

    // 4. Fallback Mathematical Proof (Final Check)
    const engineSupports64 = (typeof BigInt64Array !== 'undefined');

    if (isPure64String || (engineSupports64 && ram > 4)) {
        return 'arm64';
    }

    return 'arm32';
}

/**
 * UI Controller for Download Cards
 */
function updateUI(arch) {
    const loader = document.getElementById('loader');
    const statusText = document.getElementById('status-text');
    const cardArm64 = document.getElementById('card-arm64');
    const cardArm32 = document.getElementById('card-arm32');

    // Hide loader
    if (loader) loader.style.display = 'none';

    // Reset highlights
    cardArm64?.classList.remove('recommended');
    cardArm32?.classList.remove('recommended');

    switch (arch) {
        case 'arm64':
            cardArm64?.classList.add('recommended');
            if (statusText) statusText.innerHTML = "<strong>Premium device detected.</strong> ARM64 build is optimized for your hardware.";
            break;
        case 'arm32':
            cardArm32?.classList.add('recommended');
            if (statusText) statusText.innerText = "Compatibility mode enabled. ARMv7 build selected for maximum stability.";
            break;
        case 'x64':
            if (statusText) statusText.innerText = "Desktop/Emulator detected. Use the Universal or x64 versions.";
            break;
        default:
            cardArm64?.classList.add('recommended');
            if (statusText) statusText.innerText = "Standard device detected. Recommending our most compatible 64-bit build.";
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
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = "Link Copied!";
                setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
            });
        });
    }
});
