import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";
import { OrdersProvider } from "./contexts/OrdersContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// Global 401 error handler
function setupGlobalErrorHandler() {
  // Function to clear localStorage and redirect to login
  const clearLocalStorageAndRedirect = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_data");
    localStorage.removeItem("user_profile");
    
    window.location.href = "/login";
  };

  // Listen for unhandled promise rejections (axios errors)
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.response?.status === 401) {
      clearLocalStorageAndRedirect();
      event.preventDefault(); // Prevent default error logging
    }
  });

  // Listen for general errors
  window.addEventListener('error', (event) => {
    if (event.error?.response?.status === 401) {
      clearLocalStorageAndRedirect();
    }
  });
}

// Lazy loading pages
const HomePage = lazy(() => import("./pages/HomePage"));
const AboutPortal = lazy(() => import("./pages/AboutPortal"));
const Statistics = lazy(() => import("./pages/Statistics"));
const AllServices = lazy(() => import("./pages/AllServices"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const PersonalCabinet = lazy(() => import("./pages/PersonalCabinet"));
const FAQ = lazy(() => import("./pages/FAQ"));
const TariffDetailPage = lazy(() => import("./pages/TariffDetailPage"));
const OrgInfoPage = lazy(() => import("./pages/OrgInfoPage"));
const BookStore = lazy(() => import("./pages/BookStore"));
const ExternalTrade = lazy(() => import("./pages/ExternalTrade"));
const Demographics = lazy(() => import("./pages/Demographics"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TradeFlows = lazy(() => import("./pages/TradeFlows"));
const OrganizationsRegistr = lazy(() => import("./pages/OrganizationsRegistr"));
const Organizations = lazy(() => import("./pages/Organizations"));
const OrganizationsKtut = lazy(() => import("./pages/OrganizationsKtut"));
const Industry = lazy(() => import("./pages/Industry"));
const Reports = lazy(() => import("./pages/Reports"));
const OneIDCallback = lazy(() => import("./pages/OneIDCallback"));
const CpiCalculator = lazy(() => import("./pages/CpiCalculator"));
const StatisticalClassifications = lazy(() => import("./pages/StatisticalClassifications"));
const ReportCalendar = lazy(() => import("./pages/ReportCalendar"));
const Reglaments = lazy(() => import("./pages/Reglaments"));
const BookOrderPage = lazy(() => import("./pages/BookOrderPage"));
const BookOrderMapPage = lazy(() => import("./pages/BookOrderMapPage"));
const TariffCompare = lazy(() => import("./pages/TariffCompare"));
const MarketReport = lazy(() => import("./pages/MarketReport"));
const Partners = lazy(() => import("./pages/Partners"));
const OrganizationPassport = lazy(() => import("./pages/OrganizationPassport"));
const CitizensHub = lazy(() => import("./pages/citizens/CitizensHub"));
const Regions = lazy(() => import("./pages/Regions"));
const RegionProfile = lazy(() => import("./pages/RegionProfile"));
const MySalary = lazy(() => import("./pages/citizens/MySalary"));
const Prices = lazy(() => import("./pages/citizens/Prices"));
const Learn = lazy(() => import("./pages/learn/Learn"));
const Article = lazy(() => import("./pages/learn/Article"));
const Glossary = lazy(() => import("./pages/learn/Glossary"));
const SurveyList = lazy(() => import("./pages/citizens/Surveys").then((m) => ({ default: m.SurveyList })));
const SurveyPage = lazy(() => import("./pages/citizens/Surveys").then((m) => ({ default: m.SurveyPage })));
const Names = lazy(() => import("./pages/citizens/Names"));
const PublicAnswers = lazy(() => import("./pages/citizens/PublicAnswers"));
const Developers = lazy(() => import("./pages/Developers"));
const Consultation = lazy(() => import("./pages/Consultation"));

// Loading component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <ErrorBoundary key={location.pathname}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPortal />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/services" element={<AllServices />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/questions" element={<FAQ />} />
          <Route path="/books" element={<BookStore />} />
          <Route path="/book-order" element={<BookOrderPage />} />
          <Route path="/book-order/map" element={<BookOrderMapPage />} />
          <Route path="/ex-trade" element={<ExternalTrade />} />
          <Route path="/statistical-data" element={<Demographics />} />
          <Route path="/demographics" element={<Demographics />} />
          <Route path="/foreign-trade" element={<TradeFlows />} />
          <Route path="/trade-flows" element={<TradeFlows />} />
          <Route path="/organizations-register" element={<OrganizationsRegistr />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/organizations-ktut" element={<OrganizationsKtut />} />
          <Route path="/industry" element={<Industry />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/tariff/:id" element={<TariffDetailPage />} />
          <Route path="/tariffs" element={<TariffCompare />} />
          <Route path="/market-report" element={<MarketReport />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/citizens" element={<CitizensHub />} />
          <Route path="/regions" element={<Regions />} />
          <Route path="/regions/:id" element={<RegionProfile />} />
          <Route path="/my-salary" element={<MySalary />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:slug" element={<Article />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/surveys" element={<SurveyList />} />
          <Route path="/surveys/:slug" element={<SurveyPage />} />
          <Route path="/names" element={<Names />} />
          <Route path="/answers" element={<PublicAnswers />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/orginfo" element={<OrgInfoPage />} />
          <Route path="/cpi-calculator" element={<CpiCalculator />} />
          <Route path="/statistical-classifications" element={<StatisticalClassifications />} />
          <Route path="/report-calendar" element={<ReportCalendar />} />
          <Route path="/reglaments" element={<Reglaments />} />

          <Route path="/login" element={<Login />} />
          <Route path="/auth/oneid/callback" element={<OneIDCallback />} />
          <Route
            path="/cabinet"
            element={
              <ProtectedRoute>
                <PersonalCabinet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cabinet/organization"
            element={
              <ProtectedRoute>
                <OrganizationPassport />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}

function App() {
  // Setup global error handler on app mount
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return (
    <ThemeProvider>
      <OrdersProvider>
        <NotificationsProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            <a href="#main-content" className="skip-link">Asosiy kontentga o'tish</a>
            <Navbar />
            <div id="main-content" tabIndex={-1}>
              <AppRoutes />
            </div>
            <Footer />
          </div>
        </Router>
        </NotificationsProvider>
      </OrdersProvider>
    </ThemeProvider>
  );
}

export default App;
