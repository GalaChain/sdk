export interface IGalaChainError {
  code: number
  message: string
  errorId?: string
  details?: Record<string, unknown>
}
