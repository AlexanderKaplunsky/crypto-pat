import { useMemo } from 'react';
import styles from './Sparkline.module.css';

interface SparklineProps {
  data: number[]; // Array of price values (last 10 points)
  width?: number;
  height?: number;
  color?: 'green' | 'red' | 'gray';
}

export const Sparkline = ({ 
  data, 
  width = 80, 
  height = 20,
  color = 'gray'
}: SparklineProps) => {
  // Filter out invalid data points
  const validData = useMemo(() => {
    return data.filter((point): point is number => 
      typeof point === 'number' && !isNaN(point) && isFinite(point)
    );
  }, [data]);

  // Calculate path and viewBox (must be called before early returns)
  const pathCalculation = useMemo(() => {
    // Need at least 3 points to draw a meaningful line
    if (validData.length < 3) {
      return null;
    }

    const points = validData;
    const minValue = Math.min(...points);
    const maxValue = Math.max(...points);
    const range = maxValue - minValue || 1; // Avoid division by zero

    // Normalize points to 0-1 range
    const normalized = points.map(p => (p - minValue) / range);

    // Generate SVG path
    const stepX = width / (points.length - 1);
    const pathData = normalized
      .map((y, i) => {
        const x = i * stepX;
        const yPos = height - (y * height);
        return `${i === 0 ? 'M' : 'L'} ${x} ${yPos}`;
      })
      .join(' ');

    return {
      path: pathData,
      viewBox: `0 0 ${width} ${height}`,
      min: minValue,
      max: maxValue,
    };
  }, [validData, width, height]);

  // Need at least 3 points to draw a meaningful line
  if (!pathCalculation) {
    return (
      <div 
        className={styles.placeholder}
        style={{ width, height }}
        title="Insufficient data for sparkline"
      >
        <span className={styles.placeholderText}>--</span>
      </div>
    );
  }

  const { path, viewBox, min, max } = pathCalculation;

  const colorClass = styles[color] || styles.gray;
  const tooltipText = `Price range: $${min.toFixed(2)} - $${max.toFixed(2)}`;

  return (
    <div 
      className={styles.container} 
      title={tooltipText}
    >
      <svg
        width={width}
        height={height}
        viewBox={viewBox}
        className={styles.svg}
        aria-label="Price history sparkline"
      >
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={colorClass}
        />
      </svg>
    </div>
  );
};

