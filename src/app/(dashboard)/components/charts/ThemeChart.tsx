'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ThemeChartProps {
  data: { name: string; count: number }[];
  activeTheme?: string | null;
  onThemeClick?: (theme: string) => void;
}

export function ThemeChart({ data, activeTheme, onThemeClick }: ThemeChartProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm h-[300px] flex flex-col">
      <h3 className="text-white font-semibold mb-4 tracking-tight">Top Themes</h3>
      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 30, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
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
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              barSize={20}
              animationDuration={1500}
              onClick={(data: any) => data?.name && onThemeClick?.(data.name)}
              className={onThemeClick ? 'cursor-pointer transition-colors' : ''}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    activeTheme === entry.name
                      ? '#a8a29e' /* distinct visual for active */
                      : '#6366f1'
                  }
                  className={
                    activeTheme === entry.name
                      ? 'opacity-100'
                      : activeTheme
                        ? 'opacity-50'
                        : 'opacity-100'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
