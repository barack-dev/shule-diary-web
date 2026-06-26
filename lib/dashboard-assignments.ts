import type {
  AssignmentCardData,
  AssignmentComment,
  AssignmentStatus,
  CommentAuthorRole,
  DashboardRole,
  KanbanColumnData,
  ParentSummaryMetric,
  SummaryMetric,
} from "./types";
import { createClient } from "./supabase/server";

const TEACHER_STATUSES: AssignmentStatus[] = [
  "Assigned",
  "Seen by Parent",
  "In Progress",
  "Submitted",
  "Reviewed",
  "Completed",
  "Needs Support",
  "Overdue",
];

type SupabaseAssignmentRow = {
  id: string;
  title: string | null;
  subject: string | null;
  due_date: string | null;
  description: string | null;
  created_at: string | null;
};

type SupabaseAssignmentStudentRow = {
  id: string;
  assignment_id: string | null;
  student_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type DashboardAssignmentRow = {
  assignment_student_id: string;
  assignment_id: string;
  student_id: string | null;
  student_name: string | null;
  title: string | null;
  subject: string | null;
  due_date: string | null;
  status: string | null;
  description: string | null;
  created_at: string | null;
};

type SupabaseCommentRow = {
  id: string;
  assignment_student_id: string | null;
  user_id: string | null;
  comment: string | null;
  created_at: string | null;
};

type SupabaseCommentAuthorProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type SupabaseProfileRow = {
  id?: string;
  full_name: string | null;
  school_name?: string | null;
  role: string | null;
};

type SupabaseClassRow = {
  id?: string;
  name: string | null;
  teacher_id?: string | null;
};

type SupabaseStudentRow = {
  id?: string;
  class_id?: string | null;
  full_name: string | null;
};

type SupabaseClassOwnershipRow = {
  id: string;
};

type SupabaseStudentGuardianRow = {
  student_id: string | null;
};

export type DashboardSupabaseContext = {
  schoolName: string | null;
  teacherName: string | null;
  parentName: string | null;
  studentName: string | null;
  className: string | null;
  milestoneTitle: string | null;
  milestoneCount: number | null;
};

export type AssignmentMappingDefaults = {
  studentName?: string;
  teacherName?: string;
  parentName?: string;
};

export type DashboardViewer = {
  profileId: string;
  authUserId: string;
  role: DashboardRole;
};

const DEFAULT_STUDENT_NAME = "Student";
const DEFAULT_TEACHER_NAME = "Teacher";
const DEFAULT_PARENT_NAME = "Parent";
const DEMO_PARENT_PROFILE_ID = "00000000-0000-0000-0000-000000001002";

function createEmptyTeacherColumns(): KanbanColumnData[] {
  return TEACHER_STATUSES.map((status) => ({
    title: status,
    items: [],
  }));
}

function formatShortDueDate(dueDate: string | null): string {
  if (!dueDate) {
    return "No due date";
  }

  const parsedDate = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dueDate;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function normalizeStatus(status: string | null): AssignmentStatus {
  switch (status?.trim().toLowerCase()) {
    case "assigned":
      return "Assigned";
    case "seen by parent":
      return "Seen by Parent";
    case "seen":
      return "Seen by Parent";
    case "in progress":
      return "In Progress";
    case "in_progress":
      return "In Progress";
    case "submitted":
      return "Submitted";
    case "reviewed":
      return "Reviewed";
    case "completed":
      return "Completed";
    case "needs support":
      return "Needs Support";
    case "needs_support":
      return "Needs Support";
    case "overdue":
      return "Overdue";
    default:
      return "Assigned";
  }
}

function normalizeCommentAuthorRole(role: string | null): CommentAuthorRole {
  return role?.trim().toLowerCase() === "parent" ? "Parent" : "Teacher";
}

function resolveCommentAuthorRole(
  userId: string | null,
  profileRole: string | null,
): CommentAuthorRole {
  if (profileRole) {
    return normalizeCommentAuthorRole(profileRole);
  }
  return userId === DEMO_PARENT_PROFILE_ID ? "Parent" : "Teacher";
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function resolveMappingDefaults(defaults: AssignmentMappingDefaults) {
  return {
    studentName: normalizeText(defaults.studentName) ?? DEFAULT_STUDENT_NAME,
    teacherName: normalizeText(defaults.teacherName) ?? DEFAULT_TEACHER_NAME,
    parentName: normalizeText(defaults.parentName) ?? DEFAULT_PARENT_NAME,
  };
}

function formatCommentCreatedAt(dateValue: string | null): string {
  if (!dateValue) {
    return "";
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeText(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

async function assertAuthenticatedViewer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viewer: DashboardViewer,
): Promise<void> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unable to verify dashboard session for assignment loading.");
  }

  if (user.id !== viewer.authUserId) {
    throw new Error("Authenticated user mismatch while loading dashboard assignments.");
  }
}

async function getOwnedStudentIdsForViewer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viewer: DashboardViewer,
): Promise<string[]> {
  if (viewer.role === "parent") {
    const { data, error } = await supabase
      .from("student_guardians")
      .select("student_id")
      .eq("guardian_id", viewer.profileId);

    if (error) {
      throw new Error(
        `Unable to load guardian student links: ${error.message ?? "Unknown query error."}`,
      );
    }

    const guardianRows = (data ?? []) as SupabaseStudentGuardianRow[];
    return uniqueNonEmpty(guardianRows.map((row) => row.student_id));
  }

  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("teacher_id", viewer.profileId);

  if (classError) {
    throw new Error(
      `Unable to load teacher classes: ${classError.message ?? "Unknown query error."}`,
    );
  }

  const classRows = (classData ?? []) as SupabaseClassOwnershipRow[];
  const classIds = uniqueNonEmpty(classRows.map((row) => row.id));
  if (classIds.length === 0) {
    return [];
  }

  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select("id")
    .in("class_id", classIds);

  if (studentError) {
    throw new Error(
      `Unable to load students for teacher classes: ${studentError.message ?? "Unknown query error."}`,
    );
  }

  const studentRows = (studentData ?? []) as SupabaseStudentRow[];
  return uniqueNonEmpty(studentRows.map((row) => row.id));
}

function mapCommentRowToComment(
  row: SupabaseCommentRow,
  defaults: ReturnType<typeof resolveMappingDefaults>,
  profilesById: Record<string, SupabaseCommentAuthorProfileRow>,
): AssignmentComment {
  const normalizedUserId = normalizeText(row.user_id);
  const profile = normalizedUserId ? profilesById[normalizedUserId] : undefined;
  const role = resolveCommentAuthorRole(normalizedUserId, profile?.role ?? null);
  const fallbackAuthorName =
    role === "Parent" ? defaults.parentName : defaults.teacherName;

  return {
    id: row.id,
    authorName: normalizeText(profile?.full_name) ?? fallbackAuthorName,
    authorRole: role,
    message: row.comment?.trim() || "",
    createdAt: formatCommentCreatedAt(row.created_at),
  };
}

function mapRowToAssignment(
  row: DashboardAssignmentRow,
  commentsByAssignmentStudentId: Record<string, AssignmentComment[]>,
  defaults: ReturnType<typeof resolveMappingDefaults>,
): AssignmentCardData {
  const status = normalizeStatus(row.status);
  const assignmentStudentId = normalizeText(row.assignment_student_id);
  const resolvedStudentName =
    normalizeText(row.student_name) ?? defaults.studentName;

  return {
    id: assignmentStudentId ?? row.assignment_id,
    assignmentStudentId: assignmentStudentId ?? undefined,
    title: row.title?.trim() || "Untitled assignment",
    subject: row.subject?.trim() || "General",
    student: resolvedStudentName,
    due: formatShortDueDate(row.due_date),
    dueDateRaw: row.due_date ?? undefined,
    description: row.description?.trim() || "No description provided.",
    comments: assignmentStudentId
      ? commentsByAssignmentStudentId[assignmentStudentId] ?? []
      : [],
    status,
  };
}

function parseAssignmentDueDate(value: AssignmentCardData): Date | null {
  if (value.dueDateRaw) {
    const parsedRawDate = new Date(`${value.dueDateRaw}T00:00:00`);
    if (!Number.isNaN(parsedRawDate.getTime())) {
      return parsedRawDate;
    }
  }

  const fallbackParsedDate = new Date(value.due);
  if (!Number.isNaN(fallbackParsedDate.getTime())) {
    return fallbackParsedDate;
  }

  return null;
}

export function buildTeacherColumnsFromAssignments(
  rows: DashboardAssignmentRow[],
  commentsByAssignmentStudentId: Record<string, AssignmentComment[]> = {},
  mappingDefaults: AssignmentMappingDefaults = {},
): KanbanColumnData[] {
  const columns = createEmptyTeacherColumns();
  const defaults = resolveMappingDefaults(mappingDefaults);
  const statusToIndex = new Map<AssignmentStatus, number>(
    columns.map((column, index) => [column.title, index]),
  );

  for (const row of rows) {
    const assignment = mapRowToAssignment(
      row,
      commentsByAssignmentStudentId,
      defaults,
    );
    const index = statusToIndex.get(assignment.status) ?? 0;
    columns[index].items.push(assignment);
  }

  return columns;
}

export async function getTeacherColumnsFromSupabase(
  mappingDefaults: AssignmentMappingDefaults = {},
  viewer?: DashboardViewer,
): Promise<KanbanColumnData[]> {
  const supabase = await createClient();

  let ownedStudentIds: string[] | null = null;
  if (viewer) {
    await assertAuthenticatedViewer(supabase, viewer);
    ownedStudentIds = await getOwnedStudentIdsForViewer(supabase, viewer);

    if (ownedStudentIds.length === 0) {
      return buildTeacherColumnsFromAssignments([], {}, mappingDefaults);
    }
  }

  let assignmentStudentsQuery = supabase
    .from("assignment_students")
    .select("id, assignment_id, student_id, status, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (ownedStudentIds) {
    assignmentStudentsQuery = assignmentStudentsQuery.in("student_id", ownedStudentIds);
  }

  const { data: assignmentStudentData, error: assignmentStudentError } =
    await assignmentStudentsQuery;

  if (assignmentStudentError) {
    throw new Error(assignmentStudentError.message);
  }

  const assignmentStudentRows = (assignmentStudentData ?? []) as SupabaseAssignmentStudentRow[];
  const assignmentIds = uniqueNonEmpty(
    assignmentStudentRows.map((row) => normalizeText(row.assignment_id)),
  );

  if (assignmentIds.length === 0) {
    return buildTeacherColumnsFromAssignments([], {}, mappingDefaults);
  }

  const { data: assignmentData, error: assignmentError } = await supabase
    .from("assignments")
    .select("id, title, subject, due_date, description, created_at")
    .in("id", assignmentIds);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const assignmentRows = (assignmentData ?? []) as SupabaseAssignmentRow[];
  const assignmentsById = Object.fromEntries(
    assignmentRows.map((row) => [row.id, row]),
  );

  const studentIds = uniqueNonEmpty(
    assignmentStudentRows.map((row) => normalizeText(row.student_id)),
  );

  let studentNameById: Record<string, string> = {};
  if (studentIds.length > 0) {
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id, full_name")
      .in("id", studentIds);

    if (studentError) {
      console.warn(
        "[ShuleDiary] Unable to load student names from Supabase; using fallback names.",
      );
    } else {
      const studentRows = (studentData ?? []) as SupabaseStudentRow[];
      studentNameById = Object.fromEntries(
        studentRows
          .map((student) => {
            const name = normalizeText(student.full_name);
            const studentId = normalizeText(student.id);
            return name && studentId ? ([studentId, name] as const) : null;
          })
          .filter((entry): entry is readonly [string, string] => Boolean(entry)),
      );
    }
  }

  const dashboardAssignmentRows: DashboardAssignmentRow[] = assignmentStudentRows
    .map((assignmentStudent) => {
      const assignmentId = normalizeText(assignmentStudent.assignment_id);
      if (!assignmentId) {
        return null;
      }

      const assignment = assignmentsById[assignmentId];
      if (!assignment) {
        return null;
      }

      const studentId = normalizeText(assignmentStudent.student_id);

      return {
        assignment_student_id: assignmentStudent.id,
        assignment_id: assignmentId,
        student_id: studentId,
        student_name: studentId ? studentNameById[studentId] ?? null : null,
        title: assignment.title,
        subject: assignment.subject,
        due_date: assignment.due_date,
        status: assignmentStudent.status,
        description: assignment.description,
        created_at: assignment.created_at,
      };
    })
    .filter((row): row is DashboardAssignmentRow => Boolean(row));

  if (dashboardAssignmentRows.length === 0) {
    return buildTeacherColumnsFromAssignments([], {}, mappingDefaults);
  }

  const assignmentStudentIds = dashboardAssignmentRows.map(
    (row) => row.assignment_student_id,
  );

  const { data: commentData, error: commentError } = await supabase
    .from("comments")
    .select("id, assignment_student_id, user_id, comment, created_at")
    .in("assignment_student_id", assignmentStudentIds)
    .order("created_at", { ascending: true });

  if (commentError) {
    console.warn(
      "[ShuleDiary] Unable to load assignment comments from Supabase; continuing with empty comments.",
    );
    return buildTeacherColumnsFromAssignments(dashboardAssignmentRows, {}, mappingDefaults);
  }

  const commentRows = (commentData ?? []) as SupabaseCommentRow[];
  const defaults = resolveMappingDefaults(mappingDefaults);
  const userIds = Array.from(
    new Set(
      commentRows
        .map((row) => normalizeText(row.user_id))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  let profilesById: Record<string, SupabaseCommentAuthorProfileRow> = {};
  if (userIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", userIds);

    if (profileError) {
      console.warn(
        "[ShuleDiary] Unable to load comment author profiles from Supabase; using fallback names.",
      );
    } else {
      const profileRows = (profileData ?? []) as SupabaseCommentAuthorProfileRow[];
      profilesById = Object.fromEntries(
        profileRows.map((profile) => [profile.id, profile]),
      );
    }
  }

  const commentsByAssignmentStudentId = commentRows.reduce<
    Record<string, AssignmentComment[]>
  >((lookup, row) => {
    const assignmentStudentId = normalizeText(row.assignment_student_id);
    if (!assignmentStudentId) {
      return lookup;
    }

    const comment = mapCommentRowToComment(row, defaults, profilesById);
    const current = lookup[assignmentStudentId] ?? [];
    lookup[assignmentStudentId] = [...current, comment];
    return lookup;
  }, {});

  return buildTeacherColumnsFromAssignments(
    dashboardAssignmentRows,
    commentsByAssignmentStudentId,
    mappingDefaults,
  );
}

export async function getDashboardContextFromSupabase(
  viewer: DashboardViewer,
): Promise<DashboardSupabaseContext> {
  const supabase = await createClient();
  await assertAuthenticatedViewer(supabase, viewer);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, school_name, role")
    .eq("id", viewer.profileId)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `profiles: ${profileError.message ?? "Unknown query error"}`,
    );
  }

  const viewerProfile = (profileData ?? null) as SupabaseProfileRow | null;
  let className: string | null = null;
  let studentName: string | null = null;

  if (viewer.role === "parent") {
    const { data: guardianData, error: guardianError } = await supabase
      .from("student_guardians")
      .select("student_id")
      .eq("guardian_id", viewer.profileId);

    if (guardianError) {
      throw new Error(
        `student_guardians: ${guardianError.message ?? "Unknown query error"}`,
      );
    }

    const studentIds = uniqueNonEmpty(
      ((guardianData ?? []) as SupabaseStudentGuardianRow[]).map(
        (row) => row.student_id,
      ),
    );

    if (studentIds.length > 0) {
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, full_name, class_id")
        .in("id", studentIds);

      if (studentError) {
        throw new Error(
          `students: ${studentError.message ?? "Unknown query error"}`,
        );
      }

      const students = (studentData ?? []) as SupabaseStudentRow[];
      studentName = normalizeText(students[0]?.full_name);

      const classIds = uniqueNonEmpty(students.map((student) => student.class_id));
      if (classIds.length > 0) {
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select("id, name")
          .in("id", classIds);

        if (classError) {
          throw new Error(
            `classes: ${classError.message ?? "Unknown query error"}`,
          );
        }

        const classes = (classData ?? []) as SupabaseClassRow[];
        className = normalizeText(classes[0]?.name);
      }
    }
  } else {
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, name")
      .eq("teacher_id", viewer.profileId);

    if (classError) {
      throw new Error(`classes: ${classError.message ?? "Unknown query error"}`);
    }

    const classes = (classData ?? []) as SupabaseClassRow[];
    className = normalizeText(classes[0]?.name);

    const classIds = uniqueNonEmpty(classes.map((classRow) => classRow.id));
    if (classIds.length > 0) {
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, full_name")
        .in("class_id", classIds);

      if (studentError) {
        throw new Error(
          `students: ${studentError.message ?? "Unknown query error"}`,
        );
      }

      const students = (studentData ?? []) as SupabaseStudentRow[];
      studentName = normalizeText(students[0]?.full_name);
    }
  }

  return {
    schoolName: normalizeText(viewerProfile?.school_name),
    teacherName:
      viewer.role === "teacher" ? normalizeText(viewerProfile?.full_name) : null,
    parentName:
      viewer.role === "parent" ? normalizeText(viewerProfile?.full_name) : null,
    studentName,
    className,
    milestoneTitle: null,
    milestoneCount: null,
  };
}

type ParentMetricsInput = {
  studentName?: string;
  milestoneCount?: number | null;
  milestoneTitle?: string | null;
};

export function buildParentSummaryMetrics(
  columns: KanbanColumnData[],
  {
    studentName,
    milestoneCount,
    milestoneTitle,
  }: ParentMetricsInput = {},
): ParentSummaryMetric[] {
  const normalizedStudentName = studentName?.trim().toLowerCase();
  const assignments = columns.flatMap((column) => column.items);
  const scopedAssignments = normalizedStudentName
    ? assignments.filter(
        (assignment) => assignment.student.trim().toLowerCase() === normalizedStudentName,
      )
    : assignments;

  const pendingHomework = scopedAssignments.filter(
    (assignment) =>
      assignment.status === "Assigned" ||
      assignment.status === "Seen by Parent" ||
      assignment.status === "In Progress" ||
      assignment.status === "Needs Support" ||
      assignment.status === "Overdue",
  ).length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dueSoonThreshold = new Date(startOfToday);
  dueSoonThreshold.setDate(dueSoonThreshold.getDate() + 3);

  const dueSoon = scopedAssignments.filter((assignment) => {
    if (
      assignment.status === "Submitted" ||
      assignment.status === "Reviewed" ||
      assignment.status === "Completed"
    ) {
      return false;
    }

    const dueDate = parseAssignmentDueDate(assignment);
    if (!dueDate) {
      return false;
    }

    return dueDate >= startOfToday && dueDate <= dueSoonThreshold;
  }).length;

  const teacherComments = scopedAssignments.reduce(
    (total, assignment) => total + assignment.comments.length,
    0,
  );

  const milestones = milestoneCount ?? 0;

  return [
    {
      label: "Pending Homework",
      value: String(pendingHomework),
      helper: "Still to complete",
      tone: "amber",
    },
    {
      label: "Due Soon",
      value: String(dueSoon),
      helper: "Due in the next 3 days",
      tone: "rose",
    },
    {
      label: "Teacher Comments",
      value: String(teacherComments),
      helper: "Loaded from assignment updates",
      tone: "sky",
    },
    {
      label: "Milestones",
      value: String(milestones),
      helper: milestoneTitle?.trim() || "No milestone recorded yet",
      tone: "emerald",
    },
  ];
}

export function getEmptyTeacherColumns(): KanbanColumnData[] {
  return createEmptyTeacherColumns();
}

export function buildTeacherSummaryMetrics(columns: KanbanColumnData[]): SummaryMetric[] {
  const assignments = columns.flatMap((column) => column.items);
  const students = new Set(
    assignments
      .map((assignment) => assignment.student.trim())
      .filter((studentName) => studentName.length > 0),
  );

  const pendingAssignments = assignments.filter(
    (assignment) =>
      assignment.status !== "Submitted" &&
      assignment.status !== "Reviewed" &&
      assignment.status !== "Completed",
  ).length;

  const submittedWork = assignments.filter(
    (assignment) => assignment.status === "Submitted",
  ).length;

  const noDueDateCount = assignments.filter((assignment) => {
    const dueValue = assignment.due.trim().toLowerCase();
    return dueValue.length === 0 || dueValue === "no due date";
  }).length;

  // TODO: Include overdue assignment detection once due dates are stored in a
  // stable machine-readable format (e.g., full ISO date) in card data.
  const needsSupport = noDueDateCount;

  return [
    { label: "Total Students", value: String(students.size) },
    { label: "Pending Assignments", value: String(pendingAssignments) },
    { label: "Submitted Work", value: String(submittedWork) },
    { label: "Needs Support", value: String(needsSupport) },
  ];
}
