"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  user_id: string;
  emoji: string;
  user_email: string;
  highest_priority_color: string | null;
}

interface User {
  id: string;
  email: string;
}

const commonEmojis = [
  "💻",
  "📊",
  "🚀",
  "🔧",
  "📱",
  "🌐",
  "🔍",
  "🛠️",
  "📈",
  "🤖",
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectEmoji, setNewProjectEmoji] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userFilter, setUserFilter] = useState<string>("all");
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user ? { id: user.id, email: user.email || "" } : null);
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects_with_users")
        .select("*, todo_items(deadline, completed)")
        .order("deadline", { foreignTable: "todo_items", ascending: true });

      if (projectsError)
        console.error("Error fetching projects:", projectsError);
      else {
        const projectsWithPriority = projectsData?.map((project) => {
          const highestPriorityTask = project.todo_items.find(
            (item: { completed: unknown }) => !item.completed
          );
          let color = "border-blue-500";
          if (highestPriorityTask) {
            const daysUntilDeadline = Math.ceil(
              (new Date(highestPriorityTask.deadline).getTime() -
                new Date().getTime()) /
                (1000 * 3600 * 24)
            );
            if (daysUntilDeadline <= 1) color = "border-red-500";
            else if (daysUntilDeadline <= 3) color = "border-purple-500";
          }
          return { ...project, highest_priority_color: color };
        });
        setProjects(projectsWithPriority || []);
      }

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, email");
      if (usersError) console.error("Error fetching users:", usersError);
      else setUsers(usersData || []);
    };
    fetchProjects();
  }, []);

  const addProject = async () => {
    if (newProjectName.trim() && user) {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: newProjectName,
          user_id: user.id,
          emoji: newProjectEmoji,
        })
        .select();
      if (error) {
        console.error("Error adding project:", error);
        toast({
          title: "Error",
          description: "Failed to add project",
          variant: "destructive",
        });
      } else {
        setProjects([
          ...projects,
          {
            ...data[0],
            user_email: user.email,
            highest_priority_color: "border-blue-500",
          },
        ]);
        setNewProjectName("");
        setNewProjectEmoji("");
        toast({ title: "Success", description: "Project added successfully" });
      }
    }
  };

  const updateProject = async (
    id: string,
    newName: string,
    newEmoji: string
  ) => {
    if (user && editingProject && editingProject.user_id === user.id) {
      const { error } = await supabase
        .from("projects")
        .update({ name: newName, emoji: newEmoji })
        .eq("id", id);
      if (error) {
        console.error("Error updating project:", error);
        toast({
          title: "Error",
          description: "Failed to update project",
          variant: "destructive",
        });
      } else {
        setProjects(
          projects.map((p) =>
            p.id === id ? { ...p, name: newName, emoji: newEmoji } : p
          )
        );
        setEditingProject(null);
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "You can only edit your own projects",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (id: string) => {
    const projectToDelete = projects.find((p) => p.id === id);
    if (user && projectToDelete && projectToDelete.user_id === user.id) {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) {
        console.error("Error deleting project:", error);
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      } else {
        setProjects(projects.filter((p) => p.id !== id));
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "You can only delete your own projects",
        variant: "destructive",
      });
    }
  };

  const filteredProjects =
    userFilter === "all"
      ? projects
      : projects.filter((p) => p.user_id === userFilter);

  if (!user) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Welcome to MyToDo Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Organize your tasks efficiently with MyToDo Projects. Create,
            manage, and track your projects all in one place.
          </p>
          <p className="mt-4">
            Please sign in to start managing your projects.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Projects</h1>
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Input
            type="text"
            placeholder="New project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="flex-grow"
          />
          <Select value={newProjectEmoji} onValueChange={setNewProjectEmoji}>
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
          <Button onClick={addProject} className="w-full sm:w-auto">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Project
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className={`transition-all duration-200 hover:shadow-lg border-2 ${(
              project.highest_priority_color || "border-blue-500"
            ).replace("bg-", "border-")}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>{project.emoji}</span>
                {editingProject?.id === project.id ? (
                  <div className="flex space-x-2 flex-grow">
                    <Input
                      value={editingProject.name}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          name: e.target.value,
                        })
                      }
                      className="flex-grow"
                    />
                    <Select
                      value={editingProject.emoji}
                      onValueChange={(value) =>
                        setEditingProject({ ...editingProject, emoji: value })
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
                  <span>{project.name}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Created by: {project.user_email}
              </p>
              <div className="flex justify-between items-center">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="outline">View Tasks</Button>
                </Link>
                <div className="flex space-x-2">
                  {project.user_id === user.id && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (editingProject?.id === project.id) {
                            updateProject(
                              project.id,
                              editingProject.name,
                              editingProject.emoji
                            );
                          } else {
                            setEditingProject(project);
                          }
                        }}
                      >
                        {editingProject?.id === project.id ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <Pencil1Icon className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteProject(project.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
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
