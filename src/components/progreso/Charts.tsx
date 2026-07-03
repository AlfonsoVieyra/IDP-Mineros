"use client";

import { ObjetivoIDP } from '@/types/database';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// Componente personalizado para el Tooltip de la Evolución de Rendimiento
const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 shadow-2xl text-white text-xs space-y-1.5 max-w-[280px]">
        <p className="font-bold text-gray-400">{label} ({data.fecha})</p>
        <p className="text-sm font-semibold flex items-center gap-1.5 text-primary-400">
          Nota: <span className="font-extrabold text-white text-base">{data.nota} / 5</span>
        </p>
        {data.objetivo && (
          <p className="text-gray-300 leading-relaxed">
            <span className="font-bold text-gray-400">Objetivo:</span> {data.objetivo}
          </p>
        )}
        {data.tipo && (
          <p className="text-gray-300 capitalize">
            <span className="font-bold text-gray-400">Tipo:</span> {data.tipo}
          </p>
        )}
      </div>
    );
  }
  return null;
};

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
        fecha: new Date(obj.updated_at).toLocaleDateString(),
        objetivo: obj.titulo,
        tipo: obj.categoria
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
               fecha: ev.fecha,
               objetivo: obj.titulo,
               tipo: obj.categoria
             });
             evalCounter++;
          });
        }
      } catch (e) {}
    }
  });
  // 3. Datos para Radar Chart: Sumatoria de Tareas Completadas por Categoría (Área de Progresión)
  const catTasks: Record<string, number> = {
    'tecnica': 0,
    'tactica': 0,
    'fisica': 0,
    'deportiva': 0
  };
  
  objectives.forEach(obj => {
    const cat = obj.categoria?.toLowerCase() || 'deportiva';
    if (catTasks[cat] !== undefined && obj.tareas_desarrollo) {
      try {
        const tareas = typeof obj.tareas_desarrollo === 'string' 
          ? JSON.parse(obj.tareas_desarrollo) 
          : obj.tareas_desarrollo;
          
        if (Array.isArray(tareas)) {
          const completedCount = tareas.filter(t => t.completed).length;
          catTasks[cat] += completedCount;
        }
      } catch (e) {}
    }
  });

  const maxCompleted = Math.max(catTasks.tecnica, catTasks.tactica, catTasks.fisica, catTasks.deportiva);
  
  // Generar ticks y max de dominio limpios y proporcionales
  let ticks: number[] = [];
  let radarDomainMax = 6;
  
  if (maxCompleted <= 6) {
    ticks = [2, 4, 6];
    radarDomainMax = 6;
  } else {
    // Redondear al siguiente múltiplo de 3 para mantener simetría
    radarDomainMax = Math.ceil(maxCompleted / 3) * 3;
    const step = Math.ceil(radarDomainMax / 3);
    for (let i = step; i <= radarDomainMax; i += step) {
      ticks.push(i);
    }
  }

  const radarData = [
    { subject: 'Técnica', A: catTasks.tecnica },
    { subject: 'Táctica', A: catTasks.tactica },
    { subject: 'Física', A: catTasks.fisica },
    { subject: 'Mental/Deportiva', A: catTasks.deportiva },
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

      {/* 2. Radar Chart: Área de Progresión */}
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-5 shadow-sm col-span-1">
        <h3 className="font-bold uppercase text-gray-800 dark:text-gray-200 mb-2 text-sm tracking-wide">
          Área de Progresión
        </h3>
        <div className="h-[250px] w-full -mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#475569" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, radarDomainMax]} 
                ticks={ticks}
                tickFormatter={(val) => Math.round(val).toString()} 
                axisLine={false} 
                tick={{ fill: '#64748b', fontSize: 9 }} 
              />
              <Radar name="Tareas Completadas" dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.4} />
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
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="eval" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis 
                  domain={[0, 5]} 
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{fill: '#888', fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Line type="monotone" dataKey="nota" name="Nota Evaluación" stroke="#d44063" strokeWidth={3} dot={{ r: 4, fill: '#d44063', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm space-y-2 text-center p-4">
              <span className="text-gray-400 dark:text-gray-500 font-semibold">📉 Sin evaluaciones registradas aún</span>
              <span className="text-xs text-gray-500 max-w-xs opacity-75">Las calificaciones e historial de progreso aparecerán aquí conforme el cuerpo técnico evalúe tus metas.</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
