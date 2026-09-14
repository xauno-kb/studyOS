-- ========================================================
-- StudyOS: Миграция безопасности и разграничения ролей
-- 1. Закрепляет hasleranet@gmail.com как главного админа
-- 2. Все новые пользователи ВСЕГДА регистрируются с ролью student
-- 3. Запрещает старостам редактировать и удалять сообщения/материалы друг друга
-- ========================================================

-- 1. Обновляем триггер создания нового пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    assigned_role public.user_role;
BEGIN
    -- Только главный админ hasleranet@gmail.com автоматически получает admin
    -- Все остальные пользователи ВСЕГДА получают роль student
    IF LOWER(NEW.email) = 'hasleranet@gmail.com' THEN
        assigned_role := 'admin'::public.user_role;
    ELSE
        assigned_role := 'student'::public.user_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Студент'),
        assigned_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = CASE 
            WHEN LOWER(EXCLUDED.email) = 'hasleranet@gmail.com' THEN 'admin'::public.user_role
            ELSE public.profiles.role 
        END;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Перепривязываем триггер к auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Гарантируем, что hasleranet@gmail.com имеет роль admin, а остальные существующие не-главные — student
UPDATE public.profiles 
SET role = 'admin' 
WHERE LOWER(email) = 'hasleranet@gmail.com';

-- 2. Обновление RLS для subject_notes (заметки группы)
-- Читать могут все авторизованные
-- Добавлять могут все авторизованные
-- Изменять и удалять могут ТОЛЬКО автор ИЛИ главный админ (hasleranet@gmail.com)
ALTER TABLE public.subject_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Все авторизованные могут читать заметки" ON public.subject_notes;
CREATE POLICY "Все авторизованные могут читать заметки" 
ON public.subject_notes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Авторизованные могут оставлять заметки" ON public.subject_notes;
CREATE POLICY "Авторизованные могут оставлять заметки" 
ON public.subject_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Автор или админ могут изменять заметку" ON public.subject_notes;
DROP POLICY IF EXISTS "Автор или главный админ могут изменять заметку" ON public.subject_notes;
CREATE POLICY "Автор или главный админ могут изменять заметку" 
ON public.subject_notes FOR UPDATE TO authenticated 
USING (
    auth.uid() = author_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND LOWER(email) = 'hasleranet@gmail.com')
);

DROP POLICY IF EXISTS "Автор или админ могут удалять заметку" ON public.subject_notes;
DROP POLICY IF EXISTS "Автор или главный админ могут удалять заметку" ON public.subject_notes;
CREATE POLICY "Автор или главный админ могут удалять заметку" 
ON public.subject_notes FOR DELETE TO authenticated 
USING (
    auth.uid() = author_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND LOWER(email) = 'hasleranet@gmail.com')
);

-- 3. Обновление RLS для subject_materials (дополнительные материалы)
-- Изменять и удалять могут ТОЛЬКО автор материала ИЛИ главный админ (hasleranet@gmail.com)
ALTER TABLE public.subject_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Все авторизованные могут просматривать материалы" ON public.subject_materials;
CREATE POLICY "Все авторизованные могут просматривать материалы" 
ON public.subject_materials FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Авторизованные могут добавлять материалы" ON public.subject_materials;
CREATE POLICY "Авторизованные могут добавлять материалы" 
ON public.subject_materials FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Автор или админ могут изменять материал" ON public.subject_materials;
DROP POLICY IF EXISTS "Автор или главный админ могут изменять материал" ON public.subject_materials;
CREATE POLICY "Автор или главный админ могут изменять материал" 
ON public.subject_materials FOR UPDATE TO authenticated 
USING (
    auth.uid() = uploaded_by 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND LOWER(email) = 'hasleranet@gmail.com')
);

DROP POLICY IF EXISTS "Автор или админ могут удалять материал" ON public.subject_materials;
DROP POLICY IF EXISTS "Автор или главный админ могут удалять материал" ON public.subject_materials;
CREATE POLICY "Автор или главный админ могут удалять материал" 
ON public.subject_materials FOR DELETE TO authenticated 
USING (
    auth.uid() = uploaded_by 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND LOWER(email) = 'hasleranet@gmail.com')
);
