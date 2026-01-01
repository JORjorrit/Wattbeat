// Social sharing utilities for Wattbeat Energy 2025

const DIFFICULTY_NAMES = ['Easy', 'Normal', 'Hard'];

/**
 * Generate share text for social media
 * @param {number} score - The player's score
 * @param {number} rank - The player's rank (optional)
 * @param {number} difficulty - The difficulty level (0-2)
 * @param {string} nickname - The player's nickname
 * @param {object} priceInfo - Price info at score time (optional) { price, dateStr, hour, priceStr }
 */
export function getShareText(score, rank, difficulty, nickname, priceInfo = null) {
  const diffName = DIFFICULTY_NAMES[difficulty] || 'Unknown';
  const rankText = rank ? `#${rank}` : '';
  
  // Format price info string if available
  let priceText = '';
  if (priceInfo && priceInfo.priceStr && priceInfo.dateStr) {
    priceText = `Made it to ${priceInfo.dateStr} at ${priceInfo.hour}:00 when prices hit ${priceInfo.priceStr} EUR/MWh! `;
  }
  
  const messages = [
    `I scored ${score} points on Wattbeat Energy 2025 ${diffName} mode! ${priceText}${rankText ? `Ranked ${rankText} globally! ` : ''}Can you beat me? 🚀⚡`,
    `Just flew through 2025 electricity prices and scored ${score}! ${priceText}${rankText ? `I'm ${rankText} on the ${diffName} leaderboard! ` : ''}⚡🎮`,
    `${score} points navigating volatile energy markets in Wattbeat! ${priceText}${rankText ? `${rankText} worldwide on ${diffName}! ` : ''}Think you can do better? 🔥`,
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(score, rank, difficulty, nickname, url, priceInfo = null) {
  const text = getShareText(score, rank, difficulty, nickname, priceInfo);
  const twitterUrl = new URL('https://twitter.com/intent/tweet');
  twitterUrl.searchParams.set('text', text);
  twitterUrl.searchParams.set('url', url);
  window.open(twitterUrl.toString(), '_blank', 'width=550,height=420');
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn(url) {
  const linkedInUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
  linkedInUrl.searchParams.set('url', url);
  window.open(linkedInUrl.toString(), '_blank', 'width=550,height=420');
}

/**
 * Share to Facebook
 */
export function shareToFacebook(url) {
  const fbUrl = new URL('https://www.facebook.com/sharer/sharer.php');
  fbUrl.searchParams.set('u', url);
  window.open(fbUrl.toString(), '_blank', 'width=550,height=420');
}

/**
 * Share to Reddit
 */
export function shareToReddit(score, rank, difficulty, nickname, url, priceInfo = null) {
  const title = getShareText(score, rank, difficulty, nickname, priceInfo);
  const redditUrl = new URL('https://www.reddit.com/submit');
  redditUrl.searchParams.set('url', url);
  redditUrl.searchParams.set('title', title);
  window.open(redditUrl.toString(), '_blank', 'width=550,height=420');
}

/**
 * Copy link to clipboard
 */
export async function copyToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (e) {
      return false;
    } finally {
      textArea.remove();
    }
  }
}

/**
 * Native share (mobile)
 */
export async function nativeShare(score, rank, difficulty, nickname, url, priceInfo = null) {
  if (!navigator.share) {
    return false;
  }
  
  try {
    await navigator.share({
      title: 'Wattbeat Energy 2025',
      text: getShareText(score, rank, difficulty, nickname, priceInfo),
      url: url
    });
    return true;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Share failed:', err);
    }
    return false;
  }
}

/**
 * Check if native share is available
 */
export function canNativeShare() {
  return typeof navigator.share === 'function';
}
