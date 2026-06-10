---
description: 지정한 소스 파일의 테스트 코드를 작성합니다. 기존 테스트 패턴을 따릅니다.
---

Write comprehensive tests for: $ARGUMENTS

Process:
1. Read the source file to understand the public API and behavior
2. Check for existing test files in the project and match their style (framework, assertion style, file naming)
3. If no existing tests exist, use Jest with TypeScript (ts-jest)

Cover:
- Happy path — normal inputs produce expected outputs
- Edge cases — empty input, boundary values, zero, null/undefined
- Error cases — what happens when preconditions fail (thrown errors, returned falsy)
- Side effects — if the function writes to disk/network/DB, mock at the boundary and verify the call

Do NOT:
- Test private/internal implementation details
- Mock everything — only mock at system boundaries (fs, http, db)
- Add tests purely to hit a coverage number

Name the test file following project convention. Write it directly — don't ask for confirmation.
