import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import MainLayout from "./components/layout/MainLayout";
import { LangProvider, isLang, useLang } from "./i18n/LangContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";
import { OrdersProvider } from "./contexts/OrdersContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { loginUrl, redirectToLogin } from "./utils/loginRedirect";

// Global 401 error handler
function setupGlobalErrorHandler() {
  // Function to clear localStorage and redirect to login
  const clearLocalStorageAndRedirect = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_data");
    localStorage.removeItem("user_profile");

    redirectToLogin();
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
// MYGOV_DIZAYN 2-etap: sohalar, xizmat pasporti, qidiruv, statistika, huquqiy sahifalar
const StatisticsHub = lazy(() => import("./pages/portal/StatisticsHub"));
const Spheres = lazy(() => import("./pages/portal/Spheres"));
const ServicePage = lazy(() => import("./pages/portal/ServicePage"));
const SearchPage = lazy(() => import("./pages/portal/Search"));
const Popular = lazy(() => import("./pages/portal/Popular"));
const Situations = lazy(() => import("./pages/portal/Situations"));
const LegalPage = lazy(() => import("./pages/portal/LegalPage"));
const Sitemap = lazy(() => import("./pages/portal/Sitemap"));
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
const CompanyScoreMethodology = lazy(() => import("./pages/CompanyScoreMethodology"));
const CompanyScoreShowcase = lazy(() => import("./pages/CompanyScoreShowcase"));
const CompanyProfile = lazy(() => import("./pages/company/CompanyProfile"));
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
// JAHON_TAJRIBASI_TAKLIFLAR.md: JT-10, JT-17 (+JT-02), JT-15, JT-04
const Dashboards = lazy(() => import("./pages/stat/Dashboards"));
const ReleaseCalendarPage = lazy(() => import("./pages/stat/ReleaseCalendar"));
// UI_QAYTA_TUZISH.md 5-bo'lim: mavzular va ko'rsatkichlar ro'yxati
const IndicatorsPage = lazy(() => import("./pages/stat/Indicators").then((m) => ({ default: m.Indicators })));
const IndicatorPage = lazy(() => import("./pages/stat/IndicatorPage"));
const TopicsPage = lazy(() => import("./pages/stat/Indicators").then((m) => ({ default: m.Topics })));
const EmbedIndicator = lazy(() => import("./pages/stat/EmbedIndicator"));
const ReportingHub = lazy(() => import("./pages/portal/ReportingHub"));
const StatCodes = lazy(() => import("./pages/stat/StatCodes"));
const CertificateVerify = lazy(() => import("./pages/stat/CertificateVerify"));
// IHAMKOR_MUQOBIL.md IH-08
const CompanyCheck = lazy(() => import("./pages/company/CompanyCheck"));
const CompanyCardMethodology = lazy(() => import("./pages/company/CompanyCardMethodology"));

// Loading component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to={loginUrl(location.pathname + location.search)} replace />;
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
          <Route path="/statistics" element={<StatisticsHub />} />
          {/* MG-06: eski "Barcha xizmatlar" katalogi sohalar sahifasiga almashdi */}
          <Route path="/services" element={<Navigate to="/spheres" replace />} />
          <Route path="/all-services" element={<Navigate to="/spheres" replace />} />
          <Route path="/spheres" element={<Spheres />} />
          <Route path="/spheres/:id" element={<Spheres />} />
          <Route path="/service/:number" element={<ServicePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/popular" element={<Popular />} />
          <Route path="/situations" element={<Situations />} />
          <Route path="/situations/:slug" element={<Situations />} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
          <Route path="/ai-usage" element={<LegalPage kind="ai-usage" />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/questions" element={<FAQ />} />
          <Route path="/books" element={<BookStore />} />
          <Route path="/book-order" element={<BookOrderPage />} />
          <Route path="/book-order/map" element={<BookOrderMapPage />} />
          <Route path="/ex-trade" element={<ExternalTrade />} />
          <Route path="/statistical-data" element={<Navigate to="/demographics" replace />} />
          <Route path="/demographics" element={<Demographics />} />
          <Route path="/foreign-trade" element={<Navigate to="/trade-flows" replace />} />
          <Route path="/trade-flows" element={<TradeFlows />} />
          {/* Eski manzillar: bo'sh sahifa (stub) o'rniga ishlaydigan sahifaga yo'naltiriladi */}
          <Route path="/organizations-register" element={<Navigate to="/organizations-ktut" replace />} />
          <Route path="/organizations" element={<Navigate to="/organizations-ktut" replace />} />
          <Route path="/organizations-ktut" element={<OrganizationsKtut />} />
          <Route path="/industry" element={<Industry />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/tariff/:id" element={<TariffDetailPage />} />
          <Route path="/tariffs" element={<TariffCompare />} />
          <Route path="/market-report" element={<MarketReport />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/citizens" element={<CitizensHub />} />
          <Route path="/regions" element={<Regions />} />
          <Route path="/methodology/company-score" element={<CompanyScoreMethodology />} />
          {/* KR-34: komponentlar namoyishi faqat ishlab chiqishda (production'da ochiq sahifa bo'lmasin) */}
          {import.meta.env.DEV && <Route path="/company-score/components" element={<CompanyScoreShowcase />} />}
          <Route path="/company/:stir" element={<CompanyProfile />} />
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
          <Route path="/reporting" element={<ReportingHub />} />
          <Route path="/report-calendar" element={<ReportCalendar />} />
          <Route path="/release-calendar" element={<ReleaseCalendarPage />} />
          <Route path="/indicators" element={<IndicatorsPage />} />
          <Route path="/indicators/:key" element={<IndicatorPage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/topics/:slug" element={<TopicsPage />} />
          <Route path="/dashboards" element={<Dashboards />} />
          <Route path="/dashboards/:slug" element={<Dashboards />} />
          <Route path="/embed/indicator/:key" element={<EmbedIndicator />} />
          <Route path="/stat-codes" element={<StatCodes />} />
          <Route path="/stat-codes/verify" element={<CertificateVerify />} />
          <Route path="/check" element={<CompanyCheck />} />
          <Route path="/methodology/company-card" element={<CompanyCardMethodology />} />
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
          <Route path="/cabinet/credits" element={<Navigate to="/cabinet" replace state={{ name: "credits" }} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}

/**
 * JT-15: `/embed/...` sahifalari boshqa saytlarda iframe ichida — layout'siz.
 * MG-02: `/uz/...`, `/cry/...`, `/ru/...` — tilni o'rnatadi va prefikssiz manzilga o'tadi (eski havolalar o'zgarmaydi).
 */
function Shell() {
  const { pathname, search, hash } = useLocation();
  const { setLang } = useLang();
  const first = pathname.split("/")[1];
  const prefixed = isLang(first);
  useEffect(() => {
    if (prefixed) setLang(first);
  }, [prefixed, first, setLang]);
  if (prefixed) return <Navigate to={`${pathname.slice(first.length + 1) || "/"}${search}${hash}`} replace />;
  if (pathname.startsWith("/embed/")) return <AppRoutes />;
  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  );
}

function App() {
  // Setup global error handler on app mount
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return (
    <ThemeProvider>
      <LangProvider>
      <OrdersProvider>
        <NotificationsProvider>
        <Router>
          <Shell />
        </Router>
        </NotificationsProvider>
      </OrdersProvider>
      </LangProvider>
    </ThemeProvider>
  );
}

export default App;
