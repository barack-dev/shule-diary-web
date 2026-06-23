import type {
  KanbanColumnData,
  ParentProfile,
  ParentSummaryMetric,
  SummaryMetric,
} from "./types";

export const summaryMetrics: SummaryMetric[] = [
  { label: "Total Students", value: "32" },
  { label: "Pending Assignments", value: "14" },
  { label: "Submitted Work", value: "21" },
  { label: "Needs Support", value: "5" },
];

export const kanbanColumns: KanbanColumnData[] = [
  {
    title: "Assigned",
    items: [
      {
        id: "a1",
        title: "Math worksheet",
        subject: "Math",
        student: "Amina",
        due: "Jun 23",
        description:
          "Complete the fraction worksheet and show all steps for questions 1-12. Circle any question you found difficult.",
        comments: [
          {
            id: "a1-c1",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "Please focus on simplifying fractions before adding them.",
            createdAt: "Jun 22, 09:15 AM",
          },
          {
            id: "a1-c2",
            authorName: "Amina's Parent",
            authorRole: "Parent",
            message: "We reviewed questions 1-6 together this evening.",
            createdAt: "Jun 22, 07:02 PM",
          },
        ],
        status: "Assigned",
      },
    ],
  },
  {
    title: "Seen by Parent",
    items: [
      {
        id: "a2",
        title: "Science summary",
        subject: "Science",
        student: "Brian",
        due: "Jun 25",
        description:
          "Write a one-page summary of the water cycle and include one hand-drawn diagram with labels.",
        comments: [
          {
            id: "a2-c1",
            authorName: "Brian's Parent",
            authorRole: "Parent",
            message: "Brian has read the chapter and will draft tomorrow.",
            createdAt: "Jun 22, 08:10 PM",
          },
        ],
        status: "Seen by Parent",
      },
    ],
  },
  {
    title: "In Progress",
    items: [
      {
        id: "a3",
        title: "History chart",
        subject: "History",
        student: "Chloe",
        due: "Jun 24",
        description:
          "Create a timeline chart for key events in local independence history with at least six milestones.",
        comments: [
          {
            id: "a3-c1",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "Great start. Add event dates on the left for readability.",
            createdAt: "Jun 21, 03:18 PM",
          },
          {
            id: "a3-c2",
            authorName: "Chloe's Parent",
            authorRole: "Parent",
            message: "We visited the library to collect reference notes.",
            createdAt: "Jun 21, 06:44 PM",
          },
          {
            id: "a3-c3",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "Please cite your sources at the bottom.",
            createdAt: "Jun 22, 10:05 AM",
          },
        ],
        status: "In Progress",
      },
    ],
  },
  {
    title: "Submitted",
    items: [
      {
        id: "a4",
        title: "English essay",
        subject: "English",
        student: "Dawit",
        due: "Jun 22",
        description:
          "Write a 400-word essay on 'A person who inspires me' with introduction, body, and conclusion.",
        comments: [
          {
            id: "a4-c1",
            authorName: "Dawit's Parent",
            authorRole: "Parent",
            message: "He completed the first draft last night.",
            createdAt: "Jun 21, 09:22 PM",
          },
          {
            id: "a4-c2",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "Remember to check punctuation before final submission.",
            createdAt: "Jun 22, 08:30 AM",
          },
          {
            id: "a4-c3",
            authorName: "Dawit's Parent",
            authorRole: "Parent",
            message: "Submitted through the portal this morning.",
            createdAt: "Jun 22, 10:11 AM",
          },
          {
            id: "a4-c4",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "Received, thank you. I will review by tomorrow.",
            createdAt: "Jun 22, 11:04 AM",
          },
        ],
        status: "Submitted",
      },
    ],
  },
  {
    title: "Reviewed",
    items: [
      {
        id: "a5",
        title: "Art reflection",
        subject: "Art",
        student: "Emma",
        due: "Jun 20",
        description:
          "Reflect on your collage project in 150 words: color choices, materials used, and message.",
        comments: [],
        status: "Reviewed",
      },
    ],
  },
  {
    title: "Completed",
    items: [
      {
        id: "a6",
        title: "Reading log",
        subject: "Literacy",
        student: "Felix",
        due: "Jun 19",
        description:
          "Complete the weekly reading log with 20 minutes of reading each day and one key takeaway per entry.",
        comments: [
          {
            id: "a6-c1",
            authorName: "Felix's Parent",
            authorRole: "Parent",
            message: "All entries were completed over the weekend.",
            createdAt: "Jun 19, 05:56 PM",
          },
          {
            id: "a6-c2",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "Excellent consistency throughout the week.",
            createdAt: "Jun 20, 09:09 AM",
          },
        ],
        status: "Completed",
      },
    ],
  },
];

