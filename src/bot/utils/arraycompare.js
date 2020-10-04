// https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
// why effort

module.exports = function arraysEqual (a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false
  }
  return true
}
