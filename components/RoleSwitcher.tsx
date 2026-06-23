import type { DashboardRole } from "../lib/types";

type Props = {
  role: DashboardRole;
  onRoleChange: (role: DashboardRole) => void;
};

const roles: Array<{ label: string; value: DashboardRole }> = [
  { label: "Teacher View", value: "teacher" },
  { label: "Parent View", value: "parent" },
];

export default function RoleSwitcher({ role, onRoleChange }: Props) {
  return (
    <div
      className="inline-flex w-full rounded-2xl border border-slate-200 bg-slate-100 p-1 sm:w-auto"
      aria-label="Choose dashboard view"
    >
      {roles.map((option) => {
        const isActive = role === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onRoleChange(option.value)}
            aria-pressed={isActive}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:flex-none ${
              isActive
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
