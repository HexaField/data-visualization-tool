import { getMutableState, NO_PROXY, useHookstate } from '@ir-engine/hyperflux'
import { Button } from '@ir-engine/ui'
import React, { useEffect } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { d3State } from './ForceGraph'
import { generateJsonSchema } from './schema'
import SchemaDisplay, { JSONSchema } from './SchemaDisplay'
import { transformData } from './transformData'

export const MappingUI = (props: { data: any }) => {
  const transformedDataState = useHookstate<any | null>(null)

  const onMappingChanged = (mapping: any) => {
    if (!parsedData.value?.data) return

    const { data } = parsedData.get(NO_PROXY)!

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

  useEffect(() => {
    const schema = generateJsonSchema(props.data)
    parsedData.set({ schema, data: props.data })
  }, [props.data])

  const parsedData = useHookstate<{ schema: JSONSchema; data: unknown } | null>(null)

  const hidden = useHookstate(false)

  return (
    <div className="flex h-full w-fit bg-white flex-row">
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
      <div className="pointer-events-auto z-[10] h-full overflow-auto overflow-y-auto max-w-[600px]" style={{ width: hidden.value ? '0%' : '' }}>
        <div className="pointer-events-auto relative z-[10] mx-auto">
          {parsedData.value && (
            <SchemaDisplay
              jsonSchema={parsedData.get(NO_PROXY)!.schema}
              targetSchemas={targetSchemas}
              data={parsedData.get(NO_PROXY)!.data}
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
