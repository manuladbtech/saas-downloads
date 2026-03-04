/**
 * detect-v12.js — Architecture Detection with visible debug panel
 */
async function detectArchitecture() {
    const platform = (navigator.platform || '').toLowerCase();
    const ua = navigator.userAgent.toLowerCase();
    const ram = navigator.deviceMemory; // undefined on old browsers

    // Show debug panel immediately so user can report values
    showDebug(`RAM=${ram} | plat="${platform}" | build=v12`);

    // x86 — PC/Emulator
    if (platform.includes('x86_64') || platform.includes('amd64') || ua.includes('x86_64')) {
        return 'x64';
    }

    if (ua.includes('android')) {
        // RAM is available — most reliable signal
        if (ram !== undefined) {
            if (ram <= 3) return 'arm32';
            return 'arm64';
        }

        // RAM not available — try Client Hints
        if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
            try {
                const hints = await navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness']);
                showDebug(`RAM=${ram} | bits=${hints.bitness} | arch=${hints.architecture} | plat="${platform}" | v12`);
                if (hints.architecture === 'arm') {
                    return hints.bitness === '64' ? 'arm64' : 'arm32';
                }
                if (hints.bitness === '64') return 'arm64';
                if (hints.bitness === '32') return 'arm32';
            } catch (e) { }
        }

        // Platform string fallback
        if (platform.includes('aarch64') || platform.includes('arm64') || ua.includes('aarch64')) return 'arm64';
        if (platform.includes('armv8l') || platform.includes('armv7') || platform.includes('armeabi')) return 'arm32';

        // Final Android default
        return 'arm64';
    }

    if (platform.includes('aarch64') || platform.includes('arm64')) return 'arm64';
    if (platform.includes('arm')) return 'arm32';

    return 'unknown';
}

function showDebug(msg) {
    // Create a bright, clearly visible debug bar at the top
    let bar = document.getElementById('__debug_bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = '__debug_bar';
        bar.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0;
            background: #ff4444;
            color: white;
            font-size: 13px;
            font-family: monospace;
            padding: 8px 12px;
            z-index: 99999;
            word-break: break-all;
        `;
        document.body.appendChild(bar);
    }
    bar.textContent = '🔍 ' + msg;
}

function updateUI(arch) {
    const loader = document.getElementById('loader');
    const statusText = document.getElementById('status-text');

    loader.style.display = 'none';

    const cardArm64 = document.getElementById('card-arm64');
    const cardArm32 = document.getElementById('card-arm32');

    cardArm64.classList.remove('recommended');
    cardArm32.classList.remove('recommended');

    switch (arch) {
        case 'arm64':
            cardArm64.classList.add('recommended');
            statusText.innerHTML = '<strong>Modern 64-bit device detected.</strong> ARM64-v8a is the best build for your hardware.';
            break;
        case 'arm32':
            cardArm32.classList.add('recommended');
            statusText.innerText = 'Legacy 32-bit device detected. ARMv7 build recommended for full compatibility.';
            break;
        case 'x64':
        case 'x86':
            statusText.innerText = 'PC / Emulator detected. Use the Universal APK for the best experience.';
            break;
        default:
            cardArm64.classList.add('recommended');
            statusText.innerText = 'Could not detect architecture. ARM64 works on 95%+ of modern Android devices.';
    }

    document.querySelectorAll('.download-card').forEach((card, i) => {
        setTimeout(() => card.classList.add('show'), i * 150);
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    await new Promise(r => setTimeout(r, 800));
    const arch = await detectArchitecture();
    updateUI(arch);

    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const orig = copyBtn.innerHTML;
                copyBtn.innerHTML = 'Link Copied!';
                setTimeout(() => { copyBtn.innerHTML = orig; }, 2000);
            });
        });
    }
});
