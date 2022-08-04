import { getMsToBeUpdated } from '../src/feedStatus'
import { Feed } from '../src/types'

describe('getMsToBeUpdated', () => {
  it('should return a value greater than 0 if the heartbeat is GREATER than the difference between current timestamp and last request timestamp)', () => {
    const currentTimestamp = 1638286984742
    const lastResultTimestamp = '1638285457'
    const heartbeat = '4500000'
    const feedFullName = 'outdated_feed'

    const msToBeUpdated = getMsToBeUpdated(currentTimestamp, {
      feedFullName,
      heartbeat,
      lastResultTimestamp
    })

    expect(msToBeUpdated).toBe(3272258)
  })

  it('should return a value smaller than 0 if the heartbeat is LOWER than the difference between current timestamp and last request timestamp', () => {
    const currentTimestamp = 1638286984742
    const lastResultTimestamp = '1638228502'
    const heartbeat = '4500000'
    const feedFullName = 'feed'

    const msToBeUpdated = getMsToBeUpdated(currentTimestamp, {
      feedFullName,
      heartbeat,
      lastResultTimestamp
    })

    expect(msToBeUpdated).toBe(-53682742)
  })
})
