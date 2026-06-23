import { createClient } from "@/lib/supabase/server";

type Profile = {
  full_name: string;
  role: string;
};

type Comment = {
  id: string;
  comment: string;
  created_at: string;
};

type Detail = {
  label: string;
  value: string | null | undefined;
};

type PageDataResult =
  | {
      data: {
        comments: Comment[];
        details: Detail[];
      };
      error?: never;
    }
  | {
      data?: never;
      error: string;
    };

const fallbackText = "No demo data found";

function formatDueDate(dueDate: string | null | undefined) {
  if (!dueDate) {
    return fallbackText;
  }

  const parsedDate = new Date(`${dueDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dueDate;
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "long",
    timeZone: "Africa/Nairobi",
  }).format(parsedDate);
}

function TestPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Temporary developer page
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Supabase Connection Test
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Read-only demo data loaded with the server Supabase client.
          </p>
        </div>

        {children}
      </div>
    </main>
  );
}

async function loadPageData(): Promise<PageDataResult> {
  try {
    const supabase = await createClient();

    const [
      schoolResult,
      profilesResult,
      classResult,
      studentResult,
      assignmentResult,
      commentsResult,
      milestoneResult,
    ] = await Promise.all([
      supabase.from("schools").select("name").limit(1),
      supabase
        .from("profiles")
        .select("full_name, role")
        .in("role", ["teacher", "parent"]),
      supabase.from("classes").select("name").limit(1),
      supabase.from("students").select("full_name").limit(1),
      supabase
        .from("assignments")
        .select("title, subject, due_date")
        .limit(1),
      supabase
        .from("comments")
        .select("id, comment, created_at")
        .order("created_at", { ascending: true })
        .limit(20),
      supabase.from("milestones").select("title").limit(1),
    ]);

    const queryResults = [
      { table: "schools", error: schoolResult.error },
      { table: "profiles", error: profilesResult.error },
      { table: "classes", error: classResult.error },
      { table: "students", error: studentResult.error },
      { table: "assignments", error: assignmentResult.error },
      { table: "comments", error: commentsResult.error },
      { table: "milestones", error: milestoneResult.error },
    ];
    const failedQueries = queryResults.filter((result) => result.error);

    if (failedQueries.length > 0) {
      throw new Error(
        failedQueries
          .map(
            ({ table, error }) =>
              `${table}: ${error?.message ?? "Unknown query error"}`,
          )
          .join(" | "),
      );
    }

    const profiles = (profilesResult.data ?? []) as Profile[];
    const teacher = profiles.find((profile) => profile.role === "teacher");
    const parent = profiles.find((profile) => profile.role === "parent");
    const comments = (commentsResult.data ?? []) as Comment[];
    const assignment = assignmentResult.data?.[0];

    const details = [
      { label: "School name", value: schoolResult.data?.[0]?.name },
      { label: "Teacher name", value: teacher?.full_name },
      { label: "Parent name", value: parent?.full_name },
      { label: "Student name", value: studentResult.data?.[0]?.full_name },
      { label: "Class name", value: classResult.data?.[0]?.name },
      { label: "Assignment title", value: assignment?.title },
      { label: "Assignment subject", value: assignment?.subject },
      {
        label: "Assignment due date",
        value: formatDueDate(assignment?.due_date),
      },
      { label: "Milestone title", value: milestoneResult.data?.[0]?.title },
    ];

    return { data: { comments, details } };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
}

export default async function SupabaseTestPage() {
  const result = await loadPageData();

  if (result.error) {
    return (
      <TestPageShell>
        <section
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950 shadow-sm sm:p-6"
          role="alert"
        >
          <h2 className="text-lg font-bold">Unable to load Supabase data</h2>
          <p className="mt-2 text-sm leading-6">{result.error}</p>
        </section>
      </TestPageShell>
    );
  }
  const { comments, details } = result.data ?? {
  comments: [],
  details: [],
};
  return (
    <TestPageShell>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <dl className="divide-y divide-slate-200">
          {details.map(({ label, value }) => (
            <div
              className="grid gap-1 px-5 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6 sm:px-6"
              key={label}
            >
              <dt className="text-sm font-medium text-slate-500">{label}</dt>
              <dd className="font-semibold text-slate-900">
                {value || fallbackText}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold">Comments</h2>

        {comments.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {comments.map((comment) => (
              <li
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                key={comment.id}
              >
                {comment.comment}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No demo comments found.
          </p>
        )}
      </section>
    </TestPageShell>
  );
}
