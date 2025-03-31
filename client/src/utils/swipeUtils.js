/**
 * Utility functions for handling swipe gestures
 */

// Check if swipe distance meets minimum threshold
export const isValidSwipe = (startX, endX, minDistance) => {
  return Math.abs(endX - startX) >= minDistance;
};

// Determine swipe direction
export const getSwipeDirection = (startX, endX) => {
  return startX < endX ? 'right' : 'left';
};

// Check if touch is within edge zone
export const isTouchInEdgeZone = (touchX, zoneWidth, fromRight = false) => {
  if (fromRight) {
    return window.innerWidth - touchX <= zoneWidth;
  }
  return touchX <= zoneWidth;
};

// Prevent default behavior for touch events
export const preventTouchDefault = (event) => {
  if (event.cancelable) {
    event.preventDefault();
  }
}; 