import jsPDF from 'jspdf';

interface ChildData {
  fullName: string;
  birthDate: string;
  age: string;
  classNumber: string;
  classLetter: string;
  address: string;
  parentName: string;
  parentPhone: string;
  whobrought: string;
  educationalOrganization: string;
}

export const generateConsentPDF = (childData: ChildData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Настройка шрифта
  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  let yPosition = 20;
  const lineHeight = 6;
  const pageWidth = 210;
  const margin = 20;

  // Заголовок
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('СОГЛАСИЕ РОДИТЕЛЯ (ЗАКОННОГО ПРЕДСТАВИТЕЛЯ)', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight;
  doc.text('НА ПРОВЕДЕНИЕ ПСИХОЛОГО-ПЕДАГОГИЧЕСКОГО ОБСЛЕДОВАНИЯ', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;

  // Основной текст
  doc.setFontSize(12);
  doc.setFont('times', 'normal');

  const classInfo = `${childData.classNumber || '_'.repeat(5)}${childData.classLetter || ''}`;
  const text = `Я, ${childData.parentName || '_'.repeat(40)}, являющийся родителем (законным представителем) ребенка ${childData.fullName || '_'.repeat(40)}, ${childData.birthDate || '_'.repeat(15)} года рождения, обучающегося в ${childData.educationalOrganization || '_'.repeat(40)}, класс/группа ${classInfo},

даю согласие на проведение психолого-педагогического обследования моего ребенка специалистами психолого-педагогического консилиума образовательной организации.

Я проинформирован(а) о том, что:

• Психолого-педагогическое обследование проводится с целью определения образовательных потребностей ребенка и выработки рекомендаций по организации образовательного процесса;

• Обследование проводится квалифицированными специалистами в соответствии с этическими принципами и профессиональными стандартами;

• Все полученные в ходе обследования данные будут использоваться исключительно в интересах ребенка и конфиденциально;

• Я имею право получить информацию о результатах обследования и рекомендациях специалистов;

• Данное согласие может быть отозвано мной в письменной форме в любое время.

Я подтверждаю, что:
- Получил(а) полную информацию о целях и процедуре обследования;
- Все мои вопросы получили исчерпывающие ответы;
- Понимаю важность проведения данного обследования для образования моего ребенка.`;

  // Разбиваем текст на строки с учетом ширины страницы
  const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
  doc.text(splitText, margin, yPosition);

  // Добавляем подпись и дату
  yPosition = 250; // Позиция внизу страницы

  doc.text('Дата: _______________', margin, yPosition);
  doc.text('Подпись родителя (законного представителя): ___________________', margin, yPosition + lineHeight);
  doc.text(`Телефон: ${childData.parentPhone || '_'.repeat(20)}`, margin, yPosition + lineHeight * 2);

  // Сохраняем файл
  const fileName = `Согласие_${childData.fullName?.replace(/\s+/g, '_') || 'ребенок'}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.pdf`;
  doc.save(fileName);
};