export const parentProfile: ParentProfile = {
  childName: "Amina Kamau",
  grade: "Grade 6",
  className: "Blue Class",
  classTeacher: "Ms. Njeri",
};

export const parentSummaryMetrics: ParentSummaryMetric[] = [
  {
    label: "Pending Homework",
    value: "3",
    helper: "Still to complete",
    tone: "amber",
  },
  {
    label: "Due Soon",
    value: "2",
    helper: "Due in the next 3 days",
    tone: "rose",
  },
  {
    label: "Teacher Comments",
    value: "5",
    helper: "New feedback this week",
    tone: "sky",
  },
  {
    label: "Milestones",
    value: "8",
    helper: "Completed this term",
    tone: "emerald",
  },
];

export const parentKanbanColumns: KanbanColumnData[] = [
  {
    title: "Assigned",
    label: "Ready to start",
    items: [
      {
        id: "p1",
        title: "Math worksheet",
        subject: "Math",
        student: "Amina",
        due: "Jun 23",
        description:
          "Complete the fraction worksheet and show all steps for questions 1-12. Circle any question you found difficult.",
        comments: [
          {
            id: "p1-c1",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "Please focus on simplifying fractions before adding them.",
            createdAt: "Jun 22, 09:15 AM",
          },
        ],
        status: "Assigned",
      },
      {
        id: "p2",
        title: "Kiswahili vocabulary",
        subject: "Kiswahili",
        student: "Amina",
        due: "Jun 27",
        description:
          "Write one sentence for each of the 10 new vocabulary words from this week's reading passage.",
        comments: [],
        status: "Assigned",
      },
    ],
  },
  {
    title: "In Progress",
    label: "Being worked on",
    items: [
      {
        id: "p3",
        title: "Science observations",
        subject: "Science",
        student: "Amina",
        due: "Jun 25",
        description:
          "Observe a plant for three days. Record changes in height, leaf color, and soil moisture in the table provided.",
        comments: [
          {
            id: "p3-c1",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "A drawing or photo can be added for each observation day.",
            createdAt: "Jun 21, 02:40 PM",
          },
          {
            id: "p3-c2",
            authorName: "Amina's Parent",
            authorRole: "Parent",
            message: "We started the observation log after school.",
            createdAt: "Jun 21, 07:18 PM",
          },
        ],
        status: "In Progress",
      },
    ],
  },
  {
    title: "Submitted",
    label: "Sent to teacher",
    items: [
      {
        id: "p4",
        title: "Reading response",
        subject: "Literacy",
        student: "Amina",
        due: "Jun 22",
        description:
          "Write a short response explaining the main character's biggest challenge and how they handled it.",
        comments: [
          {
            id: "p4-c1",
            authorName: "Amina's Parent",
            authorRole: "Parent",
            message: "Amina completed and submitted her response this morning.",
            createdAt: "Jun 22, 08:05 AM",
          },
          {
            id: "p4-c2",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "Received. I will add feedback after today's lesson.",
            createdAt: "Jun 22, 10:30 AM",
          },
        ],
        status: "Submitted",
      },
    ],
  },
  {
    title: "Reviewed",
    label: "Feedback received",
    items: [
      {
        id: "p5",
        title: "Art collage reflection",
        subject: "Art",
        student: "Amina",
        due: "Jun 20",
        description:
          "Reflect on your collage project in 150 words: color choices, materials used, and the message you wanted to share.",
        comments: [
          {
            id: "p5-c1",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "Thoughtful reflection, Amina. Your explanation of color choices was especially strong.",
            createdAt: "Jun 20, 03:12 PM",
          },
          {
            id: "p5-c2",
            authorName: "Ms. Njeri",
            authorRole: "Teacher",
            message: "Milestone earned: Creative Communicator.",
            createdAt: "Jun 20, 03:14 PM",
          },
        ],
        status: "Reviewed",
      },
    ],
  },
];
