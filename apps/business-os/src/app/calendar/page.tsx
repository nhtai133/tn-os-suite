"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { CalendarItem, ContentPlatform } from "@/store/useBusinessStore";
import { Card, Badge, Button } from "@tn-os/ui";

const PLATFORMS: ContentPlatform[] = ["tiktok", "youtube", "telegram", "zalo", "facebook", "instagram", "blog", "other"];

type FormState = { title: string; platform: ContentPlatform; type: string; planned_date: string; status: CalendarItem["status"]; notes: string };
const emptyForm = (): FormState => ({
  title: "", platform: "tiktok", type: "video",
  planned_date: new Date().toISOString().split("T")[0] ?? "",
  status: "planned", notes: "",
});

const statusColor: Record<CalendarItem["status"], string> = {
  planned: "text-blue-400", "in-progress": "text-amber-400", done: "text-emerald-400", cancelled: "text-zinc-600",
};

export default function CalendarPage() {
  const b = useBusinessStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (c: CalendarItem) => {
    setEditing(c);
    setForm({ title: c.title, platform: c.platform, type: c.type, planned_date: c.planned_date, status: c.status, notes: c.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title: form.title.trim(), platform: form.platform, type: form.type.trim() || "post", planned_date: form.planned_date, status: form.status, notes: form.notes.trim() || undefined };
    if (editing) { b.updateCalendarItem({ ...editing, ...payload }); } else { b.addCalendarItem(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const upcoming = b.calendar_items.filter((c) => c.status !== "done" && c.status !== "cancelled");
  const done = b.calendar_items.filter((c) => c.status === "done");

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Calendar</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Planned and in-progress content</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Plan Content</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Planned</div>
          <div className="text-lg font-semibold text-blue-400">{b.calendar_items.filter((c) => c.status === "planned").length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">In Progress</div>
          <div className="text-lg font-semibold text-amber-400">{b.calendar_items.filter((c) => c.status === "in-progress").length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Done</div>
          <div className="text-lg font-semibold text-emerald-400">{done.length}</div>
        </div>
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Calendar Item" : "Plan Content"}>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Title *</label>
                <input required value={form.title} onChange={(e) => set("title", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Content title" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Platform</label>
                <select value={form.platform} onChange={(e) => set("platform", e.target.value as ContentPlatform)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <input value={form.type} onChange={(e) => set("type", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="video, post, reel..." />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Planned Date *</label>
                <input required type="date" value={form.planned_date} onChange={(e) => set("planned_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as CalendarItem["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["planned", "in-progress", "done", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editing ? "Save" : "Add"}</Button>
              <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`Upcoming (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <p className="text-zinc-600 text-sm mt-3">No upcoming content planned.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {upcoming.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                <div>
                  <div className="text-sm text-zinc-200">{c.title}</div>
                  <div className="text-xs text-zinc-500">{c.platform} · {c.type} · {c.planned_date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${statusColor[c.status]}`}>{c.status}</span>
                  <button onClick={() => openEdit(c)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                  <button onClick={() => b.deleteCalendarItem(c.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {done.length > 0 && (
        <Card title={`Completed (${done.length})`}>
          <div className="mt-3 space-y-1">
            {done.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-1.5 text-sm text-zinc-500">
                <span>{c.title} <span className="text-zinc-600">· {c.platform} · {c.planned_date}</span></span>
                <button onClick={() => b.deleteCalendarItem(c.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
