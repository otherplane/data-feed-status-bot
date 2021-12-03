import * as FetchFeedsApi from '../src/fetchFeedsApi'
import { GraphQLClient } from 'graphql-request'
import TelegramBot from 'node-telegram-bot-api'
import { DataFeedMonitor } from '../src/DataFeedMonitor'
import * as IsFeedOutdated from '../src/isFeedOutdated'

const FEEDS = [
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname1',
    requests: [{ feedFullName: 'feedFullName1', timestamp: '1000' }]
  },
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname2',
    requests: [{ feedFullName: 'feedFullName2', timestamp: '1000' }]
  }
]

const FEED_SINGLE_RESPONSE = {
  feeds: {
    feeds: [
      {
        heartbeat: '1000',
        finality: '1',
        feedFullName: 'feedFullname2',
        requests: [{ feedFullName: 'feedFullName2', timestamp: '1000' }]
      }
    ]
  },
  total: 1
}

const FEED_MULTIPLE_RESPONSE = {
  feeds: {
    feeds: FEEDS
  },
  total: 2
}

describe('DataFeedMonitor', () => {
  describe('.checkFeedStatus', () => {
    const graphqlClientMock = jest.fn()
    const telegramBotMock = { sendMessage: jest.fn() }

    it('should call fetchFeedsApi with graphql client', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_MULTIPLE_RESPONSE))
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        (telegramBotMock as unknown) as TelegramBot
      )

      await dataFeedMonitor.checkFeedsStatus()

      expect(FetchFeedsApi.fetchFeedsApi).toBeCalledWith(graphqlClientMock)
    })

    it('should check if received feeds are outdated', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_MULTIPLE_RESPONSE))
      jest.spyOn(IsFeedOutdated, 'isFeedOutdated').mockReturnValue(false)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        (telegramBotMock as unknown) as TelegramBot
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(IsFeedOutdated.isFeedOutdated).toHaveBeenNthCalledWith(
        1,
        dateNow,
        FEEDS[0]
      )
      expect(IsFeedOutdated.isFeedOutdated).toHaveBeenNthCalledWith(
        2,
        dateNow,
        FEEDS[1]
      )
    })

    it('should send a telegram message if feed is outdated and its the first time checking that feed', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE))

      jest.spyOn(IsFeedOutdated, 'isFeedOutdated').mockReturnValue(true)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        (telegramBotMock as unknown) as TelegramBot
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(telegramBotMock.sendMessage).toBeCalledWith(
        expect.any(String),
        'feedFullname2 is outdated ❌'
      )
    })

    it('should send a telegram message if feed is outdated and its status has change from last call', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE))
      jest
        .spyOn(IsFeedOutdated, 'isFeedOutdated')
        .mockReturnValue(false)
        .mockReturnValueOnce(true)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        (telegramBotMock as unknown) as TelegramBot
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)
      await dataFeedMonitor.checkFeedsStatus(dateNow + 10000)

      expect(telegramBotMock.sendMessage).toBeCalledWith(
        expect.any(String),
        'feedFullname2 is outdated ❌'
      )
    })

    it('should send a telegram message if feed is NOT outdated and is the first time checking that feed', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE))
      jest.spyOn(IsFeedOutdated, 'isFeedOutdated').mockReturnValue(false)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        (telegramBotMock as unknown) as TelegramBot
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)
      await dataFeedMonitor.checkFeedsStatus(dateNow + 10000)

      expect(telegramBotMock.sendMessage).toBeCalledWith(
        expect.any(String),
        'feedFullname2 is updated ✅'
      )
    })

    it('should NOT send a telegram message if feed is outdated and last check was also outdated', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE))
      jest.spyOn(IsFeedOutdated, 'isFeedOutdated').mockReturnValue(true)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        (telegramBotMock as unknown) as TelegramBot,
        // pass a state where last response to feedFullName was outdated
        { [FEED_SINGLE_RESPONSE.feeds.feeds[0].feedFullName]: true }
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow)

      expect(telegramBotMock.sendMessage).not.toBeCalled()
    })

    it('should NOT send a telegram message if feed is NOT outdated and last check was also NOT outdated', async () => {
      jest
        .spyOn(FetchFeedsApi, 'fetchFeedsApi')
        .mockReturnValue(Promise.resolve(FEED_SINGLE_RESPONSE))
      jest
        .spyOn(IsFeedOutdated, 'isFeedOutdated')
        .mockReturnValue(false)
        .mockReturnValue(false)
      const dataFeedMonitor = new DataFeedMonitor(
        (graphqlClientMock as unknown) as GraphQLClient,
        (telegramBotMock as unknown) as TelegramBot,
        // pass a state where last response to feedFullName was NOT outdated
        { [FEED_SINGLE_RESPONSE.feeds.feeds[0].feedFullName]: false }
      )
      const dateNow = 1638461384178

      await dataFeedMonitor.checkFeedsStatus(dateNow + 10000)

      expect(telegramBotMock.sendMessage).not.toBeCalled()
    })
  })
})
