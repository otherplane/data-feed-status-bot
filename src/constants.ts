export const MAINNET_KEYWORDS = ['mainnet', 'tethys']

export const ADMISSIBLE_DELAY_MS: number =
  Number(process.env.ADMISSIBLE_DELAY_SECONDS || '0') * 1000
