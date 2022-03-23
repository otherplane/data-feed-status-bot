export type Feed = {
  address: string
  feedFullName: string
  finality: string
  heartbeat: string
  lastResult: string
  lastResultTimestamp: string
  name: string
}

export type ApiSuccessResponse = {
  feeds: {
    feeds: Array<Feed>
  }
  total: number
}
