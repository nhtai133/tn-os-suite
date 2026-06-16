"use client";

import { useState } from "react";
import { useCryptoStore } from "@/store/useCryptoStore";
import type { ColdWalletNote } from "@/store/useCryptoStore";
import { Card, Badge, Button } from "@tn-os/ui";

type NoteForm = { label: string; hint: string; last_verified: string };
const emptyNoteForm = (): NoteForm => ({ label: "", hint: "", last_verified: "" });

export default function SecurityPage() {
  const c = useCryptoStore();
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ColdWalletNote | null>(null);
  const [noteForm, setNoteForm] = useState<NoteForm>(emptyNoteForm());
  const [newCheckLabel, setNewCheckLabel] = useState("");

  if (!c.hydrated) return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;

  const openAddNote = () => { setEditingNote(null); setNoteForm(emptyNoteForm()); setNoteFormOpen(true); };
  const openEditNote = (n: ColdWalletNote) => {
    setEditingNote(n);
    setNoteForm({ label: n.label, hint: n.hint, last_verified: n.last_verified ?? "" });
    setNoteFormOpen(true);
  };
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { label: noteForm.label.trim(), hint: noteForm.hint.trim(), last_verified: noteForm.last_verified || undefined };
    if (editingNote) { c.updateColdWalletNote({ ...editingNote, ...payload }); } else { c.addColdWalletNote(payload); }
    setNoteFormOpen(false);
  };
  const setNote = (key: keyof NoteForm, val: string) => setNoteForm((f) => ({ ...f, [key]: val }));

  const handleAddCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckLabel.trim()) return;
    c.addSecurityCheck({ label: newCheckLabel.trim(), done: false });
    setNewCheckLabel("");
  };

  const secVariant: "success" | "warning" | "danger" =
    c.securityScore >= 80 ? "success" : c.securityScore >= 50 ? "warning" : "danger";

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Security checklist and cold wallet notes</p>
        </div>
        <Badge variant={secVariant}>Security Score: {c.securityScore}%</Badge>
      </div>

      <Card title={`Security Checklist (${c.security_checklist.filter((x) => x.done).length}/${c.security_checklist.length})`}>
        <div className="mt-3 space-y-1">
          {c.security_checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
              <button
                onClick={() => c.toggleSecurityCheck(item.id)}
                className={`text-lg w-5 text-center shrink-0 transition-colors ${item.done ? "text-emerald-400" : "text-zinc-600 hover:text-zinc-400"}`}>
                {item.done ? "✓" : "○"}
              </button>
              <span className={`flex-1 text-sm ${item.done ? "text-zinc-500 line-through" : "text-zinc-200"}`}>{item.label}</span>
              {item.notes && <span className="text-xs text-zinc-600 italic">{item.notes}</span>}
              <button onClick={() => c.deleteSecurityCheck(item.id)} className="text-xs text-red-500 hover:text-red-400 shrink-0">✕</button>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddCheck} className="mt-3 flex gap-2">
          <input
            value={newCheckLabel}
            onChange={(e) => setNewCheckLabel(e.target.value)}
            className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            placeholder="Add checklist item..." />
          <Button variant="ghost" type="submit">Add</Button>
        </form>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Cold Wallet Notes</h2>
        <Button variant="primary" onClick={openAddNote}>+ Add Note</Button>
      </div>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
        ⚠ Store hints only — never write actual seed phrases or private keys here.
      </div>

      {noteFormOpen && (
        <Card title={editingNote ? "Edit Note" : "Add Cold Wallet Note"}>
          <form onSubmit={handleNoteSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Label *</label>
                <input required value={noteForm.label} onChange={(e) => setNote("label", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Ledger Nano X — Primary" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1 block">Hint (no seed phrases!) *</label>
                <input required value={noteForm.hint} onChange={(e) => setNote("hint", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Location hint only, e.g. 'Home safe drawer 2'" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Last Verified</label>
                <input type="date" value={noteForm.last_verified} onChange={(e) => setNote("last_verified", e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" type="submit">{editingNote ? "Save" : "Add"}</Button>
              <Button variant="ghost" type="button" onClick={() => setNoteFormOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {c.cold_wallet_notes.length === 0 && <p className="text-zinc-600 text-sm">No cold wallet notes yet.</p>}
        {c.cold_wallet_notes.map((n) => (
          <Card key={n.id} title={n.label}
            action={
              <div className="flex gap-2">
                <button onClick={() => openEditNote(n)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                <button onClick={() => c.deleteColdWalletNote(n.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
              </div>
            }>
            <div className="mt-2 space-y-1 text-sm">
              <div className="text-zinc-400">{n.hint}</div>
              {n.last_verified && <div className="text-xs text-zinc-600">Last verified: {n.last_verified}</div>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
