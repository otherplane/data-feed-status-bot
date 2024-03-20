import createGlobalStatusMessage from '../src/createGlobalStatusMessage.js'
import { GlobalStatusEmoji, Network, State } from '../src/types.js'

describe('createGlobalStatusMessage', () => {
  describe('should include the right color', () => {
    it('should include a green hearth if all feeds are working', () => {
      const state: State = {
        'ethereum-goerli': {
          'ethereum-goerli_btc-usd_6': {
            isOutdated: false,
            msToBeUpdated: 20668617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          }
        },
        'ethereum-rinkeby': {
          'ethereum-rinkeby_btc-usd_6': {
            isOutdated: false,
            msToBeUpdated: 20848617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          },
          'ethereum-rinkeby_eth-usd_6': {
            isOutdated: false,
            msToBeUpdated: 22828617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          }
        }
      }

      const message = createGlobalStatusMessage(state, Network.Testnet)

      expect(message.includes(GlobalStatusEmoji.Green)).toBe(true)
    })

    it('should include a yellow hearth if some feeds are outdated but and they are active', () => {
      const state: State = {
        'ethereum-goerli': {
          'ethereum-goerli_btc-usd_6': {
            isOutdated: true,
            msToBeUpdated: 20668617,
            statusChanged: false,
            isMainnet: false,
            isActive: false
          }
        },
        'ethereum-rinkeby': {
          'ethereum-rinkeby_btc-usd_6': {
            isOutdated: true,
            msToBeUpdated: 20848617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          },
          'ethereum-rinkeby_eth-usd_6': {
            isOutdated: false,
            msToBeUpdated: 22828617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          }
        },
        'ethereum-mainnet': {
          'ethereum-mainnet_btc-usd_6': {
            isOutdated: false,
            msToBeUpdated: -4650826383,
            statusChanged: false,
            isMainnet: true,
            isActive: false
          }
        }
      }

      const message = createGlobalStatusMessage(state, Network.Testnet)

      expect(message.includes(GlobalStatusEmoji.Yellow)).toBe(true)
    })

    it('should include a green hearth if some feeds are outdated but and they are not active', () => {
      const state: State = {
        'ethereum-goerli': {
          'ethereum-goerli_btc-usd_6': {
            isOutdated: true,
            msToBeUpdated: 20668617,
            statusChanged: false,
            isMainnet: false,
            isActive: false
          }
        },
        'ethereum-rinkeby': {
          'ethereum-rinkeby_btc-usd_6': {
            isOutdated: false,
            msToBeUpdated: 20848617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          },
          'ethereum-rinkeby_eth-usd_6': {
            isOutdated: false,
            msToBeUpdated: 22828617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          }
        }
      }

      const message = createGlobalStatusMessage(state, Network.Testnet)

      expect(message.includes(GlobalStatusEmoji.Green)).toBe(true)
    })

    it('should include a red hearth if a network is down and their feeds are active', () => {
      const state: State = {
        'ethereum-goerli': {
          'ethereum-goerli_btc-usd_6': {
            isOutdated: true,
            msToBeUpdated: 20668617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          }
        },
        'ethereum-rinkeby': {
          'ethereum-rinkeby_btc-usd_6': {
            isOutdated: true,
            msToBeUpdated: 20848617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          },
          'ethereum-rinkeby_eth-usd_6': {
            isOutdated: false,
            msToBeUpdated: 22828617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          }
        }
      }

      const message = createGlobalStatusMessage(state, Network.Testnet)

      expect(message.includes(GlobalStatusEmoji.Red)).toBe(true)
    })
  })

  describe('should count only mainnet / testnet feeds', () => {
    it('should ignore mainnet feeds if testnet param is passed', () => {
      const state: State = {
        'ethereum-mainnet': {
          'ethereum-mainnet_btc-usd_6': {
            isOutdated: true,
            msToBeUpdated: 20668617,
            statusChanged: false,
            isMainnet: true,
            isActive: true
          }
        },
        'ethereum-rinkeby': {
          'ethereum-rinkeby_btc-usd_6': {
            isOutdated: true,
            msToBeUpdated: 20848617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          },
          'ethereum-rinkeby_eth-usd_6': {
            isOutdated: false,
            msToBeUpdated: 22828617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          }
        }
      }

      const message = createGlobalStatusMessage(state, Network.Testnet)

      expect(message.includes('1 / 2')).toBeTruthy()
    })

    it('should ignore testnet feeds if mainnet param is passed', () => {
      const state: State = {
        'ethereum-mainnet': {
          'ethereum-mainnet_btc-usd_6': {
            isOutdated: true,
            msToBeUpdated: 20668617,
            statusChanged: false,
            isMainnet: true,
            isActive: true
          }
        },
        'ethereum-rinkeby': {
          'ethereum-rinkeby_btc-usd_6': {
            isOutdated: true,
            msToBeUpdated: 20848617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          },
          'ethereum-rinkeby_eth-usd_6': {
            isOutdated: false,
            msToBeUpdated: 22828617,
            statusChanged: false,
            isMainnet: false,
            isActive: true
          }
        }
      }

      const message = createGlobalStatusMessage(state, Network.Mainnet)

      expect(message.includes('0 / 1')).toBeTruthy()
    })
  })

  it('should count outdated feeds from the total number of feeds', () => {
    const state: State = {
      'ethereum-mainnet': {
        'ethereum-mainnet_btc-usd_6': {
          isOutdated: true,
          msToBeUpdated: 20668617,
          statusChanged: false,
          isMainnet: true,
          isActive: true
        }
      },
      'ethereum-rinkeby': {
        'ethereum-rinkeby_btc-usd_6': {
          isOutdated: true,
          msToBeUpdated: 20848617,
          statusChanged: false,
          isMainnet: false,
          isActive: true
        },
        'ethereum-rinkeby_eth-usd_6': {
          isOutdated: false,
          msToBeUpdated: 22828617,
          statusChanged: false,
          isMainnet: false,
          isActive: true
        }
      }
    }

    const message = createGlobalStatusMessage(state, Network.Testnet)

    expect(message).toBe('💛 1 / 2')
  })
})
