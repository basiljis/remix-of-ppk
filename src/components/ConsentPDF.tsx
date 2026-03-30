import jsPDF from 'jspdf';
import { robotoRegularBase64 } from '@/assets/fonts/roboto-regular-base64';
import { robotoBoldBase64 } from '@/assets/fonts/roboto-bold-base64';

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

function registerFonts(doc: jsPDF) {
  doc.addFileToVFS('Roboto-Regular.ttf', robotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', robotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
}

export const generateConsentPDF = (childData: ChildData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  registerFonts(doc);

  doc.setProperties({
    title: 'Согласие родителя на психолого-педагогическое обследование',
    subject: 'Документ согласия',
    creator: 'Система ППк'
  });

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(12);

  let yPosition = 20;
  const lineHeight = 6;
  const pageWidth = 210;
  const margin = 20;

  // Заголовок
  doc.setFontSize(14);
  doc.setFont('Roboto', 'bold');
  doc.text('СОГЛАСИЕ РОДИТЕЛЯ (ЗАКОННОГО ПРЕДСТАВИТЕЛЯ)', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight;
  doc.text('НА ПРОВЕДЕНИЕ ПСИХОЛОГО-ПЕДАГОГИЧЕСКОГО ОБСЛЕДОВАНИЯ', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;

  // Основной текст
  doc.setFontSize(12);
  doc.setFont('Roboto', 'normal');

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

  const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
  doc.text(splitText, margin, yPosition);

  yPosition = 250;

  doc.text('Дата: _______________', margin, yPosition);
  doc.text('Подпись родителя (законного представителя): ___________________', margin, yPosition + lineHeight);
  doc.text(`Телефон: ${childData.parentPhone || '_'.repeat(20)}`, margin, yPosition + lineHeight * 2);

  const fileName = `Согласие_${childData.fullName?.replace(/\s+/g, '_') || 'ребенок'}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.pdf`;
  doc.save(fileName);
};
