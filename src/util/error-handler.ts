import { Merka2aError } from '@merk.a2a/sdk'
import { textContent } from './format.js'

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation()
  } catch (err) {
    if (err instanceof Merka2aError) {
      const lines = [
        `## Error: ${context}`,
        `- **Status:** ${err.status}`,
        `- **Message:** ${err.message}`,
      ]
      if (err.status === 401) lines.push('\n*Authentication failed. Check your MERKA2A_API_KEY or re-register.*')
      if (err.status === 403) lines.push('\n*Forbidden. You may not have the required role for this action.*')
      if (err.status === 404) lines.push('\n*Resource not found. Check the ID and try again.*')
      if (err.status === 400) lines.push('\n*Invalid request. Check your input parameters.*')
      if (err.status === 409) lines.push('\n*Conflict. The resource may already exist or be in an incompatible state.*')
      if (err.status === 429) lines.push('\n*Rate limited. Please wait a moment and try again.*')
      return textContent(lines.join('\n')) as unknown as T
    }
    return textContent(
      `## Error: ${context}\n\nUnexpected error: ${(err as Error).message}`
    ) as unknown as T
  }
}
