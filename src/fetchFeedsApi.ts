import { GraphQLClient, gql } from 'graphql-request'

import { ApiSuccessResponse } from './types'

// TODO: call with pagination
export function fetchFeedsApi (
  client: GraphQLClient
): Promise<ApiSuccessResponse> {
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
        }
        total
      }
    }
  `
  const variables = {
    network: 'all'
  }

  return client.request(query, variables)
}
