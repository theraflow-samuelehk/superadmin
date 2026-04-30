
UPDATE public.reminder_flow_models
SET flow_config = jsonb_build_object(
  'version', 3,
  'channel_escalation', jsonb_build_object(
    'sequence', '["push","whatsapp","sms"]'::jsonb,
    'delays_min', jsonb_build_object('whatsapp', 10, 'sms', 20)
  ),
  'cases', jsonb_build_object(
    'A', jsonb_build_object(
      'min_hours', 24, 'max_hours', null, 'label', '> 24h',
      'nodes', '[
        {"node_type":"reminder_24h","timing":"day_before_table","message_key":"reminder_24h"},
        {"node_type":"reminder_confirmed","timing":"confirmed_same_day","message_key":"reminder_confirmed","only_if_confirmed":true},
        {"node_type":"no_response_followup","timing":"no_response_table","message_key":"no_response","only_if_no_response":true},
        {"node_type":"admin_escalation","timing":"admin_table","message_key":"admin_escalation","is_admin":true},
        {"node_type":"mid_treatment_link","timing":"mid_treatment","message_key":"mid_treatment"}
      ]'::jsonb,
      'timing_tables', jsonb_build_object(
        'day_before', '{"8":8,"9":9,"10":10,"11":11,"12":12,"13":13,"14":14,"15":15,"16":16,"17":17,"18":18,"19":18,"20":18}'::jsonb,
        'no_response', '{"8":14,"9":14,"10":14,"11":14,"12":14,"13":17,"14":17,"15":9,"16":9,"17":9,"18":10,"19":10,"20":10}'::jsonb,
        'admin_push', '{"8":17,"9":17,"10":17,"11":17,"12":18,"13":18,"14":18,"15":12,"16":12,"17":12,"18":13,"19":13,"20":13}'::jsonb,
        'same_day', '{"8":9,"9":9,"10":9,"11":9,"12":9,"13":9,"14":9,"15":9,"16":9,"17":9,"18":9,"19":9,"20":9}'::jsonb
      )
    ),
    'B', jsonb_build_object(
      'min_hours', 12, 'max_hours', 24, 'label', '12-24h',
      'nodes', '[
        {"node_type":"reminder","timing":"offset_table","message_key":"reminder_bcd"},
        {"node_type":"admin_escalation","timing":"admin_table","message_key":"admin_escalation","is_admin":true},
        {"node_type":"mid_treatment_link","timing":"mid_treatment","message_key":"mid_treatment"}
      ]'::jsonb,
      'timing_tables', jsonb_build_object(
        'offset_hours', '{"8":2,"9":2,"10":2,"11":3,"12":3,"13":4,"14":5,"15":5,"16":6,"17":7,"18":6,"19":7,"20":8}'::jsonb,
        'admin_push', '{"8":7,"9":8,"10":9,"11":9,"12":10,"13":11,"14":12,"15":12,"16":13,"17":13,"18":15,"19":16,"20":16}'::jsonb
      )
    ),
    'C', jsonb_build_object(
      'min_hours', 4, 'max_hours', 12, 'label', '4-12h',
      'nodes', '[
        {"node_type":"reminder","timing":"fixed_offset","offset_hours":2,"message_key":"reminder_bcd"},
        {"node_type":"mid_treatment_link","timing":"mid_treatment","message_key":"mid_treatment"}
      ]'::jsonb
    ),
    'D', jsonb_build_object(
      'min_hours', 2, 'max_hours', 4, 'label', '2-4h',
      'nodes', '[
        {"node_type":"reminder","timing":"fixed_offset","offset_hours":1,"message_key":"reminder_bcd"},
        {"node_type":"mid_treatment_link","timing":"mid_treatment","message_key":"mid_treatment"}
      ]'::jsonb
    ),
    'E', jsonb_build_object(
      'min_hours', 0, 'max_hours', 2, 'label', '< 2h',
      'nodes', '[
        {"node_type":"mid_treatment_link","timing":"mid_treatment","message_key":"mid_treatment"}
      ]'::jsonb
    )
  )
)
WHERE is_active = true;
