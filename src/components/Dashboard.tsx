import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { BarChart3, PieChart as PieIcon, CalendarIcon, Filter, FileText, Users, Target } from "lucide-react";
import { useProtocols, Protocol } from "@/hooks/useProtocols";
import { useOrganizations, Organization } from "@/hooks/useOrganizations";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { analyzeProtocolResults } from "@/utils/assistanceDirections";
import { generateProtocolConclusion } from "@/utils/protocolRecommendations";
import { useProtocolChecklistData } from "@/hooks/useProtocolChecklistData";
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
export const Dashboard = () => {
  const {
    protocols,
    loading
  } = useProtocols();
  const {
    organizations
  } = useOrganizations();
  const [filteredProtocols, setFilteredProtocols] = useState<Protocol[]>(protocols);

  // Фильтры
  const [eduOrgFilter, setEduOrgFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [parallelFilter, setParallelFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Данные из организаций
  const districts = [...new Set(organizations.map(org => org.district).filter(Boolean))] as string[];
  useEffect(() => {
    applyFilters();
  }, [protocols, eduOrgFilter, districtFilter, levelFilter, typeFilter, parallelFilter, reasonFilter, dateFrom, dateTo, organizations]);
  const applyFilters = () => {
    let filtered = [...protocols];
    if (eduOrgFilter) {
      // Find organization by ID and filter protocols
      const selectedOrg = organizations.find(org => org.id === eduOrgFilter);
      if (selectedOrg) {
        filtered = filtered.filter(p => p.organizations?.id === selectedOrg.id || p.organizations?.name === selectedOrg.name);
      }
    }
    if (districtFilter && districtFilter !== "all") {
      filtered = filtered.filter(p => p.organizations?.district === districtFilter);
    }
    if (levelFilter && levelFilter !== "all") {
      filtered = filtered.filter(p => p.education_level === levelFilter);
    }
    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(p => p.consultation_type === typeFilter);
    }
    if (parallelFilter && parallelFilter !== "all") {
      // Фильтр по параллели - извлекаем номер класса или тип группы из protocolData
      filtered = filtered.filter(p => {
        const classNumber = p.protocol_data?.childData?.classNumber || "";
        const isPreschool = p.education_level === "preschool";
        if (isPreschool) {
          return classNumber.toLowerCase().includes(parallelFilter.toLowerCase());
        } else {
          return classNumber === parallelFilter;
        }
      });
    }
    if (reasonFilter) {
      filtered = filtered.filter(p => p.consultation_reason?.toLowerCase().includes(reasonFilter.toLowerCase()));
    }
    if (dateFrom) {
      filtered = filtered.filter(p => new Date(p.created_at) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(p => new Date(p.created_at) <= dateTo);
    }
    setFilteredProtocols(filtered);
  };
  const resetFilters = () => {
    setEduOrgFilter("");
    setDistrictFilter("all");
    setLevelFilter("all");
    setTypeFilter("all");
    setParallelFilter("all");
    setReasonFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Подготовка данных для диаграмм
  const statusData = [{
    name: 'Завершенные',
    value: filteredProtocols.filter(p => p.status === 'completed').length,
    color: '#00C49F'
  }, {
    name: 'Черновики',
    value: filteredProtocols.filter(p => p.status === 'draft').length,
    color: '#FF8042'
  }];
  const levelData = [{
    name: 'Дошкольное',
    value: filteredProtocols.filter(p => p.education_level === 'preschool').length,
    color: '#0088FE'
  }, {
    name: 'Начальное',
    value: filteredProtocols.filter(p => p.education_level === 'elementary').length,
    color: '#00C49F'
  }, {
    name: 'Основное',
    value: filteredProtocols.filter(p => p.education_level === 'middle').length,
    color: '#FFBB28'
  }, {
    name: 'Среднее',
    value: filteredProtocols.filter(p => p.education_level === 'high').length,
    color: '#FF8042'
  }].filter(item => item.value > 0);
  const typeData = [{
    name: 'Первичные',
    value: filteredProtocols.filter(p => p.consultation_type === 'primary').length,
    color: '#8884D8'
  }, {
    name: 'Вторичные',
    value: filteredProtocols.filter(p => p.consultation_type === 'secondary').length,
    color: '#82CA9D'
  }].filter(item => item.value > 0);

  // Группировка по причинам
  const reasonsCount = filteredProtocols.reduce((acc, protocol) => {
    const reason = protocol.consultation_reason || 'Не указано';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const reasonData = Object.entries(reasonsCount).map(([reason, count]) => ({
    name: reason,
    value: count
  }));

  // Данные по округам
  const districtCounts = filteredProtocols.reduce((acc, protocol) => {
    const district = protocol.organizations?.district || 'Неизвестно';
    acc[district] = (acc[district] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const districtData = Object.entries(districtCounts).map(([district, count]) => ({
    name: district,
    count
  }));

  // Получение чеклист данных для анализа заключений и рекомендаций
  const { getBlocksForEducationLevel, calculateBlockScore } = useProtocolChecklistData();

  // Анализ заключений и рекомендаций
  const conclusionAnalysis = filteredProtocols
    .filter(p => p.status === 'completed' && p.checklist_data)
    .map(protocol => {
      try {
        const blocks = getBlocksForEducationLevel(protocol.education_level);
        // Восстанавливаем оценки из сохраненных данных протокола
        blocks.forEach(block => {
          block.topics.forEach(topic => {
            topic.subtopics.forEach(subtopic => {
              subtopic.items.forEach(item => {
                const savedScore = protocol.checklist_data?.[item.id];
                if (savedScore !== undefined) {
                  item.score = savedScore;
                }
              });
            });
          });
        });

        const analysis = analyzeProtocolResults(blocks, calculateBlockScore, protocol.education_level);
        const conclusion = generateProtocolConclusion(analysis, protocol.child_name, protocol.education_level);
        
        return {
          protocolId: protocol.id,
          childName: protocol.child_name,
          overallGroup: analysis.overallGroup,
          specialists: conclusion.specialistAssignments,
          recommendations: analysis.recommendations,
          conclusion: conclusion.conclusionText
        };
      } catch (error) {
        console.error(`Error analyzing protocol ${protocol.id}:`, error);
        return null;
      }
    })
    .filter(Boolean);

  // Статистика по группам помощи
  const groupData = [
    {
      name: 'Группа 1 (норма)',
      value: conclusionAnalysis.filter(c => c?.overallGroup.group === 1).length,
      color: '#00C49F'
    },
    {
      name: 'Группа 2 (риск)',
      value: conclusionAnalysis.filter(c => c?.overallGroup.group === 2).length,
      color: '#FFBB28'
    },
    {
      name: 'Группа 3 (нарушение)',
      value: conclusionAnalysis.filter(c => c?.overallGroup.group === 3).length,
      color: '#FF8042'
    }
  ].filter(item => item.value > 0);

  // Статистика по специалистам
  const specialistData = [
    {
      name: 'Учитель',
      value: conclusionAnalysis.filter(c => c?.specialists.teacher).length,
      color: '#0088FE'
    },
    {
      name: 'Логопед',
      value: conclusionAnalysis.filter(c => c?.specialists.speechTherapist).length,
      color: '#00C49F'
    },
    {
      name: 'Психолог',
      value: conclusionAnalysis.filter(c => c?.specialists.psychologist).length,
      color: '#FFBB28'
    },
    {
      name: 'Социальный педагог',
      value: conclusionAnalysis.filter(c => c?.specialists.socialWorker).length,
      color: '#FF8042'
    },
    {
      name: 'Направление в ЦПМПК',
      value: conclusionAnalysis.filter(c => c?.specialists.needsCPMPK).length,
      color: '#8884D8'
    }
  ].filter(item => item.value > 0);

  // Анализ рекомендаций
  const recommendationCounts = conclusionAnalysis.reduce((acc, analysis) => {
    if (analysis?.recommendations) {
      analysis.recommendations.forEach(rec => {
        const key = rec.substring(0, 50) + '...'; // Сокращаем для отображения
        acc[key] = (acc[key] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const topRecommendations = Object.entries(recommendationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([rec, count]) => ({ name: rec, value: count }));
  return <div className="space-y-6">
      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label></Label>
              <OrganizationSelector value={eduOrgFilter} onChange={setEduOrgFilter} placeholder="Поиск и выбор организации..." />
            </div>
            
            <div>
              <Label>Округ</Label>
              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите округ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все округа</SelectItem>
                  {districts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Уровень образования</Label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите уровень" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все уровни</SelectItem>
                  <SelectItem value="preschool">Дошкольное</SelectItem>
                  <SelectItem value="elementary">Начальное</SelectItem>
                  <SelectItem value="middle">Основное</SelectItem>
                  <SelectItem value="high">Среднее</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Тип ППк</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="primary">Первичный</SelectItem>
                  <SelectItem value="secondary">Вторичный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Параллель</Label>
              <Select value={parallelFilter} onValueChange={setParallelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите параллель" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все параллели</SelectItem>
                  {/* Классы общего образования */}
                  {Array.from({
                  length: 11
                }, (_, i) => i + 1).map(num => <SelectItem key={`class-${num}`} value={num.toString()}>{num} класс</SelectItem>)}
                  {/* Группы дошкольного образования */}
                  <SelectItem value="младшая">Младшая группа</SelectItem>
                  <SelectItem value="средняя">Средняя группа</SelectItem>
                  <SelectItem value="старшая">Старшая группа</SelectItem>
                  <SelectItem value="подготовительная">Подготовительная группа</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Причина</Label>
              <Input placeholder="Поиск по причине..." value={reasonFilter} onChange={e => setReasonFilter(e.target.value)} />
            </div>

            <div>
              <Label>Дата от</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd.MM.yyyy", {
                    locale: ru
                  }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ru} />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Дата до</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd.MM.yyyy", {
                    locale: ru
                  }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ru} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button onClick={resetFilters} variant="outline">
                Сбросить фильтры
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Показано протоколов: {filteredProtocols.length} из {protocols.length}
          </div>
        </CardContent>
      </Card>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{filteredProtocols.length}</div>
            <p className="text-muted-foreground">Всего протоколов</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-success">
              {filteredProtocols.filter(p => p.status === 'completed').length}
            </div>
            <p className="text-muted-foreground">Завершено</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-warning">
              {filteredProtocols.filter(p => p.status === 'draft').length}
            </div>
            <p className="text-muted-foreground">В работе</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {Math.round(filteredProtocols.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / filteredProtocols.length || 0)}%
            </div>
            <p className="text-muted-foreground">Средняя готовность</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-primary">
              {conclusionAnalysis.length}
            </div>
            <p className="text-muted-foreground">С заключениями</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-secondary">
              {conclusionAnalysis.filter(c => c?.specialists.needsCPMPK).length}
            </div>
            <p className="text-muted-foreground">Направлений в ЦПМПК</p>
          </CardContent>
        </Card>
      </div>

      {/* Круговые диаграммы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              Статус протоколов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({
                name,
                value
              }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              Уровни образования
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={levelData} cx="50%" cy="50%" labelLine={false} label={({
                name,
                value
              }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {levelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              Типы консультаций
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" labelLine={false} label={({
                name,
                value
              }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              Причины обращений
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={reasonData} cx="50%" cy="50%" labelLine={false} label={({
                name,
                value
              }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {reasonData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Анализ заключений и рекомендаций */}
      {conclusionAnalysis.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Анализ заключений и рекомендаций
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Группы помощи */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Группы помощи</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={groupData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {groupData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Специалисты */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Рекомендованные специалисты</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={specialistData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Топ рекомендации */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Частые рекомендации</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {topRecommendations.map((rec, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm truncate flex-1">{rec.name}</span>
                        <Badge variant="secondary">{rec.value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Детальный список заключений */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Детальный анализ заключений
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {conclusionAnalysis.slice(0, 20).map((analysis, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{analysis?.childName}</h4>
                      <Badge 
                        variant={
                          analysis?.overallGroup.group === 1 ? "default" :
                          analysis?.overallGroup.group === 2 ? "secondary" : "destructive"
                        }
                      >
                        {analysis?.overallGroup.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Специалисты:</strong> {
                        Object.entries(analysis?.specialists || {})
                          .filter(([key, value]) => value && key !== 'needsCPMPK')
                          .map(([key]) => {
                            switch(key) {
                              case 'teacher': return 'Учитель';
                              case 'speechTherapist': return 'Логопед';
                              case 'psychologist': return 'Психолог';
                              case 'socialWorker': return 'Социальный педагог';
                              default: return key;
                            }
                          })
                          .join(', ') || 'Не требуется'
                      }
                      {analysis?.specialists.needsCPMPK && (
                        <Badge variant="outline" className="ml-2">ЦПМПК</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm">
                      <strong>Рекомендации:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {analysis?.recommendations.slice(0, 3).map((rec, i) => (
                          <li key={i} className="text-muted-foreground">{rec}</li>
                        ))}
                        {analysis?.recommendations.length > 3 && (
                          <li className="text-muted-foreground italic">
                            +{analysis.recommendations.length - 3} ещё...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
                {conclusionAnalysis.length > 20 && (
                  <div className="text-center text-muted-foreground">
                    Показано 20 из {conclusionAnalysis.length} заключений
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Столбчатая диаграмма по округам */}
      {districtData.length > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Распределение по округам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={districtData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>}
    </div>;
};