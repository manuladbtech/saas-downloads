/**
 * Architecture Detection Engine
 *
 * Strategy:
 * 1. Trust browser Client Hints (most accurate on modern Chrome).
 * 2. Fall back to User-Agent and platform string analysis.
 * 3. Default to ARM64 when uncertain — it works on 95%+ of Android devices sold after 2018.
 *    The only devices that NEED ARMv7 are genuinely old (pre-2016) devices or specific
 *    budget phones running a 32-bit OS (like Redmi A3).
 */
async function detectArchitecture() {
    const platform = (navigator.platform || '').toLowerCase();
    const ua = navigator.userAgent.toLowerCase();
    const ram = navigator.deviceMemory; // in GB — 1, 2, 4, 8 etc. or undefined if old browser

    console.log('[Detect] RAM:', ram, '| Platform:', platform, '| UA (partial):', ua.slice(0, 80));

    // x86 — PC emulators (BlueStacks etc.). Check this first.
    if (platform.includes('x86_64') || platform.includes('amd64') || ua.includes('x86_64')) {
        return 'x64';
    }

    // --- RAM-First Strategy for Android ---
    // deviceMemory is the single most reliable cross-device signal available.
    // Budget 32-bit Android phones (Redmi 9A = 2GB, Redmi A3 = 3GB) have LOW RAM.
    // Modern 64-bit phones (Samsung A14 = 4GB, Pixel 7 = 12GB) have HIGH RAM.
    if (ua.includes('android')) {
        if (ram !== undefined) {
            // RAM is available — use it as the primary decider.
            if (ram <= 3) return 'arm32'; // Budget/32-bit phone (Redmi 9A = 2GB, Redmi A3 = 3GB)
            return 'arm64';               // Modern phone (Samsung A14 = 4GB, Pixel = 12GB)
        }

        // RAM not readable → fall back to Client Hints.
        if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
            try {
                const hints = await navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness']);
                console.log('[Detect] Client Hints:', hints);
                // Only trust bitness if architecture also confirms ARM (not x86).
                if (hints.architecture === 'arm') {
                    return hints.bitness === '64' ? 'arm64' : 'arm32';
                }
                if (hints.bitness === '64') return 'arm64';
                if (hints.bitness === '32') return 'arm32';
            } catch (e) {
                console.warn('[Detect] Client Hints failed:', e);
            }
        }

        // Last resort for Android — platform strings.
        if (platform.includes('aarch64') || platform.includes('arm64') || ua.includes('aarch64')) return 'arm64';
        if (platform.includes('armv8l') || platform.includes('armv7') || platform.includes('armeabi')) return 'arm32';

        // Absolute final fallback for Android — default arm64 (90%+ of modern phones).
        return 'arm64';
    }

    // Non-Android (desktop, iOS etc.)
    if (platform.includes('aarch64') || platform.includes('arm64')) return 'arm64';
    if (platform.includes('arm')) return 'arm32';

    return 'unknown';
}

/**
 * Updates the UI based on the detected architecture
 */
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

    // Staggered card animations
    document.querySelectorAll('.download-card').forEach((card, i) => {
        setTimeout(() => card.classList.add('show'), i * 150);
    });
}

// Boot
window.addEventListener('DOMContentLoaded', async () => {
    await new Promise(r => setTimeout(r, 1000));
    const arch = await detectArchitecture();
    console.log('[Detect] Final result:', arch);
    updateUI(arch);

    // Copy link button
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
