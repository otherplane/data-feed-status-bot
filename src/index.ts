import dotenv from 'dotenv'
dotenv.config()

import { GraphQLClient } from 'graphql-request'
import TelegramBot from 'node-telegram-bot-api'

import { DataFeedMonitor } from './DataFeedMonitor.js'

const TOKEN_BOT_TESTNET = process.env.TOKEN_BOT_TESTNET
const TOKEN_BOT_MAINNET = process.env.TOKEN_BOT_MAINNET
const CHANNEL_ID_TESTNET = process.env.CHANNEL_ID_TESTNET
const CHANNEL_ID_MAINNET = process.env.CHANNEL_ID_MAINNET
const FEED_EXPLORER_API = process.env.FEED_EXPLORER_API
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL || '60000') // 1min

main()

async function main () {
  if (!TOKEN_BOT_TESTNET) {
    throw new Error(
      'Mandatory environment variable TOKEN_BOT_TESTNET is missing'
    )
  }

  if (!TOKEN_BOT_MAINNET) {
    throw new Error(
      'Mandatory environment variable TOKEN_BOT_MAINNET is missing'
    )
  }

  if (!CHANNEL_ID_TESTNET) {
    throw new Error(
      'Mandatory environment variable CHANNEL_ID_TESTNET is missing'
    )
  }

  if (!CHANNEL_ID_MAINNET) {
    throw new Error(
      'Mandatory environment variable CHANNEL_ID_MAINNET is missing'
    )
  }

  if (!FEED_EXPLORER_API) {
    throw new Error(
      'Mandatory environment variable FEED_EXPLORER_API is missing'
    )
  }

  const mainnetBot = new TelegramBot(TOKEN_BOT_MAINNET)
  const testnetBot = new TelegramBot(TOKEN_BOT_TESTNET)
  const client = new GraphQLClient(FEED_EXPLORER_API)
  const dataFeedMonitor = new DataFeedMonitor(client, {
    mainnetBot,
    testnetBot
  })
  dataFeedMonitor.sendLegendMessage()
  setInterval(async () => {
    try {
      dataFeedMonitor.checkFeedsStatus()
    } catch (error) {
      console.error(`Error checking feeds status ${error}`)
    }
  }, POLLING_INTERVAL)
}
