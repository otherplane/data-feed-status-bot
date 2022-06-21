import { ADMISSIBLE_DELAY_MS } from './constants'
import { Feed } from './types'

export function isFeedOutdated (msToBeUpdated: number): boolean {
  return msToBeUpdated < 0
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
