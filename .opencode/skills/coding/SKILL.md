---
name: coding
description: Use when implementing features, fixing bugs, or writing code for POS Desktop.
---

# Coding Skill

Implement code for POS Desktop following Electron security best practices.

## Before Coding

1. Read relevant spec from `specs/`
2. Read relevant checklist from `checklists/`
3. Understand the module's data model and IPC contract

## Tech Stack

- **Frontend**: React + TypeScript, Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Database**: SQLite via better-sqlite3, Drizzle ORM or Knex.js
- **Desktop**: Electron with context isolation

## Electron Security Rules

```typescript
// main.ts - ALWAYS use these settings
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,    // REQUIRED
    nodeIntegration: false,    // REQUIRED
    preload: path.join(__dirname, 'preload.ts')
  }
});
```

```typescript
// preload.ts - Whitelist IPC channels
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Explicitly whitelist each channel
  getProducts: (filters) => ipcRenderer.invoke('product:list', filters),
  createProduct: (data) => ipcRenderer.invoke('product:create', data),
});
```

## Code Patterns

### Repository Pattern (electron/services/)
```typescript
// electron/services/product/repo.ts
import { db } from '../../db';
import { products } from '../../db/schema';

export const productRepo = {
  list: (filters?: ProductFilter) => db.select().from(products).where(filters),
  create: (data: CreateProductDTO) => db.insert(products).values(data).returning(),
  update: (id: string, data: Partial<Product>) => db.update(products).set(data).where(eq(products.id, id)),
  delete: (id: string) => db.delete(products).where(eq(products.id, id)),
};
```

### Zustand Store (src/stores/)
```typescript
// src/stores/products.ts
import { create } from 'zustand';

interface ProductStore {
  products: Product[];
  loading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (data: CreateProductDTO) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  loading: false,
  fetchProducts: async () => {
    set({ loading: true });
    const products = await window.api.getProducts();
    set({ products, loading: false });
  },
  // ...
}));
```

### React Component (src/components/)
```tsx
// src/components/products/ProductList.tsx
import { useProductStore } from '@/stores/products';

export function ProductList() {
  const { products, loading, fetchProducts } = useProductStore();
  
  useEffect(() => { fetchProducts(); }, []);
  
  if (loading) return <Skeleton />;
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

## After Coding

1. Run `npm run lint` - fix any errors
2. Run `npm run typecheck` - fix any type errors
3. Update progress using `write-progress` skill

## Rules

- All user-facing text in Indonesian
- Validate and sanitize all user input
- Use TypeScript strict mode
- Follow existing code conventions in the project
- Never commit secrets or API keys
