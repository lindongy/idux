/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/idux/blob/main/LICENSE
 */

import type { SpinProps } from '@idux/components/spin'

import { computed, defineComponent, provide } from 'vue'

import { isBoolean } from 'lodash-es'

import { ɵHeader } from '@idux/components/_private/header'
import { useGlobalConfig } from '@idux/components/config'
import { getLocale } from '@idux/components/i18n'
import { IxSpin } from '@idux/components/spin'

import { useColumns } from './composables/useColumns'
import { useDataSource } from './composables/useDataSource'
import { useExpandable } from './composables/useExpandable'
import { useFilterables } from './composables/useFilterable'
import { useGetRowKey } from './composables/useGetRowKey'
import { usePagination } from './composables/usePagination'
import { useScroll } from './composables/useScroll'
import { useSelectable } from './composables/useSelectable'
import { useSortable } from './composables/useSortable'
import { useSticky } from './composables/useSticky'
import { useTableLayout } from './composables/useTableLayout'
import { useTags } from './composables/useTags'
import MainTable from './main/MainTable'
import { renderFooter } from './other/Footer'
import { renderPagination } from './other/Pagination'
import { TABLE_TOKEN } from './token'
import { tableProps } from './types'

export default defineComponent({
  name: 'IxTable',
  props: tableProps,
  setup(props, { expose, slots }) {
    const config = useGlobalConfig('table')
    const common = useGlobalConfig('common')
    const mergedPrefixCls = computed(() => `${common.prefixCls}-table`)

    const locale = getLocale('table')
    const tags = useTags(props)
    const getRowKey = useGetRowKey(props, config)
    const stickyContext = useSticky(props)
    const scrollContext = useScroll(props, stickyContext)
    const columnsContext = useColumns(props, config, scrollContext.scrollBarSizeOnFixedHolder)
    const sortableContext = useSortable(columnsContext.flattedColumns)
    const filterableContext = useFilterables(columnsContext.flattedColumns)
    const expandableContext = useExpandable(props, columnsContext.flattedColumns)
    const tableLayout = useTableLayout(props, columnsContext, scrollContext, stickyContext.isSticky)
    const { mergedPagination } = usePagination(props, config)

    const dataContext = useDataSource(
      props,
      getRowKey,
      sortableContext.activeSortable,
      filterableContext.activeFilterables,
      expandableContext.expandedRowKeys,
      mergedPagination,
    )
    const selectableContext = useSelectable(props, locale, columnsContext.flattedColumns, dataContext)

    const context = {
      props,
      mergedPrefixCls,
      slots,
      config,
      locale,
      ...tags,
      getRowKey,
      ...columnsContext,
      ...scrollContext,
      ...sortableContext,
      ...filterableContext,
      ...stickyContext,
      tableLayout,
      mergedPagination,
      ...expandableContext,
      ...dataContext,
      ...selectableContext,
    }

    provide(TABLE_TOKEN, context)
    expose({ scrollTo: scrollContext.scrollTo })

    return () => {
      const header = <ɵHeader v-slots={slots} header={props.header} />
      const footer = renderFooter(slots, mergedPrefixCls.value)
      const [paginationTop, paginationBottom] = renderPagination(
        mergedPagination.value,
        dataContext.filteredData.value,
        mergedPrefixCls.value,
      )
      const children = [header, paginationTop, <MainTable />, paginationBottom, footer]
      const spinProps = covertSpinProps(props.spin)
      const spinWrapper = spinProps ? <IxSpin {...spinProps}>{children}</IxSpin> : children
      return <div class={mergedPrefixCls.value}>{spinWrapper}</div>
    }
  },
})

function covertSpinProps(spin: boolean | SpinProps | undefined) {
  return isBoolean(spin) ? { spinning: spin } : spin
}
