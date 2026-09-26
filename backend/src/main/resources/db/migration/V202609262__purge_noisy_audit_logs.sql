DELETE FROM public.audit_logs
WHERE http_method = 'POST'
  AND (
      endpoint IN (
          '/api/analytics/visit',
          '/api/auth/refresh',
          '/api/user-answers/batch'
      )
      OR endpoint LIKE '/api/questions/preview/%'
  );
