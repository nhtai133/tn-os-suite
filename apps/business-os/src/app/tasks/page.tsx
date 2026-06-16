"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { BusinessTask, TaskCategory, TaskPriority, TaskStatus } from "@/store/useBusinessStore";
import { Card, Badge, Button } from "@tn-os/ui";

type FormState = { title: string; category: TaskCategory; priority: TaskPriority; status: TaskStatus; due_date: string; notes: string };
const emptyForm = (): FormState => ({ title: "", category: "ops", priority: "medium", status: "todo", due_date: "", notes: "" });

const priorityColor: Record<TaskPriority, string> = { high: "text-red-400", medium: "text-amber-400", low: "text-zinc-400" };
const statusIcon: Record<TaskStatus, string> = { todo: "○", "in-progress": "◐", done: "●", blocked: "✕" };

export default function TasksPage() {
  const b = useBusinessStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessTask | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (t: BusinessTask) => {
    setEditing(t);
    setForm({ title: t.title, category: t.category, priority: t.priority, status: t.status, due_date: t.due_date ?? "", notes: t.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title: form.title.trim(), category: form.category, priority: form.priority, status: form.status, due_date: form.due_date || undefined, notes: form.notes.trim() || undefined };
    if (editing) { b.updateTask({ ...editing, ...payload }); } else { b.addTask(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const quickToggle = (t: BusinessTask) => {
    const next: TaskStatus = t.status === "todo" ? "in-progress" : t.status === "in-progress" ? "done" : "todo";
    b.updateTask({ ...t, status: next });
  };

  const filtered = filter === "all" ? b.tasks : b.tasks.filter((t) => t.status === filter);
  const sortedFiltered = [...filtered].sort((a, z) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return (priority[a.priority] ?? 2) - (priority[z.priority] ?? 2);
  });

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Business operations to-do list</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Task</Button>
      </div>

      <div className="flex gap-2">
        {(["all", "todo", "in-progress", "blocked", "done"] as const).map((s) => {
          const count = s === "all" ? b.tasks.length : b.tasks.filter((t) => t.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${filter === s ? "border-violet-500/40 bg-violet-500/10 text-violet-400" : "border-zinc-800 text-zinc-500 hover:text-white"}`}>
              {s} <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {b.highPriorityTasks > 0 && filter === "all" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          ⚡ {b.highPriorityTasks} high-priority task{b.highPriorityTasks > 1 ? "s" : ""} pending
        </div>
      )}

      {formOpen && (
        <Card title={editing ? "Edit Task" : "Add Task"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Title *</label>
                <input required value={form.title} onChange={(e) => set("title", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Task description" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value as TaskCategory)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["content", "client", "finance", "growth", "ops", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Priority</label>
                <select value={form.priority} onChange={(e) => set("priority", e.target.value as TaskPriority)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["high", "medium", "low"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as TaskStatus)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["todo", "in-progress", "done", "blocked"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Due Date</label>
                <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add Task"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`Tasks (${sortedFiltered.length})`}>
        {sortedFiltered.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No tasks{filter !== "all" ? ` with status "${filter}"` : ""}.</p>
        ) : (
          <div className="mt-3 space-y-1">
            {sortedFiltered.map((t) => (
              <div key={t.id} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border ${t.status === "done" ? "border-zinc-800/30 opacity-50" : "border-zinc-800/60 hover:border-zinc-700"}`}>
                <button onClick={() => quickToggle(t)}
                  className={`text-base w-5 text-center shrink-0 transition-colors ${t.status === "done" ? "text-emerald-400" : t.status === "in-progress" ? "text-amber-400" : t.status === "blocked" ? "text-red-400" : "text-zinc-600 hover:text-zinc-400"}`}>
                  {statusIcon[t.status]}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${t.status === "done" ? "line-through text-zinc-500" : "text-zinc-200"}`}>{t.title}</div>
                  <div className="text-xs text-zinc-600 mt-0.5">
                    {t.category}{t.due_date ? ` · due ${t.due_date}` : ""}
                    {t.notes ? ` · ${t.notes}` : ""}
                  </div>
                </div>
                <Badge variant="neutral">{t.category}</Badge>
                <span className={`text-xs font-medium ${priorityColor[t.priority]}`}>{t.priority}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(t)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                  <button onClick={() => b.deleteTask(t.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
