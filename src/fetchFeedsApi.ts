import { GraphQLClient, gql } from 'graphql-request'

import { ApiSuccessResponse } from './types'

// TODO: call with pagination
export function fetchFeedsApi (
  client: GraphQLClient
): Promise<ApiSuccessResponse> {
  const query = gql`
    query feeds(
      $page: Int!
      $pageSize: Int!
      $network: String!
      $timestamp: Int!
    ) {
      feeds(page: $page, pageSize: $pageSize, network: $network) {
        feeds {
          feedFullName
          name
          address
          lastResult
          heartbeat
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
    page: 1,
    pageSize: 100,
    network: 'all',
    // get requests from past 2 days
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 24 * 2
  }

  return client.request(query, variables)
}
