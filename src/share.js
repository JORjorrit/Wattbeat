// Social sharing utilities for CaveFlyer Energy 2025

const DIFFICULTY_NAMES = ['Easy', 'Normal', 'Hard'];

/**
 * Generate share text for social media
 */
export function getShareText(score, rank, difficulty, nickname) {
  const diffName = DIFFICULTY_NAMES[difficulty] || 'Unknown';
  const rankText = rank ? `#${rank}` : '';
  
  const messages = [
    `I scored ${score} points on CaveFlyer Energy 2025 ${diffName} mode! ${rankText ? `Ranked ${rankText} globally!` : ''} Can you beat me? 🚀⚡`,
    `Just flew through 2025 electricity prices and scored ${score}! ${rankText ? `I'm ${rankText} on the ${diffName} leaderboard!` : ''} ⚡🎮`,
    `${score} points navigating volatile energy markets in CaveFlyer! ${rankText ? `${rankText} worldwide on ${diffName}!` : ''} Think you can do better? 🔥`,
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(score, rank, difficulty, nickname, url) {
  const text = getShareText(score, rank, difficulty, nickname);
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
export function shareToReddit(score, rank, difficulty, nickname, url) {
  const title = getShareText(score, rank, difficulty, nickname);
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
export async function nativeShare(score, rank, difficulty, nickname, url) {
  if (!navigator.share) {
    return false;
  }
  
  try {
    await navigator.share({
      title: 'CaveFlyer Energy 2025',
      text: getShareText(score, rank, difficulty, nickname),
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

