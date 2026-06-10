---
description: 테스트를 실행하고 실패한 테스트를 분석하여 수정 방향을 제안합니다.
---

Run the test suite and analyze results.

Steps:
1. Run `npm test` (or the appropriate test command for this project)
2. If all tests pass: report the summary (suites, tests, duration) — done
3. If tests fail:
   - List each failing test with its error message
   - For each failure, diagnose the root cause (wrong assertion, stale mock, implementation bug, or test bug)
   - Suggest a concrete fix for each — specify whether the fix should go in the test or the implementation
   - If the fix is clear and low-risk, apply it directly; otherwise explain and ask before changing

Do not hide failures or downplay them. A failing test is information.
