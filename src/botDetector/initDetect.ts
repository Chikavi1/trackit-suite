// BotDetector.ts
export interface BotDetectionResult {
  isBot: boolean;
  score: number; // 0 - 100
  reasons: string[]; // señales detectadas
  incognito: boolean;
  vpn: boolean | null; // null si no se verificó
}

export class BotDetector {
  private vpnCheckUrl: string;

  constructor(vpnCheckUrl?: string) {
    this.vpnCheckUrl = vpnCheckUrl || '';
  }

  public async detect(): Promise<BotDetectionResult> {
    const reasons: string[] = [];
    let score = 0;

    // 1️⃣ Headless / webdriver
    if ((navigator as any).webdriver) {
      reasons.push('webdriver detected');
      score += 40;
    }

    // 2️⃣ User-Agent anomalies
    const ua = navigator.userAgent.toLowerCase();
    if (/headless|bot|crawler|spider|phantom|scrapy|selenium|playwright/.test(ua)) {
      reasons.push('user agent indicates bot');
      score += 40;
    }

    // 3️⃣ Plugins
    const plugins = navigator.plugins?.length ?? 0;
    if (plugins === 0) {
      reasons.push('no plugins');
      score += 10;
    }

    // 4️⃣ Touch support
    if (navigator.maxTouchPoints === 0) {
      reasons.push('no touch points');
      score += 5;
    }

    // 5️⃣ Hardware concurrency
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) {
      reasons.push('low hardware concurrency');
      score += 5;
    }

    // 6️⃣ Languages
    if (!navigator.languages || navigator.languages.length === 0) {
      reasons.push('no languages');
      score += 5;
    }

    // 7️⃣ Permissions
    try {
      const perm = await navigator.permissions.query({ name: 'notifications' as PermissionName });
      if (perm.state === 'denied') {
        reasons.push('notifications denied');
        score += 5;
      }
    } catch (_) {
      reasons.push('permissions api missing');
      score += 5;
    }

    // 8️⃣ Canvas fingerprinting (mejor que WebGL debug)
    if (this.detectCanvasAnomaly()) {
      reasons.push('canvas anomaly detected (possible headless)');
      score += 20;
    }

    // 9️⃣ Incognito detection moderno
    const incognito = await this.detectIncognito();
    if (incognito) {
      reasons.push('incognito mode detected');
      score += 5;
    }

    // 🔟 VPN / Proxy
    let vpn: boolean | null = null;
    if (this.vpnCheckUrl) {
      try {
        const res = await fetch(this.vpnCheckUrl);
        const data = await res.json();
        vpn = !!data.vpn;
        if (vpn) {
          reasons.push('vpn detected');
          score += 20;
        }
      } catch {
        vpn = null;
      }
    }

    return {
      isBot: score >= 40,
      score: Math.min(score, 100),
      reasons,
      incognito,
      vpn
    };
  }

  // ------------------------
  // Canvas fingerprinting
  // ------------------------
  private detectCanvasAnomaly(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return true;

      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.fillText('Fingerprint test 🚀', 2, 2);

      const data = ctx.getImageData(0, 0, 100, 20).data;
      const sum = data.reduce((acc, val) => acc + val, 0);

      // Headless browsers generan valores anómalos
      return sum < 50000 || sum > 100000;
    } catch {
      return false;
    }
  }

  // ------------------------
  // Incognito detection moderno
  // ------------------------
  private async detectIncognito(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.estimate) return false;

  try {
    const { quota } = await navigator.storage.estimate();
     return !!quota && quota < 120 * 1024 * 1024;
  } catch {
    return false;
  }
}

}
