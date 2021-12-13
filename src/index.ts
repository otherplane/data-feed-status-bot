process.env.NTBA_FIX_319 = '1'

import { GraphQLClient } from 'graphql-request'
import TelegramBot from 'node-telegram-bot-api'

import { DataFeedMonitor } from './DataFeedMonitor'

const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.CHANNEL_ID
const FEED_EXPLORER_API = process.env.FEED_EXPLORER_API
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL || '60000') // 1min

main()

async function main () {
  if (!TOKEN) {
    throw new Error('Mandatory environment variable TOKEN is missing')
  }

  if (!CHANNEL_ID) {
    throw new Error('Mandatory environment variable CHANNEL_ID is missing')
  }

  if (!FEED_EXPLORER_API) {
    throw new Error(
      'Mandatory environment variable FEED_EXPLORER_API is missing'
    )
  }

  const bot = new TelegramBot(TOKEN)
  const client = new GraphQLClient(FEED_EXPLORER_API)
  const dataFeedMonitor = new DataFeedMonitor(client, bot)

  setInterval(async () => {
    try {
      dataFeedMonitor.checkFeedsStatus()
    } catch (error) {
      console.error(`Error checking feeds status ${error}`)
      dataFeedMonitor.sendTelegramMessage('Error checking feeds status')
    }
  }, POLLING_INTERVAL)
}
