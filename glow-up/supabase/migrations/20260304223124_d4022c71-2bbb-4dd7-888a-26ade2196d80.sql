-- Fix admin reply about shifts: correct section name
UPDATE support_messages 
SET content = 'Buongiorno! Per impostare i turni vada su Operatori, selezioni l''operatrice e poi clicchi sulla tab "Turni". Da lì può configurare gli orari per ogni giorno della settimana.'
WHERE conversation_id = 'ee899a17-0301-4354-811a-fef86ff628d7' 
AND sender_type = 'admin' 
AND created_at = '2026-02-15 10:45:00+00';