import { GraphQLClient } from 'graphql-request'
import TelegramBot from 'node-telegram-bot-api'

import { fetchFeedsApi } from './fetchFeedsApi.js'
import { getMsToBeUpdated, isFeedOutdated } from './feedStatus.js'
import {
  ApiSuccessResponse,
  Feed,
  FeedName,
  FeedsStatusByNetwork,
  FeedStatusInfo,
  GlobalStatusEmoji,
  Network,
  State,
  StatusEmoji
} from './types.js'
import {
  MAINNET_KEYWORDS,
  ADMISSIBLE_DELAY_MS,
  DAYS_TO_CONSIDER_FEED_INACTIVE
} from './constants.js'
import { groupBy } from './groupBy.js'
import { isFeedActive } from './feedStatus.js'
import { createGlobalStatusMessage } from './createGlobalStatusMessage.js'

export const LEGEND_MESSAGE = `Global status:
${GlobalStatusEmoji.Green} => All active feeds are up to date 
${GlobalStatusEmoji.Yellow} => Some active feeds are outdated
${GlobalStatusEmoji.Red} => All active feeds in a network are delayed 
x / y => active updated feeds / total active feed

Network status:
${StatusEmoji.Green} => All feeds are up to date
${StatusEmoji.Yellow} => Some feeds are delayed
${StatusEmoji.Red} => All feeds are delayed
${StatusEmoji.Black} => All feeds are inactive
x/y => updated feeds / total feeds

A feed is considered active when was updated in the last 7 days`

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

  public async sendLegendMessage () {
    this.sendTelegramMessage(Network.Testnet, LEGEND_MESSAGE)
    this.sendTelegramMessage(Network.Mainnet, LEGEND_MESSAGE)
  }

  public async checkFeedsStatus (dateNow: number = Date.now()) {
    let feeds: Array<Feed> | undefined
    try {
      feeds = await fetchFeedsApi(this.graphQLClient)
    } catch (e) {
      console.error(e)
    }

    if (feeds) {
      const monitorableFeeds = feeds.filter(feed => feed.heartbeat)
      const feedsByNetwork = groupBy(monitorableFeeds, 'network')
      const isFirstCheck = !Object.keys(this.state).length

      this.state = Object.entries(feedsByNetwork).reduce(
        (state: State, [network, networkFeeds]) => {
          const feedsStatusByNetwork: FeedsStatusByNetwork = groupFeedsStatusByNetwork(
            networkFeeds,
            this.state[network],
            dateNow
          )

          return {
            ...state,
            [network]: feedsStatusByNetwork
          }
        },
        this.state
      )

      const shouldSendMessages = Object.entries(this.state).reduce(
        (acc, [network, networkFeeds]) => {
          const shouldSendMessage = Object.values(networkFeeds).reduce(
            (shouldSendMessage, feed) =>
              shouldSendMessage || feed.statusChanged,
            false
          )

          if (isMainnetFeed(network)) {
            return { ...acc, mainnet: acc.mainnet || shouldSendMessage }
          } else {
            return { ...acc, testnet: acc.testnet || shouldSendMessage }
          }
        },
        { mainnet: false, testnet: false }
      )

      const { mainnetState, testnetState } = splitStateByKind(this.state)

      const createMessages = (state: State) =>
        Object.entries(state).reduce(
          (messages: Array<string>, [network, feeds]) => {
            return [...messages, createNetworkMessage(feeds, network)]
          },
          []
        )

      if (isFirstCheck || shouldSendMessages.mainnet) {
        const messages = createMessages(mainnetState)
        const globalStatusMessage = createGlobalStatusMessage(
          this.state,
          Network.Mainnet
        )

        messages.unshift(globalStatusMessage + '\n')

        this.sendTelegramMessage(Network.Mainnet, messages.join('\n'))
      }

      if (isFirstCheck || shouldSendMessages.testnet) {
        const messages = createMessages(testnetState)
        const globalStatusMessage = createGlobalStatusMessage(
          this.state,
          Network.Testnet
        )

        messages.unshift(globalStatusMessage + '\n')

        this.sendTelegramMessage(Network.Testnet, messages.join('\n'))
      }
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
): string {
  const feedInfos = Object.values(feedsStatusByNetwork)

  const outdatedFeeds = feedInfos.filter(
    feedInfo => feedInfo.isOutdated && feedInfo.isActive
  )
  const inactiveFeeds = feedInfos.filter(feedInfo => !feedInfo.isActive)
  const outdatedFeedsLength = outdatedFeeds.length
  const feedsLength = feedInfos.length
  const isInactiveNetwork = inactiveFeeds.length === feedInfos.length
  // the time a feed is oudated is calculated from the msToBeUpdated. So when msToBeUpdated < 0,
  // the feed is outdated and we have to convert it to a positive number because the delay is
  // expected to be > 0
  const largestDelayMs =
    -1 * Math.min(...outdatedFeeds.map(feedInfo => feedInfo.msToBeUpdated))
  // only use the delay if there are outdated feeds
  const delay = outdatedFeeds.length
    ? formatDelayString(largestDelayMs)
    : undefined

  let color: StatusEmoji
  if (isInactiveNetwork) {
    color = StatusEmoji.Black
  } else if (!outdatedFeedsLength) {
    color = StatusEmoji.Green
  } else if (outdatedFeedsLength !== feedsLength) {
    color = StatusEmoji.Yellow
  } else {
    color = StatusEmoji.Red
  }

  const statusHasChanged = feedInfos.find(
    feedStatusInfo => feedStatusInfo.statusChanged
  )

  const message = `${color} ${network.replace('-', '.')} ${feedsLength -
    outdatedFeedsLength -
    inactiveFeeds.length}/${feedsLength} ${
    delay ? '(' + delay + ')' : ''
  }`.trim()

  return statusHasChanged ? `*${message}*` : message
}

export function formatDelayString (
  delay: number,
  admissibleDelay = ADMISSIBLE_DELAY_MS
): string {
  // Admissible delay is added because it's used to calculate the ms to be updated
  let secondsToBeUpdated = Math.floor((delay + admissibleDelay) / 1000)
  const days = Math.floor(secondsToBeUpdated / (60 * 60 * 24))
  secondsToBeUpdated -= days * 60 * 60 * 24
  const hours = Math.floor(secondsToBeUpdated / 3600) % 24
  secondsToBeUpdated -= hours * 60 * 60
  const minutes = Math.floor(secondsToBeUpdated / 60) % 60
  secondsToBeUpdated -= minutes * 60

  let timeOutdatedString
  const daysToRequest = Number(DAYS_TO_CONSIDER_FEED_INACTIVE)
  if (days && days > daysToRequest) {
    timeOutdatedString = `> ${daysToRequest}d`
  } else if (days) {
    timeOutdatedString = `> ${days}d`
  } else if (hours) {
    timeOutdatedString = `> ${hours}h`
  } else {
    timeOutdatedString = `${minutes}m`
  }
  return timeOutdatedString
}

function groupFeedsStatusByNetwork (
  feeds: Array<Feed>,
  networkFeedsStatus: Record<FeedName, FeedStatusInfo>,
  dateNow: number
): FeedsStatusByNetwork {
  return feeds.reduce((acc: FeedsStatusByNetwork, feed: Feed) => {
    const msToBeUpdated = getMsToBeUpdated(dateNow, feed)
    const isOutdated = isFeedOutdated(msToBeUpdated)
    const statusChanged = acc[feed.feedFullName]?.isOutdated !== isOutdated
    const isMainnet = isMainnetFeed(feed.network)
    // TODO: normalize all timestamp after query data
    const isActive = isFeedActive(
      parseInt(feed.lastResultTimestamp || '0') * 1000,
      dateNow
    )
    return {
      ...acc,
      [feed.feedFullName]: {
        isOutdated,
        msToBeUpdated,
        statusChanged,
        isMainnet,
        isActive
      }
    }
  }, networkFeedsStatus || {})
}

function isMainnetFeed (network: string) {
  return !!MAINNET_KEYWORDS.find(keyword => network.includes(keyword))
}

function splitStateByKind (state: State) {
  return Object.entries(state).reduce(
    (networks, [network, feeds]) => {
      const isMainnet = Object.values(feeds)[0].isMainnet

      return {
        mainnetState: isMainnet
          ? { ...networks.mainnetState, [network]: feeds }
          : networks.mainnetState,
        testnetState: !isMainnet
          ? { ...networks.testnetState, [network]: feeds }
          : networks.testnetState
      }
    },
    { testnetState: {}, mainnetState: {} } as {
      mainnetState: State
      testnetState: State
    }
  )
}
