# Subagents 실험 워크스페이스

이 프로젝트는 Claude Code의 custom subagent 기능을 실험하기 위한 워크스페이스입니다.

## 등록된 에이전트

| 에이전트 | 파일 | 용도 |
|----------|------|------|
| `code-reviewer` | `.claude/agents/code-reviewer.md` | 코드 리뷰, 버그/보안 이슈 탐지 |
| `test-writer` | `.claude/agents/test-writer.md` | 단위/통합 테스트 자동 작성 |
| `doc-writer` | `.claude/agents/doc-writer.md` | README, docstring, API 문서 생성 |

## 에이전트 호출 방법

### Claude Code CLI에서 직접 호출
에이전트는 `Agent` 도구에서 `subagent_type` 파라미터로 지정합니다:

```
Agent(subagent_type="code-reviewer", prompt="src/auth.ts 파일 리뷰해줘")
Agent(subagent_type="test-writer", prompt="src/utils.ts에 대한 테스트 작성해줘")
Agent(subagent_type="doc-writer", prompt="src/api.ts에 JSDoc 추가해줘")
```

### 언제 어떤 에이전트를 쓸까?

- **code-reviewer**: PR 올리기 전 자체 리뷰, 낯선 코드 분석, 보안 감사
- **test-writer**: 새 모듈 작성 후 테스트 커버리지 확보, TDD 보조
- **doc-writer**: 공개 API 문서화, 팀 온보딩 자료 생성

## Slash Commands (Skills)

| 커맨드 | 사용법 | 설명 |
|--------|--------|------|
| `/review` | `/review src/foo.ts` | 코드 리뷰 (버그/보안/성능) |
| `/test` | `/test src/foo.ts` | 테스트 코드 자동 작성 |
| `/doc` | `/doc src/foo.ts` | TSDoc 주석 추가 |
| `/security-audit` | `/security-audit src/` | OWASP 기준 보안 감사 |
| `/run-tests` | `/run-tests` | 테스트 실행 + 실패 분석 |
| `/new-agent` | `/new-agent sql-reviewer SQL 쿼리 리뷰` | 새 에이전트 scaffolding |

## 새 에이전트 추가하기

`.claude/agents/` 디렉토리에 마크다운 파일을 추가합니다:

```markdown
---
name: my-agent
description: 이 에이전트가 언제 자동 선택되는지 설명 (중요)
tools: Read, Write, Edit, Bash
---

여기에 시스템 프롬프트를 작성합니다.
```

`description`은 Claude가 어떤 작업에 이 에이전트를 자동으로 선택할지 결정하는 데 사용됩니다. 구체적이고 명확하게 작성하세요.
