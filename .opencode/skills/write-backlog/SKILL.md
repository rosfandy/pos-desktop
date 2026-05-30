---
name: write-backlog
description: Use when creating prioritized backlog items from technical specifications for POS Desktop.
---

# Write Backlog

Convert technical specifications into actionable backlog items.

## Process

1. Read the technical specification from `specs/`
2. Break down into implementable tasks
3. Prioritize and estimate complexity
4. Write backlog document

## Backlog Item Format

```markdown
### [PRIORITY-XXX] Item Title

**Priority**: P0 (MVP must-have) | P1 (important) | P2 (nice-to-have)
**Complexity**: S (1-2 days) | M (3-5 days) | L (1-2 weeks)
**Spec Reference**: Section X.X

**Description**:
What needs to be built, clear and concise.

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Dependencies**:
- [DEP-XXX] dependency description
```

## Priority Definitions

- **P0**: Core functionality, app unusable without it
- **P1**: Important feature, significantly improves UX
- **P2**: Nice to have, can be deferred to later release

## Output

Save as `backlog/[module-name]-backlog.md`.

## Rules

- Each item must be independently deployable
- Include clear acceptance criteria
- Reference spec sections for context
- Group related items together
- Order by priority (P0 first, then P1, P2)
