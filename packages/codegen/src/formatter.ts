// Lightweight formatter - in production replace with actual prettier
export async function formatCode(code: string): Promise<string> {
  // When running in Node.js with prettier installed, use:
  // const prettier = await import('prettier')
  // return prettier.format(code, { parser: 'typescript', ...prettierConfig })
  
  // Fallback: basic indentation normalisation
  return code
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n'
}
