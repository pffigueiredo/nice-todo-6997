
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type ToggleTodoInput } from '../schema';
import { toggleTodo } from '../handlers/toggle_todo';
import { eq } from 'drizzle-orm';

// Test input for creating a todo
const testCreateInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing'
};

describe('toggleTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle todo completion status from false to true', async () => {
    // Create a todo (starts with completed: false by default)
    const created = await db.insert(todosTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const todoId = created[0].id;
    expect(created[0].completed).toBe(false);

    // Toggle the todo
    const input: ToggleTodoInput = { id: todoId };
    const result = await toggleTodo(input);

    // Verify the completion status was flipped
    expect(result.id).toEqual(todoId);
    expect(result.completed).toBe(true);
    expect(result.title).toEqual(testCreateInput.title);
    expect(result.description).toEqual(testCreateInput.description);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should toggle todo completion status from true to false', async () => {
    // Create a todo and set it as completed
    const created = await db.insert(todosTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        completed: true
      })
      .returning()
      .execute();

    const todoId = created[0].id;
    expect(created[0].completed).toBe(true);

    // Toggle the todo
    const input: ToggleTodoInput = { id: todoId };
    const result = await toggleTodo(input);

    // Verify the completion status was flipped
    expect(result.id).toEqual(todoId);
    expect(result.completed).toBe(false);
    expect(result.title).toEqual(testCreateInput.title);
    expect(result.description).toEqual(testCreateInput.description);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp when toggling', async () => {
    // Create a todo
    const created = await db.insert(todosTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const todoId = created[0].id;
    const originalUpdatedAt = created[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Toggle the todo
    const input: ToggleTodoInput = { id: todoId };
    const result = await toggleTodo(input);

    // Verify the updated_at timestamp was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should save changes to database', async () => {
    // Create a todo
    const created = await db.insert(todosTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const todoId = created[0].id;
    expect(created[0].completed).toBe(false);

    // Toggle the todo
    const input: ToggleTodoInput = { id: todoId };
    await toggleTodo(input);

    // Verify the changes were saved in the database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toBe(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when todo does not exist', async () => {
    const input: ToggleTodoInput = { id: 99999 };

    await expect(toggleTodo(input)).rejects.toThrow(/todo with id 99999 not found/i);
  });
});
