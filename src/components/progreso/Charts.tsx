"use client";

import { ObjetivoIDP } from '@/types/database';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface ChartsProps {
  objectives: ObjetivoIDP[];
}

export default function Charts({ objectives }: ChartsProps) {
  // --- Procesamiento de Datos ---

  // 1. Datos para gráfico de barras: Progreso de tareas por objetivo (0-100%)
  const barData = objectives.map(obj => {
    let total = 0;
    let completed = 0;
    
    if (obj.tareas_desarrollo) {
      try {
        const tareas = typeof obj.tareas_desarrollo === 'string' 
          ? JSON.parse(obj.tareas_desarrollo) 
          : obj.tareas_desarrollo;
          
        if (Array.isArray(tareas)) {
          total = tareas.length;
          completed = tareas.filter(t => t.completed).length;
        }
      } catch (e) {}
    }
    
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      name: obj.titulo.length > 18 ? obj.titulo.substring(0, 18) + '...' : obj.titulo,
      'Completado': pct,
      'Pendiente': 100 - pct,
      total
    };
  }); // Mostrar todos los objetivos del más reciente al más antiguo

  // 2. Datos para gráfico de líneas: Evolución histórica de evaluaciones
  // Si no hay array de evaluaciones, usamos una simulación o extraemos de nota_evaluacion
  let lineData: any[] = [];
  let evalCounter = 1;
  objectives.slice().reverse().forEach(obj => {
    if (obj.nota_evaluacion) {
      lineData.push({
        eval: `Ev ${evalCounter}`,
        nota: obj.nota_evaluacion,
        fecha: new Date(obj.updated_at).toLocaleDateString()
      });
      evalCounter++;
    }
    
    if (obj.historial_evaluaciones) {
      try {
        const h = typeof obj.historial_evaluaciones === 'string' ? JSON.parse(obj.historial_evaluaciones) : obj.historial_evaluaciones;
        if (Array.isArray(h)) {
          h.forEach((ev: any) => {
             lineData.push({
               eval: `Ev ${evalCounter}`,
               nota: ev.nota || ev.estrellas,
               fecha: ev.fecha
             });
             evalCounter++;
          });
        }
      } catch (e) {}
    }
  });
  
  if (lineData.length === 0) {
    // Datos mock si no hay
    lineData = [
      { eval: 'Ev 1', nota: 2, fecha: '10/1/2026' },
      { eval: 'Ev 2', nota: 3, fecha: '15/2/2026' },
      { eval: 'Ev 3', nota: 4, fecha: '20/3/2026' }
    ];
  }

  // 3. Datos para Radar Chart: Competencias por Categoría
  const catScores: Record<string, { total: number, count: number }> = {
    'tecnica': { total: 0, count: 0 },
    'tactica': { total: 0, count: 0 },
    'fisica': { total: 0, count: 0 },
    'deportiva': { total: 0, count: 0 }
  };
  
  objectives.forEach(obj => {
    const cat = obj.categoria?.toLowerCase() || 'deportiva';
    if (catScores[cat] !== undefined) {
      catScores[cat].total += (obj.nota_evaluacion || 2); // default to 2 if missing
      catScores[cat].count += 1;
    }
  });

  const radarData = [
    { subject: 'Técnica', A: catScores.tecnica.count > 0 ? (catScores.tecnica.total / catScores.tecnica.count) * 20 : 60 },
    { subject: 'Táctica', A: catScores.tactica.count > 0 ? (catScores.tactica.total / catScores.tactica.count) * 20 : 70 },
    { subject: 'Física', A: catScores.fisica.count > 0 ? (catScores.fisica.total / catScores.fisica.count) * 20 : 85 },
    { subject: 'Mental/Deportiva', A: catScores.deportiva.count > 0 ? (catScores.deportiva.total / catScores.deportiva.count) * 20 : 50 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Bar Chart: Progreso de Tareas */}
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-5 shadow-sm col-span-1 lg:col-span-2">
        <h3 className="font-bold uppercase text-gray-800 dark:text-gray-200 mb-6 text-sm tracking-wide">
          Desarrollo de Objetivos (Tareas)
        </h3>
        <div className="h-[250px] w-full">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={barData} 
                margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  ticks={[100]}
                  tickFormatter={(val) => val === 100 ? "Meta" : ""}
                  tick={{fill: '#888', fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{fill: '#888', fontSize: 11}} 
                  axisLine={false} 
                  tickLine={false} 
                  width={110}
                />
                <Tooltip 
                  formatter={(value: any) => `${value}%`}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Completado" name="Avance" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Pendiente" legendType="none" stackId="a" fill="#1c2136" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No hay objetivos registrados.
            </div>
          )}
        </div>
      </div>

      {/* 2. Radar Chart: Mapeo Funcional */}
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-5 shadow-sm col-span-1">
        <h3 className="font-bold uppercase text-gray-800 dark:text-gray-200 mb-2 text-sm tracking-wide">
          Mapeo Funcional
        </h3>
        <div className="h-[250px] w-full -mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#475569" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Promedio" dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.4} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Line Chart: Evolución Histórica */}
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-5 shadow-sm col-span-1 lg:col-span-3">
        <h3 className="font-bold uppercase text-gray-800 dark:text-gray-200 mb-6 text-sm tracking-wide">
          Evolución del Rendimiento
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="eval" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="nota" name="Nota Evaluación" stroke="#d44063" strokeWidth={3} dot={{ r: 4, fill: '#d44063', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
