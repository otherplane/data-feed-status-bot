import { GraphQLClient } from 'graphql-request'
import TelegramBot from 'node-telegram-bot-api'

import { fetchFeedsApi } from './fetchFeedsApi'
import { getMsToBeUpdated, isFeedOutdated } from './feedStatus'
import { Feed } from './types'

export class DataFeedMonitor {
  constructor (
    private graphQLClient: GraphQLClient,
    private telegramBot: TelegramBot,
    // store data feed name and its last status
    private state: Record<string, boolean> = {}
  ) {}

  public async checkFeedsStatus (dateNow: number = Date.now()) {
    const {
      feeds: { feeds }
    } = await fetchFeedsApi(this.graphQLClient)
    const messages: Array<string> = []

    let shouldNotify = false

    this.state = feeds.reduce((acc, feed: Feed) => {
      const msToBeUpdated = getMsToBeUpdated(dateNow, feed)
      const isOutdated = isFeedOutdated(msToBeUpdated)
      const statusHasChanged = acc[feed.feedFullName] !== isOutdated

      if (statusHasChanged) {
        shouldNotify = true
      }

      messages.push(
        createMessage(
          feed.feedFullName,
          isOutdated,
          msToBeUpdated,
          statusHasChanged
        )
      )

      return { ...acc, [feed.feedFullName]: isOutdated }
    }, this.state)

    if (shouldNotify) {
      this.sendTelegramMessage(messages.join('\n'))
    }

    return
  }

  public async sendTelegramMessage (message: string) {
    try {
      // if CHANNEL_ID is not found at the beginning will throw an error
      return await this.telegramBot.sendMessage(
        process.env.CHANNEL_ID as string,
        message,
        { parse_mode: 'Markdown' }
      )
    } catch (err) {
      console.error(err)
    }
  }
}

function createMessage (
  feedFullName: string,
  isOutdated: boolean,
  msToBeUpdated: number,
  statusChanged: boolean
): string {
  if (!isOutdated) {
    const updatedMessage = `✅ ${feedFullName}`
    // add bold style is status changed from previous call
    return statusChanged ? `*${updatedMessage}*` : updatedMessage
  }

  let secondsToBeUpdated = Math.floor((-1 * msToBeUpdated) / 1000)

  const days = Math.floor(secondsToBeUpdated / (60 * 60 * 24))
  secondsToBeUpdated -= days * 60 * 60 * 24

  const hours = Math.floor(secondsToBeUpdated / 3600) % 24
  secondsToBeUpdated -= hours * 60 * 60

  const minutes = Math.floor(secondsToBeUpdated / 60) % 60
  secondsToBeUpdated -= minutes * 60

  let timeOutdatedString
  if (days && days > parseInt(process.env.DAYS_TO_REQUEST || '1')) {
    timeOutdatedString = `> ${process.env.DAYS_TO_REQUEST}d`
  } else if (days) {
    timeOutdatedString = `${days}d ${hours}h ${minutes}m`
  } else if (hours) {
    timeOutdatedString = `${hours}h ${minutes}m`
  } else {
    timeOutdatedString = `${minutes}m`
  }

  const outdatedMessage = `❌ ${feedFullName} ${timeOutdatedString}`
  // add bold style is status changed from previous call
  return statusChanged ? `*${outdatedMessage}*` : outdatedMessage
}
