import { getNestedObject } from '@ir-engine/hyperflux'
import * as jsonTransform from 'json-transforms'

/**
 * uses json-transforms to transform data with provided mapping
 * @param jsonRules
 * @param inputData
 */
export const transformData = (jsonRules: any, inputData: any) => {
  const rootProperties = {} as any

  for (const [propertyName, ruleDefinitions] of Object.entries(jsonRules)) {
    const isArrayOfRules = Array.isArray(ruleDefinitions)
    if (isArrayOfRules && ruleDefinitions.length === 1) {
      const ruleDefinition = ruleDefinitions[0]
      const rules = Object.entries(ruleDefinition) as [string, string][]
      // for now, assume that the first path of the first rule is the root
      const ruleRoot = rules[0][1].split('.')[0]
      const rulePaths = rules
        .filter(([outputPath, inputPath]) => !!outputPath && !!inputPath)
        .map(([outputPath, inputPath]) => [outputPath, inputPath.split('.').slice(1).join('.')])
      // // create a runner for the array
      const pathRule = jsonTransform.pathRule(`.${ruleRoot}`, (d) => {
        return d.runner()
      })
      // create the object rule
      const objectRule = jsonTransform.pathRule('.', (d) =>
        Object.fromEntries(
          rulePaths.map(([outputPath, inputPath]) => [outputPath, getNestedObject(d.context, inputPath).result])
        )
      )
      rootProperties[propertyName] = [pathRule, objectRule]
    } else {
      // todo: handle object rules
    }
  }

  const transformedData = Object.fromEntries(
    Object.entries(rootProperties)
      .map(([prompt, rule]) => [prompt, jsonTransform.transform(inputData, rule)])
      .filter(([prompt, result]) => !!result)
  )

  return transformedData
}
