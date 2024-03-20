import { formatDelayString } from '../src/DataFeedMonitor.js'

describe('formatDelayString', () => {
  it('5 min', () => {
    const delayString = formatDelayString(1000, 5 * 60 * 1000)

    expect(delayString).toBe('5m')
  })

  it('25 min', () => {
    const delayString = formatDelayString(20 * 60 * 1000, 5 * 60 * 1000)

    expect(delayString).toBe('25m')
  })

  it('1 hour', () => {
    const delayString = formatDelayString(60 * 60 * 1000, 5 * 60 * 1000)

    expect(delayString).toBe('> 1h')
  })

  it('1 day', () => {
    const delayString = formatDelayString(24 * 60 * 60 * 1000, 5 * 60 * 1000)

    expect(delayString).toBe('> 1d')
  })

  it('more than requested days', () => {
    const delayString = formatDelayString(
      8 * 24 * 60 * 60 * 1000,
      5 * 60 * 1000
    )

    expect(delayString).toBe('> 7d')
  })

  it('more than requested days big ', () => {
    const delayString = formatDelayString(
      1000 * 24 * 60 * 60 * 1000,
      5 * 60 * 1000
    )

    expect(delayString).toBe('> 7d')
  })
})
