# Erste Schritte mit VOIX

## Installation

### Installation aus dem Chrome Web Store

1. Besuchen Sie die [VOIX Chrome-Erweiterung](https://chromewebstore.google.com/detail/voix/agmhpolimgfdfnlgciajhbkdapkophie) im Chrome Web Store
2. Klicken Sie auf "Zu Chrome hinzufügen"
3. Bestätigen Sie die Installation, wenn Sie dazu aufgefordert werden
4. Das VOIX-Symbol wird in Ihrer Chrome-Symbolleiste angezeigt

### Nach der Installation

Nach der Installation wird VOIX automatisch:
- Ein Seitenpanel hinzufügen, das auf jeder Website geöffnet werden kann
- VOIX-kompatible Elemente auf Webseiten erkennen
- Spracheingabe und KI-Chat-Funktionalität aktivieren

## Ersteinrichtung

### 1. VOIX-Einstellungen öffnen

Klicken Sie auf das VOIX-Erweiterungssymbol in Ihrer Symbolleiste und wählen Sie "Optionen" oder klicken Sie mit der rechten Maustaste auf das Erweiterungssymbol und wählen Sie "Optionen".

### 2. Konfigurieren Sie Ihren KI-Anbieter

VOIX unterstützt mehrere KI-Anbieter. Wählen Sie einen aus und konfigurieren Sie ihn:

#### OpenAI
- **Basis-URL**: `https://api.openai.com/v1`
- **API-Schlüssel**: Ihr OpenAI-API-Schlüssel (beginnt mit `sk-`)
- **Modell**: `gpt-4` oder `gpt-3.5-turbo`
- **Maximale Token**: 1000 (bei Bedarf anpassen)
- **Temperatur**: 0.7 (ausgewogene Kreativität)

#### Azure OpenAI
- **Basis-URL**: `https://IHR-RESSOURCE.openai.azure.com/openai/deployments/IHR-DEPLOYMENT`
- **API-Schlüssel**: Ihr Azure OpenAI-Schlüssel
- **Modell**: Ihr Deployment-Name
- **Maximale Token**: 1000
- **Temperatur**: 0.7

#### Anthropic (Claude)
- **Basis-URL**: `https://api.anthropic.com/v1`
- **API-Schlüssel**: Ihr Anthropic-API-Schlüssel
- **Modell**: `claude-3-opus` oder `claude-3-sonnet`
- **Maximale Token**: 1000
- **Temperatur**: 0.7

#### Lokal (Ollama)
- **Basis-URL**: `http://localhost:11434/v1`
- **API-Schlüssel**: Nicht erforderlich (leer lassen)
- **Modell**: `llama3`, `mistral` oder Ihr installiertes Modell
- **Maximale Token**: 1000
- **Temperatur**: 0.7

### 3. Spracheingabe konfigurieren (Optional)

VOIX verwendet die Whisper-API von OpenAI für die Sprachtranskription:

- **Sprache**: Wählen Sie Ihre bevorzugte Sprache oder verwenden Sie "Automatische Erkennung"
- **Modell**: `whisper-1` (Standard)
- **Antwortformat**: `json` (empfohlen)
- **Temperatur**: 0 (höchste Genauigkeit)
- **Benutzerdefinierter Prompt**: Optionaler Kontext für eine bessere Transkription

### 4. Testen Sie Ihre Konfiguration

1. Klicken Sie auf "Verbindung testen", um Ihre API-Einstellungen zu überprüfen
2. Sie sollten eine Erfolgsmeldung sehen, wenn alles korrekt konfiguriert ist
3. Speichern Sie Ihre Einstellungen

## Verwendung von VOIX

### Öffnen des Chat-Panels

Es gibt zwei Möglichkeiten, VOIX zu öffnen:

1. **Seitenpanel** (Empfohlen):
   - Klicken Sie auf das VOIX-Symbol in Ihrer Symbolleiste
   - Wählen Sie "Seitenpanel öffnen"
   - Die Chat-Oberfläche wird auf der rechten Seite Ihres Browsers angezeigt

2. **Schwebender Chat**:
   - Einige Websites zeigen möglicherweise eine schwebende VOIX-Schaltfläche an
   - Klicken Sie darauf, um die Chat-Oberfläche zu öffnen

### Grundlegender Chat

1. Geben Sie Ihre Nachricht in das Eingabefeld ein
2. Drücken Sie die Eingabetaste oder klicken Sie auf die Senden-Schaltfläche
3. VOIX wird basierend auf dem aktuellen Seitenkontext antworten

### Spracheingabe

1. Klicken Sie auf die Mikrofon-Schaltfläche 🎤
2. Sprechen Sie Ihre Nachricht
3. Klicken Sie erneut auf das Mikrofon, um die Aufnahme zu beenden
4. Ihre Sprache wird transkribiert und gesendet

### Live-Sprachmodus

1. Klicken Sie auf die Live-Sprach-Schaltfläche 🎯
2. VOIX wird kontinuierlich zuhören und antworten
3. Klicken Sie erneut, um den Live-Modus zu deaktivieren

### Denkmodus

1. Klicken Sie auf die Glühbirnen-Schaltfläche 💡
2. VOIX zeigt seinen Denkprozess an
3. Nützlich für komplexe Aufgaben oder zur Fehlerbehebung

## Interaktion mit VOIX-kompatiblen Websites

VOIX erkennt automatisch kompatible Elemente auf Websites:

### Werkzeuge
Wenn eine Website `<tool>`-Elemente hat, kann VOIX:
- Aktionen auf der Seite ausführen
- Formulare ausfüllen
- Schaltflächen anklicken
- Daten extrahieren

### Kontext
VOIX liest `<context>`-Elemente, um zu verstehen:
- Aktueller Seitenzustand
- Benutzerinformationen
- Anwendungsdaten

### Ressourcen
VOIX kann auf `<resource>`-Elemente zugreifen für:
- Zusätzliche Dokumentation
- API-Referenzen
- Hilfeinhalte

## Fehlerbehebung

### Verbindungsprobleme

Wenn Sie "Verbindung zur API fehlgeschlagen" sehen:
1. Überprüfen Sie, ob Ihr API-Schlüssel korrekt ist
2. Überprüfen Sie, ob die Basis-URL mit Ihrem Anbieter übereinstimmt
3. Stellen Sie sicher, dass Sie eine aktive Internetverbindung haben
4. Überprüfen Sie, ob Ihr API-Schlüssel über ausreichendes Guthaben verfügt

### Spracheingabe funktioniert nicht

1. Stellen Sie sicher, dass die Mikrofonberechtigungen erteilt wurden
2. Überprüfen Sie die Mikrofoneinstellungen Ihres Browsers
3. Überprüfen Sie, ob die Whisper-API-Einstellungen konfiguriert sind
4. Testen Sie mit einem anderen Browser-Tab

### VOIX erkennt keine Werkzeuge

1. Aktualisieren Sie die Seite
2. Überprüfen Sie, ob die Website ordnungsgemäße `<tool>`-Elemente hat
3. Öffnen Sie die Entwicklerkonsole auf Fehler
4. Stellen Sie sicher, dass JavaScript aktiviert ist

## Datenschutz & Sicherheit

- API-Schlüssel werden lokal in Ihrem Browser gespeichert
- Sprachaufnahmen werden an Ihre konfigurierte Whisper-API gesendet
- Chat-Nachrichten werden an Ihren konfigurierten KI-Anbieter gesendet
- VOIX sammelt oder speichert keine persönlichen Daten
- Auf den Seiteninhalt wird nur zugegriffen, wenn Sie mit VOIX interagieren

## Nächste Schritte

- Erfahren Sie mehr über [Kernkonzepte](./core-concepts.md), um zu verstehen, wie VOIX funktioniert
- Erkunden Sie [Werkzeuge](./tools.md), um VOIX-kompatible Websites zu erstellen

<!--@include: @/voix_context.md -->