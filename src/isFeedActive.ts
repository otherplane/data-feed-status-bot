import { TIME_TO_CONSIDER_FEED_INACTIVE_MS } from './constants'

export function isFeedActive (
  lastResultTimestamp: number,
  dateNow = Date.now()
): boolean {
  return lastResultTimestamp + TIME_TO_CONSIDER_FEED_INACTIVE_MS < dateNow
}

export default isFeedActive
