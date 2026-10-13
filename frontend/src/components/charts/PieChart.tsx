// components/CustomLineChart.tsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  labels: string[];
  dataPoints: number[];
  label?: string;
}

const PieChart: React.FC<Props> = ({
  labels,
  dataPoints,
  label = "My Data",
}) => {
  const data: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label,
        data: dataPoints,
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.1)", // blue-500 with opacity
        borderColor: "rgba(59, 130, 246, 1)", // blue-500
        pointBackgroundColor: "white",
        pointBorderColor: "rgba(59, 130, 246, 1)",
        tension: 0.4, // smooth line
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
      },
      legend: {
        display: false,
        labels: {
          color: "#4B5563", // gray-700
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#6B7280", // gray-500
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: "#6B7280", // gray-500
        },
        grid: {
          color: "#E5E7EB", // gray-200
        },
      },
    },
  };

  return (
    <div className="w-full h-80 pt-10">
      <Line data={data} options={options} />
    </div>
  );
};

export default PieChart;
