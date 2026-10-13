import React, { createContext, useContext, useState } from "react";
import { plans } from "../data";
import { Plan } from "../types";

interface OrdersContextType {
  orders: Plan | null;
  addItem: (id: string) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<Plan | null>(
    JSON.parse(localStorage.getItem("orders")!) || null
  );

  const addItem = (id: string) => {
    const data = plans.find((item) => item.id === id) || null;
    setOrders(data);
    localStorage.setItem("orders", JSON.stringify(data));
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addItem,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrdersProvider");
  }
  return context;
};
