---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "VOIX"
  image: ./logo.png
  text: "Dokumentation"
  tagline: VOIX ist ein leichtgewichtiges Browser-Framework, mit dem Sie KI-Assistenten zu jeder Website hinzufügen können, nur mit HTML. Sie definieren Werkzeuge mit <code>&lt;tool&gt;</code>-Tags und stellen den Zustand mit <code>&lt;context&gt;</code> bereit, und die VOIX Chrome-Erweiterung wandelt diese in strukturierte API-Aufrufe um, die der Assistent verwenden kann – ohne Ihr Layout, Ihre Stile oder Ihren Datenschutz zu beeinträchtigen.
  actions:
    - theme: brand
      text: Loslegen
      link: /de/getting-started
    - theme: alt
      text: Vision
      link: /de/vision
    - theme: alt
      text: Entwicklerhandbuch
      link: /de/core-concepts

features:
  - icon: 💡
    title: Vereinfachte KI-Integration
    details: Stellen Sie die Funktionalität Ihrer Website für KI-Assistenten mit einfachen HTML-Tags bereit. Keine Backend-Änderungen, keine komplexen SDKs und keine API-Wartung.
    link: /de/getting-started
  - icon: 🔒
    title: Datenschutz durch Design
    details: Benutzer verbinden ihre eigenen KI-Modelle. Alle Datenverarbeitung und der Gesprächsverlauf bleiben privat im Browser des Benutzers und berühren niemals die Server der Website.
    link: /de/vision
  - icon: 👑
    title: Benutzersouveränität
    details: Benutzer haben die vollständige Kontrolle. Sie wählen ihren KI-Anbieter (OpenAI, Anthropic, lokale Modelle), ihre Benutzeroberfläche und wie sie mit Ihrer Website interagieren.
    link: /de/vision
  - icon: 🌐
    title: Offen & Dezentralisiert
    details: VOIX ist ein vorgeschlagener offener Standard, keine Plattform. Dies fördert ein wettbewerbsfähiges Ökosystem von Benutzeragenten und verhindert eine Herstellerbindung für Entwickler und Benutzer.
    link: /de/vision
---


<!--@include: @/de/voix_context.md -->