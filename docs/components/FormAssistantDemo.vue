<template>
  <div class="demo-container">
    <!-- Form filling tools -->
    <tool name="fill_personal_info" description="Fill personal information fields">
      <prop name="firstName" type="string"/>
      <prop name="lastName" type="string"/>
      <prop name="email" type="string" description="Email address"/>
      <prop name="phone" type="string" description="Phone number"/>
    </tool>

    <tool name="fill_address" description="Fill address information">
      <prop name="street" type="string"/>
      <prop name="city" type="string"/>
      <prop name="state" type="string"/>
      <prop name="zipCode" type="string" description="5-digit ZIP code"/>
    </tool>

    <tool name="select_preferences" description="Set user preferences">
      <prop name="newsletter" type="boolean" description="Subscribe to newsletter"/>
      <prop name="notifications" type="string" description="email, sms, or none"/>
      <prop name="language" type="string" description="en, es, fr, or de"/>
    </tool>

    <tool name="submit_form" description="Submit the completed form">
    </tool>

    <tool name="clear_form" description="Clear all form fields">
    </tool>

    <!-- Form context -->
    <context name="form_status" id="demo-form-context">
      {{ contextText }}
    </context>

    <!-- Form UI -->
    <form id="demo-form-ui" @submit.prevent>
      <fieldset>
        <legend>Personal Information</legend>
        <div class="form-group">
          <label>First Name *</label>
          <input type="text" v-model="formData.firstName" required>
        </div>
        <div class="form-group">
          <label>Last Name *</label>
          <input type="text" v-model="formData.lastName" required>
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" v-model="formData.email" required>
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="tel" v-model="formData.phone">
        </div>
      </fieldset>
      
      <fieldset>
        <legend>Address</legend>
        <div class="form-group">
          <label>Street</label>
          <input type="text" v-model="formData.street">
        </div>
        <div class="form-group">
          <label>City</label>
          <input type="text" v-model="formData.city">
        </div>
        <div class="form-group">
          <label>State</label>
          <input type="text" v-model="formData.state">
        </div>
        <div class="form-group">
          <label>ZIP Code</label>
          <input type="text" v-model="formData.zipCode" pattern="[0-9]{5}">
        </div>
      </fieldset>
      
      <fieldset>
        <legend>Preferences</legend>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="formData.newsletter">
            Subscribe to newsletter
          </label>
        </div>
        <div class="form-group">
          <label>Notifications</label>
          <select v-model="formData.notifications">
            <option value="none">None</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        <div class="form-group">
          <label>Language</label>
          <select v-model="formData.language">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
      </fieldset>
      
      <div v-if="message.text" :class="['message', message.type]">
        {{ message.text }}
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  newsletter: false,
  notifications: 'none',
  language: 'en'
})

const message = ref({ text: '', type: '' })

const contextText = computed(() => {
  const required = ['firstName', 'lastName', 'email']
  const filled = Object.entries(formData.value)
    .filter(([k, v]) => v && v !== 'none')
    .map(([k]) => k)
  const missing = required.filter(field => !formData.value[field])
  
  let status = 'Empty'
  if (filled.length > 0 && missing.length > 0) status = 'Partially filled'
  else if (missing.length === 0) status = 'Ready to submit'
  else if (filled.length > 0) status = 'In progress'
  
  return `Form status: ${status}
Required fields: ${required.join(', ')}
Filled fields: ${filled.length ? filled.join(', ') : 'none'}
Validation errors: ${missing.length ? `Missing: ${missing.join(', ')}` : 'none'}

Available notification options: none, email, sms
Available languages: en (English), es (Spanish), fr (French), de (German)`
})

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = { text: '', type: '' }
  }, 3000)
}

const handlers = {
  fill_personal_info: (data) => {
    if (data.firstName) formData.value.firstName = data.firstName
    if (data.lastName) formData.value.lastName = data.lastName
    if (data.email) formData.value.email = data.email
    if (data.phone) formData.value.phone = data.phone
  },
  
  fill_address: (data) => {
    if (data.street) formData.value.street = data.street
    if (data.city) formData.value.city = data.city
    if (data.state) formData.value.state = data.state
    if (data.zipCode) formData.value.zipCode = data.zipCode
  },
  
  select_preferences: (data) => {
    if (data.newsletter !== undefined) {
      formData.value.newsletter = data.newsletter
    }
    if (data.notifications) {
      formData.value.notifications = data.notifications
    }
    if (data.language) {
      formData.value.language = data.language
    }
  },
  
  submit_form: () => {
    // Check required fields
    if (!formData.value.firstName || !formData.value.lastName || !formData.value.email) {
      showMessage('Please fill all required fields', 'error')
      return
    }
    
    // Validate email
    if (!formData.value.email.includes('@')) {
      showMessage('Please enter a valid email', 'error')
      return
    }
    
    showMessage('Form submitted successfully!', 'success')
  },
  
  clear_form: () => {
    formData.value = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      newsletter: false,
      notifications: 'none',
      language: 'en'
    }
    showMessage('Form cleared', 'info')
  }
}

const handleToolCall = (e) => {
  const toolName = e.target.getAttribute('name')
  if (handlers[toolName]) {
    handlers[toolName](e.detail)
  }
}

onMounted(() => {
  const tools = document.querySelectorAll('.demo-container tool[name]')
  tools.forEach(tool => {
    tool.addEventListener('call', handleToolCall)
  })
})

onUnmounted(() => {
  const tools = document.querySelectorAll('.demo-container tool[name]')
  tools.forEach(tool => {
    tool.removeEventListener('call', handleToolCall)
  })
})
</script>

<style scoped>
.demo-container {
  border: 2px solid var(--vp-c-brand);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
  background: var(--vp-c-bg-soft);
}

form {
  max-width: 500px;
  margin: 1rem 0;
}

fieldset {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
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
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 1rem;
  background: var(--vp-c-bg);
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