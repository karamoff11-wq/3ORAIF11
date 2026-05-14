// This Web Worker runs strictly in a background thread.
// It guarantees the 1-second countdown tick never drifts, even if the main
// React thread is heavily blocked by Lottie animations or DOM updates.

let intervalId: ReturnType<typeof setInterval> | null = null

self.onmessage = (e: MessageEvent) => {
  const { command } = e.data

  if (command === 'START') {
    if (intervalId) clearInterval(intervalId)
    // Send immediate first tick
    self.postMessage({ type: 'TICK' })
    intervalId = setInterval(() => {
      self.postMessage({ type: 'TICK' })
    }, 1000)
  } 
  else if (command === 'STOP') {
    if (intervalId) clearInterval(intervalId)
    intervalId = null
  }
}
