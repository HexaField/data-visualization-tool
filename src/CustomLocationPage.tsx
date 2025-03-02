import '@ir-engine/client/src/engine'

import { getMutableState, useHookstate, useMutableState, useReactiveRef } from '@ir-engine/hyperflux'
import { useSpatialEngine } from '@ir-engine/spatial/src/initializeEngine'
import { useEngineCanvas } from '@ir-engine/spatial/src/renderer/functions/useEngineCanvas'

import React, { useEffect } from 'react'
import { callEndpoint } from './callEndpoint'

import Debug from '@ir-engine/client-core/src/components/Debug'
import { createEntity, setComponent } from '@ir-engine/ecs'
import { AmbientLightComponent, ReferenceSpaceState, TransformComponent } from '@ir-engine/spatial'
import { CameraOrbitComponent } from '@ir-engine/spatial/src/camera/components/CameraOrbitComponent'
import { NameComponent } from '@ir-engine/spatial/src/common/NameComponent'
import { setVisibleComponent } from '@ir-engine/spatial/src/renderer/components/VisibleComponent'
import { RendererState } from '@ir-engine/spatial/src/renderer/RendererState'
import { Vector3 } from 'three'
import { MappingUI } from './MappingUI'
import mockData1 from './mockData1.json'
import { JSONSchema } from './schema'

export default function Template() {
  const [ref, setRef] = useReactiveRef()

  useSpatialEngine()
  useEngineCanvas(ref)

  const rawData = useHookstate<{ schema: JSONSchema; data: unknown } | null>(null)

  useEffect(() => {
    const endpoint = URL.createObjectURL(new Blob([JSON.stringify(mockData1)]))

    callEndpoint(endpoint).then((data) => {
      rawData.set(data)
    })
  }, [])

  const { originEntity, viewerEntity } = useMutableState(ReferenceSpaceState).value

  useEffect(() => {
    if (!originEntity || !viewerEntity) return

    /** Set Up Scene */
    document.body.style.backgroundColor = 'black'
    setComponent(viewerEntity, TransformComponent, {
      position: new Vector3(10, 10, 20)
    })
    setComponent(viewerEntity, CameraOrbitComponent, { isOrbiting: true })
    getMutableState(RendererState).useShadows.set(false)

    const ambientLightEntity = createEntity()
    setComponent(ambientLightEntity, NameComponent, 'Ambient Light')
    setComponent(ambientLightEntity, AmbientLightComponent)
    setVisibleComponent(ambientLightEntity, true)
  }, [originEntity, viewerEntity])

  return (
    <>
      <div ref={setRef} style={{ width: '100%', height: '100%', position: 'absolute' }} />
      <MappingUI data={rawData.get()} />
      <Debug />
    </>
  )
}
