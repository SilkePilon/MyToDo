"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  deadline: string | null;
  project_id: string;
  emoji: string;
  user_id: string;
  user_email: string;
}

export default function ProjectPage() {
  const { id } = useParams();
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("");
  const [newItemDeadline, setNewItemDeadline] = useState("");
  const [editingItem, setEditingItem] = useState<TodoItem | null>(null);
  const [projectName, setProjectName] = useState("");
  // ts-expect-error
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTodoItems = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("name")
        .eq("id", id)
        .single();

      if (projectError) console.error("Error fetching project:", projectError);
      else setProjectName(projectData.name);

      const { data, error } = await supabase
        .from("todo_items")
        .select("*, user:users(email)")
        .eq("project_id", id);
      if (error) console.error("Error fetching todo items:", error);
      else
        setTodoItems(
          data.map((item) => ({ ...item, user_email: item.user.email })) || []
        );
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
        setTodoItems([...todoItems, { ...data[0], user_email: user.email }]);
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

  const updateTodoItem = async (item: TodoItem) => {
    const { error } = await supabase
      .from("todo_items")
      .update(item)
      .eq("id", item.id);
    if (error) {
      console.error("Error updating todo item:", error);
      toast({
        title: "Error",
        description: "Failed to update todo item",
        variant: "destructive",
      });
    } else {
      setTodoItems(todoItems.map((i) => (i.id === item.id ? item : i)));
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Todo item updated successfully",
      });
    }
  };

  const deleteTodoItem = async (id: string) => {
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
            placeholder="New todo item"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            className="flex-grow"
          />
          <Input
            type="text"
            placeholder="Emoji"
            value={newItemEmoji}
            onChange={(e) => setNewItemEmoji(e.target.value)}
            className="w-20"
          />
          <Input
            type="date"
            value={newItemDeadline}
            onChange={(e) => setNewItemDeadline(e.target.value)}
          />
          <Button onClick={addTodoItem} className="w-full sm:w-auto">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </Card>
      <div className="space-y-4">
        {todoItems.map((item) => (
          <Card
            key={item.id}
            className="transition-all duration-200 hover:shadow-lg"
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={(checked) =>
                    updateTodoItem({ ...item, completed: checked as boolean })
                  }
                />
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
                    <Input
                      value={editingItem.emoji}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          emoji: e.target.value,
                        })
                      }
                      className="w-20"
                    />
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setEditingItem(editingItem?.id === item.id ? null : item)
                    }
                  >
                    <Pencil1Icon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteTodoItem(item.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
