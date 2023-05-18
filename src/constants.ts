export const MAINNET_KEYWORDS = ['mainnet', 'tethys', 'one']

export const ADMISSIBLE_DELAY_MS: number =
  Number(process.env.ADMISSIBLE_DELAY_SECONDS || '0') * 1000

export const DAYS_TO_CONSIDER_FEED_INACTIVE = Number(
  process.env.DAYS_TO_CONSIDER_FEED_INACTIVE
)

export const TIME_TO_CONSIDER_FEED_INACTIVE_MS =
  Number(DAYS_TO_CONSIDER_FEED_INACTIVE || '7') * 24 * 3600 * 1000

export const RETRY_AFTER_MS = Number(process.env.RETRY_AFTER_MS || 3000)
export const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3)
