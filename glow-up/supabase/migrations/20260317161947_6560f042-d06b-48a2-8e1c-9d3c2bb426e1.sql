
UPDATE reminder_flow_models 
SET flow_config = jsonb_set(
  flow_config, 
  '{messages}', 
  flow_config->'messages' || jsonb_build_object(
    'push_immediate_confirmation', E'{{salon_name}}:\nAppuntamento confermato\n{{short_data}} {{ora}}\n\nApri l''app per annullare o spostare',
    'push_reminder_24h', E'Azione Richiesta!\n{{salon_name}}:\nDomani alle {{ora}}\n\nApri l''app per confermare o annullare',
    'push_reminder_bcd', E'Azione Richiesta!\n{{salon_name}}:\nOggi, ore {{ora}}\n\nApri l''app per confermare o annullare',
    'push_reminder_confirmed', E'{{salon_name}}:\nOggi alle {{ora}}\n\nApri l''app per modificare',
    'push_no_response', E'Azione Richiesta!\n{{salon_name}}:\nOggi, ore {{ora}}\n\nApri l''app per confermare o annullare',
    'push_mid_treatment', E'{{salon_name}}: Scarica la nostra app!'
  )
)
WHERE name IN ('Conferma + Reminder', 'Solo Conferma', 'Solo Reminder');
