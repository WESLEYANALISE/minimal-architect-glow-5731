UPDATE noticias_legislativas_cache
SET conteudo_completo = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          conteudo_completo,
          E'(^|\\n\\n)[^\\n]{2,40}\\s*[/–-]\\s*(Câmara|Agência|Senado|Foto)[^\\n]*', 
          E'\\1', 'gi'
        ),
        E'(^|\\n\\n)Reportagem\\s*[–-]\\s*[^\\n]*', E'\\1', 'gi'
      ),
      E'(^|\\n\\n)Edição\\s*[–-]\\s*[^\\n]*', E'\\1', 'gi'
    ),
    E'(^|\\n\\n)[^\\n]*navegador defasado[^\\n]*', E'\\1', 'gi'
  ),
  E'\\n{3,}', E'\\n\\n', 'g'
)
WHERE conteudo_completo IS NOT NULL;