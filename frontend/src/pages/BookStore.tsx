import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Heart, Search } from "lucide-react";
import { addBookFavorite, fetchBookFavorites, removeBookFavorite } from "../api/books";
import BookStep1 from "../components/BookStep1";
import RatingModal from '../components/modals/RatingModal';
import {
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  X,
  Eye,
} from "../components/icons";
import { getRequest, postRequest } from "../api/request";

type ApiResponse<T> = T;

type GetRequestType = <T>(url: string, params?: Record<string, string>) => Promise<ApiResponse<T>>;
type PostRequestType = <T>(url: string, data: unknown) => Promise<ApiResponse<T>>;

const typedGetRequest = getRequest as GetRequestType;
const typedPostRequest = postRequest as PostRequestType;
import { book_list, book_order_create, payment_for_book } from "../api/apiUrls";
import { useServiceId } from "../utils/useServiceId";

// Backend BookOption.book_type qiymatlari
type BookType = "electron" | "print" | "disk";

interface ApiResponseType<T> {
  results: T[];
}

interface PaymentResponse {
  payment_url: string;
}

interface OrderResponse {
  id: number;
  total_price: string;
}

interface ApiBookResponse {
  id: number;
  name_uz: string;
  name_ru?: string;
  year: number;
  base_file: string | null;
  image_url: string;
  options: { id: number; book_type: string; price: string | null }[];
}

interface Book {
  id: number;
  name: string;
  year: number;
  file_url: string;
  image_url: string;
  category?: BookType;
  price?: number;
  description?: string;
  author?: string;
  publisher?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

interface CartItem {
  bookId: number;
  quantity: number;
  category: BookType;
}

const BookStore: React.FC = () => {
  const { serviceId } = useServiceId(); // get real ID from API
  const navigate = useNavigate();
  const location = useLocation();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);





  const handleRatingSubmit = async (rating: number, comment: string) => {
    try {
      const { createRating } = await import('../api/rating');
      await createRating({
        service: serviceId || 6, // Book service ID
        value: rating,
        comment: comment || "Kitob buyurtma xizmati"
      });
      setShowRatingModal(false);
    } catch (error) {
      console.error('Rating submission error:', error);
      setShowRatingModal(false);
    }
  };

  // Component unmount bo'lganda localStorage'ni tozalash
  useEffect(() => {
    return () => {
      localStorage.removeItem("bookstore_currentStep");
      localStorage.removeItem("bookstore_electronCart");
      localStorage.removeItem("bookstore_bosmaCart");
      localStorage.removeItem("bookstore_diskCart");
    };
  }, []);
  
  // Step management (persisted in localStorage)
  const getInitialStep = () => {
    const saved = localStorage.getItem("bookstore_currentStep");
    if (saved === "2" || saved === "3") return Number(saved) as 2 | 3;
    return 1;
  };
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(getInitialStep());

