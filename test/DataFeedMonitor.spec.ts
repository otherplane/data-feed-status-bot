import * as FetchFeedsApi from '../src/fetchFeedsApi.js'
import { GraphQLClient } from 'graphql-request'
import TelegramBot from 'node-telegram-bot-api'
import { DataFeedMonitor } from '../src/DataFeedMonitor.js'
import * as FeedStatus from '../src/feedStatus.js'
import { Feed } from '../src/types.js'

const FEEDS: Array<Feed> = [
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname1',
    lastResultTimestamp: '1000',
    address: 'address1',
    lastResult: '1',
    name: 'name1',
    network: 'ethereum-mainnet',
    isRouted: false,
  },
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname2',
    lastResultTimestamp: '1638461382000',
    address: '0x123456789abcdef123456789abcdef123456789a',
    lastResult: '2',
    name: 'name2',
    network: 'ethereum-rinkeby',
    isRouted: false,
  },
]

const SINGLE_FEED_GOERLI: Array<Feed> = [
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname2',
    lastResultTimestamp: '1000',
    address: '0x123456789abcdef123456789abcdef123456789a',
    lastResult: '2',
    name: 'name2',
    network: 'ethereum-goerli',
    isRouted: false,
  },
]

const FEEDS_ETHEREUM_RINKEBY: Array<Feed> = [
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname1',
    lastResultTimestamp: '1000',
    address: 'address1',
    lastResult: '1',
    name: 'name1',
    network: 'ethereum-rinkeby',
    isRouted: false,
  },
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname2',
    lastResultTimestamp: '1000',
    address: '0x123456789abcdef123456789abcdef123456789a',
    lastResult: '2',
    name: 'name2',
    network: 'ethereum-rinkeby',
    isRouted: false,
  },
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
    network: 'ethereum-goerli',
    isRouted: false,
  },
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname2',
    lastResultTimestamp: '1000',
    address: '0x123456789abcdef123456789abcdef123456789a',
    lastResult: '2',
    name: 'name2',
    network: 'ethereum-goerli',
    isRouted: false,
  },
]

const FEEDS_MULTIPLE_NETWORKS: Array<Feed> = [
  ...FEEDS_ETHEREUM_GOERLI,
  ...FEEDS_ETHEREUM_RINKEBY,
]

