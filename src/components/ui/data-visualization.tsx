import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';
import './data-visualization.css'; // Import the external CSS file

// Types for the data visualization components
interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

// Base chart props without height and animationDuration
interface BaseChartProps {
  data: DataPoint[];
  title?: string;
  description?: string;
  className?: string;
  showValues?: boolean;
  // Removed deprecated showLegend prop
}

// Extended props for charts that support height
interface ChartWithDimensionsProps extends BaseChartProps {
  height?: number;
  // Removed unused animationDuration prop
}

// Color palette from our design guide
const defaultColors = [
  'hsl(196,80%,43%)', // Primary blue
  'hsl(142,71%,45%)', // Success green
  'hsl(263,85%,50%)', // Purple
  'hsl(32,95%,44%)',  // Warning orange
  'hsl(354,70%,54%)', // Danger red
  'hsl(220,14%,46%)', // Muted
];

// Color class mapping for pie chart
const getColorClass = (color: string | undefined, index: number): string => {
  if (!color) {
    // Use standard color wheel based on index
    return `color-${(index % 10) + 1}`;
  }
  
  // Try to match with our design system colors
  const colorMap: Record<string, string> = {
    'hsl(196,80%,43%)': 'color-primary',
    'hsl(142,71%,45%)': 'color-success',
    'hsl(263,85%,50%)': 'color-purple',
    'hsl(32,95%,44%)': 'color-warning',
    'hsl(354,70%,54%)': 'color-danger',
    'hsl(220,14%,46%)': 'color-muted',
  };
  
  return colorMap[color] || `color-${(index % 10) + 1}`;
};

// Helper to format numbers with k, m, b suffixes
const formatNumber = (num: number): string => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'b';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

// Bar Chart Component
// Helper function to get the appropriate height class
const getHeightClass = (height: number): string => {
  if (height <= 200) return 'bar-chart-height-200';
  if (height <= 300) return 'bar-chart-height-300';
  if (height <= 400) return 'bar-chart-height-400';
  return 'bar-chart-height-500';
};

interface BarChartProps extends ChartWithDimensionsProps {
  showValues?: boolean;
}

