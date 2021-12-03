import { GraphQLClient } from 'graphql-request'
import TelegramBot from 'node-telegram-bot-api'

import { fetchFeedsApi } from './fetchFeedsApi'
import { isFeedOutdated } from './isFeedOutdated'
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
    this.state = feeds.reduce((acc, feed: Feed) => {
      const isOutdated = isFeedOutdated(dateNow, feed)
      const statusHasChanged = acc[feed.feedFullName] !== isOutdated

      if (statusHasChanged) {
        messages.push(
          isOutdated ? `❌ ${feed.feedFullName}` : `✅ ${feed.feedFullName}`
        )
      }

      return { ...acc, [feed.feedFullName]: isOutdated }
    }, this.state)

    if (messages.length) {
      this.sendTelegramMessage(messages.join('\n'))
    }

    return
  }

  public async sendTelegramMessage (message: string) {
    try {
      // if CHANNEL_ID is not found at the beginning will throw an error
      return await this.telegramBot.sendMessage(
        process.env.CHANNEL_ID as string,
        message
      )
    } catch (err) {
      console.error(err)
    }
  }
}
