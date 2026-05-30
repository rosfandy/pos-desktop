---
name: write-progress
description: Use when tracking implementation or QA progress on checklists for POS Desktop.
---

# Write Progress

Track progress on implementation checklists and QA testing.

## Implementation Progress

Update after completing each checklist item.

### Format

```markdown
# Progress: [Module Name]

**Started**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD

## Summary
- Total items: X
- Completed: X
- In Progress: X
- Blocked: X

## Checklist Progress

### Setup
- [x] Create directory structure ✓ 2026-05-28
- [x] Initialize required files ✓ 2026-05-28
- [ ] Install dependencies

### Database Layer
- [ ] Define Drizzle schema
  - **Status**: Not started
  - **Notes**: Waiting for spec finalization
- [ ] Create migration
  - **Status**: Blocked
  - **Blocked by**: Schema definition
  - **Notes**: Need to finalize product fields

## Blockers
1. [BLOCKER-001] Description of blocker
   - **Impact**: What is affected
   - **Resolution**: How to unblock

## Next Steps
1. Complete schema definition
2. Run migration
3. Implement repository

## Notes
- Any relevant observations or decisions
```

## QA Progress

Update after each test cycle.

### Format

```markdown
# QA Progress: [Module Name]

**Test Cycle**: 1
**Date**: YYYY-MM-DD
**Tester**: Agent/QA Name

## Summary
| Status | Count |
|--------|-------|
| Passed | X |
| Failed | X |
| Blocked | X |
| Skipped | X |

## Test Results

### Feature: Product CRUD
- [x] TC-001: Create product with valid data ✓ PASSED
- [x] TC-002: Create product with duplicate barcode ✗ FAILED
  - **Bug**: BUG-001
  - **Expected**: Error message shown
  - **Actual**: App crashes
- [ ] TC-003: Update product stock ⏸ BLOCKED
  - **Blocked by**: BUG-001

## Bugs Found
| Bug ID | Severity | Description | Status |
|--------|----------|-------------|--------|
| BUG-001 | High | Crash on duplicate barcode | Open |

## Notes
- Performance observations
- UX feedback
```

## Output

- Implementation: `progress/[module]-progress.md`
- QA: `progress/[module]-qa-progress.md`

## Rules

- Update in real-time, not batch
- Include timestamps for tracking
- Reference bug IDs in QA progress
- Add "Next Steps" section at the end
