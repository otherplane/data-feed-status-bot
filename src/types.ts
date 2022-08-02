export type Feed = {
  address: string
  feedFullName: string
  finality: string
  heartbeat: string
  lastResult: string
  lastResultTimestamp: string
  name: string
  network: string
}

export type ApiSuccessResponse = {
  feeds: {
    feeds: Array<Feed>
  }
  total: number
}

export enum Network {
  Mainnet,
  Testnet
}
export enum StatusEmoji {
  Green = '🟢',
  Yellow = '🟡',
  Red = '🔴',
  Black = '⚫'
}

export enum GlobalStatusEmoji {
  Green = '💚',
  Yellow = '💛',
  Red = '❤️'
}

export type FeedsStatusByNetwork = Record<FeedName, FeedStatusInfo>
export type FeedStatusInfo = {
  isOutdated: boolean
  msToBeUpdated: number
  statusChanged: boolean
  isMainnet: boolean
  isActive: boolean
}
export type NetworkName = string
export type FeedName = string
export type State = Record<NetworkName, Record<FeedName, FeedStatusInfo>>
