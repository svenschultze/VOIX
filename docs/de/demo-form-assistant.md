---
layout: doc
---

<script setup>
import FormAssistantDemo from './components/FormAssistantDemo.vue'
</script>

# Formularassistent-Demo

Diese Demo zeigt, wie VOIX Benutzern beim Ausfüllen von Formularen helfen kann. Die KI kann Formularfelder verstehen und sie basierend auf natürlichsprachlichen Anweisungen ausfüllen.

## Wie es funktioniert

Das Formular bietet Werkzeuge zum Ausfüllen verschiedener Abschnitte und Kontext über verfügbare Felder und Validierungsregeln.

## Code

```html
<!-- Werkzeuge zum Ausfüllen von Formularen -->
<tool name="fill_personal_info" description="Persönliche Informationsfelder ausfüllen">
  <prop name="firstName" type="string"/>
  <prop name="lastName" type="string"/>
  <prop name="email" type="string" description="E-Mail-Adresse"/>
  <prop name="phone" type="string" description="Telefonnummer"/>
</tool>

<tool name="fill_address" description="Adressinformationen ausfüllen">
  <prop name="street" type="string"/>
  <prop name="city" type="string"/>
  <prop name="state" type="string"/>
  <prop name="zipCode" type="string" description="5-stellige Postleitzahl"/>
</tool>

<tool name="select_preferences" description="Benutzereinstellungen festlegen">
  <prop name="newsletter" type="boolean" description="Newsletter abonnieren"/>
  <prop name="notifications" type="string" description="email, sms oder none"/>
  <prop name="language" type="string" description="en, es, fr oder de"/>
</tool>

<tool name="submit_form" description="Das ausgefüllte Formular absenden">
</tool>

<tool name="clear_form" description="Alle Formularfelder leeren">
</tool>

<!-- Formularkontext -->
<context name="form_status" id="form-context">
  Formularstatus: Leer
  Erforderliche Felder: firstName, lastName, email
  Ausgefüllte Felder: keine
  Validierungsfehler: keine
</context>

<!-- Formular-UI -->
<form id="demo-form">
  <fieldset>
    <legend>Persönliche Informationen</legend>
    <div class="form-group">
      <label>Vorname *</label>
      <input type="text" name="firstName" required>
    </div>
    <div class="form-group">
      <label>Nachname *</label>
      <input type="text" name="lastName" required>
    </div>
    <div class="form-group">
      <label>E-Mail *</label>
      <input type="email" name="email" required>
    </div>
    <div class="form-group">
      <label>Telefon</label>
      <input type="tel" name="phone">
    </div>
  </fieldset>
  
  <fieldset>
    <legend>Adresse</legend>
    <div class="form-group">
      <label>Straße</label>
      <input type="text" name="street">
    </div>
    <div class="form-group">
      <label>Stadt</label>
      <input type="text" name="city">
    </div>
    <div class="form-group">
      <label>Bundesland</label>
      <input type="text" name="state">
    </div>
    <div class="form-group">
      <label>Postleitzahl</label>
      <input type="text" name="zipCode" pattern="[0-9]{5}">
    </div>
  </fieldset>
  
  <fieldset>
    <legend>Einstellungen</legend>
    <div class="form-group">
      <label>
        <input type="checkbox" name="newsletter">
        Newsletter abonnieren
      </label>
    </div>
    <div class="form-group">
      <label>Benachrichtigungen</label>
      <select name="notifications">
        <option value="none">Keine</option>
        <option value="email">E-Mail</option>
        <option value="sms">SMS</option>
      </select>
    </div>
    <div class="form-group">
      <label>Sprache</label>
      <select name="language">
        <option value="en">Englisch</option>
        <option value="es">Spanisch</option>
        <option value="fr">Französisch</option>
        <option value="de">Deutsch</option>
      </select>
    </div>
  </fieldset>
  
  <div id="form-message"></div>
</form>

<script>
// Formular-Handler
const handlers = {
  fill_personal_info: (data) => {
    const form = document.getElementById('demo-form');
    if (data.firstName) form.firstName.value = data.firstName;
    if (data.lastName) form.lastName.value = data.lastName;
    if (data.email) form.email.value = data.email;
    if (data.phone) form.phone.value = data.phone;
    updateFormContext();
  },
  
  fill_address: (data) => {
    const form = document.getElementById('demo-form');
    if (data.street) form.street.value = data.street;
    if (data.city) form.city.value = data.city;
    if (data.state) form.state.value = data.state;
    if (data.zipCode) form.zipCode.value = data.zipCode;
    updateFormContext();
  },
  
  select_preferences: (data) => {
    const form = document.getElementById('demo-form');
    if (data.newsletter !== undefined) {
      form.newsletter.checked = data.newsletter;
    }
    if (data.notifications) {
      form.notifications.value = data.notifications;
    }
    if (data.language) {
      form.language.value = data.language;
    }
    updateFormContext();
  },
  
  submit_form: () => {
    const form = document.getElementById('demo-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Erforderliche Felder prüfen
    if (!data.firstName || !data.lastName || !data.email) {
      showMessage('Bitte füllen Sie alle erforderlichen Felder aus', 'error');
      return;
    }
    
    // E-Mail validieren
    if (!data.email.includes('@')) {
      showMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein', 'error');
      return;
    }
    
    showMessage('Formular erfolgreich übermittelt!', 'success');
  },
  
  clear_form: () => {
    document.getElementById('demo-form').reset();
    updateFormContext();
    showMessage('Formular geleert', 'info');
  }
};

// Event-Listener anhängen
document.querySelectorAll('tool[name]').forEach(tool => {
  const name = tool.getAttribute('name');
  tool.addEventListener('call', (e) => {
    handlers[name]?.(e.detail);
  });
});

// Formularkontext aktualisieren
function updateFormContext() {
  const form = document.getElementById('demo-form');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  const filled = Object.entries(data).filter(([k, v]) => v).map(([k]) => k);
  const required = ['firstName', 'lastName', 'email'];
  const missing = required.filter(field => !data[field]);
  
  let status = 'Leer';
  if (filled.length > 0 && missing.length > 0) status = 'Teilweise ausgefüllt';
  else if (missing.length === 0) status = 'Bereit zum Senden';
  else if (filled.length > 0) status = 'In Bearbeitung';
  
  document.getElementById('form-context').textContent = `
