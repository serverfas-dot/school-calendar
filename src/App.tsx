import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Admin from '@/Admin';

type EventCategory = 'academic' | 'holiday' | 'exam' | 'break';
type CalendarEvent = { id: string; event_date: string; title: string; category: EventCategory };

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string);
const categoryColors: Record<EventCategory, string> = { academic: '#2075b8', holiday: '#ef5c53', exam: '#f2a33b', break: '#19a58d' };

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${dateString}T12:00:00`));
}

function AnalogClock({ time }: { time: Date }) {
  const secondAngle = time.getSeconds() * 6;
  const minuteAngle = time.getMinutes() * 6 + time.getSeconds() * 0.1;
  const hourAngle = (time.getHours() % 12) * 30 + time.getMinutes() * 0.5;
  const ticks = Array.from({ length: 60 }, (_, index) => index);
  const numbers = Array.from({ length: 12 }, (_, index) => index + 1);

  return (
    <div className="clock-wrap">
      <div className="analog-clock">
        {ticks.map((tick) => { const angle = (tick * Math.PI) / 30 - Math.PI / 2; const radius = tick % 5 === 0 ? 98 : 102; return <span className={`clock-tick ${tick % 5 === 0 ? 'major-tick' : ''}`} style={{ left: `calc(50% + ${Math.cos(angle) * radius}px)`, top: `calc(50% + ${Math.sin(angle) * radius}px)`, transform: `translate(-50%, -50%) rotate(${tick * 6}deg)` }} key={tick} />; })}
        {numbers.map((number) => { const angle = (number * Math.PI) / 6 - Math.PI / 2; const radius = 84; return <span className="clock-number" style={{ left: `calc(50% + ${Math.cos(angle) * radius}px)`, top: `calc(50% + ${Math.sin(angle) * radius}px)` }} key={number}>{number}</span>; })}
        <span className="clock-hand hour-hand" style={{ transform: `rotate(${hourAngle}deg)` }} />
        <span className="clock-hand minute-hand" style={{ transform: `rotate(${minuteAngle}deg)` }} />
        <span className="clock-hand second-hand" style={{ transform: `rotate(${secondAngle}deg)` }} />
        <span className="clock-center" />
      </div>
      <div className="digital-time">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
      <div className="digital-date">{time.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</div>
    </div>
  );
}

function DisplayPage() {
  const [now, setNow] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase.from('academic_calendar_events').select('id, event_date, title, category').order('event_date');
      if (error) setLoadError('Calendar dates are unavailable right now.');
      else setEvents((data ?? []) as CalendarEvent[]);
      setIsLoading(false);
    }
    void loadEvents();
  }, []);

  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : new Date(year, month, index - firstDay + 1));
  const monthEvents = useMemo(() => events.filter((event) => event.event_date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)), [events, month, year]);
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => map.set(event.event_date, [...(map.get(event.event_date) ?? []), event]));
    return map;
  }, [events]);

  return (
    <main className="kiosk-page">
      <div className="kiosk-layout">
        <AnalogClock time={now} />
        <section className="mini-calendar" aria-label="Monthly calendar">
          <div className="calendar-title-row"><h1>{monthName} <b>{year}</b></h1></div>
          <div className="weekday-row">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="date-grid">{calendarDays.map((day, index) => {
            if (!day) return <span className="date-box blank" key={`blank-${index}`} />;
            const key = dateKey(day);
            const marked = eventMap.get(key) ?? [];
            const isToday = key === dateKey(now);
            return <div className={`date-box ${isToday ? 'current-day' : ''}`} key={key}><span>{day.getDate()}</span>{marked.length > 0 && <i style={{ background: categoryColors[marked[0].category] }} />}</div>;
          })}</div>
          <div className="calendar-note"><span className="blue-note" /> Academic <span className="red-note" /> Holidays <span className="orange-note" /> Exams <span className="green-note" /> Breaks</div>
        </section>
        <section className="notice-board">
          <div className="notice-header"><span className="notice-line" /><h2>Calendar dates</h2></div>
          <p className="notice-subtitle">Important dates for {monthName} {year}</p>
          {loadError && <p className="notice-error">{loadError}</p>}
          {isLoading ? <p className="notice-empty">Loading calendar dates…</p> : monthEvents.length === 0 ? <p className="notice-empty">No marked dates this month.</p> : <div className="notice-list">{monthEvents.map((event) => <div className="notice-row" key={event.id}><span className="notice-date">{formatDate(event.event_date)}</span><span className="notice-name">{event.title}</span><i className="notice-dot" style={{ background: categoryColors[event.category] }} /></div>)}</div>}
        </section>
      </div>
    </main>
  );
}

function App() {
  const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin');

  useEffect(() => {
    const handler = () => setIsAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return isAdmin ? <Admin /> : <DisplayPage />;
}

export default App;
