export type Feed = {
  heartbeat: string
  feedFullName: string
  requests: Array<{ timestamp: string; feedFullName: string }>
}

export type ApiSuccessResponse = {
  feeds: {
    feeds: Array<Feed>
  }
  total: number
}
