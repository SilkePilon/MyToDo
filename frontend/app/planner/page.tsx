"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface PlannerEntry {
  id: string;
  date: string;
  content: string;
  user_id: string;
  emoji: string;
  user_email: string;
}

export default function PlannerPage() {
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [newEntryContent, setNewEntryContent] = useState("");
  const [newEntryEmoji, setNewEntryEmoji] = useState("");
  const [editingEntry, setEditingEntry] = useState<PlannerEntry | null>(null);
  // @ts-ignore
  const [user, setUser] = useState<any>(null);
  const [userFilter, setUserFilter] = useState<string>("all");
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEntries = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from("planner_entries")
          .select("*, user:users(email)")
          .order("date", { ascending: false });
        if (error) console.error("Error fetching planner entries:", error);
        else
          setEntries(
            data.map((entry) => ({ ...entry, user_email: entry.user.email })) ||
              []
          );

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email");
        if (usersError) console.error("Error fetching users:", usersError);
        else setUsers(usersData || []);
      }
    };
    fetchEntries();
  }, []);

  const addEntry = async () => {
    if (newEntryContent.trim() && user) {
      const newEntry = {
        date: new Date().toISOString().split("T")[0],
        content: newEntryContent,
        user_id: user.id,
        emoji: newEntryEmoji,
      };
      const { data, error } = await supabase
        .from("planner_entries")
        .insert(newEntry)
        .select();
      if (error) {
        console.error("Error adding planner entry:", error);
        toast({
          title: "Error",
          description: "Failed to add planner entry",
          variant: "destructive",
        });
      } else {
        setEntries([{ ...data[0], user_email: user.email }, ...entries]);
        setNewEntryContent("");
        setNewEntryEmoji("");
        toast({
          title: "Success",
          description: "Planner entry added successfully",
        });
      }
    }
  };
  // ts-expect-error
  const updateEntry = async (
    id: string,
    newContent: string,
    newEmoji: string
  ) => {
    const { error } = await supabase
      .from("planner_entries")
      .update({ content: newContent, emoji: newEmoji })
      .eq("id", id);
    if (error) {
      console.error("Error updating planner entry:", error);
      toast({
        title: "Error",
        description: "Failed to update planner entry",
        variant: "destructive",
      });
    } else {
      setEntries(
        entries.map((e) =>
          e.id === id ? { ...e, content: newContent, emoji: newEmoji } : e
        )
      );
      setEditingEntry(null);
      toast({
        title: "Success",
        description: "Planner entry updated successfully",
      });
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from("planner_entries")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error deleting planner entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete planner entry",
        variant: "destructive",
      });
    } else {
      setEntries(entries.filter((e) => e.id !== id));
      toast({
        title: "Success",
        description: "Planner entry deleted successfully",
      });
    }
  };

  const filteredEntries =
    userFilter === "all"
      ? entries
      : entries.filter((e) => e.user_id === userFilter);

  if (!user) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Welcome to MyToDo Daily Planner</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Plan your day efficiently with MyToDo Daily Planner. Create and
            manage your daily plans all in one place.
          </p>
          <p className="mt-4">Please sign in to start planning your day.</p>
          <Button asChild className="mt-4">
            <Link href="/">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Daily Planner</h1>
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Emoji"
              value={newEntryEmoji}
              onChange={(e) => setNewEntryEmoji(e.target.value)}
              className="w-20"
            />
            <Textarea
              placeholder="What's your plan for today?"
              value={newEntryContent}
              onChange={(e) => setNewEntryContent(e.target.value)}
              className="flex-grow"
            />
          </div>
          <Button onClick={addEntry} className="w-full">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Entry
          </Button>
        </div>
      </Card>
      <Card className="p-4">
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <Card
            key={entry.id}
            className="transition-all duration-200 hover:shadow-lg"
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4" />
                <span>{new Date(entry.date).toLocaleDateString()}</span>
                <span>{entry.emoji}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingEntry?.id === entry.id ? (
                <div className="space-y-2">
                  <Input
                    value={editingEntry.emoji}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        emoji: e.target.value,
                      })
                    }
                    className="w-20"
                  />
                  <Textarea
                    value={editingEntry.content}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        content: e.target.value,
                      })
                    }
                  />
                </div>
              ) : (
                <p>{entry.content}</p>
              )}
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Created by: {entry.user_email}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setEditingEntry(
                        editingEntry?.id === entry.id ? null : entry
                      )
                    }
                  >
                    <Pencil1Icon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteEntry(entry.id)}
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
