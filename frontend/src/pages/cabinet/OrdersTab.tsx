import { FileText, CreditCard } from "lucide-react";
import type { BookOrder, ServiceOrder } from "./types";

interface Props {
  bookOrders: BookOrder[];
  serviceOrders: ServiceOrder[];
}

/** Q-01: PersonalCabinet.tsx dan ajratilgan bo'lim. */
export default function OrdersTab({ bookOrders, serviceOrders }: Props) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Buyurtmalarim
      </h2>

      {/* Book Orders Section */}
      {bookOrders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Kitob buyurtmalari
          </h3>
          <div className="space-y-4">
            {bookOrders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                      Buyurtma #{order.id}
                    </h4>
                    <div className="flex gap-2 mt-2">
                                                        {/* Payment Status */}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === "paid"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : order.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            : order.status === "cancelled"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        }`}>
                        {order.status === "paid" ? "To'langan" :
                          order.status === "pending" ? "Kutilmoqda" :
                            order.status === "cancelled" ? "Bekor qilingan" : order.status}
                      </span>
                      {/* Delivery Status */}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.postal_status === "processing" || (!order.postal_status && order.status === "paid")
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : order.postal_status === "sent"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                            : order.postal_status === "delivered"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}>
                        {order.postal_status === "processing" ? "Tayyorlanmoqda" :
                          order.postal_status === "sent" ? "Yetkazilmoqda" :
                            order.postal_status === "delivered" ? "Yetkazildi" :
                              order.status === "paid" ? "Tayyorlanmoqda" : "Kutilmoqda"}
                      </span>
                      
                      {/* Postal Tracking Number */}
                      {order.postal_tracking_number && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          Pochta raqami: {order.postal_tracking_number}
                        </span>
                      )}
                      

                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {Number(order.total_amount).toLocaleString()} so'm
                    </p>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {order.order_type === "electron" ? "Elektron" : "Bosma"}
                    </span>
                  </div>
                </div>

                {/* Book Items */}
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <img
                          src={item.book.image_url}
                          alt={item.book.name}
                          className="w-16 h-20 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-book.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {item.book.name}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Yil: {item.book.year}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Miqdori: {item.quantity} dona
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {Number(item.subtotal).toLocaleString()} so'm
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment URL */}
                {order.payment_url && order.status !== "paid" && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <a
                      href={order.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      To'lov qilish
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Orders Section */}
      {serviceOrders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Xizmat buyurtmalari
          </h3>
          <div className="space-y-4">
            {serviceOrders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                      Xizmat buyurtmasi #{order.id}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Xizmat ID: {order.service}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                      {order.provider.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <a
                      href={order.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      To'lov qilish
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {bookOrders.length === 0 && serviceOrders.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Buyurtmalar mavjud emas
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Hozircha sizda hech qanday buyurtma yo'q
          </p>
        </div>
      )}
    </div>
  );
}
