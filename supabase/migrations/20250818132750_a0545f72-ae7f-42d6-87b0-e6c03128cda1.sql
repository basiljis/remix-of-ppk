-- Оптимизация индексов для высокой нагрузки

-- Индексы для таблицы protocols (наиболее частые запросы)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocols_status ON protocols(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocols_consultation_type ON protocols(consultation_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocols_consultation_reason ON protocols(consultation_reason);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocols_meeting_type ON protocols(meeting_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocols_education_level ON protocols(education_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocols_organization_id ON protocols(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocols_created_at_desc ON protocols(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocols_updated_at_desc ON protocols(updated_at DESC);

-- Составной индекс для фильтрации и пагинации
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocols_filters_created ON protocols(status, consultation_type, created_at DESC);

-- Индекс для поиска по имени ребенка (поддержка ILIKE)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocols_child_name_gin ON protocols USING gin(child_name gin_trgm_ops);

-- Индексы для таблицы organizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_district ON organizations(district);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_ekis_id ON organizations(ekis_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_is_archived ON organizations(is_archived);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_has_education_activity ON organizations(has_education_activity);

-- Индекс для поиска по названию организации (поддержка ILIKE)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_name_gin ON organizations USING gin(name gin_trgm_ops);

-- Включаем расширение pg_trgm для быстрого поиска
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Индексы для таблицы protocol_checklist_items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocol_checklist_items_education_levels ON protocol_checklist_items(education_level_do, education_level_noo, education_level_oo, education_level_soo);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_protocol_checklist_items_block_order ON protocol_checklist_items(block_order, topic_order, subtopic_order);

-- Индексы для таблицы api_logs (для мониторинга)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_logs_created_at_desc ON api_logs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_logs_status_code ON api_logs(status_code);

-- Индексы для таблицы instructions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instructions_is_active ON instructions(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instructions_type ON instructions(type);

-- Статистика для оптимизатора запросов
ANALYZE protocols;
ANALYZE organizations;
ANALYZE protocol_checklist_items;
ANALYZE api_logs;
ANALYZE instructions;