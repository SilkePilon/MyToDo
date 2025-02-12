"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  CalendarIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  deadline: string | null;
  project_id: string;
  emoji: string;
  user_id: string;
  user_email: string;
  project_name: string;
}

interface User {
  id: string;
  email?: string | null;
}

const commonEmojis = [
  "📝",
  "🔨",
  "📅",
  "🎯",
  "📚",
  "💡",
  "🔬",
  "🖥️",
  "📊",
  "🚀",
];

export default function ProjectPage() {
  const { id } = useParams();
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("");
  const [newItemDeadline, setNewItemDeadline] = useState("");
  const [editingItem, setEditingItem] = useState<TodoItem | null>(null);
  const [projectName, setProjectName] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTodoItems = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      const { data, error } = await supabase
        .from("todo_items_with_users")
        .select("*")
        .eq("project_id", id);
      if (error) console.error("Error fetching todo items:", error);
      else {
        setTodoItems(data || []);
        if (data && data.length > 0) {
          setProjectName(data[0].project_name);
        }
      }
    };
    fetchTodoItems();
  }, [id]);

  const addTodoItem = async () => {
    if (newItemTitle.trim() && user) {
      const { data, error } = await supabase
        .from("todo_items")
        .insert({
          title: newItemTitle,
          project_id: id,
          deadline: newItemDeadline || null,
          emoji: newItemEmoji,
          user_id: user.id,
        })
        .select();
      if (error) {
        console.error("Error adding todo item:", error);
        toast({
          title: "Error",
          description: "Failed to add todo item",
          variant: "destructive",
        });
      } else {
        const newItem = {
          ...data[0],
          user_email: user.email || "",
          project_name: projectName,
        };
        setTodoItems([...todoItems, newItem]);
        setNewItemTitle("");
        setNewItemEmoji("");
        setNewItemDeadline("");
        toast({
          title: "Success",
          description: "Todo item added successfully",
        });
      }
    }
  };

  const deleteTodoItem = async (id: string) => {
    const itemToDelete = todoItems.find((i) => i.id === id);
    if (user && itemToDelete && itemToDelete.user_id === user.id) {
      const { error } = await supabase.from("todo_items").delete().eq("id", id);
      if (error) {
        console.error("Error deleting todo item:", error);
        toast({
          title: "Error",
          description: "Failed to delete todo item",
          variant: "destructive",
        });
      } else {
        setTodoItems(todoItems.filter((i) => i.id !== id));
        toast({
          title: "Success",
          description: "Todo item deleted successfully",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "You can only delete your own todo items",
        variant: "destructive",
      });
    }
  };

  const toggleTodoItemCompletion = async (item: TodoItem) => {
    if (user && item.user_id === user.id) {
      const updatedItem = { ...item, completed: !item.completed };
      const { error } = await supabase
        .from("todo_items")
        .update({ completed: updatedItem.completed })
        .eq("id", item.id);
      if (error) {
        console.error("Error updating todo item completion:", error);
        toast({
          title: "Error",
          description: "Failed to update todo item",
          variant: "destructive",
        });
      } else {
        setTodoItems(
          todoItems.map((i) => (i.id === item.id ? updatedItem : i))
        );
        toast({
          title: "Success",
          description: "Todo item updated successfully",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "You can only update your own todo items",
        variant: "destructive",
      });
    }
  };

  const getCardColor = (item: TodoItem) => {
    if (item.completed) return "border-green-500";
    if (!item.deadline) return "border-blue-500";
    const daysUntilDeadline = Math.ceil(
      (new Date(item.deadline).getTime() - new Date().getTime()) /
        (1000 * 3600 * 24)
    );
    if (daysUntilDeadline <= 1) return "border-red-500";
    if (daysUntilDeadline <= 3) return "border-purple-500";
    return "border-blue-500";
  };

  if (!user) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Welcome to MyToDo Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Manage your tasks efficiently with MyToDo. Create, update, and track
            your to-do items for each project.
          </p>
          <p className="mt-4">Please sign in to view and manage tasks.</p>
          <Button asChild className="mt-4">
            <Link href="/">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">{projectName}</h1>
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Input
            type="text"
            placeholder="New task"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            className="flex-grow"
          />
          <Select value={newItemEmoji} onValueChange={setNewItemEmoji}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Emoji" />
            </SelectTrigger>
            <SelectContent>
              {commonEmojis.map((emoji) => (
                <SelectItem key={emoji} value={emoji}>
                  {emoji}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={newItemDeadline}
            onChange={(e) => setNewItemDeadline(e.target.value)}
          />
          <Button onClick={addTodoItem} className="w-full sm:w-auto">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
      </Card>
      <div className="space-y-4">
        {todoItems.map((item) => (
          <Card
            key={item.id}
            className={`transition-all duration-200 hover:shadow-lg border-2 ${getCardColor(
              item
            )}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <span>{item.emoji}</span>
                {editingItem?.id === item.id ? (
                  <div className="flex space-x-2 flex-grow">
                    <Input
                      value={editingItem.title}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          title: e.target.value,
                        })
                      }
                      className="flex-grow"
                    />
                    <Select
                      value={editingItem.emoji}
                      onValueChange={(value) =>
                        setEditingItem({ ...editingItem, emoji: value })
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Emoji" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonEmojis.map((emoji) => (
                          <SelectItem key={emoji} value={emoji}>
                            {emoji}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className={item.completed ? "line-through" : ""}>
                    {item.title}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {item.deadline
                      ? new Date(item.deadline).toLocaleDateString()
                      : "No deadline"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Created by: {item.user_email}
                </p>
                <div className="flex space-x-2">
                  {item.user_id === user.id && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => toggleTodoItemCompletion(item)}
                        className={`flex items-center h-10 rounded-md px-8 ${
                          item.completed
                            ? "border-2"
                            : "border-green-500 border-2"
                        }`}
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        {item.completed
                          ? "Undo Completion"
                          : "Mark as completed"}
                      </Button>
                      {item.completed ? null : (
                        <Button
                          className="border-2"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setEditingItem(
                              editingItem?.id === item.id ? null : item
                            )
                          }
                        >
                          <Pencil1Icon className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="icon"
                        className="border-red-500 border-2"
                        onClick={() => deleteTodoItem(item.id)}
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
