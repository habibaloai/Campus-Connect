# Fix: Google Maps API Authentication Failed

## Errore
```
Street view error. Google maps API authentication failed. Please check your API key.
Error loading street view. google maps api authentication failed please check your api key.
```

## Significato
La chiave API non viene riconosciuta da Google Maps. Questo può avere diverse cause.

## Soluzione Passo-Passo

### 1. Verifica la Chiave API in Google Cloud Console

1. Vai a: https://console.cloud.google.com/
2. Seleziona il progetto: `top-virtue-479606-k0` (o il tuo progetto)
3. Vai a: **APIs & Services → Credentials**
4. Cerca la chiave: `AIzaSyCtI_PNpHLV7HRT1hI0lVpgMuA1B6kPImk`
5. Verifica che sia **attiva** (non disabilitata)

### 2. Abilita le API Necessarie

1. Vai a: **APIs & Services → Enabled APIs** (o Library)
2. Cerca e **ABILITA**:
   - ✅ **Maps JavaScript API** (OBBLIGATORIO)
   - ✅ **Street View Static API** (opzionale, ma consigliato)
   - ✅ **Geocoding API** (per geocoding dell'indirizzo)

### 3. Configura le Restrizioni della Chiave API

1. Vai a: **APIs & Services → Credentials**
2. Clicca sulla tua chiave API
3. In **"Application restrictions"**:
   - Per TEST: Seleziona **"None"** (nessuna restrizione)
   - Per PRODUZIONE: Seleziona **"HTTP referrers (web sites)"**
     - Aggiungi questi referrers:
       ```
       file://*
       about:blank
       http://localhost/*
       https://localhost/*
       ```

4. In **"API restrictions"**:
   - Seleziona **"Restrict key"**
   - Seleziona solo:
     - ✅ Maps JavaScript API
     - ✅ Street View Static API
     - ✅ Geocoding API

5. Clicca **"Save"**
6. ⏱️ Attendi 2-5 minuti per la propagazione

### 4. Verifica la Fatturazione

1. Vai a: **Billing** nella console
2. Verifica che ci sia un account di fatturazione attivo
3. Google Maps richiede un account di fatturazione (ma ha $200 di credito gratuito al mese)

### 5. Testa la Chiave API

Puoi testare la chiave direttamente nel browser:

```
https://maps.googleapis.com/maps/api/js?key=AIzaSyCtI_PNpHLV7HRT1hI0lVpgMuA1B6kPImk
```

Se vedi codice JavaScript (non errore), la chiave funziona.

### 6. Riavvia Expo con Cache Pulita

Dopo aver configurato tutto:

```powershell
npx expo start -c
```

Il flag `-c` pulisce la cache e ricarica le variabili d'ambiente.

## Checklist

- [ ] Chiave API presente in Google Cloud Console
- [ ] Chiave API attiva (non disabilitata)
- [ ] Maps JavaScript API abilitata
- [ ] Street View Static API abilitata
- [ ] Geocoding API abilitata (per geocoding)
- [ ] Restrizioni configurate correttamente
- [ ] Account di fatturazione attivo
- [ ] Expo riavviato con `-c` flag

## Verifica Configurazione Locale

La chiave nel file `.env.local` è:
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCtI_PNpHLV7HRT1hI0lVpgMuA1B6kPImk
```

## Debug

Se l'errore persiste, controlla:

1. **Console del browser/Expo**: Cerca errori specifici
2. **Network tab**: Verifica che le richieste a Google Maps partano correttamente
3. **Google Cloud Console → APIs & Services → Dashboard**: Verifica che le chiamate API vengano registrate

## Supporto

Se il problema persiste:
1. Verifica che la chiave API sia per il progetto corretto
2. Controlla i log in Google Cloud Console per errori specifici
3. Prova a creare una nuova chiave API di test

