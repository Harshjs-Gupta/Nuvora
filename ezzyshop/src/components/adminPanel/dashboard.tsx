import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { RechartsDevtools } from "@recharts/devtools";
import { useSession } from "next-auth/react";

// * Sample data
const data = [
  {
    name: "Apr 17",
    uv: 500,
    pv: 700,
    amt: 2400,
  },
  {
    name: "Apr 18",
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: "Apr 19",
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: "Apr 20",
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: "Apr 21",
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: "Apr 22",
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: "Apr 23",
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

interface ProductsOverviewCard {
  id: number;
  title: string;
  value: string;
  change: string;
  icon: string;
  gradient: string;
  iconBg: string;
  hoverShadow: string;
}

const productsOverviewCard: ProductsOverviewCard[] = [
  {
    id: 1,
    title: "Total Products",
    value: "120",
    change: "+ 6",
    icon: "/admin_icons/productIcon_card.svg",
    gradient: "from-[#2c64ff] to-[#baccfc]",
    iconBg: "bg-gray-100/50",
    hoverShadow: "hover:shadow-[0_0_35px_rgba(59,130,246,0.50)]",
  },
  {
    id: 2,
    title: "Total Orders",
    value: "1,452",
    change: "+ 120",
    icon: "/admin_icons/products2.svg",
    gradient: "from-[#009817] to-[#dffbe3]",
    iconBg: "bg-gray-300/50",
    hoverShadow: "hover:shadow-[0_0_35px_rgba(16,185,129,0.50)]",
  },
  {
    id: 3,
    title: "Revenue",
    value: "82,200",
    change: "+ 15%",
    icon: "/admin_icons/dollar.svg",
    gradient: "from-[#ffa600] to-[#f5e5b3]",
    iconBg: "bg-gray-200/50",
    hoverShadow: "hover:shadow-[0_0_35px_rgba(245,158,11,0.50)]",
  },
  {
    id: 4,
    title: "Low Stock",
    value: "12",
    change: "0",
    icon: "/admin_icons/warning.svg",
    gradient: "from-[#ff0000] to-[#ffb5b5]",
    iconBg: "bg-gray-300/50",
    hoverShadow: "hover:shadow-[0_0_35px_rgba(255,104,104,0.50)]",
  },
];

const salesGrowthData = [
  {
    id: 1,
    title: "Sales Growth",
    value: "18.2",
    icon: "/admin_icons/sales_growth.svg",
    gradient: "from-[#3D83FF] to-[#7aaaff]",
    cardBackground: "from-[#1d2e4d3f] to-[#1722365f]",
    hoverShadow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.50)]",
  },
  {
    id: 2,
    title: "Conversion Rate",
    value: "3.8",
    icon: "/admin_icons/conversion_rate.svg",
    gradient: "from-[#BC72FF] to-[#c998f5]",
    cardBackground: "from-[#2B25383f] to-[#211C2D4f]",
    hoverShadow: "hover:shadow-[0_0_35px_rgba(201, 152, 245,0.50)]",
  },
  {
    id: 3,
    title: "Returning Customers",
    value: "42",
    icon: "/admin_icons/user-star.svg",
    gradient: "from-[#FF803A] to-[#f5b885]",
    cardBackground: "from-[#5737263f] to-[#38261d5f]",
    hoverShadow: "hover:shadow-[0_0_35px_rgba(245, 184, 133,0.50)]",
  },
  {
    id: 4,
    title: "Average Order Value",
    value: "₹520",
    icon: "/admin_icons/hand_coins.svg",
    gradient: "from-[#00903F] to-[#b8f585]",
    cardBackground: "from-[#2033283f] to-[#18241d5f]",
    hoverShadow: "hover:shadow-[0_0_35px_rgba(184, 245, 133,0.50)]",
  },
];

