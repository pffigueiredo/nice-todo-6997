
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const originalTodo = createResult[0];
    const originalUpdatedAt = originalTodo.updated_at;

    // Wait a bit to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTodoInput = {
      id: originalTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(originalTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toEqual(originalTodo.created_at);
    expect(result.updated_at).not.toEqual(originalUpdatedAt);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update todo description', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const originalTodo = createResult[0];

    const updateInput: UpdateTodoInput = {
      id: originalTodo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(originalTodo.id);
    expect(result.title).toEqual('Test Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false);
  });

  it('should update todo completion status', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Title',
        description: 'Test description',
        completed: false
      })
      .returning()
      .execute();

    const originalTodo = createResult[0];

    const updateInput: UpdateTodoInput = {
      id: originalTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(originalTodo.id);
    expect(result.title).toEqual('Test Title');
    expect(result.description).toEqual('Test description');
    expect(result.completed).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const originalTodo = createResult[0];

    const updateInput: UpdateTodoInput = {
      id: originalTodo.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(originalTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(originalTodo.created_at);
  });

  it('should set description to null', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const originalTodo = createResult[0];

    const updateInput: UpdateTodoInput = {
      id: originalTodo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(originalTodo.id);
    expect(result.title).toEqual('Test Title');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
  });

  it('should save updated todo to database', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const originalTodo = createResult[0];

    const updateInput: UpdateTodoInput = {
      id: originalTodo.id,
      title: 'Updated Title',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify the update was saved to database
    const savedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, originalTodo.id))
      .execute();

    expect(savedTodos).toHaveLength(1);
    expect(savedTodos[0].title).toEqual('Updated Title');
    expect(savedTodos[0].description).toEqual('Original description');
    expect(savedTodos[0].completed).toEqual(true);
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999999,
      title: 'Updated Title'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });
});
