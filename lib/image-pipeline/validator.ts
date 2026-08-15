// ============================================================
// RootX Product Image Pipeline V1 — Validator & Security
// SSRF prevention, scheme check, extension validation, duplicate rejection.
// ============================================================

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

const FORBIDDEN_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254',
  '::1', '[::1]', 'metadata.google.internal'
];

const FORBIDDEN_IP_PREFIXES = [
  '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
  '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
  '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.'
];

const FORBIDDEN_EXTENSIONS = [
  '.js', '.ts', '.html', '.htm', '.php', '.py', '.sh', '.bash',
  '.exe', '.bat', '.cmd', '.vbs', '.ps1', '.json', '.xml'
];

const SOCIAL_AND_UNRELATED_DOMAINS = [
  'youtube.com', 'youtu.be', 'youtube-nocookie.com', 'm.youtube.com',
  'instagram.com', 'cdninstagram.com', 'fbcdn.net', 'facebook.com', 'fb.com',
  'twitter.com', 'twimg.com', 't.co', 'x.com', 'pinterest.com', 'tiktok.com',
  'linkedin.com', 'licdn.com', 'vimeo.com', 'dailymotion.com'
];

const TRACKING_OR_PLACEHOLDER_KEYWORDS = [
  'pixel', 'tracking', 'avatar', 'spacer', '1x1', 'favicon', 'placeholder',
  'default-avatar', 'no-image'
];

export function validateImage(url: string, seenUrls: Set<string>, sourceField?: string): ValidationResult {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return { isValid: false, reason: 'Empty or missing URL' };
  }

  const clean = url.trim();

  // Duplicate Check
  if (seenUrls.has(clean)) {
    return { isValid: false, reason: 'Duplicate image URL' };
  }

  // Allow safe data URIs for manual uploads
  if (clean.startsWith('data:image/')) {
    if (!clean.match(/^data:image\/(jpeg|jpg|png|webp|gif|avif);base64,/i)) {
      return { isValid: false, reason: 'Unsupported or unsafe data URI image format' };
    }
    return { isValid: true };
  }

  // Allow internal RootX cached images
  if (clean.startsWith('/cached-images/') || clean.startsWith('cached-images/')) {
    return { isValid: true };
  }

  // Unsafe Scheme Check
  const lower = clean.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('ftp:') ||
    lower.startsWith('blob:')
  ) {
    return { isValid: false, reason: 'Forbidden or unsafe URL scheme' };
  }

  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return { isValid: false, reason: 'URL must use HTTP or HTTPS protocol' };
  }

  // SSRF & Private Host Checks
  try {
    const parsed = new URL(clean);
    const hostname = parsed.hostname.toLowerCase();

    if (!hostname.includes('.')) {
      return { isValid: false, reason: 'Invalid domain structure in URL' };
    }

    if (FORBIDDEN_HOSTS.includes(hostname) || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
      return { isValid: false, reason: 'Security violation: Localhost or internal host' };
    }

    for (const prefix of FORBIDDEN_IP_PREFIXES) {
      if (hostname.startsWith(prefix)) {
        return { isValid: false, reason: 'Security violation: Private network IP' };
      }
    }

    // Social & Unrelated Domain Check
    for (const dom of SOCIAL_AND_UNRELATED_DOMAINS) {
      if (hostname === dom || hostname.endsWith('.' + dom)) {
        console.log(`[Validator Audit] REJECTED social domain (${hostname}) from field "${sourceField || 'unknown'}": ${clean.slice(0, 70)}`);
        return { isValid: false, reason: `Rejected social network domain (${hostname})` };
      }
    }

    // Tracking or Placeholder Keyword Check
    const fullPathAndQuery = (parsed.pathname + parsed.search).toLowerCase();
    for (const kw of TRACKING_OR_PLACEHOLDER_KEYWORDS) {
      if (fullPathAndQuery.includes(kw)) {
        console.log(`[Validator Audit] REJECTED keyword (${kw}) from field "${sourceField || 'unknown'}": ${clean.slice(0, 70)}`);
        return { isValid: false, reason: `Rejected tracking or placeholder image keyword (${kw})` };
      }
    }

    // Malicious extension check in pathname
    const pathname = parsed.pathname.toLowerCase();
    for (const ext of FORBIDDEN_EXTENSIONS) {
      if (pathname.endsWith(ext)) {
        return { isValid: false, reason: `Security violation: Forbidden script extension (${ext})` };
      }
    }
  } catch {
    return { isValid: false, reason: 'Malformed URL structure' };
  }

  return { isValid: true };
}

/**
 * Checks if a given URL string is explicitly forbidden (e.g. YouTube, Instagram, Facebook) or invalid.
 */
export function isForbiddenOrExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const lower = url.trim().toLowerCase();

  for (const dom of SOCIAL_AND_UNRELATED_DOMAINS) {
    if (lower.includes(dom)) return true;
  }

  return false;
}

/**
 * Validates whether a candidate image URL is present inside the given ProductImageLibrary.
 */
export function isAllowedProductLibraryImage(
  url: string,
  imageLibrary?: { allValidImages?: Array<{ originalUrl?: string; normalizedUrl?: string; cachedUrl?: string; publicUrl?: string; id?: string }> }
): boolean {
  if (!url || isForbiddenOrExternalUrl(url)) return false;
  if (!imageLibrary?.allValidImages || imageLibrary.allValidImages.length === 0) return false;

  const clean = url.trim();
  return imageLibrary.allValidImages.some((img) =>
    img.id === clean ||
    img.originalUrl === clean ||
    img.normalizedUrl === clean ||
    img.cachedUrl === clean ||
    img.publicUrl === clean
  );
}

