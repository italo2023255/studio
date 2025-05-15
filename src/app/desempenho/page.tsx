
'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getHistory } from '@/lib/localStorage';
import type { IAnsweredQuestion, SubjectPerformance } from '@/types';
import { ListChecks, AlertTriangle, BarChart3, CheckCircle, XCircle, Smile, Meh, Frown } from 'lucide-react';
import { ClientOnly } from '@/components/ClientOnly';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PerformancePage() {
  const [history, setHistory] = useState<IAnsweredQuestion[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setHistory(getHistory());
  }, []);

  const performanceData = useMemo(() => {
    if (!history.length) return { overall: null, bySubject: [] };

    let totalCorrect = 0;
    let totalIncorrect = 0;
    const subjectMap: Record<string, { correct: number; incorrect: number; total: number }> = {};

    history.forEach(item => {
      if (item.isCorrect === true) {
        totalCorrect++;
      } else if (item.isCorrect === false) {
        totalIncorrect++;
      }

      const subject = item.subject || 'Não Especificada';
      if (!subjectMap[subject]) {
        subjectMap[subject] = { correct: 0, incorrect: 0, total: 0 };
      }
      if (item.isCorrect === true) {
        subjectMap[subject].correct++;
      } else if (item.isCorrect === false) {
        subjectMap[subject].incorrect++;
      }
      subjectMap[subject].total++;
    });

    const totalAnswered = totalCorrect + totalIncorrect;
    const overallPerformance = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

    const bySubject: SubjectPerformance[] = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      correct: data.correct,
      incorrect: data.incorrect,
      total: data.total,
      percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    })).sort((a,b) => b.total - a.total); // Sort by total questions for better chart display

    return {
      overall: {
        correct: totalCorrect,
        incorrect: totalIncorrect,
        totalAnswered: totalAnswered,
        percentage: overallPerformance,
      },
      bySubject,
    };
  }, [history]);

  const areasOfFocus = useMemo(() => {
    return performanceData.bySubject
      .filter(s => s.percentage < 70 && s.total >= 3) // Example threshold: <70% correct and at least 3 questions
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5); // Show top 5 areas to focus on
  }, [performanceData.bySubject]);

  const chartData = useMemo(() => {
    return performanceData.bySubject.map(s => ({
      name: s.subject.length > 15 ? `${s.subject.substring(0,12)}...` : s.subject, // Shorten long names for chart
      Acertos: s.correct,
      Erros: s.incorrect,
      perc: s.percentage.toFixed(0)
    }));
  }, [performanceData.bySubject]);


  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <BarChart3 className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-4 text-xl text-muted-foreground">Carregando dados de desempenho...</p>
      </div>
    );
  }
  
  if (history.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="text-primary" /> Desempenho
          </CardTitle>
          <CardDescription>Acompanhe seu progresso e identifique áreas para melhorar.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
            <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">Nenhum dado de desempenho ainda.</p>
            <p className="text-sm text-muted-foreground">Responda algumas questões para ver suas estatísticas aqui.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ClientOnly>
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="text-primary" /> Desempenho Geral
          </CardTitle>
          <CardDescription>Visão geral do seu progresso nas questões respondidas.</CardDescription>
        </CardHeader>
        <CardContent>
          {performanceData.overall ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <Card className="bg-muted/30 p-4">
                <CardTitle className="text-4xl font-bold text-green-600">{performanceData.overall.correct}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4 text-green-500"/>Acertos</CardDescription>
              </Card>
              <Card className="bg-muted/30 p-4">
                <CardTitle className="text-4xl font-bold text-red-600">{performanceData.overall.incorrect}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1"><XCircle className="h-4 w-4 text-red-500"/>Erros</CardDescription>
              </Card>
              <Card className="bg-muted/30 p-4">
                <CardTitle className="text-4xl font-bold text-primary">
                  {performanceData.overall.percentage.toFixed(1)}%
                </CardTitle>
                <CardDescription>Percentual de Acerto</CardDescription>
              </Card>
            </div>
          ) : (
             <p className="text-muted-foreground">Nenhuma questão respondida ainda.</p>
          )}
        </CardContent>
      </Card>

      {performanceData.bySubject.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">Desempenho por Matéria</CardTitle>
             <CardDescription>Visualize seus acertos e erros em cada matéria.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={70} style={{ fontSize: '0.8rem' }}/>
                <YAxis allowDecimals={false} />
                <Tooltip 
                  formatter={(value, name, props) => [`${value} (${props.payload.perc}%)`, name]}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Legend wrapperStyle={{paddingTop: '20px'}}/>
                <Bar dataKey="Acertos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                   <LabelList dataKey="Acertos" position="top" style={{ fill: 'hsl(var(--primary-foreground))', fontSize: '0.75rem' }} className="font-semibold"/>
                </Bar>
                <Bar dataKey="Erros" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]}>
                   <LabelList dataKey="Erros" position="top" style={{ fill: 'hsl(var(--destructive-foreground))', fontSize: '0.75rem' }} className="font-semibold"/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {areasOfFocus.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><AlertTriangle className="text-orange-500"/> Áreas de Foco</CardTitle>
            <CardDescription>Matérias onde seu desempenho está abaixo de 70% e você respondeu pelo menos 3 questões. Considere revisá-las!</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {areasOfFocus.map(area => (
                <li key={area.subject} className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
                  <div>
                    <span className="font-semibold">{area.subject}</span>
                    <p className="text-sm text-muted-foreground">
                      {area.correct} de {area.total} acertos ({area.percentage.toFixed(1)}%)
                    </p>
                  </div>
                  {area.percentage < 50 ? <Frown className="h-6 w-6 text-red-500"/> : <Meh className="h-6 w-6 text-yellow-500"/>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
       {performanceData.overall && performanceData.overall.totalAnswered > 0 && areasOfFocus.length === 0 && performanceData.bySubject.every(s => s.percentage >=70 || s.total <3) && (
         <Alert variant="default" className="bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300">
            <Smile className="h-5 w-5 text-current" />
            <Alert.Title className="font-semibold text-current">Parabéns!</Alert.Title>
            <AlertDescription className="text-current">
              Seu desempenho está ótimo em todas as matérias com um volume significativo de questões respondidas. Continue assim!
            </AlertDescription>
          </Alert>
       )}
    </div>
    </ClientOnly>
  );
}
