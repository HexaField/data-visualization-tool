import { defineState, getMutableState, NO_PROXY, syncStateWithLocalStorage, useHookstate } from '@ir-engine/hyperflux'
import { Button } from '@ir-engine/ui'
import React, { useEffect } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { d3State } from './ForceGraph'
import { generateJsonSchema } from './schema'
import SchemaDisplay, { JSONSchema } from './SchemaDisplay'
import { transformData } from './transformData'

export const RawDataRequestState = defineState({
  name: 'hexafield.conjure.RawDataRequestState',
  initial: {
    endpoints: [] as Array<Record<string, any>>
  },
  extension: syncStateWithLocalStorage(['endpoints'])
})

export const MappingUI = () => {
  const transformedDataState = useHookstate<any | null>(null)

  const urlState = useHookstate(getMutableState(RawDataRequestState).endpoints)

  useEffect(() => {
    if (!urlState.value.length) return
    fetch(urlState.value[0].keys[0]).then((response) => {
      response.json().then((data) => {
        rawData.set({ schema: generateJsonSchema(data), data })
      })
    })
  }, [urlState])

  const onMappingChanged = (mapping: any) => {
    if (!rawData.value?.data) return

    const { data } = rawData.get(NO_PROXY)!

    const transformedData = transformData(mapping, data)
    transformedDataState.set(transformedData)
  }

  const onConfirm = () => {
    // for now just hardcode the forcegraph
    for (const edge of transformedDataState.get(NO_PROXY).edges) {
      edge.weight = edge.weight || 1
    }
    getMutableState(d3State).dataset.set(transformedDataState.get(NO_PROXY))
    hidden.set(true)
  }

  const rawData = useHookstate<{ schema: JSONSchema; data: unknown } | null>(null)

  const hidden = useHookstate(false)

  return (
    <div className="flex h-full w-fit flex-row bg-white">
      <Button className="pointer-events-auto z-10 mb-1 px-0" variant="tertiary" onClick={onConfirm}>
        Confirm
      </Button>
      <Button
        className="z-10 mb-1 px-0"
        variant="tertiary"
        style={{ top: '10px', left: hidden.value ? '10px' : '310px', pointerEvents: 'all' }}
        onClick={() => hidden.set(!hidden.value)}
      >
        {hidden.value ? (
          <HiChevronRight className="text-theme-primary pointer-events-none place-self-center" />
        ) : (
          <HiChevronLeft className="text-theme-primary pointer-events-none place-self-center" />
        )}
      </Button>
      <div
        className="pointer-events-auto z-[10] h-full max-w-[600px] overflow-auto overflow-y-auto"
        style={{ width: hidden.value ? '0%' : '' }}
      >
        <div className="mb-4 flex flex-col">
          <label htmlFor="url-input" className="mb-2 font-medium">
            Data URL
          </label>
          <div className="flex">
            <input
              id="url-input"
              type="text"
              className="flex-1 rounded-l border border-gray-300 p-2"
              value={urlState.value[0]?.keys[0] || ''}
              onChange={(e) => {
                const newUrl = e.target.value
                urlState.set([{ keys: [newUrl] }])
              }}
            />
            <Button
              className="rounded-r"
              variant="primary"
              onClick={() => {
                const newUrl = urlState.value[0]?.keys[0]
                if (newUrl) {
                  fetch(newUrl).then((response) => {
                    response.json().then((data) => {
                      rawData.set({ schema: generateJsonSchema(data), data })
                    })
                  })
                }
              }}
            >
              Confirm
            </Button>
          </div>
          <div className="mt-2">
            <label htmlFor="url-history" className="mb-2 font-medium">
              History
            </label>
            <select
              id="url-history"
              className="w-full rounded border border-gray-300 p-2"
              onChange={(e) => {
                const selectedUrl = e.target.value
                urlState.set([{ keys: [selectedUrl] }])
              }}
            >
              {urlState.value.map((endpoint, index) => (
                <option key={index} value={endpoint.keys[0]}>
                  {endpoint.keys[0]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="pointer-events-auto relative z-[10] mx-auto">
          {rawData.value && (
            <SchemaDisplay
              jsonSchema={rawData.get(NO_PROXY)!.schema}
              targetSchemas={targetSchemas}
              data={rawData.get(NO_PROXY)!.data}
              onChange={onMappingChanged}
            />
          )}
        </div>
        {/* Debug Output */}
        <div className="mt-4 rounded bg-gray-100 p-2">
          <h4 className="font-medium">Current Output</h4>
          <pre className="text-sm">{JSON.stringify(transformedDataState.get(), null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

const forcegraphSchema = {
  type: 'object',
  properties: {
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' }
        }
      }
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          target: { type: 'string' },
          weight: { type: 'number' }
        }
      }
    }
  }
}

const targetSchemas = [
  {
    label: 'Force Graph',
    value: forcegraphSchema
  }
]
