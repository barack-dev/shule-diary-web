"use server";

import { refresh } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { getAuthProfileResult } from "../../lib/supabase/auth-profile";
import {
  validateFutureDueDateInput,
  type CreateAssignmentActionState,
} from "../../lib/assignment-creation";

type SupabaseStudentRow = {
  id: string;
  class_id: string | null;
};

function normalizeText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function parseTarget(value: string): { type: "class" | "student"; id: string } | null {
  const [type, id] = value.split(":", 2);
  const normalizedType = type?.trim();
  const normalizedId = id?.trim();

  if (!normalizedId) {
    return null;
  }

  if (normalizedType === "class" || normalizedType === "student") {
    return {
      type: normalizedType,
      id: normalizedId,
    };
  }

  return null;
}

async function resolveTeacherOwnedStudentIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherProfileId: string,
  target: { type: "class" | "student"; id: string },
): Promise<string[]> {
  if (target.type === "class") {
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", target.id)
      .eq("teacher_id", teacherProfileId)
      .maybeSingle();

    if (classError) {
      throw new Error(classError.message?.trim() || "Unable to verify selected class.");
    }

    if (!classData) {
      throw new Error("Selected class is not available for your account.");
    }

    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("class_id", target.id);

    if (studentError) {
      throw new Error(studentError.message?.trim() || "Unable to load class students.");
    }

    const students = (studentData ?? []) as Array<{ id?: string }>;
    return Array.from(
      new Set(
        students
          .map((student) => student.id?.trim())
          .filter((id): id is string => Boolean(id)),
      ),
    );
  }

  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select("id, class_id")
    .eq("id", target.id)
    .maybeSingle();

  if (studentError) {
    throw new Error(studentError.message?.trim() || "Unable to verify selected student.");
  }

  const student = (studentData ?? null) as SupabaseStudentRow | null;
  if (!student?.id || !student.class_id) {
    throw new Error("Selected student is not available for your account.");
  }

  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("id", student.class_id)
    .eq("teacher_id", teacherProfileId)
    .maybeSingle();

  if (classError) {
    throw new Error(classError.message?.trim() || "Unable to verify student ownership.");
  }

  if (!classData) {
    throw new Error("Selected student is not in your classes.");
  }

  return [student.id];
}

export async function createTeacherAssignment(
  _previousState: CreateAssignmentActionState,
  formData: FormData,
): Promise<CreateAssignmentActionState> {
  const title = normalizeText(formData.get("title"));
  const subject = normalizeText(formData.get("subject"));
  const description = normalizeText(formData.get("description"));
  const dueDate = normalizeText(formData.get("dueDate"));
  const targetValue = normalizeText(formData.get("target"));

  if (!title || !subject || !description || !targetValue) {
    return {
      error: "Title, subject, instructions, and target are required.",
      success: null,
    };
  }

  const dueDateError = validateFutureDueDateInput(dueDate);
  if (dueDateError) {
    return {
      error: dueDateError,
      success: null,
    };
  }

  const target = parseTarget(targetValue);
  if (!target) {
    return {
      error: "Please choose a valid target class or student.",
      success: null,
    };
  }

  const authResult = await getAuthProfileResult();
  if (authResult.status !== "authenticated") {
    return {
      error: "You must be signed in as a teacher to create assignments.",
      success: null,
    };
  }

  if (authResult.profile.role !== "teacher") {
    return {
      error: "Only teachers can create assignments.",
      success: null,
    };
  }

  const supabase = await createClient();

  try {
    const ownedStudentIds = await resolveTeacherOwnedStudentIds(
      supabase,
      authResult.profile.id,
      target,
    );

    if (ownedStudentIds.length === 0) {
      return {
        error: "No students were found for the selected target.",
        success: null,
      };
    }

    const assignmentId = crypto.randomUUID();
    const { error: assignmentError } = await supabase
      .from("assignments")
      .insert({
        id: assignmentId,
        title,
        subject,
        description,
        due_date: dueDate,
      });

    if (assignmentError) {
      return {
        error: assignmentError.message?.trim() || "Unable to create assignment.",
        success: null,
      };
    }

    const assignmentStudentRows = ownedStudentIds.map((studentId) => ({
      assignment_id: assignmentId,
      student_id: studentId,
      status: "assigned",
    }));

    const { error: assignmentStudentsError } = await supabase
      .from("assignment_students")
      .insert(assignmentStudentRows);

    if (assignmentStudentsError) {
      return {
        error:
          assignmentStudentsError.message?.trim() ||
          "Assignment was created but could not be assigned to students.",
        success: null,
      };
    }

    refresh();

    return {
      error: null,
      success: "Assignment created successfully.",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create assignment.",
      success: null,
    };
  }
}
