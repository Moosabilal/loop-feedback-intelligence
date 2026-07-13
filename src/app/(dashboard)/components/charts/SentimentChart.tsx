'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SentimentChartProps {
  data: { name: string; count: number }[];
}

const COLORS = {
  POSITIVE: '#10b981', // green-500
  NEUTRAL: '#6366f1', // indigo-500
  NEGATIVE: '#ef4444', // red-500
};

export function SentimentChart({ data }: SentimentChartProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm h-[300px] flex flex-col">
      <h3 className="text-white font-semibold mb-4 tracking-tight">Sentiment Breakdown</h3>
      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="count"
              stroke="none"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(26, 26, 58, 0.9)',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
