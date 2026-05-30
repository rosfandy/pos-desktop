---
name: write-prd
description: Use when creating or updating Product Requirements Documents (PRD) for POS Desktop features.
---

# Write PRD

Create comprehensive PRD documents for POS Desktop features.

## Process

1. Read existing `PRD-POS-Electron.md` for reference structure
2. Gather requirements from user or stakeholders
3. Write PRD following the standard structure

## PRD Structure

```markdown
# PRD: [Feature Name]

## 1. Overview
- Feature name, version, date, target release

## 2. Problem Statement
- What problem does this solve?
- Who is affected?

## 3. Proposed Solution
- High-level description
- Key functionality

## 4. User Stories
- As a [role], I want [action], so that [benefit]

## 5. Acceptance Criteria
Given [context]
When [action]
Then [expected result]

## 6. Technical Considerations
- Dependencies on existing modules
- Data model changes
- API changes

## 7. UI/UX Requirements
- Wireframes or descriptions
- Keyboard shortcuts
- Accessibility

## 8. Risks & Mitigations
| Risk | Impact | Mitigation |

## 9. Timeline
- Milestones and deliverables
```

## Output

Save as `PRD-[feature-name].md` in project root.

## Rules

- Use Indonesian language for user-facing content
- Include Given/When/Then acceptance criteria
- Reference existing modules from `PRD-POS-Electron.md`
- Keep sections numbered for easy reference
