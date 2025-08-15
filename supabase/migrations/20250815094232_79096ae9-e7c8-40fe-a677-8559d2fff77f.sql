-- Insert sample checklist items for difficulties (elementary level)
DO $$
DECLARE
    elementary_difficulties_id UUID;
    elementary_protocol_id UUID;
BEGIN
    -- Get the checklist IDs
    SELECT id INTO elementary_difficulties_id FROM public.checklist WHERE level = 'elementary' AND type = 'difficulties';
    SELECT id INTO elementary_protocol_id FROM public.checklist WHERE level = 'elementary' AND type = 'protocol';
    
    -- Insert sample items for elementary difficulties checklist
    INSERT INTO public.checklist_item (checklist_id, text, is_required, order_index) VALUES 
    (elementary_difficulties_id, 'Трудности с концентрацией внимания', true, 1),
    (elementary_difficulties_id, 'Проблемы с запоминанием информации', true, 2),
    (elementary_difficulties_id, 'Сложности в понимании инструкций', true, 3),
    (elementary_difficulties_id, 'Трудности в выполнении письменных заданий', true, 4),
    (elementary_difficulties_id, 'Проблемы с устным счетом', true, 5),
    (elementary_difficulties_id, 'Сложности в чтении', true, 6),
    (elementary_difficulties_id, 'Трудности в общении со сверстниками', false, 7),
    (elementary_difficulties_id, 'Проблемы с самоконтролем', false, 8);
    
    -- Insert sample items for elementary protocol checklist
    INSERT INTO public.checklist_item (checklist_id, text, is_required, order_index) VALUES 
    (elementary_protocol_id, 'Оценка познавательного развития', true, 1),
    (elementary_protocol_id, 'Анализ речевого развития', true, 2),
    (elementary_protocol_id, 'Оценка эмоционально-волевой сферы', true, 3),
    (elementary_protocol_id, 'Анализ социального развития', true, 4),
    (elementary_protocol_id, 'Оценка моторного развития', false, 5),
    (elementary_protocol_id, 'Анализ учебных навыков', true, 6),
    (elementary_protocol_id, 'Оценка готовности к школьному обучению', false, 7);
END $$;