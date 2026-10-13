import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookOrder from '../components/BookOrder';

interface LocationState {
  cart: any[];
  books: any[];
  totalPrice: number;
  orderResponse: any;
}

const BookOrderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<LocationState>(() => {
    // Check if we have state from location
    if (location.state) {
      // Save state to localStorage
      localStorage.setItem('bookOrderPageData', JSON.stringify(location.state));
      return location.state as LocationState;
    }
    
    // Try to get state from localStorage
    const savedData = localStorage.getItem('bookOrderPageData');
    if (savedData) {
      return JSON.parse(savedData) as LocationState;
    }

    // If no data, redirect to books page
    navigate('/books');
    return {
      cart: [],
      books: [],
      totalPrice: 0,
      orderResponse: null
    };
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price);
  };

  const handleClose = () => {
    localStorage.removeItem('bookOrderPageData');
    navigate('/books');
  };

  const handleSubmit = (provider: "click" | "payme") => {
    localStorage.removeItem('bookOrderPageData');
    navigate('/books', { 
      state: { selectedProvider: provider }
    });
  };

  // If page data is empty (after redirect), don't render anything
  if (!pageData.cart || !pageData.books) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <BookOrder
        cart={pageData.cart}
        books={pageData.books}
        onClose={handleClose}
        onSubmit={handleSubmit}
        totalPrice={pageData.totalPrice}
        formatPrice={formatPrice}
        orderResponse={pageData.orderResponse}
      />
    </div>
  );
};

export default BookOrderPage;