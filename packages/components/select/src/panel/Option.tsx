/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/idux/blob/main/LICENSE
 */

import { computed, defineComponent, inject } from 'vue'

import { isNil, toString } from 'lodash-es'

import { callEmit, useKey } from '@idux/cdk/utils'
import { IxCheckbox } from '@idux/components/checkbox'

import { selectPanelContext } from '../token'
import { optionProps } from '../types'
import { renderOptionLabel } from '../utils/renderOptionLabel'

export default defineComponent({
  props: optionProps,
  setup(props, { slots }) {
    const key = useKey()
    const {
      props: selectPanelProps,
      mergedPrefixCls,
      selectedKeys,
      selectedLimit,
      selectedLimitTitle,
      activeValue,
      setActiveIndex,
    } = inject(selectPanelContext)!

    const isActive = computed(() => activeValue.value === key)

    const isSelected = computed(() => selectedKeys.value.some(selectedKey => selectedKey === key))

    const isDisabled = computed(() => props.disabled || (!isSelected.value && selectedLimit.value))

    const classes = computed(() => {
      const { parentKey } = props
      const prefixCls = `${mergedPrefixCls.value}-option`
      return {
        [prefixCls]: true,
        [`${prefixCls}-active`]: isActive.value,
        [`${prefixCls}-disabled`]: isDisabled.value,
        [`${prefixCls}-grouped`]: !isNil(parentKey),
        [`${prefixCls}-selected`]: isSelected.value,
      }
    })

    const handleMouseEnter = () => setActiveIndex(props.index!)

    const handleClick = (evt: MouseEvent) => {
      callEmit(selectPanelProps.onOptionClick, props.rawData!, evt)
    }

    return () => {
      const { label, rawData } = props
      const { multiple } = selectPanelProps
      const selected = isSelected.value
      const disabled = isDisabled.value
      const prefixCls = `${mergedPrefixCls.value}-option`
      const _label = toString(label)

      // 优先显示 selectedLimitTitle
      const title = (disabled && selectedLimitTitle.value) || _label
      const customAdditional = selectPanelProps.customAdditional
        ? selectPanelProps.customAdditional({ data: rawData!, index: props.index! })
        : undefined

      return (
        <div
          class={classes.value}
          title={title}
          onMouseenter={disabled ? undefined : handleMouseEnter}
          onClick={disabled ? undefined : handleClick}
          aria-label={_label}
          aria-selected={selected}
          {...customAdditional}
        >
          {multiple && <IxCheckbox checked={selected} disabled={disabled} />}
          <span class={`${prefixCls}-label`}>{renderOptionLabel(slots, rawData!, _label)}</span>
        </div>
      )
    }
  },
})
