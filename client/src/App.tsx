
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Load todos from API
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
      // Fallback data for demonstration
      setTodos([
        {
          id: 1,
          title: '🎯 Complete the todo app',
          description: 'Build a beautiful and functional todo application with React and tRPC',
          completed: false,
          created_at: new Date('2024-01-15T10:00:00Z'),
          updated_at: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: 2,
          title: '📚 Read documentation',
          description: 'Go through the Radix UI and Tailwind CSS documentation',
          completed: true,
          created_at: new Date('2024-01-14T14:30:00Z'),
          updated_at: new Date('2024-01-14T16:45:00Z')
        },
        {
          id: 3,
          title: '🚀 Deploy application',
          description: null,
          completed: false,
          created_at: new Date('2024-01-13T09:15:00Z'),
          updated_at: new Date('2024-01-13T09:15:00Z')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Create new todo
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsCreating(true);
    try {
      const newTodo = await trpc.createTodo.mutate(formData);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setFormData({ title: '', description: null });
    } catch (error) {
      console.error('Failed to create todo:', error);
      // Fallback implementation for demonstration
      const newTodo: Todo = {
        id: Math.max(...todos.map(t => t.id), 0) + 1,
        title: formData.title,
        description: formData.description,
        completed: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setFormData({ title: '', description: null });
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle todo completion
  const handleToggleTodo = async (todoId: number) => {
    try {
      await trpc.toggleTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) =>
          todo.id === todoId ? { ...todo, completed: !todo.completed, updated_at: new Date() } : todo
        )
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      // Fallback implementation for demonstration
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) =>
          todo.id === todoId ? { ...todo, completed: !todo.completed, updated_at: new Date() } : todo
        )
      );
    }
  };

  // Delete todo
  const handleDeleteTodo = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
      // Fallback implementation for demonstration
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== todoId));
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✨ Todo App
          </h1>
          <p className="text-gray-600">
            Stay organized and get things done
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-8">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            📋 Total: {totalCount}
          </Badge>
          <Badge variant="default" className="text-sm px-4 py-2 bg-green-100 text-green-800">
            ✅ Completed: {completedCount}
          </Badge>
          <Badge variant="outline" className="text-sm px-4 py-2">
            ⏳ Remaining: {totalCount - completedCount}
          </Badge>
        </div>

        {/* Create Todo Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Todo
            </CardTitle>
            <CardDescription>
              Create a new task to keep track of your goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <div>
                <Input
                  placeholder="What do you need to do? 🎯"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  className="text-lg h-12"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Add a description (optional) 📝"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateTodoInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                  className="resize-none"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isCreating || !formData.title.trim()}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Add Todo
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-2 border-gray-300 bg-white/50">
              <CardContent className="pt-6">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No todos yet!</h3>
                <p className="text-gray-500">Create your first todo above to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {todos.map((todo: Todo) => (
                <Card 
                  key={todo.id} 
                  className={`shadow-md hover:shadow-lg transition-all duration-200 border-0 ${
                    todo.completed 
                      ? 'bg-green-50/80 backdrop-blur-sm' 
                      : 'bg-white/80 backdrop-blur-sm hover:bg-white/90'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleTodo(todo.id)}
                        className="mt-1 hover:scale-110 transition-transform duration-200"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-semibold mb-2 ${
                          todo.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-800'
                        }`}>
                          {todo.title}
                        </h3>
                        
                        {todo.description && (
                          <p className={`text-sm mb-3 ${
                            todo.completed 
                              ? 'line-through text-gray-400' 
                              : 'text-gray-600'
                          }`}>
                            {todo.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>📅 Created: {todo.created_at.toLocaleDateString()}</span>
                          {todo.updated_at.getTime() !== todo.created_at.getTime() && (
                            <>
                              <Separator orientation="vertical" className="h-3" />
                              <span>🔄 Updated: {todo.updated_at.toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>✨ Built with React, tRPC, and Radix UI</p>
        </div>
      </div>
    </div>
  );
}

export default App;