export default function Dashboard() {
  const [isActive, setIsActive] = useState(0);
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "Admin";


  return (
    <section className="overflow-y-scroll px-4 sm:px-6">
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
        Welcome, {userName.split("@")[0].replace(/\d+/g, "")} !
      </h1>
      {/* * Cards for the dashboard */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* Products overview card */}
        {productsOverviewCard.map((card) => (
          <div
            key={card.id}
            className={`${card.gradient} ${card.hoverShadow} relative h-32 overflow-hidden rounded-xl border border-white/5 bg-linear-to-br p-3 text-black transition-all duration-300 hover:scale-[1.03] sm:h-36 sm:p-4`}
          >
            {/* Icon on the top left */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Image
                src={card.icon}
                alt="Products Icon"
                width={50}
                height={50}
                className="w-8 shrink-0 rounded-lg bg-gray-100/50 p-1.5 sm:w-10 sm:p-2"
              />
              {/* Title of the card */}
              <span className="text-sm leading-tight font-semibold sm:text-lg">
                {card.title}
              </span>
            </div>
            {/* Value */}
            <div className="flex flex-col sm:ml-14">
              <p className="text-3xl font-bold sm:text-4xl">{card.value}</p>
              {/* Change indicator for total products, total orders, and revenue*/}
              {card.title !== "Low Stock" && (
                <p className="flex gap-2 text-sm font-semibold sm:text-xl">
                  <span
                    className={`${card.title === "Revenue" || card.title === "Total Orders" ? "text-green-800" : "text-blue-500"} `}
                  >
                    {card.change}
                  </span>
                  <span className="text-gray-700">this week</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>  
      {/* * Sales Analysis & Performance Overview Cards */}
      <div className="mt-6 rounded-xl border border-gray-400 bg-gray-500/10 p-4">
        {/* INFO: Filtering data on basics of weeks, days, months, and years */}
        <div className="mb-4 flex items-center justify-between text-white">
          <span className="text-2xl font-bold">Sales Analysis</span>
          <div className="flex gap-2">
            {["Today", "This Week", "This Month", "This Year"].map(
              (item, index) => (
                <button
                  onClick={() => setIsActive(index)}
                  className={` ${index === isActive ? "bg-gray-500/30" : "hover:bg-gray-500/30"} cursor-pointer rounded-full px-3 py-1 text-sm font-medium`}
                  key={index}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>
        {/* * Sales graphs section */}
        <LineChart
          style={{
            width: "100%",
            maxWidth: "100%",
            height: "100%",
            maxHeight: "60vh",
            aspectRatio: 1.618,
            outline: "none",
            border: "none",
          }}
          responsive
          data={data}
          margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid vertical={false} stroke="#fff3" />
          <XAxis
            dataKey="name"
            stroke="#fff4"
            tick={{ fill: "#fff4" }}
            axisLine={false}
          />
          <YAxis
            width="auto"
            stroke="#fff4"
            tick={{ fill: "#fff4" }}
            axisLine={false}
          />
          <Tooltip
            cursor={{
              stroke: "#fff1",
            }}
            contentStyle={{
              backgroundColor: "#0000004f",
              borderColor: "#fff",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="pv"
            stroke="#00ff00"
            dot={{
              fill: "#fff",
            }}
            activeDot={{ r: 8, stroke: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="uv"
            stroke="#0000ff"
            dot={{
              fill: "#fff",
            }}
            activeDot={{ stroke: "#fff" }}
          />
          <RechartsDevtools />
        </LineChart>
        {/* * Revenue & sales numbers */}
        <div className="mt-3 grid w-auto grid-cols-2 items-center gap-2 p-2 sm:w-full sm:grid-cols-4">
          {salesGrowthData.map((card, index) => (
            <div
              key={index}
              className={`${card.cardBackground} item-center flex w-[228px] flex-col gap-3 rounded-xl border border-white/10 bg-linear-to-br p-4 shadow-lg backdrop-blur-xl transition hover:shadow-gray-500/20`}
            >
              <div className="flex gap-2">
                <Image
                  src={card.icon}
                  alt={card.title}
                  width={50}
                  height={50}
                  className="h-6 w-6"
                />
                <span className="text-base font-semibold">{card.title}</span>
              </div>
              <span
                className={`bg-linear-to-r ${card.gradient} bg-clip-text text-center text-4xl font-semibold text-transparent`}
              >
                {card.title === "Sales Growth" && "+"}
                {card.value}
                {card.title !== "Average Order Value" && "%"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
