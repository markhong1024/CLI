"use client"

import { useState, useEffect, useRef } from "react"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

const STORAGE_KEY = "todo-list"

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState("")
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setTodos(JSON.parse(saved))
    } catch {
      // ignore parse errors
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    }
  }, [todos, mounted])

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  const completedCount = todos.filter((t) => t.completed).length
  const totalCount = todos.length
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  function addTodo() {
    const text = input.trim()
    if (!text) return
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, completed: false, createdAt: Date.now() },
    ])
    setInput("")
    inputRef.current?.focus()
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed))
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-center">오늘의 할일</CardTitle>
          <p className="text-sm text-center text-muted-foreground">{today}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 입력 영역 */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="할일을 입력하세요..."
              className="flex-1"
            />
            <Button onClick={addTodo} size="icon" aria-label="추가">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 진행률 */}
          {totalCount > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>진행률</span>
                <span>
                  {completedCount} / {totalCount} 완료
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 할일 목록 */}
          <ul className="space-y-2">
            {todos.length === 0 && (
              <li className="text-center text-sm text-muted-foreground py-8">
                할일을 추가해보세요!
              </li>
            )}
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-background hover:bg-accent/30 transition-colors"
              >
                <Checkbox
                  id={todo.id}
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                />
                <label
                  htmlFor={todo.id}
                  className={cn(
                    "flex-1 text-sm cursor-pointer select-none",
                    todo.completed && "line-through text-muted-foreground"
                  )}
                >
                  {todo.text}
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteTodo(todo.id)}
                  aria-label="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>

        {/* 완료 항목 삭제 버튼 */}
        {completedCount > 0 && (
          <CardFooter className="pt-0 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompleted}
              className="text-muted-foreground hover:text-destructive hover:border-destructive"
            >
              완료 항목 모두 삭제 ({completedCount})
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
