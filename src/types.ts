export type Request = { timestamp: string; feedFullName: string }
export type Feed = {
  heartbeat: string
  feedFullName: string
  finality: string
  requests: Array<Request>
}

export type ApiSuccessResponse = {
  feeds: {
    feeds: Array<Feed>
  }
  total: number
}
