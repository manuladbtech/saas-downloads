/**
 * Detects the device's CPU architecture using User-Agent Client Hints
 * or navigator.platform fallback.
 */
async function detectArchitecture() {
    // 1. Check for Modern User-Agent Client Hints
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            const hints = await navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness', 'platform']);
            if (hints.bitness === '64') return 'arm64';
            if (hints.bitness === '32') return 'arm32';
        } catch (e) { }
    }

    // 2. UNIVERSAL HARDWARE PROOF (The most reliable method)
    // We check if the JavaScript engine supports 64-bit mathematical operations.
    // If these are supported, the OS is 64-bit, period.
    let is64BitOS = false;
    try {
        // BigInt64Array is a foolproof indicator of a 64-bit execution environment
        if (typeof BigInt64Array !== 'undefined') {
            is64BitOS = true;
        }
    } catch (e) { }

    const platform = (navigator.platform || '').toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    // 3. ARCHITECTURE CATEGORIZATION
    // First, check if it's an x86/PC environment
    if (platform.includes('x86_64') || platform.includes('amd64') || userAgent.includes('x64')) {
        return 'x64';
    }

    // Now handle ARM (Android phones)
    const isARM = platform.includes('arm') || userAgent.includes('arm') || userAgent.includes('aarch64');

    if (isARM || userAgent.includes('android')) {
        // If our math test proved 64-bit, we ALWAYS give them ARM64 for performance.
        if (is64BitOS) {
            // The only exception is if the platform explicitly says 'armv7' (very old hardware)
            if (platform.includes('armv7') && !platform.includes('armv8')) {
                return 'arm32';
            }
            return 'arm64';
        }
        return 'arm32';
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
