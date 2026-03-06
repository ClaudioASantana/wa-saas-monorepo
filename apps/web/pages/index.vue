<template>
  <div style="font-family: sans-serif; padding: 2rem;">
    <h1>WhatsApp CRM SaaS</h1>
    <p>Status: <strong style="color: green;">OK</strong></p>
    <p>API URL: {{ $config.public.apiUrl }}</p>
  </div>
</template>

<script setup lang="ts">
const { $config } = useNuxtApp()
</script>
