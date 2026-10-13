import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useTheme } from "../../contexts/ThemeContext";

const UserChart: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const options: Highcharts.Options = {
    chart: {
      type: "column",
      backgroundColor: "transparent",
    },
    title: {
      text: "Oylik Foydalanuvchilar Statistikasi",
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        color: isDark ? "#ffffff" : "#1f2937",
      },
      align: "left",
    },
    xAxis: {
      categories: [
        "Yan",
        "Fev",
        "Mar",
        "Apr",
        "May",
        "Iyun",
        "Iyul",
        "Avg",
        "Sep",
        "Okt",
        "Nov",
        "Dek",
      ],
      labels: {
        style: { fontSize: "13px", color: isDark ? "#E5E7EB" : "#4B5563" },
      },
    },
    yAxis: {
      visible: false,
      title: { text: "" },
    },
    plotOptions: {
      column: {
        borderRadius: 10,
        pointWidth: 50,
        dataLabels: {
          enabled: true,
          inside: false,
          style: {
            fontWeight: "bold",
            fontSize: "12px",
          },
        },
      },
      series: {
        states: {
          inactive: {
            opacity: 1,
          },
        },
      },
    },
    series: [
      {
        name: "Foydalanuvchilar",
        type: "column",
        data: [120, 80, 150, 140, 150, 150, 130, 100, 150, 145, 150, 150],
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "#6EC1FF"],
            [1, "#2F80ED"],
          ],
        },
      },
    ],
    credits: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default UserChart;
