---
description: 새 커스텀 에이전트를 scaffolding합니다. 이름과 역할을 인자로 받습니다.
---

Create a new custom agent definition in `.claude/agents/`. Arguments: $ARGUMENTS

The argument format is: `<agent-name> <role description>`
Example: `sql-reviewer Review SQL queries for performance and injection risks`

Steps:
1. Parse the agent name (first word) and role description (rest)
2. Create `.claude/agents/<agent-name>.md` with this structure:

```markdown
---
name: <agent-name>
description: <one sentence — used by Claude to auto-select this agent, so be specific about WHEN it triggers>
tools: Read, Bash
---

You are an expert in <domain>.

## What you do
<2-3 sentences describing the agent's core responsibility>

## Process
1. ...
2. ...

## Output format
<describe the expected output structure>

## Rules
- DO: ...
- DO NOT: ...
```

3. Update `CLAUDE.md` to add the new agent to the agents table
4. Report what was created and how to invoke it

If no arguments are provided, ask the user for the agent name and role.
