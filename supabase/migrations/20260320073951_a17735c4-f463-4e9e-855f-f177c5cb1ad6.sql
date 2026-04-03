-- Clean junk from conteudo_completo for all existing records
UPDATE noticias_legislativas_cache 
SET conteudo_completo = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          conteudo_completo,
          'Você está usando um navegador defasado\. Por favor, atualize seu navegador para melhorar sua experiência e sua segurança\.\s*',
          '',
          'g'
        ),
        'A reprodução das notícias é autorizada desde que contenha a assinatura .Agência Câmara Notícias.\.\s*',
        '',
        'g'
      ),
      'Use esse formulário para comunicar erros ou fazer sugestões sobre o novo portal da Câmara dos Deputados\. Para qualquer outro assunto, utilize o Fale Conosco\.\s*',
      '',
      'g'
    ),
    'Sua mensagem foi enviada\.\s*',
    '',
    'g'
  ),
  'Saiba mais sobre a tramitação de projetos de lei\s*',
  '',
  'g'
)
WHERE conteudo_completo IS NOT NULL;