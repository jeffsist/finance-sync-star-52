import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User as UserIcon, Key, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModalConfiguracoesProps {
  user: User | null;
  children: React.ReactNode;
}

const ModalConfiguracoes = ({ user, children }: ModalConfiguracoesProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState(user?.user_metadata?.nome || "");
  const [email] = useState(user?.email || "");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const { toast } = useToast();

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { nome }
      });

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!novaSenha || !confirmarSenha) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos de senha.",
        variant: "destructive",
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    if (novaSenha.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) throw error;

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
      
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.")) {
      return;
    }

    setLoading(true);
    try {
      // First delete user data from custom tables
      const { error: deleteError } = await supabase
        .from("transacoes")
        .delete()
        .eq("user_id", user?.id);

      if (deleteError) throw deleteError;

      // Delete from other tables as needed
      await supabase.from("bancos").delete().eq("user_id", user?.id);
      await supabase.from("cartoes_credito").delete().eq("user_id", user?.id);
      await supabase.from("categorias").delete().eq("user_id", user?.id);
      await supabase.from("faturas_cartao").delete().eq("user_id", user?.id);

      toast({
        title: "Conta excluída",
        description: "Sua conta e todos os dados foram removidos.",
      });

      // Sign out after deletion
      await supabase.auth.signOut();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações da Conta
          </DialogTitle>
          <DialogDescription>
            Gerencie suas informações pessoais e configurações de segurança.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <Button 
                onClick={handleUpdateProfile} 
                disabled={loading}
                className="w-full md:w-auto"
              >
                Atualizar Perfil
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Segurança
              </CardTitle>
              <CardDescription>
                Altere sua senha de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova Senha</Label>
                  <Input
                    id="nova-senha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-senha">Confirmar Senha</Label>
                  <Input
                    id="confirmar-senha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>
              <Button 
                onClick={handleUpdatePassword} 
                disabled={loading}
                className="w-full md:w-auto"
              >
                Alterar Senha
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Zona de Perigo */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis da conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-destructive rounded-lg">
                  <h4 className="font-medium text-destructive mb-2">Excluir Conta</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Esta ação irá excluir permanentemente sua conta e todos os dados associados.
                    Esta ação não pode ser desfeita.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    disabled={loading}
                  >
                    Excluir Conta Permanentemente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalConfiguracoes;