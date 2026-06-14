import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import { Board } from "@/lib/models";
import { initializeUserBoard } from "@/lib/init-user-board";
import { redirect } from "next/navigation";
import KanbanBoard from "@/components/kanban-board";
import { Suspense } from "react";

async function getBoard(userId: string) {
  await connectDB();

  const boardDoc = await Board.findOne({
    userId: userId,
    name: "Job Hunt",
  }).populate({
    path: "columns",
    populate: {
      path: "jobApplications",
    },
  });

  if (!boardDoc) return null;

  const board = JSON.parse(JSON.stringify(boardDoc));

  return board;
}

async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  let board = await getBoard(session.user.id);

  // Self-heal: make sure the user always has a board with its default columns
  // (e.g. accounts created before the signup hook existed, or if it failed).
  if (!board || !board.columns || board.columns.length === 0) {
    await initializeUserBoard(session.user.id);
    board = await getBoard(session.user.id);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Job Hunt
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and organize your job applications
          </p>
        </div>
        <KanbanBoard board={board} userId={session.user.id} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[420px] w-[300px] flex-shrink-0 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPage />
    </Suspense>
  );
}
