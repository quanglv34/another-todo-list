# todo-list-core

Framework-agnostic todo domain logic for this monorepo: the `Todo` type plus
pure functions for creating, toggling, filtering, and counting todos. No UI, no
framework dependencies — just data in, new data out.

Consumed by `apps/web` via the workspace dependency `todo-list-core`.

## Development

```bash
vp install      # from the workspace root
vp test         # run the unit tests
vp check        # format + lint + type-check
```

## API

```ts
import {
  type Todo,
  type TodoFilter,
  createTodo,
  addTodo,
  toggleTodo,
  renameTodo,
  removeTodo,
  clearCompleted,
  filterTodos,
  remainingCount,
} from "todo-list-core";
```

All functions are pure and never mutate their inputs. `createTodo` takes an
explicit `{ id, createdAt }` so callers stay deterministic and testable.