describe('DataFeedMonitor', () => {
  describe('.checkFeedStatus', () => {
    const graphqlClientMock = vi.fn()
    const telegramTestnetBotMock = { sendMessage: vi.fn() }
    const telegramMainnetBotMock = { sendMessage: vi.fn() }

    it('should call fetchFeedsApi with graphql client', async () => {
      vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
        Promise.resolve(FEEDS),
      )
      const dataFeedMonitor = new DataFeedMonitor(
        graphqlClientMock as unknown as GraphQLClient,
        {
          mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
          testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
        },
      )

      await dataFeedMonitor.checkFeedsStatus()

      expect(FetchFeedsApi.fetchFeedsApi).toBeCalledWith(graphqlClientMock)
    })

    it('should check if received feeds are outdated', async () => {
      vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
        Promise.resolve(FEEDS),
      )
      vi.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(false)
      vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
      const dataFeedMonitor = new DataFeedMonitor(
        graphqlClientMock as unknown as GraphQLClient,
        {
          mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
          testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
        },
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(FeedStatus.isFeedOutdated).toHaveBeenNthCalledWith(
        1,
        -1638460083178,
      )
      expect(FeedStatus.isFeedOutdated).toHaveBeenNthCalledWith(
        2,
        1636822920916822,
      )
    })

    describe('should send the correct number of down feeds in the message', () => {
      describe('first time calling them', () => {
        it('should send a black message if all feeds are inactive', async () => {
          vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
            Promise.resolve(FEEDS_MULTIPLE_NETWORKS),
          )

          vi.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(false)
          vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(false)
          const dataFeedMonitor = new DataFeedMonitor(
            graphqlClientMock as unknown as GraphQLClient,
            {
              mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
              testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
            },
          )
          const dateNow = 1638461384178

          await dataFeedMonitor.checkFeedsStatus(dateNow)

          expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
            expect.any(String),
            `💚 0 / 0\n\n*⚫ ethereum.goerli 0/2*\n*⚫ ethereum.rinkeby 0/2*`,
            { parse_mode: 'Markdown' },
          )
        })
        it('should send a yellow message if only some feeds are inactive', async () => {
          vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
            Promise.resolve(FEEDS_MULTIPLE_NETWORKS),
          )

          vi.spyOn(FeedStatus, 'isFeedOutdated')
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
          vi.spyOn(FeedStatus, 'isFeedActive')
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
          const dataFeedMonitor = new DataFeedMonitor(
            graphqlClientMock as unknown as GraphQLClient,
            {
              mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
              testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
            },
          )
          const dateNow = 1638461384178

          await dataFeedMonitor.checkFeedsStatus(dateNow)

          expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
            expect.any(String),
            `💛 2 / 4\n\n*🟡 ethereum.goerli 1/2 (> 7d)*\n*🟡 ethereum.rinkeby 1/2 (> 7d)*`,
            { parse_mode: 'Markdown' },
          )
        })
        it('should send a green message if all feeds are updated', async () => {
          vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
            Promise.resolve(FEEDS_MULTIPLE_NETWORKS),
          )

          vi.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(false)
          vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
          const dataFeedMonitor = new DataFeedMonitor(
            graphqlClientMock as unknown as GraphQLClient,
            {
              mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
              testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
            },
          )
          const dateNow = 1638461384178

          await dataFeedMonitor.checkFeedsStatus(dateNow)

          expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
            expect.any(String),
            `💚 4 / 4\n\n*🟢 ethereum.goerli 2/2*\n*🟢 ethereum.rinkeby 2/2*`,
            { parse_mode: 'Markdown' },
          )
        })

        it('should send a yellow message if some feeds are oudated', async () => {
          vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
            Promise.resolve(FEEDS_MULTIPLE_NETWORKS),
          )

          vi.spyOn(FeedStatus, 'isFeedOutdated')
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
          vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
          const dataFeedMonitor = new DataFeedMonitor(
            graphqlClientMock as unknown as GraphQLClient,
            {
              mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
              testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
            },
          )
          const dateNow = 1638461384178

          await dataFeedMonitor.checkFeedsStatus(dateNow)

          expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
            expect.any(String),
            `💛 2 / 4\n\n*🟡 ethereum.goerli 1/2 (> 7d)*\n*🟡 ethereum.rinkeby 1/2 (> 7d)*`,
            { parse_mode: 'Markdown' },
          )
        })

        it('should send a red message if all of them are outdated', async () => {
          vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
            Promise.resolve(FEEDS_MULTIPLE_NETWORKS),
          )

          vi.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(true)
          vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
          const dataFeedMonitor = new DataFeedMonitor(
            graphqlClientMock as unknown as GraphQLClient,
            {
              mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
              testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
            },
          )
          const dateNow = 1638461384178

          await dataFeedMonitor.checkFeedsStatus(dateNow)

          expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
            expect.any(String),
            `❤️ 0 / 4\n\n*🔴 ethereum.goerli 0/2 (> 7d)*\n*🔴 ethereum.rinkeby 0/2 (> 7d)*`,
            { parse_mode: 'Markdown' },
          )
        })
      })
    })

    describe('should send a telegram message if feed is outdated and its the first time checking that feed', () => {
      it('testnet', async () => {
        vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
          Promise.resolve(SINGLE_FEED_GOERLI),
        )

        vi.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(true)
        vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
        const dataFeedMonitor = new DataFeedMonitor(
          graphqlClientMock as unknown as GraphQLClient,
          {
            mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
            testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
          },
        )
        const dateNow = 1638461384178

        await dataFeedMonitor.checkFeedsStatus(dateNow)

        expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
          expect.any(String),
          `❤️ 0 / 1\n\n*🔴 ethereum.goerli 0/1 (> 7d)*`,
          { parse_mode: 'Markdown' },
        )
      })

      it('mainnet', async () => {
        vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
          Promise.resolve([
            {
              heartbeat: '1000',
              finality: '1',
              feedFullName: 'feedFullname2mainnet',
              lastResultTimestamp: '1000',
              address: '0x123456789abcdef123456789abcdef123456789a',
              lastResult: '2',
              name: 'name2mainnet',
              network: 'ethereum-mainnet',
              isRouted: false,
            },
          ]),
        )

        vi.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(true)
        vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
        const dataFeedMonitor = new DataFeedMonitor(
          graphqlClientMock as unknown as GraphQLClient,
          {
            mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
            testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
          },
        )
        const dateNow = 1638461384178

        await dataFeedMonitor.checkFeedsStatus(dateNow)

        expect(telegramMainnetBotMock.sendMessage).toBeCalledWith(
          expect.any(String),
          `❤️ 0 / 1\n\n*🔴 ethereum.mainnet 0/1 (> 7d)*`,
          { parse_mode: 'Markdown' },
        )
      })
    })

    it('should send a telegram message if feed is outdated and its status has change from last call', async () => {
      vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
        Promise.resolve(SINGLE_FEED_GOERLI),
      )
      vi.spyOn(FeedStatus, 'isFeedOutdated')
        .mockReturnValue(false)
        .mockReturnValueOnce(true)
      vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
      const dataFeedMonitor = new DataFeedMonitor(
        graphqlClientMock as unknown as GraphQLClient,
        {
          mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
          testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
        },
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
        expect.any(String),
        `❤️ 0 / 1\n\n*🔴 ethereum.goerli 0/1 (> 7d)*`,
        { parse_mode: 'Markdown' },
      )
    })

    it('should send a telegram message if feed is outdated and its status has change from last call with exact time', async () => {
      vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
        Promise.resolve([
          {
            heartbeat: '1000',
            finality: '1',
            feedFullName: 'feedFullname2',
            lastResultTimestamp: (1638461384 - 5000).toString(),
            address: '0x123456789abcdef123456789abcdef123456789a',
            lastResult: '2',
            name: 'name2',
            network: 'ethereum-goerli',
            isRouted: false,
          },
        ]),
      )
      vi.spyOn(FeedStatus, 'isFeedOutdated')
        .mockReturnValue(false)
        .mockReturnValueOnce(true)
      vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
      const dataFeedMonitor = new DataFeedMonitor(
        graphqlClientMock as unknown as GraphQLClient,
        {
          mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
          testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
        },
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
        expect.any(String),
        `❤️ 0 / 1\n\n*🔴 ethereum.goerli 0/1 (> 1h)*`,
        { parse_mode: 'Markdown' },
      )
    })

    it('should send a telegram message if feed is NOT outdated and is the first time checking that feed', async () => {
      vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
        Promise.resolve(SINGLE_FEED_GOERLI),
      )
      vi.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(false)
      vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
      const dataFeedMonitor = new DataFeedMonitor(
        graphqlClientMock as unknown as GraphQLClient,
        {
          mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
          testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
        },
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)
      await dataFeedMonitor.checkFeedsStatus(dateNow + 10000)

      expect(telegramTestnetBotMock.sendMessage).toBeCalledWith(
        expect.any(String),
        `💚 1 / 1\n\n*🟢 ethereum.goerli 1/1*`,
        { parse_mode: 'Markdown' },
      )
    })

    it('should NOT send a telegram message if feed is outdated and last check was also outdated', async () => {
      vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
        Promise.resolve(SINGLE_FEED_GOERLI),
      )
      vi.spyOn(FeedStatus, 'isFeedOutdated').mockReturnValue(true)
      vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
      const dataFeedMonitor = new DataFeedMonitor(
        graphqlClientMock as unknown as GraphQLClient,
        {
          mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
          testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
        },
        // pass a state where last response to feedFullName was outdated
        {
          'ethereum-goerli': {
            [SINGLE_FEED_GOERLI[0].feedFullName]: {
              isOutdated: true,
              msToBeUpdated: -100000,
              statusChanged: false,
              isMainnet: false,
              isActive: true,
            },
          },
        },
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(telegramTestnetBotMock.sendMessage).not.toBeCalled()
    })

    it('should NOT send a telegram message if feed is NOT outdated and last check was also NOT outdated', async () => {
      vi.spyOn(FetchFeedsApi, 'fetchFeedsApi').mockReturnValue(
        Promise.resolve(SINGLE_FEED_GOERLI),
      )
      vi.spyOn(FeedStatus, 'isFeedOutdated')
        .mockReturnValue(false)
        .mockReturnValue(false)
      vi.spyOn(FeedStatus, 'isFeedActive').mockReturnValue(true)
      const dataFeedMonitor = new DataFeedMonitor(
        graphqlClientMock as unknown as GraphQLClient,
        {
          mainnetBot: telegramMainnetBotMock as unknown as TelegramBot,
          testnetBot: telegramTestnetBotMock as unknown as TelegramBot,
        },
        // pass a state where last response to feedFullName was NOT outdated
        {
          'ethereum-goerli': {
            [SINGLE_FEED_GOERLI[0].feedFullName]: {
              isOutdated: false,
              msToBeUpdated: 100000,
              statusChanged: false,
              isMainnet: false,
              isActive: true,
            },
          },
        },
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow + 10000)

      expect(telegramTestnetBotMock.sendMessage).not.toBeCalled()
    })
  })
})
