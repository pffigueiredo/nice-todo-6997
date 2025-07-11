
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
  });

  it('should return all todos ordered by creation date (newest first)', async () => {
    // Create test todos with slight delay to ensure different timestamps
    const firstTodo = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        description: 'First todo description',
        completed: false
      })
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondTodo = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        description: 'Second todo description',
        completed: true
      })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    
    // Verify ordering - newest first
    expect(result[0].title).toEqual('Second Todo');
    expect(result[1].title).toEqual('First Todo');
    
    // Verify all fields are present
    expect(result[0].id).toBeDefined();
    expect(result[0].description).toEqual('Second todo description');
    expect(result[0].completed).toBe(true);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    expect(result[1].id).toBeDefined();
    expect(result[1].description).toEqual('First todo description');
    expect(result[1].completed).toBe(false);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should handle todos with null descriptions', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Todo without description',
        description: null,
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Todo without description');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
  });
});
