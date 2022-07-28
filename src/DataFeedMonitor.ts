import { GraphQLClient } from 'graphql-request'
import TelegramBot from 'node-telegram-bot-api'

import { fetchFeedsApi } from './fetchFeedsApi'
import { getMsToBeUpdated, isFeedOutdated } from './feedStatus'
import { Feed } from './types'
import { MAINNET_KEYWORDS } from './constants'
import { groupBy } from './groupBy'

enum Network {
  Mainnet,
  Testnet
}
enum StatusEmoji {
  Green = '🟢',
  Yellow = '🟡',
  Red = '🟥'
}
type FeedsStatusByNetwork = Record<FeedName, FeedStatusInfo>
type FeedStatusInfo = {
  isOutdated: boolean
  msToBeUpdated: number
  statusChanged: boolean
}
type NetworkName = string
type FeedName = string
type State = Record<NetworkName, Record<FeedName, FeedStatusInfo>>

export class DataFeedMonitor {
  private graphQLClient: GraphQLClient
  private mainnetBot: TelegramBot
  private testnetBot: TelegramBot
  // store data feed name and its last status
  private state: State = {}

  constructor (
    graphQLClient: GraphQLClient,
    {
      mainnetBot,
      testnetBot
    }: { mainnetBot: TelegramBot; testnetBot: TelegramBot },
    state: State = {}
  ) {
    this.graphQLClient = graphQLClient
    this.mainnetBot = mainnetBot
    this.testnetBot = testnetBot
    this.state = state
  }

  public async checkFeedsStatus (dateNow: number = Date.now()) {
    const {
      feeds: { feeds }
    } = await fetchFeedsApi(this.graphQLClient)
    const mainnetMessages: Array<string> = []
    const testnetMessages: Array<string> = []

    const monitorableFeeds = feeds.filter(feed => feed.heartbeat)

    const feedsByNetwork = groupBy(monitorableFeeds, 'network')
    this.state = Object.entries(feedsByNetwork).reduce(
      (state: State, [network, networkFeeds]) => {
        const feedsStatusByNetwork: FeedsStatusByNetwork = networkFeeds.reduce(
          (acc, feed: Feed) => {
            const msToBeUpdated = getMsToBeUpdated(dateNow, feed)
            const isOutdated = isFeedOutdated(msToBeUpdated)
            const statusChanged =
              acc[feed.feedFullName]?.isOutdated !== isOutdated

            return {
              ...acc,
              [feed.feedFullName]: {
                isOutdated,
                msToBeUpdated,
                statusChanged
              }
            }
          },
          this.state[network] || {}
        )

        const isMainnetFeed = MAINNET_KEYWORDS.find(keyword =>
          network.includes(keyword)
        )

        const messages = isMainnetFeed ? mainnetMessages : testnetMessages
        const message = createNetworkMessage(feedsStatusByNetwork, network)

        if (message) {
          messages.push(message)
        }

        return {
          ...state,
          [network]: feedsStatusByNetwork
        }
      },
      this.state
    )

    if (mainnetMessages.length) {
      this.sendTelegramMessage(Network.Mainnet, mainnetMessages.join('\n'))
    }

    if (testnetMessages.length) {
      this.sendTelegramMessage(Network.Testnet, testnetMessages.join('\n'))
    }

    return
  }

  public async sendTelegramMessage (network: Network, message: string) {
    const credentialsByNetwork = {
      [Network.Mainnet]: {
        telegramBot: this.mainnetBot,
        channelId: process.env.CHANNEL_ID_MAINNET
      },
      [Network.Testnet]: {
        telegramBot: this.testnetBot,
        channelId: process.env.CHANNEL_ID_TESTNET
      }
    }
    const { telegramBot, channelId } = credentialsByNetwork[network]

    try {
      // if CHANNEL_ID is not found at the beginning will throw an error
      return await telegramBot.sendMessage(channelId as string, message, {
        parse_mode: 'Markdown'
      })
    } catch (err) {
      console.error(err)
    }
  }
}

function createNetworkMessage (
  feedsStatusByNetwork: FeedsStatusByNetwork,
  network: string
): string | null {
  const feedInfos = Object.values(feedsStatusByNetwork)

  const shouldSendMessage = feedInfos.reduce(
    (shouldSendMessage, feed) => shouldSendMessage || feed.statusChanged,
    false
  )

  if (!shouldSendMessage) {
    return null
  }

  const outdatedFeeds = feedInfos.filter(feedInfo => feedInfo.isOutdated)
  const outdatedFeedsLength = outdatedFeeds.length
  const feedsLength = feedInfos.length

  const largestDelayMs = Math.min(
    ...outdatedFeeds.map(feedInfo => feedInfo.msToBeUpdated)
  )

  // only use the delay if there are oudated feeds
  const delay = outdatedFeeds.length
    ? formatDelayString(largestDelayMs)
    : undefined

  let color: StatusEmoji
  if (!outdatedFeedsLength) {
    color = StatusEmoji.Green
  } else if (outdatedFeedsLength !== feedsLength) {
    color = StatusEmoji.Yellow
  } else {
    color = StatusEmoji.Red
  }

  return `${color} ${network} (${feedsLength -
    outdatedFeedsLength}/${feedsLength}) ${delay ?? ''}`.trim()
}

function formatDelayString (msToBeUpdated: number): string {
  let secondsToBeUpdated = Math.floor((-1 * msToBeUpdated) / 1000)

  const days = Math.floor(secondsToBeUpdated / (60 * 60 * 24))
  secondsToBeUpdated -= days * 60 * 60 * 24

  const hours = Math.floor(secondsToBeUpdated / 3600) % 24
  secondsToBeUpdated -= hours * 60 * 60

  const minutes = Math.floor(secondsToBeUpdated / 60) % 60
  secondsToBeUpdated -= minutes * 60

  let timeOutdatedString
  const daysToRequest = Number(process.env.DAYS_TO_REQUEST || '2')
  if (days && days > daysToRequest) {
    timeOutdatedString = `> ${daysToRequest}d`
  } else if (days) {
    timeOutdatedString = `${days}d ${hours}h ${minutes}m`
  } else if (hours) {
    timeOutdatedString = `${hours}h ${minutes}m`
  } else {
    timeOutdatedString = `${minutes}m`
  }
  return timeOutdatedString
}
