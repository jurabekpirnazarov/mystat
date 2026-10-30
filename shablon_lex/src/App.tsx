import FieldGrid from "./components/FieldGrid";
import Footer from "./components/Footer";
import Header from "./components/Header";
import SearchBand from "./components/SearchBand";
import UpdatesList from "./components/UpdatesList";

/** lex.uz uslubidagi bosh sahifa: sarlavha → qidiruv bloki → sohalar → e'lonlar ro'yxati → footer. Matnlar o'rnini bosuvchi. */
export default function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">Asosiy kontentga o'tish</a>
      <Header />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <SearchBand />
        <FieldGrid />
        <UpdatesList />
      </main>
      <Footer />
    </>
  );
}
