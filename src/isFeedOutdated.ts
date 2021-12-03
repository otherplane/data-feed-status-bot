import { Feed } from './types'

export function isFeedOutdated (
  dateNow: number,
  { heartbeat, finality, requests }: Feed
) {
  const fullHeartbeat = parseInt(heartbeat) + parseInt(finality)
  const lastRequest = requests.sort(
    (first, second) => parseInt(second.timestamp) - parseInt(first.timestamp)
  )[0]

  if (!lastRequest) {
    return true
  }

  const msSinceLastUpdate = dateNow - parseInt(lastRequest.timestamp) * 1000
  const msToBeUpdated = fullHeartbeat - msSinceLastUpdate

  // console.log(
  //   `${lastRequest.feedFullName} should be updated in less than ${Math.floor(
  //     msToBeUpdated / 60 / 1000
  //   )} minutes ${Math.floor((msToBeUpdated / 1000) % 60)} seconds`
  // )

  return msToBeUpdated < 0
}
