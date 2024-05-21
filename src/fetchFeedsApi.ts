import { GraphQLClient, gql } from 'graphql-request'

import { MAX_RETRIES, RETRY_AFTER_MS } from './constants.js'
import { ApiSuccessResponse, Feed } from './types.js'

// TODO: call with pagination
export function fetchFeedsApi(
  client: GraphQLClient,
  retryAfterMs = RETRY_AFTER_MS,
): Promise<Array<Feed>> {
  const query = gql`
    query feeds($network: String!) {
      feeds(network: $network) {
        feeds {
          feedFullName
          name
          address
          lastResult
          lastResultTimestamp
          heartbeat
          finality
          network
          isRouted
        }
        total
      }
    }
  `
  const variables = {
    network: 'all',
  }

  return new Promise(async (resolve, reject) => {
    let success: ApiSuccessResponse | undefined
    let lastError: Error | undefined
    let tries = 0

    while (!success && tries < MAX_RETRIES) {
      try {
        if (tries !== 0) {
          await sleep(retryAfterMs)
        }
        const result: any = await client.request(query, variables)
        if (result?.feeds?.feeds) {
          success = result
        } else {
          throw new Error('Invalid api response')
        }
      } catch (e) {
        lastError = e as Error
      }

      tries += 1
    }

    if (success) {
      resolve(success.feeds.feeds)
    } else {
      reject(lastError)
    }
  })
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(true), ms))
}
