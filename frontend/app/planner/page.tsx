"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ResetIcon,
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
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/date-picker";

interface User {
  id: string;
  email?: string | null;
}

interface PlannerEntry {
  id: string;
  date: string;
  content: string;
  user_id: string;
  emoji: string;
  user_email: string;
}

interface FilterState {
  user: string;
  search: string;
  startDate: Date | null;
  endDate: Date | null;
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

export default function PlannerPage() {
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [newEntryContent, setNewEntryContent] = useState("");
  const [newEntryEmoji, setNewEntryEmoji] = useState("");
  const [editingEntry, setEditingEntry] = useState<PlannerEntry | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    user: "all",
    search: "",
    startDate: null,
    endDate: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchEntries = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from("planner_entries_with_users")
          .select("*")
          .order("date", { ascending: false });
        if (error) {
          console.error("Error fetching planner entries:", error);
          toast({
            title: "Error",
            description: "Failed to fetch planner entries",
            variant: "destructive",
          });
        } else {
          setEntries(data || []);
        }

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email");
        if (usersError) {
          console.error("Error fetching users:", usersError);
          toast({
            title: "Error",
            description: "Failed to fetch users",
            variant: "destructive",
          });
        } else {
          setUsers(usersData || []);
        }
      }
    };
    fetchEntries();
  }, []);

  const resetFilters = () => {
    setFilters({
      user: "all",
      search: "",
      startDate: null,
      endDate: null,
    });
  };

  const getUserEmailById = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.email : "Unknown User";
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesUser =
      filters.user === "all" || entry.user_id === filters.user;
    const matchesSearch = entry.content
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesDate =
      (!filters.startDate ||
        new Date(entry.date) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(entry.date) <= new Date(filters.endDate));
    return matchesUser && matchesSearch && matchesDate;
  });

  const hasEntryForToday = () => {
    const today = new Date().toISOString().split("T")[0];
    return entries.some(
      (entry) => entry.date === today && entry.user_id === user?.id
    );
  };

  const getTodayEntry = () => {
    const today = new Date().toISOString().split("T")[0];
    return entries.find(
      (entry) => entry.date === today && entry.user_id === user?.id
    );
  };

  const addEntry = async () => {
    if (hasEntryForToday()) {
      toast({
        title: "Entry Exists",
        description:
          "You already have an entry for today. Please edit the existing entry instead.",
        variant: "destructive",
      });
      return;
    }

    if (!newEntryContent.trim()) {
      toast({
        title: "Invalid Entry",
        description: "Please enter some content for your plan",
        variant: "destructive",
      });
      return;
    }

    if (user) {
      const newEntry = {
        date: new Date().toISOString().split("T")[0],
        content: newEntryContent.trim(),
        user_id: user.id,
        emoji: newEntryEmoji || "📝", // Default emoji if none selected
      };

      const { data, error } = await supabase
        .from("planner_entries")
        .insert(newEntry)
        .select()
        .single();

      if (error) {
        console.error("Error adding planner entry:", error);
        toast({
          title: "Error",
          description: "Failed to add planner entry",
          variant: "destructive",
        });
      } else {
        const newEntryWithEmail = {
          ...data,
          user_email: user.email,
        };
        setEntries([newEntryWithEmail, ...entries]);
        setNewEntryContent("");
        setNewEntryEmoji("");
        toast({
          title: "Success",
          description: "Planner entry added successfully",
        });
      }
    }
  };

  const updateEntry = async (
    id: string,
    newContent: string,
    newEmoji: string
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update entries",
        variant: "destructive",
      });
      return;
    }

    if (!newContent.trim()) {
      toast({
        title: "Invalid Entry",
        description: "Entry content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const entryToUpdate = entries.find((e) => e.id === id);

    if (!entryToUpdate) {
      toast({
        title: "Error",
        description: "Entry not found",
        variant: "destructive",
      });
      return;
    }

    if (entryToUpdate.user_id !== user.id) {
      toast({
        title: "Error",
        description: "You can only edit your own entries",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("planner_entries")
      .update({
        content: newContent.trim(),
        emoji: newEmoji || "📝",
      })
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
          e.id === id
            ? { ...e, content: newContent.trim(), emoji: newEmoji || "📝" }
            : e
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
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete entries",
        variant: "destructive",
      });
      return;
    }

    const entryToDelete = entries.find((e) => e.id === id);

    if (!entryToDelete) {
      toast({
        title: "Error",
        description: "Entry not found",
        variant: "destructive",
      });
      return;
    }

    if (entryToDelete.user_id !== user.id) {
      toast({
        title: "Error",
        description: "You can only delete your own entries",
        variant: "destructive",
      });
      return;
    }

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

  const isCurrentDay = (date: string) => {
    const today = new Date().toISOString().split("T")[0];
    return date === today;
  };

  if (!user) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-3xl">
            Welcome to MyToDo Daily Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            Plan your day efficiently with MyToDo Daily Planner. Create and
            manage your daily plans all in one place.
          </p>
          <p className="text-muted-foreground">
            Please sign in to start planning your day.
          </p>
          <Button asChild size="lg">
            <Link href="/">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const todayEntry = getTodayEntry();

  return (
    <div className="container mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Daily Planner</h1>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {user.email}
        </Badge>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">New Entry</TabsTrigger>
          <TabsTrigger value="search">Search & Filter</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          {!todayEntry ? (
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Create Today&apos;s Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Select
                    value={newEntryEmoji}
                    onValueChange={setNewEntryEmoji}
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
                  <Textarea
                    placeholder="What's your plan for today?"
                    value={newEntryContent}
                    onChange={(e) => setNewEntryContent(e.target.value)}
                    className="flex-grow min-h-[100px]"
                  />
                </div>
                <Button onClick={addEntry} className="w-full" size="lg">
                  <PlusIcon className="mr-2 h-5 w-5" /> Create Today&apos;s Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-6 border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Today&apos;s Plan</span>
                  {/* <Badge className="bg-green-500">Active</Badge> */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">
                  You already have a plan for today. You can edit it in the
                  entries below.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Search & Filter Entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Content</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search entries..."
                      value={filters.search}
                      onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by User</label>
                  <Select
                    value={filters.user}
                    onValueChange={(value) =>
                      setFilters({ ...filters, user: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
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
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <DatePicker
                    selected={filters.startDate}
                    onSelect={(date: unknown) =>
                      setFilters({ ...filters, startDate: date as Date | null })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <DatePicker
                    selected={filters.endDate}
                    onSelect={(date: unknown) =>
                      setFilters({ ...filters, endDate: date as Date | null })
                    }
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full"
              >
                <ResetIcon className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card className="p-6 text-center">
            <CardContent>
              <p className="text-muted-foreground">
                No entries found matching your filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              className={`transition-all duration-200 hover:shadow-lg relative ${
                isCurrentDay(entry.date) ? "border-green-500 border-2" : ""
              } ${entry.user_id !== user?.id ? "border-white border-2" : ""}`}
            >
              {isCurrentDay(entry.date) && entry.user_id === user?.id ? (
                <Badge className="absolute top-2 right-2 bg-green-500">
                  {entry.user_email.split("@")[0]}&apos;s Plan
                </Badge>
              ) : entry.user_id !== user?.id ? (
                <Badge className="absolute top-2 right-2">
                  {entry.user_email.split("@")[0]}&apos;s Plan
                </Badge>
              ) : null}
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span>{new Date(entry.date).toLocaleDateString()}</span>
                  <span className="text-xl">{entry.emoji}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingEntry?.id === entry.id ? (
                  <div className="space-y-4">
                    <Select
                      value={editingEntry.emoji}
                      onValueChange={(value) =>
                        setEditingEntry({ ...editingEntry, emoji: value })
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
                    <Textarea
                      value={editingEntry.content}
                      onChange={(e) =>
                        setEditingEntry({
                          ...editingEntry,
                          content: e.target.value,
                        })
                      }
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditingEntry(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() =>
                          updateEntry(
                            editingEntry.id,
                            editingEntry.content,
                            editingEntry.emoji
                          )
                        }
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-lg">{entry.content}</p>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-sm text-muted-foreground">
                        {/* Created by: {entry.user_email} */}
                      </p>
                      {entry.user_id === user?.id && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-2"
                            onClick={() => setEditingEntry(entry)}
                          >
                            <Pencil1Icon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500 border-2 hover:bg-red-500 hover:text-white"
                            onClick={() => deleteEntry(entry.id)}
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
