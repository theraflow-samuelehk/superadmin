
INSERT INTO public.reminder_flow_models (name, description, is_active, flow_config)
VALUES
  (
    'Solo Conferma',
    'Invia solo il messaggio di conferma immediata alla creazione dell''appuntamento. Nessun reminder successivo.',
    false,
    '{
      "version": 3,
      "send_confirmation": true,
      "channel_escalation": {
        "sequence": ["push", "whatsapp", "sms"],
        "delays_min": { "whatsapp": 10, "sms": 20 }
      },
      "cases": {
        "all": { "min_hours": 0, "max_hours": null, "label": "Tutti", "nodes": [] }
      }
    }'::jsonb
  ),
  (
    'Solo Reminder',
    'Invia solo promemoria senza conferma immediata. >24h: reminder il giorno prima alla stessa ora. 2-24h: reminder 2h prima. <2h: niente.',
    false,
    '{
      "version": 3,
      "send_confirmation": false,
      "channel_escalation": {
        "sequence": ["push", "whatsapp", "sms"],
        "delays_min": { "whatsapp": 10, "sms": 20 }
      },
      "cases": {
        "A": {
          "min_hours": 24, "max_hours": null, "label": ">24h",
          "nodes": [{ "node_type": "reminder", "timing": "day_before_same_hour", "message_key": "reminder_24h" }]
        },
        "B": {
          "min_hours": 2, "max_hours": 24, "label": "2-24h",
          "nodes": [{ "node_type": "reminder", "timing": "fixed_offset", "offset_hours": 2, "message_key": "reminder_bcd" }]
        },
        "C": {
          "min_hours": 0, "max_hours": 2, "label": "<2h",
          "nodes": []
        }
      }
    }'::jsonb
  ),
  (
    'Conferma + Reminder',
    'Conferma immediata + reminder. >24h: 2 reminder (giorno prima stessa ora + 2h prima). 2-24h: 1 reminder 2h prima. <2h: solo conferma.',
    false,
    '{
      "version": 3,
      "send_confirmation": true,
      "channel_escalation": {
        "sequence": ["push", "whatsapp", "sms"],
        "delays_min": { "whatsapp": 10, "sms": 20 }
      },
      "cases": {
        "A": {
          "min_hours": 24, "max_hours": null, "label": ">24h",
          "nodes": [
            { "node_type": "reminder", "timing": "day_before_same_hour", "message_key": "reminder_24h" },
            { "node_type": "reminder", "timing": "fixed_offset", "offset_hours": 2, "message_key": "reminder_bcd" }
          ]
        },
        "B": {
          "min_hours": 2, "max_hours": 24, "label": "2-24h",
          "nodes": [{ "node_type": "reminder", "timing": "fixed_offset", "offset_hours": 2, "message_key": "reminder_bcd" }]
        },
        "C": {
          "min_hours": 0, "max_hours": 2, "label": "<2h",
          "nodes": []
        }
      }
    }'::jsonb
  );
