/**
 * Detects the device's CPU architecture using User-Agent Client Hints
 * or navigator.platform fallback.
 */
async function detectArchitecture() {
    let bitness = 'unknown';

    // 1. Check for Modern User-Agent Client Hints
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            const hints = await navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness', 'platform']);
            if (hints.bitness === '64') bitness = '64';
            if (hints.bitness === '32') bitness = '32';
        } catch (e) { }
    }

    const platform = (navigator.platform || '').toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    const totalRAM = navigator.deviceMemory || 4; // Assume 4GB if undetected

    // 2. Identify ARM vs x86
    const isX86 = platform.includes('x86_64') || platform.includes('amd64') || userAgent.includes('x64');
    const isARM = platform.includes('arm') || userAgent.includes('aarch64') || platform.includes('aarch64');

    if (isX86) return 'x64';

    // 3. Deep Logic for ARM (Android)
    if (isARM || userAgent.includes('android')) {
        // If Client Hints already gave us a definitive answer, use it.
        if (bitness === '64') return 'arm64';
        if (bitness === '32') return 'arm32';

        // Tie-breaker for devices like Redmi A3 (armv8 hardware but 32-bit OS)
        // 'armv8l' is almost always a 32-bit OS environment.
        if (platform.includes('armv8l')) {
            // Budget phones (like Redmi A3) usually have <= 3GB RAM and run 32-bit OS.
            // High-end phones (Samsung A14) have 4GB+ RAM and run 64-bit OS.
            return totalRAM <= 3 ? 'arm32' : 'arm64';
        }

        // Standard 64-bit tags
        if (platform.includes('aarch64') || platform.includes('arm64')) {
            return 'arm64';
        }

        // Standard 32-bit tags
        if (platform.includes('armv7') || platform.includes('armv6') || platform.includes('armeabi')) {
            return 'arm32';
        }

        // Default to ARM64 for modern Android if we can't be sure (90% case)
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
