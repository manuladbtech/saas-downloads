/**
 * detect-v14.js — Complete Rewrite (Nuclear Fix)
 */

async function detectArchitecture() {
    const platform = (navigator.platform || '').toLowerCase();
    const ua = navigator.userAgent.toLowerCase();
    const ram = navigator.deviceMemory || 0;

    // DEBUG: Very aggressive debug display
    const debugStr = `RAM:${ram} | PLAT:${platform} | V14`;
    showDebug(debugStr);

    // 1. Desktop / Emulator check
    if (platform.includes('x86') || platform.includes('amd64') || ua.includes('x86')) {
        return 'x64';
    }

    // 2. THE "BUDGET TRAP" FIX (Redmi 9A, A3, etc.)
    // We look for 'armv8' followed by EITHER an 'l' or a '1' or 'i'.
    // If it contains 'armv8' but DOES NOT contain 'aarch64', it is a 32-bit environment.
    const isBudgetHardware = /armv[78][l1i]/.test(platform) || /armv7/.test(ua);
    const isPure64Bit = platform.includes('aarch64') || platform.includes('arm64') || ua.includes('aarch64');

    if (isBudgetHardware && !isPure64Bit) {
        showDebug(debugStr + ' | RESULT: Forced 32-bit (Budget hardware)');
        return 'arm32';
    }

    // 3. High-Entropy Hints (Modern phones like Pixel 7, Samsung A14)
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            const hints = await navigator.userAgentData.getHighEntropyValues(['bitness', 'architecture']);
            if (hints.bitness === '64') return 'arm64';
            if (hints.bitness === '32') return 'arm32';
        } catch (e) { }
    }

    // 4. Final Decision based on Bitness Proof
    // Only return arm64 if we have explicit proof of a 64-bit environment.
    if (isPure64Bit || (typeof BigInt64Array !== 'undefined' && ram >= 4)) {
        return 'arm64';
    }

    // 5. Safe Default for Android
    return 'arm32';
}

function showDebug(msg) {
    let bar = document.getElementById('debug_v14');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'debug_v14';
        bar.style.cssText = "position:fixed;top:0;left:0;right:0;background:red;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;";
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
        status.innerHTML = "<strong>Modern device detected.</strong> ARM64 recommended.";
    } else if (arch === 'arm32') {
        c32.classList.add('recommended');
        status.innerText = "Legacy/Budget device detected. ARMv7 recommended.";
    } else {
        c64.classList.add('recommended');
        status.innerText = "General device detected. ARM64 recommended.";
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
