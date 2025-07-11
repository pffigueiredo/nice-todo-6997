
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo first
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        completed: false
      })
      .execute();

    // Delete the todo
    const result = await deleteTodo(testInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify todo was actually removed from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testInput.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when todo does not exist', async () => {
    // Try to delete a non-existent todo
    const result = await deleteTodo({ id: 999 });

    // Should return false for non-existent todo
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting specific todo', async () => {
    // Create multiple todos
    await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo', completed: false },
        { title: 'Todo 2', description: 'Second todo', completed: true }
      ])
      .execute();

    // Delete the first todo
    const result = await deleteTodo({ id: 1 });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify only the specified todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toEqual('Todo 2');
    expect(remainingTodos[0].id).toEqual(2);
  });
});
