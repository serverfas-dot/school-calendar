import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import { LogOut, Plus, Pencil, Trash2, X, Lock } from 'lucide-react';

type EventCategory = 'academic' | 'holiday' | 'exam' | 'break';
type CalendarEvent = { id: string; event_date: string; title: string; category: EventCategory };
type EventForm = { event_date: string; title: string; category: EventCategory };

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string);

const categoryLabels: Record<EventCategory, string> = { academic: 'Academic', holiday: 'Holiday', exam: 'Exam', break: 'School break' };
const categoryColors: Record<EventCategory, string> = { academic: '#2075b8', holiday: '#ef5c53', exam: '#f2a33b', break: '#19a58d' };
const emptyForm: EventForm = { event_date: '', title: '', category: 'academic' };

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${dateString}T12:00:00`));
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setAuthLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    async function loadEvents() {
      setDataLoading(true);
      const { data, error } = await supabase.from('academic_calendar_events').select('id, event_date, title, category').order('event_date');
      if (error) setDataError('Could not load calendar events.');
      else setEvents((data ?? []) as CalendarEvent[]);
      setDataLoading(false);
    }
    void loadEvents();
  }, [session]);

  const years = useMemo(() => {
    const set = new Set<number>();
    events.forEach((e) => set.add(new Date(`${e.event_date}T12:00:00`).getFullYear()));
    return Array.from(set).sort((a, b) => a - b);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterYear !== 'all' && !e.event_date.startsWith(filterYear)) return false;
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      return true;
    });
  }, [events, filterYear, filterCategory]);

  async function handleAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError('');
    setIsSigningIn(true);
    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) setAuthError(error.message);
      else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) setAuthError(signInError.message);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setAuthError(error.message);
    }
    setIsSigningIn(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyForm, event_date: new Date().toISOString().slice(0, 10) });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(event: CalendarEvent) {
    setEditingId(event.id);
    setForm({ event_date: event.event_date, title: event.title, category: event.category });
    setFormError('');
    setModalOpen(true);
  }

  async function saveEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.event_date || !form.title.trim()) { setFormError('Please add both a date and event name.'); return; }
    setIsSaving(true);
    const payload = { event_date: form.event_date, title: form.title.trim(), category: form.category };
    const result = editingId
      ? await supabase.from('academic_calendar_events').update(payload).eq('id', editingId).select().maybeSingle()
      : await supabase.from('academic_calendar_events').insert(payload).select().maybeSingle();
    if (result.error || !result.data) setFormError('This date could not be saved. Please try again.');
    else {
      if (editingId) setEvents((cur) => cur.map((it) => it.id === editingId ? result.data as CalendarEvent : it));
      else setEvents((cur) => [...cur, result.data as CalendarEvent].sort((a, b) => a.event_date.localeCompare(b.event_date)));
      setModalOpen(false);
    }
    setIsSaving(false);
  }

  async function removeEvent(event: CalendarEvent) {
    if (!window.confirm(`Remove "${event.title}" from the calendar?`)) return;
    const { error } = await supabase.from('academic_calendar_events').delete().eq('id', event.id);
    if (error) { window.alert('This date could not be removed.'); return; }
    setEvents((cur) => cur.filter((e) => e.id !== event.id));
  }

  if (authLoading) {
    return <div className="admin-loading">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="admin-auth-page">
        <form className="admin-auth-card" onSubmit={handleAuth}>
          <div className="admin-auth-icon"><Lock size={24} /></div>
          <h1>{isSignup ? 'Create admin account' : 'Admin login'}</h1>
          <p className="admin-auth-sub">{isSignup ? 'Set up your admin credentials' : 'Sign in to manage calendar dates'}</p>
          {authError && <p className="admin-auth-error">{authError}</p>}
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@school.edu" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
          </label>
          <button type="submit" className="admin-auth-btn" disabled={isSigningIn}>{isSigningIn ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}</button>
          <button type="button" className="admin-auth-toggle" onClick={() => { setIsSignup((v) => !v); setAuthError(''); }}>
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Calendar Admin</h1>
          <p>Manage academic calendar dates</p>
        </div>
        <button className="admin-logout" onClick={() => void handleSignOut()}><LogOut size={16} /> Sign out</button>
      </header>

      <div className="admin-toolbar">
        <button className="admin-add-btn" onClick={openAdd}><Plus size={16} /> Add date</button>
        <div className="admin-filters">
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="all">All years</option>
            {years.map((y) => <option value={String(y)} key={y}>{y}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All types</option>
            {Object.entries(categoryLabels).map(([v, l]) => <option value={v} key={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {dataError && <p className="admin-data-error">{dataError}</p>}
      {dataLoading ? <p className="admin-empty">Loading events…</p> : filteredEvents.length === 0 ? <p className="admin-empty">No events found. Click "Add date" to create one.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Date</th><th>Event</th><th>Type</th><th className="admin-actions-col">Actions</th></tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td className="admin-date-cell">{formatDate(event.event_date)}</td>
                  <td>{event.title}</td>
                  <td><span className="admin-category-tag" style={{ background: categoryColors[event.category] }}>{categoryLabels[event.category]}</span></td>
                  <td className="admin-actions-cell">
                    <button className="admin-icon-btn" onClick={() => openEdit(event)} aria-label="Edit"><Pencil size={15} /></button>
                    <button className="admin-icon-btn admin-icon-danger" onClick={() => void removeEvent(event)} aria-label="Remove"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingId ? 'Edit date' : 'Add date'}</h2>
              <button onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <form onSubmit={saveEvent}>
              <label><span>Date</span><input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required /></label>
              <label><span>Event name</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Teachers' Day" required /></label>
              <label><span>Type</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}>{Object.entries(categoryLabels).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select></label>
              {formError && <p className="admin-form-error">{formError}</p>}
              <div className="admin-modal-actions">
                <button type="submit" className="admin-save-btn" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</button>
                {editingId && <button type="button" className="admin-delete-btn" onClick={() => void removeEvent(events.find((e) => e.id === editingId)!)}>Remove</button>}
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
