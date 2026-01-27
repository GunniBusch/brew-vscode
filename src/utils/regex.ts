/**
 * Detects the `sha256` declaration in Homebrew Formulae/Casks.
 * Captures the checksum string inside quotes.
 * Matches: sha256 "..." or sha256 '...'
 * Supporting:
 * - Standard 64-char hex
 * - Empty strings (for invalid/template state)
 * - Partial/Invalid strings (for correction)
 */
export const SHA256_REGEX = /sha256\s+['"]([^'"]*)['"]/;

/**
 * Detects the `url` declaration in Homebrew Formulae/Casks.
 * Captures the URL string inside quotes.
 * Matches: url "..." or url '...'
 */
export const URL_REGEX = /url\s+['"]([^'"]+)['"]/;
