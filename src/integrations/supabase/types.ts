export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bancos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          saldo_atual: number
          saldo_inicial: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          saldo_atual?: number
          saldo_inicial?: number
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          saldo_atual?: number
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cartoes_credito: {
        Row: {
          ativo: boolean
          banco_id: string | null
          created_at: string
          dia_fechamento: number
          dia_vencimento: number
          id: string
          limite: number
          limite_usado: number
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          banco_id?: string | null
          created_at?: string
          dia_fechamento: number
          dia_vencimento: number
          id?: string
          limite: number
          limite_usado?: number
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          banco_id?: string | null
          created_at?: string
          dia_fechamento?: number
          dia_vencimento?: number
          id?: string
          limite?: number
          limite_usado?: number
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartoes_credito_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          icone: string | null
          id: string
          nome: string
          tipo: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          tipo: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      faturas_cartao: {
        Row: {
          ano: number
          cartao_credito_id: string
          created_at: string
          data_fechamento: string
          data_vencimento: string
          id: string
          mes: number
          status: string
          updated_at: string
          user_id: string
          valor_pago: number
          valor_total: number
        }
        Insert: {
          ano: number
          cartao_credito_id: string
          created_at?: string
          data_fechamento: string
          data_vencimento: string
          id?: string
          mes: number
          status?: string
          updated_at?: string
          user_id: string
          valor_pago?: number
          valor_total?: number
        }
        Update: {
          ano?: number
          cartao_credito_id?: string
          created_at?: string
          data_fechamento?: string
          data_vencimento?: string
          id?: string
          mes?: number
          status?: string
          updated_at?: string
          user_id?: string
          valor_pago?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturas_cartao_cartao_credito_id_fkey"
            columns: ["cartao_credito_id"]
            isOneToOne: false
            referencedRelation: "cartoes_credito"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          banco_id: string | null
          cartao_credito_id: string | null
          categoria_id: string | null
          created_at: string
          data_transacao: string
          descricao: string
          id: string
          observacoes: string | null
          parcela_atual: number | null
          recorrente: boolean
          tipo: string
          tipo_recorrencia: string | null
          total_parcelas: number | null
          transacao_pai_id: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          banco_id?: string | null
          cartao_credito_id?: string | null
          categoria_id?: string | null
          created_at?: string
          data_transacao: string
          descricao: string
          id?: string
          observacoes?: string | null
          parcela_atual?: number | null
          recorrente?: boolean
          tipo: string
          tipo_recorrencia?: string | null
          total_parcelas?: number | null
          transacao_pai_id?: string | null
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          banco_id?: string | null
          cartao_credito_id?: string | null
          categoria_id?: string | null
          created_at?: string
          data_transacao?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          parcela_atual?: number | null
          recorrente?: boolean
          tipo?: string
          tipo_recorrencia?: string | null
          total_parcelas?: number | null
          transacao_pai_id?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_cartao_credito_id_fkey"
            columns: ["cartao_credito_id"]
            isOneToOne: false
            referencedRelation: "cartoes_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_transacao_pai_id_fkey"
            columns: ["transacao_pai_id"]
            isOneToOne: false
            referencedRelation: "transacoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_categories: {
        Args: { user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
