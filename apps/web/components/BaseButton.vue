<template>
  <button
    class="px-4 py-2 font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : '',
      variant === 'secondary' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : '',
      variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : '',
    ]"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <span
      v-if="loading"
      class="mr-2 inline-block animate-spin"
    >⚪</span>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary', 'outline'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>
