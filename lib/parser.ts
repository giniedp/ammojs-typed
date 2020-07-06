import * as webidl2 from 'webidl2'
import * as fs from 'fs'

export function parseIDL(path: string) {
  let idlString = fs.readFileSync(path).toString()

  // need fix for error:
  //
  //      WebIDLParseError: Syntax error at line 49, since `interface btVector4`:
  //      btVector4 implements btVector3;
  //      ^ Unrecognised tokens
  //
  // current solution:
  // find everything that match
  //
  //      LEFT implements RIGHT;
  //
  // and comment them out
  // then replace all occurence
  //
  //      interface LEFT {
  //
  // with
  //
  //      interface LEFT: RIGHT {
  //
  const inheritance = []
  idlString = idlString.replace(/([a-zA-Z0-9]+) implements ([a-zA-Z0-9]+);/gi, (line, left, right) => {
    inheritance.push({ left, right })
    return `// ${line}`
  })
  inheritance.forEach(({ left, right }) => {
    idlString = idlString.replace(new RegExp(`interface ${left} \{`), `interface ${left}: ${right} {`)
  })

  // need fix for error:
  //
  //      WebIDLParseError: Syntax error at line 102, since `interface btTransform`:
  //        void setFromOpenGLMatrix(float[] m)
  //                                 ^ Unterminated operation
  //
  // current solution: use sequence<float> type
  //
  // sequence types are meant to be passed by value. Thus they are forbidden on
  // attributes
  // https://www.w3.org/TR/WebIDL-1/#idl-sequence
  idlString = idlString
    .replace(/attribute float\[\].*;/gi, line => {
      console.warn('ignored line:', line)
      return `// ${line}`
    })
    .replace(/attribute Node\[\].*;/gi, line => {
      console.warn('ignored line:', line)
      return `// ${line}`
    })
    .replace(/float\[\]/gi, 'sequence<float>')
    .replace(/long\[\]/gi, 'sequence<long>')

    return webidl2.parse(idlString)
}
