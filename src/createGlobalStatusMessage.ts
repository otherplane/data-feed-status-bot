import { FeedStatusInfo, GlobalStatusEmoji, Network, State } from './types.js'

export function createGlobalStatusMessage(state: State, network: Network) {
  const isCorrectChainKind = (feed: FeedStatusInfo) =>
    network === Network.Mainnet ? feed.isMainnet : !feed.isMainnet

  const isNetworkDown: boolean = Object.values(state).reduce(
    (isDown, network) => {
      // Check if it is the correct network environment: testnet or mainnet
      if (!isCorrectChainKind(Object.values(network)[0])) {
        return isDown
      }

      const singleNetworkIsDown = !!Object.values(network).every(
        (info) => info.isOutdated && info.isActive,
      )

      return isDown || singleNetworkIsDown
    },
    false,
  )

  const totalActiveFeeds: Array<FeedStatusInfo> = Object.values(state)
    // filter out non active networks
    .filter(
      (network) => !Object.values(network).every((feed) => !feed.isActive),
    )
    .flatMap((network) => Object.values(network))
    .filter((feedStatusInfo) => isCorrectChainKind(feedStatusInfo))
  const updatedActiveFeeds = totalActiveFeeds.filter((feed) => !feed.isOutdated)

  let globalStatusEmoji
  if (isNetworkDown) {
    globalStatusEmoji = GlobalStatusEmoji.Red
  } else if (totalActiveFeeds.length !== updatedActiveFeeds.length) {
    globalStatusEmoji = GlobalStatusEmoji.Yellow
  } else {
    globalStatusEmoji = GlobalStatusEmoji.Green
  }
  return `${globalStatusEmoji} ${updatedActiveFeeds.length} / ${totalActiveFeeds.length}`
}

export default createGlobalStatusMessage
