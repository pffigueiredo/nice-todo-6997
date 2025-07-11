
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ToggleTodoInput, type Todo } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const toggleTodo = async (input: ToggleTodoInput): Promise<Todo> => {
  try {
    // Update the todo by flipping the completed status and updating the timestamp
    const result = await db
      .update(todosTable)
      .set({
        completed: sql`NOT ${todosTable.completed}`, // Flip the boolean value
        updated_at: sql`NOW()` // Update timestamp
      })
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Todo toggle failed:', error);
    throw error;
  }
};
