import * as FetchFeedsApi from '../src/fetchFeedsApi'
import { GraphQLClient } from 'graphql-request'
import TelegramBot from 'node-telegram-bot-api'
import { DataFeedMonitor } from '../src/DataFeedMonitor'
import * as FeedStatus from '../src/feedStatus'
import { ApiSuccessResponse, Feed } from '../src/types'

const FEEDS: Array<Feed> = [
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname1',
    lastResultTimestamp: '1000',
    address: 'address1',
    lastResult: '1',
    name: 'name1',
    network: 'ethereum-mainnet'
  },
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname2',
    lastResultTimestamp: '1638461382000',
    address: '0x123456789abcdef123456789abcdef123456789a',
    lastResult: '2',
    name: 'name2',
    network: 'ethereum-rinkeby'
  }
]

const FEED_SINGLE_RESPONSE: ApiSuccessResponse = {
  feeds: {
    feeds: [
      {
        heartbeat: '1000',
        finality: '1',
        feedFullName: 'feedFullname2',
        lastResultTimestamp: '1000',
        address: '0x123456789abcdef123456789abcdef123456789a',
        lastResult: '2',
        name: 'name2',
        network: 'ethereum-goerli'
      }
    ]
  },
  total: 1
}
const FEED_SINGLE_RESPONSE_MAINNET: ApiSuccessResponse = {
  feeds: {
    feeds: [
      {
        heartbeat: '1000',
        finality: '1',
        feedFullName: 'feedFullname2mainnet',
        lastResultTimestamp: '1000',
        address: '0x123456789abcdef123456789abcdef123456789a',
        lastResult: '2',
        name: 'name2mainnet',
        network: 'ethereum-mainnet'
      }
    ]
  },
  total: 1
}

const FEED_SINGLE_RESPONSE_2: ApiSuccessResponse = {
  feeds: {
    feeds: [
      {
        heartbeat: '1000',
        finality: '1',
        feedFullName: 'feedFullname2',
        lastResultTimestamp: (1638461384 - 5000).toString(),
        address: '0x123456789abcdef123456789abcdef123456789a',
        lastResult: '2',
        name: 'name2',
        network: 'ethereum-goerli'
      }
    ]
  },
  total: 1
}

const FEED_MULTIPLE_RESPONSE: ApiSuccessResponse = {
  feeds: {
    feeds: FEEDS
  },
  total: 2
}
const FEEDS_ETHEREUM_RINKEBY: Array<Feed> = [
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname1',
    lastResultTimestamp: '1000',
    address: 'address1',
    lastResult: '1',
    name: 'name1',
    network: 'ethereum-rinkeby'
  },
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname2',
    lastResultTimestamp: '1000',
    address: '0x123456789abcdef123456789abcdef123456789a',
    lastResult: '2',
    name: 'name2',
    network: 'ethereum-rinkeby'
  }
]

const FEEDS_ETHEREUM_GOERLI: Array<Feed> = [
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname1',
    lastResultTimestamp: '1000',
    address: 'address1',
    lastResult: '1',
    name: 'name1',
    network: 'ethereum-goerli'
  },
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname2',
    lastResultTimestamp: '1000',
    address: '0x123456789abcdef123456789abcdef123456789a',
    lastResult: '2',
    name: 'name2',
    network: 'ethereum-goerli'
  }
]

const FEED_MULTIPLE_NETWORKS_RESPONSE: ApiSuccessResponse = {
  feeds: {
    feeds: [...FEEDS_ETHEREUM_GOERLI, ...FEEDS_ETHEREUM_RINKEBY]
  },
  total: 4
}

