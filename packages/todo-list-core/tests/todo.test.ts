import { expect, test } from "vite-plus/test";
import {
  addTodo,
  clearCompleted,
  createTodo,
  filterTodos,
  remainingCount,
  removeTodo,
  renameTodo,
  toggleTodo,
  type Todo,
} from "../src/index.ts";

function make(title: string, id: string, createdAt = 0): Todo {
  return createTodo(title, { id, createdAt });
}

test("createTodo trims the title and starts incomplete", () => {
  const todo = createTodo("  buy milk  ", { id: "1", createdAt: 123 });
  expect(todo).toEqual({
    id: "1",
    title: "buy milk",
    completed: false,
    createdAt: 123,
  });
});

test("createTodo rejects empty titles", () => {
  expect(() => createTodo("   ", { id: "1", createdAt: 0 })).toThrow();
});

test("addTodo appends without mutating the source list", () => {
  const a = make("a", "1");
  const list = [a];
  const next = addTodo(list, make("b", "2"));
  expect(next).toHaveLength(2);
  expect(list).toHaveLength(1);
});

test("toggleTodo flips only the matching todo", () => {
  const list = [make("a", "1"), make("b", "2")];
  const next = toggleTodo(list, "1");
  expect(next[0].completed).toBe(true);
  expect(next[1].completed).toBe(false);
});

test("renameTodo updates the title and rejects empty input", () => {
  const list = [make("a", "1")];
  expect(renameTodo(list, "1", "renamed")[0].title).toBe("renamed");
  expect(() => renameTodo(list, "1", "  ")).toThrow();
});

test("removeTodo drops the matching todo", () => {
  const list = [make("a", "1"), make("b", "2")];
  expect(removeTodo(list, "1")).toEqual([make("b", "2")]);
});

test("clearCompleted keeps only active todos", () => {
  const list = toggleTodo([make("a", "1"), make("b", "2")], "1");
  expect(clearCompleted(list)).toEqual([make("b", "2")]);
});

test("filterTodos splits by status", () => {
  const list = toggleTodo([make("a", "1"), make("b", "2")], "1");
  expect(filterTodos(list, "all")).toHaveLength(2);
  expect(filterTodos(list, "active").map((t) => t.id)).toEqual(["2"]);
  expect(filterTodos(list, "completed").map((t) => t.id)).toEqual(["1"]);
});

test("remainingCount counts active todos", () => {
  const list = toggleTodo([make("a", "1"), make("b", "2")], "1");
  expect(remainingCount(list)).toBe(1);
});
