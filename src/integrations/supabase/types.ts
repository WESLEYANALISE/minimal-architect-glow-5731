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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_daily_feedback: {
        Row: {
          created_at: string
          data: string
          feedback_text: string
          id: string
        }
        Insert: {
          created_at?: string
          data: string
          feedback_text: string
          id?: string
        }
        Update: {
          created_at?: string
          data?: string
          feedback_text?: string
          id?: string
        }
        Relationships: []
      }
      advogado_blog: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          assistant_name: string
          context: string | null
          created_at: string
          gemini_model: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          max_tokens: number | null
          personality: string | null
          temperature: number | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          assistant_name?: string
          context?: string | null
          created_at?: string
          gemini_model?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_tokens?: number | null
          personality?: string | null
          temperature?: number | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          assistant_name?: string
          context?: string | null
          created_at?: string
          gemini_model?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_tokens?: number | null
          personality?: string | null
          temperature?: number | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      api_rate_limit_tracker: {
        Row: {
          chamadas_ultima_hora: number | null
          chamadas_ultimo_minuto: number | null
          created_at: string | null
          id: string
          reset_hora: string | null
          reset_minuto: string | null
          ultima_chamada: string | null
          updated_at: string | null
        }
        Insert: {
          chamadas_ultima_hora?: number | null
          chamadas_ultimo_minuto?: number | null
          created_at?: string | null
          id?: string
          reset_hora?: string | null
          reset_minuto?: string | null
          ultima_chamada?: string | null
          updated_at?: string | null
        }
        Update: {
          chamadas_ultima_hora?: number | null
          chamadas_ultimo_minuto?: number | null
          created_at?: string | null
          id?: string
          reset_hora?: string | null
          reset_minuto?: string | null
          ultima_chamada?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_token_usage: {
        Row: {
          api_key_index: number | null
          created_at: string
          custo_estimado_brl: number | null
          edge_function: string
          erro: string | null
          id: string
          input_tokens: number | null
          metadata: Json | null
          model: string | null
          output_tokens: number | null
          provider: string | null
          sucesso: boolean | null
          tipo_conteudo: string | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          api_key_index?: number | null
          created_at?: string
          custo_estimado_brl?: number | null
          edge_function: string
          erro?: string | null
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          sucesso?: boolean | null
          tipo_conteudo?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          api_key_index?: number | null
          created_at?: string
          custo_estimado_brl?: number | null
          edge_function?: string
          erro?: string | null
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          sucesso?: boolean | null
          tipo_conteudo?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_rating_tracking: {
        Row: {
          created_at: string | null
          device_type: string | null
          id: string
          last_shown_date: string
          updated_at: string | null
          user_ip: string
          user_rated: boolean | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          last_shown_date?: string
          updated_at?: string | null
          user_ip: string
          user_rated?: boolean | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          last_shown_date?: string
          updated_at?: string | null
          user_ip?: string
          user_rated?: boolean | null
        }
        Relationships: []
      }
      aprofundamento_atualizacoes_log: {
        Row: {
          concluido_at: string | null
          created_at: string | null
          detalhes: Json | null
          erro_mensagem: string | null
          id: string
          registros_atualizados: number | null
          registros_processados: number | null
          status: string
          tipo: string
        }
        Insert: {
          concluido_at?: string | null
          created_at?: string | null
          detalhes?: Json | null
          erro_mensagem?: string | null
          id?: string
          registros_atualizados?: number | null
          registros_processados?: number | null
          status: string
          tipo: string
        }
        Update: {
          concluido_at?: string | null
          created_at?: string | null
          detalhes?: Json | null
          erro_mensagem?: string | null
          id?: string
          registros_atualizados?: number | null
          registros_processados?: number | null
          status?: string
          tipo?: string
        }
        Relationships: []
      }
      aprofundamento_blog: {
        Row: {
          categoria: string | null
          conteudo: string | null
          created_at: string | null
          id: string
          imagem_url: string | null
          instituicao: string
          publicado: boolean | null
          resumo: string | null
          titulo: string
          wikipedia_url: string | null
        }
        Insert: {
          categoria?: string | null
          conteudo?: string | null
          created_at?: string | null
          id?: string
          imagem_url?: string | null
          instituicao: string
          publicado?: boolean | null
          resumo?: string | null
          titulo: string
          wikipedia_url?: string | null
        }
        Update: {
          categoria?: string | null
          conteudo?: string | null
          created_at?: string | null
          id?: string
          imagem_url?: string | null
          instituicao?: string
          publicado?: boolean | null
          resumo?: string | null
          titulo?: string
          wikipedia_url?: string | null
        }
        Relationships: []
      }
      aprofundamento_lattes_cache: {
        Row: {
          created_at: string | null
          id: string
          lattes_id: string | null
          lattes_url: string | null
          membro_id: string | null
          membro_nome: string
          membro_tipo: string
          ultima_atualizacao: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lattes_id?: string | null
          lattes_url?: string | null
          membro_id?: string | null
          membro_nome: string
          membro_tipo: string
          ultima_atualizacao?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lattes_id?: string | null
          lattes_url?: string | null
          membro_id?: string | null
          membro_nome?: string
          membro_tipo?: string
          ultima_atualizacao?: string | null
        }
        Relationships: []
      }
      aprofundamento_membros: {
        Row: {
          ativo: boolean | null
          biografia: string | null
          biografia_detalhada: string | null
          cargo: string | null
          created_at: string | null
          data_posse: string | null
          formacao: string | null
          foto_url: string | null
          foto_wikipedia: string | null
          id: string
          indicado_por: string | null
          instituicao: string
          links_externos: Json | null
          nome: string
          nome_completo: string | null
          obras_publicadas: Json | null
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          biografia?: string | null
          biografia_detalhada?: string | null
          cargo?: string | null
          created_at?: string | null
          data_posse?: string | null
          formacao?: string | null
          foto_url?: string | null
          foto_wikipedia?: string | null
          id?: string
          indicado_por?: string | null
          instituicao: string
          links_externos?: Json | null
          nome: string
          nome_completo?: string | null
          obras_publicadas?: Json | null
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          biografia?: string | null
          biografia_detalhada?: string | null
          cargo?: string | null
          created_at?: string | null
          data_posse?: string | null
          formacao?: string | null
          foto_url?: string | null
          foto_wikipedia?: string | null
          id?: string
          indicado_por?: string | null
          instituicao?: string
          links_externos?: Json | null
          nome?: string
          nome_completo?: string | null
          obras_publicadas?: Json | null
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      aprofundamento_noticias: {
        Row: {
          analise_ia: string | null
          conteudo_formatado: string | null
          created_at: string | null
          data_publicacao: string | null
          descricao: string | null
          fonte: string | null
          id: string
          imagem_url: string | null
          imagem_webp: string | null
          instituicao: string
          processado: boolean | null
          termos: Json | null
          titulo: string
          url: string | null
        }
        Insert: {
          analise_ia?: string | null
          conteudo_formatado?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          fonte?: string | null
          id?: string
          imagem_url?: string | null
          imagem_webp?: string | null
          instituicao: string
          processado?: boolean | null
          termos?: Json | null
          titulo: string
          url?: string | null
        }
        Update: {
          analise_ia?: string | null
          conteudo_formatado?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          fonte?: string | null
          id?: string
          imagem_url?: string | null
          imagem_webp?: string | null
          instituicao?: string
          processado?: boolean | null
          termos?: Json | null
          titulo?: string
          url?: string | null
        }
        Relationships: []
      }
      aprofundamento_obras: {
        Row: {
          ano: number | null
          capa_url: string | null
          created_at: string | null
          descricao: string | null
          editora: string | null
          fonte: string | null
          id: string
          isbn: string | null
          link_compra: string | null
          membro_id: string | null
          tipo_obra: string | null
          titulo: string
        }
        Insert: {
          ano?: number | null
          capa_url?: string | null
          created_at?: string | null
          descricao?: string | null
          editora?: string | null
          fonte?: string | null
          id?: string
          isbn?: string | null
          link_compra?: string | null
          membro_id?: string | null
          tipo_obra?: string | null
          titulo: string
        }
        Update: {
          ano?: number | null
          capa_url?: string | null
          created_at?: string | null
          descricao?: string | null
          editora?: string | null
          fonte?: string | null
          id?: string
          isbn?: string | null
          link_compra?: string | null
          membro_id?: string | null
          tipo_obra?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aprofundamento_obras_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "aprofundamento_membros"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          capa: string | null
          created_at: string | null
          descricao: string | null
          id: number
          nome: string
        }
        Insert: {
          capa?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome: string
        }
        Update: {
          capa?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      artigo_ai_cache: {
        Row: {
          artigo_numero: string
          conteudo: string
          created_at: string
          id: string
          modo: string
          tabela_nome: string
        }
        Insert: {
          artigo_numero: string
          conteudo: string
          created_at?: string
          id?: string
          modo?: string
          tabela_nome: string
        }
        Update: {
          artigo_numero?: string
          conteudo?: string
          created_at?: string
          id?: string
          modo?: string
          tabela_nome?: string
        }
        Relationships: []
      }
      "artigo-editar": {
        Row: {
          artigo: string | null
          id: number
          link: string | null
        }
        Insert: {
          artigo?: string | null
          id?: number
          link?: string | null
        }
        Update: {
          artigo?: string | null
          id?: number
          link?: string | null
        }
        Relationships: []
      }
      artigos_anotacoes: {
        Row: {
          anotacao: string
          artigo_id: number
          created_at: string
          id: string
          numero_artigo: string
          tabela_codigo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anotacao?: string
          artigo_id: number
          created_at?: string
          id?: string
          numero_artigo: string
          tabela_codigo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anotacao?: string
          artigo_id?: number
          created_at?: string
          id?: string
          numero_artigo?: string
          tabela_codigo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      artigos_favoritos: {
        Row: {
          artigo_id: number
          conteudo_preview: string | null
          created_at: string | null
          id: string
          numero_artigo: string
          tabela_codigo: string
          user_id: string
        }
        Insert: {
          artigo_id: number
          conteudo_preview?: string | null
          created_at?: string | null
          id?: string
          numero_artigo: string
          tabela_codigo: string
          user_id: string
        }
        Update: {
          artigo_id?: number
          conteudo_preview?: string | null
          created_at?: string | null
          id?: string
          numero_artigo?: string
          tabela_codigo?: string
          user_id?: string
        }
        Relationships: []
      }
      artigos_grifos: {
        Row: {
          artigo_id: number
          created_at: string | null
          highlights: Json
          id: string
          numero_artigo: string
          tabela_codigo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artigo_id: number
          created_at?: string | null
          highlights?: Json
          id?: string
          numero_artigo: string
          tabela_codigo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artigo_id?: number
          created_at?: string | null
          highlights?: Json
          id?: string
          numero_artigo?: string
          tabela_codigo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      artigos_visualizacoes: {
        Row: {
          id: string
          numero_artigo: string
          origem: string | null
          tabela_codigo: string
          user_id: string | null
          visualizado_em: string
        }
        Insert: {
          id?: string
          numero_artigo: string
          origem?: string | null
          tabela_codigo: string
          user_id?: string | null
          visualizado_em?: string
        }
        Update: {
          id?: string
          numero_artigo?: string
          origem?: string | null
          tabela_codigo?: string
          user_id?: string | null
          visualizado_em?: string
        }
        Relationships: []
      }
      atualizacao_biblioteca: {
        Row: {
          ativo: boolean
          autor: string
          biblioteca: string
          capa_url: string | null
          created_at: string
          id: number
          nome_livro: string
          vezes: number
        }
        Insert: {
          ativo?: boolean
          autor: string
          biblioteca: string
          capa_url?: string | null
          created_at?: string
          id?: never
          nome_livro: string
          vezes?: number
        }
        Update: {
          ativo?: boolean
          autor?: string
          biblioteca?: string
          capa_url?: string | null
          created_at?: string
          id?: never
          nome_livro?: string
          vezes?: number
        }
        Relationships: []
      }
      atualizacao_biblioteca_vistas: {
        Row: {
          atualizacao_id: number
          created_at: string
          id: string
          session_id: string
          user_id: string | null
          vezes_vista: number
        }
        Insert: {
          atualizacao_id: number
          created_at?: string
          id?: string
          session_id: string
          user_id?: string | null
          vezes_vista?: number
        }
        Update: {
          atualizacao_id?: number
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string | null
          vezes_vista?: number
        }
        Relationships: [
          {
            foreignKeyName: "atualizacao_biblioteca_vistas_atualizacao_id_fkey"
            columns: ["atualizacao_id"]
            isOneToOne: false
            referencedRelation: "atualizacao_biblioteca"
            referencedColumns: ["id"]
          },
        ]
      }
      audiencias_analises: {
        Row: {
          created_at: string | null
          decisao_final: string | null
          id: string
          participantes: Json | null
          pontos_discutidos: Json | null
          resumo: string | null
          temas_principais: Json | null
          termos_chave: string[] | null
          tipo_sessao: string | null
          updated_at: string | null
          video_id: string | null
          votos: Json | null
        }
        Insert: {
          created_at?: string | null
          decisao_final?: string | null
          id?: string
          participantes?: Json | null
          pontos_discutidos?: Json | null
          resumo?: string | null
          temas_principais?: Json | null
          termos_chave?: string[] | null
          tipo_sessao?: string | null
          updated_at?: string | null
          video_id?: string | null
          votos?: Json | null
        }
        Update: {
          created_at?: string | null
          decisao_final?: string | null
          id?: string
          participantes?: Json | null
          pontos_discutidos?: Json | null
          resumo?: string | null
          temas_principais?: Json | null
          termos_chave?: string[] | null
          tipo_sessao?: string | null
          updated_at?: string | null
          video_id?: string | null
          votos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audiencias_analises_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "audiencias_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      audiencias_marcadores: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          nota: string | null
          timestamp_segundos: number
          titulo: string
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nota?: string | null
          timestamp_segundos: number
          titulo: string
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nota?: string | null
          timestamp_segundos?: number
          titulo?: string
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiencias_marcadores_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "audiencias_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      audiencias_playlists: {
        Row: {
          canal_id: string | null
          created_at: string
          descricao: string | null
          id: string
          playlist_id: string
          publicado_em: string | null
          thumbnail: string | null
          titulo: string
          updated_at: string
          video_count: number | null
        }
        Insert: {
          canal_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          playlist_id: string
          publicado_em?: string | null
          thumbnail?: string | null
          titulo: string
          updated_at?: string
          video_count?: number | null
        }
        Update: {
          canal_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          playlist_id?: string
          publicado_em?: string | null
          thumbnail?: string | null
          titulo?: string
          updated_at?: string
          video_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audiencias_playlists_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canais_audiencias"
            referencedColumns: ["id"]
          },
        ]
      }
      audiencias_segmentos_embeddings: {
        Row: {
          created_at: string | null
          embedding: string | null
          fim_segundos: number | null
          id: string
          indice_segmento: number
          inicio_segundos: number
          texto: string
          transcricao_id: string | null
          video_id: string
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          fim_segundos?: number | null
          id?: string
          indice_segmento: number
          inicio_segundos: number
          texto: string
          transcricao_id?: string | null
          video_id: string
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          fim_segundos?: number | null
          id?: string
          indice_segmento?: number
          inicio_segundos?: number
          texto?: string
          transcricao_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiencias_segmentos_embeddings_transcricao_id_fkey"
            columns: ["transcricao_id"]
            isOneToOne: false
            referencedRelation: "audiencias_transcricoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiencias_segmentos_embeddings_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "audiencias_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      audiencias_transcricoes: {
        Row: {
          created_at: string | null
          fonte: string | null
          id: string
          idioma: string | null
          segmentos: Json
          updated_at: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          fonte?: string | null
          id?: string
          idioma?: string | null
          segmentos?: Json
          updated_at?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          fonte?: string | null
          id?: string
          idioma?: string | null
          segmentos?: Json
          updated_at?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audiencias_transcricoes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "audiencias_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      audiencias_videos: {
        Row: {
          canal_id: string | null
          created_at: string | null
          descricao: string | null
          duracao_segundos: number | null
          erro_mensagem: string | null
          id: string
          publicado_em: string | null
          status: string | null
          thumbnail: string | null
          titulo: string
          transcricao: string | null
          updated_at: string | null
          video_id: string
        }
        Insert: {
          canal_id?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_segundos?: number | null
          erro_mensagem?: string | null
          id?: string
          publicado_em?: string | null
          status?: string | null
          thumbnail?: string | null
          titulo: string
          transcricao?: string | null
          updated_at?: string | null
          video_id: string
        }
        Update: {
          canal_id?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_segundos?: number | null
          erro_mensagem?: string | null
          id?: string
          publicado_em?: string | null
          status?: string | null
          thumbnail?: string | null
          titulo?: string
          transcricao?: string | null
          updated_at?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiencias_videos_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canais_audiencias"
            referencedColumns: ["id"]
          },
        ]
      }
      AUDIO_FEEDBACK_CACHE: {
        Row: {
          created_at: string | null
          id: number
          tipo: string
          url_audio: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          tipo: string
          url_audio: string
        }
        Update: {
          created_at?: string | null
          id?: number
          tipo?: string
          url_audio?: string
        }
        Relationships: []
      }
      "AUDIO-AULA": {
        Row: {
          area: string | null
          descricao: string | null
          id: number
          imagem_miniatura: string | null
          sequencia: number | null
          tag: string | null
          tema: string | null
          titulo: string | null
          url_audio: string | null
        }
        Insert: {
          area?: string | null
          descricao?: string | null
          id: number
          imagem_miniatura?: string | null
          sequencia?: number | null
          tag?: string | null
          tema?: string | null
          titulo?: string | null
          url_audio?: string | null
        }
        Update: {
          area?: string | null
          descricao?: string | null
          id?: number
          imagem_miniatura?: string | null
          sequencia?: number | null
          tag?: string | null
          tema?: string | null
          titulo?: string | null
          url_audio?: string | null
        }
        Relationships: []
      }
      aulas: {
        Row: {
          area_id: number | null
          assunto: string | null
          capa: string | null
          conteudo: string | null
          created_at: string | null
          id: number
          material: string | null
          modulo_id: number | null
          numero: number
          tema: string | null
          titulo: string
          video: string | null
        }
        Insert: {
          area_id?: number | null
          assunto?: string | null
          capa?: string | null
          conteudo?: string | null
          created_at?: string | null
          id?: number
          material?: string | null
          modulo_id?: number | null
          numero: number
          tema?: string | null
          titulo: string
          video?: string | null
        }
        Update: {
          area_id?: number | null
          assunto?: string | null
          capa?: string | null
          conteudo?: string | null
          created_at?: string | null
          id?: number
          material?: string | null
          modulo_id?: number | null
          numero?: number
          tema?: string | null
          titulo?: string
          video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      "AULAS INTERATIVAS": {
        Row: {
          Conteúdo: string | null
          id: number
          Livro: string | null
        }
        Insert: {
          Conteúdo?: string | null
          id?: number
          Livro?: string | null
        }
        Update: {
          Conteúdo?: string | null
          id?: number
          Livro?: string | null
        }
        Relationships: []
      }
      aulas_artigos: {
        Row: {
          aproveitamento_medio: number | null
          audios: Json | null
          codigo_tabela: string
          conteudo_artigo: string
          created_at: string
          created_by: string | null
          estrutura_completa: Json
          id: string
          numero_artigo: string
          slides_json: Json | null
          updated_at: string
          visualizacoes: number | null
        }
        Insert: {
          aproveitamento_medio?: number | null
          audios?: Json | null
          codigo_tabela: string
          conteudo_artigo: string
          created_at?: string
          created_by?: string | null
          estrutura_completa: Json
          id?: string
          numero_artigo: string
          slides_json?: Json | null
          updated_at?: string
          visualizacoes?: number | null
        }
        Update: {
          aproveitamento_medio?: number | null
          audios?: Json | null
          codigo_tabela?: string
          conteudo_artigo?: string
          created_at?: string
          created_by?: string | null
          estrutura_completa?: Json
          id?: string
          numero_artigo?: string
          slides_json?: Json | null
          updated_at?: string
          visualizacoes?: number | null
        }
        Relationships: []
      }
      aulas_em_tela: {
        Row: {
          area: string
          assunto: string | null
          aula: number
          capa: string | null
          capa_area: string | null
          capa_modulo: string | null
          conteudo: string | null
          created_at: string
          id: number
          material: string | null
          modulo: number
          tema: string | null
          video: string | null
        }
        Insert: {
          area: string
          assunto?: string | null
          aula: number
          capa?: string | null
          capa_area?: string | null
          capa_modulo?: string | null
          conteudo?: string | null
          created_at?: string
          id?: number
          material?: string | null
          modulo: number
          tema?: string | null
          video?: string | null
        }
        Update: {
          area?: string
          assunto?: string | null
          aula?: number
          capa?: string | null
          capa_area?: string | null
          capa_modulo?: string | null
          conteudo?: string | null
          created_at?: string
          id?: number
          material?: string | null
          modulo?: number
          tema?: string | null
          video?: string | null
        }
        Relationships: []
      }
      aulas_em_tela_conteudo_cache: {
        Row: {
          aula_id: number
          created_at: string
          flashcards: Json | null
          id: number
          questoes: Json | null
          updated_at: string
        }
        Insert: {
          aula_id: number
          created_at?: string
          flashcards?: Json | null
          id?: number
          questoes?: Json | null
          updated_at?: string
        }
        Update: {
          aula_id?: number
          created_at?: string
          flashcards?: Json | null
          id?: number
          questoes?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      aulas_geracao_config: {
        Row: {
          id: string
          pausado: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          pausado?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          pausado?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      aulas_geracao_fila: {
        Row: {
          area: string
          biblioteca_id: number
          capa_area_url: string | null
          capa_url: string | null
          created_at: string
          erro_msg: string | null
          id: string
          materia_id: number | null
          pdf_url: string | null
          status: string
          tema: string
          topicos_concluidos: number | null
          topicos_total: number | null
          updated_at: string
        }
        Insert: {
          area: string
          biblioteca_id: number
          capa_area_url?: string | null
          capa_url?: string | null
          created_at?: string
          erro_msg?: string | null
          id?: string
          materia_id?: number | null
          pdf_url?: string | null
          status?: string
          tema: string
          topicos_concluidos?: number | null
          topicos_total?: number | null
          updated_at?: string
        }
        Update: {
          area?: string
          biblioteca_id?: number
          capa_area_url?: string | null
          capa_url?: string | null
          created_at?: string
          erro_msg?: string | null
          id?: string
          materia_id?: number | null
          pdf_url?: string | null
          status?: string
          tema?: string
          topicos_concluidos?: number | null
          topicos_total?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      aulas_interativas: {
        Row: {
          aproveitamento_medio: number | null
          area: string
          created_at: string | null
          descricao: string | null
          estrutura_completa: Json
          id: string
          tema: string
          titulo: string
          updated_at: string | null
          visualizacoes: number | null
        }
        Insert: {
          aproveitamento_medio?: number | null
          area: string
          created_at?: string | null
          descricao?: string | null
          estrutura_completa: Json
          id?: string
          tema: string
          titulo: string
          updated_at?: string | null
          visualizacoes?: number | null
        }
        Update: {
          aproveitamento_medio?: number | null
          area?: string
          created_at?: string | null
          descricao?: string | null
          estrutura_completa?: Json
          id?: string
          tema?: string
          titulo?: string
          updated_at?: string | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      aulas_livros: {
        Row: {
          aproveitamento_medio: number | null
          area: string | null
          created_at: string
          descricao: string | null
          estrutura_completa: Json
          id: string
          livro_id: number
          tema: string
          titulo: string
          updated_at: string
          visualizacoes: number | null
        }
        Insert: {
          aproveitamento_medio?: number | null
          area?: string | null
          created_at?: string
          descricao?: string | null
          estrutura_completa: Json
          id?: string
          livro_id: number
          tema: string
          titulo: string
          updated_at?: string
          visualizacoes?: number | null
        }
        Update: {
          aproveitamento_medio?: number | null
          area?: string | null
          created_at?: string
          descricao?: string | null
          estrutura_completa?: Json
          id?: string
          livro_id?: number
          tema?: string
          titulo?: string
          updated_at?: string
          visualizacoes?: number | null
        }
        Relationships: []
      }
      aulas_progresso: {
        Row: {
          aula_id: string | null
          concluida: boolean | null
          created_at: string | null
          etapa_atual: string | null
          id: string
          modulo_atual: number | null
          nota_prova_final: number | null
          progresso_percentual: number | null
          tempo_total_minutos: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          aula_id?: string | null
          concluida?: boolean | null
          created_at?: string | null
          etapa_atual?: string | null
          id?: string
          modulo_atual?: number | null
          nota_prova_final?: number | null
          progresso_percentual?: number | null
          tempo_total_minutos?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          aula_id?: string | null
          concluida?: boolean | null
          created_at?: string | null
          etapa_atual?: string | null
          id?: string
          modulo_atual?: number | null
          nota_prova_final?: number | null
          progresso_percentual?: number | null
          tempo_total_minutos?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_progresso_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas_interativas"
            referencedColumns: ["id"]
          },
        ]
      }
      automacao_formatacao_leis: {
        Row: {
          ano_atual: number | null
          created_at: string
          dia_atual: number | null
          erros: Json | null
          id: string
          lei_atual_id: string | null
          leis_com_erro: number | null
          leis_processadas: number | null
          leis_total: number | null
          mes_atual: number | null
          status: string
          ultima_lei_processada: string | null
          updated_at: string
        }
        Insert: {
          ano_atual?: number | null
          created_at?: string
          dia_atual?: number | null
          erros?: Json | null
          id?: string
          lei_atual_id?: string | null
          leis_com_erro?: number | null
          leis_processadas?: number | null
          leis_total?: number | null
          mes_atual?: number | null
          status?: string
          ultima_lei_processada?: string | null
          updated_at?: string
        }
        Update: {
          ano_atual?: number | null
          created_at?: string
          dia_atual?: number | null
          erros?: Json | null
          id?: string
          lei_atual_id?: string | null
          leis_com_erro?: number | null
          leis_processadas?: number | null
          leis_total?: number | null
          mes_atual?: number | null
          status?: string
          ultima_lei_processada?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      avaliacoes_recomendacoes: {
        Row: {
          comentario: string | null
          created_at: string
          id: string
          item_data: string
          nota: number | null
          status: string
          tipo: string
          user_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          id?: string
          item_data: string
          nota?: number | null
          status: string
          tipo: string
          user_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          id?: string
          item_data?: string
          nota?: number | null
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      batalha_juridica_cache: {
        Row: {
          area: string
          casos: Json
          created_at: string
          id: string
          tema: string
        }
        Insert: {
          area: string
          casos: Json
          created_at?: string
          id?: string
          tema: string
        }
        Update: {
          area?: string
          casos?: Json
          created_at?: string
          id?: string
          tema?: string
        }
        Relationships: []
      }
      "BIBILIOTECA-OAB": {
        Row: {
          Área: string | null
          aula: string | null
          "Capa-area": string | null
          "Capa-livro": string | null
          Download: string | null
          id: number
          Link: string | null
          Ordem: number | null
          Sobre: string | null
          Tema: string | null
        }
        Insert: {
          Área?: string | null
          aula?: string | null
          "Capa-area"?: string | null
          "Capa-livro"?: string | null
          Download?: string | null
          id: number
          Link?: string | null
          Ordem?: number | null
          Sobre?: string | null
          Tema?: string | null
        }
        Update: {
          Área?: string | null
          aula?: string | null
          "Capa-area"?: string | null
          "Capa-livro"?: string | null
          Download?: string | null
          id?: number
          Link?: string | null
          Ordem?: number | null
          Sobre?: string | null
          Tema?: string | null
        }
        Relationships: []
      }
      biblioteca_classicos_paginas: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: string
          livro_id: number
          pagina: number
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          livro_id: number
          pagina: number
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          livro_id?: number
          pagina?: number
        }
        Relationships: []
      }
      biblioteca_classicos_temas: {
        Row: {
          audio_url: string | null
          capa_url: string | null
          conteudo_markdown: string | null
          correspondencias: Json | null
          created_at: string | null
          exemplos: string | null
          flashcards: Json | null
          id: string
          livro_id: number
          ordem: number
          pagina_final: number | null
          pagina_inicial: number | null
          questoes: Json | null
          resumo: string | null
          status: string | null
          termos: Json | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          capa_url?: string | null
          conteudo_markdown?: string | null
          correspondencias?: Json | null
          created_at?: string | null
          exemplos?: string | null
          flashcards?: Json | null
          id?: string
          livro_id: number
          ordem: number
          pagina_final?: number | null
          pagina_inicial?: number | null
          questoes?: Json | null
          resumo?: string | null
          status?: string | null
          termos?: Json | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          capa_url?: string | null
          conteudo_markdown?: string | null
          correspondencias?: Json | null
          created_at?: string | null
          exemplos?: string | null
          flashcards?: Json | null
          id?: string
          livro_id?: number
          ordem?: number
          pagina_final?: number | null
          pagina_inicial?: number | null
          questoes?: Json | null
          resumo?: string | null
          status?: string | null
          termos?: Json | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      biblioteca_favoritos: {
        Row: {
          biblioteca_tabela: string
          capa_url: string | null
          created_at: string
          id: string
          item_id: number
          titulo: string
          user_id: string
        }
        Insert: {
          biblioteca_tabela: string
          capa_url?: string | null
          created_at?: string
          id?: string
          item_id: number
          titulo: string
          user_id: string
        }
        Update: {
          biblioteca_tabela?: string
          capa_url?: string | null
          created_at?: string
          id?: string
          item_id?: number
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      biblioteca_iniciante: {
        Row: {
          area: string | null
          autor: string | null
          biblioteca_origem: string
          capa: string | null
          created_at: string | null
          id: number
          justificativa: string | null
          livro_id: number
          ordem: number | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          autor?: string | null
          biblioteca_origem: string
          capa?: string | null
          created_at?: string | null
          id?: number
          justificativa?: string | null
          livro_id: number
          ordem?: number | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          autor?: string | null
          biblioteca_origem?: string
          capa?: string | null
          created_at?: string | null
          id?: number
          justificativa?: string | null
          livro_id?: number
          ordem?: number | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      biblioteca_plano_leitura: {
        Row: {
          biblioteca_tabela: string
          capa_url: string | null
          comentario: string | null
          created_at: string
          id: string
          item_id: number
          progresso: number
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          biblioteca_tabela: string
          capa_url?: string | null
          comentario?: string | null
          created_at?: string
          id?: string
          item_id: number
          progresso?: number
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          biblioteca_tabela?: string
          capa_url?: string | null
          comentario?: string | null
          created_at?: string
          id?: string
          item_id?: number
          progresso?: number
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      "BIBLIOTECA-CLASSICOS": {
        Row: {
          analise_status: string | null
          area: string | null
          aula: string | null
          autor: string | null
          beneficios: string | null
          "Capa-area": string | null
          capitulos_gerados: number | null
          download: string | null
          id: number
          imagem: string | null
          link: string | null
          livro: string | null
          questoes_resumo: Json | null
          resumo_capitulos: Json | null
          resumo_gerado_em: string | null
          sobre: string | null
          total_capitulos: number | null
          total_paginas: number | null
          total_temas: number | null
          url_videoaula: string | null
        }
        Insert: {
          analise_status?: string | null
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          capitulos_gerados?: number | null
          download?: string | null
          id: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
          total_capitulos?: number | null
          total_paginas?: number | null
          total_temas?: number | null
          url_videoaula?: string | null
        }
        Update: {
          analise_status?: string | null
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          capitulos_gerados?: number | null
          download?: string | null
          id?: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
          total_capitulos?: number | null
          total_paginas?: number | null
          total_temas?: number | null
          url_videoaula?: string | null
        }
        Relationships: []
      }
      "BIBLIOTECA-CONTRIBUICOES": {
        Row: {
          aprovado: boolean | null
          area: string | null
          autor: string | null
          contribuidor_id: string | null
          created_at: string | null
          download: string | null
          formato: string | null
          id: number
          idioma: string | null
          imagem: string | null
          livro: string
          md5: string | null
          sobre: string | null
          tamanho: string | null
          updated_at: string | null
        }
        Insert: {
          aprovado?: boolean | null
          area?: string | null
          autor?: string | null
          contribuidor_id?: string | null
          created_at?: string | null
          download?: string | null
          formato?: string | null
          id?: number
          idioma?: string | null
          imagem?: string | null
          livro: string
          md5?: string | null
          sobre?: string | null
          tamanho?: string | null
          updated_at?: string | null
        }
        Update: {
          aprovado?: boolean | null
          area?: string | null
          autor?: string | null
          contribuidor_id?: string | null
          created_at?: string | null
          download?: string | null
          formato?: string | null
          id?: number
          idioma?: string | null
          imagem?: string | null
          livro?: string
          md5?: string | null
          sobre?: string | null
          tamanho?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "BIBLIOTECA-ESTUDOS": {
        Row: {
          Área: string | null
          aula: string | null
          "Capa-area": string | null
          "Capa-livro": string | null
          Download: string | null
          id: number
          Link: string | null
          Ordem: number | null
          Sobre: string | null
          Tema: string | null
          url_capa_gerada: string | null
        }
        Insert: {
          Área?: string | null
          aula?: string | null
          "Capa-area"?: string | null
          "Capa-livro"?: string | null
          Download?: string | null
          id: number
          Link?: string | null
          Ordem?: number | null
          Sobre?: string | null
          Tema?: string | null
          url_capa_gerada?: string | null
        }
        Update: {
          Área?: string | null
          aula?: string | null
          "Capa-area"?: string | null
          "Capa-livro"?: string | null
          Download?: string | null
          id?: number
          Link?: string | null
          Ordem?: number | null
          Sobre?: string | null
          Tema?: string | null
          url_capa_gerada?: string | null
        }
        Relationships: []
      }
      "BIBLIOTECA-FORA-DA-TOGA": {
        Row: {
          area: string | null
          aula: string | null
          autor: string | null
          "capa-area": string | null
          "capa-livro": string | null
          download: string | null
          id: number
          link: string | null
          livro: string | null
          sobre: string | null
        }
        Insert: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          "capa-area"?: string | null
          "capa-livro"?: string | null
          download?: string | null
          id: number
          link?: string | null
          livro?: string | null
          sobre?: string | null
        }
        Update: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          "capa-area"?: string | null
          "capa-livro"?: string | null
          download?: string | null
          id?: number
          link?: string | null
          livro?: string | null
          sobre?: string | null
        }
        Relationships: []
      }
      "BIBLIOTECA-LEITURA-DINAMICA": {
        Row: {
          Conteúdo: string | null
          id: number
          Pagina: number | null
          "Titulo da Obra": string | null
          "Titulo do Capitulo": string | null
        }
        Insert: {
          Conteúdo?: string | null
          id?: number
          Pagina?: number | null
          "Titulo da Obra"?: string | null
          "Titulo do Capitulo"?: string | null
        }
        Update: {
          Conteúdo?: string | null
          id?: number
          Pagina?: number | null
          "Titulo da Obra"?: string | null
          "Titulo do Capitulo"?: string | null
        }
        Relationships: []
      }
      "BIBLIOTECA-LIDERANÇA": {
        Row: {
          area: string | null
          aula: string | null
          autor: string | null
          beneficios: string | null
          "Capa-area": string | null
          download: string | null
          id: number
          imagem: string | null
          link: string | null
          livro: string | null
          questoes_resumo: Json | null
          resumo_capitulos: Json | null
          resumo_gerado_em: string | null
          sobre: string | null
        }
        Insert: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          download?: string | null
          id: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
        }
        Update: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          download?: string | null
          id?: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
        }
        Relationships: []
      }
      "BIBLIOTECA-ORATORIA": {
        Row: {
          area: string | null
          aula: string | null
          autor: string | null
          beneficios: string | null
          "Capa-area": string | null
          download: string | null
          id: number
          imagem: string | null
          link: string | null
          livro: string | null
          questoes_resumo: Json | null
          resumo_capitulos: Json | null
          resumo_gerado_em: string | null
          sobre: string | null
        }
        Insert: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          download?: string | null
          id: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
        }
        Update: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          download?: string | null
          id?: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
        }
        Relationships: []
      }
      "BIBLIOTECA-PESQUISA-CIENTIFICA": {
        Row: {
          area: string | null
          aula: string | null
          autor: string | null
          beneficios: string | null
          "Capa-area": string | null
          download: string | null
          id: number
          imagem: string | null
          link: string | null
          livro: string | null
          questoes_resumo: Json | null
          resumo_capitulos: Json | null
          resumo_gerado_em: string | null
          sobre: string | null
        }
        Insert: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          download?: string | null
          id?: never
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
        }
        Update: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          download?: string | null
          id?: never
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
        }
        Relationships: []
      }
      "BIBLIOTECA-POLITICA": {
        Row: {
          area: string | null
          aula: string | null
          autor: string | null
          beneficios: string | null
          "Capa-area": string | null
          capitulos_gerados: number | null
          download: string | null
          id: number
          imagem: string | null
          link: string | null
          livro: string | null
          questoes_resumo: Json | null
          resumo_capitulos: Json | null
          resumo_gerado_em: string | null
          sobre: string | null
          total_capitulos: number | null
        }
        Insert: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          capitulos_gerados?: number | null
          download?: string | null
          id?: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
          total_capitulos?: number | null
        }
        Update: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          capitulos_gerados?: number | null
          download?: string | null
          id?: number
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
          total_capitulos?: number | null
        }
        Relationships: []
      }
      "BIBLIOTECA-PORTUGUES": {
        Row: {
          area: string | null
          aula: string | null
          autor: string | null
          beneficios: string | null
          "Capa-area": string | null
          download: string | null
          id: number
          imagem: string | null
          link: string | null
          livro: string | null
          questoes_resumo: Json | null
          resumo_capitulos: Json | null
          resumo_gerado_em: string | null
          sobre: string | null
        }
        Insert: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          download?: string | null
          id?: never
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
        }
        Update: {
          area?: string | null
          aula?: string | null
          autor?: string | null
          beneficios?: string | null
          "Capa-area"?: string | null
          download?: string | null
          id?: never
          imagem?: string | null
          link?: string | null
          livro?: string | null
          questoes_resumo?: Json | null
          resumo_capitulos?: Json | null
          resumo_gerado_em?: string | null
          sobre?: string | null
        }
        Relationships: []
      }
      bibliotecas_acessos: {
        Row: {
          area: string | null
          biblioteca_tabela: string
          capa_url: string | null
          created_at: string | null
          id: string
          item_id: number
          livro: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          area?: string | null
          biblioteca_tabela: string
          capa_url?: string | null
          created_at?: string | null
          id?: string
          item_id: number
          livro?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          area?: string | null
          biblioteca_tabela?: string
          capa_url?: string | null
          created_at?: string | null
          id?: string
          item_id?: number
          livro?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blogger_agronegocio: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_bancario: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_camara: {
        Row: {
          cache_validade: string | null
          conteudo_descomplicado: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_audio_descomplicado: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_comparado: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_compliance: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_constitucional: {
        Row: {
          cache_validade: string | null
          conteudo_descomplicado: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_audio_descomplicado: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_contratual: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_desportivo: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_digital: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_energia: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_faculdade: {
        Row: {
          cache_validade: string | null
          conteudo_descomplicado: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_audio_descomplicado: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_familia: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_filosofia: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_financeiro: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_hermeneutica: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_imobiliario: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_internacional_privado: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_internacional_publico: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      BLOGGER_JURIDICO: {
        Row: {
          cache_validade: string | null
          categoria: string
          conteudo_descomplicado: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte: string | null
          fontes_referencia: string[] | null
          gerado_em: string | null
          id: number
          imagem_wikipedia: string | null
          ordem: number
          termo_wikipedia: string | null
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_audio_descomplicado: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          categoria: string
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte?: string | null
          fontes_referencia?: string[] | null
          gerado_em?: string | null
          id?: number
          imagem_wikipedia?: string | null
          ordem: number
          termo_wikipedia?: string | null
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          categoria?: string
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte?: string | null
          fontes_referencia?: string[] | null
          gerado_em?: string | null
          id?: number
          imagem_wikipedia?: string | null
          ordem?: number
          termo_wikipedia?: string | null
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_jurisprudencia: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_lgpd: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_maritimo: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_mediacao: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_militar: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_politico: {
        Row: {
          cache_validade: string | null
          categoria: string
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte: string | null
          fontes_referencia: string[] | null
          gerado_em: string | null
          id: number
          imagem_wikipedia: string | null
          ordem: number | null
          termo_wikipedia: string | null
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          categoria: string
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte?: string | null
          fontes_referencia?: string[] | null
          gerado_em?: string | null
          id?: number
          imagem_wikipedia?: string | null
          ordem?: number | null
          termo_wikipedia?: string | null
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          categoria?: string
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte?: string | null
          fontes_referencia?: string[] | null
          gerado_em?: string | null
          id?: number
          imagem_wikipedia?: string | null
          ordem?: number | null
          termo_wikipedia?: string | null
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_pratica_juridica: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_previdenciario: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_processo_civil: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_processo_penal: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_processo_trabalho: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_saude: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_senado: {
        Row: {
          cache_validade: string | null
          conteudo_descomplicado: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_audio_descomplicado: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_sociologia: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_startups: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_stf: {
        Row: {
          cache_validade: string | null
          conteudo_descomplicado: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_audio_descomplicado: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_sucessoes: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_tribunais: {
        Row: {
          cache_validade: string | null
          conteudo_descomplicado: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_audio_descomplicado: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      blogger_urbanistico: {
        Row: {
          cache_validade: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          fonte_url: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          fonte_url?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      busca_leis_historico: {
        Row: {
          created_at: string | null
          id: string
          termo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          termo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          termo?: string
          user_id?: string
        }
        Relationships: []
      }
      "CA - Código de Águas": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      cache_camara_deputados: {
        Row: {
          chave_cache: string
          created_at: string | null
          dados: Json
          expira_em: string | null
          id: number
          tipo_cache: string
          total_registros: number | null
          updated_at: string | null
          versao: number | null
        }
        Insert: {
          chave_cache: string
          created_at?: string | null
          dados: Json
          expira_em?: string | null
          id?: number
          tipo_cache: string
          total_registros?: number | null
          updated_at?: string | null
          versao?: number | null
        }
        Update: {
          chave_cache?: string
          created_at?: string | null
          dados?: Json
          expira_em?: string | null
          id?: number
          tipo_cache?: string
          total_registros?: number | null
          updated_at?: string | null
          versao?: number | null
        }
        Relationships: []
      }
      cache_candidatos_tse: {
        Row: {
          ano: number
          created_at: string | null
          dados: Json
          id: number
          sq_candidato: number
          uf: string
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          dados: Json
          id?: number
          sq_candidato: number
          uf: string
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          dados?: Json
          id?: number
          sq_candidato?: number
          uf?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cache_definicoes_termos: {
        Row: {
          created_at: string
          definicao: string
          exemplo_pratico: string | null
          id: string
          termo: string
          termo_normalizado: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definicao: string
          exemplo_pratico?: string | null
          id?: string
          termo: string
          termo_normalizado: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definicao?: string
          exemplo_pratico?: string | null
          id?: string
          termo?: string
          termo_normalizado?: string
          updated_at?: string
        }
        Relationships: []
      }
      cache_estatisticas_cnj: {
        Row: {
          created_at: string
          dados: Json
          id: string
          periodo: string | null
          ramo_justica: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dados: Json
          id?: string
          periodo?: string | null
          ramo_justica?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dados?: Json
          id?: string
          periodo?: string | null
          ramo_justica?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      cache_explicacoes_estatisticas: {
        Row: {
          created_at: string | null
          dados_hash: string
          explicacao: string
          id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dados_hash: string
          explicacao: string
          id?: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dados_hash?: string
          explicacao?: string
          id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cache_imagens_webp: {
        Row: {
          altura: number | null
          created_at: string | null
          id: string
          largura: number | null
          preset: string | null
          tamanho_original: number | null
          tamanho_webp: number | null
          url_original: string
          url_webp: string
        }
        Insert: {
          altura?: number | null
          created_at?: string | null
          id?: string
          largura?: number | null
          preset?: string | null
          tamanho_original?: number | null
          tamanho_webp?: number | null
          url_original: string
          url_webp: string
        }
        Update: {
          altura?: number | null
          created_at?: string | null
          id?: string
          largura?: number | null
          preset?: string | null
          tamanho_original?: number | null
          tamanho_webp?: number | null
          url_original?: string
          url_webp?: string
        }
        Relationships: []
      }
      cache_leis_raspadas: {
        Row: {
          analise_lacunas: Json | null
          artigos_com_lacunas: number | null
          created_at: string
          fontes_usadas: string[] | null
          hash_conteudo: string | null
          id: string
          metodo_final: number | null
          nome_tabela: string
          percentual_extracao: number | null
          relatorio_raspagem: string | null
          total_artigos: number
          updated_at: string
          url_planalto: string | null
        }
        Insert: {
          analise_lacunas?: Json | null
          artigos_com_lacunas?: number | null
          created_at?: string
          fontes_usadas?: string[] | null
          hash_conteudo?: string | null
          id?: string
          metodo_final?: number | null
          nome_tabela: string
          percentual_extracao?: number | null
          relatorio_raspagem?: string | null
          total_artigos?: number
          updated_at?: string
          url_planalto?: string | null
        }
        Update: {
          analise_lacunas?: Json | null
          artigos_com_lacunas?: number | null
          created_at?: string
          fontes_usadas?: string[] | null
          hash_conteudo?: string | null
          id?: string
          metodo_final?: number | null
          nome_tabela?: string
          percentual_extracao?: number | null
          relatorio_raspagem?: string | null
          total_artigos?: number
          updated_at?: string
          url_planalto?: string | null
        }
        Relationships: []
      }
      cache_leis_recentes: {
        Row: {
          areas_direito: string[] | null
          autor_principal: string | null
          created_at: string | null
          dados_completos: Json | null
          data_publicacao: string
          ementa: string
          id: string
          link_texto_integral: string | null
          numero: string
          resumo_ia: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          areas_direito?: string[] | null
          autor_principal?: string | null
          created_at?: string | null
          dados_completos?: Json | null
          data_publicacao: string
          ementa: string
          id: string
          link_texto_integral?: string | null
          numero: string
          resumo_ia?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          areas_direito?: string[] | null
          autor_principal?: string | null
          created_at?: string | null
          dados_completos?: Json | null
          data_publicacao?: string
          ementa?: string
          id?: string
          link_texto_integral?: string | null
          numero?: string
          resumo_ia?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cache_pesquisas: {
        Row: {
          created_at: string
          id: number
          resultados: Json
          termo_pesquisado: string
          total_resultados: number
          updated_at: string
          versao: number
        }
        Insert: {
          created_at?: string
          id?: never
          resultados?: Json
          termo_pesquisado: string
          total_resultados?: number
          updated_at?: string
          versao?: number
        }
        Update: {
          created_at?: string
          id?: never
          resultados?: Json
          termo_pesquisado?: string
          total_resultados?: number
          updated_at?: string
          versao?: number
        }
        Relationships: []
      }
      cache_plp_recentes: {
        Row: {
          ano: number
          autor_principal_foto: string | null
          autor_principal_id: string | null
          autor_principal_nome: string | null
          autor_principal_partido: string | null
          autor_principal_uf: string | null
          autores_completos: Json | null
          data_apresentacao: string | null
          ementa: string | null
          id: number
          id_proposicao: number
          keywords: Json | null
          numero: number
          ordem_cache: number | null
          orgao_tramitacao: string | null
          quantidade_votacoes: number | null
          sigla_tipo: string
          situacao: string | null
          status: string | null
          tema: string | null
          titulo_gerado_ia: string | null
          updated_at: string | null
          url_inteiro_teor: string | null
        }
        Insert: {
          ano: number
          autor_principal_foto?: string | null
          autor_principal_id?: string | null
          autor_principal_nome?: string | null
          autor_principal_partido?: string | null
          autor_principal_uf?: string | null
          autores_completos?: Json | null
          data_apresentacao?: string | null
          ementa?: string | null
          id?: number
          id_proposicao: number
          keywords?: Json | null
          numero: number
          ordem_cache?: number | null
          orgao_tramitacao?: string | null
          quantidade_votacoes?: number | null
          sigla_tipo: string
          situacao?: string | null
          status?: string | null
          tema?: string | null
          titulo_gerado_ia?: string | null
          updated_at?: string | null
          url_inteiro_teor?: string | null
        }
        Update: {
          ano?: number
          autor_principal_foto?: string | null
          autor_principal_id?: string | null
          autor_principal_nome?: string | null
          autor_principal_partido?: string | null
          autor_principal_uf?: string | null
          autores_completos?: Json | null
          data_apresentacao?: string | null
          ementa?: string | null
          id?: number
          id_proposicao?: number
          keywords?: Json | null
          numero?: number
          ordem_cache?: number | null
          orgao_tramitacao?: string | null
          quantidade_votacoes?: number | null
          sigla_tipo?: string
          situacao?: string | null
          status?: string | null
          tema?: string | null
          titulo_gerado_ia?: string | null
          updated_at?: string | null
          url_inteiro_teor?: string | null
        }
        Relationships: []
      }
      cache_proposicoes_progresso: {
        Row: {
          created_at: string | null
          data: string
          finalizado: boolean | null
          id: string
          sigla_tipo: string
          total_processados: number | null
          ultima_pagina: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          finalizado?: boolean | null
          id?: string
          sigla_tipo: string
          total_processados?: number | null
          ultima_pagina?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          finalizado?: boolean | null
          id?: string
          sigla_tipo?: string
          total_processados?: number | null
          ultima_pagina?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cache_proposicoes_recentes: {
        Row: {
          ano: number
          autor_principal_foto: string | null
          autor_principal_id: number | null
          autor_principal_nome: string | null
          autor_principal_partido: string | null
          autor_principal_uf: string | null
          autores_completos: Json | null
          created_at: string | null
          data_apresentacao: string | null
          ementa: string
          id: number
          id_proposicao: number
          keywords: string[] | null
          numero: number
          ordem_cache: number | null
          orgao_tramitacao: string | null
          quantidade_votacoes: number | null
          resumo_executivo_ia: string | null
          sigla_tipo: string
          situacao: string | null
          status: string | null
          tema: string | null
          titulo_gerado_ia: string | null
          updated_at: string | null
          url_inteiro_teor: string | null
          votacoes: Json | null
        }
        Insert: {
          ano: number
          autor_principal_foto?: string | null
          autor_principal_id?: number | null
          autor_principal_nome?: string | null
          autor_principal_partido?: string | null
          autor_principal_uf?: string | null
          autores_completos?: Json | null
          created_at?: string | null
          data_apresentacao?: string | null
          ementa: string
          id?: number
          id_proposicao: number
          keywords?: string[] | null
          numero: number
          ordem_cache?: number | null
          orgao_tramitacao?: string | null
          quantidade_votacoes?: number | null
          resumo_executivo_ia?: string | null
          sigla_tipo: string
          situacao?: string | null
          status?: string | null
          tema?: string | null
          titulo_gerado_ia?: string | null
          updated_at?: string | null
          url_inteiro_teor?: string | null
          votacoes?: Json | null
        }
        Update: {
          ano?: number
          autor_principal_foto?: string | null
          autor_principal_id?: number | null
          autor_principal_nome?: string | null
          autor_principal_partido?: string | null
          autor_principal_uf?: string | null
          autores_completos?: Json | null
          created_at?: string | null
          data_apresentacao?: string | null
          ementa?: string
          id?: number
          id_proposicao?: number
          keywords?: string[] | null
          numero?: number
          ordem_cache?: number | null
          orgao_tramitacao?: string | null
          quantidade_votacoes?: number | null
          resumo_executivo_ia?: string | null
          sigla_tipo?: string
          situacao?: string | null
          status?: string | null
          tema?: string | null
          titulo_gerado_ia?: string | null
          updated_at?: string | null
          url_inteiro_teor?: string | null
          votacoes?: Json | null
        }
        Relationships: []
      }
      cakto_webhook_logs: {
        Row: {
          amount: number | null
          created_at: string
          customer_email: string | null
          erro: string | null
          event: string
          id: string
          order_id: string | null
          payload: Json
          payment_method: string | null
          processado: boolean
          product_name: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          customer_email?: string | null
          erro?: string | null
          event: string
          id?: string
          order_id?: string | null
          payload: Json
          payment_method?: string | null
          processado?: boolean
          product_name?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          customer_email?: string | null
          erro?: string | null
          event?: string
          id?: string
          order_id?: string | null
          payload?: Json
          payment_method?: string | null
          processado?: boolean
          product_name?: string | null
        }
        Relationships: []
      }
      calendario_oab: {
        Row: {
          atualizado_em: string | null
          created_at: string | null
          edital_complementar: string | null
          exame_numero: number
          exame_titulo: string
          id: string
          inscricao_fim: string | null
          inscricao_inicio: string | null
          observacoes: string | null
          prova_primeira_fase: string | null
          prova_segunda_fase: string | null
          publicacao_edital: string | null
          reaproveitamento_fim: string | null
          reaproveitamento_inicio: string | null
        }
        Insert: {
          atualizado_em?: string | null
          created_at?: string | null
          edital_complementar?: string | null
          exame_numero: number
          exame_titulo: string
          id?: string
          inscricao_fim?: string | null
          inscricao_inicio?: string | null
          observacoes?: string | null
          prova_primeira_fase?: string | null
          prova_segunda_fase?: string | null
          publicacao_edital?: string | null
          reaproveitamento_fim?: string | null
          reaproveitamento_inicio?: string | null
        }
        Update: {
          atualizado_em?: string | null
          created_at?: string | null
          edital_complementar?: string | null
          exame_numero?: number
          exame_titulo?: string
          id?: string
          inscricao_fim?: string | null
          inscricao_inicio?: string | null
          observacoes?: string | null
          prova_primeira_fase?: string | null
          prova_segunda_fase?: string | null
          publicacao_edital?: string | null
          reaproveitamento_fim?: string | null
          reaproveitamento_inicio?: string | null
        }
        Relationships: []
      }
      canais_audiencias: {
        Row: {
          ativo: boolean | null
          channel_id: string
          created_at: string | null
          id: string
          nome: string
          playlist_id: string | null
          tribunal: string
          ultima_verificacao: string | null
          updated_at: string | null
          url_canal: string | null
        }
        Insert: {
          ativo?: boolean | null
          channel_id: string
          created_at?: string | null
          id?: string
          nome: string
          playlist_id?: string | null
          tribunal: string
          ultima_verificacao?: string | null
          updated_at?: string | null
          url_canal?: string | null
        }
        Update: {
          ativo?: boolean | null
          channel_id?: string
          created_at?: string | null
          id?: string
          nome?: string
          playlist_id?: string | null
          tribunal?: string
          ultima_verificacao?: string | null
          updated_at?: string | null
          url_canal?: string | null
        }
        Relationships: []
      }
      "CAPA-BIBILIOTECA": {
        Row: {
          Biblioteca: string | null
          capa: string | null
          id: number
        }
        Insert: {
          Biblioteca?: string | null
          capa?: string | null
          id: number
        }
        Update: {
          Biblioteca?: string | null
          capa?: string | null
          id?: number
        }
        Relationships: []
      }
      carreiras_capas: {
        Row: {
          carreira: string
          created_at: string
          id: string
          updated_at: string
          url_capa: string | null
        }
        Insert: {
          carreira: string
          created_at?: string
          id?: string
          updated_at?: string
          url_capa?: string | null
        }
        Update: {
          carreira?: string
          created_at?: string
          id?: string
          updated_at?: string
          url_capa?: string | null
        }
        Relationships: []
      }
      categorias_materia_paginas: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: number
          materia_id: number
          pagina: number
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: number
          materia_id: number
          pagina: number
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: number
          materia_id?: number
          pagina?: number
        }
        Relationships: [
          {
            foreignKeyName: "categorias_materia_paginas_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "categorias_materias"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_materias: {
        Row: {
          ativo: boolean | null
          capa_url: string | null
          categoria: string
          created_at: string | null
          descricao: string | null
          id: number
          nome: string
          ordem: number | null
          pdf_url: string | null
          status_processamento: string | null
          temas_identificados: Json | null
          total_paginas: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          capa_url?: string | null
          categoria: string
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome: string
          ordem?: number | null
          pdf_url?: string | null
          status_processamento?: string | null
          temas_identificados?: Json | null
          total_paginas?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          capa_url?: string | null
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome?: string
          ordem?: number | null
          pdf_url?: string | null
          status_processamento?: string | null
          temas_identificados?: Json | null
          total_paginas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_progresso: {
        Row: {
          created_at: string | null
          flashcards_concluidos: boolean | null
          id: string
          leitura_concluida: boolean | null
          materia_id: number | null
          pagina_leitura: number | null
          questoes_concluidas: boolean | null
          topico_id: number | null
          total_paginas: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          flashcards_concluidos?: boolean | null
          id?: string
          leitura_concluida?: boolean | null
          materia_id?: number | null
          pagina_leitura?: number | null
          questoes_concluidas?: boolean | null
          topico_id?: number | null
          total_paginas?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          flashcards_concluidos?: boolean | null
          id?: string
          leitura_concluida?: boolean | null
          materia_id?: number | null
          pagina_leitura?: number | null
          questoes_concluidas?: boolean | null
          topico_id?: number | null
          total_paginas?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_progresso_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "categorias_materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_progresso_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "categorias_topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_topico_paginas: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: number
          pagina: number
          topico_id: number
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: number
          pagina: number
          topico_id: number
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: number
          pagina?: number
          topico_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "categorias_topico_paginas_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "categorias_topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_topicos: {
        Row: {
          capa_url: string | null
          capa_versao: number | null
          conteudo_gerado: Json | null
          created_at: string | null
          descricao: string | null
          exemplos: Json | null
          flashcards: Json | null
          id: number
          materia_id: number
          ordem: number | null
          pagina_final: number | null
          pagina_inicial: number | null
          posicao_fila: number | null
          progresso: number | null
          questoes: Json | null
          status: string | null
          subtopicos: Json | null
          tentativas: number | null
          termos: Json | null
          titulo: string
          updated_at: string | null
          url_narracao: string | null
        }
        Insert: {
          capa_url?: string | null
          capa_versao?: number | null
          conteudo_gerado?: Json | null
          created_at?: string | null
          descricao?: string | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          materia_id: number
          ordem?: number | null
          pagina_final?: number | null
          pagina_inicial?: number | null
          posicao_fila?: number | null
          progresso?: number | null
          questoes?: Json | null
          status?: string | null
          subtopicos?: Json | null
          tentativas?: number | null
          termos?: Json | null
          titulo: string
          updated_at?: string | null
          url_narracao?: string | null
        }
        Update: {
          capa_url?: string | null
          capa_versao?: number | null
          conteudo_gerado?: Json | null
          created_at?: string | null
          descricao?: string | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          materia_id?: number
          ordem?: number | null
          pagina_final?: number | null
          pagina_inicial?: number | null
          posicao_fila?: number | null
          progresso?: number | null
          questoes?: Json | null
          status?: string | null
          subtopicos?: Json | null
          tentativas?: number | null
          termos?: Json | null
          titulo?: string
          updated_at?: string | null
          url_narracao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_topicos_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "categorias_materias"
            referencedColumns: ["id"]
          },
        ]
      }
      "CBA Código Brasileiro de Aeronáutica": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CBT Código Brasileiro de Telecomunicações": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CC - Código Civil": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CC - Código de Caça": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CCOM – Código Comercial": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CDC – Código de Defesa do Consumidor": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CDM – Código de Minas": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CDUS - Código de Defesa do Usuário": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CE – Código Eleitoral": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CF - Código Florestal": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CF - Constituição Federal": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      chat_professora_historico: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          mode: string | null
          role: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          mode?: string | null
          role: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          mode?: string | null
          role?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_professora_historico_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "professora_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_professora_historico_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_recovery_log: {
        Row: {
          created_at: string
          fields_count: number | null
          fields_filled: Json | null
          id: string
          mensagem_tipo: string | null
          plan_type: string | null
          telefone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fields_count?: number | null
          fields_filled?: Json | null
          id?: string
          mensagem_tipo?: string | null
          plan_type?: string | null
          telefone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          fields_count?: number | null
          fields_filled?: Json | null
          id?: string
          mensagem_tipo?: string | null
          plan_type?: string | null
          telefone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      "CLT - Consolidação das Leis do Trabalho": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      codigos_capas: {
        Row: {
          capa_prompt: string | null
          capa_url: string | null
          codigo_nome: string
          codigo_tabela: string
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          capa_prompt?: string | null
          capa_url?: string | null
          codigo_nome: string
          codigo_tabela: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          capa_prompt?: string | null
          capa_url?: string | null
          codigo_nome?: string
          codigo_tabela?: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      COMPLETE_LEI_CACHE: {
        Row: {
          area: string
          artigo: string
          created_at: string | null
          id: number
          lacunas: Json
          palavras: Json
          texto_com_lacunas: string
        }
        Insert: {
          area: string
          artigo: string
          created_at?: string | null
          id?: number
          lacunas: Json
          palavras: Json
          texto_com_lacunas: string
        }
        Update: {
          area?: string
          artigo?: string
          created_at?: string | null
          id?: number
          lacunas?: Json
          palavras?: Json
          texto_com_lacunas?: string
        }
        Relationships: []
      }
      conceitos_batch_jobs: {
        Row: {
          completed_at: string | null
          completed_items: number
          created_at: string
          error_message: string | null
          id: string
          input_file_uri: string | null
          items_data: Json | null
          job_name: string
          materia_id: number | null
          output_file_uri: string | null
          results_data: Json | null
          status: string
          tipo: string
          topico_id: number | null
          total_items: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_items?: number
          created_at?: string
          error_message?: string | null
          id?: string
          input_file_uri?: string | null
          items_data?: Json | null
          job_name: string
          materia_id?: number | null
          output_file_uri?: string | null
          results_data?: Json | null
          status?: string
          tipo: string
          topico_id?: number | null
          total_items?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_items?: number
          created_at?: string
          error_message?: string | null
          id?: string
          input_file_uri?: string | null
          items_data?: Json | null
          job_name?: string
          materia_id?: number | null
          output_file_uri?: string | null
          results_data?: Json | null
          status?: string
          tipo?: string
          topico_id?: number | null
          total_items?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conceitos_batch_jobs_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "conceitos_materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conceitos_batch_jobs_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "conceitos_topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      conceitos_livro_paginas: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: string
          pagina: number
          trilha: string
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          pagina: number
          trilha: string
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          pagina?: number
          trilha?: string
        }
        Relationships: []
      }
      conceitos_livro_temas: {
        Row: {
          audio_url: string | null
          capa_url: string | null
          conteudo: string | null
          conteudo_markdown: string | null
          created_at: string | null
          exemplos: string | null
          flashcards: Json | null
          id: string
          ordem: number
          pagina_final: number | null
          pagina_inicial: number | null
          questoes: Json | null
          resumo: string | null
          status: string | null
          subtopicos: Json | null
          termos: Json | null
          titulo: string
          trilha: string
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          capa_url?: string | null
          conteudo?: string | null
          conteudo_markdown?: string | null
          created_at?: string | null
          exemplos?: string | null
          flashcards?: Json | null
          id?: string
          ordem: number
          pagina_final?: number | null
          pagina_inicial?: number | null
          questoes?: Json | null
          resumo?: string | null
          status?: string | null
          subtopicos?: Json | null
          termos?: Json | null
          titulo: string
          trilha: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          capa_url?: string | null
          conteudo?: string | null
          conteudo_markdown?: string | null
          created_at?: string | null
          exemplos?: string | null
          flashcards?: Json | null
          id?: string
          ordem?: number
          pagina_final?: number | null
          pagina_inicial?: number | null
          questoes?: Json | null
          resumo?: string | null
          status?: string | null
          subtopicos?: Json | null
          termos?: Json | null
          titulo?: string
          trilha?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conceitos_materia_paginas: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: number
          materia_id: number | null
          pagina: number
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: number
          materia_id?: number | null
          pagina: number
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: number
          materia_id?: number | null
          pagina?: number
        }
        Relationships: [
          {
            foreignKeyName: "conceitos_materia_paginas_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "conceitos_materias"
            referencedColumns: ["id"]
          },
        ]
      }
      conceitos_materias: {
        Row: {
          area: string
          area_ordem: number
          ativo: boolean | null
          capa_url: string | null
          carga_horaria: number | null
          codigo: string
          created_at: string | null
          ementa: string | null
          id: number
          indice_bruto: string | null
          nome: string
          ordem: number | null
          pdf_url: string | null
          status_processamento: string | null
          temas_identificados: Json | null
          total_paginas: number | null
          url_fonte: string | null
        }
        Insert: {
          area: string
          area_ordem: number
          ativo?: boolean | null
          capa_url?: string | null
          carga_horaria?: number | null
          codigo: string
          created_at?: string | null
          ementa?: string | null
          id?: number
          indice_bruto?: string | null
          nome: string
          ordem?: number | null
          pdf_url?: string | null
          status_processamento?: string | null
          temas_identificados?: Json | null
          total_paginas?: number | null
          url_fonte?: string | null
        }
        Update: {
          area?: string
          area_ordem?: number
          ativo?: boolean | null
          capa_url?: string | null
          carga_horaria?: number | null
          codigo?: string
          created_at?: string | null
          ementa?: string | null
          id?: number
          indice_bruto?: string | null
          nome?: string
          ordem?: number | null
          pdf_url?: string | null
          status_processamento?: string | null
          temas_identificados?: Json | null
          total_paginas?: number | null
          url_fonte?: string | null
        }
        Relationships: []
      }
      conceitos_termos_definicoes: {
        Row: {
          contexto: string | null
          created_at: string
          definicao: string
          id: string
          termo: string
          updated_at: string
        }
        Insert: {
          contexto?: string | null
          created_at?: string
          definicao: string
          id?: string
          termo: string
          updated_at?: string
        }
        Update: {
          contexto?: string | null
          created_at?: string
          definicao?: string
          id?: string
          termo?: string
          updated_at?: string
        }
        Relationships: []
      }
      conceitos_topico_paginas: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: string
          pagina: number
          topico_id: number
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          pagina: number
          topico_id: number
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          pagina?: number
          topico_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "conceitos_topico_paginas_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "conceitos_topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      conceitos_topicos: {
        Row: {
          capa_url: string | null
          complemento: string | null
          conteudo_gerado: string | null
          created_at: string | null
          exemplos: Json | null
          flashcards: Json | null
          id: number
          materia_id: number | null
          ordem: number
          pagina_final: number | null
          pagina_inicial: number | null
          posicao_fila: number | null
          progresso: number | null
          questoes: Json | null
          slides_json: Json | null
          status: string | null
          subtopicos: Json | null
          tentativas: number | null
          termos: Json | null
          titulo: string
          topicos_indice: Json | null
          updated_at: string | null
          url_narracao: string | null
        }
        Insert: {
          capa_url?: string | null
          complemento?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          materia_id?: number | null
          ordem: number
          pagina_final?: number | null
          pagina_inicial?: number | null
          posicao_fila?: number | null
          progresso?: number | null
          questoes?: Json | null
          slides_json?: Json | null
          status?: string | null
          subtopicos?: Json | null
          tentativas?: number | null
          termos?: Json | null
          titulo: string
          topicos_indice?: Json | null
          updated_at?: string | null
          url_narracao?: string | null
        }
        Update: {
          capa_url?: string | null
          complemento?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          materia_id?: number | null
          ordem?: number
          pagina_final?: number | null
          pagina_inicial?: number | null
          posicao_fila?: number | null
          progresso?: number | null
          questoes?: Json | null
          slides_json?: Json | null
          status?: string | null
          subtopicos?: Json | null
          tentativas?: number | null
          termos?: Json | null
          titulo?: string
          topicos_indice?: Json | null
          updated_at?: string | null
          url_narracao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conceitos_topicos_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "conceitos_materias"
            referencedColumns: ["id"]
          },
        ]
      }
      conceitos_topicos_progresso: {
        Row: {
          created_at: string | null
          flashcards_completos: boolean | null
          id: string
          leitura_completa: boolean | null
          pratica_completa: boolean | null
          progresso_porcentagem: number | null
          topico_id: number
          ultimo_topico_lido: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          flashcards_completos?: boolean | null
          id?: string
          leitura_completa?: boolean | null
          pratica_completa?: boolean | null
          progresso_porcentagem?: number | null
          topico_id: number
          ultimo_topico_lido?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          flashcards_completos?: boolean | null
          id?: string
          leitura_completa?: boolean | null
          pratica_completa?: boolean | null
          progresso_porcentagem?: number | null
          topico_id?: number
          ultimo_topico_lido?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conceitos_topicos_progresso_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "conceitos_topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      conceitos_trilhas: {
        Row: {
          ativo: boolean | null
          capa_url: string | null
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          pdf_url: string | null
          status: string | null
          total_paginas: number | null
          total_temas: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          capa_url?: string | null
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          pdf_url?: string | null
          status?: string | null
          total_paginas?: number | null
          total_temas?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          capa_url?: string | null
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          pdf_url?: string | null
          status?: string | null
          total_paginas?: number | null
          total_temas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      CONCURSOS_ABERTOS: {
        Row: {
          conteudo: string | null
          created_at: string | null
          data_publicacao: string | null
          descricao: string | null
          estado: string | null
          id: string
          imagem: string | null
          link: string
          regiao: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          imagem?: string | null
          link: string
          regiao?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          imagem?: string | null
          link?: string
          regiao?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      CONFIGURACOES_IA: {
        Row: {
          ativo: boolean | null
          chave_api_nome: string
          created_at: string | null
          id: number
          modelo: string
          nome_servico: string
          tipo: string
          updated_at: string | null
          uso_descricao: string
          voz_genero: string | null
        }
        Insert: {
          ativo?: boolean | null
          chave_api_nome: string
          created_at?: string | null
          id?: number
          modelo: string
          nome_servico: string
          tipo: string
          updated_at?: string | null
          uso_descricao: string
          voz_genero?: string | null
        }
        Update: {
          ativo?: boolean | null
          chave_api_nome?: string
          created_at?: string | null
          id?: number
          modelo?: string
          nome_servico?: string
          tipo?: string
          updated_at?: string | null
          uso_descricao?: string
          voz_genero?: string | null
        }
        Relationships: []
      }
      conquistas_usuario: {
        Row: {
          conquistado_em: string
          descricao: string | null
          icone: string | null
          id: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          conquistado_em?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          conquistado_em?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      conteudo_geracao_config: {
        Row: {
          id: string
          pausado: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          pausado?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          pausado?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conteudo_geracao_fila: {
        Row: {
          area: string
          created_at: string | null
          erro_msg: string | null
          id: string
          itens_gerados: number | null
          status: string
          tema: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          area: string
          created_at?: string | null
          erro_msg?: string | null
          id?: string
          itens_gerados?: number | null
          status?: string
          tema: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          area?: string
          created_at?: string | null
          erro_msg?: string | null
          id?: string
          itens_gerados?: number | null
          status?: string
          tema?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conteudo_oab_revisao: {
        Row: {
          area: string | null
          conteudo_original: string
          created_at: string | null
          id: string
          pagina_final: number | null
          pagina_inicial: number | null
          subtema: string
          tema: string
          topico_id: number | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          conteudo_original: string
          created_at?: string | null
          id?: string
          pagina_final?: number | null
          pagina_inicial?: number | null
          subtema: string
          tema: string
          topico_id?: number | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          conteudo_original?: string
          created_at?: string | null
          id?: string
          pagina_final?: number | null
          pagina_inicial?: number | null
          subtema?: string
          tema?: string
          topico_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "CP - Código de Pesca": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CP - Código Penal": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CPC – Código de Processo Civil": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CPI - Código de Propriedade Industrial": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CPM – Código Penal Militar": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CPP – Código de Processo Penal": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CPPM – Código de Processo Penal Militar": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CTB Código de Trânsito Brasileiro": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "CTN – Código Tributário Nacional": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      CURSOS: {
        Row: {
          Area: string | null
          Assunto: string | null
          Aula: number | null
          capa: string | null
          "capa-area": string | null
          "capa-modulo": string | null
          conteudo: string | null
          id: number
          material: string | null
          Modulo: number | null
          Tema: string | null
          video: string | null
        }
        Insert: {
          Area?: string | null
          Assunto?: string | null
          Aula?: number | null
          capa?: string | null
          "capa-area"?: string | null
          "capa-modulo"?: string | null
          conteudo?: string | null
          id: number
          material?: string | null
          Modulo?: number | null
          Tema?: string | null
          video?: string | null
        }
        Update: {
          Area?: string | null
          Assunto?: string | null
          Aula?: number | null
          capa?: string | null
          "capa-area"?: string | null
          "capa-modulo"?: string | null
          conteudo?: string | null
          id?: number
          material?: string | null
          Modulo?: number | null
          Tema?: string | null
          video?: string | null
        }
        Relationships: []
      }
      cursos_flashcards: {
        Row: {
          content_hash: string
          created_at: string | null
          curso_id: number
          flashcards_json: Json
          id: string
        }
        Insert: {
          content_hash: string
          created_at?: string | null
          curso_id: number
          flashcards_json: Json
          id?: string
        }
        Update: {
          content_hash?: string
          created_at?: string | null
          curso_id?: number
          flashcards_json?: Json
          id?: string
        }
        Relationships: []
      }
      cursos_progresso: {
        Row: {
          area: string
          aula_id: string
          comentario: string | null
          concluida: boolean
          concluida_em: string | null
          created_at: string
          id: string
          nota_feedback: number | null
          user_id: string
        }
        Insert: {
          area: string
          aula_id: string
          comentario?: string | null
          concluida?: boolean
          concluida_em?: string | null
          created_at?: string
          id?: string
          nota_feedback?: number | null
          user_id: string
        }
        Update: {
          area?: string
          aula_id?: string
          comentario?: string | null
          concluida?: boolean
          concluida_em?: string | null
          created_at?: string
          id?: string
          nota_feedback?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_progresso_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas_interativas"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos_questoes: {
        Row: {
          content_hash: string
          created_at: string | null
          curso_id: number
          id: string
          questoes_json: Json
        }
        Insert: {
          content_hash: string
          created_at?: string | null
          curso_id: number
          id?: string
          questoes_json: Json
        }
        Update: {
          content_hash?: string
          created_at?: string | null
          curso_id?: number
          id?: string
          questoes_json?: Json
        }
        Relationships: []
      }
      "CURSOS-APP": {
        Row: {
          area: string | null
          "aula-link": string | null
          "capa-aula": string | null
          conteudo: string | null
          conteudo_gerado_em: string | null
          "conteudo-final": string | null
          descricao_gerada_em: string | null
          "descricao-aula": string | null
          flashcards: Json | null
          id: number
          ordem: string | null
          questoes: Json | null
          tema: string | null
        }
        Insert: {
          area?: string | null
          "aula-link"?: string | null
          "capa-aula"?: string | null
          conteudo?: string | null
          conteudo_gerado_em?: string | null
          "conteudo-final"?: string | null
          descricao_gerada_em?: string | null
          "descricao-aula"?: string | null
          flashcards?: Json | null
          id?: number
          ordem?: string | null
          questoes?: Json | null
          tema?: string | null
        }
        Update: {
          area?: string | null
          "aula-link"?: string | null
          "capa-aula"?: string | null
          conteudo?: string | null
          conteudo_gerado_em?: string | null
          "conteudo-final"?: string | null
          descricao_gerada_em?: string | null
          "descricao-aula"?: string | null
          flashcards?: Json | null
          id?: number
          ordem?: string | null
          questoes?: Json | null
          tema?: string | null
        }
        Relationships: []
      }
      "DECRETO 1171 - ETICA SERVIDOR": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      deputados_cache: {
        Row: {
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          id: number
          legislatura: number | null
          nome: string
          nome_civil: string | null
          sexo: string | null
          sigla_partido: string | null
          sigla_uf: string | null
          situacao: string | null
          updated_at: string | null
          uri: string | null
          url_foto: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          id: number
          legislatura?: number | null
          nome: string
          nome_civil?: string | null
          sexo?: string | null
          sigla_partido?: string | null
          sigla_uf?: string | null
          situacao?: string | null
          updated_at?: string | null
          uri?: string | null
          url_foto?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          id?: number
          legislatura?: number | null
          nome?: string
          nome_civil?: string | null
          sexo?: string | null
          sigla_partido?: string | null
          sigla_uf?: string | null
          situacao?: string | null
          updated_at?: string | null
          uri?: string | null
          url_foto?: string | null
        }
        Relationships: []
      }
      deputados_favoritos: {
        Row: {
          created_at: string | null
          deputado_foto: string | null
          deputado_id: number
          deputado_nome: string | null
          deputado_partido: string | null
          deputado_uf: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deputado_foto?: string | null
          deputado_id: number
          deputado_nome?: string | null
          deputado_partido?: string | null
          deputado_uf?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          deputado_foto?: string | null
          deputado_id?: number
          deputado_nome?: string | null
          deputado_partido?: string | null
          deputado_uf?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      deputados_gastos_ranking: {
        Row: {
          ano: number
          deputado_id: number | null
          id: string
          mes: number | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          ano: number
          deputado_id?: number | null
          id?: string
          mes?: number | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          ano?: number
          deputado_id?: number | null
          id?: string
          mes?: number | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deputados_gastos_ranking_deputado_id_fkey"
            columns: ["deputado_id"]
            isOneToOne: false
            referencedRelation: "deputados_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      deputados_populares: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          deputado_id: number
          foto_url: string | null
          id: string
          nome: string
          ordem: number | null
          partido: string | null
          uf: string | null
          updated_at: string | null
          visualizacoes: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          deputado_id: number
          foto_url?: string | null
          id?: string
          nome: string
          ordem?: number | null
          partido?: string | null
          uf?: string | null
          updated_at?: string | null
          visualizacoes?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          deputado_id?: number
          foto_url?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          partido?: string | null
          uf?: string | null
          updated_at?: string | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      deputados_ranking: {
        Row: {
          acessos: number | null
          deputado_id: number | null
          id: string
          periodo: string | null
          updated_at: string | null
        }
        Insert: {
          acessos?: number | null
          deputado_id?: number | null
          id?: string
          periodo?: string | null
          updated_at?: string | null
        }
        Update: {
          acessos?: number | null
          deputado_id?: number | null
          id?: string
          periodo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deputados_ranking_deputado_id_fkey"
            columns: ["deputado_id"]
            isOneToOne: false
            referencedRelation: "deputados_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      desafio_participantes: {
        Row: {
          completado_em: string | null
          created_at: string
          desafio_id: string
          id: string
          pontuacao: number
          user_id: string
        }
        Insert: {
          completado_em?: string | null
          created_at?: string
          desafio_id: string
          id?: string
          pontuacao?: number
          user_id: string
        }
        Update: {
          completado_em?: string | null
          created_at?: string
          desafio_id?: string
          id?: string
          pontuacao?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "desafio_participantes_desafio_id_fkey"
            columns: ["desafio_id"]
            isOneToOne: false
            referencedRelation: "desafios_semanais"
            referencedColumns: ["id"]
          },
        ]
      }
      desafios_semanais: {
        Row: {
          ativo: boolean
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          pontos: number
          tema: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          pontos?: number
          tema?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          pontos?: number
          tema?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      dicas_do_dia: {
        Row: {
          area_livro: string | null
          audio_duracao_segundos: number | null
          audio_url: string | null
          biblioteca: string
          created_at: string
          data: string
          dica_estudo: string | null
          frase_dia: string | null
          id: number
          imagens_conteudo: string[] | null
          liberado_em: string | null
          livro_autor: string | null
          livro_capa: string | null
          livro_id: number
          livro_sobre: string | null
          livro_titulo: string
          porque_ler: string
          status: string
        }
        Insert: {
          area_livro?: string | null
          audio_duracao_segundos?: number | null
          audio_url?: string | null
          biblioteca: string
          created_at?: string
          data: string
          dica_estudo?: string | null
          frase_dia?: string | null
          id?: number
          imagens_conteudo?: string[] | null
          liberado_em?: string | null
          livro_autor?: string | null
          livro_capa?: string | null
          livro_id: number
          livro_sobre?: string | null
          livro_titulo: string
          porque_ler?: string
          status?: string
        }
        Update: {
          area_livro?: string | null
          audio_duracao_segundos?: number | null
          audio_url?: string | null
          biblioteca?: string
          created_at?: string
          data?: string
          dica_estudo?: string | null
          frase_dia?: string | null
          id?: number
          imagens_conteudo?: string[] | null
          liberado_em?: string | null
          livro_autor?: string | null
          livro_capa?: string | null
          livro_id?: number
          livro_sobre?: string | null
          livro_titulo?: string
          porque_ler?: string
          status?: string
        }
        Relationships: []
      }
      DICIONARIO: {
        Row: {
          exemplo_pratico: string | null
          exemplo_pratico_gerado_em: string | null
          Letra: string | null
          Palavra: string | null
          Significado: string | null
        }
        Insert: {
          exemplo_pratico?: string | null
          exemplo_pratico_gerado_em?: string | null
          Letra?: string | null
          Palavra?: string | null
          Significado?: string | null
        }
        Update: {
          exemplo_pratico?: string | null
          exemplo_pratico_gerado_em?: string | null
          Letra?: string | null
          Palavra?: string | null
          Significado?: string | null
        }
        Relationships: []
      }
      dispositivos_fcm: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          device_info: Json | null
          fcm_token: string
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          device_info?: Json | null
          fcm_token: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          device_info?: Json | null
          fcm_token?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      "DL 3688 - CONTRAVENCOES PENAIS": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      documentarios_juridicos: {
        Row: {
          analise_ia: string | null
          canal_id: string | null
          canal_nome: string | null
          capa_webp: string | null
          categoria: string | null
          created_at: string | null
          descricao: string | null
          duracao: string | null
          id: string
          publicado_em: string | null
          questoes: Json | null
          questoes_dinamicas: Json | null
          sobre_texto: string | null
          thumbnail: string | null
          titulo: string
          transcricao: Json | null
          transcricao_texto: string | null
          updated_at: string | null
          video_id: string
          visualizacoes: number | null
        }
        Insert: {
          analise_ia?: string | null
          canal_id?: string | null
          canal_nome?: string | null
          capa_webp?: string | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao?: string | null
          id?: string
          publicado_em?: string | null
          questoes?: Json | null
          questoes_dinamicas?: Json | null
          sobre_texto?: string | null
          thumbnail?: string | null
          titulo: string
          transcricao?: Json | null
          transcricao_texto?: string | null
          updated_at?: string | null
          video_id: string
          visualizacoes?: number | null
        }
        Update: {
          analise_ia?: string | null
          canal_id?: string | null
          canal_nome?: string | null
          capa_webp?: string | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao?: string | null
          id?: string
          publicado_em?: string | null
          questoes?: Json | null
          questoes_dinamicas?: Json | null
          sobre_texto?: string | null
          thumbnail?: string | null
          titulo?: string
          transcricao?: Json | null
          transcricao_texto?: string | null
          updated_at?: string | null
          video_id?: string
          visualizacoes?: number | null
        }
        Relationships: []
      }
      documentarios_ministros: {
        Row: {
          cenas: Json
          created_at: string
          duracao_total: number | null
          erro_mensagem: string | null
          id: string
          imagens_disponiveis: Json | null
          ministro_nome: string
          status: string | null
          texto_completo: string | null
          updated_at: string
          url_audio_completo: string | null
        }
        Insert: {
          cenas?: Json
          created_at?: string
          duracao_total?: number | null
          erro_mensagem?: string | null
          id?: string
          imagens_disponiveis?: Json | null
          ministro_nome: string
          status?: string | null
          texto_completo?: string | null
          updated_at?: string
          url_audio_completo?: string | null
        }
        Update: {
          cenas?: Json
          created_at?: string
          duracao_total?: number | null
          erro_mensagem?: string | null
          id?: string
          imagens_disponiveis?: Json | null
          ministro_nome?: string
          status?: string | null
          texto_completo?: string | null
          updated_at?: string
          url_audio_completo?: string | null
        }
        Relationships: []
      }
      dominando_areas: {
        Row: {
          ativo: boolean | null
          capa_url: string | null
          created_at: string | null
          id: number
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean | null
          capa_url?: string | null
          created_at?: string | null
          id?: number
          nome: string
          ordem: number
        }
        Update: {
          ativo?: boolean | null
          capa_url?: string | null
          created_at?: string | null
          id?: number
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      dominando_conteudo: {
        Row: {
          area: string
          audio_url: string | null
          conteudo_markdown: string | null
          created_at: string | null
          disciplina_id: number
          flashcards: Json | null
          id: string
          introducao: string | null
          questoes: Json | null
          tema: string
          termos: Json | null
          updated_at: string | null
        }
        Insert: {
          area: string
          audio_url?: string | null
          conteudo_markdown?: string | null
          created_at?: string | null
          disciplina_id: number
          flashcards?: Json | null
          id?: string
          introducao?: string | null
          questoes?: Json | null
          tema: string
          termos?: Json | null
          updated_at?: string | null
        }
        Update: {
          area?: string
          audio_url?: string | null
          conteudo_markdown?: string | null
          created_at?: string | null
          disciplina_id?: number
          flashcards?: Json | null
          id?: string
          introducao?: string | null
          questoes?: Json | null
          tema?: string
          termos?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dominando_progresso: {
        Row: {
          area: string
          concluido: boolean | null
          created_at: string | null
          disciplina_id: number
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          area: string
          concluido?: boolean | null
          created_at?: string | null
          disciplina_id: number
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          area?: string
          concluido?: boolean | null
          created_at?: string | null
          disciplina_id?: number
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      eleitorado_perfil: {
        Row: {
          ano_referencia: number | null
          created_at: string | null
          escolaridade: string | null
          faixa_etaria: string | null
          genero: string | null
          id: number
          municipio: string | null
          quantidade: number
          uf: string
        }
        Insert: {
          ano_referencia?: number | null
          created_at?: string | null
          escolaridade?: string | null
          faixa_etaria?: string | null
          genero?: string | null
          id?: number
          municipio?: string | null
          quantidade: number
          uf: string
        }
        Update: {
          ano_referencia?: number | null
          created_at?: string | null
          escolaridade?: string | null
          faixa_etaria?: string | null
          genero?: string | null
          id?: number
          municipio?: string | null
          quantidade?: number
          uf?: string
        }
        Relationships: []
      }
      "EST - Estatuto da Juventude": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto da Metrópole": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto da Migração": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto da MPE": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto da Terra": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto do Desporto": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto do Índio": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto do Refugiado": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto dos Militares": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto Magistério Superior": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto Pessoa com Câncer": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "EST - Estatuto Segurança Privada": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "ESTAGIO-BLOG": {
        Row: {
          artigo_melhorado: string | null
          cache_validade: string | null
          Capa: string | null
          gerado_em: string | null
          Link: string | null
          Nº: number
          Título: string | null
        }
        Insert: {
          artigo_melhorado?: string | null
          cache_validade?: string | null
          Capa?: string | null
          gerado_em?: string | null
          Link?: string | null
          Nº: number
          Título?: string | null
        }
        Update: {
          artigo_melhorado?: string | null
          cache_validade?: string | null
          Capa?: string | null
          gerado_em?: string | null
          Link?: string | null
          Nº?: number
          Título?: string | null
        }
        Relationships: []
      }
      estagios_dicas: {
        Row: {
          categoria: string
          conteudo: string
          created_at: string | null
          icone: string | null
          id: string
          ordem: number | null
          titulo: string
        }
        Insert: {
          categoria: string
          conteudo: string
          created_at?: string | null
          icone?: string | null
          id?: string
          ordem?: number | null
          titulo: string
        }
        Update: {
          categoria?: string
          conteudo?: string
          created_at?: string | null
          icone?: string | null
          id?: string
          ordem?: number | null
          titulo?: string
        }
        Relationships: []
      }
      estagios_favoritos: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vaga_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vaga_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estagios_favoritos_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "estagios_vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      estagios_vagas: {
        Row: {
          area_direito: string | null
          ativo: boolean | null
          beneficios: string | null
          carga_horaria: string | null
          created_at: string | null
          data_publicacao: string | null
          descricao: string | null
          empresa: string
          estado: string | null
          id: string
          link_candidatura: string | null
          local: string | null
          origem: string | null
          remuneracao: string | null
          requisitos: string[] | null
          tipo_vaga: string | null
          titulo: string
        }
        Insert: {
          area_direito?: string | null
          ativo?: boolean | null
          beneficios?: string | null
          carga_horaria?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          empresa: string
          estado?: string | null
          id?: string
          link_candidatura?: string | null
          local?: string | null
          origem?: string | null
          remuneracao?: string | null
          requisitos?: string[] | null
          tipo_vaga?: string | null
          titulo: string
        }
        Update: {
          area_direito?: string | null
          ativo?: boolean | null
          beneficios?: string | null
          carga_horaria?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          empresa?: string
          estado?: string | null
          id?: string
          link_candidatura?: string | null
          local?: string | null
          origem?: string | null
          remuneracao?: string | null
          requisitos?: string[] | null
          tipo_vaga?: string | null
          titulo?: string
        }
        Relationships: []
      }
      "ESTATUTO - CIDADE": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "ESTATUTO - DESARMAMENTO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "ESTATUTO - ECA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "ESTATUTO - IDOSO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "ESTATUTO - IGUALDADE RACIAL": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "ESTATUTO - OAB": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "ESTATUTO - PESSOA COM DEFICIÊNCIA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "ESTATUTO - TORCEDOR": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      evelyn_api_keys: {
        Row: {
          api_key: string
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          permissoes: Json | null
          rate_limit: number | null
          total_requests: number | null
          ultimo_uso: string | null
        }
        Insert: {
          api_key: string
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          permissoes?: Json | null
          rate_limit?: number | null
          total_requests?: number | null
          ultimo_uso?: string | null
        }
        Update: {
          api_key?: string
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          permissoes?: Json | null
          rate_limit?: number | null
          total_requests?: number | null
          ultimo_uso?: string | null
        }
        Relationships: []
      }
      evelyn_config: {
        Row: {
          api_key_hash: string | null
          ativo: boolean | null
          created_at: string | null
          estilo_resposta: string | null
          evolution_url: string | null
          feedback_audio_interativo: boolean | null
          fontes_ativas: Json | null
          id: string
          instance_name: string
          limite_caracteres: number | null
          nivel_detalhamento: string | null
          pairing_code: string | null
          perguntar_nome_inicio: boolean | null
          personalidade: string | null
          prompt_sistema: string | null
          qr_code: string | null
          recomendar_livros: boolean | null
          saudacao_horario: boolean | null
          status: string | null
          telefone_conectado: string | null
          temperatura: number | null
          updated_at: string | null
          usar_nome: boolean | null
          welcome_message: string | null
        }
        Insert: {
          api_key_hash?: string | null
          ativo?: boolean | null
          created_at?: string | null
          estilo_resposta?: string | null
          evolution_url?: string | null
          feedback_audio_interativo?: boolean | null
          fontes_ativas?: Json | null
          id?: string
          instance_name: string
          limite_caracteres?: number | null
          nivel_detalhamento?: string | null
          pairing_code?: string | null
          perguntar_nome_inicio?: boolean | null
          personalidade?: string | null
          prompt_sistema?: string | null
          qr_code?: string | null
          recomendar_livros?: boolean | null
          saudacao_horario?: boolean | null
          status?: string | null
          telefone_conectado?: string | null
          temperatura?: number | null
          updated_at?: string | null
          usar_nome?: boolean | null
          welcome_message?: string | null
        }
        Update: {
          api_key_hash?: string | null
          ativo?: boolean | null
          created_at?: string | null
          estilo_resposta?: string | null
          evolution_url?: string | null
          feedback_audio_interativo?: boolean | null
          fontes_ativas?: Json | null
          id?: string
          instance_name?: string
          limite_caracteres?: number | null
          nivel_detalhamento?: string | null
          pairing_code?: string | null
          perguntar_nome_inicio?: boolean | null
          personalidade?: string | null
          prompt_sistema?: string | null
          qr_code?: string | null
          recomendar_livros?: boolean | null
          saudacao_horario?: boolean | null
          status?: string | null
          telefone_conectado?: string | null
          temperatura?: number | null
          updated_at?: string | null
          usar_nome?: boolean | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      evelyn_conversas: {
        Row: {
          aguardando_nome: boolean | null
          contexto: Json | null
          created_at: string | null
          id: string
          instance_name: string | null
          remote_jid: string | null
          status: string | null
          telefone: string
          tema_atual: string | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          aguardando_nome?: boolean | null
          contexto?: Json | null
          created_at?: string | null
          id?: string
          instance_name?: string | null
          remote_jid?: string | null
          status?: string | null
          telefone: string
          tema_atual?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          aguardando_nome?: boolean | null
          contexto?: Json | null
          created_at?: string | null
          id?: string
          instance_name?: string | null
          remote_jid?: string | null
          status?: string | null
          telefone?: string
          tema_atual?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evelyn_conversas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "evelyn_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      evelyn_eventos_externos: {
        Row: {
          created_at: string | null
          erro: string | null
          id: string
          payload: Json
          processado: boolean | null
          processado_at: string | null
          resultado: Json | null
          tipo_evento: string
        }
        Insert: {
          created_at?: string | null
          erro?: string | null
          id?: string
          payload: Json
          processado?: boolean | null
          processado_at?: string | null
          resultado?: Json | null
          tipo_evento: string
        }
        Update: {
          created_at?: string | null
          erro?: string | null
          id?: string
          payload?: Json
          processado?: boolean | null
          processado_at?: string | null
          resultado?: Json | null
          tipo_evento?: string
        }
        Relationships: []
      }
      evelyn_feedback: {
        Row: {
          comentario: string | null
          conversa_id: string | null
          created_at: string | null
          id: string
          mensagem_id: string | null
          pergunta_original: string | null
          resposta_avaliada: string | null
          tipo_feedback: string
          usuario_id: string | null
        }
        Insert: {
          comentario?: string | null
          conversa_id?: string | null
          created_at?: string | null
          id?: string
          mensagem_id?: string | null
          pergunta_original?: string | null
          resposta_avaliada?: string | null
          tipo_feedback: string
          usuario_id?: string | null
        }
        Update: {
          comentario?: string | null
          conversa_id?: string | null
          created_at?: string | null
          id?: string
          mensagem_id?: string | null
          pergunta_original?: string | null
          resposta_avaliada?: string | null
          tipo_feedback?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evelyn_feedback_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "evelyn_conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evelyn_feedback_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "evelyn_mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evelyn_feedback_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "evelyn_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      evelyn_grupos_noticias: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          grupo_id: string
          id: string
          instance_name: string | null
          nome_grupo: string
          quantidade_noticias: number | null
          tipos_noticias: string[] | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          grupo_id: string
          id?: string
          instance_name?: string | null
          nome_grupo: string
          quantidade_noticias?: number | null
          tipos_noticias?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          grupo_id?: string
          id?: string
          instance_name?: string | null
          nome_grupo?: string
          quantidade_noticias?: number | null
          tipos_noticias?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      evelyn_lid_mapping: {
        Row: {
          created_at: string | null
          id: string
          lid: string
          push_name: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lid: string
          push_name?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lid?: string
          push_name?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      evelyn_memoria_usuario: {
        Row: {
          chave: string
          created_at: string | null
          id: string
          metadata: Json | null
          relevancia: number | null
          tipo: string | null
          updated_at: string | null
          usuario_id: string | null
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          relevancia?: number | null
          tipo?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          relevancia?: number | null
          tipo?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evelyn_memoria_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "evelyn_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      evelyn_mensagens: {
        Row: {
          conteudo: string | null
          conversa_id: string | null
          created_at: string | null
          feedback: string | null
          id: string
          metadata: Json | null
          processado: boolean | null
          remetente: string
          tipo: string
        }
        Insert: {
          conteudo?: string | null
          conversa_id?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          metadata?: Json | null
          processado?: boolean | null
          remetente: string
          tipo: string
        }
        Update: {
          conteudo?: string | null
          conversa_id?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          metadata?: Json | null
          processado?: boolean | null
          remetente?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evelyn_mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "evelyn_conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      evelyn_mensagens_processadas: {
        Row: {
          created_at: string
          message_id: string
          remote_jid: string
        }
        Insert: {
          created_at?: string
          message_id: string
          remote_jid: string
        }
        Update: {
          created_at?: string
          message_id?: string
          remote_jid?: string
        }
        Relationships: []
      }
      evelyn_noticias_enviadas: {
        Row: {
          enviada_em: string | null
          grupo_id: string
          id: string
          noticia_id: string
          tipo: string
          titulo: string | null
        }
        Insert: {
          enviada_em?: string | null
          grupo_id: string
          id?: string
          noticia_id: string
          tipo: string
          titulo?: string | null
        }
        Update: {
          enviada_em?: string | null
          grupo_id?: string
          id?: string
          noticia_id?: string
          tipo?: string
          titulo?: string | null
        }
        Relationships: []
      }
      evelyn_notificacoes_log: {
        Row: {
          conteudo_resumo: string | null
          created_at: string | null
          erro: string | null
          id: string
          status: string
          telefone: string
          tipo: string
        }
        Insert: {
          conteudo_resumo?: string | null
          created_at?: string | null
          erro?: string | null
          id?: string
          status?: string
          telefone: string
          tipo: string
        }
        Update: {
          conteudo_resumo?: string | null
          created_at?: string | null
          erro?: string | null
          id?: string
          status?: string
          telefone?: string
          tipo?: string
        }
        Relationships: []
      }
      evelyn_preferencias_notificacao: {
        Row: {
          areas_video: string[] | null
          ativo: boolean | null
          created_at: string | null
          horario_envio: string | null
          id: string
          receber_atualizacoes_leis: boolean | null
          receber_boletim_diario: boolean | null
          receber_dica_estudo: boolean | null
          receber_filme_dia: boolean | null
          receber_jurisprudencia: boolean | null
          receber_leis_dia: boolean | null
          receber_livro_dia: boolean | null
          receber_noticias_concursos: boolean | null
          receber_novas_leis: boolean | null
          receber_novidades: boolean | null
          receber_resumo_dia: boolean | null
          receber_video_resumo: boolean | null
          telefone: string
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          areas_video?: string[] | null
          ativo?: boolean | null
          created_at?: string | null
          horario_envio?: string | null
          id?: string
          receber_atualizacoes_leis?: boolean | null
          receber_boletim_diario?: boolean | null
          receber_dica_estudo?: boolean | null
          receber_filme_dia?: boolean | null
          receber_jurisprudencia?: boolean | null
          receber_leis_dia?: boolean | null
          receber_livro_dia?: boolean | null
          receber_noticias_concursos?: boolean | null
          receber_novas_leis?: boolean | null
          receber_novidades?: boolean | null
          receber_resumo_dia?: boolean | null
          receber_video_resumo?: boolean | null
          telefone: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          areas_video?: string[] | null
          ativo?: boolean | null
          created_at?: string | null
          horario_envio?: string | null
          id?: string
          receber_atualizacoes_leis?: boolean | null
          receber_boletim_diario?: boolean | null
          receber_dica_estudo?: boolean | null
          receber_filme_dia?: boolean | null
          receber_jurisprudencia?: boolean | null
          receber_leis_dia?: boolean | null
          receber_livro_dia?: boolean | null
          receber_noticias_concursos?: boolean | null
          receber_novas_leis?: boolean | null
          receber_novidades?: boolean | null
          receber_resumo_dia?: boolean | null
          receber_video_resumo?: boolean | null
          telefone?: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evelyn_preferencias_notificacao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "evelyn_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      evelyn_progresso_usuario: {
        Row: {
          area: string
          artigos_estudados: number | null
          created_at: string | null
          flashcards_corretos: number | null
          flashcards_errados: number | null
          id: string
          nivel: string | null
          quizzes_corretos: number | null
          quizzes_errados: number | null
          tema: string | null
          ultimo_estudo: string | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          area: string
          artigos_estudados?: number | null
          created_at?: string | null
          flashcards_corretos?: number | null
          flashcards_errados?: number | null
          id?: string
          nivel?: string | null
          quizzes_corretos?: number | null
          quizzes_errados?: number | null
          tema?: string | null
          ultimo_estudo?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          area?: string
          artigos_estudados?: number | null
          created_at?: string | null
          flashcards_corretos?: number | null
          flashcards_errados?: number | null
          id?: string
          nivel?: string | null
          quizzes_corretos?: number | null
          quizzes_errados?: number | null
          tema?: string | null
          ultimo_estudo?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evelyn_progresso_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "evelyn_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      evelyn_usuarios: {
        Row: {
          ativo: boolean | null
          autorizado: boolean | null
          aviso_teste_enviado: boolean | null
          created_at: string | null
          data_primeiro_contato: string | null
          foto_perfil: string | null
          id: string
          nome: string | null
          nome_confirmado: boolean | null
          perfil: string | null
          periodo_teste_expirado: boolean | null
          telefone: string
          tempo_teste_minutos: number | null
          teste_inicio: string | null
          total_mensagens: number | null
          ultima_saudacao_premium: string | null
          ultimo_contato: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          autorizado?: boolean | null
          aviso_teste_enviado?: boolean | null
          created_at?: string | null
          data_primeiro_contato?: string | null
          foto_perfil?: string | null
          id?: string
          nome?: string | null
          nome_confirmado?: boolean | null
          perfil?: string | null
          periodo_teste_expirado?: boolean | null
          telefone: string
          tempo_teste_minutos?: number | null
          teste_inicio?: string | null
          total_mensagens?: number | null
          ultima_saudacao_premium?: string | null
          ultimo_contato?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          autorizado?: boolean | null
          aviso_teste_enviado?: boolean | null
          created_at?: string | null
          data_primeiro_contato?: string | null
          foto_perfil?: string | null
          id?: string
          nome?: string | null
          nome_confirmado?: boolean | null
          perfil?: string | null
          periodo_teste_expirado?: boolean | null
          telefone?: string
          tempo_teste_minutos?: number | null
          teste_inicio?: string | null
          total_mensagens?: number | null
          ultima_saudacao_premium?: string | null
          ultimo_contato?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      evolution_config: {
        Row: {
          api_key: string
          api_url: string
          created_at: string
          id: string
          instance_name: string
          is_connected: boolean | null
          phone_number: string | null
          qr_code: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string
          id?: string
          instance_name: string
          is_connected?: boolean | null
          phone_number?: string | null
          qr_code?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string
          id?: string
          instance_name?: string
          is_connected?: boolean | null
          phone_number?: string | null
          qr_code?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      experiencias_aprendizado: {
        Row: {
          audio_conversacional: Json | null
          created_at: string | null
          erro_mensagem: string | null
          fonte_conteudo: string | null
          fonte_id: string | null
          fonte_tipo: string
          formatos_gerados: string[] | null
          id: string
          interesses: string[] | null
          mapa_mental: Json | null
          nivel: string
          progresso: Json | null
          quizzes: Json | null
          slides_narrados: Json | null
          status: string | null
          tempo_estudo_minutos: number | null
          texto_imersivo: Json | null
          titulo: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          audio_conversacional?: Json | null
          created_at?: string | null
          erro_mensagem?: string | null
          fonte_conteudo?: string | null
          fonte_id?: string | null
          fonte_tipo: string
          formatos_gerados?: string[] | null
          id?: string
          interesses?: string[] | null
          mapa_mental?: Json | null
          nivel?: string
          progresso?: Json | null
          quizzes?: Json | null
          slides_narrados?: Json | null
          status?: string | null
          tempo_estudo_minutos?: number | null
          texto_imersivo?: Json | null
          titulo: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          audio_conversacional?: Json | null
          created_at?: string | null
          erro_mensagem?: string | null
          fonte_conteudo?: string | null
          fonte_id?: string | null
          fonte_tipo?: string
          formatos_gerados?: string[] | null
          id?: string
          interesses?: string[] | null
          mapa_mental?: Json | null
          nivel?: string
          progresso?: Json | null
          quizzes?: Json | null
          slides_narrados?: Json | null
          status?: string | null
          tempo_estudo_minutos?: number | null
          texto_imersivo?: Json | null
          titulo?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      explicacao_leis_dia: {
        Row: {
          capa_url: string | null
          created_at: string
          data: string
          explicacao_texto: string | null
          id: string
          lei_original_resumo: string | null
          leis_ids: string[] | null
          status: string | null
          titulo: string
          total_leis: number | null
          updated_at: string
        }
        Insert: {
          capa_url?: string | null
          created_at?: string
          data: string
          explicacao_texto?: string | null
          id?: string
          lei_original_resumo?: string | null
          leis_ids?: string[] | null
          status?: string | null
          titulo: string
          total_leis?: number | null
          updated_at?: string
        }
        Update: {
          capa_url?: string | null
          created_at?: string
          data?: string
          explicacao_texto?: string | null
          id?: string
          lei_original_resumo?: string | null
          leis_ids?: string[] | null
          status?: string | null
          titulo?: string
          total_leis?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      explicacoes_artigos_diarias: {
        Row: {
          audio_url: string | null
          codigo: string
          created_at: string
          data_publicacao: string | null
          explicacao_completa: string
          id: number
          numero_artigo: string
          progresso_geracao: number | null
          segmentos: Json
          status: string
          texto_artigo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          codigo?: string
          created_at?: string
          data_publicacao?: string | null
          explicacao_completa?: string
          id?: number
          numero_artigo: string
          progresso_geracao?: number | null
          segmentos?: Json
          status?: string
          texto_artigo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          codigo?: string
          created_at?: string
          data_publicacao?: string | null
          explicacao_completa?: string
          id?: number
          numero_artigo?: string
          progresso_geracao?: number | null
          segmentos?: Json
          status?: string
          texto_artigo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      explicacoes_artigos_fila: {
        Row: {
          created_at: string
          erro: string | null
          id: string
          numero_artigo: string
          status: string
          tabela_lei: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          erro?: string | null
          id?: string
          numero_artigo: string
          status?: string
          tabela_lei: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          erro?: string | null
          id?: string
          numero_artigo?: string
          status?: string
          tabela_lei?: string
          updated_at?: string
        }
        Relationships: []
      }
      extracao_jobs: {
        Row: {
          created_at: string
          finalizado_at: string | null
          id: string
          modo: string
          status: string
          tamanho_lote: number
          total_erros: number | null
          total_pendentes: number | null
          total_processadas: number | null
          total_sucesso: number | null
          ultimo_erro: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          finalizado_at?: string | null
          id?: string
          modo?: string
          status?: string
          tamanho_lote?: number
          total_erros?: number | null
          total_pendentes?: number | null
          total_processadas?: number | null
          total_sucesso?: number | null
          ultimo_erro?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          finalizado_at?: string | null
          id?: string
          modo?: string
          status?: string
          tamanho_lote?: number
          total_erros?: number | null
          total_pendentes?: number | null
          total_processadas?: number | null
          total_sucesso?: number | null
          ultimo_erro?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      faculdade_disciplinas: {
        Row: {
          area_conteudo: string | null
          ativo: boolean | null
          bibliografia: string | null
          carga_horaria: number | null
          codigo: string | null
          conteudo_programatico: string | null
          created_at: string | null
          departamento: string | null
          ementa: string | null
          id: number
          nome: string
          nome_ingles: string | null
          objetivos: string | null
          semestre: number
          universidade_id: number | null
          updated_at: string | null
          url_capa: string | null
          url_jupiter: string | null
        }
        Insert: {
          area_conteudo?: string | null
          ativo?: boolean | null
          bibliografia?: string | null
          carga_horaria?: number | null
          codigo?: string | null
          conteudo_programatico?: string | null
          created_at?: string | null
          departamento?: string | null
          ementa?: string | null
          id?: number
          nome: string
          nome_ingles?: string | null
          objetivos?: string | null
          semestre: number
          universidade_id?: number | null
          updated_at?: string | null
          url_capa?: string | null
          url_jupiter?: string | null
        }
        Update: {
          area_conteudo?: string | null
          ativo?: boolean | null
          bibliografia?: string | null
          carga_horaria?: number | null
          codigo?: string | null
          conteudo_programatico?: string | null
          created_at?: string | null
          departamento?: string | null
          ementa?: string | null
          id?: number
          nome?: string
          nome_ingles?: string | null
          objetivos?: string | null
          semestre?: number
          universidade_id?: number | null
          updated_at?: string | null
          url_capa?: string | null
          url_jupiter?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculdade_disciplinas_universidade_id_fkey"
            columns: ["universidade_id"]
            isOneToOne: false
            referencedRelation: "faculdade_universidades"
            referencedColumns: ["id"]
          },
        ]
      }
      faculdade_progresso: {
        Row: {
          concluido: boolean | null
          created_at: string | null
          data_conclusao: string | null
          flashcards_concluidos: boolean | null
          id: string
          leitura_concluida: boolean | null
          pagina_leitura: number | null
          questoes_concluidas: boolean | null
          topico_id: number | null
          total_paginas: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          concluido?: boolean | null
          created_at?: string | null
          data_conclusao?: string | null
          flashcards_concluidos?: boolean | null
          id?: string
          leitura_concluida?: boolean | null
          pagina_leitura?: number | null
          questoes_concluidas?: boolean | null
          topico_id?: number | null
          total_paginas?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          concluido?: boolean | null
          created_at?: string | null
          data_conclusao?: string | null
          flashcards_concluidos?: boolean | null
          id?: string
          leitura_concluida?: boolean | null
          pagina_leitura?: number | null
          questoes_concluidas?: boolean | null
          topico_id?: number | null
          total_paginas?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculdade_progresso_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "faculdade_topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      faculdade_topicos: {
        Row: {
          capa_url: string | null
          complemento: string | null
          conteudo_gerado: string | null
          created_at: string | null
          disciplina_id: number | null
          exemplos: Json | null
          flashcards: Json | null
          id: number
          imagens_diagramas: Json | null
          ordem: number
          questoes: Json | null
          status: string | null
          termos: Json | null
          titulo: string
          updated_at: string | null
          url_narracao: string | null
        }
        Insert: {
          capa_url?: string | null
          complemento?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          disciplina_id?: number | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          imagens_diagramas?: Json | null
          ordem: number
          questoes?: Json | null
          status?: string | null
          termos?: Json | null
          titulo: string
          updated_at?: string | null
          url_narracao?: string | null
        }
        Update: {
          capa_url?: string | null
          complemento?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          disciplina_id?: number | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          imagens_diagramas?: Json | null
          ordem?: number
          questoes?: Json | null
          status?: string | null
          termos?: Json | null
          titulo?: string
          updated_at?: string | null
          url_narracao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculdade_topicos_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "faculdade_disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      faculdade_universidades: {
        Row: {
          ativo: boolean
          cidade: string | null
          created_at: string | null
          descricao: string | null
          duracao_anos: number
          estado: string | null
          foto_url: string | null
          fundacao: number | null
          id: number
          logo_url: string | null
          nome: string
          nome_completo: string
          nota_mec: number | null
          ordem: number
          ranking_nacional: number | null
          sigla: string
          tipo: string | null
          total_semestres: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_anos?: number
          estado?: string | null
          foto_url?: string | null
          fundacao?: number | null
          id?: number
          logo_url?: string | null
          nome: string
          nome_completo: string
          nota_mec?: number | null
          ordem?: number
          ranking_nacional?: number | null
          sigla: string
          tipo?: string | null
          total_semestres?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_anos?: number
          estado?: string | null
          foto_url?: string | null
          fundacao?: number | null
          id?: number
          logo_url?: string | null
          nome?: string
          nome_completo?: string
          nota_mec?: number | null
          ordem?: number
          ranking_nacional?: number | null
          sigla?: string
          tipo?: string | null
          total_semestres?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      faq_oab_cache: {
        Row: {
          created_at: string | null
          id: string
          numero: number
          pergunta: string
          resposta: string
          ultima_atualizacao: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          numero: number
          pergunta: string
          resposta: string
          ultima_atualizacao?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          numero?: number
          pergunta?: string
          resposta?: string
          ultima_atualizacao?: string | null
        }
        Relationships: []
      }
      fila_geracao_aulas: {
        Row: {
          codigo_tabela: string
          created_at: string | null
          em_processamento: boolean | null
          id: string
          ultima_atualizacao: string | null
          ultimo_artigo_processado: number | null
        }
        Insert: {
          codigo_tabela: string
          created_at?: string | null
          em_processamento?: boolean | null
          id?: string
          ultima_atualizacao?: string | null
          ultimo_artigo_processado?: number | null
        }
        Update: {
          codigo_tabela?: string
          created_at?: string | null
          em_processamento?: boolean | null
          id?: string
          ultima_atualizacao?: string | null
          ultimo_artigo_processado?: number | null
        }
        Relationships: []
      }
      filmes_do_dia: {
        Row: {
          ano: number | null
          audio_duracao_segundos: number | null
          audio_url: string | null
          backdrop_path: string | null
          beneficios_juridicos: string | null
          created_at: string
          data: string
          diretor: string | null
          duracao: number | null
          elenco: Json | null
          frase_dia: string | null
          generos: string[] | null
          id: number
          imagens_cenas: string[] | null
          liberado_em: string | null
          nota_tmdb: number | null
          onde_assistir: Json | null
          porque_assistir: string | null
          poster_path: string | null
          sinopse: string | null
          status: string
          titulo: string
          titulo_original: string | null
          tmdb_id: number | null
          trailer_url: string | null
        }
        Insert: {
          ano?: number | null
          audio_duracao_segundos?: number | null
          audio_url?: string | null
          backdrop_path?: string | null
          beneficios_juridicos?: string | null
          created_at?: string
          data: string
          diretor?: string | null
          duracao?: number | null
          elenco?: Json | null
          frase_dia?: string | null
          generos?: string[] | null
          id?: number
          imagens_cenas?: string[] | null
          liberado_em?: string | null
          nota_tmdb?: number | null
          onde_assistir?: Json | null
          porque_assistir?: string | null
          poster_path?: string | null
          sinopse?: string | null
          status?: string
          titulo: string
          titulo_original?: string | null
          tmdb_id?: number | null
          trailer_url?: string | null
        }
        Update: {
          ano?: number | null
          audio_duracao_segundos?: number | null
          audio_url?: string | null
          backdrop_path?: string | null
          beneficios_juridicos?: string | null
          created_at?: string
          data?: string
          diretor?: string | null
          duracao?: number | null
          elenco?: Json | null
          frase_dia?: string | null
          generos?: string[] | null
          id?: number
          imagens_cenas?: string[] | null
          liberado_em?: string | null
          nota_tmdb?: number | null
          onde_assistir?: Json | null
          porque_assistir?: string | null
          poster_path?: string | null
          sinopse?: string | null
          status?: string
          titulo?: string
          titulo_original?: string | null
          tmdb_id?: number | null
          trailer_url?: string | null
        }
        Relationships: []
      }
      flashcard_revisoes: {
        Row: {
          area: string
          created_at: string
          fator_facilidade: number
          flashcard_id: number
          id: string
          intervalo_dias: number
          proxima_revisao: string
          repeticoes: number
          tema: string | null
          total_acertos: number
          total_erros: number
          ultima_revisao: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          fator_facilidade?: number
          flashcard_id: number
          id?: string
          intervalo_dias?: number
          proxima_revisao?: string
          repeticoes?: number
          tema?: string | null
          total_acertos?: number
          total_erros?: number
          ultima_revisao?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          fator_facilidade?: number
          flashcard_id?: number
          id?: string
          intervalo_dias?: number
          proxima_revisao?: string
          repeticoes?: number
          tema?: string | null
          total_acertos?: number
          total_erros?: number
          ultima_revisao?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_study_progress: {
        Row: {
          area: string
          flashcard_id: number
          id: number
          status: string
          studied_at: string
          tema: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area: string
          flashcard_id: number
          id?: never
          status: string
          studied_at?: string
          tema?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          flashcard_id?: number
          id?: never
          status?: string
          studied_at?: string
          tema?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_study_streaks: {
        Row: {
          current_streak: number
          id: number
          last_study_date: string | null
          max_streak: number
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: never
          last_study_date?: string | null
          max_streak?: number
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: never
          last_study_date?: string | null
          max_streak?: number
          user_id?: string
        }
        Relationships: []
      }
      "FLASHCARDS - ARTIGOS LEI": {
        Row: {
          area: string | null
          "audio-pergunta": string | null
          "audio-resposta": string | null
          base_legal: string | null
          exemplo: string | null
          id: number
          pergunta: string | null
          resposta: string | null
          tema: number | null
          url_audio_exemplo: string | null
          url_imagem_exemplo: string | null
        }
        Insert: {
          area?: string | null
          "audio-pergunta"?: string | null
          "audio-resposta"?: string | null
          base_legal?: string | null
          exemplo?: string | null
          id?: number
          pergunta?: string | null
          resposta?: string | null
          tema?: number | null
          url_audio_exemplo?: string | null
          url_imagem_exemplo?: string | null
        }
        Update: {
          area?: string | null
          "audio-pergunta"?: string | null
          "audio-resposta"?: string | null
          base_legal?: string | null
          exemplo?: string | null
          id?: number
          pergunta?: string | null
          resposta?: string | null
          tema?: number | null
          url_audio_exemplo?: string | null
          url_imagem_exemplo?: string | null
        }
        Relationships: []
      }
      flashcards_areas: {
        Row: {
          area: string
          created_at: string | null
          id: number
          total_flashcards: number | null
          updated_at: string | null
          url_capa: string | null
        }
        Insert: {
          area: string
          created_at?: string | null
          id?: number
          total_flashcards?: number | null
          updated_at?: string | null
          url_capa?: string | null
        }
        Update: {
          area?: string
          created_at?: string | null
          id?: number
          total_flashcards?: number | null
          updated_at?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      FLASHCARDS_GERADOS: {
        Row: {
          area: string
          base_legal: string | null
          created_at: string | null
          exemplo: string | null
          id: number
          pergunta: string
          resposta: string
          subtema: string
          tema: string
          url_audio_exemplo: string | null
          url_audio_pergunta: string | null
          url_audio_resposta: string | null
          url_imagem_exemplo: string | null
        }
        Insert: {
          area: string
          base_legal?: string | null
          created_at?: string | null
          exemplo?: string | null
          id?: number
          pergunta: string
          resposta: string
          subtema: string
          tema: string
          url_audio_exemplo?: string | null
          url_audio_pergunta?: string | null
          url_audio_resposta?: string | null
          url_imagem_exemplo?: string | null
        }
        Update: {
          area?: string
          base_legal?: string | null
          created_at?: string | null
          exemplo?: string | null
          id?: number
          pergunta?: string
          resposta?: string
          subtema?: string
          tema?: string
          url_audio_exemplo?: string | null
          url_audio_pergunta?: string | null
          url_audio_resposta?: string | null
          url_imagem_exemplo?: string | null
        }
        Relationships: []
      }
      FLASHCARDS_LACUNAS: {
        Row: {
          area: string
          comentario: string
          created_at: string | null
          frase: string
          id: number
          palavra_correta: string
          palavra_errada: string
          subtema: string
          tema: string
        }
        Insert: {
          area: string
          comentario: string
          created_at?: string | null
          frase: string
          id?: number
          palavra_correta: string
          palavra_errada: string
          subtema: string
          tema: string
        }
        Update: {
          area?: string
          comentario?: string
          created_at?: string | null
          frase?: string
          id?: number
          palavra_correta?: string
          palavra_errada?: string
          subtema?: string
          tema?: string
        }
        Relationships: []
      }
      gamificacao_casos_praticos: {
        Row: {
          area: string
          audio_url: string | null
          caso_narrativa: string | null
          codigo: string
          created_at: string
          id: number
          imagem_capa_url: string | null
          numero_artigo: string
          progresso_geracao: number
          questoes: Json | null
          resumo_artigo: string | null
          status: string
          termos_destaque: Json | null
          titulo_artigo: string | null
          updated_at: string
        }
        Insert: {
          area?: string
          audio_url?: string | null
          caso_narrativa?: string | null
          codigo?: string
          created_at?: string
          id?: number
          imagem_capa_url?: string | null
          numero_artigo: string
          progresso_geracao?: number
          questoes?: Json | null
          resumo_artigo?: string | null
          status?: string
          termos_destaque?: Json | null
          titulo_artigo?: string | null
          updated_at?: string
        }
        Update: {
          area?: string
          audio_url?: string | null
          caso_narrativa?: string | null
          codigo?: string
          created_at?: string
          id?: number
          imagem_capa_url?: string | null
          numero_artigo?: string
          progresso_geracao?: number
          questoes?: Json | null
          resumo_artigo?: string | null
          status?: string
          termos_destaque?: Json | null
          titulo_artigo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gamificacao_casos_praticos_progresso: {
        Row: {
          acertos: number
          caso_id: number
          concluido: boolean
          created_at: string
          id: string
          pontuacao: number
          total_questoes: number
          user_id: string
        }
        Insert: {
          acertos?: number
          caso_id: number
          concluido?: boolean
          created_at?: string
          id?: string
          pontuacao?: number
          total_questoes?: number
          user_id: string
        }
        Update: {
          acertos?: number
          caso_id?: number
          concluido?: boolean
          created_at?: string
          id?: string
          pontuacao?: number
          total_questoes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamificacao_casos_praticos_progresso_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "gamificacao_casos_praticos"
            referencedColumns: ["id"]
          },
        ]
      }
      gamificacao_palavras_cache: {
        Row: {
          created_at: string
          id: string
          materia: string
          nivel: number
          palavras: Json
        }
        Insert: {
          created_at?: string
          id?: string
          materia: string
          nivel: number
          palavras: Json
        }
        Update: {
          created_at?: string
          id?: string
          materia?: string
          nivel?: number
          palavras?: Json
        }
        Relationships: []
      }
      gamificacao_progresso: {
        Row: {
          concluido: boolean
          created_at: string
          estrelas: number
          id: string
          materia: string
          nivel: number
          palavras_acertadas: number
          palavras_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          estrelas?: number
          id?: string
          materia: string
          nivel: number
          palavras_acertadas?: number
          palavras_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          concluido?: boolean
          created_at?: string
          estrelas?: number
          id?: string
          materia?: string
          nivel?: number
          palavras_acertadas?: number
          palavras_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gamificacao_ranking: {
        Row: {
          id: string
          total_estrelas: number
          total_niveis_concluidos: number
          total_palavras_acertadas: number
          total_xp: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          total_estrelas?: number
          total_niveis_concluidos?: number
          total_palavras_acertadas?: number
          total_xp?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          total_estrelas?: number
          total_niveis_concluidos?: number
          total_palavras_acertadas?: number
          total_xp?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gamificacao_sim_nao_cache: {
        Row: {
          created_at: string | null
          id: string
          materia: string
          nivel: number
          perguntas: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          materia: string
          nivel: number
          perguntas: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          materia?: string
          nivel?: number
          perguntas?: Json
        }
        Relationships: []
      }
      geracao_unificada_config: {
        Row: {
          id: string
          pausado: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          pausado?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          pausado?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      geracao_unificada_fila: {
        Row: {
          area: string
          created_at: string
          erro: string | null
          id: number
          itens_gerados: number | null
          status: string
          subtema: string | null
          subtema_key: string | null
          tema: string
          tipo: string
          updated_at: string
        }
        Insert: {
          area: string
          created_at?: string
          erro?: string | null
          id?: number
          itens_gerados?: number | null
          status?: string
          subtema?: string | null
          subtema_key?: string | null
          tema: string
          tipo: string
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          erro?: string | null
          id?: number
          itens_gerados?: number | null
          status?: string
          subtema?: string | null
          subtema_key?: string | null
          tema?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      historico_alteracoes: {
        Row: {
          ano_alteracao: number | null
          created_at: string | null
          data_alteracao: string | null
          elemento_numero: string | null
          elemento_texto: string | null
          elemento_tipo: string | null
          id: number
          lei_alteradora: string | null
          numero_artigo: string
          tabela_lei: string
          texto_completo: string
          tipo_alteracao: string
          updated_at: string | null
          url_lei_alteradora: string | null
        }
        Insert: {
          ano_alteracao?: number | null
          created_at?: string | null
          data_alteracao?: string | null
          elemento_numero?: string | null
          elemento_texto?: string | null
          elemento_tipo?: string | null
          id?: number
          lei_alteradora?: string | null
          numero_artigo: string
          tabela_lei: string
          texto_completo: string
          tipo_alteracao: string
          updated_at?: string | null
          url_lei_alteradora?: string | null
        }
        Update: {
          ano_alteracao?: number | null
          created_at?: string | null
          data_alteracao?: string | null
          elemento_numero?: string | null
          elemento_texto?: string | null
          elemento_tipo?: string | null
          id?: number
          lei_alteradora?: string | null
          numero_artigo?: string
          tabela_lei?: string
          texto_completo?: string
          tipo_alteracao?: string
          updated_at?: string | null
          url_lei_alteradora?: string | null
        }
        Relationships: []
      }
      "IMAGEM - DESKTOP": {
        Row: {
          Imagem: number
          link: string | null
        }
        Insert: {
          Imagem: number
          link?: string | null
        }
        Update: {
          Imagem?: number
          link?: string | null
        }
        Relationships: []
      }
      informativos_jurisprudencia: {
        Row: {
          created_at: string | null
          data_publicacao: string | null
          id: number
          numero_edicao: number
          tipo: string | null
          titulo_edicao: string | null
          tribunal: string
        }
        Insert: {
          created_at?: string | null
          data_publicacao?: string | null
          id?: number
          numero_edicao: number
          tipo?: string | null
          titulo_edicao?: string | null
          tribunal: string
        }
        Update: {
          created_at?: string | null
          data_publicacao?: string | null
          id?: number
          numero_edicao?: number
          tipo?: string | null
          titulo_edicao?: string | null
          tribunal?: string
        }
        Relationships: []
      }
      informativos_notas: {
        Row: {
          created_at: string | null
          data_julgamento: string | null
          destaque: string | null
          id: number
          informativo_id: number
          inteiro_teor: string | null
          link_audio: string | null
          link_processo: string | null
          link_video: string | null
          ordem: number | null
          orgao_julgador: string | null
          processo: string | null
          ramo_direito: string | null
          relator: string | null
          tema: string | null
        }
        Insert: {
          created_at?: string | null
          data_julgamento?: string | null
          destaque?: string | null
          id?: number
          informativo_id: number
          inteiro_teor?: string | null
          link_audio?: string | null
          link_processo?: string | null
          link_video?: string | null
          ordem?: number | null
          orgao_julgador?: string | null
          processo?: string | null
          ramo_direito?: string | null
          relator?: string | null
          tema?: string | null
        }
        Update: {
          created_at?: string | null
          data_julgamento?: string | null
          destaque?: string | null
          id?: number
          informativo_id?: number
          inteiro_teor?: string | null
          link_audio?: string | null
          link_processo?: string | null
          link_video?: string | null
          ordem?: number | null
          orgao_julgador?: string | null
          processo?: string | null
          ramo_direito?: string | null
          relator?: string | null
          tema?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "informativos_notas_informativo_id_fkey"
            columns: ["informativo_id"]
            isOneToOne: false
            referencedRelation: "informativos_jurisprudencia"
            referencedColumns: ["id"]
          },
        ]
      }
      intro_carousel_narrations: {
        Row: {
          audio_url: string | null
          created_at: string | null
          id: number
          slide_index: number
          texto_narracao: string
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          id?: number
          slide_index: number
          texto_narracao: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          id?: number
          slide_index?: number
          texto_narracao?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invasores_historico: {
        Row: {
          artigos_cobertos: string[] | null
          codigo_slug: string
          created_at: string | null
          fantasmas_destruidos: number | null
          id: string
          nivel_maximo: number | null
          pontuacao: number | null
          power_ups_usados: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artigos_cobertos?: string[] | null
          codigo_slug: string
          created_at?: string | null
          fantasmas_destruidos?: number | null
          id?: string
          nivel_maximo?: number | null
          pontuacao?: number | null
          power_ups_usados?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artigos_cobertos?: string[] | null
          codigo_slug?: string
          created_at?: string | null
          fantasmas_destruidos?: number | null
          id?: string
          nivel_maximo?: number | null
          pontuacao?: number | null
          power_ups_usados?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      jogos_juridicos: {
        Row: {
          area: string
          cache_validade: string | null
          created_at: string | null
          dados_jogo: Json
          dificuldade: string
          id: string
          tema: string
          tipo: string
        }
        Insert: {
          area: string
          cache_validade?: string | null
          created_at?: string | null
          dados_jogo: Json
          dificuldade: string
          id?: string
          tema: string
          tipo: string
        }
        Update: {
          area?: string
          cache_validade?: string | null
          created_at?: string | null
          dados_jogo?: Json
          dificuldade?: string
          id?: string
          tema?: string
          tipo?: string
        }
        Relationships: []
      }
      jornada_atividades_usuario: {
        Row: {
          completado: boolean | null
          created_at: string | null
          dia: number
          etapa: string
          id: string
          modo: string
          pontuacao: number | null
          tempo_gasto: number | null
          user_id: string
        }
        Insert: {
          completado?: boolean | null
          created_at?: string | null
          dia: number
          etapa: string
          id?: string
          modo: string
          pontuacao?: number | null
          tempo_gasto?: number | null
          user_id: string
        }
        Update: {
          completado?: boolean | null
          created_at?: string | null
          dia?: number
          etapa?: string
          id?: string
          modo?: string
          pontuacao?: number | null
          tempo_gasto?: number | null
          user_id?: string
        }
        Relationships: []
      }
      jornada_aulas_cache: {
        Row: {
          area: string
          created_at: string | null
          estrutura_completa: Json
          id: string
          resumo_id: number
          tema: string
          updated_at: string | null
          visualizacoes: number | null
        }
        Insert: {
          area: string
          created_at?: string | null
          estrutura_completa: Json
          id?: string
          resumo_id: number
          tema: string
          updated_at?: string | null
          visualizacoes?: number | null
        }
        Update: {
          area?: string
          created_at?: string | null
          estrutura_completa?: Json
          id?: string
          resumo_id?: number
          tema?: string
          updated_at?: string | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      jornada_dias_conteudo: {
        Row: {
          area: string
          codigo_tabela: string | null
          created_at: string | null
          dia: number
          id: string
          modo: string
          resumo_id: number | null
          tema: string
        }
        Insert: {
          area: string
          codigo_tabela?: string | null
          created_at?: string | null
          dia: number
          id?: string
          modo: string
          resumo_id?: number | null
          tema: string
        }
        Update: {
          area?: string
          codigo_tabela?: string | null
          created_at?: string | null
          dia?: number
          id?: string
          modo?: string
          resumo_id?: number | null
          tema?: string
        }
        Relationships: []
      }
      jornada_progresso_usuario: {
        Row: {
          area_selecionada: string | null
          artigos_por_dia: number | null
          created_at: string | null
          dia_atual: number | null
          dias_completos: Json | null
          duracao: number | null
          id: string
          maior_streak: number | null
          modo: string | null
          streak_atual: number | null
          total_artigos: number | null
          total_dias: number | null
          ultimo_estudo: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area_selecionada?: string | null
          artigos_por_dia?: number | null
          created_at?: string | null
          dia_atual?: number | null
          dias_completos?: Json | null
          duracao?: number | null
          id?: string
          maior_streak?: number | null
          modo?: string | null
          streak_atual?: number | null
          total_artigos?: number | null
          total_dias?: number | null
          ultimo_estudo?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area_selecionada?: string | null
          artigos_por_dia?: number | null
          created_at?: string | null
          dia_atual?: number | null
          dias_completos?: Json | null
          duracao?: number | null
          id?: string
          maior_streak?: number | null
          modo?: string | null
          streak_atual?: number | null
          total_artigos?: number | null
          total_dias?: number | null
          ultimo_estudo?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      JURIFLIX: {
        Row: {
          ano: number | null
          backdrop_path: string | null
          beneficios: string | null
          bilheteria: number | null
          capa: string | null
          diretor: string | null
          duracao: number | null
          elenco: Json | null
          generos: Json | null
          id: number
          idioma_original: string | null
          link: string | null
          "link Video": string | null
          nome: string | null
          nota: string | null
          onde_assistir: Json | null
          orcamento: number | null
          plataforma: string | null
          popularidade: number | null
          poster_path: string | null
          similares: Json | null
          sinopse: string | null
          tagline: string | null
          tipo: string | null
          tipo_tmdb: string | null
          titulo_original: string | null
          tmdb_id: number | null
          trailer: string | null
          ultima_atualizacao: string | null
          videos: Json | null
          votos_count: number | null
        }
        Insert: {
          ano?: number | null
          backdrop_path?: string | null
          beneficios?: string | null
          bilheteria?: number | null
          capa?: string | null
          diretor?: string | null
          duracao?: number | null
          elenco?: Json | null
          generos?: Json | null
          id: number
          idioma_original?: string | null
          link?: string | null
          "link Video"?: string | null
          nome?: string | null
          nota?: string | null
          onde_assistir?: Json | null
          orcamento?: number | null
          plataforma?: string | null
          popularidade?: number | null
          poster_path?: string | null
          similares?: Json | null
          sinopse?: string | null
          tagline?: string | null
          tipo?: string | null
          tipo_tmdb?: string | null
          titulo_original?: string | null
          tmdb_id?: number | null
          trailer?: string | null
          ultima_atualizacao?: string | null
          videos?: Json | null
          votos_count?: number | null
        }
        Update: {
          ano?: number | null
          backdrop_path?: string | null
          beneficios?: string | null
          bilheteria?: number | null
          capa?: string | null
          diretor?: string | null
          duracao?: number | null
          elenco?: Json | null
          generos?: Json | null
          id?: number
          idioma_original?: string | null
          link?: string | null
          "link Video"?: string | null
          nome?: string | null
          nota?: string | null
          onde_assistir?: Json | null
          orcamento?: number | null
          plataforma?: string | null
          popularidade?: number | null
          poster_path?: string | null
          similares?: Json | null
          sinopse?: string | null
          tagline?: string | null
          tipo?: string | null
          tipo_tmdb?: string | null
          titulo_original?: string | null
          tmdb_id?: number | null
          trailer?: string | null
          ultima_atualizacao?: string | null
          videos?: Json | null
          votos_count?: number | null
        }
        Relationships: []
      }
      juriflix_avaliacoes: {
        Row: {
          created_at: string
          id: string
          juriflix_id: number
          nota: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          juriflix_id: number
          nota: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          juriflix_id?: number
          nota?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      juriflix_comentarios: {
        Row: {
          conteudo: string
          created_at: string | null
          id: string
          juriflix_id: number
          likes_count: number | null
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          id?: string
          juriflix_id: number
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          id?: string
          juriflix_id?: number
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "juriflix_comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "juriflix_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      juriflix_comentarios_likes: {
        Row: {
          comentario_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comentario_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comentario_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "juriflix_comentarios_likes_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "juriflix_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      juriflix_favoritos: {
        Row: {
          created_at: string
          id: string
          juriflix_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          juriflix_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          juriflix_id?: number
          user_id?: string
        }
        Relationships: []
      }
      juriflix_plano_assistir: {
        Row: {
          created_at: string
          id: string
          juriflix_id: number
          ordem: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          juriflix_id: number
          ordem?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          juriflix_id?: number
          ordem?: number
          user_id?: string
        }
        Relationships: []
      }
      juriflix_visualizacoes: {
        Row: {
          id: string
          juriflix_id: number
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          juriflix_id: number
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          juriflix_id?: number
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      jurisprudencia_corpus927: {
        Row: {
          codigo_slug: string
          created_at: string | null
          fonte: string | null
          fonte_url: string | null
          id: number
          jurisprudencia_em_tese: string | null
          numero_artigo: string
          posicionamentos_agrupados: string | null
          posicionamentos_isolados: string | null
          raw_content: string | null
          recursos_repetitivos: string | null
          repercussao_geral: string | null
          sumulas_stj: string | null
          sumulas_vinculantes: string | null
          titulo_artigo: string | null
          updated_at: string | null
        }
        Insert: {
          codigo_slug: string
          created_at?: string | null
          fonte?: string | null
          fonte_url?: string | null
          id?: number
          jurisprudencia_em_tese?: string | null
          numero_artigo: string
          posicionamentos_agrupados?: string | null
          posicionamentos_isolados?: string | null
          raw_content?: string | null
          recursos_repetitivos?: string | null
          repercussao_geral?: string | null
          sumulas_stj?: string | null
          sumulas_vinculantes?: string | null
          titulo_artigo?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo_slug?: string
          created_at?: string | null
          fonte?: string | null
          fonte_url?: string | null
          id?: number
          jurisprudencia_em_tese?: string | null
          numero_artigo?: string
          posicionamentos_agrupados?: string | null
          posicionamentos_isolados?: string | null
          raw_content?: string | null
          recursos_repetitivos?: string | null
          repercussao_geral?: string | null
          sumulas_stj?: string | null
          sumulas_vinculantes?: string | null
          titulo_artigo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jurisprudencia_estruturada_cache: {
        Row: {
          created_at: string | null
          estrutura: Json
          flashcards_gerado_em: string | null
          flashcards_gerados: Json | null
          id: string
          jurisprudencia_id: string
          questoes_geradas: Json | null
          questoes_gerado_em: string | null
          titulo: string
          tribunal: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estrutura: Json
          flashcards_gerado_em?: string | null
          flashcards_gerados?: Json | null
          id?: string
          jurisprudencia_id: string
          questoes_geradas?: Json | null
          questoes_gerado_em?: string | null
          titulo: string
          tribunal?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estrutura?: Json
          flashcards_gerado_em?: string | null
          flashcards_gerados?: Json | null
          id?: string
          jurisprudencia_id?: string
          questoes_geradas?: Json | null
          questoes_gerado_em?: string | null
          titulo?: string
          tribunal?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jurisprudencia_explicacoes_cache: {
        Row: {
          created_at: string | null
          explicacao: string
          id: string
          jurisprudencia_identificador: string
          modo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          explicacao: string
          id?: string
          jurisprudencia_identificador: string
          modo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          explicacao?: string
          id?: string
          jurisprudencia_identificador?: string
          modo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      jurisprudencias_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          dados: Json
          expira_em: string
          id: string
          termo: string
          tribunal: string
          updated_at: string | null
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          dados: Json
          expira_em: string
          id?: string
          termo: string
          tribunal: string
          updated_at?: string | null
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          dados?: Json
          expira_em?: string
          id?: string
          termo?: string
          tribunal?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      jurisprudencias_corpus927: {
        Row: {
          artigo: string
          created_at: string
          id: string
          jurisprudencias: Json | null
          legislacao: string
          texto_artigo: string | null
          updated_at: string
          url_fonte: string
        }
        Insert: {
          artigo: string
          created_at?: string
          id?: string
          jurisprudencias?: Json | null
          legislacao: string
          texto_artigo?: string | null
          updated_at?: string
          url_fonte: string
        }
        Update: {
          artigo?: string
          created_at?: string
          id?: string
          jurisprudencias?: Json | null
          legislacao?: string
          texto_artigo?: string | null
          updated_at?: string
          url_fonte?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisprudencias_corpus927_legislacao_fkey"
            columns: ["legislacao"]
            isOneToOne: false
            referencedRelation: "legislacoes_corpus927"
            referencedColumns: ["codigo"]
          },
        ]
      }
      lacunas_progresso: {
        Row: {
          acertou: boolean
          area: string
          estudado_em: string
          id: string
          lacuna_id: number
          tema: string
          user_id: string
        }
        Insert: {
          acertou: boolean
          area: string
          estudado_em?: string
          id?: string
          lacuna_id: number
          tema: string
          user_id: string
        }
        Update: {
          acertou?: boolean
          area?: string
          estudado_em?: string
          id?: string
          lacuna_id?: number
          tema?: string
          user_id?: string
        }
        Relationships: []
      }
      "LC 101 - LRF": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          contexto_hierarquico: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          hierarquia: string | null
          id: number
          Narração: string | null
          novidades: Json | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          tipo_dispositivo: string | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          url_lei_alteradora: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: number
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: number
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LC 109 - PREVIDENCIA COMPLEMENTAR": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          contexto_hierarquico: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          hierarquia: string | null
          id: number
          Narração: string | null
          novidades: Json | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          tipo_dispositivo: string | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          url_lei_alteradora: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: never
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: never
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LC 135 - FICHA LIMPA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LC 75 - MINISTERIO PUBLICO UNIAO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LC 80 - DEFENSORIA PUBLICA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      legislacoes_corpus927: {
        Row: {
          ativa: boolean | null
          codigo: string
          created_at: string
          id: string
          nome_completo: string
          sigla: string | null
          url_base: string
        }
        Insert: {
          ativa?: boolean | null
          codigo: string
          created_at?: string
          id?: string
          nome_completo: string
          sigla?: string | null
          url_base: string
        }
        Update: {
          ativa?: boolean | null
          codigo?: string
          created_at?: string
          id?: string
          nome_completo?: string
          sigla?: string | null
          url_base?: string
        }
        Relationships: []
      }
      "LEI 10520 - PREGAO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 1079 - CRIMES RESPONSABILIDADE": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 11.340 de 2006 - Maria da Penha": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 11.343 de 2006 - Lei de Drogas": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 11079 - PPP": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 11101 - RECUPERACAO FALENCIA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 12.850 de 2013 - Organizações Criminosas": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 12016 - MANDADO DE SEGURANCA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 12037 - IDENTIFICACAO CRIMINAL": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 12527 - ACESSO INFORMACAO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          contexto_hierarquico: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          hierarquia: string | null
          id: number
          Narração: string | null
          novidades: Json | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          tipo_dispositivo: string | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          url_lei_alteradora: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: number
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: number
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 12846 - ANTICORRUPCAO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 12965 - MARCO CIVIL INTERNET": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 13.869 de 2019 - Abuso de Autoridade": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 13.964 de 2019 - Pacote Anticrime": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 13104 - FEMINICIDIO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 13140 - MEDIACAO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 13260 - ANTITERRORISMO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 13709 - LGPD": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 14.197 de 2021 - Crimes Contra o Estado Democrático": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 14133 - LICITACOES": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: string | null
          id: number | null
          Narração: string | null
          "Número do Artigo": string | null
          questoes: string | null
          termos: string | null
          termos_aprofundados: string | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: string | null
          visualizacoes: string | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: string | null
          id?: number | null
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: string | null
          termos?: string | null
          termos_aprofundados?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: string | null
          visualizacoes?: string | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: string | null
          id?: number | null
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: string | null
          termos?: string | null
          termos_aprofundados?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: string | null
          visualizacoes?: string | null
        }
        Relationships: []
      }
      "LEI 3365 - DESAPROPRIACAO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 4657 - LINDB": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 4717 - ACAO POPULAR": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 5015 - CRIMES TRANSNACIONAIS": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 6015 - REGISTROS PUBLICOS": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 6404 - SOCIEDADES ANONIMAS": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 6938 - MEIO AMBIENTE": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 7.210 de 1984 - Lei de Execução Penal": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem: number | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem?: number | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem?: number | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 7347 - ACAO CIVIL PUBLICA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 7492 - CRIMES SISTEMA FINANCEIRO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 7960 - PRISAO TEMPORARIA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 8.072 de 1990 - Crimes Hediondos": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 8112 - SERVIDOR PUBLICO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 8137 - CRIMES ORDEM TRIBUTARIA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 8212 - Custeio": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 8213 - Benefícios": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          contexto_hierarquico: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          hierarquia: string | null
          id: number
          Narração: string | null
          novidades: Json | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          tipo_dispositivo: string | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          url_lei_alteradora: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: never
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: never
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 8245 - INQUILINATO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 8429 - IMPROBIDADE": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 8987 - CONCESSOES": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 9.099 de 1995 - Juizados Especiais": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 9.296 de 1996 - Interceptação Telefônica": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "Lei 9.455 de 1997 - Tortura": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 9307 - ARBITRAGEM": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 9430 - LEGISLACAO TRIBUTARIA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          "Número do Artigo"?: string | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 9507 - HABEAS DATA": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 9605 - CRIMES AMBIENTAIS": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 9784 - PROCESSO ADMINISTRATIVO": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          contexto_hierarquico: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          hierarquia: string | null
          id: number
          Narração: string | null
          novidades: Json | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          tipo_dispositivo: string | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          url_lei_alteradora: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: number
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: number
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "LEI 9868 - ADI E ADC": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          contexto_hierarquico: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          hierarquia: string | null
          id: number
          Narração: string | null
          novidades: Json | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          tipo_dispositivo: string | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          url_lei_alteradora: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: number
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          contexto_hierarquico?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          hierarquia?: string | null
          id?: number
          Narração?: string | null
          novidades?: Json | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          tipo_dispositivo?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          url_lei_alteradora?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      lei_seca_explicacoes: {
        Row: {
          cache_descomplicado: string | null
          cache_validade: string | null
          conteudo_descomplicado: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          gerado_em: string | null
          id: number
          ordem: number
          titulo: string
          updated_at: string | null
          url_audio: string | null
          url_audio_descomplicado: string | null
          url_capa: string | null
        }
        Insert: {
          cache_descomplicado?: string | null
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem: number
          titulo: string
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_descomplicado?: string | null
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          titulo?: string
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      leis_favoritas: {
        Row: {
          categoria: string
          cor: string | null
          created_at: string | null
          id: string
          lei_id: string
          route: string
          sigla: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          categoria: string
          cor?: string | null
          created_at?: string | null
          id?: string
          lei_id: string
          route: string
          sigla?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          categoria?: string
          cor?: string | null
          created_at?: string | null
          id?: string
          lei_id?: string
          route?: string
          sigla?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      leis_ordinarias: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: number
          nome_lei: string
          numero_lei: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: number
          nome_lei: string
          numero_lei: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: number
          nome_lei?: string
          numero_lei?: string
          ordem?: number
        }
        Relationships: []
      }
      leis_ordinarias_2026: {
        Row: {
          created_at: string | null
          data_publicacao: string | null
          ementa: string
          id: number
          link_planalto: string | null
          numero_lei: string
        }
        Insert: {
          created_at?: string | null
          data_publicacao?: string | null
          ementa: string
          id?: number
          link_planalto?: string | null
          numero_lei: string
        }
        Update: {
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string
          id?: number
          link_planalto?: string | null
          numero_lei?: string
        }
        Relationships: []
      }
      leis_push_2020: {
        Row: {
          areas_direito: string[] | null
          created_at: string | null
          data_publicacao: string | null
          ementa: string | null
          id: number
          impacto_pratico: string | null
          link_planalto: string | null
          numero: string | null
          resumo_ia: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          areas_direito?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          id?: number
          impacto_pratico?: string | null
          link_planalto?: string | null
          numero?: string | null
          resumo_ia?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_direito?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          id?: number
          impacto_pratico?: string | null
          link_planalto?: string | null
          numero?: string | null
          resumo_ia?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leis_push_2021: {
        Row: {
          areas_direito: string[] | null
          created_at: string | null
          data_publicacao: string | null
          ementa: string | null
          id: number
          impacto_pratico: string | null
          link_planalto: string | null
          numero: string | null
          resumo_ia: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          areas_direito?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          id?: number
          impacto_pratico?: string | null
          link_planalto?: string | null
          numero?: string | null
          resumo_ia?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_direito?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          id?: number
          impacto_pratico?: string | null
          link_planalto?: string | null
          numero?: string | null
          resumo_ia?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leis_push_2022: {
        Row: {
          areas_direito: string[] | null
          created_at: string | null
          data_publicacao: string | null
          ementa: string | null
          id: number
          impacto_pratico: string | null
          link_planalto: string | null
          numero: string | null
          resumo_ia: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          areas_direito?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          id?: number
          impacto_pratico?: string | null
          link_planalto?: string | null
          numero?: string | null
          resumo_ia?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_direito?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          id?: number
          impacto_pratico?: string | null
          link_planalto?: string | null
          numero?: string | null
          resumo_ia?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leis_push_2023: {
        Row: {
          areas_direito: string[] | null
          created_at: string | null
          data_publicacao: string | null
          ementa: string | null
          id: number
          impacto_pratico: string | null
          link_planalto: string | null
          numero: string | null
          resumo_ia: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          areas_direito?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          id?: number
          impacto_pratico?: string | null
          link_planalto?: string | null
          numero?: string | null
          resumo_ia?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_direito?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          id?: number
          impacto_pratico?: string | null
          link_planalto?: string | null
          numero?: string | null
          resumo_ia?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leis_push_2024: {
        Row: {
          areas_direito: string[] | null
          created_at: string | null
          data_publicacao: string | null
          ementa: string | null
          id: number
          impacto_pratico: string | null
          link_planalto: string | null
          numero: string | null
          resumo_ia: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          areas_direito?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          id?: number
          impacto_pratico?: string | null
          link_planalto?: string | null
          numero?: string | null
          resumo_ia?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_direito?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          id?: number
          impacto_pratico?: string | null
          link_planalto?: string | null
          numero?: string | null
          resumo_ia?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leis_push_2025: {
        Row: {
          areas_direito: string[] | null
          artigos: Json | null
          capa_explicacao_url: string | null
          created_at: string
          data_ato: string | null
          data_dou: string | null
          data_publicacao: string | null
          ementa: string | null
          explicacao_lei: string | null
          explicacoes_artigos: Json | null
          id: string
          numero_lei: string
          ordem_dou: number | null
          status: string
          tabela_destino: string | null
          texto_bruto: string | null
          texto_formatado: string | null
          tipo_ato: string | null
          updated_at: string
          url_planalto: string
        }
        Insert: {
          areas_direito?: string[] | null
          artigos?: Json | null
          capa_explicacao_url?: string | null
          created_at?: string
          data_ato?: string | null
          data_dou?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          explicacao_lei?: string | null
          explicacoes_artigos?: Json | null
          id?: string
          numero_lei: string
          ordem_dou?: number | null
          status?: string
          tabela_destino?: string | null
          texto_bruto?: string | null
          texto_formatado?: string | null
          tipo_ato?: string | null
          updated_at?: string
          url_planalto: string
        }
        Update: {
          areas_direito?: string[] | null
          artigos?: Json | null
          capa_explicacao_url?: string | null
          created_at?: string
          data_ato?: string | null
          data_dou?: string | null
          data_publicacao?: string | null
          ementa?: string | null
          explicacao_lei?: string | null
          explicacoes_artigos?: Json | null
          id?: string
          numero_lei?: string
          ordem_dou?: number | null
          status?: string
          tabela_destino?: string | null
          texto_bruto?: string | null
          texto_formatado?: string | null
          tipo_ato?: string | null
          updated_at?: string
          url_planalto?: string
        }
        Relationships: []
      }
      leis_recentes: {
        Row: {
          accessed_at: string | null
          categoria: string
          cor: string | null
          id: string
          lei_id: string
          route: string
          sigla: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          accessed_at?: string | null
          categoria: string
          cor?: string | null
          id?: string
          lei_id: string
          route: string
          sigla?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          accessed_at?: string | null
          categoria?: string
          cor?: string | null
          id?: string
          lei_id?: string
          route?: string
          sigla?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      leitura_capitulos_capas: {
        Row: {
          created_at: string | null
          erro_geracao: string | null
          gerando: boolean | null
          id: string
          livro_titulo: string
          numero_capitulo: number
          titulo_capitulo: string
          updated_at: string | null
          url_capa: string | null
        }
        Insert: {
          created_at?: string | null
          erro_geracao?: string | null
          gerando?: boolean | null
          id?: string
          livro_titulo: string
          numero_capitulo: number
          titulo_capitulo: string
          updated_at?: string | null
          url_capa?: string | null
        }
        Update: {
          created_at?: string | null
          erro_geracao?: string | null
          gerando?: boolean | null
          id?: string
          livro_titulo?: string
          numero_capitulo?: number
          titulo_capitulo?: string
          updated_at?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      LEITURA_FORMATADA: {
        Row: {
          autor: string | null
          biblioteca_classicos_id: number
          capa_url: string | null
          created_at: string
          erro_mensagem: string | null
          estrutura: Json
          formatacao_concluida_em: string | null
          formatacao_iniciada_em: string | null
          id: string
          livro_titulo: string
          paginas: Json
          progresso: number | null
          status: string
          total_caracteres_original: number | null
          total_paginas: number
          updated_at: string
        }
        Insert: {
          autor?: string | null
          biblioteca_classicos_id: number
          capa_url?: string | null
          created_at?: string
          erro_mensagem?: string | null
          estrutura?: Json
          formatacao_concluida_em?: string | null
          formatacao_iniciada_em?: string | null
          id?: string
          livro_titulo: string
          paginas?: Json
          progresso?: number | null
          status?: string
          total_caracteres_original?: number | null
          total_paginas?: number
          updated_at?: string
        }
        Update: {
          autor?: string | null
          biblioteca_classicos_id?: number
          capa_url?: string | null
          created_at?: string
          erro_mensagem?: string | null
          estrutura?: Json
          formatacao_concluida_em?: string | null
          formatacao_iniciada_em?: string | null
          id?: string
          livro_titulo?: string
          paginas?: Json
          progresso?: number | null
          status?: string
          total_caracteres_original?: number | null
          total_paginas?: number
          updated_at?: string
        }
        Relationships: []
      }
      leitura_imagens_pagina: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          livro_titulo: string
          numero_pagina: number
          posicao_no_texto: number | null
          url_imagem: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          livro_titulo: string
          numero_pagina: number
          posicao_no_texto?: number | null
          url_imagem: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          livro_titulo?: string
          numero_pagina?: number
          posicao_no_texto?: number | null
          url_imagem?: string
        }
        Relationships: []
      }
      leitura_imagens_pendentes: {
        Row: {
          created_at: string
          descricao: string
          id: string
          imagem_url: string | null
          livro_titulo: string
          pagina: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          imagem_url?: string | null
          livro_titulo: string
          pagina: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          imagem_url?: string | null
          livro_titulo?: string
          pagina?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      leitura_interativa: {
        Row: {
          ativo: boolean
          autor: string | null
          biblioteca_classicos_id: number | null
          capa_url: string | null
          capas_capitulos: Json | null
          capitulos_conteudo: Json | null
          created_at: string
          estrutura_capitulos: Json | null
          fonte_tabela: string
          formatacao_concluida_em: string | null
          formatacao_iniciada_em: string | null
          formatacao_progresso: number | null
          formatacao_status: string | null
          id: string
          livro_titulo: string
          paginas_formatadas: Json | null
          texto_formatado_cache: Json | null
          total_paginas: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          autor?: string | null
          biblioteca_classicos_id?: number | null
          capa_url?: string | null
          capas_capitulos?: Json | null
          capitulos_conteudo?: Json | null
          created_at?: string
          estrutura_capitulos?: Json | null
          fonte_tabela?: string
          formatacao_concluida_em?: string | null
          formatacao_iniciada_em?: string | null
          formatacao_progresso?: number | null
          formatacao_status?: string | null
          id?: string
          livro_titulo: string
          paginas_formatadas?: Json | null
          texto_formatado_cache?: Json | null
          total_paginas?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          autor?: string | null
          biblioteca_classicos_id?: number | null
          capa_url?: string | null
          capas_capitulos?: Json | null
          capitulos_conteudo?: Json | null
          created_at?: string
          estrutura_capitulos?: Json | null
          fonte_tabela?: string
          formatacao_concluida_em?: string | null
          formatacao_iniciada_em?: string | null
          formatacao_progresso?: number | null
          formatacao_status?: string | null
          id?: string
          livro_titulo?: string
          paginas_formatadas?: Json | null
          texto_formatado_cache?: Json | null
          total_paginas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leitura_interativa_biblioteca_classicos_id_fkey"
            columns: ["biblioteca_classicos_id"]
            isOneToOne: true
            referencedRelation: "BIBLIOTECA-CLASSICOS"
            referencedColumns: ["id"]
          },
        ]
      }
      leitura_livros_indice: {
        Row: {
          analise_concluida: boolean | null
          created_at: string | null
          id: string
          indice_capitulos: Json
          livro_titulo: string
          paginas_ignoradas: number[] | null
          primeira_pagina_conteudo: number | null
          total_capitulos: number
          total_paginas: number
          updated_at: string | null
        }
        Insert: {
          analise_concluida?: boolean | null
          created_at?: string | null
          id?: string
          indice_capitulos?: Json
          livro_titulo: string
          paginas_ignoradas?: number[] | null
          primeira_pagina_conteudo?: number | null
          total_capitulos?: number
          total_paginas?: number
          updated_at?: string | null
        }
        Update: {
          analise_concluida?: boolean | null
          created_at?: string | null
          id?: string
          indice_capitulos?: Json
          livro_titulo?: string
          paginas_ignoradas?: number[] | null
          primeira_pagina_conteudo?: number | null
          total_capitulos?: number
          total_paginas?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      leitura_paginas_formatadas: {
        Row: {
          capitulo_titulo: string | null
          created_at: string
          html_formatado: string
          id: string
          is_chapter_start: boolean | null
          livro_id: number | null
          livro_titulo: string | null
          numero_capitulo: number | null
          numero_pagina: number
          url_audio_capitulo: string | null
          url_audio_pagina: string | null
          url_capa_capitulo: string | null
        }
        Insert: {
          capitulo_titulo?: string | null
          created_at?: string
          html_formatado: string
          id?: string
          is_chapter_start?: boolean | null
          livro_id?: number | null
          livro_titulo?: string | null
          numero_capitulo?: number | null
          numero_pagina: number
          url_audio_capitulo?: string | null
          url_audio_pagina?: string | null
          url_capa_capitulo?: string | null
        }
        Update: {
          capitulo_titulo?: string | null
          created_at?: string
          html_formatado?: string
          id?: string
          is_chapter_start?: boolean | null
          livro_id?: number | null
          livro_titulo?: string | null
          numero_capitulo?: number | null
          numero_pagina?: number
          url_audio_capitulo?: string | null
          url_audio_pagina?: string | null
          url_capa_capitulo?: string | null
        }
        Relationships: []
      }
      leitura_progresso_capitulos: {
        Row: {
          concluido: boolean
          created_at: string
          data_conclusao: string | null
          id: string
          livro_titulo: string
          numero_capitulo: number
          pagina_inicio: number
          ultima_pagina_lida: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          data_conclusao?: string | null
          id?: string
          livro_titulo: string
          numero_capitulo: number
          pagina_inicio: number
          ultima_pagina_lida?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          concluido?: boolean
          created_at?: string
          data_conclusao?: string | null
          id?: string
          livro_titulo?: string
          numero_capitulo?: number
          pagina_inicio?: number
          ultima_pagina_lida?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      "LIVROS-BASE": {
        Row: {
          Conteudo: string | null
          id: number
          Livro: string | null
          Pagina: string | null
        }
        Insert: {
          Conteudo?: string | null
          id?: number
          Livro?: string | null
          Pagina?: string | null
        }
        Update: {
          Conteudo?: string | null
          id?: number
          Livro?: string | null
          Pagina?: string | null
        }
        Relationships: []
      }
      "LLD - Lei de Lavagem de Dinheiro": {
        Row: {
          Artigo: string | null
          Aula: string | null
          Comentario: string | null
          exemplo: string | null
          explicacao_resumido: string | null
          explicacao_simples_maior16: string | null
          explicacao_simples_menor16: string | null
          explicacao_tecnico: string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          "Número do Artigo": string | null
          ordem_artigo: number | null
          questoes: Json | null
          termos: Json | null
          termos_aprofundados: Json | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          Artigo?: string | null
          Aula?: string | null
          Comentario?: string | null
          exemplo?: string | null
          explicacao_resumido?: string | null
          explicacao_simples_maior16?: string | null
          explicacao_simples_menor16?: string | null
          explicacao_tecnico?: string | null
          flashcards?: Json | null
          id?: never
          Narração?: string | null
          "Número do Artigo"?: string | null
          ordem_artigo?: number | null
          questoes?: Json | null
          termos?: Json | null
          termos_aprofundados?: Json | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      locais_juridicos_cache: {
        Row: {
          cache_key: string
          cidade: string | null
          created_at: string | null
          dados: Json
          expira_em: string | null
          id: string
          latitude: number
          longitude: number
          raio: number
          tipo: string
          total_resultados: number | null
          updated_at: string | null
        }
        Insert: {
          cache_key: string
          cidade?: string | null
          created_at?: string | null
          dados: Json
          expira_em?: string | null
          id?: string
          latitude: number
          longitude: number
          raio: number
          tipo: string
          total_resultados?: number | null
          updated_at?: string | null
        }
        Update: {
          cache_key?: string
          cidade?: string | null
          created_at?: string | null
          dados?: Json
          expira_em?: string | null
          id?: string
          latitude?: number
          longitude?: number
          raio?: number
          tipo?: string
          total_resultados?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "MAPA MENTAL": {
        Row: {
          area: string | null
          id: number
          link: string | null
          sequencia: string | null
          tema: string | null
        }
        Insert: {
          area?: string | null
          id?: number
          link?: string | null
          sequencia?: string | null
          tema?: string | null
        }
        Update: {
          area?: string | null
          id?: number
          link?: string | null
          sequencia?: string | null
          tema?: string | null
        }
        Relationships: []
      }
      mapas_mentais_artigos: {
        Row: {
          codigo_tabela: string
          conteudo_artigo: string
          created_at: string | null
          id: string
          imagem_url: string | null
          numero_artigo: string
          prompt_usado: string | null
          updated_at: string | null
        }
        Insert: {
          codigo_tabela: string
          conteudo_artigo: string
          created_at?: string | null
          id?: string
          imagem_url?: string | null
          numero_artigo: string
          prompt_usado?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo_tabela?: string
          conteudo_artigo?: string
          created_at?: string | null
          id?: string
          imagem_url?: string | null
          numero_artigo?: string
          prompt_usado?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      MAPAS_MENTAIS_GERADOS: {
        Row: {
          area: string
          created_at: string | null
          dados_json: Json
          id: number
          subtema: string | null
          tema: string
        }
        Insert: {
          area: string
          created_at?: string | null
          dados_json: Json
          id?: number
          subtema?: string | null
          tema: string
        }
        Update: {
          area?: string
          created_at?: string | null
          dados_json?: Json
          id?: number
          subtema?: string | null
          tema?: string
        }
        Relationships: []
      }
      metodologias_fila: {
        Row: {
          area: string
          created_at: string | null
          erro: string | null
          id: number
          metodo: string
          status: string
          subtema: string
          tema: string
          updated_at: string | null
        }
        Insert: {
          area: string
          created_at?: string | null
          erro?: string | null
          id?: number
          metodo: string
          status?: string
          subtema: string
          tema: string
          updated_at?: string | null
        }
        Update: {
          area?: string
          created_at?: string | null
          erro?: string | null
          id?: number
          metodo?: string
          status?: string
          subtema?: string
          tema?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      METODOLOGIAS_GERADAS: {
        Row: {
          area: string
          conteudo: Json
          created_at: string
          drive_pdf_url: string | null
          drive_png_url: string | null
          id: string
          metodo: string
          subtema: string | null
          tema: string
        }
        Insert: {
          area: string
          conteudo: Json
          created_at?: string
          drive_pdf_url?: string | null
          drive_png_url?: string | null
          id?: string
          metodo: string
          subtema?: string | null
          tema: string
        }
        Update: {
          area?: string
          conteudo?: Json
          created_at?: string
          drive_pdf_url?: string | null
          drive_png_url?: string | null
          id?: string
          metodo?: string
          subtema?: string | null
          tema?: string
        }
        Relationships: []
      }
      meu_brasil_casos: {
        Row: {
          ano: number | null
          conteudo_melhorado: Json | null
          conteudo_original: Json | null
          created_at: string | null
          id: number
          imagens: Json | null
          links_relacionados: Json | null
          nome: string
          pessoas_envolvidas: Json | null
          timeline: Json | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ano?: number | null
          conteudo_melhorado?: Json | null
          conteudo_original?: Json | null
          created_at?: string | null
          id?: number
          imagens?: Json | null
          links_relacionados?: Json | null
          nome: string
          pessoas_envolvidas?: Json | null
          timeline?: Json | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ano?: number | null
          conteudo_melhorado?: Json | null
          conteudo_original?: Json | null
          created_at?: string | null
          id?: number
          imagens?: Json | null
          links_relacionados?: Json | null
          nome?: string
          pessoas_envolvidas?: Json | null
          timeline?: Json | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meu_brasil_historia: {
        Row: {
          ano_fim: number | null
          ano_inicio: number | null
          conteudo_melhorado: Json | null
          conteudo_original: Json | null
          created_at: string | null
          id: number
          imagens: Json | null
          marcos_importantes: Json | null
          periodo: string
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          ano_fim?: number | null
          ano_inicio?: number | null
          conteudo_melhorado?: Json | null
          conteudo_original?: Json | null
          created_at?: string | null
          id?: number
          imagens?: Json | null
          marcos_importantes?: Json | null
          periodo: string
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_fim?: number | null
          ano_inicio?: number | null
          conteudo_melhorado?: Json | null
          conteudo_original?: Json | null
          created_at?: string | null
          id?: number
          imagens?: Json | null
          marcos_importantes?: Json | null
          periodo?: string
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meu_brasil_instituicoes: {
        Row: {
          conteudo_melhorado: Json | null
          conteudo_original: Json | null
          created_at: string | null
          id: number
          imagens: Json | null
          links_relacionados: Json | null
          logo_url: string | null
          nome: string
          sigla: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          conteudo_melhorado?: Json | null
          conteudo_original?: Json | null
          created_at?: string | null
          id?: number
          imagens?: Json | null
          links_relacionados?: Json | null
          logo_url?: string | null
          nome: string
          sigla?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          conteudo_melhorado?: Json | null
          conteudo_original?: Json | null
          created_at?: string | null
          id?: number
          imagens?: Json | null
          links_relacionados?: Json | null
          logo_url?: string | null
          nome?: string
          sigla?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meu_brasil_juristas: {
        Row: {
          area: string | null
          categoria: string
          conteudo_melhorado: Json | null
          conteudo_original: Json | null
          created_at: string | null
          foto_url: string | null
          id: number
          imagens: Json | null
          links_relacionados: Json | null
          nome: string
          periodo: string | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          categoria: string
          conteudo_melhorado?: Json | null
          conteudo_original?: Json | null
          created_at?: string | null
          foto_url?: string | null
          id?: number
          imagens?: Json | null
          links_relacionados?: Json | null
          nome: string
          periodo?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          categoria?: string
          conteudo_melhorado?: Json | null
          conteudo_original?: Json | null
          created_at?: string | null
          foto_url?: string | null
          id?: number
          imagens?: Json | null
          links_relacionados?: Json | null
          nome?: string
          periodo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meu_brasil_sistemas: {
        Row: {
          bandeira_url: string | null
          comparacao_brasil: Json | null
          conteudo_melhorado: Json | null
          conteudo_original: Json | null
          created_at: string | null
          id: number
          imagens: Json | null
          links_relacionados: Json | null
          pais: string
          tipo_sistema: string | null
          updated_at: string | null
        }
        Insert: {
          bandeira_url?: string | null
          comparacao_brasil?: Json | null
          conteudo_melhorado?: Json | null
          conteudo_original?: Json | null
          created_at?: string | null
          id?: number
          imagens?: Json | null
          links_relacionados?: Json | null
          pais: string
          tipo_sistema?: string | null
          updated_at?: string | null
        }
        Update: {
          bandeira_url?: string | null
          comparacao_brasil?: Json | null
          conteudo_melhorado?: Json | null
          conteudo_original?: Json | null
          created_at?: string | null
          id?: number
          imagens?: Json | null
          links_relacionados?: Json | null
          pais?: string
          tipo_sistema?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      modulos: {
        Row: {
          area_id: number | null
          capa: string | null
          created_at: string | null
          descricao: string | null
          id: number
          numero: number
          titulo: string
        }
        Insert: {
          area_id?: number | null
          capa?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          numero: number
          titulo: string
        }
        Update: {
          area_id?: number | null
          capa?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          numero?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoramento_execucoes: {
        Row: {
          alteracoes_encontradas: number | null
          created_at: string | null
          detalhes: Json | null
          erros: number | null
          fim: string | null
          id: string
          inicio: string | null
          leis_verificadas: number | null
          status: string | null
        }
        Insert: {
          alteracoes_encontradas?: number | null
          created_at?: string | null
          detalhes?: Json | null
          erros?: number | null
          fim?: string | null
          id?: string
          inicio?: string | null
          leis_verificadas?: number | null
          status?: string | null
        }
        Update: {
          alteracoes_encontradas?: number | null
          created_at?: string | null
          detalhes?: Json | null
          erros?: number | null
          fim?: string | null
          id?: string
          inicio?: string | null
          leis_verificadas?: number | null
          status?: string | null
        }
        Relationships: []
      }
      monitoramento_leis: {
        Row: {
          alteracoes_detectadas: number | null
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          data_modificacao_planalto: string | null
          erro_detalhes: string | null
          id: number
          nome_amigavel: string | null
          prioridade: number | null
          status: string | null
          tabela_lei: string
          ultima_alteracao_detectada: string | null
          ultima_verificacao: string | null
          ultimo_hash: string | null
          ultimo_total_artigos: number | null
          updated_at: string | null
          url_planalto: string
        }
        Insert: {
          alteracoes_detectadas?: number | null
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          data_modificacao_planalto?: string | null
          erro_detalhes?: string | null
          id?: number
          nome_amigavel?: string | null
          prioridade?: number | null
          status?: string | null
          tabela_lei: string
          ultima_alteracao_detectada?: string | null
          ultima_verificacao?: string | null
          ultimo_hash?: string | null
          ultimo_total_artigos?: number | null
          updated_at?: string | null
          url_planalto: string
        }
        Update: {
          alteracoes_detectadas?: number | null
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          data_modificacao_planalto?: string | null
          erro_detalhes?: string | null
          id?: number
          nome_amigavel?: string | null
          prioridade?: number | null
          status?: string | null
          tabela_lei?: string
          ultima_alteracao_detectada?: string | null
          ultima_verificacao?: string | null
          ultimo_hash?: string | null
          ultimo_total_artigos?: number | null
          updated_at?: string | null
          url_planalto?: string
        }
        Relationships: []
      }
      narracao_jobs: {
        Row: {
          artigo_atual: number | null
          artigos_ids: number[]
          artigos_processados: number
          artigos_total: number
          created_at: string
          erro_mensagem: string | null
          id: string
          status: string
          tabela_lei: string
          updated_at: string
          velocidade: number
        }
        Insert: {
          artigo_atual?: number | null
          artigos_ids: number[]
          artigos_processados?: number
          artigos_total: number
          created_at?: string
          erro_mensagem?: string | null
          id?: string
          status?: string
          tabela_lei: string
          updated_at?: string
          velocidade?: number
        }
        Update: {
          artigo_atual?: number | null
          artigos_ids?: number[]
          artigos_processados?: number
          artigos_total?: number
          created_at?: string
          erro_mensagem?: string | null
          id?: string
          status?: string
          tabela_lei?: string
          updated_at?: string
          velocidade?: number
        }
        Relationships: []
      }
      narracao_prioridades: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          numero_artigo: string
          prioridade: string
          tabela_lei: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string | null
          numero_artigo: string
          prioridade: string
          tabela_lei: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string | null
          numero_artigo?: string
          prioridade?: string
          tabela_lei?: string
          updated_at?: string
        }
        Relationships: []
      }
      noticias_concursos_cache: {
        Row: {
          analise_gerada_em: string | null
          analise_ia: string | null
          categoria: string | null
          conteudo_completo: string | null
          conteudo_formatado: string | null
          created_at: string | null
          data_publicacao: string | null
          descricao: string | null
          fonte: string | null
          id: string
          imagem: string | null
          imagem_webp: string | null
          link: string
          termos_json: Json | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          analise_gerada_em?: string | null
          analise_ia?: string | null
          categoria?: string | null
          conteudo_completo?: string | null
          conteudo_formatado?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          fonte?: string | null
          id?: string
          imagem?: string | null
          imagem_webp?: string | null
          link: string
          termos_json?: Json | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          analise_gerada_em?: string | null
          analise_ia?: string | null
          categoria?: string | null
          conteudo_completo?: string | null
          conteudo_formatado?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          fonte?: string | null
          id?: string
          imagem?: string | null
          imagem_webp?: string | null
          link?: string
          termos_json?: Json | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      noticias_juridicas_cache: {
        Row: {
          analise_gerada_em: string | null
          analise_ia: string | null
          categoria: string | null
          conteudo_completo: string | null
          conteudo_formatado: string | null
          created_at: string | null
          data_publicacao: string
          descricao: string | null
          fonte: string | null
          id: string
          imagem: string | null
          imagem_webp: string | null
          link: string
          relevancia: number | null
          termos_json: Json | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          analise_gerada_em?: string | null
          analise_ia?: string | null
          categoria?: string | null
          conteudo_completo?: string | null
          conteudo_formatado?: string | null
          created_at?: string | null
          data_publicacao?: string
          descricao?: string | null
          fonte?: string | null
          id?: string
          imagem?: string | null
          imagem_webp?: string | null
          link: string
          relevancia?: number | null
          termos_json?: Json | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          analise_gerada_em?: string | null
          analise_ia?: string | null
          categoria?: string | null
          conteudo_completo?: string | null
          conteudo_formatado?: string | null
          created_at?: string | null
          data_publicacao?: string
          descricao?: string | null
          fonte?: string | null
          id?: string
          imagem?: string | null
          imagem_webp?: string | null
          link?: string
          relevancia?: number | null
          termos_json?: Json | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      noticias_legislativas_cache: {
        Row: {
          analise_ia: string | null
          categoria: string | null
          conteudo_completo: string | null
          conteudo_formatado: string | null
          created_at: string | null
          data_publicacao: string | null
          descricao: string | null
          fonte: string | null
          id: string
          imagem: string | null
          imagem_webp: string | null
          link: string
          relevancia: number | null
          termos_json: Json | null
          titulo: string
          titulo_curto: string | null
          updated_at: string | null
        }
        Insert: {
          analise_ia?: string | null
          categoria?: string | null
          conteudo_completo?: string | null
          conteudo_formatado?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          fonte?: string | null
          id?: string
          imagem?: string | null
          imagem_webp?: string | null
          link: string
          relevancia?: number | null
          termos_json?: Json | null
          titulo: string
          titulo_curto?: string | null
          updated_at?: string | null
        }
        Update: {
          analise_ia?: string | null
          categoria?: string | null
          conteudo_completo?: string | null
          conteudo_formatado?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          fonte?: string | null
          id?: string
          imagem?: string | null
          imagem_webp?: string | null
          link?: string
          relevancia?: number | null
          termos_json?: Json | null
          titulo?: string
          titulo_curto?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      noticias_oab_cache: {
        Row: {
          capa_gerada: string | null
          categoria: string | null
          conteudo_completo: string | null
          created_at: string | null
          data_publicacao: string | null
          descricao: string | null
          erro_processamento: string | null
          hora_publicacao: string | null
          id: number
          link: string
          links_externos: Json | null
          processado: boolean | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          capa_gerada?: string | null
          categoria?: string | null
          conteudo_completo?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          erro_processamento?: string | null
          hora_publicacao?: string | null
          id?: number
          link: string
          links_externos?: Json | null
          processado?: boolean | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          capa_gerada?: string | null
          categoria?: string | null
          conteudo_completo?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          erro_processamento?: string | null
          hora_publicacao?: string | null
          id?: number
          link?: string
          links_externos?: Json | null
          processado?: boolean | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      noticias_politicas_cache: {
        Row: {
          conteudo_formatado: string | null
          created_at: string | null
          data_publicacao: string | null
          descricao: string | null
          espectro: string | null
          fonte: string
          id: number
          imagem_url: string | null
          imagem_url_webp: string | null
          pontos_principais: string[] | null
          processado: boolean | null
          relevancia_score: number | null
          resumo_executivo: string | null
          resumo_facil: string | null
          termos: Json | null
          titulo: string
          updated_at: string | null
          url: string
        }
        Insert: {
          conteudo_formatado?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          espectro?: string | null
          fonte: string
          id?: number
          imagem_url?: string | null
          imagem_url_webp?: string | null
          pontos_principais?: string[] | null
          processado?: boolean | null
          relevancia_score?: number | null
          resumo_executivo?: string | null
          resumo_facil?: string | null
          termos?: Json | null
          titulo: string
          updated_at?: string | null
          url: string
        }
        Update: {
          conteudo_formatado?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          espectro?: string | null
          fonte?: string
          id?: number
          imagem_url?: string | null
          imagem_url_webp?: string | null
          pontos_principais?: string[] | null
          processado?: boolean | null
          relevancia_score?: number | null
          resumo_executivo?: string | null
          resumo_facil?: string | null
          termos?: Json | null
          titulo?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      notificacoes_preferencias_usuario: {
        Row: {
          canal_email: boolean
          canal_push: boolean
          canal_whatsapp: boolean
          created_at: string
          id: string
          receber_boletim_diario: boolean
          receber_dica_estudo: boolean
          receber_filme_dia: boolean
          receber_leis_dia: boolean
          receber_livro_dia: boolean
          receber_novidades: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          canal_email?: boolean
          canal_push?: boolean
          canal_whatsapp?: boolean
          created_at?: string
          id?: string
          receber_boletim_diario?: boolean
          receber_dica_estudo?: boolean
          receber_filme_dia?: boolean
          receber_leis_dia?: boolean
          receber_livro_dia?: boolean
          receber_novidades?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          canal_email?: boolean
          canal_push?: boolean
          canal_whatsapp?: boolean
          created_at?: string
          id?: string
          receber_boletim_diario?: boolean
          receber_dica_estudo?: boolean
          receber_filme_dia?: boolean
          receber_leis_dia?: boolean
          receber_livro_dia?: boolean
          receber_novidades?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_preferencias_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_push_enviadas: {
        Row: {
          created_at: string | null
          enviado_por: string | null
          id: string
          imagem_url: string | null
          link: string | null
          mensagem: string
          titulo: string
          total_abertos: number | null
          total_enviados: number | null
          total_falha: number | null
          total_sucesso: number | null
        }
        Insert: {
          created_at?: string | null
          enviado_por?: string | null
          id?: string
          imagem_url?: string | null
          link?: string | null
          mensagem: string
          titulo: string
          total_abertos?: number | null
          total_enviados?: number | null
          total_falha?: number | null
          total_sucesso?: number | null
        }
        Update: {
          created_at?: string | null
          enviado_por?: string | null
          id?: string
          imagem_url?: string | null
          link?: string | null
          mensagem?: string
          titulo?: string
          total_abertos?: number | null
          total_enviados?: number | null
          total_falha?: number | null
          total_sucesso?: number | null
        }
        Relationships: []
      }
      NOVIDADES: {
        Row: {
          Área: string | null
          Atualização: string | null
          Dia: string | null
        }
        Insert: {
          Área?: string | null
          Atualização?: string | null
          Dia?: string | null
        }
        Update: {
          Área?: string | null
          Atualização?: string | null
          Dia?: string | null
        }
        Relationships: []
      }
      novidades_vade_mecum: {
        Row: {
          categoria: string
          created_at: string | null
          data_publicacao: string
          descricao: string
          id: number
          link_referencia: string | null
          nome_lei: string
          ordem: number
          titulo: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data_publicacao: string
          descricao: string
          id?: never
          link_referencia?: string | null
          nome_lei: string
          ordem?: number
          titulo: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data_publicacao?: string
          descricao?: string
          id?: never
          link_referencia?: string | null
          nome_lei?: string
          ordem?: number
          titulo?: string
        }
        Relationships: []
      }
      oab_base_conhecimento: {
        Row: {
          area: string
          conteudo: string
          created_at: string | null
          id: string
          pagina: number
          pdf_url: string | null
          resumo_chunk: string | null
          tokens_estimados: number | null
          updated_at: string | null
        }
        Insert: {
          area: string
          conteudo: string
          created_at?: string | null
          id?: string
          pagina: number
          pdf_url?: string | null
          resumo_chunk?: string | null
          tokens_estimados?: number | null
          updated_at?: string | null
        }
        Update: {
          area?: string
          conteudo?: string
          created_at?: string | null
          id?: string
          pagina?: number
          pdf_url?: string | null
          resumo_chunk?: string | null
          tokens_estimados?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      oab_base_conhecimento_areas: {
        Row: {
          area: string
          created_at: string | null
          id: string
          pdf_url: string | null
          status: string | null
          total_chunks: number | null
          total_paginas: number | null
          total_tokens: number | null
          updated_at: string | null
        }
        Insert: {
          area: string
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          status?: string | null
          total_chunks?: number | null
          total_paginas?: number | null
          total_tokens?: number | null
          updated_at?: string | null
        }
        Update: {
          area?: string
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          status?: string | null
          total_chunks?: number | null
          total_paginas?: number | null
          total_tokens?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      oab_carreira_blog: {
        Row: {
          cache_validade: string | null
          conteudo_descomplicado: string | null
          conteudo_gerado: string | null
          created_at: string | null
          descricao_curta: string | null
          gerado_em: string | null
          id: number
          ordem: number
          pdf_url: string | null
          texto_ocr: string | null
          titulo: string
          topicos: string[] | null
          updated_at: string | null
          url_audio: string | null
          url_audio_descomplicado: string | null
          url_capa: string | null
        }
        Insert: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem: number
          pdf_url?: string | null
          texto_ocr?: string | null
          titulo: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Update: {
          cache_validade?: string | null
          conteudo_descomplicado?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          pdf_url?: string | null
          texto_ocr?: string | null
          titulo?: string
          topicos?: string[] | null
          updated_at?: string | null
          url_audio?: string | null
          url_audio_descomplicado?: string | null
          url_capa?: string | null
        }
        Relationships: []
      }
      oab_etica_paginas: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: number
          pagina: number
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: number
          pagina: number
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: number
          pagina?: number
        }
        Relationships: []
      }
      oab_etica_temas: {
        Row: {
          audio_url: string | null
          capa_url: string | null
          conteudo_markdown: string | null
          created_at: string | null
          descricao: string | null
          exemplos: Json | null
          flashcards: Json | null
          id: number
          livro_id: number | null
          ordem: number
          pagina_final: number | null
          pagina_inicial: number | null
          questoes: Json | null
          resumo: string | null
          status: string | null
          subtopicos: Json | null
          termos: Json | null
          titulo: string
          total_topicos: number | null
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          capa_url?: string | null
          conteudo_markdown?: string | null
          created_at?: string | null
          descricao?: string | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          livro_id?: number | null
          ordem: number
          pagina_final?: number | null
          pagina_inicial?: number | null
          questoes?: Json | null
          resumo?: string | null
          status?: string | null
          subtopicos?: Json | null
          termos?: Json | null
          titulo: string
          total_topicos?: number | null
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          capa_url?: string | null
          conteudo_markdown?: string | null
          created_at?: string | null
          descricao?: string | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          livro_id?: number | null
          ordem?: number
          pagina_final?: number | null
          pagina_inicial?: number | null
          questoes?: Json | null
          resumo?: string | null
          status?: string | null
          subtopicos?: Json | null
          termos?: Json | null
          titulo?: string
          total_topicos?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      oab_etica_topicos: {
        Row: {
          capa_url: string | null
          conteudo_gerado: string | null
          created_at: string | null
          exemplos: Json | null
          flashcards: Json | null
          id: number
          ordem: number
          questoes: Json | null
          status: string | null
          tema_id: number | null
          termos: Json | null
          titulo: string
          updated_at: string | null
          url_narracao: string | null
        }
        Insert: {
          capa_url?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          ordem: number
          questoes?: Json | null
          status?: string | null
          tema_id?: number | null
          termos?: Json | null
          titulo: string
          updated_at?: string | null
          url_narracao?: string | null
        }
        Update: {
          capa_url?: string | null
          conteudo_gerado?: string | null
          created_at?: string | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          ordem?: number
          questoes?: Json | null
          status?: string | null
          tema_id?: number | null
          termos?: Json | null
          titulo?: string
          updated_at?: string | null
          url_narracao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oab_etica_topicos_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "oab_etica_temas"
            referencedColumns: ["id"]
          },
        ]
      }
      oab_geracao_regras: {
        Row: {
          ativo: boolean | null
          categoria: string
          created_at: string | null
          id: number
          prioridade: number | null
          regra: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          created_at?: string | null
          id?: number
          prioridade?: number | null
          regra: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string | null
          id?: number
          prioridade?: number | null
          regra?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      oab_geracao_templates: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: number
          instrucoes: string
          ordem: number
          palavras_minimas: number | null
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: number
          instrucoes: string
          ordem: number
          palavras_minimas?: number | null
          tipo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: number
          instrucoes?: string
          ordem?: number
          palavras_minimas?: number | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      oab_trilhas_areas: {
        Row: {
          area: string
          cor: string | null
          created_at: string | null
          icone: string | null
          id: string
          ordem: number | null
          pdf_url: string | null
          status: string | null
          total_paginas: number | null
          total_temas: number | null
          updated_at: string | null
        }
        Insert: {
          area: string
          cor?: string | null
          created_at?: string | null
          icone?: string | null
          id?: string
          ordem?: number | null
          pdf_url?: string | null
          status?: string | null
          total_paginas?: number | null
          total_temas?: number | null
          updated_at?: string | null
        }
        Update: {
          area?: string
          cor?: string | null
          created_at?: string | null
          icone?: string | null
          id?: string
          ordem?: number | null
          pdf_url?: string | null
          status?: string | null
          total_paginas?: number | null
          total_temas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      oab_trilhas_conteudo: {
        Row: {
          area: string
          conteudo: string | null
          created_at: string | null
          id: string
          pagina: number
        }
        Insert: {
          area: string
          conteudo?: string | null
          created_at?: string | null
          id?: string
          pagina: number
        }
        Update: {
          area?: string
          conteudo?: string | null
          created_at?: string | null
          id?: string
          pagina?: number
        }
        Relationships: []
      }
      oab_trilhas_estruturas: {
        Row: {
          created_at: string | null
          id: string
          ordem: number
          subitens: string[] | null
          tema_id: string | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ordem: number
          subitens?: string[] | null
          tema_id?: string | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ordem?: number
          subitens?: string[] | null
          tema_id?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "oab_trilhas_estruturas_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "oab_trilhas_temas"
            referencedColumns: ["id"]
          },
        ]
      }
      oab_trilhas_estudo_progresso: {
        Row: {
          created_at: string | null
          flashcards_completos: boolean | null
          id: string
          leitura_completa: boolean | null
          pratica_completa: boolean | null
          progresso_flashcards: number | null
          progresso_leitura: number | null
          progresso_questoes: number | null
          topico_id: number
          ultimo_topico_lido: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          flashcards_completos?: boolean | null
          id?: string
          leitura_completa?: boolean | null
          pratica_completa?: boolean | null
          progresso_flashcards?: number | null
          progresso_leitura?: number | null
          progresso_questoes?: number | null
          topico_id: number
          ultimo_topico_lido?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          flashcards_completos?: boolean | null
          id?: string
          leitura_completa?: boolean | null
          pratica_completa?: boolean | null
          progresso_flashcards?: number | null
          progresso_leitura?: number | null
          progresso_questoes?: number | null
          topico_id?: number
          ultimo_topico_lido?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      oab_trilhas_materia_paginas: {
        Row: {
          conteudo: string
          created_at: string | null
          id: number
          materia_id: number | null
          pagina: number
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          id?: number
          materia_id?: number | null
          pagina: number
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          id?: number
          materia_id?: number | null
          pagina?: number
        }
        Relationships: [
          {
            foreignKeyName: "oab_trilhas_materia_paginas_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "oab_trilhas_materias"
            referencedColumns: ["id"]
          },
        ]
      }
      oab_trilhas_materias: {
        Row: {
          ativo: boolean | null
          capa_url: string | null
          created_at: string | null
          descricao: string | null
          id: number
          nome: string
          ordem: number
          pdf_url: string | null
          status_processamento: string | null
          temas_identificados: Json | null
          total_paginas: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          capa_url?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome: string
          ordem: number
          pdf_url?: string | null
          status_processamento?: string | null
          temas_identificados?: Json | null
          total_paginas?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          capa_url?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome?: string
          ordem?: number
          pdf_url?: string | null
          status_processamento?: string | null
          temas_identificados?: Json | null
          total_paginas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      oab_trilhas_progresso: {
        Row: {
          flashcards_vistos: number | null
          id: string
          leitura_concluida: boolean | null
          questoes_acertos: number | null
          questoes_total: number | null
          tema_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          flashcards_vistos?: number | null
          id?: string
          leitura_concluida?: boolean | null
          questoes_acertos?: number | null
          questoes_total?: number | null
          tema_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          flashcards_vistos?: number | null
          id?: string
          leitura_concluida?: boolean | null
          questoes_acertos?: number | null
          questoes_total?: number | null
          tema_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oab_trilhas_progresso_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "oab_trilhas_temas"
            referencedColumns: ["id"]
          },
        ]
      }
      oab_trilhas_subtopicos: {
        Row: {
          conteudo_expandido: string | null
          created_at: string | null
          exemplos_praticos: Json | null
          flashcards: Json | null
          id: string
          ordem: number
          questoes: Json | null
          status: string | null
          tema_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          conteudo_expandido?: string | null
          created_at?: string | null
          exemplos_praticos?: Json | null
          flashcards?: Json | null
          id?: string
          ordem?: number
          questoes?: Json | null
          status?: string | null
          tema_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          conteudo_expandido?: string | null
          created_at?: string | null
          exemplos_praticos?: Json | null
          flashcards?: Json | null
          id?: string
          ordem?: number
          questoes?: Json | null
          status?: string | null
          tema_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oab_trilhas_subtopicos_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "oab_trilhas_temas"
            referencedColumns: ["id"]
          },
        ]
      }
      oab_trilhas_temas: {
        Row: {
          area: string
          conteudo_formatado: string | null
          created_at: string | null
          flashcards: Json | null
          id: string
          ordem: number | null
          pagina_final: number | null
          pagina_inicial: number | null
          questoes: Json | null
          resumo: string | null
          status: string | null
          subtopicos_gerados: boolean | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          area: string
          conteudo_formatado?: string | null
          created_at?: string | null
          flashcards?: Json | null
          id?: string
          ordem?: number | null
          pagina_final?: number | null
          pagina_inicial?: number | null
          questoes?: Json | null
          resumo?: string | null
          status?: string | null
          subtopicos_gerados?: boolean | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          area?: string
          conteudo_formatado?: string | null
          created_at?: string | null
          flashcards?: Json | null
          id?: string
          ordem?: number | null
          pagina_final?: number | null
          pagina_inicial?: number | null
          questoes?: Json | null
          resumo?: string | null
          status?: string | null
          subtopicos_gerados?: boolean | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      oab_trilhas_topico_paginas: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: string
          pagina: number
          topico_id: number
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          pagina: number
          topico_id: number
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          pagina?: number
          topico_id?: number
        }
        Relationships: []
      }
      oab_trilhas_topicos: {
        Row: {
          capa_url: string | null
          capa_versao: number | null
          conteudo_gerado: string | null
          created_at: string
          descricao: string | null
          exemplos: Json | null
          flashcards: Json | null
          id: number
          materia_id: number | null
          ordem: number
          pagina_final: number | null
          pagina_inicial: number | null
          posicao_fila: number | null
          progresso: number | null
          questoes: Json | null
          status: string
          subtopicos: Json | null
          tentativas: number | null
          termos: Json | null
          titulo: string
          updated_at: string
          url_narracao: string | null
        }
        Insert: {
          capa_url?: string | null
          capa_versao?: number | null
          conteudo_gerado?: string | null
          created_at?: string
          descricao?: string | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          materia_id?: number | null
          ordem?: number
          pagina_final?: number | null
          pagina_inicial?: number | null
          posicao_fila?: number | null
          progresso?: number | null
          questoes?: Json | null
          status?: string
          subtopicos?: Json | null
          tentativas?: number | null
          termos?: Json | null
          titulo: string
          updated_at?: string
          url_narracao?: string | null
        }
        Update: {
          capa_url?: string | null
          capa_versao?: number | null
          conteudo_gerado?: string | null
          created_at?: string
          descricao?: string | null
          exemplos?: Json | null
          flashcards?: Json | null
          id?: number
          materia_id?: number | null
          ordem?: number
          pagina_final?: number | null
          pagina_inicial?: number | null
          posicao_fila?: number | null
          progresso?: number | null
          questoes?: Json | null
          status?: string
          subtopicos?: Json | null
          tentativas?: number | null
          termos?: Json | null
          titulo?: string
          updated_at?: string
          url_narracao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oab_trilhas_topicos_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "oab_trilhas_materias"
            referencedColumns: ["id"]
          },
        ]
      }
      obras_filosofos_cache: {
        Row: {
          created_at: string | null
          filosofo: string
          id: number
          obras: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          filosofo: string
          id?: number
          obras: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          filosofo?: string
          id?: number
          obras?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      obras_filosofos_resumos: {
        Row: {
          ano: string | null
          created_at: string | null
          filosofo: string
          id: number
          resumo: string
          titulo_obra: string
          titulo_original: string | null
          updated_at: string | null
        }
        Insert: {
          ano?: string | null
          created_at?: string | null
          filosofo: string
          id?: number
          resumo: string
          titulo_obra: string
          titulo_original?: string | null
          updated_at?: string | null
        }
        Update: {
          ano?: string | null
          created_at?: string | null
          filosofo?: string
          id?: number
          resumo?: string
          titulo_obra?: string
          titulo_original?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ocr_verificacao: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          diferenca_percentual: number | null
          erros_detectados: string[] | null
          id: number
          livro_id: number
          livro_titulo: string
          pagina: number
          status: string | null
          texto_novo_ocr: string | null
          texto_original: string | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          diferenca_percentual?: number | null
          erros_detectados?: string[] | null
          id?: number
          livro_id: number
          livro_titulo: string
          pagina: number
          status?: string | null
          texto_novo_ocr?: string | null
          texto_original?: string | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          diferenca_percentual?: number | null
          erros_detectados?: string[] | null
          id?: number
          livro_id?: number
          livro_titulo?: string
          pagina?: number
          status?: string | null
          texto_novo_ocr?: string | null
          texto_original?: string | null
        }
        Relationships: []
      }
      onboarding_quiz_respostas: {
        Row: {
          area_atuacao: string | null
          concurso_alvo: string | null
          confirmacao_18: boolean | null
          created_at: string | null
          dificuldade: string | null
          faixa_etaria: string | null
          fase_oab: string | null
          ferramentas_preferidas: string[] | null
          forma_estudo: string | null
          frequencia_estudo: string | null
          id: string
          intencao: string | null
          materia_dificil: string | null
          necessidade_app: string | null
          semestre: string | null
          user_id: string | null
        }
        Insert: {
          area_atuacao?: string | null
          concurso_alvo?: string | null
          confirmacao_18?: boolean | null
          created_at?: string | null
          dificuldade?: string | null
          faixa_etaria?: string | null
          fase_oab?: string | null
          ferramentas_preferidas?: string[] | null
          forma_estudo?: string | null
          frequencia_estudo?: string | null
          id?: string
          intencao?: string | null
          materia_dificil?: string | null
          necessidade_app?: string | null
          semestre?: string | null
          user_id?: string | null
        }
        Update: {
          area_atuacao?: string | null
          concurso_alvo?: string | null
          confirmacao_18?: boolean | null
          created_at?: string | null
          dificuldade?: string | null
          faixa_etaria?: string | null
          fase_oab?: string | null
          ferramentas_preferidas?: string[] | null
          forma_estudo?: string | null
          frequencia_estudo?: string | null
          id?: string
          intencao?: string | null
          materia_dificil?: string | null
          necessidade_app?: string | null
          semestre?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_quiz_respostas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string | null
          device: string | null
          id: string
          page_path: string
          page_title: string | null
          referrer: string | null
          region: string | null
          session_id: string
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          device?: string | null
          id?: string
          page_path: string
          page_title?: string | null
          referrer?: string | null
          region?: string | null
          session_id: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          device?: string | null
          id?: string
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          region?: string | null
          session_id?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          id: string
          installments: number | null
          mp_payment_id: string | null
          mp_status: string | null
          mp_status_detail: string | null
          payment_method: string
          plan_type: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_message?: string | null
          id?: string
          installments?: number | null
          mp_payment_id?: string | null
          mp_status?: string | null
          mp_status_detail?: string | null
          payment_method?: string
          plan_type: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          id?: string
          installments?: number | null
          mp_payment_id?: string | null
          mp_status?: string | null
          mp_status_detail?: string | null
          payment_method?: string
          plan_type?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      PETIÇÃO: {
        Row: {
          id: number
          Link: string | null
          Petições: string | null
        }
        Insert: {
          id: number
          Link?: string | null
          Petições?: string | null
        }
        Update: {
          id?: number
          Link?: string | null
          Petições?: string | null
        }
        Relationships: []
      }
      peticao_templates: {
        Row: {
          area_direito: string
          artigos_sugeridos: string[] | null
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          estrutura: Json
          id: string
          nome: string
          texto_sugerido: string | null
          tipo_peticao: string
          updated_at: string | null
        }
        Insert: {
          area_direito: string
          artigos_sugeridos?: string[] | null
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          estrutura?: Json
          id?: string
          nome: string
          texto_sugerido?: string | null
          tipo_peticao: string
          updated_at?: string | null
        }
        Update: {
          area_direito?: string
          artigos_sugeridos?: string[] | null
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          estrutura?: Json
          id?: string
          nome?: string
          texto_sugerido?: string | null
          tipo_peticao?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      peticoes_geradas: {
        Row: {
          area_direito: string | null
          artigos_citados: Json | null
          conteudo_html: string | null
          conteudo_texto: string | null
          created_at: string | null
          dados_advogado: Json | null
          dados_autor: Json | null
          dados_reu: Json | null
          descricao_caso: string | null
          id: string
          jurisprudencias: Json | null
          pdf_url: string | null
          status: string | null
          tipo_peticao: string | null
          titulo: string
          updated_at: string | null
          user_id: string | null
          versao: number | null
        }
        Insert: {
          area_direito?: string | null
          artigos_citados?: Json | null
          conteudo_html?: string | null
          conteudo_texto?: string | null
          created_at?: string | null
          dados_advogado?: Json | null
          dados_autor?: Json | null
          dados_reu?: Json | null
          descricao_caso?: string | null
          id?: string
          jurisprudencias?: Json | null
          pdf_url?: string | null
          status?: string | null
          tipo_peticao?: string | null
          titulo: string
          updated_at?: string | null
          user_id?: string | null
          versao?: number | null
        }
        Update: {
          area_direito?: string | null
          artigos_citados?: Json | null
          conteudo_html?: string | null
          conteudo_texto?: string | null
          created_at?: string | null
          dados_advogado?: Json | null
          dados_autor?: Json | null
          dados_reu?: Json | null
          descricao_caso?: string | null
          id?: string
          jurisprudencias?: Json | null
          pdf_url?: string | null
          status?: string | null
          tipo_peticao?: string | null
          titulo?: string
          updated_at?: string | null
          user_id?: string | null
          versao?: number | null
        }
        Relationships: []
      }
      peticoes_modelos: {
        Row: {
          arquivo_drive_id: string
          categoria: string
          created_at: string | null
          id: string
          link_direto: string
          nome_arquivo: string
          pasta_id: string | null
          tamanho_bytes: number | null
          texto_extraido: string | null
          texto_extraido_at: string | null
          texto_extraido_status: string | null
          tipo_arquivo: string | null
          updated_at: string | null
        }
        Insert: {
          arquivo_drive_id: string
          categoria: string
          created_at?: string | null
          id?: string
          link_direto: string
          nome_arquivo: string
          pasta_id?: string | null
          tamanho_bytes?: number | null
          texto_extraido?: string | null
          texto_extraido_at?: string | null
          texto_extraido_status?: string | null
          tipo_arquivo?: string | null
          updated_at?: string | null
        }
        Update: {
          arquivo_drive_id?: string
          categoria?: string
          created_at?: string | null
          id?: string
          link_direto?: string
          nome_arquivo?: string
          pasta_id?: string | null
          tamanho_bytes?: number | null
          texto_extraido?: string | null
          texto_extraido_at?: string | null
          texto_extraido_status?: string | null
          tipo_arquivo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      peticoes_sync_log: {
        Row: {
          atualizados: number | null
          detalhes: Json | null
          erros: number | null
          finished_at: string | null
          id: string
          novos_arquivos: number | null
          started_at: string | null
          status: string | null
          total_arquivos: number | null
        }
        Insert: {
          atualizados?: number | null
          detalhes?: Json | null
          erros?: number | null
          finished_at?: string | null
          id?: string
          novos_arquivos?: number | null
          started_at?: string | null
          status?: string | null
          total_arquivos?: number | null
        }
        Update: {
          atualizados?: number | null
          detalhes?: Json | null
          erros?: number | null
          finished_at?: string | null
          id?: string
          novos_arquivos?: number | null
          started_at?: string | null
          status?: string | null
          total_arquivos?: number | null
        }
        Relationships: []
      }
      plan_click_analytics: {
        Row: {
          action: string
          created_at: string | null
          device: string | null
          id: string
          plan_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          device?: string | null
          id?: string
          plan_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          device?: string | null
          id?: string
          plan_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_click_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      "PLANO DE ESTUDOS- MATERIAS": {
        Row: {
          Administrativo: string | null
          Ambiental: string | null
          Constitucional: string | null
          Consumidor: string | null
          "Direito Civil": string | null
          "Direito Eleitoral": string | null
          "Direito Financeiro": string | null
          "Direito Previdenciário": string | null
          "Direitos Humanos": string | null
          ECA: string | null
          Empresarial: string | null
          Ética: string | null
          Filosofia: string | null
          id: number
          Internacional: string | null
          Penal: string | null
          "Processo Civil": string | null
          "Processo do Trabalho": string | null
          "Processo Penal": string | null
          Trabalho: string | null
          Tributário: string | null
        }
        Insert: {
          Administrativo?: string | null
          Ambiental?: string | null
          Constitucional?: string | null
          Consumidor?: string | null
          "Direito Civil"?: string | null
          "Direito Eleitoral"?: string | null
          "Direito Financeiro"?: string | null
          "Direito Previdenciário"?: string | null
          "Direitos Humanos"?: string | null
          ECA?: string | null
          Empresarial?: string | null
          Ética?: string | null
          Filosofia?: string | null
          id?: number
          Internacional?: string | null
          Penal?: string | null
          "Processo Civil"?: string | null
          "Processo do Trabalho"?: string | null
          "Processo Penal"?: string | null
          Trabalho?: string | null
          Tributário?: string | null
        }
        Update: {
          Administrativo?: string | null
          Ambiental?: string | null
          Constitucional?: string | null
          Consumidor?: string | null
          "Direito Civil"?: string | null
          "Direito Eleitoral"?: string | null
          "Direito Financeiro"?: string | null
          "Direito Previdenciário"?: string | null
          "Direitos Humanos"?: string | null
          ECA?: string | null
          Empresarial?: string | null
          Ética?: string | null
          Filosofia?: string | null
          id?: number
          Internacional?: string | null
          Penal?: string | null
          "Processo Civil"?: string | null
          "Processo do Trabalho"?: string | null
          "Processo Penal"?: string | null
          Trabalho?: string | null
          Tributário?: string | null
        }
        Relationships: []
      }
      politica_blog_orientacao: {
        Row: {
          conteudo: string | null
          created_at: string | null
          gerado_em: string | null
          id: string
          imagem_url: string | null
          narracao_url: string | null
          ordem: number | null
          orientacao: string
          resumo: string | null
          termo_wikipedia: string | null
          titulo: string
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          gerado_em?: string | null
          id?: string
          imagem_url?: string | null
          narracao_url?: string | null
          ordem?: number | null
          orientacao: string
          resumo?: string | null
          termo_wikipedia?: string | null
          titulo: string
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          gerado_em?: string | null
          id?: string
          imagem_url?: string | null
          narracao_url?: string | null
          ordem?: number | null
          orientacao?: string
          resumo?: string | null
          termo_wikipedia?: string | null
          titulo?: string
        }
        Relationships: []
      }
      politica_comentarios: {
        Row: {
          artigo_id: number
          conteudo: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artigo_id: number
          conteudo: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artigo_id?: number
          conteudo?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "politica_comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "politica_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      politica_comentarios_likes: {
        Row: {
          comentario_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comentario_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comentario_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "politica_comentarios_likes_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "politica_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      politica_conteudo_orientacao: {
        Row: {
          autor: string | null
          created_at: string | null
          descricao: string | null
          id: string
          imagem_url: string | null
          ordem: number | null
          orientacao: string
          seguidores: string | null
          tipo: string
          titulo: string
          url: string | null
        }
        Insert: {
          autor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          ordem?: number | null
          orientacao: string
          seguidores?: string | null
          tipo: string
          titulo: string
          url?: string | null
        }
        Update: {
          autor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          ordem?: number | null
          orientacao?: string
          seguidores?: string | null
          tipo?: string
          titulo?: string
          url?: string | null
        }
        Relationships: []
      }
      politica_documentarios: {
        Row: {
          analise_gerada: string | null
          canal: string | null
          created_at: string | null
          descricao: string | null
          duracao: string | null
          id: string
          orientacao: string
          publicado_em: string | null
          sobre: string | null
          sobre_gerado: string | null
          thumbnail: string | null
          titulo: string
          total_comentarios: number | null
          updated_at: string | null
          video_id: string
          visualizacoes: string | null
        }
        Insert: {
          analise_gerada?: string | null
          canal?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao?: string | null
          id?: string
          orientacao: string
          publicado_em?: string | null
          sobre?: string | null
          sobre_gerado?: string | null
          thumbnail?: string | null
          titulo: string
          total_comentarios?: number | null
          updated_at?: string | null
          video_id: string
          visualizacoes?: string | null
        }
        Update: {
          analise_gerada?: string | null
          canal?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao?: string | null
          id?: string
          orientacao?: string
          publicado_em?: string | null
          sobre?: string | null
          sobre_gerado?: string | null
          thumbnail?: string | null
          titulo?: string
          total_comentarios?: number | null
          updated_at?: string | null
          video_id?: string
          visualizacoes?: string | null
        }
        Relationships: []
      }
      politica_documentarios_comentarios: {
        Row: {
          conteudo: string
          created_at: string | null
          documentario_id: string | null
          id: string
          parent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          documentario_id?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          documentario_id?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "politica_documentarios_comentarios_documentario_id_fkey"
            columns: ["documentario_id"]
            isOneToOne: false
            referencedRelation: "politica_documentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politica_documentarios_comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "politica_documentarios_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      politica_documentarios_comentarios_likes: {
        Row: {
          comentario_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comentario_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comentario_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "politica_documentarios_comentarios_likes_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "politica_documentarios_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      politica_documentarios_reacoes: {
        Row: {
          created_at: string | null
          documentario_id: string
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          documentario_id: string
          id?: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          documentario_id?: string
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "politica_documentarios_reacoes_documentario_id_fkey"
            columns: ["documentario_id"]
            isOneToOne: false
            referencedRelation: "politica_documentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_juridicos: {
        Row: {
          artigo_numero: string
          comentarios_original: number | null
          created_at: string
          curtidas: number
          data_criacao: string
          data_publicacao: string | null
          fonte: string | null
          fonte_perfil: string | null
          fonte_url: string | null
          id: string
          imagens: Json
          instagram_id: string | null
          legenda: string | null
          lei_tabela: string
          likes_original: number | null
          roteiro: Json
          status: string
          texto_artigo: string | null
          tipo_midia: string | null
          titulo: string
          updated_at: string
          video_url: string | null
          visualizacoes: number
        }
        Insert: {
          artigo_numero: string
          comentarios_original?: number | null
          created_at?: string
          curtidas?: number
          data_criacao?: string
          data_publicacao?: string | null
          fonte?: string | null
          fonte_perfil?: string | null
          fonte_url?: string | null
          id?: string
          imagens?: Json
          instagram_id?: string | null
          legenda?: string | null
          lei_tabela: string
          likes_original?: number | null
          roteiro?: Json
          status?: string
          texto_artigo?: string | null
          tipo_midia?: string | null
          titulo: string
          updated_at?: string
          video_url?: string | null
          visualizacoes?: number
        }
        Update: {
          artigo_numero?: string
          comentarios_original?: number | null
          created_at?: string
          curtidas?: number
          data_criacao?: string
          data_publicacao?: string | null
          fonte?: string | null
          fonte_perfil?: string | null
          fonte_url?: string | null
          id?: string
          imagens?: Json
          instagram_id?: string | null
          legenda?: string | null
          lei_tabela?: string
          likes_original?: number | null
          roteiro?: Json
          status?: string
          texto_artigo?: string | null
          tipo_midia?: string | null
          titulo?: string
          updated_at?: string
          video_url?: string | null
          visualizacoes?: number
        }
        Relationships: []
      }
      pratica_artigos: {
        Row: {
          codigo_tabela: string
          conteudo: Json
          created_at: string
          id: string
          numero_artigo: string
          tipo: string
          updated_at: string
        }
        Insert: {
          codigo_tabela: string
          conteudo?: Json
          created_at?: string
          id?: string
          numero_artigo: string
          tipo: string
          updated_at?: string
        }
        Update: {
          codigo_tabela?: string
          conteudo?: Json
          created_at?: string
          id?: string
          numero_artigo?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_analytics: {
        Row: {
          action: string
          created_at: string | null
          feature: string
          id: string
          metadata: Json | null
          user_ip: string
          was_blocked: boolean
        }
        Insert: {
          action: string
          created_at?: string | null
          feature: string
          id?: string
          metadata?: Json | null
          user_ip: string
          was_blocked: boolean
        }
        Update: {
          action?: string
          created_at?: string | null
          feature?: string
          id?: string
          metadata?: Json | null
          user_ip?: string
          was_blocked?: boolean
        }
        Relationships: []
      }
      premium_modal_views: {
        Row: {
          created_at: string
          device: string | null
          id: string
          modal_type: string
          source_feature: string | null
          source_page: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device?: string | null
          id?: string
          modal_type: string
          source_feature?: string | null
          source_page: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device?: string | null
          id?: string
          modal_type?: string
          source_feature?: string | null
          source_page?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pro_purchases: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          payment_id: string | null
          status: string | null
          user_ip: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
          status?: string | null
          user_ip: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
          status?: string | null
          user_ip?: string
        }
        Relationships: []
      }
      processos_politicos: {
        Row: {
          created_at: string
          data_atualizacao: string | null
          data_inicio: string | null
          descricao: string | null
          fonte_raspagem: string | null
          id: string
          impacto_nota: number | null
          link_fonte: string | null
          numero_processo: string | null
          politico_id: number
          status: string | null
          tipo_politico: string
          tipo_processo: string | null
          tribunal: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_atualizacao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          fonte_raspagem?: string | null
          id?: string
          impacto_nota?: number | null
          link_fonte?: string | null
          numero_processo?: string | null
          politico_id: number
          status?: string | null
          tipo_politico: string
          tipo_processo?: string | null
          tribunal?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_atualizacao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          fonte_raspagem?: string | null
          id?: string
          impacto_nota?: number | null
          link_fonte?: string | null
          numero_processo?: string | null
          politico_id?: number
          status?: string | null
          tipo_politico?: string
          tipo_processo?: string | null
          tribunal?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      professora_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assinatura_url: string | null
          audio_boas_vindas: string | null
          audio_boas_vindas_ouvido: boolean | null
          avatar_url: string | null
          created_at: string | null
          device_info: Json | null
          dispositivo: string | null
          email: string | null
          email_escritorio: string | null
          endereco_escritorio: string | null
          estado_cadastro: string | null
          faixa_etaria: string | null
          id: string
          intencao: string | null
          ip_cadastro: string | null
          nome: string | null
          oab_estado: string | null
          oab_numero: string | null
          orientacao_politica: string | null
          pais_cadastro: string | null
          telefone: string | null
          telefone_escritorio: string | null
          trial_bloqueado_ip: boolean | null
          trial_modal_visto: boolean | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          assinatura_url?: string | null
          audio_boas_vindas?: string | null
          audio_boas_vindas_ouvido?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          device_info?: Json | null
          dispositivo?: string | null
          email?: string | null
          email_escritorio?: string | null
          endereco_escritorio?: string | null
          estado_cadastro?: string | null
          faixa_etaria?: string | null
          id: string
          intencao?: string | null
          ip_cadastro?: string | null
          nome?: string | null
          oab_estado?: string | null
          oab_numero?: string | null
          orientacao_politica?: string | null
          pais_cadastro?: string | null
          telefone?: string | null
          telefone_escritorio?: string | null
          trial_bloqueado_ip?: boolean | null
          trial_modal_visto?: boolean | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          assinatura_url?: string | null
          audio_boas_vindas?: string | null
          audio_boas_vindas_ouvido?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          device_info?: Json | null
          dispositivo?: string | null
          email?: string | null
          email_escritorio?: string | null
          endereco_escritorio?: string | null
          estado_cadastro?: string | null
          faixa_etaria?: string | null
          id?: string
          intencao?: string | null
          ip_cadastro?: string | null
          nome?: string | null
          oab_estado?: string | null
          oab_numero?: string | null
          orientacao_politica?: string | null
          pais_cadastro?: string | null
          telefone?: string | null
          telefone_escritorio?: string | null
          trial_bloqueado_ip?: boolean | null
          trial_modal_visto?: boolean | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      prompts_templates: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          id: string
          metadata: Json | null
          nome: string
          prompt_text: string
          updated_at: string
          versao: number
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          id?: string
          metadata?: Json | null
          nome: string
          prompt_text: string
          updated_at?: string
          versao?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          nome?: string
          prompt_text?: string
          updated_at?: string
          versao?: number
        }
        Relationships: []
      }
      push_agendados: {
        Row: {
          agendar_para: string
          cor: string | null
          created_at: string
          icone_url: string | null
          id: string
          imagem_url: string | null
          link: string | null
          mensagem: string
          resultado: Json | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          agendar_para: string
          cor?: string | null
          created_at?: string
          icone_url?: string | null
          id?: string
          imagem_url?: string | null
          link?: string | null
          mensagem: string
          resultado?: Json | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          agendar_para?: string
          cor?: string | null
          created_at?: string
          icone_url?: string | null
          id?: string
          imagem_url?: string | null
          link?: string | null
          mensagem?: string
          resultado?: Json | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_legislacao_inscritos: {
        Row: {
          areas_interesse: string[] | null
          ativo: boolean | null
          confirmado: boolean | null
          created_at: string | null
          email: string
          frequencia: string | null
          id: string
          nome: string | null
          token_confirmacao: string | null
          ultimo_envio: string | null
          updated_at: string | null
        }
        Insert: {
          areas_interesse?: string[] | null
          ativo?: boolean | null
          confirmado?: boolean | null
          created_at?: string | null
          email: string
          frequencia?: string | null
          id?: string
          nome?: string | null
          token_confirmacao?: string | null
          ultimo_envio?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_interesse?: string[] | null
          ativo?: boolean | null
          confirmado?: boolean | null
          created_at?: string | null
          email?: string
          frequencia?: string | null
          id?: string
          nome?: string | null
          token_confirmacao?: string | null
          ultimo_envio?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_templates: {
        Row: {
          cor: string | null
          created_at: string
          icone_url: string | null
          id: string
          imagem_url: string | null
          link: string | null
          mensagem: string
          titulo: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          icone_url?: string | null
          id?: string
          imagem_url?: string | null
          link?: string | null
          mensagem: string
          titulo: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          icone_url?: string | null
          id?: string
          imagem_url?: string | null
          link?: string | null
          mensagem?: string
          titulo?: string
        }
        Relationships: []
      }
      QUESTOES_ARTIGOS_LEI: {
        Row: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          area: string
          artigo: string
          comentario: string | null
          created_at: string | null
          dificuldade: string | null
          enunciado: string
          exemplo_pratico: string | null
          id: number
          resposta_correta: string
          updated_at: string | null
          url_audio_comentario: string | null
          url_audio_enunciado: string | null
          url_audio_exemplo: string | null
          url_imagem_exemplo: string | null
        }
        Insert: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          area: string
          artigo: string
          comentario?: string | null
          created_at?: string | null
          dificuldade?: string | null
          enunciado: string
          exemplo_pratico?: string | null
          id?: number
          resposta_correta: string
          updated_at?: string | null
          url_audio_comentario?: string | null
          url_audio_enunciado?: string | null
          url_audio_exemplo?: string | null
          url_imagem_exemplo?: string | null
        }
        Update: {
          alternativa_a?: string
          alternativa_b?: string
          alternativa_c?: string
          alternativa_d?: string
          area?: string
          artigo?: string
          comentario?: string | null
          created_at?: string | null
          dificuldade?: string | null
          enunciado?: string
          exemplo_pratico?: string | null
          id?: number
          resposta_correta?: string
          updated_at?: string | null
          url_audio_comentario?: string | null
          url_audio_enunciado?: string | null
          url_audio_exemplo?: string | null
          url_imagem_exemplo?: string | null
        }
        Relationships: []
      }
      QUESTOES_GERADAS: {
        Row: {
          acertos: number | null
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          aprovada: boolean | null
          area: string
          comentario: string
          created_at: string | null
          enunciado: string
          erros: number | null
          exemplo_pratico: string | null
          gerada_em: string | null
          id: number
          modelo_ia: string | null
          reportada: number | null
          resposta_correta: string
          subtema: string | null
          taxa_acerto: number | null
          tema: string
          updated_at: string | null
          url_audio: string | null
          url_audio_comentario: string | null
          url_audio_exemplo: string | null
          url_imagem_exemplo: string | null
          versao_geracao: number | null
          vezes_respondida: number | null
        }
        Insert: {
          acertos?: number | null
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          aprovada?: boolean | null
          area: string
          comentario: string
          created_at?: string | null
          enunciado: string
          erros?: number | null
          exemplo_pratico?: string | null
          gerada_em?: string | null
          id?: number
          modelo_ia?: string | null
          reportada?: number | null
          resposta_correta: string
          subtema?: string | null
          taxa_acerto?: number | null
          tema: string
          updated_at?: string | null
          url_audio?: string | null
          url_audio_comentario?: string | null
          url_audio_exemplo?: string | null
          url_imagem_exemplo?: string | null
          versao_geracao?: number | null
          vezes_respondida?: number | null
        }
        Update: {
          acertos?: number | null
          alternativa_a?: string
          alternativa_b?: string
          alternativa_c?: string
          alternativa_d?: string
          aprovada?: boolean | null
          area?: string
          comentario?: string
          created_at?: string | null
          enunciado?: string
          erros?: number | null
          exemplo_pratico?: string | null
          gerada_em?: string | null
          id?: number
          modelo_ia?: string | null
          reportada?: number | null
          resposta_correta?: string
          subtema?: string | null
          taxa_acerto?: number | null
          tema?: string
          updated_at?: string | null
          url_audio?: string | null
          url_audio_comentario?: string | null
          url_audio_exemplo?: string | null
          url_imagem_exemplo?: string | null
          versao_geracao?: number | null
          vezes_respondida?: number | null
        }
        Relationships: []
      }
      questoes_grifos_cache: {
        Row: {
          alternativa_correta: string | null
          created_at: string | null
          enunciado: string | null
          id: number
          numero_artigo: string
          questao_id: number | null
          tabela_codigo: string
          texto_artigo: string | null
          trechos_grifados: string[] | null
          updated_at: string | null
        }
        Insert: {
          alternativa_correta?: string | null
          created_at?: string | null
          enunciado?: string | null
          id?: number
          numero_artigo: string
          questao_id?: number | null
          tabela_codigo: string
          texto_artigo?: string | null
          trechos_grifados?: string[] | null
          updated_at?: string | null
        }
        Update: {
          alternativa_correta?: string | null
          created_at?: string | null
          enunciado?: string | null
          id?: number
          numero_artigo?: string
          questao_id?: number | null
          tabela_codigo?: string
          texto_artigo?: string | null
          trechos_grifados?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      QUESTOES_RASPADAS: {
        Row: {
          acertos: number | null
          alternativa_a: string | null
          alternativa_b: string | null
          alternativa_c: string | null
          alternativa_d: string | null
          alternativa_e: string | null
          ano: number | null
          assunto: string | null
          banca: string | null
          cargo: string | null
          comentario: string | null
          created_at: string | null
          disciplina: string
          enunciado: string
          erros: number | null
          fonte: string | null
          id: number
          id_origem: string
          nivel_dificuldade: string | null
          orgao: string | null
          prova: string | null
          resposta_correta: string | null
          updated_at: string | null
          url_questao: string | null
          vezes_respondida: number | null
        }
        Insert: {
          acertos?: number | null
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          alternativa_e?: string | null
          ano?: number | null
          assunto?: string | null
          banca?: string | null
          cargo?: string | null
          comentario?: string | null
          created_at?: string | null
          disciplina: string
          enunciado: string
          erros?: number | null
          fonte?: string | null
          id?: number
          id_origem: string
          nivel_dificuldade?: string | null
          orgao?: string | null
          prova?: string | null
          resposta_correta?: string | null
          updated_at?: string | null
          url_questao?: string | null
          vezes_respondida?: number | null
        }
        Update: {
          acertos?: number | null
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          alternativa_e?: string | null
          ano?: number | null
          assunto?: string | null
          banca?: string | null
          cargo?: string | null
          comentario?: string | null
          created_at?: string | null
          disciplina?: string
          enunciado?: string
          erros?: number | null
          fonte?: string | null
          id?: number
          id_origem?: string
          nivel_dificuldade?: string | null
          orgao?: string | null
          prova?: string | null
          resposta_correta?: string | null
          updated_at?: string | null
          url_questao?: string | null
          vezes_respondida?: number | null
        }
        Relationships: []
      }
      radar_capas_diarias: {
        Row: {
          created_at: string | null
          data: string
          id: string
          subtitulo_capa: string | null
          tipo: string
          titulo_capa: string | null
          total_noticias: number | null
          url_capa: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          id?: string
          subtitulo_capa?: string | null
          tipo: string
          titulo_capa?: string | null
          total_noticias?: number | null
          url_capa?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          subtitulo_capa?: string | null
          tipo?: string
          titulo_capa?: string | null
          total_noticias?: number | null
          url_capa?: string | null
        }
        Relationships: []
      }
      raio_x_legislativo: {
        Row: {
          artigos_afetados: string[] | null
          categoria: string
          created_at: string | null
          id: string
          lei_afetada: string | null
          relevancia: string | null
          resenha_id: string | null
          resumo_alteracao: string | null
          tipo_alteracao: string | null
        }
        Insert: {
          artigos_afetados?: string[] | null
          categoria: string
          created_at?: string | null
          id?: string
          lei_afetada?: string | null
          relevancia?: string | null
          resenha_id?: string | null
          resumo_alteracao?: string | null
          tipo_alteracao?: string | null
        }
        Update: {
          artigos_afetados?: string[] | null
          categoria?: string
          created_at?: string | null
          id?: string
          lei_afetada?: string | null
          relevancia?: string | null
          resenha_id?: string | null
          resumo_alteracao?: string | null
          tipo_alteracao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raio_x_legislativo_resenha_id_fkey"
            columns: ["resenha_id"]
            isOneToOne: false
            referencedRelation: "resenha_diaria"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_comissoes: {
        Row: {
          atualizado_em: string | null
          deputado_id: number
          foto_url: string | null
          id: string
          nome: string
          partido: string | null
          posicao: number
          posicao_anterior: number | null
          total_orgaos: number | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          deputado_id: number
          foto_url?: string | null
          id?: string
          nome: string
          partido?: string | null
          posicao?: number
          posicao_anterior?: number | null
          total_orgaos?: number | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          deputado_id?: number
          foto_url?: string | null
          id?: string
          nome?: string
          partido?: string | null
          posicao?: number
          posicao_anterior?: number | null
          total_orgaos?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_despesas: {
        Row: {
          ano: number
          atualizado_em: string | null
          deputado_id: number
          foto_url: string | null
          id: string
          mes: number | null
          nome: string
          partido: string | null
          posicao: number
          posicao_anterior: number | null
          total_gasto: number | null
          uf: string | null
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          deputado_id: number
          foto_url?: string | null
          id?: string
          mes?: number | null
          nome: string
          partido?: string | null
          posicao?: number
          posicao_anterior?: number | null
          total_gasto?: number | null
          uf?: string | null
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          deputado_id?: number
          foto_url?: string | null
          id?: string
          mes?: number | null
          nome?: string
          partido?: string | null
          posicao?: number
          posicao_anterior?: number | null
          total_gasto?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_despesas_mandato: {
        Row: {
          atualizado_em: string | null
          deputado_id: number
          foto_url: string | null
          id: string
          mandato_inicio: string | null
          nome: string
          partido: string | null
          posicao: number | null
          posicao_anterior: number | null
          total_gasto: number | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          deputado_id: number
          foto_url?: string | null
          id?: string
          mandato_inicio?: string | null
          nome: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          total_gasto?: number | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          deputado_id?: number
          foto_url?: string | null
          id?: string
          mandato_inicio?: string | null
          nome?: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          total_gasto?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_discursos: {
        Row: {
          ano: number | null
          atualizado_em: string | null
          deputado_id: number
          foto_url: string | null
          id: string
          nome: string
          partido: string | null
          posicao: number | null
          posicao_anterior: number | null
          total_discursos: number | null
          uf: string | null
        }
        Insert: {
          ano?: number | null
          atualizado_em?: string | null
          deputado_id: number
          foto_url?: string | null
          id?: string
          nome: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          total_discursos?: number | null
          uf?: string | null
        }
        Update: {
          ano?: number | null
          atualizado_em?: string | null
          deputado_id?: number
          foto_url?: string | null
          id?: string
          nome?: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          total_discursos?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_explicacoes: {
        Row: {
          created_at: string | null
          explicacao: string
          id: string
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          explicacao: string
          id?: string
          tipo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          explicacao?: string
          id?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ranking_frentes: {
        Row: {
          atualizado_em: string | null
          deputado_id: number
          foto_url: string | null
          id: string
          nome: string
          partido: string | null
          posicao: number | null
          posicao_anterior: number | null
          total_frentes: number | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          deputado_id: number
          foto_url?: string | null
          id?: string
          nome: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          total_frentes?: number | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          deputado_id?: number
          foto_url?: string | null
          id?: string
          nome?: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          total_frentes?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_menos_despesas: {
        Row: {
          atualizado_em: string | null
          deputado_id: number
          foto_url: string | null
          id: string
          nome: string
          partido: string | null
          total_gasto: number | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          deputado_id: number
          foto_url?: string | null
          id?: string
          nome: string
          partido?: string | null
          total_gasto?: number | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          deputado_id?: number
          foto_url?: string | null
          id?: string
          nome?: string
          partido?: string | null
          total_gasto?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_nota_final: {
        Row: {
          created_at: string
          foto_url: string | null
          id: string
          nome: string
          nota_final: number
          nota_gastos: number | null
          nota_outros: number | null
          nota_presenca: number | null
          nota_processos: number | null
          nota_proposicoes: number | null
          nota_votacoes: number | null
          partido: string | null
          politico_id: number
          posicao: number | null
          posicao_anterior: number | null
          tipo: string
          uf: string | null
          updated_at: string
          variacao_posicao: number | null
        }
        Insert: {
          created_at?: string
          foto_url?: string | null
          id?: string
          nome: string
          nota_final?: number
          nota_gastos?: number | null
          nota_outros?: number | null
          nota_presenca?: number | null
          nota_processos?: number | null
          nota_proposicoes?: number | null
          nota_votacoes?: number | null
          partido?: string | null
          politico_id: number
          posicao?: number | null
          posicao_anterior?: number | null
          tipo: string
          uf?: string | null
          updated_at?: string
          variacao_posicao?: number | null
        }
        Update: {
          created_at?: string
          foto_url?: string | null
          id?: string
          nome?: string
          nota_final?: number
          nota_gastos?: number | null
          nota_outros?: number | null
          nota_presenca?: number | null
          nota_processos?: number | null
          nota_proposicoes?: number | null
          nota_votacoes?: number | null
          partido?: string | null
          politico_id?: number
          posicao?: number | null
          posicao_anterior?: number | null
          tipo?: string
          uf?: string | null
          updated_at?: string
          variacao_posicao?: number | null
        }
        Relationships: []
      }
      ranking_presenca: {
        Row: {
          atualizado_em: string | null
          deputado_id: number
          foto_url: string | null
          id: string
          nome: string
          partido: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          posicao: number
          posicao_anterior: number | null
          total_eventos: number | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          deputado_id: number
          foto_url?: string | null
          id?: string
          nome: string
          partido?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          posicao?: number
          posicao_anterior?: number | null
          total_eventos?: number | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          deputado_id?: number
          foto_url?: string | null
          id?: string
          nome?: string
          partido?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          posicao?: number
          posicao_anterior?: number | null
          total_eventos?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_proposicoes: {
        Row: {
          ano: number
          atualizado_em: string | null
          deputado_id: number
          foto_url: string | null
          id: string
          nome: string
          partido: string | null
          posicao: number
          posicao_anterior: number | null
          total_proposicoes: number | null
          uf: string | null
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          deputado_id: number
          foto_url?: string | null
          id?: string
          nome: string
          partido?: string | null
          posicao?: number
          posicao_anterior?: number | null
          total_proposicoes?: number | null
          uf?: string | null
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          deputado_id?: number
          foto_url?: string | null
          id?: string
          nome?: string
          partido?: string | null
          posicao?: number
          posicao_anterior?: number | null
          total_proposicoes?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_senadores_comissoes: {
        Row: {
          atualizado_em: string | null
          foto_url: string | null
          id: string
          nome: string
          partido: string | null
          posicao: number | null
          posicao_anterior: number | null
          senador_codigo: string
          total_comissoes: number | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          senador_codigo: string
          total_comissoes?: number | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          senador_codigo?: string
          total_comissoes?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_senadores_despesas: {
        Row: {
          ano: number
          atualizado_em: string | null
          foto_url: string | null
          id: string
          mes: number | null
          nome: string
          partido: string | null
          posicao: number | null
          posicao_anterior: number | null
          senador_codigo: string
          total_gasto: number | null
          uf: string | null
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          foto_url?: string | null
          id?: string
          mes?: number | null
          nome: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          senador_codigo: string
          total_gasto?: number | null
          uf?: string | null
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          foto_url?: string | null
          id?: string
          mes?: number | null
          nome?: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          senador_codigo?: string
          total_gasto?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_senadores_discursos: {
        Row: {
          ano: number
          atualizado_em: string | null
          foto_url: string | null
          id: string
          nome: string
          partido: string | null
          posicao: number | null
          posicao_anterior: number | null
          senador_codigo: string
          total_discursos: number | null
          uf: string | null
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          senador_codigo: string
          total_discursos?: number | null
          uf?: string | null
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          senador_codigo?: string
          total_discursos?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_senadores_materias: {
        Row: {
          ano: number
          atualizado_em: string | null
          foto_url: string | null
          id: string
          nome: string
          partido: string | null
          posicao: number | null
          posicao_anterior: number | null
          senador_codigo: string
          total_materias: number | null
          uf: string | null
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          senador_codigo: string
          total_materias?: number | null
          uf?: string | null
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          senador_codigo?: string
          total_materias?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      ranking_senadores_votacoes: {
        Row: {
          ano: number
          atualizado_em: string | null
          foto_url: string | null
          id: string
          nome: string
          partido: string | null
          posicao: number | null
          posicao_anterior: number | null
          senador_codigo: string
          total_votacoes: number | null
          uf: string | null
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          senador_codigo: string
          total_votacoes?: number | null
          uf?: string | null
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          partido?: string | null
          posicao?: number | null
          posicao_anterior?: number | null
          senador_codigo?: string
          total_votacoes?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      "RANKING-FACULDADES": {
        Row: {
          avaliacao_cn: number | null
          avaliacao_mec: number | null
          estado: string | null
          id: number
          nota_concluintes: number | null
          nota_doutores: number | null
          nota_geral: number | null
          posicao: number | null
          qualidade: number | null
          qualidade_doutores: number | null
          quantidade_doutores: number | null
          tipo: string | null
          universidade: string
        }
        Insert: {
          avaliacao_cn?: number | null
          avaliacao_mec?: number | null
          estado?: string | null
          id: number
          nota_concluintes?: number | null
          nota_doutores?: number | null
          nota_geral?: number | null
          posicao?: number | null
          qualidade?: number | null
          qualidade_doutores?: number | null
          quantidade_doutores?: number | null
          tipo?: string | null
          universidade: string
        }
        Update: {
          avaliacao_cn?: number | null
          avaliacao_mec?: number | null
          estado?: string | null
          id?: number
          nota_concluintes?: number | null
          nota_doutores?: number | null
          nota_geral?: number | null
          posicao?: number | null
          qualidade?: number | null
          qualidade_doutores?: number | null
          quantidade_doutores?: number | null
          tipo?: string | null
          universidade?: string
        }
        Relationships: []
      }
      rascunhos_leis: {
        Row: {
          artigos: Json
          created_at: string
          id: string
          nome_lei: string
          tabela_destino: string
          total_artigos: number
          updated_at: string
        }
        Insert: {
          artigos: Json
          created_at?: string
          id?: string
          nome_lei: string
          tabela_destino: string
          total_artigos?: number
          updated_at?: string
        }
        Update: {
          artigos?: Json
          created_at?: string
          id?: string
          nome_lei?: string
          tabela_destino?: string
          total_artigos?: number
          updated_at?: string
        }
        Relationships: []
      }
      redacao_conteudo: {
        Row: {
          categoria: string
          conteudo: string
          created_at: string
          dicas: Json | null
          exemplos: Json | null
          id: number
          ordem: number
          pagina_pdf: number | null
          subcategoria: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria: string
          conteudo: string
          created_at?: string
          dicas?: Json | null
          exemplos?: Json | null
          id?: number
          ordem?: number
          pagina_pdf?: number | null
          subcategoria?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          conteudo?: string
          created_at?: string
          dicas?: Json | null
          exemplos?: Json | null
          id?: number
          ordem?: number
          pagina_pdf?: number | null
          subcategoria?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      resenha_diaria: {
        Row: {
          areas_direito: string[] | null
          artigos: Json | null
          created_at: string
          data_publicacao: string | null
          ementa: string | null
          explicacao_lei: string | null
          explicacoes_artigos: Json | null
          id: string
          numero_lei: string
          ordem_dou: number | null
          status: string | null
          texto_formatado: string | null
          updated_at: string
          url_planalto: string
        }
        Insert: {
          areas_direito?: string[] | null
          artigos?: Json | null
          created_at?: string
          data_publicacao?: string | null
          ementa?: string | null
          explicacao_lei?: string | null
          explicacoes_artigos?: Json | null
          id?: string
          numero_lei: string
          ordem_dou?: number | null
          status?: string | null
          texto_formatado?: string | null
          updated_at?: string
          url_planalto: string
        }
        Update: {
          areas_direito?: string[] | null
          artigos?: Json | null
          created_at?: string
          data_publicacao?: string | null
          ementa?: string | null
          explicacao_lei?: string | null
          explicacoes_artigos?: Json | null
          id?: string
          numero_lei?: string
          ordem_dou?: number | null
          status?: string | null
          texto_formatado?: string | null
          updated_at?: string
          url_planalto?: string
        }
        Relationships: []
      }
      resultados_eleicoes: {
        Row: {
          ano: number
          cargo: string
          created_at: string | null
          id: number
          nome_candidato: string
          numero: string
          partido: string
          percentual_votos: number | null
          situacao: string | null
          sq_candidato: number
          turno: number
          uf: string
          votos: number
        }
        Insert: {
          ano: number
          cargo: string
          created_at?: string | null
          id?: number
          nome_candidato: string
          numero: string
          partido: string
          percentual_votos?: number | null
          situacao?: string | null
          sq_candidato: number
          turno?: number
          uf: string
          votos: number
        }
        Update: {
          ano?: number
          cargo?: string
          created_at?: string | null
          id?: number
          nome_candidato?: string
          numero?: string
          partido?: string
          percentual_votos?: number | null
          situacao?: string | null
          sq_candidato?: number
          turno?: number
          uf?: string
          votos?: number
        }
        Relationships: []
      }
      RESUMO: {
        Row: {
          area: string | null
          capa_url: string | null
          conteudo: string | null
          conteudo_gerado: Json | null
          id: number
          "ordem subtema": string | null
          "ordem Tema": string | null
          slides_json: Json | null
          subtema: string | null
          tema: string | null
          timepoints_exemplos: Json | null
          timepoints_resumo: Json | null
          timepoints_termos: Json | null
          ultima_atualizacao: string | null
          url_audio_exemplos: string | null
          url_audio_resumo: string | null
          url_audio_termos: string | null
          url_imagem_exemplo_1: string | null
          url_imagem_exemplo_2: string | null
          url_imagem_exemplo_3: string | null
          url_imagem_resumo: string | null
          url_pdf: string | null
        }
        Insert: {
          area?: string | null
          capa_url?: string | null
          conteudo?: string | null
          conteudo_gerado?: Json | null
          id?: number
          "ordem subtema"?: string | null
          "ordem Tema"?: string | null
          slides_json?: Json | null
          subtema?: string | null
          tema?: string | null
          timepoints_exemplos?: Json | null
          timepoints_resumo?: Json | null
          timepoints_termos?: Json | null
          ultima_atualizacao?: string | null
          url_audio_exemplos?: string | null
          url_audio_resumo?: string | null
          url_audio_termos?: string | null
          url_imagem_exemplo_1?: string | null
          url_imagem_exemplo_2?: string | null
          url_imagem_exemplo_3?: string | null
          url_imagem_resumo?: string | null
          url_pdf?: string | null
        }
        Update: {
          area?: string | null
          capa_url?: string | null
          conteudo?: string | null
          conteudo_gerado?: Json | null
          id?: number
          "ordem subtema"?: string | null
          "ordem Tema"?: string | null
          slides_json?: Json | null
          subtema?: string | null
          tema?: string | null
          timepoints_exemplos?: Json | null
          timepoints_resumo?: Json | null
          timepoints_termos?: Json | null
          ultima_atualizacao?: string | null
          url_audio_exemplos?: string | null
          url_audio_resumo?: string | null
          url_audio_termos?: string | null
          url_imagem_exemplo_1?: string | null
          url_imagem_exemplo_2?: string | null
          url_imagem_exemplo_3?: string | null
          url_imagem_resumo?: string | null
          url_pdf?: string | null
        }
        Relationships: []
      }
      resumos_acessos: {
        Row: {
          created_at: string | null
          id: number
          resumo_id: number
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          resumo_id: number
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          resumo_id?: number
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      RESUMOS_ARTIGOS_LEI: {
        Row: {
          area: string
          conteudo_original: string | null
          created_at: string | null
          exemplos: string | null
          id: number
          referencias_web: string | null
          resumo_markdown: string | null
          tema: string
          termos: string | null
          url_audio_exemplos: string | null
          url_audio_resumo: string | null
          url_audio_termos: string | null
          url_imagem_exemplo_1: string | null
          url_imagem_exemplo_2: string | null
          url_imagem_exemplo_3: string | null
          url_imagem_resumo: string | null
          versao_prompt: string | null
        }
        Insert: {
          area: string
          conteudo_original?: string | null
          created_at?: string | null
          exemplos?: string | null
          id?: number
          referencias_web?: string | null
          resumo_markdown?: string | null
          tema: string
          termos?: string | null
          url_audio_exemplos?: string | null
          url_audio_resumo?: string | null
          url_audio_termos?: string | null
          url_imagem_exemplo_1?: string | null
          url_imagem_exemplo_2?: string | null
          url_imagem_exemplo_3?: string | null
          url_imagem_resumo?: string | null
          versao_prompt?: string | null
        }
        Update: {
          area?: string
          conteudo_original?: string | null
          created_at?: string | null
          exemplos?: string | null
          id?: number
          referencias_web?: string | null
          resumo_markdown?: string | null
          tema?: string
          termos?: string | null
          url_audio_exemplos?: string | null
          url_audio_resumo?: string | null
          url_audio_termos?: string | null
          url_imagem_exemplo_1?: string | null
          url_imagem_exemplo_2?: string | null
          url_imagem_exemplo_3?: string | null
          url_imagem_resumo?: string | null
          versao_prompt?: string | null
        }
        Relationships: []
      }
      resumos_diarios: {
        Row: {
          created_at: string | null
          data: string
          hora_corte: string | null
          id: string
          noticias_ids: Json | null
          slides: Json | null
          termos: Json | null
          texto_resumo: string | null
          tipo: string
          total_noticias: number | null
          url_audio: string | null
          url_audio_abertura: string | null
          url_audio_fechamento: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          hora_corte?: string | null
          id?: string
          noticias_ids?: Json | null
          slides?: Json | null
          termos?: Json | null
          texto_resumo?: string | null
          tipo: string
          total_noticias?: number | null
          url_audio?: string | null
          url_audio_abertura?: string | null
          url_audio_fechamento?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          hora_corte?: string | null
          id?: string
          noticias_ids?: Json | null
          slides?: Json | null
          termos?: Json | null
          texto_resumo?: string | null
          tipo?: string
          total_noticias?: number | null
          url_audio?: string | null
          url_audio_abertura?: string | null
          url_audio_fechamento?: string | null
        }
        Relationships: []
      }
      resumos_personalizados_historico: {
        Row: {
          caracteres_fonte: number | null
          created_at: string | null
          id: string
          nivel: string
          nome_arquivo: string | null
          resumo: string
          tipo_entrada: string
          titulo: string
          user_id: string
        }
        Insert: {
          caracteres_fonte?: number | null
          created_at?: string | null
          id?: string
          nivel: string
          nome_arquivo?: string | null
          resumo: string
          tipo_entrada: string
          titulo: string
          user_id: string
        }
        Update: {
          caracteres_fonte?: number | null
          created_at?: string | null
          id?: string
          nivel?: string
          nome_arquivo?: string | null
          resumo?: string
          tipo_entrada?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      senado_comissoes: {
        Row: {
          ativa: boolean | null
          casa: string | null
          codigo: string
          created_at: string | null
          dados_completos: Json | null
          data_criacao: string | null
          data_extincao: string | null
          id: number
          nome: string | null
          participantes: number | null
          sigla: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          casa?: string | null
          codigo: string
          created_at?: string | null
          dados_completos?: Json | null
          data_criacao?: string | null
          data_extincao?: string | null
          id?: number
          nome?: string | null
          participantes?: number | null
          sigla?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          casa?: string | null
          codigo?: string
          created_at?: string | null
          dados_completos?: Json | null
          data_criacao?: string | null
          data_extincao?: string | null
          id?: number
          nome?: string | null
          participantes?: number | null
          sigla?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      senado_materias: {
        Row: {
          ano: string | null
          autor: string | null
          codigo: string
          created_at: string | null
          dados_completos: Json | null
          data_apresentacao: string | null
          ementa: string | null
          id: number
          numero: string | null
          sigla: string | null
          situacao: string | null
          updated_at: string | null
        }
        Insert: {
          ano?: string | null
          autor?: string | null
          codigo: string
          created_at?: string | null
          dados_completos?: Json | null
          data_apresentacao?: string | null
          ementa?: string | null
          id?: number
          numero?: string | null
          sigla?: string | null
          situacao?: string | null
          updated_at?: string | null
        }
        Update: {
          ano?: string | null
          autor?: string | null
          codigo?: string
          created_at?: string | null
          dados_completos?: Json | null
          data_apresentacao?: string | null
          ementa?: string | null
          id?: number
          numero?: string | null
          sigla?: string | null
          situacao?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      senado_senadores: {
        Row: {
          bloco: string | null
          codigo: string
          created_at: string | null
          dados_completos: Json | null
          email: string | null
          foto: string | null
          id: number
          nome: string | null
          nome_completo: string | null
          pagina_web: string | null
          partido: string | null
          sexo: string | null
          telefone: string | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          bloco?: string | null
          codigo: string
          created_at?: string | null
          dados_completos?: Json | null
          email?: string | null
          foto?: string | null
          id?: number
          nome?: string | null
          nome_completo?: string | null
          pagina_web?: string | null
          partido?: string | null
          sexo?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          bloco?: string | null
          codigo?: string
          created_at?: string | null
          dados_completos?: Json | null
          email?: string | null
          foto?: string | null
          id?: number
          nome?: string | null
          nome_completo?: string | null
          pagina_web?: string | null
          partido?: string | null
          sexo?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      senado_sync_log: {
        Row: {
          concluido_em: string | null
          created_at: string | null
          erro_mensagem: string | null
          id: number
          iniciado_em: string | null
          status: string | null
          tipo: string
          total_registros: number | null
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string | null
          erro_mensagem?: string | null
          id?: number
          iniciado_em?: string | null
          status?: string | null
          tipo: string
          total_registros?: number | null
        }
        Update: {
          concluido_em?: string | null
          created_at?: string | null
          erro_mensagem?: string | null
          id?: number
          iniciado_em?: string | null
          status?: string | null
          tipo?: string
          total_registros?: number | null
        }
        Relationships: []
      }
      senado_votacoes: {
        Row: {
          codigo_sessao: string | null
          codigo_votacao: string | null
          created_at: string | null
          data_sessao: string
          descricao_sessao: string | null
          descricao_votacao: string | null
          id: number
          materia_ano: string | null
          materia_codigo: string | null
          materia_numero: string | null
          materia_sigla: string | null
          resultado: string | null
          total_abstencao: number | null
          total_nao: number | null
          total_sim: number | null
          updated_at: string | null
          votos: Json | null
        }
        Insert: {
          codigo_sessao?: string | null
          codigo_votacao?: string | null
          created_at?: string | null
          data_sessao: string
          descricao_sessao?: string | null
          descricao_votacao?: string | null
          id?: number
          materia_ano?: string | null
          materia_codigo?: string | null
          materia_numero?: string | null
          materia_sigla?: string | null
          resultado?: string | null
          total_abstencao?: number | null
          total_nao?: number | null
          total_sim?: number | null
          updated_at?: string | null
          votos?: Json | null
        }
        Update: {
          codigo_sessao?: string | null
          codigo_votacao?: string | null
          created_at?: string | null
          data_sessao?: string
          descricao_sessao?: string | null
          descricao_votacao?: string | null
          id?: number
          materia_ano?: string | null
          materia_codigo?: string | null
          materia_numero?: string | null
          materia_sigla?: string | null
          resultado?: string | null
          total_abstencao?: number | null
          total_nao?: number | null
          total_sim?: number | null
          updated_at?: string | null
          votos?: Json | null
        }
        Relationships: []
      }
      SIMULACAO_CASOS: {
        Row: {
          area: string
          artigos_fundamentacao_corretos: Json | null
          artigos_ids: number[] | null
          artigos_relacionados: Json | null
          avatar_advogado_reu: string | null
          avatar_juiza: string | null
          cache_validade: string | null
          contexto_inicial: string
          created_at: string | null
          dicas: string[] | null
          dificuldade_ia: string | null
          estrutura_audiencia: Json | null
          fases: Json | null
          fatos_relevantes: Json | null
          feedback_negativo: string[] | null
          feedback_positivo: string[] | null
          genero_advogado_reu: string | null
          genero_jogador: string | null
          id: number
          livros_relacionados: Json | null
          mensagens_juiza: Json | null
          modo: string | null
          nivel_dificuldade: Database["public"]["Enums"]["nivel_dificuldade"]
          nome_advogado_reu: string | null
          nome_cliente: string | null
          nome_juiza: string | null
          nome_reu: string | null
          objecoes_disponiveis: Json | null
          perfil_advogado_reu: string | null
          perfil_cliente: string | null
          perfil_juiza: string | null
          perfil_reu: string | null
          permite_rebatimentos: boolean | null
          pontuacao_maxima: number | null
          preferencias_juiza: Json | null
          prompt_imagem: string | null
          provas: Json | null
          provas_visuais: Json | null
          questoes_alternativas: Json | null
          reacoes_disponiveis: Json | null
          rebatimentos_reu: Json | null
          refutacoes_por_opcao: Json | null
          sentenca_esperada_merito: string | null
          sentenca_ideal: string | null
          tabela_artigos: string | null
          tema: string
          template_respostas_adversario: Json | null
          template_respostas_juiza: Json | null
          testemunhas: Json | null
          tipo_adversario: string | null
          titulo_caso: string
          updated_at: string | null
          valor_condenacao_esperado: number | null
        }
        Insert: {
          area: string
          artigos_fundamentacao_corretos?: Json | null
          artigos_ids?: number[] | null
          artigos_relacionados?: Json | null
          avatar_advogado_reu?: string | null
          avatar_juiza?: string | null
          cache_validade?: string | null
          contexto_inicial: string
          created_at?: string | null
          dicas?: string[] | null
          dificuldade_ia?: string | null
          estrutura_audiencia?: Json | null
          fases?: Json | null
          fatos_relevantes?: Json | null
          feedback_negativo?: string[] | null
          feedback_positivo?: string[] | null
          genero_advogado_reu?: string | null
          genero_jogador?: string | null
          id?: number
          livros_relacionados?: Json | null
          mensagens_juiza?: Json | null
          modo?: string | null
          nivel_dificuldade?: Database["public"]["Enums"]["nivel_dificuldade"]
          nome_advogado_reu?: string | null
          nome_cliente?: string | null
          nome_juiza?: string | null
          nome_reu?: string | null
          objecoes_disponiveis?: Json | null
          perfil_advogado_reu?: string | null
          perfil_cliente?: string | null
          perfil_juiza?: string | null
          perfil_reu?: string | null
          permite_rebatimentos?: boolean | null
          pontuacao_maxima?: number | null
          preferencias_juiza?: Json | null
          prompt_imagem?: string | null
          provas?: Json | null
          provas_visuais?: Json | null
          questoes_alternativas?: Json | null
          reacoes_disponiveis?: Json | null
          rebatimentos_reu?: Json | null
          refutacoes_por_opcao?: Json | null
          sentenca_esperada_merito?: string | null
          sentenca_ideal?: string | null
          tabela_artigos?: string | null
          tema: string
          template_respostas_adversario?: Json | null
          template_respostas_juiza?: Json | null
          testemunhas?: Json | null
          tipo_adversario?: string | null
          titulo_caso: string
          updated_at?: string | null
          valor_condenacao_esperado?: number | null
        }
        Update: {
          area?: string
          artigos_fundamentacao_corretos?: Json | null
          artigos_ids?: number[] | null
          artigos_relacionados?: Json | null
          avatar_advogado_reu?: string | null
          avatar_juiza?: string | null
          cache_validade?: string | null
          contexto_inicial?: string
          created_at?: string | null
          dicas?: string[] | null
          dificuldade_ia?: string | null
          estrutura_audiencia?: Json | null
          fases?: Json | null
          fatos_relevantes?: Json | null
          feedback_negativo?: string[] | null
          feedback_positivo?: string[] | null
          genero_advogado_reu?: string | null
          genero_jogador?: string | null
          id?: number
          livros_relacionados?: Json | null
          mensagens_juiza?: Json | null
          modo?: string | null
          nivel_dificuldade?: Database["public"]["Enums"]["nivel_dificuldade"]
          nome_advogado_reu?: string | null
          nome_cliente?: string | null
          nome_juiza?: string | null
          nome_reu?: string | null
          objecoes_disponiveis?: Json | null
          perfil_advogado_reu?: string | null
          perfil_cliente?: string | null
          perfil_juiza?: string | null
          perfil_reu?: string | null
          permite_rebatimentos?: boolean | null
          pontuacao_maxima?: number | null
          preferencias_juiza?: Json | null
          prompt_imagem?: string | null
          provas?: Json | null
          provas_visuais?: Json | null
          questoes_alternativas?: Json | null
          reacoes_disponiveis?: Json | null
          rebatimentos_reu?: Json | null
          refutacoes_por_opcao?: Json | null
          sentenca_esperada_merito?: string | null
          sentenca_ideal?: string | null
          tabela_artigos?: string | null
          tema?: string
          template_respostas_adversario?: Json | null
          template_respostas_juiza?: Json | null
          testemunhas?: Json | null
          tipo_adversario?: string | null
          titulo_caso?: string
          updated_at?: string | null
          valor_condenacao_esperado?: number | null
        }
        Relationships: []
      }
      SIMULACAO_PARTIDAS: {
        Row: {
          acertos: string[] | null
          acoes_realizadas: Json | null
          argumentacoes_escolhidas: Json | null
          artigos_citados: Json | null
          avatar_escolhido: string | null
          caso_id: number | null
          combo_atual: number | null
          combo_maximo: number | null
          conquistas_desbloqueadas: Json | null
          created_at: string | null
          credibilidade: number | null
          deferido: boolean | null
          desvantagens: Json | null
          erros: string[] | null
          escolhas_detalhadas: Json | null
          estrategia_escolhida: string | null
          experiencia: number | null
          foco: number | null
          fundamentacao_legal_score: number | null
          habilidades: Json | null
          historico_mensagens: Json | null
          historico_turnos: Json | null
          id: number
          interrupcoes_sofridas: number | null
          nivel_advogado: string | null
          objecoes_realizadas: Json | null
          pausado_em: string | null
          pontuacao_final: number | null
          provas_escolhidas: Json | null
          reacoes_juiza: Json | null
          rebatimentos_realizados: Json | null
          sentenca_recebida: string | null
          sugestoes_melhoria: string[] | null
          tempo_jogado: number | null
          turno_atual: string | null
          user_id: string | null
          vantagens: Json | null
        }
        Insert: {
          acertos?: string[] | null
          acoes_realizadas?: Json | null
          argumentacoes_escolhidas?: Json | null
          artigos_citados?: Json | null
          avatar_escolhido?: string | null
          caso_id?: number | null
          combo_atual?: number | null
          combo_maximo?: number | null
          conquistas_desbloqueadas?: Json | null
          created_at?: string | null
          credibilidade?: number | null
          deferido?: boolean | null
          desvantagens?: Json | null
          erros?: string[] | null
          escolhas_detalhadas?: Json | null
          estrategia_escolhida?: string | null
          experiencia?: number | null
          foco?: number | null
          fundamentacao_legal_score?: number | null
          habilidades?: Json | null
          historico_mensagens?: Json | null
          historico_turnos?: Json | null
          id?: number
          interrupcoes_sofridas?: number | null
          nivel_advogado?: string | null
          objecoes_realizadas?: Json | null
          pausado_em?: string | null
          pontuacao_final?: number | null
          provas_escolhidas?: Json | null
          reacoes_juiza?: Json | null
          rebatimentos_realizados?: Json | null
          sentenca_recebida?: string | null
          sugestoes_melhoria?: string[] | null
          tempo_jogado?: number | null
          turno_atual?: string | null
          user_id?: string | null
          vantagens?: Json | null
        }
        Update: {
          acertos?: string[] | null
          acoes_realizadas?: Json | null
          argumentacoes_escolhidas?: Json | null
          artigos_citados?: Json | null
          avatar_escolhido?: string | null
          caso_id?: number | null
          combo_atual?: number | null
          combo_maximo?: number | null
          conquistas_desbloqueadas?: Json | null
          created_at?: string | null
          credibilidade?: number | null
          deferido?: boolean | null
          desvantagens?: Json | null
          erros?: string[] | null
          escolhas_detalhadas?: Json | null
          estrategia_escolhida?: string | null
          experiencia?: number | null
          foco?: number | null
          fundamentacao_legal_score?: number | null
          habilidades?: Json | null
          historico_mensagens?: Json | null
          historico_turnos?: Json | null
          id?: number
          interrupcoes_sofridas?: number | null
          nivel_advogado?: string | null
          objecoes_realizadas?: Json | null
          pausado_em?: string | null
          pontuacao_final?: number | null
          provas_escolhidas?: Json | null
          reacoes_juiza?: Json | null
          rebatimentos_realizados?: Json | null
          sentenca_recebida?: string | null
          sugestoes_melhoria?: string[] | null
          tempo_jogado?: number | null
          turno_atual?: string | null
          user_id?: string | null
          vantagens?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "SIMULACAO_PARTIDAS_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "SIMULACAO_CASOS"
            referencedColumns: ["id"]
          },
        ]
      }
      SIMULACAO_PARTIDAS_JUIZ: {
        Row: {
          acertos: string[] | null
          advertencias_dadas: number | null
          argumentos_julgados: Json | null
          artigos_fundamentacao: Json | null
          caso_id: number | null
          contradicoes_resolvidas: Json | null
          created_at: string | null
          custas_responsavel: string | null
          decisao_merito: string | null
          decisoes_preparacao: Json | null
          erros: string[] | null
          excecoes_processuais: Json | null
          fundamentacao_correta: boolean | null
          historico_mensagens: Json | null
          honorarios_percentual: number | null
          id: number
          materiais_recomendados: Json | null
          motivos_recurso: string[] | null
          multas_aplicadas: number | null
          nivel_juiz: string | null
          nota_celeridade: number | null
          nota_justica: number | null
          nota_ordem_processual: number | null
          perguntas_deferidas: number | null
          perguntas_indeferidas: number | null
          pontuacao_total: number | null
          provas_aceitas: Json | null
          provas_indeferidas: Json | null
          recurso_acolhido: boolean | null
          reputacao: number | null
          sentenca_correta: boolean | null
          sugestoes_melhoria: string[] | null
          tempo_audiencia_minutos: number | null
          testemunhas_convocadas: Json | null
          updated_at: string | null
          user_id: string | null
          valor_condenacao: number | null
        }
        Insert: {
          acertos?: string[] | null
          advertencias_dadas?: number | null
          argumentos_julgados?: Json | null
          artigos_fundamentacao?: Json | null
          caso_id?: number | null
          contradicoes_resolvidas?: Json | null
          created_at?: string | null
          custas_responsavel?: string | null
          decisao_merito?: string | null
          decisoes_preparacao?: Json | null
          erros?: string[] | null
          excecoes_processuais?: Json | null
          fundamentacao_correta?: boolean | null
          historico_mensagens?: Json | null
          honorarios_percentual?: number | null
          id?: number
          materiais_recomendados?: Json | null
          motivos_recurso?: string[] | null
          multas_aplicadas?: number | null
          nivel_juiz?: string | null
          nota_celeridade?: number | null
          nota_justica?: number | null
          nota_ordem_processual?: number | null
          perguntas_deferidas?: number | null
          perguntas_indeferidas?: number | null
          pontuacao_total?: number | null
          provas_aceitas?: Json | null
          provas_indeferidas?: Json | null
          recurso_acolhido?: boolean | null
          reputacao?: number | null
          sentenca_correta?: boolean | null
          sugestoes_melhoria?: string[] | null
          tempo_audiencia_minutos?: number | null
          testemunhas_convocadas?: Json | null
          updated_at?: string | null
          user_id?: string | null
          valor_condenacao?: number | null
        }
        Update: {
          acertos?: string[] | null
          advertencias_dadas?: number | null
          argumentos_julgados?: Json | null
          artigos_fundamentacao?: Json | null
          caso_id?: number | null
          contradicoes_resolvidas?: Json | null
          created_at?: string | null
          custas_responsavel?: string | null
          decisao_merito?: string | null
          decisoes_preparacao?: Json | null
          erros?: string[] | null
          excecoes_processuais?: Json | null
          fundamentacao_correta?: boolean | null
          historico_mensagens?: Json | null
          honorarios_percentual?: number | null
          id?: number
          materiais_recomendados?: Json | null
          motivos_recurso?: string[] | null
          multas_aplicadas?: number | null
          nivel_juiz?: string | null
          nota_celeridade?: number | null
          nota_justica?: number | null
          nota_ordem_processual?: number | null
          perguntas_deferidas?: number | null
          perguntas_indeferidas?: number | null
          pontuacao_total?: number | null
          provas_aceitas?: Json | null
          provas_indeferidas?: Json | null
          recurso_acolhido?: boolean | null
          reputacao?: number | null
          sentenca_correta?: boolean | null
          sugestoes_melhoria?: string[] | null
          tempo_audiencia_minutos?: number | null
          testemunhas_convocadas?: Json | null
          updated_at?: string | null
          user_id?: string | null
          valor_condenacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "SIMULACAO_PARTIDAS_JUIZ_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "SIMULACAO_CASOS"
            referencedColumns: ["id"]
          },
        ]
      }
      "SIMULADO-ESCREVENTE": {
        Row: {
          "Alternativa A": string | null
          "Alternativa B": string | null
          "Alternativa C": string | null
          "Alternativa D": string | null
          "Alternativa E": string | null
          Ano: number | null
          Banca: string | null
          Cargo: string | null
          Enunciado: string | null
          Gabarito: string | null
          id: number
          Imagem: string | null
          Materia: string | null
          Nivel: string | null
          Orgao: string | null
          Questao: number | null
          "Texto Português": string | null
        }
        Insert: {
          "Alternativa A"?: string | null
          "Alternativa B"?: string | null
          "Alternativa C"?: string | null
          "Alternativa D"?: string | null
          "Alternativa E"?: string | null
          Ano?: number | null
          Banca?: string | null
          Cargo?: string | null
          Enunciado?: string | null
          Gabarito?: string | null
          id?: number
          Imagem?: string | null
          Materia?: string | null
          Nivel?: string | null
          Orgao?: string | null
          Questao?: number | null
          "Texto Português"?: string | null
        }
        Update: {
          "Alternativa A"?: string | null
          "Alternativa B"?: string | null
          "Alternativa C"?: string | null
          "Alternativa D"?: string | null
          "Alternativa E"?: string | null
          Ano?: number | null
          Banca?: string | null
          Cargo?: string | null
          Enunciado?: string | null
          Gabarito?: string | null
          id?: number
          Imagem?: string | null
          Materia?: string | null
          Nivel?: string | null
          Orgao?: string | null
          Questao?: number | null
          "Texto Português"?: string | null
        }
        Relationships: []
      }
      "SIMULADO-JUIZ SUBSTITUTO": {
        Row: {
          "Alternativa A": string | null
          "Alternativa B": string | null
          "Alternativa C": string | null
          "Alternativa D": string | null
          "Alternativa E": string | null
          Ano: number | null
          Enunciado: string | null
          Gabarito: string | null
          id: number
          Imagem: string | null
          Materia: string | null
          Numero: number | null
          "Tipo da Prova": string | null
        }
        Insert: {
          "Alternativa A"?: string | null
          "Alternativa B"?: string | null
          "Alternativa C"?: string | null
          "Alternativa D"?: string | null
          "Alternativa E"?: string | null
          Ano?: number | null
          Enunciado?: string | null
          Gabarito?: string | null
          id?: number
          Imagem?: string | null
          Materia?: string | null
          Numero?: number | null
          "Tipo da Prova"?: string | null
        }
        Update: {
          "Alternativa A"?: string | null
          "Alternativa B"?: string | null
          "Alternativa C"?: string | null
          "Alternativa D"?: string | null
          "Alternativa E"?: string | null
          Ano?: number | null
          Enunciado?: string | null
          Gabarito?: string | null
          id?: number
          Imagem?: string | null
          Materia?: string | null
          Numero?: number | null
          "Tipo da Prova"?: string | null
        }
        Relationships: []
      }
      "SIMULADO-OAB": {
        Row: {
          "Alternativa A": string | null
          "Alternativa B": string | null
          "Alternativa C": string | null
          "Alternativa D": string | null
          "Alternativas Narradas": string | null
          Ano: number | null
          area: string | null
          Banca: string | null
          comentario: string | null
          Enunciado: string | null
          Exame: string | null
          exemplo_pratico: string | null
          id: number
          "Numero da questao": number | null
          "Questao Narrada": string | null
          resposta: string | null
          url_audio_comentario: string | null
          url_audio_exemplo: string | null
          url_imagem_comentario: string | null
          url_imagem_exemplo: string | null
        }
        Insert: {
          "Alternativa A"?: string | null
          "Alternativa B"?: string | null
          "Alternativa C"?: string | null
          "Alternativa D"?: string | null
          "Alternativas Narradas"?: string | null
          Ano?: number | null
          area?: string | null
          Banca?: string | null
          comentario?: string | null
          Enunciado?: string | null
          Exame?: string | null
          exemplo_pratico?: string | null
          id: number
          "Numero da questao"?: number | null
          "Questao Narrada"?: string | null
          resposta?: string | null
          url_audio_comentario?: string | null
          url_audio_exemplo?: string | null
          url_imagem_comentario?: string | null
          url_imagem_exemplo?: string | null
        }
        Update: {
          "Alternativa A"?: string | null
          "Alternativa B"?: string | null
          "Alternativa C"?: string | null
          "Alternativa D"?: string | null
          "Alternativas Narradas"?: string | null
          Ano?: number | null
          area?: string | null
          Banca?: string | null
          comentario?: string | null
          Enunciado?: string | null
          Exame?: string | null
          exemplo_pratico?: string | null
          id?: number
          "Numero da questao"?: number | null
          "Questao Narrada"?: string | null
          resposta?: string | null
          url_audio_comentario?: string | null
          url_audio_exemplo?: string | null
          url_imagem_comentario?: string | null
          url_imagem_exemplo?: string | null
        }
        Relationships: []
      }
      simulados_concursos: {
        Row: {
          ano: number | null
          banca: string | null
          cargo: string | null
          cor: string | null
          created_at: string
          estado: string | null
          icone: string | null
          id: string
          nome: string
          orgao: string | null
          salario_inicial: string | null
          salario_maximo: string | null
          status: string
          total_questoes: number | null
          updated_at: string
          url_gabarito: string | null
          url_prova: string | null
        }
        Insert: {
          ano?: number | null
          banca?: string | null
          cargo?: string | null
          cor?: string | null
          created_at?: string
          estado?: string | null
          icone?: string | null
          id?: string
          nome: string
          orgao?: string | null
          salario_inicial?: string | null
          salario_maximo?: string | null
          status?: string
          total_questoes?: number | null
          updated_at?: string
          url_gabarito?: string | null
          url_prova?: string | null
        }
        Update: {
          ano?: number | null
          banca?: string | null
          cargo?: string | null
          cor?: string | null
          created_at?: string
          estado?: string | null
          icone?: string | null
          id?: string
          nome?: string
          orgao?: string | null
          salario_inicial?: string | null
          salario_maximo?: string | null
          status?: string
          total_questoes?: number | null
          updated_at?: string
          url_gabarito?: string | null
          url_prova?: string | null
        }
        Relationships: []
      }
      simulados_questoes: {
        Row: {
          alternativa_a: string | null
          alternativa_b: string | null
          alternativa_c: string | null
          alternativa_d: string | null
          alternativa_e: string | null
          comentario_ia: string | null
          created_at: string
          enunciado: string
          fonte_classificacao: string | null
          fontes_comentario: string[] | null
          gabarito: string | null
          id: string
          imagem_url: string | null
          materia: string | null
          numero: number
          simulado_id: string
          subtema_qc: string | null
          tema_qc: string | null
          texto_apoio_imagem_url: string | null
          texto_base: string | null
          url_audio_comentario: string | null
        }
        Insert: {
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          alternativa_e?: string | null
          comentario_ia?: string | null
          created_at?: string
          enunciado: string
          fonte_classificacao?: string | null
          fontes_comentario?: string[] | null
          gabarito?: string | null
          id?: string
          imagem_url?: string | null
          materia?: string | null
          numero: number
          simulado_id: string
          subtema_qc?: string | null
          tema_qc?: string | null
          texto_apoio_imagem_url?: string | null
          texto_base?: string | null
          url_audio_comentario?: string | null
        }
        Update: {
          alternativa_a?: string | null
          alternativa_b?: string | null
          alternativa_c?: string | null
          alternativa_d?: string | null
          alternativa_e?: string | null
          comentario_ia?: string | null
          created_at?: string
          enunciado?: string
          fonte_classificacao?: string | null
          fontes_comentario?: string[] | null
          gabarito?: string | null
          id?: string
          imagem_url?: string | null
          materia?: string | null
          numero?: number
          simulado_id?: string
          subtema_qc?: string | null
          tema_qc?: string | null
          texto_apoio_imagem_url?: string | null
          texto_base?: string | null
          url_audio_comentario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulados_questoes_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados_concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      "SOM AMBIENTE": {
        Row: {
          id: number
          link: string | null
          numero: number | null
        }
        Insert: {
          id: number
          link?: string | null
          numero?: number | null
        }
        Update: {
          id?: number
          link?: string | null
          numero?: number | null
        }
        Relationships: []
      }
      stj_feeds: {
        Row: {
          categoria: string | null
          conteudo_completo: string | null
          created_at: string
          data_publicacao: string | null
          descricao: string | null
          feed_tipo: string
          id: string
          link: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          conteudo_completo?: string | null
          created_at?: string
          data_publicacao?: string | null
          descricao?: string | null
          feed_tipo: string
          id?: string
          link: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          conteudo_completo?: string | null
          created_at?: string
          data_publicacao?: string | null
          descricao?: string | null
          feed_tipo?: string
          id?: string
          link?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      STJ_INFORMATIVOS: {
        Row: {
          audio_url: string | null
          created_at: string | null
          data_publicacao: string | null
          destaque: string | null
          id: number
          inteiro_teor: string | null
          link: string | null
          ministro: string | null
          numero: number
          orgao_julgador: string | null
          processo: string | null
          ramo_direito: string | null
          tema_repetitivo: number | null
          tese: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          destaque?: string | null
          id?: number
          inteiro_teor?: string | null
          link?: string | null
          ministro?: string | null
          numero: number
          orgao_julgador?: string | null
          processo?: string | null
          ramo_direito?: string | null
          tema_repetitivo?: number | null
          tese?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          data_publicacao?: string | null
          destaque?: string | null
          id?: number
          inteiro_teor?: string | null
          link?: string | null
          ministro?: string | null
          numero?: number
          orgao_julgador?: string | null
          processo?: string | null
          ramo_direito?: string | null
          tema_repetitivo?: number | null
          tese?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stj_pesquisa_pronta: {
        Row: {
          created_at: string | null
          detalhes: string | null
          id: string
          link_pesquisa: string | null
          ramo_direito: string
          tema: string
          titulo_secao: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          detalhes?: string | null
          id?: string
          link_pesquisa?: string | null
          ramo_direito: string
          tema: string
          titulo_secao: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          detalhes?: string | null
          id?: string
          link_pesquisa?: string | null
          ramo_direito?: string
          tema?: string
          titulo_secao?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      STJ_REPETITIVOS: {
        Row: {
          created_at: string | null
          data_afetacao: string | null
          data_julgamento: string | null
          id: number
          link: string | null
          ministro: string | null
          orgao_julgador: string | null
          processo: string | null
          questao_submetida: string | null
          ramo_direito: string | null
          situacao: string | null
          suspensos_quantitativo: number | null
          tema: number
          tese_firmada: string | null
          tribunal_origem: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_afetacao?: string | null
          data_julgamento?: string | null
          id?: number
          link?: string | null
          ministro?: string | null
          orgao_julgador?: string | null
          processo?: string | null
          questao_submetida?: string | null
          ramo_direito?: string | null
          situacao?: string | null
          suspensos_quantitativo?: number | null
          tema: number
          tese_firmada?: string | null
          tribunal_origem?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_afetacao?: string | null
          data_julgamento?: string | null
          id?: number
          link?: string | null
          ministro?: string | null
          orgao_julgador?: string | null
          processo?: string | null
          questao_submetida?: string | null
          ramo_direito?: string | null
          situacao?: string | null
          suspensos_quantitativo?: number | null
          tema?: number
          tese_firmada?: string | null
          tribunal_origem?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      STJ_TESES: {
        Row: {
          acordaos_vinculados: string[] | null
          created_at: string | null
          data_publicacao: string | null
          edicao: number
          id: number
          link: string | null
          numero_tese: number | null
          ramo_direito: string | null
          tese: string
          titulo_edicao: string | null
          ultima_atualizacao: string | null
          updated_at: string | null
        }
        Insert: {
          acordaos_vinculados?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          edicao: number
          id?: number
          link?: string | null
          numero_tese?: number | null
          ramo_direito?: string | null
          tese: string
          titulo_edicao?: string | null
          ultima_atualizacao?: string | null
          updated_at?: string | null
        }
        Update: {
          acordaos_vinculados?: string[] | null
          created_at?: string | null
          data_publicacao?: string | null
          edicao?: number
          id?: number
          link?: string | null
          numero_tese?: number | null
          ramo_direito?: string | null
          tese?: string
          titulo_edicao?: string | null
          ultima_atualizacao?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_funnel_events: {
        Row: {
          amount: number | null
          created_at: string
          device: string | null
          duration_seconds: number | null
          event_type: string
          id: string
          metadata: Json | null
          payment_method: string | null
          plan_type: string | null
          referrer_page: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          device?: string | null
          duration_seconds?: number | null
          event_type: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan_type?: string | null
          referrer_page?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          device?: string | null
          duration_seconds?: number | null
          event_type?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan_type?: string | null
          referrer_page?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          conversion_source: string | null
          created_at: string
          expiration_date: string | null
          id: string
          last_payment_date: string | null
          mp_payer_email: string | null
          mp_payer_id: string | null
          mp_payment_id: string | null
          mp_preapproval_id: string | null
          next_payment_date: string | null
          notificado_expiracao: boolean | null
          payment_method: string | null
          plan_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          conversion_source?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          last_payment_date?: string | null
          mp_payer_email?: string | null
          mp_payer_id?: string | null
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          next_payment_date?: string | null
          notificado_expiracao?: boolean | null
          payment_method?: string | null
          plan_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          conversion_source?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          last_payment_date?: string | null
          mp_payer_email?: string | null
          mp_payer_id?: string | null
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          next_payment_date?: string | null
          notificado_expiracao?: boolean | null
          payment_method?: string | null
          plan_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      "SUMULAS STF": {
        Row: {
          "Data de Aprovação": string | null
          id: number | null
          Narração: string | null
          "Texto da Súmula": string | null
          "Título da Súmula": string | null
        }
        Insert: {
          "Data de Aprovação"?: string | null
          id?: number | null
          Narração?: string | null
          "Texto da Súmula"?: string | null
          "Título da Súmula"?: string | null
        }
        Update: {
          "Data de Aprovação"?: string | null
          id?: number | null
          Narração?: string | null
          "Texto da Súmula"?: string | null
          "Título da Súmula"?: string | null
        }
        Relationships: []
      }
      "SUMULAS STJ": {
        Row: {
          "Data de Aprovação": string | null
          flashcards: Json | null
          id: number
          Narração: string | null
          questoes: Json | null
          termos: Json | null
          "Texto da Súmula": string | null
          "Título da Súmula": string | null
          ultima_atualizacao: string | null
          ultima_visualizacao: string | null
          versao_conteudo: number | null
          visualizacoes: number | null
        }
        Insert: {
          "Data de Aprovação"?: string | null
          flashcards?: Json | null
          id: number
          Narração?: string | null
          questoes?: Json | null
          termos?: Json | null
          "Texto da Súmula"?: string | null
          "Título da Súmula"?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Update: {
          "Data de Aprovação"?: string | null
          flashcards?: Json | null
          id?: number
          Narração?: string | null
          questoes?: Json | null
          termos?: Json | null
          "Texto da Súmula"?: string | null
          "Título da Súmula"?: string | null
          ultima_atualizacao?: string | null
          ultima_visualizacao?: string | null
          versao_conteudo?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      "SUMULAS VINCULANTES": {
        Row: {
          "Data de Aprovação": string | null
          id: number | null
          Narração: string | null
          "Texto da Súmula": string | null
          "Título da Súmula": string | null
        }
        Insert: {
          "Data de Aprovação"?: string | null
          id?: number | null
          Narração?: string | null
          "Texto da Súmula"?: string | null
          "Título da Súmula"?: string | null
        }
        Update: {
          "Data de Aprovação"?: string | null
          id?: number | null
          Narração?: string | null
          "Texto da Súmula"?: string | null
          "Título da Súmula"?: string | null
        }
        Relationships: []
      }
      suporte_tickets: {
        Row: {
          categoria: string
          created_at: string
          id: string
          mensagem: string
          status: string
          user_email: string | null
          user_id: string | null
          user_nome: string | null
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          mensagem: string
          status?: string
          user_email?: string | null
          user_id?: string | null
          user_nome?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          mensagem?: string
          status?: string
          user_email?: string | null
          user_id?: string | null
          user_nome?: string | null
        }
        Relationships: []
      }
      "TABELA PARA EDITAR": {
        Row: {
          Artigo: string | null
          id: number
          Narração: string | null
        }
        Insert: {
          Artigo?: string | null
          id?: number
          Narração?: string | null
        }
        Update: {
          Artigo?: string | null
          id?: number
          Narração?: string | null
        }
        Relationships: []
      }
      tcc_em_alta: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          motivo: string | null
          ordem: number | null
          tcc_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          motivo?: string | null
          ordem?: number | null
          tcc_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          motivo?: string | null
          ordem?: number | null
          tcc_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tcc_em_alta_tcc_id_fkey"
            columns: ["tcc_id"]
            isOneToOne: true
            referencedRelation: "tcc_pesquisas"
            referencedColumns: ["id"]
          },
        ]
      }
      tcc_perfil_usuario: {
        Row: {
          ano_faculdade: number | null
          areas_interesse: string[] | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ano_faculdade?: number | null
          areas_interesse?: string[] | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ano_faculdade?: number | null
          areas_interesse?: string[] | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tcc_pesquisas: {
        Row: {
          ano: number | null
          area_direito: string | null
          atualizacoes_necessarias: string[] | null
          autor: string | null
          contribuicoes: string | null
          created_at: string
          fonte: string | null
          id: string
          instituicao: string | null
          link_acesso: string | null
          metodologia: string | null
          objetivo_geral: string | null
          pdf_url: string | null
          principais_conclusoes: string | null
          problema_pesquisa: string | null
          relevancia: string | null
          resumo_ia: string | null
          resumo_original: string | null
          subarea: string | null
          sugestoes_abordagem: string[] | null
          tema_central: string | null
          tema_saturado: boolean | null
          texto_completo: string | null
          tipo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ano?: number | null
          area_direito?: string | null
          atualizacoes_necessarias?: string[] | null
          autor?: string | null
          contribuicoes?: string | null
          created_at?: string
          fonte?: string | null
          id?: string
          instituicao?: string | null
          link_acesso?: string | null
          metodologia?: string | null
          objetivo_geral?: string | null
          pdf_url?: string | null
          principais_conclusoes?: string | null
          problema_pesquisa?: string | null
          relevancia?: string | null
          resumo_ia?: string | null
          resumo_original?: string | null
          subarea?: string | null
          sugestoes_abordagem?: string[] | null
          tema_central?: string | null
          tema_saturado?: boolean | null
          texto_completo?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ano?: number | null
          area_direito?: string | null
          atualizacoes_necessarias?: string[] | null
          autor?: string | null
          contribuicoes?: string | null
          created_at?: string
          fonte?: string | null
          id?: string
          instituicao?: string | null
          link_acesso?: string | null
          metodologia?: string | null
          objetivo_geral?: string | null
          pdf_url?: string | null
          principais_conclusoes?: string | null
          problema_pesquisa?: string | null
          relevancia?: string | null
          resumo_ia?: string | null
          resumo_original?: string | null
          subarea?: string | null
          sugestoes_abordagem?: string[] | null
          tema_central?: string | null
          tema_saturado?: boolean | null
          texto_completo?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      tcc_salvos: {
        Row: {
          created_at: string | null
          id: string
          notas: string | null
          tcc_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notas?: string | null
          tcc_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notas?: string | null
          tcc_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tcc_salvos_tcc_id_fkey"
            columns: ["tcc_id"]
            isOneToOne: false
            referencedRelation: "tcc_pesquisas"
            referencedColumns: ["id"]
          },
        ]
      }
      tcc_temas_sugeridos: {
        Row: {
          anos_recomendados: number[] | null
          area_direito: string
          created_at: string | null
          criado_por_ia: boolean | null
          descricao: string | null
          id: string
          jurisprudencia_relacionada: string[] | null
          keywords: string[] | null
          legislacao_relacionada: string[] | null
          nivel_dificuldade: string | null
          oportunidade: boolean | null
          relevancia: number | null
          tema: string
          tema_saturado: boolean | null
        }
        Insert: {
          anos_recomendados?: number[] | null
          area_direito: string
          created_at?: string | null
          criado_por_ia?: boolean | null
          descricao?: string | null
          id?: string
          jurisprudencia_relacionada?: string[] | null
          keywords?: string[] | null
          legislacao_relacionada?: string[] | null
          nivel_dificuldade?: string | null
          oportunidade?: boolean | null
          relevancia?: number | null
          tema: string
          tema_saturado?: boolean | null
        }
        Update: {
          anos_recomendados?: number[] | null
          area_direito?: string
          created_at?: string | null
          criado_por_ia?: boolean | null
          descricao?: string | null
          id?: string
          jurisprudencia_relacionada?: string[] | null
          keywords?: string[] | null
          legislacao_relacionada?: string[] | null
          nivel_dificuldade?: string | null
          oportunidade?: boolean | null
          relevancia?: number | null
          tema?: string
          tema_saturado?: boolean | null
        }
        Relationships: []
      }
      tcc_visualizacoes: {
        Row: {
          created_at: string | null
          id: string
          session_id: string | null
          tcc_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          tcc_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          tcc_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tcc_visualizacoes_tcc_id_fkey"
            columns: ["tcc_id"]
            isOneToOne: false
            referencedRelation: "tcc_pesquisas"
            referencedColumns: ["id"]
          },
        ]
      }
      termos_juridicos_aulas: {
        Row: {
          capa_gerada_em: string | null
          capa_url: string | null
          categoria: string | null
          created_at: string | null
          descricao_curta: string | null
          estrutura_completa: Json | null
          gerado_em: string | null
          id: number
          ordem: number
          origem: string | null
          termo: string
          updated_at: string | null
        }
        Insert: {
          capa_gerada_em?: string | null
          capa_url?: string | null
          categoria?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          estrutura_completa?: Json | null
          gerado_em?: string | null
          id?: number
          ordem: number
          origem?: string | null
          termo: string
          updated_at?: string | null
        }
        Update: {
          capa_gerada_em?: string | null
          capa_url?: string | null
          categoria?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          estrutura_completa?: Json | null
          gerado_em?: string | null
          id?: number
          ordem?: number
          origem?: string | null
          termo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tres_poderes_config: {
        Row: {
          background_desktop: string | null
          background_mobile: string | null
          background_tablet: string | null
          background_url: string | null
          created_at: string
          id: string
          opacity: number | null
          page_key: string
          updated_at: string
        }
        Insert: {
          background_desktop?: string | null
          background_mobile?: string | null
          background_tablet?: string | null
          background_url?: string | null
          created_at?: string
          id?: string
          opacity?: number | null
          page_key: string
          updated_at?: string
        }
        Update: {
          background_desktop?: string | null
          background_mobile?: string | null
          background_tablet?: string | null
          background_url?: string | null
          created_at?: string
          id?: string
          opacity?: number | null
          page_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      tres_poderes_deputados_bio: {
        Row: {
          biografia: string | null
          carreira_politica: string | null
          created_at: string
          deputado_id: number
          formacao: string | null
          foto_url: string | null
          foto_wikipedia: string | null
          id: string
          mandatos: string[] | null
          nome: string
          partido: string | null
          projetos_destaque: string[] | null
          redes_sociais: Json | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          biografia?: string | null
          carreira_politica?: string | null
          created_at?: string
          deputado_id: number
          formacao?: string | null
          foto_url?: string | null
          foto_wikipedia?: string | null
          id?: string
          mandatos?: string[] | null
          nome: string
          partido?: string | null
          projetos_destaque?: string[] | null
          redes_sociais?: Json | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          biografia?: string | null
          carreira_politica?: string | null
          created_at?: string
          deputado_id?: number
          formacao?: string | null
          foto_url?: string | null
          foto_wikipedia?: string | null
          id?: string
          mandatos?: string[] | null
          nome?: string
          partido?: string | null
          projetos_destaque?: string[] | null
          redes_sociais?: Json | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tres_poderes_ministros_stf: {
        Row: {
          ativo: boolean | null
          biblioteca_slug: string | null
          biografia: string | null
          carreira: string | null
          created_at: string
          curiosidades: Json | null
          curiosidades_atualizadas_em: string | null
          data_posse: string | null
          decisoes_importantes: string[] | null
          formacao: string | null
          foto_url: string | null
          foto_wikipedia: string | null
          id: string
          indicado_por: string | null
          nome: string
          nome_completo: string | null
          ordem: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          biblioteca_slug?: string | null
          biografia?: string | null
          carreira?: string | null
          created_at?: string
          curiosidades?: Json | null
          curiosidades_atualizadas_em?: string | null
          data_posse?: string | null
          decisoes_importantes?: string[] | null
          formacao?: string | null
          foto_url?: string | null
          foto_wikipedia?: string | null
          id?: string
          indicado_por?: string | null
          nome: string
          nome_completo?: string | null
          ordem?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          biblioteca_slug?: string | null
          biografia?: string | null
          carreira?: string | null
          created_at?: string
          curiosidades?: Json | null
          curiosidades_atualizadas_em?: string | null
          data_posse?: string | null
          decisoes_importantes?: string[] | null
          formacao?: string | null
          foto_url?: string | null
          foto_wikipedia?: string | null
          id?: string
          indicado_por?: string | null
          nome?: string
          nome_completo?: string | null
          ordem?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tres_poderes_presidentes: {
        Row: {
          biografia: string | null
          created_at: string
          curiosidades: string[] | null
          foto_url: string | null
          foto_wikipedia: string | null
          id: string
          legado: string | null
          nome: string
          nome_completo: string | null
          ordem: number
          partido: string | null
          periodo_fim: number | null
          periodo_inicio: number | null
          realizacoes: string[] | null
          updated_at: string
          vice_presidente: string | null
        }
        Insert: {
          biografia?: string | null
          created_at?: string
          curiosidades?: string[] | null
          foto_url?: string | null
          foto_wikipedia?: string | null
          id?: string
          legado?: string | null
          nome: string
          nome_completo?: string | null
          ordem: number
          partido?: string | null
          periodo_fim?: number | null
          periodo_inicio?: number | null
          realizacoes?: string[] | null
          updated_at?: string
          vice_presidente?: string | null
        }
        Update: {
          biografia?: string | null
          created_at?: string
          curiosidades?: string[] | null
          foto_url?: string | null
          foto_wikipedia?: string | null
          id?: string
          legado?: string | null
          nome?: string
          nome_completo?: string | null
          ordem?: number
          partido?: string | null
          periodo_fim?: number | null
          periodo_inicio?: number | null
          realizacoes?: string[] | null
          updated_at?: string
          vice_presidente?: string | null
        }
        Relationships: []
      }
      tres_poderes_senadores_bio: {
        Row: {
          biografia: string | null
          carreira_politica: string | null
          created_at: string
          formacao: string | null
          foto_url: string | null
          foto_wikipedia: string | null
          id: string
          mandatos: string[] | null
          nome: string
          partido: string | null
          projetos_destaque: string[] | null
          redes_sociais: Json | null
          senador_codigo: number
          uf: string | null
          updated_at: string
        }
        Insert: {
          biografia?: string | null
          carreira_politica?: string | null
          created_at?: string
          formacao?: string | null
          foto_url?: string | null
          foto_wikipedia?: string | null
          id?: string
          mandatos?: string[] | null
          nome: string
          partido?: string | null
          projetos_destaque?: string[] | null
          redes_sociais?: Json | null
          senador_codigo: number
          uf?: string | null
          updated_at?: string
        }
        Update: {
          biografia?: string | null
          carreira_politica?: string | null
          created_at?: string
          formacao?: string | null
          foto_url?: string | null
          foto_wikipedia?: string | null
          id?: string
          mandatos?: string[] | null
          nome?: string
          partido?: string | null
          projetos_destaque?: string[] | null
          redes_sociais?: Json | null
          senador_codigo?: number
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tres_poderes_tarefas_background: {
        Row: {
          concluido_em: string | null
          created_at: string
          deputado_inicial_id: number | null
          erro: string | null
          id: string
          processados: number | null
          status: string
          tipo: string
          total: number | null
          ultimo_processado: string | null
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          deputado_inicial_id?: number | null
          erro?: string | null
          id?: string
          processados?: number | null
          status?: string
          tipo: string
          total?: number | null
          ultimo_processado?: string | null
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          deputado_inicial_id?: number | null
          erro?: string | null
          id?: string
          processados?: number | null
          status?: string
          tipo?: string
          total?: number | null
          ultimo_processado?: string | null
        }
        Relationships: []
      }
      trial_overrides: {
        Row: {
          bonus_day_claimed: boolean | null
          desativado: boolean
          extra_ms: number
          id: string
          rating_bonus_claimed: boolean
          rating_bonus_claimed_at: string | null
          rating_bonus_offered: boolean
          rating_bonus_revoked: boolean
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          bonus_day_claimed?: boolean | null
          desativado?: boolean
          extra_ms?: number
          id?: string
          rating_bonus_claimed?: boolean
          rating_bonus_claimed_at?: string | null
          rating_bonus_offered?: boolean
          rating_bonus_revoked?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          bonus_day_claimed?: boolean | null
          desativado?: boolean
          extra_ms?: number
          id?: string
          rating_bonus_claimed?: boolean
          rating_bonus_claimed_at?: string | null
          rating_bonus_offered?: boolean
          rating_bonus_revoked?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tribuna_comentarios: {
        Row: {
          conteudo: string
          created_at: string
          foto_flickr_id: string
          id: string
          likes_count: number
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          foto_flickr_id: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          foto_flickr_id?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribuna_comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tribuna_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tribuna_comentarios_likes: {
        Row: {
          comentario_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comentario_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comentario_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribuna_comentarios_likes_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "tribuna_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tribuna_favoritos: {
        Row: {
          created_at: string
          foto_flickr_id: string
          foto_titulo: string | null
          foto_url: string | null
          id: string
          instituicao_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          foto_flickr_id: string
          foto_titulo?: string | null
          foto_url?: string | null
          id?: string
          instituicao_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          foto_flickr_id?: string
          foto_titulo?: string | null
          foto_url?: string | null
          id?: string
          instituicao_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      tutoriais_app: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: number
          ordem: number | null
          passos: Json
          screenshot_principal: string | null
          secao: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: number
          ordem?: number | null
          passos?: Json
          screenshot_principal?: string | null
          secao: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: number
          ordem?: number | null
          passos?: Json
          screenshot_principal?: string | null
          secao?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tutoriais_cache: {
        Row: {
          categoria: string
          created_at: string | null
          descricao_curta: string
          funcionalidade_id: string
          funcionalidades: Json
          icone: string | null
          id: string
          ordem: number | null
          rota: string | null
          steps: Json
          titulo: string
          updated_at: string | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descricao_curta: string
          funcionalidade_id: string
          funcionalidades?: Json
          icone?: string | null
          id?: string
          ordem?: number | null
          rota?: string | null
          steps?: Json
          titulo: string
          updated_at?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descricao_curta?: string
          funcionalidade_id?: string
          funcionalidades?: Json
          icone?: string | null
          id?: string
          ordem?: number | null
          rota?: string | null
          steps?: Json
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      urls_planalto_customizadas: {
        Row: {
          created_at: string
          id: string
          nome_tabela: string
          updated_at: string
          url_planalto: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_tabela: string
          updated_at?: string
          url_planalto: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_tabela?: string
          updated_at?: string
          url_planalto?: string
        }
        Relationships: []
      }
      user_anotacoes: {
        Row: {
          categoria: string | null
          conteudo: string
          cor: string | null
          created_at: string
          data_referencia: string
          id: string
          importante: boolean
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          conteudo?: string
          cor?: string | null
          created_at?: string
          data_referencia?: string
          id?: string
          importante?: boolean
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          conteudo?: string
          cor?: string | null
          created_at?: string
          data_referencia?: string
          id?: string
          importante?: boolean
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_aulas_historico: {
        Row: {
          area: string | null
          aula_id: string | null
          created_at: string
          id: string
          origem: string | null
          tema: string
          user_id: string
        }
        Insert: {
          area?: string | null
          aula_id?: string | null
          created_at?: string
          id?: string
          origem?: string | null
          tema: string
          user_id: string
        }
        Update: {
          area?: string | null
          aula_id?: string | null
          created_at?: string
          id?: string
          origem?: string | null
          tema?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_messages: {
        Row: {
          created_at: string | null
          id: string
          message_count: number
          message_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_count?: number
          message_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_count?: number
          message_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_favorite_places: {
        Row: {
          created_at: string | null
          endereco: string | null
          foto_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string | null
          place_id: string
          sobre: string | null
          telefone: string | null
          tipo: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string | null
          place_id: string
          sobre?: string | null
          telefone?: string | null
          tipo?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string | null
          place_id?: string
          sobre?: string | null
          telefone?: string | null
          tipo?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          cep: string
          cidade: string | null
          created_at: string | null
          endereco: string | null
          estado: string | null
          id: string
          is_default: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          nome: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cep: string
          cidade?: string | null
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          is_default?: boolean | null
          label: string
          latitude?: number | null
          longitude?: number | null
          nome?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cep?: string
          cidade?: string | null
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_questoes_desafio: {
        Row: {
          area: string | null
          created_at: string | null
          id: string
          meta_diaria: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          id?: string
          meta_diaria?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area?: string | null
          created_at?: string | null
          id?: string
          meta_diaria?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_questoes_plano: {
        Row: {
          area: string
          created_at: string | null
          cronograma: Json
          data_inicio: string
          duracao: number
          id: string
          meta_diaria: number
          temas: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string | null
          cronograma?: Json
          data_inicio?: string
          duracao?: number
          id?: string
          meta_diaria?: number
          temas?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string | null
          cronograma?: Json
          data_inicio?: string
          duracao?: number
          id?: string
          meta_diaria?: number
          temas?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_questoes_stats: {
        Row: {
          acertos: number | null
          area: string
          created_at: string | null
          erros: number | null
          id: string
          tema: string | null
          ultima_resposta: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acertos?: number | null
          area: string
          created_at?: string | null
          erros?: number | null
          id?: string
          tema?: string | null
          ultima_resposta?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acertos?: number | null
          area?: string
          created_at?: string | null
          erros?: number | null
          id?: string
          tema?: string | null
          ultima_resposta?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_usage_limits: {
        Row: {
          acesso_desktop_solicitado: boolean | null
          assistente_acessos: number | null
          created_at: string | null
          documentos_analisados: number | null
          exemplos_usados: number | null
          explicacoes_usadas: number | null
          flashcards_usados: number | null
          id: string
          is_pro: boolean | null
          modelos_acessados: Json | null
          narracoes_usadas: number | null
          peticoes_criadas: number | null
          questoes_usadas: number | null
          resumos_usados: number | null
          ultimo_reset: string | null
          updated_at: string | null
          user_ip: string
        }
        Insert: {
          acesso_desktop_solicitado?: boolean | null
          assistente_acessos?: number | null
          created_at?: string | null
          documentos_analisados?: number | null
          exemplos_usados?: number | null
          explicacoes_usadas?: number | null
          flashcards_usados?: number | null
          id?: string
          is_pro?: boolean | null
          modelos_acessados?: Json | null
          narracoes_usadas?: number | null
          peticoes_criadas?: number | null
          questoes_usadas?: number | null
          resumos_usados?: number | null
          ultimo_reset?: string | null
          updated_at?: string | null
          user_ip: string
        }
        Update: {
          acesso_desktop_solicitado?: boolean | null
          assistente_acessos?: number | null
          created_at?: string | null
          documentos_analisados?: number | null
          exemplos_usados?: number | null
          explicacoes_usadas?: number | null
          flashcards_usados?: number | null
          id?: string
          is_pro?: boolean | null
          modelos_acessados?: Json | null
          narracoes_usadas?: number | null
          peticoes_criadas?: number | null
          questoes_usadas?: number | null
          resumos_usados?: number | null
          ultimo_reset?: string | null
          updated_at?: string | null
          user_ip?: string
        }
        Relationships: []
      }
      usuarios_banidos: {
        Row: {
          banido_por: string | null
          created_at: string
          email: string | null
          id: string
          motivo: string | null
          telefone: string | null
          user_id_original: string | null
        }
        Insert: {
          banido_por?: string | null
          created_at?: string
          email?: string | null
          id?: string
          motivo?: string | null
          telefone?: string | null
          user_id_original?: string | null
        }
        Update: {
          banido_por?: string | null
          created_at?: string
          email?: string | null
          id?: string
          motivo?: string | null
          telefone?: string | null
          user_id_original?: string | null
        }
        Relationships: []
      }
      usuarios_premium: {
        Row: {
          created_at: string | null
          data_ativacao: string | null
          id: string
          status_premium: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_ativacao?: string | null
          id?: string
          status_premium?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_ativacao?: string | null
          id?: string
          status_premium?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vademecum_atualizacoes_pendentes: {
        Row: {
          aprovada_em: string | null
          aprovada_por: string | null
          artigos_afetados: Json | null
          artigos_novos: Json | null
          created_at: string
          ementa: string | null
          id: string
          numero_lei_nova: string | null
          status: string
          tabela: string
          total_alterados: number | null
          total_novos: number | null
          total_removidos: number | null
        }
        Insert: {
          aprovada_em?: string | null
          aprovada_por?: string | null
          artigos_afetados?: Json | null
          artigos_novos?: Json | null
          created_at?: string
          ementa?: string | null
          id?: string
          numero_lei_nova?: string | null
          status?: string
          tabela: string
          total_alterados?: number | null
          total_novos?: number | null
          total_removidos?: number | null
        }
        Update: {
          aprovada_em?: string | null
          aprovada_por?: string | null
          artigos_afetados?: Json | null
          artigos_novos?: Json | null
          created_at?: string
          ementa?: string | null
          id?: string
          numero_lei_nova?: string | null
          status?: string
          tabela?: string
          total_alterados?: number | null
          total_novos?: number | null
          total_removidos?: number | null
        }
        Relationships: []
      }
      vademecum_hero_images: {
        Row: {
          ativo: boolean | null
          created_at: string
          id: string
          tipo: string | null
          url: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          tipo?: string | null
          url: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          tipo?: string | null
          url?: string
        }
        Relationships: []
      }
      "VIDEO AULAS-NOVO": {
        Row: {
          area: string | null
          categoria: string | null
          data: string | null
          flashcards: Json | null
          id: number
          link: string | null
          questoes: Json | null
          sobre_aula: string | null
          tempo: string | null
          thumb: string | null
          titulo: string | null
          transcricao: string | null
        }
        Insert: {
          area?: string | null
          categoria?: string | null
          data?: string | null
          flashcards?: Json | null
          id?: number
          link?: string | null
          questoes?: Json | null
          sobre_aula?: string | null
          tempo?: string | null
          thumb?: string | null
          titulo?: string | null
          transcricao?: string | null
        }
        Update: {
          area?: string | null
          categoria?: string | null
          data?: string | null
          flashcards?: Json | null
          id?: number
          link?: string | null
          questoes?: Json | null
          sobre_aula?: string | null
          tempo?: string | null
          thumb?: string | null
          titulo?: string | null
          transcricao?: string | null
        }
        Relationships: []
      }
      video_aulas_dias: {
        Row: {
          area: string | null
          assunto: string | null
          aula: string | null
          capa: string | null
          capa_area: string | null
          capa_modulo: string | null
          conteudo: string | null
          id: number
          material: string | null
          modulo: string | null
          tema: string | null
          video: string | null
        }
        Insert: {
          area?: string | null
          assunto?: string | null
          aula?: string | null
          capa?: string | null
          capa_area?: string | null
          capa_modulo?: string | null
          conteudo?: string | null
          id: number
          material?: string | null
          modulo?: string | null
          tema?: string | null
          video?: string | null
        }
        Update: {
          area?: string | null
          assunto?: string | null
          aula?: string | null
          capa?: string | null
          capa_area?: string | null
          capa_modulo?: string | null
          conteudo?: string | null
          id?: number
          material?: string | null
          modulo?: string | null
          tema?: string | null
          video?: string | null
        }
        Relationships: []
      }
      videoaulas_areas_direito: {
        Row: {
          area: string
          created_at: string | null
          descricao: string | null
          duracao_segundos: number | null
          flashcards: Json | null
          id: number
          ordem: number | null
          playlist_id: string | null
          publicado_em: string | null
          questoes: Json | null
          sobre_aula: string | null
          thumb: string | null
          titulo: string
          updated_at: string | null
          video_id: string
        }
        Insert: {
          area: string
          created_at?: string | null
          descricao?: string | null
          duracao_segundos?: number | null
          flashcards?: Json | null
          id?: number
          ordem?: number | null
          playlist_id?: string | null
          publicado_em?: string | null
          questoes?: Json | null
          sobre_aula?: string | null
          thumb?: string | null
          titulo: string
          updated_at?: string | null
          video_id: string
        }
        Update: {
          area?: string
          created_at?: string | null
          descricao?: string | null
          duracao_segundos?: number | null
          flashcards?: Json | null
          id?: number
          ordem?: number | null
          playlist_id?: string | null
          publicado_em?: string | null
          questoes?: Json | null
          sobre_aula?: string | null
          thumb?: string | null
          titulo?: string
          updated_at?: string | null
          video_id?: string
        }
        Relationships: []
      }
      videoaulas_artigos_cache: {
        Row: {
          area: string
          codigo_tabela: string
          created_at: string | null
          flashcards: Json | null
          id: string
          numero_artigo: string
          questoes: Json | null
          resumo: string | null
          transcricao: string | null
          updated_at: string | null
          video_channel: string | null
          video_id: string
          video_thumbnail: string | null
          video_title: string | null
        }
        Insert: {
          area: string
          codigo_tabela: string
          created_at?: string | null
          flashcards?: Json | null
          id?: string
          numero_artigo: string
          questoes?: Json | null
          resumo?: string | null
          transcricao?: string | null
          updated_at?: string | null
          video_channel?: string | null
          video_id: string
          video_thumbnail?: string | null
          video_title?: string | null
        }
        Update: {
          area?: string
          codigo_tabela?: string
          created_at?: string | null
          flashcards?: Json | null
          id?: string
          numero_artigo?: string
          questoes?: Json | null
          resumo?: string | null
          transcricao?: string | null
          updated_at?: string | null
          video_channel?: string | null
          video_id?: string
          video_thumbnail?: string | null
          video_title?: string | null
        }
        Relationships: []
      }
      videoaulas_favoritos: {
        Row: {
          created_at: string
          id: string
          tabela: string
          thumbnail: string | null
          titulo: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tabela: string
          thumbnail?: string | null
          titulo: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tabela?: string
          thumbnail?: string | null
          titulo?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      videoaulas_iniciante: {
        Row: {
          created_at: string
          descricao: string | null
          duracao_segundos: number | null
          flashcards: Json | null
          id: string
          ordem: number
          playlist_id: string | null
          publicado_em: string | null
          questoes: Json | null
          sobre_aula: string | null
          thumbnail: string | null
          titulo: string
          transcricao: string | null
          updated_at: string
          video_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          duracao_segundos?: number | null
          flashcards?: Json | null
          id?: string
          ordem: number
          playlist_id?: string | null
          publicado_em?: string | null
          questoes?: Json | null
          sobre_aula?: string | null
          thumbnail?: string | null
          titulo: string
          transcricao?: string | null
          updated_at?: string
          video_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          duracao_segundos?: number | null
          flashcards?: Json | null
          id?: string
          ordem?: number
          playlist_id?: string | null
          publicado_em?: string | null
          questoes?: Json | null
          sobre_aula?: string | null
          thumbnail?: string | null
          titulo?: string
          transcricao?: string | null
          updated_at?: string
          video_id?: string
        }
        Relationships: []
      }
      videoaulas_oab_primeira_fase: {
        Row: {
          area: string
          created_at: string
          descricao: string | null
          duracao: string | null
          flashcards: Json | null
          id: number
          ordem: number | null
          playlist_id: string
          publicado_em: string | null
          questoes: Json | null
          sobre_aula: string | null
          thumbnail: string | null
          titulo: string
          transcricao: string | null
          updated_at: string
          video_id: string
        }
        Insert: {
          area: string
          created_at?: string
          descricao?: string | null
          duracao?: string | null
          flashcards?: Json | null
          id?: number
          ordem?: number | null
          playlist_id: string
          publicado_em?: string | null
          questoes?: Json | null
          sobre_aula?: string | null
          thumbnail?: string | null
          titulo: string
          transcricao?: string | null
          updated_at?: string
          video_id: string
        }
        Update: {
          area?: string
          created_at?: string
          descricao?: string | null
          duracao?: string | null
          flashcards?: Json | null
          id?: number
          ordem?: number | null
          playlist_id?: string
          publicado_em?: string | null
          questoes?: Json | null
          sobre_aula?: string | null
          thumbnail?: string | null
          titulo?: string
          transcricao?: string | null
          updated_at?: string
          video_id?: string
        }
        Relationships: []
      }
      videoaulas_progresso: {
        Row: {
          assistido: boolean | null
          created_at: string | null
          duracao_total: number | null
          id: string
          percentual: number | null
          registro_id: string
          tabela: string
          tempo_atual: number | null
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          assistido?: boolean | null
          created_at?: string | null
          duracao_total?: number | null
          id?: string
          percentual?: number | null
          registro_id: string
          tabela: string
          tempo_atual?: number | null
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          assistido?: boolean | null
          created_at?: string | null
          duracao_total?: number | null
          id?: string
          percentual?: number | null
          registro_id?: string
          tabela?: string
          tempo_atual?: number | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      videos_resumo_dia: {
        Row: {
          area: string
          created_at: string | null
          data: string
          duracao_segundos: number | null
          erro_mensagem: string | null
          id: string
          noticias_resumidas: number | null
          status: string | null
          tamanho_bytes: number | null
          thumbnail_url: string | null
          url_video: string
        }
        Insert: {
          area: string
          created_at?: string | null
          data: string
          duracao_segundos?: number | null
          erro_mensagem?: string | null
          id?: string
          noticias_resumidas?: number | null
          status?: string | null
          tamanho_bytes?: number | null
          thumbnail_url?: string | null
          url_video: string
        }
        Update: {
          area?: string
          created_at?: string | null
          data?: string
          duracao_segundos?: number | null
          erro_mensagem?: string | null
          id?: string
          noticias_resumidas?: number | null
          status?: string | null
          tamanho_bytes?: number | null
          thumbnail_url?: string | null
          url_video?: string
        }
        Relationships: []
      }
      votacoes_analisadas: {
        Row: {
          created_at: string
          data_votacao: string | null
          id: string
          justificativa: string | null
          politico_id: number
          pontos: number | null
          proposicao: string | null
          tema: string | null
          tipo_politico: string
          votacao_id: string
          voto: string | null
          voto_esperado: string | null
        }
        Insert: {
          created_at?: string
          data_votacao?: string | null
          id?: string
          justificativa?: string | null
          politico_id: number
          pontos?: number | null
          proposicao?: string | null
          tema?: string | null
          tipo_politico: string
          votacao_id: string
          voto?: string | null
          voto_esperado?: string | null
        }
        Update: {
          created_at?: string
          data_votacao?: string | null
          id?: string
          justificativa?: string | null
          politico_id?: number
          pontos?: number | null
          proposicao?: string | null
          tema?: string | null
          tipo_politico?: string
          votacao_id?: string
          voto?: string | null
          voto_esperado?: string | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          contact_profile_pic: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          last_message_at: string | null
          remote_jid: string
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          contact_profile_pic?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          remote_jid: string
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          contact_profile_pic?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          remote_jid?: string
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string
          from_me: boolean
          id: string
          media_url: string | null
          message_id: string | null
          message_type: string | null
          raw_data: Json | null
          remote_jid: string
          status: string | null
          timestamp: string
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string
          from_me?: boolean
          id?: string
          media_url?: string | null
          message_id?: string | null
          message_type?: string | null
          raw_data?: Json | null
          remote_jid: string
          status?: string | null
          timestamp?: string
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string
          from_me?: boolean
          id?: string
          media_url?: string | null
          message_id?: string | null
          message_type?: string | null
          raw_data?: Json | null
          remote_jid?: string
          status?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_stats: {
        Row: {
          ai_responses: number | null
          conversations_started: number | null
          created_at: string
          date: string
          id: string
          messages_received: number | null
          messages_sent: number | null
          updated_at: string
        }
        Insert: {
          ai_responses?: number | null
          conversations_started?: number | null
          created_at?: string
          date?: string
          id?: string
          messages_received?: number | null
          messages_sent?: number | null
          updated_at?: string
        }
        Update: {
          ai_responses?: number | null
          conversations_started?: number | null
          created_at?: string
          date?: string
          id?: string
          messages_received?: number | null
          messages_sent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      wikipedia_cache: {
        Row: {
          conteudo: Json
          created_at: string
          id: number
          imagens: Json | null
          links_relacionados: Json | null
          titulo: string
          updated_at: string
        }
        Insert: {
          conteudo: Json
          created_at?: string
          id?: number
          imagens?: Json | null
          links_relacionados?: Json | null
          titulo: string
          updated_at?: string
        }
        Update: {
          conteudo?: Json
          created_at?: string
          id?: number
          imagens?: Json | null
          links_relacionados?: Json | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      wikipedia_favoritos: {
        Row: {
          categoria: string
          created_at: string
          id: number
          titulo: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: number
          titulo: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: number
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      wikipedia_historico: {
        Row: {
          categoria: string
          created_at: string
          id: number
          titulo: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: number
          titulo: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: number
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_status_cache_proposicoes: {
        Row: {
          com_foto: number | null
          data_mais_antiga: string | null
          data_mais_recente: string | null
          percentual_foto: number | null
          tipo: string | null
          total: number | null
          ultima_atualizacao: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_ajustar_trial: {
        Args: { p_desativado?: boolean; p_extra_ms?: number; p_user_id: string }
        Returns: undefined
      }
      atualizar_ordem_tema: {
        Args: { p_area: string; p_nova_ordem: number; p_tema: string }
        Returns: number
      }
      auto_expirar_assinaturas: { Args: never; Returns: number }
      buscar_segmentos_similares: {
        Args: {
          limite?: number
          query_embedding: string
          similaridade_minima?: number
        }
        Returns: {
          fim_segundos: number
          id: string
          inicio_segundos: number
          similaridade: number
          texto: string
          thumbnail: string
          tribunal: string
          video_id: string
          video_titulo: string
        }[]
      }
      contar_questoes_por_materias: {
        Args: { materia_ids: number[] }
        Returns: {
          materia_id: number
          questoes_count: number
        }[]
      }
      get_admin_ativos_detalhes: {
        Args: { p_dias?: number }
        Returns: {
          dispositivo: string
          email: string
          last_seen: string
          nome: string
          telefone: string
          total_views: number
          user_id: string
        }[]
      }
      get_admin_ativos_periodo: { Args: { p_dias?: number }; Returns: number }
      get_admin_cadastros_por_dia: {
        Args: { p_dias?: number }
        Returns: {
          dia: string
          total: number
        }[]
      }
      get_admin_novos_detalhes: {
        Args: { p_dias?: number }
        Returns: {
          created_at: string
          dispositivo: string
          email: string
          estado_cadastro: string
          intencao: string
          nome: string
          pais_cadastro: string
          telefone: string
          user_id: string
        }[]
      }
      get_admin_novos_por_periodo: {
        Args: { p_dias?: number }
        Returns: number
      }
      get_admin_online_30min_count: { Args: never; Returns: number }
      get_admin_online_30min_details: {
        Args: never
        Returns: {
          country: string
          dispositivo: string
          email: string
          last_seen: string
          nome: string
          page_path: string
          region: string
          telefone: string
          user_id: string
        }[]
      }
      get_admin_online_count: { Args: never; Returns: number }
      get_admin_online_details: {
        Args: never
        Returns: {
          dispositivo: string
          email: string
          last_seen: string
          nome: string
          page_path: string
          session_id: string
          telefone: string
          user_id: string
        }[]
      }
      get_admin_paginas_populares: {
        Args: { p_dias?: number }
        Returns: {
          page_path: string
          page_title: string
          total: number
        }[]
      }
      get_admin_total_pageviews: { Args: { p_dias?: number }; Returns: number }
      get_app_statistics: {
        Args: never
        Returns: {
          audioaulas: number
          casos_simulacao: number
          cursos_aulas: number
          flashcards: number
          livros_classicos: number
          livros_estudos: number
          livros_fora_da_toga: number
          livros_lideranca: number
          livros_oratoria: number
          mapas_mentais: number
          questoes_oab: number
          resumos: number
          videoaulas: number
        }[]
      }
      get_biblioteca_counts: {
        Args: never
        Returns: {
          classicos: number
          estudos: number
          oab: number
          oratoria: number
          pesquisa: number
          portugues: number
        }[]
      }
      get_flashcard_areas: {
        Args: never
        Returns: {
          area: string
          count: number
        }[]
      }
      get_flashcard_areas_from_gerados: {
        Args: never
        Returns: {
          area: string
          total_flashcards: number
        }[]
      }
      get_flashcard_areas_stats: {
        Args: never
        Returns: {
          area: string
          total_flashcards: number
          total_temas: number
        }[]
      }
      get_flashcard_artigos_count: {
        Args: never
        Returns: {
          area: string
          total: number
        }[]
      }
      get_flashcard_temas: {
        Args: { p_area: string }
        Returns: {
          count: number
          tema: string
        }[]
      }
      get_flashcard_temas_stats: {
        Args: { p_area: string }
        Returns: {
          ordem: number
          subtemas_gerados: number
          tema: string
          total_flashcards: number
          total_subtemas: number
        }[]
      }
      get_flashcards_para_revisao: {
        Args: { p_area?: string; p_limite?: number; p_user_id: string }
        Returns: {
          area: string
          dias_atrasado: number
          fator_facilidade: number
          flashcard_id: number
          intervalo_dias: number
          repeticoes: number
          tema: string
        }[]
      }
      get_lacunas_areas_stats: {
        Args: never
        Returns: {
          area: string
          total_lacunas: number
          total_temas: number
        }[]
      }
      get_lacunas_temas_stats: {
        Args: { p_area: string }
        Returns: {
          ordem: number
          subtemas_gerados: number
          tema: string
          total_lacunas: number
          total_subtemas: number
        }[]
      }
      get_questoes_areas_stats: {
        Args: never
        Returns: {
          area: string
          total_questoes: number
          total_temas: number
        }[]
      }
      get_resumos_counts: {
        Args: never
        Returns: {
          resumos_artigos_lei: number
          resumos_cornell: number
          resumos_feynman: number
          resumos_materia: number
        }[]
      }
      get_vademecum_counts: {
        Args: never
        Returns: {
          legislacao_penal: number
          previdenciario: number
          sumulas: number
        }[]
      }
      incrementar_stats_questao: {
        Args: { p_correta: boolean; p_questao_id: number }
        Returns: undefined
      }
      inserir_topico_oab_trilhas: {
        Args: { p_materia_id: number; p_ordem: number; p_titulo: string }
        Returns: number
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      limpar_cache_proposicoes_antigo: { Args: never; Returns: undefined }
      limpar_evelyn_mensagens_processadas: { Args: never; Returns: undefined }
      limpar_noticias_antigas: {
        Args: { dias_reter?: number }
        Returns: {
          imagens_para_deletar: string[]
          registros_deletados: number
          tabela: string
        }[]
      }
      normalizar_numero_artigo: { Args: { num: string }; Returns: number }
      normalizar_telefone_evelyn: {
        Args: { telefone: string }
        Returns: string
      }
      registrar_resposta_usuario: {
        Args: { p_area: string; p_correta: boolean; p_tema: string }
        Returns: undefined
      }
      registrar_uso_token: {
        Args: {
          p_api_key_index?: number
          p_custo_estimado_brl?: number
          p_edge_function: string
          p_erro?: string
          p_input_tokens?: number
          p_metadata?: Json
          p_model?: string
          p_output_tokens?: number
          p_provider?: string
          p_sucesso?: boolean
          p_tipo_conteudo?: string
          p_user_id?: string
        }
        Returns: string
      }
      reset_daily_limits: { Args: never; Returns: undefined }
      verificar_banimento: {
        Args: { p_email?: string; p_telefone?: string }
        Returns: boolean
      }
      verificar_status_premium: {
        Args: { p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      feature_type:
        | "narracao"
        | "explicacao"
        | "exemplo"
        | "flashcards"
        | "questoes"
        | "assistente"
      forca_opcao: "forte" | "media" | "fraca"
      nivel_dificuldade: "Fácil" | "Médio" | "Difícil"
      vade_role: "admin" | "moderador" | "contribuidor" | "leitor"
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
    Enums: {
      feature_type: [
        "narracao",
        "explicacao",
        "exemplo",
        "flashcards",
        "questoes",
        "assistente",
      ],
      forca_opcao: ["forte", "media", "fraca"],
      nivel_dificuldade: ["Fácil", "Médio", "Difícil"],
      vade_role: ["admin", "moderador", "contribuidor", "leitor"],
    },
  },
} as const
