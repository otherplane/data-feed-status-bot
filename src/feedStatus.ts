import { ADMISSIBLE_DELAY_MS } from './constants'
import { TIME_TO_CONSIDER_FEED_INACTIVE_MS } from './constants'
import { Feed } from './types'

export function isFeedOutdated (msToBeUpdated: number): boolean {
  return msToBeUpdated < 0
}

export function isFeedActive (
  lastResultTimestamp: number,
  dateNow = Date.now()
): boolean {
  return dateNow - lastResultTimestamp < TIME_TO_CONSIDER_FEED_INACTIVE_MS
}

export function getMsToBeUpdated (
  dateNow: number,
  {
    heartbeat,
    lastResultTimestamp
  }: Pick<Feed, 'heartbeat' | 'lastResultTimestamp' | 'feedFullName'>
) {
  const msSinceLastUpdate = dateNow - Number(lastResultTimestamp) * 1000
  return Number(heartbeat) + ADMISSIBLE_DELAY_MS - msSinceLastUpdate
}
