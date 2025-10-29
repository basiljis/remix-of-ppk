import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export function DataProcessingAgreement() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto p-0 text-sm text-primary hover:underline">
          соглашение об обработке персональных данных
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Согласие на обработку персональных данных</DialogTitle>
          <DialogDescription>
            Пожалуйста, ознакомьтесь с условиями обработки персональных данных
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Общие положения</h3>
              <p className="text-muted-foreground">
                Настоящим я даю свое согласие на обработку моих персональных данных в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ "О персональных данных".
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. Персональные данные</h3>
              <p className="text-muted-foreground mb-2">
                Под персональными данными понимается следующая информация:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Фамилия, имя, отчество</li>
                <li>Адрес электронной почты</li>
                <li>Номер телефона</li>
                <li>Должность и место работы</li>
                <li>Регион и организация</li>
                <li>Данные о созданных протоколах и документах</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Цели обработки персональных данных</h3>
              <p className="text-muted-foreground mb-2">
                Персональные данные обрабатываются в следующих целях:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Предоставление доступа к информационной системе</li>
                <li>Идентификация пользователя</li>
                <li>Ведение учета протоколов психолого-педагогических консилиумов</li>
                <li>Формирование отчетности и статистики</li>
                <li>Обеспечение информационной безопасности</li>
                <li>Направление уведомлений, связанных с работой системы</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Способы обработки персональных данных</h3>
              <p className="text-muted-foreground">
                Обработка персональных данных осуществляется с использованием средств автоматизации и без использования таких средств. Обработка включает сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передачу (предоставление, доступ), обезличивание, блокирование, удаление и уничтожение персональных данных.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Передача персональных данных</h3>
              <p className="text-muted-foreground">
                Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных законодательством Российской Федерации. Доступ к персональным данным имеют только уполномоченные сотрудники образовательной организации и администраторы системы.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Безопасность персональных данных</h3>
              <p className="text-muted-foreground">
                Оператор обеспечивает безопасность персональных данных путем применения организационных и технических мер, направленных на защиту персональных данных от неправомерного или случайного доступа к ним, уничтожения, изменения, блокирования, копирования, предоставления, распространения, а также от иных неправомерных действий.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">7. Срок действия согласия</h3>
              <p className="text-muted-foreground">
                Настоящее согласие действует с момента его предоставления и до момента отзыва. Согласие может быть отозвано субъектом персональных данных путем направления письменного заявления оператору.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">8. Права субъекта персональных данных</h3>
              <p className="text-muted-foreground mb-2">
                Субъект персональных данных имеет право:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Получать информацию о наличии персональных данных</li>
                <li>Требовать уточнения своих персональных данных</li>
                <li>Требовать блокирования или уничтожения персональных данных</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Обжаловать действия или бездействие оператора</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">9. Контактная информация</h3>
              <p className="text-muted-foreground">
                По вопросам обработки персональных данных вы можете обращаться к администратору системы через функционал обратной связи в личном кабинете или по адресу электронной почты, указанному в настройках вашего профиля.
              </p>
            </section>

            <section className="pt-4 border-t">
              <p className="text-muted-foreground italic">
                Предоставляя свои персональные данные при регистрации, я подтверждаю, что ознакомлен(а) с настоящим соглашением и согласен(на) с условиями обработки моих персональных данных.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
