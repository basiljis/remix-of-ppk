import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const AuthFooter = () => {
  const [offerOpen, setOfferOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);

  return (
    <>
      <footer className="bg-background border-t py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            {/* Кнопки для модальных окон */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <button
                onClick={() => setOfferOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Оферта
              </button>
              <button
                onClick={() => setPrivacyOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Политика конфиденциальности
              </button>
              <button
                onClick={() => setContactsOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Контакты
              </button>
            </div>

            {/* Данные ИП */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>ИП Загладин В.С.</p>
              <p>ИНН 770702169499 | ОГРНИП 323774600132891</p>
              <p>© 2025 Все права защищены</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Модальное окно: Оферта */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Публичная оферта</DialogTitle>
            <DialogDescription>
              Договор публичной оферты на оказание услуг
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Общие положения</h3>
              <p className="text-muted-foreground">
                Настоящий документ является официальным предложением (публичной офертой) 
                Индивидуального предпринимателя Загладина В.С. 
                (далее — «Исполнитель») для любого физического или юридического лица
                (далее — «Заказчик») заключить договор на оказание услуг по предоставлению 
                доступа к автоматизированной информационной системе «ППК» 
                (далее — «Система» или «Сервис»).
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. Предмет договора</h3>
              <p className="text-muted-foreground">
                Исполнитель обязуется предоставить Заказчику доступ к Системе для создания, 
                хранения и управления протоколами психолого-педагогического консилиума (ППК), 
                а Заказчик обязуется оплатить услуги в соответствии с тарифами Исполнителя.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Стоимость услуг</h3>
              <div className="text-muted-foreground space-y-2">
                <p>Стоимость услуг определяется действующими тарифными планами:</p>
                <ul className="list-disc list-inside ml-4">
                  <li>Месячная подписка: 2 500 ₽ в месяц</li>
                  <li>Годовая подписка: 25 500 ₽ в год (экономия 15%)</li>
                </ul>
                <p>Предоставляется пробный период 7 дней с полным доступом ко всем функциям.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Порядок оплаты</h3>
              <p className="text-muted-foreground">
                Оплата производится путем перечисления денежных средств на расчетный счет 
                Исполнителя или через платежную систему ЮKassa. Услуга считается оказанной 
                с момента предоставления доступа к Системе.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Контактные данные</h3>
              <div className="text-muted-foreground space-y-1">
                <p>ИП Загладин В.С.</p>
                <p>ИНН: 770702169499</p>
                <p>ОГРНИП: 323774600132891</p>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно: Политика конфиденциальности */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Политика конфиденциальности</DialogTitle>
            <DialogDescription>
              Обработка и защита персональных данных
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Общие положения</h3>
              <p className="text-muted-foreground">
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты 
                персональных данных пользователей Системы «ППК» в соответствии с требованиями 
                Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных».
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. Собираемые данные</h3>
              <div className="text-muted-foreground space-y-2">
                <p>В процессе использования Системы могут обрабатываться следующие категории данных:</p>
                <ul className="list-disc list-inside ml-4">
                  <li>ФИО, контактный телефон, адрес электронной почты пользователя</li>
                  <li>Должность, место работы</li>
                  <li>Данные о детях (ФИО, дата рождения, уровень образования)</li>
                  <li>Результаты психолого-педагогических обследований</li>
                  <li>Протоколы заседаний ППК</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Цели обработки данных</h3>
              <div className="text-muted-foreground">
                <p>Персональные данные обрабатываются в целях:</p>
                <ul className="list-disc list-inside ml-4">
                  <li>Предоставления доступа к Системе</li>
                  <li>Создания и хранения протоколов ППК</li>
                  <li>Формирования статистических отчетов</li>
                  <li>Коммуникации с пользователями</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Защита данных</h3>
              <p className="text-muted-foreground">
                Оператор применяет организационные и технические меры защиты персональных данных 
                в соответствии с требованиями ФЗ-152. Все данные хранятся на защищенных серверах 
                с использованием шифрования и контроля доступа. Доступ к персональным данным 
                предоставляется только уполномоченным сотрудникам образовательных организаций.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Права субъектов данных</h3>
              <div className="text-muted-foreground">
                <p>Пользователи имеют право:</p>
                <ul className="list-disc list-inside ml-4">
                  <li>Получать информацию об обработке своих персональных данных</li>
                  <li>Требовать уточнения, блокирования или удаления данных</li>
                  <li>Отозвать согласие на обработку данных</li>
                  <li>Обжаловать действия оператора в Роскомнадзоре или суде</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Контакты оператора</h3>
              <div className="text-muted-foreground space-y-1">
                <p>ИП Загладин В.С.</p>
                <p>ИНН: 770702169499</p>
                <p>ОГРНИП: 323774600132891</p>
                <p>Email: info@profilaktika.site</p>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно: Контакты */}
      <Dialog open={contactsOpen} onOpenChange={setContactsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Контактная информация</DialogTitle>
            <DialogDescription>
              Свяжитесь с нами для получения помощи
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <section>
              <h3 className="font-semibold mb-2">Техническая поддержка</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Email: info@profilaktika.site</p>
                <p>Время работы: Пн-Пт, 9:00-18:00 (МСК)</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Юридические данные</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>ИП Загладин В.С.</p>
                <p>ИНН: 770702169499</p>
                <p>ОГРНИП: 323774600132891</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Коммерческие вопросы</h3>
              <div className="text-sm text-muted-foreground">
                <p>Для получения коммерческого предложения заполните форму в системе или напишите на email: info@profilaktika.site</p>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
