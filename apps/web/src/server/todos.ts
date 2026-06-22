import { createDb, todos, type TodoRow } from "@workspace/database";
import { createTodo as buildTodo } from "@workspace/todo-list-core";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, eq, sql } from "drizzle-orm";
import { getSession, requireUser } from "#/server/session";

/** Serializable todo sent to the client (D1 stores createdAt as a Date). */
export interface TodoDTO {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

function toDTO(row: TodoRow): TodoDTO {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.createdAt.getTime(),
  };
}

/** Narrow an unknown RPC payload to `{ id }`. */
function validateId(input: unknown): { id: string } {
  if (
    typeof input !== "object" ||
    input === null ||
    typeof (input as { id?: unknown }).id !== "string"
  ) {
    throw new Error("A todo id is required");
  }
  return { id: (input as { id: string }).id };
}

/**
 * List the current user's todos, newest first. Returns an empty list when there
 * is no session yet (a brand-new visitor who hasn't created an anonymous
 * account), so the page still renders.
 */
export const listTodos = createServerFn({ method: "GET" }).handler(async (): Promise<TodoDTO[]> => {
  const session = await getSession();
  if (!session?.user) return [];
  const db = createDb(env);
  const rows = await db
    .select()
    .from(todos)
    .where(eq(todos.userId, session.user.id))
    .orderBy(sql`${todos.createdAt} desc`);
  return rows.map(toDTO);
});

export const createTodoFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (
      typeof input !== "object" ||
      input === null ||
      typeof (input as { title?: unknown }).title !== "string"
    ) {
      throw new Error("A todo title is required");
    }
    return { title: (input as { title: string }).title };
  })
  .handler(async ({ data }): Promise<TodoDTO> => {
    const user = await requireUser();
    const db = createDb(env);
    // Reuse the domain rule (trim + reject empty) from todo-list-core.
    const todo = buildTodo(data.title, { id: crypto.randomUUID(), createdAt: Date.now() });
    const [row] = await db
      .insert(todos)
      .values({ id: todo.id, userId: user.id, title: todo.title })
      .returning();
    return toDTO(row);
  });

export const toggleTodoFn = createServerFn({ method: "POST" })
  .validator(validateId)
  .handler(async ({ data }): Promise<TodoDTO> => {
    const user = await requireUser();
    const db = createDb(env);
    const [row] = await db
      .update(todos)
      .set({ completed: sql`NOT ${todos.completed}` })
      .where(and(eq(todos.id, data.id), eq(todos.userId, user.id)))
      .returning();
    if (!row) throw new Error("Todo not found");
    return toDTO(row);
  });

export const renameTodoFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const { id } = validateId(input);
    const title = (input as { title?: unknown }).title;
    if (typeof title !== "string") throw new Error("A todo title is required");
    return { id, title };
  })
  .handler(async ({ data }): Promise<TodoDTO> => {
    const user = await requireUser();
    // Same non-empty rule as todo-list-core's renameTodo.
    const title = data.title.trim();
    if (!title) throw new Error("Todo title must not be empty");
    const db = createDb(env);
    const [row] = await db
      .update(todos)
      .set({ title })
      .where(and(eq(todos.id, data.id), eq(todos.userId, user.id)))
      .returning();
    if (!row) throw new Error("Todo not found");
    return toDTO(row);
  });

export const deleteTodoFn = createServerFn({ method: "POST" })
  .validator(validateId)
  .handler(async ({ data }): Promise<{ id: string }> => {
    const user = await requireUser();
    const db = createDb(env);
    const [row] = await db
      .delete(todos)
      .where(and(eq(todos.id, data.id), eq(todos.userId, user.id)))
      .returning({ id: todos.id });
    if (!row) throw new Error("Todo not found");
    return { id: row.id };
  });
