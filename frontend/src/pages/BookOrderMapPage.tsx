import React from 'react';
import { useNavigate } from 'react-router-dom';
import LocationSelector from '../components/BookOrderMap';

export default function BookOrderMapPage() {
  const navigate = useNavigate();

  return (
    <LocationSelector
      stores={[
        {
          id: '1',
          name: 'Asaxiy Books - Chilonzor',
          address: 'Chilonzor tumani, Qatortol ko\'chasi',
          latitude: 41.2925,
          longitude: 69.2351,
          city: 'Toshkent',
          region: 'Toshkent shahri'
        },
        {
          id: '2',
          name: 'Asaxiy Books - Yunusobod',
          address: 'Yunusobod tumani, Minor ko\'chasi',
          latitude: 41.3647,
          longitude: 69.2872,
          city: 'Toshkent',
          region: 'Toshkent shahri'
        }
      ]}
      onSelectStore={() => {
        // Asosiy sahifaga qaytish, state ni saqlab qolgan holda
        const pageData = localStorage.getItem('bookOrderPageData');
        if (pageData) {
          navigate('/book-order', {
            state: JSON.parse(pageData)
          });
        } else {
          navigate('/book-order');
        }
      }}
      onClose={() => navigate('/book-order')}
    />
  );
}