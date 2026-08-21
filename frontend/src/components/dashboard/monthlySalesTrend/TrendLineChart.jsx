import React from "react";
import { formatCurrency } from "../../../utils/currency";

const TrendLineChart = ({
  data,
  maxValue,
  valueKey,
  title,
  subtitle,
  color = "#2563eb",
  height = 220,
  range = "7d",
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = height === 220 ? 30 : 20;
  const paddingBottom = 30;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = 800 - paddingLeft - paddingRight;

  // Create line path
  const createLinePath = () => {
    if (!data || data.length === 0) return { path: "", points: [] };

    const stepX = chartWidth / (data.length - 1 || 1);

    const points = data.map((point, index) => {
      const x = paddingLeft + index * stepX;
      const value = Number(point[valueKey] || 0);
      const ratio = value / maxValue;
      const y =
        paddingTop + chartHeight - (isNaN(ratio) ? 0 : ratio) * chartHeight;
      return { x, y, value };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return { path, points };
  };

  const lineData = createLinePath();
  const ticks = 5;

  // Format label based on range
  const formatLabel = (label) => {
    if (range === "7d" || range === "30d") {
      const parts = label.split(/[\s-]/);
      return parts[parts.length - 1]; // Get the last part (day)
    }
    return label;
  };

  // Format value for tooltip
  const formatValue = (value) => {
    if (valueKey === "totalSales") {
      return formatCurrency(value, currencySymbol, currencyPosition);
    }
    return `${value} invoices`;
  };

  return (
    <div className="bg-white border border-border-light rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h4 className="text-sm sm:text-base font-medium text-text-secondary">
            {title}
          </h4>
          <p className="text-[11px] sm:text-xs text-text-tertiary">
            {subtitle}
          </p>
        </div>
        {data && data.length > 0 && (
          <p className="text-[11px] sm:text-xs text-text-tertiary">
            {data.length} point{data.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="-mx-2 sm:mx-0 overflow-x-auto">
        <div className="min-w-[560px]">
          <svg
            viewBox={`0 0 800 ${height}`}
            className={height === 220 ? "w-full h-52" : "w-full h-40"}
          >
            {/* Y-axis & grid */}
            {Array.from({ length: ticks + 1 }).map((_, i) => {
              const ratio = i / ticks;
              const y = paddingTop + chartHeight - ratio * chartHeight;
              const value =
                valueKey === "totalSales"
                  ? Math.round(maxValue * ratio).toLocaleString()
                  : Math.round(maxValue * ratio);

              return (
                <g key={i}>
                  {/* Horizontal grid line */}
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={paddingLeft + chartWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  {/* Y-axis label */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="end"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* Y-axis line */}
            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={paddingTop + chartHeight}
              stroke="#9ca3af"
              strokeWidth="1.5"
            />

            {/* X-axis line */}
            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight}
              x2={paddingLeft + chartWidth}
              y2={paddingTop + chartHeight}
              stroke="#9ca3af"
              strokeWidth="1.5"
            />

            {/* Line Path */}
            <path
              d={lineData.path}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {lineData.points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                >
                  <title>
                    {data[index].month}: {formatValue(point.value)}
                  </title>
                </circle>
              </g>
            ))}

            {/* X-axis labels */}
            {data.map((d, index) => {
              const x =
                paddingLeft + (chartWidth * index) / (data.length - 1 || 1);
              const label = formatLabel(d.month);

              return (
                <text
                  key={index}
                  x={x}
                  y={paddingTop + chartHeight + 16}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {label}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TrendLineChart;
