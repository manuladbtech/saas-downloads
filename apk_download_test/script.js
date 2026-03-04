/**
 * Detects the device's CPU architecture using User-Agent Client Hints
 * or navigator.platform fallback.
 */
async function detectArchitecture() {
    // 1. Check for Modern User-Agent Client Hints
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            const hints = await navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness', 'platform']);
            console.log("Client Hints Received:", hints);

            // Priority 1: Direct Architecture check
            if (hints.architecture === 'arm') {
                return hints.bitness === '64' ? 'arm64' : 'arm32';
            }

            // Priority 2: Inferred from Android + Bitness
            if (hints.platform === 'Android' || hints.platform === 'android') {
                // Trust bitness directly from Client Hints if available, 
                // as it accurately reflects the OS mode.
                if (hints.bitness === '64') return 'arm64';
                if (hints.bitness === '32') return 'arm32';
            }
        } catch (e) {
            console.warn("Client Hints detection failed:", e);
        }
    }

    // 2. Fallback and Deep Verification (Critical for Redmi A3 / budget phones)
    const platform = (navigator.platform || '').toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    console.log("OS Verification - Platform:", platform);
    console.log("OS Verification - UA:", userAgent);

    // KEY FIX: 'armv8l' is 32-BIT mode on ARMv8. 'aarch64' is TRUE 64-BIT.
    if (platform.includes('aarch64') || platform.includes('arm64')) {
        return 'arm64';
    }

    // If it includes 'armv8l', 'armv7', or just 'arm', it's almost certainly a 32-bit OS
    if (platform.includes('armv8l') || platform.includes('armv7') || platform.includes('armeabi') || platform.includes('arm')) {
        return 'arm32';
    }

    // Check for x86 (Desktop/Emulators)
    if (platform.includes('x86_64') || platform.includes('amd64') || userAgent.includes('x64')) {
        return 'x64';
    }

    return 'unknown';
}

/**
 * Updates the UI based on the detected architecture
 */
function updateUI(arch) {
    const loader = document.getElementById('loader');
    const statusText = document.getElementById('status-text');

    // Hide loader
    loader.style.display = 'none';

    // Reset all cards
    document.getElementById('card-arm64').classList.remove('recommended');
    document.getElementById('card-arm32').classList.remove('recommended');

    let detectedName = "";

    switch (arch) {
        case 'arm64':
            document.getElementById('card-arm64').classList.add('recommended');
            statusText.innerHTML = "<strong>Premium device detected.</strong> ARM64-v8a build is optimized for your hardware.";
            break;
        case 'arm32':
            document.getElementById('card-arm32').classList.add('recommended');
            statusText.innerText = "Legacy Android device detected. Using ARMv7 build for stability.";
            break;
        case 'x64':
        case 'x86':
            statusText.innerText = "Desktop/Emulator environment. Choose the Universal APK for the best experience.";
            break;
        default:
            document.getElementById('card-arm64').classList.add('recommended');
            statusText.innerText = "Architecture unknown. We recommend ARM64 as it works on 90%+ of modern phones.";
    }

    // Trigger staggered animations
    const cards = document.querySelectorAll('.download-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('show');
        }, index * 150);
    });
}

// Initialize on load
window.addEventListener('DOMContentLoaded', async () => {
    // Artificial delay to feel premium/thorough
    await new Promise(resolve => setTimeout(resolve, 1200));

    const arch = await detectArchitecture();
    console.log("Final Detection:", arch);
    updateUI(arch);

    // Copy Link Logic
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = "Link Copied!";
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            });
        });
    }
});
