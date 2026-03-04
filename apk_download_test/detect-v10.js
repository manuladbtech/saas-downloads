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
    const ram = navigator.deviceMemory; // in GB, or undefined if not supported

    // --- Step 1: Client Hints (Chrome 90+ on Android) ---
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            const hints = await navigator.userAgentData.getHighEntropyValues([
                'architecture', 'bitness', 'platform', 'model'
            ]);
            console.log('[Detect] Client Hints:', hints);

            // 'bitness' is the OS bit-width — the most reliable signal.
            if (hints.bitness === '64') return 'arm64';
            // If bitness is explicitly '32', only use arm32 if we also see arm hardware.
            if (hints.bitness === '32' && hints.architecture === 'arm') return 'arm32';
        } catch (e) {
            console.warn('[Detect] Client Hints failed:', e);
        }
    }

    // --- Step 2: Platform & UA String Analysis ---
    console.log('[Detect] Fallback — platform:', platform, '| ua snippet:', ua.slice(0, 120));

    // x86 (PC emulators like BlueStacks)
    if (platform.includes('x86_64') || platform.includes('amd64') || ua.includes('x86_64')) {
        return 'x64';
    }

    // True 64-bit ARM indicators
    if (platform.includes('aarch64') || platform.includes('arm64') || ua.includes('aarch64')) {
        return 'arm64';
    }

    // 'armv8l' = ARMv8 hardware running in 32-bit mode (e.g. Redmi A3).
    // We use RAM as a tiebreaker: if the device has < 4GB RAM it is likely budget/32-bit OS.
    if (platform.includes('armv8l')) {
        if (ram !== undefined && ram < 4) return 'arm32';
        return 'arm64'; // >= 4GB RAM on armv8l means modern 64-bit phone
    }

    // Clearly old ARMv7 hardware (pre-2016)
    if (platform.includes('armv7') || platform.includes('armeabi') || ua.includes('armv7')) {
        return 'arm32';
    }

    // --- Step 3: Conservative Default ---
    // Any modern Android phone (including undetected ones) is almost certainly 64-bit.
    // Defaulting to ARM64 is safer than ARM32 — it won't cause "not compatible" on new phones.
    if (ua.includes('android')) {
        return 'arm64';
    }

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
