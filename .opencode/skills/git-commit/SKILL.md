---
name: git-commit
description: Use when committing changes to git repository. Run lint and typecheck before committing.
---

# Git Commit Skill

Commit changes following conventional commit format with pre-commit checks.

## Process

1. Run `git status` to see changed files
2. Run `git diff` to review changes
3. Run `npm run lint` - must pass
4. Run `npm run typecheck` - must pass
5. Stage relevant files
6. Commit with conventional format

## Conventional Commit Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `chore`: Build process, dependencies, tooling
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `style`: Formatting, no code change
- `perf`: Performance improvement

### Examples

```
feat(products): add product CRUD with barcode support
fix(cart): resolve quantity update not reflecting in total
refactor(ipc): consolidate product IPC handlers
chore(deps): update electron to v28
docs(readme): add setup instructions
test(products): add unit tests for product repository
```

## Rules

- Only commit when explicitly asked by user
- Never commit secrets, `.env`, or API keys
- Subject line under 72 characters
- Use imperative mood ("add" not "added")
- Stage only relevant files
- Run lint and typecheck before every commit