export const BarChart = ({
  data,
  title,
  description,
  height = 300,
  className,
  showValues = true,
}: BarChartProps) => {
  const heightClass = getHeightClass(height);
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <Card className={cn("p-4", className)}>
      {title && <h3 className="text-lg font-medium text-foreground">{title}</h3>}
      {description && (
        <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
      )}
      
      <div className={cn(
        "relative mt-6 bar-chart-container transition-all duration-700 ease-in-out",
        heightClass,
        className
      )}>
        <div className="flex items-end justify-between h-full gap-2">
          {data.map((item) => {
            const barHeight = (item.value / maxValue) * 100;
            const barColor = item.color ?? defaultColors[data.indexOf(item) % defaultColors.length];
            
            return (
              <div key={`${item.label}-${item.value}`} className="flex flex-col items-center flex-1">
                <div className="relative w-full flex justify-center">
                  <div 
                    className="bar"
                    data-bar-height={barHeight}
                    data-bar-color={barColor}
                  />
                  {showValues && (
                    <div className="absolute -top-6 text-xs text-muted-foreground">
                      {formatNumber(item.value)}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground whitespace-nowrap text-center overflow-hidden text-ellipsis max-w-[60px]">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend removed - use a dedicated legend component if needed */}
    </Card>
  );
};

// Pie Chart Component
interface Slice extends DataPoint {
  path: string;
  color: string;
  startAngle: number;
  endAngle: number;
  percentage: number;
}

interface PieChartProps extends BaseChartProps {
  showValues?: boolean;
}

export const PieChart = ({
  data,
  title,
  description,
  className,
  showValues = true,
}: PieChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let currentAngle = 0;
  const slices: Slice[] = data.map((item, index) => {
    const startAngle = currentAngle;
    const sliceAngle = (item.value / total) * 360;
    const endAngle = startAngle + sliceAngle;
    const largeArcFlag = sliceAngle <= 180 ? 0 : 1;
    
    // Calculate the path for this slice
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    const radius = 50;
    const centerX = 50;
    const centerY = 50;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const path = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    const color = defaultColors[index % defaultColors.length];
    
    currentAngle = endAngle;
    
    return {
      ...item,
      path,
      color,
      startAngle,
      endAngle,
      percentage: (item.value / total) * 100
    };
  });
  
  return (
    <Card className={cn("p-4", className)}>
      {title && (
        <h3 className="text-lg font-medium text-[hsl(206,33%,16%)]">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-[hsl(220,14%,46%)] mt-1 mb-4">{description}</p>
      )}
      
      <div className="relative mt-6 flex justify-center pie-chart-container">
        <div className="pie-chart-svg-container">
          <svg viewBox="0 0 100 100" className="pie-chart-svg">
            {slices.map((slice) => (
              <path
                key={`slice-${slice.label}-${slice.value}`}
                d={slice.path}
                fill={slice.color}
                stroke="var(--background)"
                strokeWidth="0.5"
                className="pie-slice"
                data-slice-color={slice.color}
              >
                <title>{`${slice.label}: ${slice.value} (${slice.percentage.toFixed(1)}%)`}</title>
              </path>
            ))}
          </svg>
          
          {showValues && (
            <div className="pie-chart-center">
              <div className="text-center">
                <div className="pie-chart-total">{formatNumber(total)}</div>
                <div className="pie-chart-label">Total</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Legend section */}
        <div className="mt-6 flex flex-wrap gap-4">
          {slices.map((slice) => (
            <div key={`${slice.label}-${slice.value}`} className="pie-legend-item">
              <div 
                className={`pie-legend-dot ${getColorClass(slice.color, data.indexOf(slice))}`}
                aria-hidden="true"
              />
              <span className="pie-legend-label">
                {slice.label} ({slice.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Line Chart Component
interface LineChartProps extends BaseChartProps {
  showValues?: boolean;
}

export const LineChart = ({
  data,
  title,
  description,
  className,
  showValues = true,
}: LineChartProps) => {
  const maxValue = Math.max(...data.map(item => item.value)) * 1.1; // Add 10% padding
  
  // Create points for the path
  const chartWidth = 100;
  const chartHeight = 80;
  const pointGap = chartWidth / (data.length - 1 || 1);
  
  const points = data.map((item, index) => {
    const x = index * pointGap;
    const y = chartHeight - (item.value / maxValue) * chartHeight;
    return { x, y, value: item.value, label: item.label };
  });
  
  // Create the path string
  let pathD = `M ${points[0]?.x || 0} ${points[0]?.y || 0}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }
  
  return (
    <Card className={cn("p-4", className)}>
      {title && (
        <h3 className="text-lg font-medium text-[hsl(206,33%,16%)]">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-[hsl(220,14%,46%)] mt-1 mb-4">{description}</p>
      )}
      
      <div className="relative mt-6 line-chart-container">
        <div className="pie-chart-svg-container">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = chartHeight - ratio * chartHeight;
              return (
                <line 
                  key={`grid-line-${ratio}`}
                  x1="0" 
                  y1={y} 
                  x2={chartWidth} 
                  y2={y} 
                  stroke="hsl(215,16%,90%)" 
                  strokeWidth="0.5"
                  strokeDasharray={i > 0 ? "2 2" : ""}
                />
              );
            })}
            
            {/* Line path */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(196,80%,43%)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000"
            />
            
            {/* Data points */}
            {points.map((point) => (
              <circle
                key={`point-${point.label}-${point.value}`}
                cx={point.x}
                cy={point.y}
                r="2"
                fill="white"
                stroke="hsl(196,80%,43%)"
                strokeWidth="1.5"
                className="transition-all duration-1000"
              >
                <title>{`${point.label}: ${point.value}`}</title>
              </circle>
            ))}
            
            {/* Area under the line */}
            <path
              d={`${pathD} L ${points[points.length - 1]?.x || 0} ${chartHeight} L ${points[0]?.x || 0} ${chartHeight} Z`}
              fill="hsl(196,80%,10%)"
              fillOpacity="0.1"
              className="transition-all duration-1000"
            />
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {data.map((item, index) => (
            <div key={`label-${item.label}-${index}`} className="text-xs text-[hsl(220,14%,46%)] text-center">
              {item.label}
            </div>
          ))}
        </div>
        
        {showValues && (
          <div className="flex justify-between mt-4">
            {[0, Math.floor(maxValue * 0.25), Math.floor(maxValue * 0.5), Math.floor(maxValue * 0.75), Math.floor(maxValue)].map((value) => (
              <div key={`value-label-${value}`} className="text-xs text-[hsl(220,14%,46%)]">
                {formatNumber(value)}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
  description?: string;
  formatter?: (value: number | string) => string;
}

export const StatsCard = ({
  title,
  value,
  change,
  icon,
  className,
  description,
  formatter = (val) => (typeof val === 'number' ? formatNumber(val) : val.toString()),
}: StatsCardProps) => {
  return (
    <Card className={cn("stats-card", className)}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="stats-card-title">{title}</h3>
          <div className="stats-card-value">
            {formatter(value)}
          </div>
          {change !== undefined && (
            <div className={cn(
              "stats-card-change",
              change >= 0 ? "positive" : "negative"
            )}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last period
            </div>
          )}
          {description && (
            <p className="stats-card-description">{description}</p>
          )}
        </div>
        {icon && (
          <div className="stats-card-icon">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export type { DataPoint };
