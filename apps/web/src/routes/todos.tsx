import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  addTodo,
  clearCompleted,
  createTodo,
  filterTodos,
  remainingCount,
  removeTodo,
  toggleTodo,
  type Todo,
  type TodoFilter,
} from "todo-list-core";

export const Route = createFileRoute("/todos")({ component: TodosPage });

const FILTERS: TodoFilter[] = ["all", "active", "completed"];

function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [draft, setDraft] = useState("");

  const visible = filterTodos(todos, filter);
  const remaining = remainingCount(todos);

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    const todo = createTodo(draft, {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    });
    setTodos((current) => addTodo(current, todo));
    setDraft("");
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
        <p className="island-kicker mb-3">Powered by todo-list-core</p>
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
          <button
            type="submit"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.16)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.26)]"
          >
            Add
          </button>
        </form>

        <ul className="m-0 list-none space-y-2 p-0">
          {visible.map((todo) => (
            <li key={todo.id} className="island-shell flex items-center gap-3 rounded-xl px-4 py-3">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => setTodos((current) => toggleTodo(current, todo.id))}
                className="h-4 w-4"
              />
              <span
                className={`flex-1 text-sm text-[var(--sea-ink)] ${todo.completed ? "line-through opacity-60" : ""}`}
              >
                {todo.title}
              </span>
              <button
                type="button"
                onClick={() => setTodos((current) => removeTodo(current, todo.id))}
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
            onClick={() => setTodos((current) => clearCompleted(current))}
            className="transition hover:text-[var(--lagoon-deep)]"
          >
            Clear completed
          </button>
        </div>
      </section>
    </main>
  );
}
