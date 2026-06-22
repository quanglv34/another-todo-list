import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@workspace/ui";
import { filterTodos, remainingCount, type TodoFilter } from "@workspace/todo-list-core";
import { ensureAnonymousSession } from "#/lib/auth-client";
import {
  createTodoFn,
  deleteTodoFn,
  listTodos,
  renameTodoFn,
  toggleTodoFn,
  type TodoDTO,
} from "#/server/todos";

export const Route = createFileRoute("/todos")({
  loader: () => listTodos(),
  component: TodosPage,
});

const FILTERS: TodoFilter[] = ["all", "active", "completed"];

function TodosPage() {
  const todos = Route.useLoaderData();
  const router = useRouter();

  const [filter, setFilter] = useState<TodoFilter>("all");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [busy, setBusy] = useState(false);

  // `TodoDTO` is structurally a core `Todo`, so the pure helpers apply directly.
  const visible = filterTodos(todos, filter);
  const remaining = remainingCount(todos);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title || busy) return;
    setBusy(true);
    try {
      // Anonymous-first: create a guest account on the first todo if needed.
      await ensureAnonymousSession();
      await createTodoFn({ data: { title } });
      setDraft("");
      await router.invalidate();
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(todo: TodoDTO) {
    await toggleTodoFn({ data: { id: todo.id } });
    await router.invalidate();
  }

  async function handleDelete(id: string) {
    await deleteTodoFn({ data: { id } });
    await router.invalidate();
  }

  async function handleRenameCommit(id: string) {
    const title = editDraft.trim();
    setEditingId(null);
    if (!title) return;
    await renameTodoFn({ data: { id, title } });
    await router.invalidate();
  }

  async function handleClearCompleted() {
    const completed = todos.filter((todo) => todo.completed);
    if (completed.length === 0) return;
    await Promise.all(completed.map((todo) => deleteTodoFn({ data: { id: todo.id } })));
    await router.invalidate();
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
        <p className="island-kicker mb-3">Stored in your account</p>
        <h1 className="display-title mb-6 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Todos
        </h1>

        <form onSubmit={handleAdd} className="mb-6 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="What needs doing?"
            className="flex-1 rounded-full border border-[rgba(23,58,64,0.2)] bg-white/60 px-5 py-2.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[rgba(50,143,151,0.5)]"
          />
          <Button type="submit" size="md" isDisabled={busy}>
            Add
          </Button>
        </form>

        <ul className="m-0 list-none space-y-2 p-0">
          {visible.map((todo) => (
            <li key={todo.id} className="island-shell flex items-center gap-3 rounded-xl px-4 py-3">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
                className="h-4 w-4"
              />
              {editingId === todo.id ? (
                <input
                  autoFocus
                  value={editDraft}
                  onChange={(event) => setEditDraft(event.target.value)}
                  onBlur={() => handleRenameCommit(todo.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleRenameCommit(todo.id);
                    if (event.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-md border border-[rgba(50,143,151,0.5)] bg-white/70 px-2 py-1 text-sm text-[var(--sea-ink)] outline-none"
                />
              ) : (
                <span
                  onDoubleClick={() => {
                    setEditingId(todo.id);
                    setEditDraft(todo.title);
                  }}
                  className={`flex-1 cursor-text text-sm text-[var(--sea-ink)] ${todo.completed ? "line-through opacity-60" : ""}`}
                  title="Double-click to rename"
                >
                  {todo.title}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(todo.id)}
                className="text-sm text-[var(--sea-ink-soft)] transition hover:text-[var(--lagoon-deep)]"
              >
                Remove
              </button>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="text-sm text-[var(--sea-ink-soft)]">Nothing here yet.</li>
          )}
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--sea-ink-soft)]">
          <span>{remaining} remaining</span>
          <div className="flex gap-2">
            {FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-1 capitalize transition ${
                  filter === value
                    ? "bg-[rgba(79,184,178,0.2)] text-[var(--lagoon-deep)]"
                    : "hover:text-[var(--sea-ink)]"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleClearCompleted}
            className="transition hover:text-[var(--lagoon-deep)]"
          >
            Clear completed
          </button>
        </div>
      </section>
    </main>
  );
}
