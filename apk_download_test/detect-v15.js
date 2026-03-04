/**
 * detect-v15.js — RAM-Smart Detection (Fix for 8GB devices)
 */

async function detectArchitecture() {
    const platform = (navigator.platform || '').toLowerCase();
    const ua = navigator.userAgent.toLowerCase();
    const ram = navigator.deviceMemory || 0;

    const debugStr = `RAM:${ram} | PLAT:${platform} | V15`;

    // 1. Desktop / Emulator check
    if (platform.includes('x86') || platform.includes('amd64') || ua.includes('x86')) {
        return 'x64';
    }

    // 2. High-Entropy Hints (First Priority for Modern Phones)
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            const hints = await navigator.userAgentData.getHighEntropyValues(['bitness', 'architecture']);
            if (hints.bitness === '64') return 'arm64';
            if (hints.bitness === '32') return 'arm32';
        } catch (e) { }
    }

    // 3. THE "RAM-SMART" BUDGET SCAN
    // armv8l is a budget-OS signal. 
    // If RAM > 4, we assume it's a 64-bit phone with a 32-bit browser build.
    // If RAM <= 4, it's likely a true budget 32-bit environment (Redmi 9A).
    const isBudgetOSString = /armv[78][l1i]/.test(platform) || /armv7/.test(ua);
    const isPure64String = platform.includes('aarch64') || platform.includes('arm64') || ua.includes('aarch64');

    if (isBudgetOSString && !isPure64String) {
        if (ram > 4) {
            showDebug(debugStr + ' | High RAM: Recommending ARM64');
            return 'arm64';
        }
        showDebug(debugStr + ' | Low RAM: Forced 32-bit');
        return 'arm32';
    }

    // 4. Mathematical & Platform Proofs
    if (isPure64String || (typeof BigInt64Array !== 'undefined' && ram >= 4)) {
        return 'arm64';
    }

    // 5. Final Safe Default
    return 'arm32';
}

function showDebug(msg) {
    let bar = document.getElementById('debug_v15');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'debug_v15';
        bar.style.cssText = "position:fixed;top:0;left:0;right:0;background:#333;color:#0f0;padding:10px;z-index:9999;font-family:monospace;font-size:12px;opacity:0.9;";
        document.body.appendChild(bar);
    }
    bar.textContent = "🔍 " + msg;
}

function updateUI(arch) {
    document.getElementById('loader').style.display = 'none';
    const status = document.getElementById('status-text');
    const c64 = document.getElementById('card-arm64');
    const c32 = document.getElementById('card-arm32');

    c64.classList.remove('recommended');
    c32.classList.remove('recommended');

    if (arch === 'arm64') {
        c64.classList.add('recommended');
        status.innerHTML = "<strong>Premium device detected.</strong> ARM64 recommended.";
    } else {
        c32.classList.add('recommended');
        status.innerText = "Compatibility mode. ARMv7 recommended.";
    }

    document.querySelectorAll('.download-card').forEach((c, i) => {
        setTimeout(() => c.classList.add('show'), i * 150);
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    await new Promise(r => setTimeout(r, 500));
    const arch = await detectArchitecture();
    updateUI(arch);
});
