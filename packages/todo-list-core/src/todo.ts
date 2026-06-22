/**
 * Framework-agnostic todo domain logic.
 *
 * Everything here is pure: functions take state and return new state, never
 * mutating their inputs. This keeps the core trivially testable and reusable
 * across any UI (React, CLI, server functions, ...).
 */

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export type TodoFilter = "all" | "active" | "completed";

/** Create a new todo. `id`/`createdAt` are injected so callers stay deterministic. */
export function createTodo(title: string, options: { id: string; createdAt: number }): Todo {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Todo title must not be empty");
  }
  return {
    id: options.id,
    title: trimmed,
    completed: false,
    createdAt: options.createdAt,
  };
}

/** Add a todo to a list, returning a new list. */
export function addTodo(todos: readonly Todo[], todo: Todo): Todo[] {
  return [...todos, todo];
}

/** Toggle a todo's completed flag by id. */
export function toggleTodo(todos: readonly Todo[], id: string): Todo[] {
  return todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
}

/** Rename a todo by id. Empty/whitespace titles are rejected. */
export function renameTodo(todos: readonly Todo[], id: string, title: string): Todo[] {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Todo title must not be empty");
  }
  return todos.map((todo) => (todo.id === id ? { ...todo, title: trimmed } : todo));
}

/** Remove a todo by id. */
export function removeTodo(todos: readonly Todo[], id: string): Todo[] {
  return todos.filter((todo) => todo.id !== id);
}

/** Drop every completed todo. */
export function clearCompleted(todos: readonly Todo[]): Todo[] {
  return todos.filter((todo) => !todo.completed);
}

/** Filter a list by status. */
export function filterTodos(todos: readonly Todo[], filter: TodoFilter): Todo[] {
  switch (filter) {
    case "active":
      return todos.filter((todo) => !todo.completed);
    case "completed":
      return todos.filter((todo) => todo.completed);
    case "all":
      return [...todos];
  }
}

/** Count the todos that are still active (not completed). */
export function remainingCount(todos: readonly Todo[]): number {
  return todos.reduce((count, todo) => (todo.completed ? count : count + 1), 0);
}
