import { Feed, Request } from './types'

export function isFeedOutdated (msToBeUpdated: number): boolean {
  return msToBeUpdated < 0
}

export function getMsToBeUpdated (
  dateNow: number,
  { heartbeat, finality, requests }: Feed
) {
  const admissibleDelayCorrection = process.env.ADMISSIBLE_DELAY
    ? parseInt(process.env.ADMISSIBLE_DELAY)
    : undefined
  const admissibleDelay = calculateAdmissibleDelay(
    parseInt(heartbeat),
    parseInt(finality),
    admissibleDelayCorrection
  )

  const lastRequest = getLastRequest(requests)
  if (!lastRequest) {
    return -(
      Date.now() -
      24 * 3600 * 1000 * parseInt(process.env.DAYS_TO_REQUEST || '1')
    )
  }

  const msSinceLastUpdate = dateNow - parseInt(lastRequest.timestamp) * 1000
  const msToBeUpdated = admissibleDelay - msSinceLastUpdate

  // console.log(
  //   `${lastRequest.feedFullName} should be updated in less than ${Math.ceil(
  //     msToBeUpdated / 60 / 1000
  //   )} minutes ${Math.ceil((msToBeUpdated / 1000) % 60)} seconds`
  // )

  return msToBeUpdated
}

function calculateAdmissibleDelay (
  heartbeat: number,
  finality: number,
  admissibleDelayCorrection?: number
): number {
  const fullHeartbeat = heartbeat + finality
  return admissibleDelayCorrection
    ? Math.floor(fullHeartbeat + fullHeartbeat / admissibleDelayCorrection)
    : fullHeartbeat
}

function getLastRequest (requests: Array<Request>): Request | undefined {
  return requests.sort(
    (first, second) => parseInt(second.timestamp) - parseInt(first.timestamp)
  )[0]
}
