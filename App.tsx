import { Route, Switch } from "wouter";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import CompareResults from "@/pages/CompareResults";
import NotFound from "@/pages/not-found";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useState } from "react";

function App() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <Layout>
        <Switch>
          <Route path="/" component={() => <Home setIsLoading={setIsLoading} />} />
          <Route path="/compare" component={() => <CompareResults setIsLoading={setIsLoading} />} />
          <Route path="/search" component={() => <CompareResults setIsLoading={setIsLoading} />} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <LoadingOverlay isOpen={isLoading} />
    </>
  );
}

export default App;
