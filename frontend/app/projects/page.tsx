"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
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
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectEmoji, setNewProjectEmoji] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  // @ts-ignore
  const [user, setUser] = useState<any>(null);
  const [userFilter, setUserFilter] = useState<string>("all");
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*, user:users(email)");
      if (projectsError)
        console.error("Error fetching projects:", projectsError);
      else
        setProjects(
          projectsData.map((p) => ({ ...p, user_email: p.user.email })) || []
        );

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
        setProjects([...projects, { ...data[0], user_email: user.email }]);
        setNewProjectName("");
        setNewProjectEmoji("");
        toast({ title: "Success", description: "Project added successfully" });
      }
    }
  };
  // @ts-ignore
  const updateProject = async (
    id: string,
    newName: string,
    newEmoji: string
  ) => {
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
      toast({ title: "Success", description: "Project updated successfully" });
    }
  };

  const deleteProject = async (id: string) => {
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
      toast({ title: "Success", description: "Project deleted successfully" });
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
          <Input
            type="text"
            placeholder="Emoji"
            value={newProjectEmoji}
            onChange={(e) => setNewProjectEmoji(e.target.value)}
            className="w-20"
          />
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
            className="transition-all duration-200 hover:shadow-lg"
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>{project.emoji}</span>
                {editingProject?.id === project.id ? (
                  <div className="flex space-x-2">
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
                    <Input
                      value={editingProject.emoji}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          emoji: e.target.value,
                        })
                      }
                      className="w-20"
                    />
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setEditingProject(
                        editingProject?.id === project.id ? null : project
                      )
                    }
                  >
                    <Pencil1Icon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteProject(project.id)}
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
