# Google Maps API Setup per Street View

## Problema: "This page didn't load Google Maps correctly"

Questo errore si verifica quando la chiave API non è configurata correttamente per l'uso in WebView.

## Soluzione: Configurare la chiave API

### 1. Vai a Google Cloud Console
- Apri: https://console.cloud.google.com/
- Seleziona il progetto: `top-virtue-479606-k0`

### 2. Abilita le API necessarie
Vai a **APIs & Services → Enabled APIs** e abilita:
- ✅ **Maps JavaScript API** (obbligatorio)
- ✅ **Street View Static API** (opzionale, ma consigliato)

### 3. Configura le restrizioni della chiave API

Vai a **APIs & Services → Credentials** e clicca sulla tua chiave API.

#### Restrizioni applicazioni (Application restrictions)
Scegli una delle seguenti opzioni:

**Opzione A: Nessuna restrizione (per sviluppo)**
- Seleziona: **None**
- ⚠️ Solo per sviluppo/test

**Opzione B: Restrizioni HTTP referrers (consigliato per produzione)**
- Seleziona: **HTTP referrers (web sites)**
- Aggiungi questi referrers:
  ```
  file://*
  about:blank
  http://localhost/*
  https://localhost/*
  ```
- Per produzione, aggiungi anche il dominio della tua app

#### Restrizioni API (API restrictions)
- Seleziona: **Restrict key**
- Seleziona solo:
  - ✅ Maps JavaScript API
  - ✅ Street View Static API (se abilitata)

### 4. Salva le modifiche
- Clicca **Save**
- ⏱️ Le modifiche possono richiedere fino a 5 minuti per essere applicate

## Verifica

Dopo aver configurato la chiave API:

1. Riavvia l'app: `npx expo start -c`
2. Vai a: More → Navigate → Buses
3. Tocca "Street View" su un bus stop
4. Dovresti vedere la vista 360° senza errori

## Troubleshooting

### Errore: "Google Maps API authentication failed"
- Verifica che la chiave API sia corretta nel file `.env.local`
- Verifica che Maps JavaScript API sia abilitata
- Controlla le restrizioni della chiave API

### Errore: "No Street View imagery available"
- La posizione potrebbe non avere immagini Street View disponibili
- Prova con un'altra posizione (es. centro città)

### Errore: "Timeout loading Google Maps API"
- Verifica la connessione internet
- Controlla che la chiave API non abbia restrizioni troppo severe
- Verifica che il progetto Google Cloud abbia fatturazione abilitata (se richiesto)

## Note

- La chiave API fornita: `AIzaSyA4vo-nm7pZqjDOUDwecfzBcQ7alCXS9Qk`
- Per uso in produzione, configura restrizioni appropriate
- Monitora l'uso della chiave API in Google Cloud Console per evitare costi inaspettati

