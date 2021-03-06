import { getMsToBeUpdated } from '../src/feedStatus'
import { Feed } from '../src/types'

describe('getMsToBeUpdated', () => {
  it('should return false if the heartbeat is GREATER than the difference between current timestamp and last request timestamp)', () => {
    const currentTimestamp = 1638286984742
    const lastResultTimestamp = '1638285457'
    const heartbeat = '4500000'
    const feedFullName = 'outdated_feed'

    const msToBeUpdated = getMsToBeUpdated(currentTimestamp, {
      feedFullName,
      heartbeat,
      lastResultTimestamp
    })

    expect(msToBeUpdated).toBe(2972258)
  })

  it('should return true if the heartbeat is LOWER than the difference between current timestamp and last request timestamp', () => {
    const currentTimestamp = 1638286984742
    const lastResultTimestamp = '1638228502'
    const heartbeat = '4500000'
    const feedFullName = 'feed'

    const isOutdated =
      getMsToBeUpdated(currentTimestamp, {
        feedFullName,
        heartbeat,
        lastResultTimestamp
      }) < 0

    expect(isOutdated).toBe(true)
  })
})
