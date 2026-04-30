# ReviewBoost

SaaS multi-tenant per la gestione delle recensioni Google. La receptionist invia ai clienti del giorno un sondaggio via WhatsApp; le 5 stelle vanno su Google in cambio di un regalo, le valutazioni basse vengono raccolte come feedback interno per il titolare.

## Stack

- PHP 8 + PDO/MySQL (Hostinger shared hosting)
- HTML + Tailwind via CDN
- Sessioni PHP per autenticazione, password hashate con bcrypt
- Multi-tenant via colonna `tenant_id`

## Deploy

Push su `main` → Hostinger fa pull automatico via webhook. URL produzione: https://darkviolet-bee-231154.hostingersite.com/

## File di configurazione

Il file `includes/config.local.php` NON è nel repo (contiene credenziali DB). Sul server vive in `/home/u749757264/config-reviewbooster.php` e va linkato dentro `includes/`.
