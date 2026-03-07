# Group Project SOTS

Projekt aplikacji do wyszukiwania informacji o domenach z użyciem RDAP, Prisma i MySQL.

## Funkcjonalności
- pobieranie danych domeny z API RDAP
- logowanie odpowiedzi w konsoli
- zapis danych domeny do bazy MySQL
- zapis nameserverów do bazy
- zapis historii zapytań do tabeli lookuphistory

## Technologie
- Node.js
- Axios
- Prisma
- MySQL

## Uruchomienie projektu
1. Uzupełnij plik `.env`
2. Uruchom migracje:
   `npx prisma migrate dev --name init`
3. Uruchom moduł RDAP:
   `node rdapService.js`

## Struktura bazy
- `domain`
- `nameserver`
- `lookuphistory`