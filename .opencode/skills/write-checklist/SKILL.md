---
name: write-checklist
description: Use when creating implementation checklists from backlog items for POS Desktop development.
---

# Write Checklist

Convert backlog items into step-by-step implementation checklists.

## Process

1. Read backlog from `backlog/`
2. Break each item into verifiable steps
3. Group by file or component
4. Write checklist document

## Checklist Format

```markdown
# Implementation Checklist: [Module Name]

## Setup
- [ ] Create directory structure
- [ ] Initialize required files
- [ ] Install dependencies

## Database Layer
- [ ] Define Drizzle schema in `electron/db/schema/[table].ts`
  - Verify: Schema compiles without errors
- [ ] Create migration in `database/migrations/`
  - Verify: Migration runs successfully
- [ ] Implement repository in `electron/services/[module]/repo.ts`
  - Verify: CRUD operations work via IPC

## Frontend Layer
- [ ] Create Zustand store in `src/stores/[module].ts`
  - Verify: Store initializes with correct state
- [ ] Build components in `src/components/[module]/`
  - Verify: Components render without errors
- [ ] Implement pages in `src/pages/[module].tsx`
  - Verify: Page loads, navigation works

## Integration
- [ ] Wire IPC handlers in `electron/ipc/[module].ts`
  - Verify: Frontend can call backend via IPC
- [ ] Add to preload.ts whitelist
  - Verify: IPC channels accessible from renderer

## Testing
- [ ] Write unit tests for repository
  - Verify: All tests pass with `npm test`
- [ ] Write component tests
  - Verify: Components render correctly
```

## Output

Save as `checklists/[module-name]-checklist.md`.

## Rules

- Each step must be a single, verifiable action
- Include verification criteria for each step
- Group by file or component to minimize context switching
- Order dependencies first (database before frontend)
- Include test verification steps