Formularstatus: ${status}
Erforderliche Felder: ${required.join(', ')}
Ausgefüllte Felder: ${filled.length ? filled.join(', ') : 'keine'}
Validierungsfehler: ${missing.length ? `Fehlend: ${missing.join(', ')}` : 'keine'}

Verfügbare Benachrichtigungsoptionen: keine, E-Mail, SMS
Verfügbare Sprachen: en (Englisch), es (Spanisch), fr (Französisch), de (Deutsch)
  `;
}

// Nachrichten anzeigen
function showMessage(text, type) {
  const msg = document.getElementById('form-message');
  msg.textContent = text;
  msg.className = `message ${type}`;
  setTimeout(() => {
    msg.textContent = '';
    msg.className = '';
  }, 3000);
}

// Initiale Kontextaktualisierung
updateFormContext();
</script>

<style>
form {
  max-width: 500px;
  margin: 1rem 0;
}

fieldset {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

legend {
  font-weight: bold;
  padding: 0 0.5rem;
}

.form-group {
  margin: 0.75rem 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input[type="checkbox"] {
  margin-right: 0.5rem;
}

.message {
  margin: 1rem 0;
  padding: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}
</style>
```

## Probieren Sie es aus

<FormAssistantDemo />

## Beispielinteraktionen

Versuchen Sie dies mit VOIX:

- "Fülle John Doe mit der E-Mail-Adresse john@example.com aus"
- "Setze die Telefonnummer auf 555-1234"
- "Fülle die Adresse als 123 Main St, San Francisco, CA 94105 aus"
- "Newsletter abonnieren und Benachrichtigungen auf E-Mail setzen"
- "Sprache auf Spanisch ändern"
- "Formular absenden"

Die KI liest den Formularkontext, um erforderliche Felder und Validierungsregeln zu verstehen.