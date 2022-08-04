import { isFeedActive } from '../src/feedStatus'
import { TIME_TO_CONSIDER_FEED_INACTIVE_MS } from '../src/constants'

describe('isFeedActive', () => {
  it('should return false if last update timestamp is greater than number of days specified as constant', () => {
    const currentTimestamp = 1638286984742000
    const lastResultTimestamp =
      currentTimestamp - (TIME_TO_CONSIDER_FEED_INACTIVE_MS + 1)

    const isActive = isFeedActive(lastResultTimestamp, currentTimestamp)

    expect(isActive).toBe(false)
  })

  it('should return true if last update timestamp is lower than number of days specified as constant', () => {
    const currentTimestamp = 1638286984742000
    const lastResultTimestamp =
      currentTimestamp - (TIME_TO_CONSIDER_FEED_INACTIVE_MS - 1)

    const isActive = isFeedActive(lastResultTimestamp, currentTimestamp)

    expect(isActive).toBe(true)
  })
})
