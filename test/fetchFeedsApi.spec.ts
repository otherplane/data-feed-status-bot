import { GraphQLClient } from 'graphql-request'
import { fetchFeedsApi } from '../src/fetchFeedsApi.js'

const FEEDS = [
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname1',
    lastResultTimestamp: '1000',
    address: 'address1',
    lastResult: '1',
    name: 'name1',
    network: 'ethereum-mainnet'
  },
  {
    heartbeat: '1000',
    finality: '1',
    feedFullName: 'feedFullname2',
    lastResultTimestamp: '1638461382000',
    address: '0x123456789abcdef123456789abcdef123456789a',
    lastResult: '2',
    name: 'name2',
    network: 'ethereum-rinkeby'
  }
]

const API_RESPONSE_SUCCESS = { feeds: { feeds: FEEDS } }

const RETRY_AFTER_MS = 100
describe('fetchFeedsApi ', () => {
  it('should return the result if the first call is success', async () => {
    const requestMock = jest.fn().mockReturnValue(API_RESPONSE_SUCCESS)
    const graphqlClientMock: GraphQLClient = ({
      request: requestMock
    } as unknown) as GraphQLClient

    const result = await fetchFeedsApi(graphqlClientMock, RETRY_AFTER_MS)

    expect(result).toBe(FEEDS)
  })

  it('should not wait before fetch the first time', async () => {
    const requestMock = jest.fn().mockReturnValue(API_RESPONSE_SUCCESS)
    const graphqlClientMock: GraphQLClient = ({
      request: requestMock
    } as unknown) as GraphQLClient

    const checkpoint = Date.now()
    await fetchFeedsApi(graphqlClientMock, RETRY_AFTER_MS)
    const awaited = Date.now() - checkpoint

    expect(awaited < RETRY_AFTER_MS).toBeTruthy()
  })

  it('should not retry if the first call is success', async () => {
    const requestMock = jest.fn().mockReturnValue(API_RESPONSE_SUCCESS)
    const graphqlClientMock: GraphQLClient = ({
      request: requestMock
    } as unknown) as GraphQLClient

    await fetchFeedsApi(graphqlClientMock, RETRY_AFTER_MS)

    expect(requestMock).toBeCalledTimes(1)
  })

  it('should retry only once if the first call is error and second is a success', async () => {
    const requestMock = jest
      .fn()
      .mockReturnValueOnce({ response: { error: 'ERROR' } })
      .mockReturnValue(API_RESPONSE_SUCCESS)
    const graphqlClientMock: GraphQLClient = ({
      request: requestMock
    } as unknown) as GraphQLClient

    await fetchFeedsApi(graphqlClientMock, RETRY_AFTER_MS)

    expect(requestMock).toBeCalledTimes(2)
  })

  it('should retry only once if the first call is error and second is a success', async () => {
    const requestMock = jest
      .fn()
      .mockReturnValueOnce({ response: { error: 'ERROR' } })
      .mockReturnValue(API_RESPONSE_SUCCESS)
    const graphqlClientMock: GraphQLClient = ({
      request: requestMock
    } as unknown) as GraphQLClient

    const checkpoint = Date.now()
    await fetchFeedsApi(graphqlClientMock, RETRY_AFTER_MS)
    const awaited = Date.now() - checkpoint

    expect(
      awaited >= RETRY_AFTER_MS && awaited < RETRY_AFTER_MS * 2
    ).toBeTruthy()
  })

  it('should retry 3 times max', async () => {
    const requestMock = jest
      .fn()
      .mockReturnValueOnce({ response: { error: 'ERROR' } })
      .mockReturnValueOnce({ response: { error: 'ERROR' } })
      .mockReturnValueOnce({ response: { error: 'ERROR' } })
      .mockReturnValue(API_RESPONSE_SUCCESS)
    const graphqlClientMock: GraphQLClient = ({
      request: requestMock
    } as unknown) as GraphQLClient

    try {
      await fetchFeedsApi(graphqlClientMock, RETRY_AFTER_MS)
    } catch (e) {}

    expect(requestMock).toBeCalledTimes(3)
  })

  it('should wait between all retries', async () => {
    const requestMock = jest
      .fn()
      .mockReturnValueOnce({ response: { error: 'ERROR' } })
      .mockReturnValueOnce({ response: { error: 'ERROR' } })
      .mockReturnValueOnce({ response: { error: 'ERROR' } })
      .mockReturnValue(API_RESPONSE_SUCCESS)
    const graphqlClientMock: GraphQLClient = ({
      request: requestMock
    } as unknown) as GraphQLClient

    const checkpoint = Date.now()
    try {
      await fetchFeedsApi(graphqlClientMock, RETRY_AFTER_MS)
    } catch (e) {}
    const awaited = Date.now() - checkpoint

    expect(
      awaited >= RETRY_AFTER_MS * 2 && RETRY_AFTER_MS < 500 * 3
    ).toBeTruthy()
  })

  it('should return the result if the response is a success in last retry', async () => {
    const requestMock = jest
      .fn()
      .mockReturnValueOnce({ response: { error: 'ERROR' } })
      .mockReturnValueOnce({ response: { error: 'ERROR' } })
      .mockReturnValue(API_RESPONSE_SUCCESS)
    const graphqlClientMock: GraphQLClient = ({
      request: requestMock
    } as unknown) as GraphQLClient

    const result = await fetchFeedsApi(graphqlClientMock, RETRY_AFTER_MS)

    expect(result).toBe(FEEDS)
  })
})
