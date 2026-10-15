import { useEffect } from "react";
import Banner from "../components/Banner";
import { useLocation } from "react-router-dom";
import TariffComponent from "../components/TariffComponent";
import Interactive from "../components/Interactive";
import CalendarReport from "../components/CalendarReport";
import FloatingSupport from "../components/FloatingSupport";
import HomeHighlights from "../components/home/HomeHighlights";

const HomePage = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Banner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          <HomeHighlights />
          <Interactive />
          <TariffComponent />
          <CalendarReport/>
        </div>
        <FloatingSupport />
      </div>
    </>
  );
};

export default HomePage;
