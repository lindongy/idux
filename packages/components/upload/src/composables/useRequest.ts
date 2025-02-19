/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/idux/blob/main/LICENSE
 */

import type { FilesDataContext } from '../composables/useFilesData'
import type {
  UploadFile,
  UploadFileStatus,
  UploadProgressEvent,
  UploadProps,
  UploadRequestError,
  UploadRequestOption,
} from '../types'
import type { VKey } from '@idux/cdk/utils'
import type { Ref } from 'vue'

import { ref } from 'vue'

import { isFunction, isUndefined } from 'lodash-es'

import { callEmit } from '@idux/cdk/utils'
import { useGlobalConfig } from '@idux/components/config'

import { getTargetFile, getTargetFileIndex } from '../utils/files'
import defaultUpload from '../utils/request'

export interface UploadRequest {
  fileUploading: Ref<UploadFile[]>
  abort: (file: UploadFile) => void
  startUpload: (file: UploadFile) => void
  upload: (file: UploadFile) => void
}

export function useRequest(props: UploadProps, filesDataContext: FilesDataContext): UploadRequest {
  const fileUploading: Ref<UploadFile[]> = ref([])
  const aborts = new Map<VKey, () => void>([])
  const config = useGlobalConfig('upload')

  const { fileList, updateFiles } = filesDataContext

  const updateFileStatus = (file: UploadFile, status: UploadFileStatus) => {
    updateFiles([{ ...file, status }])
  }

  function abort(file: UploadFile): void {
    const curFile = getTargetFile(file, fileList.value)
    if (!curFile) {
      return
    }
    const curAbort = aborts.get(curFile.key)
    curAbort?.()
    updateFileStatus(curFile, 'abort')
    fileUploading.value.splice(getTargetFileIndex(curFile, fileUploading.value), 1)
    aborts.delete(curFile.key)
    props.onRequestChange &&
      callEmit(props.onRequestChange, {
        status: 'abort',
        file: { ...curFile },
      })
  }

  async function startUpload(file: UploadFile): Promise<void> {
    if (isUndefined(props.onBeforeUpload)) {
      await upload(file)
      return
    }
    const before = callEmit(props.onBeforeUpload, file)
    if (before instanceof Promise) {
      try {
        const result = await before
        if (result === true) {
          await upload(file)
          return
        }
        if (typeof result === 'object' && result) {
          await upload(result)
        }
      } catch (e) {
        updateFileStatus(file, 'error')
      }
    } else if (before === true) {
      await upload(file)
    } else if (typeof before === 'object') {
      await upload(before)
    } else {
      updateFileStatus(file, 'cancel')
    }
  }

  async function upload(file: UploadFile) {
    if (!file.raw) {
      file.error = new Error('file error')
      updateFileStatus(file, 'error')
    }
    const action = await getAction(props, file)
    const requestData = await getRequestData(props, file)
    const requestOption = {
      file: file.raw,
      name: props.name ?? config.name,
      withCredentials: props.withCredentials ?? config.withCredentials,
      action: action,
      requestHeaders: props.requestHeaders ?? {},
      requestMethod: props.requestMethod ?? config.requestMethod,
      requestData: requestData,
      onProgress: (event: UploadProgressEvent) => _onProgress(event, file),
      onError: (error: UploadRequestError) => _onError(error, file),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess: (res: any) => _onSuccess(res, file),
    } as UploadRequestOption
    const uploadHttpRequest = props.customRequest ?? config.customRequest ?? defaultUpload

    props.onRequestChange &&
      callEmit(props.onRequestChange, {
        status: 'loadstart',
        file: { ...file },
      })
    updateFileStatus(file, 'uploading')
    file.percent = 0
    const requestHandler = await uploadHttpRequest(requestOption)
    aborts.set(file.key, requestHandler?.abort ?? (() => {}))
    fileUploading.value.push(file)
  }

  function _onProgress(event: UploadProgressEvent, file: UploadFile): void {
    const curFile = getTargetFile(file, fileList.value)
    if (!curFile) {
      return
    }
    curFile.percent = event.percent ?? 0
    props.onRequestChange &&
      callEmit(props.onRequestChange, {
        status: 'progress',
        file: { ...curFile },
        event,
      })
  }

  function _onError(error: UploadRequestError, file: UploadFile): void {
    const curFile = getTargetFile(file, fileList.value)
    if (!curFile) {
      return
    }
    fileUploading.value.splice(getTargetFileIndex(curFile, fileUploading.value), 1)
    curFile.error = error
    props.onRequestChange &&
      callEmit(props.onRequestChange, {
        file: { ...curFile },
        status: 'error',
        error,
      })
    updateFileStatus(curFile, 'error')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function _onSuccess(res: any, file: UploadFile): void {
    const curFile = getTargetFile(file, fileList.value)
    if (!curFile) {
      return
    }
    curFile.response = res
    props.onRequestChange &&
      callEmit(props.onRequestChange, {
        status: 'loadend',
        file: { ...curFile },
        response: res,
      })
    updateFileStatus(curFile, 'success')
    fileUploading.value.splice(getTargetFileIndex(curFile, fileUploading.value), 1)
  }

  return {
    fileUploading,
    abort,
    startUpload,
    upload,
  }
}

async function getAction(props: UploadProps, file: UploadFile) {
  return isFunction(props.action) ? await props.action(file) : props.action
}

async function getRequestData(props: UploadProps, file: UploadFile) {
  return isFunction(props.requestData) ? await props.requestData(file) : props.requestData ?? {}
}
