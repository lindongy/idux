/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/idux/blob/main/LICENSE
 */

import { computed, defineComponent, normalizeClass, provide, ref } from 'vue'

import { useGlobalConfig } from '@idux/components/config'

import TransferOperations from './TransferOperations'
import { usePagination } from './composables/usePagination'
import { useSearchPlaceholder } from './composables/useSearchPlaceholder'
import { useSearchable } from './composables/useSearchable'
import { useTransferBindings } from './composables/useTransferBindings'
import { useTransferData } from './composables/useTransferData'
import { useTransferDataStrategies } from './composables/useTransferDataStrategies'
import { useTransferOperations } from './composables/useTransferOperations'
import { useTransferSelectState } from './composables/useTransferSelectState'
import TransferList from './content/Content'
import { TRANSFER_OPERATIONS_TOKEN, TRANSFER_SOURCE_TOKEN, TRANSFER_TARGET_TOKEN, transferContext } from './token'
import { type TransferApis, type TransferListInstance, transferProps } from './types'

export default defineComponent({
  name: 'IxTransfer',
  props: transferProps,
  setup(props, { slots, expose }) {
    const common = useGlobalConfig('common')
    const config = useGlobalConfig('transfer')
    const locale = useGlobalConfig('locale').transfer
    const mergedPrefixCls = computed(() => `${common.prefixCls}-transfer`)

    const showSelectAll = computed(() => props.showSelectAll ?? config.showSelectAll)
    const { source: sourceSearchable, target: targetSearchable } = useSearchable(props, config)
    const { source: sourcePlaceholder, target: targetPlaceholder } = useSearchPlaceholder(props, locale)
    const transferDataStrategies = useTransferDataStrategies(props)
    const transferPaginationContext = usePagination(props)
    const transferDataContext = useTransferData(props, config, transferDataStrategies, transferPaginationContext)
    const transferSelectStateContext = useTransferSelectState(props, transferDataContext, transferDataStrategies)
    const transferOperationsContext = useTransferOperations(props, transferDataContext, transferSelectStateContext)

    const { sourceBindings, targetBindings } = useTransferBindings(
      props,
      transferDataContext,
      transferOperationsContext,
      transferSelectStateContext,
      transferPaginationContext,
      showSelectAll,
      sourceSearchable,
      sourcePlaceholder,
      targetSearchable,
      targetPlaceholder,
    )

    const sourceTransferListRef = ref<TransferListInstance>()
    const targetTransferListRef = ref<TransferListInstance>()

    const transferApi: TransferApis = {
      scrollTo: (isSource, ...params) =>
        (isSource ? sourceTransferListRef : targetTransferListRef).value?.scrollTo(...params),
    }

    expose(transferApi)

    provide(transferContext, {
      props,
      slots,
      locale,
      config,
      mergedPrefixCls,
      sourceTransferListRef,
      targetTransferListRef,
      showSelectAll,
      getKey: transferDataContext.getKey,
    })
    provide(TRANSFER_SOURCE_TOKEN, sourceBindings)
    provide(TRANSFER_TARGET_TOKEN, targetBindings)
    provide(TRANSFER_OPERATIONS_TOKEN, transferOperationsContext)

    const classes = computed(() => {
      const prefixCls = mergedPrefixCls.value
      return normalizeClass({
        [prefixCls]: true,
        [`${prefixCls}-fit-content`]: !!props.scroll?.height,
      })
    })

    return () => (
      <div class={classes.value}>
        <TransferList isSource={true} />
        <TransferOperations />
        <TransferList isSource={false} />
      </div>
    )
  },
})
