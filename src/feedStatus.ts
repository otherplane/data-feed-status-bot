import { FAST_UPDATE_FEED_KEYWORDS } from './constants'
import { Feed } from './types'

export function isFeedOutdated (msToBeUpdated: number): boolean {
  return msToBeUpdated < 0
}

export function getMsToBeUpdated (
  dateNow: number,
  {
    heartbeat,
    lastResultTimestamp,
    feedFullName
  }: Pick<Feed, 'heartbeat' | 'lastResultTimestamp' | 'feedFullName'>
) {
  const ADMISSIBLE_DELAY =
    process.env.ADMISIBLE_DELAY &&
    FAST_UPDATE_FEED_KEYWORDS.find(keyword => feedFullName.includes(keyword))
      ? process.env.ADMISSIBLE_DELAY_LONG
      : process.env.ADMISSIBLE_DELAY
  const admissibleDelayCorrection = ADMISSIBLE_DELAY
    ? Number(ADMISSIBLE_DELAY)
    : undefined
  const admissibleDelay = calculateAdmissibleDelay(
    Number(heartbeat),
    admissibleDelayCorrection
  )

  const msSinceLastUpdate = dateNow - Number(lastResultTimestamp) * 1000
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
  admissibleDelayCorrection?: number
): number {
  return admissibleDelayCorrection
    ? Math.floor(heartbeat + heartbeat / admissibleDelayCorrection)
    : heartbeat
}
