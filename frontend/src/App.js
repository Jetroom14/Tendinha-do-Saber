import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SiteLayout } from "@/components/Layout";
import { CookieBanner } from "@/components/CookieBanner";
import ScrollToTop from "@/components/ScrollToTop";
import TrackingLoader from "@/components/TrackingLoader";

import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import BookDetailPage from "@/pages/BookDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderConfirmationPage from "@/pages/OrderConfirmationPage";
import VouchersPage from "@/pages/VouchersPage";
import PartnersPage from "@/pages/PartnersPage";
import ContactsPage from "@/pages/ContactsPage";
import LegalPage from "@/pages/LegalPage";
import AccountPage from "@/pages/AccountPage";
import { LoginPage, RegisterPage } from "@/pages/AuthPages";
import { AboutPage, FaqPage, VoucherGuidePage, TrackOrderPage, NotFoundPage } from "@/pages/ExtraPages";

import AdminLayout from "@/components/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBooks from "@/pages/admin/AdminBooks";
import AdminImport from "@/pages/admin/AdminImport";
import AdminSchools from "@/pages/admin/AdminSchools";
import { AdminVouchers, AdminOrders, AdminPartners, AdminLogs, AdminSettings, AdminUsers } from "@/pages/admin/AdminOther";
import { AdminCategories, AdminCustomers, AdminPromoCodes, AdminReports, AdminContent } from "@/pages/admin/AdminExtra";
import AdminBrand from "@/pages/admin/AdminBrand";

const Site = ({ children }) => (
  <SiteLayout>{children}</SiteLayout>
);

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Toaster position="top-right" richColors />
            <CookieBanner />
            <ScrollToTop />
            <TrackingLoader />
            <Routes>
            {/* Public site */}
            <Route path="/" element={<Site><HomePage/></Site>}/>
            <Route path="/catalogo" element={<Site><CatalogPage/></Site>}/>
            <Route path="/livro/:isbn13" element={<Site><BookDetailPage/></Site>}/>
            <Route path="/carrinho" element={<Site><CartPage/></Site>}/>
            <Route path="/checkout" element={<Site><CheckoutPage/></Site>}/>
            <Route path="/encomenda/:orderNo" element={<Site><OrderConfirmationPage/></Site>}/>
            <Route path="/seguir-encomenda" element={<Site><TrackOrderPage/></Site>}/>
            <Route path="/vouchers" element={<Site><VouchersPage/></Site>}/>
            <Route path="/como-funciona-voucher" element={<Site><VoucherGuidePage/></Site>}/>
            <Route path="/parceiros" element={<Site><PartnersPage/></Site>}/>
            <Route path="/contactos" element={<Site><ContactsPage/></Site>}/>
            <Route path="/sobre" element={<Site><AboutPage/></Site>}/>
            <Route path="/faq" element={<Site><FaqPage/></Site>}/>
            <Route path="/legal/:slug" element={<Site><LegalPage/></Site>}/>
            <Route path="/login" element={<Site><LoginPage/></Site>}/>
            <Route path="/registar" element={<Site><RegisterPage/></Site>}/>
            <Route path="/minha-conta" element={<Site><AccountPage/></Site>}/>

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout/>}>
              <Route index element={<AdminDashboard/>}/>
              <Route path="livros" element={<AdminBooks/>}/>
              <Route path="categorias" element={<AdminCategories/>}/>
              <Route path="importar" element={<AdminImport/>}/>
              <Route path="escolas" element={<AdminSchools/>}/>
              <Route path="encomendas" element={<AdminOrders/>}/>
              <Route path="clientes" element={<AdminCustomers/>}/>
              <Route path="vouchers" element={<AdminVouchers/>}/>
              <Route path="codigos" element={<AdminPromoCodes/>}/>
              <Route path="parceiros" element={<AdminPartners/>}/>
              <Route path="conteudo" element={<AdminContent/>}/>
              <Route path="brand" element={<AdminBrand/>}/>
              <Route path="relatorios" element={<AdminReports/>}/>
              <Route path="logs" element={<AdminLogs/>}/>
              <Route path="definicoes" element={<AdminSettings/>}/>
              <Route path="utilizadores" element={<AdminUsers/>}/>
            </Route>

            <Route path="*" element={<Site><NotFoundPage/></Site>}/>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
