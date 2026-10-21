/**
 * Monetization & Ad Download Management Utility
 * 
 * Target URLs:
 * 1. QR Code Tools: https://tsquickqr.netlify.app
 * 2. Ad Monetization Direct Link: https://www.profitableratecpmnetwork.com/tz4z6u772?key=038c6ad54c4604616605003c5e8c7265
 * 
 * Logic requirement:
 * - 1st click on any download button opens the monetization ad link in a new tab.
 * - 2nd click on the download button executes the actual download.
 * - Cycle repeats (1st click -> ad link, 2nd click -> download).
 */

export const QR_CODE_TOOLS_URL = 'https://tsquickqr.netlify.app';
export const AD_MONETIZATION_URL = 'https://www.profitableratecpmnetwork.com/tz4z6u772?key=038c6ad54c4604616605003c5e8c7265';

// Stores whether step 1 (ad opened) has completed for a specific action key
const downloadStepState = new Map<string, number>();

/**
 * Opens the QR Code Tools web application in a new tab
 */
export function openQrCodeTools(): void {
  window.open(QR_CODE_TOOLS_URL, '_blank', 'noopener,noreferrer');
}

/**
 * Executes the 2-step download logic:
 * Click 1: Opens the ad URL in a new window/tab
 * Click 2: Calls downloadFn() to perform the actual download
 * Next click: Repeats cycle (Click 1 opens ad, Click 2 downloads)
 */
export function executeTwoStepDownload(
  actionKey: string,
  downloadFn: () => void | Promise<void>,
  onFirstClickNotice?: (message: string) => void
): { step: 1 | 2 } {
  const currentStep = downloadStepState.get(actionKey) || 0;

  if (currentStep === 0) {
    // 1st Click: Open ad link in new tab
    downloadStepState.set(actionKey, 1);
    try {
      window.open(AD_MONETIZATION_URL, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback anchor click if popup blocked
      const a = document.createElement('a');
      a.href = AD_MONETIZATION_URL;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    if (onFirstClickNotice) {
      onFirstClickNotice('Download ready! Click Download once more to save file.');
    }
    return { step: 1 };
  } else {
    // 2nd Click: Perform actual download & reset state
    downloadStepState.set(actionKey, 0);
    try {
      downloadFn();
    } catch (err) {
      console.error('Download execution failed:', err);
    }
    return { step: 2 };
  }
}

/**
 * Downloads an image, video or remote media file as a Blob so browsers save it locally
 */
export async function downloadMediaFile(url: string, filename: string = 'media-download'): Promise<void> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Network fetch failed');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  } catch {
    // Fallback: direct browser trigger
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Generates and downloads a canvas (e.g. for game score cards or QR codes) as PNG
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string = 'download.png'): void {
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
