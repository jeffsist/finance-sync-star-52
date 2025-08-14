// Update this page (the content is just a fallback if you fail to update the page)

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, CreditCard, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-primary">FinControle</h1>
        </div>
        <Button onClick={() => navigate("/auth")}>
          Entrar
        </Button>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-5xl font-bold text-foreground">
            Controle Total das Suas{" "}
            <span className="text-primary">Finanças</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gerencie suas contas, cartões de crédito, faturas e tenha uma visão completa 
            da sua situação financeira em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Começar Agora
            </Button>
            <Button variant="outline" size="lg">
              Ver Demonstração
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Controle de Contas</h3>
            <p className="text-muted-foreground">
              Monitore todas suas contas bancárias em um só lugar. 
              Acompanhe saldo e movimentações em tempo real.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gestão de Cartões</h3>
            <p className="text-muted-foreground">
              Controle cartões de crédito, faturas, parcelamentos e 
              nunca mais perca um vencimento.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Projeção Futura</h3>
            <p className="text-muted-foreground">
              Visualize sua evolução financeira e planeje seu futuro 
              com relatórios detalhados.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Seus dados seguros</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Utilizamos as melhores práticas de segurança para proteger suas informações financeiras. 
            Seus dados são criptografados e jamais compartilhados.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Criar Conta Gratuita
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 FinControle. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
