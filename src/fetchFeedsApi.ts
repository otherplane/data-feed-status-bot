import { GraphQLClient, gql } from 'graphql-request'

import { ApiSuccessResponse } from './types'

// TODO: call with pagination
export function fetchFeedsApi (
  client: GraphQLClient
): Promise<ApiSuccessResponse> {
  const query = gql`
    query feeds($network: String!, $timestamp: Int!) {
      feeds(network: $network) {
        feeds {
          feedFullName
          name
          address
          lastResult
          heartbeat
          finality
          requests(timestamp: $timestamp) {
            feedFullName
            timestamp
          }
        }
        total
      }
    }
  `
  const variables = {
    network: 'all',
    // get requests from past 2 days
    timestamp:
      Math.floor(Date.now() / 1000) -
      3600 * 24 * parseInt(process.env.DAYS_TO_REQUEST || '1')
  }

  return client.request(query, variables)
}
