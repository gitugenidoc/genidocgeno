# GeniDoc Hayat - Android et iOS

La version mobile utilise Capacitor. Elle embarque les memes pages HTML/CSS/JS que le web afin de garder le meme design et les memes parcours.

## Structure

- `mobile-www/` : copie mobile generee des fichiers web publics
- `android/` : projet Android natif
- `ios/` : projet iOS natif
- `capacitor.config.json` : configuration Capacitor
- `mobile-config.js` : URL API utilisee par l'app embarquee

## API production

Modifier `mobile-config.js` avant publication :

```js
window.GENIDOC_CONFIG = {
  apiBaseUrl: "https://app.genidoc.example/api",
};
```

Le backend doit autoriser les origines mobiles dans `CORS_ORIGIN` et activer :

```env
MOBILE_APP_ENABLED=true
```

En production, les cookies de session mobile passent en `SameSite=None; Secure`.

## Synchroniser

```bash
npm run mobile:sync
```

Cette commande reconstruit `mobile-www` puis synchronise Android/iOS.

## Android

Ouvrir dans Android Studio :

```bash
npm run mobile:android
```

Build debug en ligne de commande :

```bash
cd android
gradlew.bat assembleDebug
```

APK attendu :

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## iOS

Le dossier `ios/` est pret, mais la compilation iOS doit etre faite sur macOS avec Xcode :

```bash
npm run mobile:ios
```

Dans Xcode, configurer l'equipe Apple Developer, le bundle id `ma.genidoc.hayat`, puis archiver pour TestFlight/App Store.

## Apres modification web

Chaque changement HTML/CSS/JS doit etre resynchronise :

```bash
npm run mobile:sync
```
