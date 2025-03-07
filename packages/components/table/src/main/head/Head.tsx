/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/idux/blob/main/LICENSE
 */

import { defineComponent, inject } from 'vue'

import HeadRow from './HeadRow'
import { TABLE_TOKEN } from '../../token'

export default defineComponent({
  setup() {
    const { props: tableProps, mergedRows, mergedPrefixCls } = inject(TABLE_TOKEN)!

    return () => {
      const rows = mergedRows.value
      const customAdditionalFn = tableProps.customAdditional?.head
      const customAdditional = customAdditionalFn ? customAdditionalFn({ rows }) : undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Tag = (tableProps.customTag?.head ?? 'thead') as any
      return (
        <Tag class={`${mergedPrefixCls.value}-thead`} {...customAdditional}>
          {rows.map((columns, rowIndex) => (
            <HeadRow key={rowIndex} columns={columns} />
          ))}
        </Tag>
      )
    }
  },
})
