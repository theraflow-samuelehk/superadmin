ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
DECLARE
  ws_id UUID;
BEGIN
  SELECT w.id INTO ws_id
  FROM public.workspaces w
  JOIN public.profiles p ON p.id = w.owner_id
  WHERE p.email = 'samuelehk@gmail.com'
  LIMIT 1;

  DELETE FROM public.projects
  WHERE slug = 'pannello-progetti'
    AND workspace_id = ws_id;

  UPDATE public.projects SET metadata = '{
    "domain_label": "aliceblue-dragonfly-326952.hostingersite.com",
    "links": [
      {"label": "Sito", "url": "https://aliceblue-dragonfly-326952.hostingersite.com", "type": "site"},
      {"label": "Admin", "url": "https://aliceblue-dragonfly-326952.hostingersite.com/admin.php", "type": "admin"},
      {"label": "Admin Corsi", "url": "https://aliceblue-dragonfly-326952.hostingersite.com/corsi/admin-corsi.php", "type": "admin"},
      {"label": "Portale Studenti", "url": "https://aliceblue-dragonfly-326952.hostingersite.com/corsi/", "type": "local"},
      {"label": "GitHub", "url": "https://github.com/theraflow-samuelehk/funnel-segretarie", "type": "github"}
    ],
    "credentials": [
      {"label": "Password", "value": "Segretarie2026!", "hidden": true},
      {"label": "WhatsApp", "value": "+39 334 382 8321", "hidden": false},
      {"label": "Pixel FB", "value": "1640258307311235", "hidden": false}
    ],
    "scripts": [
      {
        "id": "wa-msg",
        "title": "Messaggio WhatsApp",
        "color": "#25d366",
        "content": "Ciao! Sono Alessandro, molto piacere.\n\nTi ringrazio per averci scritto.\n\nTi spiego in breve come funziona il nostro percorso.\n\nPraticamente il corso e'' composto da 4 moduli semplici da un''ora ciascuno: Excel, Google Calendar, Word e PowerPoint. Niente di complicato, tutto online e vai al tuo ritmo.\n\nUna volta completato ricevi il certificato e da li noi ti mettiamo direttamente in contatto con le aziende che stanno cercando segretarie da inserire in smartworking.\n\nIl lavoro e'' da casa, 4 ore al giorno dal lunedi al venerdi, 1.500 euro al mese con contratto a tempo indeterminato, piu tredicesima e quattordicesima.\n\nIl corso costa solo 89 euro invece di 297 ed e'' un''offerta che abbiamo attiva per pochissimi posti, ti dico la verita ne restano davvero pochi.\n\nSe ti interessa e vuoi saperne di piu, posso farti richiamare da una nostra consulente che ti spiega tutto nel dettaglio e risponde a qualsiasi dubbio.\n\nDimmi pure quando ti fa piu comodo, quale giorno e a che ora preferisci, e organizziamo la chiamata!"
      },
      {
        "id": "call-script",
        "title": "Script Call Setter",
        "color": "#6366f1",
        "content": "APERTURA:\n\"Ciao [Nome], sono [Tuo Nome] del team Segretaria Professionale. Come stai? Ti chiamo perche hai lasciato i tuoi dati per avere informazioni sul nostro corso di Segretaria con inserimento lavorativo, ti ricordi?\"\n\nQUALIFICA:\n\"Perfetto! Dimmi, cosa ti ha spinto a interessarti a questa opportunita? Stai cercando lavoro in questo momento?\"\n\nPRESENTAZIONE:\n\"Bene, allora ti spiego brevemente. Il nostro percorso e'' composto da 4 moduli online: Excel, Word, PowerPoint e Google Calendar. Ogni modulo dura circa un''ora, lo fai al tuo ritmo da casa.\n\nUna volta completato ricevi il certificato e da li noi ti mettiamo in contatto diretto con le aziende che cercano segretarie in smartworking. Si parla di 4 ore al giorno, dal lunedi al venerdi, 1.500 euro al mese con contratto a tempo indeterminato.\"\n\nPREZZO + URGENZA:\n\"Il corso ha un costo di soli 89 euro invece di 297. E'' un''offerta limitata, restano pochissimi posti. Se decidi oggi possiamo bloccarti il posto subito.\"\n\nCHIUSURA:\n\"Come preferisci pagare? Bonifico bancario o contrassegno alla consegna del materiale?\"\n\nOBIEZIONI:\n- \"Devo pensarci\" → \"Capisco, ma ti dico la verita, i posti si esauriscono velocemente. Se aspetti rischi di perdere l''offerta a 89 euro. Cosa ti frena esattamente?\"\n- \"Costa troppo\" → \"Guarda, sono meno di 90 euro per un corso certificato PIU inserimento lavorativo con stipendio di 1.500 al mese. L''investimento lo recuperi gia il primo mese di lavoro.\"\n- \"Non sono sicura\" → \"E'' normale avere dubbi. Ma pensa: tra un mese potresti gia lavorare da casa. Cosa hai da perdere per 89 euro?\""
      },
      {
        "id": "wa-script",
        "title": "Script WhatsApp",
        "color": "#f59e0b",
        "content": "REGOLE GENERALI:\n- Rispondi ENTRO 5 minuti dal lead. Piu aspetti, piu il lead si raffredda\n- Tono amichevole ma professionale, dai del TU\n- Non mandare messaggi troppo lunghi, vai per step\n- Se non risponde dopo 1 ora, manda un follow-up\n- Se non risponde dopo 24h, manda ultimo messaggio\n\nSTEP 1 - PRIMO CONTATTO (entro 5 min):\n\"Ciao [Nome]! Sono [Tuo Nome], piacere. Ti scrivo perche hai lasciato i tuoi dati per il corso di Segretaria Professionale. Posso darti tutte le info, hai un minuto?\"\n\nSTEP 2 - SE RISPONDE:\nManda il messaggio WhatsApp principale\n\nSTEP 3 - FISSARE LA CALL:\n\"Perfetto! Per spiegarti tutto nel dettaglio posso farti richiamare dalla nostra consulente. Quando ti fa piu comodo? Mattina o pomeriggio?\"\n\nSTEP 4 - FOLLOW-UP (se non risponde dopo 1h):\n\"Ciao [Nome], ti avevo scritto prima riguardo al corso di segretaria con inserimento lavorativo. Magari eri occupata! Quando hai un attimo dimmi pure, ti spiego tutto in 2 minuti\"\n\nSTEP 5 - ULTIMO TENTATIVO (dopo 24h):\n\"Ciao [Nome], ultimo messaggio cosi non ti disturbo piu. Volevo solo dirti che i posti per il corso a 89 euro stanno finendo. Se ti interessa ancora fammi sapere, altrimenti nessun problema. Buona giornata!\"\n\nRISPOSTE RAPIDE:\n- \"Quanto costa?\" → \"Solo 89 euro invece di 297, offerta limitata. Vuoi che ti spiego cosa include?\"\n- \"Come funziona il lavoro?\" → \"Smartworking da casa, 4 ore al giorno lun-ven, 1.500/mese con contratto indeterminato.\"\n- \"E'' una truffa?\" → \"Capisco il dubbio! Siamo un ente certificato. Abbiamo gia inserito decine di ragazze, posso mostrarti le testimonianze\""
      }
    ]
  }'::jsonb
  WHERE slug = 'funnel-segretarie' AND workspace_id = ws_id;

  UPDATE public.projects SET metadata = '{
    "domain_label": "mediumturquoise-mule-624710.hostingersite.com",
    "links": [
      {"label": "Sito", "url": "https://mediumturquoise-mule-624710.hostingersite.com", "type": "site"},
      {"label": "Admin", "url": "https://mediumturquoise-mule-624710.hostingersite.com/admin.php", "type": "admin"},
      {"label": "Admin Corsi", "url": "https://mediumturquoise-mule-624710.hostingersite.com/corsi/admin-corsi.php", "type": "admin"},
      {"label": "Portale Studenti", "url": "https://mediumturquoise-mule-624710.hostingersite.com/corsi/", "type": "local"},
      {"label": "GitHub", "url": "https://github.com/theraflow-samuelehk/funnel-nails", "type": "github"}
    ],
    "credentials": [
      {"label": "Password", "value": "Nails2026!", "hidden": true},
      {"label": "WhatsApp", "value": "+39 334 382 8321", "hidden": false},
      {"label": "Pixel FB", "value": "1313613270661919", "hidden": false}
    ],
    "scripts": [
      {
        "id": "wa-msg",
        "title": "Messaggio WhatsApp",
        "color": "#25d366",
        "content": "Ciao! Sono Marta, molto piacere.\n\nGrazie per averci scritto riguardo al corso di ricostruzione unghie.\n\nTi spiego velocemente come funziona.\n\nIl corso e'' tutto online e copre tutto quello che serve per diventare una nail artist professionista: dalla teoria base come anatomia dell''unghia e igiene, fino alle tecniche pratiche come stesura del gel, french manicure, dual form moderna, refill e 5 tecniche di decorazione.\n\nVai al tuo ritmo, le lezioni sono in video e puoi rivederle quando vuoi. Alla fine ricevi l''attestato di partecipazione.\n\nE la cosa bella e'' che una volta ottenuto l''attestato, ti mettiamo in contatto con i centri estetici della tua zona che cercano nail artist formate. Quindi non solo impari, ma ti aiutiamo anche a trovare lavoro.\n\nIl corso costa solo 50 euro invece di 149, ed e'' un''offerta limitata che abbiamo attiva solo per pochi posti.\n\nSe vuoi procedere o vuoi maggiori informazioni, posso farti richiamare da una nostra consulente che ti spiega tutto nel dettaglio.\n\nDimmi pure quando ti fa piu comodo e organizziamo!"
      },
      {
        "id": "call-script",
        "title": "Script Call Setter",
        "color": "#6366f1",
        "content": "APERTURA:\n\"Ciao [Nome], sono [Tuo Nome] del team Nail Art Academy. Come stai? Ti chiamo perche hai lasciato i tuoi dati per avere informazioni sul nostro corso di ricostruzione unghie, ti ricordi?\"\n\nQUALIFICA:\n\"Perfetto! Dimmi, cosa ti ha spinto a interessarti al corso? Hai gia qualche esperienza con le unghie o parti da zero?\"\n\nPRESENTAZIONE:\n\"Bene, allora ti spiego brevemente. Il corso e'' completamente online e copre tutte le tecniche professionali: gel, french, dual form moderna, refill e decorazioni. Vai al tuo ritmo con video lezioni che puoi rivedere quando vuoi.\n\nAlla fine ricevi l''attestato e noi ti mettiamo in contatto con i centri estetici della tua zona che cercano nail artist. Puoi lavorare anche da casa aprendo il tuo servizio.\"\n\nPREZZO + URGENZA:\n\"Il corso costa solo 50 euro invece di 149. Offerta limitata, pochissimi posti disponibili. Se decidi oggi ti blocco subito il posto.\"\n\nCHIUSURA:\n\"Come preferisci procedere? Posso mandarti il link di pagamento direttamente su WhatsApp.\"\n\nOBIEZIONI:\n- \"Devo pensarci\" → \"Capisco, ma ti dico che i posti finiscono veloce. A 50 euro e'' un rischio quasi zero. Cosa ti frena?\"\n- \"Costa troppo\" → \"Sono 50 euro per un corso completo certificato che ti apre una carriera. Lo recuperi con le prime clienti.\"\n- \"Non sono sicura\" → \"E'' normalissimo. Pensa che con questo corso in mano puoi iniziare a lavorare gia il mese prossimo, anche da casa.\""
      },
      {
        "id": "wa-script",
        "title": "Script WhatsApp",
        "color": "#f59e0b",
        "content": "REGOLE GENERALI:\n- Rispondi ENTRO 5 minuti dal lead\n- Tono amichevole, dai del TU\n- Vai per step, non mandare tutto insieme\n- Follow-up dopo 1 ora se non risponde\n- Ultimo tentativo dopo 24h\n\nSTEP 1 - PRIMO CONTATTO (entro 5 min):\n\"Ciao [Nome]! Sono Marta, piacere. Ti scrivo perche hai lasciato i tuoi dati per il corso di nail art professionale. Hai un minuto per saperne di piu?\"\n\nSTEP 2 - SE RISPONDE:\nManda il messaggio WhatsApp principale\n\nSTEP 3 - FISSARE LA CALL:\n\"Ottimo! Per spiegarti tutto nel dettaglio posso farti richiamare dalla nostra consulente. Preferisci mattina o pomeriggio?\"\n\nSTEP 4 - FOLLOW-UP (dopo 1h):\n\"Ciao [Nome], ti avevo scritto prima per il corso di unghie. Forse eri occupata! Quando hai un attimo fammi sapere, ti spiego tutto in 2 minuti.\"\n\nSTEP 5 - ULTIMO TENTATIVO (dopo 24h):\n\"Ciao [Nome], ultimo messaggio per non disturbarti. I posti per il corso a 50 euro stanno finendo. Se ti interessa ancora scrivimi, altrimenti buona giornata!\"\n\nRISPOSTE RAPIDE:\n- \"Quanto costa?\" → \"Solo 50 euro invece di 149, offerta limitata. Ti spiego cosa include?\"\n- \"Posso lavorare dopo?\" → \"Si, ti mettiamo in contatto con centri estetici della tua zona. Puoi anche lavorare da casa.\"\n- \"E'' seria?\" → \"Assolutamente! Corso certificato, centinaia di allieve gia formate. Posso mostrarti le testimonianze.\""
      }
    ]
  }'::jsonb
  WHERE slug = 'funnel-nails' AND workspace_id = ws_id;

  UPDATE public.projects SET metadata = '{
    "domain_label": "darkred-koala-809285.hostingersite.com",
    "links": [
      {"label": "Sito", "url": "https://darkred-koala-809285.hostingersite.com", "type": "site"},
      {"label": "Admin", "url": "https://darkred-koala-809285.hostingersite.com/admin.php", "type": "admin"},
      {"label": "Admin Corsi", "url": "https://darkred-koala-809285.hostingersite.com/corsi/admin-corsi.php", "type": "admin"},
      {"label": "Portale Studenti", "url": "https://darkred-koala-809285.hostingersite.com/corsi/", "type": "local"},
      {"label": "GitHub", "url": "https://github.com/theraflow-samuelehk/funnel-lash", "type": "github"}
    ],
    "credentials": [
      {"label": "Password", "value": "LashArt2026!", "hidden": true},
      {"label": "WhatsApp", "value": "+39 334 382 8321", "hidden": false},
      {"label": "Pixel FB", "value": "1313613270661919", "hidden": false}
    ],
    "scripts": [
      {
        "id": "wa-msg",
        "title": "Messaggio WhatsApp",
        "color": "#25d366",
        "content": "Ciao! Sono Marta di Lash Art Academy, piacere.\n\nGrazie per il tuo interesse nel corso di extension ciglia.\n\nTi racconto in breve cosa comprende.\n\nIl corso ti insegna le 4 tecniche piu richieste nel settore: Tecnica One to One, Nastro Brasiliano, Volume Ibrido e Ciglia Lifting Magico. Ogni tecnica ha le sue video lezioni dettagliate con dimostrazioni pratiche step by step.\n\nAlla fine di ogni tecnica ricevi un certificato professionale rilasciato dalla fondatrice Martina Celesti, quindi in totale ricevi 4 certificati.\n\nIl corso e'' tutto online, lo segui al tuo ritmo e hai accesso a vita. Costa solo 50 euro invece di 299, ma l''offerta e'' limitata ai primi 15 posti e ne restano pochissimi.\n\nSe sei interessata a bloccare il tuo posto, posso farti contattare dalla nostra consulente per completare la registrazione.\n\nFammi sapere se vuoi procedere e dimmi quando ti fa piu comodo essere ricontattata!"
      },
      {
        "id": "call-script",
        "title": "Script Call Setter",
        "color": "#6366f1",
        "content": "APERTURA:\n\"Ciao [Nome], sono [Tuo Nome] di Lash Art Academy. Come stai? Ti chiamo perche hai lasciato i tuoi dati per il corso di extension ciglia, ti ricordi?\"\n\nQUALIFICA:\n\"Perfetto! Dimmi, hai gia esperienza con le ciglia o parti completamente da zero?\"\n\nPRESENTAZIONE:\n\"Bene, allora ti spiego brevemente. Il corso copre le 4 tecniche piu richieste: One to One, Nastro Brasiliano, Volume Ibrido e Ciglia Lifting Magico. Ogni tecnica ha video lezioni dettagliate con dimostrazioni pratiche.\n\nAlla fine di ogni modulo ricevi un certificato professionale firmato dalla fondatrice Martina Celesti. Quindi ottieni 4 certificati in totale. Il corso e'' online, vai al tuo ritmo e hai accesso a vita.\"\n\nPREZZO + URGENZA:\n\"Costa solo 50 euro invece di 299. Offerta riservata ai primi 15 posti, ne restano davvero pochissimi. Se decidi adesso ti blocco il posto.\"\n\nCHIUSURA:\n\"Come preferisci procedere? Ti mando il link direttamente qui su WhatsApp.\"\n\nOBIEZIONI:\n- \"Devo pensarci\" → \"Capisco, ma ti dico che i 15 posti si stanno riempiendo velocemente. Cosa ti frena?\"\n- \"Costa troppo\" → \"Sono 50 euro per 4 certificati professionali. Li recuperi con le prime clienti, una sessione vale gia 30-50 euro.\"\n- \"Non so se riesco\" → \"Il corso e'' online al tuo ritmo, con accesso a vita. Puoi seguirlo anche 20 minuti al giorno.\""
      },
      {
        "id": "wa-script",
        "title": "Script WhatsApp",
        "color": "#f59e0b",
        "content": "REGOLE GENERALI:\n- Rispondi ENTRO 5 minuti dal lead\n- Tono professionale ma caldo, dai del TU\n- Vai per step\n- Follow-up dopo 1 ora se non risponde\n- Ultimo tentativo dopo 24h\n\nSTEP 1 - PRIMO CONTATTO (entro 5 min):\n\"Ciao [Nome]! Sono Marta di Lash Art Academy. Ti scrivo perche hai mostrato interesse per il corso di extension ciglia. Hai un momento?\"\n\nSTEP 2 - SE RISPONDE:\nManda il messaggio WhatsApp principale\n\nSTEP 3 - FISSARE LA CALL:\n\"Ottimo! Posso farti richiamare dalla nostra consulente per rispondere a tutte le domande. Preferisci mattina o pomeriggio?\"\n\nSTEP 4 - FOLLOW-UP (dopo 1h):\n\"Ciao [Nome], ti avevo scritto poco fa per il corso di ciglia. Magari eri impegnata! Quando hai un minuto fammi sapere.\"\n\nSTEP 5 - ULTIMO TENTATIVO (dopo 24h):\n\"Ciao [Nome], ultimo messaggio. I 15 posti al prezzo di 50 euro stanno finendo. Se ti interessa ancora scrivimi, altrimenti buona giornata!\"\n\nRISPOSTE RAPIDE:\n- \"Quanto costa?\" → \"50 euro invece di 299, solo per i primi 15 posti.\"\n- \"Quanti certificati?\" → \"4 certificati professionali, uno per ogni tecnica.\"\n- \"Posso lavorare dopo?\" → \"Assolutamente, puoi offrire il servizio a casa tua o nei centri estetici.\""
      }
    ]
  }'::jsonb
  WHERE slug = 'funnel-lash' AND workspace_id = ws_id;

  UPDATE public.projects SET metadata = '{
    "domain_label": "lightskyblue-tarsier-967570.hostingersite.com",
    "links": [
      {"label": "Sito", "url": "https://lightskyblue-tarsier-967570.hostingersite.com", "type": "site"},
      {"label": "GitHub", "url": "https://github.com/theraflow-samuelehk/fresh-iq-clone", "type": "github"}
    ],
    "credentials": [],
    "scripts": []
  }'::jsonb
  WHERE slug = 'fresh-iq' AND workspace_id = ws_id;

  UPDATE public.projects SET metadata = '{
    "domain_label": "reviewshieldita.lovable.app",
    "links": [
      {"label": "Sito", "url": "https://reviewshieldita.lovable.app", "type": "site"},
      {"label": "Dashboard Lead", "url": "https://reviewshieldita.lovable.app/admin/dashboard", "type": "admin"},
      {"label": "GitHub", "url": "https://github.com/theraflow-samuelehk/reviewshield", "type": "github"}
    ],
    "credentials": [],
    "scripts": []
  }'::jsonb
  WHERE slug = 'reviewshield' AND workspace_id = ws_id;

  UPDATE public.projects SET metadata = '{
    "domain_label": "midnightblue-pony-128540.hostingersite.com",
    "links": [
      {"label": "GitHub", "url": "https://github.com/theraflow-samuelehk/reviewshield-broad", "type": "github"}
    ],
    "credentials": [],
    "scripts": []
  }'::jsonb
  WHERE slug = 'reviewshield-broad' AND workspace_id = ws_id;

  UPDATE public.projects SET metadata = '{
    "domain_label": "darkviolet-bee-231154.hostingersite.com",
    "links": [
      {"label": "Sito", "url": "https://darkviolet-bee-231154.hostingersite.com", "type": "site"},
      {"label": "Super Admin", "url": "https://darkviolet-bee-231154.hostingersite.com/super", "type": "admin"},
      {"label": "GitHub", "url": "https://github.com/theraflow-samuelehk/ReviewBooster", "type": "github"}
    ],
    "credentials": [
      {"label": "Super Admin Email", "value": "samuelehk@gmail.com", "hidden": false},
      {"label": "Password", "value": "123prova", "hidden": true}
    ],
    "scripts": []
  }'::jsonb
  WHERE slug = 'reviewbooster' AND workspace_id = ws_id;

  UPDATE public.projects SET metadata = '{
    "domain_label": "",
    "links": [
      {"label": "GitHub", "url": "https://github.com/theraflow-samuelehk/aromafit-landing", "type": "github"}
    ],
    "credentials": [],
    "scripts": []
  }'::jsonb
  WHERE slug = 'aromafit-landing' AND workspace_id = ws_id;

  UPDATE public.projects SET metadata = '{
    "domain_label": "",
    "links": [
      {"label": "GitHub", "url": "https://github.com/theraflow-samuelehk/glowup-whatsapp", "type": "github"}
    ],
    "credentials": [],
    "scripts": []
  }'::jsonb
  WHERE slug = 'glowup-whatsapp' AND workspace_id = ws_id;

END $$;
