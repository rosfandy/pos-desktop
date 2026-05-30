---
name: write-spec
description: Use when creating technical specifications from PRD requirements for POS Desktop.
---

# Write Spec

Convert PRD requirements into detailed technical specifications.

## Process

1. Read the relevant PRD document
2. Analyze technical requirements
3. Define data models, APIs, and component structure
4. Write specification document

## Spec Structure

```markdown
# Technical Spec: [Module Name]

## 1. Overview
- Module purpose, linked PRD sections

## 2. Architecture
- Component hierarchy
- Data flow diagram
- Integration points

## 3. Data Models
```typescript
// TypeScript interfaces or Drizzle schema
interface Product {
  id: string;
  name: string;
  // ...
}
```

## 4. API / IPC Contract
```typescript
// IPC channel definitions
interface ProductIPC {
  'product:list': { filters: ProductFilter } => Product[];
  'product:create': { data: CreateProductDTO } => Product;
}
```

## 5. Component Structure
```
src/components/products/
├── ProductList.tsx
├── ProductForm.tsx
└── ProductCard.tsx
```

## 6. State Management
- Zustand store shape
- Actions and selectors

## 7. Error Handling
- Error types and codes
- User-facing messages

## 8. Testing Strategy
- Unit test coverage targets
- Integration test scenarios
```

## Output

Save as `specs/[module-name]-spec.md`.

## Rules

- Use TypeScript for all type definitions
- Follow `electron/` and `src/` folder split
- Define IPC channels explicitly (whitelist pattern)
- Include Drizzle ORM schema for SQLite tables
