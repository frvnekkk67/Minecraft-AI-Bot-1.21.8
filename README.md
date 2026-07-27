# Minecraft AI Bot 1.21.8

Baza bota Minecraft na **Mineflayer** przygotowana pod **Paper 1.21.8** i uruchamianie na **Railway**.

## Funkcje v1.0
- logowanie do serwera
- reconnect po rozłączeniu
- anti-AFK
- czytanie czatu
- reakcja na imię bota
- odpowiedzi do właściciela `FranciQ`
- `/msg FranciQ ...` przy problemach
- prosta pamięć w `data/memory.json`
- start pod Railway przez `npm start`

## Uruchomienie lokalnie
```bash
npm install
cp .env.example .env
npm start
```

## Zmienne środowiskowe
- `MC_HOST` — adres serwera
- `MC_PORT` — port serwera
- `MC_VERSION` — wersja Minecraft, np. `1.21.8`
- `BOT_USERNAME` — nick bota
- `OWNER_USERNAME` — Twój nick, domyślnie `FranciQ`
- `MC_PASSWORD` — hasło do `/login` lub `/register`
- `AUTO_LOGIN` — `true` albo `false`
- `AUTO_REGISTER` — `true` albo `false`
- `CHAT_PREFIX` — prefix komend, domyślnie `!`

## Railway
1. Wgraj projekt do repo albo wrzuć ZIP.
2. Dodaj zmienne środowiskowe.
3. Ustaw start command na `npm start`.
4. Włącz deploy.

## Przykładowe komendy
- `!status`
- `!say cześć`
- `!help`
- `!stop`

## Następne wersje
- kopanie
- crafting
- jedzenie i ekwipunek
- walka
- farmy
- skrzynki
- budowanie
