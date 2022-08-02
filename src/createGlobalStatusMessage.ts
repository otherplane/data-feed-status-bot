import { FeedStatusInfo, GlobalStatusEmoji, Network, State } from './types'

export function createGlobalStatusMessage (state: State, network: Network) {
  const isCorrectChainKind = (feed: FeedStatusInfo) =>
    network === Network.Mainnet ? feed.isMainnet : !feed.isMainnet

  const isNetworkDown: boolean = Object.values(state).reduce(
    (isDown, network) => {
      const singleNetworkIsDown = !!Object.values(network).every(
        info => info.isOutdated && info.isActive
      )

      return isDown || singleNetworkIsDown
    },
    false
  )

  const totalActiveFeeds: Array<FeedStatusInfo> = Object.values(state)
    .flatMap(network => Object.values(network))
    .filter(feedStatusInfo => {
      return feedStatusInfo.isActive && isCorrectChainKind(feedStatusInfo)
    })
  const updatedActiveFeeds = totalActiveFeeds.filter(feed => !feed.isOutdated)

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
