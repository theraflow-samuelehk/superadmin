-- Delete existing messages
DELETE FROM support_messages WHERE conversation_id = 'ee899a17-0301-4354-811a-fef86ff628d7';

-- Insert new realistic messages about internal app features
INSERT INTO support_messages (conversation_id, sender_id, sender_type, content, is_read, created_at) VALUES
('ee899a17-0301-4354-811a-fef86ff628d7', '7d458727-a87b-491b-b137-ed809d4336d6', 'retailer', 'Ciao, ho appena aggiunto una nuova operatrice ma non riesco a impostarle i turni. Come faccio?', true, '2026-02-15 10:30:00+00'),
('ee899a17-0301-4354-811a-fef86ff628d7', '00000000-0000-0000-0000-000000000000', 'admin', 'Buongiorno! Per impostare i turni vada su Gestione Staff, selezioni l''operatrice e poi clicchi sulla tab "Turni". Da lì può configurare gli orari per ogni giorno della settimana.', true, '2026-02-15 10:45:00+00'),
('ee899a17-0301-4354-811a-fef86ff628d7', '7d458727-a87b-491b-b137-ed809d4336d6', 'retailer', 'Perfetto, trovato! Un''altra cosa: vorrei attivare il programma fedeltà per le clienti. Dove lo configuro?', true, '2026-02-15 11:02:00+00'),
('ee899a17-0301-4354-811a-fef86ff628d7', '00000000-0000-0000-0000-000000000000', 'admin', 'Vada su Fidelizzazione nel menu laterale. Da lì può creare le carte trattamento, impostare la soglia punti e scegliere il premio. Le clienti vedranno i punti direttamente dalla loro app! 🎯', true, '2026-02-15 11:10:00+00'),
('ee899a17-0301-4354-811a-fef86ff628d7', '7d458727-a87b-491b-b137-ed809d4336d6', 'retailer', 'Ottimo, tutto chiaro. Grazie mille per il supporto rapido! 👍', true, '2026-02-15 11:15:00+00');

-- Update last_message_at
UPDATE support_conversations SET last_message_at = '2026-02-15 11:15:00+00' WHERE id = 'ee899a17-0301-4354-811a-fef86ff628d7';