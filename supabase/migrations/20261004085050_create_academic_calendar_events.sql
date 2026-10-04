/*
# Create academic calendar events

1. New Tables
- `academic_calendar_events`
- `id` (uuid, primary key)
- `event_date` (date, the calendar day)
- `title` (text, the event or holiday name)
- `category` (text, visual grouping such as academic, holiday, or exam)
- `created_at` (timestamp)
- `updated_at` (timestamp)

2. Security
- Enable row level security.
- This is an intentionally shared single-school calendar, so anon and authenticated users may read and manage event rows.
- Add separate policies for select, insert, update, and delete.

3. Important Notes
- Dates are stored without a time zone so the selected academic day remains stable for every viewer.
- The interface can update and remove entries from the administrator panel.
*/

CREATE TABLE IF NOT EXISTS academic_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date date NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  category text NOT NULL DEFAULT 'academic' CHECK (category IN ('academic', 'holiday', 'exam', 'break')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academic_calendar_events_event_date_idx ON academic_calendar_events (event_date);
ALTER TABLE academic_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read academic events" ON academic_calendar_events;
CREATE POLICY "Public can read academic events" ON academic_calendar_events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can add academic events" ON academic_calendar_events;
CREATE POLICY "Public can add academic events" ON academic_calendar_events FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public can edit academic events" ON academic_calendar_events;
CREATE POLICY "Public can edit academic events" ON academic_calendar_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can remove academic events" ON academic_calendar_events;
CREATE POLICY "Public can remove academic events" ON academic_calendar_events FOR DELETE TO anon, authenticated USING (true);

INSERT INTO academic_calendar_events (event_date, title, category)
SELECT seed.event_date::date, seed.title, seed.category
FROM (VALUES
  ('2026-01-01', 'New Year 2026', 'holiday'),
  ('2026-01-25', 'Teachers’ Reporting Day', 'academic'),
  ('2026-01-27', 'Beginning of Academic Year 2026', 'academic'),
  ('2026-02-05', 'Opening of the People’s Majlis', 'holiday'),
  ('2026-02-18', 'First of Ramadan', 'holiday'),
  ('2026-03-01', 'Professional Development Days', 'academic'),
  ('2026-03-20', 'Eid-al-Fitr', 'holiday'),
  ('2026-04-05', 'Grade 11 and 12 First Term Exam', 'exam'),
  ('2026-05-01', 'Labour Day', 'holiday'),
  ('2026-05-10', 'Children’s Day', 'academic'),
  ('2026-05-17', 'School Transfer Period 1', 'academic'),
  ('2026-05-26', 'Hajj Day', 'holiday'),
  ('2026-05-27', 'Eid-al-Adha', 'holiday'),
  ('2026-06-07', 'Beginning of AL Batch 2026', 'academic'),
  ('2026-06-16', 'Islamic New Year 1448', 'holiday'),
  ('2026-06-30', 'First Term Exam', 'exam'),
  ('2026-07-09', 'New Admission — LKG & Gr. 1', 'academic'),
  ('2026-07-17', 'First Term Holidays', 'break'),
  ('2026-07-26', 'Independence Day', 'holiday'),
  ('2026-08-02', 'Beginning of Second Term 2026', 'academic'),
  ('2026-08-25', 'Prophet Muhammad’s Birthday', 'holiday'),
  ('2026-09-13', 'The Day Maldives Embraced Islam', 'holiday'),
  ('2026-10-05', 'Teachers’ Day', 'academic'),
  ('2026-10-18', 'School Transfer Period 2', 'academic'),
  ('2026-11-03', 'Victory Day', 'holiday'),
  ('2026-11-11', 'Republic Day', 'holiday'),
  ('2026-12-01', 'Second Term Exam', 'exam'),
  ('2026-12-17', 'End of Second Term 2026', 'academic'),
  ('2026-12-18', 'Second Term Holidays', 'break')
) AS seed(event_date, title, category)
WHERE NOT EXISTS (
  SELECT 1 FROM academic_calendar_events existing
  WHERE existing.event_date = seed.event_date::date AND existing.title = seed.title
);