  const [activeTab, setActiveTab] = useState<BookType>(
    "electron"
  );
  // U-17: filtr holati URL'da (ulashish va orqaga qaytish uchun)
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedYear, setSelectedYearState] = useState(searchParams.get("year") ?? "2024");
  const query = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const onlyFavorites = searchParams.get("fav") === "1";
  const [queryInput, setQueryInput] = useState(query);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const updateParams = useCallback((patch: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const setSelectedYear = (year: string) => {
    setSelectedYearState(year);
    updateParams({ year: year || null });
  };
  useEffect(() => {
    if (!localStorage.getItem("access_token")) return;
    fetchBookFavorites().then((ids) => setFavorites(new Set(ids))).catch(() => setFavorites(new Set()));
  }, []);
  const toggleFavorite = async (bookId: number) => {
    const has = favorites.has(bookId);
    const flip = (on: boolean) => setFavorites((prev) => {
      const n = new Set(prev);
      if (on) n.add(bookId);
      else n.delete(bookId);
      return n;
    });
    flip(!has);
    try {
      if (has) await removeBookFavorite(bookId);
      else await addBookFavorite(bookId);
    } catch {
      flip(has);
    }
  };

  // Har bir tab uchun alohida savatlar
  const getCartFromStorage = (key: string): CartItem[] => {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (error) {
      console.error('Error getting cart from storage:', error);
      return [];
    }
    return [];
  };
  const [electronCart, setElektronCart] = useState<CartItem[]>(() =>
    getCartFromStorage("bookstore_electronCart")
  );
  const [bosmaCart, setBosmaCart] = useState<CartItem[]>(() =>
    getCartFromStorage("bookstore_bosmaCart")
  );
  const [diskCart, setDiskCart] = useState<CartItem[]>(() =>
    getCartFromStorage("bookstore_diskCart")
  );

  const [showModal, setShowModal] = useState(false);
  const [modalProgress, setModalProgress] = useState(0);
  const [showCartModal, setShowCartModal] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState(
    "Buyurtmangiz savatga qo'shildi"
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBookOrder, setShowBookOrder] = useState(false);
  const [orderResponse, setOrderResponse] = useState<{
    id: number;
    total_price: string;
  } | null>(null);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<
    "click" | "payme"
  >("click");
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "failed" | null
  >(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBookDetailModal, setShowBookDetailModal] = useState(false);

  const handlePayment = useCallback(async () => {
    if (!orderResponse) return;

    try {

      const paymentPayload = {
        order_id: orderResponse.id,
        provider: selectedPaymentProvider,
        total_amount: orderResponse.total_price,
      };

      const paymentResponse = await typedPostRequest<PaymentResponse>(
        payment_for_book,
        paymentPayload
      );

      if (paymentResponse?.payment_url) {
        // To'lov modalini yopish
        setShowPaymentModal(false);

        // To'lov holati va URL ni saqlash
        setPaymentStatus("pending");
        setPaymentUrl(paymentResponse.payment_url);

        // Tolov sahifasini ochish
        const paymentWindow = window.open(
          paymentResponse.payment_url,
          "_blank"
        );

        // Savatni tozalash va 3-qadamga o'tish
        setElektronCart([]);
        setBosmaCart([]);
        setDiskCart([]);
        setCurrentStep(3);

        // Success xabar ko'rsatish
        setModalMessage(
          `To'lov sahifasiga yo'naltirildi. To'lovni yakunlash uchun ochilgan oynada amalga oshiring.`
        );
        setShowModal(true);
        
        // 3 soniyadan keyin rating ko'rsatish
        setTimeout(() => {
          setShowRatingModal(true);
        }, 3000);
        setModalProgress(0);

        const duration = 3000;
        const interval = 50;
        const increment = (interval / duration) * 100;

        const progressInterval = setInterval(() => {
          setModalProgress((prev) => {
            const newProgress = prev + increment;
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              setTimeout(() => {
                setShowModal(false);
                setModalProgress(0);
              }, 100);
              return 100;
            }
            return newProgress;
          });
        }, interval);

        // To'lov oynasi tekshirish (foydalanuvchi tomonidan yopilganmi?)
        if (paymentWindow) {
          const checkWindow = setInterval(() => {
            if (paymentWindow.closed) {
              clearInterval(checkWindow);
              setModalMessage("To'lov oynasi yopildi");
              setShowModal(true);
              setTimeout(() => setShowModal(false), 3000);
            }
          }, 1000);
        }
      } else {
        setPaymentStatus("failed");
        setModalMessage(
          `To'lov URL olinmadi. Iltimos qaytadan urinib ko'ring.`
        );
        setShowModal(true);
      }
    } catch (error) {
      console.error("Tolov jarayonida xatolik:", error);
      setPaymentStatus("failed");
      setModalMessage(
        `To'lov jarayonida xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.`
      );
      setShowModal(true);
    }
  }, [orderResponse, selectedPaymentProvider, setCurrentStep, setDiskCart, setElektronCart, setBosmaCart, setModalMessage, setModalProgress, setPaymentStatus, setPaymentUrl, setShowModal, setShowPaymentModal]);

  // Bosma/disk buyurtmalar uchun yetkazib berish sahifasiga o'tish
  useEffect(() => {
    if (!showBookOrder) return;
    navigate('/book-order', {
      state: {
        cart: [...bosmaCart, ...diskCart],
        books,
        totalPrice: getCartTotal(),
        orderResponse
      },
      replace: true
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat showBookOrder yoqilganda bir marta
  }, [showBookOrder]);

  useEffect(() => {
    const state = location.state as { selectedProvider?: "click" | "payme" };
    if (state?.selectedProvider) {
      setSelectedPaymentProvider(state.selectedProvider);
      setShowBookOrder(false);
      handlePayment();
    }
  }, [location.state, handlePayment]);


  // Step navigation functions
  // Step navigation functions (with localStorage sync)
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => {
        const next = (prev + 1) as 1 | 2 | 3;
        localStorage.setItem("bookstore_currentStep", String(next));
        return next;
      });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => {
        const prevStep = (prev - 1) as 1 | 2 | 3;
        localStorage.setItem("bookstore_currentStep", String(prevStep));
        return prevStep;
      });
      localStorage.setItem("bookstore_electronCart", "[]");
      localStorage.setItem("bookstore_bosmaCart", "[]");
      localStorage.setItem("bookstore_diskCart", "[]");
    }
  };

  const resetToFirstStep = () => {
    setCurrentStep(1);
    localStorage.setItem("bookstore_currentStep", "1");
    setElektronCart([]);
    setBosmaCart([]);
    setDiskCart([]);
    setOrderResponse(null);
    setPaymentStatus(null);
    setPaymentUrl(null);
  };

  // Keep localStorage in sync if currentStep changes elsewhere
  useEffect(() => {
    localStorage.setItem("bookstore_currentStep", String(currentStep));
  }, [currentStep]);

  // Load books when step 2 is reached
  useEffect(() => {
    if (currentStep === 2) {
      setLoading(true);

      const queryParams: Record<string, string> = {};

      if (activeTab) {
        queryParams.book_type = activeTab;
      }

      if (selectedYear) {
        queryParams.year = selectedYear;
      }
      if (query) {
        queryParams.q = query;
      }
      if (sort) {
        queryParams.ordering = sort;
      }


      typedGetRequest<ApiResponseType<ApiBookResponse>>(`${book_list}`, queryParams)
        .then((data) => {

          if (data && data.results) {
            // API: name_uz va options[] (tanlangan tur narxi). Avval book.name/book.price o'qilardi —
            // ular javobda yo'q edi, shuning uchun nomlar bo'sh va hamma kitob "Bepul" ko'rinardi.
            const transformedBooks: Book[] = data.results.map((book) => {
              const option = book.options?.find((o) => o.book_type === activeTab) ?? book.options?.[0];
              return {
                id: book.id,
                name: book.name_uz || book.name_ru || "",
                year: book.year,
                file_url: book.base_file ?? "",
                image_url: book.image_url,
                category: activeTab,
                price: option?.price ? Number(option.price) : undefined,
              };
            });
            setBooks(transformedBooks);
          } else {
            setBooks([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching books:", err);
          setBooks([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [currentStep, activeTab, selectedYear, query, sort]);

  const tabs = [
    { id: "electron", label: "Elektron nashrlar" },
    { id: "print", label: "Bosma nashrlar" },
    { id: "disk", label: "Diskdagi nashrlar" },
  ] as const;

  const filteredBooks = onlyFavorites ? books.filter((b) => favorites.has(b.id)) : books;

  // Hozirgi tab bo'yicha savatni olish
  const getCurrentCart = () => {
    switch (activeTab) {
      case "electron":
        return electronCart;
      case "print":
        return bosmaCart;
      case "disk":
        return diskCart;
      default:
        return [];
    }
  };

  // Hozirgi tab bo'yicha savatni o'rnatish
  const setCurrentCart = (
    newCart: CartItem[] | ((prev: CartItem[]) => CartItem[])
  ) => {
    switch (activeTab) {
      case "electron":
        setElektronCart(newCart);
        break;
      case "print":
        setBosmaCart(newCart);
        break;
      case "disk":
        setDiskCart(newCart);
        break;
    }
  };

  useEffect(() => {
    localStorage.setItem(
      "bookstore_electronCart",
      JSON.stringify(electronCart)
    );
  }, [electronCart]);
  useEffect(() => {
    localStorage.setItem("bookstore_bosmaCart", JSON.stringify(bosmaCart));
  }, [bosmaCart]);
  useEffect(() => {
    localStorage.setItem("bookstore_diskCart", JSON.stringify(diskCart));
  }, [diskCart]);

  const addToCart = (bookId: number) => {
    const quantity = activeTab === "electron" ? 1 : 1; // Hozircha doimo 1
    let showSuccessModal = false;

    setCurrentCart((prev) => {
      const existingItem = prev.find((item) => item.bookId === bookId);
      if (existingItem) {
        if (activeTab === "electron") {
          return prev;
        }
        showSuccessModal = true;
        return prev.map((item) =>
          item.bookId === bookId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      showSuccessModal = true;
      return [
        ...prev,
        {
          bookId,
          quantity: activeTab === "electron" ? 1 : quantity,
          category: activeTab,
        },
      ];
    });

    if (showSuccessModal) {
      setModalMessage("Buyurtmangiz savatga qo'shildi");
      setShowModal(true);
      setModalProgress(0);

      const duration = 5000;
      const interval = 50;
      const increment = (interval / duration) * 100;

      const progressInterval = setInterval(() => {
        setModalProgress((prev) => {
          const newProgress = prev + increment;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
              setShowModal(false);
              setModalProgress(0);
            }, 100);
            return 100;
          }
          return newProgress;
        });
      }, interval);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalProgress(0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  const getTotalCartItems = () => {
    return (
      electronCart.reduce((total, item) => total + item.quantity, 0) +
      bosmaCart.reduce((total, item) => total + item.quantity, 0) +
      diskCart.reduce((total, item) => total + item.quantity, 0)
    );
  };

  const getCartTotal = () => {
    const allItems = [...electronCart, ...bosmaCart, ...diskCart];
    return allItems.reduce((total, item) => {
      const book = books.find((b) => b.id === item.bookId);
      return total + (book && book.price ? book.price * item.quantity : 0);
    }, 0);
  };

  const removeFromCart = (bookId: number) => {
    setCurrentCart((prev) => prev.filter((item) => item.bookId !== bookId));
  };

  const updateCartQuantity = (bookId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(bookId);
    } else {
      setCurrentCart((prev) =>
        prev.map((item) => {
          if (item.bookId === bookId) {
            const quantity = item.category === "electron" ? 1 : newQuantity;
            return { ...item, quantity };
          }
          return item;
        })
      );
    }
  };

  const getCartItemQuantity = (bookId: number) => {
    const currentCart = getCurrentCart();
    const cartItem = currentCart.find((item) => item.bookId === bookId);
    return cartItem ? cartItem.quantity : 0;
  };

  const isBookInCart = (bookId: number) => {
    const currentCart = getCurrentCart();
    return currentCart.some((item) => item.bookId === bookId);
  };

  const showBookDetails = (book: Book) => {
    setSelectedBook(book);
    setShowBookDetailModal(true);
  };

  const closeBookDetailModal = () => {
    setShowBookDetailModal(false);
    setSelectedBook(null);
  };

  const submitOrder = async () => {
    setOrderLoading(true);

    try {
      const orders = [];

      if (electronCart.length > 0) {
        orders.push({
          order_type: "electron",
          items: electronCart.map((item) => ({
            book_id: item.bookId,
            quantity: item.quantity,
          })),
        });
      }

      if (bosmaCart.length > 0) {
        orders.push({
          order_type: "print",
          items: bosmaCart.map((item) => ({
            book_id: item.bookId,
            quantity: item.quantity,
          })),
        });
      }

      if (diskCart.length > 0) {
        orders.push({
          order_type: "disk",
          items: diskCart.map((item) => ({
            book_id: item.bookId,
            quantity: item.quantity,
          })),
        });
      }

      if (orders.length === 0) {
        return;
      }

      const payload = {
        orders: orders,
      };


      const response = await typedPostRequest<OrderResponse>(book_order_create, payload);

      if (response && response.id && response.total_price) {
        setOrderResponse(response);
        setShowCartModal(false);

        // Agar bosma yoki disk mahsulotlari bo'lsa
        if (bosmaCart.length > 0 || diskCart.length > 0) {
          setShowBookOrder(true);
        } else {
          // Faqat electron kitoblar uchun to'g'ridan-to'g'ri to'lov oynasi
          setShowPaymentModal(true);
        }
      } else {
        setModalMessage("Buyurtmangiz muvaffaqiyatli yaratildi!");
        setShowModal(true);
        setModalProgress(0);

        const duration = 5000;
        const interval = 50;
        const increment = (interval / duration) * 100;

        const progressInterval = setInterval(() => {
          setModalProgress((prev) => {
            const newProgress = prev + increment;
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              setTimeout(() => {
                setShowModal(false);
                setModalProgress(0);
              }, 100);
              return 100;
            }
            return newProgress;
          });
        }, interval);
      }
    } catch (error) {
      console.error("Buyurtma berishda xatolik:", error);
    } finally {
      setOrderLoading(false);
    }
  };



  const closePaymentModal = () => {
    setShowPaymentModal(false);
    // Modal yopilganda orderResponse ni tozalash
    // Agar to'lov amalga oshirilmagan bo'lsa, 3-qadamga o'tmaslik
    if (currentStep !== 3) {
      setOrderResponse(null);
    }
  };

  // Step 1 Component - Service Information

  const renderStep1 = () => <BookStep1 onNext={goToNextStep} serviceId={serviceId} />;

  // Step 2 Component - Service Usage
  const renderStep2 = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="pt-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-3xl font-bold text-gray-900">
              Statistik nashrlar
            </h1>
            <button
              onClick={goToPreviousStep}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Orqaga
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-1">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCartModal(true)}
              className="relative flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-all duration-200 border border-gray-200 overflow-visible mr-1"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Savat</span>
              {getTotalCartItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white">
                  {getTotalCartItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
            {tabs.find((tab) => tab.id === activeTab)?.label.toUpperCase()}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <form
              onSubmit={(e) => { e.preventDefault(); updateParams({ q: queryInput.trim() || null }); }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Nomi bo'yicha qidirish"
                aria-label="Kitob nomi bo'yicha qidirish"
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </form>
            <select
              aria-label="Saralash"
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value || null })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Saralash</option>
              <option value="new">Avval yangilari</option>
              <option value="price">Arzonroq</option>
              <option value="-price">Qimmatroq</option>
            </select>
            <button
              type="button"
              aria-pressed={onlyFavorites}
              onClick={() => updateParams({ fav: onlyFavorites ? null : "1" })}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border ${onlyFavorites ? "border-rose-400 text-rose-600 bg-rose-50" : "border-gray-300 text-gray-700"}`}
            >
              <Heart className={`w-4 h-4 ${onlyFavorites ? "fill-current" : ""}`} /> Sevimlilar
            </button>
            <label
              htmlFor="year-filter"
              className="text-sm font-medium text-gray-700"
            >
              Yillar:
            </label>
            <select
              id="year-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>

            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Kitoblar yuklanmoqda...</span>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full"
              >
                <div className="relative overflow-hidden bg-gray-100 rounded-t-xl">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(book.id)}
                    aria-pressed={favorites.has(book.id)}
                    aria-label={favorites.has(book.id) ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
                    className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 shadow"
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(book.id) ? "fill-rose-500 text-rose-500" : "text-gray-500"}`} />
                  </button>
                  <div className="aspect-[3/4] w-full">
                    <img
                      src={
                        book.image_url ||
                        "https://images.pexels.com/photos/1005012/pexels-photo-1005012.jpeg?auto=compress&cs=tinysrgb&w=400"
                      }
                      alt={book.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.errorHandled) {
                          target.dataset.errorHandled = 'true';
                          target.src = "https://via.placeholder.com/300x400?text=Rasm+mavjud+emas";
                        }
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight overflow-hidden">
                    {book.name}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium mb-4">
                    Yil: {book.year}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-blue-600">
                      {book.price ? formatPrice(book.price) : "Bepul"}{" "}
                      {book.price ? (
                        <span className="text-sm font-normal">so'm</span>
                      ) : (
                        ""
                      )}
                    </span>
                  </div>

                  <div className="flex-grow"></div>

                  {isBookInCart(book.id) ? (
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Savatda:
                        </span>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                book.id,
                                getCartItemQuantity(book.id) - 1
                              )
                            }
                            className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors duration-200"
                            title="Miqdorni kamaytirish"
                          >
                            <Minus className="w-4 h-4 text-red-600" />
                          </button>
                          <span className="font-bold text-lg text-blue-600 min-w-[24px] text-center">
                            {getCartItemQuantity(book.id)}
                          </span>
                          {activeTab !== "electron" ? (
                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  book.id,
                                  getCartItemQuantity(book.id) + 1
                                )
                              }
                              className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors duration-200"
                              title="Miqdorni oshirish"
                            >
                              <Plus className="w-4 h-4 text-green-600" />
                            </button>
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"
                              title="Elektron kitob savatda"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                          )}
                        </div>
                      </div>
                      {activeTab === "electron" && (
                        <div className="text-center mt-2">
                          <span className="text-xs text-gray-500">
                            Elektron kitobdan faqat 1 ta olish mumkin
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(book.id)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mb-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Savatga qo'shish</span>
                    </button>
                  )}

                  <button
                    onClick={() => showBookDetails(book)}
                    className="w-full bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 border border-blue-200 hover:border-blue-300"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Batafsil</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Hozircha kitoblar mavjud emas
            </h3>
            <p className="text-gray-500">
              API dan ma'lumotlar yuklanmadi yoki xatolik yuz berdi
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Step 3 Component - Results Display
  const renderStep3 = () => {
    // To'lov pending holatda (to'lov amalga oshirilmagan)
    if (paymentStatus === "pending") {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">To'lov kutilmoqda!</h1>
              <p className="text-blue-100">
                Buyurtmangiz yaratildi, ammo to'lov hali amalga oshirilmagan
              </p>
            </div>

            <div className="p-8">
              {orderResponse && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Buyurtma ma'lumotlari
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Buyurtma ID:</span>
                      <span className="font-semibold">#{orderResponse.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami summa:</span>
                      <span className="font-semibold text-blue-600">
                        {formatPrice(parseInt(orderResponse.total_price))} so'm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sana:</span>
                      <span className="font-semibold">
                        {new Date().toLocaleDateString("uz-UZ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To'lov holati:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Kutilmoqda
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  To'lov amalga oshirilmagan
                </h3>
                <p className="text-gray-700 mb-4">
                  Buyurtmangiz muvaffaqiyatli yaratildi, ammo to'lov hali amalga
                  oshirilmagan. Buyurtmangizni yakunlash uchun to'lovni amalga
                  oshiring.
                </p>

                {paymentUrl && (
                  <button
                    onClick={() => window.open(paymentUrl, "_blank")}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>To'lovga o'tish</span>
                  </button>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Savollaringiz bormi?
                </h3>
                <p className="text-gray-600 mb-4">
                  To'lov yoki buyurtmangiz haqida savollaringiz bo'lsa, biz
                  bilan bog'laning
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">info@stat.uz</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">
                      +998 71 233 45 47
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsRatingModalOpen(true)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Xizmatni baholash
                </button>
                <button
                  onClick={resetToFirstStep}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Yangi buyurtma berish
                </button>
                <button
                  onClick={() => window.open("/cabinet", "_blank")}
                  className="flex-1 bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-6 rounded-lg transition-all duration-300 border border-blue-200 hover:border-blue-300"
                >
                  Shaxsiy kabinetga o'tish
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // To'lov muvaffaqiyatli bo'lgan holat (yoki boshqa holatlar)
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Buyurtma muvaffaqiyatli yaratildi!
            </h1>
            <p className="text-green-100">
              Buyurtmangiz tizimga kiritildi va tez orada qayta ishlanadi
            </p>
          </div>

          <div className="p-8">
            {orderResponse && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Buyurtma ma'lumotlari
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buyurtma ID:</span>
                    <span className="font-semibold">#{orderResponse.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jami summa:</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(parseInt(orderResponse.total_price))} so'm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sana:</span>
                    <span className="font-semibold">
                      {new Date().toLocaleDateString("uz-UZ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Holat:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Yaratilgan
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Keyingi qadamlar:
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">
                      1
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Email tasdiqlash
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Tez orada sizning emailingizga buyurtma haqida tasdiq
                      xabar yuboriladi
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">
                      2
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Tayyorlash jarayoni
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Buyurtmangiz 1-3 ish kuni ichida tayyorlanadi
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">
                      3
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Yetkazib berish
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Bosma nashrlar uchun yetkazib berish, electron nashrlar
                      uchun yuklab olish havolasi yuboriladi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Savollaringiz bormi?
              </h3>
              <p className="text-gray-600 mb-4">
                Buyurtmangiz yoki xizmat haqida savollaringiz bo'lsa, biz bilan
                bog'laning
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">info@stat.uz</span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    +998 71 233 45 47
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Xizmatni baholash
              </button>
              <button
                onClick={resetToFirstStep}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Yangi buyurtma berish
              </button>
              <button
                onClick={() => window.open("/cabinet", "_blank")}
                className="flex-1 bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-6 rounded-lg transition-all duration-300 border border-blue-200 hover:border-blue-300"
              >
                Shaxsiy kabinetga o'tish
              </button>
            </div>
          </div>
      </div>
      
      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        serviceName="Kitob buyurtma xizmati"
      />
    </div>
  );
};  // Step Progress Bar
  const renderStepProgress = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep >= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step}
            </div>
            <div
              className={`ml-3 text-sm font-medium ${
                currentStep >= step ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {step === 1
                ? "Xizmat haqida"
                : step === 2
                ? "Xizmatdan foydalanish"
                : "Natija"}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-1 mx-4 ${
                  currentStep > step ? "bg-blue-600" : "bg-gray-200"
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
        serviceName="Statistik nashrlar"
      />
      {renderStepProgress()}

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      {/* Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Savat</h2>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col max-h-[calc(80vh-140px)]">
              {electronCart.length + bosmaCart.length + diskCart.length ===
              0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Savat bo'sh
                  </h3>
                  <p className="text-gray-500">
                    Hozircha hech qanday mahsulot qo'shilmagan
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                      {[...electronCart, ...bosmaCart, ...diskCart].map(
                        (item) => {
                          const book = books.find((b) => b.id === item.bookId);
                          if (!book) return null;
                          return (
                            <div
                              key={`${item.category}-${item.bookId}`}
                              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={
                                    book.image_url ||
                                    "https://images.pexels.com/photos/1005012/pexels-photo-1005012.jpeg?auto=compress&cs=tinysrgb&w=400"
                                  }
                                  alt={book.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.dataset.errorHandled) {
                                      target.dataset.errorHandled = 'true';
                                      target.src = "https://via.placeholder.com/64x80?text=Rasm+mavjud+emas";
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                  {book.name}
                                </h3>
                                <p className="text-sm text-blue-600 mt-1">
                                  Yil: {book.year}
                                </p>
                                <p className="text-lg font-bold text-blue-600 mt-1">
                                  {book.price
                                    ? formatPrice(book.price)
                                    : "Bepul"}{" "}
                                  {book.price ? "so'm" : ""}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {item.category !== "electron" ? (
                                  <>
                                    <button
                                      onClick={() =>
                                        updateCartQuantity(
                                          book.id,
                                          item.quantity - 1
                                        )
                                      }
                                      className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center border border-gray-200 transition-colors duration-200"
                                    >
                                      <Minus className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <span className="w-8 text-center font-semibold">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateCartQuantity(
                                          book.id,
                                          item.quantity + 1
                                        )
                                      }
                                      className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center border border-gray-200 transition-colors duration-200"
                                    >
                                      <Plus className="w-4 h-4 text-gray-600" />
                                    </button>
                                  </>
                                ) : (
                                  <span className="w-8 text-center font-semibold text-gray-500">
                                    1
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => removeFromCart(book.id)}
                                className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-gray-900">
                        Jami:
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(getCartTotal())} so'm
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowCartModal(false)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                      >
                        Davom etish
                      </button>
                      <button
                        onClick={submitOrder}
                        disabled={orderLoading}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        {orderLoading
                          ? "Buyurtma berilmoqda..."
                          : "Buyurtma berish"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && orderResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Buyurtma muvaffaqiyatli yaratildi!
                </h2>
              </div>
              <button
                onClick={closePaymentModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Buyurtma ID:
                  </span>
                  <span className="font-bold text-gray-900">
                    #{orderResponse.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Jami summa:
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatPrice(parseInt(orderResponse.total_price))} so'm
                  </span>
                </div>
              </div>

              {/* Payment Provider Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tolov usulini tanlang:
                </h3>

                <div className="space-y-3">
                  {/* Click Option */}
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                    <input
                      type="radio"
                      name="paymentProvider"
                      value="click"
                      checked={selectedPaymentProvider === "click"}
                      onChange={(e) =>
                        setSelectedPaymentProvider(
                          e.target.value as "click" | "payme"
                        )
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">C</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Click</div>
                        <div className="text-sm text-gray-500">
                          Tezkor va xavfsiz to'lov
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Payme Option */}
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                    <input
                      type="radio"
                      name="paymentProvider"
                      value="payme"
                      checked={selectedPaymentProvider === "payme"}
                      onChange={(e) =>
                        setSelectedPaymentProvider(
                          e.target.value as "click" | "payme"
                        )
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">P</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Payme</div>
                        <div className="text-sm text-gray-500">
                          Ishonchli to'lov tizimi
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={closePaymentModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  To'lovni amalga oshirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showModal && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="relative bg-white rounded-lg p-4 max-w-xs w-72 shadow-lg border border-gray-200 transform transition-all duration-300 overflow-hidden">
            <div
              className="absolute top-0 left-0 h-1 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-75 ease-out"
              style={{ width: `${modalProgress}%` }}
            ></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {modalMessage}
                  </h3>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {showBookDetailModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 relative">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Kitob haqida</h1>
                <button
                  onClick={closeBookDetailModal}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Book Image */}
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <div className="aspect-[3/4] w-full">
                      <img
                        src={selectedBook.image_url || "https://via.placeholder.com/300x400"}
                        alt={selectedBook.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.dataset.errorHandled) {
                            target.dataset.errorHandled = 'true';
                            target.src = "https://via.placeholder.com/300x400?text=Rasm+mavjud+emas";
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Book Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedBook.name}
                    </h2>
                    <p className="text-gray-600">
                      Ushbu kitob haqida batafsil ma'lumot mavjud emas.
                    </p>
                  </div>

                  {/* Book Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-gray-700 mb-2">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">Yil:</span>
                      </div>
                      <p className="text-gray-900">{selectedBook.year}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-gray-700 mb-2">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="font-semibold">Narx:</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedBook.price ? `${formatPrice(selectedBook.price)} so'm` : "42,000 so'm"}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-gray-700 mb-2">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-semibold">Muallif:</span>
                      </div>
                      <p className="text-gray-900">O'zbekiston Respublikasi Milliy Statistika qo'mitasi</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-gray-700 mb-2">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-semibold">Nashriyot:</span>
                      </div>
                      <p className="text-gray-900">O'zbekiston Respublikasi Milliy Statistika qo'mitasi</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => addToCart(selectedBook.id)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Savatga qo'shish</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (selectedBook.file_url) {
                          window.open(selectedBook.file_url, '_blank');
                        } else {
                          alert('Fayl mavjud emas');
                        }
                      }}
                      className="bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-4 rounded-lg transition-all duration-300 border border-blue-200 hover:border-blue-300 flex items-center space-x-2"
                    >
                      <Eye className="w-5 h-5" />
                      <span>Faylni yuklab olish</span>
                    </button>
                  </div>


                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookStore;
