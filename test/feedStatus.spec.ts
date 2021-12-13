import { getMsToBeUpdated } from '../src/feedStatus'

describe('getMsToBeUpdated', () => {
  it('should return false if the heartbeat is GREATER than the difference between current timestamp and last request timestamp)', () => {
    const currentTimestamp = 1638286984742
    const lastRequestTimestamp = '1638285457'
    const heartbeat = '4500000'
    const finality = '10000'
    const feedFullName = 'outdated_feed'
    const requests = [{ timestamp: lastRequestTimestamp, feedFullName }]
    const msToBeUpdated = getMsToBeUpdated(currentTimestamp, {
      heartbeat,
      finality,
      requests,
      feedFullName
    })
    expect(msToBeUpdated).toBe(4109758)
  })

  it('should return true if the heartbeat is LOWER than the difference between current timestamp and last request timestamp', () => {
    const currentTimestamp = 1638286984742
    const lastRequestTimestamp = '1638228502'
    const heartbeat = '4500000'
    const finality = '10000'
    const feedFullName = 'feed'
    const requests = [{ timestamp: lastRequestTimestamp, feedFullName }]
    const isOutdated = getMsToBeUpdated(currentTimestamp, {
      heartbeat,
      finality,
      requests,
      feedFullName
    })

    expect(isOutdated).toBe(-52845242)
  })
})