/**
 * Silencia warnings de deprecação do Three.js 0.184 enquanto @react-three/drei
 * não atualiza para a nova API (THREE.Timer em vez de THREE.Clock).
 * Remover quando drei >= 10.x suportar nativamente THREE.Timer.
 */
const _warn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (
    msg.includes('THREE.Clock') ||
    msg.includes('PCFSoftShadowMap has been deprecated')
  ) return
  _warn(...args)
}
