---
description: 소스 파일에 TSDoc/JSDoc 주석을 추가합니다. 구현 코드는 변경하지 않습니다.
---

Add TSDoc documentation to: $ARGUMENTS

Rules:
- Read the file first, then edit in-place — do NOT change any implementation code
- For each exported function: one-line summary, `@param` for each non-obvious param, `@returns`, `@throws` if applicable
- Add `@example` only for non-obvious functions (helpers, higher-order fns, complex transformations)
- For interfaces/types: add a brief description of each field
- Skip documentation for self-explanatory functions where the name + types tell the whole story
- Do NOT add comments to private helpers, internal variables, or implementation blocks

Format:
```ts
/**
 * Splits an array into chunks of the given size.
 * @param arr - The source array
 * @param size - Maximum items per chunk
 * @returns Array of chunk arrays; last chunk may be smaller
 * @example
 * chunk([1,2,3,4,5], 2) // [[1,2],[3,4],[5]]
 */
```
