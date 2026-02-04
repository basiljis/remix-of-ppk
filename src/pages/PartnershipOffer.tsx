import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PartnershipOffer = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/landing">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              На главную
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Публичная оферта о партнёрской программе</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">ПУБЛИЧНАЯ ОФЕРТА О ПАРТНЁРСКОЙ ПРОГРАММЕ</h1>
          
          <p className="text-muted-foreground mb-6">
            Настоящий документ является публичной офертой ИП Загладин В.С. (ИНН: 770702169499, ОГРНИП: 323774600132891 — далее «Компания» — заключить соглашение о партнёрстве на изложенных ниже условиях с любым физическим или юридическим лицом, выразившим желание участвовать в партнёрской программе Компании — далее «Партнёр».
          </p>
          
          <p className="text-muted-foreground mb-8">
            В соответствии со статьёй 435 и пунктом 2 статьи 437 Гражданского кодекса Российской Федерации, акцепт настоящей оферты означает заключение между Компанией и Партнёром договора о сотрудничестве на условиях, изложенных в настоящем документе.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Предмет соглашения</h2>
            <p className="text-muted-foreground mb-3">
              1.1. Компания предоставляет Партнёру возможность участвовать в партнёрской программе по продвижению цифровых решений, представленных на сайте profilaktika.site (далее — «Продукт»), включая, но не ограничиваясь: социальные, психологические тестирования, образовательные курсы, аналитические отчёты и другие цифровые услуги.
            </p>
            <p className="text-muted-foreground mb-3">
              1.2. Партнёр обязуется привлекать новых клиентов (покупателей) к Продукту с использованием индивидуальных реферальных ссылок, промокодов или других идентифицирующих меток, предоставленных Компанией.
            </p>
            <p className="text-muted-foreground">
              1.3. В качестве вознаграждения Партнёр получает процент от суммы подтверждённой оплаты, совершённой привлечённым им клиентом (модель CPS — Cost Per Sale).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Условия партнёрского вознаграждения</h2>
            <p className="text-muted-foreground mb-3">
              2.1. Размер вознаграждения составляет от 10% до 30% от стоимости оплаченного заказа, в зависимости от типа продукта и условий его реализации.
            </p>
            <p className="text-muted-foreground mb-3">
              2.2. Вознаграждение начисляется только за подтверждённые и оплаченные заказы. Заказ считается подтверждённым, если:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-3 ml-4">
              <li>Заключен договор;</li>
              <li>Прошёл процесс оплаты;</li>
              <li>Платёж прошёл проверку (включая проверку на возвраты и мошенничество).</li>
            </ul>
            <p className="text-muted-foreground mb-3">
              2.3. Длительность выплат: Партнёр получает вознаграждение за все оплаты, совершённые клиентом (включая подписки, повторные оплаты, продления).
            </p>
            <p className="text-muted-foreground mb-3">
              2.4. Возможные модели вознаграждения:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>CPS (процент от продажи) — стандартная модель;</li>
              <li>RevShare (доля от выручки) — для подписок и долгосрочных продуктов;</li>
              <li>Фиксированная выплата за лид — по отдельному согласованию для определённых продуктов.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Обязанности Партнёра</h2>
            <p className="text-muted-foreground mb-3">
              3.1. Продвигать Продукт добросовестно, в рамках действующего законодательства Российской Федерации и стран, в которых ведётся реклама.
            </p>
            <p className="text-muted-foreground mb-3">
              3.2. Использовать только официальные реферальные ссылки, промокоды и рекламные материалы, предоставленные Компанией.
            </p>
            <p className="text-muted-foreground mb-3">
              3.3. Не использовать методы:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-3 ml-4">
              <li>Накрутки трафика;</li>
              <li>Спама (в соцсетях, email, мессенджерах);</li>
              <li>Фишинга, обмана или вводящих в заблуждение формулировок;</li>
              <li>Нарушения прав третьих лиц (включая авторские права и товарные знаки).</li>
            </ul>
            <p className="text-muted-foreground">
              3.4. Не создавать сайты, имитирующие profilaktika.site, и не выдавать себя за представителя Компании без согласия.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Обязанности Компании</h2>
            <p className="text-muted-foreground mb-3">
              4.1. Обеспечить:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-3 ml-4">
              <li>Регистрацию и учёт всех переходов, лидов и продаж по реферальным ссылкам;</li>
              <li>Техническую поддержку партнёрской программы.</li>
            </ul>
            <p className="text-muted-foreground mb-3">
              4.2. Начислять вознаграждение ежемесячно по итогам прошедшего месяца, после завершения 30-дневного холда.
            </p>
            <p className="text-muted-foreground mb-3">
              4.3. Производить выплаты в течение 10 рабочих дней после завершения расчётного периода, на реквизиты, указанные Партнёром (банковский счёт, электронные кошельки и т.п.).
            </p>
            <p className="text-muted-foreground">
              4.4. Обеспечить конфиденциальность данных Партнёра и не передавать их третьим лицам без согласия.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Срок действия и расторжение</h2>
            <p className="text-muted-foreground mb-3">
              5.1. Настоящее соглашение вступает в силу с момента регистрации Партнёра в партнёрской программе и действует бессрочно.
            </p>
            <p className="text-muted-foreground mb-3">
              5.2. Любая из сторон может расторгнуть соглашение в одностороннем порядке, уведомив другую сторону за 10 календарных дней в письменной форме (включая email).
            </p>
            <p className="text-muted-foreground mb-3">
              5.3. После расторжения соглашения:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>Начисленные, но не выплаченные суммы выплачиваются в обычном порядке;</li>
              <li>Новые переходы и продажи после даты расторжения не учитываются.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Конфиденциальность</h2>
            <p className="text-muted-foreground mb-3">
              6.1. Стороны обязуются не разглашать конфиденциальную информацию (включая данные о партнёрской программе, ставках, клиентах), полученную в ходе сотрудничества.
            </p>
            <p className="text-muted-foreground">
              6.2. Раскрытие информации допускается только по требованию органов власти или в рамках судебного разбирательства.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Ответственность сторон</h2>
            <p className="text-muted-foreground mb-3">
              7.1. Каждая сторона несёт ответственность за достоверность предоставленной информации и соблюдение условий настоящего соглашения.
            </p>
            <p className="text-muted-foreground mb-3">
              7.2. Компания не несёт ответственности за:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-3 ml-4">
              <li>Убытки Партнёра, связанные с изменением условий программы (при условии уведомления за 30 дней);</li>
              <li>Технические сбои, не зависящие от Компании;</li>
              <li>Действия третьих лиц (платёжные системы, хостинги и т.п.).</li>
            </ul>
            <p className="text-muted-foreground">
              7.3. Партнёр самостоятельно отвечает за соблюдение налогового законодательства в своей стране.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Изменение условий</h2>
            <p className="text-muted-foreground mb-3">
              8.1. Компания вправе вносить изменения в настоящую оферту при условии уведомления Партнёров не менее чем за 30 дней до вступления изменений в силу (через email, персональное уведомление или на сайте).
            </p>
            <p className="text-muted-foreground">
              8.2. Продолжение участия в программе после вступления изменений в силу означает принятие Партнёром новых условий.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Прочие условия</h2>
            <p className="text-muted-foreground mb-3">
              9.1. Настоящее соглашение регулируется законодательством Российской Федерации.
            </p>
            <p className="text-muted-foreground">
              9.2. Все споры разрешаются путём переговоров, при недостижении согласия — в суде по месту нахождения Компании.
            </p>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-muted-foreground mb-2">
              <strong>Дата публикации оферты:</strong> 05 апреля 2025 г.
            </p>
            <p className="text-muted-foreground mb-6">
              Действует до отмены.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Акцепт оферты</h3>
              <p className="text-muted-foreground text-sm">
                Регистрация в партнёрской программе означает полное и безоговорочное принятие Партнёром условий настоящей публичной оферты.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PartnershipOffer;
