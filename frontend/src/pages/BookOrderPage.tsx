import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookOrder from '../components/BookOrder';

type BookOrderProps = React.ComponentProps<typeof BookOrder>;

interface LocationState {
  cart: BookOrderProps["cart"];
  books: BookOrderProps["books"];
  totalPrice: number;
  orderResponse: BookOrderProps["orderResponse"] | null;
}

const BookOrderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageData] = useState<LocationState>(() => {
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

  // If page data is empty (after redirect), don't render anything
  if (!pageData.cart || !pageData.books) {
    return null;
  }

  return (
    <div className="py-2">
      <BookOrder
        cart={pageData.cart}
        books={pageData.books}
        onClose={handleClose}
        totalPrice={pageData.totalPrice}
        formatPrice={formatPrice}
        orderResponse={pageData.orderResponse ?? undefined}
      />
    </div>
  );
};

export default BookOrderPage;