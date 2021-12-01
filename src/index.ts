process.env.NTBA_FIX_319 = '1'

import { GraphQLClient } from 'graphql-request'
import TelegramBot from 'node-telegram-bot-api'

import { Feed } from './types'
import { isFeedOutdated } from './isFeedOutdated'
import { fetchFeedsApi } from './fetchFeedsApi'

const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.CHANNEL_ID
const FEED_EXPLORER_API = process.env.FEED_EXPLORER_API
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL || '60000') // 1min

main()

async function main () {
  if (!TOKEN) {
    console.error('Mandatory environment variable TOKEN is missing')
    return
  }

  if (!CHANNEL_ID) {
    console.error('Mandatory environment variable CHANNEL_ID is missing')
    return
  }

  if (!FEED_EXPLORER_API) {
    console.error('Mandatory environment variable FEED_EXPLORER_API is missing')
    return
  }

  const bot = new TelegramBot(TOKEN)
  const client = new GraphQLClient(FEED_EXPLORER_API)

  const {
    feeds: { feeds }
  } = await fetchFeedsApi(client)

  const dateNow = Date.now()

  setInterval(() => {
    feeds.forEach((feed: Feed) => {
      if (isFeedOutdated(dateNow, feed)) {
        console.warn(`${feed.feedFullName} is outdated`)
        bot.sendMessage(CHANNEL_ID, `${feed.feedFullName} is outdated`)
      }
    })
  }, POLLING_INTERVAL)
}
