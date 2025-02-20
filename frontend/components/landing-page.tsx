"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";

interface Task {
  id: string;
  title: string;
  deadline: string;
}

export function LandingPage() {
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [hasDailyPlan, setHasDailyPlan] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch tasks with upcoming deadlines
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .gte('deadline', today)
        .order('deadline', { ascending: true })
        .limit(5);

      if (tasks) {
        setUpcomingTasks(tasks);
      }

      // Check if user has a plan for today
      const { data: dailyPlan } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('date', today)
        .single();

      setHasDailyPlan(!!dailyPlan);
    };

    fetchTasks();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome Back!</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasDailyPlan && (
            <div className="mb-6 bg-yellow-50 p-4 rounded-lg">
              <p className="text-yellow-800">You haven't planned your day yet!</p>
              <Button
                onClick={() => router.push('/planner')}
                className="mt-2"
                variant="outline"
              >
                Create Daily Plan
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upcoming Deadlines</h3>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span>{task.title}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming tasks</p>
            )}
          </div>

          <div className="mt-6 flex space-x-4">
            <Button onClick={() => router.push('/projects')}>
              View All Projects
            </Button>
            <Button
              onClick={() => router.push('/planner')}
              variant="outline"
            >
              Go to Planner
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}