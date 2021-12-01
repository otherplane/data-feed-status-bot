import { isFeedOutdated } from '../src/isFeedOutdated'

describe('isFeedOutdated', () => {
  it('should return false if the heartbeat is GREATER than the difference between current timestamp and last request timestamp)', () => {
    const currentTimestamp = 1638286984742
    const lastRequestTimestamp = '1638285457'
    const heartbeat = '4500000'
    const feedFullName = 'outdated_feed'
    const requests = [{ timestamp: lastRequestTimestamp, feedFullName }]
    const isOutdated = isFeedOutdated(currentTimestamp, {
      heartbeat,
      requests,
      feedFullName
    })

    expect(isOutdated).toBe(false)
  })

  it('should return true if the heartbeat is LOWER than the difference between current timestamp and last request timestamp', () => {
    const currentTimestamp = 1638286984742
    const lastRequestTimestamp = '1638228502'
    const heartbeat = '4500000'
    const feedFullName = 'feed'
    const requests = [{ timestamp: lastRequestTimestamp, feedFullName }]
    const isOutdated = isFeedOutdated(currentTimestamp, {
      heartbeat,
      requests,
      feedFullName
    })

    expect(isOutdated).toBe(true)
  })
})
