-- Добавить номер ППК к протоколам
ALTER TABLE protocols 
ADD COLUMN ppk_number VARCHAR(50);

-- Добавить поле тематики заседания к протоколам
ALTER TABLE protocols 
ADD COLUMN session_topic VARCHAR(255);