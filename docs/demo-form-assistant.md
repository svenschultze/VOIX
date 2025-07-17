---
layout: doc
---

<script setup>
import FormAssistantDemo from './components/FormAssistantDemo.vue'
</script>

# Form Assistant Demo

This demo shows how VOIX can help users fill out forms. The AI can understand form fields and fill them based on natural language instructions.

## How It Works

The form provides tools for filling different sections and context about available fields and validation rules.

## Code

```html
<!-- Form filling tools -->
<tool name="fill_personal_info" description="Fill personal information fields">
  <prop name="firstName" type="string"></prop>
  <prop name="lastName" type="string"></prop>
  <prop name="email" type="string" description="Email address"></prop>
  <prop name="phone" type="string" description="Phone number"></prop>
</tool>

<tool name="fill_address" description="Fill address information">
  <prop name="street" type="string"></prop>
  <prop name="city" type="string"></prop>
  <prop name="state" type="string"></prop>
  <prop name="zipCode" type="string" description="5-digit ZIP code"></prop>
</tool>

<tool name="select_preferences" description="Set user preferences">
  <prop name="newsletter" type="boolean" description="Subscribe to newsletter"></prop>
  <prop name="notifications" type="string" description="email, sms, or none"></prop>
  <prop name="language" type="string" description="en, es, fr, or de"></prop>
</tool>

<tool name="submit_form" description="Submit the completed form">
</tool>

<tool name="clear_form" description="Clear all form fields">
</tool>

<!-- Form context -->
<context name="form_status" id="form-context">
  Form status: Empty
  Required fields: firstName, lastName, email
  Filled fields: none
  Validation errors: none
</context>

<!-- Form UI -->
<form id="demo-form">
  <fieldset>
    <legend>Personal Information</legend>
    <div class="form-group">
      <label>First Name *</label>
      <input type="text" name="firstName" required>
    </div>
    <div class="form-group">
      <label>Last Name *</label>
      <input type="text" name="lastName" required>
    </div>
    <div class="form-group">
      <label>Email *</label>
      <input type="email" name="email" required>
    </div>
    <div class="form-group">
      <label>Phone</label>
      <input type="tel" name="phone">
    </div>
  </fieldset>
  
  <fieldset>
    <legend>Address</legend>
    <div class="form-group">
      <label>Street</label>
      <input type="text" name="street">
    </div>
    <div class="form-group">
      <label>City</label>
      <input type="text" name="city">
    </div>
    <div class="form-group">
      <label>State</label>
      <input type="text" name="state">
    </div>
    <div class="form-group">
      <label>ZIP Code</label>
      <input type="text" name="zipCode" pattern="[0-9]{5}">
    </div>
  </fieldset>
  
  <fieldset>
    <legend>Preferences</legend>
    <div class="form-group">
      <label>
        <input type="checkbox" name="newsletter">
        Subscribe to newsletter
      </label>
    </div>
    <div class="form-group">
      <label>Notifications</label>
      <select name="notifications">
        <option value="none">None</option>
        <option value="email">Email</option>
        <option value="sms">SMS</option>
      </select>
    </div>
    <div class="form-group">
      <label>Language</label>
      <select name="language">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </select>
    </div>
  </fieldset>
  
  <div id="form-message"></div>
</form>

<script>
// Form handlers
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
    
    // Check required fields
    if (!data.firstName || !data.lastName || !data.email) {
      showMessage('Please fill all required fields', 'error');
      return;
    }
    
    // Validate email
    if (!data.email.includes('@')) {
      showMessage('Please enter a valid email', 'error');
      return;
    }
    
    showMessage('Form submitted successfully!', 'success');
  },
  
  clear_form: () => {
    document.getElementById('demo-form').reset();
    updateFormContext();
    showMessage('Form cleared', 'info');
  }
};

// Attach event listeners
document.querySelectorAll('tool[name]').forEach(tool => {
  const name = tool.getAttribute('name');
  tool.addEventListener('call', (e) => {
    handlers[name]?.(e.detail);
  });
});

// Update form context
function updateFormContext() {
  const form = document.getElementById('demo-form');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  const filled = Object.entries(data).filter(([k, v]) => v).map(([k]) => k);
  const required = ['firstName', 'lastName', 'email'];
  const missing = required.filter(field => !data[field]);
  
  let status = 'Empty';
  if (filled.length > 0 && missing.length > 0) status = 'Partially filled';
  else if (missing.length === 0) status = 'Ready to submit';
  else if (filled.length > 0) status = 'In progress';
  
  document.getElementById('form-context').textContent = `
Form status: ${status}
Required fields: ${required.join(', ')}
Filled fields: ${filled.length ? filled.join(', ') : 'none'}
Validation errors: ${missing.length ? `Missing: ${missing.join(', ')}` : 'none'}

Available notification options: none, email, sms
Available languages: en (English), es (Spanish), fr (French), de (German)
  `;
}

// Show messages
function showMessage(text, type) {
  const msg = document.getElementById('form-message');
  msg.textContent = text;
  msg.className = `message ${type}`;
  setTimeout(() => {
    msg.textContent = '';
    msg.className = '';
  }, 3000);
}

// Initial context update
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

## Try It

<FormAssistantDemo />

## Example Interactions

Try these with VOIX:

- "Fill in John Doe with email john@example.com"
- "Set the phone number to 555-1234"
- "Fill the address as 123 Main St, San Francisco, CA 94105"
- "Subscribe to newsletter and set notifications to email"
- "Change language to Spanish"
- "Submit the form"

The AI reads the form context to understand required fields and validation rules.
