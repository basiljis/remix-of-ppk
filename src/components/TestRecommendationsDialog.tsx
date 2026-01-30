import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Lightbulb, BookOpen, Heart, Users, Brain, 
  MessageCircle, Clock, Target, AlertTriangle, CheckCircle2 
} from "lucide-react";

interface TestResult {
  id: string;
  result_type: string;
  result_label: string;
  risk_level: string;
  scores: {
    warmth: number;
    control: number;
    involvement: number;
  };
  recommendations: string[];
}

interface TestRecommendationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: TestResult | null;
  childName: string;
}

const PARENTING_STYLE_RECOMMENDATIONS: Record<string, {
  description: string;
  strengths: string[];
  areasToImprove: string[];
  practicalTips: { title: string; description: string; icon: any }[];
  resources: string[];
}> = {
  authoritative: {
    description: "Вы практикуете сбалансированный подход к воспитанию, сочетая тёплое отношение с разумными требованиями. Это наиболее эффективный стиль, способствующий гармоничному развитию ребёнка.",
    strengths: [
      "Высокий уровень эмоциональной поддержки",
      "Чёткие, но гибкие границы",
      "Открытое общение с ребёнком",
      "Уважение к мнению ребёнка"
    ],
    areasToImprove: [
      "Продолжайте развивать эмоциональный интеллект ребёнка",
      "Поддерживайте баланс между свободой и ответственностью"
    ],
    practicalTips: [
      {
        title: "Семейные обсуждения",
        description: "Проводите еженедельные семейные встречи, где каждый может высказаться",
        icon: Users
      },
      {
        title: "Эмоциональное развитие",
        description: "Обсуждайте чувства и учите ребёнка их распознавать",
        icon: Heart
      },
      {
        title: "Совместное время",
        description: "Планируйте качественное время вместе без гаджетов",
        icon: Clock
      }
    ],
    resources: [
      "Книга: «Как говорить, чтобы дети слушали» — А. Фабер, Э. Мазлиш",
      "Курс: Позитивная дисциплина",
      "Занятия по развитию эмоционального интеллекта"
    ]
  },
  authoritarian: {
    description: "Ваш стиль характеризуется высокими требованиями и строгим контролем. Это может обеспечивать дисциплину, но важно добавить больше тепла в отношения с ребёнком.",
    strengths: [
      "Чёткие правила и структура",
      "Последовательность в требованиях",
      "Дисциплинированность"
    ],
    areasToImprove: [
      "Развитие эмоциональной близости с ребёнком",
      "Учёт мнения и чувств ребёнка",
      "Гибкость в применении правил"
    ],
    practicalTips: [
      {
        title: "Активное слушание",
        description: "Практикуйте технику активного слушания — повторяйте слова ребёнка и спрашивайте о его чувствах",
        icon: MessageCircle
      },
      {
        title: "Позитивное подкрепление",
        description: "Хвалите ребёнка за усилия, не только за результат",
        icon: Target
      },
      {
        title: "Совместное принятие решений",
        description: "Позволяйте ребёнку участвовать в принятии некоторых решений",
        icon: Users
      },
      {
        title: "Эмпатия",
        description: "Старайтесь понять точку зрения ребёнка перед тем, как настаивать на своём",
        icon: Heart
      }
    ],
    resources: [
      "Книга: «Общаться с ребёнком. Как?» — Ю.Б. Гиппенрейтер",
      "Тренинг: Эмпатичное родительство",
      "Консультация детского психолога"
    ]
  },
  permissive: {
    description: "Вы создаёте тёплую атмосферу, но ребёнку может не хватать чётких границ. Это может затруднять развитие самодисциплины.",
    strengths: [
      "Высокий уровень эмоционального принятия",
      "Близкие отношения с ребёнком",
      "Поддерживающая атмосфера"
    ],
    areasToImprove: [
      "Установление последовательных правил",
      "Развитие ответственности у ребёнка",
      "Баланс между свободой и структурой"
    ],
    practicalTips: [
      {
        title: "Чёткие правила",
        description: "Вместе с ребёнком составьте список базовых семейных правил и следуйте им последовательно",
        icon: BookOpen
      },
      {
        title: "Естественные последствия",
        description: "Позвольте ребёнку столкнуться с безопасными последствиями своих действий",
        icon: Brain
      },
      {
        title: "Домашние обязанности",
        description: "Введите регулярные посильные обязанности для развития ответственности",
        icon: Target
      },
      {
        title: "Режим дня",
        description: "Установите предсказуемый распорядок дня с фиксированным временем для сна, еды, учёбы",
        icon: Clock
      }
    ],
    resources: [
      "Книга: «Границы с детьми» — Г. Клауд, Дж. Таунсенд",
      "Курс: Позитивная дисциплина без наказаний",
      "Семейная терапия (по желанию)"
    ]
  },
  uninvolved: {
    description: "Результаты указывают на недостаточную вовлечённость в воспитание. Это может быть связано с усталостью, стрессом или нехваткой ресурсов. Важно постепенно увеличивать контакт с ребёнком.",
    strengths: [
      "Предоставление автономии ребёнку"
    ],
    areasToImprove: [
      "Увеличение времени с ребёнком",
      "Проявление интереса к его жизни",
      "Эмоциональная поддержка",
      "Установление правил и границ"
    ],
    practicalTips: [
      {
        title: "15 минут в день",
        description: "Начните с 15 минут качественного времени с ребёнком ежедневно — без телефона и других отвлечений",
        icon: Clock
      },
      {
        title: "Интерес к жизни ребёнка",
        description: "Задавайте открытые вопросы о школе, друзьях, интересах",
        icon: MessageCircle
      },
      {
        title: "Физический контакт",
        description: "Обнимайте ребёнка минимум 4 раза в день",
        icon: Heart
      },
      {
        title: "Поддержка специалиста",
        description: "Рассмотрите возможность консультации с психологом для себя",
        icon: Brain
      }
    ],
    resources: [
      "Консультация семейного психолога (рекомендуется)",
      "Группа поддержки для родителей",
      "Книга: «Тайная опора: привязанность в жизни ребёнка» — Л. Петрановская"
    ]
  }
};

