UPDATE public.blog_posts 
SET 
  content = '<p><strong>Август — единственный месяц, когда службу сопровождения можно собрать спокойно, а не на бегу.</strong> Мы дополнили статью практическими материалами: шаблонами таблиц и ссылками на формы документов, которые вы можете скачать или скопировать для своей работы.</p>

<h2>1. Ревизия документов: что должно лежать в папке до 1 сентября</h2>
<ul>
  <li><strong>Годовой план работы</strong> специалиста, согласованный с планом школы или центра.</li>
  <li><strong>Циклограмма рабочего времени</strong> на 36 часов (педагог-психолог) или 20 часов (учитель-логопед, учитель-дефектолог).</li>
  <li><strong>Положение о ППк</strong> и приказ о составе консилиума на новый учебный год.</li>
  <li><strong>Формы согласий родителей</strong> на сопровождение и обработку ПДн.</li>
</ul>

<div class="bg-accent/30 p-6 rounded-lg my-8 border border-primary/20">
  <h3 class="text-lg font-semibold mb-3 mt-0">📥 Файлы для скачивания:</h3>
  <ul class="space-y-2 mb-0">
    <li>
      <a href="https://docs.google.com/spreadsheets/d/1example-plan-template/copy" target="_blank" rel="noopener" class="text-primary hover:underline flex items-center gap-2">
        📄 Шаблон годового плана работы (Google Таблица)
      </a>
    </li>
    <li>
      <a href="https://docs.google.com/document/d/1example-consent-form/copy" target="_blank" rel="noopener" class="text-primary hover:underline flex items-center gap-2">
        📝 Форма согласия родителей на сопровождение (DOCX)
      </a>
    </li>
    <li>
      <a href="https://docs.google.com/spreadsheets/d/1example-cyclogram-calc/copy" target="_blank" rel="noopener" class="text-primary hover:underline flex items-center gap-2">
        📊 Калькулятор циклограммы (Excel/Google Sheets)
      </a>
    </li>
  </ul>
  <p class="text-xs text-muted-foreground mt-4 italic">* Ссылки ведут на шаблоны, которые вы можете скопировать в свое облако и редактировать.</p>
</div>

<h2>2. Контроль сроков ПМПК</h2>
<p>Практический приём: заведите таблицу «заключение ПМПК → дата окончания → кто и когда напоминает родителю». Просроченное заключение блокирует и коррекционные часы, и отчётность.</p>

<div class="overflow-x-auto my-6 border rounded-lg">
  <table class="w-full text-sm">
    <thead class="bg-muted">
      <tr>
        <th class="p-2 text-left border-b">ФИО ребенка</th>
        <th class="p-2 text-left border-b">Дата конца ПМПК</th>
        <th class="p-2 text-left border-b">Статус</th>
        <th class="p-2 text-left border-b">Ответственный</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="p-2 border-b">Иванов И.И.</td>
        <td class="p-2 border-b text-destructive font-medium">15.09.2026</td>
        <td class="p-2 border-b">Критично</td>
        <td class="p-2 border-b">Психолог</td>
      </tr>
      <tr>
        <td class="p-2 border-b">Петров П.П.</td>
        <td class="p-2 border-b">20.12.2026</td>
        <td class="p-2 border-b text-yellow-600">В работе</td>
        <td class="p-2 border-b">Логопед</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>3. Циклограмма: считаем часы заранее</h2>
<p>Считайте от обратного: сколько детей на сопровождении, сколько минут занимает занятие и сколько времени нужно на подготовку документов. Подробный разбор нормативов — в материале <a href="/blog/normy-rabochego-vremeni-specialistov">«Нормы рабочего времени»</a>.</p>

<h2>4. Диагностический минимум сентября</h2>
<ol>
  <li><strong>Адаптация</strong> (1-е и 5-е классы) — скрининг в первые 3–4 недели.</li>
  <li><strong>Дети с ОВЗ</strong> — входная оценка по 5 сферам развития.</li>
  <li><strong>Вновь прибывшие</strong> — сбор анамнеза.</li>
</ol>

<p><em>Совет: автоматизируйте сбор данных через universum., чтобы в конце года выгрузить отчет о динамике одной кнопкой, а не сводить таблицы вручную в мае.</em></p>'
WHERE id = (SELECT id FROM public.blog_posts WHERE content ILIKE '%Годовой план%' LIMIT 1);