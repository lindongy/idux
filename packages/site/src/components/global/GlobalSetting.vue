<template>
  <ul class="floatSetting">
    <li>
      <GlobalTheme></GlobalTheme>
    </li>
    <li>
      <IxBackTop></IxBackTop>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useLoadingBar } from '@idux/components/loading-bar'
const { start, finish } = useLoadingBar()
const router = useRouter()
router.beforeEach((_to, _from, next) => {
  start()
  next()
})
router.afterEach(() => {
  finish()
})
</script>

<style lang="less">
.floatSetting {
  position: fixed;
  right: 0;
  bottom: 82px;
  z-index: 99;
  cursor: pointer;
  // TODO need less var
  color: #000;
  background-color: #fff;
  padding: 6px;
  border-radius: 5px 0 0 5px;

  display: flex;
  flex-direction: column;
}
</style>