describe('DataFeedMonitor', () => {
  describe('.checkFeedStatus', () => {
    const graphqlClientMock = jest.fn()
    const telegramTestnetBotMock = { sendMessage: jest.fn() }
    const telegramMainnetBotMock = { sendMessage: jest.fn() }

    it('should call fetchFeedsApi with graphql client', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_MULTIPLE_RESPONSE))
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        {
          mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
          testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
        }
      )

      await dataFeedMonitor.checkFeedsStatus()

      expect(FetchFeedsApi.fetchFeedsApi).toBeCalledWith(graphqlClientMock)
    })

    it('should check if received feeds are outdated', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_MULTIPLE_RESPONSE))
      jest.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(false)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        {
          mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
          testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
        }
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(FeedStatus.isFeedOutdated).toHaveBeenNthCalledWith(
        1,
        -1638460383178
      )
      expect(FeedStatus.isFeedOutdated).toHaveBeenNthCalledWith(
        2,
        1636822920616822
      )
    })

    describe('should send the correct number of down feeds in the message', () => {
      describe('first time calling them', () => {
        it('should send a green message if all feeds are updated', async () => {
          jest
            .spyOn(FetchFeedsApi, 'fetchFeedsApi')
            .mockReturnValue(Promise.resolve(FEED_MULTIPLE_NETWORKS_RESPONSE))

          jest.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(false)
          const dataFeedMonitor = new DataFeedMonitor(
            (graphqlClientMock as unknown) as GraphQLClient,
            {
              mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
              testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
            }
          )
          const dateNow = 1638461384178

          await dataFeedMonitor.checkFeedsStatus(dateNow)

          expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
            expect.any(String),
            '*🟢 ethereum-goerli (2/2)*\n*🟢 ethereum-rinkeby (2/2)*',
            { parse_mode: 'Markdown' }
          )
        })

        it('should send a yellow message if some feeds are oudated', async () => {
          jest
            .spyOn(FetchFeedsApi, 'fetchFeedsApi')
            .mockReturnValue(Promise.resolve(FEED_MULTIPLE_NETWORKS_RESPONSE))

          jest
            .spyOn(FeedStatus, 'isFeedOutdated')
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
          const dataFeedMonitor = new DataFeedMonitor(
            (graphqlClientMock as unknown) as GraphQLClient,
            {
              mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
              testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
            }
          )
          const dateNow = 1638461384178

          await dataFeedMonitor.checkFeedsStatus(dateNow)

          expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
            expect.any(String),
            '*🟡 ethereum-goerli (1/2) > 3d*\n*🟡 ethereum-rinkeby (1/2) > 3d*',
            { parse_mode: 'Markdown' }
          )
        })

        it('should send a red message if all of them are outdated', async () => {
          jest
            .spyOn(FetchFeedsApi, 'fetchFeedsApi')
            .mockReturnValue(Promise.resolve(FEED_MULTIPLE_NETWORKS_RESPONSE))

          jest.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(true)
          const dataFeedMonitor = new DataFeedMonitor(
            (graphqlClientMock as unknown) as GraphQLClient,
            {
              mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
              testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
            }
          )
          const dateNow = 1638461384178

          await dataFeedMonitor.checkFeedsStatus(dateNow)

          expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
            expect.any(String),
            '*🔴 ethereum-goerli (0/2) > 3d*\n*🔴 ethereum-rinkeby (0/2) > 3d*',
            { parse_mode: 'Markdown' }
          )
        })
      })
    })

    describe('should send a telegram message if feed is outdated and its the first time checking that feed', () => {
      it('testnet', async () => {
        jest
          .spyOn(FetchFeedsApi, 'fetchFeedsApi')
          .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE))

        jest.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(true)
        const dataFeedMonitor = new DataFeedMonitor(
          (graphqlClientMock as unknown) as GraphQLClient,
          {
            mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
            testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
          }
        )
        const dateNow = 1638461384178

        await dataFeedMonitor.checkFeedsStatus(dateNow)

        expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
          expect.any(String),
          '*🔴 ethereum-goerli (0/1) > 3d*',
          { parse_mode: 'Markdown' }
        )
      })

      it('mainnet', async () => {
        jest
          .spyOn(FetchFeedsApi, 'fetchFeedsApi')
          .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE_MAINNET))

        jest.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(true)
        const dataFeedMonitor = new DataFeedMonitor(
          (graphqlClientMock as unknown) as GraphQLClient,
          {
            mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
            testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
          }
        )
        const dateNow = 1638461384178

        await dataFeedMonitor.checkFeedsStatus(dateNow)

        expect(telegramMainnetBotMock.sendMessage).toBeCalledWith(
          expect.any(String),
          '*🔴 ethereum-mainnet (0/1) > 3d*',
          { parse_mode: 'Markdown' }
        )
      })
    })

    it('should send a telegram message if feed is outdated and its status has change from last call', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE))
      jest
        .spyOn(FeedStatus, 'isFeedOutdated')
        .mockReturnValue(false)
        .mockReturnValueOnce(true)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        {
          mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
          testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
        }
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
        expect.any(String),
        '*🔴 ethereum-goerli (0/1) > 3d*',
        { parse_mode: 'Markdown' }
      )
    })

    it('should send a telegram message if feed is outdated and its status has change from last call with exact time', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE_2))
      jest
        .spyOn(FeedStatus, 'isFeedOutdated')
        .mockReturnValue(false)
        .mockReturnValueOnce(true)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        {
          mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
          testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
        }
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
        expect.any(String),
        '*🔴 ethereum-goerli (0/1) 1h 23m*',
        { parse_mode: 'Markdown' }
      )
    })

    it('should send a telegram message if feed is NOT outdated and is the first time checking that feed', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE))
      jest.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(false)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        {
          mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
          testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
        }
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)
      await dataFeedMonitor.checkFeedsStatus(dateNow + 10000)

      expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
        expect.any(String),
        '*🟢 ethereum-goerli (1/1)*',
        { parse_mode: 'Markdown' }
      )
    })

    it('should NOT send a telegram message if feed is outdated and last check was also outdated', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE))
      jest.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(true)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        {
          mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
          testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
        },
        // pass a state where last response to feedFullName was outdated
        {
          'ethereum-goerli': {
            [FEED_SINGLE_RESPONSE.feeds.feeds[0].feedFullName]: {
              isOutdated: true,
              msToBeUpdated: -100000,
              statusChanged: false,
              isMainnet: false
            }
          }
        }
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(telegramTestnetBotMock.sendMessage).not.toBeCalled()
    })

    it('should NOT send a telegram message if feed is NOT outdated and last check was also NOT outdated', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE))
      jest
        .spyOn(FeedStatus, 'isFeedOutdated')
        .mockReturnValue(false)
        .mockReturnValue(false)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        {
          mainnetBot: (telegramMainnetBotMock as unknown) as TelegramBot,
          testnetBot: (telegramTestnetBotMock as unknown) as TelegramBot
        },
        // pass a state where last response to feedFullName was NOT outdated
        {
          'ethereum-goerli': {
            [FEED_SINGLE_RESPONSE.feeds.feeds[0].feedFullName]: {
              isOutdated: false,
              msToBeUpdated: 100000,
              statusChanged: false,
              isMainnet: false
            }
          }
        }
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow + 10000)

      expect(telegramTestnetBotMock.sendMessage).not.toBeCalled()
    })
  })
})
