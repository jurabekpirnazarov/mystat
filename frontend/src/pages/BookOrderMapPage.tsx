import { useNavigate } from 'react-router-dom';
import LocationSelector from '../components/BookOrderMap';

export default function BookOrderMapPage() {
  const navigate = useNavigate();

  return (
    <LocationSelector
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