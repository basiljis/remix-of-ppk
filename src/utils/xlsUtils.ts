import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

// Export organization template
export const exportOrganizationsTemplate = () => {
  const templateData = [
    {
      'Название организации': '',
      'Округ': '',
      'Тип организации': '',
      'Адрес': '',
      'МРСД': ''
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  ws['!cols'] = [
    { wch: 50 }, // Название организации
    { wch: 20 }, // Округ
    { wch: 25 }, // Тип организации
    { wch: 40 }, // Адрес
    { wch: 15 }  // МРСД
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Шаблон организаций');
  const fileName = `organizations_template_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
};

// Export all organizations data
export const exportOrganizationsData = async () => {
  try {
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name');

    if (error) throw error;

    const exportData = organizations.map((org, index) => ({
      '№': index + 1,
      'Название организации': org.name || '',
      'Округ': org.district || '',
      'Тип организации': org.type || '',
      'Адрес': org.address || '',
      'МРСД': org.mrsd || '',
      'Внешний ID': org.external_id || '',
      'Источник': org.is_manual ? 'Ручное добавление' : 'ЕКИС',
      'Дата создания': new Date(org.created_at).toLocaleDateString('ru-RU'),
      'Дата обновления': new Date(org.updated_at).toLocaleDateString('ru-RU')
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    ws['!cols'] = [
      { wch: 5 },  // №
      { wch: 50 }, // Название организации
      { wch: 20 }, // Округ
      { wch: 25 }, // Тип организации
      { wch: 40 }, // Адрес
      { wch: 15 }, // МРСД
      { wch: 15 }, // Внешний ID
      { wch: 20 }, // Источник
      { wch: 15 }, // Дата создания
      { wch: 15 }  // Дата обновления
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Организации');
    const fileName = `organizations_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    return fileName;
  } catch (error) {
    console.error('Error exporting organizations:', error);
    throw error;
  }
};

// Import organizations from XLS
export const importOrganizationsFromXLS = async (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileData = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const organizations = jsonData.map((row: any) => ({
          name: row['Название организации'] || '',
          district: row['Округ'] || null,
          type: row['Тип организации'] || null,
          address: row['Адрес'] || null,
          mrsd: row['МРСД'] || null,
          is_manual: true
        })).filter(org => org.name.trim() !== '');

        if (organizations.length === 0) {
          throw new Error('Файл не содержит данных организаций');
        }

        const { data: insertedOrgs, error } = await supabase
          .from('organizations')
          .insert(organizations)
          .select();

        if (error) throw error;

        resolve(insertedOrgs.length);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

// Export protocol checklist template
export const exportProtocolChecklistTemplate = () => {
  const templateData = [
    {
      'Блок': '',
      'Тема': '',
      'Подтема': '',
      'Описание': '',
      'Метка для оценки 0': '',
      'Метка для оценки 1': '',
      'Вес': '',
      'Порядок блока': '',
      'Порядок темы': '',
      'Порядок подтемы': '',
      'Дошкольное образование (ДО)': '',
      'Начальное общее образование (НОО)': '',
      'Основное общее образование (ОО)': '',
      'Среднее общее образование (СОО)': ''
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 30 }, // Блок
    { wch: 30 }, // Тема
    { wch: 30 }, // Подтема
    { wch: 50 }, // Описание
    { wch: 20 }, // Метка для оценки 0
    { wch: 20 }, // Метка для оценки 1
    { wch: 10 }, // Вес
    { wch: 15 }, // Порядок блока
    { wch: 15 }, // Порядок темы
    { wch: 15 }, // Порядок подтемы
    { wch: 15 }, // ДО
    { wch: 15 }, // НОО
    { wch: 15 }, // ОО
    { wch: 15 }  // СОО
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Шаблон чеклиста');
  const fileName = `protocol_checklist_template_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
};

// Export all protocol checklist data
export const exportProtocolChecklistData = async () => {
  try {
    const { data: items, error } = await supabase
      .from('protocol_checklist_items')
      .select('*')
      .order('block_order, topic_order, subtopic_order');

    if (error) throw error;

    const exportData = items.map((item, index) => ({
      '№': index + 1,
      'ID элемента': item.checklist_item_id,
      'Блок': item.block,
      'Тема': item.topic,
      'Подтема': item.subtopic,
      'Описание': item.description,
      'Метка для оценки 0': item.score_0_label || '',
      'Метка для оценки 1': item.score_1_label || '',
      'Вес': item.weight,
      'Порядок блока': item.block_order,
      'Порядок темы': item.topic_order,
      'Порядок подтемы': item.subtopic_order,
      'Дошкольное образование (ДО)': item.education_level_do ? 'Да' : 'Нет',
      'Начальное общее образование (НОО)': item.education_level_noo ? 'Да' : 'Нет',
      'Основное общее образование (ОО)': item.education_level_oo ? 'Да' : 'Нет',
      'Среднее общее образование (СОО)': item.education_level_soo ? 'Да' : 'Нет',
      'Дата создания': new Date(item.created_at).toLocaleDateString('ru-RU'),
      'Дата обновления': new Date(item.updated_at).toLocaleDateString('ru-RU')
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    ws['!cols'] = [
      { wch: 5 },  // №
      { wch: 15 }, // ID элемента
      { wch: 30 }, // Блок
      { wch: 30 }, // Тема
      { wch: 30 }, // Подтема
      { wch: 50 }, // Описание
      { wch: 20 }, // Метка для оценки 0
      { wch: 20 }, // Метка для оценки 1
      { wch: 10 }, // Вес
      { wch: 15 }, // Порядок блока
      { wch: 15 }, // Порядок темы
      { wch: 15 }, // Порядок подтемы
      { wch: 15 }, // ДО
      { wch: 15 }, // НОО
      { wch: 15 }, // ОО
      { wch: 15 }, // СОО
      { wch: 15 }, // Дата создания
      { wch: 15 }  // Дата обновления
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Чеклист протокола');
    const fileName = `protocol_checklist_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    return fileName;
  } catch (error) {
    console.error('Error exporting protocol checklist:', error);
    throw error;
  }
};

// Import protocol checklist from XLS
export const importProtocolChecklistFromXLS = async (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileData = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const items = jsonData.map((row: any) => ({
          checklist_item_id: row['ID элемента'] || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          block: row['Блок'] || '',
          topic: row['Тема'] || '',
          subtopic: row['Подтема'] || '',
          description: row['Описание'] || '',
          score_0_label: row['Метка для оценки 0'] || null,
          score_1_label: row['Метка для оценки 1'] || null,
          weight: parseFloat(row['Вес']) || 1.0,
          block_order: parseInt(row['Порядок блока']) || 1,
          topic_order: parseInt(row['Порядок темы']) || 1,
          subtopic_order: parseInt(row['Порядок подтемы']) || 1,
          education_level_do: (row['Дошкольное образование (ДО)'] || '').toLowerCase() === 'да',
          education_level_noo: (row['Начальное общее образование (НОО)'] || '').toLowerCase() === 'да',
          education_level_oo: (row['Основное общее образование (ОО)'] || '').toLowerCase() === 'да',
          education_level_soo: (row['Среднее общее образование (СОО)'] || '').toLowerCase() === 'да'
        })).filter(item => item.block.trim() !== '' && item.description.trim() !== '');

        if (items.length === 0) {
          throw new Error('Файл не содержит данных чеклиста');
        }

        const { data: insertedItems, error } = await supabase
          .from('protocol_checklist_items')
          .insert(items)
          .select();

        if (error) throw error;

        resolve(insertedItems.length);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};