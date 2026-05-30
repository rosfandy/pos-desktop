# AGENTS.md

POS Desktop - Electron-based cashier application for UMKM/retail.

## Project Status

Early stage. Only PRD exists (`PRD-POS-Electron.md`). No code scaffolded yet.

## Tech Stack (planned)

- Electron + React + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (state), SQLite via better-sqlite3 (local DB)
- Vitest (unit), Playwright (E2E)
- electron-builder (packaging)

## Key Constraints

- Offline-first architecture
- Must support thermal printer, barcode scanner, cash drawer
- Startup < 3s, transaction response < 1s
- Context isolation enabled, nodeIntegration disabled
- Indonesian language for UI and docs

---

## Agents

### PM

**Role**: Define product requirements, prioritize features, manage PRD.

**Skill: `write-prd`**
- Read existing PRD at `PRD-POS-Electron.md` before writing
- Follow the PRD structure: Executive Summary, Features, Tech Specs, UI/UX, Roadmap
- Include acceptance criteria with Given/When/Then format
- Include risk matrix with mitigation
- Keep sections numbered for reference (e.g., "Section 5.1")
- Output as `PRD-[feature].md` in project root

---

### Engineer-Planner

**Role**: Break down PRD into technical specs, backlog, and implementation checklists.

**Skill: `write-spec`**
- Read PRD first, then produce technical specification
- Define data models, API contracts, component hierarchy
- Include folder structure matching `electron/` and `src/` split
- Output as `specs/[module]-spec.md`

**Skill: `write-backlog`**
- Convert specs into actionable backlog items
- Use priority: P0 (MVP must-have), P1 (important), P2 (nice-to-have)
- Each item: title, description, acceptance criteria, estimated complexity (S/M/L)
- Output as `backlog/[module]-backlog.md`

**Skill: `write-checklist`**
- Create implementation checklists from backlog items
- Each step must be a single, verifiable action
- Group by file or component to minimize context switching
- Include test verification steps
- Output as `checklists/[module]-checklist.md`

---

### Engineer

**Role**: Implement code following specs and checklists.

**Skill: `coding`**
- Read the relevant spec and checklist before coding
- Follow Electron security best practices: contextIsolation, no nodeIntegration
- IPC channels must be whitelisted in preload.ts
- Use Drizzle ORM or Knex.js for SQLite queries
- Frontend: React functional components + hooks, Zustand for state
- Style with Tailwind CSS + shadcn/ui components
- All user input must be validated and sanitized
- Run `npm run lint` and `npm run typecheck` after changes
- Do NOT commit unless explicitly asked

**Skill: `git-commit`**
- Only commit when explicitly asked by user
- Run `git status` and `git diff` before staging
- Stage only relevant files, never commit secrets or `.env`
- Use conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
- Keep subject line under 72 characters
- Run `npm run lint` and `npm run typecheck` before committing

**Skill: `write-progress`**
- Update `progress/[module]-progress.md` after completing each checklist item
- Track: completed items, blockers, notes, time spent
- Format: checkbox list matching checklist structure
- Add "Next Steps" section at the end

---

### QA

**Role**: Verify implementation matches acceptance criteria.

**Skill: `manual-test`**
- Read acceptance criteria from PRD or spec
- Create test scenarios with clear steps
- Test offline mode: disconnect network, verify all transactions work
- Test hardware: printer receipt output, barcode scanner input
- Test edge cases: zero stock, negative quantity, duplicate barcode
- Report bugs with: steps to reproduce, expected vs actual, severity
- Output as `qa/[module]-test-report.md`

**Skill: `write-progress`**
- Update `progress/[module]-qa-progress.md` after each test cycle
- Track: passed, failed, blocked, skipped tests
- Include bug references from test report
- Format: summary table + detailed notes

---

## File Conventions

| Path | Purpose |
|------|---------|
| `PRD-*.md` | Product requirements |
| `specs/` | Technical specifications |
| `backlog/` | Prioritized backlog items |
| `checklists/` | Implementation checklists |
| `progress/` | Work progress tracking |
| `qa/` | Test reports |
| `electron/` | Main process code |
| `src/` | Renderer (frontend) code |
| `database/` | SQLite migrations |

## Commands

```bash
# Development (once scaffolded)
npm run dev          # Start Electron + Vite dev server
npm run build        # Build for production
npm run lint         # ESLint check
npm run typecheck    # TypeScript type check
npm test             # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run dist         # Package with electron-builder
```
