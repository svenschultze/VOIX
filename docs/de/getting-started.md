# Erste Schritte mit VOIX

## Installation

### Installation über den Chrome Web Store

1. Besuche die [VOIX Chrome-Erweiterung](https://chromewebstore.google.com/detail/voix/agmhpolimgfdfnlgciajhbkdapkophie) im Chrome Web Store
2. Klicke auf „Zu Chrome hinzufügen“
3. Bestätige die Installation, wenn du dazu aufgefordert wirst
4. Das VOIX-Symbol erscheint in deiner Chrome-Werkzeugleiste

### 1. VOIX-Einstellungen öffnen

Klicke auf das VOIX-Symbol in deiner Werkzeugleiste und wähle „Optionen“ – oder klicke mit der rechten Maustaste auf das Symbol und wähle „Optionen“.

### 2. Deinen KI-Anbieter konfigurieren

VOIX unterstützt mehrere KI-Anbieter. Wähle einen aus und konfiguriere ihn:

#### OpenAI

* **Basis-URL**: `https://api.openai.com/v1`
* **API-Schlüssel**: Dein OpenAI-API-Schlüssel (beginnt mit `sk-`)
* **Modell**: `gpt-4` oder `gpt-3.5-turbo`

#### OpenAI-kompatibel (z. B. Azure OpenAI)

* **Basis-URL**: Deine OpenAI-kompatible Endpunkt-URL (z. B. `https://api.beispiel.org/v1`)
* **API-Schlüssel**: Dein API-Schlüssel
* **Modell**: Dein Modellname

#### Lokal (Ollama)

* **Basis-URL**: `http://localhost:11434/v1`
* **API-Schlüssel**: Nicht erforderlich (leer lassen)
* **Modell**: `qwen3`, `mistral` oder ein lokal installiertes Modell

### 3. Spracheingabe konfigurieren (optional)

VOIX verwendet die Whisper API von OpenAI für Sprachtranskription:

* **Sprache**: Wähle deine bevorzugte Sprache oder „Automatisch erkennen“
* **Modell**: `whisper-1` (Standard)
* **Basis-URL**: Leer lassen, um dieselbe URL wie dein KI-Anbieter zu verwenden – oder eine andere kompatible URL angeben
* **API-Schlüssel**: Dein API-Schlüssel (wenn ein separater Endpunkt verwendet wird)

### 4. Konfiguration testen

1. Klicke auf „Verbindung testen“, um deine API-Einstellungen zu überprüfen
2. Bei erfolgreicher Konfiguration erscheint eine Bestätigungsmeldung
3. Speichere deine Einstellungen

## VOIX verwenden

### Chatfenster öffnen

* Klicke auf das VOIX-Symbol in der Werkzeugleiste
* Das Chat-Interface erscheint am rechten Rand deines Browsers

### Textbasierter Chat

1. Gib deine Nachricht im Eingabefeld ein
2. Drücke Enter oder klicke auf den Senden-Button
3. VOIX antwortet basierend auf dem aktuellen Seitenkontext

### Spracheingabe

1. Klicke auf das Mikrofon-Symbol 🎤
2. Sprich deine Nachricht
3. Klicke erneut auf das Mikrofon, um die Aufnahme zu beenden
4. Deine Sprache wird transkribiert

### Live-Sprachmodus

1. Klicke auf das Live-Symbol 🎯
2. VOIX hört kontinuierlich zu und antwortet
3. Klicke erneut, um den Live-Modus zu deaktivieren

### Denkmodus

1. Klicke auf das Glühbirnen-Symbol 💡
2. Wenn unterstützt, denkt das KI-Modell länger nach, bevor es antwortet
3. Nützlich für komplexe Aufgaben

## Interaktion mit VOIX-kompatiblen Webseiten

VOIX erkennt automatisch kompatible Elemente auf Webseiten:

### Tools

Wenn eine Website `<tool>`-Elemente enthält, kann VOIX:

* Aktionen auf der Seite ausführen
* Formulare ausfüllen
* Buttons anklicken
* Daten extrahieren

### Kontext

VOIX liest `<context>`-Elemente, um zu verstehen:

* Den aktuellen Seitenstatus
* Benutzerinformationen
* Anwendungsdaten

> \[!INFO]
> **Diese Dokumentation ist selbst ein Beispiel für eine VOIX-kompatible Seite**, mit `<tool>`-Elementen zur Navigation per Chat und `<context>`-Elementen für vollständige API-Dokumentation. Probiere es aus mit Fragen wie:
>
> ```plaintext
> „Wie benutze ich Tools in VOIX?“  
> „Navigiere zur Kontext-Dokumentation“  
> „Wie integriere ich VOIX mit Svelte?“  
> ```

## Nächste Schritte

* Lerne mehr über die [Grundkonzepte](./core-concepts.md), um zu verstehen, wie VOIX funktioniert
* Sieh dir [Demos](./demo-weather.md) an, um VOIX in Aktion zu erleben

<!--@include: @/de/voix_context.md -->