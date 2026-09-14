-- ========================================================
-- StudyOS: Миграция для отдельных страниц предметов
-- Добавляет поля для методички курса, таблицу доп. материалов и заметок группы
-- ========================================================

-- 1. Поля методички курса в таблице subjects
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS syllabus_file_url TEXT,
ADD COLUMN IF NOT EXISTS syllabus_filename TEXT;

-- 2. Таблица дополнительных полезных материалов (лекции, шпаргалки)
CREATE TABLE IF NOT EXISTS public.subject_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.subject_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Все авторизованные могут просматривать материалы" ON public.subject_materials;
CREATE POLICY "Все авторизованные могут просматривать материалы" 
ON public.subject_materials FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Авторизованные могут добавлять материалы" ON public.subject_materials;
CREATE POLICY "Авторизованные могут добавлять материалы" 
ON public.subject_materials FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Автор или админ могут изменять материал" ON public.subject_materials;
CREATE POLICY "Автор или админ могут изменять материал" 
ON public.subject_materials FOR UPDATE TO authenticated 
USING (
    auth.uid() = uploaded_by 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Автор или админ могут удалять материал" ON public.subject_materials;
CREATE POLICY "Автор или админ могут удалять материал" 
ON public.subject_materials FOR DELETE TO authenticated 
USING (
    auth.uid() = uploaded_by 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Таблица заметок группы к предмету
CREATE TABLE IF NOT EXISTS public.subject_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.subject_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Все авторизованные могут читать заметки" ON public.subject_notes;
CREATE POLICY "Все авторизованные могут читать заметки" 
ON public.subject_notes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Авторизованные могут оставлять заметки" ON public.subject_notes;
CREATE POLICY "Авторизованные могут оставлять заметки" 
ON public.subject_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Автор или админ могут изменять заметку" ON public.subject_notes;
CREATE POLICY "Автор или админ могут изменять заметку" 
ON public.subject_notes FOR UPDATE TO authenticated 
USING (
    auth.uid() = author_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Автор или админ могут удалять заметку" ON public.subject_notes;
CREATE POLICY "Автор или админ могут удалять заметку" 
ON public.subject_notes FOR DELETE TO authenticated 
USING (
    auth.uid() = author_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
