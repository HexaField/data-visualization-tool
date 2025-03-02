export const callEndpoint = async (url: string) => {
  const response = await fetch(url, {
    mode: 'no-cors',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
  const data = await response.json()
  return data
}