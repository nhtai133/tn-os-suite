"use client";

import { useState } from "react";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { ContentAsset, ContentPlatform } from "@/store/useBusinessStore";
import { Card, Badge, Button } from "@tn-os/ui";

const PLATFORMS: ContentPlatform[] = ["tiktok", "youtube", "telegram", "zalo", "facebook", "instagram", "blog", "other"];

type FormState = { title: string; platform: ContentPlatform; type: ContentAsset["type"]; status: ContentAsset["status"]; published_date: string; views: string; revenue_attributed: string; notes: string };
const emptyForm = (): FormState => ({ title: "", platform: "tiktok", type: "video", status: "draft", published_date: "", views: "", revenue_attributed: "", notes: "" });

export default function ContentPage() {
  const b = useBusinessStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContentAsset | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [filterPlatform, setFilterPlatform] = useState<ContentPlatform | "all">("all");

  if (!b.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (c: ContentAsset) => {
    setEditing(c);
    setForm({ title: c.title, platform: c.platform, type: c.type, status: c.status, published_date: c.published_date ?? "", views: String(c.views ?? ""), revenue_attributed: String(c.revenue_attributed ?? ""), notes: c.notes ?? "" });
    setFormOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title: form.title.trim(), platform: form.platform, type: form.type, status: form.status, published_date: form.published_date || undefined, views: form.views ? parseInt(form.views) : undefined, revenue_attributed: form.revenue_attributed ? parseFloat(form.revenue_attributed) : undefined, notes: form.notes.trim() || undefined };
    if (editing) { b.updateContentAsset({ ...editing, ...payload }); } else { b.addContentAsset(payload); }
    setFormOpen(false);
  };
  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const filtered = filterPlatform === "all" ? b.content_assets : b.content_assets.filter((c) => c.platform === filterPlatform);
  const published = b.content_assets.filter((c) => c.status === "published");
  const totalViews = published.reduce((s, c) => s + (c.views ?? 0), 0);
  const totalRevenue = published.reduce((s, c) => s + (c.revenue_attributed ?? 0), 0);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Assets</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Published and draft content across platforms</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Content</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Total Views</div>
          <div className="text-lg font-semibold text-white">{(totalViews / 1000).toFixed(0)}K</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">Revenue Attributed</div>
          <div className="text-lg font-semibold text-violet-400">${totalRevenue.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="text-xs text-zinc-500 mb-1">This Month</div>
          <div className="text-lg font-semibold text-emerald-400">{b.publishedThisMonth} pieces</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterPlatform("all")} className={`px-3 py-1 rounded-full text-xs transition-colors ${filterPlatform === "all" ? "bg-violet-500/20 text-violet-400 border border-violet-500/40" : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"}`}>All</button>
        {PLATFORMS.map((p) => (
          <button key={p} onClick={() => setFilterPlatform(p === filterPlatform ? "all" : p)}
            className={`px-3 py-1 rounded-full text-xs transition-colors capitalize ${filterPlatform === p ? "bg-violet-500/20 text-violet-400 border border-violet-500/40" : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"}`}>
            {p}
          </button>
        ))}
      </div>

      {formOpen && (
        <Card title={editing ? "Edit Content" : "Add Content Asset"}>
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
                <select value={form.type} onChange={(e) => set("type", e.target.value as ContentAsset["type"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["video", "post", "article", "live", "course", "reel", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as ContentAsset["status"])}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500">
                  {["draft", "published", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Published Date</label>
                <input type="date" value={form.published_date} onChange={(e) => set("published_date", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Views</label>
                <input type="number" value={form.views} onChange={(e) => set("views", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Revenue Attributed (USD)</label>
                <input type="number" value={form.revenue_attributed} onChange={(e) => set("revenue_attributed", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" placeholder="0" />
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

      <div className="space-y-2">
        {filtered.length === 0 && <Card title="No content"><p className="text-zinc-600 text-sm mt-2">No content assets yet.</p></Card>}
        {filtered.sort((a, z) => (z.published_date ?? "").localeCompare(a.published_date ?? "")).map((c) => (
          <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-zinc-200 font-medium">{c.title}</span>
                <Badge variant="neutral">{c.platform}</Badge>
                <Badge variant={c.status === "published" ? "success" : c.status === "draft" ? "warning" : "neutral"}>{c.status}</Badge>
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {c.type}{c.published_date ? ` · ${c.published_date}` : ""}{c.views ? ` · ${(c.views / 1000).toFixed(0)}K views` : ""}{c.revenue_attributed ? ` · $${c.revenue_attributed} rev` : ""}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button onClick={() => openEdit(c)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
              <button onClick={() => b.deleteContentAsset(c.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
