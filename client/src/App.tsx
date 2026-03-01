import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WalletProvider } from "./contexts/WalletContext";
import Home from "./pages/Home";
import Mine from "./pages/Mine";
import Profile from "./pages/Profile";
import Referrals from "./pages/Referrals";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/mine" component={Mine} />
      <Route path="/profile" component={Profile} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <WalletProvider>
          <TooltipProvider>
            <Toaster
              toastOptions={{
                style: {
                  background: "oklch(0.13 0.02 265 / 90%)",
                  border: "1px solid oklch(0.85 0.18 192 / 20%)",
                  color: "oklch(0.92 0.01 265)",
                  backdropFilter: "blur(20px)",
                },
              }}
            />
            <Router />
          </TooltipProvider>
        </WalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