export function TestRecommendationsDialog({ 
  open, 
  onOpenChange, 
  result,
  childName 
}: TestRecommendationsDialogProps) {
  if (!result) return null;

  const styleData = PARENTING_STYLE_RECOMMENDATIONS[result.result_type] || PARENTING_STYLE_RECOMMENDATIONS.authoritative;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "high": return "bg-red-500";
      default: return "bg-muted";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "low": return "Низкий";
      case "medium": return "Средний";
      case "high": return "Высокий";
      default: return risk;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-pink-600" />
            Рекомендации по воспитанию
          </DialogTitle>
          <DialogDescription>
            На основе результатов теста для {childName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Result summary */}
          <Card className="bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Ваш стиль воспитания</p>
                  <p className="text-xl font-semibold">{result.result_label}</p>
                </div>
                <Badge className={`${getRiskColor(result.risk_level)} text-white`}>
                  Риск: {getRiskLabel(result.risk_level)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{styleData.description}</p>
            </CardContent>
          </Card>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Heart className="h-5 w-5 mx-auto text-pink-600 mb-1" />
              <p className="text-2xl font-bold text-pink-600">{result.scores.warmth}/5</p>
              <p className="text-xs text-muted-foreground">Эмоц. теплота</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Target className="h-5 w-5 mx-auto text-pink-600 mb-1" />
              <p className="text-2xl font-bold text-pink-600">{result.scores.control}/5</p>
              <p className="text-xs text-muted-foreground">Гибкость границ</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 mx-auto text-pink-600 mb-1" />
              <p className="text-2xl font-bold text-pink-600">{result.scores.involvement}/5</p>
              <p className="text-xs text-muted-foreground">Вовлечённость</p>
            </div>
          </div>

          <Separator />

          {/* Strengths */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Ваши сильные стороны
            </h4>
            <ul className="space-y-2">
              {styleData.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 mt-1">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Areas to improve */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Зоны роста
            </h4>
            <ul className="space-y-2">
              {styleData.areasToImprove.map((area, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-600 mt-1">→</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Practical tips */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-pink-600" />
              Практические рекомендации
            </h4>
            <div className="grid gap-3">
              {styleData.practicalTips.map((tip, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4 flex gap-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-950/50 rounded-lg h-fit">
                      <tip.icon className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-medium">{tip.title}</p>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-pink-600" />
              Рекомендуемые ресурсы
            </h4>
            <ul className="space-y-2">
              {styleData.resources.map((resource, i) => (
                <li key={i} className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded-lg">
                  <span className="text-pink-600">•</span>
                  {resource}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
